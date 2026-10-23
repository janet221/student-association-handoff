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
  hue: number;
  phase: number;
};

const clamp = (value: number, min = 0, max = 1) => Math.max(min, Math.min(max, value));
const smoothstep = (start: number, end: number, value: number) => {
  const t = clamp((value - start) / (end - start));
  return t * t * (3 - 2 * t);
};
const lerp = (start: number, end: number, amount: number) => start + (end - start) * amount;

function heartPoint(index: number, total: number, scale: number) {
  const angle = (index / total) * Math.PI * 2;
  const x = 16 * Math.sin(angle) ** 3;
  const y = 13 * Math.cos(angle) - 5 * Math.cos(angle * 2) - 2 * Math.cos(angle * 3) - Math.cos(angle * 4);
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
      const count = window.innerWidth < 768 ? 54 : 96;
      bubbles = Array.from({ length: count }, (_, index) => {
        const radius = Math.random() < 0.3 ? 16 + Math.random() * 10 : Math.random() < 0.8 ? 25 + Math.random() * 13 : 39 + Math.random() * 16;
        return {
          x: width * (0.25 + Math.random() * 0.5),
          y: height * (0.18 + Math.random() * 0.62),
          z: (Math.random() - 0.5) * 300,
          vx: (Math.random() - 0.5) * 0.8,
          vy: (Math.random() - 0.5) * 0.8,
          vz: 0,
          radius,
          mass: radius ** 3,
          hue: index % 5,
          phase: Math.random() * Math.PI * 2,
        };
      });
    };

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = String(width) + "px";
      canvas.style.height = String(height) + "px";
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (!bubbles.length) createBubbles();
    };

    const move = (event: PointerEvent) => {
      pointer.x = event.clientX;
      pointer.y = event.clientY;
    };
    const press = () => { pointer.down = true; };
    const release = () => { pointer.down = false; };

    const draw = (time: number) => {
      const progress = window.scrollY / Math.max(height, 1);
      const lime = smoothstep(0.55, 1.05, progress);
      const pink = smoothstep(1.4, 1.95, progress);
      const drop = smoothstep(0.4, 0.95, progress) * (1 - smoothstep(1.25, 1.75, progress));
      const shape = smoothstep(1.4, 2.05, progress) * (1 - smoothstep(2.55, 3, progress));
      const fly = smoothstep(2.7, 3.45, progress);

      context.clearRect(0, 0, width, height);
      for (let i = 0; i < bubbles.length; i += 1) {
        const bubble = bubbles[i];
        const heroX = width * 0.5 + Math.cos(time * 0.0004 + bubble.phase) * width * 0.13;
        const heroY = height * 0.46 + Math.sin(time * 0.0005 + bubble.phase) * height * 0.12;
        const heart = heartPoint(i, bubbles.length, Math.min(width, height) * 0.012);
        const targetX = lerp(heroX, width * 0.5 + heart.x, shape);
        const targetY = lerp(heroY, height * 0.48 + heart.y, shape);
        bubble.vx += (targetX - bubble.x) * (0.0007 + shape * 0.003);
        bubble.vy += (targetY - bubble.y) * (0.0007 + shape * 0.003);
        if (drop > 0.01) bubble.vy += 0.18 * drop;
        if (fly > 0.01) {
          bubble.vz += 1.5 * fly;
          bubble.vx += (bubble.x - width * 0.5) * 0.0004 * fly;
          bubble.vy += (bubble.y - height * 0.5) * 0.0004 * fly;
        }

        const dx = bubble.x - pointer.x;
        const dy = bubble.y - pointer.y;
        const distance = Math.hypot(dx, dy) || 1;
        const repelRadius = pointer.down ? 230 : 180;
        if (distance < repelRadius) {
          const force = (1 - distance / repelRadius) * (pointer.down ? 1.8 : 0.9);
          bubble.vx += (dx / distance) * force;
          bubble.vy += (dy / distance) * force;
        }
        bubble.vx *= drop ? 0.985 : 0.96;
        bubble.vy *= drop ? 0.985 : 0.96;
        bubble.vz *= 0.99;
        bubble.x += bubble.vx;
        bubble.y += bubble.vy;
        bubble.z += bubble.vz;

        const floor = height + bubble.radius;
        if (drop && bubble.y > floor) {
          bubble.y = floor;
          bubble.vy *= -0.48;
          bubble.vx *= 0.86;
        }
        if (bubble.x < -bubble.radius || bubble.x > width + bubble.radius) bubble.vx *= -0.75;
        if (bubble.y < -bubble.radius) { bubble.y = -bubble.radius; bubble.vy *= -0.5; }
      }

      for (let i = 0; i < bubbles.length; i += 1) {
        for (let j = i + 1; j < bubbles.length; j += 1) {
          const first = bubbles[i];
          const second = bubbles[j];
          const dx = second.x - first.x;
          const dy = second.y - first.y;
          const distance = Math.hypot(dx, dy) || 0.001;
          const minimum = first.radius + second.radius;
          if (distance >= minimum) continue;
          const nx = dx / distance;
          const ny = dy / distance;
          const overlap = (minimum - distance) * 0.24;
          first.x -= nx * overlap;
          first.y -= ny * overlap;
          second.x += nx * overlap;
          second.y += ny * overlap;
          const relative = (second.vx - first.vx) * nx + (second.vy - first.vy) * ny;
          if (relative < 0) {
            const impulse = -relative * 0.3;
            first.vx -= nx * impulse;
            first.vy -= ny * impulse;
            second.vx += nx * impulse;
            second.vy += ny * impulse;
          }
        }
      }

      bubbles.slice().sort((a, b) => a.z - b.z).forEach((bubble) => {
        const depth = clamp(1 - bubble.z / 900, 0.35, 1.8);
        const radius = bubble.radius * depth * (1 + fly * 2.8);
        const x = bubble.x + (bubble.x - width * 0.5) * fly * 0.35;
        const y = bubble.y + (bubble.y - height * 0.5) * fly * 0.35;
        const base = pink ? "#ff9eaf" : lime ? "#c8e86b" : "#4774ee";
        const deep = pink ? "#d92f62" : lime ? "#6e9d38" : "#173bc4";
        const gradient = context.createRadialGradient(x - radius * 0.35, y - radius * 0.42, 1, x, y, radius * 1.35);
        gradient.addColorStop(0, "#ffffff");
        gradient.addColorStop(0.16, "#ffffffd9");
        gradient.addColorStop(0.34, base + "e8");
        gradient.addColorStop(0.78, deep + "e8");
        gradient.addColorStop(1, deep + "20");
        context.globalAlpha = clamp(1 - fly * 0.8, 0.08, 1);
        context.fillStyle = gradient;
        context.shadowColor = deep + "55";
        context.shadowBlur = 18 * depth;
        context.beginPath();
        context.arc(x, y, radius, 0, Math.PI * 2);
        context.fill();
        context.globalAlpha = 1;
        context.shadowBlur = 0;
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
