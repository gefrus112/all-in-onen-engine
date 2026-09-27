"use client";

import { useRef, useState, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Grid, GizmoHelper, GizmoViewport, Environment, Sky } from "@react-three/drei";
import * as THREE from "three";
import {
  Box, Circle, Cylinder, Cone, Torus, Plane, Lightbulb, Camera as CameraIcon,
  Move, RotateCw, Scale, Hand, Mouse, Plus, Trash2, Copy, Play, Pause, Square,
  Save, Upload, Music, Settings, PanelLeft, PanelRight, PanelBottom,
  Box as BoxIcon, Layers, Search, ChevronDown, ChevronRight, User, Send,
  Sun, Github, Home, Volume2, Eye, EyeOff, Lock, Unlock,
} from "lucide-react";
import { useStudio } from "@/lib/studio-store";
import { toast } from "sonner";

// 3D scene object types
type SceneObjType = "box" | "sphere" | "cylinder" | "cone" | "torus" | "plane" | "light" | "camera";
type LightSubtype = "directional" | "point" | "spot" | "ambient" | "hemisphere";

interface SceneObject3D {
  id: string;
  name: string;
  type: SceneObjType;
  lightSubtype?: LightSubtype;
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
  color: string;
  intensity?: number;
  visible: boolean;
  locked: boolean;
}

const uid = () => Math.random().toString(36).slice(2, 10);

function Object3DMesh({ obj, selected, onSelect }: { obj: SceneObject3D; selected: boolean; onSelect: () => void }) {
  const meshRef = useRef<THREE.Mesh>(null);
  useFrame(() => {
    if (meshRef.current && selected) {
      // Pulsing outline effect
      const mat = meshRef.current.material as THREE.MeshStandardMaterial;
      mat.emissiveIntensity = 0.3 + Math.sin(Date.now() * 0.005) * 0.2;
    }
  });

  if (!obj.visible) return null;

  const renderGeometry = () => {
    switch (obj.type) {
      case "box": return <boxGeometry args={[1, 1, 1]} />;
      case "sphere": return <sphereGeometry args={[0.5, 32, 32]} />;
      case "cylinder": return <cylinderGeometry args={[0.5, 0.5, 1, 32]} />;
      case "cone": return <coneGeometry args={[0.5, 1, 32]} />;
      case "torus": return <torusGeometry args={[0.5, 0.2, 16, 100]} />;
      case "plane": return <planeGeometry args={[1, 1]} />;
      default: return <boxGeometry args={[1, 1, 1]} />;
    }
  };

  if (obj.type === "light") {
    if (obj.lightSubtype === "ambient") {
      return <ambientLight intensity={obj.intensity ?? 0.5} color={obj.color} />;
    }
    if (obj.lightSubtype === "directional") {
      return <directionalLight position={obj.position} intensity={obj.intensity ?? 1} color={obj.color} />;
    }
    if (obj.lightSubtype === "point") {
      return <pointLight position={obj.position} intensity={obj.intensity ?? 1} color={obj.color} distance={10} />;
    }
    if (obj.lightSubtype === "spot") {
      return <spotLight position={obj.position} angle={0.5} intensity={obj.intensity ?? 1} color={obj.color} distance={10} />;
    }
    if (obj.lightSubtype === "hemisphere") {
      return <hemisphereLight intensity={obj.intensity ?? 0.5} color={obj.color} />;
    }
  }

  return (
    <mesh
      ref={meshRef}
      position={obj.position}
      rotation={obj.rotation}
      scale={obj.scale}
      onClick={(e) => { e.stopPropagation(); onSelect(); }}
      castShadow
      receiveShadow
    >
      {renderGeometry()}
      <meshStandardMaterial
        color={obj.color}
        emissive={selected ? obj.color : "#000000"}
        emissiveIntensity={selected ? 0.5 : 0}
        roughness={0.5}
        metalness={0.1}
      />
    </mesh>
  );
}

