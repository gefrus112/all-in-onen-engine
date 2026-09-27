"""Core math, timing, events, and configuration primitives for Lapia Engine."""

from __future__ import annotations

import math
import time
import random
from dataclasses import dataclass, field
from typing import Any, Callable, Optional, Union

Number = Union[int, float]


# ---------------------------------------------------------------------------
# Vector math
# ---------------------------------------------------------------------------

class Vector2:
    """2D vector with common math operations."""
    __slots__ = ("x", "y")

    def __init__(self, x: Number = 0.0, y: Number = 0.0):
        self.x = float(x)
        self.y = float(y)

    # ---- constructors ----
    @classmethod
    def zero(cls) -> "Vector2": return cls(0, 0)
    @classmethod
    def one(cls) -> "Vector2": return cls(1, 1)
    @classmethod
    def up(cls) -> "Vector2": return cls(0, -1)
    @classmethod
    def down(cls) -> "Vector2": return cls(0, 1)
    @classmethod
    def left(cls) -> "Vector2": return cls(-1, 0)
    @classmethod
    def right(cls) -> "Vector2": return cls(1, 0)
    @classmethod
    def random(cls, mag: Number = 1.0) -> "Vector2":
        a = random.uniform(0, math.tau)
        return cls(math.cos(a) * mag, math.sin(a) * mag)

    # ---- arithmetic ----
    def __add__(self, o): return Vector2(self.x + o.x, self.y + o.y)
    def __sub__(self, o): return Vector2(self.x - o.x, self.y - o.y)
    def __mul__(self, s): return Vector2(self.x * s, self.y * s) if isinstance(s, Number) else Vector2(self.x * s.x, self.y * s.y)
    def __rmul__(self, s): return self.__mul__(s)
    def __truediv__(self, s):
        if isinstance(s, Number):
            return Vector2(self.x / s, self.y / s)
        return Vector2(self.x / s.x, self.y / s.y)
    def __neg__(self): return Vector2(-self.x, -self.y)
    def __eq__(self, o): return isinstance(o, Vector2) and self.x == o.x and self.y == o.y
    def __hash__(self): return hash((self.x, self.y))
    def __iter__(self): return iter((self.x, self.y))
    def __len__(self): return 2
    def __getitem__(self, i): return (self.x, self.y)[i]
    def __repr__(self): return f"Vector2({self.x:.3f}, {self.y:.3f})"

    # ---- geometry ----
    @property
    def magnitude(self) -> float: return math.hypot(self.x, self.y)
    @property
    def sqr_magnitude(self) -> float: return self.x * self.x + self.y * self.y
    @property
    def normalized(self) -> "Vector2":
        m = self.magnitude
        return Vector2(self.x / m, self.y / m) if m > 1e-9 else Vector2.zero()
    @property
    def angle(self) -> float:
        """Angle in radians."""
        return math.atan2(self.y, self.x)
    @property
    def angle_deg(self) -> float:
        return math.degrees(self.angle)

    def dot(self, o: "Vector2") -> float: return self.x * o.x + self.y * o.y
    def cross(self, o: "Vector2") -> float: return self.x * o.y - self.y * o.x
    def distance_to(self, o: "Vector2") -> float: return (o - self).magnitude
    def lerp(self, o: "Vector2", t: float) -> "Vector2":
        return Vector2(self.x + (o.x - self.x) * t, self.y + (o.y - self.y) * t)
    def rotate(self, angle_rad: float) -> "Vector2":
        c, s = math.cos(angle_rad), math.sin(angle_rad)
        return Vector2(self.x * c - self.y * s, self.x * s + self.y * c)
    def reflect(self, normal: "Vector2") -> "Vector2":
        d = 2 * self.dot(normal)
        return Vector2(self.x - normal.x * d, self.y - normal.y * d)
    def to_tuple(self) -> tuple: return (self.x, self.y)
    def copy(self) -> "Vector2": return Vector2(self.x, self.y)

    @staticmethod
    def lerp(a: "Vector2", b: "Vector2", t: float) -> "Vector2": return a.lerp(b, t)
    @staticmethod
    def distance(a: "Vector2", b: "Vector2") -> float: return a.distance_to(b)
    @staticmethod
    def from_angle(angle_rad: float, mag: float = 1.0) -> "Vector2":
        return Vector2(math.cos(angle_rad) * mag, math.sin(angle_rad) * mag)


