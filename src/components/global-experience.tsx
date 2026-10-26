"use client";

import { useEffect, useRef, useState } from "react";

const MUSIC_PREF = "ncue-background-music";
const TRACK = "/audio/ethereal-magical-reverie.mp3";

export function GlobalExperience() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [pending, setPending] = useState(false);
  const [resumeAvailable, setResumeAvailable] = useState(false);
  const requestRef = useRef(0);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    setResumeAvailable(localStorage.getItem(MUSIC_PREF) === "on");
    audio.volume = 0.16;
    const sync = () => setPlaying(!audio.paused && !audio.ended);
    const waiting = () => setPlaying(false);
    const failed = () => { requestRef.current += 1; setPending(false); setPlaying(false); };
    audio.addEventListener("play", sync);
    audio.addEventListener("playing", sync);
    audio.addEventListener("waiting", waiting);
    audio.addEventListener("stalled", waiting);
    audio.addEventListener("pause", sync);
    audio.addEventListener("ended", sync);
    audio.addEventListener("error", failed);
    return () => {
      audio.removeEventListener("play", sync);
      audio.removeEventListener("playing", sync);
      audio.removeEventListener("waiting", waiting);
      audio.removeEventListener("stalled", waiting);
      audio.removeEventListener("pause", sync);
      audio.removeEventListener("ended", sync);
      audio.removeEventListener("error", failed);
      audio.pause();
    };
  }, []);

  const toggle = async () => {
    const audio = audioRef.current;
    if (!audio || pending) return;
    if (!audio.paused) {
      requestRef.current += 1;
      audio.pause();
      localStorage.setItem(MUSIC_PREF, "off");
      setResumeAvailable(false);
      setPlaying(false);
      return;
    }
    const request = ++requestRef.current;
    setPending(true);
    try {
      await audio.play();
      if (request !== requestRef.current) return;
      localStorage.setItem(MUSIC_PREF, "on");
      setResumeAvailable(false);
      setPlaying(!audio.paused);
    } catch {
      if (request === requestRef.current) {
        localStorage.setItem(MUSIC_PREF, "off");
        setResumeAvailable(false);
        setPlaying(false);
      }
    } finally {
      if (request === requestRef.current) setPending(false);
    }
  };

  useEffect(() => {
    const canvas = document.createElement("canvas");
    canvas.className = "magic-canvas";
    canvas.setAttribute("aria-hidden", "true");
    document.body.appendChild(canvas);
    const ctx = canvas.getContext("2d");
    if (!ctx) { canvas.remove(); return; }
    type Particle = { x:number; y:number; vx:number; vy:number; size:number; life:number; decay:number; color:string; kind:"star"|"pearl"; rotation:number; spin:number; glow:number };
    let particles: Particle[] = [];
    let frame = 0;
    let lastX = -100;
    let lastY = -100;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    const colors = ["#ff9fc1", "#ffd1e1", "#fff7fb", "#e8edf4", "#d5dbe5", "#ffffff", "#e4b9ce"];
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    const draw = (p: Particle) => {
      ctx.save(); ctx.translate(p.x,p.y); ctx.rotate(p.rotation); ctx.globalAlpha = Math.max(0,p.life); ctx.fillStyle=p.color; ctx.shadowColor=p.color; ctx.shadowBlur=p.glow; ctx.beginPath();
      if (p.kind === "pearl") { const r=p.size/2; const g=ctx.createRadialGradient(-r*.34,-r*.38,r*.08,0,0,r); g.addColorStop(0,"#fff");g.addColorStop(.34,"#fff9fc");g.addColorStop(.72,p.color);g.addColorStop(1,"#c9ced8");ctx.fillStyle=g;ctx.arc(0,0,r,0,Math.PI*2);ctx.fill(); }
      else { for(let i=0;i<8;i++){const r=i%2===0?p.size:p.size/4;const a=i*Math.PI/4;ctx.lineTo(Math.cos(a)*r,Math.sin(a)*r);}ctx.closePath();ctx.fill(); }
      ctx.restore();
    };
    const animate = () => {
      ctx.clearRect(0,0,canvas.width,canvas.height);
      particles=particles.filter(p=>p.life>0);
      particles.forEach(p=>{p.x+=p.vx;p.y+=p.vy;p.vx*=.95;p.vy*=.95;p.rotation+=p.spin;p.life-=p.decay;draw(p);});
      frame=particles.length?requestAnimationFrame(animate):0;
    };
    const start = () => { if(!frame && particles.length) frame=requestAnimationFrame(animate); };
    const move = (event: PointerEvent) => {
      if(reduce.matches || event.pointerType !== "mouse") return;
      const target=event.target as HTMLElement|null;
      if(target?.closest("input, textarea, select, [contenteditable='true']")) return;
      const dx=event.clientX-lastX, dy=event.clientY-lastY;
      if(dx*dx+dy*dy<90) return;
      lastX=event.clientX;lastY=event.clientY;
      const count=(navigator.hardwareConcurrency||4)<=2?1:2;
      for(let i=0;i<count;i++) particles.push({x:event.clientX+(Math.random()-.5)*12,y:event.clientY+(Math.random()-.5)*12,vx:(Math.random()-.5)*1.2,vy:Math.random()*.7+.25,size:Math.random()*5+3,life:1,decay:Math.random()*.022+.016,color:colors[Math.floor(Math.random()*colors.length)],kind:Math.random()>.38?"pearl":"star",rotation:0,spin:(Math.random()-.5)*.08,glow:4});
      if(particles.length>96) particles=particles.slice(-96);
      start();
    };
    const burst = (event: Event) => {
      if (reduce.matches) return;
      const target=(event.target as HTMLElement|null)?.closest<HTMLElement>(".nitro-burst, .loose-sticker, .journal-sticker");
      if(!target) return;
      const pointer=event as PointerEvent;
      const rect=target.getBoundingClientRect();
      const x=pointer.clientX||rect.left+rect.width/2, y=pointer.clientY||rect.top+rect.height/2;
      const count=target.matches(".landing-idea-card, .landing-operation-step")?26:18;
      for(let i=0;i<count;i++){const a=Math.random()*Math.PI*2,s=Math.random()*4+2;particles.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s-1,size:Math.random()*7+5,life:1,decay:.025+Math.random()*.018,color:colors[Math.floor(Math.random()*colors.length)],kind:Math.random()>.38?"pearl":"star",rotation:Math.random()*Math.PI,spin:(Math.random()-.5)*.14,glow:8});}
      if(particles.length>140) particles=particles.slice(-140);
      start();
    };
    resize(); window.addEventListener("resize",resize);window.addEventListener("pointermove",move,{passive:true});document.addEventListener("click",burst);
    return()=>{if(frame)cancelAnimationFrame(frame);window.removeEventListener("resize",resize);window.removeEventListener("pointermove",move);document.removeEventListener("click",burst);canvas.remove();particles=[];};
  }, []);

  return <>
    <audio ref={audioRef} src={TRACK} loop preload="none" aria-hidden="true" />
    <button type="button" className="sound-toggle global-sound-toggle" aria-label={playing?"暫停背景音樂":"播放背景音樂"} aria-pressed={playing} aria-busy={pending} title={playing?"暫停背景音樂":"播放背景音樂"} onClick={()=>void toggle()}>
      <span aria-hidden="true">{playing?"Ⅱ":"♫"}</span><small>{pending?"連線中":playing?"音樂中":resumeAvailable?"點擊繼續":"播放音樂"}</small>
    </button>
  </>;
}
