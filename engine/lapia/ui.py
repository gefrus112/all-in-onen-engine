"""UI widgets: buttons, labels, panels, layouts, theming."""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Optional, Callable, Any
from enum import Enum

try:
    import pygame
    HAS_PYGAME = True
except ImportError:
    HAS_PYGAME = False
    pygame = None

from .core import Vector2, Color, Math
from .rendering import Renderer, Camera, Text, Sprite


class Anchor(Enum):
    TOP_LEFT = "top_left"
    TOP_CENTER = "top_center"
    TOP_RIGHT = "top_right"
    MIDDLE_LEFT = "middle_left"
    CENTER = "center"
    MIDDLE_RIGHT = "middle_right"
    BOTTOM_LEFT = "bottom_left"
    BOTTOM_CENTER = "bottom_center"
    BOTTOM_RIGHT = "bottom_right"


@dataclass
class Theme:
    """UI theme with colors and fonts."""
    bg: Color = field(default_factory=lambda: Color(30, 34, 42))
    bg_alt: Color = field(default_factory=lambda: Color(40, 44, 56))
    panel: Color = field(default_factory=lambda: Color(50, 56, 70))
    border: Color = field(default_factory=lambda: Color(80, 88, 110))
    text: Color = field(default_factory=lambda: Color(230, 235, 245))
    text_dim: Color = field(default_factory=lambda: Color(160, 170, 190))
    primary: Color = field(default_factory=lambda: Color(80, 160, 230))
    primary_hover: Color = field(default_factory=lambda: Color(100, 180, 250))
    accent: Color = field(default_factory=lambda: Color(240, 180, 80))
    success: Color = field(default_factory=lambda: Color(120, 200, 100))
    warning: Color = field(default_factory=lambda: Color(240, 180, 80))
    error: Color = field(default_factory=lambda: Color(230, 90, 90))
    font_name: str = "Arial"
    font_size: int = 16
    font_size_title: int = 24
    font_size_small: int = 12
    corner_radius: int = 4
    padding: int = 8
    spacing: int = 8


DEFAULT_THEME = Theme()


class Widget:
    """Base UI widget."""
    _id_counter = 0

    def __init__(self, position: Optional[Vector2] = None, size: Optional[Vector2] = None, theme: Optional[Theme] = None):
        Widget._id_counter += 1
        self.id = Widget._id_counter
        self.position = position or Vector2.zero()
        self.size = size or Vector2(100, 32)
        self.anchor = Anchor.TOP_LEFT
        self.theme = theme or DEFAULT_THEME
        self.visible = True
        self.enabled = True
        self.parent: Optional["Widget"] = None
        self.children: list["Widget"] = []
        self.user_data: dict = {}
        self.tag = ""
        self.layer = "ui"

    def add_child(self, widget: "Widget") -> "Widget":
        widget.parent = self
        self.children.append(widget)
        return widget

    def remove_child(self, widget: "Widget"):
        if widget in self.children:
            self.children.remove(widget)
            widget.parent = None

    @property
    def absolute_position(self) -> Vector2:
        if self.parent is None:
            return self.position.copy()
        return self.parent.absolute_position + self.position

    @property
    def bounds(self) -> tuple[float, float, float, float]:
        pos = self.absolute_position
        return (pos.x, pos.y, self.size.x, self.size.y)

    def contains_point(self, point: Vector2) -> bool:
        x, y, w, h = self.bounds
        return x <= point.x <= x + w and y <= point.y <= y + h

    def update(self, dt: float, mouse_pos: Vector2, mouse_pressed: bool):
        if not self.visible or not self.enabled: return
        for child in self.children:
            child.update(dt, mouse_pos, mouse_pressed)
        self.on_update(dt, mouse_pos, mouse_pressed)

    def render(self, surface: Any, camera: Camera):
        if not self.visible: return
        self.on_render(surface, camera)
        for child in self.children:
            child.render(surface, camera)

    def on_update(self, dt: float, mouse_pos: Vector2, mouse_pressed: bool): pass
    def on_render(self, surface: Any, camera: Camera): pass
    def on_click(self): pass
    def on_hover(self): pass


