-- Шаблони техкарт: агроном (або фермер) зберігає свою схему обробок за фенофазами й застосовує її до культури
-- будь-якого клієнта. Безпечно запускати повторно. Запускати ПІСЛЯ 20261028_deal_passport.sql.
--
-- techcard_templates.items — масив обробок [{phase, phase_order, type, product_name, dosage, notes, waiting_days}],
-- без статусів і дат виконання. Бачить і змінює шаблон лише автор (owner_id ставить база).

begin;

create table if not exists public.techcard_templates (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 1 and 120),
  crop_type text check (crop_type is null or char_length(crop_type) <= 120),
  phases text[] not null default '{}' check (cardinality(phases) <= 60),
  items jsonb not null default '[]'::jsonb
    check (jsonb_typeof(items) = 'array' and jsonb_array_length(items) <= 300 and pg_column_size(items) <= 200000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists techcard_templates_owner_idx on public.techcard_templates (owner_id, updated_at desc);

create or replace function public.techcard_templates_protect()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  if auth.uid() is not null then
    new.owner_id := case when tg_op = 'INSERT' then auth.uid() else old.owner_id end;
  end if;
  if tg_op = 'UPDATE' then new.created_at := old.created_at; end if;
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists techcard_templates_protect on public.techcard_templates;
create trigger techcard_templates_protect
  before insert or update on public.techcard_templates
  for each row execute function public.techcard_templates_protect();

-- Не більше 100 шаблонів на автора
create or replace function public.techcard_templates_limit()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  if (select count(*) from public.techcard_templates where owner_id = new.owner_id) >= 100 then
    raise exception 'Не більше 100 шаблонів техкарт' using errcode = 'P0001';
  end if;
  return new;
end;
$$;

drop trigger if exists techcard_templates_limit on public.techcard_templates;
create trigger techcard_templates_limit
  before insert on public.techcard_templates
  for each row execute function public.techcard_templates_limit();

alter table public.techcard_templates enable row level security;

drop policy if exists "techcard_templates: own" on public.techcard_templates;
create policy "techcard_templates: own" on public.techcard_templates
  for all to authenticated
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

grant select, insert, update, delete on public.techcard_templates to authenticated;

commit;
