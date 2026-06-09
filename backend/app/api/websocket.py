from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query
from app.core.security import decode_token
from app.services.websocket_manager import manager

router = APIRouter(tags=["WebSocket"])


@router.websocket("/ws/user")
async def user_websocket(ws: WebSocket, token: str = Query(...)):
    """WebSocket endpoint for user — receives shop confirmation notifications."""
    payload = decode_token(token)
    user_id = payload.get("sub")
    role = payload.get("role")

    if not user_id or role != "user":
        await ws.close(code=4001)
        return

    await manager.connect_user(user_id, ws)
    try:
        while True:
            # Keep alive — user doesn't send messages, just receives
            await ws.receive_text()
    except WebSocketDisconnect:
        manager.disconnect_user(user_id)


@router.websocket("/ws/shop")
async def shop_websocket(ws: WebSocket, token: str = Query(...)):
    """WebSocket endpoint for shop — receives new medicine request notifications."""
    payload = decode_token(token)
    shop_id = payload.get("sub")
    role = payload.get("role")

    if not shop_id or role != "shop":
        await ws.close(code=4001)
        return

    await manager.connect_shop(shop_id, ws)
    try:
        while True:
            await ws.receive_text()
    except WebSocketDisconnect:
        manager.disconnect_shop(shop_id)
