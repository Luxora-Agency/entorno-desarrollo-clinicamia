-- CreateEnum
CREATE TYPE "TurnoEnfermeria" AS ENUM ('Manana', 'Tarde', 'Noche');

-- CreateEnum
CREATE TYPE "TipoNotaEnfermeria" AS ENUM ('Evolucion', 'Observacion', 'Incidente', 'CambioTurno', 'Procedimiento');

-- CreateTable
CREATE TABLE "asignaciones_enfermeria" (
    "id" TEXT NOT NULL,
    "enfermera_id" UUID NOT NULL,
    "unidad_id" TEXT NOT NULL,
    "piso" INTEGER,
    "turno" "TurnoEnfermeria" NOT NULL,
    "fecha_inicio" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_fin" TIMESTAMP(3),
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "asignaciones_enfermeria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notas_enfermeria" (
    "id" TEXT NOT NULL,
    "admision_id" TEXT NOT NULL,
    "paciente_id" TEXT NOT NULL,
    "enfermera_id" UUID NOT NULL,
    "tipo_nota" "TipoNotaEnfermeria" NOT NULL,
    "titulo" VARCHAR(255),
    "contenido" TEXT NOT NULL,
    "turno" "TurnoEnfermeria" NOT NULL,
    "fecha_hora" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "requiere_seguimiento" BOOLEAN NOT NULL DEFAULT false,
    "seguimiento_por" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notas_enfermeria_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "asignaciones_enfermeria_enfermera_id_idx" ON "asignaciones_enfermeria"("enfermera_id");

-- CreateIndex
CREATE INDEX "asignaciones_enfermeria_unidad_id_idx" ON "asignaciones_enfermeria"("unidad_id");

-- CreateIndex
CREATE INDEX "asignaciones_enfermeria_activo_idx" ON "asignaciones_enfermeria"("activo");

-- CreateIndex
CREATE INDEX "notas_enfermeria_admision_id_idx" ON "notas_enfermeria"("admision_id");

-- CreateIndex
CREATE INDEX "notas_enfermeria_paciente_id_idx" ON "notas_enfermeria"("paciente_id");

-- CreateIndex
CREATE INDEX "notas_enfermeria_enfermera_id_idx" ON "notas_enfermeria"("enfermera_id");

-- CreateIndex
CREATE INDEX "notas_enfermeria_fecha_hora_idx" ON "notas_enfermeria"("fecha_hora");

-- AddForeignKey
ALTER TABLE "asignaciones_enfermeria" ADD CONSTRAINT "asignaciones_enfermeria_enfermera_id_fkey" FOREIGN KEY ("enfermera_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asignaciones_enfermeria" ADD CONSTRAINT "asignaciones_enfermeria_unidad_id_fkey" FOREIGN KEY ("unidad_id") REFERENCES "unidades"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notas_enfermeria" ADD CONSTRAINT "notas_enfermeria_admision_id_fkey" FOREIGN KEY ("admision_id") REFERENCES "admisiones"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notas_enfermeria" ADD CONSTRAINT "notas_enfermeria_paciente_id_fkey" FOREIGN KEY ("paciente_id") REFERENCES "pacientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notas_enfermeria" ADD CONSTRAINT "notas_enfermeria_enfermera_id_fkey" FOREIGN KEY ("enfermera_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
