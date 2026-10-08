-- Агроном і поля клієнтів.
-- Запускати ПІСЛЯ 20261002_team_access.sql і 20261001_messages_shares_catalog_agreements_harvest.sql.
--
-- Було:
--  • програми захисту (protection_programs, program_treatments) і сівозміну бачили лише власник і його команда —
--    агроном з активною співпрацею відкривав «Програму» клієнта порожньою і не міг нічого зберегти;
--  • тариф фермера агроном прочитати не може (subscriptions — лише свої), тож сторінка вважала
--    кожного клієнта безкоштовним і після першої програми блокувала решту культур;
--  • «Базовий — до 2 клієнтів» було лише написано на сторінках тарифів, прийняти можна було скільки завгодно.
-- Стало:
--  • агроном з АКТИВНОЮ співпрацею читає й веде програми захисту полів фермера, читає сівозміну;
--  • client_has_paid_plan(фермер) — лише так/ні про платний тариф клієнта, без даних підписки;
--  • агроном без активного PRO приймає нову співпрацю, лише якщо в нього менше 2 активних клієнтів.

begin;

-- ── Агроном фермера ──────────────────────────────────────────────────────────
create or replace function public.is_agronomist_of(owner uuid)
returns boolean
language sql
stable
security definer
set search_path to 'public'
as $$
  select exists (
    select 1 from public.agreements
    where agronomist_id = auth.uid() and farmer_id = owner and status = 'active'
  );
$$;

-- ── Програми захисту: агроном веде їх для клієнта ────────────────────────────
create or replace function pg_temp.agronomist_policies(tbl text, owner_expr text)
returns void language plpgsql as $$
begin
  execute format('drop policy if exists "agronomist: read" on public.%I', tbl);
  execute format('drop policy if exists "agronomist: insert" on public.%I', tbl);
  execute format('drop policy if exists "agronomist: update" on public.%I', tbl);
  execute format('drop policy if exists "agronomist: delete" on public.%I', tbl);
  execute format('create policy "agronomist: read" on public.%I for select to authenticated using (public.is_agronomist_of(%s))', tbl, owner_expr);
  execute format('create policy "agronomist: insert" on public.%I for insert to authenticated with check (public.is_agronomist_of(%s))', tbl, owner_expr);
  execute format('create policy "agronomist: update" on public.%I for update to authenticated using (public.is_agronomist_of(%s)) with check (public.is_agronomist_of(%s))', tbl, owner_expr, owner_expr);
  execute format('create policy "agronomist: delete" on public.%I for delete to authenticated using (public.is_agronomist_of(%s))', tbl, owner_expr);
end;
$$;

select pg_temp.agronomist_policies('protection_programs', 'public.farm_crop_owner(farm_crop_id)');
select pg_temp.agronomist_policies('program_treatments',  'public.program_owner(program_id)');

-- Сівозміна — лише перегляд (сторінка поля в режимі перегляду)
drop policy if exists "agronomist: read" on public.crop_rotation;
create policy "agronomist: read" on public.crop_rotation
  for select to authenticated using (public.is_agronomist_of(public.farm_owner(farm_id)));

-- ── Платний тариф клієнта — лише так/ні ──────────────────────────────────────
create or replace function public.client_has_paid_plan(p_farmer uuid)
returns boolean
language sql
stable
security definer
set search_path to 'public'
as $$
  select case when public.is_agronomist_of(p_farmer) then exists (
    select 1 from public.subscriptions s
    where s.user_id = p_farmer and s.profile = 'farmer'
      and s.plan in ('business', 'business_pro', 'premium')
      and (s.expires_at is null or s.expires_at > now())
  ) end;
$$;

revoke all on function public.client_has_paid_plan(uuid) from public, anon;
grant execute on function public.client_has_paid_plan(uuid) to authenticated;

-- ── Співпраця: ліміт клієнтів Базового тарифу ────────────────────────────────
create or replace function public.agreements_protect()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
declare me uuid := auth.uid();
begin
  if me is null or public.is_admin() then
    return new;
  end if;

  if tg_op = 'INSERT' then
    new.status := 'pending';
    new.started_at := null;
    new.ended_at := null;
    new.farmer_review := null;
    new.farmer_rating := null;
    return new;
  end if;

  new.farmer_id := old.farmer_id;
  new.agronomist_id := old.agronomist_id;
  new.created_at := old.created_at;
  new.started_at := old.started_at;
  new.ended_at := old.ended_at;
  if me <> old.farmer_id then
    new.farmer_review := old.farmer_review;
    new.farmer_rating := old.farmer_rating;
  end if;

  if new.status is distinct from old.status then
    if old.status = 'pending' and new.status = 'active' and me = old.agronomist_id then
      -- Базовий тариф агронома — до 2 активних клієнтів (PRO — без обмежень)
      if not exists (
        select 1 from public.subscriptions s
        where s.user_id = old.agronomist_id and s.profile = 'agronomist' and s.plan = 'pro'
          and (s.expires_at is null or s.expires_at > now())
      ) and (
        select count(distinct a.farmer_id) from public.agreements a
        where a.agronomist_id = old.agronomist_id and a.status = 'active' and a.farmer_id <> old.farmer_id
      ) >= 2 then
        raise exception 'На Базовому тарифі — до 2 активних клієнтів. Завершіть одну зі співпраць або перейдіть на PRO.'
          using errcode = 'P0001';
      end if;
      new.started_at := now();
    elsif old.status = 'pending' and new.status = 'cancelled' then
      null;
    elsif old.status = 'active' and new.status = 'completed' then
      new.ended_at := now();
    elsif old.status = 'active' and new.status = 'cancelled' then
      new.ended_at := now();
    else
      raise exception 'Недозволена зміна статусу співпраці: % → %', old.status, new.status using errcode = '42501';
    end if;
  end if;

  return new;
end;
$$;

commit;
