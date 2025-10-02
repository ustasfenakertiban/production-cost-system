
-- Add requiresContinuousOperation to operation_equipment
ALTER TABLE "operation_equipment" ADD COLUMN IF NOT EXISTS "requiresContinuousOperation" BOOLEAN NOT NULL DEFAULT true;

-- Add requiresContinuousPresence to operation_roles
ALTER TABLE "operation_roles" ADD COLUMN IF NOT EXISTS "requiresContinuousPresence" BOOLEAN NOT NULL DEFAULT true;
