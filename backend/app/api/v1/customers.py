from typing import List

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlmodel import Session, select

from app.core.dependencies import require_roles
from app.db.session import get_session
from app.models.customer import Customer
from app.models.user import UserRole
from app.schemas.customer import CustomerCreate, CustomerOut, CustomerUpdate


router = APIRouter(dependencies=[Depends(require_roles(UserRole.SALES))])


@router.post("/", response_model=CustomerOut, status_code=status.HTTP_201_CREATED)
def create_customer(customer_in: CustomerCreate, db: Session = Depends(get_session)):
    existing_customer = db.exec(select(Customer).where(Customer.email == customer_in.email)).first()
    if existing_customer:
        raise HTTPException(status_code=400, detail="Email already registered")
    customer = Customer(**customer_in.model_dump())
    db.add(customer)
    db.commit()
    db.refresh(customer)
    return customer


@router.get("/", response_model=List[CustomerOut])
def list_customers(skip: int = 0, limit: int = 100, db: Session = Depends(get_session)):
    customers = db.exec(select(Customer).offset(skip).limit(limit)).all()
    return customers


@router.get("/{customer_id}", response_model=CustomerOut)
def get_customer(customer_id: int, db: Session = Depends(get_session)):
    customer = db.get(Customer, customer_id)
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    return customer


@router.put("/{customer_id}", response_model=CustomerOut)
def update_customer(customer_id: int, customer_update: CustomerUpdate, db: Session = Depends(get_session)):
    customer = db.get(Customer, customer_id)
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")

    customer_data = customer_update.model_dump(exclude_unset=True)
    for field, value in customer_data.items():
        setattr(customer, field, value)

    db.add(customer)
    db.commit()
    db.refresh(customer)
    return customer


@router.delete("/{customer_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_customer(customer_id: int, db: Session = Depends(get_session)):
    customer = db.get(Customer, customer_id)
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    db.delete(customer)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)

