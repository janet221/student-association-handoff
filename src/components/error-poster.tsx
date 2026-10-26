"use client";

type ErrorPosterProps = {
  kind?: "load" | "not-found";
  reset?: () => void;
};

const posterStyles = `
  .soft-error-page{--se-ink:#654851;--se-muted:#967a84;--se-rose:#d982a2;min-height:100svh;display:grid;place-items:center;box-sizing:border-box;padding:clamp(18px,4vw,48px);overflow:hidden;background-color:#fff7fa;background-image:linear-gradient(45deg,rgba(234,173,194,.16) 25%,transparent 25%,transparent 75%,rgba(234,173,194,.16) 75%),linear-gradient(45deg,rgba(234,173,194,.16) 25%,transparent 25%,transparent 75%,rgba(234,173,194,.16) 75%);background-position:0 0,16px 16px;background-size:32px 32px;color:var(--se-ink);font-family:"Noto Serif TC","PingFang TC","Microsoft JhengHei",serif}
  .soft-error-poster{position:relative;isolation:isolate;width:min(100%,720px);box-sizing:border-box;padding:clamp(32px,6vw,62px) clamp(22px,7vw,72px) clamp(44px,7vw,74px);border:1px solid rgba(208,139,163,.58);border-radius:34px 34px 22px 22px;background:linear-gradient(145deg,rgba(255,255,255,.97),rgba(255,246,249,.97));box-shadow:0 18px 44px rgba(141,84,107,.15),inset 0 0 0 7px rgba(255,255,255,.62);text-align:center}
  .soft-error-poster:before{content:"";position:absolute;top:-7px;left:calc(50% - 43px);width:86px;height:20px;border:1px solid rgba(199,132,155,.3);background:repeating-linear-gradient(135deg,rgba(232,176,194,.6) 0 5px,rgba(255,249,251,.92) 5px 10px);box-shadow:0 2px 6px rgba(122,75,91,.08);transform:rotate(-3deg);pointer-events:none}
  .soft-error-poster:after{content:"";position:absolute;left:-1px;right:-1px;bottom:-1px;height:20px;background:url("/images/header-wave.svg") left bottom/180px 20px repeat-x;pointer-events:none}
  .soft-error-kicker{margin:0 0 2px;color:#aa7187;font:600 10px/1.6 Arial,sans-serif;letter-spacing:.2em;text-transform:uppercase}
  .soft-error-title{margin:0;color:var(--se-rose);font:400 clamp(76px,13vw,118px)/.82 "Allura","Segoe Script",cursive;letter-spacing:.015em;text-shadow:0 2px 0 white,0 8px 18px rgba(178,98,127,.12)}
  .soft-error-illustration{position:relative;display:grid;place-items:center;width:min(100%,250px);height:clamp(172px,27vw,208px);margin:14px auto 8px;overflow:hidden;animation:soft-error-bob 3.8s ease-in-out infinite}
  .soft-error-bunny{position:absolute;top:0;left:50%;width:500px;height:auto;max-width:none;transform:translateX(-19%);filter:drop-shadow(0 7px 10px rgba(155,104,124,.12))}
  .soft-error-sticker{position:absolute;display:grid;place-items:center;color:#ce81a0;font:400 27px/1 Georgia,serif;text-shadow:0 1px white;pointer-events:none;animation:soft-error-drift 4.2s ease-in-out infinite}
  .soft-error-sticker.one{top:10px;left:2px}.soft-error-sticker.two{right:8px;top:40px;animation-delay:-1.6s}.soft-error-sticker.three{bottom:2px;right:18px;font-size:20px;animation-delay:-.8s}
  .soft-error-copy{margin:8px 0 0;color:#654851;font:600 clamp(18px,3vw,24px)/1.6 "Noto Serif TC","PingFang TC","Microsoft JhengHei",serif;letter-spacing:.08em}
  .soft-error-description{margin:6px auto 0;color:var(--se-muted);font:400 14px/1.8 "Noto Serif TC","PingFang TC","Microsoft JhengHei",serif;letter-spacing:.04em}
  .soft-error-actions{display:flex;justify-content:center;gap:12px;flex-wrap:wrap;margin-top:28px}
  .soft-error-button{min-width:154px;min-height:48px;display:inline-flex;align-items:center;justify-content:center;gap:9px;padding:0 22px;border:1px solid #d68aa5;border-radius:999px;background:#d982a2;color:#fff;font:600 13px/1 "Noto Serif TC","PingFang TC","Microsoft JhengHei",serif;letter-spacing:.06em;box-shadow:0 6px 14px rgba(184,105,137,.16);cursor:pointer;transition:transform .2s ease,box-shadow .2s ease,background-color .2s ease}
  .soft-error-button.secondary{border-color:rgba(202,137,160,.58);background:rgba(255,251,252,.9);color:#9d657c;box-shadow:0 4px 10px rgba(184,105,137,.07)}
  .soft-error-button:hover{transform:translateY(-2px);box-shadow:0 9px 18px rgba(184,105,137,.21)}.soft-error-button:active{transform:scale(.98)}
  .soft-error-button:focus-visible{outline:3px solid rgba(211,130,162,.32);outline-offset:3px}
  .soft-error-note{margin:22px 0 0;color:#b48797;font:italic 13px/1.5 "Cormorant Garamond",Georgia,serif;letter-spacing:.12em}
  @keyframes soft-error-bob{0%,100%{transform:translateY(0) rotate(-1deg)}50%{transform:translateY(-5px) rotate(1deg)}}
  @keyframes soft-error-drift{0%,100%{transform:translateY(0) rotate(-5deg)}50%{transform:translateY(-5px) rotate(5deg)}}
  @media(max-width:520px){.soft-error-page{padding:16px}.soft-error-poster{padding:38px 20px 46px;border-radius:26px 26px 18px 18px}.soft-error-title{font-size:clamp(68px,19vw,92px)}.soft-error-illustration{height:172px;width:200px}.soft-error-bunny{width:440px;transform:translateX(-19%)}.soft-error-copy{font-size:18px}.soft-error-description{font-size:13px}.soft-error-actions{display:grid;grid-template-columns:1fr;width:min(100%,280px);margin:22px auto 0}.soft-error-button{width:100%;min-height:50px}}
  @media(prefers-reduced-motion:reduce){.soft-error-illustration,.soft-error-sticker{animation:none!important}.soft-error-button{transition:none!important}}
`;

