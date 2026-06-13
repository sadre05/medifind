from sqlalchemy.ext.asyncio import AsyncSession
from app.models.request_notification import RequestNotification
from app.models.medicine_request import MedicineRequest
from app.services.websocket_manager import manager

async def fanout_to_shops(
    db: AsyncSession,
    request: MedicineRequest,
    nearby_shops: list,
):
    count = 0
    for shop, dist in nearby_shops:
        notif = RequestNotification(
            request_id=request.id,
            shop_id=shop.id,
            distance_km=dist,
        )
        db.add(notif)
        count += 1
        await manager.notify_shop(str(shop.id), {
            "type": "NEW_REQUEST",
            "request_id": str(request.id),
            "request_code": request.request_code,
            "medicine_names": request.medicine_names,
            "distance_km": dist,
            "user_location": {
                "lat": float(request.search_lat),
                "lng": float(request.search_lng),
            },
        })
    request.shops_notified = count
    await db.flush()
    return count

async def handle_shop_response(
    db: AsyncSession,
    notification: RequestNotification,
    response: str,
    available_medicines: list = None,
):
    from datetime import datetime, timezone
    from sqlalchemy import select
    from app.models.medicine_request import MedicineRequest
    from app.models.shop import Shop

    notification.response = response
    notification.responded_at = datetime.now(timezone.utc)
    await db.flush()

    if response == "confirmed":
        req_result = await db.execute(
            select(MedicineRequest).where(MedicineRequest.id == notification.request_id)
        )
        req = req_result.scalar_one_or_none()
        shop_result = await db.execute(
            select(Shop).where(Shop.id == notification.shop_id)
        )
        shop = shop_result.scalar_one_or_none()

        if req and shop and req.status == "pending":
            req.status = "fulfilled"
            req.fulfilled_by = shop.id
            await db.flush()

            await manager.notify_user(str(req.user_id), {
                "type": "SHOP_CONFIRMED",
                "request_id": str(req.id),
                "request_code": req.request_code,
                "available_medicines": available_medicines or req.medicine_names,
                "shop": {
                    "id": str(shop.id),
                    "name": shop.shop_name,
                    "phone": shop.phone,
                    "address": shop.address,
                    "lat": float(shop.latitude) if shop.latitude else None,
                    "lng": float(shop.longitude) if shop.longitude else None,
                    "distance_km": float(notification.distance_km or 0),
                },
            })

