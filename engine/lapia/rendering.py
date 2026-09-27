"""Rendering subsystem: sprites, animations, tilemaps, particles, camera, text, shaders, lights."""

from __future__ import annotations

import math
import random
from dataclasses import dataclass, field
from typing import Optional, Callable, Any

try:
    import pygame
    HAS_PYGAME = True
except ImportError:
    HAS_PYGAME = False
    pygame = None

from .core import Vector2, Color, Math


# ---------------------------------------------------------------------------
# Layer management
# ---------------------------------------------------------------------------

class LayerManager:
    """Manages render ordering with named layers."""
    def __init__(self):
        self._layers: dict[str, int] = {}
        self._default_layers()

    def _default_layers(self):
        defaults = [
            ("background", 0), ("tilemap", 10), ("decoration", 20),
            ("entity", 30), ("player", 40), ("enemy", 35),
            ("projectile", 50), ("particle", 60), ("ui_back", 70),
            ("ui", 80), ("debug", 90), ("overlay", 100),
        ]
        for name, order in defaults:
            self._layers[name] = order

    def add_layer(self, name: str, order: int):
        self._layers[name] = order

    def get_order(self, name: str) -> int:
        return self._layers.get(name, 50)

    def set_order(self, name: str, order: int):
        self._layers[name] = order

    def layers_sorted(self) -> list[tuple[str, int]]:
        return sorted(self._layers.items(), key=lambda kv: kv[1])


# ---------------------------------------------------------------------------
# Camera
# ---------------------------------------------------------------------------

class Camera:
    """2D camera with follow, shake, zoom, and deadzone support."""
    def __init__(self, viewport_size: tuple[int, int]):
        self.position = Vector2.zero()
        self.target: Optional[Vector2] = None
        self.viewport = viewport_size
        self.zoom = 1.0
        self.target_zoom = 1.0
        self.rotation = 0.0
        self.follow_lerp = 0.15
        self.follow_offset = Vector2.zero()
        self.deadzone: Optional[tuple[float, float, float, float]] = None
        self.lookahead = Vector2.zero()
        self.lookahead_factor = 0.3

        # Shake
        self._shake_amp = 0.0
        self._shake_timer = 0.0
        self._shake_duration = 0.0
        self._shake_offset = Vector2.zero()
        self._shake_decay = 4.0  # higher = faster decay

        # Bounds
        self.bounds: Optional[tuple[float, float, float, float]] = None

    def follow(self, target: Vector2, lerp: float = 0.15, offset: Optional[Vector2] = None):
        self.target = target
        self.follow_lerp = lerp
        self.follow_offset = offset or Vector2.zero()

    def set_bounds(self, x: float, y: float, w: float, h: float):
        self.bounds = (x, y, w, h)

    def shake(self, amplitude: float = 8.0, duration: float = 0.3):
        self._shake_amp = max(self._shake_amp, amplitude)
        self._shake_duration = duration
        self._shake_timer = duration

    def update(self, dt: float):
        # Follow target
        if self.target is not None:
            desired = self.target + self.follow_offset
            if self.deadzone:
                dx, dy, dw, dh = self.deadzone
                cx, cy = self.position.x + self.viewport[0] / 2, self.position.y + self.viewport[1] / 2
                if abs(desired.x - cx) > dw / 2:
                    self.position.x = Math.move_toward(self.position.x, desired.x - self.viewport[0] / 2, 200 * dt)
                if abs(desired.y - cy) > dh / 2:
                    self.position.y = Math.move_toward(self.position.y, desired.y - self.viewport[1] / 2, 200 * dt)
            else:
                self.position = self.position.lerp(desired - Vector2(self.viewport[0]/2, self.viewport[1]/2), self.follow_lerp)

        # Zoom
        self.zoom = Math.lerp(self.zoom, self.target_zoom, 0.1)

        # Shake
        if self._shake_timer > 0:
            self._shake_timer -= dt
            t = max(0.0, self._shake_timer / self._shake_duration) if self._shake_duration > 0 else 0
            amp = self._shake_amp * t
            self._shake_offset = Vector2(
                random.uniform(-amp, amp),
                random.uniform(-amp, amp),
            )
        else:
            self._shake_offset = Vector2.zero()

        # Bounds
        if self.bounds:
            x, y, w, h = self.bounds
            self.position.x = Math.clamp(self.position.x, x, x + w - self.viewport[0])
            self.position.y = Math.clamp(self.position.y, y, y + h - self.viewport[1])

    def world_to_screen(self, world: Vector2) -> Vector2:
        offset = self.position + self._shake_offset
        return Vector2(
            (world.x - offset.x) * self.zoom,
            (world.y - offset.y) * self.zoom,
        )

    def screen_to_world(self, screen: Vector2) -> Vector2:
        offset = self.position + self._shake_offset
        return Vector2(
            screen.x / self.zoom + offset.x,
            screen.y / self.zoom + offset.y,
        )


