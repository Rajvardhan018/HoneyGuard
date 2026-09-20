import json
import logging
from typing import List, Dict, Any
from fastapi import WebSocket

logger = logging.getLogger("honeyguard.websocket")

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        logger.info(f"WebSocket client connected. Total clients: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
            logger.info(f"WebSocket client disconnected. Total clients: {len(self.active_connections)}")

    async def broadcast(self, message: Dict[str, Any]):
        if not self.active_connections:
            return
        
        # Serialize datetime and custom objects if needed
        data_str = json.dumps(message, default=str)
        dead_connections = []
        for connection in self.active_connections:
            try:
                await connection.send_text(data_str)
            except Exception as e:
                logger.warning(f"Error sending message to client: {e}")
                dead_connections.append(connection)
        
        for dead in dead_connections:
            self.disconnect(dead)

    async def broadcast_attack(self, event_data: Dict[str, Any]):
        await self.broadcast({
            "type": "NEW_ATTACK",
            "data": event_data
        })

    async def broadcast_incident(self, incident_data: Dict[str, Any]):
        await self.broadcast({
            "type": "INCIDENT_UPDATE",
            "data": incident_data
        })

    async def broadcast_soar(self, soar_data: Dict[str, Any]):
        await self.broadcast({
            "type": "SOAR_EXECUTION",
            "data": soar_data
        })

    async def broadcast_honeypot(self, honeypot_data: Dict[str, Any]):
        await self.broadcast({
            "type": "HONEYPOT_STATUS",
            "data": honeypot_data
        })

    async def broadcast_stream_log(self, log_line: Dict[str, Any]):
        await self.broadcast({
            "type": "ACTIVITY_STREAM",
            "data": log_line
        })

manager = ConnectionManager()
