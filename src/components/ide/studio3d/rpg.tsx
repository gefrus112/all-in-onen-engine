// All In One Engine — 3D Studio RPG runtime (playable quest logic)
"use client";

import { useRef, useEffect, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { SceneObject3D } from "./types";
import { CompoundMesh } from "./meshes";
import { Avatar3D } from "./meshes";

export interface PlayerRef {
  pos: THREE.Vector3;
  yaw: number;
  pitch: number;
  vy: number;
  onGround: boolean;
  moving: boolean;
}

export interface RpgState {
  hp: number;
  maxHp: number;
  coins: number;
  coinGoal: number;
  kills: number;
  slimeGoal: number;
  stage: number;
  prompt: string | null;
  dialogue: { name: string; text: string } | null;
  win: boolean;
  hurtAt: number;
}

export const RPG_STAGES = [
  "Collect 8 gold coins for the village",
  "Return to Elder Rowan",
  "Defeat the slimes raiding the village",
  "Quest complete — the village is safe!",
];

interface Ent {
  obj: SceneObject3D;
  home: THREE.Vector3;
  pos: THREE.Vector3;
  phase: number;
  collected?: boolean;
  collectedAt?: number;
  opened?: boolean;
  hp?: number;
  dead?: boolean;
  respawnAt?: number;
  talked?: boolean;
}

function CoinEntity({ ent }: { ent: Ent }) {
  const ref = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime;
    if (ent.collected) {
      const k = Math.min(1, (t - (ent.collectedAt ?? t)) * 2.2);
      ref.current.position.y = ent.home.y + 0.9 + k * 1.8;
      ref.current.scale.setScalar(Math.max(0.001, 1 - k));
      if (k >= 1) ref.current.visible = false;
    } else {
      ref.current.position.set(ent.pos.x, ent.home.y + 0.9 + Math.sin(t * 2 + ent.phase) * 0.08, ent.pos.z);
      ref.current.rotation.y = t * 2.4 + ent.phase;
    }
  });
  return (
    <group ref={ref} position={ent.pos}>
      <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.3, 0.3, 0.07, 18]} />
        <meshStandardMaterial color="#fbbf24" metalness={0.8} roughness={0.25} emissive="#f59e0b" emissiveIntensity={0.35} />
      </mesh>
      <mesh castShadow>
        <torusGeometry args={[0.3, 0.035, 8, 18]} />
        <meshStandardMaterial color="#fde68a" metalness={0.85} roughness={0.2} />
      </mesh>
    </group>
  );
}

function ChestEntity({ ent }: { ent: Ent }) {
  const lidRef = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    if (lidRef.current && ent.opened) {
      lidRef.current.rotation.x = Math.min(1.15, lidRef.current.rotation.x + dt * 3.2);
    }
  });
  return (
    <group position={ent.pos} rotation={[0, ent.obj.rotation[1], 0]}>
      <group position={[0, 0.31, 0]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[1.1, 0.62, 0.75]} />
          <meshStandardMaterial color="#7c4a1e" roughness={0.85} />
        </mesh>
        <mesh position={[0, 0.11, 0.39]} castShadow>
          <boxGeometry args={[1.14, 0.1, 0.1]} />
          <meshStandardMaterial color="#fbbf24" metalness={0.7} roughness={0.35} />
        </mesh>
      </group>
      <group ref={lidRef} position={[0, 0.66, -0.375]}>
        <mesh position={[0, 0.09, 0.375]} castShadow>
          <boxGeometry args={[1.12, 0.26, 0.75]} />
          <meshStandardMaterial color="#8f5622" roughness={0.85} />
        </mesh>
      </group>
      {ent.opened && (
        <mesh position={[0, 0.68, 0.05]} castShadow>
          <boxGeometry args={[0.5, 0.22, 0.3]} />
          <meshStandardMaterial color="#ffd24a" emissive="#fbbf24" emissiveIntensity={0.5} metalness={0.6} roughness={0.3} />
        </mesh>
      )}
    </group>
  );
}

