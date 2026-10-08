import Link from "next/link";
import { logout } from "@/app/login/actions";

export function AppHeader({ name, role }: { name: string; role: string }) {
  return (
    <header className="app-header">
      <Link href="/activities" className="brand-lockup"><strong>NCUE IM</strong><span>STUDENT<br />ASSOCIATION</span></Link>
      <nav aria-label="主要導覽">
        <Link href="/activities">本屆工作專區</Link>
        <Link href="/history">交接紀錄</Link>
      </nav>
      <div className="account">
        <span><b>{name}</b><small>{role === "admin" ? "管理者" : "一般成員"}</small></span>
        <form action={logout}><button aria-label="登出">↗</button></form>
      </div>
    </header>
  );
}
