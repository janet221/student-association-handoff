import { createClient } from "@/lib/supabase/server";
import { SectionHeading } from "@/components/section-heading";

export default async function CalendarPage() {
  const supabase = await createClient();
  const { data } = await supabase.from("activities").select("id, name, activity_date, activity_schedule_items(name, starts_at, ends_at, venue)").neq("status", "archived").order("activity_date", { ascending: true });
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = Array.from({ length: Math.ceil((firstDay + daysInMonth) / 7) * 7 }, (_, index) => index - firstDay + 1);
  const events = new Map<string, string[]>();
  for (const activity of data ?? []) {
    if (activity.activity_date) addEvent(events, activity.activity_date, activity.name);
    for (const item of activity.activity_schedule_items ?? []) {
      if (item.starts_at) addEvent(events, item.starts_at.slice(0, 10), `${activity.name}｜${item.name}`);
    }
  }
  return <main className="page-wrap calendar-page"><section className="page-intro"><SectionHeading label="CALENDAR · 共用日期" title="共同月曆" description="活動與已經存在的工作日期會集中放在這裡，避免重複輸入。" /></section><section className="virtual-calendar"><header><button aria-label="上一個月" disabled>←</button><h2>{year} 年 {month + 1} 月</h2><button aria-label="下一個月" disabled>→</button></header><div className="calendar-weekdays">{["日", "一", "二", "三", "四", "五", "六"].map((day) => <span key={day}>{day}</span>)}</div><div className="calendar-grid">{cells.map((day, index) => { const key = day > 0 && day <= daysInMonth ? `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}` : ""; return <div className={`calendar-cell${day < 1 || day > daysInMonth ? " is-outside" : ""}`} key={`${key}-${index}`}><time>{day > 0 && day <= daysInMonth ? day : ""}</time>{(events.get(key) ?? []).map((event) => <span className="calendar-event" key={event}>{event}</span>)}</div>; })}</div></section>{!events.size && <p className="empty-inline calendar-empty">這個月目前沒有已排定的活動或日程。</p>}</main>;
}

function addEvent(events: Map<string, string[]>, date: string, label: string) {
  events.set(date, [...(events.get(date) ?? []), label]);
}