function SlimeEntity({ ent }: { ent: Ent }) {
  const ref = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime;
    if (ent.dead) { ref.current.visible = false; return; }
    ref.current.visible = true;
    ref.current.position.set(ent.pos.x, Math.abs(Math.sin(t * 3.1 + ent.phase)) * 0.42, ent.pos.z);
  });
  return (
    <group ref={ref} position={ent.pos}>
      <mesh position={[0, 0.42, 0]} scale={[1, 0.78, 1]} castShadow>
        <sphereGeometry args={[0.55, 14, 12]} />
        <meshStandardMaterial color="#4ade80" roughness={0.4} emissive="#22c55e" emissiveIntensity={0.18} />
      </mesh>
      <mesh position={[-0.17, 0.5, 0.46]}>
        <boxGeometry args={[0.1, 0.14, 0.05]} />
        <meshStandardMaterial color="#111111" />
      </mesh>
      <mesh position={[0.17, 0.5, 0.46]}>
        <boxGeometry args={[0.1, 0.14, 0.05]} />
        <meshStandardMaterial color="#111111" />
      </mesh>
    </group>
  );
}

function NpcEntity({ ent }: { ent: Ent }) {
  const ref = useRef<THREE.Group>(null);
  const isElder = ent.obj.name.toLowerCase().includes("elder");
  useFrame((state) => {
    if (ref.current) {
      const t = state.clock.elapsedTime;
      ref.current.rotation.y = 2.6 + Math.sin(t * 0.8 + ent.phase) * 0.12;
    }
  });
  return (
    <group ref={ref} position={ent.pos}>
      <CompoundMesh type="npc-villager" color={isElder ? "#7c5cbf" : "#4f7e4f"} />
      {isElder && (
        <mesh position={[0, 1.32, 0.26]}>
          <boxGeometry args={[0.3, 0.34, 0.08]} />
          <meshStandardMaterial color="#e5e7eb" />
        </mesh>
      )}
      {/* interaction marker */}
      <mesh position={[0, 2.5, 0]} rotation={[0, 0, 0]}>
        <torusGeometry args={[0.16, 0.045, 8, 20]} />
        <meshStandardMaterial color={isElder ? "#fbbf24" : "#22d3ee"} emissive={isElder ? "#fbbf24" : "#22d3ee"} emissiveIntensity={0.8} />
      </mesh>
    </group>
  );
}

