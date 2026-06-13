from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime, timedelta, timezone
from app.db.database import get_db
from app.core.dependencies import get_current_user, get_current_shop
from app.models.user import User
from app.models.shop import Shop
from app.models.medicine_request import MedicineRequest
from app.models.request_notification import RequestNotification
from app.schemas.request import CreateMedicineRequest, NotificationResponse, RequestOut
from app.services.geo_service import get_shops_within_radius
from app.services.notification_service import fanout_to_shops, handle_shop_response
from app.utils.request_id import generate_request_code
from app.config import settings

router = APIRouter(prefix="/api/requests", tags=["Requests"])


@router.post("/", response_model=RequestOut)
async def create_request(
    data: CreateMedicineRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """User submits a medicine search. Fans out to nearby shops."""
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=settings.REQUEST_EXPIRE_MINUTES)

    req = MedicineRequest(
        request_code=generate_request_code(),
        user_id=user.id,
        medicine_names=data.medicine_names,
        search_lat=data.latitude,
        search_lng=data.longitude,
        radius_km=data.radius_km,
        expires_at=expires_at,
    )
    db.add(req)
    await db.flush()
    await db.refresh(req)

    # Find nearby open shops and fan out
    nearby = await get_shops_within_radius(db, data.latitude, data.longitude, data.radius_km)
    await fanout_to_shops(db, req, nearby)

    return RequestOut(
        id=str(req.id),
        request_code=req.request_code,
        medicine_names=req.medicine_names,
        status=req.status,
        shops_notified=req.shops_notified,
        created_at=req.created_at,
        expires_at=req.expires_at,
    )


@router.get("/{request_id}/responses")
async def get_request_responses(
    request_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get all shop responses for a specific user request."""
    result = await db.execute(
        select(MedicineRequest).where(
            MedicineRequest.id == request_id,
            MedicineRequest.user_id == user.id,
        )
    )
    req = result.scalar_one_or_none()
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")

    notifs = await db.execute(
        select(RequestNotification).where(RequestNotification.request_id == req.id)
    )
    notifications = notifs.scalars().all()

    responses = []
    for n in notifications:
        shop_result = await db.execute(select(Shop).where(Shop.id == n.shop_id))
        shop = shop_result.scalar_one_or_none()
        if shop:
            responses.append({
                "shop_id": str(shop.id),
                "shop_name": shop.shop_name,
                "phone": shop.phone,
                "address": shop.address,
                "distance_km": float(n.distance_km or 0),
                "response": n.response,
                "responded_at": n.responded_at.isoformat() if n.responded_at else None,
            })

    return {"request_code": req.request_code, "status": req.status, "responses": responses}


@router.get("/my/all")
async def get_my_requests(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(MedicineRequest)
        .where(MedicineRequest.user_id == user.id)
        .order_by(MedicineRequest.created_at.desc())
        .limit(20)
    )
    reqs = result.scalars().all()
    return [
        {
            "id": str(r.id),
            "request_code": r.request_code,
            "medicine_names": r.medicine_names,
            "status": r.status,
            "shops_notified": r.shops_notified,
            "created_at": r.created_at.isoformat(),
        }
        for r in reqs
    ]


# ── Shop side ────────────────────────────────────────────────────────────────

@router.get("/shop/incoming")
async def get_incoming_requests(
    shop: Shop = Depends(get_current_shop),
    db: AsyncSession = Depends(get_db),
):
    """Shop gets all pending notifications assigned to them."""
    result = await db.execute(
        select(RequestNotification)
        .where(
            RequestNotification.shop_id == shop.id,
            RequestNotification.response == "pending",
        )
        .order_by(RequestNotification.notified_at.desc())
    )
    notifs = result.scalars().all()

    out = []
    for n in notifs:
        req_result = await db.execute(
            select(MedicineRequest).where(MedicineRequest.id == n.request_id)
        )
        req = req_result.scalar_one_or_none()
        if req and req.status == "pending":
            out.append({
                "notification_id": str(n.id),
                "request_id": str(req.id),
                "request_code": req.request_code,
                "medicine_names": req.medicine_names,
                "distance_km": float(n.distance_km or 0),
                "notified_at": n.notified_at.isoformat(),
            })

    return out


@router.post("/shop/respond")
async def respond_to_request(
    data: NotificationResponse,
    shop: Shop = Depends(get_current_shop),
    db: AsyncSession = Depends(get_db),
):
    """Shop confirms or declines a medicine request."""
    result = await db.execute(
        select(RequestNotification).where(
            RequestNotification.request_id == data.request_id,
            RequestNotification.shop_id == shop.id,
        )
    )
    notif = result.scalar_one_or_none()
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found")
    if notif.response != "pending":
        raise HTTPException(status_code=400, detail="Already responded")

    await handle_shop_response(db, notif, data.response, data.available_medicines)
    return {"status": "ok", "response": data.response}


@router.get("/shop/history")
async def get_shop_history(
    shop: Shop = Depends(get_current_shop),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(RequestNotification)
        .where(
            RequestNotification.shop_id == shop.id,
            RequestNotification.response.in_(["confirmed", "declined"]),
        )
        .order_by(RequestNotification.responded_at.desc())
        .limit(50)
    )
    notifs = result.scalars().all()

    out = []
    for n in notifs:
        req_result = await db.execute(
            select(MedicineRequest).where(MedicineRequest.id == n.request_id)
        )
        req = req_result.scalar_one_or_none()
        if req:
            out.append({
                "request_code": req.request_code,
                "medicine_names": req.medicine_names,
                "response": n.response,
                "distance_km": float(n.distance_km or 0),
                "responded_at": n.responded_at.isoformat() if n.responded_at else None,
            })
    return out