export function ErrorPoster({ kind = "load", reset }: ErrorPosterProps) {
  const isNotFound = kind === "not-found";

  function retry() {
    if (reset) reset();
    else window.location.reload();
  }

  function goBack() {
    if (window.history.length > 1) window.history.back();
    else window.location.assign("/");
  }

  return (
    <main className="soft-error-page" aria-labelledby="soft-error-title">
      <style>{posterStyles}</style>
      <section className="soft-error-poster">
        <p className="soft-error-kicker">A Little Page Detour</p>
        <h1 className="soft-error-title" id="soft-error-title">Oopsie!</h1>
        <div className="soft-error-illustration" aria-hidden="true">
          <span className="soft-error-sticker one">?</span>
          <span className="soft-error-sticker two">✧</span>
          <img className="soft-error-bunny" src="/images/hero-rabbit-left.png" alt="" />
          <span className="soft-error-sticker three">♡</span>
        </div>
        <p className="soft-error-copy">{isNotFound ? "哎呀，這個頁面好像走錯路了 ♡" : "哎呀，這一頁好像迷路了 ♡"}</p>
        <p className="soft-error-description">{isNotFound ? "找不到這個頁面，請返回上一頁或回到首頁。" : "頁面暫時無法載入，請再試一次。"}</p>
        <div className="soft-error-actions">
          <button className="soft-error-button" type="button" onClick={retry}><span aria-hidden="true">↻</span>{reset ? "再試一次" : "重新載入"}</button>
          <button className="soft-error-button secondary" type="button" onClick={goBack}><span aria-hidden="true">←</span>返回上一頁</button>
        </div>
        <p className="soft-error-note">a tiny detour, then back to your story</p>
      </section>
    </main>
  );
}
