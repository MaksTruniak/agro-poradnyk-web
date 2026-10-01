-- Приватність полів: адреса й кадастровий номер більше не публічні.
-- Запускати ПІСЛЯ 20261001_messages_shares_catalog_agreements_harvest.sql.
--
-- Було: farms_public_read (SELECT true) — будь-хто, навіть без входу, бачив усі поля з адресою й кадастровим номером.
-- Стало:
--  • публічні дані поля (назва, регіон, місто, площа) — через представлення public_farms
--    (публічна сторінка фермера, запити від заготівельників);
--  • повні дані поля — власник, його команда, агроном з accepted field_shares (як і раніше)
--    і агроном, з яким у фермера є співпраця (agreements: pending / active);
--  • культури (farm_crops) лишаються публічними — їх показує публічна сторінка фермера.

begin;

drop policy if exists "farms_public_read" on public.farms;

create or replace view public.public_farms as
  select id, user_id, name, region, city, hectares, created_at
  from public.farms;

grant select on public.public_farms to anon, authenticated;

drop policy if exists "farms: agronomist with agreement" on public.farms;
create policy "farms: agronomist with agreement" on public.farms
  for select to authenticated
  using (exists (
    select 1 from public.agreements a
    where a.agronomist_id = auth.uid()
      and a.farmer_id = farms.user_id
      and a.status in ('pending', 'active')
  ));

commit;
