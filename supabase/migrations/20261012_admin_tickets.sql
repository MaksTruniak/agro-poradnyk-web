-- Звернення в підтримку й запити Enterprise в адмінці.
-- Запускати ПІСЛЯ 20261001_admin_ai_functions.sql (потрібна public.is_admin()).
--
-- Було: звернення з кабінету приходили лише листом — в адмінці їх не було видно; запити Enterprise не можна
-- було позначити опрацьованими, тож лічильник на вкладці лише ріс.
-- Стало: адмін читає й змінює support_tickets і contact_requests; у запитів є статус new / done.
-- Правила лише ДОДАЮТЬСЯ — як користувачі створюють звернення й запити, не змінюється.

begin;

drop policy if exists "admin: all" on public.support_tickets;
create policy "admin: all" on public.support_tickets
  for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

drop policy if exists "admin: all" on public.contact_requests;
create policy "admin: all" on public.contact_requests
  for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

alter table public.contact_requests add column if not exists status text not null default 'new';
alter table public.contact_requests drop constraint if exists contact_requests_status_check;
alter table public.contact_requests add constraint contact_requests_status_check check (status in ('new', 'done'));

alter table public.support_tickets drop constraint if exists support_tickets_status_check;
alter table public.support_tickets add constraint support_tickets_status_check check (status in ('open', 'closed')) not valid;

commit;
