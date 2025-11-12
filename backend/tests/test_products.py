from tests.utils import get_auth_headers


ADMIN_EMAIL = "admin@example.com"
ADMIN_PASSWORD = "adminpass"


def test_create_product(client):
    headers = get_auth_headers(client, ADMIN_EMAIL, ADMIN_PASSWORD)
    response = client.post(
        "/api/v1/products/",
        json={
            "sku": "ROSE-RED-001",
            "name": "Red Rose Stem",
            "description": "Single long-stem red rose",
            "unit_price": 2.50,
            "unit_of_measure": "stem",
        },
        headers=headers,
    )
    assert response.status_code == 201
    data = response.json()
    assert data["sku"] == "ROSE-RED-001"
    assert data["name"] == "Red Rose Stem"
    assert data["is_active"] is True


def test_list_products(client):
    headers = get_auth_headers(client, ADMIN_EMAIL, ADMIN_PASSWORD)
    client.post(
        "/api/v1/products/",
        json={"sku": "ROSE-RED-001", "name": "Red Rose Stem"},
        headers=headers,
    )
    client.post(
        "/api/v1/products/",
        json={"sku": "TULIP-YEL-001", "name": "Yellow Tulip Stem"},
        headers=headers,
    )

    response = client.get("/api/v1/products/", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) == 2


def test_get_product(client):
    headers = get_auth_headers(client, ADMIN_EMAIL, ADMIN_PASSWORD)
    create_response = client.post(
        "/api/v1/products/",
        json={"sku": "TULIP-YEL-001", "name": "Yellow Tulip Stem"},
        headers=headers,
    )
    product_id = create_response.json()["id"]

    response = client.get(f"/api/v1/products/{product_id}", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == product_id
    assert data["sku"] == "TULIP-YEL-001"


def test_update_product(client):
    headers = get_auth_headers(client, ADMIN_EMAIL, ADMIN_PASSWORD)
    create_response = client.post(
        "/api/v1/products/",
        json={"sku": "ROSE-RED-001", "name": "Red Rose Stem"},
        headers=headers,
    )
    product_id = create_response.json()["id"]

    response = client.put(
        f"/api/v1/products/{product_id}",
        json={"description": "Updated description", "unit_price": 3.25, "is_active": False},
        headers=headers,
    )
    assert response.status_code == 200
    data = response.json()
    assert data["description"] == "Updated description"
    assert data["unit_price"] == 3.25
    assert data["is_active"] is False


def test_delete_product(client):
    headers = get_auth_headers(client, ADMIN_EMAIL, ADMIN_PASSWORD)
    create_response = client.post(
        "/api/v1/products/",
        json={"sku": "ROSE-RED-001", "name": "Red Rose Stem"},
        headers=headers,
    )
    product_id = create_response.json()["id"]

    delete_response = client.delete(f"/api/v1/products/{product_id}", headers=headers)
    assert delete_response.status_code == 204

    get_response = client.get(f"/api/v1/products/{product_id}", headers=headers)
    assert get_response.status_code == 404

