from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db.database import get_db
from app.core.security import decode_token
from app.models.user import User
from app.models.shop import Shop

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/user/login")
shop_oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/shop/login")


async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db),
) -> User:
    payload = decode_token(token)
    user_id = payload.get("sub")
    role = payload.get("role")
    if not user_id or role != "user":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user or not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    return user


async def get_current_shop(
    token: str = Depends(shop_oauth2_scheme),
    db: AsyncSession = Depends(get_db),
) -> Shop:
    payload = decode_token(token)
    shop_id = payload.get("sub")
    role = payload.get("role")
    if not shop_id or role != "shop":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    result = await db.execute(select(Shop).where(Shop.id == shop_id))
    shop = result.scalar_one_or_none()
    if not shop:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Shop not found")
    return shop
