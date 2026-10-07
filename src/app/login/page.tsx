import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { LoginEntry } from "@/components/login-entry";
import { LandingContent } from "@/components/landing-content";

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
  const handoverLabel = handoverFrom && currentTerm ? `${handoverFrom.ordinal} ➔ ${currentTerm.ordinal}` : currentTerm ? `${currentTerm.ordinal}th` : "25 ➔ 26";

  return (
    <main className="login-shell">
      <header className="landing-nav">
        <a href="#top" className="brand-lockup"><strong>NCUE IM</strong><span>STUDENT<br />ASSOCIATION</span></a>
        <nav aria-label="首頁導覽"><a href="#about">專案理念</a><a href="#operation">如何運作</a><LoginEntry error={notice.error} message={notice.message} /></nav>
      </header>
      <section className="login-story" id="top">
        <div className="edition hero-reveal hero-edition">{handoverLabel.includes("➔") ? <><span>{handoverLabel.split(" ➔ ")[0]}</span><b className="handover-arrow" aria-label="交接至" /><span>{handoverLabel.split(" ➔ ")[1]}</span></> : <span>{handoverLabel}</span>}</div>
        <p className="eyebrow hero-reveal hero-eyebrow">HANDOVER &amp; ACTIVE SYSTEM</p>
        <h1 className="hero-title"><span>資管系學會</span><span>換屆工作交接系統</span></h1>
        <div className="login-art hero-art" aria-hidden="true"><span>延續經驗<br />接續行動</span></div>
      </section>
      <LandingContent />
      <footer className="landing-footer"><small>NCUE IM Student Association · 2026</small></footer>
    </main>
  );
}
