import { createClient } from "@/lib/supabase/server";
import { SectionHeading } from "@/components/section-heading";
import Link from "next/link";

export default async function CalendarPage({ searchParams }: { searchParams: Promise<{ month?: string }> }) {
  const supabase = await createClient();
  const { data } = await supabase.from("activities").select("id, name, activity_date, activity_schedule_items(name, starts_at, ends_at, venue), phases(tasks(name, fixed_deadline, deadline_type))").neq("status", "archived").order("activity_date", { ascending: true });
  const params = await searchParams;
  const now = new Date();
  const requested = params.month && /^\d{4}-\d{2}$/.test(params.month) ? new Date(`${params.month}-01T00:00:00`) : now;
  const year = requested.getFullYear();
  const month = requested.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = Array.from({ length: Math.ceil((firstDay + daysInMonth) / 7) * 7 }, (_, index) => index - firstDay + 1);
  const events = new Map<string, string[]>();
  for (const activity of data ?? []) {
    if (activity.activity_date) addEvent(events, activity.activity_date, activity.name);
    for (const item of activity.activity_schedule_items ?? []) {
      if (item.starts_at) addEvent(events, item.starts_at.slice(0, 10), `${activity.name}｜${item.name}`);
    }
    for (const phase of activity.phases ?? []) for (const task of phase.tasks ?? []) {
      if (task.deadline_type === "fixed_date" && task.fixed_deadline) addEvent(events, task.fixed_deadline, `${activity.name}｜${task.name}`);
    }
  }
  const previous = new Date(year, month - 1, 1);
  const next = new Date(year, month + 1, 1);
  const monthKey = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
  return <main className="page-wrap calendar-page"><section className="page-intro"><SectionHeading label="CALENDAR · 共用日期" title="共同月曆" description="活動、工作期限與已排定的日程會集中在這裡，方便各股避開衝突。" /></section><section className="virtual-calendar"><header><Link href={`/calendar?month=${monthKey(previous)}`} aria-label="上一個月">←</Link><h2>{year} 年 {month + 1} 月</h2><Link href={`/calendar?month=${monthKey(next)}`} aria-label="下一個月">→</Link></header><div className="calendar-weekdays">{["日", "一", "二", "三", "四", "五", "六"].map((day) => <span key={day}>{day}</span>)}</div><div className="calendar-grid">{cells.map((day, index) => { const key = day > 0 && day <= daysInMonth ? `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}` : ""; return <div className={`calendar-cell${day < 1 || day > daysInMonth ? " is-outside" : ""}`} key={`${key}-${index}`}><time>{day > 0 && day <= daysInMonth ? day : ""}</time>{(events.get(key) ?? []).map((event, eventIndex) => <span className="calendar-event" key={`${event}-${eventIndex}`}>{event}</span>)}</div>; })}</div></section>{!events.size && <p className="empty-inline calendar-empty">這個月目前沒有已排定的活動或日程。</p>}</main>;
}

function addEvent(events: Map<string, string[]>, date: string, label: string) {
  events.set(date, [...(events.get(date) ?? []), label]);
}
