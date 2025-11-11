from typing import List

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlmodel import Session, select

from app.db.session import get_session
from app.models.product import Product
from app.schemas.product import ProductCreate, ProductOut, ProductUpdate


router = APIRouter()


@router.post("/", response_model=ProductOut, status_code=status.HTTP_201_CREATED)
def create_product(product_in: ProductCreate, db: Session = Depends(get_session)):
    existing_product = db.exec(select(Product).where(Product.sku == product_in.sku)).first()
    if existing_product:
        raise HTTPException(status_code=400, detail="SKU already registered")
    product = Product(**product_in.model_dump())
    db.add(product)
    db.commit()
    db.refresh(product)
    return product


@router.get("/", response_model=List[ProductOut])
def list_products(skip: int = 0, limit: int = 100, db: Session = Depends(get_session)):
    products = db.exec(select(Product).offset(skip).limit(limit)).all()
    return products


@router.get("/{product_id}", response_model=ProductOut)
def get_product(product_id: int, db: Session = Depends(get_session)):
    product = db.get(Product, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product


@router.put("/{product_id}", response_model=ProductOut)
def update_product(product_id: int, product_update: ProductUpdate, db: Session = Depends(get_session)):
    product = db.get(Product, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    update_data = product_update.model_dump(exclude_unset=True)

    if "sku" in update_data:
        existing_product = db.exec(
            select(Product).where(Product.sku == update_data["sku"], Product.id != product_id)
        ).first()
        if existing_product:
            raise HTTPException(status_code=400, detail="SKU already registered")

    for field, value in update_data.items():
        setattr(product, field, value)

    db.add(product)
    db.commit()
    db.refresh(product)
    return product


@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_product(product_id: int, db: Session = Depends(get_session)):
    product = db.get(Product, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    db.delete(product)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)

