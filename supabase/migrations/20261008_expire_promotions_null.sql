-- Щоденне зняття просування: агроном без «Топ» (promotion_plan = NULL) лишався виділеним назавжди.
-- Запускати ПІСЛЯ 20261001_deal_status_promotions.sql.
--
-- Було: not (p.promotion_plan = 'top' and …) при promotion_plan = NULL дає NULL, і рядок не оновлювався —
-- після закінчення PRO картка агронома лишалась виділеною й угорі каталогу.
-- Стало: «Топ активний» рахується через coalesce(…, false).

begin;

create or replace function public.expire_promotions()
returns json
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  top_agro int; top_seller int; unhighlighted int;
begin
  perform set_config('app.system_update', 'on', true);

  update public.agronomist_profiles
  set promotion_plan = null
  where promotion_plan = 'top' and promotion_expires_at is not null and promotion_expires_at <= now();
  get diagnostics top_agro = row_count;

  update public.seller_profiles
  set promotion_plan = null
  where promotion_plan = 'top' and promotion_expires_at is not null and promotion_expires_at <= now();
  get diagnostics top_seller = row_count;

  update public.agronomist_profiles p
  set is_highlighted = false
  where p.is_highlighted
    and not coalesce(p.promotion_plan = 'top' and (p.promotion_expires_at is null or p.promotion_expires_at > now()), false)
    and not exists (
      select 1 from public.subscriptions s
      where s.user_id = p.user_id and s.profile = 'agronomist' and s.plan = 'pro'
        and (s.expires_at is null or s.expires_at > now())
    );
  get diagnostics unhighlighted = row_count;

  perform set_config('app.system_update', 'off', true);
  return json_build_object('top_agronomist_expired', top_agro, 'top_seller_expired', top_seller, 'unhighlighted', unhighlighted);
end;
$$;

revoke all on function public.expire_promotions() from public, anon, authenticated;
grant execute on function public.expire_promotions() to service_role;

commit;
