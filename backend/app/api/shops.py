from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.database import get_db
from app.core.dependencies import get_current_shop, get_current_user
from app.models.shop import Shop
from app.schemas.request import UpdateLocation

router = APIRouter(prefix="/api/shops", tags=["Shops"])


@router.patch("/status")
async def toggle_shop_status(
    shop: Shop = Depends(get_current_shop),
    db: AsyncSession = Depends(get_db),
):
    """Toggle shop open/closed."""
    shop.is_open = not shop.is_open
    await db.flush()
    return {"is_open": shop.is_open}


@router.patch("/location")
async def update_shop_location(
    data: UpdateLocation,
    shop: Shop = Depends(get_current_shop),
    db: AsyncSession = Depends(get_db),
):
    from datetime import datetime, timezone
    shop.latitude = data.latitude
    shop.longitude = data.longitude
    shop.location_updated_at = datetime.now(timezone.utc)
    await db.flush()
    return {"status": "updated"}


@router.get("/me")
async def get_shop_profile(shop: Shop = Depends(get_current_shop)):
    return {
        "id": str(shop.id),
        "shop_name": shop.shop_name,
        "owner_name": shop.owner_name,
        "phone": shop.phone,
        "email": shop.email,
        "address": shop.address,
        "latitude": float(shop.latitude),
        "longitude": float(shop.longitude),
        "is_open": shop.is_open,
        "is_verified": shop.is_verified,
    }


@router.patch("/user/location")
async def update_user_location(
    data: UpdateLocation,
    user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    from datetime import datetime, timezone
    user.latitude = data.latitude
    user.longitude = data.longitude
    user.location_updated_at = datetime.now(timezone.utc)
    await db.flush()
    return {"status": "updated"}
