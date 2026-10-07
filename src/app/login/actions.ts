"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

function authErrorMessage(message: string) {
  if (message.toLowerCase().includes("fetch failed")) return "目前無法連線到登入服務，請確認網路後再試。";
  if (message.includes("security purposes")) return "請稍候約一分鐘再試，短時間內無法重複寄送驗證信。";
  if (message.includes("already registered")) return "此信箱已註冊，請直接登入。";
  if (message.includes("Invalid login credentials")) return "信箱或密碼不正確。";
  if (message.includes("Email not confirmed")) return "請先至信箱完成驗證後再登入。";
  return message;
}

export async function login(formData: FormData) {
  const supabase = await createClient();
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) redirect(`/login?error=${encodeURIComponent(authErrorMessage(error.message))}`);
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

  if (error) redirect(`/login?error=${encodeURIComponent(authErrorMessage(error.message))}`);
  redirect(`/login?message=${encodeURIComponent("註冊完成，請至信箱點擊驗證連結。")}`);
}

export async function resendConfirmation(formData: FormData) {
  const supabase = await createClient();
  const email = String(formData.get("resendEmail") ?? "");
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const { error } = await supabase.auth.resend({
    type: "signup",
    email,
    options: { emailRedirectTo: `${siteUrl}/auth/confirm` },
  });

  if (error) redirect(`/login?error=${encodeURIComponent(authErrorMessage(error.message))}`);
  redirect(`/login?message=${encodeURIComponent("驗證信已重新寄出，請查看收件匣與垃圾郵件。")}`);
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
