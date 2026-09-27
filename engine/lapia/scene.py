"""Scene graph and Entity-Component-System (ECS)."""

from __future__ import annotations

import json
import importlib
from typing import Optional, Callable, Any, Type
from dataclasses import dataclass, field
from uuid import uuid4

try:
    import pygame
    HAS_PYGAME = True
except ImportError:
    HAS_PYGAME = False
    pygame = None

from .core import Vector2, Color, Clock, EventBus, Config, Math
from .rendering import Renderer, Sprite, Camera, LayerManager
from .physics import PhysicsWorld, RigidBody, Collider, ColliderShape, BodyType
from .input import InputManager
from .audio import AudioMixer


# ---------------------------------------------------------------------------
# ECS
# ---------------------------------------------------------------------------

class Entity:
    """An entity is just an ID with a tag and components."""
    def __init__(self, tag: str = ""):
        self.id = str(uuid4())
        self.tag = tag
        self.active = True
        self.components: dict[type, "Component"] = {}
        self.scene: Optional["Scene"] = None
        self.parent: Optional["Entity"] = None
        self.children: list["Entity"] = []
        self.position = Vector2.zero()
        self.rotation = 0.0
        self.scale = Vector2(1, 1)
        self.layer = "entity"
        self.z_offset = 0.0
        self.visible = True

    def add(self, component: "Component") -> "Component":
        component.entity = self
        self.components[type(component)] = component
        component.on_attach()
        if self.scene:
            self.scene._on_component_added(self, component)
        return component

    def get(self, component_type: Type) -> Optional["Component"]:
        # Allow lookups by parent class
        for t, c in self.components.items():
            if issubclass(t, component_type):
                return c
        return None

    def has(self, component_type: Type) -> bool:
        return self.get(component_type) is not None

    def remove(self, component_type: Type):
        if component_type in self.components:
            comp = self.components.pop(component_type)
            comp.on_detach()
            if self.scene:
                self.scene._on_component_removed(self, comp)

    def add_child(self, child: "Entity"):
        child.parent = self
        child.scene = self.scene
        self.children.append(child)
        if self.scene:
            self.scene._register_entity(child)

    def remove_child(self, child: "Entity"):
        if child in self.children:
            self.children.remove(child)
            child.parent = None
            if self.scene:
                self.scene._unregister_entity(child)

    def get_world_position(self) -> Vector2:
        """Recursively compute world position considering parent transforms."""
        if self.parent is None:
            return self.position.copy()
        parent_pos = self.parent.get_world_position()
        # Apply rotation and scale of parent (basic)
        rotated = self.position.rotate(self.parent.rotation)
        return parent_pos + rotated * self.parent.scale.x

    def update(self, dt: float):
        if not self.active: return
        for comp in list(self.components.values()):
            if comp.enabled:
                comp.on_update(dt)
        for child in list(self.children):
            child.update(dt)

    def render(self, renderer: Renderer):
        if not self.visible: return
        for comp in self.components.values():
            if comp.enabled and hasattr(comp, 'on_render'):
                comp.on_render(renderer)
        for child in self.children:
            child.render(renderer)

    def to_dict(self) -> dict:
        return {
            'id': self.id,
            'tag': self.tag,
            'position': [self.position.x, self.position.y],
            'rotation': self.rotation,
            'scale': [self.scale.x, self.scale.y],
            'layer': self.layer,
            'z_offset': self.z_offset,
            'visible': self.visible,
            'children': [c.to_dict() for c in self.children],
            'components': {c.__class__.__name__: c.to_dict() for c in self.components.values()},
        }

    def find_child(self, tag: str) -> Optional["Entity"]:
        for c in self.children:
            if c.tag == tag: return c
        return None

    def find_children(self, tag: str) -> list["Entity"]:
        return [c for c in self.children if c.tag == tag]


class Component:
    """Base component. Override lifecycle methods as needed."""
    def __init__(self):
        self.entity: Optional[Entity] = None
        self.enabled = True

    def on_attach(self): pass
    def on_detach(self): pass
    def on_update(self, dt: float): pass
    def on_render(self, renderer: Renderer): pass
    def on_collision(self, other: Entity, normal: Vector2, penetration: float): pass

    def to_dict(self) -> dict:
        return {'enabled': self.enabled}

    @classmethod
    def from_dict(cls, data: dict) -> "Component":
        c = cls()
        c.enabled = data.get('enabled', True)
        return c


