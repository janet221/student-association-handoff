"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function login(formData: FormData) {
  const supabase = await createClient();
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) redirect(`/login?error=${encodeURIComponent("登入失敗，請確認信箱、密碼或驗證狀態。")}`);
  redirect("/dashboard");
}

export async function signup(formData: FormData) {
  const supabase = await createClient();
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const displayName = String(formData.get("displayName") ?? "");
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { display_name: displayName },
      emailRedirectTo: `${siteUrl}/auth/confirm`,
    },
  });

  if (error) redirect(`/login?error=${encodeURIComponent(error.message)}`);
  redirect(`/login?message=${encodeURIComponent("註冊完成，請至信箱點擊驗證連結。")}`);
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
