-- AI-пакети за доплату й межа собівартості AI («не піти в мінус»).
--
-- Кредити лежать у «гаманцях»:
--  • тариф — кредити на календарний місяць (як і було, ai_usage.credits_used);
--  • пакет — кожен куплений AI-пакет (або пакет від адміна) — окремий рядок ai_credit_topups
--    з терміном дії, своїми кредитами й межею собівартості.
-- Дія списується цілком з одного гаманця: спершу тариф, потім пакет, що закінчується найраніше.
-- Гаманець, чия собівартість (сума ai_requests.cost_usd по ньому) досягла межі, пропускається —
-- навіть якщо кредити в ньому ще лишились. Так AI ніколи не коштує більше, ніж закладено в ціну.
--
-- Межі: тариф — кредити тарифу × ai_plan_limits.cost_cap_uah_per_credit (2 грн ≈ 45% ціни тарифу);
-- пакет — ai_packs.cost_cap_uah (45% ціни), переводиться в $ за курсом ai_settings.usd_uah у момент покупки.

begin;

-- ── Налаштування: курс для перерахунку собівартості ─────────────────────────
create table if not exists public.ai_settings (
  id boolean primary key default true check (id),
  usd_uah numeric not null default 45.5 check (usd_uah > 0),
  updated_at timestamptz not null default now()
);
insert into public.ai_settings (id) values (true) on conflict (id) do nothing;
alter table public.ai_settings enable row level security;
drop policy if exists "ai_settings: read" on public.ai_settings;
create policy "ai_settings: read" on public.ai_settings for select to authenticated using (true);
drop policy if exists "ai_settings: admin" on public.ai_settings;
create policy "ai_settings: admin" on public.ai_settings
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- ── Межа собівартості тарифу: грн на кожен кредит тарифу ────────────────────
alter table public.ai_plan_limits add column if not exists cost_cap_uah_per_credit numeric not null default 2
  check (cost_cap_uah_per_credit >= 0);

-- ── Каталог AI-пакетів ──────────────────────────────────────────────────────
create table if not exists public.ai_packs (
  id text primary key check (id ~ '^[a-z0-9_]+$'),   -- без «-»: id іде в orderReference оплати
  profile text not null check (profile in ('farmer', 'agronomist')),
  label text not null,
  price_uah integer not null check (price_uah > 0),
  credits integer not null check (credits > 0),
  cost_cap_uah numeric not null check (cost_cap_uah >= 0),
  days integer not null default 30 check (days between 1 and 366),
  sort integer not null default 0,
  is_active boolean not null default true,
  updated_at timestamptz not null default now()
);
insert into public.ai_packs (id, profile, label, price_uah, credits, cost_cap_uah, sort) values
  ('ai_plus',       'farmer',     'AI Плюс',     249, 100, 112, 1),
  ('ai_max',        'farmer',     'AI Максимум', 600, 250, 270, 2),
  ('ai_plus_agro',  'agronomist', 'AI Плюс',     249, 100, 112, 1),
  ('ai_max_agro',   'agronomist', 'AI Максимум', 600, 250, 270, 2)
on conflict (id) do nothing;
alter table public.ai_packs enable row level security;
drop policy if exists "ai_packs: read" on public.ai_packs;
create policy "ai_packs: read" on public.ai_packs for select to anon, authenticated using (true);
drop policy if exists "ai_packs: admin" on public.ai_packs;
create policy "ai_packs: admin" on public.ai_packs
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- ── Пакети користувача: термін, використання, межа собівартості ─────────────
alter table public.ai_credit_topups add column if not exists pack_id text references public.ai_packs(id) on delete set null;
alter table public.ai_credit_topups add column if not exists starts_at timestamptz;
alter table public.ai_credit_topups add column if not exists expires_at timestamptz;
alter table public.ai_credit_topups add column if not exists credits_used integer not null default 0;
alter table public.ai_credit_topups add column if not exists cost_cap_usd numeric;   -- null — без межі (пакет від адміна)

-- Старі пакети від адміна діяли на свій календарний місяць
update public.ai_credit_topups
set starts_at = (month || '-01')::timestamptz,
    expires_at = ((month || '-01')::date + interval '1 month')::timestamptz
where starts_at is null;
alter table public.ai_credit_topups alter column starts_at set default now();
alter table public.ai_credit_topups alter column starts_at set not null;
alter table public.ai_credit_topups alter column expires_at set not null;

