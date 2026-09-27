"use client";

/**
 * Pyodide runner + Lapia canvas shim.
 *
 * Strategy:
 * 1. Load Pyodide from CDN (single bundle).
 * 2. Inject a `lapia_shim` Python module that uses JS bridge calls to draw
 *    on a Canvas2D element in the browser. The shim mirrors the Python
 *    engine's API (Game, Scene, Sprite, Vector2, Color, Math, InputManager,
 *    Camera, Renderer, Text) so user code is portable to the real engine.
 * 3. Run the user's main.py code inside the Pyodide runtime.
 * 4. The host (PreviewPane) drives the game loop via requestAnimationFrame.
 */

const PYODIDE_VERSION = "0.26.2";
const PYODIDE_BASE = `https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full/`;

export type ConsoleSink = (
  type: "info" | "error" | "warn" | "success" | "debug" | "system",
  text: string
) => void;

let pyodidePromise: Promise<any> | null = null;

declare global {
  interface Window {
    loadPyodide?: (opts: { indexURL: string }) => Promise<any>;
    _lapiaCanvas?: HTMLCanvasElement | null;
    _lapiaCtx?: CanvasRenderingContext2D | null;
    _lapiaInputState?: {
      keys: Set<number>;
      mouseButtons: Set<number>;
      mouseX: number;
      mouseY: number;
    };
    _lapiaGame?: any;
    _lapiaGameReady?: boolean;
    _lapiaLog?: ConsoleSink;
  }
}

export async function loadPyodide(onLog?: ConsoleSink): Promise<any> {
  if (pyodidePromise) return pyodidePromise;
  pyodidePromise = (async () => {
    onLog?.("system", "Loading Pyodide runtime (~10MB, one-time)...");
    if (!window.loadPyodide) {
      await new Promise<void>((resolve, reject) => {
        const script = document.createElement("script");
        script.src = `${PYODIDE_BASE}pyodide.js`;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error("Failed to load Pyodide script"));
        document.head.appendChild(script);
      });
    }
    const pyodide = await window.loadPyodide!({ indexURL: PYODIDE_BASE });
    onLog?.("system", "Pyodide loaded. Installing NumPy...");
    try {
      await pyodide.loadPackage("numpy");
      onLog?.("success", "NumPy ready.");
    } catch (e) {
      onLog?.("warn", `NumPy failed to load: ${e}`);
    }
    onLog?.("system", "Injecting lapia_shim module...");
    injectLapiaShim(pyodide);
    onLog?.("success", "Lapia runtime ready.");
    return pyodide;
  })();
  return pyodidePromise;
}

function injectLapiaShim(pyodide: any) {
  try {
    pyodide.FS.mkdirTree("/home/pyodide/lapia_shim");
    pyodide.FS.writeFile(
      "/home/pyodide/lapia_shim/__init__.py",
      LAPIA_SHIM_CODE
    );
    pyodide.runPython(`
import sys
sys.path.insert(0, '/home/pyodide')
`);
  } catch (e) {
    console.error("Lapia shim injection failed:", e);
  }
}

