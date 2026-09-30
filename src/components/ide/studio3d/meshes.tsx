// All In One Engine — 3D Studio mesh renderers (primitives + compound prefabs)
"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { SceneObject3D } from "./types";

type Vec3 = [number, number, number];

interface PartDef {
  g: "box" | "cylinder" | "cone" | "sphere" | "torus" | "plane";
  args: number[];
  pos: Vec3;
  rot?: Vec3;
  s?: Vec3;
  color?: string;
  emissive?: string;
  ei?: number;
  metal?: number;
  rough?: number;
  opacity?: number;
  noShadow?: boolean;
}

function Part({ p, fallback }: { p: PartDef; fallback: string }) {
  const mat = (
    <meshStandardMaterial
      color={p.color ?? fallback}
      emissive={p.emissive ?? "#000000"}
      emissiveIntensity={p.ei ?? 0}
      metalness={p.metal ?? 0.05}
      roughness={p.rough ?? 0.85}
      transparent={p.opacity !== undefined}
      opacity={p.opacity ?? 1}
    />
  );
  const shadows = !p.noShadow;
  return (
    <mesh position={p.pos} rotation={p.rot} scale={p.s} castShadow={shadows} receiveShadow>
      {p.g === "box" && <boxGeometry args={p.args as Vec3} />}
      {p.g === "cylinder" && <cylinderGeometry args={p.args as [number, number, number, number]} />}
      {p.g === "cone" && <coneGeometry args={p.args as [number, number, number]} />}
      {p.g === "sphere" && <sphereGeometry args={p.args as [number, number, number]} />}
      {p.g === "torus" && <torusGeometry args={p.args as [number, number, number, number]} />}
      {p.g === "plane" && <planeGeometry args={p.args as Vec3} />}
      {mat}
    </mesh>
  );
}

