from pydantic import BaseModel, validator
from typing import Optional, List
from datetime import datetime
from models import DeliveryMethod  # Add this import

class UserCreate(BaseModel):
    name: str
    surname: str
    email: Optional[str] = None
    password: str
    role: str

    @validator("role")
    def validate_role(cls, v):
        if v not in ["business", "user", "admin"]:
            raise ValueError("Role must be 'business', 'user', or 'admin'")
        return v

class UserUpdate(BaseModel):
    name: Optional[str] = None
    surname: Optional[str] = None
    email: Optional[str] = None
    password: Optional[str] = None
    role: Optional[str] = None

    @validator("role", always=True)
    def validate_role(cls, v):
        if v and v not in ["business", "user", "admin"]:
            raise ValueError("Role must be 'business', 'user', or 'admin'")
        return v

class RepairCreate(BaseModel):
    repair_description: str
    quantity: int
    delivery_method: DeliveryMethod  # Use enum instead of str

class RepairUpdate(BaseModel):
    completed: Optional[bool] = None

class RepairOut(BaseModel):
    id: int
    user_id: int
    submission_date: datetime
    repair_description: str
    quantity: int
    priority: str
    delivery_method: str
    user_name: Optional[str]
    user_surname: Optional[str]
    completed: bool

    class Config:
        orm_mode = True

class UserOut(BaseModel):
    id: int
    name: str
    surname: str
    email: Optional[str]
    role: str
    repairs: Optional[List[RepairOut]] = None

    class Config:
        orm_mode = True

class Token(BaseModel):
    access_token: str
    token_type: str