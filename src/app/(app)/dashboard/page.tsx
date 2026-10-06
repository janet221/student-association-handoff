import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { SectionHeading } from "@/components/section-heading";

type DashboardTask = { id: string; activity_id: string; activity_name: string; phase_name: string; name: string; status: string; priority: string; effective_deadline: string | null; waiting_for: { id: string; name: string }[] };

const statusLabel: Record<string, string> = { todo: "待處理", in_progress: "進行中", blocked: "等待前置工作", completed: "已完成" };

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: term } = await supabase.from("terms").select("id, name, ordinal").eq("is_current", true).maybeSingle();
  const { data } = term ? await supabase.from("task_dashboard").select("*").eq("term_id", term.id).neq("status", "completed") : { data: [] };
  const tasks = ((data ?? []) as DashboardTask[]).sort((a, b) => {
    const blockedA = a.waiting_for.length ? 1 : 0;
    const blockedB = b.waiting_for.length ? 1 : 0;
    if (blockedA !== blockedB) return blockedA - blockedB;
    if (a.effective_deadline && b.effective_deadline) return a.effective_deadline.localeCompare(b.effective_deadline);
    return ({ urgent: 0, high: 1, medium: 2, low: 3 }[a.priority] ?? 4) - ({ urgent: 0, high: 1, medium: 2, low: 3 }[b.priority] ?? 4);
  });
  const ready = tasks.filter((task) => !task.waiting_for.length);
  const waiting = tasks.filter((task) => task.waiting_for.length);

  return (
    <main className="page-wrap">
      <section className="dashboard-hero">
        <SectionHeading number="01" label="OVERVIEW" title="現在該做什麼？" description="本屆尚未完成的工作，依可執行性與期限排列。" />
        <div className="hero-summary">
          <span className="term-mark">{term ? `${term.ordinal}th` : "—"}<small>{term?.name ?? "尚未建立本屆資料"}</small></span>
          <div className="summary-stat"><b>{ready.length}</b><span>現在可執行</span></div>
          <div className="summary-stat"><b>{waiting.length}</b><span>仍在等待</span></div>
          <div className="summary-stat"><b>{tasks.length}</b><span>未完成工作</span></div>
        </div>
      </section>

      {!term ? <EmptyState /> : (
        <section className="task-board">
          <div className="task-column">
            <div className="column-title"><span className="dot active" /> NOW / 現在可以做 <b>{ready.length}</b></div>
            {ready.slice(0, 8).map((task, index) => <TaskRow key={task.id} task={task} index={index} />)}
          </div>
          <div className="task-column muted">
            <div className="column-title"><span className="dot waiting" /> WAITING / 正在等待 <b>{waiting.length}</b></div>
            {waiting.slice(0, 8).map((task, index) => <TaskRow key={task.id} task={task} index={index} />)}
          </div>
        </section>
      )}
      <section className="history-strip">
        <div><span>02</span><small>REFERENCE</small><h2>歷屆經驗<br />就在工作旁邊</h2></div>
        <p>不必先翻完整份企劃書。執行每一項工作時，直接查看上一屆留下的器材、文件與注意事項。</p>
        <Link href="/history" className="circle-link">→</Link>
      </section>
    </main>
  );
}

function TaskRow({ task, index }: { task: DashboardTask; index: number }) {
  return (
    <Link href={`/activities/${task.activity_id}`} className="task-row">
      <span className="task-index">{String(index + 1).padStart(2, "0")}</span>
      <div><small>{task.activity_name} · {task.phase_name}</small><h3>{task.name}</h3><p>{task.waiting_for.length ? `等待：${task.waiting_for.map((item) => item.name).join("、")}` : task.effective_deadline ? `Deadline ${task.effective_deadline}` : "可以開始執行"}</p></div>
      <span className={`status-pill ${task.waiting_for.length ? "blocked" : task.priority}`}>{task.waiting_for.length ? statusLabel.blocked : statusLabel[task.status]}</span>
      <b>→</b>
    </Link>
  );
}

function EmptyState() {
  return <section className="empty-state"><b>尚未有本屆工作</b><p>完成 Seed Data 後，這裡會直接告訴你現在最該做什麼。</p><Link href="/history">查看歷屆紀錄 →</Link></section>;
}
