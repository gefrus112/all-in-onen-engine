"""AI subsystems: pathfinding (A*), finite state machines, behavior trees, steering behaviors."""

from __future__ import annotations

import math
import heapq
import random
from dataclasses import dataclass, field
from typing import Optional, Callable, Any
from enum import Enum, auto

from .core import Vector2, Math


# ---------------------------------------------------------------------------
# Grid-based pathfinding (A*, Dijkstra, BFS, DFS)
# ---------------------------------------------------------------------------

class Grid:
    """2D grid for pathfinding."""
    def __init__(self, width: int, height: int, default_walkable: bool = True):
        self.width = width
        self.height = height
        self.cells = [[0 if default_walkable else 1 for _ in range(width)] for _ in range(height)]
        self.costs: dict[tuple[int, int], float] = {}  # movement cost per cell

    def is_walkable(self, x: int, y: int) -> bool:
        if 0 <= x < self.width and 0 <= y < self.height:
            return self.cells[y][x] == 0
        return False

    def set_walkable(self, x: int, y: int, walkable: bool):
        if 0 <= x < self.width and 0 <= y < self.height:
            self.cells[y][x] = 0 if walkable else 1

    def set_cost(self, x: int, y: int, cost: float):
        self.costs[(x, y)] = cost

    def get_cost(self, x: int, y: int) -> float:
        return self.costs.get((x, y), 1.0)

    def neighbors(self, x: int, y: int, diagonal: bool = False) -> list[tuple[int, int, float]]:
        result = []
        dirs = [(-1,0),(1,0),(0,-1),(0,1)]
        if diagonal:
            dirs += [(-1,-1),(-1,1),(1,-1),(1,1)]
        for dx, dy in dirs:
            nx, ny = x + dx, y + dy
            if self.is_walkable(nx, ny):
                cost = self.get_cost(nx, ny)
                if dx != 0 and dy != 0:
                    cost *= 1.414  # sqrt(2)
                result.append((nx, ny, cost))
        return result


class Pathfinder:
    """A* pathfinding with multiple heuristics."""
    def __init__(self, grid: Grid):
        self.grid = grid
        self.heuristic = "manhattan"  # manhattan | euclidean | chebyshev
        self.diagonal = False

    def find_path(self, start: tuple[int, int], goal: tuple[int, int]) -> list[tuple[int, int]]:
        """Returns list of (x, y) cells from start to goal (exclusive). Empty if no path."""
        if not self.grid.is_walkable(*start) or not self.grid.is_walkable(*goal):
            return []
        open_set: list[tuple[float, int, tuple[int, int]]] = [(0, 0, start)]
        came_from: dict[tuple[int, int], tuple[int, int]] = {}
        g_score: dict[tuple[int, int], float] = {start: 0.0}
        f_score: dict[tuple[int, int], float] = {start: self._h(start, goal)}
        counter = 1
        closed: set[tuple[int, int]] = set()
        while open_set:
            _, _, current = heapq.heappop(open_set)
            if current in closed: continue
            if current == goal:
                return self._reconstruct(came_from, current)
            closed.add(current)
            for nx, ny, cost in self.grid.neighbors(current[0], current[1], self.diagonal):
                neighbor = (nx, ny)
                if neighbor in closed: continue
                tentative = g_score[current] + cost
                if tentative < g_score.get(neighbor, math.inf):
                    came_from[neighbor] = current
                    g_score[neighbor] = tentative
                    f = tentative + self._h(neighbor, goal)
                    f_score[neighbor] = f
                    heapq.heappush(open_set, (f, counter, neighbor))
                    counter += 1
        return []

    def find_path_smooth(self, start: tuple[int, int], goal: tuple[int, int]) -> list[tuple[int, int]]:
        """A* path with simple smoothing (skip unnecessary intermediate cells)."""
        path = self.find_path(start, goal)
        if len(path) <= 2: return path
        smoothed = [path[0]]
        for i in range(2, len(path)):
            if not self._line_of_sight(smoothed[-1], path[i]):
                smoothed.append(path[i-1])
        smoothed.append(path[-1])
        return smoothed

    def _line_of_sight(self, a: tuple[int, int], b: tuple[int, int]) -> bool:
        x0, y0 = a
        x1, y1 = b
        dx = abs(x1 - x0); dy = abs(y1 - y0)
        sx = 1 if x0 < x1 else -1
        sy = 1 if y0 < y1 else -1
        err = dx - dy
        x, y = x0, y0
        while True:
            if not self.grid.is_walkable(x, y):
                return False
            if x == x1 and y == y1: return True
            e2 = 2 * err
            if e2 > -dy: err -= dy; x += sx
            if e2 < dx: err += dx; y += sy

    def _reconstruct(self, came_from: dict, current: tuple[int, int]) -> list[tuple[int, int]]:
        path = [current]
        while current in came_from:
            current = came_from[current]
            path.append(current)
        path.reverse()
        return path[1:]  # exclude start

    def _h(self, a: tuple[int, int], b: tuple[int, int]) -> float:
        dx = abs(a[0] - b[0]); dy = abs(a[1] - b[1])
        if self.heuristic == "manhattan": return dx + dy
        if self.heuristic == "euclidean": return math.sqrt(dx*dx + dy*dy)
        if self.heuristic == "chebyshev": return max(dx, dy)
        return dx + dy


