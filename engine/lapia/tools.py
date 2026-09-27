"""Developer tools: debug overlay, profiler, dev console, asset pipeline."""

from __future__ import annotations

import time
import sys
import os
import json
from dataclasses import dataclass, field
from typing import Optional, Callable, Any
from collections import deque

try:
    import pygame
    HAS_PYGAME = True
except ImportError:
    HAS_PYGAME = False
    pygame = None

from .core import Vector2, Color, Clock


class Profiler:
    """Frame profiler for measuring performance."""
    def __init__(self, max_samples: int = 240):
        self.max_samples = max_samples
        self.sections: dict[str, deque] = {}
        self.current_section: Optional[str] = None
        self._start_time: float = 0.0
        self.frame_times: deque = deque(maxlen=max_samples)
        self._frame_start: float = 0.0

    def begin_frame(self):
        self._frame_start = time.perf_counter()

    def end_frame(self):
        dt = time.perf_counter() - self._frame_start
        self.frame_times.append(dt * 1000.0)  # ms

    def begin(self, section: str):
        if self.current_section:
            self.end()
        self.current_section = section
        self._start_time = time.perf_counter()

    def end(self):
        if not self.current_section: return
        elapsed = (time.perf_counter() - self._start_time) * 1000.0
        if self.current_section not in self.sections:
            self.sections[self.current_section] = deque(maxlen=self.max_samples)
        self.sections[self.current_section].append(elapsed)
        self.current_section = None

    @property
    def frame_time_ms(self) -> float:
        return sum(self.frame_times) / len(self.frame_times) if self.frame_times else 0.0

    @property
    def fps(self) -> float:
        return 1000.0 / self.frame_time_ms if self.frame_time_ms > 0 else 0.0

    def section_time_ms(self, section: str) -> float:
        samples = self.sections.get(section, deque())
        return sum(samples) / len(samples) if samples else 0.0

    def report(self) -> str:
        lines = [f"FPS: {self.fps:.1f} | Frame: {self.frame_time_ms:.2f}ms"]
        for section, samples in sorted(self.sections.items()):
            if samples:
                avg = sum(samples) / len(samples)
                lines.append(f"  {section}: {avg:.2f}ms")
        return "\n".join(lines)


class DebugOverlay:
    """On-screen debug overlay showing FPS, draw calls, entity count, etc."""
    def __init__(self, font_name: str = "Arial", font_size: int = 14):
        self.visible = False
        self.font_name = font_name
        self.font_size = font_size
        self._font = None
        if HAS_PYGAME:
            try: self._font = pygame.font.SysFont(font_name, font_size)
            except Exception: self._font = pygame.font.Font(None, font_size)
        self.lines: list[str] = []
        self.position = Vector2(10, 10)
        self.background_alpha = 180
        self.show_physics = False
        self.show_bounds = False
        self.show_grid = False
        self.grid_size = 32
        self.stats: dict[str, Any] = {}

    def set_stat(self, key: str, value: Any):
        self.stats[key] = value

    def clear_stats(self):
        self.stats.clear()

    def render(self, surface: Any, profiler: Optional[Profiler] = None):
        if not self.visible or not HAS_PYGAME or self._font is None: return
        self.lines.clear()
        if profiler:
            self.lines.append(f"FPS: {profiler.fps:.1f}")
            self.lines.append(f"Frame: {profiler.frame_time_ms:.2f}ms")
        for k, v in self.stats.items():
            self.lines.append(f"{k}: {v}")
        if profiler:
            for section in sorted(profiler.sections.keys()):
                self.lines.append(f"  {section}: {profiler.section_time_ms(section):.2f}ms")

        # Render background
        line_height = self.font_size + 2
        max_width = max(self._font.size(l)[0] for l in self.lines) if self.lines else 0
        bg_w = max_width + 20
        bg_h = len(self.lines) * line_height + 12
        bg = pygame.Surface((bg_w, bg_h), pygame.SRCALPHA)
        bg.fill((0, 0, 0, self.background_alpha))
        surface.blit(bg, (self.position.x, self.position.y))
        # Render text
        for i, line in enumerate(self.lines):
            try:
                text_surf = self._font.render(line, True, (255, 255, 255))
                surface.blit(text_surf, (self.position.x + 10, self.position.y + 6 + i * line_height))
            except Exception:
                pass

    def draw_grid(self, surface: Any, camera_offset: Vector2, viewport: tuple[int, int]):
        if not self.show_grid or not HAS_PYGAME: return
        gs = self.grid_size
        off_x = int(camera_offset.x) % gs
        off_y = int(camera_offset.y) % gs
        col = (60, 60, 80)
        for x in range(-off_x, viewport[0] + gs, gs):
            pygame.draw.line(surface, col, (x, 0), (x, viewport[1]), 1)
        for y in range(-off_y, viewport[1] + gs, gs):
            pygame.draw.line(surface, col, (0, y), (viewport[0], y), 1)

    def draw_bounds(self, surface: Any, entities: list, camera):
        if not self.show_bounds or not HAS_PYGAME: return
        for e in entities:
            sprite = getattr(e, 'sprite', None) or (e.components.get(type(e.components.get(list(e.components.keys())[0]))) if hasattr(e, 'components') else None)
            # Generic bounds
            if hasattr(e, 'position') and hasattr(e, 'width'):
                sp = camera.world_to_screen(e.position)
                w = int(getattr(e, 'width', 32) * camera.zoom)
                h = int(getattr(e, 'height', 32) * camera.zoom)
                rect = pygame.Rect(int(sp.x - w/2), int(sp.y - h/2), w, h)
                pygame.draw.rect(surface, (255, 0, 0), rect, 1)


