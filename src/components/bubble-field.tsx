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

function drawHeartPath(context: CanvasRenderingContext2D, x: number, y: number, radius: number) {
  const scale = radius;
  context.beginPath();
  context.moveTo(x, y - scale * 0.18);
  context.bezierCurveTo(x - scale * 0.36, y - scale * 0.86, x - scale * 1.08, y - scale * 0.74, x - scale * 1.08, y - scale * 0.08);
  context.bezierCurveTo(x - scale * 1.08, y + scale * 0.38, x - scale * 0.55, y + scale * 0.68, x, y + scale * 0.98);
  context.bezierCurveTo(x + scale * 0.55, y + scale * 0.68, x + scale * 1.08, y + scale * 0.38, x + scale * 1.08, y - scale * 0.08);
  context.bezierCurveTo(x + scale * 1.08, y - scale * 0.74, x + scale * 0.36, y - scale * 0.86, x, y - scale * 0.18);
  context.closePath();
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
      const count = window.innerWidth < 768 ? 22 : 34;
      bubbles = Array.from({ length: count }, (_, index) => {
        const radius = index % 13 === 0 ? 82 + random() * 34 : index % 4 === 0 ? 42 + random() * 26 : 20 + random() * 24;
        let targetX = width * (0.08 + random() * 0.84);
        let targetY = height * (0.12 + random() * 0.76);
        if (targetX > width * 0.26 && targetX < width * 0.74 && targetY > height * 0.28 && targetY < height * 0.72) {
          targetX = random() < 0.5 ? width * (0.08 + random() * 0.14) : width * (0.78 + random() * 0.14);
        }
        return {
          x: targetX + (random() - 0.5) * radius * 0.3,
          y: targetY + (random() - 0.5) * radius * 0.3,
          z: (random() - 0.5) * 260,
          vx: (random() - 0.5) * 0.24,
          vy: (random() - 0.5) * 0.24,
          vz: 0,
          radius,
          mass: radius ** 3,
          phase: random() * Math.PI * 2,
          targetX,
          targetY,
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
        bubble.vx += (targetX - bubble.x) * (0.0022 + (1 - fly) * 0.001);
        bubble.vy += (targetY - bubble.y) * (0.0022 + (1 - fly) * 0.001);
        bubble.vy += 0.022;
        bubble.vy += Math.sin(time * 0.0006 + bubble.phase) * 0.012;
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
        const floor = height * 0.92 - bubble.radius;
        if (bubble.y > floor) {
          bubble.y = floor;
          bubble.vy *= -0.66;
          bubble.vx *= 0.86;
        }
      });

      for (let i = 0; i < bubbles.length; i += 1) {
        for (let j = i + 1; j < bubbles.length; j += 1) {
          const first = bubbles[i];
          const second = bubbles[j];
          const dx = second.x - first.x;
          const dy = second.y - first.y;
          const distance = Math.hypot(dx, dy) || 0.001;
          const minimum = (first.radius + second.radius) * 0.62;
          if (distance >= minimum) continue;
          const nx = dx / distance;
          const ny = dy / distance;
          const overlap = (minimum - distance) * 0.1;
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

      bubbles.slice().sort((a, b) => a.z - b.z).forEach((bubble) => {
        const depth = clamp(1 - bubble.z / 900, 0.55, 1.35);
        const radius = bubble.radius * depth * (1 + fly * 2.8);
        const x = bubble.x + (bubble.x - width * 0.5) * fly * 0.4;
        const y = bubble.y + (bubble.y - height * 0.5) * fly * 0.4;
        const colors = palette[bubble.color];
        const base = colors[1];
        const deep = colors[2];
        const gradient = context.createRadialGradient(x - radius * 0.34, y - radius * 0.44, 1, x, y, radius * 1.25);
        gradient.addColorStop(0, "#fffffffa");
        gradient.addColorStop(0.15, "#ffffffd4");
        gradient.addColorStop(0.32, base + "ed");
        gradient.addColorStop(0.62, base + "c8");
        gradient.addColorStop(0.86, deep + "d2");
        gradient.addColorStop(0.96, deep + "a8");
        gradient.addColorStop(1, "#ffffff00");

        context.globalAlpha = clamp(0.96 - fly * 0.7, 0.24, 0.97);
        context.fillStyle = gradient;
        context.shadowColor = deep + "48";
        context.shadowBlur = 28 * depth;
        drawHeartPath(context, x, y, radius);
        context.fill();
        context.shadowBlur = 0;
        context.strokeStyle = deep + "b8";
        context.lineWidth = Math.max(1.4, radius * 0.06);
        context.stroke();
        context.strokeStyle = "#ffffffd0";
        context.lineWidth = Math.max(1, radius * 0.025);
        context.stroke();

        context.globalAlpha *= 0.72;
        context.fillStyle = "#ffffff";
        context.beginPath();
        context.ellipse(x - radius * 0.3, y - radius * 0.36, radius * 0.13, radius * 0.07, -0.45, 0, Math.PI * 2);
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
