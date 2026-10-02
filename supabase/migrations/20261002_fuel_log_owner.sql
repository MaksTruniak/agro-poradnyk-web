-- Журнал пального: записувати можна лише в журнал пального, яке користувач бачить (своє).
--
-- Було: правило на вставку в fuel_log перевіряло лише user_id = auth.uid() —
-- будь-який залогінений міг дописати «заправку» в журнал чужого пального (fuel_id чужий).
-- Стало: обмежувальне правило поверх наявних — fuel_id має належати видимому користувачу запису fuel_inventory
-- (видимість визначають правила fuel_inventory), а user_id — це сам користувач.

begin;

drop policy if exists "fuel_log: only own fuel" on public.fuel_log;
create policy "fuel_log: only own fuel" on public.fuel_log
  as restrictive
  for insert to authenticated
  with check (
    user_id = auth.uid()
    and exists (select 1 from public.fuel_inventory f where f.id = fuel_id)
  );

commit;
