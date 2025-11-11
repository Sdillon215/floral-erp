import pytest
from sqlmodel import Session, SQLModel, create_engine
from sqlmodel.pool import StaticPool

from app.models.supplier import Supplier


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


def test_supplier_persists(engine):
    with Session(engine) as session:
        supplier = Supplier(
            name="Global Blooms Co.",
            contact_name="Sally Smith",
            email="sales@globalblooms.com",
            phone="555-0123",
            website="https://globalblooms.com",
            notes="Ships internationally",
        )
        session.add(supplier)
        session.commit()
        session.refresh(supplier)

        assert supplier.id is not None
        assert supplier.is_active is True
        assert supplier.name == "Global Blooms Co."
        assert supplier.contact_name == "Sally Smith"

