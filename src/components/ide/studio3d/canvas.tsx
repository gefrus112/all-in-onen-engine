// All In One Engine — 3D Studio in-canvas engine components
"use client";

import { useRef, useEffect } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { TransformControls } from "@react-three/drei";
import * as THREE from "three";
import type { SceneObject3D, WorldSettings } from "./types";
import type { PlayerRef } from "./rpg";

export interface ScriptLogFn {
  (type: "info" | "warn" | "error" | "success", text: string): void;
}
type Vec3 = [number, number, number];
const UP = new THREE.Vector3(0, 1, 0);

// ================= World environment (lighting + sky + fog) =================
export function WorldEnvironment({ world, hideGrid, baseHalf = [7, 7] }: { world: WorldSettings; hideGrid: boolean; baseHalf?: [number, number] }) {
  const el = (world.sunElevation * Math.PI) / 180;
  const az = (world.sunAzimuth * Math.PI) / 180;
  const sunPos: Vec3 = [Math.cos(el) * Math.cos(az) * 30, Math.sin(el) * 30, Math.cos(el) * Math.sin(az) * 30];

  return (
    <>
      <color attach="background" args={[world.skyColor]} />
      {world.fogEnabled && <fogExp2 attach="fog" args={[world.fogColor, world.fogDensity * 0.055]} />}

      <ambientLight intensity={world.ambientIntensity} color={world.ambientColor} />
      <hemisphereLight intensity={world.ambientIntensity * 0.6} color={world.skyColor} groundColor="#3a5a30" />
      <directionalLight
        key={`${world.shadowMapSize}-${world.shadows}`}
        position={sunPos}
        intensity={world.sunIntensity}
        color={world.sunColor}
        castShadow={world.shadows}
        shadow-mapSize-width={world.shadowMapSize}
        shadow-mapSize-height={world.shadowMapSize}
        shadow-camera-far={90}
        shadow-camera-left={-30}
        shadow-camera-right={30}
        shadow-camera-top={30}
        shadow-camera-bottom={-30}
        shadow-bias={-0.0004}
      />

      {!hideGrid && (
        <gridHelper args={[80, 80, "#3a3f4a", "#2a2f38"]} position={[0, -0.01, 0]} />
      )}
      <EdgeWater world={world} baseHalf={baseHalf} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, world.edgeWater ? -0.28 : -0.02, 0]} receiveShadow>
        <planeGeometry args={world.edgeWater ? [Math.max(baseHalf[0], baseHalf[1]) * 2 + 5, Math.max(baseHalf[0], baseHalf[1]) * 2 + 5] : [120, 120]} />
        <meshStandardMaterial color={world.lightPreset === "night" || world.lightPreset === "underworld" ? "#10141c" : "#39424f"} transparent opacity={0.35} />
      </mesh>
    </>
  );
}

// ================= Pipeline: tone mapping, exposure, FOV =================
export function PipelineSettings({ world }: { world: WorldSettings }) {
  const { gl, camera } = useThree();
  useEffect(() => {
    const map: Record<string, THREE.ToneMapping> = {
      aces: THREE.ACESFilmicToneMapping,
      linear: THREE.LinearToneMapping,
      reinhard: THREE.ReinhardToneMapping,
      none: THREE.NoToneMapping,
    };
    gl.toneMapping = map[world.toneMapping] ?? THREE.ACESFilmicToneMapping;
    gl.toneMappingExposure = world.exposure;
    const cam = camera as THREE.PerspectiveCamera;
    if (cam.isPerspectiveCamera) {
      cam.fov = world.fov;
      cam.updateProjectionMatrix();
    }
  }, [gl, camera, world.toneMapping, world.exposure, world.fov]);
  return null;
}

// ================= Screenshot registrar =================
export function ScreenshotRegistrar() {
  const gl = useThree((s) => s.gl);
  useEffect(() => {
    (window as unknown as { __aioeShot?: () => void }).__aioeShot = () => {
      const url = gl.domElement.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = url;
      a.download = `aioe-3d-scene-${Date.now()}.png`;
      a.click();
    };
    return () => { delete (window as unknown as { __aioeShot?: () => void }).__aioeShot; };
  }, [gl]);
  return null;
}