// ---------- compound prefab part lists (same look as the RPG build video) ----------
export function compoundParts(type: string, color: string): PartDef[] {
  switch (type) {
    case "castle-tower":
      return [
        { g: "cylinder", args: [1.5, 1.8, 7.2, 14], pos: [0, 3.6, 0], color, rough: 0.9 },
        { g: "cylinder", args: [1.85, 1.85, 0.5, 14], pos: [0, 7.35, 0], color: "#7d838f" },
        ...Array.from({ length: 8 }, (_, i) => {
          const a = (i / 8) * Math.PI * 2;
          return { g: "box" as const, args: [0.5, 0.55, 0.5], pos: [Math.cos(a) * 1.55, 7.85, Math.sin(a) * 1.55] as Vec3, color: "#8b8f98" };
        }),
        { g: "cylinder", args: [0.09, 0.09, 2.2, 6], pos: [0, 9, 0], color: "#5d4426" },
        { g: "box", args: [0.95, 0.55, 0.05], pos: [0.55, 9.75, 0], color: "#dc2626" },
        { g: "box", args: [1.1, 1.8, 0.3], pos: [0, 0.9, 1.68], color: "#5d4426" },
      ];
    case "fountain":
      return [
        { g: "cylinder", args: [2.1, 2.3, 0.55, 20], pos: [0, 0.27, 0], color: "#9aa0ab" },
        { g: "cylinder", args: [1.8, 1.8, 0.3, 20], pos: [0, 0.6, 0], color: color || "#38bdf8", emissive: color || "#38bdf8", ei: 0.45, opacity: 0.85 },
        { g: "cylinder", args: [0.22, 0.3, 1.5, 10], pos: [0, 1.2, 0], color: "#8b8f98" },
        { g: "cylinder", args: [0.75, 0.9, 0.28, 14], pos: [0, 2, 0], color: "#9aa0ab" },
        { g: "sphere", args: [0.24, 10, 8], pos: [0, 2.35, 0], color: "#7dd3fc", emissive: "#7dd3fc", ei: 0.6, opacity: 0.9, noShadow: true },
      ];
    case "treasure-chest":
      return [
        { g: "box", args: [1.1, 0.62, 0.75], pos: [0, 0.31, 0], color },
        { g: "box", args: [1.12, 0.3, 0.78], pos: [0, 0.72, -0.19], rot: [-0.9, 0, 0], color: "#8f5622" },
        { g: "box", args: [1.14, 0.1, 0.1], pos: [0, 0.42, 0.39], color: "#fbbf24", metal: 0.7, rough: 0.35 },
        { g: "cylinder", args: [0.16, 0.16, 0.1, 10], pos: [0, 0.68, 0.05], color: "#fbbf24", metal: 0.75, rough: 0.3, emissive: "#fbbf24", ei: 0.25 },
        { g: "box", args: [0.5, 0.22, 0.3], pos: [0, 0.75, 0.05], color: "#ffd24a", emissive: "#fbbf24", ei: 0.5, metal: 0.6, rough: 0.3 },
      ];
    case "oak-tree":
      return [
        { g: "cylinder", args: [0.22, 0.3, 1.6, 8], pos: [0, 0.8, 0], color: "#7a4a21" },
        { g: "sphere", args: [1.15, 14, 12], pos: [0, 2.1, 0], color: color || "#3f8f3a" },
        { g: "sphere", args: [0.8, 12, 10], pos: [0.55, 2.7, 0.2], color: "#4da344" },
        { g: "sphere", args: [0.7, 12, 10], pos: [-0.5, 2.6, -0.25], color: "#35802f" },
      ];
    case "cottage":
      return [
        { g: "box", args: [3.4, 2.2, 2.8], pos: [0, 1.1, 0], color: "#e8dcc0" },
        { g: "cone", args: [2.75, 1.7, 4], pos: [0, 3.05, 0], rot: [0, Math.PI / 4, 0], color: "#a3502e" },
        { g: "box", args: [0.9, 1.4, 0.12], pos: [0, 0.7, 1.42], color: "#6b4423" },
        { g: "box", args: [0.62, 0.62, 0.1], pos: [-1.05, 1.35, 1.42], color: "#ffe9a8", emissive: "#ffdf8a", ei: 0.7 },
        { g: "box", args: [0.62, 0.62, 0.1], pos: [1.05, 1.35, 1.42], color: "#ffe9a8", emissive: "#ffdf8a", ei: 0.7 },
      ];
    case "lamp-post":
      return [
        { g: "cylinder", args: [0.08, 0.12, 2.6, 8], pos: [0, 1.3, 0], color: "#2f3439" },
        { g: "box", args: [0.42, 0.5, 0.42], pos: [0, 2.75, 0], color: "#2f3439" },
        { g: "sphere", args: [0.17, 10, 8], pos: [0, 2.72, 0], color: color || "#ffd27a", emissive: "#ffc247", ei: 1.4, noShadow: true },
      ];
    case "npc-villager":
      return [
        { g: "box", args: [0.52, 0.52, 0.52], pos: [0, 1.62, 0], color: "#fde68a" },
        { g: "box", args: [0.09, 0.09, 0.03], pos: [-0.12, 1.68, 0.27], color: "#1a1a1a", noShadow: true },
        { g: "box", args: [0.09, 0.09, 0.03], pos: [0.12, 1.68, 0.27], color: "#1a1a1a", noShadow: true },
        { g: "box", args: [0.74, 1.05, 0.44], pos: [0, 0.78, 0], color: color || "#4f7e4f" },
        { g: "box", args: [0.78, 0.12, 0.48], pos: [0, 0.32, 0], color: "#c9b489" },
        { g: "box", args: [0.24, 0.72, 0.26], pos: [-0.4, 0.75, 0], color: color || "#4f7e4f" },
        { g: "box", args: [0.24, 0.72, 0.26], pos: [0.4, 0.75, 0], color: color || "#4f7e4f" },
        { g: "box", args: [0.26, 0.5, 0.26], pos: [-0.16, 0.25, 0], color: "#3f3a36" },
        { g: "box", args: [0.26, 0.5, 0.26], pos: [0.16, 0.25, 0], color: "#3f3a36" },
      ];
    default:
      return [];
  }
}

