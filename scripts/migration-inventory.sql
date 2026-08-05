-- Склад препаратів і добрив фермера
CREATE TABLE IF NOT EXISTS farm_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  farm_id UUID REFERENCES farms(id) ON DELETE CASCADE,
  product_id UUID REFERENCES agro_products(id) ON DELETE SET NULL, -- якщо куплено через платформу
  name TEXT NOT NULL,                -- назва препарату/добрива (якщо не з каталогу)
  unit TEXT NOT NULL DEFAULT 'л',   -- л, кг, т, шт
  quantity NUMERIC(10,2) NOT NULL DEFAULT 0, -- поточний залишок
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Операції по складу (надходження / витрата)
CREATE TABLE IF NOT EXISTS farm_inventory_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inventory_id UUID NOT NULL REFERENCES farm_inventory(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('in', 'out')), -- in=надходження, out=витрата
  quantity NUMERIC(10,2) NOT NULL,
  field_id UUID REFERENCES farms(id) ON DELETE SET NULL, -- на яке поле витрачено
  note TEXT,
  order_id UUID,  -- якщо куплено через платформу
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Сповіщення в кабінет
CREATE TABLE IF NOT EXISTS farm_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'inventory_low', -- inventory_low, treatment_soon
  title TEXT NOT NULL,
  body TEXT,
  data JSONB DEFAULT '{}',
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE farm_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE farm_inventory_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE farm_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own inventory" ON farm_inventory
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "own inventory log" ON farm_inventory_log
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "own notifications" ON farm_notifications
  FOR ALL USING (auth.uid() = user_id);

-- Індекси
CREATE INDEX IF NOT EXISTS idx_farm_inventory_user ON farm_inventory(user_id);
CREATE INDEX IF NOT EXISTS idx_farm_inventory_log_inventory ON farm_inventory_log(inventory_id);
CREATE INDEX IF NOT EXISTS idx_farm_notifications_user ON farm_notifications(user_id, is_read);

-- Тригер для автооновлення updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER farm_inventory_updated_at
  BEFORE UPDATE ON farm_inventory
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