create unique index if not exists ai_credit_topups_payment_ref_idx on public.ai_credit_topups (payment_reference)
  where payment_reference is not null;  -- повторний callback оплати не видасть пакет вдруге
create index if not exists ai_credit_topups_active_idx on public.ai_credit_topups (owner_id, profile, expires_at);

-- ── Журнал: з якого гаманця списано ─────────────────────────────────────────
alter table public.ai_requests add column if not exists topup_id uuid references public.ai_credit_topups(id) on delete set null;
create index if not exists ai_requests_topup_idx on public.ai_requests (topup_id) where topup_id is not null;
create index if not exists ai_requests_owner_profile_created_idx on public.ai_requests (owner_id, profile, created_at);

-- ── Собівартість гаманців ───────────────────────────────────────────────────
-- Тариф: запити без пакета з початку місяця; пакети: усі запити по кожному пакету
create or replace function public.ai_plan_spent(p_owner uuid, p_profile text, p_month text)
returns numeric language sql stable security definer set search_path to 'public' as $$
  select coalesce(sum(cost_usd), 0) from public.ai_requests
  where owner_id = p_owner and profile = p_profile and topup_id is null
    and created_at >= (p_month || '-01')::timestamptz
    and created_at < ((p_month || '-01')::date + interval '1 month')::timestamptz;
$$;

create or replace function public.ai_topup_spent(p_topup uuid)
returns numeric language sql stable security definer set search_path to 'public' as $$
  select coalesce(sum(cost_usd), 0) from public.ai_requests where topup_id = p_topup;
$$;

-- ── Атомарне списання з гаманців ────────────────────────────────────────────
-- Повертає {source: 'plan'} або {source: 'topup', topup_id}; null — немає гаманця з кредитами й запасом собівартості
create or replace function public.ai_charge(
  p_owner uuid, p_profile text, p_month text, p_credits integer,
  p_plan_allowance integer, p_plan_cap_usd numeric
)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  ok boolean;
  t record;
begin
  if p_plan_allowance > 0 and (p_plan_cap_usd is null or public.ai_plan_spent(p_owner, p_profile, p_month) < p_plan_cap_usd) then
    insert into public.ai_usage as u (user_id, profile, month, text_count, photo_count, credits_used, updated_at)
    values (p_owner, p_profile, p_month, 0, 0, 0, now())
    on conflict (user_id, profile, month) do nothing;

    update public.ai_usage
    set credits_used = credits_used + p_credits, updated_at = now()
    where user_id = p_owner and profile = p_profile and month = p_month
      and credits_used + p_credits <= p_plan_allowance
    returning true into ok;
    if ok then return jsonb_build_object('source', 'plan'); end if;
  end if;

  for t in
    select id, cost_cap_usd from public.ai_credit_topups
    where owner_id = p_owner and profile = p_profile
      and starts_at <= now() and expires_at > now()
      and credits_used + p_credits <= credits
    order by expires_at, created_at
  loop
    if t.cost_cap_usd is not null and public.ai_topup_spent(t.id) >= t.cost_cap_usd then continue; end if;
    update public.ai_credit_topups
    set credits_used = credits_used + p_credits
    where id = t.id and credits_used + p_credits <= credits
    returning true into ok;
    if ok then return jsonb_build_object('source', 'topup', 'topup_id', t.id); end if;
  end loop;

  return null;
end;
$$;

create or replace function public.ai_release(p_owner uuid, p_profile text, p_month text, p_credits integer, p_topup uuid)
returns void
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  if p_topup is null then
    update public.ai_usage
    set credits_used = greatest(0, credits_used - p_credits), updated_at = now()
    where user_id = p_owner and profile = p_profile and month = p_month;
  else
    update public.ai_credit_topups
    set credits_used = greatest(0, credits_used - p_credits)
    where id = p_topup and owner_id = p_owner;
  end if;
end;
$$;

revoke all on function public.ai_plan_spent(uuid, text, text) from public, anon, authenticated;
revoke all on function public.ai_topup_spent(uuid) from public, anon, authenticated;
revoke all on function public.ai_charge(uuid, text, text, integer, integer, numeric) from public, anon, authenticated;
revoke all on function public.ai_release(uuid, text, text, integer, uuid) from public, anon, authenticated;

commit;