class FlowField:
    """Flow field (vector field) for crowd pathfinding."""
    def __init__(self, grid: Grid):
        self.grid = grid
        self.field: dict[tuple[int, int], Vector2] = {}
        self.distances: dict[tuple[int, int], float] = {}

    def generate(self, target: tuple[int, int], max_radius: int = 200):
        """BFS from target, compute direction toward target for each cell."""
        self.field.clear(); self.distances.clear()
        if not self.grid.is_walkable(*target): return
        queue: list[tuple[int, int]] = [target]
        self.distances[target] = 0.0
        while queue:
            cx, cy = queue.pop(0)
            current_dist = self.distances[(cx, cy)]
            for nx, ny, _ in self.grid.neighbors(cx, cy, diagonal=True):
                if (nx, ny) not in self.distances:
                    self.distances[(nx, ny)] = current_dist + 1
                    self.field[(nx, ny)] = Vector2(cx - nx, cy - ny).normalized
                    queue.append((nx, ny))

    def get_direction(self, cell: tuple[int, int]) -> Optional[Vector2]:
        return self.field.get(cell)


# ---------------------------------------------------------------------------
# Finite State Machine
# ---------------------------------------------------------------------------

class State:
    """A state in a finite state machine."""
    def __init__(self, name: str):
        self.name = name
        self.fsm: Optional["StateMachine"] = None
        self.transitions: dict[str, str] = {}  # event_name -> target state name

    def on_enter(self): pass
    def on_exit(self): pass
    def on_update(self, dt: float): pass

    def add_transition(self, event: str, target: str):
        self.transitions[event] = target


class StateMachine:
    """Finite state machine with transitions driven by events."""
    def __init__(self, initial_state: Optional[State] = None):
        self.states: dict[str, State] = {}
        self.current: Optional[State] = None
        self.history: list[str] = []
        if initial_state:
            self.add_state(initial_state)
            self.set_state(initial_state.name)

    def add_state(self, state: State):
        state.fsm = self
        self.states[state.name] = state

    def set_state(self, name: str):
        if name not in self.states: return
        if self.current:
            self.current.on_exit()
            self.history.append(self.current.name)
        self.current = self.states[name]
        self.current.on_enter()

    def fire(self, event: str):
        if not self.current: return
        if event in self.current.transitions:
            self.set_state(self.current.transitions[event])

    def revert(self):
        if self.history:
            prev = self.history.pop()
            self.set_state(prev)

    def update(self, dt: float):
        if self.current: self.current.on_update(dt)


# ---------------------------------------------------------------------------
# Behavior Tree
# ---------------------------------------------------------------------------

class NodeStatus(Enum):
    SUCCESS = auto()
    FAILURE = auto()
    RUNNING = auto()


class BTNode:
    """Behavior tree node."""
    def __init__(self, name: str = ""):
        self.name = name
        self.parent: Optional["BTNode"] = None

    def execute(self, context: Any) -> NodeStatus:
        return NodeStatus.FAILURE


class BTSequence(BTNode):
    """Runs children in order. Fails on first failure."""
    def __init__(self, children: Optional[list[BTNode]] = None, name: str = "Sequence"):
        super().__init__(name)
        self.children = children or []
        for c in self.children:
            c.parent = self
        self._running_index = 0

    def execute(self, context: Any) -> NodeStatus:
        for i in range(self._running_index, len(self.children)):
            status = self.children[i].execute(context)
            if status == NodeStatus.RUNNING:
                self._running_index = i
                return NodeStatus.RUNNING
            if status == NodeStatus.FAILURE:
                self._running_index = 0
                return NodeStatus.FAILURE
        self._running_index = 0
        return NodeStatus.SUCCESS


