import { AppHeader } from "@/components/app-header";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const localTestSession = process.env.NODE_ENV !== "production" && (await cookies()).get("local_test_session")?.value === "1";
  if (!user && !localTestSession) redirect("/login");
  const { data: profile } = user
    ? await supabase.from("profiles").select("display_name, role").eq("id", user.id).single()
    : { data: null };

  return (
    <div className="app-shell">
      <AppHeader name={profile?.display_name ?? user?.email?.split("@")[0] ?? "本機測試成員"} role={profile?.role ?? "member"} />
      {children}
      <footer className="app-footer"><small>NCUE IM Student Association · 2026</small></footer>
    </div>
  );
}
