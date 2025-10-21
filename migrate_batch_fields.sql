-- Добавляем новые поля в MaterialPurchaseBatch (если их еще нет)
ALTER TABLE material_purchase_batches ADD COLUMN IF NOT EXISTS "vatPercent" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE material_purchase_batches ADD COLUMN IF NOT EXISTS "minStock" DOUBLE PRECISION;
ALTER TABLE material_purchase_batches ADD COLUMN IF NOT EXISTS "manufacturingDays" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE material_purchase_batches ADD COLUMN IF NOT EXISTS "deliveryDays" INTEGER NOT NULL DEFAULT 0;

-- Мигрируем данные из старых полей в новые
UPDATE material_purchase_batches 
SET "manufacturingDays" = COALESCE("manufacturingDay", 0),
    "deliveryDays" = COALESCE("deliveryDay", 0);

-- Получаем vatPercent из материала для всех партий
UPDATE material_purchase_batches mpb
SET "vatPercent" = m."vatPercentage"
FROM materials m
WHERE mpb."materialId" = m.id;

-- Добавляем новые поля в MaterialPurchaseBatchTemplate
ALTER TABLE material_purchase_batch_templates ADD COLUMN IF NOT EXISTS "vatPercent" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE material_purchase_batch_templates ALTER COLUMN "deliveryDays" SET DEFAULT 0;

-- Получаем vatPercent из материала для всех шаблонов
UPDATE material_purchase_batch_templates mpbt
SET "vatPercent" = m."vatPercentage"
FROM materials m
WHERE mpbt."materialId" = m.id;

-- Теперь можно удалить старые поля из material_purchase_batches
ALTER TABLE material_purchase_batches DROP COLUMN IF EXISTS "manufacturingDay";
ALTER TABLE material_purchase_batches DROP COLUMN IF EXISTS "deliveryDay";

-- Удаляем устаревшие поля из materials
ALTER TABLE materials DROP COLUMN IF EXISTS "batchSize";
ALTER TABLE materials DROP COLUMN IF EXISTS "minStockPercentage";
ALTER TABLE materials DROP COLUMN IF EXISTS "prepaymentPercentage";
ALTER TABLE materials DROP COLUMN IF EXISTS "manufacturingDays";
ALTER TABLE materials DROP COLUMN IF EXISTS "deliveryDays";
