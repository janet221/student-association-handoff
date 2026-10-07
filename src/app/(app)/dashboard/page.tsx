import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { siteCopy } from "@/lib/site-copy";
import { activityDepartment } from "@/lib/activity-departments";
import { updateHandoverStatus } from "./actions";

type Activity = {
  id: string; name: string; description: string | null; status: string; activity_date: string | null;
  phases: { tasks: { status: string }[] }[];
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: term } = await supabase.from("terms").select("id, name, ordinal, handover_from_term_id, handover_completed").eq("is_current", true).maybeSingle();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = user ? await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle() : { data: null };
  const { data: handoverFrom } = term?.handover_from_term_id
    ? await supabase.from("terms").select("ordinal").eq("id", term.handover_from_term_id).maybeSingle()
    : { data: null };
  const { data } = term
    ? await supabase.from("activities").select("id, name, description, status, activity_date, phases(tasks(status))").eq("term_id", term.id).neq("status", "archived").order("created_at")
    : { data: [] };
  const activities = (data ?? []) as Activity[];

  return (
    <main className="page-wrap home-hub">
      <section className="home-primary">
        <div className="home-primary-copy">
          <span className="home-kicker">{term?.handover_from_term_id && handoverFrom ? `${handoverFrom.ordinal} ➔ ${term.ordinal}` : term ? `${term.ordinal}th` : "CURRENT TERM"} / CURRENT TERM</span>
          <h1>本屆工作</h1>
          <p>查看目前正在準備的活動與工作內容。</p>
          <Link href="/activities" className="home-primary-cta">進入本屆工作 <span>→</span></Link>
          {term && profile?.role === "admin" && <form action={updateHandoverStatus} className="handover-toggle"><input type="hidden" name="termId" value={term.id} /><span>交接狀態：{term.handover_completed ? "已完成" : "進行中"}</span><button name="completed" value={String(!term.handover_completed)}>{term.handover_completed ? "標記為進行中" : "標記為已完成"}</button></form>}
        </div>
        <div className="home-primary-index">01<br /><small>CURRENT WORK</small></div>
      </section>

      <section className="home-activities">
        <div className="home-section-head"><div><span>02 / ACTIVITIES</span><h2>進行中的活動</h2><p>目前正在籌備的活動會顯示在這裡。</p></div><Link href="/activities">查看全部本屆工作 →</Link></div>
        <div className="home-activity-grid">
          {activities.map((activity, index) => {
            const tasks = activity.phases.flatMap((phase) => phase.tasks);
            const done = tasks.filter((task) => task.status === "completed").length;
            return <Link href={`/activities/${activity.id}`} className="home-activity-card" key={activity.id}>
              <span>{String(index + 1).padStart(2, "0")}</span><small>{activityDepartment(activity.name)} · {activity.status === "active" ? "籌備中" : activity.status}</small><h3>{activity.name}</h3>
              <p>{siteCopy(activity.description) || "尚未填寫活動說明"}</p>
              <footer><em>{done} / {tasks.length} 已完成</em><em>{activity.activity_date ?? "日期待確認"}</em><b>→</b></footer>
            </Link>;
          })}
          {!activities.length && <div className="empty-state"><b>尚未建立本屆活動</b><p>請先進入歷屆資料，從上一屆活動建立本屆版本。</p></div>}
        </div>
      </section>

      <section className="home-secondary">
        <div><span>03 / ARCHIVE</span><h2>歷屆資料</h2><p>查看以前辦過的活動、流程、文件與器材紀錄。</p></div>
        <Link href="/history">查看歷屆資料 <span>→</span></Link>
      </section>
    </main>
  );
}
