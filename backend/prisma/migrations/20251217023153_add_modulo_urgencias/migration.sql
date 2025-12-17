-- CreateEnum
CREATE TYPE "CategoriaManchester" AS ENUM ('Rojo', 'Naranja', 'Amarillo', 'Verde', 'Azul');

-- CreateEnum
CREATE TYPE "EstadoUrgencia" AS ENUM ('Triaje', 'Espera', 'EnAtencion', 'Completada', 'Alta', 'Hospitalizado', 'Remitido', 'Cancelado');

-- CreateEnum
CREATE TYPE "DisposicionUrgencia" AS ENUM ('Alta', 'Hospitalizar', 'Remitir', 'Fallecido', 'Observacion');

-- CreateTable
CREATE TABLE "atenciones_urgencias" (
    "id" TEXT NOT NULL,
    "paciente_id" TEXT NOT NULL,
    "categoria_manchester" "CategoriaManchester" NOT NULL,
    "nivel_urgencia" TEXT NOT NULL,
    "prioridad" INTEGER NOT NULL,
    "motivo_consulta" TEXT NOT NULL,
    "hora_llegada" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "hora_triaje" TIMESTAMP(3),
    "medio_llegada" TEXT,
    "acompanante" TEXT,
    "presion_sistolica" INTEGER,
    "presion_diastolica" INTEGER,
    "frecuencia_cardiaca" INTEGER,
    "frecuencia_respiratoria" INTEGER,
    "temperatura" DECIMAL(4,1),
    "saturacion_oxigeno" DECIMAL(5,2),
    "escala_glasgow" INTEGER,
    "escala_dolor" INTEGER,
    "estado" "EstadoUrgencia" NOT NULL DEFAULT 'Triaje',
    "area_asignada" TEXT,
    "medico_asignado_id" UUID,
    "enfermera_asignada_id" UUID,
    "hora_inicio_atencion" TIMESTAMP(3),
    "hora_fin_atencion" TIMESTAMP(3),
    "diagnostico_inicial" TEXT,
    "tratamiento_aplicado" TEXT,
    "observaciones" TEXT,
    "disposicion" "DisposicionUrgencia",
    "indicaciones_alta" TEXT,
    "cita_id" TEXT,
    "admision_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "atenciones_urgencias_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "atenciones_urgencias" ADD CONSTRAINT "atenciones_urgencias_paciente_id_fkey" FOREIGN KEY ("paciente_id") REFERENCES "pacientes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "atenciones_urgencias" ADD CONSTRAINT "atenciones_urgencias_medico_asignado_id_fkey" FOREIGN KEY ("medico_asignado_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "atenciones_urgencias" ADD CONSTRAINT "atenciones_urgencias_enfermera_asignada_id_fkey" FOREIGN KEY ("enfermera_asignada_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "atenciones_urgencias" ADD CONSTRAINT "atenciones_urgencias_cita_id_fkey" FOREIGN KEY ("cita_id") REFERENCES "citas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "atenciones_urgencias" ADD CONSTRAINT "atenciones_urgencias_admision_id_fkey" FOREIGN KEY ("admision_id") REFERENCES "admisiones"("id") ON DELETE SET NULL ON UPDATE CASCADE;
