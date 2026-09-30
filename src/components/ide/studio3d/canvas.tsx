// All In One Engine — 3D Studio in-canvas engine components
"use client";

import { useRef, useEffect } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { TransformControls } from "@react-three/drei";
import * as THREE from "three";
import type { SceneObject3D, WorldSettings } from "./types";
import type { PlayerRef } from "./rpg";

type Vec3 = [number, number, number];
const UP = new THREE.Vector3(0, 1, 0);

// ================= World environment (lighting + sky + fog) =================
export function WorldEnvironment({ world, hideGrid }: { world: WorldSettings; hideGrid: boolean }) {
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
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow>
        <planeGeometry args={[120, 120]} />
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

// ================= Player controller (first-person / third-person / orbit) =================
export function PlayerController({ isPlaying, cameraMode, playerRef, keysRef, backupRef }: {
  isPlaying: boolean;
  cameraMode: "orbit" | "first-person" | "third-person";
  playerRef: React.MutableRefObject<PlayerRef>;
  keysRef: React.MutableRefObject<Record<string, boolean>>;
  backupRef: React.MutableRefObject<{ pos: THREE.Vector3; quat: THREE.Quaternion; target: THREE.Vector3 | null } | null>;
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

  useFrame((_, delta) => {
    if (!isPlaying) return;
    const dt = Math.min(delta, 0.06);
    const p = playerRef.current;
    const k = keysRef.current;
    const speed = (k["shift"] ? 9.5 : 5.2) * (cameraMode === "orbit" ? 1 : 1);

    if (cameraMode !== "orbit") {
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
        p.pos.x += (mx / len) * speed * dt;
        p.pos.z += (mz / len) * speed * dt;
      }
      if (k[" "] && p.onGround) { p.vy = 7.6; p.onGround = false; }
      p.vy -= 22 * dt;
      p.pos.y += p.vy * dt;
      if (p.pos.y <= 0) { p.pos.y = 0; p.vy = 0; p.onGround = true; }

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
