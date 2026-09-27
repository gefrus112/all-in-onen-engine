"""Network: client/server stubs for multiplayer games."""

from __future__ import annotations

import json
import socket
import threading
import time
import queue
from dataclasses import dataclass, field
from typing import Optional, Callable, Any
from uuid import uuid4

from .core import Vector2


@dataclass
class NetworkMessage:
    """A network message envelope."""
    type: str
    data: dict = field(default_factory=dict)
    sender: str = ""
    timestamp: float = field(default_factory=time.time)
    id: str = field(default_factory=lambda: str(uuid4()))

    def serialize(self) -> bytes:
        return json.dumps({
            'type': self.type, 'data': self.data, 'sender': self.sender,
            'timestamp': self.timestamp, 'id': self.id,
        }).encode('utf-8')

    @classmethod
    def deserialize(cls, data: bytes) -> "NetworkMessage":
        d = json.loads(data.decode('utf-8'))
        return cls(**d)


class NetworkClient:
    """TCP-based network client."""
    def __init__(self, host: str = "127.0.0.1", port: int = 5555):
        self.host = host
        self.port = port
        self.socket: Optional[socket.socket] = None
        self.connected = False
        self.client_id: Optional[str] = None
        self.incoming: queue.Queue = queue.Queue()
        self.outgoing: queue.Queue = queue.Queue()
        self._recv_thread: Optional[threading.Thread] = None
        self._send_thread: Optional[threading.Thread] = None
        self._running = False
        self.handlers: dict[str, list[Callable]] = {}
        self.on_connect: Optional[Callable] = None
        self.on_disconnect: Optional[Callable] = None
        self.latency = 0.0

    def connect(self) -> bool:
        try:
            self.socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            self.socket.settimeout(5.0)
            self.socket.connect((self.host, self.port))
            self.socket.settimeout(None)
            self.connected = True
            self._running = True
            self._recv_thread = threading.Thread(target=self._recv_loop, daemon=True)
            self._send_thread = threading.Thread(target=self._send_loop, daemon=True)
            self._recv_thread.start()
            self._send_thread.start()
            if self.on_connect: self.on_connect()
            return True
        except Exception as e:
            print(f"[NetworkClient] Connect error: {e}")
            return False

    def disconnect(self):
        self._running = False
        self.connected = False
        if self.socket:
            try: self.socket.close()
            except: pass
        if self.on_disconnect: self.on_disconnect()

    def send(self, msg_type: str, data: dict):
        msg = NetworkMessage(type=msg_type, data=data, sender=self.client_id or "")
        self.outgoing.put(msg)

    def on(self, msg_type: str, handler: Callable):
        self.handlers.setdefault(msg_type, []).append(handler)

    def update(self):
        """Process incoming messages. Call this in your game loop."""
        while not self.incoming.empty():
            try:
                msg = self.incoming.get_nowait()
                for h in self.handlers.get(msg.type, []):
                    try: h(msg)
                    except Exception as e:
                        print(f"[NetworkClient] handler error: {e}")
            except queue.Empty:
                break

    def _recv_loop(self):
        buf = b""
        while self._running:
            try:
                data = self.socket.recv(4096)
                if not data:
                    self.connected = False
                    break
                buf += data
                while b"\n" in buf:
                    line, buf = buf.split(b"\n", 1)
                    try:
                        msg = NetworkMessage.deserialize(line)
                        self.incoming.put(msg)
                    except Exception as e:
                        print(f"[NetworkClient] Parse error: {e}")
            except Exception as e:
                print(f"[NetworkClient] Recv error: {e}")
                self.connected = False
                break

    def _send_loop(self):
        while self._running:
            try:
                msg = self.outgoing.get(timeout=0.1)
                data = msg.serialize() + b"\n"
                self.socket.sendall(data)
            except queue.Empty:
                continue
            except Exception as e:
                print(f"[NetworkClient] Send error: {e}")
                break


