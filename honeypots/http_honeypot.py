import asyncio
import logging
import datetime
from typing import Callable, Optional

logger = logging.getLogger("honeyguard.honeypot.http")

DECOY_RESPONSES = {
    "LOW": (
        "HTTP/1.1 404 Not Found\r\n"
        "Server: nginx/1.18.0\r\n"
        "Content-Type: text/html\r\n"
        "Content-Length: 162\r\n"
        "Connection: close\r\n\r\n"
        "<html><head><title>404 Not Found</title></head><body><center><h1>404 Not Found</h1></center><hr><center>nginx/1.18.0</center></body></html>"
    ),
    "MEDIUM": (
        "HTTP/1.1 200 OK\r\n"
        "Server: Apache/2.4.52 (Ubuntu)\r\n"
        "Content-Type: text/html\r\n"
        "Connection: close\r\n\r\n"
        "<!DOCTYPE html><html><head><title>Admin Gateway - Access Restricted</title></head>"
        "<body style='font-family:sans-serif;padding:40px;background:#f5f5f5'>"
        "<h2>Corporate Internal Gateway</h2>"
        "<form method='POST' action='/login'>"
        "<p><label>Username: <input type='text' name='username'></label></p>"
        "<p><label>Password: <input type='password' name='password'></label></p>"
        "<p><input type='submit' value='Sign In'></p></form></body></html>"
    ),
    "HIGH": (
        "HTTP/1.1 200 OK\r\n"
        "Server: Apache-Coyote/1.1\r\n"
        "X-Application-Context: application:production:8080\r\n"
        "Content-Type: application/json\r\n"
        "Connection: close\r\n\r\n"
        "{\"status\":\"UP\",\"services\":{\"auth\":\"READY\",\"database\":\"CONNECTED\",\"redis\":\"READY\"},\"debug\":{\"db_host\":\"10.0.4.15\",\"db_name\":\"prod_cust_db\",\"backup_uri\":\"/var/backup/latest_dump.sql\"}}"
    ),
    "CRITICAL": (
        "HTTP/1.1 200 OK\r\n"
        "Server: SecureCore/3.2.0-FIPS\r\n"
        "Content-Type: text/plain\r\n"
        "Connection: close\r\n\r\n"
        "# HONEYTOKEN FLAG: canary_token_99x_internal_core_trap\r\n"
        "# ACCESS HAS BEEN ISOLATED AND RECORDED FOR SECURITY REVIEW\r\n"
    )
}

class HTTPHoneypotSensor:
    def __init__(self, host: str = "0.0.0.0", port: int = 8080, honeypot_id: str = "HTTP-HONEY-01", mode: str = "LIVE", on_event_callback: Optional[Callable] = None):
        self.host = host
        self.port = port
        self.honeypot_id = honeypot_id
        self.mode = mode
        self.on_event_callback = on_event_callback
        self.server: Optional[asyncio.Server] = None
        self.is_running = False
        self.deception_level = "LOW"

    async def handle_client(self, reader: asyncio.StreamReader, writer: asyncio.StreamWriter):
        peer = writer.get_extra_info("peername")
        source_ip = peer[0] if peer else "127.0.0.1"
        source_port = peer[1] if peer else 0
        logger.info(f"[HTTP HONEYPOT] Inbound request from {source_ip}:{source_port}")

        start_time = datetime.datetime.now(datetime.timezone.utc)
        request_line = ""
        headers = {}
        body = ""

        try:
            raw_data = await asyncio.wait_for(reader.read(4096), timeout=5.0)
            if raw_data:
                text = raw_data.decode("utf-8", errors="replace")
                lines = text.split("\r\n")
                if lines:
                    request_line = lines[0]
                for line in lines[1:]:
                    if ": " in line:
                        k, v = line.split(": ", 1)
                        headers[k.lower()] = v
                    elif line == "":
                        body_idx = text.find("\r\n\r\n")
                        if body_idx != -1:
                            body = text[body_idx + 4:]
                        break

            # Send deceptive response
            resp = DECOY_RESPONSES.get(self.deception_level, DECOY_RESPONSES["LOW"])
            writer.write(resp.encode("utf-8"))
            await writer.drain()

        except Exception as e:
            logger.debug(f"[HTTP HONEYPOT] Error handling request: {e}")
        finally:
            try:
                writer.close()
                await writer.wait_closed()
            except Exception:
                pass

        end_time = datetime.datetime.now(datetime.timezone.utc)
        duration = max(0.1, (end_time - start_time).total_seconds())

        raw_payload = f"{request_line} | {body}".strip(" |")
        user_agent = headers.get("user-agent", "-")

        endpoint_diversity = 1
        if any(w in request_line for w in ["wp-login", ".env", "admin", "phpmyadmin", "api", "actuator"]):
            endpoint_diversity = 4

        telemetry = {
            "honeypot_id": self.honeypot_id,
            "service": "HTTP",
            "source_ip": source_ip,
            "source_port": source_port,
            "auth_failures": 1 if "login" in request_line.lower() or "admin" in request_line.lower() else 0,
            "request_frequency": 2.5,
            "duration_seconds": round(duration, 2),
            "command_count": 0,
            "endpoint_diversity": endpoint_diversity,
            "user_agent": user_agent,
            "raw_payload": raw_payload or "GET / HTTP/1.1 probe",
            "mode": self.mode
        }

        if self.on_event_callback:
            try:
                await self.on_event_callback(telemetry)
            except Exception as cb_err:
                logger.error(f"[HTTP HONEYPOT] Callback execution error: {cb_err}")

    async def start(self):
        try:
            self.server = await asyncio.start_server(self.handle_client, self.host, self.port)
            self.is_running = True
            logger.info(f"[HTTP HONEYPOT] Emulated HTTP service running on {self.host}:{self.port}")
        except Exception as e:
            logger.warning(f"[HTTP HONEYPOT] Could not bind to port {self.port}: {e}")

    async def stop(self):
        if self.server:
            self.server.close()
            await self.server.wait_closed()
            self.is_running = False
            logger.info("[HTTP HONEYPOT] Stopped")