const LAPIA_SHIM_CODE = `
"""
Lapia engine shim for in-browser preview.

Mirrors the Python lapia engine API (Game, Scene, Sprite, Vector2, Color,
Math, InputManager, Camera, Renderer, Text) but renders to an HTML canvas
via JS bridge calls. User code that runs here is portable to the real
Python lapia engine with no changes (the API is identical).
"""
import math
import random
import time
import sys

import js
from js import window as _win


class Vector2:
    __slots__ = ('x', 'y')
    def __init__(self, x=0.0, y=0.0):
        self.x = float(x); self.y = float(y)
    @classmethod
    def zero(cls): return cls(0, 0)
    @classmethod
    def one(cls): return cls(1, 1)
    @classmethod
    def up(cls): return cls(0, -1)
    @classmethod
    def down(cls): return cls(0, 1)
    @classmethod
    def left(cls): return cls(-1, 0)
    @classmethod
    def right(cls): return cls(1, 0)
    @classmethod
    def random(cls, mag=1.0):
        a = random.uniform(0, math.tau)
        return cls(math.cos(a)*mag, math.sin(a)*mag)
    def __add__(self, o): return Vector2(self.x+o.x, self.y+o.y)
    def __sub__(self, o): return Vector2(self.x-o.x, self.y-o.y)
    def __mul__(self, s):
        if isinstance(s, (int, float)): return Vector2(self.x*s, self.y*s)
        return Vector2(self.x*s.x, self.y*s.y)
    def __rmul__(self, s): return self.__mul__(s)
    def __truediv__(self, s):
        if isinstance(s, (int, float)): return Vector2(self.x/s, self.y/s)
        return Vector2(self.x/s.x, self.y/s.y)
    def __neg__(self): return Vector2(-self.x, -self.y)
    def __eq__(self, o): return isinstance(o, Vector2) and self.x == o.x and self.y == o.y
    def __hash__(self): return hash((self.x, self.y))
    def __iter__(self): return iter((self.x, self.y))
    def __getitem__(self, i): return (self.x, self.y)[i]
    def __len__(self): return 2
    def __repr__(self): return f"Vector2({self.x:.3f}, {self.y:.3f})"
    @property
    def magnitude(self): return math.hypot(self.x, self.y)
    @property
    def sqr_magnitude(self): return self.x*self.x + self.y*self.y
    @property
    def normalized(self):
        m = self.magnitude
        return Vector2(self.x/m, self.y/m) if m > 1e-9 else Vector2.zero()
    @property
    def angle(self): return math.atan2(self.y, self.x)
    @property
    def angle_deg(self): return math.degrees(self.angle)
    def dot(self, o): return self.x*o.x + self.y*o.y
    def cross(self, o): return self.x*o.y - self.y*o.x
    def distance_to(self, o): return (o - self).magnitude
    def lerp(self, o, t): return Vector2(self.x + (o.x-self.x)*t, self.y + (o.y-self.y)*t)
    def rotate(self, a):
        c, s = math.cos(a), math.sin(a)
        return Vector2(self.x*c - self.y*s, self.x*s + self.y*c)
    def copy(self): return Vector2(self.x, self.y)
    def to_tuple(self): return (self.x, self.y)


class Color:
    def __init__(self, r=255, g=255, b=255, a=255):
        self.r = int(r); self.g = int(g); self.b = int(b); self.a = int(a)
    def to_tuple(self): return (self.r, self.g, self.b, self.a)
    def to_rgb(self): return (self.r, self.g, self.b)
    def to_hex(self): return f"#{self.r:02x}{self.g:02x}{self.b:02x}"
    def to_rgba_str(self): return f"rgba({self.r},{self.g},{self.b},{self.a/255})"
    @classmethod
    def from_hex(cls, s):
        s = s.lstrip('#')
        if len(s) == 3: s = ''.join(c*2 for c in s)
        return cls(int(s[0:2], 16), int(s[2:4], 16), int(s[4:6], 16))
    @classmethod
    def lerp(cls, a, b, t):
        return cls(int(a.r+(b.r-a.r)*t), int(a.g+(b.g-a.g)*t), int(a.b+(b.b-a.b)*t), int(a.a+(b.a-a.a)*t))
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
    def yellow(cls): return cls(255, 255, 0)
    @classmethod
    def magenta(cls): return cls(255, 0, 255)
    @classmethod
    def transparent(cls): return cls(0, 0, 0, 0)


class Math:
    PI = math.pi
    TAU = math.tau
    DEG2RAD = math.pi / 180.0
    RAD2DEG = 180.0 / math.pi
    @staticmethod
    def clamp(v, lo, hi): return max(lo, min(hi, v))
    @staticmethod
    def lerp(a, b, t): return a + (b - a) * t
    @staticmethod
    def lerp_angle(a, b, t):
        diff = ((b - a + math.pi) % math.tau) - math.pi
        return a + diff * t
    @staticmethod
    def move_toward(current, target, max_delta):
        if abs(target - current) <= max_delta: return target
        return current + math.copysign(max_delta, target - current)
    @staticmethod
    def sign(v): return (v > 0) - (v < 0)
    @staticmethod
    def random_range(lo, hi): return random.uniform(lo, hi)
    @staticmethod
    def random_int(lo, hi): return random.randint(lo, hi)
    @staticmethod
    def random_choice(seq): return random.choice(seq)
    @staticmethod
    def random_seed(seed): random.seed(seed)


# --- Keyboard key code mapping ---
_KEY_MAP = {
    'a': 65, 'b': 66, 'c': 67, 'd': 68, 'e': 69, 'f': 70, 'g': 71, 'h': 72,
    'i': 73, 'j': 74, 'k': 75, 'l': 76, 'm': 77, 'n': 78, 'o': 79, 'p': 80,
    'q': 81, 'r': 82, 's': 83, 't': 84, 'u': 85, 'v': 86, 'w': 87, 'x': 88,
    'y': 89, 'z': 90,
    '0': 48, '1': 49, '2': 50, '3': 51, '4': 52, '5': 53, '6': 54, '7': 55,
    '8': 56, '9': 57,
    'space': 32, 'enter': 13, 'return': 13, 'escape': 27, 'esc': 27, 'tab': 9,
    'backspace': 8, 'delete': 46, 'del': 46,
    'up': 38, 'down': 40, 'left': 37, 'right': 39,
    'shift': 16, 'ctrl': 17, 'control': 17, 'alt': 18, 'cmd': 91,
    'f1': 112, 'f2': 113, 'f3': 114, 'f4': 115, 'f5': 116, 'f6': 117,
    'f7': 118, 'f8': 119, 'f9': 120, 'f10': 121, 'f11': 122, 'f12': 123,
}

def _key_name_to_code(name):
    if isinstance(name, int): return name
    return _KEY_MAP.get(str(name).lower().replace(' ', '_'), 0)


class InputManager:
    """Reads keyboard/mouse state from the JS host."""
    def __init__(self):
        self._held = set()
        self._pressed = set()
        self._released = set()
        self._mouse_pos = Vector2.zero()
        self._mouse_buttons_held = {1: False, 2: False, 3: False}
        self._mouse_pressed = {1: False, 2: False, 3: False}
        self._mouse_released = {1: False, 2: False, 3: False}

    def _begin_frame(self):
        """Called by the Game loop each frame: snapshot JS state into per-frame deltas."""
        self._pressed.clear()
        self._released.clear()
        self._mouse_pressed = {1: False, 2: False, 3: False}
        self._mouse_released = {1: False, 2: False, 3: False}
        st = _win._lapiaInputState
        if st is None: return
        # Compute deltas
        current_held = set()
        for k in st.keys:
            current_held.add(int(k))
        # Just pressed = in current but not in previous held
        for k in current_held:
            if k not in self._held:
                self._pressed.add(k)
        for k in self._held:
            if k not in current_held:
                self._released.add(k)
        self._held = current_held
        # Mouse
        self._mouse_pos = Vector2(st.mouseX, st.mouseY)
        mb = set(int(b) for b in st.mouseButtons)
        for btn in (1, 2, 3):
            now = btn in mb
            before = self._mouse_buttons_held.get(btn, False)
            if now and not before:
                self._mouse_pressed[btn] = True
            if not now and before:
                self._mouse_released[btn] = True
            self._mouse_buttons_held[btn] = now

    def key_down(self, name):
        return _key_name_to_code(name) in self._held
    def key_pressed(self, name):
        return _key_name_to_code(name) in self._pressed
    def key_released(self, name):
        return _key_name_to_code(name) in self._released
    def any_key_pressed(self):
        return len(self._pressed) > 0
    @property
    def mouse_position(self): return self._mouse_pos.copy()
    def mouse_down(self, btn=1): return self._mouse_buttons_held.get(btn, False)
    def mouse_pressed(self, btn=1): return self._mouse_pressed.get(btn, False)
    def mouse_released(self, btn=1): return self._mouse_released.get(btn, False)


class Camera:
    def __init__(self, viewport_size=(800, 600)):
        self.position = Vector2.zero()
        self.target = None
        self.viewport = viewport_size
        self.zoom = 1.0
        self.target_zoom = 1.0
        self.follow_lerp = 0.15
        self.follow_offset = Vector2.zero()
        self._shake_amp = 0.0
        self._shake_timer = 0.0
        self._shake_duration = 0.3
        self._shake_offset = Vector2.zero()
        self.bounds = None

    def follow(self, target, lerp=0.15, offset=None):
        self.target = target
        self.follow_lerp = lerp
        self.follow_offset = offset or Vector2.zero()
    def set_bounds(self, x, y, w, h):
        self.bounds = (x, y, w, h)
    def shake(self, amp=8.0, duration=0.3):
        self._shake_amp = max(self._shake_amp, amp)
        self._shake_duration = duration
        self._shake_timer = duration
    def update(self, dt):
        if self.target is not None:
            desired = self.target + self.follow_offset
            self.position = self.position.lerp(
                desired - Vector2(self.viewport[0]/2, self.viewport[1]/2),
                self.follow_lerp
            )
        self.zoom = Math.lerp(self.zoom, self.target_zoom, 0.1)
        if self._shake_timer > 0:
            self._shake_timer -= dt
            t = max(0.0, self._shake_timer / self._shake_duration) if self._shake_duration > 0 else 0
            amp = self._shake_amp * t
            self._shake_offset = Vector2(random.uniform(-amp, amp), random.uniform(-amp, amp))
        else:
            self._shake_offset = Vector2.zero()
        if self.bounds:
            x, y, w, h = self.bounds
            self.position.x = Math.clamp(self.position.x, x, x + w - self.viewport[0])
            self.position.y = Math.clamp(self.position.y, y, y + h - self.viewport[1])
    def world_to_screen(self, world):
        off = self.position + self._shake_offset
        return Vector2((world.x - off.x) * self.zoom, (world.y - off.y) * self.zoom)
    def screen_to_world(self, screen):
        off = self.position + self._shake_offset
        return Vector2(screen.x / self.zoom + off.x, screen.y / self.zoom + off.y)


class Sprite:
    _id_counter = 0
    def __init__(self, image=None, color=None, size=None, layer='entity'):
        Sprite._id_counter += 1
        self.id = Sprite._id_counter
        self.position = Vector2.zero()
        self.origin = Vector2(0.5, 0.5)
        self.scale = Vector2(1, 1)
        self.rotation = 0.0
        self.color = color or Color.white()
        self.alpha = 255
        self.flip_x = False
        self.flip_y = False
        self.visible = True
        self.layer = layer
        self.z_offset = 0.0
        self.image = image
        self._size = size
    @property
    def x(self): return self.position.x
    @x.setter
    def x(self, v): self.position.x = v
    @property
    def y(self): return self.position.y
    @y.setter
    def y(self, v): self.position.y = v
    @property
    def width(self):
        if self._size: return self._size[0]
        if self.image is not None: return 64
        return 32
    @property
    def height(self):
        if self._size: return self._size[1]
        if self.image is not None: return 64
        return 32
    def set_color(self, c): self.color = c
    def set_image(self, img): self.image = img
    def render(self, surface, camera):
        if not self.visible: return
        ctx = _win._lapiaCtx
        if ctx is None: return
        sp = camera.world_to_screen(self.position)
        w = self.width * self.scale.x * camera.zoom
        h = self.height * self.scale.y * camera.zoom
        if w <= 0 or h <= 0: return
        ox = self.origin.x * w
        oy = self.origin.y * h
        x = sp.x - ox
        y = sp.y - oy
        col = self.color
        if self.alpha < 255:
            ctx.fillStyle = f"rgba({col.r},{col.g},{col.b},{self.alpha/255})"
        else:
            ctx.fillStyle = f"rgb({col.r},{col.g},{col.b})"
        # Rotation: use canvas transform
        if abs(self.rotation) > 0.001:
            ctx.save()
            ctx.translate(x + w/2, y + h/2)
            ctx.rotate(self.rotation)
            ctx.fillRect(-w/2, -h/2, w, h)
            ctx.restore()
        else:
            ctx.fillRect(int(x), int(y), int(w), int(h))


class Text:
    def __init__(self, text='', font_name='Arial', size=24, color=None):
        self.text = text
        self.font_name = font_name
        self.size = int(size)
        self.color = color or Color.white()
        self.position = Vector2.zero()
        self.alignment = 'left'
        self.layer = 'ui'
        self.visible = True
    def set_text(self, t): self.text = t
    def render(self, surface, camera):
        if not self.visible or not self.text: return
        ctx = _win._lapiaCtx
        if ctx is None: return
        sp = camera.world_to_screen(self.position)
        col = self.color
        ctx.fillStyle = f"rgba({col.r},{col.g},{col.b},{col.a/255})"
        ctx.font = f"{self.size}px sans-serif"
        if self.alignment == 'center':
            ctx.textAlign = 'center'
            ctx.textBaseline = 'middle'
            ctx.fillText(self.text, sp.x, sp.y)
        elif self.alignment == 'right':
            ctx.textAlign = 'right'
            ctx.textBaseline = 'top'
            ctx.fillText(self.text, sp.x, sp.y)
        else:
            ctx.textAlign = 'left'
            ctx.textBaseline = 'top'
            ctx.fillText(self.text, sp.x, sp.y)


class Renderer:
    def __init__(self, surface, camera):
        self.surface = surface  # not used; we draw via JS ctx directly
        self.camera = camera
        self.draw_calls = 0
    def clear(self, color=None):
        ctx = _win._lapiaCtx
        if ctx is None: return
        bg = color or Color(40, 44, 52)
        ctx.fillStyle = f"rgb({bg.r},{bg.g},{bg.b})"
        ctx.fillRect(0, 0, _win._lapiaCanvas.width, _win._lapiaCanvas.height)
        self.draw_calls = 0
    def submit(self, renderable):
        try:
            renderable.render(self.surface, self.camera)
            self.draw_calls += 1
        except Exception as e:
            print(f"[Renderer] render error: {e}", file=sys.stderr)
    def fill_rect(self, pos, size, color):
        ctx = _win._lapiaCtx
        if ctx is None: return
        sp = self.camera.world_to_screen(pos) if hasattr(pos, 'x') else Vector2(pos[0], pos[1])
        s = size if hasattr(size, 'x') else Vector2(size[0], size[1])
        col = color if hasattr(color, 'to_rgb') else Color(*color)
        ctx.fillStyle = f"rgba({col.r},{col.g},{col.b},{col.a/255})"
        ctx.fillRect(int(sp.x), int(sp.y), int(s.x), int(s.y))
        self.draw_calls += 1
    def fill_circle(self, pos, radius, color):
        ctx = _win._lapiaCtx
        if ctx is None: return
        sp = self.camera.world_to_screen(pos) if hasattr(pos, 'x') else Vector2(pos[0], pos[1])
        col = color if hasattr(color, 'to_rgb') else Color(*color)
        ctx.fillStyle = f"rgba({col.r},{col.g},{col.b},{col.a/255})"
        ctx.beginPath()
        ctx.arc(sp.x, sp.y, max(1, radius), 0, math.tau)
        ctx.fill()
        self.draw_calls += 1
    def draw_text(self, pos, text, color=None, size=20):
        ctx = _win._lapiaCtx
        if ctx is None: return
        sp = self.camera.world_to_screen(pos) if hasattr(pos, 'x') else Vector2(pos[0], pos[1])
        col = color if color and hasattr(color, 'to_rgb') else Color(255, 255, 255)
        ctx.fillStyle = f"rgba({col.r},{col.g},{col.b},{col.a/255})"
        ctx.font = f"{int(size)}px sans-serif"
        ctx.textAlign = 'left'
        ctx.textBaseline = 'top'
        ctx.fillText(str(text), int(sp.x), int(sp.y))
        self.draw_calls += 1
    def draw_line(self, a, b, color, width=1):
        ctx = _win._lapiaCtx
        if ctx is None: return
        sa = self.camera.world_to_screen(a) if hasattr(a, 'x') else Vector2(a[0], a[1])
        sb = self.camera.world_to_screen(b) if hasattr(b, 'x') else Vector2(b[0], b[1])
        col = color if hasattr(color, 'to_rgb') else Color(*color)
        ctx.strokeStyle = f"rgba({col.r},{col.g},{col.b},{col.a/255})"
        ctx.lineWidth = width
        ctx.beginPath()
        ctx.moveTo(sa.x, sa.y)
        ctx.lineTo(sb.x, sb.y)
        ctx.stroke()
        self.draw_calls += 1
    def flush(self): pass


class Scene:
    def __init__(self, name='Scene'):
        self.name = name
        self.camera = Camera((800, 600))
        self.input = None
        self.audio = None
        self.renderer = None
        self.clock = _Clock()
        self.events = []
        self.loaded = False
        self.paused = False
        self.bg_color = Color(40, 44, 52)
        self.time_scale = 1.0
        self.user_data = {}
    def on_load(self): pass
    def on_unload(self): pass
    def on_enter(self): pass
    def on_exit(self): pass
    def on_update(self, dt): pass
    def on_render(self, r): pass
    def on_event(self, e): pass
    def update(self, dt):
        if self.paused: return
        sdt = dt * self.time_scale
        self.clock.tick()
        self.camera.update(sdt)
        self.on_update(sdt)
    def render(self, renderer):
        renderer.clear(self.bg_color)
        renderer.camera = self.camera
        self.on_render(renderer)


class _Clock:
    def __init__(self):
        self._last = time.perf_counter()
        self._elapsed = 0.0
        self._samples = []
    def tick(self):
        now = time.perf_counter()
        dt = now - self._last
        self._last = now
        self._elapsed += dt
        if dt > 0:
            self._samples.append(1.0/dt)
            if len(self._samples) > 60: self._samples.pop(0)
        return dt
    @property
    def elapsed(self): return self._elapsed
    @property
    def fps(self):
        return sum(self._samples)/len(self._samples) if self._samples else 0.0


class Game:
    """Main game class. Sets up the canvas and runs a scene."""
    def __init__(self, title='Lapia Game', size=(800, 600), fps=60, headless=False):
        self.title = title
        self.width = int(size[0])
        self.height = int(size[1])
        self.target_fps = int(fps)
        self.running = False
        self.input = InputManager()
        self.scene = None
        self.clock = _Clock()
        self.renderer = None
        self.camera = Camera((self.width, self.height))
        self._frame_count = 0
        # Make sure canvas matches our size
        canvas = _win._lapiaCanvas
        if canvas is not None:
            canvas.width = self.width
            canvas.height = self.height
        # Tell JS we're ready
        _win._lapiaGame = self
        _win._lapiaGameReady = True

    def run(self, scene):
        self.scene = scene
        scene.input = self.input
        scene.renderer = self.renderer or Renderer(_win._lapiaCanvas, self.camera)
        scene.camera = self.camera
        scene.on_load()
        scene.loaded = True
        scene.on_enter()
        self.running = True
        # Loop is driven by JS via run_frame().

    def run_frame(self, dt):
        """Advance the game one frame. Returns True if still running."""
        if not self.running: return False
        try:
            self.input._begin_frame()
            self.clock.tick()
            self.scene.update(dt)
            self.scene.render(self.scene.renderer)
            self._frame_count += 1
            return True
        except Exception as e:
            import traceback
            print(f"[Game.run_frame] Error: {e}", file=sys.stderr)
            traceback.print_exc(file=sys.stderr)
            self.running = False
            return False

    def stop(self):
        self.running = False
        if self.scene:
            try: self.scene.on_exit()
            except: pass
            try: self.scene.on_unload()
            except: pass
`;

