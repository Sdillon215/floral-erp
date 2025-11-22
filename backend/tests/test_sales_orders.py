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


def create_customer(client, headers):
    response = client.post(
        "/api/v1/customers/",
        json={"name": "Sales Customer", "email": "sales-customer@example.com"},
        headers=headers,
    )
    assert response.status_code == 201
    return response.json()["id"]


def create_product(client, headers):
    response = client.post(
        "/api/v1/products/",
        json={"sku": "SO-PROD-1", "name": "Sales Product"},
        headers=headers,
    )
    assert response.status_code == 201
    return response.json()["id"]


def seed_inventory(client, admin_headers, product_id, quantity):
    response = client.post(
        "/api/v1/inventory/adjust",
        json={"product_id": product_id, "quantity_delta": quantity, "reference": "seed"},
        headers=admin_headers,
    )
    assert response.status_code == 200


def test_sales_order_allocation_and_shipment(client):
    admin_headers = get_auth_headers(client, ADMIN_EMAIL, ADMIN_PASSWORD)
    create_user_with_role(client, admin_headers, "sales@example.com", "sales")
    create_user_with_role(client, admin_headers, "picker@example.com", "picker_packer")

    sales_headers = get_auth_headers(client, "sales@example.com", "password123")
    picker_headers = get_auth_headers(client, "picker@example.com", "password123")

    customer_id = create_customer(client, admin_headers)
    product_id = create_product(client, admin_headers)
    seed_inventory(client, admin_headers, product_id, 20)

    create_response = client.post(
        "/api/v1/sales-orders/",
        json={
            "customer_id": customer_id,
            "lines": [
                {"product_id": product_id, "quantity": 5, "unit_price": 4.50},
            ],
        },
        headers=sales_headers,
    )
    assert create_response.status_code == 201
    order_id = create_response.json()["id"]

    allocate_response = client.post(
        f"/api/v1/sales-orders/{order_id}/allocate",
        headers=sales_headers,
    )
    assert allocate_response.status_code == 200
    assert allocate_response.json()["status"] == "allocated"

    ship_response = client.post(
        f"/api/v1/sales-orders/{order_id}/ship",
        headers=picker_headers,
    )
    assert ship_response.status_code == 200
    data = ship_response.json()
    assert data["status"] == "shipped"
    assert data["shipped_date"] is not None

    inventory_response = client.get("/api/v1/inventory/", headers=sales_headers)
    inventory_data = inventory_response.json()
    matching = [item for item in inventory_data if item["product_id"] == product_id]
    assert matching[0]["on_hand"] == 15
    assert matching[0]["allocated"] == 0


def test_allocate_requires_sales_role(client):
    admin_headers = get_auth_headers(client, ADMIN_EMAIL, ADMIN_PASSWORD)
    create_user_with_role(client, admin_headers, "sales-role@example.com", "sales")
    create_user_with_role(client, admin_headers, "picker-role@example.com", "picker_packer")

    sales_headers = get_auth_headers(client, "sales-role@example.com", "password123")
    picker_headers = get_auth_headers(client, "picker-role@example.com", "password123")

    customer_id = create_customer(client, admin_headers)
    product_id = create_product(client, admin_headers)
    seed_inventory(client, admin_headers, product_id, 5)

    create_response = client.post(
        "/api/v1/sales-orders/",
        json={
            "customer_id": customer_id,
            "lines": [
                {"product_id": product_id, "quantity": 3, "unit_price": 5.0},
            ],
        },
        headers=sales_headers,
    )
    order_id = create_response.json()["id"]

    response = client.post(
        f"/api/v1/sales-orders/{order_id}/allocate",
        headers=picker_headers,
    )
    assert response.status_code == 403


def test_allocate_fails_when_insufficient_inventory(client):
    admin_headers = get_auth_headers(client, ADMIN_EMAIL, ADMIN_PASSWORD)
    create_user_with_role(client, admin_headers, "sales-insufficient@example.com", "sales")
    sales_headers = get_auth_headers(client, "sales-insufficient@example.com", "password123")

    customer_id = create_customer(client, admin_headers)
    product_id = create_product(client, admin_headers)
    seed_inventory(client, admin_headers, product_id, 2)

    create_response = client.post(
        "/api/v1/sales-orders/",
        json={
            "customer_id": customer_id,
            "lines": [
                {"product_id": product_id, "quantity": 5, "unit_price": 3.0},
            ],
        },
        headers=sales_headers,
    )
    order_id = create_response.json()["id"]

    allocate_response = client.post(
        f"/api/v1/sales-orders/{order_id}/allocate",
        headers=sales_headers,
    )
    assert allocate_response.status_code == 400
    assert "Insufficient inventory" in allocate_response.json()["detail"]


