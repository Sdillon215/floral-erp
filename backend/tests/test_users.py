def test_create_user(client):
    response = client.post(
        "/api/v1/users/",
        json={"email": "test@example.com", "password": "password123"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "test@example.com"
    assert data["is_active"] is True
    assert data["is_admin"] is False


def test_list_users(client):
    client.post(
        "/api/v1/users/",
        json={"email": "user1@example.com", "password": "password123"},
    )
    client.post(
        "/api/v1/users/",
        json={"email": "user2@example.com", "password": "password123"},
    )

    response = client.get("/api/v1/users/")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) == 2


def test_get_user(client):
    create_response = client.post(
        "/api/v1/users/",
        json={"email": "single@example.com", "password": "password123"},
    )
    user_id = create_response.json()["id"]

    response = client.get(f"/api/v1/users/{user_id}")
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == user_id
    assert data["email"] == "single@example.com"


def test_update_user(client):
    create_response = client.post(
        "/api/v1/users/",
        json={"email": "update@example.com", "password": "password123"},
    )
    user_id = create_response.json()["id"]

    response = client.put(
        f"/api/v1/users/{user_id}",
        json={"is_admin": True},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["is_admin"] is True


def test_delete_user(client):
    create_response = client.post(
        "/api/v1/users/",
        json={"email": "delete@example.com", "password": "password123"},
    )
    user_id = create_response.json()["id"]

    delete_response = client.delete(f"/api/v1/users/{user_id}")
    assert delete_response.status_code == 204

    get_response = client.get(f"/api/v1/users/{user_id}")
    assert get_response.status_code == 404

