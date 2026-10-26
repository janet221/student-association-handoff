import Link from "next/link";
import type { HandoverEntry, HandoverRecord } from "@/lib/handover-workspace";
import {
  addHandoverEntry,
  createHandoverRecord,
  deleteHandoverEntry,
  moveHandoverEntry,
  publishHandover,
  saveDriveLink,
  saveWelcomeMessage,
  unpublishHandover,
  updateHandoverEntry,
} from "@/app/(app)/handover-actions";

type Props = {
  record: HandoverRecord | null;
  entries: HandoverEntry[];
  termId: string | null;
  departmentId: string;
  department: string;
  activityId?: string | null;
  activityName?: string;
  legacyDriveUrl?: string | null;
  editable: boolean;
  showWelcome?: boolean;
  returnTo: string;
  backHref?: string;
};

function CreateRecord({ props }: { props: Props }) {
  if (!props.editable || !props.termId) return <><div className="handover-empty-paper">學長姐還沒有留下交接內容 ♡</div>{props.legacyDriveUrl && <a className="handover-drive-link" href={props.legacyDriveUrl} target="_blank" rel="noopener noreferrer">查看既有雲端資料夾 <span aria-hidden="true">↗</span></a>}</>;
  return <><form className="handover-create-record" action={createHandoverRecord}>
    <input type="hidden" name="termId" value={props.termId} />
    <input type="hidden" name="departmentId" value={props.departmentId} />
    <input type="hidden" name="activityId" value={props.activityId ?? ""} />
    <input type="hidden" name="returnTo" value={props.returnTo} />
    <p>這個{props.activityName ? `「${props.activityName}」` : props.department}還沒有建立交接資料。</p>
    <button className="handover-primary-button" type="submit">建立交接草稿 <span>→</span></button>
  </form>{props.legacyDriveUrl && <a className="handover-drive-link" href={props.legacyDriveUrl} target="_blank" rel="noopener noreferrer">查看既有雲端資料夾 <span aria-hidden="true">↗</span></a>}</>;
}

