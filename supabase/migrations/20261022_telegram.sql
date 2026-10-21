-- Telegram-бот @agroprostir_bot: прив'язка чату до акаунту і що туди надсилати. Безпечно запускати повторно.
-- Запускати ПІСЛЯ 20261021_week_digest.sql.
--
-- telegram_link_codes — одноразові коди для посилання t.me/agroprostir_bot?start=<код> (живуть 15 хвилин).
--   Лише сервер (service role): клієнт кодів не бачить і не створює.
-- telegram_links — прив'язаний чат. Користувач бачить і видаляє (відключає) лише свій рядок; створює — лише сервер
--   після /start з правильним кодом, тож чужий chat_id не підставити.
-- notification_settings.tg_* — що надсилати в Telegram (за замовчуванням усе).

begin;

create table if not exists public.telegram_link_codes (
  code text primary key check (code ~ '^[A-Za-z0-9_-]{16,64}$'),
  user_id uuid not null references auth.users(id) on delete cascade,
  expires_at timestamptz not null default now() + interval '15 minutes'
);
alter table public.telegram_link_codes enable row level security;
revoke all on public.telegram_link_codes from anon, authenticated;

create table if not exists public.telegram_links (
  user_id uuid primary key references auth.users(id) on delete cascade,
  chat_id bigint not null unique,
  username text check (username is null or char_length(username) <= 64),
  linked_at timestamptz not null default now()
);
alter table public.telegram_links enable row level security;

drop policy if exists "own: read" on public.telegram_links;
create policy "own: read" on public.telegram_links
  for select to authenticated using (user_id = auth.uid());
drop policy if exists "own: delete" on public.telegram_links;
create policy "own: delete" on public.telegram_links
  for delete to authenticated using (user_id = auth.uid());

revoke all on public.telegram_links from anon, authenticated;
grant select, delete on public.telegram_links to authenticated;

alter table public.notification_settings add column if not exists tg_week_plan boolean not null default true;
alter table public.notification_settings add column if not exists tg_frost boolean not null default true;
alter table public.notification_settings add column if not exists tg_reminders boolean not null default true;

commit;