class Label(Widget):
    """Text label widget."""
    def __init__(self, text: str = "", position: Optional[Vector2] = None, size: Optional[Vector2] = None,
                 theme: Optional[Theme] = None, font_size: Optional[int] = None):
        super().__init__(position, size, theme)
        self.text = text
        self.font_size = font_size or self.theme.font_size
        self.color = self.theme.text
        self.alignment = "left"
        self._text_obj: Optional[Text] = None

    def set_text(self, t: str):
        self.text = t
        self._text_obj = None

    def on_render(self, surface, camera):
        if not HAS_PYGAME or not self.text: return
        try:
            font = pygame.font.SysFont(self.theme.font_name, self.font_size)
            text_surf = font.render(self.text, True, self.color.to_rgb())
            rect = text_surf.get_rect()
            pos = self.absolute_position
            if self.alignment == "center":
                rect.center = (int(pos.x + self.size.x/2), int(pos.y + self.size.y/2))
            elif self.alignment == "right":
                rect.topright = (int(pos.x + self.size.x), int(pos.y))
            else:
                rect.topleft = (int(pos.x), int(pos.y))
            surface.blit(text_surf, rect)
        except Exception:
            pass


class Button(Widget):
    """Clickable button widget."""
    def __init__(self, text: str = "Button", position: Optional[Vector2] = None,
                 size: Optional[Vector2] = None, theme: Optional[Theme] = None, on_click: Optional[Callable] = None):
        super().__init__(position, size or Vector2(120, 36), theme)
        self.text = text
        self.on_click_callback = on_click
        self.color = self.theme.primary
        self.hover_color = self.theme.primary_hover
        self.text_color = self.theme.text
        self._hovered = False
        self._pressed = False
        self._was_pressed = False
        self.enabled = True
        self.border_radius = 4

    def on_update(self, dt: float, mouse_pos: Vector2, mouse_pressed: bool):
        self._hovered = self.enabled and self.contains_point(mouse_pos)
        self._pressed = self._hovered and mouse_pressed
        if self._was_pressed and not mouse_pressed and self._hovered:
            if self.on_click_callback:
                self.on_click_callback()
            self.on_click()
        self._was_pressed = self._pressed

    def on_render(self, surface, camera):
        if not HAS_PYGAME: return
        pos = self.absolute_position
        w, h = int(self.size.x), int(self.size.y)
        rect = pygame.Rect(int(pos.x), int(pos.y), w, h)
        col = self.hover_color if self._hovered else self.color
        if not self.enabled:
            col = self.theme.text_dim
        pygame.draw.rect(surface, col.to_rgb(), rect, border_radius=self.border_radius)
        pygame.draw.rect(surface, self.theme.border.to_rgb(), rect, 1, border_radius=self.border_radius)
        try:
            font = pygame.font.SysFont(self.theme.font_name, self.theme.font_size)
            text_surf = font.render(self.text, True, self.text_color.to_rgb())
            text_rect = text_surf.get_rect(center=rect.center)
            surface.blit(text_surf, text_rect)
        except Exception:
            pass


class Panel(Widget):
    """Container panel with background and optional border."""
    def __init__(self, position: Optional[Vector2] = None, size: Optional[Vector2] = None,
                 theme: Optional[Theme] = None, title: str = ""):
        super().__init__(position, size, theme)
        self.title = title
        self.background_color = self.theme.panel
        self.border_color = self.theme.border
        self.show_title_bar = bool(title)
        self.title_height = 28
        self.padding = 8

    def on_render(self, surface, camera):
        if not HAS_PYGAME: return
        pos = self.absolute_position
        rect = pygame.Rect(int(pos.x), int(pos.y), int(self.size.x), int(self.size.y))
        pygame.draw.rect(surface, self.background_color.to_rgb(), rect, border_radius=self.theme.corner_radius)
        pygame.draw.rect(surface, self.border_color.to_rgb(), rect, 1, border_radius=self.theme.corner_radius)
        if self.show_title_bar:
            title_rect = pygame.Rect(rect.x, rect.y, rect.width, self.title_height)
            pygame.draw.rect(surface, self.theme.bg_alt.to_rgb(), title_rect, border_radius=self.theme.corner_radius)
            pygame.draw.line(surface, self.theme.border.to_rgb(), (rect.x, rect.y + self.title_height), (rect.right, rect.y + self.title_height), 1)
            try:
                font = pygame.font.SysFont(self.theme.font_name, self.theme.font_size)
                title_surf = font.render(self.title, True, self.theme.text.to_rgb())
                surface.blit(title_surf, (rect.x + 10, rect.y + 6))
            except Exception:
                pass