# --- Common components ---

class TransformComponent(Component):
    """2D transform: position, rotation, scale."""
    def __init__(self, position: Optional[Vector2] = None, rotation: float = 0.0, scale: Optional[Vector2] = None):
        super().__init__()
        self.position = position or Vector2.zero()
        self.rotation = rotation
        self.scale = scale or Vector2(1, 1)

    def on_update(self, dt: float):
        if self.entity:
            self.entity.position = self.position
            self.entity.rotation = self.rotation
            self.entity.scale = self.scale

    def to_dict(self):
        d = super().to_dict()
        d.update({'position': [self.position.x, self.position.y], 'rotation': self.rotation, 'scale': [self.scale.x, self.scale.y]})
        return d


class SpriteComponent(Component):
    """Renders a sprite for the entity."""
    def __init__(self, sprite: Optional[Sprite] = None):
        super().__init__()
        self.sprite = sprite or Sprite()
        self.follow_entity = True

    def on_attach(self):
        self.sprite.position = self.entity.position if self.entity else Vector2.zero()

    def on_update(self, dt: float):
        if self.follow_entity and self.entity:
            self.sprite.position = self.entity.get_world_position()
            self.sprite.rotation = self.entity.rotation
            self.sprite.scale = self.entity.scale

    def on_render(self, renderer: Renderer):
        renderer.submit(self.sprite)

    def to_dict(self):
        d = super().to_dict()
        d.update({'color': self.sprite.color.to_tuple(), 'layer': self.sprite.layer})
        return d


class RigidBodyComponent(Component):
    """Attaches a physics rigid body to the entity."""
    def __init__(self, body_type: BodyType = BodyType.DYNAMIC, mass: float = 1.0,
                 collider_shape: ColliderShape = ColliderShape.AABB,
                 width: float = 32.0, height: float = 32.0, radius: float = 16.0,
                 friction: float = 0.2, restitution: float = 0.3):
        super().__init__()
        self.body_type = body_type
        self.mass = mass
        self.collider_shape = collider_shape
        self.width = width; self.height = height
        self.radius = radius
        self.friction = friction; self.restitution = restitution
        self.body: Optional[RigidBody] = None

    def on_attach(self):
        if not self.entity or not self.entity.scene: return
        self.body = RigidBody(body_type=self.body_type)
        self.body.position = self.entity.get_world_position()
        self.body.collider = Collider(shape=self.collider_shape, width=self.width,
                                      height=self.height, radius=self.radius)
        self.body.set_mass(self.mass)
        self.body.friction = self.friction
        self.body.restitution = self.restitution
        self.body.user_data['entity_id'] = self.entity.id
        # Wire collision callback
        self.body.on_collision(self._on_collision)
        self.entity.scene.physics.add(self.body)

    def _on_collision(self, other_body: RigidBody, normal: Vector2, penetration: float):
        if not self.entity or not self.entity.scene: return
        other_id = other_body.user_data.get('entity_id')
        if other_id:
            other = self.entity.scene.get_entity(other_id)
            if other:
                self.entity.components.get(self.__class__)  # noop
                # Fire component collision handlers
                for comp in self.entity.components.values():
                    comp.on_collision(other, normal, penetration)

    def on_update(self, dt: float):
        if self.body and self.entity:
            self.entity.position = self.body.position.copy()
            self.entity.rotation = self.body.rotation

    def on_detach(self):
        if self.body and self.entity and self.entity.scene:
            self.entity.scene.physics.remove(self.body)

    def apply_force(self, force: Vector2):
        if self.body: self.body.apply_force(force)

    def apply_impulse(self, impulse: Vector2):
        if self.body: self.body.apply_impulse(impulse)

    def to_dict(self):
        d = super().to_dict()
        d.update({
            'body_type': self.body_type.name,
            'mass': self.mass,
            'collider_shape': self.collider_shape.name,
            'width': self.width, 'height': self.height, 'radius': self.radius,
            'friction': self.friction, 'restitution': self.restitution,
        })
        return d