// ================= Edge water — animated ocean around the baseplate =================
export function EdgeWater({ world, baseHalf = [7, 7] }: { world: WorldSettings; baseHalf?: [number, number] }) {
  const geoRef = useRef<THREE.PlaneGeometry>(null);
  const baseRef = useRef<Float32Array | null>(null);
  const half = Math.max(baseHalf[0], baseHalf[1]);

  useFrame((state) => {
    const geo = geoRef.current;
    if (!geo) return;
    if (!baseRef.current) {
      baseRef.current = Float32Array.from(geo.attributes.position.array as Float32Array);
    }
    const b = baseRef.current;
    const t = state.clock.elapsedTime;
    const pos = geo.attributes.position as THREE.BufferAttribute;
    const arr = pos.array as Float32Array;
    for (let i = 0; i < arr.length; i += 3) {
      const x = b[i];
      const y = b[i + 1];
      // gentle traveling waves on two axes
      arr[i + 2] =
        Math.sin(x * 0.28 + t * 1.15) * 0.16 +
        Math.sin(y * 0.22 + t * 0.85 + x * 0.1) * 0.13 +
        Math.sin((x + y) * 0.45 + t * 1.9) * 0.05;
    }
    pos.needsUpdate = true;
    geo.computeVertexNormals();
  });

  if (!world.edgeWater) return null;
  const y = world.edgeWaterLevel;

  return (
    <group position={[0, y, 0]}>
      {/* main animated ocean */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow={false}>
        <planeGeometry ref={geoRef} args={[240, 240, 72, 72]} />
        <meshStandardMaterial
          color={world.edgeWaterColor}
          transparent
          opacity={0.82}
          roughness={0.12}
          metalness={0.25}
          emissive={world.edgeWaterColor}
          emissiveIntensity={0.06}
        />
      </mesh>
      {/* bright shoreline ring hugging the baseplate edge */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.012, 0]}>
        <ringGeometry args={[half + 0.4, half + 1.7, 64]} />
        <meshBasicMaterial color={"#bfe6ff"} transparent opacity={0.16} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
      {/* soft foam dots drifting on the surface */}
      {Array.from({ length: 14 }).map((_, i) => {
        const a = (i / 14) * Math.PI * 2;
        const r = half + 4 + (i % 4) * 3.2;
        return (
          <FoamDot key={i} radius={r} angle={a} speed={0.35 + (i % 5) * 0.12} offset={i * 1.3} color={world.edgeWaterColor} />
        );
      })}
    </group>
  );
}

function FoamDot({ radius, angle, speed, offset, color }: { radius: number; angle: number; speed: number; offset: number; color: string }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    const m = ref.current;
    if (!m) return;
    const t = state.clock.elapsedTime * speed + offset;
    const wob = Math.sin(t * 0.7) * 1.6;
    m.position.set(Math.cos(angle + t * 0.05) * (radius + wob), Math.sin(t * 1.4) * 0.05, Math.sin(angle + t * 0.05) * (radius + wob));
    const s = 0.35 + Math.sin(t * 2.2) * 0.15;
    m.scale.setScalar(Math.max(0.15, s));
  });
  return (
    <mesh ref={ref} rotation={[-Math.PI / 2, 0, 0]}>
      <circleGeometry args={[0.5, 12]} />
      <meshBasicMaterial color={"#dff2ff"} transparent opacity={0.22} depthWrite={false} />
    </mesh>
  );
}

// ================= Script runtime — runs object scripts during play =================
interface CompiledScript {
  objId: string;
  scriptId: string;
  name: string;
  onStart: ((self: unknown, engine: unknown) => void) | null;
  update: ((dt: number, self: unknown) => void) | null;
  errored: boolean;
  started: boolean;
}

interface SelfHandle {
  obj3d: THREE.Object3D;
  home: { p: THREE.Vector3; r: THREE.Euler; s: THREE.Vector3 };
  material: THREE.MeshStandardMaterial | null;
  matHome: { color: THREE.Color; opacity: number } | null;
  def: SceneObject3D;
}