class Vector3:
    """3D vector (used for transforms with z-depth, e.g. layer ordering)."""
    __slots__ = ("x", "y", "z")
    def __init__(self, x: Number = 0.0, y: Number = 0.0, z: Number = 0.0):
        self.x = float(x); self.y = float(y); self.z = float(z)
    def __add__(self, o): return Vector3(self.x + o.x, self.y + o.y, self.z + o.z)
    def __sub__(self, o): return Vector3(self.x - o.x, self.y - o.y, self.z - o.z)
    def __mul__(self, s):
        if isinstance(s, Number): return Vector3(self.x*s, self.y*s, self.z*s)
        return Vector3(self.x*s.x, self.y*s.y, self.z*s.z)
    def __repr__(self): return f"Vector3({self.x:.3f}, {self.y:.3f}, {self.z:.3f})"
    @property
    def magnitude(self): return math.sqrt(self.x**2 + self.y**2 + self.z**2)
    @property
    def normalized(self):
        m = self.magnitude
        return Vector3(self.x/m, self.y/m, self.z/m) if m > 1e-9 else Vector3()


@dataclass
class Color:
    """RGBA color (0-255)."""
    r: int = 255
    g: int = 255
    b: int = 255
    a: int = 255

    def to_tuple(self) -> tuple: return (self.r, self.g, self.b, self.a)
    def to_rgb(self) -> tuple: return (self.r, self.g, self.b)
    def to_hex(self) -> str: return f"#{self.r:02x}{self.g:02x}{self.b:02x}"

    @classmethod
    def from_hex(cls, hex_str: str) -> "Color":
        h = hex_str.lstrip('#')
        if len(h) == 3: h = ''.join(c*2 for c in h)
        return cls(int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16))

    @classmethod
    def lerp(cls, a: "Color", b: "Color", t: float) -> "Color":
        return cls(
            int(a.r + (b.r - a.r) * t),
            int(a.g + (b.g - a.g) * t),
            int(a.b + (b.b - a.b) * t),
            int(a.a + (b.a - a.a) * t),
        )

    # Common named colors
    @classmethod
    def white(cls): return cls(255, 255, 255)
    @classmethod
    def black(cls): return cls(0, 0, 0)
    @classmethod
    def red(cls): return cls(255, 0, 0)
    @classmethod
    def green(cls): return cls(0, 255, 0)
    @classmethod
    def blue(cls): return cls(0, 0, 255)
    @classmethod
    def cyan(cls): return cls(0, 255, 255)
    @classmethod
    def magenta(cls): return cls(255, 0, 255)
    @classmethod
    def yellow(cls): return cls(255, 255, 0)
    @classmethod
    def transparent(cls): return cls(0, 0, 0, 0)


class Math:
    """Math utility helpers."""
    PI = math.pi
    TAU = math.tau
    DEG2RAD = math.pi / 180.0
    RAD2DEG = 180.0 / math.pi

    @staticmethod
    def clamp(v: Number, lo: Number, hi: Number) -> Number:
        return max(lo, min(hi, v))

    @staticmethod
    def lerp(a: Number, b: Number, t: Number) -> Number:
        return a + (b - a) * t

    @staticmethod
    def lerp_angle(a: float, b: float, t: float) -> float:
        diff = ((b - a + math.pi) % math.tau) - math.pi
        return a + diff * t

    @staticmethod
    def smoothstep(t: float) -> float:
        return t * t * (3 - 2 * t)

    @staticmethod
    def smootherstep(t: float) -> float:
        return t * t * t * (t * (t * 6 - 15) + 10)

    @staticmethod
    def ease_in(t: float, p: float = 2.0) -> float:
        return t ** p

    @staticmethod
    def ease_out(t: float, p: float = 2.0) -> float:
        return 1 - (1 - t) ** p

    @staticmethod
    def ease_in_out(t: float) -> float:
        return 3*t*t - 2*t*t*t

    @staticmethod
    def move_toward(current: Number, target: Number, max_delta: Number) -> Number:
        if abs(target - current) <= max_delta: return target
        return current + math.copysign(max_delta, target - current)

    @staticmethod
    def approach(current: Number, target: Number, max_delta: Number) -> Number:
        return Math.move_toward(current, target, max_delta)

    @staticmethod
    def sign(v: Number) -> int:
        return (v > 0) - (v < 0)

    @staticmethod
    def random_range(lo: Number, hi: Number) -> Number:
        return random.uniform(lo, hi)

    @staticmethod
    def random_int(lo: int, hi: int) -> int:
        return random.randint(lo, hi)

    @staticmethod
    def random_choice(seq):
        return random.choice(seq)

    @staticmethod
    def random_seed(seed: int) -> None:
        random.seed(seed)

    @staticmethod
    def angle_between(a: Vector2, b: Vector2) -> float:
        return math.atan2(b.y - a.y, b.x - a.x)

    @staticmethod
    def normalize_angle(a: float) -> float:
        return (a + math.pi) % math.tau - math.pi

    @staticmethod
    def approach_angle(current: float, target: float, max_delta: float) -> float:
        diff = Math.normalize_angle(target - current)
        if abs(diff) <= max_delta: return target
        return current + math.copysign(max_delta, diff)


