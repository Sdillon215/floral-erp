def test_create_supplier(client):
    response = client.post(
        "/api/v1/suppliers/",
        json={
            "name": "Global Blooms Co.",
            "contact_name": "Sally Smith",
            "email": "sales@globalblooms.com",
            "phone": "555-0123",
            "website": "https://globalblooms.com",
            "notes": "Ships internationally",
        },
    )
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Global Blooms Co."
    assert data["contact_name"] == "Sally Smith"
    assert data["is_active"] is True


def test_list_suppliers(client):
    client.post(
        "/api/v1/suppliers/",
        json={"name": "Supplier 1"},
    )
    client.post(
        "/api/v1/suppliers/",
        json={"name": "Supplier 2"},
    )

    response = client.get("/api/v1/suppliers/")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) == 2


def test_get_supplier(client):
    create_response = client.post(
        "/api/v1/suppliers/",
        json={"name": "Single Supplier"},
    )
    supplier_id = create_response.json()["id"]

    response = client.get(f"/api/v1/suppliers/{supplier_id}")
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == supplier_id
    assert data["name"] == "Single Supplier"


def test_update_supplier(client):
    create_response = client.post(
        "/api/v1/suppliers/",
        json={"name": "Update Supplier"},
    )
    supplier_id = create_response.json()["id"]

    response = client.put(
        f"/api/v1/suppliers/{supplier_id}",
        json={"notes": "Updated notes", "is_active": False},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["notes"] == "Updated notes"
    assert data["is_active"] is False


def test_delete_supplier(client):
    create_response = client.post(
        "/api/v1/suppliers/",
        json={"name": "Delete Supplier"},
    )
    supplier_id = create_response.json()["id"]

    delete_response = client.delete(f"/api/v1/suppliers/{supplier_id}")
    assert delete_response.status_code == 204

    get_response = client.get(f"/api/v1/suppliers/{supplier_id}")
    assert get_response.status_code == 404

