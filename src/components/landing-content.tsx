"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
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

type LetterContent = { number: string; label: string; title: string; paragraphs: string[] };

const ideaLetters: Record<string, LetterContent> = {
  "idea-01": { number: "01", label: "ACTIVITY RECORD", title: "從活動找到上一屆留下的資料。", paragraphs: ["每項活動都會整理成一份交接紀錄。打開後，可以查看工作階段、工作項目、執行內容，以及相關的雲端文件。"] },
  "idea-02": { number: "02", label: "REUSE THE STRUCTURE", title: "先沿用架構，再填入今年的安排。", paragraphs: ["建立本屆活動時，可以先帶入歷屆的工作階段和器材需求。舊活動仍會留在交接紀錄中；日期、場地、人員和狀態再依今年情況設定。"] },
  "idea-03": { number: "03", label: "CURRENT WORK", title: "清楚看見分工、期限和進度。", paragraphs: ["每個工作項目都能記下負責人、優先順序、期限和檢查清單，活動日期也能和工作期限放在一起查看。"] },
  "idea-04": { number: "04", label: "EXPERIENCE NOTES", title: "把這次的做法交給下一屆。", paragraphs: ["工作完成後，記下執行情況、建議、注意事項和結果。活動封存後，下一屆可以直接參考這些紀錄。"] },
};

const letterContent: Record<string, LetterContent> = {
  ...ideaLetters,
  ...Object.fromEntries(operationSteps.map((step) => [
    "step-" + step.number,
    { number: step.number, label: step.caption, title: step.title, paragraphs: step.paragraphs },
  ])),
};

