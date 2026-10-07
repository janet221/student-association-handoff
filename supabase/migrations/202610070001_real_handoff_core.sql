create type public.deadline_anchor as enum (
  'activity_start',
  'activity_end',
  'schedule_item',
  'task_completion'
);

create type public.equipment_preparation_status as enum (
  'to_confirm',
  'to_borrow',
  'requested',
  'borrowed',
  'to_buy',
  'purchased',
  'returned'
);

create table public.activity_schedule_items (
  id uuid primary key default gen_random_uuid(),
  activity_id uuid not null references public.activities(id) on delete cascade,
  source_schedule_item_id uuid references public.activity_schedule_items(id) on delete set null,
  name text not null,
  starts_at timestamptz,
  ends_at timestamptz,
  venue text,
  note text,
  position integer not null default 0 check (position >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (activity_id, position),
  check (ends_at is null or starts_at is null or ends_at >= starts_at)
);

alter table public.tasks
  add column category text,
  add column deadline_anchor public.deadline_anchor,
  add column anchor_schedule_item_id uuid references public.activity_schedule_items(id) on delete set null,
  add column anchor_task_id uuid references public.tasks(id) on delete set null;

alter table public.tasks drop constraint if exists tasks_check;

-- Existing MVP rows used activity start implicitly for every relative deadline.
update public.tasks
set deadline_anchor = 'activity_start'
where deadline_type = 'relative_to_activity' and deadline_anchor is null;

alter table public.tasks add constraint tasks_deadline_configuration_check check (
  (deadline_type is null and fixed_deadline is null and relative_days is null and deadline_anchor is null and anchor_schedule_item_id is null and anchor_task_id is null)
  or (deadline_type = 'fixed_date' and fixed_deadline is not null and relative_days is null and deadline_anchor is null and anchor_schedule_item_id is null and anchor_task_id is null)
  or (
    deadline_type = 'relative_to_activity'
    and relative_days is not null
    and fixed_deadline is null
    and deadline_anchor is not null
    and (
      (deadline_anchor in ('activity_start', 'activity_end') and anchor_schedule_item_id is null and anchor_task_id is null)
      or (deadline_anchor = 'schedule_item' and anchor_schedule_item_id is not null and anchor_task_id is null)
      or (deadline_anchor = 'task_completion' and anchor_schedule_item_id is null and anchor_task_id is not null)
    )
  )
);

create table public.task_checklist_items (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks(id) on delete cascade,
  source_checklist_item_id uuid references public.task_checklist_items(id) on delete set null,
  content text not null check (char_length(trim(content)) > 0),
  is_completed boolean not null default false,
  position integer not null default 0 check (position >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (task_id, position)
);

alter table public.equipment
  add column source text,
  add column preparation_status public.equipment_preparation_status not null default 'to_confirm',
  add column schedule_item_id uuid references public.activity_schedule_items(id) on delete set null;

alter table public.equipment drop constraint if exists equipment_activity_id_name_key;
alter table public.equipment add constraint equipment_activity_schedule_name_key
  unique nulls not distinct (activity_id, schedule_item_id, name);

create index activity_schedule_items_activity_id_idx on public.activity_schedule_items(activity_id);
create index activity_schedule_items_source_idx on public.activity_schedule_items(source_schedule_item_id);
create index tasks_anchor_schedule_item_idx on public.tasks(anchor_schedule_item_id);
create index tasks_anchor_task_idx on public.tasks(anchor_task_id);
create index task_checklist_items_task_id_idx on public.task_checklist_items(task_id);
create index equipment_schedule_item_idx on public.equipment(schedule_item_id);

create trigger activity_schedule_items_set_updated_at before update on public.activity_schedule_items
for each row execute function public.set_updated_at();
create trigger task_checklist_items_set_updated_at before update on public.task_checklist_items
for each row execute function public.set_updated_at();

alter table public.activity_schedule_items enable row level security;
alter table public.task_checklist_items enable row level security;

create policy "authenticated users can read activity schedule items"
on public.activity_schedule_items for select to authenticated using (true);
create policy "admins can manage activity schedule items"
on public.activity_schedule_items for all to authenticated
using (public.is_admin()) with check (public.is_admin());

create policy "authenticated users can read task checklist items"
on public.task_checklist_items for select to authenticated using (true);
create policy "admins can manage task checklist items"
on public.task_checklist_items for all to authenticated
using (public.is_admin()) with check (public.is_admin());
create policy "assigned members can update task checklist items"
on public.task_checklist_items for update to authenticated
using (
  exists (
    select 1
    from public.assignments assignment
    join public.members member on member.id = assignment.member_id
    where assignment.task_id = task_checklist_items.task_id
      and member.profile_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.assignments assignment
    join public.members member on member.id = assignment.member_id
    where assignment.task_id = task_checklist_items.task_id
      and member.profile_id = auth.uid()
  )
);

create or replace function public.task_effective_deadline(target_task public.tasks)
returns date
language sql
stable
set search_path = ''
as $$
  select case target_task.deadline_type
    when 'fixed_date' then target_task.fixed_deadline
    when 'relative_to_activity' then (
      case target_task.deadline_anchor
        when 'activity_start' then coalesce(
          (select min(item.starts_at)::date from public.activity_schedule_items item where item.activity_id = activity.id),
          activity.activity_date
        )
        when 'activity_end' then coalesce(
          (select max(coalesce(item.ends_at, item.starts_at))::date from public.activity_schedule_items item where item.activity_id = activity.id),
          activity.activity_date
        )
        when 'schedule_item' then (
          select item.starts_at::date
          from public.activity_schedule_items item
          where item.id = target_task.anchor_schedule_item_id
        )
        when 'task_completion' then (
          select dependency.updated_at::date
          from public.tasks dependency
          where dependency.id = target_task.anchor_task_id and dependency.status = 'completed'
        )
      end + target_task.relative_days
    )
    else null
  end
  from public.phases phase
  join public.activities activity on activity.id = phase.activity_id
  where phase.id = target_task.phase_id;
$$;

create or replace function public.inherit_activity(
  source_activity uuid,
  target_term uuid,
  target_activity_date date default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  source_row public.activities;
  new_activity_id uuid;
  source_phase public.phases;
  source_task public.tasks;
  new_phase_id uuid;
  new_task_id uuid;
begin
  if not public.is_admin() then
    raise exception 'Only administrators can inherit activities';
  end if;

  select * into source_row from public.activities where id = source_activity;
  if not found then raise exception 'Source activity not found'; end if;
  if source_row.status <> 'archived' then raise exception 'Only archived activities can be inherited'; end if;

  insert into public.activities (term_id, source_activity_id, name, description, status, activity_date, created_by)
  values (target_term, source_row.id, source_row.name, source_row.description, 'planning', null, auth.uid())
  returning id into new_activity_id;

  create temporary table schedule_map (old_id uuid primary key, new_id uuid not null) on commit drop;
  create temporary table phase_map (old_id uuid primary key, new_id uuid not null) on commit drop;
  create temporary table task_map (old_id uuid primary key, new_id uuid not null) on commit drop;

  with inserted as (
    insert into public.activity_schedule_items (
      activity_id, source_schedule_item_id, name, starts_at, ends_at, venue, note, position
    )
    select new_activity_id, item.id, item.name, null, null, null,
      null,
      item.position
    from public.activity_schedule_items item
    where item.activity_id = source_activity
    order by item.position
    returning id, source_schedule_item_id
  )
  insert into schedule_map (old_id, new_id)
  select source_schedule_item_id, id from inserted;

  for source_phase in select * from public.phases where activity_id = source_activity order by position loop
    insert into public.phases (activity_id, source_phase_id, name, description, position)
    values (new_activity_id, source_phase.id, source_phase.name, source_phase.description, source_phase.position)
    returning id into new_phase_id;
    insert into phase_map values (source_phase.id, new_phase_id);

    for source_task in select * from public.tasks where phase_id = source_phase.id order by position loop
      insert into public.tasks (
        phase_id, source_task_id, name, category, description, checklist, status, priority,
        deadline_type, fixed_deadline, relative_days, deadline_anchor,
        anchor_schedule_item_id, anchor_task_id, execution_note, position
      ) values (
        new_phase_id, source_task.id, source_task.name, source_task.category, source_task.description,
        '[]'::jsonb, 'todo', source_task.priority,
        case when source_task.deadline_type = 'relative_to_activity' and source_task.deadline_anchor <> 'task_completion' then source_task.deadline_type else null end,
        null,
        case when source_task.deadline_type = 'relative_to_activity' and source_task.deadline_anchor <> 'task_completion' then source_task.relative_days else null end,
        case when source_task.deadline_type = 'relative_to_activity' and source_task.deadline_anchor <> 'task_completion' then source_task.deadline_anchor else null end,
        case when source_task.deadline_anchor = 'schedule_item' then (select new_id from schedule_map where old_id = source_task.anchor_schedule_item_id) else null end,
        null,
        null,
        source_task.position
      ) returning id into new_task_id;
      insert into task_map values (source_task.id, new_task_id);
    end loop;
  end loop;

  update public.tasks target
  set deadline_type = 'relative_to_activity',
      relative_days = source.relative_days,
      deadline_anchor = 'task_completion',
      anchor_task_id = mapped_anchor.new_id
  from task_map mapped_task
  join public.tasks source on source.id = mapped_task.old_id
  join task_map mapped_anchor on mapped_anchor.old_id = source.anchor_task_id
  where target.id = mapped_task.new_id and source.deadline_anchor = 'task_completion';

  insert into public.task_checklist_items (task_id, source_checklist_item_id, content, is_completed, position)
  select mapped.new_id, item.id, item.content, false, item.position
  from public.task_checklist_items item
  join task_map mapped on mapped.old_id = item.task_id;

  insert into public.task_dependencies (task_id, depends_on_task_id)
  select current_task.new_id, dependency.new_id
  from public.task_dependencies link
  join task_map current_task on current_task.old_id = link.task_id
  join task_map dependency on dependency.old_id = link.depends_on_task_id;

  insert into public.activity_roles (activity_id, source_role_id, name, description, position)
  select new_activity_id, id, name, description, position
  from public.activity_roles where activity_id = source_activity;

  insert into public.equipment (
    activity_id, source_equipment_id, name, quantity, is_confirmed, note,
    document_url, source, preparation_status, schedule_item_id
  )
  select new_activity_id, equipment.id, equipment.name, equipment.quantity, false,
    equipment.note, null, equipment.source, 'to_confirm', mapped_schedule.new_id
  from public.equipment equipment
  left join schedule_map mapped_schedule on mapped_schedule.old_id = equipment.schedule_item_id
  where equipment.activity_id = source_activity;

  return new_activity_id;
end;
$$;

grant execute on function public.inherit_activity(uuid, uuid, date) to authenticated;

create or replace function public.move_task(target_task uuid, direction integer)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_row public.tasks;
  swap_row public.tasks;
begin
  if not public.is_admin() then
    raise exception 'Only administrators can reorder tasks';
  end if;
  if direction not in (-1, 1) then
    raise exception 'Direction must be -1 or 1';
  end if;

  select task.* into current_row
  from public.tasks task
  join public.phases phase on phase.id = task.phase_id
  join public.activities activity on activity.id = phase.activity_id
  where task.id = target_task and activity.status <> 'archived';
  if not found then raise exception 'Editable task not found'; end if;

  select * into swap_row
  from public.tasks
  where phase_id = current_row.phase_id
    and position = current_row.position + direction;
  if not found then return; end if;

  update public.tasks set position = 2147483647 where id = current_row.id;
  update public.tasks set position = current_row.position where id = swap_row.id;
  update public.tasks set position = swap_row.position where id = current_row.id;
end;
$$;

grant execute on function public.move_task(uuid, integer) to authenticated;
