import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { login, resendConfirmation, signup } from "./actions";

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
        <details className="login-entry">
          <summary>登入／註冊 <span>→</span></summary>
          <section className="login-panel">
            <div className="section-number">01 <span /> SIGN IN</div>
            <h2>開始本屆工作</h2>
            {notice.error && <div className="notice error">{notice.error}</div>}
            {notice.message && <div className="notice success">{notice.message}</div>}
            <form className="auth-form">
              <label>姓名（註冊時填寫）<input name="displayName" autoComplete="name" /></label>
              <label>電子信箱<input name="email" type="email" autoComplete="email" required /></label>
              <label>密碼<input name="password" type="password" minLength={8} autoComplete="current-password" required /></label>
              <div className="auth-actions">
                <button formAction={login} className="button primary">登入 <span>→</span></button>
                <button formAction={signup} className="button ghost">建立帳號</button>
              </div>
            </form>
            <form action={resendConfirmation} className="resend-form">
              <label>沒有收到驗證信？<input name="resendEmail" type="email" placeholder="輸入註冊信箱" required /></label>
              <button className="button ghost">重寄驗證信</button>
            </form>
          </section>
        </details>
        <div className="edition">27th <i /></div>
        <p className="eyebrow">HANDOVER &amp; ACTIVE SYSTEM</p>
        <h1>系學會<br />跨屆工作交接系統</h1>
        <div className="login-art" aria-hidden="true"><span>延續經驗<br />接續行動</span></div>
      </section>
    </main>
  );
}
