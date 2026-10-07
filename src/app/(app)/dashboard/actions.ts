"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function updateHandoverStatus(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("請先登入");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") throw new Error("只有管理者可以更新交接狀態");
  const termId = String(formData.get("termId") ?? "");
  const completed = String(formData.get("completed") ?? "false") === "true";
  const { error } = await supabase.from("terms").update({ handover_completed: completed }).eq("id", termId);
  if (error) throw new Error(error.message);
  revalidatePath("/dashboard");
  revalidatePath("/login");
}
