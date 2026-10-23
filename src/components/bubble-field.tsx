"use client";

import { useEffect, useRef } from "react";

type Bubble = {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  radius: number;
  mass: number;
  phase: number;
  targetX: number;
  targetY: number;
  color: number;
};

const clamp = (value: number, min = 0, max = 1) => Math.max(min, Math.min(max, value));
const smoothstep = (start: number, end: number, value: number) => {
  const t = clamp((value - start) / (end - start));
  return t * t * (3 - 2 * t);
};

function inHeart(x: number, y: number) {
  const a = x * x + y * y - 1;
  return a * a * a - x * x * y * y * y <= 0;
}

function heartPoint(random: () => number, scale: number) {
  let x = 0;
  let y = 0;
  do {
    x = random() * 2.5 - 1.25;
    y = random() * 2.55 - 1.4;
  } while (!inHeart(x, y));
  return { x: x * scale, y: -y * scale };
}

export function BubbleField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;

    let width = 0;
    let height = 0;
    let dpr = 1;
    let frame = 0;
    const pointer = { x: -1000, y: -1000, down: false };
    let bubbles: Bubble[] = [];

    const createBubbles = () => {
      const random = Math.random;
      const count = window.innerWidth < 768 ? 36 : 56;
      const scale = Math.min(width, height) * 0.20;
      bubbles = Array.from({ length: count }, (_, index) => {
        const target = heartPoint(random, scale);
        const radius = index % 11 === 0 ? 52 + random() * 16 : index % 4 === 0 ? 32 + random() * 14 : 18 + random() * 18;
        return {
          x: width * 0.5 + target.x + (random() - 0.5) * radius * 0.35,
          y: height * 0.48 + target.y + (random() - 0.5) * radius * 0.35,
          z: (random() - 0.5) * 260,
          vx: (random() - 0.5) * 0.24,
          vy: (random() - 0.5) * 0.24,
          vz: 0,
          radius,
          mass: radius ** 3,
          phase: random() * Math.PI * 2,
          targetX: width * 0.5 + target.x,
          targetY: height * 0.48 + target.y,
          color: index % 5,
        };
      });
    };

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      dpr = Math.min(window.devicePixelRatio || 1, 3);
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = String(width) + "px";
      canvas.style.height = String(height) + "px";
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      context.imageSmoothingEnabled = true;
      if (!bubbles.length) createBubbles();
    };

    const move = (event: PointerEvent) => { pointer.x = event.clientX; pointer.y = event.clientY; };
    const press = () => { pointer.down = true; };
    const release = () => { pointer.down = false; };

    const draw = (time: number) => {
      const progress = window.scrollY / Math.max(height, 1);
      const fly = smoothstep(2.7, 3.45, progress);
      const palette = [
        ["#fffafb", "#ffb6cf", "#ff4f87"],
        ["#fff7fb", "#f7b2ca", "#d84c88"],
        ["#f8f3ff", "#d5bcff", "#8f64e9"],
        ["#fffefe", "#ff9dbb", "#f12661"],
        ["#fff6f9", "#ffb4d3", "#ed4d91"],
      ] as const;

      context.clearRect(0, 0, width, height);
      bubbles.forEach((bubble) => {
        const wobbleX = Math.cos(time * 0.00045 + bubble.phase) * 8;
        const wobbleY = Math.sin(time * 0.0005 + bubble.phase) * 7;
        const targetX = bubble.targetX + wobbleX;
        const targetY = bubble.targetY + wobbleY;
        bubble.vx += (targetX - bubble.x) * (0.0032 + (1 - fly) * 0.0012);
        bubble.vy += (targetY - bubble.y) * (0.0032 + (1 - fly) * 0.0012);
        if (fly > 0.01) {
          bubble.vz += 1.45 * fly;
          bubble.vx += (bubble.x - width * 0.5) * 0.00045 * fly;
          bubble.vy += (bubble.y - height * 0.5) * 0.00045 * fly;
        }

        const dx = bubble.x - pointer.x;
        const dy = bubble.y - pointer.y;
        const distance = Math.hypot(dx, dy) || 1;
        const repelRadius = pointer.down ? 220 : 155;
        if (distance < repelRadius) {
          const force = (1 - distance / repelRadius) * (pointer.down ? 1.3 : 0.6);
          bubble.vx += (dx / distance) * force;
          bubble.vy += (dy / distance) * force;
        }
        bubble.vx *= 0.965;
        bubble.vy *= 0.965;
        bubble.vz *= 0.99;
        bubble.x += bubble.vx;
        bubble.y += bubble.vy;
        bubble.z += bubble.vz;
      });

      for (let i = 0; i < bubbles.length; i += 1) {
        for (let j = i + 1; j < bubbles.length; j += 1) {
          const first = bubbles[i];
          const second = bubbles[j];
          const dx = second.x - first.x;
          const dy = second.y - first.y;
          const distance = Math.hypot(dx, dy) || 0.001;
          const minimum = (first.radius + second.radius) * 0.58;
          if (distance >= minimum) continue;
          const nx = dx / distance;
          const ny = dy / distance;
          const overlap = (minimum - distance) * 0.12;
          first.x -= nx * overlap;
          first.y -= ny * overlap;
          second.x += nx * overlap;
          second.y += ny * overlap;
          const relative = (second.vx - first.vx) * nx + (second.vy - first.vy) * ny;
          if (relative < 0) {
            const impulse = -relative * 0.24;
            first.vx -= nx * impulse;
            first.vy -= ny * impulse;
            second.vx += nx * impulse;
            second.vy += ny * impulse;
          }
        }
      }

      const heartScale = Math.min(width, height) * 0.018;
      context.save();
      context.translate(width * 0.5, height * 0.48);
      context.beginPath();
      for (let step = 0; step <= 120; step += 1) {
        const angle = (step / 120) * Math.PI * 2;
        const heartX = 16 * Math.sin(angle) ** 3 * heartScale;
        const heartY = -(13 * Math.cos(angle) - 5 * Math.cos(angle * 2) - 2 * Math.cos(angle * 3) - Math.cos(angle * 4)) * heartScale;
        if (step === 0) context.moveTo(heartX, heartY);
        else context.lineTo(heartX, heartY);
      }
      context.closePath();
      context.fillStyle = "#ff9fbd12";
      context.strokeStyle = "#ff77a966";
      context.lineWidth = 2;
      context.fill();
      context.stroke();
      context.restore();

      bubbles.slice().sort((a, b) => a.z - b.z).forEach((bubble) => {
        const depth = clamp(1 - bubble.z / 900, 0.55, 1.35);
        const radius = bubble.radius * depth * (1 + fly * 2.8);
        const x = bubble.x + (bubble.x - width * 0.5) * fly * 0.4;
        const y = bubble.y + (bubble.y - height * 0.5) * fly * 0.4;
        const colors = palette[bubble.color];
        const base = colors[1];
        const deep = colors[2];
        const gradient = context.createRadialGradient(x - radius * 0.34, y - radius * 0.44, 1, x, y, radius * 1.25);
        gradient.addColorStop(0, "#ffffff");
        gradient.addColorStop(0.13, "#ffffffef");
        gradient.addColorStop(0.3, base + "f2");
        gradient.addColorStop(0.7, deep + "e8");
        gradient.addColorStop(0.91, deep + "8e");
        gradient.addColorStop(1, "#ffffff0a");

        context.globalAlpha = clamp(1 - fly * 0.82, 0.1, 1);
        context.fillStyle = gradient;
        context.shadowColor = deep + "70";
        context.shadowBlur = 20 * depth;
        context.beginPath();
        context.arc(x, y, radius, 0, Math.PI * 2);
        context.fill();
        context.shadowBlur = 0;
        context.strokeStyle = "#ffffff99";
        context.lineWidth = Math.max(1, radius * 0.035);
        context.stroke();

        context.globalAlpha *= 0.82;
        context.fillStyle = "#ffffff";
        context.beginPath();
        context.ellipse(x - radius * 0.3, y - radius * 0.38, radius * 0.14, radius * 0.08, -0.45, 0, Math.PI * 2);
        context.fill();
        context.globalAlpha = 1;
      });
      frame = requestAnimationFrame(draw);
    };

    resize();
    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerdown", press);
    window.addEventListener("pointerup", release);
    frame = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerdown", press);
      window.removeEventListener("pointerup", release);
    };
  }, []);

  return <div className="bubble-field" aria-hidden="true"><canvas ref={canvasRef} /></div>;
}