# ---------------------------------------------------------------------------
# Sprite
# ---------------------------------------------------------------------------

class Sprite:
    """A renderable sprite with transform, color, flip, and optional texture."""
    _id_counter = 0

    def __init__(self,
                 image: Optional[Any] = None,
                 color: Optional[Color] = None,
                 size: Optional[tuple[int, int]] = None,
                 layer: str = "entity"):
        Sprite._id_counter += 1
        self.id = Sprite._id_counter
        self.position = Vector2.zero()
        self.origin = Vector2(0.5, 0.5)  # 0..1
        self.scale = Vector2(1, 1)
        self.rotation = 0.0  # radians
        self.color = color or Color.white()
        self.alpha = 255
        self.flip_x = False
        self.flip_y = False
        self.visible = True
        self.layer = layer
        self.z_offset = 0.0
        self.image = image
        self._image_size: Optional[tuple[int, int]] = None
        if size:
            self._image_size = size
        self._cached_surface: Optional[Any] = None
        self._dirty = True
        self.tag = ""
        self.user_data: dict = {}

    @property
    def x(self) -> float: return self.position.x
    @x.setter
    def x(self, v: float): self.position.x = v

    @property
    def y(self) -> float: return self.position.y
    @y.setter
    def y(self, v: float): self.position.y = v

    @property
    def width(self) -> int:
        if self._image_size: return int(self._image_size[0] * self.scale.x)
        if self.image and HAS_PYGAME: return self.image.get_width()
        return 32
    @property
    def height(self) -> int:
        if self._image_size: return int(self._image_size[1] * self.scale.y)
        if self.image and HAS_PYGAME: return self.image.get_height()
        return 32

    @property
    def bounds(self) -> tuple[float, float, float, float]:
        """AABB in world space: x, y, w, h."""
        w, h = self.width, self.height
        ox, oy = self.origin.x * w, self.origin.y * h
        return (self.x - ox, self.y - oy, w, h)

    def set_color(self, color: Color):
        self.color = color
        self._dirty = True

    def set_image(self, image: Any):
        self.image = image
        self._dirty = True

    def render(self, surface: Any, camera: Camera):
        if not self.visible:
            return
        screen_pos = camera.world_to_screen(self.position)
        w = int(self.width * camera.zoom)
        h = int(self.height * camera.zoom)
        if w <= 0 or h <= 0:
            return
        ox = self.origin.x * w
        oy = self.origin.y * h
        x = int(screen_pos.x - ox)
        y = int(screen_pos.y - oy)

        if self.image is not None and HAS_PYGAME:
            img = self.image
            if self.scale.x != 1.0 or self.scale.y != 1.0:
                base = img.get_size()
                img = pygame.transform.scale(img, (int(base[0]*self.scale.x*camera.zoom), int(base[1]*self.scale.y*camera.zoom)))
            if self.flip_x or self.flip_y:
                img = pygame.transform.flip(img, self.flip_x, self.flip_y)
            if self.rotation != 0.0:
                img = pygame.transform.rotate(img, math.degrees(self.rotation))
            if self.alpha < 255:
                img = img.copy()
                img.set_alpha(self.alpha)
            rect = img.get_rect(center=(x + ox, y + oy))
            surface.blit(img, rect)
        elif HAS_PYGAME:
            # Color rectangle fallback
            col = (*self.color.to_rgb(), self.alpha) if self.alpha < 255 else self.color.to_rgb()
            rect = pygame.Rect(x, y, w, h)
            s = pygame.Surface((w, h), pygame.SRCALPHA)
            s.fill(col)
            if self.rotation != 0.0:
                s = pygame.transform.rotate(s, math.degrees(self.rotation))
            rect = s.get_rect(center=(x + ox, y + oy))
            surface.blit(s, rect)


