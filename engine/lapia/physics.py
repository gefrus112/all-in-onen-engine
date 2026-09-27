"""Physics: rigid bodies, AABB/circle collision, joints, raycasting."""

from __future__ import annotations

import math
from dataclasses import dataclass, field
from typing import Optional, Callable
from enum import Enum

from .core import Vector2, Math


class BodyType(Enum):
    STATIC = 0
    KINEMATIC = 1
    DYNAMIC = 2


class ColliderShape(Enum):
    AABB = 0
    CIRCLE = 1


@dataclass
class Collider:
    """A collider attached to a rigid body."""
    shape: ColliderShape = ColliderShape.AABB
    width: float = 32.0
    height: float = 32.0
    radius: float = 16.0
    offset: Vector2 = field(default_factory=lambda: Vector2(0, 0))
    is_trigger: bool = False

    def get_bounds(self, position: Vector2) -> tuple[float, float, float, float]:
        if self.shape == ColliderShape.AABB:
            w, h = self.width, self.height
            x = position.x + self.offset.x - w / 2
            y = position.y + self.offset.y - h / 2
            return (x, y, w, h)
        else:
            r = self.radius
            x = position.x + self.offset.x - r
            y = position.y + self.offset.y - r
            return (x, y, r * 2, r * 2)


class RigidBody:
    """A physics rigid body."""
    _id_counter = 0

    def __init__(self, position: Optional[Vector2] = None, body_type: BodyType = BodyType.DYNAMIC):
        RigidBody._id_counter += 1
        self.id = RigidBody._id_counter
        self.position = position or Vector2.zero()
        self.velocity = Vector2.zero()
        self.acceleration = Vector2.zero()
        self.force = Vector2.zero()
        self.mass = 1.0
        self.inv_mass = 1.0
        self.restitution = 0.3  # bounciness
        self.friction = 0.2
        self.drag = 0.01
        self.gravity_scale = 1.0
        self.body_type = body_type
        self.collider: Optional[Collider] = None
        self.fixed_rotation = False
        self.rotation = 0.0
        self.angular_velocity = 0.0
        self.tag = ""
        self.user_data: dict = {}
        self.collision_handlers: list[Callable] = []
        self._prev_position = self.position.copy()
        self.is_sleeping = False
        self.sleep_timer = 0.0

    @property
    def x(self) -> float: return self.position.x
    @x.setter
    def x(self, v: float): self.position.x = v

    @property
    def y(self) -> float: return self.position.y
    @y.setter
    def y(self, v: float): self.position.y = v

    def apply_force(self, force: Vector2):
        if self.body_type != BodyType.DYNAMIC:
            return
        self.force.x += force.x
        self.force.y += force.y
        self.is_sleeping = False

    def apply_impulse(self, impulse: Vector2):
        if self.body_type != BodyType.DYNAMIC:
            return
        self.velocity.x += impulse.x * self.inv_mass
        self.velocity.y += impulse.y * self.inv_mass
        self.is_sleeping = False

    def apply_torque(self, torque: float):
        if self.fixed_rotation or self.body_type != BodyType.DYNAMIC:
            return
        self.angular_velocity += torque * self.inv_mass

    def set_mass(self, mass: float):
        self.mass = max(0.0001, mass)
        self.inv_mass = 1.0 / self.mass if self.body_type == BodyType.DYNAMIC else 0.0

    def set_static(self):
        self.body_type = BodyType.STATIC
        self.inv_mass = 0.0
        self.velocity = Vector2.zero()
        self.angular_velocity = 0.0

    def set_kinematic(self):
        self.body_type = BodyType.KINEMATIC
        self.inv_mass = 0.0

    def on_collision(self, handler: Callable):
        self.collision_handlers.append(handler)


@dataclass
class CollisionPair:
    body_a: RigidBody
    body_b: RigidBody
    normal: Vector2
    penetration: float
    contact_point: Vector2


@dataclass
class RaycastResult:
    hit: bool
    body: Optional[RigidBody] = None
    point: Optional[Vector2] = None
    normal: Optional[Vector2] = None
    distance: float = 0.0


