import json
from typing import Dict
from fastapi import WebSocket


class ConnectionManager:
    """
    Manages WebSocket connections.
    - Users connect with their user_id
    - Shops connect with their shop_id
    Each client is keyed by their ID so we can push targeted messages.
    """

    def __init__(self):
        self.user_connections: Dict[str, WebSocket] = {}
        self.shop_connections: Dict[str, WebSocket] = {}

    async def connect_user(self, user_id: str, ws: WebSocket):
        await ws.accept()
        self.user_connections[user_id] = ws

    async def connect_shop(self, shop_id: str, ws: WebSocket):
        await ws.accept()
        self.shop_connections[shop_id] = ws

    def disconnect_user(self, user_id: str):
        self.user_connections.pop(user_id, None)

    def disconnect_shop(self, shop_id: str):
        self.shop_connections.pop(shop_id, None)

    async def notify_user(self, user_id: str, data: dict):
        """Push a message to a specific user."""
        ws = self.user_connections.get(str(user_id))
        if ws:
            try:
                await ws.send_text(json.dumps(data))
            except Exception:
                self.disconnect_user(str(user_id))

    async def notify_shop(self, shop_id: str, data: dict):
        """Push a message to a specific shop."""
        ws = self.shop_connections.get(str(shop_id))
        if ws:
            try:
                await ws.send_text(json.dumps(data))
            except Exception:
                self.disconnect_shop(str(shop_id))


# Singleton — shared across the app
manager = ConnectionManager()