# ---------------------------------------------------------------------------
# Animation
# ---------------------------------------------------------------------------

class Animation:
    """Frame-based sprite animation."""
    def __init__(self, name: str, frames: list, fps: float = 10.0, loop: bool = True):
        self.name = name
        self.frames = frames
        self.fps = fps
        self.loop = loop
        self.frame_time = 1.0 / fps if fps > 0 else 0.1
        self.time = 0.0
        self.current_frame = 0
        self.finished = False
        self.playing = True

    def update(self, dt: float):
        if not self.playing or self.finished:
            return
        self.time += dt
        while self.time >= self.frame_time:
            self.time -= self.frame_time
            self.current_frame += 1
            if self.current_frame >= len(self.frames):
                if self.loop:
                    self.current_frame = 0
                else:
                    self.current_frame = len(self.frames) - 1
                    self.finished = True
                    self.playing = False

    @property
    def current_image(self):
        if not self.frames: return None
        return self.frames[min(self.current_frame, len(self.frames) - 1)]

    def reset(self):
        self.current_frame = 0
        self.time = 0.0
        self.finished = False
        self.playing = True


class Animator:
    """Manages multiple named animations for a sprite."""
    def __init__(self, sprite: Sprite):
        self.sprite = sprite
        self.animations: dict[str, Animation] = {}
        self.current: Optional[Animation] = None

    def add(self, name: str, frames: list, fps: float = 10.0, loop: bool = True):
        self.animations[name] = Animation(name, frames, fps, loop)

    def play(self, name: str, restart: bool = False):
        if name not in self.animations:
            return
        if self.current and self.current.name == name and not restart:
            self.current.playing = True
            return
        self.current = self.animations[name]
        self.current.reset()

    def stop(self):
        if self.current: self.current.playing = False

    def update(self, dt: float):
        if self.current:
            self.current.update(dt)
            img = self.current.current_image
            if img is not None:
                self.sprite.set_image(img)


# ---------------------------------------------------------------------------
# Tilemap
# ---------------------------------------------------------------------------

