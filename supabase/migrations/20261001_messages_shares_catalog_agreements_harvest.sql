-- Повідомлення, доступ до полів, довідник, співпраця з агрономом, збір урожаю.
-- Запускати ПІСЛЯ 20261001_deal_status_promotions.sql (потрібна public.is_admin()).
--
-- Було:
--  • messages: SELECT true / INSERT true — будь-хто читав усе листування і писав у чужі чати;
--  • field_shares: будь-який агроном міг сам створити «доступ до поля» чужого фермера зі статусом accepted;
--  • agro_diseases / agro_pests / agro_weeds / agro_weed_herbicides: будь-який залогінений міг редагувати довідник;
--  • agreements: будь-яка сторона змінювала будь-які поля (фермер міг сам «почати» співпрацю й залишити відгук);
--  • harvest_payments: працівник міг змінити суму своєї виплати;
--  • harvest_season_workers: працівник міг змінювати/видаляти свої записи сезону.

begin;

-- ── messages: лише учасники чату (правило "messages: participants" лишається) ──
drop policy if exists "Users can read messages" on public.messages;
drop policy if exists "Users can insert messages" on public.messages;

-- ── field_shares: створює і видаляє фермер (власник поля); агроном лише приймає/відхиляє ──
drop policy if exists "Users can manage their shares" on public.field_shares;
drop policy if exists "field_shares: parties read" on public.field_shares;
drop policy if exists "field_shares: farmer insert" on public.field_shares;
drop policy if exists "field_shares: parties update" on public.field_shares;
drop policy if exists "field_shares: farmer delete" on public.field_shares;

create policy "field_shares: parties read" on public.field_shares
  for select to authenticated
  using (farmer_id = auth.uid() or agronomist_id = auth.uid());

create policy "field_shares: farmer insert" on public.field_shares
  for insert to authenticated
  with check (
    farmer_id = auth.uid()
    and exists (select 1 from public.farms f where f.id = farm_id and f.user_id = auth.uid())
  );

create policy "field_shares: parties update" on public.field_shares
  for update to authenticated
  using (farmer_id = auth.uid() or agronomist_id = auth.uid())
  with check (farmer_id = auth.uid() or agronomist_id = auth.uid());

create policy "field_shares: farmer delete" on public.field_shares
  for delete to authenticated
  using (farmer_id = auth.uid());

create or replace function public.field_shares_protect()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  if auth.uid() is null or public.is_admin() then
    return new;
  end if;
  if tg_op = 'INSERT' then
    new.status := 'pending';
    return new;
  end if;
  new.farm_id := old.farm_id;
  new.farmer_id := old.farmer_id;
  new.agronomist_id := old.agronomist_id;
  new.created_at := old.created_at;
  -- Прийняти / відхилити може лише агроном; фермер може лише відкликати (видалити запис)
  if new.status is distinct from old.status then
    if not (auth.uid() = old.agronomist_id and old.status = 'pending' and new.status in ('accepted', 'declined')) then
      raise exception 'Недозволена зміна статусу доступу: % → %', old.status, new.status using errcode = '42501';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists field_shares_protect on public.field_shares;
create trigger field_shares_protect
  before insert or update on public.field_shares
  for each row execute function public.field_shares_protect();

-- ── Довідник: змінює лише адмін ──────────────────────────────────────────────
drop policy if exists "authenticated write agro_diseases" on public.agro_diseases;
drop policy if exists "authenticated write agro_pests" on public.agro_pests;
drop policy if exists "authenticated write agro_weeds" on public.agro_weeds;
drop policy if exists "authenticated write agro_weed_herbicides" on public.agro_weed_herbicides;
drop policy if exists "agro_diseases: admin all" on public.agro_diseases;
drop policy if exists "agro_pests: admin all" on public.agro_pests;
drop policy if exists "agro_weeds: admin all" on public.agro_weeds;
drop policy if exists "agro_weed_herbicides: admin all" on public.agro_weed_herbicides;
create policy "agro_diseases: admin all" on public.agro_diseases
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "agro_pests: admin all" on public.agro_pests
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "agro_weeds: admin all" on public.agro_weeds
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "agro_weed_herbicides: admin all" on public.agro_weed_herbicides
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- ── agreements: як працює інтерфейс ──────────────────────────────────────────
--   створює фермер → 'pending';
--   pending → active    — лише агроном (started_at ставить база);
--   pending → cancelled — будь-яка сторона (агроном відхиляє / фермер скасовує);
--   active  → completed — будь-яка сторона (ended_at ставить база);
--   active  → cancelled — будь-яка сторона.
drop policy if exists "Parties can update agreements" on public.agreements;
create policy "Parties can update agreements" on public.agreements
  for update to authenticated
  using (auth.uid() = farmer_id or auth.uid() = agronomist_id)
  with check (auth.uid() = farmer_id or auth.uid() = agronomist_id);

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

drop trigger if exists agreements_protect on public.agreements;
create trigger agreements_protect
  before insert or update on public.agreements
  for each row execute function public.agreements_protect();

-- ── harvest_payments: працівник лише підтверджує отримання ───────────────────
drop policy if exists "worker_confirm_payment" on public.harvest_payments;
create policy "worker_confirm_payment" on public.harvest_payments
  for update to authenticated
  using (exists (
    select 1 from public.harvest_workers w
    where w.id = harvest_payments.worker_id and w.auth_user_id = auth.uid()
  ))
  with check (exists (
    select 1 from public.harvest_workers w
    where w.id = harvest_payments.worker_id and w.auth_user_id = auth.uid()
  ));

create or replace function public.harvest_payments_protect()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  if auth.uid() is null or public.is_admin() then
    return new;
  end if;
  -- Власник сезону редагує як завгодно
  if exists (select 1 from public.harvest_workers w where w.id = old.worker_id and w.owner_id = auth.uid()) then
    return new;
  end if;
  -- Працівник: лише status → 'confirmed' і дата підтвердження
  new.worker_id := old.worker_id;
  new.season_id := old.season_id;
  new.amount := old.amount;
  new.paid_at := old.paid_at;
  if new.status is distinct from old.status then
    if new.status = 'confirmed' then
      new.confirmed_at := now();
    else
      raise exception 'Недозволена зміна статусу виплати' using errcode = '42501';
    end if;
  else
    new.confirmed_at := old.confirmed_at;
  end if;
  return new;
end;
$$;

drop trigger if exists harvest_payments_protect on public.harvest_payments;
create trigger harvest_payments_protect
  before update on public.harvest_payments
  for each row execute function public.harvest_payments_protect();

-- ── harvest_season_workers: працівник лише бачить свої записи ────────────────
drop policy if exists "worker_view_own" on public.harvest_season_workers;
create policy "worker_view_own" on public.harvest_season_workers
  for select to authenticated
  using (exists (
    select 1 from public.harvest_workers
    where harvest_workers.id = harvest_season_workers.worker_id and harvest_workers.auth_user_id = auth.uid()
  ));

commit;