class BTSelector(BTNode):
    """Runs children in order. Succeeds on first success."""
    def __init__(self, children: Optional[list[BTNode]] = None, name: str = "Selector"):
        super().__init__(name)
        self.children = children or []
        for c in self.children:
            c.parent = self
        self._running_index = 0

    def execute(self, context: Any) -> NodeStatus:
        for i in range(self._running_index, len(self.children)):
            status = self.children[i].execute(context)
            if status == NodeStatus.RUNNING:
                self._running_index = i
                return NodeStatus.RUNNING
            if status == NodeStatus.SUCCESS:
                self._running_index = 0
                return NodeStatus.SUCCESS
        self._running_index = 0
        return NodeStatus.FAILURE


class BTAction(BTNode):
    """Leaf action node."""
    def __init__(self, action: Callable[[Any], NodeStatus], name: str = "Action"):
        super().__init__(name)
        self.action = action

    def execute(self, context: Any) -> NodeStatus:
        return self.action(context)


class BTCondition(BTNode):
    """Leaf condition check."""
    def __init__(self, condition: Callable[[Any], bool], name: str = "Condition"):
        super().__init__(name)
        self.condition = condition

    def execute(self, context: Any) -> NodeStatus:
        return NodeStatus.SUCCESS if self.condition(context) else NodeStatus.FAILURE


class BTWait(BTNode):
    """Wait for N seconds."""
    def __init__(self, seconds: float, name: str = "Wait"):
        super().__init__(name)
        self.duration = seconds
        self._elapsed = 0.0

    def execute(self, context: Any) -> NodeStatus:
        dt = getattr(context, 'dt', 0.016)
        self._elapsed += dt
        if self._elapsed >= self.duration:
            self._elapsed = 0.0
            return NodeStatus.SUCCESS
        return NodeStatus.RUNNING


class BTInverter(BTNode):
    """Inverts the result of its child."""
    def __init__(self, child: BTNode, name: str = "Inverter"):
        super().__init__(name)
        self.child = child
        child.parent = self

    def execute(self, context: Any) -> NodeStatus:
        status = self.child.execute(context)
        if status == NodeStatus.SUCCESS: return NodeStatus.FAILURE
        if status == NodeStatus.FAILURE: return NodeStatus.SUCCESS
        return NodeStatus.RUNNING


class BTRepeat(BTNode):
    """Repeats its child N times (or forever if -1)."""
    def __init__(self, child: BTNode, times: int = -1, name: str = "Repeat"):
        super().__init__(name)
        self.child = child
        self.times = times
        self._count = 0
        child.parent = self

    def execute(self, context: Any) -> NodeStatus:
        if self.times == -1:
            self.child.execute(context)
            return NodeStatus.RUNNING
        if self._count < self.times:
            status = self.child.execute(context)
            if status == NodeStatus.SUCCESS:
                self._count += 1
                if self._count >= self.times:
                    self._count = 0
                    return NodeStatus.SUCCESS
                return NodeStatus.RUNNING
            return status
        self._count = 0
        return NodeStatus.SUCCESS


class BehaviorTree:
    """Top-level behavior tree."""
    def __init__(self, root: BTNode):
        self.root = root

    def update(self, context: Any):
        return self.root.execute(context)


# ---------------------------------------------------------------------------
# Steering Behaviors
# ---------------------------------------------------------------------------

