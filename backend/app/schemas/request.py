from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class CreateMedicineRequest(BaseModel):
    medicine_names: List[str]
    latitude: float
    longitude: float
    radius_km: float = 5.0
    prescription_id: Optional[str] = None

class UpdateLocation(BaseModel):
    latitude: float
    longitude: float

class NotificationResponse(BaseModel):
    request_id: str
    shop_id: str
    response: str
    available_medicines: Optional[List[str]] = None

class RequestOut(BaseModel):
    id: str
    request_code: str
    medicine_names: Optional[List[str]]
    status: str
    shops_notified: int
    created_at: datetime
    expires_at: datetime
    class Config:
        from_attributes = True

class ShopResponseOut(BaseModel):
    shop_id: str
    shop_name: str
    distance_km: float
    response: str
    responded_at: Optional[datetime]
    address: Optional[str]
    phone: str
    class Config:
        from_attributes = True
