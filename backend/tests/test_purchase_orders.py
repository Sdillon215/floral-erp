from tests.utils import get_auth_headers

ADMIN_EMAIL = "admin@example.com"
ADMIN_PASSWORD = "adminpass"


def create_supplier(client, headers):
    response = client.post(
        "/api/v1/suppliers/",
        json={"name": "Test Supplier"},
        headers=headers,
    )
    assert response.status_code == 201
    return response.json()["id"]


def create_product(client, headers):
    response = client.post(
        "/api/v1/products/",
        json={"sku": "PO-PROD-1", "name": "PO Product"},
        headers=headers,
    )
    assert response.status_code == 201
    return response.json()["id"]


def create_user_with_role(client, admin_headers, email, role):
    response = client.post(
        "/api/v1/users/",
        json={"email": email, "password": "password123", "role": role},
        headers=admin_headers,
    )
    assert response.status_code == 200
    return response.json()


def test_create_purchase_order_requires_buyer_role(client):
    admin_headers = get_auth_headers(client, ADMIN_EMAIL, ADMIN_PASSWORD)
    supplier_id = create_supplier(client, admin_headers)
    product_id = create_product(client, admin_headers)
    create_user_with_role(client, admin_headers, "buyer@example.com", "buyer")
    buyer_headers = get_auth_headers(client, "buyer@example.com", "password123")

    response = client.post(
        "/api/v1/purchase-orders/",
        json={
            "supplier_id": supplier_id,
            "lines": [
                {"product_id": product_id, "quantity": 10, "unit_cost": 2.5},
            ],
        },
        headers=buyer_headers,
    )
    assert response.status_code == 201
    data = response.json()
    assert data["supplier_id"] == supplier_id
    assert len(data["lines"]) == 1
    assert data["lines"][0]["product_id"] == product_id


def test_purchase_order_forbidden_for_non_buyer(client):
    admin_headers = get_auth_headers(client, ADMIN_EMAIL, ADMIN_PASSWORD)
    supplier_id = create_supplier(client, admin_headers)
    product_id = create_product(client, admin_headers)
    create_user_with_role(client, admin_headers, "sales@example.com", "sales")
    sales_headers = get_auth_headers(client, "sales@example.com", "password123")

    response = client.post(
        "/api/v1/purchase-orders/",
        json={
            "supplier_id": supplier_id,
            "lines": [
                {"product_id": product_id, "quantity": 5},
            ],
        },
        headers=sales_headers,
    )
    assert response.status_code == 403


def test_update_purchase_order_status(client):
    admin_headers = get_auth_headers(client, ADMIN_EMAIL, ADMIN_PASSWORD)
    supplier_id = create_supplier(client, admin_headers)
    product_id = create_product(client, admin_headers)
    create_user_with_role(client, admin_headers, "buyer@example.com", "buyer")
    buyer_headers = get_auth_headers(client, "buyer@example.com", "password123")

    create_response = client.post(
        "/api/v1/purchase-orders/",
        json={
            "supplier_id": supplier_id,
            "lines": [
                {"product_id": product_id, "quantity": 8},
            ],
        },
        headers=buyer_headers,
    )
    purchase_order_id = create_response.json()["id"]

    update_response = client.put(
        f"/api/v1/purchase-orders/{purchase_order_id}",
        json={"status": "received"},
        headers=buyer_headers,
    )
    assert update_response.status_code == 200
    assert update_response.json()["status"] == "received"
