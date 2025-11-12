from tests.utils import get_auth_headers


ADMIN_EMAIL = "admin@example.com"
ADMIN_PASSWORD = "adminpass"


def test_create_user(client):
    headers = get_auth_headers(client, ADMIN_EMAIL, ADMIN_PASSWORD)
    response = client.post(
        "/api/v1/users/",
        json={"email": "test@example.com", "password": "password123"},
        headers=headers,
    )
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "test@example.com"
    assert data["is_active"] is True
    assert data["is_admin"] is False


def test_list_users(client):
    headers = get_auth_headers(client, ADMIN_EMAIL, ADMIN_PASSWORD)
    client.post(
        "/api/v1/users/",
        json={"email": "user1@example.com", "password": "password123"},
        headers=headers,
    )
    client.post(
        "/api/v1/users/",
        json={"email": "user2@example.com", "password": "password123"},
        headers=headers,
    )

    response = client.get("/api/v1/users/", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    emails = {user["email"] for user in data}
    assert "user1@example.com" in emails
    assert "user2@example.com" in emails


def test_get_user(client):
    headers = get_auth_headers(client, ADMIN_EMAIL, ADMIN_PASSWORD)
    create_response = client.post(
        "/api/v1/users/",
        json={"email": "single@example.com", "password": "password123"},
        headers=headers,
    )
    user_id = create_response.json()["id"]

    response = client.get(f"/api/v1/users/{user_id}", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == user_id
    assert data["email"] == "single@example.com"


def test_update_user(client):
    headers = get_auth_headers(client, ADMIN_EMAIL, ADMIN_PASSWORD)
    create_response = client.post(
        "/api/v1/users/",
        json={"email": "update@example.com", "password": "password123"},
        headers=headers,
    )
    user_id = create_response.json()["id"]

    response = client.put(
        f"/api/v1/users/{user_id}",
        json={"is_admin": True},
        headers=headers,
    )
    assert response.status_code == 200
    data = response.json()
    assert data["is_admin"] is True


def test_delete_user(client):
    headers = get_auth_headers(client, ADMIN_EMAIL, ADMIN_PASSWORD)
    create_response = client.post(
        "/api/v1/users/",
        json={"email": "delete@example.com", "password": "password123"},
        headers=headers,
    )
    user_id = create_response.json()["id"]

    delete_response = client.delete(f"/api/v1/users/{user_id}", headers=headers)
    assert delete_response.status_code == 204

    get_response = client.get(f"/api/v1/users/{user_id}", headers=headers)
    assert get_response.status_code == 404

