from sqlmodel import SQLModel
from app.models import user, customer, product, supplier, purchase_order  # add future models here

def init_db(engine):
    SQLModel.metadata.create_all(engine)