export function CompoundMesh({ type, color }: { type: string; color: string }) {
  const parts = compoundParts(type, color);
  return (
    <group>
      {parts.map((p, i) => <Part key={i} p={p} fallback={color} />)}
    </group>
  );
}

// ---------- single object renderer ----------
export function Object3DMesh({ obj, selected, onSelect }: {
  obj: SceneObject3D;
  selected: boolean;
  onSelect: () => void;
}) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame(() => {
    if (meshRef.current && selected && !obj.wireframe) {
      const mat = meshRef.current.material as THREE.MeshStandardMaterial;
      if (mat && "emissiveIntensity" in mat) {
        mat.emissiveIntensity = (obj.emissiveIntensity ?? 0) + 0.3 + Math.sin(Date.now() * 0.005) * 0.2;
      }
    }
  });

  if (!obj.visible) return null;

  // Lights
  if (obj.type === "light") {
    if (obj.lightSubtype === "ambient") return <ambientLight intensity={obj.intensity ?? 0.5} color={obj.color} />;
    if (obj.lightSubtype === "directional") return <directionalLight position={obj.position} intensity={obj.intensity ?? 1} color={obj.color} castShadow={obj.castShadow !== false} />;
    if (obj.lightSubtype === "point") return <pointLight position={obj.position} intensity={obj.intensity ?? 1} color={obj.color} distance={12} />;
    if (obj.lightSubtype === "spot") return <spotLight position={obj.position} angle={0.5} intensity={obj.intensity ?? 1} color={obj.color} distance={14} />;
    if (obj.lightSubtype === "hemisphere") return <hemisphereLight intensity={obj.intensity ?? 0.5} color={obj.color} />;
  }

  const isCompound = ["castle-tower", "fountain", "treasure-chest", "oak-tree", "cottage", "lamp-post", "npc-villager"].includes(obj.type);
  const selectableProps = {
    onClick: (e: { stopPropagation: () => void }) => { e.stopPropagation(); onSelect(); },
  };

  if (isCompound) {
    return (
      <group position={obj.position} rotation={obj.rotation} scale={obj.scale} userData={{ aioeId: obj.id }} {...selectableProps}>
        <CompoundMesh type={obj.type} color={obj.color} />
        {selected && (
          <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[1.6, 1.85, 32]} />
            <meshBasicMaterial color="#22d3ee" transparent opacity={0.9} side={THREE.DoubleSide} />
          </mesh>
        )}
      </group>
    );
  }

  const matProps = {
    color: obj.color,
    emissive: selected ? obj.color : (obj.emissive || "#000000"),
    emissiveIntensity: selected ? 0.5 : (obj.emissiveIntensity ?? 0),
    roughness: obj.roughness ?? 0.5,
    metalness: obj.metalness ?? 0.1,
    transparent: obj.transparent || (obj.opacity !== undefined && obj.opacity < 1),
    opacity: obj.opacity ?? 1,
    wireframe: obj.wireframe ?? false,
    flatShading: obj.flatShading ?? false,
  };

  return (
    <mesh
      ref={meshRef}
      position={obj.position}
      rotation={obj.rotation}
      scale={obj.scale}
      userData={{ aioeId: obj.id }}
      castShadow={obj.castShadow !== false}
      receiveShadow={obj.receiveShadow !== false}
      {...selectableProps}
    >
      {obj.type === "box" && <boxGeometry args={[1, 1, 1]} />}
      {obj.type === "sphere" && <sphereGeometry args={[0.5, 32, 32]} />}
      {obj.type === "cylinder" && <cylinderGeometry args={[0.5, 0.5, 1, 32]} />}
      {obj.type === "cone" && <coneGeometry args={[0.5, 1, 32]} />}
      {obj.type === "torus" && <torusGeometry args={[0.5, 0.2, 16, 100]} />}
      {obj.type === "plane" && <planeGeometry args={[1, 1]} />}
      {obj.type === "octahedron" && <octahedronGeometry args={[0.6, 0]} />}
      {obj.type === "terrain" && <boxGeometry args={[1, 0.2, 1]} />}
      {obj.type === "water" && <planeGeometry args={[1, 1]} />}
      {(obj.type === "box" || obj.type === "sphere" || obj.type === "cylinder" || obj.type === "cone" || obj.type === "torus" || obj.type === "plane" || obj.type === "octahedron" || obj.type === "terrain" || obj.type === "water") && (
        <meshStandardMaterial {...matProps} />
      )}
    </mesh>
  );
}

