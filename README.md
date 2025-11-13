# Floral ERP

## Backend Setup

Create and activate a virtual environment, then install dependencies:

```
cd backend
python -m venv venv
# Git Bash / WSL
source venv/Scripts/activate
# PowerShell
venv\Scripts\Activate.ps1

pip install -r requirements.txt
```

Run the API locally:

```
uvicorn app.main:app --reload --port 8000
```

### Database Migrations

Alembic manages schema changes. Typical commands:

```
# Create a new migration after model changes
alembic revision --autogenerate -m "describe change"

# Apply all pending migrations
alembic upgrade head

# Roll back the last migration
alembic downgrade -1
```

Use environment variables to target specific databases, e.g.:

```
DATABASE_URL=sqlite:///./local.db alembic upgrade head
```

### Configuration

Environment variables (loaded via `app.core.config.Settings`):

- `DATABASE_URL` (required) – SQLAlchemy connection string.
- `SECRET_KEY` (optional) – JWT signing key, defaults to `dev_secret_key_change_me`.
- `ACCESS_TOKEN_EXPIRE_MINUTES` (optional) – token lifetime, defaults to 1440.
- `SQLALCHEMY_ECHO` (optional) – set to `false` to silence SQL logging (default `true`).

### Roles & Authorization

Users authenticate via JWT and receive one of the following roles (admins bypass role checks):

- `sales` – manage customers and products.
- `picker_packer` – picking/packing fulfillment role (logic to be added as modules grow).
- `buyer` – manage suppliers and purchasing.

Admins (`is_admin = true`) can access every endpoint regardless of assigned role. Non-admins must match the role required by each router.

### Purchase Orders

Buyers can create and manage purchase orders at `/api/v1/purchase-orders`. Example:

```
curl -X POST http://localhost:8000/api/v1/purchase-orders/ \
  -H "Authorization: Bearer <buyer_token>" \
  -H "Content-Type: application/json" \
  -d '{
        "supplier_id": 1,
        "lines": [{"product_id": 1, "quantity": 24, "unit_cost": 1.85}]
      }'
```

To seed a sample supplier/product/purchase order for local testing:

```
python -m app.db.seed
```

### Authentication

Seed an admin user (e.g. via tests or a migration) and obtain a JWT:

```
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=admin@example.com&password=adminpass"
```

Use the returned token for subsequent requests:

```
curl http://localhost:8000/api/v1/customers/ \
  -H "Authorization: Bearer <token>"
```
