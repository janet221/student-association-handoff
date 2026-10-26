"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createPortal, useFormStatus } from "react-dom";
import { enterDemo, login, resendConfirmation, signup } from "@/app/login/actions";
import "./login-entry.css";

function SubmitButton({ children, className, pendingLabel }: { children: React.ReactNode; className: string; pendingLabel: string }) {
  const { pending } = useFormStatus();
  return <button type="submit" className={className} disabled={pending} aria-busy={pending}>{pending ? pendingLabel : children}</button>;
}

export function LoginEntry({ error, message, label = "開始使用", showNotice = false }: { error?: string; message?: string; label?: string; showNotice?: boolean }) {
  const [open, setOpen] = useState(showNotice && Boolean(error || message));
  const [mode, setMode] = useState<"login" | "signup">("login");
  const dialog = useRef<HTMLElement>(null);
  const id = useId();

  useEffect(() => {
    if (!open) return;
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const frame = requestAnimationFrame(() => dialog.current?.querySelector<HTMLElement>("input")?.focus());
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") { event.preventDefault(); setOpen(false); }
      if (event.key !== "Tab") return;
      const elements = Array.from(dialog.current?.querySelectorAll<HTMLElement>('button:not([disabled]), input:not([disabled]), a[href]') ?? []);
      const first = elements[0];
      const last = elements[elements.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKeyDown);
    return () => { cancelAnimationFrame(frame); document.body.style.overflow = previousOverflow; document.removeEventListener("keydown", onKeyDown); previousFocus?.focus(); };
  }, [open]);

  return <>
    <span className="login-entry-wrap">
      <button className="login-entry" onClick={() => setOpen(true)}>{label} <span>→</span></button>
    </span>
    {open && typeof document !== "undefined" && createPortal(<section ref={dialog} className="auth-overlay auth-arch-stage" aria-labelledby={`${id}-title`} role="dialog" aria-modal="true">
      <button type="button" className="auth-back" onClick={() => setOpen(false)}><span aria-hidden="true">←</span> 返回首頁</button>
      <div className="auth-overlay-inner auth-arch-card">
        <span className="auth-crest" aria-hidden="true">✧</span>
        <span className="auth-kicker">NCUE IM · 25—26</span>
        <h2 id={`${id}-title`}>{mode === "login" ? "登入帳號" : "註冊帳號"}</h2>
        <p className="auth-intro">登入後可以查看本屆活動、工作期限、共同月曆和交接紀錄。</p>
        <div className="auth-mode-switch" role="tablist" aria-label="帳號操作">
          <button type="button" role="tab" id={`${id}-login`} aria-selected={mode === "login"} aria-controls={`${id}-panel`} className={mode === "login" ? "active" : ""} onClick={() => setMode("login")}>登入帳號</button>
          <button type="button" role="tab" id={`${id}-signup`} aria-selected={mode === "signup"} aria-controls={`${id}-panel`} className={mode === "signup" ? "active" : ""} onClick={() => setMode("signup")}>註冊帳號</button>
        </div>
        {error && <div className="notice error" role="alert">{error}</div>}
        {message && <div className="notice success" role="status">{message}</div>}
        <form action={mode === "login" ? login : signup} className="auth-form" role="tabpanel" id={`${id}-panel`} aria-labelledby={`${id}-${mode}`}>
          {mode === "signup" && <label>姓名<input name="displayName" placeholder="你的名字" autoComplete="name" required /></label>}
          <label>電子信箱<input name="email" type="email" placeholder="you@example.com" autoComplete="email" required /></label>
          <label>密碼<input name="password" type="password" placeholder={mode === "signup" ? "設定至少 8 位數密碼" : "輸入你的密碼"} minLength={8} autoComplete={mode === "login" ? "current-password" : "new-password"} required /></label>
          <SubmitButton className="button primary auth-submit" pendingLabel={mode === "login" ? "登入中…" : "建立中…"}>{mode === "login" ? "登入帳號" : "建立帳號"} <span aria-hidden="true">→</span></SubmitButton>
        </form>
        {mode === "login" && <div className="auth-support-footer">
          <p className="auth-support-caption">沒有收到驗證信？</p>
          <div className="auth-support-actions">
            <form action={resendConfirmation} className="resend-form">
              <label className="auth-resend-label"><span className="auth-sr-only">註冊信箱</span><input name="resendEmail" type="email" placeholder="輸入註冊信箱" autoComplete="email" required /></label>
              <SubmitButton className="auth-resend-submit" pendingLabel="寄送中…">重寄驗證信</SubmitButton>
            </form>
            <form action={enterDemo} className="auth-demo-form">
              <SubmitButton className="auth-demo-button" pendingLabel="開啟中…">免金鑰展示入口 <span aria-hidden="true">↗</span></SubmitButton>
            </form>
          </div>
        </div>}
      </div>
    </section>, document.body)}
  </>;
}
