import pytest
from sqlmodel import Session, SQLModel, create_engine
from sqlmodel.pool import StaticPool

from app.models.customer import Customer


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


def test_customer_persists(engine):
    with Session(engine) as session:
        customer = Customer(
            name="Acme Florist",
            email="sales@acmeflorist.com",
            phone="555-0100",
            billing_address="123 Bloom St.",
            shipping_address="123 Bloom St.",
            notes="Preferred partner",
        )
        session.add(customer)
        session.commit()
        session.refresh(customer)

        assert customer.id is not None
        assert customer.is_active is True
        assert customer.email == "sales@acmeflorist.com"

