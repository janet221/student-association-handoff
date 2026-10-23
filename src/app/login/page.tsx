import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { GravityLanding } from "@/components/gravity-landing";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  const localOnly = !process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  const supabase = localOnly ? null : await createClient();
  const { data } = supabase ? await supabase.auth.getUser() : { data: { user: null } };
  if (data.user) redirect("/dashboard");
  const notice = await searchParams;

  return <GravityLanding error={notice.error} message={notice.message} />;
}
