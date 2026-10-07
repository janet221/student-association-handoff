"use client";

import { inheritActivity } from "@/app/(app)/activities/actions";

export function InheritActivityForm({ sourceActivity, targetTerm, targetOrdinal, activityName }: { sourceActivity: string; targetTerm: string; targetOrdinal: number; activityName: string }) {
  return <form action={inheritActivity} onSubmit={(event) => {
    if (!window.confirm(`建立第 ${targetOrdinal} 屆${activityName}？\n\n工作架構與器材需求會帶入本屆；日期、場地、負責人和狀態會重新設定。`)) event.preventDefault();
  }}>
    <input type="hidden" name="sourceActivity" value={sourceActivity} />
    <input type="hidden" name="targetTerm" value={targetTerm} />
    <small>建立新的本屆活動，歷屆資料會保留。</small>
    <button className="button primary">以此建立本屆{activityName} →</button>
  </form>;
}
