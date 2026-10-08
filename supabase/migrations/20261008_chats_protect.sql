-- Чати: автор повідомлення, чужі повідомлення, учасники чату.
-- Запускати ПІСЛЯ 20261001_messages_shares_catalog_agreements_harvest.sql (потрібна public.is_admin()).
--
-- Було (перевірено на робочій базі):
--  • автора повідомлення визначає role ('user' — farmer_id чату, 'assistant' — agronomist_id), але її задає браузер:
--    учасник міг написати від імені співрозмовника, а сторінки покупця/продавця ставили 'assistant' фермеру;
--  • учасник міг змінити чи видалити будь-яке повідомлення співрозмовника;
--  • учасник міг замінити співрозмовника в чаті (agronomist_id → третя людина бачила все листування) або видалити чат;
--  • image_url — будь-яке посилання (картинка зі стороннього сайту в чужому чаті);
--  • чат сам із собою.
-- Стало:
--  • role ставить база за тим, хто пише; image_url — лише картинка цього чату зі сховища chat-images;
--  • у повідомленні учасник змінює лише is_read, і лише в повідомленнях співрозмовника; видаляти не можна;
--  • учасників, тип і дату чату змінити не можна; видаляє чати лише адмін.

begin;

-- ── Повідомлення ─────────────────────────────────────────────────────────────
create or replace function public.messages_protect()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  me uuid := auth.uid();
  c record;
  my_role text;
begin
  if me is null or public.is_admin() then
    return coalesce(new, old);
  end if;

  if tg_op = 'DELETE' then
    raise exception 'Повідомлення не можна видалити' using errcode = '42501';
  end if;

  select farmer_id, agronomist_id into c from public.chats where id = coalesce(new.chat_id, old.chat_id);

  if tg_op = 'INSERT' then
    if me = c.agronomist_id then
      new.role := 'assistant';
    elsif me = c.farmer_id then
      new.role := 'user';
    else
      raise exception 'Немає доступу до чату' using errcode = '42501';
    end if;
    if new.image_url is not null
       and strpos(new.image_url, '/storage/v1/object/public/chat-images/' || new.chat_id::text || '/') = 0 then
      raise exception 'Недозволене посилання на зображення' using errcode = '42501';
    end if;
    if length(coalesce(new.content, '')) > 5000 then
      raise exception 'Повідомлення задовге' using errcode = '22001';
    end if;
    new.created_at := now();
    new.is_read := false;
    return new;
  end if;

  -- UPDATE: лише позначка «прочитано» для повідомлень співрозмовника
  if new.chat_id is distinct from old.chat_id or new.role is distinct from old.role
     or new.content is distinct from old.content or new.image_url is distinct from old.image_url
     or new.product_id is distinct from old.product_id or new.created_at is distinct from old.created_at then
    raise exception 'Повідомлення не можна змінити' using errcode = '42501';
  end if;
  my_role := 'user';
  if me = c.agronomist_id then
    my_role := 'assistant';
  end if;
  if new.is_read is distinct from old.is_read and old.role = my_role then
    raise exception 'Своє повідомлення не можна позначити прочитаним' using errcode = '42501';
  end if;
  return new;
end;
$$;

drop trigger if exists messages_protect on public.messages;
create trigger messages_protect
  before insert or update or delete on public.messages
  for each row execute function public.messages_protect();

-- ── Чати ─────────────────────────────────────────────────────────────────────
create or replace function public.chats_protect()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  if auth.uid() is null or public.is_admin() then
    return coalesce(new, old);
  end if;

  if tg_op = 'DELETE' then
    raise exception 'Чат не можна видалити' using errcode = '42501';
  end if;

  if tg_op = 'INSERT' then
    if new.farmer_id = new.agronomist_id then
      raise exception 'Не можна створити чат із собою' using errcode = '42501';
    end if;
    new.created_at := now();
    return new;
  end if;

  new.farmer_id := old.farmer_id;
  new.agronomist_id := old.agronomist_id;
  new.type := old.type;
  new.created_at := old.created_at;
  return new;
end;
$$;

drop trigger if exists chats_protect on public.chats;
create trigger chats_protect
  before insert or update or delete on public.chats
  for each row execute function public.chats_protect();

commit;
