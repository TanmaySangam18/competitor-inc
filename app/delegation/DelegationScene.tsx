"use client";

// A procedural 3D "office" where competitor.inc's agent crew works and collaborates.
// three.js only — no external 3D models (license-clean for the commercial product).
// Monochrome + light-as-meaning to match the brand; honors reduced-motion and degrades
// gracefully if WebGL is unavailable.

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { DELEGATION, type DelegationAgent } from "@/lib/roomie/delegation";
import type { AgentRole } from "@/lib/roomie/types";

export type Phase = "idle" | "working";

export interface Speech {
  role: AgentRole;
  text: string;
}

export interface DelegationSceneProps {
  /** "working" pulls the crew toward the central table and speeds them up. */
  phase: Phase;
  /** The agent currently in the spotlight (lit + floor pulse) — usually whoever's speaking. */
  spotlight: AgentRole | null;
  /** The live line being spoken — shown as a clay speech bubble above that agent. */
  speech?: Speech | null;
  /** Vivid per-agent identity colors instead of grayscale (used on the private House floor). */
  vivid?: boolean;
  /** Give the figures faces (eyes + a smile) — Disney "appeal", so they read as characters. */
  faces?: boolean;
}

interface Char {
  agent: DelegationAgent;
  group: THREE.Group;
  body: THREE.Mesh<THREE.CapsuleGeometry, THREE.MeshStandardMaterial>;
  head: THREE.Mesh<THREE.SphereGeometry, THREE.MeshStandardMaterial>;
  ring: THREE.Mesh<THREE.RingGeometry, THREE.MeshBasicMaterial>;
  desk: THREE.Vector2;
  seat: THREE.Vector2; // collaboration spot around the table
  target: THREE.Vector2;
  wait: number;
  speed: number;
  facing: number;
  label: HTMLDivElement;
}

const ROOM = 4.6; // half-extent of the wander area

function rand(min: number, max: number) {
  return min + Math.random() * (max - min);
}

