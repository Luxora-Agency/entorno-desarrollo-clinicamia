-- CreateEnum
CREATE TYPE "TipoEvolucion" AS ENUM ('Ingreso', 'Seguimiento', 'Alta', 'Urgencia', 'Interconsulta', 'Prequirurgico', 'Postquirurgico');

-- CreateEnum
CREATE TYPE "TipoDiagnosticoHCE" AS ENUM ('Principal', 'Secundario', 'Complicacion', 'Comorbilidad', 'Diferencial');

-- CreateEnum
CREATE TYPE "EstadoDiagnosticoHCE" AS ENUM ('Activo', 'EnControl', 'Resuelto', 'Descartado');

-- CreateEnum
CREATE TYPE "SeveridadHCE" AS ENUM ('Leve', 'Moderada', 'Grave', 'Critica');

-- CreateEnum
CREATE TYPE "TipoAlertaHCE" AS ENUM ('AlergiaMedicamento', 'Intolerancia', 'RestriccionMovilidad', 'Aislamiento', 'RiesgoCaidas', 'Recordatorio', 'SignoVitalCritico', 'ResultadoCritico', 'InteraccionMedicamentosa');

-- CreateEnum
CREATE TYPE "AccionAuditoriaHCE" AS ENUM ('Creacion', 'Modificacion', 'Eliminacion', 'Visualizacion', 'Firma', 'Descarga', 'Impresion');

-- CreateTable
CREATE TABLE "evoluciones_clinicas" (
    "id" TEXT NOT NULL,
    "paciente_id" TEXT NOT NULL,
    "admision_id" TEXT,
    "cita_id" TEXT,
    "doctor_id" UUID NOT NULL,
    "subjetivo" TEXT NOT NULL,
    "objetivo" TEXT NOT NULL,
    "analisis" TEXT NOT NULL,
    "plan" TEXT NOT NULL,
    "tipoEvolucion" "TipoEvolucion" NOT NULL,
    "fecha_evolucion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "turno" TEXT,
    "area_hospitalizacion" TEXT,
    "firmada" BOOLEAN NOT NULL DEFAULT false,
    "firma_digital" TEXT,
    "hash_registro" TEXT,
    "fecha_firma" TIMESTAMP(3),
    "ip_registro" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "evoluciones_clinicas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "signos_vitales" (
    "id" TEXT NOT NULL,
    "paciente_id" TEXT NOT NULL,
    "admision_id" TEXT,
    "registrado_por" UUID NOT NULL,
    "temperatura" DECIMAL(4,1),
    "presion_sistolica" INTEGER,
    "presion_diastolica" INTEGER,
    "frecuencia_cardiaca" INTEGER,
    "frecuencia_respiratoria" INTEGER,
    "saturacion_oxigeno" DECIMAL(5,2),
    "peso" DECIMAL(6,2),
    "talla" DECIMAL(5,2),
    "imc" DECIMAL(5,2),
    "perimetro_cefalico" DECIMAL(5,2),
    "escala_dolor" INTEGER,
    "turno" TEXT,
    "fecha_registro" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "observaciones" TEXT,
    "alerta_generada" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "signos_vitales_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "diagnosticos_hce" (
    "id" TEXT NOT NULL,
    "paciente_id" TEXT NOT NULL,
    "evolucion_id" TEXT,
    "admision_id" TEXT,
    "doctor_id" UUID NOT NULL,
    "codigo_cie11" TEXT NOT NULL,
    "descripcion_cie11" TEXT NOT NULL,
    "tipo_diagnostico" "TipoDiagnosticoHCE" NOT NULL,
    "estado_diagnostico" "EstadoDiagnosticoHCE" NOT NULL,
    "es_diferencial" BOOLEAN NOT NULL DEFAULT false,
    "observaciones" TEXT,
    "fecha_diagnostico" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_resolucion" TIMESTAMP(3),
    "severidad" "SeveridadHCE",
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "diagnosticos_hce_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alertas_clinicas" (
    "id" TEXT NOT NULL,
    "paciente_id" TEXT NOT NULL,
    "tipoAlerta" "TipoAlertaHCE" NOT NULL,
    "severidad" "SeveridadHCE" NOT NULL,
    "titulo" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "origen" TEXT,
    "valor_referencia" TEXT,
    "visible_para" TEXT[],
    "color_alerta" TEXT NOT NULL DEFAULT 'red',
    "icono_alerta" TEXT,
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "reconocida_por" UUID,
    "fecha_reconocimiento" TIMESTAMP(3),
    "fecha_alerta" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_expiracion" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "alertas_clinicas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auditoria_hce" (
    "id" TEXT NOT NULL,
    "entidad" TEXT NOT NULL,
    "entidad_id" TEXT NOT NULL,
    "accion" "AccionAuditoriaHCE" NOT NULL,
    "usuario_id" UUID NOT NULL,
    "nombre_usuario" TEXT NOT NULL,
    "rol" TEXT NOT NULL,
    "fecha_accion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ip_origen" TEXT,
    "navegador" TEXT,
    "dispositivo" TEXT,
    "valores_anteriores" JSONB,
    "valores_nuevos" JSONB,
    "hash_registro" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "auditoria_hce_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "evoluciones_clinicas" ADD CONSTRAINT "evoluciones_clinicas_paciente_id_fkey" FOREIGN KEY ("paciente_id") REFERENCES "pacientes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evoluciones_clinicas" ADD CONSTRAINT "evoluciones_clinicas_doctor_id_fkey" FOREIGN KEY ("doctor_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evoluciones_clinicas" ADD CONSTRAINT "evoluciones_clinicas_admision_id_fkey" FOREIGN KEY ("admision_id") REFERENCES "admisiones"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evoluciones_clinicas" ADD CONSTRAINT "evoluciones_clinicas_cita_id_fkey" FOREIGN KEY ("cita_id") REFERENCES "citas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "signos_vitales" ADD CONSTRAINT "signos_vitales_paciente_id_fkey" FOREIGN KEY ("paciente_id") REFERENCES "pacientes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "signos_vitales" ADD CONSTRAINT "signos_vitales_admision_id_fkey" FOREIGN KEY ("admision_id") REFERENCES "admisiones"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "signos_vitales" ADD CONSTRAINT "signos_vitales_registrado_por_fkey" FOREIGN KEY ("registrado_por") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "diagnosticos_hce" ADD CONSTRAINT "diagnosticos_hce_paciente_id_fkey" FOREIGN KEY ("paciente_id") REFERENCES "pacientes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "diagnosticos_hce" ADD CONSTRAINT "diagnosticos_hce_evolucion_id_fkey" FOREIGN KEY ("evolucion_id") REFERENCES "evoluciones_clinicas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "diagnosticos_hce" ADD CONSTRAINT "diagnosticos_hce_admision_id_fkey" FOREIGN KEY ("admision_id") REFERENCES "admisiones"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "diagnosticos_hce" ADD CONSTRAINT "diagnosticos_hce_doctor_id_fkey" FOREIGN KEY ("doctor_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alertas_clinicas" ADD CONSTRAINT "alertas_clinicas_paciente_id_fkey" FOREIGN KEY ("paciente_id") REFERENCES "pacientes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alertas_clinicas" ADD CONSTRAINT "alertas_clinicas_reconocida_por_fkey" FOREIGN KEY ("reconocida_por") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auditoria_hce" ADD CONSTRAINT "auditoria_hce_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
