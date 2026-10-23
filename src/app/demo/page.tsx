import Link from "next/link";

const activities = [
  { title: "第 21 屆四系聯合商管盃", department: "體育股", date: "2026 / 05 / 16", tasks: "18 項工作" },
  { title: "系學會迎新活動", department: "活動股", date: "2026 / 09 / 12", tasks: "11 項工作" },
  { title: "系學大會與換屆交接", department: "文書股", date: "2026 / 06 / 20", tasks: "9 項工作" },
];

export default function DemoPage() {
  return <main className="demo-shell">
    <header className="app-header demo-header">
      <Link href="/login" className="brand-lockup"><strong>NCUE IM</strong><span>STUDENT<br />ASSOCIATION</span></Link>
      <nav aria-label="展示導覽"><Link href="#activities">本屆工作</Link><Link href="#handover">交接紀錄</Link></nav>
      <Link href="/login" className="demo-exit">返回登入 ↗</Link>
    </header>
    <div className="page-wrap demo-page">
      <section className="page-intro">
        <div className="section-heading"><div className="section-number"><span /> LOCAL DEMO · 暫時展示</div><h1>本屆工作</h1><p>這是免金鑰的本機展示通道。資料為介面示意，不會寫入 Supabase。</p></div>
        <div className="page-intro-actions"><span className="demo-badge">DEMO MODE</span><Link href="/login" className="button primary">正式登入 <span>→</span></Link></div>
      </section>
      <section className="demo-summary" id="handover"><span><b>03</b> 活動</span><span><b>38</b> 待辦工作</span><span><b>25 → 26</b> 交接屆次</span></section>
      <section className="demo-activities" id="activities">
        <div className="home-section-head"><div><span>01 / CURRENT WORK</span><h2>今年要接著完成的事</h2></div><p>先從上一屆做法開始，再依今年情況調整。</p></div>
        <div className="home-activity-grid">{activities.map((activity, index) => <article className="home-activity-card" key={activity.title}><span>{String(index + 1).padStart(2, "0")}</span><small>{activity.department}</small><h3>{activity.title}</h3><p>沿用歷屆工作脈絡，整理負責人、期限和文件。</p><footer><em>{activity.date}</em><em>{activity.tasks}</em><b>↗</b></footer></article>)}</div>
      </section>
      <section className="demo-handover"><div><span>02 / HANDOVER</span><h2>把這次的做法留下來</h2><p>活動完成後，將實際使用的文件、器材與提醒整理到交接紀錄，讓下一屆直接接續。</p></div><Link href="/login" className="text-link">返回正式入口 →</Link></section>
    </div>
  </main>;
}
