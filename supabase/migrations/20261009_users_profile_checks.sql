-- Профіль користувача: email, аватар, реквізити.
-- Запускати ПІСЛЯ 20261001_users_privacy_ratings.sql (users_protect_columns лишається без змін).
--
-- Було (перевірено на робочій базі):
--  • users.email користувач міг переписати на будь-який (справжня пошта входу не змінювалась, але цей email
--    іде в дані оплати WayForPay і в адмінку);
--  • avatar_url — будь-яке зовнішнє посилання, і воно публічне (public_profiles);
--  • жодних перевірок: ім'я на 5000 символів, ЄДРПОУ «abc», IBAN «hello» — а реквізити йдуть у рахунки угод.
-- Стало:
--  • email у профілі — завжди пошта входу (auth.users);
--  • avatar_url — лише власний файл у сховищі user-avatars;
--  • довжина полів, ЄДРПОУ (8 цифр) / ІПН (10 цифр), IBAN (UA + 27 цифр, пробіли прибираються).
--  Формат перевіряється лише для полів, які змінюються, — наявні записи не ламаються.

begin;

create or replace function public.users_validate_profile()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  changed boolean;
begin
  if auth.uid() is null or public.is_admin() then
    return new;
  end if;

  -- Пошта профілю — пошта входу
  new.email := coalesce((select u.email from auth.users u where u.id = new.id), new.email);

  if new.avatar_url is not null and (tg_op = 'INSERT' or new.avatar_url is distinct from old.avatar_url)
     and strpos(new.avatar_url, '/storage/v1/object/public/user-avatars/avatars/' || new.id::text || '.') = 0 then
    raise exception 'Фото профілю — лише завантажене на сайті' using errcode = '42501';
  end if;

  if length(coalesce(new.name, '')) > 120 or length(coalesce(new.first_name, '')) > 60 or length(coalesce(new.last_name, '')) > 60
     or length(coalesce(new.company_name, '')) > 200 or length(coalesce(new.bank_name, '')) > 200
     or length(coalesce(new.address, '')) > 300 or length(coalesce(new.legal_address, '')) > 300
     or length(coalesce(new.region, '')) > 100 or length(coalesce(new.city, '')) > 100
     or length(coalesce(new.phone, '')) > 30 then
    raise exception 'Задовге значення в профілі' using errcode = '22001';
  end if;

  if new.edrpou is not null then
    new.edrpou := btrim(new.edrpou);
    if new.edrpou = '' then
      new.edrpou := null;
    else
      changed := tg_op = 'INSERT' or new.edrpou is distinct from old.edrpou;
      if changed and new.edrpou !~ '^([0-9]{8}|[0-9]{10})$' then
        raise exception 'ЄДРПОУ — 8 цифр (ІПН — 10 цифр)' using errcode = '22023';
      end if;
    end if;
  end if;

  if new.iban is not null then
    new.iban := upper(regexp_replace(new.iban, '\s', '', 'g'));
    if new.iban = '' then
      new.iban := null;
    else
      changed := tg_op = 'INSERT' or new.iban is distinct from upper(regexp_replace(coalesce(old.iban, ''), '\s', '', 'g'));
      if changed and new.iban !~ '^UA[0-9]{27}$' then
        raise exception 'IBAN — UA і 27 цифр' using errcode = '22023';
      end if;
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists users_validate_profile on public.users;
create trigger users_validate_profile
  before insert or update on public.users
  for each row execute function public.users_validate_profile();

commit;