def test_update_sales_order(client):
    admin_headers = get_auth_headers(client, ADMIN_EMAIL, ADMIN_PASSWORD)
    create_user_with_role(client, admin_headers, "sales-update@example.com", "sales")
    sales_headers = get_auth_headers(client, "sales-update@example.com", "password123")

    customer_id = create_customer(client, admin_headers)
    product_id = create_product(client, admin_headers)

    create_response = client.post(
        "/api/v1/sales-orders/",
        json={
            "customer_id": customer_id,
            "lines": [
                {"product_id": product_id, "quantity": 5, "unit_price": 4.50},
            ],
        },
        headers=sales_headers,
    )
    assert create_response.status_code == 201
    order_id = create_response.json()["id"]

    # Update a created order
    update_response = client.put(
        f"/api/v1/sales-orders/{order_id}",
        json={"shipped_date": None},
        headers=sales_headers,
    )
    assert update_response.status_code == 200

    # Try to update status directly (should fail)
    status_update_response = client.put(
        f"/api/v1/sales-orders/{order_id}",
        json={"status": "allocated"},
        headers=sales_headers,
    )
    assert status_update_response.status_code == 400
    assert "Cannot update status directly" in status_update_response.json()["detail"]


def test_update_sales_order_fails_for_allocated_order(client):
    admin_headers = get_auth_headers(client, ADMIN_EMAIL, ADMIN_PASSWORD)
    create_user_with_role(client, admin_headers, "sales-update2@example.com", "sales")
    sales_headers = get_auth_headers(client, "sales-update2@example.com", "password123")

    customer_id = create_customer(client, admin_headers)
    product_id = create_product(client, admin_headers)
    seed_inventory(client, admin_headers, product_id, 10)

    create_response = client.post(
        "/api/v1/sales-orders/",
        json={
            "customer_id": customer_id,
            "lines": [
                {"product_id": product_id, "quantity": 5, "unit_price": 4.50},
            ],
        },
        headers=sales_headers,
    )
    order_id = create_response.json()["id"]

    # Allocate the order
    client.post(f"/api/v1/sales-orders/{order_id}/allocate", headers=sales_headers)

    # Try to update allocated order (should fail)
    update_response = client.put(
        f"/api/v1/sales-orders/{order_id}",
        json={"shipped_date": None},
        headers=sales_headers,
    )
    assert update_response.status_code == 400
    assert "Only 'created' orders can be updated" in update_response.json()["detail"]


def test_delete_sales_order(client):
    admin_headers = get_auth_headers(client, ADMIN_EMAIL, ADMIN_PASSWORD)
    create_user_with_role(client, admin_headers, "sales-delete@example.com", "sales")
    sales_headers = get_auth_headers(client, "sales-delete@example.com", "password123")

    customer_id = create_customer(client, admin_headers)
    product_id = create_product(client, admin_headers)

    create_response = client.post(
        "/api/v1/sales-orders/",
        json={
            "customer_id": customer_id,
            "lines": [
                {"product_id": product_id, "quantity": 5, "unit_price": 4.50},
            ],
        },
        headers=sales_headers,
    )
    assert create_response.status_code == 201
    order_id = create_response.json()["id"]

    # Delete a created order
    delete_response = client.delete(
        f"/api/v1/sales-orders/{order_id}",
        headers=sales_headers,
    )
    assert delete_response.status_code == 204

    # Verify it's deleted
    get_response = client.get(
        f"/api/v1/sales-orders/{order_id}",
        headers=sales_headers,
    )
    assert get_response.status_code == 404


def test_delete_sales_order_fails_for_allocated_order(client):
    admin_headers = get_auth_headers(client, ADMIN_EMAIL, ADMIN_PASSWORD)
    create_user_with_role(client, admin_headers, "sales-delete2@example.com", "sales")
    sales_headers = get_auth_headers(client, "sales-delete2@example.com", "password123")

    customer_id = create_customer(client, admin_headers)
    product_id = create_product(client, admin_headers)
    seed_inventory(client, admin_headers, product_id, 10)

    create_response = client.post(
        "/api/v1/sales-orders/",
        json={
            "customer_id": customer_id,
            "lines": [
                {"product_id": product_id, "quantity": 5, "unit_price": 4.50},
            ],
        },
        headers=sales_headers,
    )
    order_id = create_response.json()["id"]

    # Allocate the order
    client.post(f"/api/v1/sales-orders/{order_id}/allocate", headers=sales_headers)

    # Try to delete allocated order (should fail)
    delete_response = client.delete(
        f"/api/v1/sales-orders/{order_id}",
        headers=sales_headers,
    )
    assert delete_response.status_code == 400
    assert "Only 'created' orders can be deleted" in delete_response.json()["detail"]
