"""
Auth Endpoint Tests
===================
Tests for register, login, and rate limiting.
"""
import pytest


def test_health_check(client):
    """Backend should respond with status ok."""
    res = client.get("/")
    assert res.status_code == 200
    assert res.json()["status"] == "ok"


def test_register_success(client):
    """User can register with valid email/password."""
    res = client.post("/api/v1/auth/register", json={
        "email": "newuser@vrital.com",
        "password": "SecurePass123!",
        "full_name": "New User",
    })
    assert res.status_code == 201
    assert "access_token" in res.json()


def test_register_duplicate_email(client, test_user):
    """Registering with an existing email should return 400."""
    res = client.post("/api/v1/auth/register", json={
        "email": "test@vrital.com",
        "password": "AnotherPass123!",
        "full_name": "Duplicate",
    })
    assert res.status_code == 400


def test_login_success(client, test_user):
    """Valid credentials should return a JWT token."""
    res = client.post("/api/v1/auth/login", json={
        "email": "test@vrital.com",
        "password": "TestPassword123!",
    })
    assert res.status_code == 200
    data = res.json()
    assert "access_token" in data
    assert data["role"] == "customer"


def test_login_wrong_password(client, test_user):
    """Wrong password should return 401."""
    res = client.post("/api/v1/auth/login", json={
        "email": "test@vrital.com",
        "password": "WrongPassword!",
    })
    assert res.status_code == 401


def test_security_headers(client):
    """Response should include OWASP security headers."""
    res = client.get("/")
    assert "x-frame-options" in res.headers
    assert res.headers["x-frame-options"] == "DENY"
    assert "x-content-type-options" in res.headers
    assert "referrer-policy" in res.headers
