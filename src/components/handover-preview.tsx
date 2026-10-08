"use client";

import { useState } from "react";

export function HandoverPreview({ title, description }: { title: string; description: string }) {
  const [open, setOpen] = useState(false);
  return <>
    <button type="button" className="preview-trigger" onClick={() => setOpen(true)}>查看學弟妹看到的內容</button>
    {open && <div className="preview-modal-backdrop" role="presentation" onClick={() => setOpen(false)}>
      <section className="preview-modal" role="dialog" aria-modal="true" aria-label="學弟妹看到的工作內容" onClick={(event) => event.stopPropagation()}>
        <button type="button" className="preview-modal-close" aria-label="關閉預覽" onClick={() => setOpen(false)}>×</button>
        <small>本屆工作</small>
        <h3>{title}</h3>
        <p>{description || "目前沒有補充說明。"}</p>
        <div className="preview-modal-rule" />
        <span>學弟妹看到的工作內容</span>
      </section>
    </div>}
  </>;
}
