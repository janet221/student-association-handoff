"use client";

import { useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";

const broadcastLines = {
  morning: [
    "早安！喝杯茶，開始充滿活力的一天 🥐✨",
    "晨間廣播：今天也慢慢把事情做好。",
  ],
  afternoon: [
    "下午茶時間到，今天工作順利嗎 🍰🎀",
    "午後廣播：補一口甜，繼續往前走。",
  ],
  evening: [
    "辛苦了！今晚來點甜甜的休息時光 🌙✨",
    "晚間廣播：把今天的完成，留給明天的自己。",
  ],
  night: [
    "夜深了，記得睡覺休息、不要熬夜太晚喔 😴💖",
    "深夜廣播：關掉一盞燈，也替自己留一點溫柔。",
  ],
} as const;

type BroadcastPeriod = keyof typeof broadcastLines;

function periodForHour(hour: number): BroadcastPeriod {
  if (hour >= 6 && hour < 12) return "morning";
  if (hour >= 12 && hour < 18) return "afternoon";
  if (hour >= 18 && hour < 23) return "evening";
  return "night";
}

export function TimeSticker() {
  const [now, setNow] = useState<Date | null>(null);
  const [activeLine, setActiveLine] = useState(0);
  const marqueeRef = useRef<HTMLSpanElement | null>(null);
  const [marqueeDistance, setMarqueeDistance] = useState(0);
  const minute = now?.getMinutes();

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setNow(new Date()));
    const clock = window.setInterval(() => setNow(new Date()), 1000);
    const carousel = window.setInterval(() => setActiveLine((line) => line + 1), 4200);
    return () => {
      window.cancelAnimationFrame(frame);
      window.clearInterval(clock);
      window.clearInterval(carousel);
    };
  }, []);

  useEffect(() => {
    const marquee = marqueeRef.current;
    if (!marquee || typeof ResizeObserver === "undefined") return;
    const measure = () => setMarqueeDistance(Math.max(0, marquee.scrollWidth - marquee.clientWidth));
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(marquee);
    if (marquee.firstElementChild) observer.observe(marquee.firstElementChild);
    return () => observer.disconnect();
  }, [minute, activeLine]);

  if (!now) return null;
  const period = periodForHour(now.getHours());
  const lines = broadcastLines[period];
  const lineIndex = activeLine % lines.length;
  const time = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

  return (
    <aside className="time-sticker" aria-label="即時時段廣播">
      <span className="time-sticker-live">
        <b aria-hidden="true">LIVE</b>
        <time dateTime={now.toISOString()}>{time}</time>
      </span>
      <span className="time-sticker-signal" aria-hidden="true">⌁</span>
      <span ref={marqueeRef} className={`time-sticker-marquee${marqueeDistance > 0 ? " is-overflowing" : ""}`} aria-live="polite" key={`${period}-${lineIndex}`}>
        <span className="time-sticker-copy" style={{ "--broadcast-distance": `${marqueeDistance}px` } as CSSProperties}>{lines[lineIndex]}</span>
      </span>
      <i aria-hidden="true">✦</i>
    </aside>
  );
}

