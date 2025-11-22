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


def test_get_inventory_item(client):
    admin_headers = get_auth_headers(client, ADMIN_EMAIL, ADMIN_PASSWORD)
    create_user_with_role(client, admin_headers, "buyer-get@example.com", "buyer")
    buyer_headers = get_auth_headers(client, "buyer-get@example.com", "password123")
    product_id = create_product(client, admin_headers)

    # Adjust inventory to create an item
    client.post(
        "/api/v1/inventory/adjust",
        json={"product_id": product_id, "quantity_delta": 15, "reference": "test"},
        headers=admin_headers,
    )

    # Get single inventory item
    response = client.get(
        f"/api/v1/inventory/{product_id}",
        headers=buyer_headers,
    )
    assert response.status_code == 200
    data = response.json()
    assert data["product_id"] == product_id
    assert data["on_hand"] == 15
    assert data["allocated"] == 0
    assert data["available"] == 15


def test_get_inventory_item_not_found(client):
    admin_headers = get_auth_headers(client, ADMIN_EMAIL, ADMIN_PASSWORD)
    create_user_with_role(client, admin_headers, "buyer-get2@example.com", "buyer")
    buyer_headers = get_auth_headers(client, "buyer-get2@example.com", "password123")
    product_id = create_product(client, admin_headers)

    # Try to get inventory for product that has no inventory item
    response = client.get(
        f"/api/v1/inventory/{product_id}",
        headers=buyer_headers,
    )
    assert response.status_code == 404
    assert "not found" in response.json()["detail"].lower()


def test_get_inventory_transactions(client):
    admin_headers = get_auth_headers(client, ADMIN_EMAIL, ADMIN_PASSWORD)
    create_user_with_role(client, admin_headers, "buyer-tx@example.com", "buyer")
    buyer_headers = get_auth_headers(client, "buyer-tx@example.com", "password123")
    product_id = create_product(client, admin_headers)

    # Create some transactions
    client.post(
        "/api/v1/inventory/adjust",
        json={"product_id": product_id, "quantity_delta": 10, "reference": "adjust-1"},
        headers=admin_headers,
    )
    client.post(
        "/api/v1/inventory/adjust",
        json={"product_id": product_id, "quantity_delta": 5, "reference": "adjust-2"},
        headers=admin_headers,
    )

    # Get transaction history
    response = client.get(
        f"/api/v1/inventory/{product_id}/transactions",
        headers=buyer_headers,
    )
    assert response.status_code == 200
    transactions = response.json()
    assert len(transactions) == 2
    # Should be ordered by most recent first
    assert transactions[0]["reference"] == "adjust-2"
    assert transactions[1]["reference"] == "adjust-1"
    assert all(t["product_id"] == product_id for t in transactions)
    assert all(t["type"] == "manual_adjustment" for t in transactions)


def test_get_inventory_transactions_pagination(client):
    admin_headers = get_auth_headers(client, ADMIN_EMAIL, ADMIN_PASSWORD)
    create_user_with_role(client, admin_headers, "buyer-tx2@example.com", "buyer")
    buyer_headers = get_auth_headers(client, "buyer-tx2@example.com", "password123")
    product_id = create_product(client, admin_headers)

    # Create multiple transactions
    for i in range(5):
        client.post(
            "/api/v1/inventory/adjust",
            json={"product_id": product_id, "quantity_delta": 1, "reference": f"adjust-{i}"},
            headers=admin_headers,
        )

    # Get first page
    response = client.get(
        f"/api/v1/inventory/{product_id}/transactions?skip=0&limit=2",
        headers=buyer_headers,
    )
    assert response.status_code == 200
    transactions = response.json()
    assert len(transactions) == 2

    # Get second page
    response = client.get(
        f"/api/v1/inventory/{product_id}/transactions?skip=2&limit=2",
        headers=buyer_headers,
    )
    assert response.status_code == 200
    transactions = response.json()
    assert len(transactions) == 2


def test_get_inventory_transactions_product_not_found(client):
    admin_headers = get_auth_headers(client, ADMIN_EMAIL, ADMIN_PASSWORD)
    create_user_with_role(client, admin_headers, "buyer-tx3@example.com", "buyer")
    buyer_headers = get_auth_headers(client, "buyer-tx3@example.com", "password123")

    # Try to get transactions for non-existent product
    response = client.get(
        "/api/v1/inventory/99999/transactions",
        headers=buyer_headers,
    )
    assert response.status_code == 404
    assert "not found" in response.json()["detail"].lower()
