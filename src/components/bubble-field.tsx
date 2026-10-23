"use client";

import { useEffect, useRef } from "react";

type Bubble = { x: number; y: number; vx: number; vy: number; radius: number; seed: number };

export function BubbleField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;
    const bubbles: Bubble[] = Array.from({ length: 34 }, (_, index) => ({
      x: Math.random(), y: 0.08 + Math.random() * 0.84,
      vx: (Math.random() - 0.5) * 0.42, vy: (Math.random() - 0.5) * 0.42,
      radius: 9 + (index % 6) * 3, seed: Math.random() * Math.PI * 2,
    }));
    const pointer = { x: -1000, y: -1000 };
    let frame = 0;
    let width = 0;
    let height = 0;
    let dpr = 1;
    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = String(width) + "px";
      canvas.style.height = String(height) + "px";
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    const move = (event: PointerEvent) => { pointer.x = event.clientX; pointer.y = event.clientY; };
    const draw = (time: number) => {
      const scrollProgress = window.scrollY / Math.max(document.documentElement.scrollHeight - height, 1);
      context.clearRect(0, 0, width, height);
      for (const bubble of bubbles) {
        bubble.vx += Math.cos(time * 0.00035 + bubble.seed) * 0.003;
        bubble.vy += Math.sin(time * 0.00028 + bubble.seed) * 0.003;
        const x = bubble.x * width;
        const y = bubble.y * height;
        const dx = x - pointer.x;
        const dy = y - pointer.y;
        const distance = Math.hypot(dx, dy) || 1;
        if (distance < 170) {
          bubble.vx += (dx / distance) * 0.04;
          bubble.vy += (dy / distance) * 0.04;
        }
        bubble.vx *= 0.992;
        bubble.vy *= 0.992;
        bubble.x += bubble.vx / Math.max(width, 1);
        bubble.y += bubble.vy / Math.max(height, 1);
        if (bubble.x < 0 || bubble.x > 1) { bubble.vx *= -1; bubble.x = Math.max(0, Math.min(1, bubble.x)); }
        if (bubble.y < 0 || bubble.y > 1) { bubble.vy *= -1; bubble.y = Math.max(0, Math.min(1, bubble.y)); }
        const radius = bubble.radius * (1 + scrollProgress * 0.18);
        const gradient = context.createRadialGradient(x - radius * 0.35, y - radius * 0.42, 1, x, y, radius * 1.55);
        gradient.addColorStop(0, "#ffffffee");
        gradient.addColorStop(0.18, "#a9c0ff");
        gradient.addColorStop(0.72, "#4272f5d9");
        gradient.addColorStop(1, "#2348c000");
        context.fillStyle = gradient;
        context.shadowColor = "#2f69ff45";
        context.shadowBlur = 18;
        context.beginPath();
        context.arc(x, y, radius, 0, Math.PI * 2);
        context.fill();
        context.shadowBlur = 0;
      }
      frame = requestAnimationFrame(draw);
    };
    resize();
    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", move);
    frame = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", move);
    };
  }, []);

  return <div className="bubble-field" aria-hidden="true"><canvas ref={canvasRef} /></div>;
}
