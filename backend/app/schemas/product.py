from typing import Optional

from pydantic import BaseModel, ConfigDict


class ProductBase(BaseModel):
    sku: str
    name: str
    description: Optional[str] = None
    unit_price: float = 0.0
    unit_of_measure: str = "each"


class ProductCreate(ProductBase):
    pass


class ProductUpdate(BaseModel):
    sku: Optional[str] = None
    name: Optional[str] = None
    description: Optional[str] = None
    unit_price: Optional[float] = None
    unit_of_measure: Optional[str] = None
    is_active: Optional[bool] = None


class ProductOut(ProductBase):
    id: int
    is_active: bool = True

    model_config = ConfigDict(from_attributes=True)

