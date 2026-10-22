-- Паспорт партії в угоді: культура, сорт, фенофази, виконані обробки зі строками очікування й акти огляду
-- агронома за сезон угоди. Безпечно запускати повторно. Запускати ПІСЛЯ 20261027_techcard_rls_speed.sql.
--
-- Фермер (або редактор його команди) бачить паспорт завжди й вирішує, чи відкрити його заготівельнику
-- (deal_passport_shares). Заготівельник бачить паспорт лише відкритий. Журнали обробок, фенофаз і акти
-- заготівельнику напряму не відкриваються — лише через deal_passport(), і лише для культури угоди за її сезон:
-- без приміток, фото, кадастру й адреси поля.
-- Культура угоди — deals.farm_crop_id, а якщо його немає — культура, з якої списано залишок (stock_crop_id).

begin;

create table if not exists public.deal_passport_shares (
  deal_id uuid primary key references public.deals(id) on delete cascade,
  shared_by uuid default auth.uid(),
  shared_at timestamptz not null default now()
);
alter table public.deal_passport_shares enable row level security;

-- Читати — сторони угоди й команда фермера; писати — лише через share_deal_passport()
drop policy if exists "deal_passport_shares: read" on public.deal_passport_shares;
create policy "deal_passport_shares: read" on public.deal_passport_shares
  for select to authenticated
  using (exists (
    select 1 from public.deals d
    where d.id = deal_passport_shares.deal_id
      and (auth.uid() in (d.farmer_id, d.buyer_id) or public.is_team_member_of(d.farmer_id))
  ));

create or replace function public.share_deal_passport(p_deal_id uuid, p_shared boolean)
returns boolean
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_farmer uuid;
begin
  select farmer_id into v_farmer from public.deals where id = p_deal_id;
  if v_farmer is null or not (v_farmer = auth.uid() or public.is_team_editor_of(v_farmer)) then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  if p_shared then
    insert into public.deal_passport_shares (deal_id) values (p_deal_id) on conflict (deal_id) do nothing;
  else
    delete from public.deal_passport_shares where deal_id = p_deal_id;
  end if;
  return p_shared;
end;
$$;

create or replace function public.deal_passport(p_deal_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path to 'public'
as $$
declare
  d public.deals%rowtype;
  v_uid uuid := auth.uid();
  v_is_farmer boolean;
  v_can_share boolean;
  v_shared timestamptz;
  v_crop_id uuid;
  v_year int;
  v_from date;
  v_to date;
  fc record;
  v_result jsonb;
begin
  select * into d from public.deals where id = p_deal_id;
  if not found or v_uid is null then return null; end if;

  v_is_farmer := v_uid = d.farmer_id or public.is_team_member_of(d.farmer_id);
  if not (v_is_farmer or v_uid = d.buyer_id) then return null; end if;
  v_can_share := v_uid = d.farmer_id or public.is_team_editor_of(d.farmer_id);
  select shared_at into v_shared from public.deal_passport_shares where deal_id = p_deal_id;

  v_result := jsonb_build_object(
    'deal', jsonb_build_object(
      'id', d.id, 'crop_type', d.crop_type, 'quantity_tons', d.quantity_tons, 'status', d.status,
      'created_at', d.created_at, 'confirmed_at', d.confirmed_at, 'completed_at', d.completed_at,
      'farmer_id', d.farmer_id, 'buyer_id', d.buyer_id),
    'shared', v_shared is not null,
    'shared_at', v_shared,
    'can_share', v_can_share,
    'crop', null
  );
  -- Заготівельник без дозволу фермера бачить лише, що паспорт закрито
  if not v_is_farmer and v_shared is null then return v_result; end if;

  v_crop_id := coalesce(d.farm_crop_id, d.stock_crop_id);
  select c.id, c.farm_id, c.crop_type, c.variety, c.planting_year, c.area_ha, f.name as farm_name, f.region, f.city
    into fc
    from public.farm_crops c join public.farms f on f.id = c.farm_id
    where c.id = v_crop_id and f.user_id = d.farmer_id;
  if not found then return v_result; end if;

  -- Сезон угоди: від 1 січня року угоди до завершення (або сьогодні)
  v_year := extract(year from coalesce(d.completed_at, d.confirmed_at, d.created_at))::int;
  v_from := make_date(v_year, 1, 1);
  v_to := least(coalesce(d.completed_at, now())::date, make_date(v_year, 12, 31));

  return v_result || jsonb_build_object(
    'season', v_year,
    'period_to', v_to,
    'crop', jsonb_build_object(
      'crop_type', fc.crop_type, 'variety', fc.variety, 'planting_year', fc.planting_year, 'area_ha', fc.area_ha,
      'farm_name', fc.farm_name, 'region', fc.region, 'city', fc.city),
    'phases', coalesce((
      select jsonb_agg(jsonb_build_object('phase_key', p.phase_key, 'observed_at', p.observed_at) order by p.observed_at, p.created_at)
      from public.planting_phases p
      where p.farm_crop_id = fc.id and p.observed_at between v_from and v_to
    ), '[]'::jsonb),
    'treatments', coalesce((
      select jsonb_agg(t order by t->>'date') from (
        select jsonb_build_object('date', pt.done_at, 'product_name', pt.product_name, 'type', coalesce(pt.type, 'захист'),
          'dosage', pt.dosage, 'phase', pt.phase, 'waiting_days', pt.waiting_days, 'source', 'techcard') as t
        from public.protection_programs pp
        join public.program_treatments pt on pt.program_id = pp.id
        where pp.farm_crop_id = fc.id and pt.status = 'done' and pt.done_at between v_from and v_to
        union all
        select jsonb_build_object('date', ft.treatment_date, 'product_name', ft.product_name, 'type', ft.product_type,
          'dosage', case when ft.dose_per_ha is not null then ft.dose_per_ha::text || ' ' || coalesce(ft.unit, '') || '/га' end,
          'phase', null, 'waiting_days', ft.waiting_days, 'source', 'journal')
        from public.field_treatments ft
        where ft.user_id = d.farmer_id and ft.farm_id = fc.farm_id
          and (ft.crop_type is null or ft.crop_type = '' or ft.crop_type = fc.crop_type)
          and ft.treatment_date between v_from and v_to
      ) s
    ), '[]'::jsonb),
    'inspections', coalesce((
      select jsonb_agg(jsonb_build_object(
        'visited_at', i.visited_at, 'condition', i.condition, 'phase_key', i.phase_key,
        'agronomist', (select u.name from public.users u where u.id = i.created_by),
        'findings', coalesce((
          select jsonb_agg(jsonb_build_object('kind', fi.kind, 'name', fi.name, 'severity', fi.severity) order by fi.sort_order)
          from public.inspection_findings fi where fi.inspection_id = i.id
        ), '[]'::jsonb)
      ) order by i.visited_at)
      from public.planting_inspections i
      where i.farm_crop_id = fc.id and i.sent_at is not null and i.visited_at between v_from and v_to
    ), '[]'::jsonb)
  );
end;
$$;

revoke all on function public.deal_passport(uuid) from public, anon;
revoke all on function public.share_deal_passport(uuid, boolean) from public, anon;
grant execute on function public.deal_passport(uuid) to authenticated;
grant execute on function public.share_deal_passport(uuid, boolean) to authenticated;
grant select on public.deal_passport_shares to authenticated;

commit;
