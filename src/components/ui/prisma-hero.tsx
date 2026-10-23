"use client";

import { motion, useInView, useReducedMotion } from "framer-motion";
import { ArrowDown, ArrowRight, Asterisk, Pause, Play } from "lucide-react";
import { useRef, useState, type CSSProperties } from "react";
import { LoginEntry } from "@/components/login-entry";

interface WordsPullUpProps {
  text: string;
  className?: string;
  showAsterisk?: boolean;
  style?: CSSProperties;
}

export function WordsPullUp({ text, className = "", showAsterisk = false, style }: WordsPullUpProps) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true });
  const reducedMotion = useReducedMotion();
  return <div ref={ref} className={`inline-flex flex-wrap ${className}`} style={style}>
    {text.split(" ").map((word, i, words) => <motion.span key={i}
      initial={false}
      animate={inView && !reducedMotion ? { y: [20, 0], opacity: [0, 1] } : { y: 0, opacity: 1 }}
      transition={{ duration: .6, delay: i * .08, ease: [.16, 1, .3, 1] }}
      className="relative inline-block" style={{ marginRight: i === words.length - 1 ? 0 : ".25em" }}>
      {word}{showAsterisk && i === words.length - 1 && <span className="prisma-asterisk" aria-hidden="true">*</span>}
    </motion.span>)}
  </div>;
}

export function WordsPullUpMultiStyle({ segments, className = "", style }: {
  segments: { text: string; className?: string }[];
  className?: string;
  style?: CSSProperties;
}) {
  return <div className={`inline-flex flex-wrap ${className}`} style={style}>
    {segments.map((segment, i) => <WordsPullUp key={i} text={segment.text} className={segment.className} />)}
  </div>;
}

export function PrismaHero({ handoverLabel = "25 ➔ 26", error, message }: {
  handoverLabel?: string; error?: string; message?: string;
}) {
  const reducedMotion = useReducedMotion();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [paused, setPaused] = useState(false);
  const [videoFailed, setVideoFailed] = useState(false);
  return <section className="prisma-hero" id="top" aria-labelledby="prisma-title">
    <div className="prisma-frame">
      <div className="prisma-backdrop" aria-hidden="true">
        {!reducedMotion && !videoFailed && <video ref={videoRef} onError={() => setVideoFailed(true)} autoPlay loop muted playsInline preload="none" tabIndex={-1}
          poster="https://images.unsplash.com/photo-1472396961693-142e6e269027?auto=format&fit=crop&w=2400&q=85"
          src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260405_170732_8a9ccda6-5cff-4628-b164-059c500a2b41.mp4" />}
      </div>
      <div className="prisma-shade" aria-hidden="true" />
      <div className="noise-overlay" aria-hidden="true" />
      <nav className="prisma-nav" aria-label="首頁導覽">
        <a href="#top" className="prisma-brand">NCUE IM <Asterisk size={16} aria-hidden="true" /></a>
        <a href="#about">專案理念</a><a href="#operation">如何運作</a>
        <LoginEntry error={error} message={message} />
      </nav>
      <div className="prisma-topline"><span>STUDENT ASSOCIATION / HANDOVER SYSTEM</span><span>{handoverLabel}</span></div>
      <div className="prisma-content">
        <div className="prisma-title-block">
          <p className="prisma-kicker">每一屆的用心，都有下一頁。</p>
          <h1 id="prisma-title"><span className="sr-only">資管系學會跨股協作與換屆交接平台 — </span><WordsPullUp text="接續" showAsterisk /></h1>
          <p className="prisma-subtitle">PASS IT ON. MAKE IT YOURS.</p>
        </div>
        <div className="prisma-description">
          <p>把經驗留下，讓下一屆接著發光。<br />從歷屆活動的做法與文件開始，一起完成本屆工作，也為下一次交接留下方向。</p>
          <LoginEntry error={error} message={message} label="開始接續" />
          <a className="prisma-explore" href="#operation">了解如何運作 <ArrowRight size={16} aria-hidden="true" /></a>
        </div>
      </div>
      {!reducedMotion && !videoFailed && <button type="button" className="prisma-video-toggle" aria-label={paused ? "播放背景影片" : "暫停背景影片"} onClick={async () => {
        if (!videoRef.current) return;
        if (paused) { try { await videoRef.current.play(); setPaused(false); } catch { setVideoFailed(true); } }
        else { videoRef.current.pause(); setPaused(true); }
      }}>{paused ? <Play size={14} /> : <Pause size={14} />}</button>}
      <a href="#about" className="prisma-scroll" aria-label="向下閱讀專案理念"><ArrowDown size={16} /> SCROLL TO EXPLORE</a>
    </div>
  </section>;
}

