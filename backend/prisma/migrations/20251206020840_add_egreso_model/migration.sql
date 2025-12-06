-- CreateEnum
CREATE TYPE "TipoEgreso" AS ENUM ('AltaMedica', 'Remision', 'Voluntario', 'Fallecimiento', 'Fuga');

-- CreateEnum
CREATE TYPE "EstadoPacienteEgreso" AS ENUM ('Mejorado', 'Estable', 'Complicado', 'Fallecido');

-- CreateTable
CREATE TABLE "egresos" (
    "id" TEXT NOT NULL,
    "admision_id" TEXT NOT NULL,
    "fecha_egreso" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "hora_egreso" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "diagnostico_salida" TEXT NOT NULL,
    "descripcion_diagnostico" TEXT NOT NULL,
    "resumen_clinico" TEXT NOT NULL,
    "tratamiento_domiciliario" TEXT,
    "recomendaciones" TEXT,
    "profesional_responsable_id" UUID NOT NULL,
    "tipo_egreso" "TipoEgreso" NOT NULL,
    "estado_paciente" "EstadoPacienteEgreso" NOT NULL,
    "requiere_control" BOOLEAN NOT NULL DEFAULT false,
    "fecha_control" DATE,
    "observaciones" TEXT,
    "firma_digital" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "egresos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "egresos_admision_id_key" ON "egresos"("admision_id");

-- AddForeignKey
ALTER TABLE "egresos" ADD CONSTRAINT "egresos_admision_id_fkey" FOREIGN KEY ("admision_id") REFERENCES "admisiones"("id") ON DELETE CASCADE ON UPDATE CASCADE;
