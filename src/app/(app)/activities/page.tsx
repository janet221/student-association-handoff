import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { SectionHeading } from "@/components/section-heading";

type Activity = { id: string; name: string; description: string | null; status: string; activity_date: string | null; terms: { name: string; ordinal: number } | null; phases: { tasks: { status: string }[] }[] };

export default async function ActivitiesPage() {
  const supabase = await createClient();
  const { data } = await supabase.from("activities").select("id, name, description, status, activity_date, terms(name, ordinal), phases(tasks(status))").neq("status", "archived").order("created_at");
  const activities = (data ?? []) as unknown as Activity[];

  return (
    <main className="page-wrap">
      <section className="page-intro"><SectionHeading number="02" label="CURRENT WORK" title="本屆工作" description="從活動全貌進入每個 Phase，接續上一屆留下的工作節奏。" /><Link href="/history" className="button primary">從歷屆建立 <span>→</span></Link></section>
      <section className="activity-grid">
        {activities.map((activity, index) => {
          const tasks = activity.phases.flatMap((phase) => phase.tasks);
          const done = tasks.filter((task) => task.status === "completed").length;
          const percent = tasks.length ? Math.round(done / tasks.length * 100) : 0;
          return (
            <Link href={`/activities/${activity.id}`} className={`activity-card ${index === 0 ? "featured" : ""}`} key={activity.id}>
              <div className="card-no">{String(index + 1).padStart(2, "0")}</div>
              <div className="card-art"><span>{activity.terms?.ordinal ?? "—"}th</span></div>
              <small>{activity.terms?.name ?? "本屆"} / {activity.status.toUpperCase()}</small>
              <h2>{activity.name}</h2>
              <p>{activity.description ?? "從歷屆經驗開始，逐步完成本屆工作。"}</p>
              <div className="progress-line"><i style={{ width: `${percent}%` }} /></div>
              <div className="card-meta"><span>{done} / {tasks.length} 已完成</span><span>{activity.activity_date ?? "日期待確認"}</span><b>→</b></div>
            </Link>
          );
        })}
        {!activities.length && <div className="empty-state"><b>尚未建立活動</b><p>請先由歷屆紀錄建立本屆工作，或在下一階段載入展示資料。</p></div>}
      </section>
    </main>
  );
}
