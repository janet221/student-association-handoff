"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { canManageDepartment } from "@/lib/handover-workspace";
import { workGroups } from "@/lib/work-groups";
import { activityOwnerDepartments } from "@/lib/handover-workspace";

function field(formData: FormData, name: string) {
  return String(formData.get(name) ?? "").trim();
}

function safeReturnPath(value: string, fallback = "/history") {
  return /^\/(history|activities)(\?|$)/.test(value) ? value : fallback;
}

function revalidateHandover() {
  revalidatePath("/history");
  revalidatePath("/activities");
}

async function requireDepartmentAccess(departmentId: string) {
  const group = workGroups.find((item) => item.id === departmentId);
  if (!group) throw new Error("找不到這個職位或股別。");
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("請先登入。");
  const [{ data: profile }, { data: memberships }] = await Promise.all([
    supabase.from("profiles").select("role").eq("id", user.id).maybeSingle(),
    supabase.from("members").select("department_role").eq("profile_id", user.id).eq("is_active", true),
  ]);
  const roles = (memberships ?? []).map((item: { department_role: string | null }) => item.department_role ?? "");
  if (!canManageDepartment(profile?.role, roles, departmentId)) throw new Error("目前帳號沒有這個職位的交接編輯權限。");
  return { supabase, user, group };
}

async function requireCurrentHandoverTerm(supabase: Awaited<ReturnType<typeof createClient>>, termId: string) {
  const { data: currentTerm } = await supabase.from("terms").select("handover_from_term_id").eq("is_current", true).maybeSingle();
  if (!currentTerm?.handover_from_term_id || currentTerm.handover_from_term_id !== termId) {
    throw new Error("只能編輯目前屆別指定的上一屆交接資料。");
  }
}

async function requireActivityScope(supabase: Awaited<ReturnType<typeof createClient>>, termId: string, activityId: string, department: string) {
  const { data: activity } = await supabase.from("activities").select("id, term_id, name, department").eq("id", activityId).maybeSingle();
  if (!activity || activity.term_id !== termId || !activityOwnerDepartments(activity.name, activity.department).includes(department)) {
    throw new Error("活動與選取的屆別或主辦股別不相符。");
  }
}

async function requireEditableRecord(recordId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("請先登入。");
  const { data: record } = await supabase.from("handover_records").select("id, term_id, department_id, department, activity_id").eq("id", recordId).maybeSingle();
  if (!record) throw new Error("找不到這份交接資料，或目前帳號沒有編輯權限。");
  const [{ data: profile }, { data: memberships }] = await Promise.all([
    supabase.from("profiles").select("role").eq("id", user.id).maybeSingle(),
    supabase.from("members").select("department_role").eq("profile_id", user.id).eq("is_active", true),
  ]);
  const roles = (memberships ?? []).map((item: { department_role: string | null }) => item.department_role ?? "");
  if (!canManageDepartment(profile?.role, roles, record.department_id)) throw new Error("目前帳號沒有這份交接資料的編輯權限。");
  await requireCurrentHandoverTerm(supabase, record.term_id);
  if (record.activity_id) await requireActivityScope(supabase, record.term_id, record.activity_id, record.department);
  return { supabase, user, record };
}

async function saveAsDraft(supabase: Awaited<ReturnType<typeof createClient>>, recordId: string, userId: string) {
  const { error } = await supabase.from("handover_records").update({ is_published: false, published_at: null, updated_by: userId }).eq("id", recordId);
  if (error) throw new Error(error.message);
}

export async function createHandoverRecord(formData: FormData) {
  const departmentId = field(formData, "departmentId");
  const termId = field(formData, "termId");
  const activityId = field(formData, "activityId") || null;
  const returnTo = safeReturnPath(field(formData, "returnTo"));
  const { supabase, user, group } = await requireDepartmentAccess(departmentId);
  await requireCurrentHandoverTerm(supabase, termId);
  if (activityId) await requireActivityScope(supabase, termId, activityId, group.name);
  const { error } = await supabase.from("handover_records").upsert({
    term_id: termId,
    department_id: group.id,
    department: group.name,
    activity_id: activityId,
    updated_by: user.id,
  }, { onConflict: "term_id,department_id,activity_id" });
  if (error) throw new Error(error.message);
  revalidateHandover();
  redirect(returnTo);
}

export async function saveWelcomeMessage(formData: FormData) {
  const recordId = field(formData, "recordId");
  const message = field(formData, "welcomeMessage");
  if (message.length > 4000) throw new Error("留言請控制在 4,000 字以內。");
  const { supabase, user } = await requireEditableRecord(recordId);
  await saveAsDraft(supabase, recordId, user.id);
  const { error } = await supabase.from("handover_records").update({
    welcome_message: message,
    welcome_visible: field(formData, "welcomeVisible") === "on" && Boolean(message),
  }).eq("id", recordId);
  if (error) throw new Error(error.message);
  revalidateHandover();
}

export async function saveDriveLink(formData: FormData) {
  const recordId = field(formData, "recordId");
  const driveUrl = field(formData, "driveUrl");
  if (driveUrl) {
    let parsed: URL;
    try { parsed = new URL(driveUrl); } catch { throw new Error("請輸入有效的 Google Drive 網址。"); }
    if (parsed.protocol !== "https:" || !["drive.google.com", "docs.google.com"].includes(parsed.hostname.toLowerCase())) {
      throw new Error("雲端連結必須是 https://drive.google.com 或 https://docs.google.com 網址。");
    }
  }
  const { supabase, user } = await requireEditableRecord(recordId);
  await saveAsDraft(supabase, recordId, user.id);
  const { error } = await supabase.from("handover_records").update({ drive_url: driveUrl }).eq("id", recordId);
  if (error) throw new Error(error.message);
  revalidateHandover();
}

