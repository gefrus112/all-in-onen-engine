"""
Lapia Engine — Demo Platformer

A simple platformer demo showcasing:
- Sprite rendering with animation
- Physics (gravity, collision, jumping)
- Camera follow
- Particle effects
- Parallax background
- Input handling (arrow keys + space to jump)
- Enemy AI (patrol)
- Score collection

Run: python -m examples.platformer
"""

import sys
import os
import math
import random

# Add engine to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import pygame
from lapia import (
    Game, Scene, Sprite, Vector2, Color, Math,
    RigidBody, Collider, ColliderShape, BodyType,
    ParticleSystem, ParticleConfig, Text, Tilemap,
)
from lapia.physics import RigidBody, Collider, ColliderShape, BodyType, PhysicsWorld
from lapia.ai import State, StateMachine


class Player:
    """Player character with movement and jumping."""
    def __init__(self, x: float, y: float):
        self.position = Vector2(x, y)
        self.velocity = Vector2.zero()
        self.size = Vector2(28, 36)
        self.on_ground = False
        self.facing = 1  # 1 = right, -1 = left
        self.coyote_time = 0.0
        self.jump_buffer = 0.0
        self.anim_time = 0.0
        self.sprite = Sprite(color=Color(80, 180, 240), size=(self.size.x, self.size.y), layer="player")
        self.sprite.position = self.position
        self.sprite.origin = Vector2(0.5, 0.5)
        self.body = RigidBody(self.position, BodyType.DYNAMIC)
        self.body.collider = Collider(shape=ColliderShape.AABB, width=self.size.x, height=self.size.y)
        self.body.friction = 0.3
        self.body.restitution = 0.0
        self.body.user_data = {'type': 'player', 'obj': self}
        self.trail: list[Vector2] = []
        self.spawn_point = Vector2(x, y)

    def update(self, dt: float, input_mgr, physics: PhysicsWorld, level):
        # Input
        move = 0
        if input_mgr.key_down('left') or input_mgr.key_down('a'): move = -1
        if input_mgr.key_down('right') or input_mgr.key_down('d'): move = 1
        if move != 0:
            self.facing = move
            target_vx = move * 220
            self.velocity.x = Math.lerp(self.velocity.x, target_vx, 0.2)
        else:
            self.velocity.x *= 0.85  # damping

        # Jump with coyote time + jump buffering
        jump_pressed = input_mgr.key_pressed('space') or input_mgr.key_pressed('w') or input_mgr.key_pressed('up')
        if jump_pressed:
            self.jump_buffer = 0.15
        self.jump_buffer = max(0, self.jump_buffer - dt)
        self.coyote_time = max(0, self.coyote_time - dt)

        if self.jump_buffer > 0 and self.coyote_time > 0:
            self.velocity.y = -480
            self.on_ground = False
            self.coyote_time = 0
            self.jump_buffer = 0
            return 'jump'

        # Variable jump height (release space = cut jump)
        if not input_mgr.key_down('space') and self.velocity.y < -150:
            self.velocity.y *= 0.85

        # Apply velocity to body
        self.body.velocity = self.velocity
        # Step physics for player separately with custom collision against tiles
        self._move_and_collide(dt, level)

        # Update sprite
        self.sprite.position = self.position
        # Flip sprite
        if move != 0:
            self.sprite.flip_x = (move < 0)
        # Trail
        self.trail.append(self.position.copy())
        if len(self.trail) > 8: self.trail.pop(0)

        # Reset on falling off the world
        if self.position.y > 2000:
            self.respawn()

        return None

    def _move_and_collide(self, dt: float, level):
        # X axis
        self.position.x += self.velocity.x * dt
        self._resolve_tile_collisions(level, axis='x')
        # Y axis
        self.position.y += self.velocity.y * dt
        was_on_ground = self.on_ground
        self.on_ground = False
        self._resolve_tile_collisions(level, axis='y')
        if self.on_ground and not was_on_ground:
            self.coyote_time = 0.1  # coyote window
        # Apply gravity
        self.velocity.y += 1400 * dt
        if self.velocity.y > 800:
            self.velocity.y = 800

    def _resolve_tile_collisions(self, level, axis: str):
        ts = level.tile_size
        # Check tiles around player
        bounds_x = self.position.x - self.size.x/2
        bounds_y = self.position.y - self.size.y/2
        tx0 = max(0, int(bounds_x // ts))
        tx1 = min(level.width - 1, int((bounds_x + self.size.x) // ts))
        ty0 = max(0, int(bounds_y // ts))
        ty1 = min(level.height - 1, int((bounds_y + self.size.y) // ts))
        for ty in range(ty0, ty1 + 1):
            for tx in range(tx0, tx1 + 1):
                if level.is_solid(tx, ty):
                    tile_x = tx * ts
                    tile_y = ty * ts
                    # AABB overlap
                    if (bounds_x < tile_x + ts and bounds_x + self.size.x > tile_x and
                        bounds_y < tile_y + ts and bounds_y + self.size.y > tile_y):
                        if axis == 'x':
                            if self.velocity.x > 0:
                                self.position.x = tile_x - self.size.x/2
                            elif self.velocity.x < 0:
                                self.position.x = tile_x + ts + self.size.x/2
                            self.velocity.x = 0
                            bounds_x = self.position.x - self.size.x/2
                        else:
                            if self.velocity.y > 0:
                                self.position.y = tile_y - self.size.y/2
                                self.on_ground = True
                            elif self.velocity.y < 0:
                                self.position.y = tile_y + ts + self.size.y/2
                            self.velocity.y = 0
                            bounds_y = self.position.y - self.size.y/2

    def respawn(self):
        self.position = self.spawn_point.copy()
        self.velocity = Vector2.zero()
        self.trail.clear()


class Enemy:
    """Simple patrolling enemy."""
    def __init__(self, x: float, y: float, patrol_range: float = 80):
        self.position = Vector2(x, y)
        self.start_x = x
        self.patrol_range = patrol_range
        self.direction = 1
        self.speed = 60
        self.size = Vector2(28, 28)
        self.sprite = Sprite(color=Color(230, 80, 100), size=(self.size.x, self.size.y), layer="enemy")
        self.sprite.position = self.position
        self.fsm = StateMachine()
        self.fsm.add_state(State("patrol"))
        self.fsm.add_state(State("chase"))
        self.fsm.set_state("patrol")
        self.fsm.current.transitions['see_player'] = "chase"
        self.alive = True
        self.anim_time = 0.0

    def update(self, dt: float, player_pos: Vector2):
        if not self.alive: return
        self.anim_time += dt
        # FSM logic
        dist_to_player = self.position.distance_to(player_pos)
        if dist_to_player < 150 and self.fsm.current.name == "patrol":
            self.fsm.fire('see_player')
        elif dist_to_player > 250 and self.fsm.current.name == "chase":
            self.fsm.set_state("patrol")

        if self.fsm.current.name == "patrol":
            # Patrol back and forth
            self.position.x += self.direction * self.speed * dt
            if abs(self.position.x - self.start_x) > self.patrol_range:
                self.direction *= -1
                self.position.x = self.start_x + math.copysign(self.patrol_range, self.position.x - self.start_x)
        elif self.fsm.current.name == "chase":
            # Move toward player
            diff = player_pos - self.position
            if diff.magnitude > 5:
                self.position.x += Math.sign(diff.x) * 90 * dt
        # Bob up and down
        self.sprite.position = Vector2(self.position.x, self.position.y + math.sin(self.anim_time * 4) * 3)
        self.sprite.flip_x = self.direction < 0


class Coin:
    """Collectible coin."""
    def __init__(self, x: float, y: float):
        self.position = Vector2(x, y)
        self.collected = False
        self.sprite = Sprite(color=Color(240, 200, 80), size=(16, 16), layer="entity")
        self.sprite.position = self.position
        self.anim_time = random.uniform(0, math.tau)
        self.base_y = y

    def update(self, dt: float):
        self.anim_time += dt
        self.sprite.position = Vector2(self.position.x, self.base_y + math.sin(self.anim_time * 3) * 4)

    def check_collect(self, player_pos: Vector2, radius: float = 24) -> bool:
        if self.collected: return False
        if self.position.distance_to(player_pos) < radius:
            self.collected = True
            self.sprite.visible = False
            return True
        return False


class PlatformerScene(Scene):
    """The platformer level scene."""
    def __init__(self):
        super().__init__("Platformer")
        self.bg_color = Color(35, 40, 60)
        self.player: Optional[Player] = None
        self.enemies: list[Enemy] = []
        self.coins: list[Coin] = []
        self.tilemap: Optional[Tilemap] = None
        self.score = 0
        self.score_text: Optional[Text] = None
        self.particles: list[ParticleSystem] = []
        self.parallax_layers: list[tuple[list, float]] = []
        self._init_level()

    def _init_level(self):
        # Create tilemap (40 cols x 18 rows of 32px tiles = 1280x576)
        self.tilemap = Tilemap(tile_size=32, width=40, height=18)
        # Ground row
        for x in range(40):
            self.tilemap.set_tile("collision", x, 16, 1)
            self.tilemap.set_tile("ground", x, 16, 1)
        # Platforms
        for platform in [(5, 12, 4), (12, 10, 3), (20, 11, 5), (28, 9, 4), (15, 7, 3)]:
            px, py, pw = platform
            for x in range(px, px + pw):
                self.tilemap.set_tile("collision", x, py, 1)
                self.tilemap.set_tile("ground", x, py, 1)
        # Walls on edges
        for y in range(18):
            self.tilemap.set_tile("collision", 0, y, 1)
            self.tilemap.set_tile("ground", 0, y, 1)
            self.tilemap.set_tile("collision", 39, y, 1)
            self.tilemap.set_tile("ground", 39, y, 1)

        # Player
        self.player = Player(100, 400)

        # Enemies
        self.enemies = [
            Enemy(300, 480 - 14, patrol_range=80),
            Enemy(700, 480 - 14, patrol_range=120),
            Enemy(1100, 480 - 14, patrol_range=100),
        ]

        # Coins
        self.coins = []
        coin_positions = [
            (200, 460), (250, 460), (300, 460), (350, 460),
            (500, 380), (550, 380), (600, 380),
            (700, 380), (750, 380), (800, 380),
            (900, 460), (950, 460), (1000, 460),
            (1100, 320), (1150, 320),
        ]
        for cx, cy in coin_positions:
            self.coins.append(Coin(cx, cy))

        # Score text
        self.score_text = Text(text="Score: 0", size=24, color=Color.white())
        self.score_text.position = Vector2(20, 20)
        self.score_text.layer = "ui"

        # Camera
        self.camera.viewport = (800, 576)
        self.camera.follow(self.player.position, lerp=0.1, offset=Vector2(0, -40))
        self.camera.set_bounds(0, 0, 1280, 576)

        # Parallax background layers (just colored rects for simplicity)
        self.parallax_layers = []

    def on_load(self):
        pass

    def on_update(self, dt: float):
        if self.player is None: return
        # Update player
        event = self.player.update(dt, self.input, self.physics, self.tilemap)
        if event == 'jump':
            self._spawn_jump_particles(self.player.position)

        # Update enemies
        for e in self.enemies:
            e.update(dt, self.player.position)
            # Check enemy collision with player
            if e.alive and self.player.position.distance_to(e.position) < 32:
                # Player above enemy?
                if self.player.velocity.y > 50 and self.player.position.y < e.position.y - 10:
                    e.alive = False
                    e.sprite.visible = False
                    self.score += 100
                    self._spawn_hit_particles(e.position, Color(230, 80, 100))
                else:
                    # Player takes damage - respawn
                    self.player.respawn()
                    self.score = max(0, self.score - 50)

        # Update coins
        for coin in self.coins:
            coin.update(dt)
            if coin.check_collect(self.player.position):
                self.score += 10
                self._spawn_hit_particles(coin.position, Color(240, 200, 80))

        # Update particles
        for p in self.particles:
            p.update(dt)
        self.particles = [p for p in self.particles if p.particle_count > 0]

        # Update score text
        if self.score_text:
            self.score_text.set_text(f"Score: {self.score}")
            self.score_text.position = self.camera.position + Vector2(20, 20)

    def on_render(self, renderer):
        if self.player is None: return
        # Render tilemap
        self.tilemap.render(renderer.surface, self.camera)
        # Render player trail
        for i, pos in enumerate(self.player.trail):
            t = i / max(1, len(self.player.trail))
            alpha = int(t * 80)
            sp = self.camera.world_to_screen(pos)
            if hasattr(pygame, 'draw'):
                surf = pygame.Surface((20, 20), pygame.SRCALPHA)
                pygame.draw.circle(surf, (80, 180, 240, alpha), (10, 10), 10)
                renderer.surface.blit(surf, (int(sp.x) - 10, int(sp.y) - 10))
        # Render player
        renderer.submit(self.player.sprite)
        # Render enemies
        for e in self.enemies:
            if e.alive:
                renderer.submit(e.sprite)
        # Render coins
        for coin in self.coins:
            if not coin.collected:
                renderer.submit(coin.sprite)
        # Render particles
        for p in self.particles:
            p.render(renderer.surface, self.camera)
        # Render UI text
        if self.score_text:
            renderer.submit(self.score_text)
        # Hint text
        hint = Text("Arrow keys / A,D to move. Space to jump. F1 for debug.", size=14, color=Color(180, 180, 200))
        hint.position = self.camera.position + Vector2(20, 540)
        hint.layer = "ui"
        renderer.submit(hint)

    def _spawn_jump_particles(self, pos: Vector2):
        cfg = ParticleConfig(
            count=12, lifetime=0.4, lifetime_variance=0.1,
            speed=120, speed_variance=40,
            angle=-math.pi/2, angle_variance=math.pi/2,
            size_start=5, size_end=0,
            color_start=Color(80, 180, 240),
            color_end=Color(80, 180, 240, 0),
            gravity=Vector2(0, 300),
        )
        ps = ParticleSystem(pos.copy(), cfg)
        ps.emit_burst()
        self.particles.append(ps)

    def _spawn_hit_particles(self, pos: Vector2, color: Color):
        cfg = ParticleConfig(
            count=16, lifetime=0.5, lifetime_variance=0.2,
            speed=180, speed_variance=80,
            angle=0, angle_variance=math.tau,
            size_start=6, size_end=0,
            color_start=color,
            color_end=Color(color.r, color.g, color.b, 0),
            gravity=Vector2(0, 200),
        )
        ps = ParticleSystem(pos.copy(), cfg)
        ps.emit_burst()
        self.particles.append(ps)


def main():
    game = Game(
        title="Lapia Engine — Platformer Demo",
        size=(800, 576),
        fps=60,
    )
    game.run(PlatformerScene())


if __name__ == "__main__":
    main()
