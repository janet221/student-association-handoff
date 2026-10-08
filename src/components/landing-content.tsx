"use client";

import { useEffect, useRef } from "react";

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

  return <div ref={contentRef}>
    <section className="landing-about" id="about">
      <div className="landing-section-label reveal-label" data-reveal><span>01</span><i /> PROJECT IDEA</div>
      <div className="landing-about-copy" data-reveal>
        <h2>專案理念</h2>
        <div className="landing-prose">
          <p data-reveal>系學會的工作具有明顯的週期性。系運、招生、系學大會或其他活動，每年可能由不同的人負責，實際需要處理的工作卻有相當一部分會再次出現。</p>
          <p data-reveal>過去的企劃書、報名表、器材清單和工作紀錄通常都有留下來，但這些資料常散落在雲端硬碟、群組訊息與不同幹部手中。新一屆開始接手時，找到資料往往只是第一步，後續還需要重新理解當時的流程、分工方式，以及哪些內容仍然適合今年使用。</p>
          <p data-reveal>因此，這套系統將歷屆活動的工作流程、文件、器材、分工與實際執行紀錄整理在同一個脈絡中。接手的人可以從一場完整的歷屆活動開始理解，知道過去曾經做過哪些準備、工作之間如何銜接，以及當時實際採用了哪些安排。</p>
          <p data-reveal>當本屆再次舉辦相同活動時，可以參考過去使用過的工作架構，建立屬於今年的版本，再依照實際日期、場地、人員與活動需求進行修改。這樣能減少重新整理相似工作的時間，也讓本屆有更明確的起點。</p>
          <p data-reveal>每次活動結束後，留下今年真正用過的做法和文件。下一屆接手時，可以先看上一屆的交接紀錄，再決定哪些內容沿用、哪些需要重做。</p>
        </div>
      </div>
    </section>

    <section className="landing-operation" id="operation">
      <header className="landing-operation-head">
        <div className="reveal-label" data-reveal><div className="landing-section-label"><span>02</span><i /> WORKFLOW</div></div>
        <div data-reveal><h2>如何運作</h2><p>本屆工作是今年要確認和處理的事項；交接紀錄則放上一屆留下的文件、做法和提醒。</p><p>學弟妹從本屆工作開始，學長姐在活動結束後回到同一個活動補上今年的實際做法，再整理到交接紀錄。</p></div>
      </header>
      <div className="landing-operation-grid">
        {operationSteps.map((step) => <article key={step.number} className="landing-operation-step" data-reveal>
          <div className="landing-step-number">{step.number}</div>
          <h3>{step.title}</h3>
          {step.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
          <span className="landing-step-arrow" aria-hidden="true">↗</span>
        </article>)}
      </div>
    </section>
  </div>;
}