class ScriptComponent(Component):
    """A component that runs custom update logic via a callable."""
    def __init__(self, on_update: Optional[Callable] = None, on_render: Optional[Callable] = None,
                 on_attach: Optional[Callable] = None, on_detach: Optional[Callable] = None):
        super().__init__()
        self._on_update_cb = on_update
        self._on_render_cb = on_render
        self._on_attach_cb = on_attach
        self._on_detach_cb = on_detach

    def on_attach(self):
        if self._on_attach_cb: self._on_attach_cb(self.entity)

    def on_detach(self):
        if self._on_detach_cb: self._on_detach_cb(self.entity)

    def on_update(self, dt: float):
        if self._on_update_cb and self.enabled: self._on_update_cb(self.entity, dt)

    def on_render(self, renderer: Renderer):
        if self._on_render_cb and self.enabled: self._on_render_cb(self.entity, renderer)


class LifetimeComponent(Component):
    """Destroys the entity after a delay."""
    def __init__(self, lifetime: float = 1.0):
        super().__init__()
        self.lifetime = lifetime
        self.elapsed = 0.0

    def on_update(self, dt: float):
        self.elapsed += dt
        if self.elapsed >= self.lifetime:
            if self.entity and self.entity.scene:
                self.entity.scene.remove_entity(self.entity)


class TagComponent(Component):
    """Adds searchable tags to an entity."""
    def __init__(self, tags: Optional[list[str]] = None):
        super().__init__()
        self.tags = tags or []

    def has_tag(self, tag: str) -> bool:
        return tag in self.tags


# ---------------------------------------------------------------------------
# Scene
# ---------------------------------------------------------------------------

class Scene:
    """A scene containing entities, with its own lifecycle."""
    def __init__(self, name: str = "Scene"):
        self.name = name
        self.id = str(uuid4())
        self.entities: list[Entity] = []
        self.entities_by_id: dict[str, Entity] = {}
        self.entities_by_tag: dict[str, list[Entity]] = {}
        self.camera = Camera((800, 600))
        self.physics = PhysicsWorld()
        self.input: Optional[InputManager] = None
        self.audio: Optional[AudioMixer] = None
        self.renderer: Optional[Renderer] = None
        self.clock = Clock()
        self.events = EventBus()
        self.loaded = False
        self.paused = False
        self.bg_color = Color(40, 44, 52)
        self.time_scale = 1.0
        self.user_data: dict = {}

    # ---- Lifecycle ----
    def on_load(self): pass
    def on_unload(self): pass
    def on_enter(self): pass
    def on_exit(self): pass
    def on_update(self, dt: float): pass
    def on_render(self, renderer: Renderer): pass
    def on_event(self, event): pass

    # ---- Entity management ----
    def add(self, entity: Entity) -> Entity:
        entity.scene = self
        self.entities.append(entity)
        self.entities_by_id[entity.id] = entity
        if entity.tag:
            self.entities_by_tag.setdefault(entity.tag, []).append(entity)
        # Register components with subsystems
        for comp in entity.components.values():
            self._on_component_added(entity, comp)
        # Register children recursively
        for child in entity.children:
            self._register_entity(child)
        return entity

    def create_entity(self, tag: str = "", position: Optional[Vector2] = None) -> Entity:
        e = Entity(tag)
        if position: e.position = position
        return self.add(e)

    def remove_entity(self, entity: Entity):
        if entity.id in self.entities_by_id:
            self.entities.remove(entity)
            del self.entities_by_id[entity.id]
            if entity.tag and entity.tag in self.entities_by_tag:
                if entity in self.entities_by_tag[entity.tag]:
                    self.entities_by_tag[entity.tag].remove(entity)
                if not self.entities_by_tag[entity.tag]:
                    del self.entities_by_tag[entity.tag]
            for comp in list(entity.components.values()):
                self._on_component_removed(entity, comp)

    def get_entity(self, entity_id: str) -> Optional[Entity]:
        return self.entities_by_id.get(entity_id)

    def find_by_tag(self, tag: str) -> list[Entity]:
        return self.entities_by_tag.get(tag, [])

    def find_first(self, tag: str) -> Optional[Entity]:
        results = self.find_by_tag(tag)
        return results[0] if results else None

    def _register_entity(self, entity: Entity):
        entity.scene = self
        self.entities.append(entity)
        self.entities_by_id[entity.id] = entity
        if entity.tag:
            self.entities_by_tag.setdefault(entity.tag, []).append(entity)
        for comp in entity.components.values():
            self._on_component_added(entity, comp)
        for child in entity.children:
            self._register_entity(child)

    def _unregister_entity(self, entity: Entity):
        if entity.id in self.entities_by_id:
            self.entities.remove(entity)
            del self.entities_by_id[entity.id]
            if entity.tag and entity.tag in self.entities_by_tag:
                if entity in self.entities_by_tag[entity.tag]:
                    self.entities_by_tag[entity.tag].remove(entity)

    def _on_component_added(self, entity: Entity, component: Component):
        if isinstance(component, RigidBodyComponent):
            component.on_attach()

    def _on_component_removed(self, entity: Entity, component: Component):
        if isinstance(component, RigidBodyComponent):
            component.on_detach()

    # ---- Update / render ----
    def update(self, dt: float):
        if self.paused: return
        scaled_dt = dt * self.time_scale
        self.clock.tick()
        self.camera.update(scaled_dt)
        self.physics.step(scaled_dt)
        for e in list(self.entities):
            if e.active:
                e.update(scaled_dt)
        self.on_update(scaled_dt)

    def render(self, renderer: Renderer):
        renderer.clear(self.bg_color)
        renderer.camera = self.camera
        for e in self.entities:
            if e.active and e.visible:
                e.render(renderer)
        self.on_render(renderer)
        renderer.flush()

    def pause(self): self.paused = True
    def resume(self): self.paused = False

    # ---- Serialization ----
    def serialize(self) -> str:
        return json.dumps({
            'name': self.name,
            'entities': [e.to_dict() for e in self.entities],
            'camera': {'x': self.camera.position.x, 'y': self.camera.position.y, 'zoom': self.camera.zoom},
        }, indent=2)

    def to_dict(self) -> dict:
        return {
            'name': self.name,
            'id': self.id,
            'entity_count': len(self.entities),
            'paused': self.paused,
        }


