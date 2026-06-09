from fastapi import APIRouter, HTTPException, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db.database import get_db
from app.models.user import User
from app.models.shop import Shop
from app.schemas.auth import UserRegister, ShopRegister, LoginRequest, TokenResponse
from app.core.security import hash_password, verify_password, create_access_token

router = APIRouter(prefix="/api/auth", tags=["Auth"])


@router.post("/user/register", response_model=TokenResponse)
async def register_user(data: UserRegister, db: AsyncSession = Depends(get_db)):
    exists = await db.execute(select(User).where(User.phone == data.phone))
    if exists.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Phone already registered")

    user = User(
        name=data.name,
        phone=data.phone,
        email=data.email,
        password_hash=hash_password(data.password),
    )
    db.add(user)
    await db.flush()
    await db.refresh(user)

    token = create_access_token({"sub": str(user.id), "role": "user"})
    return TokenResponse(access_token=token, role="user", id=str(user.id), name=user.name)


@router.post("/user/login", response_model=TokenResponse)
async def login_user(data: LoginRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.phone == data.phone))
    user = result.scalar_one_or_none()
    if not user or not verify_password(data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account disabled")

    token = create_access_token({"sub": str(user.id), "role": "user"})
    return TokenResponse(access_token=token, role="user", id=str(user.id), name=user.name)


@router.post("/shop/register", response_model=TokenResponse)
async def register_shop(data: ShopRegister, db: AsyncSession = Depends(get_db)):
    exists = await db.execute(select(Shop).where(Shop.phone == data.phone))
    if exists.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Phone already registered")

    shop = Shop(
        owner_name=data.owner_name,
        shop_name=data.shop_name,
        phone=data.phone,
        email=data.email,
        password_hash=hash_password(data.password),
        latitude=data.latitude,
        longitude=data.longitude,
        address=data.address,
        license_number=data.license_number,
        is_verified=True,  # set False in production — require admin approval
    )
    db.add(shop)
    await db.flush()
    await db.refresh(shop)

    token = create_access_token({"sub": str(shop.id), "role": "shop"})
    return TokenResponse(
        access_token=token, role="shop", id=str(shop.id), name=shop.shop_name
    )


@router.post("/shop/login", response_model=TokenResponse)
async def login_shop(data: LoginRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Shop).where(Shop.phone == data.phone))
    shop = result.scalar_one_or_none()
    if not shop or not verify_password(data.password, shop.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = create_access_token({"sub": str(shop.id), "role": "shop"})
    return TokenResponse(
        access_token=token, role="shop", id=str(shop.id), name=shop.shop_name
    )
