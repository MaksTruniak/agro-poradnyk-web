-- Акти огляду насаджень агрономом. Безпечно запускати повторно.
-- Запускати ПІСЛЯ 20261024_planting_blocks.sql.
--
-- planting_inspections — огляд: дата, фаза, загальний стан (good / attention / bad), висновок; sent_at — коли фермеру надіслано.
-- inspection_findings — знахідки: хвороба / шкідник / бур'ян / живлення / інше, ступінь, % уражених рослин, фото (до 6 шляхів
--   у сховищі inspection-photos: <farm_crop_id>/<inspection_id>/<файл>).
-- inspection_recommendations — рекомендації; treatment_id — обробка, додана з акта в техкарту клієнта.
--
-- Доступ: читають власник насадження, його команда й агроном з активною співпрацею. Пише лише агроном з активною
-- співпрацею, і лише свої акти (автор = auth.uid(), тригер). Фермер акт не змінює.
-- Знахідки й рекомендації успадковують насадження від акта (тригер), тож чужий акт не підставити.

begin;

create table if not exists public.planting_inspections (
  id uuid primary key default gen_random_uuid(),
  farm_crop_id uuid not null references public.farm_crops(id) on delete cascade,
  visited_at date not null default current_date check (visited_at >= '2000-01-01'),
  phase_key text check (phase_key is null or char_length(phase_key) <= 80),
  condition text not null default 'good' check (condition in ('good', 'attention', 'bad')),
  summary text check (summary is null or char_length(summary) <= 3000),
  sent_at timestamptz,
  created_by uuid default auth.uid(),
  created_at timestamptz not null default now()
);
create index if not exists planting_inspections_crop_idx on public.planting_inspections (farm_crop_id, visited_at desc);
create index if not exists planting_inspections_author_idx on public.planting_inspections (created_by, visited_at desc);

