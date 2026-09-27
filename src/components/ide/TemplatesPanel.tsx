"use client";

import { Boxes, FileCode2, Users, Gamepad2, Target, Zap } from "lucide-react";
import { useStudio } from "@/lib/studio-store";
import { toast } from "sonner";

interface Template {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  file: string;
  content: string;
}

const TEMPLATES: Template[] = [
  {
    id: "platformer",
    name: "Platformer",
    description: "Player movement, gravity, jumping, tilemap collision",
    icon: <Gamepad2 className="w-4 h-4 text-blue-400" />,
    file: "platformer_template.py",
    content: `"""Platformer template — Lapia Studio"""
from lapia_shim import Game, Scene, Sprite, Vector2, Color, Math
import math


class Player:
    def __init__(self, x, y):
        self.pos = Vector2(x, y)
        self.vel = Vector2(0, 0)
        self.size = Vector2(28, 36)
        self.on_ground = False
        self.facing = 1
        self.sprite = Sprite(color=Color(80, 180, 240), size=(self.size.x, self.size.y))

    def update(self, dt, input_mgr, solids, tile_size):
        move = 0
        if input_mgr.key_down('left') or input_mgr.key_down('a'): move = -1
        if input_mgr.key_down('right') or input_mgr.key_down('d'): move = 1
        if move:
            self.facing = move
            self.vel.x = Math.lerp(self.vel.x, move * 220, 0.2)
        else:
            self.vel.x *= 0.85
        if input_mgr.key_pressed('space') and self.on_ground:
            self.vel.y = -480
        # Move and collide
        self.pos.x += self.vel.x * dt
        self._collide(solids, tile_size, 'x')
        self.pos.y += self.vel.y * dt
        self.on_ground = False
        self._collide(solids, tile_size, 'y')
        self.vel.y += 1400 * dt
        self.sprite.position = self.pos
        self.sprite.flip_x = (self.facing < 0)

    def _collide(self, solids, ts, axis):
        bx, by = self.pos.x - self.size.x/2, self.pos.y - self.size.y/2
        tx0 = max(0, int(bx // ts)); tx1 = min(99, int((bx + self.size.x) // ts))
        ty0 = max(0, int(by // ts)); ty1 = min(99, int((by + self.size.y) // ts))
        for ty in range(ty0, ty1 + 1):
            for tx in range(tx0, tx1 + 1):
                if (tx, ty) in solids:
                    tile_x, tile_y = tx * ts, ty * ts
                    if bx < tile_x + ts and bx + self.size.x > tile_x and by < tile_y + ts and by + self.size.y > tile_y:
                        if axis == 'x':
                            if self.vel.x > 0: self.pos.x = tile_x - self.size.x/2
                            elif self.vel.x < 0: self.pos.x = tile_x + ts + self.size.x/2
                            self.vel.x = 0; bx = self.pos.x - self.size.x/2
                        else:
                            if self.vel.y > 0: self.pos.y = tile_y - self.size.y/2; self.on_ground = True
                            elif self.vel.y < 0: self.pos.y = tile_y + ts + self.size.y/2
                            self.vel.y = 0; by = self.pos.y - self.size.y/2


class PlatformerScene(Scene):
    def on_load(self):
        self.player = Player(100, 400)
        self.tile_size = 32
        self.solids = set()
        # Ground
        for x in range(40):
            self.solids.add((x, 16))
        # Platforms
        for px, py, pw in [(5, 12, 4), (12, 10, 3), (20, 11, 5), (28, 9, 4)]:
            for x in range(px, px + pw):
                self.solids.add((x, py))
        # Walls
        for y in range(18):
            self.solids.add((0, y))
            self.solids.add((39, y))
        self.camera.follow(self.player.pos, lerp=0.1, offset=Vector2(0, -40))

    def on_update(self, dt):
        self.player.update(dt, self.input, self.solids, self.tile_size)

    def on_render(self, r):
        ts = self.tile_size
        for (tx, ty) in self.solids:
            r.fill_rect(Vector2(tx * ts, ty * ts), Vector2(ts, ts), Color(80, 90, 110))
        self.player.sprite.render(r.surface, self.camera)


game = Game(title="Platformer Template", size=(800, 576), fps=60)
game.run(PlatformerScene())
`,
  },
  {
    id: "topdown-shooter",
    name: "Top-Down Shooter",
    description: "Player rotation, shooting, enemy spawning, particles",
    icon: <Target className="w-4 h-4 text-red-400" />,
    file: "shooter_template.py",
    content: `"""Top-down shooter template — Lapia Studio"""
from lapia_shim import Game, Scene, Sprite, Vector2, Color, Math
import math


class Bullet:
    def __init__(self, pos, angle, speed=400):
        self.pos = pos.copy()
        self.vel = Vector2(math.cos(angle) * speed, math.sin(angle) * speed)
        self.life = 2.0
        self.sprite = Sprite(color=Color(255, 220, 80), size=(8, 8), layer='projectile')
        self.sprite.position = self.pos

    def update(self, dt):
        self.pos.x += self.vel.x * dt
        self.pos.y += self.vel.y * dt
        self.life -= dt
        self.sprite.position = self.pos

    @property
    def alive(self):
        return self.life > 0


class Enemy:
    def __init__(self, x, y):
        self.pos = Vector2(x, y)
        self.vel = Vector2(0, 0)
        self.speed = 60
        self.hp = 3
        self.sprite = Sprite(color=Color(220, 60, 80), size=(24, 24), layer='enemy')
        self.sprite.position = self.pos

    def update(self, dt, target):
        diff = target - self.pos
        if diff.magnitude > 5:
            self.pos.x += Math.sign(diff.x) * self.speed * dt
            self.pos.y += Math.sign(diff.y) * self.speed * dt
        self.sprite.position = self.pos


class Player:
    def __init__(self, x, y):
        self.pos = Vector2(x, y)
        self.vel = Vector2(0, 0)
        self.size = 24
        self.speed = 220
        self.angle = 0
        self.fire_cooldown = 0
        self.sprite = Sprite(color=Color(80, 200, 120), size=(self.size, self.size), layer='player')

    def update(self, dt, input_mgr, mouse_pos):
        vx, vy = 0, 0
        if input_mgr.key_down('left') or input_mgr.key_down('a'): vx -= 1
        if input_mgr.key_down('right') or input_mgr.key_down('d'): vx += 1
        if input_mgr.key_down('up') or input_mgr.key_down('w'): vy -= 1
        if input_mgr.key_down('down') or input_mgr.key_down('s'): vy += 1
        v = Vector2(vx, vy)
        if v.magnitude > 0:
            v = v.normalized * self.speed
        self.pos.x += v.x * dt
        self.pos.y += v.y * dt
        # Aim at mouse
        diff = mouse_pos - self.pos
        self.angle = diff.angle
        self.sprite.position = self.pos
        self.sprite.rotation = self.angle
        self.fire_cooldown = max(0, self.fire_cooldown - dt)

    def wants_fire(self, input_mgr):
        return input_mgr.mouse_down(1) and self.fire_cooldown <= 0


class ShooterScene(Scene):
    def on_load(self):
        self.player = Player(400, 300)
        self.bullets = []
        self.enemies = []
        self.spawn_timer = 0
        self.score = 0

    def on_update(self, dt):
        mouse_world = self.camera.screen_to_world(self.input.mouse_position)
        self.player.update(dt, self.input, mouse_world)
        if self.player.wants_fire(self.input):
            bullet = Bullet(self.player.pos, self.player.angle)
            self.bullets.append(bullet)
            self.player.fire_cooldown = 0.15
        # Update bullets
        self.bullets = [b for b in self.bullets if b.alive]
        for b in self.bullets:
            b.update(dt)
        # Spawn enemies
        self.spawn_timer -= dt
        if self.spawn_timer <= 0:
            import random
            angle = random.uniform(0, math.tau)
            ex = 400 + math.cos(angle) * 400
            ey = 300 + math.sin(angle) * 300
            self.enemies.append(Enemy(ex, ey))
            self.spawn_timer = 1.5
        # Update enemies + collision with bullets
        for e in self.enemies:
            e.update(dt, self.player.pos)
        for b in self.bullets:
            for e in self.enemies:
                if e.hp > 0 and b.pos.distance_to(e.pos) < 20:
                    e.hp -= 1
                    b.life = 0
                    if e.hp <= 0:
                        self.score += 100
        self.enemies = [e for e in self.enemies if e.hp > 0]

    def on_render(self, r):
        for b in self.bullets:
            b.sprite.render(r.surface, self.camera)
        for e in self.enemies:
            e.sprite.render(r.surface, self.camera)
        self.player.sprite.render(r.surface, self.camera)
        r.draw_text(self.camera.position + Vector2(20, 20), f"Score: {self.score}", size=24)


game = Game(title="Top-Down Shooter", size=(800, 600), fps=60)
game.run(ShooterScene())
`,
  },
  {
    id: "multiplayer-arena",
    name: "Multiplayer Arena",
    description: "2-4 player online arena via socket.io relay",
    icon: <Users className="w-4 h-4 text-purple-400" />,
    file: "multiplayer_template.py",
    content: `"""Multiplayer arena template — Lapia Studio

Connects to the Lapia multiplayer relay (socket.io) running at /api/multiplayer.
Each player controls a colored circle. Move with arrow keys, see others move
in real-time. Up to 4 players per room.

This template runs in-browser via Pyodide and uses the JS bridge to talk
to socket.io directly.
"""
from lapia_shim import Game, Scene, Sprite, Vector2, Color, Math
import math
import random
import json


# ---- Network bridge to socket.io (via JS) ----
class MultiplayerClient:
    """Talks to socket.io via JS bridge."""
    def __init__(self):
        import js
        self.js = js
        self.socket = None
        self.player_id = None
        self.peers = {}  # peer_id -> {pos, vel, color, name}
        self.connected = False
        self.connect()

    def connect(self):
        try:
            # Use the global socket.io client loaded by the IDE
            self.socket = self.js.window._lapiaSocket
            if self.socket is None:
                print("[Multiplayer] Socket not initialized. Running in solo mode.")
                return
            self.socket.on('connect', self._on_connect)
            self.socket.on('disconnect', self._on_disconnect)
            self.socket.on('player_joined', self._on_player_joined)
            self.socket.on('player_left', self._on_player_left)
            self.socket.on('state_update', self._on_state_update)
        except Exception as e:
            print(f"[Multiplayer] Connect failed: {e}")

    def _on_connect(self, *args):
        self.connected = True
        self.player_id = self.socket.id
        print(f"[Multiplayer] Connected as {self.player_id}")

    def _on_disconnect(self, *args):
        self.connected = False
        print("[Multiplayer] Disconnected")

    def _on_player_joined(self, data):
        pid = data['id']
        if pid != self.player_id:
            self.peers[pid] = {
                'pos': Vector2(data.get('x', 400), data.get('y', 300)),
                'color': data.get('color', [200, 200, 200]),
                'name': data.get('name', 'Player'),
            }
            print(f"[Multiplayer] {data.get('name', 'Player')} joined")

    def _on_player_left(self, data):
        pid = data['id']
        if pid in self.peers:
            del self.peers[pid]
            print(f"[Multiplayer] Player left")

    def _on_state_update(self, data):
        pid = data['id']
        if pid != self.player_id and pid in self.peers:
            self.peers[pid]['pos'] = Vector2(data['x'], data['y'])

    def send_state(self, pos, vel, color, name):
        if not self.connected or self.socket is None:
            return
        try:
            self.socket.emit('state_update', {
                'x': pos.x, 'y': pos.y,
                'vx': vel.x, 'vy': vel.y,
                'color': [color.r, color.g, color.b],
                'name': name,
            })
        except Exception as e:
            pass  # silent fail

    @property
    def peer_count(self):
        return len(self.peers)


# ---- Player ----
PLAYER_COLORS = [
    Color(80, 200, 120),
    Color(80, 130, 240),
    Color(240, 180, 80),
    Color(220, 80, 100),
]

class ArenaPlayer:
    def __init__(self, x, y, color):
        self.pos = Vector2(x, y)
        self.vel = Vector2(0, 0)
        self.size = 24
        self.speed = 240
        self.color = color
        self.sprite = Sprite(color=color, size=(self.size, self.size), layer='player')
        self.sprite.position = self.pos
        self.name = f"Player-{random.randint(1000, 9999)}"

    def update(self, dt, input_mgr):
        vx, vy = 0, 0
        if input_mgr.key_down('left') or input_mgr.key_down('a'): vx -= 1
        if input_mgr.key_down('right') or input_mgr.key_down('d'): vx += 1
        if input_mgr.key_down('up') or input_mgr.key_down('w'): vy -= 1
        if input_mgr.key_down('down') or input_mgr.key_down('s'): vy += 1
        v = Vector2(vx, vy)
        if v.magnitude > 0:
            v = v.normalized * self.speed
        self.pos.x += v.x * dt
        self.pos.y += v.y * dt
        # Clamp to arena
        self.pos.x = Math.clamp(self.pos.x, 20, 780)
        self.pos.y = Math.clamp(self.pos.y, 20, 580)
        self.sprite.position = self.pos


class ArenaScene(Scene):
    def on_load(self):
        self.player = ArenaPlayer(400, 300, PLAYER_COLORS[random.randint(0, 3)])
        self.net = MultiplayerClient()
        self.send_timer = 0
        self.bg_color = Color(30, 32, 40)

    def on_update(self, dt):
        self.player.update(dt, self.input)
        # Send state every 50ms (20 Hz)
        self.send_timer -= dt
        if self.send_timer <= 0:
            self.net.send_state(self.player.pos, self.player.vel, self.player.color, self.player.name)
            self.send_timer = 0.05

    def on_render(self, r):
        # Arena border
        r.fill_rect(Vector2(10, 10), Vector2(780, 580), Color(40, 44, 56))
        r.fill_rect(Vector2(15, 15), Vector2(770, 570), Color(25, 28, 36))
        # Grid
        for x in range(0, 800, 40):
            r.draw_line(Vector2(x, 15), Vector2(x, 585), Color(50, 54, 62), 1)
        for y in range(0, 600, 40):
            r.draw_line(Vector2(15, y), Vector2(785, y), Color(50, 54, 62), 1)
        # Render peers
        for pid, peer in self.net.peers.items():
            col = Color(*peer['color'])
            peer_sprite = Sprite(color=col, size=(24, 24), layer='enemy')
            peer_sprite.position = peer['pos']
            peer_sprite.render(r.surface, self.camera)
            r.draw_text(peer['pos'] + Vector2(-30, -25), peer['name'][:12], color=Color(200, 200, 200), size=12)
        # Render local player
        self.player.sprite.render(r.surface, self.camera)
        r.draw_text(self.player.pos + Vector2(-30, -25), self.player.name + " (you)", color=Color(255, 255, 100), size=12)
        # HUD
        r.draw_text(Vector2(20, 20), f"Players: {self.net.peer_count + 1}", color=Color(255, 255, 255), size=20)
        status = "Online" if self.net.connected else "Solo (no relay)"
        r.draw_text(Vector2(20, 45), f"Status: {status}", color=self.net.connected and Color(100, 220, 100) or Color(220, 180, 80), size=16)


game = Game(title="Multiplayer Arena", size=(800, 600), fps=60)
game.run(ArenaScene())
`,
  },
  {
    id: "physics-sandbox",
    name: "Physics Sandbox",
    description: "Bouncing balls, gravity, walls, restitution",
    icon: <Zap className="w-4 h-4 text-amber-400" />,
    file: "physics_template.py",
    content: `"""Physics sandbox template — Lapia Studio"""
from lapia_shim import Game, Scene, Sprite, Vector2, Color, Math
import math
import random


class Ball:
    def __init__(self, x, y, radius=12, color=None):
        self.pos = Vector2(x, y)
        self.vel = Vector2(random.uniform(-100, 100), random.uniform(-100, 100))
        self.radius = radius
        self.color = color or Color(random.randint(100, 255), random.randint(100, 255), random.randint(100, 255))
        self.sprite = Sprite(color=self.color, size=(radius * 2, radius * 2), layer='entity')
        self.sprite.position = self.pos

    def update(self, dt):
        # Gravity
        self.vel.y += 800 * dt
        # Move
        self.pos.x += self.vel.x * dt
        self.pos.y += self.vel.y * dt
        # Walls
        if self.pos.x < self.radius:
            self.pos.x = self.radius
            self.vel.x = abs(self.vel.x) * 0.85
        if self.pos.x > 800 - self.radius:
            self.pos.x = 800 - self.radius
            self.vel.x = -abs(self.vel.x) * 0.85
        if self.pos.y < self.radius:
            self.pos.y = self.radius
            self.vel.y = abs(self.vel.y) * 0.85
        if self.pos.y > 600 - self.radius:
            self.pos.y = 600 - self.radius
            self.vel.y = -abs(self.vel.y) * 0.85
            self.vel.x *= 0.99  # ground friction
        self.sprite.position = self.pos


class PhysicsScene(Scene):
    def on_load(self):
        self.balls = []
        for i in range(15):
            self.balls.append(Ball(
                random.uniform(50, 750),
                random.uniform(50, 300),
                radius=random.randint(8, 20),
            ))
        self.spawn_timer = 0

    def on_update(self, dt):
        for ball in self.balls:
            ball.update(dt)
        # Ball-ball collision (basic)
        for i in range(len(self.balls)):
            for j in range(i + 1, len(self.balls)):
                a, b = self.balls[i], self.balls[j]
                diff = b.pos - a.pos
                dist = diff.magnitude
                min_dist = a.radius + b.radius
                if dist < min_dist and dist > 0.001:
                    overlap = (min_dist - dist) / 2
                    n = diff.normalized
                    a.pos -= n * overlap
                    b.pos += n * overlap
                    # Swap velocities along normal (1D elastic collision with equal mass)
                    av = a.vel.dot(n)
                    bv = b.vel.dot(n)
                    a.vel += n * (bv - av)
                    b.vel += n * (av - bv)
        # Click to spawn
        if self.input.mouse_pressed(1):
            mp = self.input.mouse_position
            self.balls.append(Ball(mp.x, mp.y, radius=random.randint(8, 20)))
            if len(self.balls) > 50:
                self.balls.pop(0)

    def on_render(self, r):
        r.fill_rect(Vector2(0, 0), Vector2(800, 600), Color(20, 22, 30))
        for ball in self.balls:
            ball.sprite.render(r.surface, self.camera)
        r.draw_text(Vector2(20, 20), f"Balls: {len(self.balls)} (click to add)", color=Color(255, 255, 255), size=20)


game = Game(title="Physics Sandbox", size=(800, 600), fps=60)
game.run(PhysicsScene())
`,
  },
];