class Console:
    """Developer console with command execution."""
    def __init__(self):
        self.visible = False
        self.lines: list[str] = []
        self.input_buffer = ""
        self.history: list[str] = []
        self.history_index = -1
        self.commands: dict[str, Callable] = {}
        self.max_lines = 50
        self.cursor_blink = 0.0
        self._font = None
        if HAS_PYGAME:
            try: self._font = pygame.font.SysFont("Consolas", 14)
            except Exception: self._font = pygame.font.Font(None, 14)
        self.register('help', self._cmd_help)
        self.register('clear', self._cmd_clear)

    def register(self, name: str, handler: Callable):
        self.commands[name] = handler

    def log(self, message: str):
        self.lines.append(message)
        if len(self.lines) > self.max_lines:
            self.lines.pop(0)

    def execute(self, command: str):
        self.log(f"> {command}")
        self.history.insert(0, command)
        if len(self.history) > 50:
            self.history.pop()
        parts = command.strip().split()
        if not parts: return
        cmd = parts[0]
        args = parts[1:]
        if cmd in self.commands:
            try:
                result = self.commands[cmd](*args)
                if result: self.log(str(result))
            except Exception as e:
                self.log(f"Error: {e}")
        else:
            self.log(f"Unknown command: {cmd}. Type 'help' for available commands.")

    def _cmd_help(self):
        return f"Available commands: {', '.join(sorted(self.commands.keys()))}"

    def _cmd_clear(self):
        self.lines.clear()

    def handle_event(self, event) -> bool:
        """Returns True if the event was consumed."""
        if not HAS_PYGAME: return False
        if event.type == pygame.KEYDOWN:
            if event.key == pygame.K_BACKQUOTE:
                self.visible = not self.visible
                return True
            if not self.visible: return False
            if event.key == pygame.K_RETURN:
                self.execute(self.input_buffer)
                self.input_buffer = ""
            elif event.key == pygame.K_BACKSPACE:
                self.input_buffer = self.input_buffer[:-1]
            elif event.key == pygame.K_UP and self.history:
                self.history_index = min(self.history_index + 1, len(self.history) - 1)
                if self.history_index >= 0:
                    self.input_buffer = self.history[self.history_index]
            elif event.key == pygame.K_DOWN and self.history:
                self.history_index = max(self.history_index - 1, -1)
                if self.history_index == -1:
                    self.input_buffer = ""
                else:
                    self.input_buffer = self.history[self.history_index]
            elif event.key == pygame.K_ESCAPE:
                self.visible = False
            elif hasattr(event, 'unicode') and event.unicode and event.unicode.isprintable():
                self.input_buffer += event.unicode
            return True
        return False

    def update(self, dt: float):
        self.cursor_blink = (self.cursor_blink + dt) % 1.0

    def render(self, surface: Any, viewport: tuple[int, int]):
        if not self.visible or not HAS_PYGAME or self._font is None: return
        h = min(300, viewport[1] // 2)
        bg = pygame.Surface((viewport[0], h), pygame.SRCALPHA)
        bg.fill((0, 0, 0, 200))
        surface.blit(bg, (0, 0))
        # Render lines
        y = h - 30
        for line in reversed(self.lines[-20:]):
            text_surf = self._font.render(line, True, (220, 220, 220))
            surface.blit(text_surf, (10, y))
            y -= 16
            if y < 4: break
        # Render input
        prompt = f"> {self.input_buffer}"
        if self.cursor_blink < 0.5:
            prompt += "_"
        input_surf = self._font.render(prompt, True, (255, 255, 100))
        surface.blit(input_surf, (10, h - 20))


class AssetManager:
    """Asset pipeline for loading and caching resources."""
    def __init__(self, base_path: str = "."):
        self.base_path = base_path
        self._cache: dict[str, Any] = {}
        self._atlases: dict[str, dict] = {}

    def load_image(self, path: str, alpha: bool = True) -> Any:
        if not HAS_PYGAME: return None
        full = os.path.join(self.base_path, path)
        if full in self._cache: return self._cache[full]
        try:
            img = pygame.image.load(full)
            if alpha: img = img.convert_alpha()
            else: img = img.convert()
            self._cache[full] = img
            return img
        except Exception as e:
            print(f"[AssetManager] Failed to load {full}: {e}")
            return None

    def load_sound(self, path: str) -> Any:
        if not HAS_PYGAME or not pygame.mixer.get_init(): return None
        full = os.path.join(self.base_path, path)
        if full in self._cache: return self._cache[full]
        try:
            snd = pygame.mixer.Sound(full)
            self._cache[full] = snd
            return snd
        except Exception as e:
            print(f"[AssetManager] Failed to load {full}: {e}")
            return None

    def load_font(self, name: str, size: int) -> Any:
        if not HAS_PYGAME: return None
        key = f"{name}:{size}"
        if key in self._cache: return self._cache[key]
        try:
            font = pygame.font.SysFont(name, size)
            self._cache[key] = font
            return font
        except Exception:
            font = pygame.font.Font(None, size)
            self._cache[key] = font
            return font

    def load_json(self, path: str) -> Any:
        full = os.path.join(self.base_path, path)
        if full in self._cache: return self._cache[full]
        try:
            with open(full, 'r') as f:
                data = json.load(f)
            self._cache[full] = data
            return data
        except Exception as e:
            print(f"[AssetManager] Failed to load {full}: {e}")
            return None

    def load_atlas(self, name: str, path: str, tile_size: int = 32, columns: int = 0):
        """Load a sprite atlas and slice it into individual tiles."""
        img = self.load_image(path)
        if img is None: return
        cols = columns or (img.get_width() // tile_size)
        rows = img.get_height() // tile_size
        tiles: list = []
        for r in range(rows):
            for c in range(cols):
                rect = pygame.Rect(c * tile_size, r * tile_size, tile_size, tile_size)
                tile = pygame.Surface((tile_size, tile_size), pygame.SRCALPHA)
                tile.blit(img, (0, 0), rect)
                tiles.append(tile)
        self._atlases[name] = {'tiles': tiles, 'tile_size': tile_size, 'columns': cols, 'rows': rows}
        return self._atlases[name]

    def get_atlas_tile(self, atlas_name: str, index: int) -> Any:
        atlas = self._atlases.get(atlas_name)
        if atlas is None: return None
        if 0 <= index < len(atlas['tiles']):
            return atlas['tiles'][index]
        return None

    def clear_cache(self):
        self._cache.clear()

    def cache_size(self) -> int:
        return len(self._cache)


class Inspector:
    """Runtime object inspector for debugging entities."""
    def __init__(self):
        self.target: Optional[Any] = None
        self.visible = False
        self.expanded: dict[str, bool] = {}

    def inspect(self, obj: Any):
        self.target = obj
        self.visible = True

    def render(self, surface: Any, viewport: tuple[int, int], font: Any = None):
        if not self.visible or not self.target or not HAS_PYGAME: return
        if font is None:
            try: font = pygame.font.SysFont("Consolas", 12)
            except Exception: font = pygame.font.Font(None, 12)
        # Render panel on right side
        w = 280
        h = viewport[1]
        bg = pygame.Surface((w, h), pygame.SRCALPHA)
        bg.fill((0, 0, 0, 200))
        surface.blit(bg, (viewport[0] - w, 0))
        # Title
        title = f"Inspector: {self.target.__class__.__name__}"
        title_surf = font.render(title, True, (255, 255, 100))
        surface.blit(title_surf, (viewport[0] - w + 10, 10))
        # Attributes
        y = 30
        attrs = []
        if hasattr(self.target, '__dict__'):
            for k, v in vars(self.target).items():
                if not k.startswith('_'):
                    attrs.append((k, v))
        for k, v in attrs[:30]:
            try:
                val_str = str(v)
                if len(val_str) > 30: val_str = val_str[:30] + "..."
                line = f"{k}: {val_str}"
                line_surf = font.render(line, True, (220, 220, 220))
                surface.blit(line_surf, (viewport[0] - w + 10, y))
                y += 16
                if y > h - 20: break
            except Exception:
                pass


__all__ = [
    "Profiler", "DebugOverlay", "Console", "AssetManager", "Inspector",
]
