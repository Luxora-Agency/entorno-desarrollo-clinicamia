-- CreateEnum
CREATE TYPE "ViaPrescripcion" AS ENUM ('Oral', 'Intravenosa', 'Intramuscular', 'Subcutanea', 'Topica', 'Inhalatoria', 'Rectal', 'Sublingual', 'Oftaelmica', 'Otica', 'Nasal', 'Otra');

-- CreateEnum
CREATE TYPE "FrecuenciaPrescripcion" AS ENUM ('Unica', 'Cada4Horas', 'Cada6Horas', 'Cada8Horas', 'Cada12Horas', 'Cada24Horas', 'PRN', 'Continua', 'Otra');

-- CreateEnum
CREATE TYPE "EstadoPrescripcion" AS ENUM ('Activa', 'Suspendida', 'Completada', 'Cancelada');

-- CreateEnum
CREATE TYPE "EstadoAdministracion" AS ENUM ('Programada', 'Administrada', 'Omitida', 'Rechazada');

-- CreateTable
CREATE TABLE "prescripciones" (
    "id" TEXT NOT NULL,
    "pacienteId" TEXT NOT NULL,
    "admisionId" TEXT,
    "medicoId" UUID NOT NULL,
    "fechaPrescripcion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechaInicio" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechaFin" TIMESTAMP(3),
    "diagnostico" TEXT,
    "observaciones" TEXT,
    "estado" "EstadoPrescripcion" NOT NULL DEFAULT 'Activa',
    "firmaMedicoId" UUID,
    "fechaFirma" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "prescripciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prescripciones_medicamentos" (
    "id" TEXT NOT NULL,
    "prescripcionId" TEXT NOT NULL,
    "productoId" TEXT NOT NULL,
    "dosis" VARCHAR(100) NOT NULL,
    "via" "ViaPrescripcion" NOT NULL DEFAULT 'Oral',
    "frecuencia" "FrecuenciaPrescripcion" NOT NULL DEFAULT 'Cada8Horas',
    "frecuenciaDetalle" VARCHAR(255),
    "duracionDias" INTEGER,
    "cantidadTotal" VARCHAR(50),
    "instrucciones" TEXT,
    "indicacionEspecial" TEXT,
    "prn" BOOLEAN NOT NULL DEFAULT false,
    "suspendido" BOOLEAN NOT NULL DEFAULT false,
    "fechaSuspension" TIMESTAMP(3),
    "motivoSuspension" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "prescripciones_medicamentos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "administraciones_medicamentos" (
    "id" TEXT NOT NULL,
    "prescripcionMedicamentoId" TEXT NOT NULL,
    "pacienteId" TEXT NOT NULL,
    "fechaProgramada" TIMESTAMP(3) NOT NULL,
    "horaProgramada" VARCHAR(10) NOT NULL,
    "fechaAdministracion" TIMESTAMP(3),
    "administradoPor" UUID,
    "estado" "EstadoAdministracion" NOT NULL DEFAULT 'Programada',
    "dosisAdministrada" VARCHAR(100),
    "viaAdministrada" VARCHAR(50),
    "observaciones" TEXT,
    "reaccionAdversa" BOOLEAN NOT NULL DEFAULT false,
    "descripcionReaccion" TEXT,
    "motivoOmision" TEXT,
    "motivoRechazo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "administraciones_medicamentos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "prescripciones_pacienteId_idx" ON "prescripciones"("pacienteId");

-- CreateIndex
CREATE INDEX "prescripciones_admisionId_idx" ON "prescripciones"("admisionId");

-- CreateIndex
CREATE INDEX "prescripciones_estado_idx" ON "prescripciones"("estado");

-- CreateIndex
CREATE INDEX "prescripciones_fechaPrescripcion_idx" ON "prescripciones"("fechaPrescripcion");

-- CreateIndex
CREATE INDEX "prescripciones_medicamentos_prescripcionId_idx" ON "prescripciones_medicamentos"("prescripcionId");

-- CreateIndex
CREATE INDEX "prescripciones_medicamentos_productoId_idx" ON "prescripciones_medicamentos"("productoId");

-- CreateIndex
CREATE INDEX "administraciones_medicamentos_prescripcionMedicamentoId_idx" ON "administraciones_medicamentos"("prescripcionMedicamentoId");

-- CreateIndex
CREATE INDEX "administraciones_medicamentos_pacienteId_idx" ON "administraciones_medicamentos"("pacienteId");

-- CreateIndex
CREATE INDEX "administraciones_medicamentos_fechaProgramada_idx" ON "administraciones_medicamentos"("fechaProgramada");

-- CreateIndex
CREATE INDEX "administraciones_medicamentos_estado_idx" ON "administraciones_medicamentos"("estado");

-- AddForeignKey
ALTER TABLE "prescripciones" ADD CONSTRAINT "prescripciones_pacienteId_fkey" FOREIGN KEY ("pacienteId") REFERENCES "pacientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prescripciones" ADD CONSTRAINT "prescripciones_admisionId_fkey" FOREIGN KEY ("admisionId") REFERENCES "admisiones"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prescripciones" ADD CONSTRAINT "prescripciones_medicoId_fkey" FOREIGN KEY ("medicoId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prescripciones" ADD CONSTRAINT "prescripciones_firmaMedicoId_fkey" FOREIGN KEY ("firmaMedicoId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prescripciones_medicamentos" ADD CONSTRAINT "prescripciones_medicamentos_prescripcionId_fkey" FOREIGN KEY ("prescripcionId") REFERENCES "prescripciones"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prescripciones_medicamentos" ADD CONSTRAINT "prescripciones_medicamentos_productoId_fkey" FOREIGN KEY ("productoId") REFERENCES "productos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "administraciones_medicamentos" ADD CONSTRAINT "administraciones_medicamentos_prescripcionMedicamentoId_fkey" FOREIGN KEY ("prescripcionMedicamentoId") REFERENCES "prescripciones_medicamentos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "administraciones_medicamentos" ADD CONSTRAINT "administraciones_medicamentos_pacienteId_fkey" FOREIGN KEY ("pacienteId") REFERENCES "pacientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "administraciones_medicamentos" ADD CONSTRAINT "administraciones_medicamentos_administradoPor_fkey" FOREIGN KEY ("administradoPor") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

