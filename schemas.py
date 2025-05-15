from pydantic import BaseModel, validator
from typing import Optional, List
from datetime import datetime

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
    delivery_method: str

class RepairOut(BaseModel):
    id: int
    user_id: int
    submission_date: datetime
    repair_description: str
    quantity: int
    priority: str
    delivery_method: str
    user_name: str
    user_surname: str

    class Config:
        orm_mode = True
        arbitrary_types_allowed = True

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