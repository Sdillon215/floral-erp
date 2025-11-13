from typing import Optional

from pydantic import BaseModel, ConfigDict, EmailStr

from app.models.user import UserRole


class UserBase(BaseModel):
    email: EmailStr
    role: UserRole = UserRole.SALES


class UserCreate(UserBase):
    password: str


class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    password: Optional[str] = None
    role: Optional[UserRole] = None
    is_active: Optional[bool] = None
    is_admin: Optional[bool] = None


class UserOut(UserBase):
    id: int
    is_active: bool
    is_admin: bool

    model_config = ConfigDict(from_attributes=True)