class NetworkServer:
    """TCP-based network server."""
    def __init__(self, host: str = "0.0.0.0", port: int = 5555, max_clients: int = 16):
        self.host = host
        self.port = port
        self.max_clients = max_clients
        self.socket: Optional[socket.socket] = None
        self.running = False
        self.clients: dict[str, dict] = {}  # client_id -> {socket, addr, name}
        self._accept_thread: Optional[threading.Thread] = None
        self.incoming: queue.Queue = queue.Queue()
        self.handlers: dict[str, list[Callable]] = {}
        self.on_client_connect: Optional[Callable] = None
        self.on_client_disconnect: Optional[Callable] = None

    def start(self) -> bool:
        try:
            self.socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            self.socket.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
            self.socket.bind((self.host, self.port))
            self.socket.listen(self.max_clients)
            self.running = True
            self._accept_thread = threading.Thread(target=self._accept_loop, daemon=True)
            self._accept_thread.start()
            return True
        except Exception as e:
            print(f"[NetworkServer] Start error: {e}")
            return False

    def stop(self):
        self.running = False
        if self.socket:
            try: self.socket.close()
            except: pass
        for cid, info in list(self.clients.items()):
            try: info['socket'].close()
            except: pass
        self.clients.clear()

    def broadcast(self, msg_type: str, data: dict, exclude: Optional[str] = None):
        msg = NetworkMessage(type=msg_type, data=data)
        for cid, info in list(self.clients.items()):
            if exclude and cid == exclude: continue
            try:
                info['socket'].sendall(msg.serialize() + b"\n")
            except Exception:
                self._disconnect_client(cid)

    def send_to(self, client_id: str, msg_type: str, data: dict):
        info = self.clients.get(client_id)
        if info is None: return
        msg = NetworkMessage(type=msg_type, data=data)
        try:
            info['socket'].sendall(msg.serialize() + b"\n")
        except Exception:
            self._disconnect_client(client_id)

    def on(self, msg_type: str, handler: Callable):
        self.handlers.setdefault(msg_type, []).append(handler)

    def update(self):
        while not self.incoming.empty():
            try:
                msg, client_id = self.incoming.get_nowait()
                if msg.type == 'handshake':
                    if client_id in self.clients:
                        self.clients[client_id]['name'] = msg.data.get('name', 'Player')
                for h in self.handlers.get(msg.type, []):
                    try: h(msg, client_id)
                    except Exception as e:
                        print(f"[NetworkServer] handler error: {e}")
            except queue.Empty:
                break

    def _accept_loop(self):
        while self.running:
            try:
                client_sock, addr = self.socket.accept()
                client_id = str(uuid4())
                self.clients[client_id] = {'socket': client_sock, 'addr': addr, 'name': f"Player_{client_id[:4]}"}
                t = threading.Thread(target=self._client_loop, args=(client_id,), daemon=True)
                t.start()
                if self.on_client_connect: self.on_client_connect(client_id, addr)
            except Exception as e:
                if self.running:
                    print(f"[NetworkServer] Accept error: {e}")

    def _client_loop(self, client_id: str):
        info = self.clients.get(client_id)
        if info is None: return
        sock = info['socket']
        buf = b""
        while self.running:
            try:
                data = sock.recv(4096)
                if not data:
                    self._disconnect_client(client_id)
                    break
                buf += data
                while b"\n" in buf:
                    line, buf = buf.split(b"\n", 1)
                    try:
                        msg = NetworkMessage.deserialize(line)
                        msg.sender = client_id
                        self.incoming.put((msg, client_id))
                    except Exception as e:
                        print(f"[NetworkServer] Parse error: {e}")
            except Exception as e:
                print(f"[NetworkServer] Client {client_id} error: {e}")
                self._disconnect_client(client_id)
                break

    def _disconnect_client(self, client_id: str):
        if client_id not in self.clients: return
        info = self.clients.pop(client_id)
        try: info['socket'].close()
        except: pass
        if self.on_client_disconnect: self.on_client_disconnect(client_id)


# ---------------------------------------------------------------------------
# Networked state sync helpers
# ---------------------------------------------------------------------------

class StateSync:
    """Helper for synchronizing entity state across network."""
    def __init__(self):
        self.snapshots: dict[str, dict] = {}
        self.last_snapshot_time = 0.0
        self.interpolation_delay = 0.1
        self.interpolation_buffer: list[tuple[float, dict]] = []

    def take_snapshot(self, entities: dict[str, Any]) -> dict:
        """Snapshot current state of entities (entities: dict id -> {pos, vel, ...})."""
        snap = {}
        t = time.time()
        for eid, e in entities.items():
            snap[eid] = {
                'pos': [e.get('position', Vector2.zero()).x, e.get('position', Vector2.zero()).y],
                'vel': [e.get('velocity', Vector2.zero()).x, e.get('velocity', Vector2.zero()).y],
                'rot': e.get('rotation', 0.0),
            }
        self.interpolation_buffer.append((t, snap))
        if len(self.interpolation_buffer) > 60:
            self.interpolation_buffer.pop(0)
        return snap

    def get_interpolated_state(self, entity_id: str) -> Optional[dict]:
        """Get interpolated state for an entity based on buffered snapshots."""
        now = time.time()
        target_time = now - self.interpolation_delay
        if len(self.interpolation_buffer) < 2: return None
        for i in range(len(self.interpolation_buffer) - 1):
            t1, s1 = self.interpolation_buffer[i]
            t2, s2 = self.interpolation_buffer[i + 1]
            if t1 <= target_time <= t2:
                if entity_id not in s1 or entity_id not in s2: return None
                alpha = (target_time - t1) / (t2 - t1) if (t2 - t1) > 0 else 0
                e1, e2 = s1[entity_id], s2[entity_id]
                return {
                    'pos': [e1['pos'][0] + (e2['pos'][0] - e1['pos'][0]) * alpha,
                            e1['pos'][1] + (e2['pos'][1] - e1['pos'][1]) * alpha],
                    'vel': e2['vel'],
                    'rot': e1['rot'] + (e2['rot'] - e1['rot']) * alpha,
                }
        return None


class Leaderboard:
    """Simple in-memory leaderboard."""
    def __init__(self):
        self.entries: list[dict] = []

    def add_score(self, name: str, score: float, metadata: Optional[dict] = None):
        self.entries.append({'name': name, 'score': score, 'meta': metadata or {}})
        self.entries.sort(key=lambda e: -e['score'])
        if len(self.entries) > 100:
            self.entries = self.entries[:100]

    def get_top(self, n: int = 10) -> list[dict]:
        return self.entries[:n]

    def get_rank(self, name: str) -> int:
        for i, e in enumerate(self.entries):
            if e['name'] == name: return i + 1
        return -1

    def clear(self):
        self.entries.clear()


__all__ = [
    "NetworkMessage", "NetworkClient", "NetworkServer",
    "StateSync", "Leaderboard",
]
