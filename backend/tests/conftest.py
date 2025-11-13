import pytest
from fastapi.testclient import TestClient
from sqlmodel import SQLModel, Session, create_engine
from sqlmodel.pool import StaticPool

from app.core.security import hash_password
from app.db.session import get_session
from app.main import app
from app.models.user import User, UserRole


engine = create_engine(
    "sqlite://",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)


def override_get_session():
    with Session(engine) as session:
        yield session


app.dependency_overrides[get_session] = override_get_session


@pytest.fixture(scope="session")
def client():
    return TestClient(app)


@pytest.fixture(autouse=True)
def prepare_database():
    SQLModel.metadata.drop_all(engine)
    SQLModel.metadata.create_all(engine)

    with Session(engine) as session:
        admin = User(
            email="admin@example.com",
            hashed_password=hash_password("adminpass"),
            role=UserRole.SALES,
            is_active=True,
            is_admin=True,
        )
        session.add(admin)
        session.commit()

    yield

