import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { workGroups } from "@/lib/work-groups";
import { HandoverWorkspace } from "@/components/handover-workspace";
import { activityOwnerDepartments } from "@/lib/handover-workspace";
import type { HandoverEntry, HandoverRecord } from "@/lib/handover-workspace";

type Activity = { id: string; name: string; department: string | null; description: string | null; status: string; activity_date: string | null };

export default async function ActivitiesPage({ searchParams }: { searchParams: Promise<{ department?: string; activity?: string }> }) {
  const supabase = await createClient();
  const params = await searchParams;
  const selected = workGroups.find((group) => group.id === params.department);
  const { data: currentTerm } = await supabase.from("terms").select("id, name, ordinal, handover_from_term_id").eq("is_current", true).maybeSingle();
  if (!selected) return <main className="page-wrap current-work-page">
    <section className="page-title-center poster-index-title" aria-label="Our Team"><h1>Our Team</h1></section>
    <section className="work-group-grid">{workGroups.map((group, index) => <Link className={`work-group-card note-paper note-paper-${index + 1}`} href={`/activities?department=${group.id}`} key={group.id}>
      <img className="work-group-paper" src={`/images/decor/unit-note-assets/note-${String(index + 1).padStart(2, "0")}.png`} alt="" />
      <small>UNIT · {String(index + 1).padStart(2, "0")}</small><h2>{group.name}</h2><p>查看職位／股別交接內容</p>
    </Link>)}</section>
  </main>;

  const sourceTermId = currentTerm?.handover_from_term_id ?? null;
  const { data: activityRows } = sourceTermId ? await supabase.from("activities").select("id, name, department, description, status, activity_date").eq("term_id", sourceTermId).order("activity_date", { ascending: true, nullsFirst: false }).order("name") : { data: [] };
  const activities = ((activityRows ?? []) as Activity[]).filter((activity) => activityOwnerDepartments(activity.name, activity.department).includes(selected.name));
  const chosenActivity = params.activity ? activities.find((activity) => activity.id === params.activity) ?? null : null;
  const invalidActivitySelection = Boolean(params.activity && !chosenActivity);
  const readRecord = async (activityId: string | null) => {
    if (!sourceTermId) return { record: null as HandoverRecord | null, entries: [] as HandoverEntry[] };
    let query = supabase.from("handover_records").select("id, term_id, department_id, department, activity_id, welcome_message, welcome_visible, drive_url, is_published, published_at, updated_at").eq("term_id", sourceTermId).eq("department_id", selected.id).eq("is_published", true);
    query = activityId ? query.eq("activity_id", activityId) : query.is("activity_id", null);
    const { data: record } = await query.maybeSingle();
    if (!record) return { record: null as HandoverRecord | null, entries: [] as HandoverEntry[] };
    const { data: rows } = await supabase.from("handover_entries").select("id, record_id, kind, content, workflow_time, workflow_note, position, created_at, updated_at").eq("record_id", record.id).order("position").order("created_at");
    return { record: record as HandoverRecord, entries: (rows ?? []) as HandoverEntry[] };
  };
  const groupHandover = !params.activity ? await readRecord(null) : { record: null as HandoverRecord | null, entries: [] as HandoverEntry[] };
  const activityHandover = chosenActivity ? await readRecord(chosenActivity.id) : { record: null as HandoverRecord | null, entries: [] as HandoverEntry[] };

  return <main className="page-wrap current-work-page">
    <section className="page-intro"><div><Link className="back-link" href="/activities">← 返回單位總覽</Link><div className="section-heading"><h1>Units</h1></div></div><Link href="/calendar" className="button">查看共同月曆 <span>→</span></Link></section>
    <section className="handover-selection-heading"><small>OUR TEAM · {currentTerm?.name ?? "本屆"}</small><h2>{selected.name}{chosenActivity ? `｜${chosenActivity.name}` : ""}</h2><p>{chosenActivity ? "查看學長姐為這項活動留下的交接內容。" : "學長姐已發布的交接資料會顯示在這裡。"}</p></section>
    {!sourceTermId && <p className="handover-system-note">目前屆別尚未指定上一屆資料來源，因此暫時沒有可讀取的交接紀錄。</p>}
    {invalidActivitySelection && <p className="handover-system-note">找不到這項活動，請從單位活動清單重新選擇。</p>}
    {sourceTermId && chosenActivity && <><HandoverWorkspace record={activityHandover.record} entries={activityHandover.entries} termId={sourceTermId} departmentId={selected.id} department={selected.name} activityId={chosenActivity.id} activityName={chosenActivity.name} legacyDriveUrl={selected.activities.find((item) => item.name === chosenActivity.name)?.driveUrl} editable={false} returnTo={`/activities?department=${selected.id}&activity=${chosenActivity.id}`} backHref={`/activities?department=${selected.id}`} /><p className="handover-back-to-activities"><Link href={`/activities?department=${selected.id}`}>← 返回{selected.name}活動清單</Link></p></>}
    {sourceTermId && !chosenActivity && !params.activity && <>
      <HandoverWorkspace record={groupHandover.record} entries={groupHandover.entries} termId={sourceTermId} departmentId={selected.id} department={selected.name} editable={false} showWelcome={activities.length > 0 || selected.activities.length > 0} backHref="/activities" returnTo={`/activities?department=${selected.id}`} />
      {activities.length > 0 && <section className="handover-activity-index"><div className="handover-section-heading"><span>ACTIVITY INDEX</span><h2>活動交接</h2></div><div className="handover-activity-cards">{activities.map((activity, index) => <Link key={activity.id} className="handover-activity-card" href={`/activities?department=${selected.id}&activity=${activity.id}`}><small>{String(index + 1).padStart(2, "0")} · {activity.activity_date?.replaceAll("-", "/") ?? "日期未定"}</small><h3>{activity.name}</h3><p>{activity.description || `${selected.name} 主辦活動交接內容`}</p><span>查看活動交接 →</span></Link>)}</div></section>}
    </>}
  </main>;
}
