import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { SectionHeading } from "@/components/section-heading";
import { siteCopy } from "@/lib/site-copy";

type Activity = {
  id: string; name: string; description: string | null; status: string; activity_date: string | null;
  phases: { tasks: { status: string }[] }[];
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: term } = await supabase.from("terms").select("id, name, ordinal").eq("is_current", true).maybeSingle();
  const { data } = term
    ? await supabase.from("activities").select("id, name, description, status, activity_date, phases(tasks(status))").eq("term_id", term.id).neq("status", "archived").order("created_at")
    : { data: [] };
  const activities = (data ?? []) as Activity[];

  return (
    <main className="page-wrap home-hub">
      <section className="welcome-hero">
        <SectionHeading number="01" label="START HERE" title="先選擇你今天要做的事" description="這裡是進入跨屆交接系統的起點。先選擇角色，再選擇要處理的活動。" />
        <div className="welcome-copy">
          <span>{term ? `${term.ordinal}th ${term.name}` : "CURRENT TERM"}</span>
          <h2>保存上一屆的做法<br />接著完成這一屆的工作</h2>
          <p>想執行本屆工作，請從「系學會成員區」進入；想整理歷屆文件與交接經驗，請從「學長姐資料上傳區」開始。</p>
        </div>
      </section>

      <section className="role-entry-grid" aria-label="角色入口">
        <Link href="/activities" className="role-entry current-member">
          <span>01 / CURRENT MEMBERS</span><h2>系學會成員區</h2>
          <p>選擇本屆活動，查看現在可以做、正在等待與即將到期的工作。</p><b>進入本屆工作 →</b>
        </Link>
        <Link href="/history" className="role-entry alumni-entry">
          <span>02 / ALUMNI HANDOVER</span><h2>學長姐資料上傳區</h2>
          <p>檢視歷屆活動、文件索引與交接經驗。現階段先提供歷屆資料整理與審視。</p><b>進入歷屆資料 →</b>
        </Link>
      </section>

      <section className="home-activities">
        <div className="home-section-head"><div><span>02 / CURRENT WORK</span><h2>這一屆正在準備的活動</h2><p>點進活動後，才會看到該活動的工作儀表板與完整執行內容。</p></div><Link href="/activities">查看全部本屆工作 →</Link></div>
        <div className="home-activity-grid">
          {activities.map((activity, index) => {
            const tasks = activity.phases.flatMap((phase) => phase.tasks);
            const done = tasks.filter((task) => task.status === "completed").length;
            return <Link href={`/activities/${activity.id}`} className="home-activity-card" key={activity.id}>
              <span>{String(index + 1).padStart(2, "0")}</span><small>{activity.status.toUpperCase()}</small><h3>{activity.name}</h3>
              <p>{siteCopy(activity.description) || "尚未填寫活動說明"}</p>
              <footer><em>{done} / {tasks.length} 已完成</em><em>{activity.activity_date ?? "日期待確認"}</em><b>→</b></footer>
            </Link>;
          })}
          {!activities.length && <div className="empty-state"><b>尚未建立本屆活動</b><p>請先進入歷屆資料，從上一屆活動建立本屆版本。</p></div>}
        </div>
      </section>
    </main>
  );
}
