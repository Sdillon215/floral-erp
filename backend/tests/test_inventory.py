from datetime import datetime, timezone

from tests.utils import get_auth_headers

ADMIN_EMAIL = "admin@example.com"
ADMIN_PASSWORD = "adminpass"


def create_user_with_role(client, admin_headers, email, role):
    response = client.post(
        "/api/v1/users/",
        json={"email": email, "password": "password123", "role": role},
        headers=admin_headers,
    )
    assert response.status_code == 200
    return response.json()


def create_supplier(client, headers):
    response = client.post(
        "/api/v1/suppliers/",
        json={"name": "Inventory Supplier"},
        headers=headers,
    )
    assert response.status_code == 201
    return response.json()["id"]


def create_product(client, headers):
    response = client.post(
        "/api/v1/products/",
        json={"sku": "INV-PROD-1", "name": "Inventory Product"},
        headers=headers,
    )
    assert response.status_code == 201
    return response.json()["id"]


def create_purchase_order(client, headers, supplier_id, product_id, status="created"):
    response = client.post(
        "/api/v1/purchase-orders/",
        json={
            "supplier_id": supplier_id,
            "status": status,
            "order_date": datetime.now(timezone.utc).isoformat(),
            "lines": [
                {"product_id": product_id, "quantity": 10, "unit_cost": 2.5},
            ],
        },
        headers=headers,
    )
    assert response.status_code in (200, 201)
    return response.json()


def test_inventory_increases_on_purchase_receipt(client):
    admin_headers = get_auth_headers(client, ADMIN_EMAIL, ADMIN_PASSWORD)
    create_user_with_role(client, admin_headers, "buyer-inv@example.com", "buyer")
    buyer_headers = get_auth_headers(client, "buyer-inv@example.com", "password123")

    supplier_id = create_supplier(client, admin_headers)
    product_id = create_product(client, admin_headers)

    po = create_purchase_order(client, buyer_headers, supplier_id, product_id)

    update_response = client.put(
        f"/api/v1/purchase-orders/{po['id']}",
        json={"status": "received"},
        headers=buyer_headers,
    )
    assert update_response.status_code == 200

    inventory_response = client.get("/api/v1/inventory/", headers=buyer_headers)
    assert inventory_response.status_code == 200
    items = inventory_response.json()
    matching = [item for item in items if item["product_id"] == product_id]
    assert matching
    assert matching[0]["on_hand"] == 10
    assert matching[0]["available"] == 10


def test_receiving_twice_does_not_double_inventory(client):
    admin_headers = get_auth_headers(client, ADMIN_EMAIL, ADMIN_PASSWORD)
    create_user_with_role(client, admin_headers, "buyer2@example.com", "buyer")
    buyer_headers = get_auth_headers(client, "buyer2@example.com", "password123")

    supplier_id = create_supplier(client, admin_headers)
    product_id = create_product(client, admin_headers)

    po = create_purchase_order(client, buyer_headers, supplier_id, product_id)

    client.put(
        f"/api/v1/purchase-orders/{po['id']}",
        json={"status": "received"},
        headers=buyer_headers,
    )
    client.put(
        f"/api/v1/purchase-orders/{po['id']}",
        json={"status": "received"},
        headers=buyer_headers,
    )

    inventory_response = client.get("/api/v1/inventory/", headers=buyer_headers)
    matching = [item for item in inventory_response.json() if item["product_id"] == product_id]
    assert matching[0]["on_hand"] == 10


def test_manual_adjustment_requires_admin(client):
    admin_headers = get_auth_headers(client, ADMIN_EMAIL, ADMIN_PASSWORD)
    create_user_with_role(client, admin_headers, "buyer3@example.com", "buyer")
    buyer_headers = get_auth_headers(client, "buyer3@example.com", "password123")
    product_id = create_product(client, admin_headers)

    adjust_response = client.post(
        "/api/v1/inventory/adjust",
        json={"product_id": product_id, "quantity_delta": 5},
        headers=buyer_headers,
    )
    assert adjust_response.status_code == 401 or adjust_response.status_code == 403

    admin_adjust = client.post(
        "/api/v1/inventory/adjust",
        json={"product_id": product_id, "quantity_delta": 5},
        headers=admin_headers,
    )
    assert admin_adjust.status_code == 200
    data = admin_adjust.json()
    assert data["item"]["on_hand"] == 5
