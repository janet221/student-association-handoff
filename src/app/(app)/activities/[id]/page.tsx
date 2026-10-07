import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SectionHeading } from "@/components/section-heading";
import { experienceLabel, siteCopy } from "@/lib/site-copy";
import { archiveFolderLinks } from "@/lib/archive-folders";
import {
  createChecklistItem, createTask,
  deleteTask, moveTask, setTaskAssignee, toggleChecklistItem,
  updateTask, updateTaskStatus,
  updateArchiveOverview, updateDocumentHandoverNote,
} from "../actions";

type ChecklistItem = { id: string; content: string; is_completed: boolean; position: number };
type Task = {
  id: string; source_task_id: string | null; name: string; category: string | null; description: string | null;
  status: string; priority: string; deadline_type: string | null; fixed_deadline: string | null;
  position: number;
  relative_days: number | null; deadline_anchor: string | null; anchor_schedule_item_id: string | null; anchor_task_id: string | null;
  assignments: { members: { id: string; name: string } | null }[]; experiences: Experience[];
  task_checklist_items: ChecklistItem[];
  task_dependencies: { depends_on: { id: string; name: string; status: string } | null }[];
};
type Phase = { id: string; name: string; description: string | null; tasks: Task[] };
type ScheduleItem = { id: string; source_schedule_item_id: string | null; name: string; starts_at: string | null; ends_at: string | null; venue: string | null; note: string | null; position: number };
type Equipment = { id: string; source_equipment_id: string | null; name: string; quantity: number; is_confirmed: boolean; note: string | null; source: string | null; preparation_status: string };
type Experience = { id: string; task_id: string | null; kind: string; content: string };
type Activity = {
  id: string; term_id: string; source_activity_id: string | null; name: string; description: string | null; status: string; activity_date: string | null;
  terms: { name: string; ordinal: number } | null; phases: Phase[]; activity_schedule_items: ScheduleItem[];
  equipment: Equipment[]; document_links: { id: string; name: string; url: string; document_type: string; description: string | null; handover_note: string | null }[]; experiences: Experience[];
};
type Member = { id: string; name: string };

const statusLabel: Record<string, string> = { todo: "待確認", in_progress: "待確認", blocked: "待確認", completed: "已處理", not_applicable: "本屆不採用" };