class Image(Widget):
    """Image widget that displays a texture."""
    def __init__(self, image: Any = None, position: Optional[Vector2] = None, size: Optional[Vector2] = None):
        super().__init__(position, size)
        self.image = image

    def on_render(self, surface, camera):
        if not HAS_PYGAME or self.image is None: return
        pos = self.absolute_position
        if self.size:
            scaled = pygame.transform.scale(self.image, (int(self.size.x), int(self.size.y)))
            surface.blit(scaled, (int(pos.x), int(pos.y)))
        else:
            surface.blit(self.image, (int(pos.x), int(pos.y)))


class Slider(Widget):
    """Range slider widget."""
    def __init__(self, min_val: float = 0.0, max_val: float = 1.0, value: float = 0.5,
                 position: Optional[Vector2] = None, size: Optional[Vector2] = None, theme: Optional[Theme] = None,
                 on_change: Optional[Callable] = None):
        super().__init__(position, size or Vector2(120, 20), theme)
        self.min = min_val
        self.max = max_val
        self.value = value
        self.on_change_callback = on_change
        self._dragging = False

    @property
    def normalized_value(self) -> float:
        return (self.value - self.min) / (self.max - self.min) if self.max > self.min else 0.0

    def on_update(self, dt: float, mouse_pos: Vector2, mouse_pressed: bool):
        was_dragging = self._dragging
        if self.contains_point(mouse_pos) and mouse_pressed:
            self._dragging = True
        elif not mouse_pressed:
            self._dragging = False
        if self._dragging:
            pos = self.absolute_position
            rel_x = (mouse_pos.x - pos.x) / self.size.x
            rel_x = Math.clamp(rel_x, 0.0, 1.0)
            new_val = self.min + rel_x * (self.max - self.min)
            if new_val != self.value:
                self.value = new_val
                if self.on_change_callback:
                    self.on_change_callback(self.value)

    def on_render(self, surface, camera):
        if not HAS_PYGAME: return
        pos = self.absolute_position
        track_rect = pygame.Rect(int(pos.x), int(pos.y + self.size.y/2 - 2), int(self.size.x), 4)
        pygame.draw.rect(surface, self.theme.bg_alt.to_rgb(), track_rect, border_radius=2)
        fill_rect = pygame.Rect(track_rect.x, track_rect.y, int(track_rect.width * self.normalized_value), 4)
        pygame.draw.rect(surface, self.theme.primary.to_rgb(), fill_rect, border_radius=2)
        handle_x = int(pos.x + self.size.x * self.normalized_value)
        handle_y = int(pos.y + self.size.y/2)
        pygame.draw.circle(surface, self.theme.text.to_rgb(), (handle_x, handle_y), 8)
        pygame.draw.circle(surface, self.theme.primary.to_rgb(), (handle_x, handle_y), 6)


