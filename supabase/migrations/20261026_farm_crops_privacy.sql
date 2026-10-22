-- Приватність культур: приховані з каталогу культури більше не публічні. Безпечно запускати повторно.
-- Запускати ПІСЛЯ 20261025_inspections.sql.
--
-- Було (перевірено на робочій базі 2026-10-22):
--  • farm_crops_public_read (SELECT, using true) — будь-хто, навіть без входу, читав усі культури, зокрема приховані
--    («Показувати у каталозі фермерів» вимкнено): сорт, площу, плановий урожай, рік посадки, залишок;
--  • агроном зі співпрацею (agreements pending / active) бачив культури клієнта лише завдяки цьому правилу;
--  • get_farmers_with_crops — з правами того, хто дивиться, а поля (farms) чужим не видно з 20261001_farms_privacy.sql,
--    тож каталог фермерів показував культури лише самому фермеру.
-- Стало:
--  • усім — лише культури, відкриті в каталозі (show_in_catalog не false);
--  • приховані — власник і команда (як і було), агроном з accepted field_shares (як і було), агроном зі співпрацею
--    pending / active (як для полів), учасники угоди щодо цієї культури;
--  • get_farmers_with_crops — SECURITY DEFINER, лише відкриті культури й публічні поля профілю (як public_profiles).
-- Правила на запис не змінюються.

begin;

drop policy if exists "farm_crops_public_read" on public.farm_crops;
drop policy if exists "farm_crops: catalog read" on public.farm_crops;
create policy "farm_crops: catalog read" on public.farm_crops
  for select to anon, authenticated
  using (show_in_catalog is distinct from false);

-- Перевірки — через SECURITY DEFINER функції: правила угод, нагадувань і техкарт самі звертаються до farm_crops,
-- і підзапит із правилами доступу всередині правила farm_crops давав замкнене коло (тайм-аут запитів).
create or replace function public.farm_crop_agronomist_can_read(p_farm_id uuid)
returns boolean
language sql
stable
security definer
set search_path to 'public'
as $$
  select exists (
    select 1 from public.farms f
    join public.agreements a on a.farmer_id = f.user_id
    where f.id = p_farm_id and a.agronomist_id = auth.uid() and a.status in ('pending', 'active')
  );
$$;

create or replace function public.farm_crop_in_my_deal(p_farm_crop_id uuid)
returns boolean
language sql
stable
security definer
set search_path to 'public'
as $$
  select exists (
    select 1 from public.deals d
    where d.farm_crop_id = p_farm_crop_id and auth.uid() in (d.buyer_id, d.farmer_id)
  );
$$;

drop policy if exists "farm_crops: agronomist with agreement" on public.farm_crops;
create policy "farm_crops: agronomist with agreement" on public.farm_crops
  for select to authenticated
  using (public.farm_crop_agronomist_can_read(farm_id));

drop policy if exists "farm_crops: deal participant" on public.farm_crops;
create policy "farm_crops: deal participant" on public.farm_crops
  for select to authenticated
  using (public.farm_crop_in_my_deal(id));

create or replace function public.get_farmers_with_crops()
returns table(id uuid, name text, region text, city text, farmer_rating numeric, is_verified_farmer boolean, crops text[])
language sql
stable
security definer
set search_path to 'public'
as $$
  select
    u.id, u.name, u.region, u.city,
    u.farmer_rating, u.is_verified_farmer,
    coalesce(array_agg(distinct fc.crop_type) filter (where fc.crop_type is not null), '{}'::text[]) as crops
  from public.users u
  left join public.farms f on f.user_id = u.id
  left join public.farm_crops fc on fc.farm_id = f.id and fc.show_in_catalog is distinct from false
  where u.role = 'farmer'
  group by u.id, u.name, u.region, u.city, u.farmer_rating, u.is_verified_farmer
  order by u.name;
$$;
grant execute on function public.get_farmers_with_crops() to anon, authenticated;

commit;