export default function DelegationScene({ phase, spotlight, speech = null, vivid = false, faces = false }: DelegationSceneProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  // Latest props read by the animation loop without re-instantiating the scene.
  const propsRef = useRef<{ phase: Phase; spotlight: AgentRole | null; speech: Speech | null }>({
    phase,
    spotlight,
    speech,
  });
  useEffect(() => {
    propsRef.current = { phase, spotlight, speech };
  }, [phase, spotlight, speech]);

  useEffect(() => {
    const mount = mountRef.current;
    const overlay = overlayRef.current;
    if (!mount || !overlay) return;

    const reduceMotion =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    // ── Renderer (guarded — WebGL may be blocked) ──────────────────
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    } catch {
      const msg = document.createElement("div");
      msg.className = "grid h-full w-full place-items-center text-sm text-muted-2";
      msg.textContent = "3D view unavailable — your browser blocked WebGL.";
      mount.appendChild(msg);
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0xf7f0da, 12, 26);

    const camera = new THREE.PerspectiveCamera(
      46,
      mount.clientWidth / mount.clientHeight,
      0.1,
      100
    );

    // ── Lighting (grayscale, soft) ─────────────────────────────────
    scene.add(new THREE.HemisphereLight(0xffffff, 0xcabf9e, 1.0));
    const key = new THREE.DirectionalLight(0xffffff, 1.0);
    key.position.set(5, 9, 6);
    scene.add(key);
    const rim = new THREE.PointLight(0xffffff, 9, 14, 2);
    rim.position.set(0, 3.2, 0);
    scene.add(rim);

    // ── Floor + grid (echoes the site's grid-bg) ──────────────────
    const floor = new THREE.Mesh(
      new THREE.CircleGeometry(7.5, 64),
      new THREE.MeshStandardMaterial({ color: 0xece4c8, roughness: 0.98, metalness: 0.0 })
    );
    floor.rotation.x = -Math.PI / 2;
    scene.add(floor);

    const grid = new THREE.GridHelper(15, 30, 0x14130e, 0x14130e);
    (grid.material as THREE.Material).opacity = 0.07;
    (grid.material as THREE.Material).transparent = true;
    grid.position.y = 0.001;
    scene.add(grid);

    // ── Central collaboration table (lit top edge = "glass") ──────
    const table = new THREE.Mesh(
      new THREE.CylinderGeometry(1.5, 1.55, 0.16, 48),
      new THREE.MeshStandardMaterial({
        color: 0x141310,
        roughness: 0.5,
        metalness: 0.1,
      })
    );
    table.position.y = 0.62;
    scene.add(table);
    const tableLeg = new THREE.Mesh(
      new THREE.CylinderGeometry(0.18, 0.28, 0.54, 24),
      new THREE.MeshStandardMaterial({ color: 0x141310, roughness: 0.6 })
    );
    tableLeg.position.y = 0.27;
    scene.add(tableLeg);
    const tableGlow = new THREE.Mesh(
      new THREE.RingGeometry(1.5, 1.62, 48),
      new THREE.MeshBasicMaterial({ color: 0xff5a36, transparent: true, opacity: 0.3 })
    );
    tableGlow.rotation.x = -Math.PI / 2;
    tableGlow.position.y = 0.705;
    scene.add(tableGlow);

    // "You" — the human in the loop, seated at the head of the table.
    const youSeat = new THREE.Mesh(
      new THREE.RingGeometry(0.34, 0.42, 32),
      new THREE.MeshBasicMaterial({ color: 0x14130e, transparent: true, opacity: 0.4 })
    );
    youSeat.rotation.x = -Math.PI / 2;
    youSeat.position.set(0, 0.02, -1.95);
    scene.add(youSeat);

    // ── Desks (one per agent) ─────────────────────────────────────
    function buildDesk(x: number, z: number) {
      const g = new THREE.Group();
      const top = new THREE.Mesh(
        new THREE.BoxGeometry(1.1, 0.06, 0.6),
        new THREE.MeshStandardMaterial({ color: 0x161616, roughness: 0.7 })
      );
      top.position.y = 0.62;
      const monitor = new THREE.Mesh(
        new THREE.BoxGeometry(0.62, 0.36, 0.04),
        new THREE.MeshStandardMaterial({
          color: 0x0c0c0c,
          emissive: 0x9a9a9a,
          emissiveIntensity: 0.5,
          roughness: 0.4,
        })
      );
      monitor.position.set(0, 0.88, -0.18);
      g.add(top, monitor);
      // face the table center
      g.position.set(x, 0, z);
      g.lookAt(0, 0, 0);
      return g;
    }
    DELEGATION.forEach((a) => scene.add(buildDesk(a.desk[0], a.desk[1])));

    // ── Characters ────────────────────────────────────────────────
    const chars: Char[] = [];
    DELEGATION.forEach((agent, i) => {
      const hex = vivid ? new THREE.Color(agent.color) : new THREE.Color().setHSL(0.1, 0.1, 0.14 + agent.tone * 0.06);
      const group = new THREE.Group();

      // Matte, rounded "clay" figures (claymorphism) — soft and toy-like, no shine.
      const body = new THREE.Mesh(
        new THREE.CapsuleGeometry(0.32, 0.58, 8, 24),
        new THREE.MeshStandardMaterial({ color: hex, roughness: 0.95, metalness: 0.0 })
      );
      body.position.y = 0.6;

      const head = new THREE.Mesh(
        new THREE.SphereGeometry(0.27, 28, 28),
        new THREE.MeshStandardMaterial({ color: hex, roughness: 0.95, metalness: 0.0 })
      );
      head.position.y = 1.3;

      // Faces (Disney "appeal"): two eyes + a friendly smile on the head's front (+z), as children of
      // the head so they turn with the character. Colorless — reads on both the mono Office and the
      // colorful House.
      if (faces) {
        const eyeMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.5 });
        const pupilMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.5 });
        for (const sx of [-1, 1]) {
          const eye = new THREE.Mesh(new THREE.SphereGeometry(0.055, 16, 16), eyeMat);
          eye.position.set(0.1 * sx, 0.06, 0.225);
          const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.026, 12, 12), pupilMat);
          pupil.position.set(0.1 * sx, 0.06, 0.265);
          head.add(eye, pupil);
        }
        const mouth = new THREE.Mesh(
          new THREE.TorusGeometry(0.085, 0.016, 8, 20, Math.PI),
          new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.6 })
        );
        mouth.rotation.z = Math.PI; // half-arc opening upward → a smile
        mouth.position.set(0, -0.01, 0.245);
        head.add(mouth);
      }

      const ring = new THREE.Mesh(
        new THREE.RingGeometry(0.32, 0.4, 32),
        new THREE.MeshBasicMaterial({
          color: vivid ? hex : 0x14130e,
          transparent: true,
          opacity: 0.18,
          side: THREE.DoubleSide,
        })
      );
      ring.rotation.x = -Math.PI / 2;
      ring.position.y = 0.02;

      group.add(body, head, ring);
      group.position.set(agent.desk[0], 0, agent.desk[1]);
      scene.add(group);

      // collaboration seat around the table
      const ang = (i / DELEGATION.length) * Math.PI * 2 - Math.PI / 2;
      const seat = new THREE.Vector2(Math.cos(ang) * 2.1, Math.sin(ang) * 2.1);

      // DOM label
      const label = document.createElement("div");
      label.className = "delegation-label";
      // Safe DOM construction (textContent), never innerHTML — no HTML-injection surface even if an
      // agent name ever becomes user-configurable.
      const ln = document.createElement("span"); ln.className = "dl-name"; ln.textContent = agent.name;
      const ls = document.createElement("span"); ls.className = "dl-sub"; ls.textContent = agent.label;
      label.append(ln, ls);
      overlay.appendChild(label);

      chars.push({
        agent,
        group,
        body,
        head,
        ring,
        desk: new THREE.Vector2(agent.desk[0], agent.desk[1]),
        seat,
        target: new THREE.Vector2(agent.desk[0], agent.desk[1]),
        wait: rand(0, 2),
        speed: rand(0.7, 1.05),
        facing: 0,
        label,
      });
    });

    // "You" label
    const youLabel = document.createElement("div");
    youLabel.className = "delegation-label dl-you";
    const yn = document.createElement("span"); yn.className = "dl-name"; yn.textContent = "You";
    const ys = document.createElement("span"); ys.className = "dl-sub"; ys.textContent = "human-in-the-loop";
    youLabel.append(yn, ys);
    overlay.appendChild(youLabel);
    const youAnchor = new THREE.Vector3(0, 1.0, -1.95);

    // Speech bubble — shows what the acting agent is doing, floating above their head.
    const captionEl = document.createElement("div");
    captionEl.className = "delegation-caption";
    overlay.appendChild(captionEl);

    // ── Camera orbit (auto + pointer drag) ────────────────────────
    let azimuth = Math.PI * 0.18;
    let elevation = 0.62;
    const radius = 9.2;
    let dragging = false;
    let lastX = 0;
    let lastY = 0;

    const onDown = (e: PointerEvent) => {
      dragging = true;
      lastX = e.clientX;
      lastY = e.clientY;
      renderer.domElement.setPointerCapture(e.pointerId);
    };
    const onMove = (e: PointerEvent) => {
      if (!dragging) return;
      azimuth -= (e.clientX - lastX) * 0.005;
      elevation = THREE.MathUtils.clamp(elevation - (e.clientY - lastY) * 0.004, 0.2, 1.2);
      lastX = e.clientX;
      lastY = e.clientY;
    };
    const onUp = (e: PointerEvent) => {
      dragging = false;
      try {
        renderer.domElement.releasePointerCapture(e.pointerId);
      } catch {
        /* ignore */
      }
    };
    renderer.domElement.style.cursor = "grab";
    renderer.domElement.addEventListener("pointerdown", onDown);
    renderer.domElement.addEventListener("pointermove", onMove);
    renderer.domElement.addEventListener("pointerup", onUp);
    renderer.domElement.addEventListener("pointerleave", onUp);

    // ── Resize ────────────────────────────────────────────────────
    const onResize = () => {
      const w = mount.clientWidth;
      const h = mount.clientHeight;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    const ro = new ResizeObserver(onResize);
    ro.observe(mount);

    // ── Animation loop ────────────────────────────────────────────
    // Manual timestamp delta (avoids the deprecated THREE.Clock).
    let last = performance.now();
    let elapsed = 0;
    const proj = new THREE.Vector3();
    let raf = 0;

    function placeLabel(el: HTMLDivElement, world: THREE.Vector3) {
      proj.copy(world).project(camera);
      if (proj.z > 1) {
        el.style.opacity = "0";
        return;
      }
      const x = (proj.x * 0.5 + 0.5) * mount!.clientWidth;
      const y = (-proj.y * 0.5 + 0.5) * mount!.clientHeight;
      el.style.transform = `translate(-50%, -120%) translate(${x}px, ${y}px)`;
      el.style.opacity = "1";
    }

    function frame() {
      raf = requestAnimationFrame(frame);
      const now = performance.now();
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      elapsed += dt;
      const { phase: ph, spotlight: spot } = propsRef.current;
      const working = ph === "working";

      // camera
      if (!reduceMotion && !dragging) azimuth += dt * 0.05;
      const cy = Math.sin(elevation) * radius;
      const cr = Math.cos(elevation) * radius;
      camera.position.set(Math.cos(azimuth) * cr, cy + 1.4, Math.sin(azimuth) * cr);
      camera.lookAt(0, 0.9, 0);

      rim.intensity = working ? 30 : 16;
      tableGlow.material.opacity = working ? 0.34 : 0.16;

      chars.forEach((c) => {
        const isSpot = spot === c.agent.role;
        const pos = new THREE.Vector2(c.group.position.x, c.group.position.z);
        const dist = pos.distanceTo(c.target);

        if (!reduceMotion) {
          if (c.wait > 0 && dist < 0.12) {
            c.wait -= dt;
          } else {
            const dir = c.target.clone().sub(pos);
            if (dir.length() > 0.001) {
              dir.normalize();
              const sp = c.speed * (working ? 1.8 : 1) * dt;
              c.group.position.x += dir.x * sp;
              c.group.position.z += dir.y * sp;
              const targetFace = Math.atan2(dir.x, dir.y);
              c.facing += (targetFace - c.facing) * Math.min(1, dt * 8);
              c.group.rotation.y = c.facing;
              // subtle walking bob
              c.head.position.y = 1.3 + Math.sin(elapsed * 9 + c.agent.tone * 6) * 0.02;
            }
            if (dist < 0.12) {
              c.wait = rand(0.5, 1.8);
              // choose next target
              if (working) {
                c.target.copy(c.seat);
              } else if (Math.random() < 0.55) {
                c.target.copy(c.desk);
              } else {
                c.target.set(rand(-ROOM, ROOM), rand(-ROOM, ROOM));
              }
            }
          }
        }

        // spotlight / activity emphasis
        const targetOpacity = isSpot ? 0.9 : working ? 0.32 : 0.16;
        c.ring.material.opacity += (targetOpacity - c.ring.material.opacity) * Math.min(1, dt * 6);
        const targetScale = isSpot ? 1.25 + Math.sin(elapsed * 4) * 0.08 : 1;
        c.ring.scale.x += (targetScale - c.ring.scale.x) * Math.min(1, dt * 6);
        c.ring.scale.y = c.ring.scale.x;
        const emis = isSpot ? 0.5 : 0;
        c.body.material.emissive.setRGB(emis, emis, emis);
        c.head.material.emissive.setRGB(emis, emis, emis);

        // label
        const head = new THREE.Vector3(c.group.position.x, 1.75, c.group.position.z);
        placeLabel(c.label, head);
        const sub = c.label.querySelector(".dl-sub");
        if (sub) {
          sub.textContent = isSpot ? "● speaking" : working ? "collaborating" : c.agent.label;
        }
        c.label.classList.toggle("is-active", isSpot);
      });

      placeLabel(youLabel, youAnchor);

      // Clay speech bubble over whoever is speaking right now.
      const sp = propsRef.current.speech;
      const speaker = sp ? chars.find((c) => c.agent.role === sp.role) : undefined;
      if (sp && speaker) {
        if (captionEl.textContent !== sp.text) captionEl.textContent = sp.text;
        placeLabel(captionEl, new THREE.Vector3(speaker.group.position.x, 2.2, speaker.group.position.z));
      } else {
        captionEl.style.opacity = "0";
      }

      renderer.render(scene, camera);
    }
    frame();

    // ── Cleanup ───────────────────────────────────────────────────
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      renderer.domElement.removeEventListener("pointerdown", onDown);
      renderer.domElement.removeEventListener("pointermove", onMove);
      renderer.domElement.removeEventListener("pointerup", onUp);
      renderer.domElement.removeEventListener("pointerleave", onUp);
      chars.forEach((c) => c.label.remove());
      youLabel.remove();
      captionEl.remove();
      scene.traverse((obj) => {
        const mesh = obj as THREE.Mesh;
        if (mesh.geometry) mesh.geometry.dispose();
        const mat = mesh.material;
        if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
        else if (mat) (mat as THREE.Material).dispose();
      });
      renderer.dispose();
      if (renderer.domElement.parentNode === mount) mount.removeChild(renderer.domElement);
    };
  }, []);

  return (
    <div className="relative h-full w-full overflow-hidden">
      <div ref={mountRef} className="absolute inset-0" />
      <div ref={overlayRef} className="pointer-events-none absolute inset-0" aria-hidden />
    </div>
  );
}
