-- Shared handover records for the Archives editor and Our Team reader.
-- Existing handover entries are grouped into published records so current data
-- remains visible after this migration.

create or replace function public.can_manage_handover(target_department_id text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.is_admin() or exists (
    select 1
    from public.members member
    where member.profile_id = auth.uid()
      and member.is_active
      and lower(trim(coalesce(member.department_role, ''))) in (
        lower(trim(target_department_id)),
        lower(case target_department_id
          when 'president' then '會長'
          when 'vice-president' then '副會長'
          when 'secretary' then '執秘'
          when 'general-affairs' then '總務'
          when 'sports' then '體育股'
          when 'design' then '美宣股'
          when 'equipment' then '器材股'
          when 'activities' then '活動股'
          when 'information' then '資訊股'
          else target_department_id
        end)
      )
  );
$$;

create table public.handover_records (
  id uuid primary key default gen_random_uuid(),
  term_id uuid not null references public.terms(id) on delete cascade,
  department_id text not null,
  department text not null,
  activity_id uuid references public.activities(id) on delete cascade,
  welcome_message text not null default '',
  welcome_visible boolean not null default false,
  drive_url text not null default '' check (drive_url = '' or drive_url ~ '^https://(drive|docs)\.google\.com/'),
  is_published boolean not null default false,
  published_at timestamptz,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique nulls not distinct (term_id, department_id, activity_id)
);

alter table public.handover_entries
  add column record_id uuid references public.handover_records(id) on delete cascade,
  add column position integer not null default 0 check (position >= 0),
  add column workflow_time text,
  add column workflow_note text;

-- Older activity alignment rows could default to 會長 even when the work-group
-- catalog assigns the event to another department. Normalize only known event
-- ownership before grouping legacy entries under stable department IDs.
update public.handover_entries entry
set department = case
  when activity.name in ('新生家長日', '新生線上茶會', '抽家族活動') then '會長'
  when activity.name in ('系運', '商管盃') then '體育股'
  when activity.name in ('迎新', '商管K', '制服趴', '聖誕趴') then '活動股'
  when activity.name = '電競週' then '資訊股'
  else entry.department
end
from public.activities activity
where activity.id = entry.activity_id
  and entry.department is distinct from case
    when activity.name in ('新生家長日', '新生線上茶會', '抽家族活動') then '會長'
    when activity.name in ('系運', '商管盃') then '體育股'
    when activity.name in ('迎新', '商管K', '制服趴', '聖誕趴') then '活動股'
    when activity.name = '電競週' then '資訊股'
    else entry.department
  end;

-- Keep unknown legacy departments isolated as legacy records; known departments
-- are assigned stable ids matching the application's workGroups ids.
insert into public.handover_records (term_id, department_id, department, activity_id, is_published, published_at)
select distinct on (entry.term_id, entry.department, entry.activity_id)
  entry.term_id,
  case lower(trim(entry.department))
    when '會長' then 'president'
    when '副會長' then 'vice-president'
    when '執秘' then 'secretary'
    when '總務' then 'general-affairs'
    when '體育股' then 'sports'
    when '美宣股' then 'design'
    when '器材股' then 'equipment'
    when '活動股' then 'activities'
    when '資訊股' then 'information'
    else 'legacy-' || md5(entry.department)
  end,
  entry.department,
  entry.activity_id,
  true,
  now()
from public.handover_entries entry
order by entry.term_id, entry.department, entry.activity_id, entry.created_at;

update public.handover_entries entry
set record_id = record.id,
    position = 0
from public.handover_records record
where record.term_id = entry.term_id
  and record.department = entry.department
  and record.activity_id is not distinct from entry.activity_id;

alter table public.handover_entries alter column record_id set not null;

with ordered_entries as (
  select id, row_number() over (partition by record_id, kind order by created_at, id) - 1 as next_position
  from public.handover_entries
)
update public.handover_entries entry
set position = ordered_entries.next_position
from ordered_entries
where ordered_entries.id = entry.id;

create index handover_records_term_department_idx on public.handover_records(term_id, department_id);
create index handover_records_activity_idx on public.handover_records(activity_id) where activity_id is not null;
create index handover_entries_record_position_idx on public.handover_entries(record_id, kind, position);

create trigger handover_records_set_updated_at before update on public.handover_records
for each row execute function public.set_updated_at();

create or replace function public.guard_handover_record_identity()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'UPDATE' and (
     new.term_id <> old.term_id
     or new.department_id <> old.department_id
     or new.department <> old.department
     or new.activity_id is distinct from old.activity_id
  ) then
    raise exception 'Handover record identity cannot be changed.';
  end if;
  if new.department_id in ('president', 'vice-president', 'secretary', 'general-affairs', 'sports', 'design', 'equipment', 'activities', 'information')
    and new.department is distinct from case new.department_id
      when 'president' then '會長'
      when 'vice-president' then '副會長'
      when 'secretary' then '執秘'
      when 'general-affairs' then '總務'
      when 'sports' then '體育股'
      when 'design' then '美宣股'
      when 'equipment' then '器材股'
      when 'activities' then '活動股'
      when 'information' then '資訊股'
    end then
    raise exception 'Handover department ID and label do not match.';
  end if;
  if new.activity_id is not null and not exists (
    select 1 from public.activities activity
    where activity.id = new.activity_id
      and activity.term_id = new.term_id
      and case
        when activity.name in ('新生家長日', '新生線上茶會', '抽家族活動') then new.department = '會長'
        when activity.name in ('系運', '商管盃') then new.department = '體育股'
        when activity.name in ('迎新', '商管K', '制服趴', '聖誕趴') then new.department = '活動股'
        when activity.name = '電競週' then new.department = '資訊股'
        else activity.department = new.department
      end
  ) then
    raise exception 'Activity does not belong to this handover department and term.';
  end if;
  return new;
end;
$$;

create trigger handover_records_identity_guard before insert or update on public.handover_records
for each row execute function public.guard_handover_record_identity();

-- Keep existing Drive folder links available in the shared Our Team reader.
-- A folder link was already visible to authenticated users before this feature,
-- so importing it as a published link-only record preserves existing behavior.
insert into public.handover_records (term_id, department_id, department, activity_id, drive_url, is_published, published_at)
select activity.term_id,
  case owner.department_name
    when '會長' then 'president'
    when '副會長' then 'vice-president'
    when '執秘' then 'secretary'
    when '總務' then 'general-affairs'
    when '體育股' then 'sports'
    when '美宣股' then 'design'
    when '器材股' then 'equipment'
    when '活動股' then 'activities'
    when '資訊股' then 'information'
  end,
  owner.department_name,
  activity.id,
  folder.url,
  true,
  now()
from public.activities activity
cross join lateral (
  select case
    when activity.name in ('新生家長日', '新生線上茶會', '抽家族活動') then '會長'
    when activity.name in ('系運', '商管盃') then '體育股'
    when activity.name in ('迎新', '商管K', '制服趴', '聖誕趴') then '活動股'
    when activity.name = '電競週' then '資訊股'
    else activity.department
  end as department_name
) owner
cross join lateral (
  select document.url
  from public.document_links document
  where document.activity_id = activity.id
    and document.task_id is null
    and document.document_type = 'drive_folder'
    and document.url ~ '^https://(drive|docs)\.google\.com/'
  order by document.updated_at desc, document.id
  limit 1
) folder
where owner.department_name in ('會長', '副會長', '執秘', '總務', '體育股', '美宣股', '器材股', '活動股', '資訊股')
on conflict (term_id, department_id, activity_id) do update
set drive_url = excluded.drive_url
where public.handover_records.drive_url = '';

create or replace function public.guard_handover_entry_scope()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if not exists (
    select 1 from public.handover_records record
    where record.id = new.record_id
      and record.term_id = new.term_id
      and record.department = new.department
      and record.activity_id is not distinct from new.activity_id
  ) then
    raise exception 'Handover entry scope must match its parent record.';
  end if;
  return new;
end;
$$;
create trigger handover_entries_scope_guard before insert or update on public.handover_entries
for each row execute function public.guard_handover_entry_scope();

alter table public.handover_records enable row level security;
drop policy if exists "authenticated users can read handover entries" on public.handover_entries;
drop policy if exists "admins can manage handover entries" on public.handover_entries;

create policy "read published handovers or assigned department drafts"
on public.handover_records for select to authenticated
using (is_published or public.can_manage_handover(department_id));
create policy "assigned departments can create handovers"
on public.handover_records for insert to authenticated
with check (public.can_manage_handover(department_id));
create policy "assigned departments can update handovers"
on public.handover_records for update to authenticated
using (public.can_manage_handover(department_id))
with check (public.can_manage_handover(department_id));
create policy "assigned departments can delete handovers"
on public.handover_records for delete to authenticated
using (public.can_manage_handover(department_id));

create policy "read entries from published handovers or assigned drafts"
on public.handover_entries for select to authenticated
using (exists (
  select 1 from public.handover_records record
  where record.id = handover_entries.record_id
    and (record.is_published or public.can_manage_handover(record.department_id))
));
create policy "assigned departments can create handover entries"
on public.handover_entries for insert to authenticated
with check (exists (
  select 1 from public.handover_records record
  where record.id = handover_entries.record_id
    and public.can_manage_handover(record.department_id)
));
create policy "assigned departments can update handover entries"
on public.handover_entries for update to authenticated
using (exists (
  select 1 from public.handover_records record
  where record.id = handover_entries.record_id
    and public.can_manage_handover(record.department_id)
))
with check (exists (
  select 1 from public.handover_records record
  where record.id = handover_entries.record_id
    and public.can_manage_handover(record.department_id)
));
create policy "assigned departments can delete handover entries"
on public.handover_entries for delete to authenticated
using (exists (
  select 1 from public.handover_records record
  where record.id = handover_entries.record_id
    and public.can_manage_handover(record.department_id)
));

grant select, insert, update, delete on public.handover_records to authenticated;
grant select, insert, update, delete on public.handover_entries to authenticated;
revoke all on function public.can_manage_handover(text) from public;
grant execute on function public.can_manage_handover(text) to authenticated;

create or replace function public.is_current_handover_source(target_term_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.terms current_term
    where current_term.is_current
      and current_term.handover_from_term_id = target_term_id
  );
$$;
revoke all on function public.is_current_handover_source(uuid) from public;
grant execute on function public.is_current_handover_source(uuid) to authenticated;

-- Restrict edits to the one source term configured for the current cohort;
-- published historic records remain readable but cannot be overwritten.
drop policy if exists "read published handovers or assigned department drafts" on public.handover_records;
drop policy if exists "assigned departments can create handovers" on public.handover_records;
drop policy if exists "assigned departments can update handovers" on public.handover_records;
drop policy if exists "assigned departments can delete handovers" on public.handover_records;
create policy "read published handovers or current assigned drafts"
on public.handover_records for select to authenticated
using (is_published or (public.is_current_handover_source(term_id) and public.can_manage_handover(department_id)));
create policy "current assigned departments can create handovers"
on public.handover_records for insert to authenticated
with check (public.is_current_handover_source(term_id) and public.can_manage_handover(department_id));
create policy "current assigned departments can update handovers"
on public.handover_records for update to authenticated
using (public.is_current_handover_source(term_id) and public.can_manage_handover(department_id))
with check (public.is_current_handover_source(term_id) and public.can_manage_handover(department_id));
create policy "current assigned departments can delete handovers"
on public.handover_records for delete to authenticated
using (public.is_current_handover_source(term_id) and public.can_manage_handover(department_id));

drop policy if exists "read entries from published handovers or assigned drafts" on public.handover_entries;
drop policy if exists "assigned departments can create handover entries" on public.handover_entries;
drop policy if exists "assigned departments can update handover entries" on public.handover_entries;
drop policy if exists "assigned departments can delete handover entries" on public.handover_entries;
create policy "read entries from published or current assigned handovers"
on public.handover_entries for select to authenticated
using (exists (
  select 1 from public.handover_records record
  where record.id = handover_entries.record_id
    and (record.is_published or (public.is_current_handover_source(record.term_id) and public.can_manage_handover(record.department_id)))
));
create policy "current assigned departments can create handover entries"
on public.handover_entries for insert to authenticated
with check (exists (
  select 1 from public.handover_records record
  where record.id = handover_entries.record_id
    and public.is_current_handover_source(record.term_id)
    and public.can_manage_handover(record.department_id)
));
create policy "current assigned departments can update handover entries"
on public.handover_entries for update to authenticated
using (exists (
  select 1 from public.handover_records record
  where record.id = handover_entries.record_id
    and public.is_current_handover_source(record.term_id)
    and public.can_manage_handover(record.department_id)
))
with check (exists (
  select 1 from public.handover_records record
  where record.id = handover_entries.record_id
    and public.is_current_handover_source(record.term_id)
    and public.can_manage_handover(record.department_id)
));
create policy "current assigned departments can delete handover entries"
on public.handover_entries for delete to authenticated
using (exists (
  select 1 from public.handover_records record
  where record.id = handover_entries.record_id
    and public.is_current_handover_source(record.term_id)
    and public.can_manage_handover(record.department_id)
));

comment on table public.handover_records is 'Per-term, per-department and optional per-activity handover publication and links.';
comment on column public.handover_entries.record_id is 'Groups note and workflow entries under one published handover record.';

notify pgrst, 'reload schema';
