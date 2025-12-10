-- CreateEnum
CREATE TYPE "EstadoInterconsulta" AS ENUM ('Solicitada', 'EnProceso', 'Respondida', 'Cancelada');

-- CreateEnum
CREATE TYPE "PrioridadInterconsulta" AS ENUM ('Baja', 'Media', 'Alta', 'Urgente');

-- CreateEnum
CREATE TYPE "TipoProcedimiento" AS ENUM ('Diagnostico', 'Terapeutico', 'Quirurgico', 'Intervencionista', 'Rehabilitacion', 'Otro');

-- CreateEnum
CREATE TYPE "EstadoProcedimiento" AS ENUM ('Programado', 'EnProceso', 'Completado', 'Cancelado', 'Diferido');

-- CreateTable
CREATE TABLE "interconsultas" (
    "id" TEXT NOT NULL,
    "admisionId" TEXT NOT NULL,
    "pacienteId" TEXT NOT NULL,
    "especialidadSolicitada" VARCHAR(255) NOT NULL,
    "medicoSolicitanteId" UUID NOT NULL,
    "medicoEspecialistaId" UUID,
    "fechaSolicitud" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechaRespuesta" TIMESTAMP(3),
    "motivoConsulta" TEXT NOT NULL,
    "antecedentesRelevantes" TEXT,
    "examenesSolicitados" TEXT,
    "diagnosticoPresuntivo" TEXT,
    "prioridad" "PrioridadInterconsulta" NOT NULL DEFAULT 'Media',
    "estado" "EstadoInterconsulta" NOT NULL DEFAULT 'Solicitada',
    "evaluacionEspecialista" TEXT,
    "diagnosticoEspecialista" TEXT,
    "recomendaciones" TEXT,
    "requiereSeguimiento" BOOLEAN NOT NULL DEFAULT false,
    "fechaSeguimiento" TIMESTAMP(3),
    "observaciones" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "interconsultas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "procedimientos" (
    "id" TEXT NOT NULL,
    "admisionId" TEXT NOT NULL,
    "pacienteId" TEXT NOT NULL,
    "medicoResponsableId" UUID NOT NULL,
    "nombre" VARCHAR(255) NOT NULL,
    "tipo" "TipoProcedimiento" NOT NULL DEFAULT 'Terapeutico',
    "descripcion" TEXT NOT NULL,
    "indicacion" TEXT NOT NULL,
    "fechaProgramada" TIMESTAMP(3),
    "fechaRealizada" TIMESTAMP(3),
    "duracionEstimada" INTEGER,
    "duracionReal" INTEGER,
    "estado" "EstadoProcedimiento" NOT NULL DEFAULT 'Programado',
    "tecnicaUtilizada" TEXT,
    "hallazgos" TEXT,
    "complicaciones" TEXT,
    "resultados" TEXT,
    "insumosUtilizados" TEXT,
    "equipoMedico" TEXT,
    "personalAsistente" TEXT,
    "recomendacionesPost" TEXT,
    "cuidadosEspeciales" TEXT,
    "observaciones" TEXT,
    "firmaMedicoId" UUID,
    "fechaFirma" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "procedimientos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "interconsultas_admisionId_idx" ON "interconsultas"("admisionId");

-- CreateIndex
CREATE INDEX "interconsultas_pacienteId_idx" ON "interconsultas"("pacienteId");

-- CreateIndex
CREATE INDEX "interconsultas_estado_idx" ON "interconsultas"("estado");

-- CreateIndex
CREATE INDEX "interconsultas_fechaSolicitud_idx" ON "interconsultas"("fechaSolicitud");

-- CreateIndex
CREATE INDEX "procedimientos_admisionId_idx" ON "procedimientos"("admisionId");

-- CreateIndex
CREATE INDEX "procedimientos_pacienteId_idx" ON "procedimientos"("pacienteId");

-- CreateIndex
CREATE INDEX "procedimientos_estado_idx" ON "procedimientos"("estado");

-- CreateIndex
CREATE INDEX "procedimientos_fechaProgramada_idx" ON "procedimientos"("fechaProgramada");

-- CreateIndex
CREATE INDEX "procedimientos_fechaRealizada_idx" ON "procedimientos"("fechaRealizada");

-- AddForeignKey
ALTER TABLE "interconsultas" ADD CONSTRAINT "interconsultas_admisionId_fkey" FOREIGN KEY ("admisionId") REFERENCES "admisiones"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interconsultas" ADD CONSTRAINT "interconsultas_pacienteId_fkey" FOREIGN KEY ("pacienteId") REFERENCES "pacientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interconsultas" ADD CONSTRAINT "interconsultas_medicoSolicitanteId_fkey" FOREIGN KEY ("medicoSolicitanteId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interconsultas" ADD CONSTRAINT "interconsultas_medicoEspecialistaId_fkey" FOREIGN KEY ("medicoEspecialistaId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "procedimientos" ADD CONSTRAINT "procedimientos_admisionId_fkey" FOREIGN KEY ("admisionId") REFERENCES "admisiones"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "procedimientos" ADD CONSTRAINT "procedimientos_pacienteId_fkey" FOREIGN KEY ("pacienteId") REFERENCES "pacientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "procedimientos" ADD CONSTRAINT "procedimientos_medicoResponsableId_fkey" FOREIGN KEY ("medicoResponsableId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "procedimientos" ADD CONSTRAINT "procedimientos_firmaMedicoId_fkey" FOREIGN KEY ("firmaMedicoId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;
