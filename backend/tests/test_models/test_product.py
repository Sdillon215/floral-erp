import pytest
from sqlmodel import Session, SQLModel, create_engine
from sqlmodel.pool import StaticPool

from app.models.product import Product


@pytest.fixture
def engine():
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    SQLModel.metadata.create_all(engine)
    yield engine
    SQLModel.metadata.drop_all(engine)


def test_product_persists(engine):
    with Session(engine) as session:
        product = Product(
            sku="ROSE-RED-001",
            name="Red Rose Stem",
            description="Single long-stem red rose",
            unit_price=2.50,
            unit_of_measure="stem",
        )
        session.add(product)
        session.commit()
        session.refresh(product)

        assert product.id is not None
        assert product.sku == "ROSE-RED-001"
        assert product.unit_price == 2.50
        assert product.is_active is True

