import { createClient } from "@/lib/supabase/server";
import { createAnnouncement, deleteAnnouncement, updateAnnouncement } from "@/app/(app)/activities/actions";
import Link from "next/link";
import { createDemoAnnouncements } from "@/lib/demo-content";

type Announcement = { id: string; title: string; summary: string | null; content: string; scope: string; department: string | null; author_department: string | null; target_department: string | null; announcement_type: string; is_pinned: boolean; published_on: string | null; created_at: string; is_demo?: boolean };
const units = ["會長", "副會長", "執秘", "總務", "體育股", "美宣股", "器材股", "活動股", "資訊股"];

export default async function AnnouncementsPage({ searchParams }: { searchParams: Promise<{ q?: string; department?: string; page?: string }> }) {
  const supabase = await createClient();
  const params = await searchParams;
  const [{ data }, { data: { user } }] = await Promise.all([
    supabase.from("announcements").select("id, title, summary, content, scope, department, author_department, target_department, announcement_type, is_pinned, published_on, created_at").order("is_pinned", { ascending: false }).order("published_on", { ascending: false }),
    supabase.auth.getUser(),
  ]);
  const { data: profile } = user ? await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle() : { data: null };
  const canEdit = profile?.role === "admin";
  const query = (params.q ?? "").trim().toLowerCase();
  const department = (params.department ?? "").trim();
  const realItems = (data ?? []) as Announcement[];
  const items: Announcement[] = realItems.length ? realItems : createDemoAnnouncements();
  const filtered = items.filter((item) => (!query || (item.title + " " + (item.summary ?? "") + " " + item.content).toLowerCase().includes(query)) && (!department || item.department === department));
  const page = Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1);
  const pageSize = 8;
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const visible = filtered.slice((page - 1) * pageSize, page * pageSize);
  const departments = Array.from(new Set(items.map((item) => item.department).filter(Boolean))) as string[];
  const form = (item?: Announcement) => <form action={item ? updateAnnouncement : createAnnouncement}>
    {item && <input type="hidden" name="announcementId" value={item.id} />}
    <select name="authorDepartment" defaultValue={item?.author_department ?? ""} required><option value="" disabled>你是哪個股別／職位？</option>{units.map((unit) => <option key={unit} value={unit}>{unit}</option>)}</select>
    <input name="title" placeholder="公告標題" defaultValue={item?.title} required />
    <input name="summary" placeholder="公告摘要（列表顯示）" defaultValue={item?.summary ?? ""} required />
    <textarea name="content" placeholder="公告內文" defaultValue={item?.content} required />
    <div className="form-row">
      <fieldset className="assistance-checks"><legend>需要哪些單位協助？</legend>{units.map((unit) => <label key={unit}><input type="checkbox" name="assistanceDepartment" value={unit} defaultChecked={item?.target_department?.split(",").includes(unit)} />{unit}</label>)}</fieldset>
      <input name="publishedOn" type="date" defaultValue={item?.published_on ?? new Date().toISOString().slice(0, 10)} />
      <label><input type="checkbox" name="isPinned" defaultChecked={item?.is_pinned} /> 置頂</label>
    </div>
    <button className="button primary" type="submit">{item ? "儲存公告" : "發布公告"}</button>
  </form>;
  return <main className="page-wrap announcements-page">
    <section className="announcement-hero"><h1>Notices</h1><span className="announcement-hero-seal" aria-hidden="true">✦</span></section>
    <div className="announcement-tool-row"><form className="announcement-filters announcement-toolbox" method="get"><input name="q" placeholder="搜尋標題或內容" defaultValue={params.q ?? ""} /><select name="department" defaultValue={department}><option value="">全部股別</option>{departments.map((item) => <option key={item} value={item}>{item}</option>)}</select><button className="button" type="submit">搜尋公告</button></form><details className="announcement-create"><summary>＋ 新增公告</summary>{form()}</details></div>
    <section className="announcement-list">{visible.map((item, index) => <details key={item.id} className={`announcement-item announcement-paper-${(index % 3) + 1}`}><summary>{item.target_department && <div className="announcement-tags">{item.target_department.split(",").map((tag) => <span key={tag}>#{tag}</span>)}</div>}<small>{item.is_demo && <span className="demo-content-mark">畫面示範</span>}{item.is_pinned ? "置頂 · " : ""}{item.author_department || (item.scope === "all" ? "全會" : item.department)} · {item.announcement_type === "collaboration" ? "協作需求" : item.announcement_type === "notice" ? "重要通知" : item.announcement_type === "coordination" ? "統籌協調" : "一般公告"} · {item.published_on || item.created_at.slice(0, 10)}</small><h2>{item.title}</h2><p>{item.summary || item.content.slice(0, 120)}</p></summary><div className="announcement-body"><p>{item.content}</p>{item.target_department && <small>需要協助：{item.target_department}</small>}{canEdit && !item.is_demo && <><details className="inline-editor"><summary>編輯</summary>{form(item)}</details><form action={deleteAnnouncement}><input type="hidden" name="announcementId" value={item.id} /><button className="button ghost" type="submit">刪除公告</button></form></>}</div></details>)}{!visible.length && <div className="announcement-empty"><span>✦</span><p>目前還沒有公告，發布第一則訊息吧。</p><small>把重要的提醒留給下一位看到。</small></div>}</section>
    <nav className="pagination" aria-label="公告分頁">{Array.from({ length: pageCount }, (_, index) => index + 1).map((number) => <Link className={number === page ? "active" : ""} href={"/announcements?q=" + encodeURIComponent(params.q ?? "") + "&department=" + encodeURIComponent(department) + "&page=" + number} key={number}>{number}</Link>)}</nav>
  </main>;
}
