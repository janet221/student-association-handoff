const operationSteps = [
  {
    number: "01",
    title: "查看歷屆",
    paragraphs: [
      "先查看過去曾經舉辦的活動，了解當時有哪些工作、怎麼分工、使用過哪些器材，以及有哪些文件可以繼續參考。",
      "例如在準備系運時，可以從歷屆紀錄查看前期招生、工作分配、宣傳、場地安排、比賽準備與活動當天的相關內容。",
    ],
  },
  {
    number: "02",
    title: "建立本屆",
    paragraphs: [
      "找到適合參考的歷屆活動後，可以沿用原有的工作架構建立今年的版本。",
      "工作階段、工作項目、Checklist、角色分工與器材需求可以作為基礎，日期、場地、負責人等內容則依照本屆實際情況重新安排。",
    ],
  },
  {
    number: "03",
    title: "依現況調整",
    paragraphs: [
      "建立本屆活動後，再逐步修改今年真正會使用的內容。",
      "如果比賽日期改變、工作人數不同，或某項器材的來源有所調整，都可以直接更新在本屆版本中。同時仍能回頭查看過去的做法，作為安排時的參考。",
    ],
  },
  {
    number: "04",
    title: "留下執行紀錄",
    paragraphs: [
      "活動完成後，本屆實際使用的工作內容會保留在系統中，成為新的歷屆紀錄。",
      "之後再次籌備同一項活動時，就可以查看這一屆最後採用的流程、分工與準備方式，繼續從已有的內容開始整理。",
    ],
  },
];

export function LandingContent() {
  return <>
    <section className="landing-about" id="about">
      <div className="landing-section-label"><span>01</span><i /> PROJECT IDEA</div>
      <div className="landing-about-copy">
        <h2>專案理念</h2>
        <div className="landing-prose">
          <p>系學會的工作具有明顯的週期性。系運、招生、系學大會或其他活動，每年可能由不同的人負責，實際需要處理的工作卻有相當一部分會再次出現。</p>
          <p>過去的企劃書、報名表、器材清單和工作紀錄通常都有留下來，但這些資料常散落在雲端硬碟、群組訊息與不同幹部手中。新一屆開始接手時，找到資料往往只是第一步，後續還需要重新理解當時的流程、分工方式，以及哪些內容仍然適合今年使用。</p>
          <p>因此，這套系統將歷屆活動的工作流程、文件、器材、分工與實際執行紀錄整理在同一個脈絡中。接手的人可以從一場完整的歷屆活動開始理解，知道過去曾經做過哪些準備、工作之間如何銜接，以及當時實際採用了哪些安排。</p>
          <p>當本屆再次舉辦相同活動時，可以參考過去使用過的工作架構，建立屬於今年的版本，再依照實際日期、場地、人員與活動需求進行修改。這樣能減少重新整理相似工作的時間，也讓本屆有更明確的起點。</p>
          <p>隨著每一屆實際使用與調整，系統中的歷屆紀錄也會逐步累積。後續接手的人可以查看不同屆別的做法，理解哪些工作長期都會出現、哪些內容曾經調整，以及上一屆最後實際怎麼執行，讓交接建立在更完整的紀錄上。</p>
        </div>
      </div>
    </section>

    <section className="landing-operation" id="operation">
      <header className="landing-operation-head">
        <div className="landing-section-label"><span>02</span><i /> WORKFLOW</div>
        <div><h2>如何運作</h2><p>同一項活動每年可能有不同的日期、場地和負責人，但整體準備流程通常有一定的延續性。</p><p>系統會先保留歷屆活動的完整內容，讓本屆查看過去的工作項目、分工方式、器材需求與相關文件。當確認今年仍然要舉辦相同活動後，就可以以既有架構建立本屆版本，再依照今年的實際情況進行調整。</p></div>
      </header>
      <div className="landing-operation-grid">
        {operationSteps.map((step) => <article key={step.number} className="landing-operation-step">
          <div className="landing-step-number">{step.number}</div>
          <h3>{step.title}</h3>
          {step.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
          <span className="landing-step-arrow" aria-hidden="true">↗</span>
        </article>)}
      </div>
    </section>
  </>;
}
