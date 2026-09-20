import asyncio
import logging
import socket
import datetime
from typing import Callable, Optional

logger = logging.getLogger("honeyguard.honeypot.ssh")

class SSHHoneypotSensor:
    def __init__(self, host: str = "0.0.0.0", port: int = 2222, honeypot_id: str = "SSH-HONEY-01", mode: str = "LIVE", on_event_callback: Optional[Callable] = None):
        self.host = host
        self.port = port
        self.honeypot_id = honeypot_id
        self.mode = mode
        self.on_event_callback = on_event_callback
        self.server: Optional[asyncio.Server] = None
        self.is_running = False

    async def handle_client(self, reader: asyncio.StreamReader, writer: asyncio.StreamWriter):
        peer = writer.get_extra_info("peername")
        source_ip = peer[0] if peer else "127.0.0.1"
        source_port = peer[1] if peer else 0
        logger.info(f"[SSH HONEYPOT] Inbound connection from {source_ip}:{source_port}")

        start_time = datetime.datetime.now(datetime.timezone.utc)
        captured_data = []
        auth_attempts = 0

        try:
            # Send OpenSSH Banner
            writer.write(b"SSH-2.0-OpenSSH_8.9p1 Ubuntu-3ubuntu0.6\r\n")
            await writer.drain()

            # Read client identification / handshake / auth attempts
            while True:
                try:
                    data = await asyncio.wait_for(reader.read(1024), timeout=8.0)
                except asyncio.TimeoutError:
                    break
                
                if not data:
                    break

                captured_data.append(data)
                auth_attempts += 1

                # Safe canned rejection or decoy prompt
                if b"password" in data.lower() or b"ssh-userauth" in data.lower() or auth_attempts > 1:
                    writer.write(b"Permission denied (publickey,password).\r\n")
                    await writer.drain()

                if auth_attempts >= 5:
                    break

        except Exception as e:
            logger.debug(f"[SSH HONEYPOT] Client handler error: {e}")
        finally:
            try:
                writer.close()
                await writer.wait_closed()
            except Exception:
                pass

        end_time = datetime.datetime.now(datetime.timezone.utc)
        duration = max(0.5, (end_time - start_time).total_seconds())

        raw_str = ""
        for chunk in captured_data:
            try:
                raw_str += chunk.decode("utf-8", errors="replace") + " "
            except Exception:
                pass

        telemetry = {
            "honeypot_id": self.honeypot_id,
            "service": "SSH",
            "source_ip": source_ip,
            "source_port": source_port,
            "auth_failures": max(1, auth_attempts),
            "request_frequency": round(auth_attempts / max(duration, 1.0), 2),
            "duration_seconds": round(duration, 2),
            "command_count": 0,
            "endpoint_diversity": 1,
            "user_agent": "OpenSSH-Client",
            "raw_payload": raw_str.strip() or "SSH-2.0 handshake probe",
            "mode": self.mode
        }

        if self.on_event_callback:
            try:
                await self.on_event_callback(telemetry)
            except Exception as cb_err:
                logger.error(f"[SSH HONEYPOT] Callback execution error: {cb_err}")

    async def start(self):
        try:
            self.server = await asyncio.start_server(self.handle_client, self.host, self.port)
            self.is_running = True
            logger.info(f"[SSH HONEYPOT] Emulated SSH service running on {self.host}:{self.port}")
        except Exception as e:
            logger.warning(f"[SSH HONEYPOT] Could not bind to port {self.port}: {e}")

    async def stop(self):
        if self.server:
            self.server.close()
            await self.server.wait_closed()
            self.is_running = False
            logger.info("[SSH HONEYPOT] Stopped")
