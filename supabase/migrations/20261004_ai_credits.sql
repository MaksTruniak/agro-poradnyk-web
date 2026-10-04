-- AI-кредити: облік вартості, кредити тарифів, пакети докупівлі.
--
-- Було: ліміт у штуках запитів (ai_plan_limits.text_limit — «Бізнес» 3000/міс); собівартість невідома.
-- На платній моделі активний фермер коштував би більше, ніж платить за тариф.
-- Стало:
--  • кожна AI-дія коштує кредити (питання 1, фото 3, техкарта 5 …); кредитів у тарифі —
--    credits_base + credits_per_ha × гектари господарства (до credits_ha_cap), як і ціна тарифу;
--  • списання атомарне (паралельні запити не перевищать ліміт), повернення — якщо AI не відповів;
--  • ai_requests — журнал кожного запиту з фактичними токенами й вартістю в $ (маржа, бюджет);
--  • ai_credit_topups — пакети докупівлі (видає сервер/адмін; клієнт лише читає свої).

begin;

-- ── Кредити в тарифах ────────────────────────────────────────────────────────
alter table public.ai_plan_limits add column if not exists credits_base integer not null default 0;
alter table public.ai_plan_limits add column if not exists credits_per_ha numeric not null default 0;
alter table public.ai_plan_limits add column if not exists credits_ha_cap integer not null default 0;

insert into public.ai_plan_limits (plan, text_limit, photo_limit, credits_base, credits_per_ha, credits_ha_cap) values
  ('basic',            0, 0,   5, 0,    0),
  ('agronomist_basic', 0, 0,   5, 0,    0),
  ('business',         0, 0,  40, 2,   50),
  ('business_pro',     0, 0, 100, 1.5, 1000),
  ('pro',              0, 0,  80, 0,    0)
on conflict (plan) do update set
  credits_base = excluded.credits_base,
  credits_per_ha = excluded.credits_per_ha,
  credits_ha_cap = excluded.credits_ha_cap;

-- ── Використання за місяць ───────────────────────────────────────────────────
alter table public.ai_usage add column if not exists credits_used integer not null default 0;

-- ── Пакети докупівлі ─────────────────────────────────────────────────────────
create table if not exists public.ai_credit_topups (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  profile text not null default 'farmer',
  credits integer not null check (credits > 0),
  month text not null,                -- YYYY-MM, на який місяць діє пакет
  source text not null default 'admin',
  payment_reference text,
  created_at timestamptz not null default now()
);
create index if not exists ai_credit_topups_owner_month_idx on public.ai_credit_topups (owner_id, profile, month);
alter table public.ai_credit_topups enable row level security;
drop policy if exists "ai_credit_topups: read own" on public.ai_credit_topups;
create policy "ai_credit_topups: read own" on public.ai_credit_topups
  for select to authenticated using (owner_id = auth.uid() or public.is_team_member_of(owner_id) or public.is_admin());
drop policy if exists "ai_credit_topups: admin all" on public.ai_credit_topups;
create policy "ai_credit_topups: admin all" on public.ai_credit_topups
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- ── Журнал AI-запитів ────────────────────────────────────────────────────────
create table if not exists public.ai_requests (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  user_id uuid not null,              -- хто питав
  owner_id uuid not null,             -- чиї кредити (власник господарства)
  profile text not null,
  action text not null,               -- chat | photo | card | report | summary | calendar
  provider text not null,             -- anthropic | groq
  model text not null,
  input_tokens integer not null default 0,
  cache_read_tokens integer not null default 0,
  cache_write_tokens integer not null default 0,
  output_tokens integer not null default 0,
  cost_usd numeric(12, 6) not null default 0,
  credits integer not null default 0,
  fallback boolean not null default false,
  status text not null default 'ok'    -- ok | error | refused
);
create index if not exists ai_requests_owner_created_idx on public.ai_requests (owner_id, created_at desc);
create index if not exists ai_requests_created_idx on public.ai_requests (created_at desc);
alter table public.ai_requests enable row level security;
drop policy if exists "ai_requests: read own" on public.ai_requests;
create policy "ai_requests: read own" on public.ai_requests
  for select to authenticated using (owner_id = auth.uid() or user_id = auth.uid() or public.is_admin());
-- запис — лише сервер (service role)

-- ── Атомарне списання / повернення кредитів (лише сервер) ────────────────────
create or replace function public.ai_charge_credits(p_owner uuid, p_profile text, p_month text, p_credits integer, p_allowance integer)
returns boolean
language plpgsql
security definer
set search_path to 'public'
as $$
declare ok boolean;
begin
  insert into public.ai_usage as u (user_id, profile, month, text_count, photo_count, credits_used, updated_at)
  values (p_owner, p_profile, p_month, 0, 0, 0, now())
  on conflict (user_id, profile, month) do nothing;

  update public.ai_usage
  set credits_used = credits_used + p_credits, updated_at = now()
  where user_id = p_owner and profile = p_profile and month = p_month
    and credits_used + p_credits <= p_allowance
  returning true into ok;
  return coalesce(ok, false);
end;
$$;

create or replace function public.ai_release_credits(p_owner uuid, p_profile text, p_month text, p_credits integer)
returns void
language sql
security definer
set search_path to 'public'
as $$
  update public.ai_usage
  set credits_used = greatest(0, credits_used - p_credits), updated_at = now()
  where user_id = p_owner and profile = p_profile and month = p_month;
$$;

-- Витрати на AI за поточний місяць (для глобального бюджету)
create or replace function public.ai_month_cost()
returns numeric
language sql
stable
security definer
set search_path to 'public'
as $$
  select coalesce(sum(cost_usd), 0) from public.ai_requests where created_at >= date_trunc('month', now());
$$;

revoke all on function public.ai_charge_credits(uuid, text, text, integer, integer) from public, anon, authenticated;
revoke all on function public.ai_release_credits(uuid, text, text, integer) from public, anon, authenticated;
revoke all on function public.ai_month_cost() from public, anon, authenticated;

commit;
