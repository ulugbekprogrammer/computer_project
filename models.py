from sqlalchemy import create_engine, Column, Integer, String, ForeignKey, DateTime, Enum
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime
import enum

Base = declarative_base()

class Priority(enum.Enum):
    LOW = "Low"
    MEDIUM = "Medium"
    HIGH = "High"

class DeliveryMethod(enum.Enum):
    USER_DELIVERS = "user_delivers"
    SERVICE_PICKUP = "service_pickup"

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True, nullable=False)
    surname = Column(String, nullable=False)
    email = Column(String, index=True, nullable=True)
    hashed_password = Column(String, nullable=False)
    role = Column(String, nullable=False)
    repairs = relationship("Repair", back_populates="user")

class Repair(Base):
    __tablename__ = "repairs"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    submission_date = Column(DateTime, nullable=False, default=datetime.utcnow)
    repair_description = Column(String, nullable=False)
    quantity = Column(Integer, nullable=False)
    priority = Column(Enum(Priority), nullable=False)
    delivery_method = Column(Enum(DeliveryMethod), nullable=False)
    user_name = Column(String, nullable=True)
    user_surname = Column(String, nullable=True)
    user = relationship("User", back_populates="repairs")