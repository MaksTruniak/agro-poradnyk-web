-- Маркетплейс, хеш пароля працівника, команда, сорти, форма контактів.
-- Запускати ПІСЛЯ 20261001_farms_privacy.sql (потрібна public.is_admin()).
--
-- Було:
--  • orders / order_items: ціну й суму замовлення задавав браузер; покупець міг змінити ціну після оформлення;
--    продавець не міг змінити статус замовлення (лише читання);
--  • harvest_workers.password_hash читався з браузера (власником сезону й самим працівником);
--  • члени команди бачили поля власника ще до прийняття запрошення;
--  • varieties: адмін не міг редагувати сорти (не було правила на оновлення);
--  • contact_requests: без обмежень на довжину та частоту — легко заспамити.

begin;

-- ── order_items: ціна завжди з пропозиції продавця, після оформлення — незмінні ─
create or replace function public.order_items_protect()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
declare offer_price numeric;
begin
  if auth.uid() is null or public.is_admin() then
    return new;
  end if;

  if tg_op = 'INSERT' then
    if not exists (select 1 from public.orders o where o.id = new.order_id and o.user_id = auth.uid()) then
      raise exception 'Замовлення не належить користувачу' using errcode = '42501';
    end if;
    select price into offer_price from public.seller_offers where id = new.offer_id;
    if offer_price is null then
      raise exception 'Пропозицію не знайдено' using errcode = '42501';
    end if;
    if new.quantity is null or new.quantity <= 0 then
      raise exception 'Некоректна кількість' using errcode = '22023';
    end if;
    new.price := offer_price;
    new.buyer_user_id := auth.uid();
    new.status := 'pending';
    return new;
  end if;

  -- UPDATE: склад і ціна позиції незмінні
  new.order_id := old.order_id;
  new.offer_id := old.offer_id;
  new.quantity := old.quantity;
  new.price := old.price;
  new.buyer_user_id := old.buyer_user_id;
  new.status := old.status;
  return new;
end;
$$;

drop trigger if exists order_items_protect on public.order_items;
create trigger order_items_protect
  before insert or update on public.order_items
  for each row execute function public.order_items_protect();

-- Сума замовлення = сума позицій (рахує база)
create or replace function public.order_items_recalc_total()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
declare oid uuid := coalesce(new.order_id, old.order_id);
begin
  perform set_config('app.system_update', 'on', true);
  update public.orders
  set total = coalesce((select sum(price * quantity) from public.order_items where order_id = oid), 0)
  where id = oid;
  perform set_config('app.system_update', 'off', true);
  return null;
end;
$$;

drop trigger if exists order_items_recalc_total on public.order_items;
create trigger order_items_recalc_total
  after insert or update or delete on public.order_items
  for each row execute function public.order_items_recalc_total();

-- ── orders: сума — від бази; статуси — покупець скасовує, продавець веде ────────
create or replace function public.is_order_seller(p_seller_id uuid)
returns boolean
language sql
stable
security definer
set search_path to 'public'
as $$
  select exists (select 1 from public.seller_profiles sp where sp.id = p_seller_id and sp.user_id = auth.uid());
$$;

drop policy if exists "orders: seller updates" on public.orders;
create policy "orders: seller updates" on public.orders
  for update to authenticated
  using (public.is_order_seller(seller_id))
  with check (public.is_order_seller(seller_id));

create or replace function public.orders_protect()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
declare me uuid := auth.uid();
begin
  if me is null or public.is_admin() or current_setting('app.system_update', true) = 'on' then
    return new;
  end if;

  if tg_op = 'INSERT' then
    new.user_id := me;
    new.status := 'pending';
    new.total := 0;  -- порахує тригер order_items_recalc_total
    return new;
  end if;

  new.user_id := old.user_id;
  new.seller_id := old.seller_id;
  new.total := old.total;
  new.created_at := old.created_at;

  if new.status is distinct from old.status then
    if me = old.user_id and old.status = 'pending' and new.status = 'cancelled' then
      null;
    elsif public.is_order_seller(old.seller_id)
          and old.status not in ('completed', 'cancelled')
          and new.status in ('processing', 'shipped', 'completed', 'cancelled') then
      null;
    else
      raise exception 'Недозволена зміна статусу замовлення: % → %', old.status, new.status using errcode = '42501';
    end if;
  end if;

  -- Покупець не змінює доставку/оплату після оформлення; продавець — лише статус
  if me <> old.user_id or old.status <> 'pending' then
    new.delivery_method := old.delivery_method;
    new.delivery_address := old.delivery_address;
    new.payment_method := old.payment_method;
    new.comment := old.comment;
  end if;

  return new;
end;
$$;

drop trigger if exists orders_protect on public.orders;
create trigger orders_protect
  before insert or update on public.orders
  for each row execute function public.orders_protect();

-- ── harvest_workers.password_hash: недоступний з браузера ────────────────────
-- (працівники входять через Supabase Auth; колонка не використовується кодом)
revoke select, insert, update on public.harvest_workers from anon, authenticated;
grant select (id, owner_id, first_name, last_name, phone, email, login, created_at, auth_user_id, email_login)
  on public.harvest_workers to authenticated;
grant insert (owner_id, first_name, last_name, phone, email, login, auth_user_id, email_login)
  on public.harvest_workers to authenticated;
grant update (first_name, last_name, phone, email, login)
  on public.harvest_workers to authenticated;

-- ── farms: правило для команди без перевірки статусу запрошення ──────────────
-- Лишається "team read farms" (is_team_member) і правила власника.
drop policy if exists "Users can view own or team farms" on public.farms;

-- ── varieties: адмін керує сортами; фермер додає новий сорт ──────────────────
drop policy if exists "varieties: admin all" on public.varieties;
create policy "varieties: admin all" on public.varieties
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- ── contact_requests: обмеження довжини й частоти ────────────────────────────
alter table public.contact_requests drop constraint if exists contact_requests_lengths;
alter table public.contact_requests add constraint contact_requests_lengths check (
  coalesce(length(name), 0) <= 200 and coalesce(length(email), 0) <= 200
  and coalesce(length(phone), 0) <= 50 and coalesce(length(type), 0) <= 50
) not valid;

create or replace function public.contact_requests_rate_limit()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  if auth.role() = 'service_role' then
    return new;
  end if;
  -- Не більше 3 заявок з тим самим email або телефоном за 10 хвилин
  if (select count(*) from public.contact_requests c
      where c.created_at > now() - interval '10 minutes'
        and ((new.email is not null and c.email = new.email) or (new.phone is not null and c.phone = new.phone))) >= 3 then
    raise exception 'Забагато заявок. Спробуйте пізніше.' using errcode = '54000';
  end if;
  -- Загальний запобіжник: не більше 100 заявок за годину
  if (select count(*) from public.contact_requests c where c.created_at > now() - interval '1 hour') >= 100 then
    raise exception 'Забагато заявок. Спробуйте пізніше.' using errcode = '54000';
  end if;
  return new;
end;
$$;

drop trigger if exists contact_requests_rate_limit on public.contact_requests;
create trigger contact_requests_rate_limit
  before insert on public.contact_requests
  for each row execute function public.contact_requests_rate_limit();

commit;
