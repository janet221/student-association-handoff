"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";

const operationSteps = [
  {
    number: "01",
    title: "看交接紀錄",
    paragraphs: [
      "先從交接紀錄找上一屆的活動，看看當時有哪些工作、怎麼分工、用過哪些器材。",
      "系運的場地、宣傳、比賽安排和工作分配，都可以從留下的文件開始看。",
    ],
  },
  {
    number: "02",
    title: "建立本屆",
    paragraphs: [
      "找到相關活動後，就到本屆工作建立今年要處理的內容。",
      "上一屆的工作階段和文件可以拿來參考，日期、場地和負責人再依今年的情況填寫。",
    ],
  },
  {
    number: "03",
    title: "依現況調整",
    paragraphs: [
      "建立活動後，逐項確認今年真的會做哪些工作。",
      "日期改了、人手不同，或器材來源變了，就直接更新本屆工作；上一屆的資料仍會保留在交接紀錄裡。",
    ],
  },
  {
    number: "04",
    title: "留下執行紀錄",
    paragraphs: [
      "活動結束後，補上今年實際的做法、文件和想提醒下一屆的事。",
      "整理完成後封存到交接紀錄，下一屆可以直接看到這次最後怎麼做。",
    ],
  },
];

export function LandingContent() {
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = contentRef.current;
    if (!root || !("IntersectionObserver" in window)) return;
    root.classList.add("motion-ready");
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.14, rootMargin: "0px 0px -8%" });
    root.querySelectorAll<HTMLElement>("[data-reveal]").forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const canvas = document.createElement("canvas");
    canvas.className = "magic-canvas";
    canvas.setAttribute("aria-hidden", "true");
    document.body.appendChild(canvas);
    const ctx = canvas.getContext("2d");
    if (!ctx) return () => canvas.remove();
    type Particle = { x:number; y:number; vx:number; vy:number; size:number; life:number; decay:number; color:string; kind:"star"|"pearl"; rotation:number; spin:number; glow:number };
    let particles: Particle[] = [];
    let frame = 0;
    let loadBurst = 0;
    const trailColors = ["#ffb6c1", "#ffd1dc", "#fff0f5", "#ffe4e1", "#f5d58a", "#dfe4eb", "#ffffff"];
    const burstColors = ["#FF77A9", "#FFD1DC", "#E6E6FA", "#FFFFFF", "#C8B6FF", "#FFE45C"];
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    const drawParticle = (particle: Particle) => {
      ctx.save(); ctx.translate(particle.x, particle.y); ctx.rotate(particle.rotation); ctx.globalAlpha = Math.max(0, particle.life); ctx.fillStyle = particle.color;
      if (particle.glow) { ctx.shadowColor = particle.color; ctx.shadowBlur = particle.glow; }
      ctx.beginPath();
      if (particle.kind === "pearl") ctx.arc(0, 0, particle.size / 2, 0, Math.PI * 2);
      else for (let i = 0; i < 8; i += 1) { const radius = i % 2 === 0 ? particle.size : particle.size / 4; const angle = (i * Math.PI) / 4; ctx.lineTo(Math.cos(angle) * radius, Math.sin(angle) * radius); }
      ctx.closePath(); ctx.fill(); ctx.restore();
    };
    const move = (event: MouseEvent) => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      for (let i = 0; i < 2; i += 1) particles.push({ x:event.clientX + (Math.random() - .5) * 14, y:event.clientY + (Math.random() - .5) * 14, vx:(Math.random() - .5) * 1.2, vy:Math.random() * .7 + .25, size:Math.random() * 4 + 2, life:1, decay:Math.random() * .025 + .018, color:trailColors[Math.floor(Math.random() * trailColors.length)], kind:"star", rotation:0, spin:0, glow:0 });
      if (particles.length > 110) particles = particles.slice(-110);
    };
    const burst = (x:number, y:number, amount = 34) => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      for (let i = 0; i < amount; i += 1) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 6 + 4;
        particles.push({ x, y, vx:Math.cos(angle) * speed, vy:Math.sin(angle) * speed - 1.6, size:Math.random() * 9 + 7, life:1, decay:Math.random() * .018 + .016, color:burstColors[Math.floor(Math.random() * burstColors.length)], kind:Math.random() > .28 ? "star" : "pearl", rotation:Math.random() * Math.PI, spin:(Math.random() - .5) * .14, glow:11 });
      }
      if (particles.length > 220) particles = particles.slice(-220);
    };
    const targets = Array.from(document.querySelectorAll<HTMLElement>(".nitro-burst"));
    const onEnter = (event: Event) => { const rect = (event.currentTarget as HTMLElement).getBoundingClientRect(); burst(rect.left + rect.width / 2, rect.top + rect.height / 2); };
    const onClick = (event: Event) => { const pointer = event as MouseEvent; burst(pointer.clientX, pointer.clientY, 40); };
    targets.forEach((target) => { target.addEventListener("mouseenter", onEnter); target.addEventListener("click", onClick); });
    const animate = () => { ctx.clearRect(0, 0, canvas.width, canvas.height); particles = particles.filter((p) => p.life > 0); particles.forEach((p) => { p.x += p.vx; p.y += p.vy; p.vx *= .95; p.vy *= .95; p.rotation += p.spin; p.life -= p.decay; drawParticle(p); }); frame = requestAnimationFrame(animate); };
    resize(); window.addEventListener("resize", resize); window.addEventListener("mousemove", move); frame = requestAnimationFrame(animate);
    loadBurst = window.setTimeout(() => { const hero = document.querySelector<HTMLElement>(".login-art.nitro-burst"); if (hero) { const rect = hero.getBoundingClientRect(); burst(rect.left + rect.width / 2, rect.top + rect.height / 2, 22); } }, 680);
    return () => { cancelAnimationFrame(frame); window.clearTimeout(loadBurst); window.removeEventListener("resize", resize); window.removeEventListener("mousemove", move); targets.forEach((target) => { target.removeEventListener("mouseenter", onEnter); target.removeEventListener("click", onClick); }); canvas.remove(); };
  }, []);

  return <div ref={contentRef}>
    <div className="story-ribbon" aria-hidden="true"><span /></div>
    <section className="landing-about" id="about">
      <Image className="section-bow-decor section-bow-decor-about" src="/images/decor/angel-ribbon-sparkles.png" alt="" width={1536} height={1024} aria-hidden="true" />
      <Image className="section-bow-decor section-bow-decor-about-secondary" src="/images/decor/angel-ribbon-sparkles.png" alt="" width={1536} height={1024} aria-hidden="true" />
      <Image className="section-star-glow section-star-glow-about" src="/images/decor/pink-star-glow.png" alt="" width={1402} height={1122} aria-hidden="true" />
      <div className="landing-section-label reveal-label" data-reveal><span>01</span><i /> PROJECT IDEA</div>
      <div className="landing-about-copy" data-reveal>
        <header className="landing-idea-feature" data-reveal>
          <span className="idea-card-kicker">THE PURPOSE</span>
          <h2>專案理念</h2>
          <p>把每一屆做過的事留下來，讓下一屆從清楚的起點開始。</p>
          <span className="idea-card-signature">HANDOVER TO ACTIVE</span>
        </header>
        <div className="landing-idea-card-grid">
          <article className="landing-idea-card landing-idea-card-one" data-reveal>
            <span>01</span><h3>重複發生的工作，不該每次從零開始。</h3>
            <p>系學會的工作具有明顯的週期性。系運、招生、系學大會或其他活動，每年可能由不同的人負責，實際需要處理的工作卻有相當一部分會再次出現。</p>
            <p>過去的企劃書、報名表、器材清單和工作紀錄通常都有留下來，但這些資料常散落在雲端硬碟、群組訊息與不同幹部手中。</p>
          </article>
          <article className="landing-idea-card landing-idea-card-two" data-reveal>
            <span>02</span><h3>把資料整理成能理解的脈絡。</h3>
            <p>新一屆開始接手時，找到資料往往只是第一步，後續還需要重新理解當時的流程、分工方式，以及哪些內容仍然適合今年使用。</p>
            <p>這套系統將歷屆活動的工作流程、文件、器材、分工與實際執行紀錄整理在同一個脈絡中。</p>
          </article>
          <article className="landing-idea-card landing-idea-card-three" data-reveal>
            <span>03</span><h3>接手、調整，再留下新的版本。</h3>
            <p>接手的人可以從一場完整的歷屆活動開始理解，知道過去曾經做過哪些準備、工作之間如何銜接，以及當時實際採用了哪些安排。</p>
            <p>本屆可依日期、場地、人員與活動需求修改；活動結束後，再留下今年真正用過的做法和文件，讓下一屆接著往前走。</p>
          </article>
        </div>
      </div>
    </section>

    <section className="landing-operation" id="operation">
      <Image className="section-bow-decor section-bow-decor-operation" src="/images/decor/angel-ribbon-sparkles.png" alt="" width={1536} height={1024} aria-hidden="true" />
      <Image className="section-bow-decor section-bow-decor-operation-secondary" src="/images/decor/angel-ribbon-sparkles.png" alt="" width={1536} height={1024} aria-hidden="true" />
      <Image className="section-star-glow section-star-glow-operation" src="/images/decor/pink-star-glow.png" alt="" width={1402} height={1122} aria-hidden="true" />
      <header className="landing-operation-head">
        <div className="reveal-label" data-reveal><div className="landing-section-label"><span>02</span><i /> WORKFLOW</div></div>
        <div data-reveal><h2>如何運作</h2><p>本屆工作是今年要確認和處理的事項；交接紀錄則放上一屆留下的文件、做法和提醒。</p><p>學弟妹從本屆工作開始，學長姐在活動結束後回到同一個活動補上今年的實際做法，再整理到交接紀錄。</p></div>
      </header>
      <div className="walking-track" aria-hidden="true"><span className="walking-track-line" /><span className="walking-track-bunny">♢</span></div>
      <div className="landing-operation-grid">
        {operationSteps.map((step) => <article key={step.number} className="landing-operation-step nitro-burst" data-reveal>
          <span className="step-decoration" aria-hidden="true">✧</span>
          <div className="landing-step-number">{step.number}</div>
          <h3>{step.title}</h3>
          {step.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
          <span className="landing-step-arrow" aria-hidden="true">↗</span>
        </article>)}
      </div>
    </section>
  </div>;
}
