-- Швидкі правила доступу до техкарти. Безпечно запускати повторно. Запускати ПІСЛЯ 20261026_farm_crops_privacy.sql.
--
-- Було (перевірено на робочій базі 2026-10-22): старі правила program_treatments і protection_programs — підзапити
-- protection_programs ⋈ farm_crops ⋈ farms / field_shares, частина з них дублікати (по два правила агронома з
-- field_shares на кожну дію, два правила власника дачі). Кожен підзапит знову застосовує правила farm_crops і farms,
-- тож одна зміна обробки перевіряла десятки вкладених правил; після 20261026 (ще дві перевірки на farm_crops)
-- оновлення обробки тривало 1–14 с і обривалось statement timeout.
-- Стало: ті самі умови доступу, але через SECURITY DEFINER функції (як уже зроблено для команди й агронома
-- зі співпрацею), без вкладених правил. Хто що бачить і змінює — не змінюється.

begin;

-- ── Службові функції ─────────────────────────────────────────────────────────
-- Власник дачної культури програми (старі програми дачі тримали id дачної культури в farm_crop_id)
create or replace function public.program_dacha_owner(p_program_id uuid)
returns uuid language sql stable security definer set search_path to 'public' as $$
  select coalesce(
    (select dc.user_id from public.protection_programs p join public.dacha_crops dc on dc.id = p.dacha_crop_id where p.id = p_program_id),
    (select dc.user_id from public.protection_programs p join public.dacha_crops dc on dc.id = p.farm_crop_id where p.id = p_program_id)
  );
$$;

-- Поле культури відкрите мені як агроному (field_shares accepted)
create or replace function public.farm_crop_shared_with_me(p_farm_crop_id uuid)
returns boolean language sql stable security definer set search_path to 'public' as $$
  select exists (
    select 1 from public.farm_crops fc
    join public.field_shares fs on fs.farm_id = fc.farm_id
    where fc.id = p_farm_crop_id and fs.agronomist_id = auth.uid() and fs.status = 'accepted'
  );
$$;

create or replace function public.program_shared_with_me(p_program_id uuid)
returns boolean language sql stable security definer set search_path to 'public' as $$
  select exists (
    select 1 from public.protection_programs p
    join public.farm_crops fc on fc.id = p.farm_crop_id
    join public.field_shares fs on fs.farm_id = fc.farm_id
    where p.id = p_program_id and fs.agronomist_id = auth.uid() and fs.status = 'accepted'
  );
$$;

revoke all on function public.program_dacha_owner(uuid) from public, anon;
revoke all on function public.farm_crop_shared_with_me(uuid) from public, anon;
revoke all on function public.program_shared_with_me(uuid) from public, anon;
grant execute on function public.program_dacha_owner(uuid) to authenticated;
grant execute on function public.farm_crop_shared_with_me(uuid) to authenticated;
grant execute on function public.program_shared_with_me(uuid) to authenticated;

-- ── farm_crops: власник ──────────────────────────────────────────────────────
drop policy if exists "farm_crops: own" on public.farm_crops;
create policy "farm_crops: own" on public.farm_crops
  for all to authenticated
  using (public.farm_owner(farm_id) = auth.uid())
  with check (public.farm_owner(farm_id) = auth.uid());

-- ── protection_programs ──────────────────────────────────────────────────────
drop policy if exists "protection_programs: owner" on public.protection_programs;
create policy "protection_programs: owner" on public.protection_programs
  for all to authenticated
  using (public.farm_crop_owner(farm_crop_id) = auth.uid()
    or exists (select 1 from public.dacha_crops dc where dc.id = protection_programs.farm_crop_id and dc.user_id = auth.uid()))
  with check (public.farm_crop_owner(farm_crop_id) = auth.uid()
    or exists (select 1 from public.dacha_crops dc where dc.id = protection_programs.farm_crop_id and dc.user_id = auth.uid()));

drop policy if exists "Agronomists can read shared programs" on public.protection_programs;
create policy "Agronomists can read shared programs" on public.protection_programs
  for select to authenticated
  using (public.farm_crop_shared_with_me(farm_crop_id));

-- ── program_treatments ───────────────────────────────────────────────────────
-- Власник поля (було двічі: «treatments: own» і половина «program_treatments: owner»)
drop policy if exists "treatments: own" on public.program_treatments;
drop policy if exists "program_treatments: owner" on public.program_treatments;
create policy "program_treatments: owner" on public.program_treatments
  for all to authenticated
  using (public.program_owner(program_id) = auth.uid())
  with check (public.program_owner(program_id) = auth.uid());

-- Власник дачі (було «dacha_treatments_owner» і друга половина «program_treatments: owner»)
drop policy if exists "dacha_treatments_owner" on public.program_treatments;
drop policy if exists "program_treatments: dacha owner" on public.program_treatments;
create policy "program_treatments: dacha owner" on public.program_treatments
  for all to authenticated
  using (public.program_dacha_owner(program_id) = auth.uid())
  with check (public.program_dacha_owner(program_id) = auth.uid());

-- Агроном з відкритим полем (field_shares accepted): було по два правила на кожну дію
drop policy if exists "Agronomists can insert treatments for shared programs" on public.program_treatments;
drop policy if exists "Agronomists can read shared treatments" on public.program_treatments;
drop policy if exists "agronomist_delete_treatments" on public.program_treatments;
drop policy if exists "agronomist_insert_treatments" on public.program_treatments;
drop policy if exists "agronomist_update_treatments" on public.program_treatments;
drop policy if exists "program_treatments: shared field agronomist" on public.program_treatments;
create policy "program_treatments: shared field agronomist" on public.program_treatments
  for all to authenticated
  using (public.program_shared_with_me(program_id))
  with check (public.program_shared_with_me(program_id));

commit;