export function ScriptRuntime({ objects, active, keysRef, playerRef, logDebug }: {
  objects: SceneObject3D[];
  active: boolean;
  keysRef: React.MutableRefObject<Record<string, boolean>>;
  playerRef: React.MutableRefObject<PlayerRef>;
  logDebug: ScriptLogFn;
}) {
  const { scene } = useThree();
  const handles = useRef<Map<string, SelfHandle>>(new Map());
  const compiled = useRef<CompiledScript[]>([]);
  const keyPressed = useRef<Set<string>>(new Set());
  const clockStart = useRef(0);

  // track key just-pressed
  useEffect(() => {
    if (!active) { keyPressed.current.clear(); return; }
    const down = (e: KeyboardEvent) => keyPressed.current.add(e.key.toLowerCase());
    window.addEventListener("keydown", down);
    return () => window.removeEventListener("keydown", down);
  }, [active]);

  // compile on play start
  useEffect(() => {
    if (!active) {
      // restore everything the scripts touched
      handles.current.forEach((h) => {
        h.obj3d.position.copy(h.home.p);
        h.obj3d.rotation.copy(h.home.r);
        h.obj3d.scale.copy(h.home.s);
        if (h.material && h.matHome) {
          h.material.color.copy(h.matHome.color);
          h.material.opacity = h.matHome.opacity;
          h.material.transparent = h.matHome.opacity < 1;
          h.material.needsUpdate = true;
        }
      });
      handles.current.clear();
      compiled.current = [];
      return;
    }

    const t = setTimeout(() => {
      // resolve live Object3Ds by userData.aioeId
      const found = new Map<string, THREE.Object3D>();
      scene.traverse((o) => {
        const id = o.userData?.aioeId as string | undefined;
        if (id && !found.has(id)) found.set(id, o);
      });

      const list: CompiledScript[] = [];
      const newHandles = new Map<string, SelfHandle>();
      objects.forEach((def) => {
        (def.scripts ?? []).forEach((s) => {
          if (!s.enabled) return;
          const obj3d = found.get(def.id);
          if (!obj3d) return;
          if (!newHandles.has(def.id)) {
            let material: THREE.MeshStandardMaterial | null = null;
            obj3d.traverse((c) => {
              const m = (c as THREE.Mesh).material as THREE.MeshStandardMaterial | undefined;
              if (!material && m && (m as THREE.MeshStandardMaterial).color) material = m as THREE.MeshStandardMaterial;
            });
            newHandles.set(def.id, {
              obj3d,
              home: { p: obj3d.position.clone(), r: obj3d.rotation.clone(), s: obj3d.scale.clone() },
              material,
              matHome: material ? { color: material.color.clone(), opacity: material.opacity } : null,
              def,
            });
          }
          try {
            // eslint-disable-next-line @typescript-eslint/no-implied-eval, no-new-func
            const factory = new Function(
              "self", "engine", "input", "time", "print",
              `"use strict";
               let __update = null, __onStart = null;
               (function () {
                 ${s.code}
                 __update = typeof update === "function" ? update : null;
                 __onStart = typeof onStart === "function" ? onStart : null;
               })();
               return { update: __update, onStart: __onStart };`,
            );
            list.push({ objId: def.id, scriptId: s.id, name: s.name, onStart: null, update: null, errored: false, started: false, ...({} as Record<string, never>) });
            // call factory later with live handles (stored below)
            (list[list.length - 1] as CompiledScript & { factory?: unknown }).factory = factory;
          } catch (err) {
            logDebug("error", `Script "${s.name}" failed to compile: ${(err as Error).message}`);
          }
        });
      });
      handles.current = newHandles;
      compiled.current = list;
      clockStart.current = performance.now();
      logDebug("success", `Script runtime: ${list.length} script(s) running`);
    }, 60);
    return () => clearTimeout(t);
  }, [active]); // eslint-disable-line react-hooks/exhaustive-deps

  useFrame((state, delta) => {
    if (!active || compiled.current.length === 0) return;
    const dt = Math.min(delta, 0.05);
    const time = (performance.now() - clockStart.current) / 1000;

    compiled.current.forEach((cs) => {
      if (cs.errored) return;
      const h = handles.current.get(cs.objId);
      if (!h) return;
      const fac = (cs as CompiledScript & { factory?: (self: unknown, engine: unknown, input: unknown, time: unknown, print: (msg: string) => void) => { update: ((dt: number, self: unknown) => void) | null; onStart: ((self: unknown, engine: unknown) => void) | null } }).factory;
      if (!fac) return;

      // lazily create the sandbox per script
      if (!cs.started) {
        try {
          const engine = {
            time,
            dt,
            player: playerRef.current.pos,
            find: (name: string) => {
              for (const [, hh] of handles.current) if (hh.def.name === name) return makeSelf(hh);
              return null;
            },
          };
          const input = {
            key: (k: string) => !!keysRef.current[k.toLowerCase()],
            keyPressed: (k: string) => keyPressed.current.has(k.toLowerCase()),
            mouseDown: playerRef.current.moving, // approximation kept for API completeness
          };
          const print = (msg: string) => logDebug("info", `[${cs.name}] ${String(msg)}`);
          const self = makeSelf(h);
          const api = fac(self, engine, input, { now: time, dt }, print);
          cs.update = api.update;
          cs.onStart = api.onStart;
          cs.started = true;
          if (cs.onStart) {
            try { cs.onStart(self, engine); } catch (err) {
              cs.errored = true;
              logDebug("error", `Script "${cs.name}" onStart error: ${(err as Error).message}`);
            }
          }
        } catch (err) {
          cs.errored = true;
          logDebug("error", `Script "${cs.name}" init error: ${(err as Error).message}`);
        }
        return;
      }

      if (cs.update) {
        try {
          cs.update(dt, makeSelf(h));
        } catch (err) {
          cs.errored = true;
          logDebug("error", `Script "${cs.name}" runtime error: ${(err as Error).message}`);
        }
      }
    });
  });

  return null;
}