create table if not exists public.inspection_findings (
  id uuid primary key default gen_random_uuid(),
  inspection_id uuid not null references public.planting_inspections(id) on delete cascade,
  farm_crop_id uuid,
  kind text not null check (kind in ('disease', 'pest', 'weed', 'nutrition', 'other')),
  name text not null check (char_length(btrim(name)) between 1 and 160),
  severity text not null default 'low' check (severity in ('low', 'medium', 'high')),
  affected_pct smallint check (affected_pct is null or affected_pct between 0 and 100),
  note text check (note is null or char_length(note) <= 1000),
  photos text[] not null default '{}' check (cardinality(photos) <= 6),
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists inspection_findings_insp_idx on public.inspection_findings (inspection_id);

create table if not exists public.inspection_recommendations (
  id uuid primary key default gen_random_uuid(),
  inspection_id uuid not null references public.planting_inspections(id) on delete cascade,
  farm_crop_id uuid,
  type text not null check (type in ('захист', 'підживлення', 'полив', 'догляд')),
  product_name text not null check (char_length(btrim(product_name)) between 1 and 200),
  dosage text check (dosage is null or char_length(dosage) <= 100),
  due_date date,
  note text check (note is null or char_length(note) <= 500),
  treatment_id uuid references public.program_treatments(id) on delete set null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists inspection_recommendations_insp_idx on public.inspection_recommendations (inspection_id);

-- Автор і насадження акта (та сама функція, що й для журналу фенофаз)
drop trigger if exists planting_inspections_protect on public.planting_inspections;
create trigger planting_inspections_protect
  before insert or update on public.planting_inspections
  for each row execute function public.planting_phases_protect();

-- Знахідки й рекомендації: насадження — з акта
create or replace function public.inspection_child_crop()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  select farm_crop_id into new.farm_crop_id from public.planting_inspections where id = new.inspection_id;
  if new.farm_crop_id is null then
    raise exception 'Акт огляду не знайдено' using errcode = '23503';
  end if;
  return new;
end;
$$;
drop trigger if exists inspection_findings_crop on public.inspection_findings;
create trigger inspection_findings_crop before insert or update on public.inspection_findings
  for each row execute function public.inspection_child_crop();
drop trigger if exists inspection_recommendations_crop on public.inspection_recommendations;
create trigger inspection_recommendations_crop before insert or update on public.inspection_recommendations
  for each row execute function public.inspection_child_crop();

-- Чи поточний користувач — автор акта й досі агроном цього господарства
create or replace function public.is_inspection_author(insp uuid)
returns boolean
language sql
stable
security definer
set search_path to 'public'
as $$
  select exists (
    select 1 from public.planting_inspections i
    where i.id = insp and i.created_by = auth.uid() and public.is_agronomist_of(public.farm_crop_owner(i.farm_crop_id))
  );
$$;

alter table public.planting_inspections enable row level security;
alter table public.inspection_findings enable row level security;
alter table public.inspection_recommendations enable row level security;

drop policy if exists "read: owner team agronomist" on public.planting_inspections;
create policy "read: owner team agronomist" on public.planting_inspections for select to authenticated using (
  public.farm_crop_owner(farm_crop_id) = auth.uid()
  or public.is_team_member_of(public.farm_crop_owner(farm_crop_id))
  or public.is_agronomist_of(public.farm_crop_owner(farm_crop_id))
);
drop policy if exists "agronomist: insert" on public.planting_inspections;
create policy "agronomist: insert" on public.planting_inspections for insert to authenticated
  with check (public.is_agronomist_of(public.farm_crop_owner(farm_crop_id)));
drop policy if exists "author: update" on public.planting_inspections;
create policy "author: update" on public.planting_inspections for update to authenticated
  using (created_by = auth.uid() and public.is_agronomist_of(public.farm_crop_owner(farm_crop_id)))
  with check (created_by = auth.uid() and public.is_agronomist_of(public.farm_crop_owner(farm_crop_id)));
drop policy if exists "author: delete" on public.planting_inspections;
create policy "author: delete" on public.planting_inspections for delete to authenticated
  using (created_by = auth.uid() and public.is_agronomist_of(public.farm_crop_owner(farm_crop_id)));

do $$
declare
  t text;
begin
  foreach t in array array['inspection_findings', 'inspection_recommendations'] loop
    execute format('drop policy if exists "read: owner team agronomist" on public.%I', t);
    execute format($p$create policy "read: owner team agronomist" on public.%I for select to authenticated using (
      public.farm_crop_owner(farm_crop_id) = auth.uid()
      or public.is_team_member_of(public.farm_crop_owner(farm_crop_id))
      or public.is_agronomist_of(public.farm_crop_owner(farm_crop_id)))$p$, t);
    execute format('drop policy if exists "author: write" on public.%I', t);
    execute format($p$create policy "author: write" on public.%I for all to authenticated
      using (public.is_inspection_author(inspection_id))
      with check (public.is_inspection_author(inspection_id))$p$, t);
  end loop;
end;
$$;

grant select, insert, update, delete on public.planting_inspections, public.inspection_findings, public.inspection_recommendations to authenticated;

-- ── Фото: приватне сховище, шлях <farm_crop_id>/<inspection_id>/<файл> ──
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('inspection-photos', 'inspection-photos', false, 10485760, array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

create or replace function public.inspection_photo_crop(path text)
returns uuid
language sql
immutable
as $$
  select case when split_part(path, '/', 1) ~ '^[0-9a-f-]{36}$' then split_part(path, '/', 1)::uuid end;
$$;

drop policy if exists "inspection photos: read" on storage.objects;
create policy "inspection photos: read" on storage.objects for select to authenticated using (
  bucket_id = 'inspection-photos' and (
    public.farm_crop_owner(public.inspection_photo_crop(name)) = auth.uid()
    or public.is_team_member_of(public.farm_crop_owner(public.inspection_photo_crop(name)))
    or public.is_agronomist_of(public.farm_crop_owner(public.inspection_photo_crop(name)))
  )
);
drop policy if exists "inspection photos: agronomist upload" on storage.objects;
create policy "inspection photos: agronomist upload" on storage.objects for insert to authenticated with check (
  bucket_id = 'inspection-photos'
  and public.is_inspection_author(case when split_part(name, '/', 2) ~ '^[0-9a-f-]{36}$' then split_part(name, '/', 2)::uuid end)
  and public.inspection_photo_crop(name) = (select farm_crop_id from public.planting_inspections where id::text = split_part(name, '/', 2))
);
drop policy if exists "inspection photos: agronomist delete" on storage.objects;
create policy "inspection photos: agronomist delete" on storage.objects for delete to authenticated using (
  bucket_id = 'inspection-photos'
  and public.is_inspection_author(case when split_part(name, '/', 2) ~ '^[0-9a-f-]{36}$' then split_part(name, '/', 2)::uuid end)
);

-- Сповіщення фермеру про акт
do $$
declare
  c record;
  types text;
begin
  for c in
    select con.conname from pg_constraint con
    where con.conrelid = 'public.farm_notifications'::regclass and con.contype = 'c'
      and pg_get_constraintdef(con.oid) ilike '%type%'
  loop
    execute format('alter table public.farm_notifications drop constraint %I', c.conname);
    select string_agg(quote_literal(t), ', ') into types from (
      select distinct type as t from public.farm_notifications
      union select unnest(array['inventory_low', 'treatment_soon', 'weather_risk', 'week_plan', 'inspection'])
    ) s;
    execute format('alter table public.farm_notifications add constraint %I check (type in (%s))', c.conname, types);
  end loop;
end;
$$;

commit;
