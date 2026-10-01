-- Приватні картинки чатів, контакт покупця для продавця, спільний лічильник частоти запитів.
-- Запускати ПІСЛЯ 20261001_storage.sql.

begin;

-- ── Картинки чатів: приватне сховище, читають лише учасники чату ─────────────
-- Файли лежать як <chatId>/<timestamp>.<ext>; сторінка чату отримує тимчасові підписані посилання.
update storage.buckets set public = false where id = 'chat-images';

drop policy if exists "Chat images are public" on storage.objects;
drop policy if exists "chat images: participants read" on storage.objects;
create policy "chat images: participants read" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'chat-images'
    and exists (
      select 1 from public.chats c
      where c.id::text = (storage.foldername(name))[1]
        and auth.uid() in (c.farmer_id, c.agronomist_id)
    )
  );

-- ── Маркетплейс: ім'я й телефон покупця — лише продавцю його замовлень ────────
create or replace function public.seller_order_contacts(p_order_ids uuid[])
returns table(order_id uuid, name text, phone text)
language sql
stable
security definer
set search_path to 'public'
as $$
  select o.id, u.name, u.phone
  from public.orders o
  join public.seller_profiles sp on sp.id = o.seller_id and sp.user_id = auth.uid()
  join public.users u on u.id = o.user_id
  where o.id = any(p_order_ids);
$$;

revoke all on function public.seller_order_contacts(uuid[]) from public, anon;
grant execute on function public.seller_order_contacts(uuid[]) to authenticated;

-- ── Лічильник частоти запитів (спільний для всіх серверних екземплярів) ────────
create table if not exists public.rate_limits (
  key text primary key,
  count integer not null,
  reset_at timestamptz not null
);
alter table public.rate_limits enable row level security;  -- правил немає: доступ лише сервісному ключу

create or replace function public.hit_rate_limit(p_key text, p_max integer, p_window_seconds integer)
returns boolean
language plpgsql
security definer
set search_path to 'public'
as $$
declare c integer;
begin
  insert into public.rate_limits as r (key, count, reset_at)
  values (p_key, 1, now() + make_interval(secs => p_window_seconds))
  on conflict (key) do update set
    count    = case when r.reset_at <= now() then 1 else r.count + 1 end,
    reset_at = case when r.reset_at <= now() then now() + make_interval(secs => p_window_seconds) else r.reset_at end
  returning count into c;

  -- Зрідка прибираємо старі записи, щоб таблиця не росла
  if random() < 0.01 then
    delete from public.rate_limits where reset_at < now() - interval '1 day';
  end if;

  return c <= p_max;
end;
$$;

revoke all on function public.hit_rate_limit(text, integer, integer) from public, anon, authenticated;
grant execute on function public.hit_rate_limit(text, integer, integer) to service_role;

commit;