class Tilemap:
    """Grid-based tilemap with multiple layers and tile palettes."""
    def __init__(self, tile_size: int = 32, width: int = 40, height: int = 30):
        self.tile_size = tile_size
        self.width = width
        self.height = height
        self.layers: dict[str, list[list[int]]] = {}
        self.tilesets: dict[int, Any] = {}  # tile_id -> surface
        self.tile_properties: dict[int, dict] = {}
        self.add_layer("ground")
        self.add_layer("decoration")
        self.add_layer("collision")

    def add_layer(self, name: str):
        self.layers[name] = [[0] * self.width for _ in range(self.height)]

    def set_tile(self, layer: str, tx: int, ty: int, tile_id: int):
        if layer in self.layers and 0 <= tx < self.width and 0 <= ty < self.height:
            self.layers[layer][ty][tx] = tile_id

    def get_tile(self, layer: str, tx: int, ty: int) -> int:
        if layer in self.layers and 0 <= tx < self.width and 0 <= ty < self.height:
            return self.layers[layer][ty][tx]
        return 0

    def fill_layer(self, layer: str, tile_id: int):
        if layer in self.layers:
            for row in self.layers[layer]:
                for i in range(len(row)):
                    row[i] = tile_id

    def register_tile(self, tile_id: int, surface: Any = None, **properties):
        self.tilesets[tile_id] = surface
        self.tile_properties[tile_id] = properties

    def is_solid(self, tx: int, ty: int) -> bool:
        return self.get_tile("collision", tx, ty) != 0

    def world_to_tile(self, world: Vector2) -> tuple[int, int]:
        return (int(world.x // self.tile_size), int(world.y // self.tile_size))

    def tile_to_world(self, tx: int, ty: int) -> Vector2:
        return Vector2(tx * self.tile_size + self.tile_size/2, ty * self.tile_size + self.tile_size/2)

    def render(self, surface: Any, camera: Camera):
        ts = self.tile_size
        for layer_name, grid in self.layers.items():
            for ty in range(self.height):
                for tx in range(self.width):
                    tile_id = grid[ty][tx]
                    if tile_id == 0:
                        continue
                    world = Vector2(tx * ts, ty * ts)
                    screen = camera.world_to_screen(world)
                    sx, sy = int(screen.x), int(screen.y)
                    if sx < -ts or sy < -ts or sx > surface.get_width() or sy > surface.get_height():
                        continue
                    tile_surf = self.tilesets.get(tile_id)
                    if tile_surf is not None and HAS_PYGAME:
                        scaled = pygame.transform.scale(tile_surf, (int(ts*camera.zoom), int(ts*camera.zoom))) if camera.zoom != 1.0 else tile_surf
                        surface.blit(scaled, (sx, sy))
                    else:
                        # Colored tile fallback
                        col = (50 + (tile_id * 30) % 200, 100, 150)
                        pygame.draw.rect(surface, col, (sx, sy, int(ts*camera.zoom), int(ts*camera.zoom)))


# ---------------------------------------------------------------------------
# Particle system
# ---------------------------------------------------------------------------

@dataclass
class ParticleConfig:
    count: int = 30
    lifetime: float = 1.0
    lifetime_variance: float = 0.3
    speed: float = 100.0
    speed_variance: float = 50.0
    angle: float = 0.0
    angle_variance: float = math.pi
    size_start: float = 4.0
    size_end: float = 0.0
    color_start: Color = field(default_factory=lambda: Color(255, 220, 100))
    color_end: Color = field(default_factory=lambda: Color(255, 50, 50, 0))
    gravity: Vector2 = field(default_factory=lambda: Vector2(0, 200))
    drag: float = 0.0
    emit_rate: float = 0.0  # 0 = burst (all at once), >0 = continuous
    spread: float = math.pi * 2  # full circle


class Particle:
    __slots__ = ("pos", "vel", "life", "max_life", "size", "color")
    def __init__(self, pos: Vector2, vel: Vector2, life: float, size: float, color: Color):
        self.pos = pos
        self.vel = vel
        self.life = life
        self.max_life = life
        self.size = size
        self.color = color


class ParticleSystem:
    """Particle emitter with bursts and continuous emission."""
    def __init__(self, position: Optional[Vector2] = None, config: Optional[ParticleConfig] = None):
        self.position = position or Vector2.zero()
        self.config = config or ParticleConfig()
        self.particles: list[Particle] = []
        self._emit_timer = 0.0
        self.active = True

    def emit_burst(self, count: Optional[int] = None):
        cfg = self.config
        n = count if count is not None else cfg.count
        for _ in range(n):
            angle = cfg.angle + random.uniform(-cfg.angle_variance/2, cfg.angle_variance/2)
            speed = cfg.speed + random.uniform(-cfg.speed_variance, cfg.speed_variance)
            vel = Vector2(math.cos(angle) * speed, math.sin(angle) * speed)
            life = max(0.01, cfg.lifetime + random.uniform(-cfg.lifetime_variance, cfg.lifetime_variance))
            size = cfg.size_start
            self.particles.append(Particle(self.position.copy(), vel, life, size, cfg.color_start))

    def update(self, dt: float):
        cfg = self.config
        if not self.active:
            return
        # Continuous emission
        if cfg.emit_rate > 0:
            self._emit_timer += dt
            interval = 1.0 / cfg.emit_rate
            while self._emit_timer >= interval:
                self._emit_timer -= interval
                self.emit_burst(1)
        # Update particles
        alive: list[Particle] = []
        for p in self.particles:
            p.life -= dt
            if p.life <= 0:
                continue
            t = 1.0 - p.life / p.max_life
            # Apply gravity
            p.vel.x += cfg.gravity.x * dt
            p.vel.y += cfg.gravity.y * dt
            # Drag
            if cfg.drag > 0:
                p.vel.x *= max(0.0, 1.0 - cfg.drag * dt)
                p.vel.y *= max(0.0, 1.0 - cfg.drag * dt)
            # Move
            p.pos.x += p.vel.x * dt
            p.pos.y += p.vel.y * dt
            # Interpolate size and color
            p.size = Math.lerp(cfg.size_start, cfg.size_end, t)
            p.color = Color.lerp(cfg.color_start, cfg.color_end, t)
            alive.append(p)
        self.particles = alive

    def render(self, surface: Any, camera: Camera):
        if not HAS_PYGAME:
            return
        for p in self.particles:
            sp = camera.world_to_screen(p.pos)
            sz = max(1, int(p.size * camera.zoom))
            if sz <= 0: continue
            col = p.color.to_rgb() if p.color.a >= 255 else (*p.color.to_rgb(), p.color.a)
            if p.color.a < 255:
                ps = pygame.Surface((sz*2, sz*2), pygame.SRCALPHA)
                pygame.draw.circle(ps, col, (sz, sz), sz)
                surface.blit(ps, (int(sp.x) - sz, int(sp.y) - sz))
            else:
                pygame.draw.circle(surface, col, (int(sp.x), int(sp.y)), sz)

    def clear(self):
        self.particles.clear()

    @property
    def particle_count(self) -> int:
        return len(self.particles)


# ---------------------------------------------------------------------------
# Text
# ---------------------------------------------------------------------------

class Text:
    """Renderable text with font, alignment, and effects."""
    def __init__(self, text: str = "", font_name: str = "Arial", size: int = 24, color: Optional[Color] = None):
        self.text = text
        self.font_name = font_name
        self.size = size
        self.color = color or Color.white()
        self.position = Vector2.zero()
        self.alignment = "left"  # left | center | right
        self.layer = "ui"
        self.visible = True
        self.shadow = False
        self.shadow_color = Color(0, 0, 0, 180)
        self.shadow_offset = Vector2(2, 2)
        self.outline = False
        self.outline_color = Color.black()
        self.outline_width = 1
        self._font = None
        self._dirty = True
        if HAS_PYGAME:
            try:
                self._font = pygame.font.SysFont(font_name, size)
            except Exception:
                self._font = pygame.font.Font(None, size)

    def set_text(self, t: str):
        self.text = t
        self._dirty = True

    def render(self, surface: Any, camera: Camera):
        if not self.visible or not self.text or not HAS_PYGAME or self._font is None:
            return
        screen_pos = camera.world_to_screen(self.position)
        # Render shadow first
        if self.shadow:
            shadow_surf = self._font.render(self.text, True, self.shadow_color.to_rgb())
            rect = shadow_surf.get_rect()
            self._apply_alignment(rect, screen_pos + self.shadow_offset)
            surface.blit(shadow_surf, rect)
        # Main text
        text_surf = self._font.render(self.text, True, self.color.to_rgb())
        rect = text_surf.get_rect()
        self._apply_alignment(rect, screen_pos)
        if self.outline:
            ox = self.outline_width
            for dx, dy in [(-ox,0),(ox,0),(0,-ox),(0,ox),(-ox,-ox),(ox,-ox),(-ox,ox),(ox,ox)]:
                outline_surf = self._font.render(self.text, True, self.outline_color.to_rgb())
                surface.blit(outline_surf, rect.move(dx, dy))
        surface.blit(text_surf, rect)

    def _apply_alignment(self, rect, pos: Vector2):
        if self.alignment == "center":
            rect.center = (int(pos.x), int(pos.y))
        elif self.alignment == "right":
            rect.topright = (int(pos.x), int(pos.y))
        else:
            rect.topleft = (int(pos.x), int(pos.y))


# ---------------------------------------------------------------------------
# Primitives
# ---------------------------------------------------------------------------

class Primitive:
    """Drawing helper for lines, rectangles, circles, polygons."""
    def __init__(self, layer: str = "debug"):
        self.layer = layer
        self.visible = True

    @staticmethod
    def draw_line(surface, camera: Camera, a: Vector2, b: Vector2, color: Color, width: int = 1):
        if not HAS_PYGAME: return
        sa = camera.world_to_screen(a)
        sb = camera.world_to_screen(b)
        pygame.draw.line(surface, color.to_rgb(), (sa.x, sa.y), (sb.x, sb.y), width)

    @staticmethod
    def draw_rect(surface, camera: Camera, pos: Vector2, size: Vector2, color: Color, filled: bool = True, width: int = 1):
        if not HAS_PYGAME: return
        sp = camera.world_to_screen(pos)
        w = int(size.x * camera.zoom); h = int(size.y * camera.zoom)
        rect = pygame.Rect(int(sp.x), int(sp.y), w, h)
        if filled:
            pygame.draw.rect(surface, color.to_rgb(), rect)
        else:
            pygame.draw.rect(surface, color.to_rgb(), rect, width)

    @staticmethod
    def draw_circle(surface, camera: Camera, center: Vector2, radius: float, color: Color, filled: bool = True, width: int = 1):
        if not HAS_PYGAME: return
        sp = camera.world_to_screen(center)
        r = max(1, int(radius * camera.zoom))
        if filled:
            pygame.draw.circle(surface, color.to_rgb(), (int(sp.x), int(sp.y)), r)
        else:
            pygame.draw.circle(surface, color.to_rgb(), (int(sp.x), int(sp.y)), r, width)

    @staticmethod
    def draw_polygon(surface, camera: Camera, points: list, color: Color, filled: bool = True, width: int = 1):
        if not HAS_PYGAME or len(points) < 3: return
        screen_pts = [(camera.world_to_screen(p).x, camera.world_to_screen(p).y) for p in points]
        if filled:
            pygame.draw.polygon(surface, color.to_rgb(), screen_pts)
        else:
            pygame.draw.polygon(surface, color.to_rgb(), screen_pts, width)

    @staticmethod
    def draw_arc(surface, camera: Camera, center: Vector2, radius: float, start_angle: float, end_angle: float, color: Color, width: int = 1):
        if not HAS_PYGAME: return
        sp = camera.world_to_screen(center)
        r = max(1, int(radius * camera.zoom))
        rect = pygame.Rect(int(sp.x - r), int(sp.y - r), r*2, r*2)
        pygame.draw.arc(surface, color.to_rgb(), rect, start_angle, end_angle, width)


# ---------------------------------------------------------------------------
# Shader (post-processing effect)
# ---------------------------------------------------------------------------

class Shader:
    """Simple post-processing shader abstraction (software-based)."""
    def __init__(self, name: str):
        self.name = name
        self.enabled = True
        self.params: dict = {}

    def apply(self, surface: Any) -> Any:
        """Apply the shader effect to a surface. Override in subclasses."""
        return surface


class GrayscaleShader(Shader):
    def __init__(self):
        super().__init__("grayscale")
        self.intensity = 1.0

    def apply(self, surface):
        if not HAS_PYGAME or not self.enabled: return surface
        arr = pygame.surfarray.pixels3d(surface)
        gray = (arr[:,:,0] * 0.299 + arr[:,:,1] * 0.587 + arr[:,:,2] * 0.114).astype('uint8')
        arr[:,:,0] = arr[:,:,1] = arr[:,:,2] = gray
        del arr
        return surface


class VignetteShader(Shader):
    def __init__(self):
        super().__init__("vignette")
        self.intensity = 0.6
        self.radius = 0.5

    def apply(self, surface):
        if not HAS_PYGAME or not self.enabled: return surface
        w, h = surface.get_size()
        overlay = pygame.Surface((w, h), pygame.SRCALPHA)
        cx, cy = w // 2, h // 2
        max_dist = math.hypot(cx, cy)
        for r in range(0, int(max_dist), 8):
            t = r / max_dist
            if t > self.radius:
                alpha = int(255 * self.intensity * ((t - self.radius) / (1 - self.radius)))
                alpha = min(255, max(0, alpha))
                pygame.draw.circle(overlay, (0, 0, 0, alpha), (cx, cy), max_dist - r, 8)
        surface.blit(overlay, (0, 0))
        return surface


# ---------------------------------------------------------------------------
# Lighting
# ---------------------------------------------------------------------------

class Light:
    """A light source for 2D lighting effects."""
    def __init__(self, position: Vector2, radius: float = 200.0, color: Optional[Color] = None, intensity: float = 1.0):
        self.position = position
        self.radius = radius
        self.color = color or Color(255, 240, 200)
        self.intensity = intensity
        self.flicker = 0.0
        self.enabled = True


class LightingSystem:
    """Manages 2D lighting with additive blending."""
    def __init__(self, viewport_size: tuple[int, int], ambient: Optional[Color] = None):
        self.viewport = viewport_size
        self.ambient = ambient or Color(20, 20, 30)
        self.lights: list[Light] = []
        self.darkness_surface = None
        if HAS_PYGAME:
            self.darkness_surface = pygame.Surface(viewport_size, pygame.SRCALPHA)

    def add(self, light: Light):
        self.lights.append(light)

    def remove(self, light: Light):
        if light in self.lights:
            self.lights.remove(light)

    def render(self, surface: Any, camera: Camera):
        if not HAS_PYGAME or self.darkness_surface is None:
            return
        # Fill with ambient darkness
        self.darkness_surface.fill((self.ambient.r, self.ambient.g, self.ambient.b, 255 - self.ambient.a))
        # Cut out light circles
        for light in self.lights:
            if not light.enabled: continue
            sp = camera.world_to_screen(light.position)
            r = int(light.radius * camera.zoom)
            if r <= 0: continue
            flicker = 1.0 + random.uniform(-light.flicker, light.flicker) if light.flicker > 0 else 1.0
            for i in range(r, 0, -4):
                t = 1 - i / r
                alpha = int(255 * light.intensity * flicker * t)
                pygame.draw.circle(self.darkness_surface, (light.color.r, light.color.g, light.color.b, min(255, alpha)),
                                  (int(sp.x), int(sp.y)), i)
        surface.blit(self.darkness_surface, (0, 0), special_flags=pygame.BLEND_RGBA_MULT)


# ---------------------------------------------------------------------------
# Main Renderer
# ---------------------------------------------------------------------------

class Renderer:
    """Main rendering coordinator."""
    def __init__(self, surface: Any, camera: Camera):
        self.surface = surface
        self.camera = camera
        self.layers = LayerManager()
        self.shaders: list[Shader] = []
        self.lighting: Optional[LightingSystem] = None
        self.draw_calls = 0
        self._renderables: list = []  # sorted by layer order

    def clear(self, color: Optional[Color] = None):
        if not HAS_PYGAME: return
        bg = color or Color(40, 44, 52)
        self.surface.fill(bg.to_rgb())

    def submit(self, renderable):
        self._renderables.append(renderable)

    def flush(self):
        self.draw_calls = 0
        # Sort by layer order
        def get_order(r):
            layer_name = getattr(r, 'layer', 'entity')
            z = getattr(r, 'z_offset', 0.0)
            return (self.layers.get_order(layer_name), z)
        self._renderables.sort(key=get_order)
        for r in self._renderables:
            if hasattr(r, 'render'):
                try:
                    r.render(self.surface, self.camera)
                    self.draw_calls += 1
                except Exception as e:
                    import sys
                    print(f"[Renderer] render error: {e}", file=sys.stderr)
        self._renderables.clear()
        # Lighting pass
        if self.lighting:
            self.lighting.render(self.surface, self.camera)
        # Post-processing shaders
        for shader in self.shaders:
            if shader.enabled:
                self.surface = shader.apply(self.surface)

    def add_shader(self, shader: Shader):
        self.shaders.append(shader)


__all__ = [
    "LayerManager", "Camera", "Sprite", "Animation", "Animator",
    "Tilemap", "ParticleConfig", "Particle", "ParticleSystem",
    "Text", "Primitive", "Shader", "GrayscaleShader", "VignetteShader",
    "Light", "LightingSystem", "Renderer",
]
