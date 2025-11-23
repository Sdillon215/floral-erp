# Historical Data Seeding

This script generates one year (52 weeks) of historical data with balanced inventory.

## What It Creates

- **52 Purchase Orders** (one per week)
  - Each PO contains 2-3 products
  - Quantities: 50-200 units per product
  - Automatically marked as "received" (creates inventory)

- **104-208 Sales Orders** (2-4 per week)
  - Distributes across multiple customers
  - Consumes all inventory from that week's PO
  - Automatically allocated and shipped
  - Inventory is balanced (all PO inventory is sold)

- **Inventory Transactions**
  - Purchase receipts
  - Sales allocations
  - Sales shipments
  - All properly dated and referenced

## Prerequisites

Before running the script, ensure you have:
- At least one active **Product** in the database
- Database connection configured
- All migrations applied

The script will automatically create:
- Suppliers (if none exist)
- Customers (if none exist)
- A sales user (if none exists)

## Usage

### Basic Usage (52 weeks)

```bash
cd backend
python -m app.db.seed_historical_data
```

### Custom Number of Weeks

```bash
# Create 26 weeks (6 months)
python -m app.db.seed_historical_data 26

# Create 12 weeks (3 months)
python -m app.db.seed_historical_data 12
```

## Data Characteristics

- **Dates**: Spread across the past year, starting from 52 weeks ago
- **Balance**: All purchase order inventory is consumed by sales orders
- **Realistic**: Random but realistic quantities, prices, and timing
- **Complete**: All orders are fully processed (POs received, SOs shipped)

## Notes

- The script will prompt if purchase orders already exist
- Processing takes a few minutes for 52 weeks
- Progress is shown every 10 weeks
- All inventory should balance to zero (all PO inventory is sold)

## Verification

After seeding, you can verify:
- Inventory items should have `on_hand = 0` and `allocated = 0` (all sold)
- Transaction history shows complete flow
- Purchase orders and sales orders are properly dated
- All references link correctly (PO:123, SO:456)

