-- Безкоштовне листування з агрономом: 2000 символів на місяць.
-- Запускати ПІСЛЯ 20261008_chats_protect.sql (замінює public.messages_protect()).
--
-- Було: фермер писав агроному лише з активною угодою; «перші 3 повідомлення безкоштовні» не працювали
-- (рахували неіснуючий sender_id), а «Розблокувати» відкривало чат безкоштовно.
-- Стало: у звичайному чаті (без назви — не угода купівлі/продажу) фермер може писати й без угоди:
--  • під час активної угоди з цим агрономом і на платному тарифі фермера (Бізнес, Бізнес Про) — без обмежень;
--  • інакше — до 2000 символів на місяць (за київським часом) сумарно в усіх таких чатах.
--  Скільки символів зараховано, база записує в messages.free_chars; клієнт це поле не змінює.
--  Агроном відповідає без обмежень. Решта правил messages_protect не змінюється.

begin;

alter table public.messages add column if not exists free_chars integer not null default 0;

-- Скільки безкоштовних символів поточний користувач використав цього місяця
create or replace function public.chat_free_chars_used()
returns integer
language sql
stable
security definer
set search_path to 'public'
as $$
  select coalesce(sum(m.free_chars), 0)::int
  from public.messages m
  join public.chats c on c.id = m.chat_id
  where c.farmer_id = auth.uid()
    and m.role = 'user'
    and m.free_chars > 0
    and m.created_at >= (date_trunc('month', now() at time zone 'Europe/Kyiv') at time zone 'Europe/Kyiv');
$$;

revoke all on function public.chat_free_chars_used() from public, anon;
grant execute on function public.chat_free_chars_used() to authenticated;

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
  used integer;
  len integer;
begin
  if me is null or public.is_admin() then
    return coalesce(new, old);
  end if;

  if tg_op = 'DELETE' then
    raise exception 'Повідомлення не можна видалити' using errcode = '42501';
  end if;

  select farmer_id, agronomist_id, title into c from public.chats where id = coalesce(new.chat_id, old.chat_id);

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

    -- Безкоштовний ліміт фермера
    new.free_chars := 0;
    len := char_length(coalesce(new.content, ''));
    if new.role = 'user' and c.title is null and len > 0
       and not exists (
         select 1 from public.agreements a
         where a.farmer_id = c.farmer_id and a.agronomist_id = c.agronomist_id and a.status = 'active')
       and not exists (
         select 1 from public.subscriptions s
         where s.user_id = me and s.profile = 'farmer'
           and s.plan in ('business', 'business_pro', 'premium')
           and (s.expires_at is null or s.expires_at > now())) then
      perform pg_advisory_xact_lock(hashtext('chat_free_chars:' || me::text));
      used := public.chat_free_chars_used();
      if used + len > 2000 then
        raise exception 'Ліміт безкоштовного листування: залишилось % із 2000 символів цього місяця', greatest(2000 - used, 0)
          using errcode = 'P0001', hint = 'chat_free_limit';
      end if;
      new.free_chars := len;
    end if;

    new.created_at := now();
    new.is_read := false;
    return new;
  end if;

  -- UPDATE: лише позначка «прочитано» для повідомлень співрозмовника
  if new.chat_id is distinct from old.chat_id or new.role is distinct from old.role
     or new.content is distinct from old.content or new.image_url is distinct from old.image_url
     or new.product_id is distinct from old.product_id or new.created_at is distinct from old.created_at
     or new.free_chars is distinct from old.free_chars then
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

commit;
