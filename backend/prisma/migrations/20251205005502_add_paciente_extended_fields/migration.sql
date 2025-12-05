/*
  Warnings:

  - The `genero` column on the `pacientes` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "pacientes" ADD COLUMN     "altura" DOUBLE PRECISION,
ADD COLUMN     "antecedentes_quirurgicos" TEXT,
ADD COLUMN     "barrio" TEXT,
ADD COLUMN     "contactos_emergencia" JSONB,
ADD COLUMN     "departamento" TEXT,
ADD COLUMN     "enfermedades_cronicas" TEXT,
ADD COLUMN     "eps" TEXT,
ADD COLUMN     "estado" TEXT NOT NULL DEFAULT 'Activo',
ADD COLUMN     "fecha_afiliacion" DATE,
ADD COLUMN     "medicamentos_actuales" TEXT,
ADD COLUMN     "municipio" TEXT,
ADD COLUMN     "nivel_sisben" TEXT,
ADD COLUMN     "numero_autorizacion" TEXT,
ADD COLUMN     "pais_nacimiento" TEXT,
ADD COLUMN     "peso" DOUBLE PRECISION,
ADD COLUMN     "regimen" TEXT,
ADD COLUMN     "tipo_afiliacion" TEXT,
ADD COLUMN     "tipo_documento" TEXT,
ADD COLUMN     "ultima_consulta" DATE,
ALTER COLUMN "fecha_nacimiento" DROP NOT NULL,
DROP COLUMN "genero",
ADD COLUMN     "genero" TEXT;