function makeSelf(h: SelfHandle) {
  return {
    name: h.def.name,
    id: h.def.id,
    tag: h.def.tag ?? "",
    get position() { return h.obj3d.position; },
    set position(v: { x: number; y: number; z: number }) { h.obj3d.position.set(v.x, v.y, v.z); },
    get rotation() { return h.obj3d.rotation; },
    get scale() { return h.obj3d.scale; },
    move(x: number, y: number, z: number) { h.obj3d.position.x += x; h.obj3d.position.y += y; h.obj3d.position.z += z; },
    rotate(x: number, y: number, z: number) { h.obj3d.rotation.x += x; h.obj3d.rotation.y += y; h.obj3d.rotation.z += z; },
    setColor(hex: string) { if (h.material) { h.material.color.set(hex); h.material.needsUpdate = true; } },
    setOpacity(o: number) { if (h.material) { const c = Math.max(0.05, Math.min(1, o)); h.material.opacity = c; h.material.transparent = c < 1; h.material.needsUpdate = true; } },
  };
}

// ================= Player controller (first-person / third-person / orbit) =================
export function PlayerController({ isPlaying, cameraMode, playerRef, keysRef, backupRef, waterLevel, baseHalf }: {
  isPlaying: boolean;
  cameraMode: "orbit" | "first-person" | "third-person";
  playerRef: React.MutableRefObject<PlayerRef>;
  keysRef: React.MutableRefObject<Record<string, boolean>>;
  backupRef: React.MutableRefObject<{ pos: THREE.Vector3; quat: THREE.Quaternion; target: THREE.Vector3 | null } | null>;
  waterLevel: number | null;
  baseHalf: [number, number];
}) {
  const { camera, controls } = useThree() as unknown as { camera: THREE.PerspectiveCamera; controls: { target: THREE.Vector3; enabled: boolean; update: () => void } | null };

  // save/restore editor camera around play sessions
  useEffect(() => {
    if (isPlaying) {
      backupRef.current = {
        pos: camera.position.clone(),
        quat: camera.quaternion.clone(),
        target: controls ? controls.target.clone() : null,
      };
      const dir = new THREE.Vector3();
      camera.getWorldDirection(dir);
      dir.y = 0;
      dir.normalize();
      playerRef.current.yaw = Math.atan2(-dir.x, -dir.z);
      playerRef.current.pitch = 0;
      playerRef.current.vy = 0;
      playerRef.current.onGround = true;
      return;
    }
    const b = backupRef.current;
    if (b) {
      camera.position.copy(b.pos);
      camera.quaternion.copy(b.quat);
      if (controls && b.target) {
        controls.target.copy(b.target);
        controls.enabled = true;
        controls.update();
      }
      backupRef.current = null;
    }
  }, [isPlaying]); // eslint-disable-line react-hooks/exhaustive-deps

  useFrame((state, delta) => {
    if (!isPlaying) return;
    const dt = Math.min(delta, 0.06);
    const p = playerRef.current;
    const k = keysRef.current;
    const speed = (k["shift"] ? 9.5 : 5.2) * (cameraMode === "orbit" ? 1 : 1);

    if (cameraMode !== "orbit") {
      const overWater = waterLevel !== null && (Math.abs(p.pos.x) > baseHalf[0] || Math.abs(p.pos.z) > baseHalf[1]);
      const f = new THREE.Vector3(-Math.sin(p.yaw), 0, -Math.cos(p.yaw));
      const r = new THREE.Vector3().crossVectors(f, UP);
      let mx = 0, mz = 0;
      if (k["w"]) { mx += f.x; mz += f.z; }
      if (k["s"]) { mx -= f.x; mz -= f.z; }
      if (k["d"]) { mx += r.x; mz += r.z; }
      if (k["a"]) { mx -= r.x; mz -= r.z; }
      const len = Math.hypot(mx, mz);
      p.moving = len > 0.01;
      if (len > 0.01) {
        const spd = speed * (overWater ? 0.5 : 1); // swimming is slower
        p.pos.x += (mx / len) * spd * dt;
        p.pos.z += (mz / len) * spd * dt;
      }
      if (overWater && waterLevel !== null) {
        // swim: buoyancy floats you at the surface, gentle bobbing
        const surface = waterLevel - 1.05 + Math.sin(state_clock_bob(p.pos)) * 0.05;
        p.vy += (surface - p.pos.y) * 10 * dt;   // spring toward surface
        p.vy *= 0.86;
        p.pos.y += p.vy * dt;
        p.onGround = false;
        if (k[" "]) p.pos.y += 2.2 * dt;         // paddle up
      } else {
        if (k[" "] && p.onGround) { p.vy = 7.6; p.onGround = false; }
        p.vy -= 22 * dt;
        p.pos.y += p.vy * dt;
        if (p.pos.y <= 0) { p.pos.y = 0; p.vy = 0; p.onGround = true; }
      }

      if (cameraMode === "first-person") {
        camera.position.set(p.pos.x, p.pos.y + 1.7, p.pos.z);
        camera.quaternion.setFromEuler(new THREE.Euler(p.pitch, p.yaw, 0, "YXZ"));
      } else {
        const back = new THREE.Vector3(Math.sin(p.yaw), 0, Math.cos(p.yaw));
        const camPos = p.pos.clone().addScaledVector(back, 4.6).add(new THREE.Vector3(0, 2.6, 0));
        camera.position.lerp(camPos, Math.min(1, dt * 8));
        camera.lookAt(p.pos.x, p.pos.y + 1.4, p.pos.z);
      }
    } else {
      // orbit play mode: free WASD glide (no pointer lock)
      const dir = new THREE.Vector3();
      camera.getWorldDirection(dir);
      dir.y = 0; dir.normalize();
      const r = new THREE.Vector3().crossVectors(dir, UP).negate();
      if (k["w"]) camera.position.addScaledVector(dir, speed * dt);
      if (k["s"]) camera.position.addScaledVector(dir, -speed * dt);
      if (k["a"]) camera.position.addScaledVector(r, speed * dt);
      if (k["d"]) camera.position.addScaledVector(r, -speed * dt);
    }

    if (controls) controls.enabled = false;
  });

  return null;
}