export function RpgRuntime({ entities, playerRef, interactRef, attackRef, active, onState, maxHp = 100 }: {
  entities: SceneObject3D[];
  playerRef: React.MutableRefObject<PlayerRef>;
  interactRef: React.MutableRefObject<number>;
  attackRef: React.MutableRefObject<number>;
  active: boolean;
  onState: (s: RpgState) => void;
  maxHp?: number;
}) {
  const entsRef = useRef<Map<string, Ent>>(new Map());
  const questRef = useRef({
    hp: maxHp, coins: 0, kills: 0, stage: 0,
    dialogueShownAt: 0, lastHurt: 0, hurtAcc: 0, stateAcc: 0,
    prompt: null as string | null,
    lastDialogue: null as { name: string; text: string } | null,
  });
  const lastInteract = useRef(0);
  const lastAttack = useRef(0);

  // build entities
  useEffect(() => {
    const map = new Map<string, Ent>();
    entities.forEach((obj, i) => {
      map.set(obj.id, {
        obj,
        home: new THREE.Vector3(...obj.position),
        pos: new THREE.Vector3(...obj.position),
        phase: i * 1.7,
        hp: 3,
        collected: false,
        opened: false,
        dead: false,
      });
    });
    entsRef.current = map;
    questRef.current = { hp: maxHp, coins: 0, kills: 0, stage: 0, dialogueShownAt: 0, lastHurt: 0, hurtAcc: 0, stateAcc: 0, prompt: null, lastDialogue: null };
  }, [entities, maxHp]);

  const push = (force = false) => {
    const q = questRef.current;
    const now = performance.now();
    if (!force && now - q.stateAcc < 120) return;
    q.stateAcc = now;
    onState({
      hp: Math.max(0, Math.round(q.hp)),
      maxHp,
      coins: q.coins,
      coinGoal: 8,
      kills: q.kills,
      slimeGoal: 3,
      stage: q.stage,
      prompt: q.prompt,
      dialogue: q.dialogueShownAt > 0 && now - q.dialogueShownAt < 7000 ? q.lastDialogue : null,
      win: q.stage >= 3,
      hurtAt: q.lastHurt,
    });
  };


  useFrame((state, dt) => {
    const ents = entsRef.current;
    const q = questRef.current;
    const player = playerRef.current;
    const t = state.clock.elapsedTime;

    // clamp dt
    const d = Math.min(dt, 0.08);

    if (active) {
      // ---- coins ----
      ents.forEach((ent) => {
        if (ent.obj.rpgKind !== "coin" || ent.collected) return;
        const dist = ent.pos.distanceTo(player.pos);
        if (dist < 1.7) {
          ent.collected = true;
          (ent as Ent & { collectedAt?: number }).collectedAt = t;
          q.coins += 1;
          if (q.coins >= 8 && q.stage === 0) { q.stage = 1; q.lastDialogue = { name: "Quest", text: "You gathered all 8 coins! Return to Elder Rowan." }; q.dialogueShownAt = performance.now(); }
          push(true);
        }
      });

      // ---- slimes: chase + damage ----
      ents.forEach((ent) => {
        if (ent.obj.rpgKind !== "slime") return;
        if (ent.dead) {
          if (ent.respawnAt && t > ent.respawnAt) { ent.dead = false; ent.hp = 3; ent.pos.copy(ent.home); }
          return;
        }
        const dist = ent.pos.distanceTo(player.pos);
        if (dist < 9 && dist > 0.4) {
          const dir = new THREE.Vector3().subVectors(player.pos, ent.pos).normalize();
          ent.pos.addScaledVector(dir, 2.1 * d);
          ent.pos.y = 0;
        }
        if (dist < 1.25) {
          q.hp -= 9 * d;
          q.hurtAcc += d;
          if (q.hurtAcc > 0.5) { q.lastHurt = Date.now(); q.hurtAcc = 0; push(true); }
          if (q.hp <= 0) {
            q.hp = maxHp;
            player.pos.set(0, 0, 17.2);
            q.lastDialogue = { name: "Elder Rowan", text: "Careful! The slimes are vicious — swing your sword with a click!" };
            q.dialogueShownAt = performance.now();
            push(true);
          }
        }
      });

      // ---- attack (click) ----
      if (attackRef.current !== lastAttack.current) {
        lastAttack.current = attackRef.current;
        const fwd = new THREE.Vector3(Math.sin(player.yaw), 0, Math.cos(player.yaw)).normalize();
        let hit = false;
        ents.forEach((ent) => {
          if (ent.obj.rpgKind !== "slime" || ent.dead) return;
          const to = new THREE.Vector3().subVectors(ent.pos, player.pos); to.y = 0;
          const dist = to.length();
          if (dist < 2.8 && to.normalize().dot(fwd) > 0.25) {
            ent.hp = (ent.hp ?? 3) - 1;
            hit = true;
            // knockback
            ent.pos.addScaledVector(to, 0.9);
            if ((ent.hp ?? 0) <= 0) {
              ent.dead = true;
              ent.respawnAt = t + 9;
              q.kills += 1;
              if (q.kills >= 3 && q.stage === 2) { q.stage = 3; q.lastDialogue = { name: "Elder Rowan", text: "The village is safe again — you are a true hero!" }; q.dialogueShownAt = performance.now(); }
              else if (q.stage === 2) { q.lastDialogue = { name: "Quest", text: `Slime defeated! ${3 - q.kills} remaining.` }; q.dialogueShownAt = performance.now(); }
            }
          }
        });
        if (hit || true) push(true);
      }

      // ---- interact (E) ----
      if (interactRef.current !== lastInteract.current) {
        lastInteract.current = interactRef.current;
        let best: Ent | null = null; let bestDist = 3.2;
        ents.forEach((ent) => {
          if (ent.obj.rpgKind !== "chest" && ent.obj.rpgKind !== "npc") return;
          if (ent.obj.rpgKind === "chest" && ent.opened) return;
          const dist = ent.pos.distanceTo(player.pos);
          if (dist < bestDist) { bestDist = dist; best = ent; }
        });
        if (best) {
          const ent = best as Ent;
          if (ent.obj.rpgKind === "chest") {
            ent.opened = true;
            q.coins += 5;
            q.lastDialogue = { name: "Treasure Chest", text: "Opened the chest — +5 gold coins!" };
            q.dialogueShownAt = performance.now();
            if (q.coins >= 8 && q.stage === 0) { q.stage = 1; }
          } else {
            const isElder = ent.obj.name.toLowerCase().includes("elder");
            if (isElder && q.stage === 1) {
              q.stage = 2;
              q.lastDialogue = { name: "Elder Rowan", text: "You found the coins! Now drive off those slimes — 3 of them are raiding the fountain. Click to swing your sword!" };
            } else if (isElder && q.stage === 0) {
              q.lastDialogue = { name: "Elder Rowan", text: "The slimes scattered our gold across the village! Bring back the 8 coins and the fountain will shine again." };
            } else if (isElder && q.stage >= 3) {
              q.lastDialogue = { name: "Elder Rowan", text: "Thank you, hero! Enjoy the golden fountain." };
            } else {
              q.lastDialogue = { name: ent.obj.name, text: "Lovely day in the village... apart from all the slimes, of course." };
            }
            ent.talked = true;
            q.dialogueShownAt = performance.now();
          }
          push(true);
        }
      }

      // ---- interact prompt ----
      let prompt: string | null = null;
      ents.forEach((ent) => {
        if (prompt) return;
        const dist = ent.pos.distanceTo(player.pos);
        if (ent.obj.rpgKind === "chest" && !ent.opened && dist < 2.4) prompt = "Press E — open chest";
        if (ent.obj.rpgKind === "npc" && dist < 2.8) prompt = `Press E — talk to ${ent.obj.name}`;
      });
      if (prompt !== q.prompt) { q.prompt = prompt; push(true); }

      // stage 0->1 also when coins reach goal via chest
      if (q.stage === 0 && q.coins >= 8) { q.stage = 1; push(true); }

      push();
    }
  });

  const coins = useMemo(() => [...entsRef.current.values()].filter((e) => e.obj.rpgKind === "coin"), [entities]);
  const chests = useMemo(() => [...entsRef.current.values()].filter((e) => e.obj.rpgKind === "chest"), [entities]);
  const slimes = useMemo(() => [...entsRef.current.values()].filter((e) => e.obj.rpgKind === "slime"), [entities]);
  const npcs = useMemo(() => [...entsRef.current.values()].filter((e) => e.obj.rpgKind === "npc"), [entities]);

  return (
    <group>
      {coins.map((e) => <CoinEntity key={e.obj.id} ent={e} />)}
      {chests.map((e) => <ChestEntity key={e.obj.id} ent={e} />)}
      {slimes.map((e) => <SlimeEntity key={e.obj.id} ent={e} />)}
      {npcs.map((e) => <NpcEntity key={e.obj.id} ent={e} />)}
    </group>
  );
}

