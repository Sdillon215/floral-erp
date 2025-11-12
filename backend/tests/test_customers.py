from tests.utils import get_auth_headers


ADMIN_EMAIL = "admin@example.com"
ADMIN_PASSWORD = "adminpass"


def test_create_customer(client):
    headers = get_auth_headers(client, ADMIN_EMAIL, ADMIN_PASSWORD)
    response = client.post(
        "/api/v1/customers/",
        json={
            "name": "Acme Florist",
            "email": "sales@acmeflorist.com",
            "phone": "555-0100",
            "billing_address": "123 Bloom St.",
            "shipping_address": "123 Bloom St.",
            "notes": "Preferred partner",
        },
        headers=headers,
    )
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Acme Florist"
    assert data["email"] == "sales@acmeflorist.com"
    assert data["is_active"] is True


def test_list_customers(client):
    headers = get_auth_headers(client, ADMIN_EMAIL, ADMIN_PASSWORD)
    client.post(
        "/api/v1/customers/",
        json={"name": "Customer 1", "email": "c1@example.com"},
        headers=headers,
    )
    client.post(
        "/api/v1/customers/",
        json={"name": "Customer 2", "email": "c2@example.com"},
        headers=headers,
    )

    response = client.get("/api/v1/customers/", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) == 2


def test_get_customer(client):
    headers = get_auth_headers(client, ADMIN_EMAIL, ADMIN_PASSWORD)
    create_response = client.post(
        "/api/v1/customers/",
        json={"name": "Single Customer", "email": "single@example.com"},
        headers=headers,
    )
    customer_id = create_response.json()["id"]

    response = client.get(f"/api/v1/customers/{customer_id}", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == customer_id
    assert data["name"] == "Single Customer"


def test_update_customer(client):
    headers = get_auth_headers(client, ADMIN_EMAIL, ADMIN_PASSWORD)
    create_response = client.post(
        "/api/v1/customers/",
        json={"name": "Update Customer", "email": "update@example.com"},
        headers=headers,
    )
    customer_id = create_response.json()["id"]

    response = client.put(
        f"/api/v1/customers/{customer_id}",
        json={"notes": "Updated notes", "is_active": False},
        headers=headers,
    )
    assert response.status_code == 200
    data = response.json()
    assert data["notes"] == "Updated notes"
    assert data["is_active"] is False


def test_delete_customer(client):
    headers = get_auth_headers(client, ADMIN_EMAIL, ADMIN_PASSWORD)
    create_response = client.post(
        "/api/v1/customers/",
        json={"name": "Delete Customer", "email": "delete@example.com"},
        headers=headers,
    )
    customer_id = create_response.json()["id"]

    delete_response = client.delete(f"/api/v1/customers/{customer_id}", headers=headers)
    assert delete_response.status_code == 204

    get_response = client.get(f"/api/v1/customers/{customer_id}", headers=headers)
    assert get_response.status_code == 404

