"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createCalendarActivity } from "@/app/(app)/activities/actions";

type Activity = { id: string; name: string; department: string | null; activity_date: string | null; activity_end_date: string | null; is_demo?: boolean };
const departments = ["會長", "副會長", "執秘", "總務", "體育股", "美宣股", "器材股", "活動股", "資訊股"];

export function CalendarInteractive({ cells, year, month, requestedMonth, events, termId, canEdit }: { cells: number[]; year: number; month: number; requestedMonth: string; events: Record<string, Activity[]>; termId?: string; canEdit: boolean }) {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const openFor = (date: string) => { setSelectedDate(date); setOpen(true); };
  useEffect(() => { document.body.style.overflow = open ? "hidden" : ""; return () => { document.body.style.overflow = ""; }; }, [open]);
  useEffect(() => { if (!open) return; const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") setOpen(false); }; window.addEventListener("keydown", onKey); return () => window.removeEventListener("keydown", onKey); }, [open]);
  return <>
    <div className="calendar-grid">{cells.map((day, index) => { const key = day > 0 && day <= new Date(year, month + 1, 0).getDate() ? `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}` : ""; const dayEvents = events[key] ?? []; const today = new Date().toISOString().slice(0, 10); return <div className={`calendar-cell${!key ? " is-outside" : ""}${key === today ? " is-today" : ""}`} key={`${key}-${index}`} onDoubleClick={() => canEdit && key && openFor(key)} onClick={() => key && setSelectedDate(key)}><time>{key ? <button type="button" className="calendar-day-button" onClick={() => setSelectedDate(key)}>{day}</button> : ""}</time>{dayEvents.slice(0, 3).map((event) => <Link className="calendar-event" href={`/calendar?month=${requestedMonth}&date=${key}`} key={event.id}>{event.name}<small>{event.is_demo ? "畫面示範 · " : ""}{event.department || "未指定股別"}</small></Link>)}{dayEvents.length > 3 && <span className="calendar-more">還有 {dayEvents.length - 3} 項活動</span>}{canEdit && key && <button type="button" className="calendar-add-hint" onClick={() => openFor(key)}>＋ 新增活動</button>}</div>; })}</div>
    {open && selectedDate && <div className="calendar-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.currentTarget === event.target) setOpen(false); }}><section className="calendar-modal" role="dialog" aria-modal="true" aria-labelledby="calendar-modal-title"><button type="button" className="calendar-modal-close" onClick={() => setOpen(false)} aria-label="關閉">×</button><h2 id="calendar-modal-title">新增活動</h2><p className="calendar-modal-date">{selectedDate.replaceAll("-", "/")}</p><form action={createCalendarActivity} onSubmit={() => setOpen(false)}><input type="hidden" name="termId" value={termId ?? ""} /><label>活動日期<input type="date" name="activityDate" defaultValue={selectedDate} required /></label><label>結束日期（選填）<input type="date" name="activityEndDate" defaultValue={selectedDate} /></label><label>所屬股別／主辦單位<select name="department" required defaultValue=""><option value="" disabled>請選擇股別</option>{departments.map((department) => <option key={department} value={department}>{department}</option>)}</select></label><label>活動標題<input name="name" placeholder="例如：系運籌備會議" required /></label><label>活動簡介<textarea name="description" placeholder="簡單說明活動內容或注意事項" /></label><div className="calendar-modal-actions"><button type="button" className="button ghost" onClick={() => setOpen(false)}>取消</button><button type="submit" className="button primary">儲存活動</button></div></form></section></div>}
  </>;
}