export interface LapiaGameHandle {
  pyodide: any;
  game: any;
  runFrame: (dt: number) => boolean;
  stop: () => void;
}

/**
 * Compile and start a Python game script.
 */
export async function startGame(
  code: string,
  canvas: HTMLCanvasElement,
  onLog: ConsoleSink
): Promise<LapiaGameHandle> {
  const pyodide = await loadPyodide(onLog);

  // Set up canvas (size will be reset by the Game class once it parses user code).
  let ctx = canvas.getContext("2d", { alpha: false });
  if (!ctx) throw new Error("Failed to get 2D context for preview canvas");
  ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = "#1a1b1e";
  ctx.fillRect(0, 0, canvas.width || 800, canvas.height || 600);

  // Try to parse game size from user code so the canvas matches before Game() inits.
  const sizeMatch = code.match(/size\s*=\s*\(\s*(\d+)\s*,\s*(\d+)\s*\)/);
  if (sizeMatch) {
    const w = parseInt(sizeMatch[1], 10);
    const h = parseInt(sizeMatch[2], 10);
    if (w > 0 && w <= 4096 && h > 0 && h <= 4096) {
      canvas.width = w;
      canvas.height = h;
    }
  } else {
    canvas.width = 800;
    canvas.height = 600;
  }

  ctx = canvas.getContext("2d", { alpha: false })!;
  ctx.imageSmoothingEnabled = false;

  // Attach globals
  (window as any)._lapiaCanvas = canvas;
  (window as any)._lapiaCtx = ctx;
  (window as any)._lapiaInputState = {
    keys: new Set<number>(),
    mouseButtons: new Set<number>(),
    mouseX: 0,
    mouseY: 0,
  };
  (window as any)._lapiaLog = onLog;

  // Route Python stdout/stderr to the console sink.
  let lineBuf = "";
  pyodide.setStdout({
    batched: (s: string) => {
      if (s.endsWith("\n")) {
        onLog("info", (lineBuf + s).trimEnd());
        lineBuf = "";
      } else {
        lineBuf += s;
      }
    },
  });
  let errBuf = "";
  pyodide.setStderr({
    batched: (s: string) => {
      if (s.endsWith("\n")) {
        onLog("error", (errBuf + s).trimEnd());
        errBuf = "";
      } else {
        errBuf += s;
      }
    },
  });

  // Reset previous game state
  if ((window as any)._lapiaGame) {
    try { (window as any)._lapiaGame.stop(); } catch {}
    (window as any)._lapiaGame = undefined;
    (window as any)._lapiaGameReady = false;
  }

  onLog("system", "Compiling and starting your game...");
  try {
    pyodide.globals.set("__user_code", code);
    pyodide.runPython("exec(__user_code)");
    // Wait for Game() to register itself
    let tries = 0;
    while (!(window as any)._lapiaGameReady && tries < 100) {
      await new Promise((r) => setTimeout(r, 20));
      tries++;
    }
    const game = (window as any)._lapiaGame;
    if (!game) {
      throw new Error(
        "Game instance was not created. Make sure your code ends with `game.run(MyScene())`."
      );
    }
    onLog("success", "Game started. Use the preview to play.");
    return {
      pyodide,
      game,
      runFrame: (dt: number) => {
        try {
          return game.run_frame(dt);
        } catch (e: any) {
          onLog("error", `Runtime error: ${e?.message ?? e}`);
          return false;
        }
      },
      stop: () => {
        try { game.stop(); } catch {}
        try {
          ctx.fillStyle = "#1a1b1e";
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        } catch {}
      },
    };
  } catch (e: any) {
    onLog("error", `Compile error: ${e.message ?? e}`);
    throw e;
  }
}