# ---------------------------------------------------------------------------
# Timing
# ---------------------------------------------------------------------------

class Clock:
    """High-resolution clock for delta time and FPS tracking."""
    def __init__(self):
        self._last = time.perf_counter()
        self._elapsed = 0.0
        self._fps_samples: list[float] = []
        self._fps_last_sample = 0.0
        self._time_scale = 1.0
        self._paused = False

    def tick(self) -> float:
        """Returns delta time in seconds since last tick."""
        now = time.perf_counter()
        dt = now - self._last
        self._last = now
        if self._paused:
            return 0.0
        dt *= self._time_scale
        self._elapsed += dt
        # FPS sampling
        if dt > 0:
            self._fps_samples.append(1.0 / dt)
            if len(self._fps_samples) > 60:
                self._fps_samples.pop(0)
        return dt

    @property
    def elapsed(self) -> float:
        return self._elapsed

    @property
    def time_scale(self) -> float:
        return self._time_scale

    @time_scale.setter
    def time_scale(self, v: float):
        self._time_scale = max(0.0, v)

    @property
    def paused(self) -> bool:
        return self._paused

    def pause(self): self._paused = True
    def resume(self): self._paused = False

    @property
    def fps(self) -> float:
        if not self._fps_samples: return 0.0
        return sum(self._fps_samples) / len(self._fps_samples)


# ---------------------------------------------------------------------------
# Event bus
# ---------------------------------------------------------------------------

class EventBus:
    """Simple pub/sub event system."""
    def __init__(self):
        self._handlers: dict[str, list[Callable]] = {}

    def on(self, event: str, handler: Callable):
        self._handlers.setdefault(event, []).append(handler)
        return lambda: self.off(event, handler)

    def off(self, event: str, handler: Callable):
        if event in self._handlers:
            self._handlers[event] = [h for h in self._handlers[event] if h is not handler]

    def emit(self, event: str, *args, **kwargs):
        for h in list(self._handlers.get(event, [])):
            try:
                h(*args, **kwargs)
            except Exception as e:
                import sys
                print(f"[EventBus] handler error in '{event}': {e}", file=sys.stderr)

    def clear(self):
        self._handlers.clear()


# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

class Config:
    """Engine configuration with sensible defaults."""
    def __init__(self):
        self.title = "Lapia Game"
        self.width = 800
        self.height = 600
        self.fps_cap = 60
        self.vsync = True
        self.background_color = Color(40, 44, 52)
        self.fullscreen = False
        self.resizable = True
        self.scale_mode = "letterbox"  # letterbox | stretch | none
        self.target_resolution: Optional[tuple[int, int]] = None
        self.show_cursor = True
        self.audio_channels = 32
        self.audio_sample_rate = 44100
        self.physics_fixed_dt = 1.0 / 60.0
        self.physics_velocity_iterations = 8
        self.physics_position_iterations = 3
        self.debug = False
        self.profile = False

    def to_dict(self) -> dict:
        return {
            'title': self.title, 'width': self.width, 'height': self.height,
            'fps_cap': self.fps_cap, 'vsync': self.vsync,
            'fullscreen': self.fullscreen, 'resizable': self.resizable,
            'scale_mode': self.scale_mode,
            'physics_fixed_dt': self.physics_fixed_dt,
            'debug': self.debug, 'profile': self.profile,
        }


__all__ = [
    "Vector2", "Vector3", "Color", "Math", "Clock", "EventBus", "Config", "Number",
]
