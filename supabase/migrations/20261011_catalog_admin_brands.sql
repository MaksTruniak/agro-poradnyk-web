-- Адмінка каталогу й вимкнені бренди.
-- Запускати ПІСЛЯ 20261001_admin_ai_functions.sql (потрібна public.is_admin()).
--
-- Було (перевірено на робочій базі): адмін не міг змінити жодної з таблиць нижче — база мовчки повертала
-- 0 рядків, а адмінка показувала «збережено». Тому не працювали: вимкнення бренду (жодного вимкненого
-- з 504), редагування товарів, категорій, діючих речовин, зв'язків товар—хвороба/шкідник, агрокалендаря,
-- категорій культур, добрив і кредитів AI в тарифах (ai_plan_limits).
-- Стало:
--  • адмін читає й змінює ці таблиці (правила лише ДОДАЮТЬСЯ — публічне читання лишається як було);
--  • вимкнений бренд і його товари не видно на сайті (каталог, пошук, сторінки хвороб/шкідників/бур'янів),
--    адмін бачить усе. Товари без бренду не зачіпаються.

begin;

create or replace function pg_temp.admin_all(tbl text)
returns void language plpgsql as $$
begin
  execute format('drop policy if exists "admin: all" on public.%I', tbl);
  execute format('create policy "admin: all" on public.%I for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()))', tbl);
end;
$$;

select pg_temp.admin_all(t) from unnest(array[
  'agro_manufacturers', 'agro_products', 'agro_categories', 'agro_active_ingredients',
  'agro_product_details', 'agro_product_ingredients', 'agro_disease_products', 'agro_pest_products',
  'agro_calendar', 'crop_categories', 'agro_fertilizers', 'ai_plan_limits'
]) as t;

-- ── Вимкнені бренди: обмежувальні правила читання (діють поверх наявних дозвільних) ──
drop policy if exists "brands: hide inactive" on public.agro_manufacturers;
create policy "brands: hide inactive" on public.agro_manufacturers
  as restrictive for select to anon, authenticated
  using (is_active is not false or (select public.is_admin()));

drop policy if exists "products: hide inactive brands" on public.agro_products;
create policy "products: hide inactive brands" on public.agro_products
  as restrictive for select to anon, authenticated
  using (
    manufacturer_id is null
    or exists (select 1 from public.agro_manufacturers m where m.id = manufacturer_id and m.is_active is not false)
    or (select public.is_admin())
  );

commit;