function Avatar3D({ position, color, preset, bodyType }: {
  position: [number, number, number];
  color: string;
  preset: string;
  bodyType: "slim" | "average" | "tall";
}) {
  const groupRef = useRef<THREE.Group>(null);
  const heightScale = bodyType === "tall" ? 1.3 : bodyType === "slim" ? 0.85 : 1.0;
  const widthScale = bodyType === "slim" ? 0.85 : bodyType === "tall" ? 0.95 : 1.0;

  useFrame((state) => {
    if (groupRef.current) {
      // Idle animation
      groupRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 2) * 0.05;
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.3;
    }
  });

  const headColor = preset === "robot" ? "#999" : preset === "knight" ? "#fbbf24" : "#fde68a";
  const bodyColor = color;
  const accentColor = preset === "knight" ? "#3b82f6" : preset === "mage" ? "#8b5cf6" : preset === "archer" ? "#10b981" : preset === "rogue" ? "#1f2937" : preset === "wizard" ? "#1e3a8a" : "#06b6d4";

  return (
    <group ref={groupRef} position={position} scale={[widthScale, heightScale, widthScale]}>
      {/* Head */}
      <mesh position={[0, 1.2, 0]} castShadow>
        <boxGeometry args={[0.5, 0.5, 0.5]} />
        <meshStandardMaterial color={headColor} />
      </mesh>
      {/* Eyes */}
      <mesh position={[-0.12, 1.25, 0.26]}>
        <boxGeometry args={[0.08, 0.08, 0.02]} />
        <meshStandardMaterial color="#000" />
      </mesh>
      <mesh position={[0.12, 1.25, 0.26]}>
        <boxGeometry args={[0.08, 0.08, 0.02]} />
        <meshStandardMaterial color="#000" />
      </mesh>
      {/* Body */}
      <mesh position={[0, 0.5, 0]} castShadow>
        <boxGeometry args={[0.7, 0.9, 0.4]} />
        <meshStandardMaterial color={bodyColor} />
      </mesh>
      {/* Belt */}
      <mesh position={[0, 0.15, 0.21]}>
        <boxGeometry args={[0.72, 0.1, 0.02]} />
        <meshStandardMaterial color={accentColor} />
      </mesh>
      {/* Arms */}
      <mesh position={[-0.5, 0.5, 0]} castShadow>
        <boxGeometry args={[0.25, 0.8, 0.3]} />
        <meshStandardMaterial color={bodyColor} />
      </mesh>
      <mesh position={[0.5, 0.5, 0]} castShadow>
        <boxGeometry args={[0.25, 0.8, 0.3]} />
        <meshStandardMaterial color={bodyColor} />
      </mesh>
      {/* Legs */}
      <mesh position={[-0.2, -0.3, 0]} castShadow>
        <boxGeometry args={[0.3, 0.7, 0.3]} />
        <meshStandardMaterial color="#1f2937" />
      </mesh>
      <mesh position={[0.2, -0.3, 0]} castShadow>
        <boxGeometry args={[0.3, 0.7, 0.3]} />
        <meshStandardMaterial color="#1f2937" />
      </mesh>
      {/* Accessory: hat for wizard, helmet for knight, etc. */}
      {preset === "wizard" || preset === "mage" && (
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

function Scene3D({
  objects, selectedId, onSelect, showAvatar, avatarConfig, isPlaying,
}: {
  objects: SceneObject3D[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  showAvatar: boolean;
  avatarConfig: { color: string; preset: string; bodyType: "slim" | "average" | "tall" };
  isPlaying: boolean;
}) {
  return (
    <>
      <color attach="background" args={["#1a1d24"]} />
      <fog attach="fog" args={["#1a1d24", 20, 60]} />

      {/* Lights */}
      <ambientLight intensity={0.3} />
      <directionalLight
        position={[10, 15, 10]}
        intensity={1.2}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={50}
        shadow-camera-left={-15}
        shadow-camera-right={15}
        shadow-camera-top={15}
        shadow-camera-bottom={-15}
      />
      <pointLight position={[-10, 5, -10]} intensity={0.5} color="#8b5cf6" />

      {/* Environment */}
      <Sky distance={450000} sunPosition={[10, 15, 10]} inclination={0.5} azimuth={0.25} />
      <Environment preset="sunset" />

      {/* Grid floor */}
      <Grid
        args={[40, 40]}
        cellSize={1}
        cellThickness={0.5}
        cellColor="#3a3f4a"
        sectionSize={5}
        sectionThickness={1.5}
        sectionColor="#3b82f6"
        fadeDistance={40}
        fadeStrength={1}
        position={[0, -0.01, 0]}
        infiniteGrid
      />

      {/* Ground plane for shadows */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow>
        <planeGeometry args={[100, 100]} />
        <meshStandardMaterial color="#0d0e12" transparent opacity={0.6} />
      </mesh>

      {/* Scene objects */}
      {objects.map((obj) => (
        <Object3DMesh
          key={obj.id}
          obj={obj}
          selected={selectedId === obj.id}
          onSelect={() => onSelect(obj.id)}
        />
      ))}

      {/* Avatar (visible during play test) */}
      {showAvatar && (
        <Avatar3D
          position={[0, 0.65, 0]}
          color={avatarConfig.color}
          preset={avatarConfig.preset}
          bodyType={avatarConfig.bodyType}
        />
      )}

      {/* Viewport helpers */}
      <GizmoHelper alignment="bottom-right" margin={[80, 80]}>
        <GizmoViewport axisColors={["#ef4444", "#10b981", "#3b82f6"]} labelColor="white" />
      </GizmoHelper>
    </>
  );
}

function CameraController({ isPlaying }: { isPlaying: boolean }) {
  const { camera } = useThree();
  const keys = useRef<Record<string, boolean>>({});

  useEffect(() => {
    const down = (e: KeyboardEvent) => { keys.current[e.key.toLowerCase()] = true; };
    const up = (e: KeyboardEvent) => { keys.current[e.key.toLowerCase()] = false; };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, []);

  useFrame((_, dt) => {
    if (!isPlaying) return;
    const speed = 5 * dt;
    const k = keys.current;
    // WASD camera movement in play mode
    const forward = new THREE.Vector3();
    camera.getWorldDirection(forward);
    forward.y = 0;
    forward.normalize();
    const right = new THREE.Vector3();
    right.crossVectors(forward, camera.up).normalize();

    if (k["w"]) camera.position.addScaledVector(forward, speed);
    if (k["s"]) camera.position.addScaledVector(forward, -speed);
    if (k["a"]) camera.position.addScaledVector(right, -speed);
    if (k["d"]) camera.position.addScaledVector(right, speed);
  });

  return null;
}

const OBJECT_TYPES: { type: SceneObjType; name: string; icon: React.ReactNode; color: string }[] = [
  { type: "box", name: "Box", icon: <BoxIcon className="w-4 h-4" />, color: "#3b82f6" },
  { type: "sphere", name: "Sphere", icon: <Circle className="w-4 h-4" />, color: "#10b981" },
  { type: "cylinder", name: "Cylinder", icon: <Cylinder className="w-4 h-4" />, color: "#fbbf24" },
  { type: "cone", name: "Cone", icon: <Cone className="w-4 h-4" />, color: "#ef4444" },
  { type: "torus", name: "Torus", icon: <Torus className="w-4 h-4" />, color: "#8b5cf6" },
  { type: "plane", name: "Plane", icon: <Plane className="w-4 h-4" />, color: "#06b6d4" },
];

const LIGHT_TYPES: { type: LightSubtype; name: string; icon: React.ReactNode }[] = [
  { type: "ambient", name: "Ambient", icon: <Sun className="w-4 h-4" /> },
  { type: "directional", name: "Directional", icon: <Sun className="w-4 h-4" /> },
  { type: "point", name: "Point", icon: <Lightbulb className="w-4 h-4" /> },
  { type: "spot", name: "Spot", icon: <Lightbulb className="w-4 h-4" /> },
  { type: "hemisphere", name: "Hemisphere", icon: <Sun className="w-4 h-4" /> },
];

const AVATAR_PRESETS = [
  { id: "knight", name: "Knight", color: "#3b82f6" },
  { id: "mage", name: "Mage", color: "#8b5cf6" },
  { id: "archer", name: "Archer", color: "#10b981" },
  { id: "rogue", name: "Rogue", color: "#1f2937" },
  { id: "wizard", name: "Wizard", color: "#1e3a8a" },
  { id: "robot", name: "Robot", color: "#06b6d4" },
] as const;

const ASSET_LIBRARY_3D = [
  { name: "Wooden Crate", type: "box", color: "#92400e" },
  { name: "Stone Block", type: "box", color: "#6b7280" },
  { name: "Gold Bar", type: "box", color: "#fbbf24" },
  { name: "Crystal", type: "octahedron" as SceneObjType, color: "#06b6d4" },
  { name: "Apple", type: "sphere", color: "#ef4444" },
  { name: "Boulder", type: "sphere", color: "#52525b" },
  { name: "Tree Trunk", type: "cylinder", color: "#92400e" },
  { name: "Pillar", type: "cylinder", color: "#d1d5db" },
  { name: "Barrel", type: "cylinder", color: "#a16207" },
  { name: "Wizard Hat", type: "cone", color: "#1e3a8a" },
  { name: "Traffic Cone", type: "cone", color: "#f97316" },
  { name: "Pyramid", type: "cone" as SceneObjType, color: "#fbbf24" },
  { name: "Donut", type: "torus", color: "#ec4899" },
  { name: "Ring", type: "torus", color: "#fbbf24" },
  { name: "Platform", type: "plane", color: "#6b7280" },
  { name: "Ground Tile", type: "plane", color: "#16a34a" },
  { name: "Sky Light", type: "light" as SceneObjType, color: "#ffffff" },
  { name: "Warm Glow", type: "light" as SceneObjType, color: "#fbbf24" },
  { name: "Purple Lamp", type: "light" as SceneObjType, color: "#8b5cf6" },
  { name: "Cyan Glow", type: "light" as SceneObjType, color: "#06b6d4" },
];

export function Studio3D({ onExit }: { onExit: () => void }) {
  const {
    avatar, avatarColor, avatarBodyType,
    setAvatarPickerOpen, setAvatar,
    setPublishDialogOpen, setInstructionsOpen,
    user, setAuthOpen,
  } = useStudio();

  const [objects, setObjects] = useState<SceneObject3D[]>([
    {
      id: uid(), name: "Floor", type: "plane",
      position: [0, 0, 0], rotation: [-Math.PI / 2, 0, 0], scale: [10, 10, 1],
      color: "#16a34a", visible: true, locked: false,
    },
    {
      id: uid(), name: "Box 1", type: "box",
      position: [2, 0.5, 0], rotation: [0, 0, 0], scale: [1, 1, 1],
      color: "#3b82f6", visible: true, locked: false,
    },
    {
      id: uid(), name: "Sphere 1", type: "sphere",
      position: [-2, 0.5, 0], rotation: [0, 0, 0], scale: [1, 1, 1],
      color: "#ef4444", visible: true, locked: false,
    },
    {
      id: uid(), name: "Sun Light", type: "light", lightSubtype: "directional",
      position: [5, 8, 5], rotation: [0, 0, 0], scale: [1, 1, 1],
      color: "#fff5e0", intensity: 1.2, visible: true, locked: false,
    },
  ]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showAvatar, setShowAvatar] = useState(false);
  const [activeTool, setActiveTool] = useState<"move" | "rotate" | "scale" | "pan">("move");
  const [leftPanel, setLeftPanel] = useState<"explorer" | "assets" | "lights">("explorer");
  const [search, setSearch] = useState("");
  const [expandedObjects, setExpandedObjects] = useState<Set<string>>(new Set());

  const selectedObj = objects.find(o => o.id === selectedId);

  const addObject = (type: SceneObjType, color = "#3b82f6", name?: string) => {
    const newObj: SceneObject3D = {
      id: uid(),
      name: name || `${type.charAt(0).toUpperCase() + type.slice(1)} ${objects.length + 1}`,
      type,
      position: [0, type === "plane" ? 0 : 0.5, 0],
      rotation: type === "plane" ? [-Math.PI / 2, 0, 0] : [0, 0, 0],
      scale: [1, 1, 1],
      color,
      visible: true,
      locked: false,
    };
    if (type === "light") {
      newObj.lightSubtype = "point";
      newObj.intensity = 1;
    }
    setObjects([...objects, newObj]);
    setSelectedId(newObj.id);
    toast.success(`Added ${newObj.name}`);
  };

  const addLight = (subtype: LightSubtype) => {
    const newObj: SceneObject3D = {
      id: uid(),
      name: `${subtype.charAt(0).toUpperCase() + subtype.slice(1)} Light`,
      type: "light",
      lightSubtype: subtype,
      position: [0, 5, 0],
      rotation: [0, 0, 0],
      scale: [1, 1, 1],
      color: "#ffffff",
      intensity: 1,
      visible: true,
      locked: false,
    };
    setObjects([...objects, newObj]);
    setSelectedId(newObj.id);
    toast.success(`Added ${newObj.name}`);
  };

  const deleteObject = (id: string) => {
    setObjects(objects.filter(o => o.id !== id));
    if (selectedId === id) setSelectedId(null);
  };

  const duplicateObject = (id: string) => {
    const orig = objects.find(o => o.id === id);
    if (!orig) return;
    const copy = { ...orig, id: uid(), name: `${orig.name} Copy`, position: [orig.position[0] + 1, orig.position[1], orig.position[2] + 1] as [number, number, number] };
    setObjects([...objects, copy]);
    setSelectedId(copy.id);
  };

  const toggleVisible = (id: string) => {
    setObjects(objects.map(o => o.id === id ? { ...o, visible: !o.visible } : o));
  };

  const toggleLock = (id: string) => {
    setObjects(objects.map(o => o.id === id ? { ...o, locked: !o.locked } : o));
  };

  const updateProp = (id: string, key: string, value: unknown) => {
    setObjects(objects.map(o => o.id === id ? { ...o, [key]: value } : o));
  };

  const filteredAssets = ASSET_LIBRARY_3D.filter(a =>
    a.name.toLowerCase().includes(search.toLowerCase()) || a.type.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col h-screen w-screen bg-[#0a0b0e] text-white overflow-hidden">
      {/* Top bar */}
      <div className="flex items-center h-12 bg-[#1a1d24] border-b border-white/5 px-3 gap-2">
        {/* Logo + name */}
        <div className="flex items-center gap-2 pr-4 border-r border-white/5">
          <img src="/logo.svg" alt="All In One Engine" className="w-8 h-8" />
          <div>
            <div className="text-sm font-bold leading-tight">3D Studio</div>
            <div className="text-[10px] text-muted-foreground leading-tight">All In One Engine</div>
          </div>
        </div>

        {/* Tools */}
        <div className="flex items-center gap-1">
          {(["move", "rotate", "scale", "pan"] as const).map((tool) => (
            <button
              key={tool}
              onClick={() => setActiveTool(tool)}
              className={`tool-btn ${activeTool === tool ? "active" : ""}`}
              title={tool.charAt(0).toUpperCase() + tool.slice(1)}
            >
              {tool === "move" && <Move className="w-3.5 h-3.5" />}
              {tool === "rotate" && <RotateCw className="w-3.5 h-3.5" />}
              {tool === "scale" && <Scale className="w-3.5 h-3.5" />}
              {tool === "pan" && <Hand className="w-3.5 h-3.5" />}
            </button>
          ))}
          <div className="w-px h-5 bg-white/10 mx-1" />
          <button className="tool-btn" onClick={() => addObject("box")} title="Add Box"><Plus className="w-3.5 h-3.5" /></button>
          <button className="tool-btn" onClick={() => addObject("sphere")} title="Add Sphere"><Circle className="w-3.5 h-3.5" /></button>
          <button className="tool-btn" onClick={() => addObject("cylinder")} title="Add Cylinder"><Cylinder className="w-3.5 h-3.5" /></button>
          <button className="tool-btn" onClick={() => addObject("cone")} title="Add Cone"><Cone className="w-3.5 h-3.5" /></button>
          <button className="tool-btn" onClick={() => addObject("torus")} title="Add Torus"><Torus className="w-3.5 h-3.5" /></button>
          <button className="tool-btn" onClick={() => addLight("point")} title="Add Light"><Lightbulb className="w-3.5 h-3.5" /></button>
        </div>

        <div className="w-px h-5 bg-white/10 mx-1" />

        {/* Play controls */}
        <button
          onClick={() => { setIsPlaying(true); setShowAvatar(true); toast.success("Play test started — use WASD to move camera"); }}
          disabled={isPlaying}
          className={`tool-btn ${!isPlaying ? "active" : ""}`}
          title="Play test"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          Play
        </button>
        <button
          onClick={() => setIsPlaying(false)}
          disabled={!isPlaying}
          className="tool-btn"
          title="Pause"
        >
          <Pause className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => { setIsPlaying(false); setShowAvatar(false); }}
          className="tool-btn"
          title="Stop"
        >
          <Square className="w-3.5 h-3.5 fill-current" />
        </button>

        <div className="flex-1" />

        {/* Avatar + other actions */}
        <button
          onClick={() => setAvatarPickerOpen(true)}
          className="tool-btn"
          title="Pick avatar"
        >
          <User className="w-3.5 h-3.5" />
          Avatar
        </button>
        <button onClick={() => toast.info("Upload dialog coming soon")} className="tool-btn" title="Upload assets">
          <Upload className="w-3.5 h-3.5" />
        </button>
        <button onClick={() => toast.info("Audio editor coming soon")} className="tool-btn" title="Audio editor">
          <Music className="w-3.5 h-3.5" />
        </button>
        <button onClick={() => setPublishDialogOpen(true)} className="tool-btn" title="Publish">
          <Send className="w-3.5 h-3.5" />
          Publish
        </button>
        <button onClick={() => setInstructionsOpen(true)} className="tool-btn" title="Instructions">
          <Box className="w-3.5 h-3.5" />
          Help
        </button>
        <div className="w-px h-5 bg-white/10 mx-1" />
        <button
          onClick={() => setAuthOpen(true)}
          className="tool-btn"
          title={user ? `Signed in as @${user.githubLogin}` : "Sign in with GitHub"}
        >
          {user ? (
            <img src={user.avatar} alt={user.name} className="w-5 h-5 rounded-full" />
          ) : (
            <Github className="w-3.5 h-3.5" />
          )}
        </button>
        <button onClick={onExit} className="tool-btn" title="Back to website">
          <Home className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Main 3-pane layout */}
      <div className="flex-1 flex min-h-0">
        {/* LEFT: Explorer / Assets / Lights tabs */}
        <div className="w-64 bg-[#13161c] border-r border-white/5 flex flex-col">
          <div className="flex border-b border-white/5">
            <button
              onClick={() => setLeftPanel("explorer")}
              className={`flex-1 px-3 py-2 text-xs font-medium ${leftPanel === "explorer" ? "text-white bg-white/5 border-b-2 border-cyan-500" : "text-muted-foreground hover:text-white"}`}
            >
              Explorer
            </button>
            <button
              onClick={() => setLeftPanel("assets")}
              className={`flex-1 px-3 py-2 text-xs font-medium ${leftPanel === "assets" ? "text-white bg-white/5 border-b-2 border-cyan-500" : "text-muted-foreground hover:text-white"}`}
            >
              Assets
            </button>
            <button
              onClick={() => setLeftPanel("lights")}
              className={`flex-1 px-3 py-2 text-xs font-medium ${leftPanel === "lights" ? "text-white bg-white/5 border-b-2 border-cyan-500" : "text-muted-foreground hover:text-white"}`}
            >
              Lights
            </button>
          </div>

          <div className="p-2 border-b border-white/5">
            <div className="flex items-center gap-2 px-2 py-1 rounded bg-black/30">
              <Search className="w-3 h-3 text-muted-foreground" />
              <input
                className="flex-1 bg-transparent text-xs outline-none placeholder:text-muted-foreground"
                placeholder="Search…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto py-1">
            {leftPanel === "explorer" && (
              <>
                <div className="px-2 py-1 text-[10px] uppercase tracking-wider text-muted-foreground">
                  Scene ({objects.length})
                </div>
                {objects.map((obj) => (
                  <div
                    key={obj.id}
                    className={`flex items-center gap-1 px-2 py-1 text-xs cursor-pointer ${selectedId === obj.id ? "bg-cyan-500/20 text-white" : "hover:bg-white/5"}`}
                    onClick={() => setSelectedId(obj.id)}
                  >
                    <span className="w-4 flex justify-center">
                      {obj.type === "light" ? <Lightbulb className="w-3 h-3 text-yellow-400" /> :
                       obj.type === "box" ? <BoxIcon className="w-3 h-3 text-blue-400" /> :
                       obj.type === "sphere" ? <Circle className="w-3 h-3 text-green-400" /> :
                       obj.type === "cylinder" ? <Cylinder className="w-3 h-3 text-yellow-400" /> :
                       obj.type === "cone" ? <Cone className="w-3 h-3 text-red-400" /> :
                       obj.type === "torus" ? <Torus className="w-3 h-3 text-purple-400" /> :
                       <Plane className="w-3 h-3 text-cyan-400" />}
                    </span>
                    <span className="flex-1 truncate">{obj.name}</span>
                    <button onClick={(e) => { e.stopPropagation(); toggleVisible(obj.id); }} className="opacity-50 hover:opacity-100">
                      {obj.visible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); toggleLock(obj.id); }} className="opacity-50 hover:opacity-100">
                      {obj.locked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); duplicateObject(obj.id); }} className="opacity-50 hover:opacity-100">
                      <Copy className="w-3 h-3" />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); deleteObject(obj.id); }} className="opacity-50 hover:opacity-100 hover:text-red-400">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </>
            )}

            {leftPanel === "assets" && (
              <>
                <div className="px-2 py-1 text-[10px] uppercase tracking-wider text-muted-foreground">
                  3D Asset Library
                </div>
                <div className="grid grid-cols-2 gap-1 p-2">
                  {filteredAssets.map((asset) => (
                    <button
                      key={asset.name}
                      onClick={() => addObject(asset.type as SceneObjType, asset.color, asset.name)}
                      className="aspect-square p-2 rounded border border-white/5 hover:border-cyan-500/50 hover:bg-white/5 transition-all flex flex-col items-center justify-center gap-1"
                    >
                      {asset.type === "box" && <BoxIcon className="w-6 h-6" style={{ color: asset.color }} />}
                      {asset.type === "sphere" && <Circle className="w-6 h-6" style={{ color: asset.color }} />}
                      {asset.type === "cylinder" && <Cylinder className="w-6 h-6" style={{ color: asset.color }} />}
                      {asset.type === "cone" && <Cone className="w-6 h-6" style={{ color: asset.color }} />}
                      {asset.type === "torus" && <Torus className="w-6 h-6" style={{ color: asset.color }} />}
                      {asset.type === "plane" && <Plane className="w-6 h-6" style={{ color: asset.color }} />}
                      {asset.type === "light" && <Lightbulb className="w-6 h-6" style={{ color: asset.color }} />}
                      {asset.type === "octahedron" && <BoxIcon className="w-6 h-6 rotate-45" style={{ color: asset.color }} />}
                      <span className="text-[9px] text-center leading-tight">{asset.name}</span>
                    </button>
                  ))}
                </div>
                <div className="p-2 mt-2 border-t border-white/5">
                  <button
                    onClick={() => toast.info("Drag .glb/.gltf files here to import 3D models")}
                    className="w-full p-3 rounded border border-dashed border-white/10 hover:border-cyan-500/50 text-xs text-muted-foreground hover:text-white transition-all flex flex-col items-center gap-1"
                  >
                    <Upload className="w-4 h-4" />
                    Upload .glb / .gltf
                  </button>
                </div>
              </>
            )}

            {leftPanel === "lights" && (
              <>
                <div className="px-2 py-1 text-[10px] uppercase tracking-wider text-muted-foreground">
                  Add Lights
                </div>
                {LIGHT_TYPES.map((light) => (
                  <button
                    key={light.type}
                    onClick={() => addLight(light.type)}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-white/5 transition-colors"
                  >
                    {light.icon}
                    {light.name}
                  </button>
                ))}
              </>
            )}
          </div>
        </div>

        {/* CENTER: 3D Viewport */}
        <div className="flex-1 relative bg-[#0d0e12]">
          <Canvas
            shadows
            camera={{ position: [6, 5, 8], fov: 50 }}
            onClick={() => setSelectedId(null)}
          >
            <Scene3D
              objects={objects}
              selectedId={selectedId}
              onSelect={setSelectedId}
              showAvatar={showAvatar}
              avatarConfig={{ color: avatarColor, preset: avatar, bodyType: avatarBodyType }}
              isPlaying={isPlaying}
            />
            <CameraController isPlaying={isPlaying} />
            <OrbitControls makeDefault enabled={!isPlaying} />
          </Canvas>

          {/* Overlay: stats top-left */}
          <div className="absolute top-2 left-2 px-3 py-1.5 rounded-md bg-black/60 backdrop-blur-sm text-xs flex items-center gap-2">
            <span className="text-cyan-400">●</span>
            <span>{objects.length} objects</span>
            <span className="text-muted-foreground">|</span>
            <span>{isPlaying ? "Playing" : "Editing"}</span>
            {showAvatar && <span className="text-green-400">| Avatar: {avatar}</span>}
          </div>

          {/* Overlay: tool tips bottom-center */}
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-md bg-black/60 backdrop-blur-sm text-[10px] text-muted-foreground">
            {isPlaying
              ? "WASD to move · Mouse to look · Click Stop to exit play test"
              : "Click to select · Drag to orbit · Scroll to zoom · Right-drag to pan"}
          </div>

          {/* Play mode indicator */}
          {isPlaying && (
            <div className="absolute top-2 right-2 px-3 py-1.5 rounded-md bg-red-500/20 border border-red-500/50 text-xs flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500 rec-dot" />
              PLAY TESTING
            </div>
          )}
        </div>

        {/* RIGHT: Properties */}
        <div className="w-72 bg-[#13161c] border-l border-white/5 flex flex-col">
          <div className="px-3 py-2 border-b border-white/5 flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Properties</span>
            {selectedObj && (
              <span className="text-[10px] text-muted-foreground">{selectedObj.type}</span>
            )}
          </div>

          {selectedObj ? (
            <div className="flex-1 overflow-y-auto">
              <div className="p-3 border-b border-white/5">
                <div className="text-xs text-muted-foreground mb-1">Selected</div>
                <input
                  className="w-full bg-transparent text-sm font-medium outline-none border-b border-transparent focus:border-cyan-500"
                  value={selectedObj.name}
                  onChange={(e) => updateProp(selectedObj.id, "name", e.target.value)}
                />
              </div>

              {/* Transform */}
              <div className="px-3 py-2 border-b border-white/5">
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">Transform</div>
                {(["x", "y", "z"] as const).map((axis, i) => (
                  <div key={axis} className="flex items-center gap-2 mb-1">
                    <span className="text-xs text-muted-foreground w-4">{axis.toUpperCase()}</span>
                    <span className="text-[10px] text-muted-foreground w-12">Pos</span>
                    <input
                      type="number"
                      step="0.1"
                      value={selectedObj.position[i]}
                      onChange={(e) => {
                        const newPos = [...selectedObj.position] as [number, number, number];
                        newPos[i] = parseFloat(e.target.value) || 0;
                        updateProp(selectedObj.id, "position", newPos);
                      }}
                      className="flex-1 bg-black/30 px-2 py-0.5 text-xs outline-none border border-transparent focus:border-cyan-500 rounded"
                    />
                    <span className="text-[10px] text-muted-foreground w-10">Rot</span>
                    <input
                      type="number"
                      step="0.1"
                      value={selectedObj.rotation[i].toFixed(2)}
                      onChange={(e) => {
                        const newRot = [...selectedObj.rotation] as [number, number, number];
                        newRot[i] = parseFloat(e.target.value) || 0;
                        updateProp(selectedObj.id, "rotation", newRot);
                      }}
                      className="w-14 bg-black/30 px-2 py-0.5 text-xs outline-none border border-transparent focus:border-cyan-500 rounded"
                    />
                    <span className="text-[10px] text-muted-foreground w-10">Scale</span>
                    <input
                      type="number"
                      step="0.1"
                      value={selectedObj.scale[i].toFixed(2)}
                      onChange={(e) => {
                        const newScale = [...selectedObj.scale] as [number, number, number];
                        newScale[i] = parseFloat(e.target.value) || 0.1;
                        updateProp(selectedObj.id, "scale", newScale);
                      }}
                      className="w-14 bg-black/30 px-2 py-0.5 text-xs outline-none border border-transparent focus:border-cyan-500 rounded"
                    />
                  </div>
                ))}
              </div>

              {/* Appearance */}
              <div className="px-3 py-2 border-b border-white/5">
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">Appearance</div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs text-muted-foreground w-16">Color</span>
                  <input
                    type="color"
                    value={selectedObj.color}
                    onChange={(e) => updateProp(selectedObj.id, "color", e.target.value)}
                    className="w-8 h-8 rounded border border-white/10 cursor-pointer"
                  />
                  <input
                    value={selectedObj.color}
                    onChange={(e) => updateProp(selectedObj.id, "color", e.target.value)}
                    className="flex-1 bg-black/30 px-2 py-0.5 text-xs outline-none border border-transparent focus:border-cyan-500 rounded"
                  />
                </div>
                {selectedObj.type === "light" && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground w-16">Intensity</span>
                    <input
                      type="range"
                      min="0"
                      max="5"
                      step="0.1"
                      value={selectedObj.intensity ?? 1}
                      onChange={(e) => updateProp(selectedObj.id, "intensity", parseFloat(e.target.value))}
                      className="flex-1"
                    />
                    <span className="text-xs text-muted-foreground w-10">{(selectedObj.intensity ?? 1).toFixed(1)}</span>
                  </div>
                )}
              </div>

              {/* Visibility */}
              <div className="px-3 py-2 border-b border-white/5">
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">State</div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs">Visible</span>
                  <button
                    onClick={() => toggleVisible(selectedObj.id)}
                    className={`px-2 py-0.5 rounded text-[10px] ${selectedObj.visible ? "bg-cyan-500 text-white" : "bg-white/10 text-muted-foreground"}`}
                  >
                    {selectedObj.visible ? "True" : "False"}
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs">Locked</span>
                  <button
                    onClick={() => toggleLock(selectedObj.id)}
                    className={`px-2 py-0.5 rounded text-[10px] ${selectedObj.locked ? "bg-cyan-500 text-white" : "bg-white/10 text-muted-foreground"}`}
                  >
                    {selectedObj.locked ? "True" : "False"}
                  </button>
                </div>
              </div>

              {/* Actions */}
              <div className="px-3 py-2 flex gap-2">
                <button
                  onClick={() => duplicateObject(selectedObj.id)}
                  className="flex-1 px-2 py-1 rounded bg-white/5 hover:bg-white/10 text-xs flex items-center justify-center gap-1"
                >
                  <Copy className="w-3 h-3" /> Duplicate
                </button>
                <button
                  onClick={() => deleteObject(selectedObj.id)}
                  className="flex-1 px-2 py-1 rounded bg-red-500/20 hover:bg-red-500/30 text-xs text-red-300 flex items-center justify-center gap-1"
                >
                  <Trash2 className="w-3 h-3" /> Delete
                </button>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-xs text-muted-foreground p-4 text-center">
              Click an object in the viewport or Explorer to edit its properties.
            </div>
          )}
        </div>
      </div>

      {/* Bottom: Animation Timeline */}
      <div className="h-20 bg-[#13161c] border-t border-white/5 flex items-center px-3 gap-2">
        <div className="flex items-center gap-1">
          <button className="tool-btn h-7 w-7 p-0" title="Play animation"><Play className="w-3 h-3" /></button>
          <button className="tool-btn h-7 w-7 p-0" title="Pause"><Pause className="w-3 h-3" /></button>
          <button className="tool-btn h-7 w-7 p-0" title="Stop"><Square className="w-3 h-3" /></button>
        </div>
        <div className="text-xs text-muted-foreground">Timeline</div>
        <div className="flex-1 relative h-10 bg-black/30 rounded">
          {/* Timeline tracks */}
          <div className="absolute inset-0 flex flex-col">
            {["Position", "Rotation", "Scale", "Color"].map((track, i) => (
              <div key={track} className="flex-1 border-b border-white/5 last:border-b-0 flex items-center px-2">
                <span className="text-[9px] text-muted-foreground w-16">{track}</span>
                <div className="flex-1 relative h-3 bg-white/5 rounded">
                  {/* Keyframes */}
                  {[0.1, 0.3, 0.5, 0.7, 0.9].map((pos, j) => (
                    <div
                      key={j}
                      className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-2 h-2 bg-cyan-500 rounded-sm"
                      style={{ left: `${pos * 100}%` }}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
          {/* Playhead */}
          <div className="absolute top-0 bottom-0 w-px bg-red-500" style={{ left: "30%" }} />
        </div>
        <div className="text-xs text-muted-foreground">0:00 / 5:00</div>
      </div>

      {/* Status bar */}
      <div className="h-6 bg-cyan-600 text-white text-[11px] flex items-center px-3 gap-4">
        <div className="flex items-center gap-1.5">
          <div className={`w-2 h-2 rounded-full ${isPlaying ? "bg-green-300" : "bg-white/60"}`} />
          <span>{isPlaying ? "Playing" : "Editing"}</span>
        </div>
        <span>|</span>
        <span>{objects.length} objects</span>
        <span>|</span>
        <span>Selected: {selectedObj?.name ?? "None"}</span>
        <span>|</span>
        <span>Tool: {activeTool}</span>
        <div className="flex-1" />
        <span>Three.js r186</span>
        <span>|</span>
        <span>WebGL 2.0</span>
      </div>
    </div>
  );
}