# ---------------------------------------------------------------------------
# Scene Manager
# ---------------------------------------------------------------------------

class SceneManager:
    """Manages multiple scenes with stack-based navigation."""
    def __init__(self):
        self.scenes: dict[str, Scene] = {}
        self.stack: list[Scene] = []
        self.current: Optional[Scene] = None
        self.transitions_enabled = True

    def register(self, scene: Scene):
        self.scenes[scene.name] = scene

    def push(self, scene: Scene):
        if self.current:
            self.current.on_exit()
        self.stack.append(scene)
        self.current = scene
        if not scene.loaded:
            scene.on_load()
            scene.loaded = True
        scene.on_enter()

    def pop(self) -> Optional[Scene]:
        if not self.stack: return None
        old = self.stack.pop()
        old.on_exit()
        if self.stack:
            self.current = self.stack[-1]
            self.current.on_enter()
        else:
            self.current = None
        return old

    def switch(self, scene: Scene):
        if self.current:
            self.current.on_exit()
            if not self.transitions_enabled:
                # unload previous
                self.current.on_unload()
                self.current.loaded = False
        self.stack.clear()
        self.stack.append(scene)
        self.current = scene
        if not scene.loaded:
            scene.on_load()
            scene.loaded = True
        scene.on_enter()

    def update(self, dt: float):
        if self.current:
            self.current.update(dt)

    def render(self, renderer: Renderer):
        if self.current:
            self.current.render(renderer)


# ---------------------------------------------------------------------------
# Node (alternative API for users who prefer node-graph)
# ---------------------------------------------------------------------------

class Node:
    """A node in a scene graph with transform and children."""
    def __init__(self, name: str = "Node"):
        self.name = name
        self.parent: Optional["Node"] = None
        self.children: list["Node"] = []
        self.position = Vector2.zero()
        self.rotation = 0.0
        self.scale = Vector2(1, 1)
        self.active = True
        self.user_data: dict = {}

    def add_child(self, child: "Node") -> "Node":
        child.parent = self
        self.children.append(child)
        return child

    def remove_child(self, child: "Node"):
        if child in self.children:
            self.children.remove(child)
            child.parent = None

    def get_world_position(self) -> Vector2:
        if self.parent is None:
            return self.position.copy()
        return self.parent.get_world_position() + self.position.rotate(self.parent.rotation)

    def update(self, dt: float):
        if not self.active: return
        self.on_update(dt)
        for c in self.children:
            c.update(dt)

    def on_update(self, dt: float): pass
    def on_render(self, renderer: Renderer): pass


__all__ = [
    "Entity", "Component", "TransformComponent", "SpriteComponent",
    "RigidBodyComponent", "ScriptComponent", "LifetimeComponent", "TagComponent",
    "Scene", "SceneManager", "Node",
]