export async function addHandoverEntry(formData: FormData) {
  const recordId = field(formData, "recordId");
  const kind = field(formData, "kind");
  const content = field(formData, "content");
  if (!["note", "workflow"].includes(kind)) throw new Error("不支援的交接項目類型。");
  if (!content) throw new Error(kind === "workflow" ? "請填寫工作事項。" : "請填寫便條內容。");
  if (content.length > 8000) throw new Error("內容請控制在 8,000 字以內。");
  const { supabase, user } = await requireEditableRecord(recordId);
  await saveAsDraft(supabase, recordId, user.id);
  const { data: last } = await supabase.from("handover_entries").select("position").eq("record_id", recordId).eq("kind", kind).order("position", { ascending: false }).limit(1).maybeSingle();
  const { data: record } = await supabase.from("handover_records").select("term_id, department, activity_id").eq("id", recordId).single();
  if (!record) throw new Error("找不到交接資料。");
  const { error } = await supabase.from("handover_entries").insert({
    record_id: recordId,
    term_id: record.term_id,
    department: record.department,
    activity_id: record.activity_id,
    kind,
    content,
    workflow_time: kind === "workflow" ? field(formData, "workflowTime") || null : null,
    workflow_note: kind === "workflow" ? field(formData, "workflowNote") || null : null,
    position: (last?.position ?? -1) + 1,
  });
  if (error) throw new Error(error.message);
  revalidateHandover();
}

export async function updateHandoverEntry(formData: FormData) {
  const recordId = field(formData, "recordId");
  const entryId = field(formData, "entryId");
  const kind = field(formData, "kind");
  const content = field(formData, "content");
  if (!content || content.length > 8000) throw new Error("請填寫內容，並控制在 8,000 字以內。");
  const { supabase, user } = await requireEditableRecord(recordId);
  const { data: entry } = await supabase.from("handover_entries").select("id, kind").eq("id", entryId).eq("record_id", recordId).maybeSingle();
  if (!entry) throw new Error("找不到這張交接便條或流程。");
  if (entry.kind !== kind) throw new Error("交接項目類型不相符。");
  await saveAsDraft(supabase, recordId, user.id);
  const { error } = await supabase.from("handover_entries").update({
    content,
    workflow_time: ["workflow", "schedule"].includes(kind) ? field(formData, "workflowTime") || null : null,
    workflow_note: ["workflow", "schedule"].includes(kind) ? field(formData, "workflowNote") || null : null,
  }).eq("id", entryId).eq("record_id", recordId);
  if (error) throw new Error(error.message);
  revalidateHandover();
}

export async function deleteHandoverEntry(formData: FormData) {
  const recordId = field(formData, "recordId");
  const entryId = field(formData, "entryId");
  const { supabase, user } = await requireEditableRecord(recordId);
  await saveAsDraft(supabase, recordId, user.id);
  const { error } = await supabase.from("handover_entries").delete().eq("id", entryId).eq("record_id", recordId);
  if (error) throw new Error(error.message);
  revalidateHandover();
}

export async function moveHandoverEntry(formData: FormData) {
  const recordId = field(formData, "recordId");
  const entryId = field(formData, "entryId");
  const direction = field(formData, "direction") === "up" ? -1 : 1;
  const { supabase, user } = await requireEditableRecord(recordId);
  const { data: entry } = await supabase.from("handover_entries").select("id, kind, position").eq("id", entryId).eq("record_id", recordId).maybeSingle();
  if (!entry) throw new Error("找不到要排序的交接項目。");
  const { data: peers } = await supabase.from("handover_entries").select("id, position").eq("record_id", recordId).eq("kind", entry.kind).order("position", { ascending: true }).order("created_at", { ascending: true });
  const rows = (peers ?? []) as { id: string; position: number }[];
  const index = rows.findIndex((row) => row.id === entryId);
  const next = rows[index + direction];
  if (!next) return;
  await saveAsDraft(supabase, recordId, user.id);
  const { error: firstError } = await supabase.from("handover_entries").update({ position: next.position }).eq("id", entry.id).eq("record_id", recordId);
  if (firstError) throw new Error(firstError.message);
  const { error: secondError } = await supabase.from("handover_entries").update({ position: entry.position }).eq("id", next.id).eq("record_id", recordId);
  if (secondError) throw new Error(secondError.message);
  revalidateHandover();
}

export async function publishHandover(formData: FormData) {
  const recordId = field(formData, "recordId");
  const { supabase, user } = await requireEditableRecord(recordId);
  const { error } = await supabase.from("handover_records").update({ is_published: true, published_at: new Date().toISOString(), updated_by: user.id }).eq("id", recordId);
  if (error) throw new Error(error.message);
  revalidateHandover();
}

export async function unpublishHandover(formData: FormData) {
  const recordId = field(formData, "recordId");
  const { supabase, user } = await requireEditableRecord(recordId);
  const { error } = await supabase.from("handover_records").update({ is_published: false, published_at: null, updated_by: user.id }).eq("id", recordId);
  if (error) throw new Error(error.message);
  revalidateHandover();
}
