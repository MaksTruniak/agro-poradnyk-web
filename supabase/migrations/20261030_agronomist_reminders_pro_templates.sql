-- 1) Нагадування від агронома фермеру.
--    Агроном у техкарті клієнта ставив нагадування на обробку, але воно записувалось на самого агронома
--    (user_id = агроном), а сторінка й розсилки фермера ще й відсіювали from_agronomist — фермер його не бачив.
--    Тепер нагадування пишеться фермеру (user_id = власник поля, created_by = агроном). Правило нижче дозволяє
--    агрономові створити його лише для обробки в техкарті клієнта, до якої він має доступ (активна співпраця
--    або доступ до поля), і бачити/видаляти лише свої надіслані нагадування.
-- 2) Шаблони техкарт — на тарифі Агроном Про: без активного Про новий шаблон не зберегти.
--    Збережені шаблони лишаються доступними для перегляду, перейменування й видалення.
-- 3) AI агроном — лише в платних тарифах (фермер Бізнес / Бізнес Про, Агроном Про). Сервер (aiAccess) уже не дає
--    кредитів тарифу basic; тут обнуляємо й налаштування, щоб адмінка й сторінки тарифів показували те саме.

begin;

-- ── 1. Нагадування від агронома ─────────────────────────────────────────────
create or replace function public.reminder_agronomist_target_ok(p_user uuid, p_treatment uuid)
returns boolean language sql stable security definer set search_path to 'public' as $$
  select exists (
    select 1 from public.program_treatments t
    where t.id = p_treatment
      and public.program_owner(t.program_id) = p_user
      and (public.is_agronomist_of(p_user) or public.program_shared_with_me(t.program_id))
  );
$$;

revoke all on function public.reminder_agronomist_target_ok(uuid, uuid) from public, anon;
grant execute on function public.reminder_agronomist_target_ok(uuid, uuid) to authenticated;

drop policy if exists "reminders: agronomist sent" on public.reminders;
create policy "reminders: agronomist sent" on public.reminders
  for all to authenticated
  using (from_agronomist and created_by = auth.uid())
  with check (
    from_agronomist and created_by = auth.uid()
    and public.reminder_agronomist_target_ok(user_id, treatment_id)
  );

-- ── 2. Шаблони техкарт — Агроном Про ────────────────────────────────────────
create or replace function public.techcard_templates_limit()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
-- Тригери спрацьовують за алфавітом: цей — раніше за techcard_templates_protect, тож owner_id ще може бути
-- підставлений клієнтом; перевіряємо того, хто реально записує
declare me uuid := coalesce(auth.uid(), new.owner_id);
begin
  if not exists (
    select 1 from public.subscriptions s
    where s.user_id = me and s.profile = 'agronomist' and s.plan = 'pro'
      and (s.expires_at is null or s.expires_at > now())
  ) then
    raise exception 'Шаблони техкарт — на тарифі Агроном Про' using errcode = '42501';
  end if;
  if (select count(*) from public.techcard_templates where owner_id = me) >= 100 then
    raise exception 'Не більше 100 шаблонів техкарт' using errcode = 'P0001';
  end if;
  return new;
end;
$$;

-- ── 3. AI — без кредитів на безкоштовних тарифах ────────────────────────────
update public.ai_plan_limits set credits_base = 0, credits_per_ha = 0, credits_ha_cap = 0
where plan in ('basic', 'agronomist_basic');

commit;
