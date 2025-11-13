from enum import Enum
from typing import Optional

from sqlalchemy import Column, String
from sqlmodel import Field, SQLModel


class UserRole(str, Enum):
    SALES = "sales"
    PICKER_PACKER = "picker_packer"
    BUYER = "buyer"


class User(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    email: str
    hashed_password: str
    role: UserRole = Field(
        default=UserRole.SALES,
        sa_column=Column(String(length=50), nullable=False, default=UserRole.SALES.value),
    )
    is_active: bool = True
    is_admin: bool = False