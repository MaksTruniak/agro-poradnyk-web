-- Статуси угод і завершення платних виділень.
-- Запускати ПІСЛЯ 20261001_profiles_coupons_payments_deals.sql (замінює функцію deals_protect).
--
-- Угоди (як працює інтерфейс сайту):
--   нова угода — завжди 'pending';
--   pending  → confirmed  — лише сторона, яка НЕ пропонувала угоду;
--   pending / confirmed → cancelled — будь-яка сторона;
--   confirmed → completed — лише заготівельник (buyer), «Отримання підтверджено»;
--   completed і cancelled — кінцеві; умови угоди після створення не змінюються.
--   Дати confirmed_at / completed_at / cancelled_at ставить база.
--
-- Виділення: expire_promotions() знімає «Топ» з простроченим promotion_expires_at і виділення агронома
-- без активного PRO / «Топ». Викликається щодня cron-задачею /api/cron/expire-promotions.

begin;

-- ── Угоди: створення ─────────────────────────────────────────────────────────
create or replace function public.deals_before_insert()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  if auth.uid() is null or public.is_admin() then
    return new;
  end if;
  new.status := 'pending';
  new.confirmed_at := null;
  new.completed_at := null;
  new.cancelled_at := null;
  return new;
end;
$$;

drop trigger if exists deals_before_insert on public.deals;
create trigger deals_before_insert
  before insert on public.deals
  for each row execute function public.deals_before_insert();

-- ── Угоди: зміна (замінює версію з попередньої міграції) ──────────────────────
create or replace function public.deals_protect()
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

  -- Сторони та умови угоди незмінні
  new.farmer_id        := old.farmer_id;
  new.buyer_id         := old.buyer_id;
  new.proposed_by      := old.proposed_by;
  new.chat_id          := old.chat_id;
  new.created_at       := old.created_at;
  new.crop_type        := old.crop_type;
  new.quantity_tons    := old.quantity_tons;
  new.price_per_ton    := old.price_per_ton;
  new.total_price      := old.total_price;
  new.delivery_type    := old.delivery_type;
  new.delivery_type_id := old.delivery_type_id;
  new.farm_crop_id     := old.farm_crop_id;
  new.confirmed_at     := old.confirmed_at;
  new.completed_at     := old.completed_at;
  new.cancelled_at     := old.cancelled_at;

  if new.status is distinct from old.status then
    if old.status = 'pending' and new.status = 'confirmed' and me <> old.proposed_by then
      new.confirmed_at := now();
    elsif old.status in ('pending', 'confirmed') and new.status = 'cancelled' then
      new.cancelled_at := now();
    elsif old.status = 'confirmed' and new.status = 'completed' and me = old.buyer_id then
      new.completed_at := now();
    else
      raise exception 'Недозволена зміна статусу угоди: % → %', old.status, new.status using errcode = '42501';
    end if;
  end if;

  return new;
end;
$$;

-- ── Завершення платних виділень ──────────────────────────────────────────────
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
    and not (p.promotion_plan = 'top' and (p.promotion_expires_at is null or p.promotion_expires_at > now()))
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