class PhysicsWorld:
    """The physics simulation world."""
    def __init__(self,
                 gravity: Optional[Vector2] = None,
                 fixed_dt: float = 1.0 / 60.0,
                 velocity_iterations: int = 8,
                 position_iterations: int = 3):
        self.gravity = gravity or Vector2(0, 980.0)
        self.fixed_dt = fixed_dt
        self.velocity_iterations = velocity_iterations
        self.position_iterations = position_iterations
        self.bodies: list[RigidBody] = []
        self.collision_pairs: list[CollisionPair] = []
        self.joints: list[Joint] = []
        self.collision_filter: Optional[Callable[[RigidBody, RigidBody], bool]] = None
        self.accumulator = 0.0
        self.debug_draw = False
        self.contact_count = 0

    def add(self, body: RigidBody):
        self.bodies.append(body)
        return body

    def remove(self, body: RigidBody):
        if body in self.bodies:
            self.bodies.remove(body)

    def clear(self):
        self.bodies.clear()
        self.joints.clear()
        self.collision_pairs.clear()

    def step(self, dt: float):
        # Fixed timestep accumulator
        self.accumulator += dt
        while self.accumulator >= self.fixed_dt:
            self._integrate(self.fixed_dt)
            self.accumulator -= self.fixed_dt

    def _integrate(self, dt: float):
        # Apply forces and integrate
        for body in self.bodies:
            if body.body_type == BodyType.STATIC:
                continue
            body._prev_position = body.position.copy()
            if body.body_type == BodyType.DYNAMIC:
                # Apply gravity
                g = Vector2(self.gravity.x * body.gravity_scale, self.gravity.y * body.gravity_scale)
                body.velocity.x += (g.x + body.force.x * body.inv_mass) * dt
                body.velocity.y += (g.y + body.force.y * body.inv_mass) * dt
                # Drag
                body.velocity.x *= max(0.0, 1.0 - body.drag * dt)
                body.velocity.y *= max(0.0, 1.0 - body.drag * dt)
            # Integrate position
            body.position.x += body.velocity.x * dt
            body.position.y += body.velocity.y * dt
            body.rotation += body.angular_velocity * dt
            # Reset force
            body.force = Vector2.zero()
        # Detect collisions
        self._detect_collisions()
        # Resolve collisions
        self._resolve_collisions()
        # Update joints
        for joint in self.joints:
            joint.solve(dt)
        # Sleeping
        for body in self.bodies:
            if body.body_type != BodyType.DYNAMIC:
                continue
            if body.velocity.sqr_magnitude < 1.0:
                body.sleep_timer += dt
                if body.sleep_timer > 0.5:
                    body.is_sleeping = True
            else:
                body.sleep_timer = 0.0
                body.is_sleeping = False

    def _detect_collisions(self):
        self.collision_pairs.clear()
        n = len(self.bodies)
        for i in range(n):
            for j in range(i + 1, n):
                a = self.bodies[i]
                b = self.bodies[j]
                if a.body_type == BodyType.STATIC and b.body_type == BodyType.STATIC:
                    continue
                if a.is_sleeping and b.is_sleeping:
                    continue
                if self.collision_filter and not self.collision_filter(a, b):
                    continue
                if a.collider is None or b.collider is None:
                    continue
                pair = self._check_collision(a, b)
                if pair is not None:
                    self.collision_pairs.append(pair)

    def _check_collision(self, a: RigidBody, b: RigidBody) -> Optional[CollisionPair]:
        if a.collider.shape == ColliderShape.AABB and b.collider.shape == ColliderShape.AABB:
            return self._aabb_vs_aabb(a, b)
        elif a.collider.shape == ColliderShape.CIRCLE and b.collider.shape == ColliderShape.CIRCLE:
            return self._circle_vs_circle(a, b)
        elif a.collider.shape == ColliderShape.AABB and b.collider.shape == ColliderShape.CIRCLE:
            return self._aabb_vs_circle(a, b, swap=False)
        else:
            return self._aabb_vs_circle(b, a, swap=True)

    def _aabb_vs_aabb(self, a: RigidBody, b: RigidBody) -> Optional[CollisionPair]:
        ax, ay, aw, ah = a.collider.get_bounds(a.position)
        bx, by, bw, bh = b.collider.get_bounds(b.position)
        # Calculate overlap
        dx = (bx + bw/2) - (ax + aw/2)
        px = (bw + aw) / 2 - abs(dx)
        if px <= 0: return None
        dy = (by + bh/2) - (ay + ah/2)
        py = (bh + ah) / 2 - abs(dy)
        if py <= 0: return None
        # Resolve along axis of least penetration
        if px < py:
            normal = Vector2(1 if dx > 0 else -1, 0)
            penetration = px
            contact = Vector2((ax + aw/2 + bx + bw/2) / 2, max(ay, by))
        else:
            normal = Vector2(0, 1 if dy > 0 else -1)
            penetration = py
            contact = Vector2(max(ax, bx), (ay + ah/2 + by + bh/2) / 2)
        return CollisionPair(a, b, normal, penetration, contact)

    def _circle_vs_circle(self, a: RigidBody, b: RigidBody) -> Optional[CollisionPair]:
        diff = b.position - a.position
        dist = diff.magnitude
        r_sum = a.collider.radius + b.collider.radius
        if dist >= r_sum: return None
        normal = diff.normalized if dist > 0 else Vector2(0, -1)
        penetration = r_sum - dist
        contact = a.position + normal * a.collider.radius
        return CollisionPair(a, b, normal, penetration, contact)

    def _aabb_vs_circle(self, a: RigidBody, b: RigidBody, swap: bool) -> Optional[CollisionPair]:
        """a = AABB body, b = circle body."""
        ax, ay, aw, ah = a.collider.get_bounds(a.position)
        cx, cy = b.position.x, b.position.y
        # Closest point on AABB to circle center
        closest_x = Math.clamp(cx, ax, ax + aw)
        closest_y = Math.clamp(cy, ay, ay + ah)
        diff = Vector2(cx - closest_x, cy - closest_y)
        dist = diff.magnitude
        if dist >= b.collider.radius: return None
        normal = diff.normalized if dist > 0 else Vector2(0, -1)
        penetration = b.collider.radius - dist
        contact = Vector2(closest_x, closest_y)
        if swap:
            return CollisionPair(b, a, -normal, penetration, contact)
        return CollisionPair(a, b, normal, penetration, contact)

    def _resolve_collisions(self):
        self.contact_count = 0
        for pair in self.collision_pairs:
            self._resolve_pair(pair)
            self.contact_count += 1
            # Fire collision handlers
            for handler in pair.body_a.collision_handlers:
                handler(pair.body_b, pair.normal, pair.penetration)
            for handler in pair.body_b.collision_handlers:
                handler(pair.body_a, -pair.normal, pair.penetration)

    def _resolve_pair(self, pair: CollisionPair):
        a, b = pair.body_a, pair.body_b
        if a.collider.is_trigger or b.collider.is_trigger:
            return
        # Positional correction (slop factor)
        percent = 0.8
        slop = 0.01
        correction = max(pair.penetration - slop, 0.0) / (a.inv_mass + b.inv_mass) * percent
        a.position.x -= correction * a.inv_mass * pair.normal.x
        a.position.y -= correction * a.inv_mass * pair.normal.y
        b.position.x += correction * b.inv_mass * pair.normal.x
        b.position.y += correction * b.inv_mass * pair.normal.y
        # Velocity resolution
        rel_vel = b.velocity - a.velocity
        normal_vel = rel_vel.dot(pair.normal)
        if normal_vel > 0: return  # separating
        e = min(a.restitution, b.restitution)
        j = -(1 + e) * normal_vel / (a.inv_mass + b.inv_mass)
        impulse = pair.normal * j
        a.velocity.x -= impulse.x * a.inv_mass
        a.velocity.y -= impulse.y * a.inv_mass
        b.velocity.x += impulse.x * b.inv_mass
        b.velocity.y += impulse.y * b.inv_mass
        # Friction
        tangent = rel_vel - pair.normal * normal_vel
        if tangent.magnitude > 0.001:
            tangent = tangent.normalized
            jt = -rel_vel.dot(tangent) / (a.inv_mass + b.inv_mass)
            mu = math.sqrt(a.friction * b.friction)
            jt = Math.clamp(jt, -j * mu, j * mu)
            t_impulse = tangent * jt
            a.velocity.x -= t_impulse.x * a.inv_mass
            a.velocity.y -= t_impulse.y * a.inv_mass
            b.velocity.x += t_impulse.x * b.inv_mass
            b.velocity.y += t_impulse.y * b.inv_mass

    def raycast(self, start: Vector2, direction: Vector2, max_distance: float = 1000.0) -> RaycastResult:
        """Cast a ray and return the first body hit."""
        normalized = direction.normalized if direction.magnitude > 0 else Vector2(1, 0)
        closest_t = max_distance
        hit_body = None
        hit_point = None
        hit_normal = None
        for body in self.bodies:
            if body.collider is None: continue
            t = self._raycast_body(start, normalized, body, closest_t)
            if t is not None and t < closest_t:
                closest_t = t
                hit_body = body
                hit_point = Vector2(start.x + normalized.x * t, start.y + normalized.y * t)
                hit_normal = -normalized
        return RaycastResult(hit=hit_body is not None, body=hit_body, point=hit_point, normal=hit_normal, distance=closest_t)

    def _raycast_body(self, start: Vector2, dir: Vector2, body: RigidBody, max_t: float) -> Optional[float]:
        if body.collider.shape == ColliderShape.AABB:
            x, y, w, h = body.collider.get_bounds(body.position)
            # Slab method
            tmin = -math.inf
            tmax = math.inf
            for i, (s, d, lo, hi) in enumerate([(start.x, dir.x, x, x+w), (start.y, dir.y, y, y+h)]):
                if abs(d) < 1e-9:
                    if s < lo or s > hi: return None
                else:
                    t1 = (lo - s) / d
                    t2 = (hi - s) / d
                    if t1 > t2: t1, t2 = t2, t1
                    tmin = max(tmin, t1)
                    tmax = min(tmax, t2)
                    if tmin > tmax: return None
            if tmin < 0: return tmax if 0 <= tmax <= max_t else None
            return tmin if tmin <= max_t else None
        else:
            # Circle ray intersection
            oc = start - body.position
            a = dir.dot(dir)
            b = 2 * oc.dot(dir)
            c = oc.dot(oc) - body.collider.radius ** 2
            disc = b*b - 4*a*c
            if disc < 0: return None
            sq = math.sqrt(disc)
            t = (-b - sq) / (2*a)
            if t < 0: t = (-b + sq) / (2*a)
            return t if 0 <= t <= max_t else None


