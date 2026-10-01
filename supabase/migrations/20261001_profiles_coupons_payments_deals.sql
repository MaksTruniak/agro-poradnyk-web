-- Права доступу: профілі агрономів і продавців, купони, платежі, угоди, відгуки. Поля для покупки «Топ».
-- Запускати ПІСЛЯ 20261001_users_privacy_ratings.sql (потрібні is_admin() і прапорець app.system_update).
--
-- Було:
--  • coupons: будь-хто міг створити собі купон (INSERT true) і читати всі купони;
--  • agronomist_profiles: будь-який залогінений міг змінити/видалити будь-чий профіль; агроном сам ставив собі
--    is_verified, рейтинг, promotion_plan, виділення;
--  • payments: будь-хто міг вставити «оплачений» платіж;
--  • deals / відгуки: угоду можна було створити з будь-ким, відгук — на будь-кого, агроному — без обмежень;
--    учасник угоди міг підмінити farmer_id / buyer_id;
--  • seller_profiles: продавець сам ставив собі is_verified і рейтинг;
--  • callback оплати «Топ» писав неіснуючі поля promotion_expires_at / promotion_plan → покупка не застосовувалась.

begin;

-- ── Поля для покупки «Топ агронома» / «Топ продавця» ─────────────────────────
alter table public.agronomist_profiles add column if not exists promotion_expires_at timestamptz;
alter table public.seller_profiles add column if not exists promotion_plan text;
alter table public.seller_profiles add column if not exists promotion_expires_at timestamptz;

-- ── coupons: лише свої (читання) і адмін ─────────────────────────────────────
drop policy if exists "coupons_admin_insert" on public.coupons;
drop policy if exists "coupons_admin_select" on public.coupons;
drop policy if exists "coupons: admin all" on public.coupons;
create policy "coupons: admin all" on public.coupons
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ── payments: пише лише сервер (service role); читають власник і адмін ───────
drop policy if exists "Service role insert payments" on public.payments;
drop policy if exists "insert_own" on public.payments;
drop policy if exists "select_own" on public.payments;
drop policy if exists "payments: admin read" on public.payments;
create policy "payments: admin read" on public.payments
  for select to authenticated
  using (public.is_admin());

-- ── agronomist_profiles ──────────────────────────────────────────────────────
drop policy if exists "authenticated write agronomist_profiles" on public.agronomist_profiles;
drop policy if exists "agronomist_profiles: own" on public.agronomist_profiles;
drop policy if exists "agronomist_profiles: own insert" on public.agronomist_profiles;
drop policy if exists "agronomist_profiles: own update" on public.agronomist_profiles;
drop policy if exists "agronomist_profiles: own delete" on public.agronomist_profiles;
drop policy if exists "agronomist_profiles: admin all" on public.agronomist_profiles;
create policy "agronomist_profiles: own insert" on public.agronomist_profiles
  for insert to authenticated with check (auth.uid() = user_id);
create policy "agronomist_profiles: own update" on public.agronomist_profiles
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "agronomist_profiles: own delete" on public.agronomist_profiles
  for delete to authenticated using (auth.uid() = user_id);
create policy "agronomist_profiles: admin all" on public.agronomist_profiles
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Захист службових полів профілю агронома.
-- Підняття (boosted_at / is_highlighted) — лише з активним PRO агронома або оплаченим «Топ», не частіше ніж раз на 5 днів.
create or replace function public.agronomist_profiles_protect()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
declare can_boost boolean;
begin
  if auth.uid() is null or public.is_admin() or current_setting('app.system_update', true) = 'on' then
    return new;
  end if;

  if tg_op = 'INSERT' then
    new.is_verified := false;
    new.rating := null;
    new.reviews_count := null;
    new.promotion_plan := null;
    new.promotion_expires_at := null;
    new.boosted_at := null;
    new.is_highlighted := false;
    return new;
  end if;

  new.user_id := old.user_id;
  new.is_verified := old.is_verified;
  new.rating := old.rating;
  new.reviews_count := old.reviews_count;
  new.promotion_plan := old.promotion_plan;
  new.promotion_expires_at := old.promotion_expires_at;
  new.max_clients := old.max_clients;

  if new.boosted_at is distinct from old.boosted_at or (new.is_highlighted and not coalesce(old.is_highlighted, false)) then
    can_boost := (
      exists (
        select 1 from public.subscriptions s
        where s.user_id = old.user_id and s.profile = 'agronomist' and s.plan = 'pro'
          and (s.expires_at is null or s.expires_at > now())
      )
      or (old.promotion_plan = 'top' and (old.promotion_expires_at is null or old.promotion_expires_at > now()))
    ) and (old.boosted_at is null or old.boosted_at <= now() - interval '5 days');

    if can_boost then
      new.boosted_at := now();
      new.is_highlighted := true;
    else
      new.boosted_at := old.boosted_at;
      new.is_highlighted := old.is_highlighted;
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists agronomist_profiles_protect on public.agronomist_profiles;
create trigger agronomist_profiles_protect
  before insert or update on public.agronomist_profiles
  for each row execute function public.agronomist_profiles_protect();

