"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function inheritActivity(formData: FormData) {
  const sourceActivity = String(formData.get("sourceActivity") ?? "");
  const targetTerm = String(formData.get("targetTerm") ?? "");
  const activityDate = String(formData.get("activityDate") ?? "") || null;
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("inherit_activity", {
    source_activity: sourceActivity,
    target_term: targetTerm,
    target_activity_date: activityDate,
  });
  if (error) redirect(`/history?error=${encodeURIComponent(error.message)}`);
  revalidatePath("/dashboard");
  redirect(`/activities/${data}`);
}

export async function updateTaskStatus(formData: FormData) {
  const taskId = String(formData.get("taskId") ?? "");
  const activityId = String(formData.get("activityId") ?? "");
  const status = String(formData.get("status") ?? "todo");
  const supabase = await createClient();
  await supabase.from("tasks").update({ status }).eq("id", taskId);
  revalidatePath("/dashboard");
  revalidatePath(`/activities/${activityId}`);
}
