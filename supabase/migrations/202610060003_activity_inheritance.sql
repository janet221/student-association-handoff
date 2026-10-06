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

  insert into public.activities (term_id, source_activity_id, name, description, status, activity_date, created_by)
  values (target_term, source_row.id, source_row.name, source_row.description, 'planning', target_activity_date, auth.uid())
  returning id into new_activity_id;

  create temporary table phase_map (old_id uuid primary key, new_id uuid not null) on commit drop;
  create temporary table task_map (old_id uuid primary key, new_id uuid not null) on commit drop;

  for source_phase in select * from public.phases where activity_id = source_activity order by position loop
    insert into public.phases (activity_id, source_phase_id, name, description, position)
    values (new_activity_id, source_phase.id, source_phase.name, source_phase.description, source_phase.position)
    returning id into new_phase_id;
    insert into phase_map values (source_phase.id, new_phase_id);

    for source_task in select * from public.tasks where phase_id = source_phase.id order by position loop
      insert into public.tasks (
        phase_id, source_task_id, name, description, checklist, status, priority,
        deadline_type, fixed_deadline, relative_days, execution_note, position
      ) values (
        new_phase_id, source_task.id, source_task.name, source_task.description, source_task.checklist,
        'todo', source_task.priority,
        case when source_task.deadline_type = 'relative_to_activity' then source_task.deadline_type else null end,
        null,
        case when source_task.deadline_type = 'relative_to_activity' then source_task.relative_days else null end,
        null, source_task.position
      ) returning id into new_task_id;
      insert into task_map values (source_task.id, new_task_id);
    end loop;
  end loop;

  insert into public.task_dependencies (task_id, depends_on_task_id)
  select current_task.new_id, dependency.new_id
  from public.task_dependencies link
  join task_map current_task on current_task.old_id = link.task_id
  join task_map dependency on dependency.old_id = link.depends_on_task_id;

  insert into public.activity_roles (activity_id, source_role_id, name, description, position)
  select new_activity_id, id, name, description, position
  from public.activity_roles where activity_id = source_activity;

  insert into public.equipment (activity_id, source_equipment_id, name, quantity, is_confirmed, note, document_url)
  select new_activity_id, id, name, quantity, false, note, document_url
  from public.equipment where activity_id = source_activity;

  insert into public.document_links (activity_id, task_id, source_document_id, name, url, document_type, is_reusable)
  select new_activity_id, mapped.new_id, document.id, document.name, document.url, document.document_type, document.is_reusable
  from public.document_links document
  left join task_map mapped on mapped.old_id = document.task_id
  where document.activity_id = source_activity and document.is_reusable;

  insert into public.experiences (activity_id, task_id, kind, content, inherited_from_id)
  select new_activity_id, mapped.new_id, experience.kind, experience.content, experience.id
  from public.experiences experience
  left join task_map mapped on mapped.old_id = experience.task_id
  where experience.activity_id = source_activity;

  return new_activity_id;
end;
$$;

grant execute on function public.inherit_activity(uuid, uuid, date) to authenticated;
