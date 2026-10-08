import { createClient } from "@/lib/supabase/server";
import { SectionHeading } from "@/components/section-heading";
import { siteCopy } from "@/lib/site-copy";
import { activityDepartment } from "@/lib/activity-departments";
import { archiveFolderLinks } from "@/lib/archive-folders";

type HistoricalActivity = { id: string; name: string; description: string | null; activity_date: string | null; terms: { name: string; ordinal: number } | null; phases: { id: string }[]; equipment: { id: string }[]; experiences: { id: string }[] };

export default async function HistoryPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const supabase = await createClient();
  const [{ data }, { data: { user } }] = await Promise.all([
    supabase.from("activities").select("id, name, description, activity_date, terms(name, ordinal), phases(id), equipment(id), experiences(id)").eq("status", "archived").order("activity_date", { ascending: false }),
    supabase.auth.getUser(),
  ]);
  const { data: profile } = user ? await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle() : { data: null };
  const canEdit = profile?.role === "admin";
  const history = (data ?? []) as unknown as HistoricalActivity[];
  const { error } = await searchParams;
  const departments = Array.from(new Set(history.map((activity) => activityDepartment(activity.name))));

  return (
    <main className="page-wrap handover-page">
      <section className="page-intro"><SectionHeading label="HANDOVER · 給學長姐整理" title="交接紀錄" description="這裡放上一屆留下的文件、做法與提醒；本屆成員請回到本屆工作。" /></section>
      {error && <div className="notice error">{error}</div>}
      <section className="department-directory archive-list">
        {departments.map((department) => <details className="department-menu" key={department}>
          <summary><span>DEPARTMENT</span><b>{department}</b><small>{history.filter((activity) => activityDepartment(activity.name) === department).map((activity) => activity.name).join("、")}</small><i>＋</i></summary>
          <div>
        {history.filter((activity) => activityDepartment(activity.name) === department).map((activity, index) => (
          <article className="archive-row" key={activity.id}>
            <div className="archive-term"><b>{activity.terms?.ordinal ?? "—"}th</b><span>{activity.terms?.name}</span></div>
            <div><small>{String(index + 1).padStart(2, "0")} / HANDOVER RECORD</small><h2>{activity.name}</h2>{archiveFolderLinks[activity.name] ? <Link className="archive-note-link" href={`/activities/${activity.id}`}>{canEdit ? "編輯交接內容 →" : "查看交接內容 →"}</Link> : <p>{siteCopy(activity.description)}</p>}</div>
            <div className="archive-actions">
              {archiveFolderLinks[activity.name] && <a className="archive-folder-link" href={archiveFolderLinks[activity.name]} target="_blank" rel="noreferrer">查看雲端文件 →</a>}
            </div>
          </article>
        ))}
          </div>
        </details>)}
        {!history.length && <div className="empty-state"><b>尚未有封存活動</b><p>完成歷屆資料匯入後，上一屆系運會出現在這裡。</p></div>}
      </section>
    </main>
  );
}
import Link from "next/link";
