import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: term } = await supabase.from("terms").select("id, name, ordinal, handover_from_term_id").eq("is_current", true).maybeSingle();
  const { data: handoverFrom } = term?.handover_from_term_id
    ? await supabase.from("terms").select("ordinal").eq("id", term.handover_from_term_id).maybeSingle()
    : { data: null };
  return (
    <main className="page-wrap home-hub">
      <section className="workspace-intro">
        <span className="home-kicker">{term?.handover_from_term_id && handoverFrom ? `${handoverFrom.ordinal} ➔ ${term.ordinal}` : term ? `${term.ordinal}th` : "CURRENT TERM"} / WORKSPACE</span>
        <h1>你要處理哪一類工作？</h1>
      </section>

      <section className="workspace-choices" aria-label="工作入口">
        <Link href="/activities" className="workspace-choice">
          <span>01 / CURRENT WORK</span><h2>本屆工作</h2>
          <p>查看這一屆正在準備的活動、工作項目與進度。</p><b>進入本屆工作 <i>→</i></b>
        </Link>
        <Link href="/history" className="workspace-choice">
          <span>02 / ARCHIVE CONTRIBUTION</span><h2>歷屆資料補充</h2>
          <p>補上以前活動留下的文件、流程、器材與交接內容。</p><b>補充歷屆資料 <i>→</i></b>
        </Link>
      </section>

    </main>
  );
}