export default async function ActivityDetailPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ created?: string }> }) {
  const { id } = await params;
  const { created } = await searchParams;
  const supabase = await createClient();
  const [{ data }, { data: { user } }] = await Promise.all([
    supabase.from("activities").select(`
      id, term_id, source_activity_id, name, description, status, activity_date, terms(name, ordinal),
      activity_schedule_items(id, source_schedule_item_id, name, starts_at, ends_at, venue, note, position),
      phases(id, name, description, position, tasks(
        id, source_task_id, name, category, description, status, priority, deadline_type, fixed_deadline, relative_days,
        deadline_anchor, anchor_schedule_item_id, anchor_task_id, position,
        assignments(members(id, name)), experiences(id, task_id, kind, content),
        task_checklist_items(id, content, is_completed, position),
        task_dependencies!task_dependencies_task_id_fkey(depends_on:tasks!task_dependencies_depends_on_task_id_fkey(id, name, status))
      )), equipment(id, source_equipment_id, name, quantity, is_confirmed, note, source, preparation_status),
      document_links(id, name, url, document_type, description, handover_note), experiences(id, task_id, kind, content)
    `).eq("id", id).order("position", { referencedTable: "activity_schedule_items", ascending: true }).order("position", { referencedTable: "phases", ascending: true }).single(),
    supabase.auth.getUser(),
  ]);
  if (!data) notFound();
  const activity = data as unknown as Activity;
  const [{ data: profile }, { data: members }, { data: sourceData }] = await Promise.all([
    user ? supabase.from("profiles").select("role").eq("id", user.id).maybeSingle() : Promise.resolve({ data: null }),
    supabase.from("members").select("id, name").eq("term_id", activity.term_id).order("name"),
    activity.source_activity_id ? supabase.from("activities").select(`
      id, name, activity_date, terms(name, ordinal),
      activity_schedule_items(id, name, starts_at, ends_at, venue, note, position),
      equipment(id, name, quantity, note, source, preparation_status),
      document_links(id, name, url, document_type, description, handover_note), experiences(id, task_id, kind, content),
      phases(id, tasks(id, name, experiences(id, task_id, kind, content)))
    `).eq("id", activity.source_activity_id).single() : Promise.resolve({ data: null }),
  ]);
  const source = sourceData as unknown as Activity | null;
  const editable = profile?.role === "admin" && activity.status !== "archived";
  const tasks = activity.phases.flatMap((phase) => phase.tasks).sort((a, b) => a.position - b.position);
  const statusCounts = {
    pending: tasks.filter((task) => task.status !== "completed").length,
    handled: tasks.filter((task) => task.status === "completed").length,
    notApplicable: tasks.filter((task) => task.status === "not_applicable").length,
  };

  if (activity.status === "archived") return <ArchivedActivityView activity={activity} editable={profile?.role === "admin"} />;

  return (
    <main className="page-wrap activity-detail">
      {created && <div className="notice success">{created === "existing" ? `已開啟既有的本屆${activity.name}。` : `已從上一屆建立本屆${activity.name}。日期、場地、人員、狀態與執行情況都已重設，請依本屆情況調整。`}</div>}
      <section className="detail-hero">
        <SectionHeading number="04" label={activity.status === "archived" ? "ARCHIVE DETAIL" : "ACTIVE PROJECT"} title={`${activity.terms?.ordinal ?? "—"}th ${activity.name}`} description={siteCopy(activity.description) || "尚未填寫活動說明"} />
        <div className="detail-score neutral-summary"><b>{tasks.length}</b><span>本屆工作項目</span></div>
        <dl><div><dt>待確認</dt><dd>{statusCounts.pending}</dd></div><div><dt>已處理</dt><dd>{statusCounts.handled}</dd></div><div><dt>本屆不採用</dt><dd>{statusCounts.notApplicable}</dd></div></dl>
      </section>

      <section className="phase-stack">
        {activity.phases.map((phase, phaseIndex) => (
          <details className="phase-block" key={phase.id}>
            <summary><span>{String(phaseIndex + 1).padStart(2, "0")}</span><div><small>PHASE</small><h2>{phase.name}</h2><p>{phase.description}</p></div><b>＋</b></summary>
            <div className="phase-tasks">
              {phase.tasks.sort((a, b) => a.position - b.position).map((task) => <TaskCard key={task.id} task={task} activity={activity} members={(members ?? []) as Member[]} editable={editable} source={source} allTasks={tasks} />)}
            </div>
            {editable && <form action={createTask} className="inline-create-form"><input type="hidden" name="activityId" value={activity.id} /><input type="hidden" name="phaseId" value={phase.id} /><input name="category" placeholder="工作分類" /><input name="name" placeholder="新增工作名稱" required /><input name="description" placeholder="工作說明" /><button>新增工作</button></form>}
          </details>
        ))}
      </section>

    </main>
  );
}

