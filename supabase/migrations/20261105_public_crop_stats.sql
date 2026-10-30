-- «Що вирощують фермери» на головній: функція працювала з правами того, хто дивиться,
-- тож RLS на farm_crops давав гостю порожній список, а фермеру — лише його культури.
-- Тепер рахує по всій платформі й віддає тільки назву культури та кількість фермерів.
drop function if exists public.get_crop_stats();

create function public.get_crop_stats()
returns table (crop_type text, count integer)
language sql
stable
security definer
set search_path to 'public'
as $$
  select fc.crop_type::text, count(distinct f.user_id)::integer as count
  from public.farm_crops fc
  join public.farms f on f.id = fc.farm_id
  where coalesce(trim(fc.crop_type), '') <> ''
  group by fc.crop_type
  order by count desc, fc.crop_type
  limit 12
$$;

revoke all on function public.get_crop_stats() from public;
grant execute on function public.get_crop_stats() to anon, authenticated;
