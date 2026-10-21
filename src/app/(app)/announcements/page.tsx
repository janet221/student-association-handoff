import { createClient } from "@/lib/supabase/server";
import { SectionHeading } from "@/components/section-heading";

export default async function AnnouncementsPage() {
  const supabase = await createClient();
  const { data } = await supabase.from("announcements").select("id, title, content, scope, department, is_pinned, created_at").order("is_pinned", { ascending: false }).order("created_at", { ascending: false });
  return <main className="page-wrap announcements-page"><section className="page-intro"><SectionHeading label="NOTICE · 全會與股別" title="公告欄" description="把不該被群組訊息洗掉的提醒，集中留在這裡。" /></section><section className="announcement-list">{(data ?? []).map((item) => <article key={item.id}><small>{item.is_pinned ? "置頂" : item.scope === "all" ? "全會公告" : `${item.department}公告`}</small><h2>{item.title}</h2><p>{item.content}</p></article>)}{!data?.length && <p className="empty-inline">目前沒有公告。</p>}</section></main>;
}
