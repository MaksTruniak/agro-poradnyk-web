-- Індекси для правил доступу (RLS) і частих запитів сторінок; прибирання дублікатів;
-- агрегована статистика користувачів для адмінки (замість завантаження всіх акаунтів).
-- Можна запускати будь-коли після 20261001_chat_images_contacts_rate_limit.sql.
-- Таблиці зараз невеликі, тому звичайний CREATE INDEX (блокує запис у таблицю на секунди).

begin;

-- ── Правила доступу ──────────────────────────────────────────────────────────
-- is_team_member / is_team_member_of: member_id + status на кожен запит члена команди
create index if not exists team_members_member_status_idx on public.team_members (member_id, status);
-- farms: агроном зі співпрацею; can_review_agronomist
create index if not exists agreements_agronomist_farmer_idx on public.agreements (agronomist_id, farmer_id, status);
create index if not exists agreements_farmer_idx on public.agreements (farmer_id);
-- farms / farm_crops / programs / reminders: агроном з доступом до поля
create index if not exists field_shares_agronomist_status_idx on public.field_shares (agronomist_id, status);
create index if not exists field_shares_farmer_idx on public.field_shares (farmer_id);
create index if not exists field_shares_farm_idx on public.field_shares (farm_id);
-- збір урожаю: власник / працівник
create index if not exists harvest_workers_owner_idx on public.harvest_workers (owner_id);
create index if not exists harvest_workers_auth_user_idx on public.harvest_workers (auth_user_id);
create index if not exists harvest_payments_worker_idx on public.harvest_payments (worker_id);
create index if not exists harvest_records_worker_idx on public.harvest_records (worker_id);
create index if not exists harvest_season_workers_season_idx on public.harvest_season_workers (season_id);
create index if not exists harvest_season_workers_worker_idx on public.harvest_season_workers (worker_id);
create index if not exists harvest_seasons_owner_idx on public.harvest_seasons (owner_id);
-- маркетплейс
create index if not exists orders_user_idx on public.orders (user_id);
create index if not exists orders_seller_idx on public.orders (seller_id);
create index if not exists order_items_order_idx on public.order_items (order_id);
create index if not exists order_items_buyer_idx on public.order_items (buyer_user_id);
create index if not exists order_items_offer_idx on public.order_items (offer_id);

-- ── Часті запити сторінок ────────────────────────────────────────────────────
create index if not exists deals_farmer_idx on public.deals (farmer_id);
create index if not exists deals_buyer_idx on public.deals (buyer_id);
create index if not exists deals_chat_idx on public.deals (chat_id);
create index if not exists deal_reviews_reviewee_idx on public.deal_reviews (reviewee_id);
create index if not exists messages_chat_created_idx on public.messages (chat_id, created_at);
create index if not exists payments_user_idx on public.payments (user_id);
create index if not exists payments_order_reference_idx on public.payments (order_reference);  -- повторні callback оплати
create index if not exists program_treatments_program_idx on public.program_treatments (program_id);
create index if not exists protection_programs_dacha_crop_idx on public.protection_programs (dacha_crop_id);
create index if not exists reminders_user_idx on public.reminders (user_id);
create index if not exists reminders_treatment_idx on public.reminders (treatment_id);
create index if not exists reminders_created_for_idx on public.reminders (created_for);
create index if not exists manual_sales_user_idx on public.manual_sales (user_id);
create index if not exists expenses_user_idx on public.expenses (user_id);
create index if not exists field_treatments_user_idx on public.field_treatments (user_id);
create index if not exists farm_inventory_user_idx on public.farm_inventory (user_id);
create index if not exists ai_chats_user_idx on public.ai_chats (user_id);
create index if not exists ai_messages_chat_idx on public.ai_messages (chat_id);
create index if not exists buyer_crops_user_idx on public.buyer_crops (user_id);
create index if not exists agronomist_profiles_user_idx on public.agronomist_profiles (user_id);
create index if not exists seller_profiles_user_idx on public.seller_profiles (user_id);

-- messages (chat_id) покривається новим (chat_id, created_at)
drop index if exists public.messages_chat_id_idx;

-- ── Дублікати унікальних індексів (лишаємо той, що належить обмеженню) ─────────
do $$
declare idx text;
begin
  foreach idx in array array['protection_programs_farm_crop_id_unique', 'team_members_owner_email_unique'] loop
    if not exists (select 1 from pg_constraint where conname = idx) then
      execute format('drop index if exists public.%I', idx);
    end if;
  end loop;
end $$;

-- ── Статистика реєстрацій для адмінки: рахує база ────────────────────────────
-- Джерело — auth.users (як і раніше), роль — з user_metadata.
create or replace function public.admin_user_stats()
returns json
language sql
stable
security definer
set search_path to 'public'
as $$
  select json_build_object(
    'total', (select count(*) from auth.users),
    'by_month', coalesce((select json_object_agg(m, c) from (
      select to_char(created_at, 'YYYY-MM') as m, count(*) as c from auth.users group by 1) x), '{}'::json),
    'by_year', coalesce((select json_object_agg(y, c) from (
      select to_char(created_at, 'YYYY') as y, count(*) as c from auth.users group by 1) x), '{}'::json),
    'by_role', coalesce((select json_object_agg(r, c) from (
      select coalesce(raw_user_meta_data->>'role', 'unknown') as r, count(*) as c from auth.users group by 1) x), '{}'::json)
  );
$$;

revoke all on function public.admin_user_stats() from public, anon, authenticated;
grant execute on function public.admin_user_stats() to service_role;

commit;
