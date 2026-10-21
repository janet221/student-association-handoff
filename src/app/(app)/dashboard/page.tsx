import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { SectionHeading } from "@/components/section-heading";
import { activityDepartment } from "@/lib/activity-departments";

type Task = { id: string; name: string; status: string; fixed_deadline: string | null; deadline_type: string | null };
type Activity = { id: string; name: string; activity_date: string | null; phases: { tasks: Task[] }[] };
function todayKey() { return new Date().toISOString().slice(0, 10); }
function dateLabel(value: string | null) { return value ? value.replaceAll("-", "/") : "日期待確認"; }

export default async function DashboardPage() {
  const supabase = await createClient();
  const [{ data: activities }, { data: collaborations }, { data: announcements }] = await Promise.all([
    supabase.from("activities").select("id, name, activity_date, phases(tasks(id, name, status, fixed_deadline, deadline_type))").neq("status", "archived").order("activity_date", { ascending: true }),
    supabase.from("collaboration_requests").select("id, activity_id, owner_department, support_department, description, requested_date, status, activities(name)").eq("status", "待確認").order("requested_date", { ascending: true }).limit(6),
    supabase.from("announcements").select("id, title, content, is_pinned, created_at").order("is_pinned", { ascending: false }).order("created_at", { ascending: false }).limit(5),
  ]);
  const list = (activities ?? []) as unknown as Activity[];
  const allTasks = list.flatMap((activity) => activity.phases.flatMap((phase) => phase.tasks.map((task) => ({ ...task, activity }))));
  const today = todayKey();
  const dueSoon = allTasks.filter((item) => item.fixed_deadline && item.status !== "completed" && item.fixed_deadline >= today).sort((a, b) => (a.fixed_deadline ?? "").localeCompare(b.fixed_deadline ?? "")).slice(0, 6);
  const overdue = allTasks.filter((item) => item.fixed_deadline && item.status !== "completed" && item.fixed_deadline < today).slice(0, 6);
  const dateGroups = new Map<string, string[]>();
  for (const activity of list) if (activity.activity_date) dateGroups.set(activity.activity_date, [...(dateGroups.get(activity.activity_date) ?? []), activity.name]);
  const conflicts = [...dateGroups.entries()].filter(([, names]) => names.length > 1);
  return <main className="page-wrap overview-page">
    <section className="page-intro"><SectionHeading label="OVERVIEW · 全會工作入口" title="全會總覽" description="先處理需要回覆與即將到期的事情，再進入各股的工作內容。" /><div className="page-intro-actions"><Link className="button" href="/calendar">查看共同月曆 <span>→</span></Link><Link className="button primary" href="/activities">進入本屆工作 <span>→</span></Link></div></section>
    <div className="overview-grid">
      <section className="overview-section overview-priority"><div className="overview-section-head"><span>01 / ACTIONS</span><h2>現在需要處理</h2></div>{overdue.map((item) => <Link className="overview-row overview-alert" href={`/activities/${item.activity.id}#task-${item.id}`} key={item.id}><div><b>{item.name}</b><small>{item.activity.name} · 已逾期</small></div><strong>{dateLabel(item.fixed_deadline)}</strong><span>→</span></Link>)}{(collaborations ?? []).map((item) => <article className="overview-request" key={item.id}><small>{item.activities?.[0]?.name ?? "活動"} · {item.owner_department} → {item.support_department}</small><b>{item.description}</b><span>等待回覆：{dateLabel(item.requested_date)}</span></article>)}{!overdue.length && !collaborations?.length && <p className="empty-inline">目前沒有逾期工作或待回覆的協作需求。</p>}</section>
      <section className="overview-section"><div className="overview-section-head"><span>02 / DEADLINES</span><h2>接下來的期限</h2></div>{dueSoon.map((item) => <Link className="overview-row" href={`/activities/${item.activity.id}#task-${item.id}`} key={item.id}><div><b>{item.name}</b><small>{item.activity.name}</small></div><strong>{dateLabel(item.fixed_deadline)}</strong><span>→</span></Link>)}{!dueSoon.length && <p className="empty-inline">目前沒有已設定的近期期限。</p>}</section>
      <section className="overview-section"><div className="overview-section-head"><span>03 / CALENDAR</span><h2>日期衝突</h2></div>{conflicts.map(([date, names]) => <Link className="overview-row overview-alert" href={`/calendar?month=${date.slice(0, 7)}`} key={date}><div><b>{dateLabel(date)}</b><small>{names.join("、")}</small></div><strong>同日活動</strong><span>→</span></Link>)}{!conflicts.length && <p className="empty-inline">目前沒有同日活動；完整日期請查看共同月曆。</p>}<Link href="/calendar" className="text-link">查看共同月曆 →</Link></section>
      <section className="overview-section"><div className="overview-section-head"><span>04 / ACTIVITIES</span><h2>本屆活動</h2></div>{list.slice(0, 6).map((activity) => <Link className="overview-row" href={`/activities/${activity.id}`} key={activity.id}><div><b>{activity.name}</b><small>{activityDepartment(activity.name)}</small></div><strong>{dateLabel(activity.activity_date)}</strong><span>→</span></Link>)}{!list.length && <p className="empty-inline">目前還沒有本屆活動。</p>}<Link href="/activities" className="text-link">查看全部本屆工作 →</Link></section>
      <section className="overview-section"><div className="overview-section-head"><span>05 / NOTICE</span><h2>公告欄</h2></div>{(announcements ?? []).map((item) => <article className="overview-announcement" key={item.id}><small>{item.is_pinned ? "置頂" : "全會公告"}</small><b>{item.title}</b><p>{item.content}</p></article>)}{!announcements?.length && <p className="empty-inline">目前沒有公告。</p>}<Link href="/announcements" className="text-link">查看公告欄 →</Link></section>
    </div>
  </main>;
}
