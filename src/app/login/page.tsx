import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { LoginEntry } from "@/components/login-entry";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (data.user) redirect("/dashboard");
  const notice = await searchParams;
  const { data: currentTerm } = await supabase.from("terms").select("ordinal, handover_from_term_id, handover_completed").eq("is_current", true).maybeSingle();
  const { data: handoverFrom } = currentTerm?.handover_from_term_id
    ? await supabase.from("terms").select("ordinal").eq("id", currentTerm.handover_from_term_id).maybeSingle()
    : { data: null };
  const handoverLabel = currentTerm?.handover_completed && handoverFrom ? `${handoverFrom.ordinal} ➔ ${currentTerm.ordinal}` : currentTerm ? `${currentTerm.ordinal}th` : "25 ➔ 26";

  return (
    <main className="login-shell">
      <header className="landing-nav">
        <a href="#top" className="brand-lockup"><strong>NCUE IM</strong><span>STUDENT<br />ASSOCIATION</span></a>
        <nav aria-label="首頁導覽"><a href="#about">專案說明</a><LoginEntry error={notice.error} message={notice.message} /></nav>
      </header>
      <section className="login-story" id="top">
        <div className="edition">{handoverLabel.includes("➔") ? <><span>{handoverLabel.split(" ➔ ")[0]}</span><b className="handover-arrow" aria-label="交接至" /><span>{handoverLabel.split(" ➔ ")[1]}</span></> : <span>{handoverLabel}</span>}</div>
        <p className="eyebrow">HANDOVER &amp; ACTIVE SYSTEM</p>
        <h1>資管系學會<br />換屆工作交接系統</h1>
        <div className="login-art" aria-hidden="true"><span>延續經驗<br />接續行動</span></div>
      </section>
      <section className="landing-about" id="about">
        <div className="landing-about-label"><span>01</span><i /> PROJECT IDEA</div>
        <div className="landing-about-copy">
          <h2>把上一屆做過的事，<br />交給下一屆接著做。</h2>
          <p>資管系學會換屆工作交接系統，將歷屆活動的工作流程、文件、器材與執行經驗整理在同一個地方。每一屆可以先理解以前怎麼做，再建立屬於自己的工作版本。</p>
          <div className="landing-about-steps"><span><b>保存</b>整理歷屆紀錄</span><span><b>繼承</b>建立本屆架構</span><span><b>沉澱</b>留下下一屆可用的經驗</span></div>
        </div>
      </section>
    </main>
  );
}
