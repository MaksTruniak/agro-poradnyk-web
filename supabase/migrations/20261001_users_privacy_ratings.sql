-- Приватність таблиці users і рейтинги.
-- Запускати ПІСЛЯ 20261001_security_rls.sql (потрібні public.is_admin() і тригер users_protect_columns).
--
-- Було: будь-хто (навіть без входу) читав усю таблицю users — email, телефон, IBAN, ЄДРПОУ, адреси.
-- Стало:
--  • users читає лише власник рядка та адмін;
--  • публічні дані інших користувачів — через представлення public_profiles (без контактів і реквізитів);
--  • реквізити контрагента для накладної — функція deal_party_details(deal_id), лише учасникам угоди;
--  • рейтинги фермера/заготівельника (deal_reviews) і агронома (agronomist_reviews) рахує база тригерами.

begin;

-- ── users: лише свій рядок і адмін ───────────────────────────────────────────
drop policy if exists "Users can read all profiles" on public.users;
drop policy if exists "Farmers visible to all" on public.users;
drop policy if exists "Farmers visible to authenticated users" on public.users;
drop policy if exists "Public users are viewable by everyone" on public.users;

drop policy if exists "users: admin read" on public.users;
create policy "users: admin read" on public.users
  for select to authenticated
  using (public.is_admin());

-- ── Публічний профіль (без email, телефону, адреси, реквізитів, службових полів) ──
-- Представлення виконується з правами власника, тому обходить RLS users і показує лише ці колонки.
create or replace view public.public_profiles as
  select
    id, name, avatar_url, role, roles, region, city, company_name, created_at,
    farmer_rating, farmer_reviews_count, buyer_rating, buyer_reviews_count,
    is_verified, is_verified_buyer, is_verified_agronomist, is_verified_farmer
  from public.users;

grant select on public.public_profiles to anon, authenticated;

-- ── Реквізити сторін угоди (для накладної) ───────────────────────────────────
create or replace function public.deal_party_details(p_deal_id uuid)
returns table(
  user_id uuid, name text, phone text, city text, region text, company_name text,
  edrpou text, iban text, bank_name text, legal_address text
)
language plpgsql
stable
security definer
set search_path to 'public'
as $$
declare d record;
begin
  select farmer_id, buyer_id into d from public.deals where id = p_deal_id;
  if not found or not (auth.uid() in (d.farmer_id, d.buyer_id) or public.is_admin()) then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  return query
    select u.id, u.name, u.phone, u.city, u.region, u.company_name, u.edrpou, u.iban, u.bank_name, u.legal_address
    from public.users u
    where u.id in (d.farmer_id, d.buyer_id);
end;
$$;

revoke all on function public.deal_party_details(uuid) from public, anon;
grant execute on function public.deal_party_details(uuid) to authenticated;

-- ── Обхід захисту службових полів для системних тригерів ─────────────────────
-- Рейтинги оновлюються тригерами від імені користувача, що залишив відгук; без цього
-- users_protect_columns повернув би старе значення.
create or replace function public.users_protect_columns()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  allowed text[] := array['farmer', 'agronomist', 'buyer', 'dacha', 'seller'];
begin
  if auth.uid() is null or public.is_admin()
     or current_setting('app.system_update', true) = 'on' then
    return new;
  end if;

  if tg_op = 'INSERT' then
    if new.role is not null and not (new.role = any(allowed)) then
      raise exception 'role % is not allowed', new.role using errcode = '42501';
    end if;
    if not (coalesce(new.roles, '{}') <@ allowed) then
      raise exception 'roles are not allowed' using errcode = '42501';
    end if;
    new.is_admin := false;
    new.is_verified := false;
    new.is_verified_buyer := false;
    new.is_verified_agronomist := false;
    new.is_verified_farmer := false;
    new.farmer_rating := null;
    new.farmer_reviews_count := null;
    new.buyer_rating := null;
    new.buyer_reviews_count := null;
    return new;
  end if;

  if old.role is not null then
    new.role := old.role;
  elsif new.role is not null and not (new.role = any(allowed)) then
    raise exception 'role % is not allowed', new.role using errcode = '42501';
  end if;

  if not (coalesce(new.roles, '{}') <@ (allowed || coalesce(old.roles, '{}'))) then
    raise exception 'roles are not allowed' using errcode = '42501';
  end if;

  new.is_admin := old.is_admin;
  new.is_verified := old.is_verified;
  new.is_verified_buyer := old.is_verified_buyer;
  new.is_verified_agronomist := old.is_verified_agronomist;
  new.is_verified_farmer := old.is_verified_farmer;
  new.farmer_rating := old.farmer_rating;
  new.farmer_reviews_count := old.farmer_reviews_count;
  new.buyer_rating := old.buyer_rating;
  new.buyer_reviews_count := old.buyer_reviews_count;
  return new;