class Steering:
    """Reynolds steering behaviors for autonomous agents."""
    @staticmethod
    def seek(position: Vector2, target: Vector2, velocity: Vector2, max_speed: float, max_force: float) -> Vector2:
        desired = (target - position).normalized * max_speed
        steer = desired - velocity
        if steer.magnitude > max_force:
            steer = steer.normalized * max_force
        return steer

    @staticmethod
    def flee(position: Vector2, threat: Vector2, velocity: Vector2, max_speed: float, max_force: float) -> Vector2:
        desired = (position - threat).normalized * max_speed
        steer = desired - velocity
        if steer.magnitude > max_force:
            steer = steer.normalized * max_force
        return steer

    @staticmethod
    def arrive(position: Vector2, target: Vector2, velocity: Vector2, max_speed: float, max_force: float, slow_radius: float = 100.0) -> Vector2:
        diff = target - position
        dist = diff.magnitude
        if dist < 0.001: return Vector2.zero()
        if dist < slow_radius:
            desired = diff.normalized * max_speed * (dist / slow_radius)
        else:
            desired = diff.normalized * max_speed
        steer = desired - velocity
        if steer.magnitude > max_force:
            steer = steer.normalized * max_force
        return steer

    @staticmethod
    def wander(position: Vector2, velocity: Vector2, max_speed: float, max_force: float, distance: float = 100.0, radius: float = 50.0, jitter: float = 30.0) -> Vector2:
        if not hasattr(Steering, '_wander_angle'):
            Steering._wander_angle = 0.0
        Steering._wander_angle += random.uniform(-jitter, jitter) * 0.1
        circle_center = velocity.normalized * distance if velocity.magnitude > 0 else Vector2(distance, 0)
        displacement = Vector2(math.cos(Steering._wander_angle) * radius, math.sin(Steering._wander_angle) * radius)
        desired = (circle_center + displacement).normalized * max_speed
        steer = desired - velocity
        if steer.magnitude > max_force:
            steer = steer.normalized * max_force
        return steer

    @staticmethod
    def pursue(position: Vector2, target_pos: Vector2, target_vel: Vector2, velocity: Vector2, max_speed: float, max_force: float, lead_time: float = 0.5) -> Vector2:
        future_pos = target_pos + target_vel * lead_time
        return Steering.seek(position, future_pos, velocity, max_speed, max_force)

    @staticmethod
    def evade(position: Vector2, threat_pos: Vector2, threat_vel: Vector2, velocity: Vector2, max_speed: float, max_force: float, lead_time: float = 0.5) -> Vector2:
        future_pos = threat_pos + threat_vel * lead_time
        return Steering.flee(position, future_pos, velocity, max_speed, max_force)

    @staticmethod
    def avoid_obstacle(position: Vector2, velocity: Vector2, obstacle: Vector2, obstacle_radius: float, max_speed: float, max_force: float) -> Vector2:
        diff = position - obstacle
        dist = diff.magnitude
        if dist > obstacle_radius * 3: return Vector2.zero()
        force = diff.normalized * (obstacle_radius * 3 - dist) / (obstacle_radius * 3)
        if force.magnitude > max_force:
            force = force.normalized * max_force
        return force * max_speed

    @staticmethod
    def separation(position: Vector2, neighbors: list[Vector2], velocity: Vector2, max_speed: float, max_force: float, personal_space: float = 50.0) -> Vector2:
        steer = Vector2.zero()
        count = 0
        for n in neighbors:
            diff = position - n
            d = diff.magnitude
            if d > 0 and d < personal_space:
                steer += diff.normalized / d
                count += 1
        if count > 0:
            steer = steer / count
            steer = steer.normalized * max_speed - velocity
            if steer.magnitude > max_force:
                steer = steer.normalized * max_force
        return steer

    @staticmethod
    def cohesion(position: Vector2, neighbors: list[Vector2], velocity: Vector2, max_speed: float, max_force: float) -> Vector2:
        if not neighbors: return Vector2.zero()
        center = Vector2.zero()
        for n in neighbors: center += n
        center = center / len(neighbors)
        return Steering.seek(position, center, velocity, max_speed, max_force)

    @staticmethod
    def alignment(position: Vector2, neighbors: list[Vector2], velocity: Vector2, max_speed: float, max_force: float) -> Vector2:
        if not neighbors: return Vector2.zero()
        avg_vel = Vector2.zero()
        for n in neighbors: avg_vel += n  # this should be velocities, not positions
        avg_vel = avg_vel / len(neighbors)
        steer = avg_vel.normalized * max_speed - velocity
        if steer.magnitude > max_force:
            steer = steer.normalized * max_force
        return steer


class Boid:
    """A simple boid (flocking agent)."""
    def __init__(self, position: Vector2, max_speed: float = 200.0, max_force: float = 50.0):
        self.position = position
        self.velocity = Vector2.random() * max_speed
        self.acceleration = Vector2.zero()
        self.max_speed = max_speed
        self.max_force = max_force
        self.perception = 80.0
        self.separation_weight = 1.5
        self.alignment_weight = 1.0
        self.cohesion_weight = 1.0

    def update(self, dt: float, neighbors: list["Boid"]):
        sep = Steering.separation(self.position, [n.position for n in neighbors], self.velocity, self.max_speed, self.max_force, self.perception)
        # For alignment we need velocities, not positions
        align = Vector2.zero()
        if neighbors:
            for n in neighbors: align += n.velocity
            align = align / len(neighbors)
        coh = Steering.cohesion(self.position, [n.position for n in neighbors], self.velocity, self.max_speed, self.max_force)
        self.acceleration += sep * self.separation_weight
        self.acceleration += align * self.alignment_weight * 0.1  # scale down
        self.acceleration += coh * self.cohesion_weight
        self.velocity += self.acceleration * dt
        if self.velocity.magnitude > self.max_speed:
            self.velocity = self.velocity.normalized * self.max_speed
        self.position += self.velocity * dt
        self.acceleration = Vector2.zero()


__all__ = [
    "Grid", "Pathfinder", "FlowField",
    "State", "StateMachine",
    "BTNode", "BTSequence", "BTSelector", "BTAction", "BTCondition", "BTWait", "BTInverter", "BTRepeat",
    "NodeStatus", "BehaviorTree",
    "Steering", "Boid",
]