class Joint:
    """Base joint constraint."""
    def __init__(self, body_a: RigidBody, body_b: RigidBody):
        self.body_a = body_a
        self.body_b = body_b
        self.enabled = True

    def solve(self, dt: float):
        if not self.enabled: return
        # Override in subclass


class DistanceJoint(Joint):
    def __init__(self, body_a: RigidBody, body_b: RigidBody, distance: float, stiffness: float = 1.0):
        super().__init__(body_a, body_b)
        self.distance = distance
        self.stiffness = stiffness

    def solve(self, dt: float):
        if not self.enabled: return
        diff = self.body_b.position - self.body_a.position
        d = diff.magnitude
        if d < 0.0001: return
        delta = (d - self.distance) / d
        impulse = diff * 0.5 * delta * self.stiffness
        if self.body_a.body_type == BodyType.DYNAMIC:
            self.body_a.position.x += impulse.x * self.body_a.inv_mass
            self.body_a.position.y += impulse.y * self.body_a.inv_mass
        if self.body_b.body_type == BodyType.DYNAMIC:
            self.body_b.position.x -= impulse.x * self.body_b.inv_mass
            self.body_b.position.y -= impulse.y * self.body_b.inv_mass


class SpringJoint(DistanceJoint):
    def __init__(self, body_a, body_b, distance: float, stiffness: float = 50.0, damping: float = 5.0):
        super().__init__(body_a, body_b, distance, stiffness)
        self.damping = damping

    def solve(self, dt: float):
        if not self.enabled: return
        diff = self.body_b.position - self.body_a.position
        d = diff.magnitude
        if d < 0.0001: return
        n = diff / d
        rel_vel = (self.body_b.velocity - self.body_a.velocity).dot(n)
        force = (d - self.distance) * self.stiffness + rel_vel * self.damping
        impulse = n * force * dt
        if self.body_a.body_type == BodyType.DYNAMIC:
            self.body_a.velocity.x += impulse.x * self.body_a.inv_mass
            self.body_a.velocity.y += impulse.y * self.body_a.inv_mass
        if self.body_b.body_type == BodyType.DYNAMIC:
            self.body_b.velocity.x -= impulse.x * self.body_b.inv_mass
            self.body_b.velocity.y -= impulse.y * self.body_b.inv_mass


__all__ = [
    "BodyType", "ColliderShape", "Collider", "RigidBody", "CollisionPair",
    "RaycastResult", "PhysicsWorld", "Joint", "DistanceJoint", "SpringJoint",
]
