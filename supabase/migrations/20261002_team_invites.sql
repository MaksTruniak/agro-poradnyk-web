-- Команда: запрошення.
--
-- Було:
--  • upsert_team_member приймав будь-який p_owner_id — будь-хто міг створити запрошення в чужу команду
--    або змінити роль/посаду наявного учасника (переглядач → редактор);
--  • сторінка /invite читала запрошення за токеном без входу, але правила team_members це забороняють —
--    будь-яке посилання показувало «Запрошення недійсне»;
--  • прийняти запрошення (update team_members ... where token) правила теж не дозволяють — 0 рядків.
-- Стало:
--  • team_invite_by_token — дані запрошення за токеном (для сторінки /invite, і без входу);
--  • accept_team_invite — приймає запрошення лише користувач з тією самою поштою;
--  • тригер: створювати й змінювати записи команди може лише її власник (будь-яким шляхом, зокрема через
--    upsert_team_member); власник не може сам «прийняти» запрошення за учасника.

begin;

create or replace function public.team_invite_by_token(p_token text)
returns table(id uuid, email text, role text, status text, owner_id uuid)
language sql
stable
security definer
set search_path to 'public'
as $$
  select tm.id, tm.email::text, tm.role::text, tm.status::text, tm.owner_id
  from public.team_members tm
  where length(coalesce(p_token, '')) >= 32 and tm.token = p_token;
$$;

revoke all on function public.team_invite_by_token(text) from public;
grant execute on function public.team_invite_by_token(text) to anon, authenticated;

create or replace function public.accept_team_invite(p_token text, p_name text default null)
returns uuid
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  me uuid := auth.uid();
  my_email text;
  inv public.team_members%rowtype;
begin
  if me is null then
    raise exception 'Потрібен вхід' using errcode = '42501';
  end if;
  select lower(u.email) into my_email from auth.users u where u.id = me;

  select * into inv from public.team_members
  where length(coalesce(p_token, '')) >= 32 and token = p_token
  for update;
  if not found then
    raise exception 'Запрошення недійсне' using errcode = 'P0002';
  end if;
  if lower(inv.email) is distinct from my_email then
    raise exception 'Запрошення надіслано на іншу пошту' using errcode = '42501';
  end if;
  if inv.owner_id = me then
    raise exception 'Не можна приєднатися до власної команди' using errcode = '42501';
  end if;
  if inv.status = 'active' and inv.member_id is distinct from me then
    raise exception 'Запрошення вже прийнято' using errcode = '42501';
  end if;

  perform set_config('app.team_accept', 'on', true);
  update public.team_members
  set member_id = me,
      status = 'active',
      name = coalesce(nullif(trim(p_name), ''), name)
  where id = inv.id;
  perform set_config('app.team_accept', 'off', true);

  return inv.owner_id;
end;
$$;

revoke all on function public.accept_team_invite(text, text) from public, anon;
grant execute on function public.accept_team_invite(text, text) to authenticated;

create or replace function public.team_members_protect()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
declare me uuid := auth.uid();
begin
  if me is null or public.is_admin() or current_setting('app.team_accept', true) = 'on' then
    return new;
  end if;

  if tg_op = 'INSERT' then
    if new.owner_id is distinct from me then
      raise exception 'Запрошувати можна лише до власної команди' using errcode = '42501';
    end if;
    new.member_id := null;
    new.status := 'pending';
    return new;
  end if;

  -- UPDATE: лише власник; учасника й статус ставить тільки accept_team_invite
  if old.owner_id is distinct from me then
    raise exception 'Змінювати команду може лише її власник' using errcode = '42501';
  end if;
  new.owner_id := old.owner_id;
  new.member_id := old.member_id;
  new.status := old.status;
  new.token := old.token;
  return new;
end;
$$;

drop trigger if exists team_members_protect on public.team_members;
create trigger team_members_protect
  before insert or update on public.team_members
  for each row execute function public.team_members_protect();

commit;