function ArchivedActivityView({ activity, editable }: { activity: Activity; editable: boolean }) {
  const notes = activity.experiences.filter((item) => !item.task_id);
  return <main className="page-wrap archive-detail">
    <section className="archive-detail-hero"><SectionHeading number="04" label="ARCHIVE DETAIL" title={`${activity.terms?.ordinal ?? "—"}th ${activity.name}`} description={editable ? "編輯學長姐交接說明與文件備註，這些內容會提供給下一屆參考。" : `第 ${activity.terms?.ordinal ?? "—"} 屆${activity.name}留下的文件與交接內容。`} /></section>
    <section className="archive-notes"><div className="section-number">01 <span /> NOTES</div><h2>學長姐留下的話</h2>{notes.map((note) => <blockquote key={note.id}>{siteCopy(note.content)}</blockquote>)}{editable && <form action={updateArchiveOverview} className="archive-note-form"><input type="hidden" name="activityId" value={activity.id} /><textarea name="content" defaultValue={notes[0]?.content ?? ""} placeholder="補充這一屆想交代給學弟妹的內容" required /><button>儲存交接說明</button></form>}</section>
    {(activity.document_links.length > 0 || archiveFolderLinks[activity.name]) && <section className="archive-documents"><div className="section-number">02 <span /> FILES</div><h2>歷屆文件</h2>{activity.document_links.map((file) => <article className="archive-document-entry" key={file.id}><a href={file.url} target="_blank" rel="noreferrer"><span>FILE</span><b>{file.name}</b><em>查看 →</em></a>{file.description && <p>{file.description}</p>}{editable && <form action={updateDocumentHandoverNote} className="archive-document-note"><input type="hidden" name="activityId" value={activity.id} /><input type="hidden" name="documentId" value={file.id} /><textarea name="handoverNote" defaultValue={file.handover_note ?? ""} placeholder="補充這份文件的使用方式或注意事項" /><button>儲存文件備註</button></form>}{file.handover_note && !editable && <p>{file.handover_note}</p>}</article>)}{archiveFolderLinks[activity.name] && <a className="archive-folder-link archive-folder-link-block" href={archiveFolderLinks[activity.name]} target="_blank" rel="noreferrer"><span>DRIVE</span><b>查看雲端資料夾</b><em>開啟 →</em></a>}</section>}
  </main>;
}

