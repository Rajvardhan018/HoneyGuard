import asyncio
import logging
from typing import Dict, Any, Optional
from app.config import settings
from app.database.session import AsyncSessionLocal
from app.services.event_processor import event_processor

logger = logging.getLogger("honeyguard.manager")

class HoneypotManager:
    def __init__(self):
        self.ssh_sensor: Optional[Any] = None
        self.http_sensor: Optional[Any] = None
        self.dynamic_sensors: Dict[str, Any] = {}
        self._is_running = False

    async def _on_sensor_event(self, telemetry: Dict[str, Any]):
        async with AsyncSessionLocal() as session:
            try:
                await event_processor.process_raw_event(telemetry, session)
            except Exception as e:
                logger.error(f"[HONEYPOT MANAGER] Error processing sensor event: {e}")

    async def start_sensors(self):
        if self._is_running:
            return
        
        try:
            from honeypots.ssh_honeypot import SSHHoneypotSensor
            from honeypots.http_honeypot import HTTPHoneypotSensor
        except ImportError as e:
            logger.warning(f"[HONEYPOT MANAGER] Honeypot sensors could not be imported (serverless environment): {e}")
            return

        self.ssh_sensor = SSHHoneypotSensor(
            host=settings.HONEYPOT_SSH_HOST,
            port=settings.HONEYPOT_SSH_PORT,
            honeypot_id="SSH-HONEY-01",
            mode="LIVE",
            on_event_callback=self._on_sensor_event
        )
        self.http_sensor = HTTPHoneypotSensor(
            host=settings.HONEYPOT_HTTP_HOST,
            port=settings.HONEYPOT_HTTP_PORT,
            honeypot_id="HTTP-HONEY-01",
            mode="LIVE",
            on_event_callback=self._on_sensor_event
        )

        await self.ssh_sensor.start()
        await self.http_sensor.start()
        self._is_running = True
        logger.info("All isolated honeypot sensors started successfully.")

    async def spawn_sensor(self, hp_id: str, hp_type: str, port: int, deception_level: str = "LOW", mode: str = "LAB") -> bool:
        """
        Dynamically spawn an isolated sandboxed honeypot sensor on the given port.
        """
        try:
            if hp_type.lower() == "ssh":
                from honeypots.ssh_honeypot import SSHHoneypotSensor
                sensor = SSHHoneypotSensor(
                    host="0.0.0.0",
                    port=port,
                    honeypot_id=hp_id,
                    mode=mode,
                    on_event_callback=self._on_sensor_event
                )
            elif hp_type.lower() == "http":
                from honeypots.http_honeypot import HTTPHoneypotSensor
                sensor = HTTPHoneypotSensor(
                    host="0.0.0.0",
                    port=port,
                    honeypot_id=hp_id,
                    mode=mode,
                    on_event_callback=self._on_sensor_event
                )
                sensor.deception_level = deception_level.upper()
            else:
                logger.error(f"[HONEYPOT MANAGER] Unsupported sensor type: {hp_type}")
                return False

            await sensor.start()
            self.dynamic_sensors[hp_id] = sensor
            logger.info(f"[HONEYPOT MANAGER] Dynamic {hp_type.upper()} sensor '{hp_id}' started on port {port} (mode={mode}).")
            return True
        except Exception as e:
            logger.error(f"[HONEYPOT MANAGER] Failed to spawn sensor '{hp_id}' on port {port}: {e}")
            raise e

    async def stop_sensors(self):
        if self.ssh_sensor:
            await self.ssh_sensor.stop()
        if self.http_sensor:
            await self.http_sensor.stop()
        for hp_id, sensor in list(self.dynamic_sensors.items()):
            try:
                await sensor.stop()
            except Exception:
                pass
        self.dynamic_sensors.clear()
        self._is_running = False
        logger.info("All honeypot sensors stopped.")

    def set_http_deception(self, level: str):
        if self.http_sensor:
            self.http_sensor.deception_level = level

    def set_sensor_deception(self, hp_id: str, level: str):
        if hp_id in self.dynamic_sensors:
            sensor = self.dynamic_sensors[hp_id]
            if hasattr(sensor, "deception_level"):
                sensor.deception_level = level.upper()
        elif self.http_sensor and (hp_id == "HTTP-HONEY-01" or "http" in hp_id.lower()):
            self.http_sensor.deception_level = level.upper()

honeypot_manager = HoneypotManager()
