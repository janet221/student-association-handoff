-- Align activities, announcements and calendar records without removing existing data.
alter table public.activities add column if not exists department text;
alter table public.activities add column if not exists activity_end_date date;
alter table public.activities add constraint activities_date_range_check check (activity_end_date is null or activity_date is null or activity_end_date >= activity_date);
update public.activities
set department = case when name in ('系運', '商管盃') then '體育股' else coalesce(department, '會長') end
where department is null;
create index if not exists activities_department_idx on public.activities(department);

alter table public.announcements add column if not exists summary text;
alter table public.announcements add column if not exists published_on date;
alter table public.announcements add column if not exists author_department text;
alter table public.announcements add column if not exists announcement_type text not null default 'general' check (announcement_type in ('collaboration', 'notice', 'coordination', 'general'));
alter table public.announcements add column if not exists target_department text;
update public.announcements set published_on = created_at::date where published_on is null;
update public.announcements set summary = left(content, 120) where summary is null;
create index if not exists announcements_published_on_idx on public.announcements(published_on desc);

create table if not exists public.handover_entries (
  id uuid primary key default gen_random_uuid(),
  term_id uuid not null references public.terms(id) on delete cascade,
  department text not null,
  activity_id uuid references public.activities(id) on delete cascade,
  kind text not null default 'note' check (kind in ('note', 'workflow', 'warning', 'schedule')),
  content text not null check (char_length(trim(content)) > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists handover_entries_department_idx on public.handover_entries(department, created_at desc);
create index if not exists handover_entries_activity_idx on public.handover_entries(activity_id, created_at desc);
alter table public.handover_entries enable row level security;
create policy "authenticated users can read handover entries" on public.handover_entries for select to authenticated using (true);
create policy "admins can manage handover entries" on public.handover_entries for all to authenticated using (public.is_admin()) with check (public.is_admin());
