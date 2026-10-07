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
      <section className="login-story">
        <div className="brand-lockup"><strong>NCUE IM</strong><span>STUDENT<br />ASSOCIATION</span></div>
        <LoginEntry error={notice.error} message={notice.message} />
        <div className="edition">{handoverLabel.includes("➔") ? <><span>{handoverLabel.split(" ➔ ")[0]}</span><b className="handover-arrow" aria-label="交接至" /><span>{handoverLabel.split(" ➔ ")[1]}</span></> : <span>{handoverLabel}</span>}</div>
        <p className="eyebrow">HANDOVER &amp; ACTIVE SYSTEM</p>
        <h1>資管系學會<br />換屆工作交接系統</h1>
        <div className="login-art" aria-hidden="true"><span>延續經驗<br />接續行動</span></div>
      </section>
    </main>
  );
}