// ---------- player avatar (third-person / NPCs) ----------
export function Avatar3D({ position, color, preset, bodyType, walking, yaw }: {
  position: Vec3;
  color: string;
  preset: string;
  bodyType: "slim" | "average" | "tall";
  walking?: boolean;
  yaw?: number;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const heightScale = bodyType === "tall" ? 1.3 : bodyType === "slim" ? 0.85 : 1.0;
  const widthScale = bodyType === "slim" ? 0.85 : bodyType === "tall" ? 0.95 : 1.0;

  useFrame((state) => {
    if (groupRef.current) {
      const t = state.clock.elapsedTime;
      groupRef.current.position.y = position[1] + (walking ? Math.abs(Math.sin(t * 8)) * 0.06 : Math.sin(t * 2) * 0.04);
      groupRef.current.rotation.y = yaw ?? Math.sin(t * 0.5) * 0.3;
    }
  });

  const headColor = preset === "robot" ? "#999999" : preset === "knight" ? "#fbbf24" : "#fde68a";
  const accentColor = preset === "knight" ? "#3b82f6" : preset === "mage" ? "#8b5cf6" : preset === "archer" ? "#10b981" : preset === "rogue" ? "#1f2937" : preset === "wizard" ? "#1e3a8a" : "#06b6d4";

  return (
    <group ref={groupRef} position={position} scale={[widthScale, heightScale, widthScale]}>
      <mesh position={[0, 1.2, 0]} castShadow>
        <boxGeometry args={[0.5, 0.5, 0.5]} />
        <meshStandardMaterial color={headColor} />
      </mesh>
      <mesh position={[-0.12, 1.25, 0.26]}>
        <boxGeometry args={[0.08, 0.08, 0.02]} />
        <meshStandardMaterial color="#000000" />
      </mesh>
      <mesh position={[0.12, 1.25, 0.26]}>
        <boxGeometry args={[0.08, 0.08, 0.02]} />
        <meshStandardMaterial color="#000000" />
      </mesh>
      <mesh position={[0, 0.5, 0]} castShadow>
        <boxGeometry args={[0.7, 0.9, 0.4]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <mesh position={[0, 0.15, 0.21]}>
        <boxGeometry args={[0.72, 0.1, 0.02]} />
        <meshStandardMaterial color={accentColor} />
      </mesh>
      <mesh position={[-0.5, 0.5, 0]} castShadow>
        <boxGeometry args={[0.25, 0.8, 0.3]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <mesh position={[0.5, 0.5, 0]} castShadow>
        <boxGeometry args={[0.25, 0.8, 0.3]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <mesh position={[-0.2, -0.3, 0]} castShadow>
        <boxGeometry args={[0.3, 0.7, 0.3]} />
        <meshStandardMaterial color="#1f2937" />
      </mesh>
      <mesh position={[0.2, -0.3, 0]} castShadow>
        <boxGeometry args={[0.3, 0.7, 0.3]} />
        <meshStandardMaterial color="#1f2937" />
      </mesh>
      {(preset === "wizard" || preset === "mage") && (
        <mesh position={[0, 1.6, 0]} castShadow>
          <coneGeometry args={[0.3, 0.4, 8]} />
          <meshStandardMaterial color={accentColor} />
        </mesh>
      )}
      {preset === "knight" && (
        <mesh position={[0, 1.5, 0]} castShadow>
          <boxGeometry args={[0.55, 0.15, 0.55]} />
          <meshStandardMaterial color="#fbbf24" metalness={0.8} roughness={0.2} />
        </mesh>
      )}
    </group>
  );
}
