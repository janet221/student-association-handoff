create extension if not exists pgcrypto;

create type public.user_role as enum ('member', 'admin');
create type public.activity_status as enum ('planning', 'active', 'completed', 'archived');
create type public.task_status as enum ('todo', 'in_progress', 'blocked', 'completed');
create type public.task_priority as enum ('low', 'medium', 'high', 'urgent');
create type public.deadline_type as enum ('fixed_date', 'relative_to_activity');
create type public.experience_kind as enum ('note', 'tip', 'warning', 'outcome');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (char_length(trim(display_name)) between 1 and 80),
  role public.user_role not null default 'member',
  department_role text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.terms (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  ordinal integer not null check (ordinal > 0),
  academic_year text,
  starts_on date,
  ends_on date,
  is_current boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (ordinal),
  check (ends_on is null or starts_on is null or ends_on >= starts_on)
);

create unique index terms_one_current_idx on public.terms (is_current) where is_current;

create table public.activities (
  id uuid primary key default gen_random_uuid(),
  term_id uuid not null references public.terms(id) on delete restrict,
  source_activity_id uuid references public.activities(id) on delete set null,
  name text not null,
  description text,
  status public.activity_status not null default 'planning',
  activity_date date,
  archived_at timestamptz,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (term_id, name),
  check ((status = 'archived' and archived_at is not null) or status <> 'archived')
);

