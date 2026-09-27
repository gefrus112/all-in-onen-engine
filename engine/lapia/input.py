"""Input: keyboard, mouse, gamepad, touch with input mapping."""

from __future__ import annotations

from typing import Optional, Callable, Any
from enum import Enum, auto
import time

try:
    import pygame
    HAS_PYGAME = True
except ImportError:
    HAS_PYGAME = False
    pygame = None

from .core import Vector2


class InputState(Enum):
    RELEASED = 0
    PRESSED = auto()
    JUST_PRESSED = auto()
    JUST_RELEASED = auto()


class InputManager:
    """Unified input manager for keyboard, mouse, gamepad, touch."""
    def __init__(self):
        self._keys: dict[int, bool] = {}
        self._prev_keys: dict[int, bool] = {}
        self._mouse_buttons: dict[int, bool] = {1: False, 2: False, 3: False}
        self._prev_mouse_buttons: dict[int, bool] = {1: False, 2: False, 3: False}
        self._mouse_pos = Vector2.zero()
        self._prev_mouse_pos = Vector2.zero()
        self._mouse_wheel = Vector2.zero()
        self._key_callbacks: dict[int, list[Callable]] = {}
        self._text_input: str = ""
        self._text_input_active = False
        self._gamepad_buttons: dict[int, dict[int, bool]] = {}
        self._prev_gamepad_buttons: dict[int, dict[int, bool]] = {}
        self._gamepad_axes: dict[int, dict[int, float]] = {}
        self._gamepad_connected: dict[int, bool] = {}
        self._touch_points: dict[int, Vector2] = {}
        self._prev_touch_points: dict[int, Vector2] = {}
        self._bindings: dict[str, list] = {}  # action -> list of input sources
        self._action_states: dict[str, InputState] = {}
        self._cursor_visible = True
        self._cursor_locked = False

    def update(self, events: list = None):
        self._prev_keys = dict(self._keys)
        self._prev_mouse_buttons = dict(self._mouse_buttons)
        self._prev_mouse_pos = self._mouse_pos.copy()
        self._mouse_wheel = Vector2.zero()
        self._text_input = ""
        if events is None:
            return self._poll_pygame()
        for e in events:
            self._handle_event(e)

    def _poll_pygame(self):
        if not HAS_PYGAME: return []
        events = pygame.event.get()
        for e in events:
            self._handle_event(e)
        # Poll held state
        keys = pygame.key.get_pressed()
        for i, k in enumerate(keys):
            if k: self._keys[i] = True
        # Mouse state
        if pygame.mouse.get_focused():
            mx, my = pygame.mouse.get_pos()
            self._mouse_pos = Vector2(mx, my)
            buttons = pygame.mouse.get_pressed()
            self._mouse_buttons[1] = buttons[0]
            self._mouse_buttons[2] = buttons[2]
            self._mouse_buttons[3] = buttons[1]
        # Gamepads
        self._poll_gamepads()
        # Update action states
        self._update_action_states()

    def _handle_event(self, e):
        if not HAS_PYGAME: return
        if e.type == pygame.KEYDOWN:
            self._keys[e.key] = True
            for cb in self._key_callbacks.get(e.key, []):
                cb(True)
        elif e.type == pygame.KEYUP:
            self._keys[e.key] = False
            for cb in self._key_callbacks.get(e.key, []):
                cb(False)
        elif e.type == pygame.MOUSEMOTION:
            self._mouse_pos = Vector2(e.pos[0], e.pos[1])
        elif e.type == pygame.MOUSEBUTTONDOWN:
            self._mouse_buttons[e.button] = True
        elif e.type == pygame.MOUSEBUTTONUP:
            self._mouse_buttons[e.button] = False
        elif e.type == pygame.MOUSEWHEEL:
            self._mouse_wheel = Vector2(e.x, e.y)
        elif e.type == pygame.TEXTINPUT:
            self._text_input += e.text
        elif e.type == pygame.JOYDEVICEADDED:
            idx = e.device_index
            self._gamepad_connected[idx] = True
        elif e.type == pygame.JOYDEVICEREMOVED:
            idx = e.device_index
            self._gamepad_connected[idx] = False
        elif e.type == pygame.FINGERDOWN:
            self._touch_points[e.finger_id] = Vector2(e.x, e.y)
        elif e.type == pygame.FINGERUP:
            self._touch_points.pop(e.finger_id, None)
        elif e.type == pygame.FINGERMOTION:
            self._touch_points[e.finger_id] = Vector2(e.x, e.y)

    def _poll_gamepads(self):
        if not pygame.joystick.get_init():
            pygame.joystick.init()
        for jid in self._gamepad_connected:
            if not self._gamepad_connected[jid]: continue
            try:
                joy = pygame.joystick.Joystick(jid)
                self._prev_gamepad_buttons[jid] = dict(self._gamepad_buttons.get(jid, {}))
                btns = {}
                for b in range(joy.get_numbuttons()):
                    btns[b] = joy.get_button(b)
                self._gamepad_buttons[jid] = btns
                axes = {}
                for a in range(joy.get_numaxes()):
                    axes[a] = joy.get_axis(a)
                self._gamepad_axes[jid] = axes
            except Exception:
                pass

    def _update_action_states(self):
        for action, sources in self._bindings.items():
            pressed = False
            for src in sources:
                if src[0] == 'key':
                    pressed = pressed or self._keys.get(src[1], False)
                elif src[0] == 'mouse':
                    pressed = pressed or self._mouse_buttons.get(src[1], False)
                elif src[0] == 'gamepad':
                    parts = src[1].split('.')
                    if len(parts) == 3:
                        jid = int(parts[0]); btype = parts[1]; bid = int(parts[2])
                        if btype == 'btn':
                            pressed = pressed or self._gamepad_buttons.get(jid, {}).get(bid, False)
            prev_pressed = self._action_states.get(action, InputState.RELEASED) in (InputState.PRESSED, InputState.JUST_PRESSED)
            if pressed and not prev_pressed:
                self._action_states[action] = InputState.JUST_PRESSED
            elif pressed and prev_pressed:
                self._action_states[action] = InputState.PRESSED
            elif not pressed and prev_pressed:
                self._action_states[action] = InputState.JUST_RELEASED
            else:
                self._action_states[action] = InputState.RELEASED

    # ---- Keyboard ----
    def key_down(self, key_name: str) -> bool:
        """Returns True if key is currently held."""
        key = self._normalize_key(key_name)
        return self._keys.get(key, False)

    def key_pressed(self, key_name: str) -> bool:
        """Returns True on the frame the key was pressed."""
        key = self._normalize_key(key_name)
        return self._keys.get(key, False) and not self._prev_keys.get(key, False)

    def key_released(self, key_name: str) -> bool:
        """Returns True on the frame the key was released."""
        key = self._normalize_key(key_name)
        return not self._keys.get(key, False) and self._prev_keys.get(key, False)

    def any_key_pressed(self) -> bool:
        for k, v in self._keys.items():
            if v and not self._prev_keys.get(k, False): return True
        return False

    def _normalize_key(self, key_name: str) -> int:
        if not HAS_PYGAME: return 0
        if isinstance(key_name, int): return key_name
        name = key_name.lower().replace(' ', '_')
        # Common mappings
        mapping = {
            'a': pygame.K_a, 'b': pygame.K_b, 'c': pygame.K_c, 'd': pygame.K_d,
            'e': pygame.K_e, 'f': pygame.K_f, 'g': pygame.K_g, 'h': pygame.K_h,
            'i': pygame.K_i, 'j': pygame.K_j, 'k': pygame.K_k, 'l': pygame.K_l,
            'm': pygame.K_m, 'n': pygame.K_n, 'o': pygame.K_o, 'p': pygame.K_p,
            'q': pygame.K_q, 'r': pygame.K_r, 's': pygame.K_s, 't': pygame.K_t,
            'u': pygame.K_u, 'v': pygame.K_v, 'w': pygame.K_w, 'x': pygame.K_x,
            'y': pygame.K_y, 'z': pygame.K_z,
            '0': pygame.K_0, '1': pygame.K_1, '2': pygame.K_2, '3': pygame.K_3,
            '4': pygame.K_4, '5': pygame.K_5, '6': pygame.K_6, '7': pygame.K_7,
            '8': pygame.K_8, '9': pygame.K_9,
            'space': pygame.K_SPACE, 'enter': pygame.K_RETURN, 'return': pygame.K_RETURN,
            'escape': pygame.K_ESCAPE, 'esc': pygame.K_ESCAPE, 'tab': pygame.K_TAB,
            'backspace': pygame.K_BACKSPACE, 'delete': pygame.K_DELETE, 'del': pygame.K_DELETE,
            'up': pygame.K_UP, 'down': pygame.K_DOWN, 'left': pygame.K_LEFT, 'right': pygame.K_RIGHT,
            'shift': pygame.K_LSHIFT, 'ctrl': pygame.K_LCTRL, 'control': pygame.K_LCTRL,
            'alt': pygame.K_LALT, 'cmd': pygame.K_LMETA, 'meta': pygame.K_LMETA,
            'f1': pygame.K_F1, 'f2': pygame.K_F2, 'f3': pygame.K_F3, 'f4': pygame.K_F4,
            'f5': pygame.K_F5, 'f6': pygame.K_F6, 'f7': pygame.K_F7, 'f8': pygame.K_F8,
            'f9': pygame.K_F9, 'f10': pygame.K_F10, 'f11': pygame.K_F11, 'f12': pygame.K_F12,
        }
        return mapping.get(name, pygame.K_UNKNOWN)

    def register_key_callback(self, key_name: str, callback: Callable):
        key = self._normalize_key(key_name)
        self._key_callbacks.setdefault(key, []).append(callback)
        return lambda: self._key_callbacks[key].remove(callback)

    # ---- Mouse ----
    @property
    def mouse_position(self) -> Vector2:
        return self._mouse_pos.copy()

    @property
    def mouse_delta(self) -> Vector2:
        return self._mouse_pos - self._prev_mouse_pos

    @property
    def mouse_wheel(self) -> Vector2:
        return self._mouse_wheel.copy()

    def mouse_down(self, button: int = 1) -> bool:
        return self._mouse_buttons.get(button, False)

    def mouse_pressed(self, button: int = 1) -> bool:
        return self._mouse_buttons.get(button, False) and not self._prev_mouse_buttons.get(button, False)

    def mouse_released(self, button: int = 1) -> bool:
        return not self._mouse_buttons.get(button, False) and self._prev_mouse_buttons.get(button, False)

    def double_click(self, button: int = 1, max_interval: float = 0.3) -> bool:
        if not self.mouse_pressed(button): return False
        now = time.time()
        if not hasattr(self, '_last_click_time'):
            self._last_click_time = 0
        if now - self._last_click_time < max_interval:
            self._last_click_time = 0
            return True
        self._last_click_time = now
        return False

    # ---- Gamepad ----
    def gamepad_button_down(self, jid: int, button: int) -> bool:
        return self._gamepad_buttons.get(jid, {}).get(button, False)

    def gamepad_button_pressed(self, jid: int, button: int) -> bool:
        return (self._gamepad_buttons.get(jid, {}).get(button, False) and
                not self._prev_gamepad_buttons.get(jid, {}).get(button, False))

    def gamepad_axis(self, jid: int, axis: int) -> float:
        return self._gamepad_axes.get(jid, {}).get(axis, 0.0)

    def gamepad_left_stick(self, jid: int = 0, deadzone: float = 0.2) -> Vector2:
        x = self.gamepad_axis(jid, 0)
        y = self.gamepad_axis(jid, 1)
        v = Vector2(x, y)
        if v.magnitude < deadzone: return Vector2.zero()
        return v.normalized * ((v.magnitude - deadzone) / (1 - deadzone))

    def gamepad_right_stick(self, jid: int = 0, deadzone: float = 0.2) -> Vector2:
        x = self.gamepad_axis(jid, 2)
        y = self.gamepad_axis(jid, 3)
        v = Vector2(x, y)
        if v.magnitude < deadzone: return Vector2.zero()
        return v.normalized * ((v.magnitude - deadzone) / (1 - deadzone))

    def is_gamepad_connected(self, jid: int) -> bool:
        return self._gamepad_connected.get(jid, False)

    # ---- Touch ----
    @property
    def touch_points(self) -> dict[int, Vector2]:
        return dict(self._touch_points)

    def touch_count(self) -> int:
        return len(self._touch_points)

    # ---- Action bindings ----
    def bind(self, action: str, source: str):
        """Bind a named action to a source like 'key:a', 'mouse:1', 'gamepad:0.btn.0'."""
        parts = source.split(':', 1)
        if len(parts) != 2: return
        kind = parts[0]; val = parts[1]
        if kind == 'key':
            self._bindings.setdefault(action, []).append(('key', self._normalize_key(val)))
        elif kind == 'mouse':
            self._bindings.setdefault(action, []).append(('mouse', int(val)))
        elif kind == 'gamepad':
            self._bindings.setdefault(action, []).append(('gamepad', val))

    def action_down(self, action: str) -> bool:
        state = self._action_states.get(action, InputState.RELEASED)
        return state in (InputState.PRESSED, InputState.JUST_PRESSED)

    def action_pressed(self, action: str) -> bool:
        return self._action_states.get(action, InputState.RELEASED) == InputState.JUST_PRESSED

    def action_released(self, action: str) -> bool:
        return self._action_states.get(action, InputState.RELEASED) == InputState.JUST_RELEASED

    # ---- Text input ----
    def start_text_input(self):
        self._text_input_active = True
        if HAS_PYGAME:
            pygame.key.start_text_input()

    def stop_text_input(self):
        self._text_input_active = False
        if HAS_PYGAME:
            pygame.key.stop_text_input()

    @property
    def text_input(self) -> str:
        return self._text_input

    # ---- Cursor control ----
    def set_cursor_visible(self, visible: bool):
        self._cursor_visible = visible
        if HAS_PYGAME:
            pygame.mouse.set_visible(visible)

    def set_cursor_locked(self, locked: bool):
        self._cursor_locked = locked
        if HAS_PYGAME:
            pygame.event.set_grab(locked)


__all__ = ["InputManager", "InputState"]
