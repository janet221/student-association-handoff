import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { LoginEntry } from "@/components/login-entry";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (data.user) redirect("/dashboard");
  const notice = await searchParams;

  return (
    <main className="login-shell">
      <section className="login-story">
        <div className="brand-lockup"><strong>NCUE IM</strong><span>STUDENT<br />ASSOCIATION</span></div>
        <LoginEntry error={notice.error} message={notice.message} />
        <div className="edition">26th <i /></div>
        <p className="eyebrow">HANDOVER &amp; ACTIVE SYSTEM</p>
        <h1>系學會<br />跨屆工作交接系統</h1>
        <div className="login-art" aria-hidden="true"><span>延續經驗<br />接續行動</span></div>
      </section>
    </main>
  );
}