export function HandoverWorkspace(props: Props) {
  const { record } = props;
  if (!record) return <CreateRecord props={props} />;
  const notes = props.entries.filter((entry) => ["note", "warning"].includes(entry.kind)).sort(orderEntries);
  const workflow = props.entries.filter((entry) => ["workflow", "schedule"].includes(entry.kind)).sort(orderEntries);
  const driveUrl = record.drive_url || props.legacyDriveUrl || "";
  const visibleWelcome = props.showWelcome && record.welcome_visible && record.welcome_message.trim();
  const showEmpty = !visibleWelcome && notes.length === 0 && workflow.length === 0 && !driveUrl;

  return <div className="handover-workspace" data-mode={props.editable ? "edit" : "read"}>
    <div className="handover-workspace-topline">
      <div><small>{record.department} · {props.activityName ?? "職位交接"}</small><span className={record.is_published ? "handover-status is-published" : "handover-status"}>{record.is_published ? "已發布" : "草稿"}</span></div>
      <p>最後更新 {new Date(record.updated_at).toLocaleString("zh-TW", { dateStyle: "medium", timeStyle: "short" })}</p>
    </div>

    {props.showWelcome && <section className="handover-welcome-section">
      <div className="handover-section-heading"><span>01 · A NOTE FOR THE NEXT TEAM</span><h2>給下一屆的話</h2></div>
      {props.editable ? <form action={saveWelcomeMessage} className="handover-welcome-form">
        <input type="hidden" name="recordId" value={record.id} />
        <textarea name="welcomeMessage" defaultValue={record.welcome_message} rows={3} maxLength={4000} placeholder="寫一段給下一屆幹部的話（選填）" />
        <label className="handover-check"><input type="checkbox" name="welcomeVisible" defaultChecked={record.welcome_visible} />發布時顯示給下一屆</label>
        <button className="handover-soft-button" type="submit">儲存留言</button>
      </form> : visibleWelcome ? <blockquote className="handover-welcome-note">{record.welcome_message}</blockquote> : <p className="handover-empty-inline">尚未設定歡迎留言。</p>}
    </section>}

    {props.editable ? <DriveEditor record={record} legacyDriveUrl={props.legacyDriveUrl} /> : driveUrl ? <a className="handover-drive-link" href={driveUrl} target="_blank" rel="noopener noreferrer">查看雲端交接資料夾 <span aria-hidden="true">↗</span></a> : <div className="handover-drive-empty">尚未設定雲端資料夾</div>}

    <section className="handover-note-section">
      <div className="handover-section-heading"><span>02 · NOTES</span><h2>交接便條</h2></div>
      {notes.length ? <div className="handover-note-list">{notes.map((entry) => { const sameKind = notes.filter((item) => item.kind === entry.kind); return <EntryCard key={entry.id} entry={entry} index={sameKind.findIndex((item) => item.id === entry.id)} rows={sameKind.length} recordId={record.id} editable={props.editable} />; })}</div> : !props.editable && <p className="handover-empty-inline">學長姐還沒有留下交接小紙條 ♡</p>}
      {props.editable && <form action={addHandoverEntry} className="handover-add-note-form">
        <input type="hidden" name="recordId" value={record.id} /><input type="hidden" name="kind" value="note" />
        <label>新增便條<textarea name="content" rows={3} required maxLength={8000} placeholder="記下經驗、注意事項或實用提醒" /></label>
        <button className="handover-soft-button" type="submit">＋ 新增便條</button>
      </form>}
    </section>

    <section className="handover-timeline-section">
      <div className="handover-section-heading"><span>03 · TIMELINE</span><h2>時間流程表</h2></div>
      {workflow.length ? <div className="handover-timeline-list">{workflow.map((entry) => { const sameKind = workflow.filter((item) => item.kind === entry.kind); return <WorkflowRow key={entry.id} entry={entry} index={sameKind.findIndex((item) => item.id === entry.id)} rows={sameKind.length} recordId={record.id} editable={props.editable} />; })}</div> : !props.editable && <p className="handover-empty-inline">尚未整理流程項目。</p>}
      {props.editable && <form action={addHandoverEntry} className="handover-workflow-add">
        <input type="hidden" name="recordId" value={record.id} /><input type="hidden" name="kind" value="workflow" />
        <label>時間／階段<input name="workflowTime" placeholder="例：活動前兩週" /></label>
        <label>工作事項<input name="content" required maxLength={8000} placeholder="要完成的工作" /></label>
        <label className="handover-wide-field">詳細備註<textarea name="workflowNote" rows={2} placeholder="補充做法、聯絡對象或注意事項" /></label>
        <button className="handover-soft-button" type="submit">＋ 新增流程</button>
      </form>}
    </section>

    {props.editable && <footer className="handover-publish-footer">
      <p>{record.is_published ? "下一屆目前看得到這份交接資料。儲存任何修改後會先轉為草稿。" : "草稿只會出現在 Archives；發布後才會同步到 Our Team。"}</p>
      {record.is_published ? <form action={unpublishHandover}><input type="hidden" name="recordId" value={record.id} /><button className="handover-soft-button" type="submit">暫停發布</button></form> : <form action={publishHandover}><input type="hidden" name="recordId" value={record.id} /><button className="handover-primary-button" type="submit">發布給下一屆 <span>→</span></button></form>}
    </footer>}
    {showEmpty && !props.editable && <p className="handover-empty-inline">學長姐還沒有留下交接內容 ♡</p>}
    <Link className="handover-return-link" href={props.backHref ?? props.returnTo}>← 返回{props.activityId ? "活動清單" : "單位列表"}</Link>
  </div>;
}

