-- Адмін-функції сторінки /admin/ai-limits:
--  • доступ лише для адміна (users.role = 'admin') — раніше SECURITY DEFINER без перевірки віддавав email-и всіх користувачів;
--  • враховують окремі підписки профілів (subscriptions.profile).
-- Запускати ПІСЛЯ 20261001_subscription_profiles.sql.

begin;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path to 'public'
as $$
  select exists (select 1 from public.users where id = auth.uid() and role = 'admin');
$$;

-- Пошук користувачів: один рядок на користувача; тариф — фермерського профілю
-- (сторінка сама довантажує підписку обраного профілю).
create or replace function public.admin_search_users_with_sub(q text)
returns table(id uuid, email text, plan text, expires_at timestamp with time zone, ai_text_limit integer, ai_photo_limit integer)
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  if not public.is_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  return query
    select
      u.id,
      u.email::text,
      coalesce(s.plan, 'basic') as plan,
      s.expires_at,
      s.ai_text_limit,
      s.ai_photo_limit
    from auth.users u
    left join public.subscriptions s on s.user_id = u.id and s.profile = 'farmer'
    where lower(u.email) like '%' || lower(q) || '%'
    order by u.email
    limit 20;
end;
$$;

-- Список індивідуальних AI-лімітів: рядок на профіль (додано колонку profile — тому drop + create)
drop function if exists public.admin_users_with_custom_ai_limits();
create function public.admin_users_with_custom_ai_limits()
returns table(id uuid, email text, profile text, plan text, ai_text_limit integer, ai_photo_limit integer)
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  if not public.is_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  return query
    select
      u.id,
      u.email::text,
      s.profile,
      coalesce(s.plan, 'basic') as plan,
      s.ai_text_limit,
      s.ai_photo_limit
    from public.subscriptions s
    join auth.users u on u.id = s.user_id
    where s.ai_text_limit is not null or s.ai_photo_limit is not null
    order by u.email, s.profile;
end;
$$;

revoke all on function public.admin_search_users_with_sub(text) from public, anon;
revoke all on function public.admin_users_with_custom_ai_limits() from public, anon;
grant execute on function public.admin_search_users_with_sub(text) to authenticated;
grant execute on function public.admin_users_with_custom_ai_limits() to authenticated;

commit;
