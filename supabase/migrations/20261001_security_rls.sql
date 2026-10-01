-- Безпека підписок, AI-лічильника і службових полів users.
-- Запускати ПІСЛЯ 20261001_subscription_profiles.sql і 20261001_admin_ai_functions.sql (потрібна public.is_admin()).
--
-- Було:
--  • subscriptions_admin_all (true/true для public) — будь-хто, навіть без входу, міг читати/змінювати/видаляти будь-яку підписку;
--  • "subscriptions: own" (ALL) — користувач міг записати собі будь-який план;
--  • ai_usage (ALL для свого рядка) — можна було обнулити свій лічильник AI;
--  • "users: update own" без обмежень полів — можна було поставити собі role = 'admin', is_verified, рейтинг тощо.
-- Стало:
--  • підписки та ai_usage користувач лише ЧИТАЄ (свої, а член команди — ще й власника); пише сервер (service role) і адмін;
--  • пробний період видає тригер на users, коли в акаунті з'являється профіль farmer / agronomist;
--  • службові поля users захищені тригером; адмін може оновлювати будь-якого користувача.

begin;

-- ── Допоміжна: чи є поточний користувач активним членом команди власника ────────
create or replace function public.is_team_member_of(owner uuid)
returns boolean
language sql
stable
security definer
set search_path to 'public'
as $$
  select exists (
    select 1 from public.team_members
    where owner_id = owner and member_id = auth.uid() and status = 'active'
  );
$$;

-- ── subscriptions ─────────────────────────────────────────────────────────────
drop policy if exists "subscriptions_admin_all" on public.subscriptions;
drop policy if exists "subscriptions: own" on public.subscriptions;

create policy "subscriptions: read own or team owner" on public.subscriptions
  for select to authenticated
  using (auth.uid() = user_id or public.is_team_member_of(user_id));

create policy "subscriptions: admin all" on public.subscriptions
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ── ai_usage ──────────────────────────────────────────────────────────────────
drop policy if exists "Users manage own usage" on public.ai_usage;
drop policy if exists "ai_usage_own" on public.ai_usage;

create policy "ai_usage: read own or team owner" on public.ai_usage
  for select to authenticated
  using (auth.uid() = user_id or public.is_team_member_of(user_id));

create policy "ai_usage: admin all" on public.ai_usage
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ── users: адмін може оновлювати будь-кого (верифікація заготівельників тощо) ─────
drop policy if exists "users: admin update" on public.users;
create policy "users: admin update" on public.users
  for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ── users: захист службових полів ─────────────────────────────────────────────
-- Перевірки не діють для service role / SQL Editor (auth.uid() is null) і для адміна.
create or replace function public.users_protect_columns()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  allowed text[] := array['farmer', 'agronomist', 'buyer', 'dacha', 'seller'];
begin
  if auth.uid() is null or public.is_admin() then
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

  -- UPDATE: роль можна задати лише якщо її ще не було (рядок міг створитись без ролі)
  if old.role is not null then
    new.role := old.role;
  elsif new.role is not null and not (new.role = any(allowed)) then
    raise exception 'role % is not allowed', new.role using errcode = '42501';
  end if;

  -- roles: можна лише додавати звичайні ролі
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

drop trigger if exists users_protect_columns on public.users;
create trigger users_protect_columns
  before insert or update on public.users
  for each row execute function public.users_protect_columns();

-- ── Пробний період: 6 місяців при появі профілю farmer (Бізнес) або agronomist (PRO) ──
-- Один раз на профіль: якщо підписка профілю вже є — не чіпаємо.
create or replace function public.grant_profile_trial()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  new_set text[] := array_remove(array_append(coalesce(new.roles, '{}'), new.role), null);
  old_set text[] := '{}';
begin
  if tg_op = 'UPDATE' then
    old_set := array_remove(array_append(coalesce(old.roles, '{}'), old.role), null);
  end if;

  if 'farmer' = any(new_set) and not ('farmer' = any(old_set)) then
    insert into public.subscriptions (user_id, profile, plan, expires_at)
    values (new.id, 'farmer', 'business', now() + interval '6 months')
    on conflict (user_id, profile) do nothing;
  end if;

  if 'agronomist' = any(new_set) and not ('agronomist' = any(old_set)) then
    insert into public.subscriptions (user_id, profile, plan, expires_at)
    values (new.id, 'agronomist', 'pro', now() + interval '6 months')
    on conflict (user_id, profile) do nothing;
  end if;

  return new;
end;
$$;

drop trigger if exists grant_profile_trial on public.users;
create trigger grant_profile_trial
  after insert or update of role, roles on public.users
  for each row execute function public.grant_profile_trial();

commit;