-- ── seller_profiles ──────────────────────────────────────────────────────────
drop policy if exists "seller_profiles: own" on public.seller_profiles;
drop policy if exists "seller_profiles: own insert" on public.seller_profiles;
drop policy if exists "seller_profiles: own update" on public.seller_profiles;
drop policy if exists "seller_profiles: own delete" on public.seller_profiles;
drop policy if exists "seller_profiles: admin all" on public.seller_profiles;
create policy "seller_profiles: own insert" on public.seller_profiles
  for insert to authenticated with check (auth.uid() = user_id);
create policy "seller_profiles: own update" on public.seller_profiles
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "seller_profiles: own delete" on public.seller_profiles
  for delete to authenticated using (auth.uid() = user_id);
create policy "seller_profiles: admin all" on public.seller_profiles
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

create or replace function public.seller_profiles_protect()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  if auth.uid() is null or public.is_admin() or current_setting('app.system_update', true) = 'on' then
    return new;
  end if;
  if tg_op = 'INSERT' then
    new.is_verified := false;
    new.rating := null;
    new.reviews_count := null;
    new.promotion_plan := null;
    new.promotion_expires_at := null;
    return new;
  end if;
  new.user_id := old.user_id;
  new.is_verified := old.is_verified;
  new.rating := old.rating;
  new.reviews_count := old.reviews_count;
  new.promotion_plan := old.promotion_plan;
  new.promotion_expires_at := old.promotion_expires_at;
  return new;
end;
$$;

drop trigger if exists seller_profiles_protect on public.seller_profiles;
create trigger seller_profiles_protect
  before insert or update on public.seller_profiles
  for each row execute function public.seller_profiles_protect();

-- ── deals: створювати лише угоду, де ти — одна зі сторін; сторони угоди незмінні ──
drop policy if exists "chat participants can create deals" on public.deals;
create policy "chat participants can create deals" on public.deals
  for insert to authenticated
  with check (
    proposed_by = auth.uid()
    and auth.uid() in (farmer_id, buyer_id)
    and farmer_id is distinct from buyer_id
  );

create or replace function public.deals_protect()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  if auth.uid() is null or public.is_admin() then
    return new;
  end if;
  new.farmer_id := old.farmer_id;
  new.buyer_id := old.buyer_id;
  new.proposed_by := old.proposed_by;
  new.chat_id := old.chat_id;
  new.created_at := old.created_at;
  return new;
end;
$$;

drop trigger if exists deals_protect on public.deals;
create trigger deals_protect
  before update on public.deals
  for each row execute function public.deals_protect();

-- ── deal_reviews: лише учасник завершеної угоди про іншу сторону, один раз ───
create or replace function public.can_review_deal(p_deal uuid, p_reviewee uuid)
returns boolean
language sql
stable
security definer
set search_path to 'public'
as $$
  select exists (
    select 1 from public.deals d
    where d.id = p_deal
      and d.status = 'completed'
      and (
        (d.farmer_id = auth.uid() and d.buyer_id = p_reviewee)
        or (d.buyer_id = auth.uid() and d.farmer_id = p_reviewee)
      )
  )
  and not exists (
    select 1 from public.deal_reviews r
    where r.deal_id = p_deal and r.reviewer_id = auth.uid()
  );
$$;

drop policy if exists "users can insert own reviews" on public.deal_reviews;
create policy "users can insert own reviews" on public.deal_reviews
  for insert to authenticated
  with check (reviewer_id = auth.uid() and public.can_review_deal(deal_id, reviewee_id));

-- ── agronomist_reviews: лише фермер, який співпрацював з агрономом, один раз ──
create or replace function public.can_review_agronomist(p_agronomist uuid)
returns boolean
language sql
stable
security definer
set search_path to 'public'
as $$
  select exists (
    select 1 from public.agreements a
    where a.farmer_id = auth.uid() and a.agronomist_id = p_agronomist and a.started_at is not null
  )
  and not exists (
    select 1 from public.agronomist_reviews r
    where r.farmer_id = auth.uid() and r.agronomist_id = p_agronomist
  );
$$;

drop policy if exists "insert own review" on public.agronomist_reviews;
create policy "insert own review" on public.agronomist_reviews
  for insert to authenticated
  with check (auth.uid() = farmer_id and public.can_review_agronomist(agronomist_id));

commit;
