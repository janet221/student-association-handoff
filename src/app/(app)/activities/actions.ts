"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

const taskStatuses = new Set(["todo", "in_progress", "blocked", "completed"]);
const taskPriorities = new Set(["low", "medium", "high", "urgent"]);
const equipmentStatuses = new Set(["to_confirm", "to_borrow", "requested", "borrowed", "to_buy", "purchased", "returned"]);

function value(formData: FormData, key: string) { return String(formData.get(key) ?? "").trim(); }
function optional(formData: FormData, key: string) { return value(formData, key) || null; }
function integer(formData: FormData, key: string, fallback = 0) {
  const parsed = Number.parseInt(value(formData, key), 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("請先登入");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") throw new Error("只有管理者可以修改工作架構");
  return supabase;
}

async function ensureEditableActivity(activityId: string) {
  const supabase = await requireAdmin();
  const { data: activity } = await supabase.from("activities").select("status").eq("id", activityId).single();
  if (!activity || activity.status === "archived") throw new Error("歷屆資料為唯讀，不能修改");
  return supabase;
}

function refreshActivity(activityId: string) {
  revalidatePath("/activities");
  revalidatePath("/activities");
  revalidatePath(`/activities/${activityId}`);
}

export async function inheritActivity(formData: FormData) {
  const supabase = await requireAdmin();
  const sourceActivity = value(formData, "sourceActivity");
  const targetTerm = value(formData, "targetTerm");
  const { data: source } = await supabase.from("activities").select("name").eq("id", sourceActivity).maybeSingle();
  if (!source) redirect("/history?error=找不到要建立的歷屆活動");
  const { data: existing } = await supabase.from("activities").select("id").eq("term_id", targetTerm).eq("name", source.name).maybeSingle();
  if (existing) {
    revalidatePath("/activities");
    redirect(`/activities/${existing.id}?created=existing`);
  }
  const { data, error } = await supabase.rpc("inherit_activity", {
    source_activity: sourceActivity,
    target_term: targetTerm,
    target_activity_date: null,
  });
  if (error) redirect(`/history?error=${encodeURIComponent(error.message)}`);
  revalidatePath("/activities");
  revalidatePath("/activities");
  redirect(`/activities/${data}?created=1`);
}

export async function updateActivity(formData: FormData) {
  const activityId = value(formData, "activityId");
  const supabase = await ensureEditableActivity(activityId);
  const status = value(formData, "status");
  const { error } = await supabase.from("activities").update({
    name: value(formData, "name"),
    description: optional(formData, "description"),
    activity_date: optional(formData, "activityDate"),
    status: ["planning", "active", "completed"].includes(status) ? status : "planning",
  }).eq("id", activityId);
  if (error) throw new Error(error.message);
  refreshActivity(activityId);
}

export async function archiveActivity(formData: FormData) {
  const activityId = value(formData, "activityId");
  const supabase = await ensureEditableActivity(activityId);
  const { error } = await supabase.from("activities").update({ status: "archived" }).eq("id", activityId);
  if (error) throw new Error(error.message);
  revalidatePath("/activities");
  revalidatePath("/history");
  revalidatePath(`/activities/${activityId}`);
}

export async function createScheduleItem(formData: FormData) {
  const activityId = value(formData, "activityId");
  const supabase = await ensureEditableActivity(activityId);
  const { data: last } = await supabase.from("activity_schedule_items").select("position").eq("activity_id", activityId).order("position", { ascending: false }).limit(1).maybeSingle();
  const { error } = await supabase.from("activity_schedule_items").insert({
    activity_id: activityId, name: value(formData, "name"), starts_at: optional(formData, "startsAt"),
    ends_at: optional(formData, "endsAt"), venue: optional(formData, "venue"), note: optional(formData, "note"),
    position: (last?.position ?? -1) + 1,
  });
  if (error) throw new Error(error.message);
  refreshActivity(activityId);
}

export async function updateScheduleItem(formData: FormData) {
  const activityId = value(formData, "activityId");
  const supabase = await ensureEditableActivity(activityId);
  const { error } = await supabase.from("activity_schedule_items").update({
    starts_at: optional(formData, "startsAt"), ends_at: optional(formData, "endsAt"),
    venue: optional(formData, "venue"), note: optional(formData, "note"),
  }).eq("id", value(formData, "scheduleItemId")).eq("activity_id", activityId);
  if (error) throw new Error(error.message);
  refreshActivity(activityId);
}

export async function createTask(formData: FormData) {
  const activityId = value(formData, "activityId");
  const phaseId = value(formData, "phaseId");
  const supabase = await ensureEditableActivity(activityId);
  const { data: last } = await supabase.from("tasks").select("position").eq("phase_id", phaseId).order("position", { ascending: false }).limit(1).maybeSingle();
  const { error } = await supabase.from("tasks").insert({
    phase_id: phaseId, name: value(formData, "name"), category: optional(formData, "category"),
    description: optional(formData, "description"), status: "todo", priority: "medium", position: (last?.position ?? -1) + 1,
  });
  if (error) throw new Error(error.message);
  refreshActivity(activityId);
}

export async function updateTask(formData: FormData) {
  const activityId = value(formData, "activityId");
  const supabase = await ensureEditableActivity(activityId);
  const mode = value(formData, "deadlineMode");
  const anchor = value(formData, "deadlineAnchor") || "activity_start";
  if (mode === "fixed" && !optional(formData, "fixedDeadline")) throw new Error("請輸入固定期限");
  if (mode === "relative" && anchor === "schedule_item" && !optional(formData, "anchorScheduleItemId")) throw new Error("請選擇日程基準");
  if (mode === "relative" && anchor === "task_completion" && !optional(formData, "anchorTaskId")) throw new Error("請選擇前置工作");
  const deadline = mode === "fixed"
    ? { deadline_type: "fixed_date", fixed_deadline: optional(formData, "fixedDeadline"), relative_days: null, deadline_anchor: null, anchor_schedule_item_id: null, anchor_task_id: null }
    : mode === "relative"
      ? { deadline_type: "relative_to_activity", fixed_deadline: null, relative_days: integer(formData, "relativeDays"), deadline_anchor: anchor,
          anchor_schedule_item_id: anchor === "schedule_item" ? optional(formData, "anchorScheduleItemId") : null,
          anchor_task_id: anchor === "task_completion" ? optional(formData, "anchorTaskId") : null }
      : { deadline_type: null, fixed_deadline: null, relative_days: null, deadline_anchor: null, anchor_schedule_item_id: null, anchor_task_id: null };
  const priority = value(formData, "priority");
  const { error } = await supabase.from("tasks").update({
    name: value(formData, "name"), category: optional(formData, "category"), description: optional(formData, "description"),
    priority: taskPriorities.has(priority) ? priority : "medium", ...deadline,
  }).eq("id", value(formData, "taskId"));
  if (error) throw new Error(error.message);
  refreshActivity(activityId);
}

export async function deleteTask(formData: FormData) {
  const activityId = value(formData, "activityId");
  const supabase = await ensureEditableActivity(activityId);
  const { error } = await supabase.from("tasks").delete().eq("id", value(formData, "taskId"));
  if (error) throw new Error(error.message);
  refreshActivity(activityId);
}

export async function moveTask(formData: FormData) {
  const activityId = value(formData, "activityId");
  const supabase = await ensureEditableActivity(activityId);
  const { error } = await supabase.rpc("move_task", { target_task: value(formData, "taskId"), direction: integer(formData, "direction") });
  if (error) throw new Error(error.message);
  refreshActivity(activityId);
}

export async function updateTaskStatus(formData: FormData) {
  const taskId = value(formData, "taskId");
  const activityId = value(formData, "activityId");
  const status = value(formData, "status");
  if (!taskStatuses.has(status)) throw new Error("無效的工作狀態");
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("請先登入");
  const { data: task } = await supabase.from("tasks").select("phases(activities(status))").eq("id", taskId).single();
  const activityStatus = (task as unknown as { phases: { activities: { status: string } | null } | null })?.phases?.activities?.status;
  if (activityStatus === "archived") throw new Error("歷屆資料為唯讀，不能修改");
  const { error } = await supabase.from("tasks").update({ status }).eq("id", taskId);
  if (error) throw new Error(error.message);
  refreshActivity(activityId);
}

export async function createChecklistItem(formData: FormData) {
  const activityId = value(formData, "activityId");
  const taskId = value(formData, "taskId");
  const supabase = await ensureEditableActivity(activityId);
  const { data: last } = await supabase.from("task_checklist_items").select("position").eq("task_id", taskId).order("position", { ascending: false }).limit(1).maybeSingle();
  const { error } = await supabase.from("task_checklist_items").insert({ task_id: taskId, content: value(formData, "content"), position: (last?.position ?? -1) + 1 });
  if (error) throw new Error(error.message);
  refreshActivity(activityId);
}

export async function toggleChecklistItem(formData: FormData) {
  const activityId = value(formData, "activityId");
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("請先登入");
  const { data: item } = await supabase.from("task_checklist_items").select("tasks(phases(activities(status)))").eq("id", value(formData, "itemId")).single();
  const activityStatus = (item as unknown as { tasks: { phases: { activities: { status: string } | null } | null } | null })?.tasks?.phases?.activities?.status;
  if (activityStatus === "archived") throw new Error("歷屆資料為唯讀，不能修改");
  const { error } = await supabase.from("task_checklist_items").update({ is_completed: value(formData, "completed") !== "true" }).eq("id", value(formData, "itemId"));
  if (error) throw new Error(error.message);
  refreshActivity(activityId);
}

export async function setTaskAssignee(formData: FormData) {
  const activityId = value(formData, "activityId");
  const taskId = value(formData, "taskId");
  const memberId = optional(formData, "memberId");
  const supabase = await ensureEditableActivity(activityId);
  const { error: deleteError } = await supabase.from("assignments").delete().eq("task_id", taskId);
  if (deleteError) throw new Error(deleteError.message);
  if (memberId) {
    const { error } = await supabase.from("assignments").insert({ task_id: taskId, member_id: memberId });
    if (error) throw new Error(error.message);
  }
  refreshActivity(activityId);
}

export async function updateEquipment(formData: FormData) {
  const activityId = value(formData, "activityId");
  const supabase = await ensureEditableActivity(activityId);
  const status = value(formData, "preparationStatus");
  const { error } = await supabase.from("equipment").update({
    quantity: Math.max(1, integer(formData, "quantity", 1)), source: optional(formData, "source"), note: optional(formData, "note"),
    preparation_status: equipmentStatuses.has(status) ? status : "to_confirm", is_confirmed: status !== "to_confirm",
  }).eq("id", value(formData, "equipmentId")).eq("activity_id", activityId);
  if (error) throw new Error(error.message);
  refreshActivity(activityId);
}

export async function createEquipment(formData: FormData) {
  const activityId = value(formData, "activityId");
  const supabase = await ensureEditableActivity(activityId);
  const { error } = await supabase.from("equipment").insert({
    activity_id: activityId, name: value(formData, "name"), quantity: Math.max(1, integer(formData, "quantity", 1)),
    source: optional(formData, "source"), note: optional(formData, "note"), preparation_status: "to_confirm", is_confirmed: false,
  });
  if (error) throw new Error(error.message);
  refreshActivity(activityId);
}

export async function createExperience(formData: FormData) {
  const activityId = value(formData, "activityId");
  const termId = value(formData, "termId");
  const supabase = await ensureEditableActivity(activityId);
  const { data: { user } } = await supabase.auth.getUser();
  const { data: author } = await supabase.from("members").select("id").eq("term_id", termId).eq("profile_id", user!.id).maybeSingle();
  const kind = value(formData, "kind");
  const { error } = await supabase.from("experiences").insert({
    activity_id: activityId, task_id: optional(formData, "taskId"), author_id: author?.id ?? null,
    kind: ["note", "tip", "warning", "outcome"].includes(kind) ? kind : "note", content: value(formData, "content"),
  });
  if (error) throw new Error(error.message);
  refreshActivity(activityId);
}

export async function updateArchiveOverview(formData: FormData) {
  const activityId = value(formData, "activityId");
  const content = value(formData, "content");
  const supabase = await requireAdmin();
  const { data: existing } = await supabase.from("experiences").select("id").eq("activity_id", activityId).is("task_id", null).eq("kind", "note").maybeSingle();
  const result = existing
    ? await supabase.from("experiences").update({ content }).eq("id", existing.id)
    : await supabase.from("experiences").insert({ activity_id: activityId, kind: "note", content });
  if (result.error) throw new Error(result.error.message);
  refreshActivity(activityId);
}

export async function updateDocumentHandoverNote(formData: FormData) {
  const activityId = value(formData, "activityId");
  const documentId = value(formData, "documentId");
  const supabase = await requireAdmin();
  const { error } = await supabase.from("document_links").update({ handover_note: optional(formData, "handoverNote") }).eq("id", documentId).eq("activity_id", activityId);
  if (error) throw new Error(error.message);
  refreshActivity(activityId);
}
