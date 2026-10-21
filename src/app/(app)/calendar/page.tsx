import { createClient } from "@/lib/supabase/server";
import { SectionHeading } from "@/components/section-heading";

export default async function CalendarPage() {
  const supabase = await createClient();
  const { data } = await supabase.from("activities").select("id, name, activity_date, activity_schedule_items(name, starts_at, ends_at, venue)").neq("status", "archived").order("activity_date", { ascending: true });
  return <main className="page-wrap calendar-page"><section className="page-intro"><SectionHeading label="CALENDAR · 共用日期" title="共同月曆" description="活動與已經存在的工作日期會集中放在這裡，避免重複輸入。" /></section><section className="calendar-list">{(data ?? []).map((activity) => <article className="calendar-item" key={activity.id}><time>{activity.activity_date ?? "待確認"}</time><div><h2>{activity.name}</h2>{activity.activity_schedule_items?.map((item) => <p key={item.name}>{item.starts_at ? new Date(item.starts_at).toLocaleDateString("zh-TW") : "日期待確認"} · {item.name}{item.venue ? ` · ${item.venue}` : ""}</p>)}</div></article>)}{!data?.length && <p className="empty-inline">目前沒有可顯示的日期。</p>}</section></main>;
}
