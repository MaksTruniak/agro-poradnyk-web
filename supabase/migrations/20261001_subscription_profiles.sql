-- Окремі підписки та AI-ліміти для профілів «Фермер» і «Агроном» одного акаунта.
-- Запускати в Supabase SQL Editor ДО деплою коду, що використовує колонку profile.

begin;

-- ── subscriptions ────────────────────────────────────────────────────────────
alter table public.subscriptions
  add column if not exists profile text not null default 'farmer';

-- План агронома ('pro') → профіль агронома
update public.subscriptions set profile = 'agronomist' where plan = 'pro';

-- Агрономи без фермерського профілю отримували при реєстрації фермерський 'business' (пробний).
-- Переносимо їх на профіль агронома з планом PRO на той самий строк.
update public.subscriptions s
set profile = 'agronomist', plan = 'pro'
from public.users u
where u.id = s.user_id
  and s.profile = 'farmer'
  and s.plan = 'business'
  and u.role = 'agronomist'
  and not (coalesce(u.roles, array[]::text[]) && array['farmer', 'dacha']::text[]);

alter table public.subscriptions
  drop constraint if exists subscriptions_profile_check;
alter table public.subscriptions
  add constraint subscriptions_profile_check check (profile in ('farmer', 'agronomist'));

-- Прибираємо унікальність лише по user_id (ім'я обмеження може відрізнятись — шукаємо динамічно)
do $$
declare r record;
begin
  for r in
    select con.conname
    from pg_constraint con
    join pg_class rel on rel.oid = con.conrelid
    join pg_namespace ns on ns.oid = rel.relnamespace
    where ns.nspname = 'public' and rel.relname = 'subscriptions'
      and con.contype = 'u'
      and array_length(con.conkey, 1) = 1
      and con.conkey[1] = (select attnum from pg_attribute where attrelid = rel.oid and attname = 'user_id')
  loop
    execute format('alter table public.subscriptions drop constraint %I', r.conname);
  end loop;
  for r in
    select i.relname as idxname
    from pg_index x
    join pg_class i on i.oid = x.indexrelid
    join pg_class t on t.oid = x.indrelid
    join pg_namespace ns on ns.oid = t.relnamespace
    where ns.nspname = 'public' and t.relname = 'subscriptions'
      and x.indisunique and not x.indisprimary
      and x.indnatts = 1
      and x.indkey[0] = (select attnum from pg_attribute where attrelid = t.oid and attname = 'user_id')
  loop
    execute format('drop index if exists public.%I', r.idxname);
  end loop;
end $$;

alter table public.subscriptions
  add constraint subscriptions_user_profile_key unique (user_id, profile);

-- ── ai_usage ─────────────────────────────────────────────────────────────────
alter table public.ai_usage
  add column if not exists profile text not null default 'farmer';

update public.ai_usage a
set profile = 'agronomist'
from public.users u
where u.id = a.user_id
  and u.role = 'agronomist'
  and not (coalesce(u.roles, array[]::text[]) && array['farmer', 'dacha']::text[]);

alter table public.ai_usage
  drop constraint if exists ai_usage_profile_check;
alter table public.ai_usage
  add constraint ai_usage_profile_check check (profile in ('farmer', 'agronomist'));

-- Унікальність (user_id, month) → (user_id, profile, month)
do $$
declare r record;
begin
  for r in
    select con.conname
    from pg_constraint con
    join pg_class rel on rel.oid = con.conrelid
    join pg_namespace ns on ns.oid = rel.relnamespace
    where ns.nspname = 'public' and rel.relname = 'ai_usage' and con.contype = 'u'
  loop
    execute format('alter table public.ai_usage drop constraint %I', r.conname);
  end loop;
  for r in
    select i.relname as idxname
    from pg_index x
    join pg_class i on i.oid = x.indexrelid
    join pg_class t on t.oid = x.indrelid
    join pg_namespace ns on ns.oid = t.relnamespace
    where ns.nspname = 'public' and t.relname = 'ai_usage'
      and x.indisunique and not x.indisprimary
  loop
    execute format('drop index if exists public.%I', r.idxname);
  end loop;
end $$;

alter table public.ai_usage
  add constraint ai_usage_user_profile_month_key unique (user_id, profile, month);

commit;
