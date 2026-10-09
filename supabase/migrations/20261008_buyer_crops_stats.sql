-- Заготівельник: «Що закуповую» і статистика на публічній сторінці.
--
-- Було (перевірено на робочій базі):
--  • buyer_crops без жодних обмежень: порожня культура, від'ємний обсяг, «від» більше за «до», будь-яка одиниця;
--    3 записи без власника (user_id = NULL) з липня;
--  • публічна сторінка заготівельника рахувала угоди запитом до deals, а угоди бачать лише їх учасники —
--    стороннім статистика («N угод, M т») не показувалась ніколи; завершені угоди не рахувались зовсім.
-- Стало:
--  • записи без власника видалено, user_id обов'язковий, значення перевіряє база;
--  • buyer_public_stats(заготівельник) — лише кількість угод, тонни й культури (підтверджені й завершені),
--    без сум, цін і контрагентів.

begin;

-- ── buyer_crops ──────────────────────────────────────────────────────────────
delete from public.buyer_crops where user_id is null;
alter table public.buyer_crops alter column user_id set not null;

alter table public.buyer_crops drop constraint if exists buyer_crops_values_check;
alter table public.buyer_crops add constraint buyer_crops_values_check check (
  length(btrim(crop_type)) between 1 and 100
  and (min_qty is null or min_qty >= 0)
  and (max_qty is null or max_qty >= 0)
  and (min_qty is null or max_qty is null or min_qty <= max_qty)
  and unit in ('т', 'кг')
  and (notes is null or length(notes) <= 500)
);

-- ── Публічна статистика заготівельника ───────────────────────────────────────
create or replace function public.buyer_public_stats(p_buyer uuid)
returns json
language sql
stable
security definer
set search_path to 'public'
as $$
  select json_build_object(
    'deals', count(*),
    'tons', coalesce(round(sum(quantity_tons)::numeric, 1), 0),
    'crops', coalesce(json_agg(distinct crop_type) filter (where crop_type is not null), '[]'::json)
  )
  from public.deals
  where buyer_id = p_buyer and status in ('confirmed', 'completed');
$$;

revoke all on function public.buyer_public_stats(uuid) from public;
grant execute on function public.buyer_public_stats(uuid) to anon, authenticated;

commit;
