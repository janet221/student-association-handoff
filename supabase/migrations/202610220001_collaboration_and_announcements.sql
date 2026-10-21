create table public.collaboration_requests (
  id uuid primary key default gen_random_uuid(),
  activity_id uuid not null references public.activities(id) on delete cascade,
  owner_department text not null,
  support_department text not null,
  description text not null,
  requested_date date,
  status text not null default '待確認' check (status in ('待確認', '已確認', '本屆不需要')),
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  content text not null,
  scope text not null default 'all' check (scope in ('all', 'department')),
  department text,
  is_pinned boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((scope = 'all' and department is null) or (scope = 'department' and department is not null))
);

create index collaboration_requests_activity_idx on public.collaboration_requests(activity_id);
create index collaboration_requests_date_idx on public.collaboration_requests(requested_date);
create index announcements_pinned_idx on public.announcements(is_pinned, created_at desc);

alter table public.collaboration_requests enable row level security;
alter table public.announcements enable row level security;

create policy "authenticated users can read collaboration requests"
on public.collaboration_requests for select to authenticated using (true);
create policy "admins can manage collaboration requests"
on public.collaboration_requests for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "authenticated users can read announcements"
on public.announcements for select to authenticated using (true);
create policy "admins can manage announcements"
on public.announcements for all to authenticated using (public.is_admin()) with check (public.is_admin());
