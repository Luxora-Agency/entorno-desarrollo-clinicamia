-- AlterEnum: Add new values to EstadoCita
-- Check if values already exist before adding
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'EnEspera' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'EstadoCita')) THEN
        ALTER TYPE "EstadoCita" ADD VALUE 'EnEspera';
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'Atendiendo' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'EstadoCita')) THEN
        ALTER TYPE "EstadoCita" ADD VALUE 'Atendiendo';
    END IF;
END $$;

-- CreateTable: role_permisos
CREATE TABLE IF NOT EXISTS "role_permisos" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "rol" VARCHAR(50) NOT NULL,
    "modulo" VARCHAR(100) NOT NULL,
    "acceso" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "role_permisos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "role_permisos_rol_modulo_key" ON "role_permisos"("rol", "modulo");

-- AlterTable: citas - Add new columns if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'citas' AND column_name = 'tipo_cita') THEN
        ALTER TABLE "citas" ADD COLUMN "tipo_cita" VARCHAR(50) DEFAULT 'Especialidad';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'citas' AND column_name = 'duracion_minutos') THEN
        ALTER TABLE "citas" ADD COLUMN "duracion_minutos" INTEGER DEFAULT 30;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'citas' AND column_name = 'costo') THEN
        ALTER TABLE "citas" ADD COLUMN "costo" DECIMAL(10,2);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'citas' AND column_name = 'examen_procedimiento_id') THEN
        ALTER TABLE "citas" ADD COLUMN "examen_procedimiento_id" UUID;
    END IF;
END $$;

-- AddForeignKey: citas -> examenes_procedimientos
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'citas_examen_procedimiento_id_fkey'
    ) THEN
        ALTER TABLE "citas" ADD CONSTRAINT "citas_examen_procedimiento_id_fkey" 
        FOREIGN KEY ("examen_procedimiento_id") REFERENCES "examenes_procedimientos"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;
