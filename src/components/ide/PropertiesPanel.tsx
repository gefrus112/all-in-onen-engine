"use client";

import { useStudio, SceneEntity } from "../../lib/studio-store";
import { Search, Settings2, ChevronDown, ChevronRight } from "lucide-react";
import { useState, useMemo } from "react";

function ValueEditor({
  value,
  onChange,
}: {
  value: unknown;
  onChange: (v: unknown) => void;
}) {
  const [editing, setEditing] = useState(false);

  if (typeof value === "boolean") {
    return (
      <button
        className={`px-2 py-0.5 rounded text-xs ${value ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
        onClick={() => onChange(!value)}
      >
        {value ? "True" : "False"}
      </button>
    );
  }
  if (typeof value === "number") {
    return (
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full bg-transparent text-xs px-1 py-0.5 outline-none border border-transparent hover:border-border focus:border-primary rounded"
      />
    );
  }
  if (typeof value === "string") {
    if (value.startsWith("#")) {
      return (
        <div className="flex items-center gap-1 px-1">
          <input
            type="color"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-5 h-5 rounded border border-border bg-transparent cursor-pointer"
          />
          <input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="flex-1 bg-transparent text-xs px-1 py-0.5 outline-none border border-transparent focus:border-primary rounded"
          />
        </div>
      );
    }
    return (
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-transparent text-xs px-1 py-0.5 outline-none border border-transparent hover:border-border focus:border-primary rounded"
      />
    );
  }
  if (value && typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>);
    if (entries.length === 2 && entries[0][0] === "x" && entries[1][0] === "y") {
      const obj = value as { x: number; y: number };
      return (
        <div className="flex items-center gap-1 px-1">
          <span className="text-xs text-muted-foreground">X</span>
          <input
            type="number"
            value={obj.x}
            step="any"
            onChange={(e) => onChange({ ...obj, x: parseFloat(e.target.value) })}
            className="w-16 bg-transparent text-xs px-1 py-0.5 outline-none border border-transparent hover:border-border focus:border-primary rounded"
          />
          <span className="text-xs text-muted-foreground">Y</span>
          <input
            type="number"
            value={obj.y}
            step="any"
            onChange={(e) => onChange({ ...obj, y: parseFloat(e.target.value) })}
            className="w-16 bg-transparent text-xs px-1 py-0.5 outline-none border border-transparent hover:border-border focus:border-primary rounded"
          />
        </div>
      );
    }
    return (
      <div className="text-xs text-muted-foreground italic px-1">
        {JSON.stringify(value).slice(0, 60)}
        {JSON.stringify(value).length > 60 ? "…" : ""}
      </div>
    );
  }
  if (Array.isArray(value)) {
    return (
      <div className="text-xs text-muted-foreground px-1">
        [{value.length} items]
      </div>
    );
  }
  return <div className="text-xs text-muted-foreground px-1">{String(value)}</div>;
}

// Extended property catalog — generates hundreds of property rows per entity
// for a Roblox Studio-like inspector experience.
function generateExtendedProperties(entity: SceneEntity): Record<string, Record<string, unknown>> {
  const type = entity.type.toLowerCase();
  const groups: Record<string, Record<string, unknown>> = {};

  // --- Common: Transform ---
  groups["Transform"] = {
    "Position": entity.properties?.position ?? { x: 0, y: 0 },
    "Rotation": entity.properties?.rotation ?? 0,
    "Scale": { x: 1, y: 1 },
    "Visible": true,
    "Layer": entity.properties?.layer ?? "entity",
    "Z-Order": 0,
    "Anchor Point": { x: 0.5, y: 0.5 },
    "Pivot Offset": { x: 0, y: 0 },
  };

  // --- Common: Appearance ---
  groups["Appearance"] = {
    "Color": entity.properties?.color ?? "#50b4f0",
    "Alpha": 255,
    "Tint": "#ffffff",
    "Blend Mode": "Normal",
    "Flip X": false,
    "Flip Y": false,
    "Sprite Path": "",
    "Animation Clip": "",
    "Material": "Default",
    "Cast Shadows": false,
    "Receive Shadows": false,
  };

  // --- Common: Physics ---
  groups["Physics"] = {
    "Body Type": "Dynamic",
    "Mass": 1.0,
    "Gravity Scale": 1.0,
    "Linear Velocity": { x: 0, y: 0 },
    "Angular Velocity": 0,
    "Linear Damping": 0.01,
    "Angular Damping": 0.01,
    "Fixed Rotation": false,
    "Bullet Mode": false,
    "Allow Sleep": true,
    "Sleep Threshold": 1.0,
    "Awake": true,
  };

  // --- Common: Collider ---
  groups["Collider"] = {
    "Shape": "AABB",
    "Width": 32,
    "Height": 32,
    "Radius": 16,
    "Offset": { x: 0, y: 0 },
    "Is Trigger": false,
    "Friction": 0.2,
    "Restitution": 0.3,
    "Collision Layer": 1,
    "Collision Mask": 255,
    "Bounce": 0.3,
  };

  // --- Type-specific ---
  if (type === "scene") {
    groups["Scene"] = {
      "Name": entity.name,
      "Background Color": entity.properties?.bg_color ?? "#232430",
      "Gravity": entity.properties?.gravity ?? { x: 0, y: 980 },
      "Time Scale": entity.properties?.time_scale ?? 1,
      "Paused": entity.properties?.paused ?? false,
      "Pixel Per Unit": 32,
      "Fixed Timestep": 0.01667,
      "Max Sub-steps": 8,
      "Auto Simulate": true,
      "Auto Render": true,
      "Show Grid": true,
      "Grid Size": 32,
      "Grid Color": "#3a3b40",
      "Snap to Grid": false,
      "Show Bounds": false,
      "Show FPS": true,
      "Show Colliders": false,
      "Show Velocities": false,
      "Show Forces": false,
      "Ambient Light": "#141828",
      "Light Intensity": 1.0,
      "Vignette": 0.4,
      "Color Grading": "None",
      "Bloom": 0.0,
      "Bloom Threshold": 0.8,
      "Chromatic Aberration": 0.0,
      "Film Grain": 0.0,
      "Scanlines": 0.0,
      "Camera Shake": 0.0,
      "Camera Follow Lerp": 0.15,
      "Camera Deadzone": { x: 80, y: 60 },
      "Camera Zoom": 1.0,
      "Camera Min Zoom": 0.5,
      "Camera Max Zoom": 3.0,
      "Camera Bounds": { x: 0, y: 0 },
      "Background Music": "",
      "Music Volume": 0.7,
      "SFX Volume": 1.0,
      "Master Volume": 1.0,
      "Mute": false,
      "Audio Listener": "Camera",
      "Speed of Sound": 343,
      "Doppler Factor": 1.0,
      "Reverb Zone": "None",
      "Reverb Decay": 0.5,
      "Reverb Delay": 80,
    };
    groups["Performance"] = {
      "Target FPS": 60,
      "VSync": true,
      "Max Texture Size": 4096,
      "Texture Filtering": "Linear",
      "Anisotropic Level": 1,
      "Anti-aliasing": "None",
      "Shadow Resolution": 1024,
      "Shadow Distance": 100,
      "Shadow Cascades": 2,
      "Draw Call Budget": 1000,
      "Triangle Budget": 50000,
      "Particle Budget": 5000,
      "Audio Voices": 32,
      "Audio Sample Rate": 44100,
      "Audio Buffer Size": 512,
      "GC Frequency": 60,
      "Object Pool Size": 100,
      "LOD Bias": 1.0,
      "Culling Mode": "Frustum",
      "Occlusion Culling": false,
      "Batch Sprites": true,
      "Static Batching": true,
      "Dynamic Batching": false,
      "GPU Instancing": false,
    };
    groups["Input"] = {
      "Keyboard Enabled": true,
      "Mouse Enabled": true,
      "Touch Enabled": false,
      "Gamepad Enabled": true,
      "Multi-touch": false,
      "Input Polling": "Event-driven",
      "Key Repeat": true,
      "Key Repeat Delay": 0.3,
      "Key Repeat Rate": 30,
      "Mouse Sensitivity": 1.0,
      "Mouse Invert Y": false,
      "Cursor Visible": true,
      "Cursor Locked": false,
      "Deadzone Left": 0.2,
      "Deadzone Right": 0.2,
      "Rumble Enabled": true,
      "Rumble Intensity": 1.0,
    };
  }

  if (type === "player" || type === "entity") {
    groups["Player"] = {
      "Max Speed": entity.properties?.max_speed ?? 220,
      "Acceleration": 1200,
      "Deceleration": 1500,
      "Jump Force": entity.properties?.jump_force ?? 480,
      "Jump Cutoff": 0.5,
      "Double Jump": false,
      "Max Air Jumps": 0,
      "Coyote Time": entity.properties?.coyote_time ?? 0.1,
      "Jump Buffer": 0.15,
      "Wall Slide": false,
      "Wall Slide Speed": 100,
      "Wall Jump Force": 400,
      "Wall Jump Angle": 60,
      "Dash Speed": 600,
      "Dash Duration": 0.2,
      "Dash Cooldown": 1.0,
      "Max Dashes": 1,
      "Gravity": 1400,
      "Max Fall Speed": 800,
      "Variable Jump": true,
      "Auto Jump": false,
      "Air Control": 1.0,
      "Facing Direction": entity.properties?.facing ?? 1,
      "Invincibility Time": 1.0,
      "Knockback Force": 200,
      "Knockback Duration": 0.2,
      "Spawn Point": { x: 100, y: 400 },
      "Lives": 3,
      "Max Lives": 5,
      "Health": 100,
      "Max Health": 100,
      "Mana": 50,
      "Max Mana": 50,
      "Stamina": 100,
      "Max Stamina": 100,
      "Stamina Regen": 10,
      "Stamina Cost Run": 5,
      "Stamina Cost Jump": 10,
      "Stamina Cost Dash": 25,
      "Score": 0,
      "High Score": 0,
      "Coins": 0,
      "Keys": 0,
      "Inventory Size": 12,
      "Hotbar Size": 9,
      "Selected Slot": 0,
    };
    groups["Animation"] = {
      "Idle Clip": "idle",
      "Walk Clip": "walk",
      "Run Clip": "run",
      "Jump Clip": "jump",
      "Fall Clip": "fall",
      "Land Clip": "land",
      "Attack Clip": "attack",
      "Hurt Clip": "hurt",
      "Death Clip": "death",
      "Default FPS": 10,
      "Idle FPS": 8,
      "Walk FPS": 12,
      "Run FPS": 16,
      "Jump FPS": 8,
      "Loop Idle": true,
      "Loop Walk": true,
      "Loop Run": true,
      "Loop Jump": false,
      "Blend Time": 0.1,
      "Playback Speed": 1.0,
      "Auto-play": true,
      "Random Start Offset": false,
    };
    groups["Combat"] = {
      "Attack Damage": 10,
      "Attack Range": 32,
      "Attack Speed": 1.0,
      "Attack Cooldown": 0.5,
      "Crit Chance": 0.1,
      "Crit Multiplier": 2.0,
      "Knockback": 200,
      "Hitstun": 0.2,
      "Block Chance": 0.0,
      "Block Reduction": 0.5,
      "Dodge Chance": 0.0,
      "Dodge Cooldown": 1.0,
      "Parry Window": 0.1,
      "Parry Cooldown": 0.5,
      "Armor": 0,
      "Magic Resist": 0,
      "Fire Resist": 0,
      "Ice Resist": 0,
      "Lightning Resist": 0,
      "Poison Resist": 0,
      "Bleed Resist": 0,
      "Stun Resist": 0,
      "Knockback Resist": 0,
    };
  }

  if (type === "enemy" || type === "npc") {
    groups["AI"] = {
      "Behavior": "Patrol",
      "Patrol Range": entity.properties?.patrol_range ?? 80,
      "Speed": entity.properties?.speed ?? 60,
      "Chase Range": 150,
      "Attack Range": 32,
      "Lose Target Range": 250,
      "Attack Damage": 10,
      "Attack Cooldown": 1.0,
      "Detect Player": true,
      "Field of View": 90,
      "View Distance": 200,
      "Hearing Range": 100,
      "Wander Radius": 50,
      "Wander Pause": 1.0,
      "Idle Time": 2.0,
      "Flee Threshold": 0.3,
      "Flee Speed": 120,
      "Respawn Time": 5.0,
      "Drop Chance": 0.5,
      "Drop Table": "Default",
      "Aggro Type": "Proximity",
      "Aggro On Damage": true,
      "Leash Distance": 500,
      "Leash Reset": true,
      "Pathfinding": "A*",
      "Path Update Rate": 5,
      "Stuck Timeout": 2.0,
      "Avoidance": "None",
      "Avoidance Radius": 32,
    };
    groups["Stats"] = {
      "Health": 30,
      "Max Health": 30,
      "Health Regen": 0,
      "Mana": 0,
      "Max Mana": 0,
      "Stamina": 100,
      "Max Stamina": 100,
      "Stamina Regen": 5,
      "Armor": 0,
      "Magic Resist": 0,
      "Speed": 60,
      "Acceleration": 600,
      "Jump Force": 400,
      "Gravity": 1400,
      "Size": 1.0,
      "Damage": 10,
      "Defense": 0,
      "Crit Chance": 0.05,
      "Crit Damage": 1.5,
      "XP Reward": 25,
      "Gold Reward": 5,
      "Item Reward": "None",
      "Element": "Neutral",
      "Weakness": "None",
      "Resistance": "None",
      "Immunity": "None",
      "Level": 1,
      "AI Difficulty": "Normal",
      "Spawn Weight": 1.0,
      "Max Spawned": 5,
      "Spawn Cooldown": 10,
    };
  }

  if (type === "tilemap") {
    groups["Tilemap"] = {
      "Tile Size": entity.properties?.tile_size ?? 32,
      "Width": entity.properties?.width ?? 40,
      "Height": entity.properties?.height ?? 18,
      "Layers": entity.properties?.layers ?? ["ground"],
      "Solid Count": entity.properties?.solid_count ?? 80,
      "Render Order": "Right-Down",
      "Compression": "None",
      "Orientation": "Orthogonal",
      "Hex Side Length": 0,
      "Stagger Axis": "Y",
      "Stagger Index": "Odd",
      "Parallax X": 1.0,
      "Parallax Y": 1.0,
      "Scroll X": 1.0,
      "Scroll Y": 1.0,
      "Scale X": 1.0,
      "Scale Y": 1.0,
      "Offset X": 0,
      "Offset Y": 0,
      "Tint Color": "#ffffff",
      "Opacity": 1.0,
      "Visible": true,
      "Locked": false,
      "Cull Rect": { x: 0, y: 0 },
      "Tileset": "Default",
      "Tileset Source": "",
      "Tile Width": 32,
      "Tile Height": 32,
      "Spacing": 0,
      "Margin": 0,
      "Tile Count": 100,
      "Tile Columns": 10,
      "Tile Rows": 10,
      "First GID": 1,
      "Object Alignment": "Unspecified",
      "Tile Render Size": "Tile",
      "Fill Mode": "Stretch",
    };
  }

  if (type === "camera") {
    groups["Camera"] = {
      "Position": { x: 0, y: 0 },
      "Zoom": 1.0,
      "Rotation": 0,
      "Follow Lerp": entity.properties?.follow_lerp ?? 0.1,
      "Follow Target": "",
      "Follow Offset": { x: 0, y: -40 },
      "Deadzone": entity.properties?.deadzone ?? { x: 80, y: 60 },
      "Lookahead": 0.3,
      "Lookahead Factor": 0.3,
      "Bounds": { x: 0, y: 0 },
      "Bounds Min": { x: 0, y: 0 },
      "Bounds Max": { x: 0, y: 0 },
      "Shake Amplitude": 8,
      "Shake Duration": 0.3,
      "Shake Decay": 4,
      "Shake Frequency": 30,
      "Shake Seed": 0,
      "Projection": "Orthographic",
      "Orthographic Size": 5,
      "Field of View": 60,
      "Near Clip": 0.1,
      "Far Clip": 1000,
      "Aspect Ratio": "Auto",
      "Viewport Rect": { x: 0, y: 0 },
      "Depth": -1,
      "Clear Flags": "Solid Color",
      "Background": "#232430",
      "Culling Mask": "Everything",
      "Allow HDR": true,
      "Allow MSAA": true,
      "Allow Dynamic Resolution": false,
      "Target Texture": "",
      "Target Display": 0,
      "Target Eye": "Both",
      "Occlusion Culling": true,
      "Holgraphic Tracking": false,
    };
  }

  // Tags group
  groups["Tags"] = {
    "Tag": entity.tag ?? "",
    "Layer": entity.properties?.layer ?? "Default",
    "Sorting Layer": "Default",
    "Order in Layer": 0,
    "Static": false,
    "Persistent": false,
    "Networked": false,
    "Sync Transform": true,
    "Sync Animation": false,
    "Sync Physics": false,
    "Owner": "",
    "Authority": "Server",
    "Send Rate": 20,
    "Interpolation": true,
    "Extrapolation": false,
  };

  // Rendering details
  groups["Rendering"] = {
    "Material": "Default",
    "Shader": "Sprite-Default",
    "Render Queue": 2000,
    "Cast Shadows": false,
    "Receive Shadows": false,
    "Shadow Bias": 0.005,
    "Shadow Normal Bias": 0.4,
    "Shadow Near Plane": 0.2,
    "Motion Vectors": true,
    "Light Probe Usage": "Blend Probes",
    "Reflection Probe Usage": "Blend Probes",
    "Probe Anchor": "",
    "Renderer Priority": 0,
    "Ray Tracing Mode": "NonOpaque",
    "Dynamic Occlusion": true,
    "Sorting Axis": "Y",
    "Custom Axis": { x: 0, y: 1, z: 0 },
    "Batching Static": false,
    "GPU Instancing": false,
    "LOD Group": "",
    "Culling Group": "",
    "Visible In Scene View": true,
    "Visible In Game View": true,
    "Allow Occlusion": true,
    "Render Type": "Opaque",
    "Color Mask": "RGBA",
    "Alpha Cutoff": 0.5,
    "Alpha To Coverage": false,
    "Z-Write": true,
    "Z-Test": "LEqual",
    "Cull Mode": "Back",
    "Offset Factor": 0,
    "Offset Units": 0,
    "Blend Src": "SrcAlpha",
    "Blend Dst": "OneMinusSrcAlpha",
    "Blend Op": "Add",
    "Stencil Ref": 0,
    "Stencil Read Mask": 255,
    "Stencil Write Mask": 255,
    "Stencil Comp": "Always",
    "Stencil Pass": "Keep",
    "Stencil Fail": "Keep",
    "Stencil Z-Fail": "Keep",
  };

  // Audio sources
  groups["Audio"] = {
    "Audio Clip": "",
    "Output Audio Mixer": "",
    "Mute": false,
    "Bypass Effects": false,
    "Bypass Listener Effects": false,
    "Bypass Reverb Zones": false,
    "Play On Awake": true,
    "Loop": false,
    "Priority": 128,
    "Volume": 1.0,
    "Pitch": 1.0,
    "Stereo Pan": 0,
    "Spatial Blend": 0,
    "Reverb Zone Mix": 1.0,
    "Doppler Level": 1.0,
    "Spread": 0,
    "Volume Rolloff": "Logarithmic",
    "Min Distance": 1,
    "Max Distance": 500,
    "Rolloff Mode": "Logarithmic",
    "Custom Rolloff": "",
    "Listener": "Main",
    "Output": "Master",
    "Group": "SFX",
    "Mixer Group": "",
    "3D Sound Settings": true,
    "Velocity Update Mode": "Auto",
    "Doppler Factor": 1.0,
    "Listener Pause": false,
    "Audio Listener": "Main",
    "Reverb Zone": "Off",
    "Reverb Preset": "Generic",
    "Room": -1000,
    "Room HF": -100,
    "Room LF": 0,
    "Decay Time": 1.49,
    "Decay HF Ratio": 0.83,
    "Reflections": -2602,
    "Reflections Delay": 0.007,
    "Reverb": 200,
    "Reverb Delay": 0.011,
    "Echo Time": 0.25,
    "Echo Depth": 0,
    "Modulation Time": 0.25,
    "Modulation Depth": 0,
    "Air Absorption": -5,
    "HF Reference": 5000,
    "LF Reference": 250,
    "Room Rolloff": 0,
    "Diffusion": 100,
    "Density": 100,
  };

  // Particles
  groups["Particles"] = {
    "Duration": 5.0,
    "Looping": true,
    "Prewarm": false,
    "Start Delay": 0,
    "Start Lifetime": 5,
    "Start Speed": 5,
    "Start Size": 1,
    "Start Rotation": 0,
    "Start Color": "#ffffff",
    "Gravity Modifier": 0,
    "Simulation Space": "Local",
    "Simulation Speed": 1,
    "Delta Time": "Scaled",
    "Scaling Mode": "Local",
    "Play On Awake": true,
    "Emission Rate": 10,
    "Burst Count": 0,
    "Burst Time": 0,
    "Burst Particles": 30,
    "Burst Cycles": 1,
    "Burst Interval": 0.01,
    "Max Particles": 1000,
    "Shape": "Sphere",
    "Radius": 1,
    "Radius Thickness": 1,
    "Angle": 25,
    "Length": 5,
    "Box Thickness": { x: 0, y: 0, z: 0 },
    "Mesh": "",
    "Arc": 360,
    "Arc Mode": "Random",
    "Arc Spread": 0,
    "Arc Speed": 1,
    "Texture Sheet": false,
    "Tiles X": 1,
    "Tiles Y": 1,
    "Animation": "Whole Sheet",
    "Frame Over Time": 0,
    "Cycles": 1,
    "Start Frame": 0,
    "Row Index": 0,
    "UV Channels": 0,
    "Flip U": 0,
    "Flip V": 0,
    "Color Over Lifetime": false,
    "Color Gradient": "",
    "Size Over Lifetime": false,
    "Size Curve": "",
    "Separate Axes": false,
    "Rotation Over Lifetime": false,
    "Rotation Curve": "",
  };

  // Network sync
  groups["Network"] = {
    "Networked": false,
    "Network ID": 0,
    "Owner ID": "",
    "Authority": "Server",
    "Sync Transform": true,
    "Sync Position": true,
    "Sync Rotation": false,
    "Sync Scale": false,
    "Sync Velocity": false,
    "Sync Angular Velocity": false,
    "Send Rate": 20,
    "Send Interval": 0.05,
    "Interpolation": true,
    "Interpolation Buffer": 0.1,
    "Extrapolation": false,
    "Extrapolation Limit": 0.5,
    "Snap Threshold": 1.0,
    "Compression": "None",
    "Predicted": false,
    "Reconcile": true,
    "Client Authority": false,
    "Server Authority": true,
    "Ownership Transfer": "Fixed",
    "Auto Spawn": true,
    "Auto Despawn": false,
    "Despawn After": 0,
    "Persist Across Scenes": false,
    "Don't Destroy On Load": false,
    "Scene ID": 0,
    "Asset ID": "",
    "Prefab": "",
    "Pool": "Default",
    "Pool Size": 10,
    "Prewarm Pool": false,
    "Pool Expand": true,
    "RPC Mask": 0,
    "Observed Components": "",
    "Visibility": "Everyone",
    "Relevance Distance": 0,
    "Relevance Mode": "None",
    "Interest Management": false,
    "Spatial Hashing": false,
    "Cell Size": 32,
    "Network Transform": true,
    "Network Animator": false,
    "Network Rigidbody": false,
    "Network Identity": true,
    "Scene Object": true,
    "Spawnable": true,
  };

  // Editor-only metadata
  groups["Editor"] = {
    "Name": entity.name,
    "Tag": entity.tag ?? "Untagged",
    "Layer": entity.properties?.layer ?? "Default",
    "Static": false,
    "Active": true,
    "Locked": false,
    "Hide Flags": "None",
    "Is Prefab": false,
    "Prefab Instance": false,
    "Prefab Source": "",
    "Has Changed": false,
    "Last Modified": "",
    "Created": "",
    "Modified By": "",
    "Notes": "",
    "Color Tag": "#ffffff",
    "Icon": "Default",
    "Description": "",
    "Tooltip": "",
    "Help URL": "",
    "Category": "Default",
    "Sort Order": 0,
    "Selection Color": "#3b82f6",
    "Hover Color": "#1e40af",
    "Disabled Color": "#6b7280",
    "Gizmo Color": "#3b82f6",
    "Gizmo Size": 1.0,
    "Show Gizmo": true,
    "Show Bounds": false,
    "Show Label": true,
    "Snap To Grid": false,
    "Snap Distance": 0.25,
    "Lock Children": false,
    "Is Expanded": true,
    "Children Visible": true,
    "Show In Hierarchy": true,
    "Show In Inspector": true,
    "Allow Multiple": false,
    "Disallow Multiple": false,
    "Execute Always": false,
    "Run In Edit Mode": false,
    "Execution Order": 0,
    "Reset On Scene Load": false,
    "Cache State": true,
    "Serializable": true,
    "Inspectable": true,
    "Editable": true,
    "Deletable": true,
    "Copyable": true,
    "Pasteable": true,
    "Duplicatable": true,
    "Snap To Surface": false,
    "Align To Surface": false,
    "Surface Offset": 0,
    "Surface Normal": { x: 0, y: 1, z: 0 },
  };

  // Custom user-defined properties
  groups["Custom"] = {
    "Custom 1": "",
    "Custom 2": "",
    "Custom 3": "",
    "Custom 4": "",
    "Custom 5": "",
    "Custom 6": "",
    "Custom 7": "",
    "Custom 8": "",
    "Custom 9": "",
    "Custom 10": "",
    "Custom 11": "",
    "Custom 12": "",
    "Custom 13": "",
    "Custom 14": "",
    "Custom 15": "",
    "Custom 16": "",
    "Custom 17": "",
    "Custom 18": "",
    "Custom 19": "",
    "Custom 20": "",
    "User Bool 1": false,
    "User Bool 2": false,
    "User Bool 3": false,
    "User Bool 4": false,
    "User Bool 5": false,
    "User Int 1": 0,
    "User Int 2": 0,
    "User Int 3": 0,
    "User Int 4": 0,
    "User Int 5": 0,
    "User Float 1": 0,
    "User Float 2": 0,
    "User Float 3": 0,
    "User Float 4": 0,
    "User Float 5": 0,
    "User Vector 1": { x: 0, y: 0 },
    "User Vector 2": { x: 0, y: 0 },
    "User Vector 3": { x: 0, y: 0 },
    "User Color 1": "#ffffff",
    "User Color 2": "#ffffff",
    "User Color 3": "#ffffff",
    "User String 1": "",
    "User String 2": "",
    "User String 3": "",
    "User Object 1": "",
    "User Object 2": "",
    "User Object 3": "",
    "User Reference 1": "",
    "User Reference 2": "",
    "User Reference 3": "",
    "User Tag 1": "",
    "User Tag 2": "",
    "User Tag 3": "",
    "User Layer 1": "",
    "User Layer 2": "",
    "User Layer 3": "",
    "User Enum 1": 0,
    "User Enum 2": 0,
    "User Enum 3": 0,
    "User Flags 1": 0,
    "User Flags 2": 0,
    "User Flags 3": 0,
    "User Mask 1": 0,
    "User Mask 2": 0,
    "User Mask 3": 0,
    "User Range 1": 0,
    "User Range 2": 0,
    "User Range 3": 0,
    "User Curve 1": "",
    "User Curve 2": "",
    "User Curve 3": "",
    "User Gradient 1": "",
    "User Gradient 2": "",
    "User Gradient 3": "",
    "User Animation 1": "",
    "User Animation 2": "",
    "User Animation 3": "",
    "User Audio 1": "",
    "User Audio 2": "",
    "User Audio 3": "",
    "User Texture 1": "",
    "User Texture 2": "",
    "User Texture 3": "",
    "User Material 1": "",
    "User Material 2": "",
    "User Material 3": "",
    "User Mesh 1": "",
    "User Mesh 2": "",
    "User Mesh 3": "",
    "User Prefab 1": "",
    "User Prefab 2": "",
    "User Prefab 3": "",
  };

  // Lighting group
  groups["Lighting"] = {
    "Light Type": "Point",
    "Color": "#fff5e0",
    "Intensity": 1.0,
    "Range": 10,
    "Spot Angle": 30,
    "Inner Angle": 21,
    "Shadows": "Soft",
    "Shadow Strength": 1.0,
    "Shadow Resolution": "Low",
    "Shadow Bias": 0.05,
    "Shadow Normal Bias": 0.4,
    "Shadow Near Plane": 0.2,
    "Render Mode": "Auto",
    "Culling Mask": "Everything",
    "Baking": "Realtime",
    "Mixed Lighting": false,
    "Lightmap Index": -1,
    "Lightmap Size": 0,
    "Dynamic Baking": false,
    "Bake Type": "Baked",
    "Cookie": "",
    "Cookie Size": 1,
    "Draw Halo": false,
    "Flare": "",
    "Bounce Intensity": 1.0,
    "Bounce Strength": 1.0,
    "Shadow Fade": 0.5,
    "Penumbra": 0.5,
    "Volumetric": false,
    "Volumetric Intensity": 1.0,
    "Volumetric Samples": 32,
    "Volumetric Anisotropy": 0,
    "Lens Flare": false,
    "Lens Flare Intensity": 1.0,
    "Lens Flare Scale": 1.0,
    "Lens Flare Color": "#ffffff",
    "Lens Flare Rotation": 0,
    "Lens Flare Position": 0,
    "Lens Flare Speed": 1,
    "Lens Flare Bias": 0,
    "Lens Flare First Brightness": 0.5,
    "Lens Flare Texture": "",
    "Light Probe": false,
    "Probe Weight": 1.0,
    "Probe Intensity": 1.0,
    "Probe Bounce": 1.0,
    "Probe Bound": { x: 0, y: 0 },
    "Probe Size": 1.0,
    "Probe Resolution": 32,
    "Probe HDR": true,
    "Probe Background": "",
    "Probe Clear Flags": "Solid Color",
    "Probe Mode": "Realtime",
    "Probe Refresh Mode": "Every Frame",
    "Probe Time Slicing": "All Faces At Once",
  };

  // Physics 2D extensions
  groups["Physics 2D"] = {
    "Body Type": "Dynamic",
    "Material": "Default",
    "Simulated": true,
    "Use Auto Mass": false,
    "Mass": 1.0,
    "Linear Drag": 0,
    "Angular Drag": 0.05,
    "Gravity Scale": 1.0,
    "Is Kinematic": false,
    "Use Full Kinematic Contacts": false,
    "Auto Mass": false,
    "Center of Mass": { x: 0, y: 0 },
    "Center of Mass Auto": true,
    "Inertia Tensor": 0,
    "Inertia Tensor Auto": true,
    "World Center of Mass": { x: 0, y: 0 },
    "Local Center of Mass": { x: 0, y: 0 },
    "Collision Detection": "Discrete",
    "Sleep Mode": "Start Awake",
    "Interpolate": "None",
    "Constraints": "None",
    "Freeze Position X": false,
    "Freeze Position Y": false,
    "Freeze Rotation Z": false,
    "Velocity": { x: 0, y: 0 },
    "Angular Velocity": 0,
    "Position": { x: 0, y: 0 },
    "Rotation": 0,
    "Move Position": { x: 0, y: 0 },
    "Move Rotation": 0,
    "Is Sleeping": false,
    "Sleep State": "Awake",
    "Sleep Threshold": 0.05,
    "Awake": true,
    "Wake Up": true,
    "Sleep": false,
    "Is Touching": false,
    "Is Touching Layers": 0,
    "Attached Collider Count": 0,
    "Attached Colliders": "",
    "Cast Filter": "",
    "Use Attachment": false,
    "Attachment": "",
    "Composite Collider": false,
    "Composite Operation": "Merge",
    "Composite Order": 0,
    "Composite Generation": "Tiles",
    "Composite Offset": 0.0001,
    "Composite Edge Radius": 0,
    "Composite Vertices Distance": 0.005,
    "Used By Composite": false,
    "Used By Effector": false,
    "Effector": "",
    "Area Effector": false,
    "Area Force Magnitude": 0,
    "Area Force Angle": 0,
    "Area Force Variation": 0,
    "Area Drag Magnitude": 0,
    "Area Force Target": "Collider",
    "Point Effector": false,
    "Point Force Magnitude": 0,
    "Point Force Variation": 0,
    "Point Distance": 1,
    "Point Drag Magnitude": 0,
    "Point Drag Variation": 0,
    "Surface Effector": false,
    "Surface Speed": 0,
    "Surface Speed Variation": 0,
    "Surface Force Scale": 1.0,
    "Surface Drag": false,
    "Buoyancy Effector": false,
    "Buoyancy Density": 1.0,
    "Buoyancy Level": 0,
    "Buoyancy Flow Angle": 90,
    "Buoyancy Flow Magnitude": 0,
    "Buoyancy Flow Variation": 0,
    "Buoyancy Damping Factor": 0.1,
    "Buoyancy Surface Level": 0,
    "Platform Effector": false,
    "Platform Use One Way": true,
    "Platform Use Side Friction": false,
    "Platform Side Arc": 90,
    "Platform Rotational Offset": 0,
    "Bus Effector": false,
    "Bus Surface Arc": 180,
  };

  // Events group
  groups["Events"] = {
    "On Start": "",
    "On Update": "",
    "On Destroy": "",
    "On Enable": "",
    "On Disable": "",
    "On Collision Enter": "",
    "On Collision Stay": "",
    "On Collision Exit": "",
    "On Trigger Enter": "",
    "On Trigger Stay": "",
    "On Trigger Exit": "",
    "On Click": "",
    "On Hover": "",
    "On Drag": "",
    "On Drop": "",
    "On Key Press": "",
    "On Key Release": "",
    "On Mouse Down": "",
    "On Mouse Up": "",
    "On Mouse Drag": "",
    "On Animator Move": "",
    "On Animator IK": "",
    "On Before Render": "",
    "On Post Render": "",
    "On Pre Cull": "",
    "On Post Cull": "",
    "On Will Render Object": "",
    "On Render Object": "",
    "On Became Visible": "",
    "On Became Invisible": "",
    "On Particle Collision": "",
    "On Joint Break": "",
    "On Transform Children Changed": "",
    "On Transform Parent Changed": "",
    "On Application Focus": "",
    "On Application Pause": "",
    "On Application Quit": "",
    "On Draw Gizmos": "",
    "On Draw Gizmos Selected": "",
    "On Validate": "",
    "On Reset": "",
  };

  return groups;
}

export function PropertiesPanel() {
  const { sceneTree, selectedEntityId, updateEntityProperty } = useStudio();
  const entity = sceneTree.find((e) => e.id === selectedEntityId);
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");

  const groups = useMemo(() => {
    if (!entity) return {};
    return generateExtendedProperties(entity);
  }, [entity]);

  const filteredGroups = useMemo(() => {
    if (!search) return groups;
    const result: Record<string, Record<string, unknown>> = {};
    for (const [groupName, props] of Object.entries(groups)) {
      const matching: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(props)) {
        if (key.toLowerCase().includes(search.toLowerCase())) {
          matching[key] = value;
        }
      }
      if (Object.keys(matching).length > 0) {
        result[groupName] = matching;
      }
    }
    return result;
  }, [groups, search]);

  const totalProps = useMemo(() => {
    return Object.values(groups).reduce((sum, g) => sum + Object.keys(g).length, 0);
  }, [groups]);

  const toggleGroup = (name: string) => {
    setCollapsedGroups((s) => {
      const next = new Set(s);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  if (!entity) {
    return (
      <div className="flex flex-col h-full bg-[var(--studio-properties)] border-l border-border">
        <div className="flex items-center justify-between px-2 h-7 border-b border-border bg-[var(--studio-toolbar)]">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Properties
          </span>
          <Settings2 className="w-3 h-3 text-muted-foreground" />
        </div>
        <div className="flex-1 flex items-center justify-center text-xs text-muted-foreground p-4 text-center">
          Select an entity in the Hierarchy to view its properties.
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[var(--studio-properties)] border-l border-border">
      <div className="flex items-center justify-between px-2 h-7 border-b border-border bg-[var(--studio-toolbar)]">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Properties
        </span>
        <span className="text-[10px] text-muted-foreground">{totalProps} props</span>
      </div>
      <div className="p-2 border-b border-border">
        <div className="text-xs text-muted-foreground mb-1">Selected</div>
        <div className="text-sm font-medium">{entity.name}</div>
        <div className="text-xs text-muted-foreground mt-1">{entity.type}</div>
      </div>
      <div className="p-1 border-b border-border">
        <div className="flex items-center gap-2 px-2 py-1 rounded bg-background/40">
          <Search className="w-3 h-3 text-muted-foreground" />
          <input
            className="flex-1 bg-transparent text-xs outline-none placeholder:text-muted-foreground"
            placeholder={`Filter ${totalProps} properties…`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        {Object.entries(filteredGroups).map(([groupName, props]) => {
          const isCollapsed = collapsedGroups.has(groupName) && !search;
          return (
            <div key={groupName}>
              <div
                className="flex items-center gap-1 px-2 py-1 bg-[var(--studio-toolbar)]/50 hover:bg-[var(--studio-toolbar)] cursor-pointer border-b border-border"
                onClick={() => toggleGroup(groupName)}
              >
                <span className="w-3 flex justify-center">
                  {isCollapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </span>
                <span className="text-xs font-semibold uppercase tracking-wider">{groupName}</span>
                <span className="text-[10px] text-muted-foreground ml-auto">{Object.keys(props).length}</span>
              </div>
              {!isCollapsed && Object.entries(props).map(([key, value]) => (
                <div key={key} className="prop-row">
                  <div className="prop-key">{key}</div>
                  <div className="prop-value">
                    <ValueEditor
                      value={value}
                      onChange={(v) => updateEntityProperty(entity.id, key, v)}
                    />
                  </div>
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