function state_clock_bob(p: THREE.Vector3) { return p.x * 0.3 + p.z * 0.2; }

// ================= Transform gizmo (wired move/rotate/scale) =================
export function GizmoProxy({ obj, tool, snap, enabled, onUpdate, onPushUndo }: {
  obj: SceneObject3D | null;
  tool: "move" | "rotate" | "scale" | "pan";
  snap: boolean;
  enabled: boolean;
  onUpdate: (id: string, key: string, value: unknown) => void;
  onPushUndo: () => void;
}) {
  const proxyRef = useRef<THREE.Group>(null);
  const dragging = useRef(false);

  useEffect(() => {
    if (!proxyRef.current || !obj || dragging.current) return;
    proxyRef.current.position.set(...obj.position);
    proxyRef.current.rotation.set(...obj.rotation);
    proxyRef.current.scale.set(...obj.scale);
  }, [obj?.id, obj?.position, obj?.rotation, obj?.scale]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!obj || !enabled || obj.locked) return null;
  const mode = tool === "move" ? "translate" : tool === "pan" ? "translate" : tool;

  return (
    <TransformControls
      object={proxyRef as React.RefObject<THREE.Group>}
      mode={mode as "translate" | "rotate" | "scale"}
      size={0.85}
      translationSnap={snap ? 0.5 : null}
      rotationSnap={snap ? Math.PI / 12 : null}
      scaleSnap={snap ? 0.1 : null}
      onMouseDown={() => { dragging.current = true; onPushUndo(); }}
      onMouseUp={() => { dragging.current = false; }}
      onObjectChange={() => {
        const g = proxyRef.current;
        if (!g || !obj) return;
        onUpdate(obj.id, "position", [g.position.x, g.position.y, g.position.z]);
        onUpdate(obj.id, "rotation", [g.rotation.x, g.rotation.y, g.rotation.z]);
        onUpdate(obj.id, "scale", [g.scale.x, g.scale.y, g.scale.z]);
      }}
    />
  );
}

