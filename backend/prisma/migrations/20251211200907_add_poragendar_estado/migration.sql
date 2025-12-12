-- Step 1: Agregar nuevo valor al enum (debe estar solo)
ALTER TYPE "EstadoCita" ADD VALUE 'PorAgendar';

-- Commit implícito aquí

-- Step 2: Hacer campos opcionales en tabla citas (en otra transacción conceptual)
DO $$
BEGIN
  ALTER TABLE "citas" ALTER COLUMN "doctor_id" DROP NOT NULL;
  ALTER TABLE "citas" ALTER COLUMN "fecha" DROP NOT NULL;
  ALTER TABLE "citas" ALTER COLUMN "hora" DROP NOT NULL;
  ALTER TABLE "citas" ALTER COLUMN "costo" SET NOT NULL;
END $$;
