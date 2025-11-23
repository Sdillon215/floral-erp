"""Seed 20 flower products for the floral ERP system."""
from sqlmodel import Session

from app.db.session import engine
from app.models.product import Product

# Flower product data
FLOWER_PRODUCTS = [
    {"sku": "ROSE-RED-001", "name": "Red Rose", "description": "Classic red rose, long stem", "unit_price": 3.50, "unit_of_measure": "stem"},
    {"sku": "ROSE-PINK-001", "name": "Pink Rose", "description": "Soft pink rose, long stem", "unit_price": 3.50, "unit_of_measure": "stem"},
    {"sku": "ROSE-WHITE-001", "name": "White Rose", "description": "Pure white rose, long stem", "unit_price": 3.50, "unit_of_measure": "stem"},
    {"sku": "ROSE-YELLOW-001", "name": "Yellow Rose", "description": "Bright yellow rose, long stem", "unit_price": 3.50, "unit_of_measure": "stem"},
    {"sku": "LILY-WHITE-001", "name": "White Lily", "description": "Elegant white lily", "unit_price": 4.00, "unit_of_measure": "stem"},
    {"sku": "LILY-PINK-001", "name": "Pink Lily", "description": "Soft pink stargazer lily", "unit_price": 4.25, "unit_of_measure": "stem"},
    {"sku": "TULIP-RED-001", "name": "Red Tulip", "description": "Vibrant red tulip", "unit_price": 2.75, "unit_of_measure": "stem"},
    {"sku": "TULIP-YELLOW-001", "name": "Yellow Tulip", "description": "Sunny yellow tulip", "unit_price": 2.75, "unit_of_measure": "stem"},
    {"sku": "TULIP-PURPLE-001", "name": "Purple Tulip", "description": "Rich purple tulip", "unit_price": 2.75, "unit_of_measure": "stem"},
    {"sku": "CARNATION-RED-001", "name": "Red Carnation", "description": "Classic red carnation", "unit_price": 1.50, "unit_of_measure": "stem"},
    {"sku": "CARNATION-PINK-001", "name": "Pink Carnation", "description": "Soft pink carnation", "unit_price": 1.50, "unit_of_measure": "stem"},
    {"sku": "CARNATION-WHITE-001", "name": "White Carnation", "description": "Pure white carnation", "unit_price": 1.50, "unit_of_measure": "stem"},
    {"sku": "DAISY-WHITE-001", "name": "White Daisy", "description": "Classic white daisy", "unit_price": 1.25, "unit_of_measure": "stem"},
    {"sku": "SUNFLOWER-001", "name": "Sunflower", "description": "Large bright sunflower", "unit_price": 3.00, "unit_of_measure": "stem"},
    {"sku": "BABY-BREATH-001", "name": "Baby's Breath", "description": "Delicate white baby's breath", "unit_price": 0.75, "unit_of_measure": "bunch"},
    {"sku": "EUCALYPTUS-001", "name": "Eucalyptus", "description": "Fresh eucalyptus greenery", "unit_price": 2.00, "unit_of_measure": "stem"},
    {"sku": "FERN-001", "name": "Fern", "description": "Lush green fern", "unit_price": 1.75, "unit_of_measure": "stem"},
    {"sku": "ORCHID-PURPLE-001", "name": "Purple Orchid", "description": "Exotic purple orchid", "unit_price": 8.50, "unit_of_measure": "stem"},
    {"sku": "PEONY-PINK-001", "name": "Pink Peony", "description": "Luxurious pink peony", "unit_price": 6.00, "unit_of_measure": "stem"},
    {"sku": "HYDRANGEA-BLUE-001", "name": "Blue Hydrangea", "description": "Full blue hydrangea bloom", "unit_price": 5.50, "unit_of_measure": "stem"},
]


def seed_products() -> None:
    """Seed 20 flower products."""
    print("Seeding 20 flower products...")
    
    with Session(engine) as session:
        created_count = 0
        skipped_count = 0
        
        for product_data in FLOWER_PRODUCTS:
            # Check if product with this SKU already exists
            from sqlmodel import select
            existing = session.exec(
                select(Product).where(Product.sku == product_data["sku"])
            ).first()
            
            if existing:
                skipped_count += 1
                continue
            
            product = Product(**product_data, is_active=True)
            session.add(product)
            created_count += 1
        
        session.commit()
        
        print(f"✓ Created {created_count} new products")
        if skipped_count > 0:
            print(f"  Skipped {skipped_count} products (already exist)")


if __name__ == "__main__":
    seed_products()

