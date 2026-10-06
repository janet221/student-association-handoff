import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SectionHeading } from "@/components/section-heading";
import { updateTaskStatus } from "../actions";

type Task = { id: string; name: string; description: string | null; status: string; priority: string; deadline_type: string | null; fixed_deadline: string | null; relative_days: number | null; assignments: { members: { name: string } | null }[]; experiences: { id: string; kind: string; content: string }[]; task_dependencies: { depends_on: { id: string; name: string; status: string } | null }[] };
type Phase = { id: string; name: string; description: string | null; tasks: Task[] };
type Activity = { id: string; name: string; description: string | null; status: string; activity_date: string | null; terms: { name: string; ordinal: number } | null; phases: Phase[]; equipment: { id: string; name: string; quantity: number; is_confirmed: boolean; note: string | null }[]; document_links: { id: string; name: string; url: string; document_type: string }[]; experiences: { id: string; kind: string; content: string }[] };

const statusLabel: Record<string, string> = { todo: "待處理", in_progress: "進行中", blocked: "等待前置工作", completed: "已完成" };

export default async function ActivityDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase.from("activities").select(`
    id, name, description, status, activity_date, terms(name, ordinal),
    phases(id, name, description, position, tasks(
      id, name, description, status, priority, deadline_type, fixed_deadline, relative_days, position,
      assignments(members(name)), experiences(id, kind, content),
      task_dependencies!task_dependencies_task_id_fkey(
        depends_on:tasks!task_dependencies_depends_on_task_id_fkey(id, name, status)
      )
    )), equipment(id, name, quantity, is_confirmed, note),
    document_links(id, name, url, document_type), experiences(id, kind, content)
  `).eq("id", id).order("position", { referencedTable: "phases", ascending: true }).single();
  if (!data) notFound();
  const activity = data as unknown as Activity;
  const tasks = activity.phases.flatMap((phase) => phase.tasks);
  const done = tasks.filter((task) => task.status === "completed").length;
  const percent = tasks.length ? Math.round(done / tasks.length * 100) : 0;

  return (
    <main className="page-wrap activity-detail">
      <section className="detail-hero">
        <SectionHeading number="04" label={activity.status === "archived" ? "ARCHIVE DETAIL" : "ACTIVE PROJECT"} title={`${activity.terms?.ordinal ?? "—"}th ${activity.name}`} description={activity.description ?? "接續歷屆經驗，完成本屆工作。"} />
        <div className="detail-score"><b>{percent}%</b><span>完成進度</span><i><em style={{ width: `${percent}%` }} /></i></div>
        <dl><div><dt>活動日期</dt><dd>{activity.activity_date ?? "待確認"}</dd></div><div><dt>工作項目</dt><dd>{tasks.length}</dd></div><div><dt>狀態</dt><dd>{activity.status === "archived" ? "已封存" : "本屆執行中"}</dd></div></dl>
      </section>

      <section className="phase-stack">
        {activity.phases.map((phase, phaseIndex) => (
          <article className="phase-block" key={phase.id}>
            <header><span>{String(phaseIndex + 1).padStart(2, "0")}</span><div><small>PHASE</small><h2>{phase.name}</h2><p>{phase.description}</p></div></header>
            <div className="phase-tasks">
              {phase.tasks.map((task) => {
                const waiting = task.task_dependencies.map((item) => item.depends_on).filter((item) => item && item.status !== "completed");
                return (
                  <div className={`detail-task ${task.status === "completed" ? "done" : ""}`} key={task.id}>
                    <span className="task-state">{task.status === "completed" ? "✓" : waiting.length ? "○" : "●"}</span>
                    <div className="task-main"><small>{task.priority.toUpperCase()} · {statusLabel[task.status]}</small><h3>{task.name}</h3><p>{task.description}</p>
                      {waiting.length > 0 && <div className="dependency-note">等待：{waiting.map((item) => item?.name).join("、")}</div>}
                      {task.experiences.map((note) => <div className="experience-note" key={note.id}>歷屆經驗｜{note.content}</div>)}
                    </div>
                    <div className="task-side"><span>{formatDeadline(task, activity.activity_date)}</span><small>{task.assignments.map((item) => item.members?.name).filter(Boolean).join("、") || "未指派"}</small>
                      {activity.status !== "archived" && <form action={updateTaskStatus}><input type="hidden" name="taskId" value={task.id} /><input type="hidden" name="activityId" value={activity.id} /><select name="status" defaultValue={task.status}>{Object.entries(statusLabel).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select><button>更新</button></form>}
                    </div>
                  </div>
                );
              })}
            </div>
          </article>
        ))}
      </section>

      <section className="context-grid">
        <div><div className="section-number">A <span /> EQUIPMENT</div><h2>器材</h2>{activity.equipment.map((item) => <p key={item.id}><b>{item.name}</b><span>× {item.quantity}</span><small>{item.is_confirmed ? "已確認" : "待確認"}</small></p>)}</div>
        <div><div className="section-number">B <span /> DOCUMENTS</div><h2>文件</h2>{activity.document_links.map((item) => <a key={item.id} href={item.url} target="_blank" rel="noreferrer"><span>{item.document_type}</span>{item.name}<b>↗</b></a>)}</div>
        <div><div className="section-number">C <span /> EXPERIENCE</div><h2>活動經驗</h2>{activity.experiences.map((item) => <blockquote key={item.id}>{item.kind === "warning" ? "⚠" : "✦"} {item.content}</blockquote>)}</div>
      </section>
    </main>
  );
}

function formatDeadline(task: Task, activityDate: string | null) {
  if (task.deadline_type === "fixed_date") return task.fixed_deadline ?? "日期待確認";
  if (task.deadline_type === "relative_to_activity") {
    if (!activityDate) return "活動日期確認後計算";
    const date = new Date(`${activityDate}T00:00:00`);
    date.setDate(date.getDate() + (task.relative_days ?? 0));
    return date.toLocaleDateString("zh-TW");
  }
  return "未設定期限";
}
