import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { resolvedDepartment } from "@/lib/activity-departments";
import { createDemoActivity, createDemoAnnouncements } from "@/lib/demo-content";

type Activity = { id: string; name: string; department: string | null; description: string | null; status: string; activity_date: string | null; phases: { tasks: { status: string }[] }[]; is_demo?: boolean };
function statusLabel(value: string) { return ({ planning: "籌備中", active: "進行中", completed: "已完成" } as Record<string, string>)[value] ?? value; }

export default async function DashboardPage() {
  const supabase = await createClient();
  const [{ data: activities }, { data: announcements }] = await Promise.all([
    supabase.from("activities").select("id, name, department, description, status, activity_date, phases(tasks(status))").neq("status", "archived").order("activity_date", { ascending: true }),
    supabase.from("announcements").select("id, title, summary, content, department, author_department, target_department, announcement_type, is_pinned, published_on, created_at").order("published_on", { ascending: false, nullsFirst: false }).order("created_at", { ascending: false }).limit(3),
  ]);
  const realActivities = (activities ?? []) as Activity[];
  const list = realActivities.length ? realActivities : [createDemoActivity()];
  const today = new Date(); today.setHours(0,0,0,0);
  const dated = list.filter((a) => a.activity_date).sort((a,b) => String(a.activity_date).localeCompare(String(b.activity_date)));
  const undated = list.filter((a) => !a.activity_date);
  const upcoming = dated.filter((a) => new Date(`${a.activity_date}T00:00:00`) >= today);
  const soon = upcoming.filter((a) => (new Date(`${a.activity_date}T00:00:00`).getTime()-today.getTime()) <= 7*86400000);
  const realAnnouncements = (announcements ?? []) as { id: string; title: string; summary: string | null; content: string; department: string | null; author_department: string | null; announcement_type: string; is_pinned: boolean; published_on: string | null; created_at: string; target_department: string | null; is_demo?: boolean }[];
  const announcementsList = realAnnouncements.length ? realAnnouncements : createDemoAnnouncements().slice(0, 3);
  return <main className="page-wrap overview-page">
    <section className="page-title-center"><h1>Events</h1></section>
    <div className="overview-main-grid">
      <section className="overview-activities-panel">
        <div className="overview-panel-heading"><span>活動安排</span><h2>近期活動與全部活動</h2></div>
        {soon.length > 0 && <section className="overview-reminders"><h3>近期提醒</h3><p>{soon.length === 1 ? "接下來 7 天有 1 項活動" : `接下來 ${soon.length} 項活動將在 7 天內開始`}</p>{soon.slice(0,3).map((a) => <Link href={`/activities/${a.id}`} key={a.id}><b>{a.activity_date?.replaceAll("-","/")}</b><span>{a.name} · {resolvedDepartment(a.department,a.name)}</span></Link>)}</section>}
    {list.length > 0 && <section className="activity-overview-list">{dated.map((activity) => <Link className="activity-overview-row" href={activity.is_demo ? "/calendar" : "/activities/" + activity.id} key={activity.id}><div><small>{activity.is_demo ? "示範活動 · " : ""}{activity.activity_date?.replaceAll("-","/")} · {resolvedDepartment(activity.department, activity.name)}</small><h2>{activity.name}</h2><p>{activity.description || ""}</p></div><div className="activity-overview-meta"><span className={"status-pill " + activity.status}>{activity.is_demo ? "示範" : statusLabel(activity.status)}</span></div><span>→</span></Link>)}{undated.map((activity) => <Link className="activity-overview-row undated" href={"/activities/" + activity.id} key={activity.id}><div><small>尚未安排日期 · {resolvedDepartment(activity.department, activity.name)}</small><h2>{activity.name}</h2><p>{activity.description || ""}</p></div><span>→</span></Link>)}</section>}
      </section>
      <section className="overview-section overview-announcements"><div className="overview-panel-heading"><span>公告</span><h2>最新公告</h2></div>{announcementsList.map((item) => <Link className="overview-announcement" href="/announcements" key={item.id}>{item.is_demo && <small className="demo-content-mark">畫面示範</small>}{item.target_department && <small className="announcement-tags">{item.target_department.split(",").map((tag) => `#${tag}`).join(" ")}</small>}<b>{item.title}</b><small>{item.author_department || item.department || "全會"} · {item.published_on || item.created_at.slice(0,10)}</small><p>{item.summary || item.content}</p></Link>)}{!announcementsList.length && <p className="empty-inline">目前還沒有公告</p>}<Link href="/announcements" className="text-link">查看全部公告 →</Link></section>
    </div>
  </main>;
}
