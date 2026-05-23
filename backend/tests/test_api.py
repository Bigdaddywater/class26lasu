import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
import os

from app.main import app
from app.database.session import Base, get_db
from app.models.models import User

# Setup in-memory sqlite database
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

client = TestClient(app)

@pytest.fixture(autouse=True)
def setup_database():
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    user = User(
        full_name="Test User",
        username="testuser",
        email="test@example.com",
        password_hash="hashed",
    )
    db.add(user)
    db.commit()
    yield
    db.close()
    Base.metadata.drop_all(bind=engine)

def test_read_main():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {
        "status": "online",
        "message": "Welcome to the LASU 2026 Digital Archive API",
        "engine": "Echelontix Premium"
    }

def test_read_memories():
    response = client.get("/api/v1/memories/")
    assert response.status_code == 200
    assert response.json() == []

def test_upload_memory():
    test_image_path = "test_image.jpg"
    with open(test_image_path, "wb") as f:
        f.write(b"fake image content")
        
    with open(test_image_path, "rb") as f:
        # FastAPI might expect query parameters if not using Form()
        response = client.post(
            "/api/v1/memories/upload",
            params={"title": "Test Memory", "caption": "A test caption", "faculty": "Science"},
            files={"file": ("test_image.jpg", f, "image/jpeg")}
        )
    
    os.remove(test_image_path)
    
    assert response.status_code == 200
    data = response.json()
    assert data["title"] == "Test Memory"
    assert data["description"] == "A test caption"
    assert data["faculty"] == "Science"
    assert data["media_type"] == "image"
    assert data["approved"] is False
    assert data["media_url"].startswith("https://cdn.lasu2026.com")
