import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Image from "next/image";
import { LoginEntry } from "@/components/login-entry";
import { LandingContent } from "@/components/landing-content";
import { TimeSticker } from "@/components/y2k-effects";

const ribbonBand = "M919 24 C1019 210 919 370 719 520 C529 660 349 760 409 970 C469 1180 919 1180 889 1400 C859 1620 329 1650 359 1880 C389 2110 889 2110 839 2330 C789 2540 489 2680 319 2980 L341 2980 C511 2680 811 2540 861 2330 C911 2110 411 2110 381 1880 C351 1650 881 1620 911 1400 C941 1180 491 1180 431 970 C371 760 551 660 741 520 C941 370 1041 210 941 24 Z";
const ribbonCenter = "M930 24 C1030 210 930 370 730 520 C540 660 360 760 420 970 C480 1180 930 1180 900 1400 C870 1620 340 1650 370 1880 C400 2110 900 2110 850 2330 C800 2540 500 2680 330 2980";

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
  const { data: currentTerm } = supabase ? await supabase.from("terms").select("ordinal, handover_from_term_id, handover_completed").eq("is_current", true).maybeSingle() : { data: null };
  const { data: handoverFrom } = supabase && currentTerm?.handover_from_term_id
    ? await supabase.from("terms").select("ordinal").eq("id", currentTerm.handover_from_term_id).maybeSingle()
    : { data: null };
  const handoverLabel = handoverFrom && currentTerm ? `${handoverFrom.ordinal} ➔ ${currentTerm.ordinal}` : currentTerm ? `${currentTerm.ordinal}th` : "25 ➔ 26";

  return (
    <main className="login-shell">
      <header className="landing-nav" id="site-header">
        <a href="#top" className="brand-lockup">
          <Image src="/images/winged-cat-heart-logo-deep-rose.png" alt="深粉色抱心飛天貓手繪標誌" width={72} height={72} priority />
          <span className="brand-copy"><strong>NCUE IM</strong><small>STUDENT ASSOCIATION</small></span>
        </a>
        <TimeSticker />
        <nav aria-label="首頁導覽"><a href="#about">專案理念</a><a href="#operation">如何運作</a><LoginEntry error={notice.error} message={notice.message} showNotice /></nav>
      </header>
      <div className="landing-page-card">
        <section className="login-story" id="top">
          <div className="journey-ribbon" aria-hidden="true">
            <svg viewBox="0 0 1200 3000" preserveAspectRatio="none">
              <defs>
                <linearGradient id="journey-satin" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0" stopColor="#eed0dc" />
                  <stop offset=".5" stopColor="#e7bfd0" />
                  <stop offset="1" stopColor="#f4dce5" />
                </linearGradient>
              </defs>
              <path className="journey-ribbon-shadow" d={ribbonBand} />
              <path className="journey-ribbon-fabric" d={ribbonBand} />
              <path className="journey-ribbon-highlight" d={ribbonCenter} />
            </svg>
          </div>
          <div className="edition hero-reveal hero-edition">{handoverLabel.includes("➔") ? <><span>{handoverLabel.split(" ➔ ")[0]}</span><b className="handover-arrow" aria-label="交接至" /><span>{handoverLabel.split(" ➔ ")[1]}</span></> : <span>{handoverLabel}</span>}</div>
          <p className="eyebrow hero-reveal hero-eyebrow">HANDOVER &amp; ACTIVE SYSTEM</p>
          <h1 className="hero-title">
            <span>資管系學會</span>
            <span>跨股協作與換屆交接平台</span>
          </h1>
          <div className="hero-cta hero-reveal nitro-burst"><LoginEntry error={notice.error} message={notice.message} label="開始使用" /></div>
          <div className="login-art hero-art nitro-burst" aria-hidden="true">
            <span className="hero-art-layer hero-art-fountain"><Image src="/images/hero-fountain-only.png" alt="" width={1163} height={1352} priority /></span>
            <span className="hero-art-layer hero-art-rabbit-left"><Image src="/images/hero-rabbit-left.png" alt="" width={1163} height={1352} /></span>
            <span className="hero-art-layer hero-art-rabbit-right"><Image src="/images/hero-rabbit-right.png" alt="" width={1163} height={1352} /></span>
            <span>留下做法<br />接著處理</span>
            <i className="hero-star hero-star-one" />
            <i className="hero-star hero-star-two" />
            <i className="sculpture-sparkle sculpture-sparkle-one" />
            <i className="sculpture-sparkle sculpture-sparkle-two" />
            <i className="sculpture-sparkle sculpture-sparkle-three" />
            <i className="hero-sticker">OPEN<br /><b>25—26</b></i>
          </div>
          <div className="hero-poster-note" aria-hidden="true">KEEP IT<br /><em>in the story</em></div>
          <a className="scroll-guidance" href="#about" aria-label="往下查看平台說明">
            <span>往下查看 <b aria-hidden="true">🎀</b></span>
            <i aria-hidden="true">↓</i>
          </a>
        </section>
        <LandingContent />
      </div>
      <footer className="landing-footer"><small>NCUE IM Student Association · 2026</small></footer>
    </main>
  );
}