function TaskCard({ task, activity, members, editable, source, allTasks }: { task: Task; activity: Activity; members: Member[]; editable: boolean; source: Activity | null; allTasks: Task[] }) {
  const waiting = task.task_dependencies.map((item) => item.depends_on).filter((item) => item && item.status !== "completed");
  const previousTask = source?.phases.flatMap((phase) => phase.tasks).find((item) => item.id === task.source_task_id);
  return <div id={`task-${task.id}`} className={`detail-task ${task.status === "completed" ? "done" : ""}`}>
    <span className="task-state">{task.status === "completed" ? "✓" : waiting.length ? "○" : "●"}</span>
    <div className="task-main"><small>{task.category ? `${task.category} · ` : ""}{task.priority.toUpperCase()} · {statusLabel[task.status]}</small><h3>{task.name}</h3><p>{siteCopy(task.description)}</p>
      {waiting.length > 0 && <div className="dependency-note">前置工作：{waiting.map((item) => item?.name).join("、")}</div>}
      {!!task.task_checklist_items.length && <ul className="checklist">{task.task_checklist_items.sort((a, b) => a.position - b.position).map((item) => <li key={item.id} className={item.is_completed ? "checked" : ""}><form action={toggleChecklistItem}><input type="hidden" name="activityId" value={activity.id} /><input type="hidden" name="itemId" value={item.id} /><input type="hidden" name="completed" value={String(item.is_completed)} /><button disabled={activity.status === "archived"}>{item.is_completed ? "☑" : "☐"}</button></form><span>{item.content}</span></li>)}</ul>}
      {task.experiences.map((note) => <div className="experience-note" key={note.id}>本屆{experienceLabel[note.kind] ?? "紀錄"}：{siteCopy(note.content)}</div>)}
      {previousTask?.experiences.map((note) => <div className="experience-note previous" key={note.id}>上一屆{experienceLabel[note.kind] ?? "紀錄"}：{siteCopy(note.content)}</div>)}
      {source && archiveFolderLinks[activity.name] && <a className="task-reference-link" href={archiveFolderLinks[activity.name]} target="_blank" rel="noreferrer">查看歷屆雲端文件 <span>→</span></a>}
      {editable && <details className="edit-disclosure"><summary>修改工作內容</summary><form action={updateTask} className="admin-form task-edit"><input type="hidden" name="activityId" value={activity.id} /><input type="hidden" name="taskId" value={task.id} /><label>名稱<input name="name" defaultValue={task.name} required /></label><label>分類<input name="category" defaultValue={task.category ?? ""} /></label><label>優先序<select name="priority" defaultValue={task.priority}><option value="low">低</option><option value="medium">中</option><option value="high">高</option><option value="urgent">緊急</option></select></label><label className="span-all">說明<textarea name="description" defaultValue={task.description ?? ""} /></label><label>期限類型<select name="deadlineMode" defaultValue={task.deadline_type === "fixed_date" ? "fixed" : task.deadline_type ? "relative" : "none"}><option value="none">未設定</option><option value="fixed">固定日期</option><option value="relative">相對期限</option></select></label><label>固定日期<input type="date" name="fixedDeadline" defaultValue={task.fixed_deadline ?? ""} /></label><label>相對天數<input type="number" name="relativeDays" defaultValue={task.relative_days ?? 0} /></label><label>相對基準<select name="deadlineAnchor" defaultValue={task.deadline_anchor ?? "activity_start"}><option value="activity_start">活動開始</option><option value="activity_end">活動結束</option><option value="schedule_item">指定日程</option><option value="task_completion">指定工作完成</option></select></label><label>指定日程<select name="anchorScheduleItemId" defaultValue={task.anchor_schedule_item_id ?? ""}><option value="">未指定</option>{activity.activity_schedule_items.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label><label>指定工作<select name="anchorTaskId" defaultValue={task.anchor_task_id ?? ""}><option value="">未指定</option>{allTasks.filter((item) => item.id !== task.id).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label><button>儲存工作</button></form></details>}
      {editable && <form action={createChecklistItem} className="inline-create-form small"><input type="hidden" name="activityId" value={activity.id} /><input type="hidden" name="taskId" value={task.id} /><input name="content" placeholder="新增執行步驟" required /><button>新增步驟</button></form>}
    </div>
    <div className="task-side"><span>{formatDeadline(task, activity.activity_date)}</span><small>{task.assignments.map((item) => item.members?.name).filter(Boolean).join("、") || "待分配"}</small>
      {activity.status !== "archived" && <form action={updateTaskStatus}><input type="hidden" name="taskId" value={task.id} /><input type="hidden" name="activityId" value={activity.id} /><input type="hidden" name="status" value={task.status === "completed" ? "todo" : "completed"} /><button className="task-complete-button">{task.status === "completed" ? "改回待確認" : "標記已處理"}</button></form>}
      {editable && <form action={setTaskAssignee}><input type="hidden" name="taskId" value={task.id} /><input type="hidden" name="activityId" value={activity.id} /><select name="memberId" defaultValue={task.assignments[0]?.members?.id ?? ""}><option value="">待分配</option>{members.map((member) => <option key={member.id} value={member.id}>{member.name}</option>)}</select><button>指派</button></form>}
      {editable && <div className="task-admin-buttons"><form action={moveTask}><input type="hidden" name="activityId" value={activity.id} /><input type="hidden" name="taskId" value={task.id} /><input type="hidden" name="direction" value="-1" /><button title="上移">↑</button></form><form action={moveTask}><input type="hidden" name="activityId" value={activity.id} /><input type="hidden" name="taskId" value={task.id} /><input type="hidden" name="direction" value="1" /><button title="下移">↓</button></form><form action={deleteTask}><input type="hidden" name="activityId" value={activity.id} /><input type="hidden" name="taskId" value={task.id} /><button className="danger-button">刪除</button></form></div>}
    </div>
  </div>;
}

function formatDeadline(task: Task, activityDate: string | null) {
  if (task.deadline_type === "fixed_date") return task.fixed_deadline ?? "日期待確認";
  if (task.deadline_type === "relative_to_activity") {
    const amount = task.relative_days ?? 0;
    const anchor = task.deadline_anchor === "activity_end" ? "活動結束" : task.deadline_anchor === "schedule_item" ? "指定日程" : task.deadline_anchor === "task_completion" ? "前置工作完成" : "活動開始";
    if (!activityDate && task.deadline_anchor === "activity_start") return `${anchor}${amount >= 0 ? "後" : "前"}${Math.abs(amount)} 天（日期待確認）`;
    return `${anchor}${amount >= 0 ? "後" : "前"}${Math.abs(amount)} 天`;
  }
  return "未設定期限";
}

