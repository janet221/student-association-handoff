import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { PrismaHero } from "@/components/ui/prisma-hero";
import { LandingContent } from "@/components/landing-content";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (data.user) redirect("/dashboard");
  const notice = await searchParams;
  const { data: currentTerm } = await supabase.from("terms").select("ordinal, handover_from_term_id, handover_completed").eq("is_current", true).maybeSingle();
  const { data: handoverFrom } = currentTerm?.handover_from_term_id
    ? await supabase.from("terms").select("ordinal").eq("id", currentTerm.handover_from_term_id).maybeSingle()
    : { data: null };
  const handoverLabel = handoverFrom && currentTerm ? `${handoverFrom.ordinal} ➔ ${currentTerm.ordinal}` : currentTerm ? `${currentTerm.ordinal}th` : "25 ➔ 26";

  return (
    <main className="login-shell">
      <PrismaHero handoverLabel={handoverLabel} error={notice.error} message={notice.message} />
      <LandingContent />
      <footer className="landing-footer"><small>NCUE IM Student Association · 2026</small></footer>
    </main>
  );
}
