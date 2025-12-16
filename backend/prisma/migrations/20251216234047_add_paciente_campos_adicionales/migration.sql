/*
  Warnings:

  - You are about to drop the column `contacto_emergencia_nombre` on the `pacientes` table. All the data in the column will be lost.
  - You are about to drop the column `contacto_emergencia_telefono` on the `pacientes` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "pacientes" DROP COLUMN "contacto_emergencia_nombre",
DROP COLUMN "contacto_emergencia_telefono",
ADD COLUMN     "arl" TEXT,
ADD COLUMN     "carnet_poliza" TEXT,
ADD COLUMN     "categoria" TEXT,
ADD COLUMN     "convenio" TEXT,
ADD COLUMN     "empleador_actual" TEXT,
ADD COLUMN     "estado_civil" TEXT,
ADD COLUMN     "nivel_educacion" TEXT,
ADD COLUMN     "nombre_refiere" TEXT,
ADD COLUMN     "ocupacion" TEXT,
ADD COLUMN     "referido_por" TEXT,
ADD COLUMN     "tipo_paciente" TEXT,
ADD COLUMN     "tipo_usuario" TEXT;
