-- AlterTable: Add new fields to evoluciones_clinicas for consultation improvements
ALTER TABLE "evoluciones_clinicas" ADD COLUMN "motivo_consulta" TEXT,
ADD COLUMN "enfermedad_actual" TEXT,
ADD COLUMN "es_primera_consulta" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable: Add new fields to antecedentes_patologicos for cancer/rare disease validation
ALTER TABLE "antecedentes_patologicos" ADD COLUMN "estado_confirmacion" TEXT,
ADD COLUMN "metodo_confirmacion" TEXT,
ADD COLUMN "metodo_confirmacion_detalle" TEXT,
ADD COLUMN "documento_respaldo_url" TEXT,
ADD COLUMN "documento_respaldo_nombre" TEXT;
