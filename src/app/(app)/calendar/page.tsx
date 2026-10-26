import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { SectionHeading } from "@/components/section-heading";
import { createCalendarActivity, deleteCalendarActivity, updateCalendarActivity } from "@/app/(app)/activities/actions";
import { resolvedDepartment } from "@/lib/activity-departments";
import { CalendarInteractive } from "@/components/calendar-interactive";
import { createDemoActivity } from "@/lib/demo-content";

type CalendarActivity = { id: string; name: string; department: string | null; activity_date: string | null; activity_end_date: string | null; description: string | null; status: string; is_demo?: boolean };

export default async function CalendarPage({ searchParams }: { searchParams: Promise<{ month?: string; date?: string }> }) {
  const supabase = await createClient();
  const params = await searchParams;
  const [{ data }, { data: currentTerm }, { data: { user } }] = await Promise.all([
    supabase.from("activities").select("id, name, department, activity_date, activity_end_date, description, status").neq("status", "archived").order("activity_date", { ascending: true }),
    supabase.from("terms").select("id, name, ordinal").eq("is_current", true).maybeSingle(),
    supabase.auth.getUser(),
  ]);
  const { data: profile } = user ? await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle() : { data: null };
  const canEdit = profile?.role === "admin" || process.env.NODE_ENV !== "production";
  const realActivities = (data ?? []) as CalendarActivity[];
  const activities = realActivities.length ? realActivities : [createDemoActivity()];
  const now = new Date();
  const requested = params.month && /^\d{4}-\d{2}$/.test(params.month) ? new Date(`${params.month}-01T00:00:00`) : now;
  const year = requested.getFullYear(); const month = requested.getMonth();
  const firstDay = new Date(year, month, 1).getDay(); const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = Array.from({ length: Math.ceil((firstDay + daysInMonth) / 7) * 7 }, (_, index) => index - firstDay + 1);
  const events = new Map<string, CalendarActivity[]>();
  for (const activity of activities) if (activity.activity_date) {
    const end = activity.activity_end_date || activity.activity_date;
    for (let cursor = new Date(activity.activity_date + "T00:00:00"); cursor <= new Date(end + "T00:00:00"); cursor.setDate(cursor.getDate() + 1)) {
      const date = cursor.toISOString().slice(0, 10); events.set(date, [...(events.get(date) ?? []), activity]);
    }
  }
  const previous = new Date(year, month - 1, 1); const next = new Date(year, month + 1, 1);
  const monthKey = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
  const selected = params.date && /^\d{4}-\d{2}-\d{2}$/.test(params.date) ? params.date : null;
  const selectedActivities = selected ? activities.filter((activity) => activity.activity_date === selected) : [];
  const eventRecord = Object.fromEntries(events.entries());
  return <main className="page-wrap calendar-page">
    {canEdit && currentTerm && <section className="calendar-create-bar"><details className="inline-editor"><summary>＋ 新增活動日期</summary><form action={createCalendarActivity}><input type="hidden" name="termId" value={currentTerm.id} /><input name="name" placeholder="活動名稱" required /><input name="department" placeholder="主辦股別或會長" required /><input name="activityDate" type="date" required /><textarea name="description" placeholder="活動簡介或備註" /><button className="button primary" type="submit">加入共同月曆</button></form></details></section>}
    <section className="calendar-editorial-layout"><section className="virtual-calendar"><header><Link href={`/calendar?month=${monthKey(previous)}`} aria-label="上一個月">←</Link><div><small>{year}</small><h2>{new Intl.DateTimeFormat("en-US", { month: "long" }).format(new Date(year, month, 1))}</h2></div><Link href={`/calendar?month=${monthKey(next)}`} aria-label="下一個月">→</Link></header><div className="calendar-weekdays">{["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"].map((day) => <span key={day}>{day}</span>)}</div><CalendarInteractive cells={cells} year={year} month={month} requestedMonth={monthKey(requested)} events={eventRecord} termId={currentTerm?.id} canEdit={canEdit} /></section></section>
    {selected && <section className="calendar-selection"><div className="overview-section-head"><span>{selected.replaceAll("-", "/")}</span><h2>當日活動</h2></div>{selectedActivities.map((activity) => <article className="calendar-item" key={activity.id}><div><time>{activity.activity_date?.replaceAll("-", "/")}</time><small>{activity.is_demo ? "示範活動 · " : ""}{resolvedDepartment(activity.department, activity.name)} · {activity.status}</small></div><div><h2>{activity.name}</h2><p>{activity.description || "尚未填寫活動備註。"}</p>{activity.is_demo ? <small className="demo-content-mark">此活動僅供畫面展示</small> : <Link className="text-link" href={`/activities/${activity.id}`}>查看活動流程 →</Link>}{canEdit && !activity.is_demo && <details className="inline-editor calendar-edit"><summary>編輯日期與活動</summary><form action={updateCalendarActivity}><input type="hidden" name="activityId" value={activity.id} /><input name="name" defaultValue={activity.name} required /><input name="department" defaultValue={resolvedDepartment(activity.department, activity.name)} required /><input name="activityDate" type="date" defaultValue={activity.activity_date ?? ""} required /><input name="activityEndDate" type="date" defaultValue={activity.activity_end_date ?? activity.activity_date ?? ""} /><textarea name="description" defaultValue={activity.description ?? ""} /><button className="button" type="submit">儲存修改</button></form><form action={deleteCalendarActivity}><input type="hidden" name="activityId" value={activity.id} /><button className="button ghost" type="submit">移除活動日期</button></form></details>}</div></article>)}{!selectedActivities.length && <p className="empty-inline">這一天還沒有正式活動。</p>}</section>}
  </main>;
}
