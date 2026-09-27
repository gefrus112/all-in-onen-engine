"""Main Game class — ties together all subsystems into a runnable game loop."""

from __future__ import annotations

import sys
import time
from typing import Optional, Callable

try:
    import pygame
    HAS_PYGAME = True
except ImportError:
    HAS_PYGAME = False
    pygame = None

from .core import Vector2, Color, Clock, Config, EventBus
from .scene import Scene, SceneManager
from .rendering import Renderer, Camera
from .input import InputManager
from .audio import AudioMixer
from .tools import Profiler, DebugOverlay, Console


class Game:
    """The main game application.

    Handles initialization, the main loop, scene switching, and shutdown.

    Example:
        game = Game(title='My Game', size=(800, 600))
        game.run(MyScene())
    """
    def __init__(self,
                 title: str = "Lapia Game",
                 size: tuple[int, int] = (800, 600),
                 fps: int = 60,
                 config: Optional[Config] = None,
                 headless: bool = False):
        self.config = config or Config()
        self.config.title = title
        self.config.width, self.config.height = size
        self.config.fps_cap = fps
        self.headless = headless
        self.running = False
        self.clock = Clock()
        self.events = EventBus()
        self.input = InputManager()
        self.audio = AudioMixer(channels=self.config.audio_channels, sample_rate=self.config.audio_sample_rate)
        self.scene_manager = SceneManager()
        self.profiler = Profiler()
        self.debug = DebugOverlay()
        self.console = Console()
        self.window: Optional[pygame.Surface] = None
        self.renderer: Optional[Renderer] = None
        self._init_pygame()
        self._on_update_callback: Optional[Callable] = None
        self._on_render_callback: Optional[Callable] = None
        self._target_fps = fps
        self._frame_count = 0
        self._time_elapsed = 0.0

    def _init_pygame(self):
        if self.headless or not HAS_PYGAME:
            return
        pygame.init()
        flags = 0
        if self.config.fullscreen: flags |= pygame.FULLSCREEN
        if self.config.resizable: flags |= pygame.RESIZABLE
        try:
            self.window = pygame.display.set_mode(
                (self.config.width, self.config.height),
                flags, vsync=1 if self.config.vsync else 0
            )
            pygame.display.set_caption(self.config.title)
        except Exception as e:
            print(f"[Game] Failed to create window: {e}")
            self.window = pygame.display.set_mode((self.config.width, self.config.height))
        self.audio.init()
        self.renderer = Renderer(self.window, Camera((self.config.width, self.config.height)))
        self._register_default_console_commands()

    def _register_default_console_commands(self):
        self.console.register('fps', lambda: f"FPS: {self.profiler.fps:.1f}")
        self.console.register('quit', self.stop)
        self.console.register('exit', self.stop)
        self.console.register('scenes', lambda: ', '.join(self.scene_manager.scenes.keys()))

    def on_update(self, callback: Callable):
        self._on_update_callback = callback

    def on_render(self, callback: Callable):
        self._on_render_callback = callback

    def run(self, initial_scene: Optional[Scene] = None):
        """Run the game with an initial scene."""
        if initial_scene:
            initial_scene.input = self.input
            initial_scene.audio = self.audio
            initial_scene.renderer = self.renderer
            initial_scene.camera = Camera((self.config.width, self.config.height))
            self.scene_manager.switch(initial_scene)
        self.running = True
        try:
            self._main_loop()
        except KeyboardInterrupt:
            pass
        finally:
            self.shutdown()

    def _main_loop(self):
        if not HAS_PYGAME:
            # Headless fallback — just tick the clock
            while self.running:
                dt = self.clock.tick()
                self._update(dt)
            return
        while self.running:
            self.profiler.begin_frame()
            events = pygame.event.get()
            for e in events:
                if e.type == pygame.QUIT:
                    self.running = False
                elif e.type == pygame.VIDEORESIZE:
                    self.config.width, self.config.height = e.w, e.h
                    self.window = pygame.display.set_mode((e.w, e.h), pygame.RESIZABLE)
                    if self.renderer:
                        self.renderer.surface = self.window
                self.console.handle_event(e)
                if self.scene_manager.current:
                    self.scene_manager.current.on_event(e)
            self.input.update(events)
            dt = self.clock.tick()
            self._update(dt)
            self._render()
            pygame.display.flip()
            self.profiler.end_frame()
            self._frame_count += 1
            self._time_elapsed += dt
            # Cap FPS
            if self._target_fps > 0:
                target_dt = 1.0 / self._target_fps
                actual_dt = 1.0 / max(self.profiler.fps, 1.0)
                if actual_dt < target_dt:
                    time.sleep(target_dt - actual_dt)

    def _update(self, dt: float):
        self.profiler.begin("update")
        # Toggle debug overlay
        if self.input.key_pressed('f1'):
            self.debug.visible = not self.debug.visible
        if self.input.key_pressed('f3'):
            self.debug.show_grid = not self.debug.show_grid
        if self.input.key_pressed('f2'):
            self.debug.show_bounds = not self.debug.show_bounds
        self.debug.update(dt) if hasattr(self.debug, 'update') else None
        self.console.update(dt)
        self.scene_manager.update(dt)
        if self._on_update_callback:
            self._on_update_callback(dt)
        self.profiler.end()
        # Update stats
        self.debug.set_stat('Frame', self._frame_count)
        self.debug.set_stat('Entities', len(self.scene_manager.current.entities) if self.scene_manager.current else 0)
        self.debug.set_stat('Draw Calls', self.renderer.draw_calls if self.renderer else 0)
        if self.scene_manager.current:
            self.debug.set_stat('Contacts', self.scene_manager.current.physics.contact_count)

    def _render(self):
        self.profiler.begin("render")
        if self.renderer and self.scene_manager.current:
            self.scene_manager.render(self.renderer)
        if self.debug.visible:
            self.debug.render(self.window, self.profiler)
        if self.console.visible:
            self.console.render(self.window, (self.config.width, self.config.height))
        self.profiler.end()

    def stop(self):
        self.running = False

    def shutdown(self):
        if not self.headless and HAS_PYGAME:
            self.audio.shutdown()
            pygame.quit()

    def load_scene(self, scene: Scene):
        scene.input = self.input
        scene.audio = self.audio
        scene.renderer = self.renderer
        scene.camera = Camera((self.config.width, self.config.height))
        self.scene_manager.switch(scene)

    def push_scene(self, scene: Scene):
        scene.input = self.input
        scene.audio = self.audio
        scene.renderer = self.renderer
        scene.camera = Camera((self.config.width, self.config.height))
        self.scene_manager.push(scene)

    def pop_scene(self):
        return self.scene_manager.pop()

    @property
    def current_scene(self) -> Optional[Scene]:
        return self.scene_manager.current

    @property
    def fps(self) -> float:
        return self.profiler.fps

    def screenshot(self, path: str = "screenshot.png"):
        if self.window and HAS_PYGAME:
            pygame.image.save(self.window, path)

    def set_window_title(self, title: str):
        if HAS_PYGAME:
            pygame.display.set_caption(title)

    def set_window_size(self, w: int, h: int):
        self.config.width = w
        self.config.height = h
        if HAS_PYGAME:
            self.window = pygame.display.set_mode((w, h), pygame.RESIZABLE)
            if self.renderer:
                self.renderer.surface = self.window


__all__ = ["Game"]
