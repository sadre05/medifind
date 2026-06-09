import math
from typing import List, Tuple
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.shop import Shop


def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate distance in km between two GPS coordinates."""
    R = 6371.0
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


async def get_shops_within_radius(
    db: AsyncSession,
    lat: float,
    lng: float,
    radius_km: float = 5.0,
) -> List[Tuple[Shop, float]]:
    """Return list of (Shop, distance_km) for all open+verified shops within radius."""
    result = await db.execute(
        select(Shop).where(Shop.is_open == True, Shop.is_verified == True)  # noqa
    )
    shops = result.scalars().all()

    nearby = []
    for shop in shops:
        if shop.latitude is None or shop.longitude is None:
            continue
        dist = haversine_km(lat, lng, float(shop.latitude), float(shop.longitude))
        if dist <= radius_km:
            nearby.append((shop, round(dist, 2)))

    nearby.sort(key=lambda x: x[1])
    return nearby
