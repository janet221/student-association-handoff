import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { SectionHeading } from "@/components/section-heading";
import { inheritActivity } from "../activities/actions";
import { siteCopy } from "@/lib/site-copy";
import { activityDepartment } from "@/lib/activity-departments";

type HistoricalActivity = { id: string; name: string; description: string | null; activity_date: string | null; terms: { name: string; ordinal: number } | null; phases: { id: string }[]; equipment: { id: string }[]; experiences: { id: string }[] };

export default async function HistoryPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const supabase = await createClient();
  const [{ data }, { data: currentTerm }] = await Promise.all([
    supabase.from("activities").select("id, name, description, activity_date, terms(name, ordinal), phases(id), equipment(id), experiences(id)").eq("status", "archived").order("activity_date", { ascending: false }),
    supabase.from("terms").select("id, name, ordinal").eq("is_current", true).maybeSingle(),
  ]);
  const history = (data ?? []) as unknown as HistoricalActivity[];
  const { error } = await searchParams;
  const departments = Array.from(new Set(history.map((activity) => activityDepartment(activity.name))));

  return (
    <main className="page-wrap">
      <section className="page-intro"><SectionHeading number="03" label="ARCHIVE" title="歷屆紀錄" description="從歷屆檔案紀錄建立本屆活動檔案" /></section>
      {error && <div className="notice error">{error}</div>}
      <section className="department-directory archive-list">
        {departments.map((department) => <details className="department-menu" key={department}>
          <summary><span>DEPARTMENT</span><b>{department}</b><small>{history.filter((activity) => activityDepartment(activity.name) === department).map((activity) => activity.name).join("、")}</small><i>＋</i></summary>
          <div>
        {history.filter((activity) => activityDepartment(activity.name) === department).map((activity, index) => (
          <article className="archive-row" key={activity.id}>
            <div className="archive-term"><b>{activity.terms?.ordinal ?? "—"}th</b><span>{activity.terms?.name}</span></div>
            <div><small>{String(index + 1).padStart(2, "0")} / ARCHIVED ACTIVITY</small><h2>{activity.name}</h2><p>{siteCopy(activity.description)}</p></div>
            <div className="archive-counts"><span><b>{activity.phases.length}</b>階段</span><span><b>{activity.equipment.length}</b>器材</span><span><b>{activity.experiences.length}</b>經驗</span></div>
            <div className="archive-actions">
              <Link href={`/activities/${activity.id}`} className="button ghost">查看內容</Link>
              {currentTerm && <form action={inheritActivity}>
                <input type="hidden" name="sourceActivity" value={activity.id} />
                <input type="hidden" name="targetTerm" value={currentTerm.id} />
                <small>填寫今年的日期、場地、負責人與執行狀態</small>
                <button className="button primary">以此建立本屆{activity.name} →</button>
              </form>}
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
