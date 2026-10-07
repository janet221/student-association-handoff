alter table public.document_links
  add column if not exists description text,
  add column if not exists handover_note text;

comment on column public.document_links.description is '固定的文件用途簡介。';
comment on column public.document_links.handover_note is '學長姐針對這份文件補充的交接說明。';
