# app/schemas/auth.py
from pydantic import BaseModel, EmailStr
from typing import Optional


class UserRegister(BaseModel):
    name: str
    phone: str
    email: Optional[EmailStr] = None
    password: str


class ShopRegister(BaseModel):
    owner_name: str
    shop_name: str
    phone: str
    email: EmailStr
    password: str
    latitude: float
    longitude: float
    address: Optional[str] = None
    license_number: Optional[str] = None


class LoginRequest(BaseModel):
    phone: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    id: str
    name: str
