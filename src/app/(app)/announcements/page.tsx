import { createClient } from "@/lib/supabase/server";
import { SectionHeading } from "@/components/section-heading";
import { createAnnouncement } from "@/app/(app)/activities/actions";

export default async function AnnouncementsPage() {
  const supabase = await createClient();
  const { data } = await supabase.from("announcements").select("id, title, content, scope, department, is_pinned, created_at").order("is_pinned", { ascending: false }).order("created_at", { ascending: false });
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = user ? await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle() : { data: null };
  return <main className="page-wrap announcements-page"><section className="page-intro"><SectionHeading label="NOTICE · 全會與股別" title="公告欄" description="把不該被群組訊息洗掉的提醒，集中留在這裡。" />{profile?.role === "admin" && <details className="inline-editor"><summary>＋ 新增公告</summary><form action={createAnnouncement}><input name="title" placeholder="公告標題" required /><textarea name="content" placeholder="公告內容" required /><div className="form-row"><select name="scope" defaultValue="all"><option value="all">全會公告</option><option value="department">指定股別</option></select><input name="department" placeholder="股別（指定股別時填寫）" /><label><input type="checkbox" name="isPinned" /> 置頂</label></div><button className="button primary" type="submit">發布公告</button></form></details>}</section><section className="announcement-list">{(data ?? []).map((item) => <article key={item.id}><small>{item.is_pinned ? "置頂" : item.scope === "all" ? "全會公告" : `${item.department}公告`}</small><h2>{item.title}</h2><p>{item.content}</p></article>)}{!data?.length && <p className="empty-inline">目前沒有公告。</p>}</section></main>;
}