export function TemplatesPanel() {
  const { createFile, openFile, addConsole } = useStudio();

  const handleUse = (tpl: Template) => {
    createFile(tpl.file, "python");
    useStudio.getState().setFile(tpl.file, tpl.content, "python");
    openFile(tpl.file);
    toast.success(`Created ${tpl.file}`, {
      description: tpl.description,
    });
    addConsole("success", `Loaded template: ${tpl.name}`);
  };

  return (
    <div className="flex flex-col h-full bg-[var(--studio-explorer)] border-r border-border">
      <div className="flex items-center justify-between px-2 h-7 border-b border-border bg-[var(--studio-toolbar)]">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
          <Boxes className="w-3 h-3" />
          Templates
        </span>
      </div>
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {TEMPLATES.map((tpl) => (
          <button
            key={tpl.id}
            onClick={() => handleUse(tpl)}
            className="w-full text-left p-3 rounded border border-border hover:border-primary hover:bg-accent transition-colors group"
          >
            <div className="flex items-center gap-2 mb-1">
              {tpl.icon}
              <span className="text-sm font-medium">{tpl.name}</span>
              <FileCode2 className="w-3 h-3 ml-auto opacity-0 group-hover:opacity-100 text-muted-foreground" />
            </div>
            <p className="text-xs text-muted-foreground">{tpl.description}</p>
          </button>
        ))}
      </div>
    </div>
  );
}

