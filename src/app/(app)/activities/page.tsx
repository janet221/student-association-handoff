import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { SectionHeading } from "@/components/section-heading";
import { activityDepartment } from "@/lib/activity-departments";

type Activity = { id: string; name: string; description: string | null; status: string; activity_date: string | null; terms: { name: string; ordinal: number } | null; phases: { tasks: { status: string }[] }[] };

export default async function ActivitiesPage() {
  const supabase = await createClient();
  const { data } = await supabase.from("activities").select("id, name, description, status, activity_date, terms(name, ordinal), phases(tasks(status))").neq("status", "archived").order("created_at");
  const activities = (data ?? []) as unknown as Activity[];
  const departments = Array.from(new Set(activities.map((activity) => activityDepartment(activity.name))));

  return (
    <main className="page-wrap">
      <section className="page-intro"><SectionHeading label="CURRENT WORK" title="本屆工作專區" /><Link href="/history" className="button primary">查看交接資料 <span>→</span></Link></section>
      <section className="department-directory">
        {departments.map((department) => <details className="department-menu" key={department}>
          <summary><span>DEPARTMENT</span><b>{department}</b><small>{activities.filter((activity) => activityDepartment(activity.name) === department).map((activity) => activity.name).join("、")}</small><i>＋</i></summary>
          <div className="activity-grid">
        {activities.filter((activity) => activityDepartment(activity.name) === department).map((activity, index) => {
          const tasks = activity.phases.flatMap((phase) => phase.tasks);
          return (
            <Link href={`/activities/${activity.id}`} className="activity-card" key={activity.id}>
              <div className="card-no">{String(index + 1).padStart(2, "0")}</div>
              <div className="card-art"><span>{activity.terms?.ordinal ?? "—"}th</span></div>
              <small>{activity.terms?.name ?? "本屆"} / 工作清單</small>
              <h2>{activity.name}</h2>
              <div className="card-meta"><span>{tasks.length} 項工作</span><span>{activity.activity_date ?? "日期待確認"}</span><b>→</b></div>
            </Link>
          );
        })}
          </div>
        </details>)}
        {!activities.length && <div className="empty-state"><b>尚未建立活動</b><p>請先由歷屆紀錄建立本屆工作，或在下一階段載入展示資料。</p></div>}
      </section>
    </main>
  );
}
