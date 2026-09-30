"""
lapia-engine :: sprite_kit
Sprite-sheet slicing + animation state machines for the Lapia engine.

Works on desktop (real pygame) and in the browser studio (lapia_shim) —
it only uses Surface.blit-style calls through the engine API.
"""
import math


class Animation:
    """A named sequence of frames from a sprite sheet."""

    def __init__(self, name, frames, fps=10, loop=True):
        self.name = name
        self.frames = frames          # list of (x, y, w, h) sheet rects
        self.fps = max(0.1, fps)
        self.loop = loop
        self.t = 0.0
        self.index = 0
        self.finished = False

    def update(self, dt):
        if self.finished:
            return
        self.t += dt
        step = 1.0 / self.fps
        while self.t >= step:
            self.t -= step
            self.index += 1
            if self.index >= len(self.frames):
                if self.loop:
                    self.index = 0
                else:
                    self.index = len(self.frames) - 1
                    self.finished = True

    def rect(self):
        return self.frames[self.index]


class SpriteAnimator:
    """Attach to an entity: manages named animations on one sprite sheet."""

    def __init__(self, sheet_path, loader=None):
        # loader: callable(path) -> Surface (e.g. lapia_shim.load_image)
        load = loader or (lambda p: _default_load(p))
        self.sheet = load(sheet_path)
        self.animations = {}
        self.current = None

    def add(self, name, frames, fps=10, loop=True):
        self.animations[name] = Animation(name, frames, fps, loop)
        if self.current is None:
            self.current = name

    def play(self, name, restart=False):
        if name not in self.animations:
            raise KeyError(f"Animation '{name}' not added")
        if restart or self.current != name:
            self.current = name
            self.animations[name].t = 0.0
            self.animations[name].index = 0
            self.animations[name].finished = False

    def update(self, dt):
        if self.current:
            self.animations[self.current].update(dt)

    def blit_to(self, renderer, position):
        """Draw the current frame centered at position (Vector2)."""
        anim = self.animations[self.current]
        fx, fy, fw, fh = anim.rect()
        # Desktop pygame path:
        try:
            subsurf = self.sheet.subsurface((fx, fy, fw, fh))
            renderer.blit_centered(subsurf, position)
        except Exception:
            # Browser shim fallback: draw a colored rect placeholder
            renderer.fill_rect(position, (fw, fh), (120, 200, 250))


def slice_grid(sheet_w, sheet_h, cell_w, cell_h, count=None):
    """Slice a sheet into grid rects; returns list of (x, y, w, h)."""
    rects = []
    for y in range(0, sheet_h - cell_h + 1, cell_h):
        for x in range(0, sheet_w - cell_w + 1, cell_w):
            rects.append((x, y, cell_w, cell_h))
            if count and len(rects) >= count:
                return rects
    return rects


def _default_load(path):
    try:
        import pygame
        return pygame.image.load(path).convert_alpha()
    except Exception as e:  # pragma: no cover
        raise RuntimeError(f"sprite_kit: provide a loader or install pygame ({e})")
