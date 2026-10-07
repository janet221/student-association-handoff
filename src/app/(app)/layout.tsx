import { AppHeader } from "@/components/app-header";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase.from("profiles").select("display_name, role").eq("id", user.id).single();

  return (
    <div className="app-shell">
      <AppHeader name={profile?.display_name ?? user.email?.split("@")[0] ?? "成員"} role={profile?.role ?? "member"} />
      {children}
      <footer><b>NCUE IM</b><small>© 2026 NCUE IM Student Association.</small></footer>
    </div>
  );
}
