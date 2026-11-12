"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { LoginEntry } from "@/components/login-entry";

const operationSteps = [
  {
    number: "01",
    caption: "LOOK BACK",
    title: "先從歷屆活動找做法",
    paragraphs: [
      "在交接紀錄中選一項活動，查看當時的工作流程、執行紀錄和相關雲端文件。",
    ],
  },
  {
    number: "02",
    caption: "START WITH A FRAME",
    title: "沿用架構，再按今年調整",
    paragraphs: [
      "建立本屆活動時，可以帶入歷屆的工作階段和器材需求，再重新安排日期、場地與人員。",
    ],
  },
  {
    number: "03",
    caption: "PLAN THIS TERM",
    title: "把本屆工作排清楚",
    paragraphs: [
      "替每個工作項目設定負責人、期限和檢查清單；活動日期與工作期限也能在共同月曆一起查看。",
    ],
  },
  {
    number: "04",
    caption: "LEAVE A NOTE",
    title: "把做過的事留下來",
    paragraphs: [
      "工作完成後，記下實際做法、注意事項和結果。活動封存後，下一屆仍能在交接紀錄中找到。",
    ],
  },
];

export function LandingContent() {
  const contentRef = useRef<HTMLDivElement>(null);
  const [revealedCards, setRevealedCards] = useState<Set<string>>(() => new Set());
  const [activeScrollStep, setActiveScrollStep] = useState(0);
  const [expandedCards, setExpandedCards] = useState<Set<string>>(() => new Set());

  const toggleCard = (cardId: string) => {
    setExpandedCards((current) => current.has(cardId) ? new Set() : new Set([cardId]));
  };

  useEffect(() => {
    const root = contentRef.current;
    if (!root || !("IntersectionObserver" in window)) return;
    root.classList.add("motion-ready");
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const cardId = (entry.target as HTMLElement).dataset.cardId;
          if (cardId) setRevealedCards((current) => {
            if (current.has(cardId)) return current;
            const next = new Set(current);
            next.add(cardId);
            return next;
          });
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.14, rootMargin: "0px 0px -8%" });
    root.querySelectorAll<HTMLElement>("[data-reveal]").forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const sections = ["top", "about", "operation"]
      .map((id) => document.getElementById(id))
      .filter((section): section is HTMLElement => section !== null);
    if (!("IntersectionObserver" in window) || sections.length === 0) return;
    const observer = new IntersectionObserver((entries) => {
      const current = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (current) setActiveScrollStep(sections.indexOf(current.target as HTMLElement));
    }, { threshold: [0.12, 0.3, 0.55], rootMargin: "-30% 0px -45%" });
    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const ribbon = document.querySelector<HTMLElement>(".journey-ribbon");
    if (!ribbon) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        ribbon.style.setProperty("--ribbon-hidden", "0%");
        return;
      }
      const bounds = ribbon.getBoundingClientRect();
      const visibleLength = window.innerHeight * .82 - bounds.top;
      const progress = Math.min(1, Math.max(.08, visibleLength / bounds.height));
      ribbon.style.setProperty("--ribbon-hidden", `${((1 - progress) * 100).toFixed(2)}%`);
    };
    const schedule = () => { if (!frame) frame = window.requestAnimationFrame(update); };
    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => { window.cancelAnimationFrame(frame); window.removeEventListener("scroll", schedule); window.removeEventListener("resize", schedule); };
  }, []);

  useEffect(() => {
    const art = document.querySelector<HTMLElement>(".login-art.hero-art");
    const fountain = art?.querySelector<HTMLElement>(".hero-art-fountain img");
    if (!art || !fountain) return;
    const move = (event: PointerEvent) => {
      if (event.pointerType === "touch" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      const rect = art.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - .5;
      const y = (event.clientY - rect.top) / rect.height - .5;
      fountain.style.setProperty("--sculpture-tilt-x", `${(-y * 3.5).toFixed(2)}deg`);
      fountain.style.setProperty("--sculpture-tilt-y", `${(x * 4.2).toFixed(2)}deg`);
    };
    const reset = () => {
      fountain.style.setProperty("--sculpture-tilt-x", "0deg");
      fountain.style.setProperty("--sculpture-tilt-y", "0deg");
    };
    art.addEventListener("pointermove", move);
    art.addEventListener("pointerleave", reset);
    return () => { art.removeEventListener("pointermove", move); art.removeEventListener("pointerleave", reset); reset(); };
  }, []);

  useEffect(() => {
    const cards = Array.from(document.querySelectorAll<HTMLElement>(".landing-idea-card, .landing-operation-step"));
    const move = (event: PointerEvent) => {
      if (event.pointerType === "touch" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      const card = event.currentTarget as HTMLElement;
      if (!card.classList.contains("landing-idea-card") || card.classList.contains("is-expanded")) return;
      const rect = card.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - .5;
      const y = (event.clientY - rect.top) / rect.height - .5;
      card.style.setProperty("--card-tilt-x", `${(x * 5).toFixed(2)}deg`);
      card.style.setProperty("--card-tilt-y", `${(-y * 5).toFixed(2)}deg`);
      card.style.setProperty("--card-magnet-x", `${(x * 2).toFixed(1)}px`);
      card.style.setProperty("--card-magnet-y", `${(y * 2).toFixed(1)}px`);
    };
    const reset = (event: Event) => {
      const card = event.currentTarget as HTMLElement;
      card.style.setProperty("--card-tilt-x", "0deg");
      card.style.setProperty("--card-tilt-y", "0deg");
      card.style.setProperty("--card-magnet-x", "0px");
      card.style.setProperty("--card-magnet-y", "0px");
    };
    cards.forEach((card) => { card.addEventListener("pointermove", move); card.addEventListener("pointerleave", reset); });
    return () => cards.forEach((card) => {
      card.removeEventListener("pointermove", move);
      card.removeEventListener("pointerleave", reset);
      reset({ currentTarget: card } as unknown as Event);
    });
  }, []);



  return <div ref={contentRef}>
    <aside className={`pearl-timeline ${activeScrollStep === 0 ? "is-hero" : ""}`} aria-label="頁面閱讀進度">
      {[
        { number: "01", label: "TOP", href: "#top", name: "回到首頁" },
        { number: "02", label: "IDEA", href: "#about", name: "前往專案理念" },
        { number: "03", label: "FLOW", href: "#operation", name: "前往如何運作" },
      ].map((step, index) => (
        <a key={step.number} className={activeScrollStep === index ? "is-active" : ""} href={step.href} aria-label={step.name} title={step.name} aria-current={activeScrollStep === index ? "location" : undefined} onClick={() => setActiveScrollStep(index)}>
          <span className="pearl-timeline-orb" aria-hidden="true" />
          <span className="pearl-timeline-label"><strong>{step.number}</strong><small>{step.label}</small></span>
        </a>
      ))}
    </aside>
    <section className="landing-about" id="about">
      <span className="section-rabbit section-rabbit-about-main" aria-hidden="true" />
      <span className="section-rabbit section-rabbit-about-small" aria-hidden="true" />
      <Image className="section-star-glow section-star-glow-about" src="/images/decor/pink-star-glow.png" alt="" width={1402} height={1122} aria-hidden="true" />
      <div className="landing-about-copy" data-reveal>
          <header className="landing-idea-feature" data-reveal>
            <div className="landing-title-mark">
              <span className="landing-title-overline"><span className="landing-title-script">Our Belief</span></span>
              <h2 id="idea-letter-title" className="landing-editorial-cn">我們的初衷</h2>
            </div>
          </header>
          <div className="operation-intro landing-idea-intro" data-reveal>
            <p>我們做這個平台，是因為每次換屆，總有人得重新問起：去年的活動怎麼辦、資料放在哪裡、哪些方法真的有用。明明有人認真走過一段路，下一屆卻常常又從頭摸索。</p>
            <p>所以我們把活動、工作項目、負責人和期限整理在一起，也把執行時的做法與結果留下來。希望忙碌的你，能先找到前人留下的線索，再安心長出自己的做法。</p>
            <p>這裡不替任何一屆寫好答案。我們只是想讓交接多一點溫柔，讓每份努力都能被接住，也讓下一個故事有人願意繼續寫。</p>
          </div>
      </div>
    </section>

    <section className="landing-operation" id="operation">
      <span className="section-rabbit section-rabbit-operation-main" aria-hidden="true" />
      <span className="section-rabbit section-rabbit-operation-small" aria-hidden="true" />
      <Image className="section-star-glow section-star-glow-operation" src="/images/decor/pink-star-glow.png" alt="" width={1402} height={1122} aria-hidden="true" />
      <header className="landing-operation-head">
        <div className="operation-heading-group" data-reveal>
          <div className="landing-title-mark">
            <span className="landing-title-overline"><span className="landing-title-script">Workflow</span></span>
            <h2 className="landing-editorial-cn">系統運作方式</h2>
          </div>
        </div>
        <p className="operation-helper" data-reveal>請點選每個信封，了解系統運作流程</p>
      </header>
      <div className="landing-operation-grid">
        {operationSteps.map((step) => <article key={step.number} className={`landing-envelope-card landing-operation-step nitro-burst ${expandedCards.has(`step-${step.number}`) ? "is-expanded" : ""} ${revealedCards.has(`step-${step.number}`) ? "is-visible" : ""}`} data-reveal data-card-id={`step-${step.number}`} role="button" tabIndex={0} aria-expanded={expandedCards.has(`step-${step.number}`)} aria-label={`${step.title}。點擊展開或收起內容`} onClick={() => toggleCard(`step-${step.number}`)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); toggleCard(`step-${step.number}`); } }}>
          <span className="step-decoration" aria-hidden="true">✧</span>
          <small className="card-micro">{step.caption} · ✧</small>
          <div className="landing-step-number">{Number(step.number)}</div>
          <span className="landing-step-stamp" aria-hidden="true">{step.number}</span>
          <h3>{step.title}</h3>
          <span className="card-envelope-flap" aria-hidden="true" /><Image className="envelope-sticker" src={step.number === "01" ? "/images/envelopes/olive-letter-trim.png" : step.number === "02" ? "/images/envelopes/pink-swan-trim.png" : step.number === "03" ? "/images/envelopes/white-gold-trimmed-trim.png" : "/images/envelopes/cream-heart-trim.png"} alt="" aria-hidden="true" width={716} height={716} />
          <div className="card-letter-copy">{step.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</div>
          <small className="card-open-hint">{expandedCards.has(`step-${step.number}`) ? "收起內容 ↑" : "查看內容 ↓"}</small>
          <span className="landing-step-arrow" aria-hidden="true">↗</span>
        </article>)}
      </div>
      <div className="curtain-invitation" data-reveal>
      <span className="curtain-light" aria-hidden="true" />
      <div className="ready-to-begin" data-reveal>
        <Image className="ready-heart-art" src="/images/footer-heart-papers.webp" alt="" aria-hidden="true" width={1634} height={1024} />
        <div className="ready-heart-left">
          <span className="ready-heart-kicker">NCUE IM · Our Next Chapter</span>
          <h3>The Story<br />Continues</h3>
          <span className="ready-heart-caption">接著寫下去</span>
        </div>
        <div className="ready-heart-right">
          <span className="ready-heart-kicker">Let&apos;s Begin</span>
          <p>下一頁，換我們一起寫。</p>
          <LoginEntry label="開始使用" className="login-entry-journal" />
        </div>
      </div>
      </div>
    </section>

  </div>;
}
