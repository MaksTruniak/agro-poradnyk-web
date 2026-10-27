-- Пробний період: 6 місяців тарифу (фермер — Бізнес, агроном — Про) безкоштовно, але AI тарифу — лише перші
-- ai_settings.trial_ai_days днів (7). Далі AI — після оплати тарифу або з AI-пакетом.
--
-- subscriptions.trial_started_at — позначка пробного періоду: ставить тригер grant_profile_trial,
-- знімає оплата (callback) і ручне призначення тарифу адміном.

begin;

alter table public.subscriptions add column if not exists trial_started_at timestamptz;

alter table public.ai_settings add column if not exists trial_ai_days integer not null default 7
  check (trial_ai_days between 0 and 186);

-- Нові профілі — пробний період з позначкою
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
    insert into public.subscriptions (user_id, profile, plan, expires_at, trial_started_at)
    values (new.id, 'farmer', 'business', now() + interval '6 months', now())
    on conflict (user_id, profile) do nothing;
  end if;

  if 'agronomist' = any(new_set) and not ('agronomist' = any(old_set)) then
    insert into public.subscriptions (user_id, profile, plan, expires_at, trial_started_at)
    values (new.id, 'agronomist', 'pro', now() + interval '6 months', now())
    on conflict (user_id, profile) do nothing;
  end if;

  return new;
end;
$$;

-- Ті, хто вже на пробному періоді (жодної оплати й продовження), — позначка від його початку
update public.subscriptions
set trial_started_at = expires_at - interval '6 months'
where trial_started_at is null
  and first_paid_at is null
  and coalesce(renewal_count, 0) = 0
  and plan in ('business', 'pro')
  and expires_at > now();

commit;