class ProgressBar(Widget):
    """Progress bar widget."""
    def __init__(self, position: Optional[Vector2] = None, size: Optional[Vector2] = None,
                 theme: Optional[Theme] = None, value: float = 0.0):
        super().__init__(position, size or Vector2(200, 16), theme)
        self.value = Math.clamp(value, 0.0, 1.0)
        self.fill_color = self.theme.primary
        self.show_text = False

    def on_render(self, surface, camera):
        if not HAS_PYGAME: return
        pos = self.absolute_position
        rect = pygame.Rect(int(pos.x), int(pos.y), int(self.size.x), int(self.size.y))
        pygame.draw.rect(surface, self.theme.bg_alt.to_rgb(), rect, border_radius=2)
        fill_rect = pygame.Rect(rect.x, rect.y, int(rect.width * self.value), rect.height)
        pygame.draw.rect(surface, self.fill_color.to_rgb(), fill_rect, border_radius=2)
        pygame.draw.rect(surface, self.theme.border.to_rgb(), rect, 1, border_radius=2)
        if self.show_text:
            try:
                font = pygame.font.SysFont(self.theme.font_name, self.theme.font_size_small)
                txt = f"{int(self.value * 100)}%"
                text_surf = font.render(txt, True, self.theme.text.to_rgb())
                text_rect = text_surf.get_rect(center=rect.center)
                surface.blit(text_surf, text_rect)
            except Exception:
                pass


class Checkbox(Widget):
    """Checkbox widget."""
    def __init__(self, checked: bool = False, position: Optional[Vector2] = None,
                 size: Optional[Vector2] = None, theme: Optional[Theme] = None,
                 label: str = "", on_change: Optional[Callable] = None):
        super().__init__(position, size or Vector2(20, 20), theme)
        self.checked = checked
        self.label = label
        self.on_change_callback = on_change
        self._was_pressed = False

    def on_update(self, dt: float, mouse_pos: Vector2, mouse_pressed: bool):
        if self._was_pressed and not mouse_pressed and self.contains_point(mouse_pos):
            self.checked = not self.checked
            if self.on_change_callback:
                self.on_change_callback(self.checked)
        self._was_pressed = mouse_pressed and self.contains_point(mouse_pos)

    def on_render(self, surface, camera):
        if not HAS_PYGAME: return
        pos = self.absolute_position
        rect = pygame.Rect(int(pos.x), int(pos.y), int(self.size.x), int(self.size.y))
        pygame.draw.rect(surface, self.theme.bg_alt.to_rgb(), rect, border_radius=2)
        pygame.draw.rect(surface, self.theme.border.to_rgb(), rect, 1, border_radius=2)
        if self.checked:
            inset = 4
            fill = pygame.Rect(rect.x + inset, rect.y + inset, rect.width - inset*2, rect.height - inset*2)
            pygame.draw.rect(surface, self.theme.primary.to_rgb(), fill, border_radius=2)
        if self.label:
            try:
                font = pygame.font.SysFont(self.theme.font_name, self.theme.font_size)
                text_surf = font.render(self.label, True, self.theme.text.to_rgb())
                surface.blit(text_surf, (rect.right + 8, rect.y + 2))
            except Exception:
                pass


class Layout:
    """Layout helpers for arranging widgets."""
    @staticmethod
    def vertical(widgets: list[Widget], start: Vector2, spacing: int = 8, padding: int = 8):
        y = start.y
        for w in widgets:
            w.position = Vector2(start.x + padding, y + padding)
            y += w.size.y + spacing

    @staticmethod
    def horizontal(widgets: list[Widget], start: Vector2, spacing: int = 8, padding: int = 8):
        x = start.x
        for w in widgets:
            w.position = Vector2(x + padding, start.y + padding)
            x += w.size.x + spacing

    @staticmethod
    def grid(widgets: list[Widget], start: Vector2, cols: int, cell_size: Vector2,
             spacing_x: int = 8, spacing_y: int = 8, padding: int = 8):
        for i, w in enumerate(widgets):
            row = i // cols
            col = i % cols
            w.position = Vector2(
                start.x + padding + col * (cell_size.x + spacing_x),
                start.y + padding + row * (cell_size.y + spacing_y),
            )
            w.size = cell_size


__all__ = [
    "Theme", "DEFAULT_THEME", "Anchor", "Widget", "Label", "Button",
    "Panel", "Image", "Slider", "ProgressBar", "Checkbox", "Layout",
]
