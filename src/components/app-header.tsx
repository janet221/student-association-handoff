import Link from "next/link";
import Image from "next/image";
import { logout } from "@/app/login/actions";

export function AppHeader({ name, role }: { name: string; role: string }) {
  const active = (_href: string) => false;
  return (
    <header className="app-header">
      <Link href="/activities" className="brand-lockup">
        <Image src="/images/winged-cat-heart-logo-deep-rose.png" alt="深粉色抱心飛天貓手繪標誌" width={58} height={58} priority />
        <span className="brand-copy"><strong>NCUE IM</strong><small>STUDENT<br />ASSOCIATION</small></span>
      </Link>
      <nav aria-label="主要導覽">
        <Link href="/dashboard" className={active("/dashboard") ? "is-active" : ""}>活動總覽</Link>
        <Link href="/calendar" className={active("/calendar") ? "is-active" : ""}>共同月曆</Link>
        <Link href="/announcements" className={active("/announcements") ? "is-active" : ""}>公告欄</Link>
        <Link href="/activities" className={active("/activities") ? "is-active" : ""}>本屆工作</Link>
        <Link href="/history" className={active("/history") ? "is-active" : ""}>交接紀錄</Link>
      </nav>
      <div className="account">
        <span><b>{name}</b><small>{role === "admin" ? "管理者" : "一般成員"}</small></span>
        <form action={logout}><button aria-label="登出">↗</button></form>
      </div>
    </header>
  );
}