function DriveEditor({ record, legacyDriveUrl }: { record: HandoverRecord; legacyDriveUrl?: string | null }) {
  return <form action={saveDriveLink} className="handover-drive-editor">
    <input type="hidden" name="recordId" value={record.id} />
    <label>雲端資料夾連結<input name="driveUrl" type="url" defaultValue={record.drive_url || legacyDriveUrl || ""} placeholder="https://drive.google.com/drive/folders/..." /></label>
    <button className="handover-soft-button" type="submit">儲存連結</button>
    {record.drive_url && <a href={record.drive_url} target="_blank" rel="noopener noreferrer">開啟目前資料夾 ↗</a>}
  </form>;
}

function EntryCard({ entry, index, rows, recordId, editable }: { entry: HandoverEntry; index: number; rows: number; recordId: string; editable: boolean }) {
  const formId = `save-note-${entry.id}`;
  return <article className={`handover-note-card handover-note-card-${index % 3}`}>
    {editable ? <>
      <form id={formId} action={updateHandoverEntry}>
      <input type="hidden" name="recordId" value={recordId} /><input type="hidden" name="entryId" value={entry.id} /><input type="hidden" name="kind" value={entry.kind} />
      <textarea name="content" defaultValue={entry.content} rows={3} required maxLength={8000} aria-label="編輯交接便條" />
      </form>
      <EntryActions entry={entry} index={index} rows={rows} recordId={recordId} formId={formId} />
    </> : <p>{entry.content}</p>}
  </article>;
}

function WorkflowRow({ entry, index, rows, recordId, editable }: { entry: HandoverEntry; index: number; rows: number; recordId: string; editable: boolean }) {
  const formId = `save-workflow-${entry.id}`;
  return <article className="handover-workflow-row">
    {editable ? <>
      <form id={formId} action={updateHandoverEntry} className="handover-workflow-edit">
      <input type="hidden" name="recordId" value={recordId} /><input type="hidden" name="entryId" value={entry.id} /><input type="hidden" name="kind" value={entry.kind} />
      <label>時間／階段<input name="workflowTime" defaultValue={entry.workflow_time ?? ""} placeholder="例：活動前兩週" /></label>
      <label>工作事項<input name="content" defaultValue={entry.content} required maxLength={8000} /></label>
      <label className="handover-wide-field">詳細備註<textarea name="workflowNote" defaultValue={entry.workflow_note ?? ""} rows={2} /></label>
      </form>
      <EntryActions entry={entry} index={index} rows={rows} recordId={recordId} formId={formId} />
    </> : <><time>{entry.workflow_time || "待補時間"}</time><div><h3>{entry.content}</h3>{entry.workflow_note && <p>{entry.workflow_note}</p>}</div></>}
  </article>;
}

function EntryActions({ entry, index, rows, recordId, formId }: { entry: HandoverEntry; index: number; rows: number; recordId: string; formId: string }) {
  return <div className="handover-entry-actions">
    <button className="handover-mini-button" type="submit" form={formId}>儲存</button>
    <form action={moveHandoverEntry}><input type="hidden" name="recordId" value={recordId} /><input type="hidden" name="entryId" value={entry.id} /><input type="hidden" name="direction" value="up" /><button className="handover-mini-button" type="submit" disabled={index === 0} aria-label="上移">↑</button></form>
    <form action={moveHandoverEntry}><input type="hidden" name="recordId" value={recordId} /><input type="hidden" name="entryId" value={entry.id} /><input type="hidden" name="direction" value="down" /><button className="handover-mini-button" type="submit" disabled={index === rows - 1} aria-label="下移">↓</button></form>
    <form action={deleteHandoverEntry}><input type="hidden" name="recordId" value={recordId} /><input type="hidden" name="entryId" value={entry.id} /><button className="handover-mini-button is-delete" type="submit">刪除</button></form>
  </div>;
}

function orderEntries(a: HandoverEntry, b: HandoverEntry) {
  return a.position - b.position || a.created_at.localeCompare(b.created_at);
}