create table public.phases (
  id uuid primary key default gen_random_uuid(),
  activity_id uuid not null references public.activities(id) on delete cascade,
  source_phase_id uuid references public.phases(id) on delete set null,
  name text not null,
  description text,
  position integer not null default 0 check (position >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (activity_id, position)
);

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  phase_id uuid not null references public.phases(id) on delete cascade,
  source_task_id uuid references public.tasks(id) on delete set null,
  name text not null,
  description text,
  checklist jsonb not null default '[]'::jsonb,
  status public.task_status not null default 'todo',
  priority public.task_priority not null default 'medium',
  deadline_type public.deadline_type,
  fixed_deadline date,
  relative_days integer,
  execution_note text,
  position integer not null default 0 check (position >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (phase_id, position),
  check (jsonb_typeof(checklist) = 'array'),
  check (
    (deadline_type is null and fixed_deadline is null and relative_days is null)
    or (deadline_type = 'fixed_date' and fixed_deadline is not null and relative_days is null)
    or (deadline_type = 'relative_to_activity' and relative_days is not null and fixed_deadline is null)
  )
);

create table public.task_dependencies (
  task_id uuid not null references public.tasks(id) on delete cascade,
  depends_on_task_id uuid not null references public.tasks(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (task_id, depends_on_task_id),
  check (task_id <> depends_on_task_id)
);

create table public.members (
  id uuid primary key default gen_random_uuid(),
  term_id uuid not null references public.terms(id) on delete cascade,
  profile_id uuid references public.profiles(id) on delete set null,
  name text not null,
  department_role text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (term_id, name)
);

create table public.activity_roles (
  id uuid primary key default gen_random_uuid(),
  activity_id uuid not null references public.activities(id) on delete cascade,
  source_role_id uuid references public.activity_roles(id) on delete set null,
  name text not null,
  description text,
  position integer not null default 0 check (position >= 0),
  created_at timestamptz not null default now(),
  unique (activity_id, name)
);

create table public.assignments (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks(id) on delete cascade,
  member_id uuid not null references public.members(id) on delete cascade,
  activity_role_id uuid references public.activity_roles(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (task_id, member_id)
);

create table public.equipment (
  id uuid primary key default gen_random_uuid(),
  activity_id uuid not null references public.activities(id) on delete cascade,
  source_equipment_id uuid references public.equipment(id) on delete set null,
  name text not null,
  quantity integer not null default 1 check (quantity > 0),
  is_confirmed boolean not null default false,
  note text,
  document_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (activity_id, name)
);

create table public.document_links (
  id uuid primary key default gen_random_uuid(),
  activity_id uuid not null references public.activities(id) on delete cascade,
  task_id uuid references public.tasks(id) on delete cascade,
  source_document_id uuid references public.document_links(id) on delete set null,
  name text not null,
  url text not null check (url ~ '^https?://'),
  document_type text not null default 'other',
  is_reusable boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.experiences (
  id uuid primary key default gen_random_uuid(),
  activity_id uuid not null references public.activities(id) on delete cascade,
  task_id uuid references public.tasks(id) on delete cascade,
  author_id uuid references public.members(id) on delete set null,
  kind public.experience_kind not null default 'note',
  content text not null check (char_length(trim(content)) > 0),
  inherited_from_id uuid references public.experiences(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index activities_term_id_idx on public.activities(term_id);
create index activities_source_activity_id_idx on public.activities(source_activity_id);
create index phases_activity_id_idx on public.phases(activity_id);
create index tasks_phase_id_idx on public.tasks(phase_id);
create index tasks_status_priority_idx on public.tasks(status, priority);
create index task_dependencies_depends_on_idx on public.task_dependencies(depends_on_task_id);
create index members_term_id_idx on public.members(term_id);
create index assignments_member_id_idx on public.assignments(member_id);
create index equipment_activity_id_idx on public.equipment(activity_id);
create index document_links_activity_id_idx on public.document_links(activity_id);
create index document_links_task_id_idx on public.document_links(task_id);
create index experiences_activity_id_idx on public.experiences(activity_id);
create index experiences_task_id_idx on public.experiences(task_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at before update on public.profiles
for each row execute function public.set_updated_at();
create trigger terms_set_updated_at before update on public.terms
for each row execute function public.set_updated_at();
create trigger activities_set_updated_at before update on public.activities
for each row execute function public.set_updated_at();
create trigger phases_set_updated_at before update on public.phases
for each row execute function public.set_updated_at();
create trigger tasks_set_updated_at before update on public.tasks
for each row execute function public.set_updated_at();
create trigger members_set_updated_at before update on public.members
for each row execute function public.set_updated_at();
create trigger equipment_set_updated_at before update on public.equipment
for each row execute function public.set_updated_at();
create trigger document_links_set_updated_at before update on public.document_links
for each row execute function public.set_updated_at();
create trigger experiences_set_updated_at before update on public.experiences
for each row execute function public.set_updated_at();

create or replace function public.task_effective_deadline(target_task public.tasks)
returns date
language sql
stable
set search_path = ''
as $$
  select case target_task.deadline_type
    when 'fixed_date' then target_task.fixed_deadline
    when 'relative_to_activity' then activity.activity_date + target_task.relative_days
    else null
  end
  from public.phases phase
  join public.activities activity on activity.id = phase.activity_id
  where phase.id = target_task.phase_id;
$$;

create or replace view public.task_dashboard as
select
  task.id,
  activity.id as activity_id,
  activity.term_id,
  activity.name as activity_name,
  phase.name as phase_name,
  task.name,
  task.description,
  task.status,
  task.priority,
  task.deadline_type,
  public.task_effective_deadline(task) as effective_deadline,
  coalesce(
    jsonb_agg(
      jsonb_build_object('id', dependency.id, 'name', dependency.name)
      order by dependency.name
    ) filter (where dependency.id is not null and dependency.status <> 'completed'),
    '[]'::jsonb
  ) as waiting_for
from public.tasks task
join public.phases phase on phase.id = task.phase_id
join public.activities activity on activity.id = phase.activity_id
left join public.task_dependencies link on link.task_id = task.id
left join public.tasks dependency on dependency.id = link.depends_on_task_id
group by task.id, activity.id, phase.id;

alter table public.profiles enable row level security;
alter table public.terms enable row level security;
alter table public.activities enable row level security;
alter table public.phases enable row level security;
alter table public.tasks enable row level security;
alter table public.task_dependencies enable row level security;
alter table public.members enable row level security;
alter table public.activity_roles enable row level security;
alter table public.assignments enable row level security;
alter table public.equipment enable row level security;
alter table public.document_links enable row level security;
alter table public.experiences enable row level security;
