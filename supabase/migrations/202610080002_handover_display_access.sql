do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'terms'
      and policyname = 'public can read current handover display'
  ) then
    create policy "public can read current handover display"
      on public.terms for select to anon using (true);
  end if;
end
$$;

update public.terms
set handover_completed = true
where ordinal = 26
  and handover_from_term_id is not null
  and handover_completed = false;
