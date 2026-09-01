"""
Test Configuration — pytest fixtures for Vrital backend tests
=============================================================
Uses SQLite in-memory for fast isolated tests.
"""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.main import app
from app.core.database import Base, get_db
from app.core.security import hash_password

# In-memory SQLite for tests — fast, isolated, no external deps
SQLALCHEMY_TEST_URL = "sqlite:///./test.db"

engine = create_engine(
    SQLALCHEMY_TEST_URL, connect_args={"check_same_thread": False}
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    """Create all tables once per test session."""
    # Import all models so SQLAlchemy knows about them
    from app.modules.users.models import User
    from app.modules.products.models import Brand, Category, Product
    from app.modules.orders.models import Order, OrderItem
    from app.modules.wishlist.models import WishlistItem
    from app.modules.reviews.models import Review
    from app.modules.tryon.models import TryOnSession, UserImage
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def db():
    """Provide a test DB session."""
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.rollback()
        session.close()


@pytest.fixture
def client(db):
    """FastAPI test client with overridden DB dependency."""
    def override_get_db():
        try:
            yield db
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()



@pytest.fixture
def test_user(db):
    """Create or return existing test customer user."""
    from app.modules.users.models import User
    existing = db.query(User).filter(User.email == "test@vrital.com").first()
    if existing:
        return existing
    user = User(
        email="test@vrital.com",
        password_hash=hash_password("TestPassword123!"),
        full_name="Test User",
        role="customer",
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user



@pytest.fixture
def auth_headers(client, test_user):
    """Get auth headers for a test user."""
    res = client.post("/api/v1/auth/login", json={
        "email": "test@vrital.com",
        "password": "TestPassword123!",
    })
    token = res.json().get("access_token", "")
    return {"Authorization": f"Bearer {token}"}
