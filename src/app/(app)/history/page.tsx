import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { resolvedDepartment } from "@/lib/activity-departments";
import { archiveFolderLinks, term25DriveFolder } from "@/lib/archive-folders";
import { workGroups } from "@/lib/work-groups";
import { activityOwnerDepartments, canManageDepartment } from "@/lib/handover-workspace";
import type { HandoverEntry, HandoverRecord } from "@/lib/handover-workspace";
import { HandoverWorkspace } from "@/components/handover-workspace";

type HistoricalActivity = { id: string; name: string; department: string | null; description: string | null; activity_date: string | null; terms: { id: string; name: string; ordinal: number } | null; phases: { id: string }[]; equipment: { id: string }[]; experiences: { id: string }[] };
type SourceActivity = { id: string; name: string; department: string | null; description: string | null; activity_date: string | null };

export default async function HistoryPage({ searchParams }: { searchParams: Promise<{ error?: string; department?: string; activity?: string }> }) {
  const supabase = await createClient();
  const params = await searchParams;
  const selected = workGroups.find((group) => group.id === params.department);
  const [{ data: historyData }, { data: currentTerm }, { data: { user } }] = await Promise.all([
    supabase.from("activities").select("id, name, department, description, activity_date, terms(id, name, ordinal), phases(id), equipment(id), experiences(id)").eq("status", "archived").order("activity_date", { ascending: false }),
    supabase.from("terms").select("id, name, ordinal, handover_from_term_id").eq("is_current", true).maybeSingle(),
    supabase.auth.getUser(),
  ]);
  const [{ data: profile }, { data: memberships }] = user ? await Promise.all([
    supabase.from("profiles").select("role").eq("id", user.id).maybeSingle(),
    supabase.from("members").select("department_role").eq("profile_id", user.id).eq("is_active", true),
  ]) : [{ data: null }, { data: [] }];
  const memberRoles = (memberships ?? []).map((item: { department_role: string | null }) => item.department_role ?? "");
  const canEdit = Boolean(selected && canManageDepartment(profile?.role, memberRoles, selected.id));
  const history = (historyData ?? []) as unknown as HistoricalActivity[];
  const historicalDepartments = Array.from(new Set(history.map((activity) => resolvedDepartment(activity.department, activity.name))));
  const handoverTermId = currentTerm?.handover_from_term_id ?? null;
  let sourceActivities: SourceActivity[] = [];
  let record: HandoverRecord | null = null;
  let entries: HandoverEntry[] = [];
  let chosenActivity: SourceActivity | null = null;
  let invalidActivitySelection = false;

  if (selected && handoverTermId) {
    const { data: rows } = await supabase.from("activities").select("id, name, department, description, activity_date").eq("term_id", handoverTermId).order("activity_date", { ascending: true, nullsFirst: false }).order("name");
    sourceActivities = ((rows ?? []) as SourceActivity[]).filter((activity) => activityOwnerDepartments(activity.name, activity.department).includes(selected.name));
    chosenActivity = params.activity ? sourceActivities.find((activity) => activity.id === params.activity) ?? null : null;
    invalidActivitySelection = Boolean(params.activity && !chosenActivity);
    if (chosenActivity || !sourceActivities.length || !params.activity) {
      const query = supabase.from("handover_records").select("id, term_id, department_id, department, activity_id, welcome_message, welcome_visible, drive_url, is_published, published_at, updated_at").eq("term_id", handoverTermId).eq("department_id", selected.id);
      const result = chosenActivity ? await query.eq("activity_id", chosenActivity.id).maybeSingle() : !sourceActivities.length || !params.activity ? await query.is("activity_id", null).maybeSingle() : { data: null };
      record = (result.data ?? null) as HandoverRecord | null;
      if (record) {
        const { data: entryRows } = await supabase.from("handover_entries").select("id, record_id, kind, content, workflow_time, workflow_note, position, created_at, updated_at").eq("record_id", record.id).order("position").order("created_at");
        entries = (entryRows ?? []) as HandoverEntry[];
      }
    }
  }

  return <main className="page-wrap handover-page handover-workspace-page">
    <section className="page-title-center poster-index-title" aria-label="Archives"><h1>Archives</h1></section>
    {params.error && <div className="notice error">{params.error}</div>}

    {!selected ? <>
      <section className="handover-unit-grid">{workGroups.map((group, index) => <Link className="handover-unit-card archive-folder-card" href={`/history?department=${group.id}`} key={group.id}>
        <img className="archive-folder-art" src={`/images/decor/archive-folder-assets/folder-${String(index + 1).padStart(2, "0")}.png`} alt="" />
        <h2>{group.name}</h2><p>交接資料</p>
      </Link>)}</section>
      <a className="archive-folder-link archive-folder-featured" href={term25DriveFolder} target="_blank" rel="noreferrer">開啟系學會總資料夾 <span>↗</span></a>
      <section className="department-directory archive-list">{historicalDepartments.map((department) => <details className="department-menu" key={department}>
        <summary><span>DEPARTMENT</span><b>{department}</b><small>{history.filter((activity) => resolvedDepartment(activity.department, activity.name) === department).map((activity) => activity.name).join("、")}</small><i>＋</i></summary>
        <div>{history.filter((activity) => resolvedDepartment(activity.department, activity.name) === department).map((activity, index) => <article className="archive-row" key={activity.id}>
          <div className="archive-term"><b>{activity.terms?.ordinal ?? "—"}th</b><span>{activity.terms?.name}</span></div>
          <div><small>{String(index + 1).padStart(2, "0")} / HANDOVER RECORD</small><h2>{activity.name}</h2><Link className="archive-note-link" href={`/activities/${activity.id}`}>查看活動紀錄 →</Link></div>
          <div className="archive-actions">{archiveFolderLinks[activity.name] && <a className="archive-folder-link" href={archiveFolderLinks[activity.name]} target="_blank" rel="noreferrer">查看雲端文件 →</a>}</div>
        </article>)}</div>
      </details>)}</section>
    </> : <>
      <section className="handover-selection-heading"><Link href="/history">← 返回單位列表</Link><small>HANDOVER · {currentTerm?.name ?? "本屆"}</small><h2>{selected.name}{chosenActivity ? `｜${chosenActivity.name}` : ""}</h2><p>{chosenActivity ? "編輯這項活動的交接便條、流程與雲端資料。" : "整理職位交接內容，發布後會同步給下一屆查看。"}</p></section>
      {!handoverTermId && <p className="handover-system-note">目前屆別尚未指定上一屆資料來源，暫時無法建立交接紀錄。</p>}
      {invalidActivitySelection && <p className="handover-system-note">找不到這個單位負責的活動，請從活動清單重新選擇。</p>}
      {handoverTermId && (chosenActivity || !sourceActivities.length) && <HandoverWorkspace record={record} entries={entries} termId={handoverTermId} departmentId={selected.id} department={selected.name} activityId={chosenActivity?.id ?? null} activityName={chosenActivity?.name} legacyDriveUrl={chosenActivity ? selected.activities.find((item) => item.name === chosenActivity.name)?.driveUrl : null} editable={canEdit} showWelcome={!chosenActivity && selected.activities.length > 0} returnTo={chosenActivity ? `/history?department=${selected.id}&activity=${chosenActivity.id}` : `/history?department=${selected.id}`} backHref={chosenActivity ? `/history?department=${selected.id}` : "/history"} />}
      {handoverTermId && !chosenActivity && sourceActivities.length > 0 && <HandoverWorkspace record={record} entries={entries} termId={handoverTermId} departmentId={selected.id} department={selected.name} editable={canEdit} showWelcome backHref="/history" returnTo={`/history?department=${selected.id}`} />}
      {handoverTermId && sourceActivities.length > 0 && !chosenActivity && <section className="handover-activity-index"><div className="handover-section-heading"><span>ACTIVITY INDEX</span><h2>選擇活動交接</h2></div><div className="handover-activity-cards">{sourceActivities.map((activity, index) => <Link key={activity.id} className="handover-activity-card" href={`/history?department=${selected.id}&activity=${activity.id}`}><small>{String(index + 1).padStart(2, "0")} · {activity.activity_date?.replaceAll("-", "/") ?? "日期未定"}</small><h3>{activity.name}</h3><p>{activity.description || `${selected.name} 主辦活動交接內容`}</p><span>開啟交接資料 →</span></Link>)}</div></section>}
      {chosenActivity && <p className="handover-back-to-activities"><Link href={`/history?department=${selected.id}`}>← 返回{selected.name}活動清單</Link></p>}
    </>}
  </main>;
}
