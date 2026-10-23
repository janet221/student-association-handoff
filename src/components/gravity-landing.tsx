"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowDown, SlidersHorizontal, X } from "lucide-react";
import Link from "next/link";
import { LoginEntry } from "@/components/login-entry";

const palettes = [
  { name: "Royal Blue & Pearl", color: "#2f69ff", copy: "Hyper-distinct cobalt spheres in a soft white-slate field." },
  { name: "Rose Blush & Crème", color: "#ffa6b3", copy: "Candy pinks and strawberry accents in a pearl studio." },
  { name: "Volt Lime & Slate", color: "#e1fc03", copy: "Electric lime against a clean white-slate horizon." },
  { name: "Arctic Sky & Crystal", color: "#96e5ff", copy: "Cool crystal blues with a translucent glass sheen." },
];

export function GravityLanding({ error, message }: { error?: string; message?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [palette, setPalette] = useState(palettes[0]);
  const [controlsOpen, setControlsOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const balls = Array.from({ length: 54 }, (_, i) => ({ x: Math.random(), y: .18 + Math.random() * .55, vx: (Math.random() - .5) * .0015, vy: (Math.random() - .5) * .0015, r: 7 + (i % 6) * 3 }));
    const pointer = { x: -10, y: -10 };
    let frame = 0;
    const resize = () => { const dpr = Math.min(window.devicePixelRatio || 1, 2); canvas.width = innerWidth * dpr; canvas.height = innerHeight * dpr; canvas.style.width = `${innerWidth}px`; canvas.style.height = `${innerHeight}px`; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); };
    const move = (event: PointerEvent) => { pointer.x = event.clientX; pointer.y = event.clientY; };
    const draw = () => {
      const progress = scrollY / Math.max(innerHeight, 1);
      const pink = Math.max(0, Math.min(1, (progress - 1.2) / 1.4));
      ctx.clearRect(0, 0, innerWidth, innerHeight);
      for (const ball of balls) {
        const tx = innerWidth * (.5 + Math.cos(ball.x * 20 + progress) * (.16 - pink * .08));
        const ty = innerHeight * (.42 + Math.sin(ball.y * 18 + progress) * (.13 - pink * .04));
        ball.vx += (tx / innerWidth - ball.x) * .00008;
        ball.vy += (ty / innerHeight - ball.y) * .00008;
        const dx = ball.x * innerWidth - pointer.x, dy = ball.y * innerHeight - pointer.y, distance = Math.hypot(dx, dy) || 1;
        if (distance < 150) { ball.vx += dx / distance * .0008; ball.vy += dy / distance * .0008; }
        ball.vx *= .985; ball.vy *= .985; ball.x += ball.vx; ball.y += ball.vy;
        const x = ball.x * innerWidth, y = ball.y * innerHeight, radius = ball.r * (1 + Math.min(progress, 1) * .35);
        const gradient = ctx.createRadialGradient(x - radius * .35, y - radius * .45, 1, x, y, radius * 1.5);
        gradient.addColorStop(0, "#ffffff"); gradient.addColorStop(.18, palette.color); gradient.addColorStop(1, `${palette.color}88`);
        ctx.fillStyle = gradient; ctx.shadowColor = `${palette.color}66`; ctx.shadowBlur = 18; ctx.beginPath(); ctx.arc(x, y, radius, 0, Math.PI * 2); ctx.fill(); ctx.shadowBlur = 0;
      }
      frame = requestAnimationFrame(draw);
    };
    resize(); addEventListener("resize", resize); addEventListener("pointermove", move); frame = requestAnimationFrame(draw);
    const timer = window.setTimeout(() => setLoading(false), 700);
    return () => { cancelAnimationFrame(frame); clearTimeout(timer); removeEventListener("resize", resize); removeEventListener("pointermove", move); };
  }, [palette]);

  return <main className="gravity-site">
    {loading && <div className="gravity-loader"><span>CALIBRATING GRAVITY FIELD</span><div><i /></div><b>096%</b></div>}
    <div className="gravity-background" />
    <canvas ref={canvasRef} className="gravity-canvas" aria-hidden="true" />
    <header className="gravity-header">
      <a className="gravity-wordmark" href="#hero">GRAVITY</a>
      <nav><a href="#drop">Works</a><a href="#shape">Services</a><a href="#release">Story</a><a href="#contact">Contact</a></nav>
      <div className="gravity-header-actions"><button className="gravity-icon-button" onClick={() => setControlsOpen(true)} aria-label="開啟工作室控制"><SlidersHorizontal size={16} /></button><LoginEntry error={error} message={message} label="Contact us" /></div>
    </header>
    <section className="gravity-section gravity-hero" id="hero"><div><p className="gravity-eyebrow">[ Digital studio ]</p><h1>Less noise.<br />More gravity.</h1></div><div className="gravity-hero-copy"><p>We design digital experiences that remove distraction and amplify presence.</p><small>© 2026 — Independent digital agency</small><a href="#drop"><ArrowDown size={14} /> SCROLL</a></div></section>
    <section className="gravity-section gravity-drop" id="drop"><div><p className="gravity-label">[ 02 — Physics ]</p><h2>When structure<br />lets go.</h2><p className="gravity-body">Keep scrolling and the field surrenders to gravity. Every sphere obeys real simulated physics — mass, momentum, restitution — tumbling down and bouncing off the floor until the energy finally settles.</p></div><div className="gravity-stats">{[["01", "Solver", "Verlet", "Stable stacking at 60fps"], ["02", "Restitution", "0.65 — bouncy", "Energy lost on every contact"], ["03", "Bodies", "Real-time GPU", "No pre-baked animation"]].map(([index, key, value, copy]) => <article key={index}><header><span>{index} · {key}</span><i /></header><strong>{value}</strong><p>{copy}</p></article>)}</div></section>
    <section className="gravity-section gravity-shape" id="shape"><div><p className="gravity-label">[ 03 — Form ]</p><h2>Chaos, then form.</h2></div><div className="gravity-shape-copy"><p>Out of free-fall, the field reassembles — every bubble finding its place in a single shape. Move your cursor through it and watch the order ripple, scatter, and recover.</p><span>⌁ &nbsp; SWIPE THROUGH IT</span></div></section>
    <section className="gravity-section gravity-release" id="release"><p className="gravity-label">[ 04 — Release ]</p><h2>And then,<br />weightless.</h2><p>The whole field lifts off the screen and rushes past you — every sphere accelerating into the lens until nothing remains but light. Less noise.</p></section>
    <footer className="gravity-footer" id="contact"><div className="gravity-marquee">Less noise <i /> More gravity <i /> Design with weight <i /> Let&apos;s build <i /> </div><div className="gravity-footer-grid"><div><p className="gravity-label">[ Let&apos;s collaborate ]</p><h2>Have an idea<br />with real weight?</h2><LoginEntry error={error} message={message} label="hello@gravity.studio" /></div><div className="gravity-links"><div><small>Studio</small><a href="#drop">Works ↗</a><a href="#shape">Services ↗</a><a href="#release">Process ↗</a></div><div><small>Company</small><a href="#hero">Story ↗</a><a href="#contact">Team ↗</a><a href="#contact">Contact ↗</a></div><div><small>System</small><Link href="/activities">本屆工作 ↗</Link><Link href="/history">交接紀錄 ↗</Link></div></div></div><div className="gravity-footer-bottom"><b>GRAVITY <i /> </b><span>© 2026 Digital Studio — All rights reserved.</span></div></footer>
    {controlsOpen && <><button className="gravity-scrim" onClick={() => setControlsOpen(false)} aria-label="關閉控制面板" /><aside className="gravity-drawer"><button className="gravity-close" onClick={() => setControlsOpen(false)}><X size={18} /></button><p className="gravity-label">STUDIO CONTROLS</p><h2>Hero Palette<br />Shaders</h2><p className="gravity-drawer-copy">Set the hero sphere palette. As you scroll, the scene morphs to volt-lime, then rose-pink as the field assembles.</p>{palettes.map((item) => <button key={item.name} className={`gravity-palette ${palette.name === item.name ? "selected" : ""}`} onClick={() => setPalette(item)}><i style={{ background: item.color }} /><strong>{item.name}</strong><small>{item.copy}</small></button>)}<small className="gravity-engine">RENDER ENGINE / CANVAS FIELD<br />DYNAMICS SOLVER / MOMENTUM</small></aside></>}
  </main>;
}
