-- Виробники
create table if not exists agro_manufacturers (
  id uuid primary key,
  name text not null,
  slug text not null unique,
  website_url text,
  country text,
  is_active boolean default true
);

-- Діючі речовини
create table if not exists agro_active_ingredients (
  id uuid primary key,
  name text not null,
  slug text not null unique,
  description text
);

-- Препарати
create table if not exists agro_products (
  id uuid primary key,
  name text not null,
  slug text not null unique,
  type text not null,
  source_image_url text,
  market_segment text,
  seed_crop text,
  seed_maturity_group text,
  seed_yield_potential numeric,
  seed_recommended_zone text,
  manufacturer_id uuid references agro_manufacturers(id),
  manufacturer_slug text,
  formulation_code text,
  formulation_name text
);

-- Деталі препаратів (окремо щоб не вантажити при списках)
create table if not exists agro_product_details (
  id uuid primary key references agro_products(id),
  description text,
  source_url text,
  chem_class text,
  dosage text,
  crops text[],
  pests text[],
  content_sections jsonb
);

-- Зв'язок препарат ↔ діюча речовина
create table if not exists agro_product_ingredients (
  product_id uuid references agro_products(id) on delete cascade,
  ingredient_id uuid references agro_active_ingredients(id) on delete cascade,
  concentration text,
  primary key (product_id, ingredient_id)
);

-- Бур'яни
create table if not exists agro_weeds (
  id uuid primary key,
  name text not null,
  slug text not null unique,
  latin_name text,
  family text,
  crops_affected text,
  distribution_zones text,
  source_image_url text,
  category_id uuid,
  category_name text,
  category_slug text,
  class_id uuid,
  class_name text,
  class_slug text
);

-- Хвороби
create table if not exists agro_diseases (
  id uuid primary key,
  name text not null,
  slug text not null unique,
  latin_name text,
  culture text,
  source_image_url text,
  category_id uuid,
  category_name text,
  category_slug text
);

-- Індекси для пошуку
create index if not exists agro_products_type_idx on agro_products(type);
create index if not exists agro_products_manufacturer_idx on agro_products(manufacturer_id);
create index if not exists agro_products_name_idx on agro_products using gin(to_tsvector('simple', name));
create index if not exists agro_products_seed_crop_idx on agro_products(seed_crop);

create index if not exists agro_ingredients_name_idx on agro_active_ingredients using gin(to_tsvector('simple', name));
create index if not exists agro_weeds_category_idx on agro_weeds(category_slug);
create index if not exists agro_diseases_category_idx on agro_diseases(category_slug);

-- RLS: публічне читання для всіх
alter table agro_manufacturers enable row level security;
alter table agro_products enable row level security;
alter table agro_product_details enable row level security;
alter table agro_active_ingredients enable row level security;
alter table agro_product_ingredients enable row level security;
alter table agro_weeds enable row level security;
alter table agro_diseases enable row level security;

create policy "public read" on agro_manufacturers for select using (true);
create policy "public read" on agro_products for select using (true);
create policy "public read" on agro_product_details for select using (true);
create policy "public read" on agro_active_ingredients for select using (true);
create policy "public read" on agro_product_ingredients for select using (true);
create policy "public read" on agro_weeds for select using (true);
create policy "public read" on agro_diseases for select using (true);

-- Добрива
create table if not exists agro_fertilizers (
  id uuid primary key,
  name text not null,
  slug text not null unique,
  category_slug text,
  category_id uuid,
  formula text,
  composition text,
  mass_fraction text,
  fertilizer_form text,
  fertilizer_type text,
  manufacturer text,
  source_url text,
  source_image_url text,
  is_active boolean default true
);

create index if not exists agro_fertilizers_category_idx on agro_fertilizers(category_slug);

alter table agro_fertilizers enable row level security;
create policy "public read" on agro_fertilizers for select using (true);
