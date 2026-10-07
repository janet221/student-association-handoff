alter table public.terms
  add column if not exists handover_from_term_id uuid references public.terms(id) on delete set null,
  add column if not exists handover_completed boolean not null default false;

comment on column public.terms.handover_from_term_id is '上一屆交接來源年度，用於首頁顯示交接範圍。';
comment on column public.terms.handover_completed is '是否已完成上一屆到本屆的交接。';

update public.terms current_term
set handover_from_term_id = previous_term.id
from public.terms previous_term
where current_term.ordinal = 26
  and previous_term.ordinal = 25
  and current_term.handover_from_term_id is null;

create policy "public can read current handover display"
on public.terms for select to anon
using (true);