// ================= Focus handler (F key / focus button) =================
export function FocusHandler({ focusCounter, objects, selectedId }: {
  focusCounter: number;
  objects: SceneObject3D[];
  selectedId: string | null;
}) {
  const { camera, controls } = useThree() as unknown as { camera: THREE.PerspectiveCamera; controls: { target: THREE.Vector3; update: () => void } | null };
  const anim = useRef<{ from: THREE.Vector3; to: THREE.Vector3; target: THREE.Vector3; t: number } | null>(null);

  useEffect(() => {
    if (!focusCounter) return;
    const obj = objects.find((o) => o.id === selectedId);
    const target = obj ? new THREE.Vector3(...obj.position) : new THREE.Vector3(0, 1, 0);
    const dir = new THREE.Vector3().subVectors(camera.position, target);
    if (dir.length() < 0.5) dir.set(6, 5, 8);
    dir.normalize();
    const to = target.clone().addScaledVector(dir, 9).add(new THREE.Vector3(0, 2.5, 0));
    anim.current = { from: camera.position.clone(), to, target, t: 0 };
  }, [focusCounter]); // eslint-disable-line react-hooks/exhaustive-deps

  useFrame((_, delta) => {
    if (!anim.current) return;
    const a = anim.current;
    a.t = Math.min(1, a.t + delta * 2.4);
    const e = 1 - Math.pow(1 - a.t, 3);
    camera.position.lerpVectors(a.from, a.to, e);
    if (controls) {
      controls.target.lerp(a.target, Math.min(1, e));
      controls.update();
    }
    if (a.t >= 1) anim.current = null;
  });

  return null;
}

// ================= Rigid body play-time simulation =================
export function RigidBodySim({ objects, active }: { objects: SceneObject3D[]; active: boolean }) {
  const { scene } = useThree();
  const sim = useRef<Map<string, { o: THREE.Object3D; vy: number; home: number; g: number; b: number }>>(new Map());

  useEffect(() => {
    if (!active) {
      sim.current.forEach((s) => { s.o.position.y = s.home; });
      sim.current.clear();
      return;
    }
    const t = setTimeout(() => {
      const map = new Map<string, { o: THREE.Object3D; vy: number; home: number; g: number; b: number }>();
      scene.traverse((o) => {
        const id = o.userData?.aioeId as string | undefined;
        if (!id || map.has(id)) return;
        const def = objects.find((x) => x.id === id);
        if (!def || !def.components?.includes("Rigid Body") || def.isKinematic) return;
        map.set(id, { o, vy: 0, home: o.position.y, g: def.gravityScale ?? 1, b: def.bounciness ?? 0 });
      });
      sim.current = map;
    }, 60);
    return () => clearTimeout(t);
  }, [active, objects, scene]);

  useFrame((_, delta) => {
    if (!active || sim.current.size === 0) return;
    const dt = Math.min(delta, 0.05);
    sim.current.forEach((s) => {
      s.vy -= 9.8 * s.g * dt;
      s.o.position.y += s.vy * dt;
      if (s.o.position.y <= 0) {
        s.o.position.y = 0;
        s.vy = s.b > 0.3 ? -s.vy * s.b : 0;
      }
    });
  });

  return null;
}

// ================= Follow group (third-person avatar) =================
export function FollowGroup({ playerRef, children }: {
  playerRef: React.MutableRefObject<PlayerRef>;
  children: React.ReactNode;
}) {
  const ref = useRef<THREE.Group>(null);
  useFrame(() => {
    if (!ref.current) return;
    const p = playerRef.current;
    ref.current.position.set(p.pos.x, p.pos.y, p.pos.z);
    ref.current.rotation.y = p.yaw;
  });
  return <group ref={ref}>{children}</group>;
}
