"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("請先登入");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") throw new Error("只有管理者可以管理本屆成員");
  return supabase;
}

export async function createMember(formData: FormData) {
  const supabase = await requireAdmin();
  const { data: term } = await supabase.from("terms").select("id").eq("is_current", true).single();
  const { error } = await supabase.from("members").insert({
    term_id: term!.id,
    name: String(formData.get("name") ?? "").trim(),
    department_role: String(formData.get("departmentRole") ?? "").trim() || null,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/members");
  revalidatePath("/activities");
}

export async function updateMember(formData: FormData) {
  const supabase = await requireAdmin();
  const { data: term } = await supabase.from("terms").select("id").eq("is_current", true).single();
  const { error } = await supabase.from("members").update({
    name: String(formData.get("name") ?? "").trim(),
    department_role: String(formData.get("departmentRole") ?? "").trim() || null,
    is_active: formData.get("isActive") === "true",
  }).eq("id", String(formData.get("memberId"))).eq("term_id", term!.id);
  if (error) throw new Error(error.message);
  revalidatePath("/members");
  revalidatePath("/activities");
}
