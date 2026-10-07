"use client";

import { useState } from "react";
import { login, resendConfirmation, signup } from "@/app/login/actions";

export function LoginEntry({ error, message }: { error?: string; message?: string }) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"login" | "signup">("login");

  return <>
    <button className="login-entry" onClick={() => setOpen(true)}>登入／註冊 <span>→</span></button>
    {open && <section className="auth-overlay" aria-label="登入或註冊">
      <button className="auth-back" onClick={() => setOpen(false)}>← 返回首頁</button>
      <div className="auth-overlay-inner">
        <div className="section-number">01 <span /> ACCOUNT</div>
        <h2>登入或註冊</h2>
        <div className="auth-mode-switch" role="tablist" aria-label="帳號操作">
          <button type="button" className={mode === "login" ? "active" : ""} onClick={() => setMode("login")}>登入帳號</button>
          <button type="button" className={mode === "signup" ? "active" : ""} onClick={() => setMode("signup")}>註冊帳號</button>
        </div>
        {error && <div className="notice error">{error}</div>}
        {message && <div className="notice success">{message}</div>}
        <form className="auth-form">
          {mode === "signup" && <label>姓名<input name="displayName" autoComplete="name" required /></label>}
          <label>電子信箱<input name="email" type="email" autoComplete="email" required /></label>
          <label>密碼<input name="password" type="password" minLength={8} autoComplete={mode === "login" ? "current-password" : "new-password"} required /></label>
          <button formAction={mode === "login" ? login : signup} className="button primary auth-submit">{mode === "login" ? "登入帳號" : "建立帳號"} <span>→</span></button>
        </form>
        {mode === "login" && <form action={resendConfirmation} className="resend-form">
          <label>沒有收到驗證信？<input name="resendEmail" type="email" placeholder="輸入註冊信箱" required /></label>
          <button className="button ghost">重寄驗證信</button>
        </form>}
      </div>
    </section>}
  </>;
}