// ---------- HUD (DOM overlay) ----------
export function RpgHud({ state, avatarName }: { state: RpgState; avatarName: string }) {
  const hurtActive = state.hurtAt > 0 && Date.now() - state.hurtAt < 450;
  return (
    <>
      {/* quest card */}
      <div className="absolute top-3 left-3 rounded-xl border border-amber-500/40 bg-black/70 backdrop-blur-sm px-4 py-2.5 pointer-events-none">
        <div className="text-[9px] font-bold tracking-[0.16em] text-amber-400">QUEST · LOST COINS</div>
        <div className="text-[13px] font-semibold text-white mt-0.5">{RPG_STAGES[Math.min(state.stage, 3)]}</div>
      </div>

      {/* coins */}
      <div className="absolute top-3 right-3 rounded-xl border border-amber-500/40 bg-black/70 backdrop-blur-sm px-4 py-2 flex items-center gap-2 pointer-events-none">
        <div className="w-4 h-4 rounded-full bg-gradient-to-br from-amber-200 to-amber-500 shadow-[0_0_10px_rgba(251,191,36,0.6)]" />
        <span className="text-amber-200 font-bold font-mono text-base">{state.coins} / {state.coinGoal}</span>
      </div>

      {/* health */}
      <div className="absolute bottom-4 left-3 w-52 pointer-events-none">
        <div className="text-[9px] font-bold tracking-[0.16em] text-white/60 mb-1">{avatarName.toUpperCase()} · HEALTH</div>
        <div className="h-3 rounded-md bg-black/60 border border-white/20 overflow-hidden">
          <div className="h-full rounded-md bg-gradient-to-r from-green-500 to-lime-400 transition-all duration-300" style={{ width: `${(state.hp / state.maxHp) * 100}%` }} />
        </div>
      </div>

      {/* kills (stage 2) */}
      {state.stage >= 2 && !state.win && (
        <div className="absolute bottom-4 right-3 rounded-lg bg-black/70 border border-red-500/40 px-3 py-1.5 text-xs text-red-300 font-mono pointer-events-none">
          Slimes defeated: {state.kills} / {state.slimeGoal}
        </div>
      )}

      {/* crosshair */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
        <div className="w-1.5 h-1.5 rounded-full bg-white/85 shadow-[0_0_6px_rgba(0,0,0,0.8)]" />
      </div>

      {/* interact prompt */}
      {state.prompt && !state.dialogue && (
        <div className="absolute bottom-24 left-1/2 -translate-x-1/2 rounded-lg bg-black/75 border border-cyan-500/40 px-4 py-1.5 text-xs text-cyan-300 font-mono pointer-events-none">
          {state.prompt}
        </div>
      )}

      {/* dialogue */}
      {state.dialogue && (
        <div className="absolute bottom-16 left-1/2 -translate-x-1/2 w-[520px] rounded-2xl border border-purple-500/40 bg-black/85 backdrop-blur px-5 py-3.5 pointer-events-none">
          <div className="text-[10px] font-extrabold tracking-[0.12em] text-purple-300 uppercase">{state.dialogue.name}</div>
          <div className="text-sm text-white leading-relaxed mt-1">{state.dialogue.text}</div>
          <div className="text-[10px] text-white/40 font-mono mt-1.5">Press E to continue</div>
        </div>
      )}

      {/* hurt vignette */}
      {hurtActive && (
        <div className="absolute inset-0 pointer-events-none" style={{ boxShadow: "inset 0 0 120px 30px rgba(220,38,38,0.55)" }} />
      )}

      {/* win overlay */}
      {state.win && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="rounded-2xl border border-amber-400/50 bg-black/80 backdrop-blur px-10 py-8 text-center">
            <div className="text-3xl font-extrabold bg-gradient-to-r from-amber-300 to-yellow-500 bg-clip-text text-transparent">Quest Complete!</div>
            <div className="text-sm text-white/60 mt-2">The village is safe. Coins collected: {state.coins} · Slimes defeated: {state.kills}</div>
            <div className="text-xs text-cyan-400 font-mono mt-4">Press Stop to return to the editor</div>
          </div>
        </div>
      )}
    </>
  );
}