export function LandingContent() {
  const contentRef = useRef<HTMLDivElement>(null);
  const [revealedCards, setRevealedCards] = useState<Set<string>>(() => new Set());
  const [activeScrollStep, setActiveScrollStep] = useState(0);
  const [expandedCards] = useState<Set<string>>(() => new Set());
  const [activeLetterId, setActiveLetterId] = useState<string | null>(null);
  const [isClosing, setIsClosing] = useState(false);
  const closeTimer = useRef<number | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  const toggleCard = (cardId: string) => {
    if (closeTimer.current) window.clearTimeout(closeTimer.current);
    previousFocusRef.current = document.activeElement as HTMLElement | null;
    setIsClosing(false);
    setActiveLetterId(cardId);
  };

  const closeLetter = useCallback(() => {
    if (isClosing) return;
    setIsClosing(true);
    closeTimer.current = window.setTimeout(() => {
      setActiveLetterId(null);
      setIsClosing(false);
      previousFocusRef.current?.focus();
      closeTimer.current = null;
    }, 420);
  }, [isClosing]);

  useEffect(() => {
    if (!activeLetterId) return;
    const priorOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeLetter();
      if (event.key === "Tab") {
        event.preventDefault();
        closeButtonRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = priorOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [activeLetterId, closeLetter]);

  useEffect(() => () => {
    if (closeTimer.current) window.clearTimeout(closeTimer.current);
  }, []);

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



  const activeLetter = activeLetterId ? letterContent[activeLetterId] : null;

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
      <div className="landing-section-label reveal-label" data-reveal><span>01</span><i /> PROJECT IDEA</div>
      <div className="landing-about-copy" data-reveal>
        <header className="landing-idea-feature" data-reveal>
          <h2 className="landing-editorial-cn">理念說明</h2>
          <p>把活動、工作項目和期限放在同一處，也讓歷屆留下的做法在下一次需要時找得到。</p>
          <span className="idea-card-signature">HANDOVER TO ACTIVE</span>
        </header>
        <div className="landing-idea-card-grid">
          <article className={`landing-envelope-card landing-idea-card landing-idea-card-one nitro-burst ${expandedCards.has("idea-01") ? "is-expanded" : ""} ${revealedCards.has("idea-01") ? "is-visible" : ""}`} data-reveal data-card-id="idea-01" role="button" tabIndex={0} aria-expanded={expandedCards.has("idea-01")} aria-label="查看歷屆活動資料。點擊展開或收起內容" onClick={() => toggleCard("idea-01")} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); toggleCard("idea-01"); } }}>
            <span>01</span><small className="card-micro">ACTIVITY RECORD · ✧</small><h3>從活動找到上一屆留下的資料。</h3>
            <span className="card-envelope-flap" aria-hidden="true" /><Image className="envelope-sticker" src="/images/envelopes/pink-swan.png" alt="" aria-hidden="true" width={716} height={716} /><button type="button" className="envelope-tap-target" aria-label="打開信封閱讀內容" onClick={(event) => { event.stopPropagation(); toggleCard("idea-01"); }} /><button type="button" className="envelope-cover-instructions" onClick={(event) => { event.stopPropagation(); toggleCard("idea-01"); }}>Click Me</button>
            <div className="card-letter-copy"><p>每項活動都會整理成一份交接紀錄。打開後，可以查看工作階段、工作項目、執行內容，以及相關的雲端文件。</p></div><small className="card-open-hint">{expandedCards.has("idea-01") ? "收起內容 ↑" : "查看內容 ↓"}</small>
          </article>
          <article className={`landing-envelope-card landing-idea-card landing-idea-card-two nitro-burst ${expandedCards.has("idea-02") ? "is-expanded" : ""} ${revealedCards.has("idea-02") ? "is-visible" : ""}`} data-reveal data-card-id="idea-02" role="button" tabIndex={0} aria-expanded={expandedCards.has("idea-02")} aria-label="沿用歷屆工作架構。點擊展開或收起內容" onClick={() => toggleCard("idea-02")} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); toggleCard("idea-02"); } }}>
            <span>02</span><small className="card-micro">REUSE THE STRUCTURE · ✧</small><h3>先沿用架構，再填入今年的安排。</h3>
            <span className="card-envelope-flap" aria-hidden="true" /><Image className="envelope-sticker" src="/images/envelopes/cream-heart.png" alt="" aria-hidden="true" width={716} height={716} /><button type="button" className="envelope-tap-target" aria-label="打開信封閱讀內容" onClick={(event) => { event.stopPropagation(); toggleCard("idea-02"); }} /><button type="button" className="envelope-cover-instructions" onClick={(event) => { event.stopPropagation(); toggleCard("idea-02"); }}>Click Me</button>
            <div className="card-letter-copy"><p>建立本屆活動時，可以先帶入歷屆的工作階段和器材需求。舊活動仍會留在交接紀錄中；日期、場地、人員和狀態再依今年情況設定。</p></div><small className="card-open-hint">{expandedCards.has("idea-02") ? "收起內容 ↑" : "查看內容 ↓"}</small>
          </article>
          <article className={`landing-envelope-card landing-idea-card landing-idea-card-three nitro-burst ${expandedCards.has("idea-03") ? "is-expanded" : ""} ${revealedCards.has("idea-03") ? "is-visible" : ""}`} data-reveal data-card-id="idea-03" role="button" tabIndex={0} aria-expanded={expandedCards.has("idea-03")} aria-label="查看本屆工作安排。點擊展開或收起內容" onClick={() => toggleCard("idea-03")} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); toggleCard("idea-03"); } }}>
            <span>03</span><small className="card-micro">CURRENT WORK · ✧</small><h3>清楚看見分工、期限和進度。</h3>
            <span className="card-envelope-flap" aria-hidden="true" /><Image className="envelope-sticker" src="/images/envelopes/white-gold-trimmed.png" alt="" aria-hidden="true" width={716} height={716} /><button type="button" className="envelope-tap-target" aria-label="打開信封閱讀內容" onClick={(event) => { event.stopPropagation(); toggleCard("idea-03"); }} /><button type="button" className="envelope-cover-instructions" onClick={(event) => { event.stopPropagation(); toggleCard("idea-03"); }}>Click Me</button>
            <div className="card-letter-copy"><p>每個工作項目都能記下負責人、優先順序、期限和檢查清單，活動日期也能和工作期限放在一起查看。</p></div><small className="card-open-hint">{expandedCards.has("idea-03") ? "收起內容 ↑" : "查看內容 ↓"}</small>
          </article>
          <article className={`landing-envelope-card landing-idea-card landing-idea-card-four nitro-burst ${expandedCards.has("idea-04") ? "is-expanded" : ""} ${revealedCards.has("idea-04") ? "is-visible" : ""}`} data-reveal data-card-id="idea-04" role="button" tabIndex={0} aria-expanded={expandedCards.has("idea-04")} aria-label="整理工作紀錄。點擊展開或收起內容" onClick={() => toggleCard("idea-04")} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); toggleCard("idea-04"); } }}>
            <span>04</span><small className="card-micro">EXPERIENCE NOTES · ✧</small><h3>把這次的做法交給下一屆。</h3>
            <span className="card-envelope-flap" aria-hidden="true" /><Image className="envelope-sticker" src="/images/envelopes/olive-letter.png" alt="" aria-hidden="true" width={716} height={716} /><button type="button" className="envelope-tap-target" aria-label="打開信封閱讀內容" onClick={(event) => { event.stopPropagation(); toggleCard("idea-04"); }} /><button type="button" className="envelope-cover-instructions" onClick={(event) => { event.stopPropagation(); toggleCard("idea-04"); }}>Click Me</button>
            <div className="card-letter-copy"><p>工作完成後，記下執行情況、建議、注意事項和結果。活動封存後，下一屆可以直接參考這些紀錄。</p></div><small className="card-open-hint">{expandedCards.has("idea-04") ? "收起內容 ↑" : "查看內容 ↓"}</small>
          </article>
        </div>
      </div>
    </section>

    <section className="landing-operation" id="operation">
      <span className="section-rabbit section-rabbit-operation-main" aria-hidden="true" />
      <span className="section-rabbit section-rabbit-operation-small" aria-hidden="true" />
      <Image className="section-star-glow section-star-glow-operation" src="/images/decor/pink-star-glow.png" alt="" width={1402} height={1122} aria-hidden="true" />
      <header className="landing-operation-head">
        <div className="operation-heading-group" data-reveal><div className="landing-section-label"><span>02</span><i /> WORKFLOW</div><h2 className="landing-editorial-cn">如何運作</h2></div>
        <div className="operation-intro" data-reveal>
          <p>本屆工作用來管理正在進行的活動、工作階段、負責人和期限；交接紀錄則留下已完成活動的工作內容與執行筆記。</p>
          <p>建立活動時，可以參考歷屆架構，再依今年的人員、日期和進度調整。</p>
        </div>
      </header>
      <div className="walking-track" aria-hidden="true"><span className="walking-track-line" /><span className="walking-track-bunny">♢</span></div>
      <div className="landing-operation-grid">
        {operationSteps.map((step) => <article key={step.number} className={`landing-envelope-card landing-operation-step nitro-burst ${expandedCards.has(`step-${step.number}`) ? "is-expanded" : ""} ${revealedCards.has(`step-${step.number}`) ? "is-visible" : ""}`} data-reveal data-card-id={`step-${step.number}`} role="button" tabIndex={0} aria-expanded={expandedCards.has(`step-${step.number}`)} aria-label={`${step.title}。點擊展開或收起內容`} onClick={() => toggleCard(`step-${step.number}`)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); toggleCard(`step-${step.number}`); } }}>
          <span className="step-decoration" aria-hidden="true">✧</span>
          <small className="card-micro">{step.caption} · ✧</small>
          <div className="landing-step-number">{step.number}</div>
          <span className="landing-step-stamp" aria-hidden="true">{step.number}</span>
          <h3>{step.title}</h3>
          <span className="card-envelope-flap" aria-hidden="true" /><Image className="envelope-sticker" src={step.number === "01" ? "/images/envelopes/olive-letter.png" : step.number === "02" ? "/images/envelopes/pink-swan.png" : step.number === "03" ? "/images/envelopes/white-gold-trimmed.png" : "/images/envelopes/cream-heart.png"} alt="" aria-hidden="true" width={716} height={716} /><button type="button" className="envelope-tap-target" aria-label="打開信封閱讀內容" onClick={(event) => { event.stopPropagation(); toggleCard(`step-${step.number}`); }} /><button type="button" className="envelope-cover-instructions" onClick={(event) => { event.stopPropagation(); toggleCard(`step-${step.number}`); }}>Click Me</button>
          <div className="card-letter-copy">{step.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</div>
          <small className="card-open-hint">{expandedCards.has(`step-${step.number}`) ? "收起內容 ↑" : "查看內容 ↓"}</small>
          <span className="landing-step-arrow" aria-hidden="true">↗</span>
        </article>)}
      </div>
      <div className="ready-to-begin" data-reveal>
        <Image className="ready-heart-art" src="/images/footer-heart-papers.png" alt="" aria-hidden="true" width={1634} height={1024} />
        <div className="ready-heart-left">
          <span className="ready-heart-kicker">NCUE IM · OUR NEXT CHAPTER</span>
          <h3>The Story<br />Continues</h3>
          <span className="ready-heart-caption">接著寫下去</span>
        </div>
        <div className="ready-heart-right">
          <span className="ready-heart-kicker">LET'S BEGIN</span>
          <p>下一頁，換我們一起寫。</p>
          <LoginEntry label="開始使用" />
        </div>
      </div>
    </section>

    {activeLetter && createPortal(
      <div className={"letter-modal-overlay" + (isClosing ? " is-closing" : "")}>
        <div className="letter-modal-backdrop" aria-hidden="true" onClick={closeLetter} />
        <div className="letter-modal" role="dialog" aria-modal="true" aria-labelledby="letter-modal-title" aria-describedby="letter-modal-body">
          <div className="letter-envelope-shadow" aria-hidden="true" />
          <div className="letter-paper">
            <div className="letter-paper-topline"><span>NCUE IM · 25—26</span><span>HANDOVER LETTER</span></div>
            <span className="letter-paper-index">{activeLetter.number} / {activeLetter.label}</span>
            <h2 id="letter-modal-title">{activeLetter.title}</h2>
            <div id="letter-modal-body" className="letter-paper-body">
              {activeLetter.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
            </div>
            <div className="letter-paper-footer">
              <span aria-hidden="true">✦</span>
              <button ref={closeButtonRef} type="button" onClick={closeLetter} aria-label="收回信封">收回信封 <span aria-hidden="true">✕</span></button>
            </div>
          </div>
        </div>
      </div>,
      document.body
    )}
  </div>;
}