end;
$$;

-- ── Рейтинг фермера / заготівельника з відгуків по угодах ─────────────────────
-- Роль оцінюваного визначається угодою: farmer_id → рейтинг фермера, buyer_id → рейтинг заготівельника.
create or replace function public.recalc_deal_ratings(p_user uuid)
returns void
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  f_avg numeric; f_cnt int; b_avg numeric; b_cnt int;
begin
  select round(avg(r.rating)::numeric, 1), count(*) into f_avg, f_cnt
  from public.deal_reviews r join public.deals d on d.id = r.deal_id
  where r.reviewee_id = p_user and d.farmer_id = p_user;

  select round(avg(r.rating)::numeric, 1), count(*) into b_avg, b_cnt
  from public.deal_reviews r join public.deals d on d.id = r.deal_id
  where r.reviewee_id = p_user and d.buyer_id = p_user;

  perform set_config('app.system_update', 'on', true);
  update public.users
  set farmer_rating = f_avg, farmer_reviews_count = f_cnt,
      buyer_rating = b_avg, buyer_reviews_count = b_cnt
  where id = p_user;
  perform set_config('app.system_update', 'off', true);
end;
$$;

create or replace function public.deal_reviews_recalc()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  if tg_op in ('INSERT', 'UPDATE') then
    perform public.recalc_deal_ratings(new.reviewee_id);
  end if;
  if tg_op in ('DELETE', 'UPDATE') and (tg_op = 'DELETE' or old.reviewee_id is distinct from new.reviewee_id) then
    perform public.recalc_deal_ratings(old.reviewee_id);
  end if;
  return null;
end;
$$;

drop trigger if exists deal_reviews_recalc on public.deal_reviews;
create trigger deal_reviews_recalc
  after insert or update or delete on public.deal_reviews
  for each row execute function public.deal_reviews_recalc();

-- ── Рейтинг агронома з agronomist_reviews ────────────────────────────────────
create or replace function public.recalc_agronomist_rating(p_agronomist uuid)
returns void
language plpgsql
security definer
set search_path to 'public'
as $$
declare a_avg numeric; a_cnt int;
begin
  select round(avg(rating)::numeric, 1), count(*) into a_avg, a_cnt
  from public.agronomist_reviews where agronomist_id = p_agronomist;

  perform set_config('app.system_update', 'on', true);
  update public.agronomist_profiles
  set rating = a_avg, reviews_count = a_cnt
  where user_id = p_agronomist;
  perform set_config('app.system_update', 'off', true);
end;
$$;

create or replace function public.agronomist_reviews_recalc()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  if tg_op in ('INSERT', 'UPDATE') then
    perform public.recalc_agronomist_rating(new.agronomist_id);
  end if;
  if tg_op in ('DELETE', 'UPDATE') and (tg_op = 'DELETE' or old.agronomist_id is distinct from new.agronomist_id) then
    perform public.recalc_agronomist_rating(old.agronomist_id);
  end if;
  return null;
end;
$$;

drop trigger if exists agronomist_reviews_recalc on public.agronomist_reviews;
create trigger agronomist_reviews_recalc
  after insert or update or delete on public.agronomist_reviews
  for each row execute function public.agronomist_reviews_recalc();

-- Перерахувати поточні рейтинги (раніше вони не оновлювались через RLS)
select public.recalc_deal_ratings(u.id)
from (select distinct reviewee_id as id from public.deal_reviews) u;
select public.recalc_agronomist_rating(a.id)
from (select distinct agronomist_id as id from public.agronomist_reviews) a;

commit;
