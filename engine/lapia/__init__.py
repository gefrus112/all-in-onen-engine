"""
Lapia Engine — a 2D game engine built on top of Pygame.

A batteries-included, MIT-licensed engine for building 2D games in Python.
Provides rendering, physics, input, audio, scene management, ECS, AI,
networking, UI, and tooling — all in one coherent package.

Quickstart:
    from lapia import Game, Scene, Sprite, Vector2

    class MyScene(Scene):
        def on_load(self):
            self.player = Sprite(color=(0, 200, 255), size=(32, 32))
            self.add(self.player)

        def on_update(self, dt):
            if self.input.key_down('right'):
                self.player.x += 200 * dt

    game = Game(title='My Game', size=(800, 600))
    game.run(MyScene())
"""

from .engine import Game
from .core import Vector2, Vector3, Color, Clock, Config, EventBus, Math
from .scene import Scene, Node, Entity, Component, SceneManager
from .rendering import (
    Renderer, Sprite, Animation, Tilemap, ParticleSystem,
    Camera, Text, Primitive, LayerManager, Shader, Light,
)
from .physics import PhysicsWorld, RigidBody, Collider, RaycastResult
from .input import InputManager
from .audio import AudioMixer, Sound, Music
from .ai import Pathfinder, StateMachine, BehaviorTree, Steering
from .network import NetworkClient, NetworkServer
from .ui import Widget, Button, Label, Panel, Layout
from .tools import DebugOverlay, Profiler, Console

__version__ = "1.0.0"
__author__ = "Lapia Engine Contributors"
__license__ = "MIT"

__all__ = [
    # Core
    "Game", "Vector2", "Vector3", "Color", "Clock", "Config", "EventBus", "Math",
    # Scene
    "Scene", "Node", "Entity", "Component", "SceneManager",
    # Rendering
    "Renderer", "Sprite", "Animation", "Tilemap", "ParticleSystem",
    "Camera", "Text", "Primitive", "LayerManager", "Shader", "Light",
    # Physics
    "PhysicsWorld", "RigidBody", "Collider", "RaycastResult",
    # Input/Audio
    "InputManager", "AudioMixer", "Sound", "Music",
    # AI
    "Pathfinder", "StateMachine", "BehaviorTree", "Steering",
    # Network
    "NetworkClient", "NetworkServer",
    # UI
    "Widget", "Button", "Label", "Panel", "Layout",
    # Tools
    "DebugOverlay", "Profiler", "Console",
]
