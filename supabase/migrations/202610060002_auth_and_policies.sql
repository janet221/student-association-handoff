create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

create or replace function public.current_user_role()
returns public.user_role
language sql
stable
security definer
set search_path = ''
as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  assigned_role public.user_role;
begin
  select case
    when exists (select 1 from public.profiles) then 'member'::public.user_role
    else 'admin'::public.user_role
  end into assigned_role;

  insert into public.profiles (id, display_name, role)
  values (
    new.id,
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'display_name'), ''), split_part(new.email, '@', 1)),
    assigned_role
  );

  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

alter view public.task_dashboard set (security_invoker = true);

create policy "authenticated users can read profiles"
on public.profiles for select to authenticated
using (true);

create policy "users can update their own profile"
on public.profiles for update to authenticated
using (id = auth.uid())
with check (id = auth.uid() and role = public.current_user_role());

create policy "admins can manage profiles"
on public.profiles for all to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "authenticated users can read terms"
on public.terms for select to authenticated using (true);
create policy "admins can manage terms"
on public.terms for all to authenticated
using (public.is_admin()) with check (public.is_admin());

create policy "authenticated users can read activities"
on public.activities for select to authenticated using (true);
create policy "admins can manage activities"
on public.activities for all to authenticated
using (public.is_admin()) with check (public.is_admin());

create policy "authenticated users can read phases"
on public.phases for select to authenticated using (true);
create policy "admins can manage phases"
on public.phases for all to authenticated
using (public.is_admin()) with check (public.is_admin());

create policy "authenticated users can read tasks"
on public.tasks for select to authenticated using (true);
create policy "admins can manage tasks"
on public.tasks for all to authenticated
using (public.is_admin()) with check (public.is_admin());
create policy "assigned members can update tasks"
on public.tasks for update to authenticated
using (
  exists (
    select 1
    from public.assignments assignment
    join public.members member on member.id = assignment.member_id
    where assignment.task_id = tasks.id and member.profile_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.assignments assignment
    join public.members member on member.id = assignment.member_id
    where assignment.task_id = tasks.id and member.profile_id = auth.uid()
  )
);

create policy "authenticated users can read task dependencies"
on public.task_dependencies for select to authenticated using (true);
create policy "admins can manage task dependencies"
on public.task_dependencies for all to authenticated
using (public.is_admin()) with check (public.is_admin());

create policy "authenticated users can read members"
on public.members for select to authenticated using (true);
create policy "admins can manage members"
on public.members for all to authenticated
using (public.is_admin()) with check (public.is_admin());

create policy "authenticated users can read activity roles"
on public.activity_roles for select to authenticated using (true);
create policy "admins can manage activity roles"
on public.activity_roles for all to authenticated
using (public.is_admin()) with check (public.is_admin());

create policy "authenticated users can read assignments"
on public.assignments for select to authenticated using (true);
create policy "admins can manage assignments"
on public.assignments for all to authenticated
using (public.is_admin()) with check (public.is_admin());

create policy "authenticated users can read equipment"
on public.equipment for select to authenticated using (true);
create policy "admins can manage equipment"
on public.equipment for all to authenticated
using (public.is_admin()) with check (public.is_admin());

create policy "authenticated users can read document links"
on public.document_links for select to authenticated using (true);
create policy "admins can manage document links"
on public.document_links for all to authenticated
using (public.is_admin()) with check (public.is_admin());

create policy "authenticated users can read experiences"
on public.experiences for select to authenticated using (true);
create policy "admins can manage experiences"
on public.experiences for all to authenticated
using (public.is_admin()) with check (public.is_admin());
create policy "members can create their own experiences"
on public.experiences for insert to authenticated
with check (
  exists (
    select 1
    from public.members member
    where member.id = experiences.author_id and member.profile_id = auth.uid()
  )
);
create policy "members can update their own experiences"
on public.experiences for update to authenticated
using (
  exists (
    select 1
    from public.members member
    where member.id = experiences.author_id and member.profile_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.members member
    where member.id = experiences.author_id and member.profile_id = auth.uid()
  )
);
