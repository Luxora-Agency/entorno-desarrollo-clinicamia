/*
  Warnings:

  - A unique constraint covering the columns `[codigoCUPS]` on the table `examenes_procedimientos` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "TipoEstandarHabilitacion" AS ENUM ('TALENTO_HUMANO', 'INFRAESTRUCTURA', 'DOTACION', 'MEDICAMENTOS_DISPOSITIVOS', 'PROCESOS_PRIORITARIOS', 'HISTORIA_CLINICA', 'INTERDEPENDENCIA');

-- CreateEnum
CREATE TYPE "EstadoCumplimiento" AS ENUM ('CUMPLE', 'CUMPLE_PARCIAL', 'NO_CUMPLE', 'NO_APLICA');

-- CreateEnum
CREATE TYPE "TipoEventoAdverso" AS ENUM ('EVENTO_ADVERSO_PREVENIBLE', 'EVENTO_ADVERSO_NO_PREVENIBLE', 'INCIDENTE', 'CUASI_INCIDENTE', 'COMPLICACION');

-- CreateEnum
CREATE TYPE "SeveridadEvento" AS ENUM ('LEVE', 'MODERADO', 'GRAVE', 'CENTINELA');

-- CreateEnum
CREATE TYPE "DominioIndicador" AS ENUM ('EFECTIVIDAD', 'SEGURIDAD', 'EXPERIENCIA');

-- CreateEnum
CREATE TYPE "TipoPQRS" AS ENUM ('PETICION', 'QUEJA', 'RECLAMO', 'SUGERENCIA', 'DENUNCIA', 'FELICITACION');

-- CreateEnum
CREATE TYPE "CanalPQRS" AS ENUM ('PRESENCIAL', 'TELEFONICO', 'WEB', 'BUZON', 'EMAIL', 'REDES_SOCIALES');

-- CreateEnum
CREATE TYPE "TipoDocumentoCalidad" AS ENUM ('POLITICA', 'MANUAL', 'GUIA', 'PROTOCOLO', 'PROCEDIMIENTO', 'INSTRUCTIVO', 'FORMATO', 'PLAN', 'PROGRAMA');

-- CreateEnum
CREATE TYPE "EstadoDocumentoCalidad" AS ENUM ('BORRADOR', 'EN_REVISION', 'APROBADO', 'VIGENTE', 'OBSOLETO');

-- CreateEnum
CREATE TYPE "GrupoAcreditacion" AS ENUM ('ATENCION_CLIENTE', 'APOYO_ADMINISTRATIVO', 'DIRECCIONAMIENTO', 'GERENCIA', 'RECURSO_HUMANO', 'AMBIENTE_FISICO', 'INFORMACION', 'MEJORAMIENTO_CALIDAD');

-- AlterTable
ALTER TABLE "examenes_procedimientos" ADD COLUMN     "codigoCIE11" VARCHAR(50),
ADD COLUMN     "codigoCUPS" VARCHAR(20);

-- CreateTable
CREATE TABLE "estandares_habilitacion" (
    "id" TEXT NOT NULL,
    "tipo" "TipoEstandarHabilitacion" NOT NULL,
    "codigo" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "normativa_ref" TEXT,
    "servicio_aplica" TEXT[],
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "estandares_habilitacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "criterios_habilitacion" (
    "id" TEXT NOT NULL,
    "estandar_id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "modo_verificacion" TEXT,
    "evidencia_requerida" TEXT,
    "peso" INTEGER NOT NULL DEFAULT 1,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "criterios_habilitacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "autoevaluaciones_habilitacion" (
    "id" TEXT NOT NULL,
    "estandar_id" TEXT NOT NULL,
    "servicio_id" TEXT,
    "fecha_evaluacion" TIMESTAMP(3) NOT NULL,
    "evaluador_id" UUID NOT NULL,
    "porcentaje_cumplimiento" DECIMAL(5,2) NOT NULL,
    "observaciones" TEXT,
    "estado" TEXT NOT NULL DEFAULT 'En Proceso',
    "fecha_cierre" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "autoevaluaciones_habilitacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "evaluaciones_criterio" (
    "id" TEXT NOT NULL,
    "autoevaluacion_id" TEXT NOT NULL,
    "criterio_id" TEXT NOT NULL,
    "cumplimiento" "EstadoCumplimiento" NOT NULL,
    "observacion" TEXT,
    "evidencia_url" TEXT,
    "fecha_evaluacion" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "evaluaciones_criterio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "visitas_verificacion" (
    "id" TEXT NOT NULL,
    "tipo_visita" TEXT NOT NULL,
    "entidad_visitadora" TEXT NOT NULL,
    "fecha_visita" TIMESTAMP(3) NOT NULL,
    "fecha_notificacion" TIMESTAMP(3),
    "acta_numero" TEXT,
    "acta_url" TEXT,
    "hallazgos" JSONB,
    "requiere_plan_mejora" BOOLEAN NOT NULL DEFAULT false,
    "fecha_limite_plan" TIMESTAMP(3),
    "estado" TEXT NOT NULL DEFAULT 'Programada',
    "observaciones" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "visitas_verificacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "equipo_pamec" (
    "id" TEXT NOT NULL,
    "usuario_id" UUID NOT NULL,
    "rol" TEXT NOT NULL,
    "acta_designacion" TEXT,
    "fecha_ingreso" TIMESTAMP(3) NOT NULL,
    "fecha_retiro" TIMESTAMP(3),
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "equipo_pamec_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "procesos_pamec" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "area_responsable" TEXT,
    "responsable_id" UUID,
    "calidad_observada" DECIMAL(5,2),
    "calidad_esperada" DECIMAL(5,2),
    "brecha" DECIMAL(5,2),
    "prioridad" INTEGER,
    "criterios_priorizacion" JSONB,
    "estado" TEXT NOT NULL DEFAULT 'Identificado',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "procesos_pamec_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "indicadores_pamec" (
    "id" TEXT NOT NULL,
    "proceso_id" TEXT,
    "codigo" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "objetivo" TEXT,
    "formula_calculo" TEXT NOT NULL,
    "fuente_datos" TEXT,
    "frecuencia_medicion" TEXT NOT NULL,
    "meta_institucional" DECIMAL(10,2),
    "unidad_medida" TEXT,
    "tendencia_esperada" TEXT,
    "responsable_medicion" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "indicadores_pamec_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mediciones_indicador" (
    "id" TEXT NOT NULL,
    "indicador_id" TEXT NOT NULL,
    "periodo" TEXT NOT NULL,
    "numerador" DECIMAL(15,2),
    "denominador" DECIMAL(15,2),
    "resultado" DECIMAL(10,4) NOT NULL,
    "meta" DECIMAL(10,2),
    "cumple_meta" BOOLEAN,
    "analisis" TEXT,
    "acciones_tomadas" TEXT,
    "registrado_por" UUID NOT NULL,
    "fecha_registro" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mediciones_indicador_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auditorias_pamec" (
    "id" TEXT NOT NULL,
    "proceso_id" TEXT,
    "tipo_auditoria" TEXT NOT NULL,
    "objetivo" TEXT,
    "alcance" TEXT,
    "auditor_id" TEXT NOT NULL,
    "fecha_programada" TIMESTAMP(3) NOT NULL,
    "fecha_ejecucion" TIMESTAMP(3),
    "estado" TEXT NOT NULL DEFAULT 'Programada',
    "informe_url" TEXT,
    "conclusiones" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "auditorias_pamec_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hallazgos_auditoria" (
    "id" TEXT NOT NULL,
    "auditoria_id" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "criterio_auditoria" TEXT,
    "evidencia" TEXT,
    "analisis_causa" JSONB,
    "requiere_accion" BOOLEAN NOT NULL DEFAULT true,
    "fecha_limite_accion" TIMESTAMP(3),
    "estado" TEXT NOT NULL DEFAULT 'Abierto',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hallazgos_auditoria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "eventos_adversos" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL DEFAULT 'EA-' || to_char(now(), 'YYYYMMDD') || '-' || floor(random() * 10000)::text,
    "paciente_id" TEXT,
    "cita_id" TEXT,
    "admision_id" TEXT,
    "tipo_evento" "TipoEventoAdverso" NOT NULL,
    "severidad" "SeveridadEvento" NOT NULL,
    "fecha_evento" TIMESTAMP(3) NOT NULL,
    "hora_evento" TEXT,
    "servicio_ocurrencia" TEXT NOT NULL,
    "lugar_especifico" TEXT,
    "descripcion_evento" TEXT NOT NULL,
    "consecuencias" TEXT,
    "acciones_inmediatas" TEXT,
    "reportado_por" UUID NOT NULL,
    "fecha_reporte" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "es_anonimo" BOOLEAN NOT NULL DEFAULT false,
    "estado" TEXT NOT NULL DEFAULT 'Reportado',
    "requiere_analisis" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "eventos_adversos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "analisis_causa_raiz" (
    "id" TEXT NOT NULL,
    "evento_id" TEXT NOT NULL,
    "metodo_analisis" TEXT NOT NULL,
    "fecha_analisis" TIMESTAMP(3) NOT NULL,
    "analista_id" UUID NOT NULL,
    "fallas_activas" JSONB,
    "condiciones_latentes" JSONB,
    "barreras_defensas" JSONB,
    "causa_metodo" TEXT,
    "causa_maquina" TEXT,
    "causa_material" TEXT,
    "causa_mano_obra" TEXT,
    "causa_medio_ambiente" TEXT,
    "causa_medicion" TEXT,
    "porque1" TEXT,
    "porque2" TEXT,
    "porque3" TEXT,
    "porque4" TEXT,
    "porque5" TEXT,
    "causa_raiz_final" TEXT,
    "conclusiones" TEXT,
    "recomendaciones" TEXT,
    "lecciones_aprendidas" TEXT,
    "estado" TEXT NOT NULL DEFAULT 'En Análisis',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "analisis_causa_raiz_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "factores_contributivos" (
    "id" TEXT NOT NULL,
    "evento_id" TEXT NOT NULL,
    "categoria" TEXT NOT NULL,
    "subcategoria" TEXT,
    "descripcion" TEXT NOT NULL,
    "nivel_contribucion" TEXT,

    CONSTRAINT "factores_contributivos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rondas_seguridad" (
    "id" TEXT NOT NULL,
    "servicio_id" TEXT,
    "unidad_id" TEXT,
    "fecha_programada" TIMESTAMP(3) NOT NULL,
    "fecha_ejecucion" TIMESTAMP(3),
    "ejecutor_id" UUID,
    "checklist_usado" TEXT,
    "hallazgos" JSONB,
    "fotos_evidencia" TEXT[],
    "observaciones" TEXT,
    "estado" TEXT NOT NULL DEFAULT 'Programada',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rondas_seguridad_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "practicas_seguras" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "categoria" TEXT NOT NULL,
    "checklist_items" JSONB,
    "frecuencia_monitoreo" TEXT,
    "responsable" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "practicas_seguras_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "adherencia_practicas_seguras" (
    "id" TEXT NOT NULL,
    "practica_id" TEXT NOT NULL,
    "periodo" TEXT NOT NULL,
    "total_evaluados" INTEGER NOT NULL,
    "total_cumplen" INTEGER NOT NULL,
    "porcentaje_adherencia" DECIMAL(5,2) NOT NULL,
    "observaciones" TEXT,
    "evaluador_id" UUID NOT NULL,
    "fecha_evaluacion" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "adherencia_practicas_seguras_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "indicadores_sic" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "dominio" "DominioIndicador" NOT NULL,
    "definicion_operacional" TEXT NOT NULL,
    "formula_numerador" TEXT NOT NULL,
    "formula_denominador" TEXT NOT NULL,
    "unidad_medida" TEXT NOT NULL,
    "meta_nacional" DECIMAL(10,2),
    "meta_institucional" DECIMAL(10,2),
    "fuente_datos" TEXT NOT NULL,
    "periodicidad_reporte" TEXT NOT NULL,
    "servicios_aplica" TEXT[],
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "indicadores_sic_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mediciones_sic" (
    "id" TEXT NOT NULL,
    "indicador_id" TEXT NOT NULL,
    "periodo" TEXT NOT NULL,
    "numerador" DECIMAL(15,2) NOT NULL,
    "denominador" DECIMAL(15,2) NOT NULL,
    "resultado" DECIMAL(10,4) NOT NULL,
    "meta_vigente" DECIMAL(10,2),
    "cumple_meta" BOOLEAN,
    "semaforo_estado" TEXT,
    "analisis" TEXT,
    "fuente_verificacion" TEXT,
    "reportado_sispro" BOOLEAN NOT NULL DEFAULT false,
    "fecha_reporte_sispro" TIMESTAMP(3),
    "registrado_por" UUID NOT NULL,
    "fecha_registro" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mediciones_sic_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pqrs" (
    "id" TEXT NOT NULL,
    "radicado" TEXT NOT NULL DEFAULT 'PQRS-' || to_char(now(), 'YYYYMMDD') || '-' || floor(random() * 10000)::text,
    "tipo" "TipoPQRS" NOT NULL,
    "canal" "CanalPQRS" NOT NULL,
    "fecha_recepcion" TIMESTAMP(3) NOT NULL,
    "nombre_peticionario" TEXT NOT NULL,
    "documento_peticionario" TEXT,
    "email_peticionario" TEXT,
    "telefono_peticionario" TEXT,
    "direccion_peticionario" TEXT,
    "es_anonimo" BOOLEAN NOT NULL DEFAULT false,
    "paciente_id" TEXT,
    "asunto" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "servicio_relacionado" TEXT,
    "funcionario_relacionado" TEXT,
    "area_asignada" TEXT,
    "responsable_id" UUID,
    "prioridad" TEXT NOT NULL DEFAULT 'Normal',
    "dias_habiles_limite" INTEGER NOT NULL DEFAULT 15,
    "fecha_limite_respuesta" TIMESTAMP(3) NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'Radicada',
    "respuesta" TEXT,
    "fecha_respuesta" TIMESTAMP(3),
    "respondido_por" UUID,
    "archivo_respuesta" TEXT,
    "encuesta_enviada" BOOLEAN NOT NULL DEFAULT false,
    "calificacion_respuesta" INTEGER,
    "comentario_satisfaccion" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pqrs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "seguimientos_pqrs" (
    "id" TEXT NOT NULL,
    "pqrs_id" TEXT NOT NULL,
    "accion" TEXT NOT NULL,
    "observaciones" TEXT,
    "usuario_id" UUID NOT NULL,
    "fecha_accion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "seguimientos_pqrs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comites_institucionales" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "normativa_base" TEXT,
    "objetivo" TEXT,
    "periodicidad" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "comites_institucionales_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "integrantes_comite" (
    "id" TEXT NOT NULL,
    "comite_id" TEXT NOT NULL,
    "usuario_id" UUID NOT NULL,
    "rol" TEXT NOT NULL,
    "acta_designacion" TEXT,
    "fecha_ingreso" TIMESTAMP(3) NOT NULL,
    "fecha_retiro" TIMESTAMP(3),
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "integrantes_comite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reuniones_comite" (
    "id" TEXT NOT NULL,
    "comite_id" TEXT NOT NULL,
    "numero_acta" TEXT NOT NULL,
    "fecha_programada" TIMESTAMP(3) NOT NULL,
    "fecha_realizacion" TIMESTAMP(3),
    "lugar" TEXT,
    "orden_del_dia" JSONB,
    "asistentes" JSONB,
    "invitados" JSONB,
    "temas_discutidos" JSONB,
    "decisiones" JSONB,
    "compromisos" JSONB,
    "acta_url" TEXT,
    "estado" TEXT NOT NULL DEFAULT 'Programada',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reuniones_comite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "compromisos_comite" (
    "id" TEXT NOT NULL,
    "reunion_id" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "responsable_id" UUID NOT NULL,
    "fecha_limite" TIMESTAMP(3) NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'Pendiente',
    "observacion_cierre" TEXT,
    "fecha_cierre" TIMESTAMP(3),

    CONSTRAINT "compromisos_comite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notificaciones_sivigila" (
    "id" TEXT NOT NULL,
    "paciente_id" TEXT NOT NULL,
    "codigo_evento" TEXT NOT NULL,
    "nombre_evento" TEXT NOT NULL,
    "tipo_notificacion" TEXT NOT NULL,
    "semana_epidemiologica" INTEGER NOT NULL,
    "anio_epidemiologico" INTEGER NOT NULL,
    "fecha_notificacion" TIMESTAMP(3) NOT NULL,
    "fecha_inicio_sintomas" TIMESTAMP(3),
    "clasificacion_inicial" TEXT,
    "clasificacion_final" TEXT,
    "hospitalizacion" BOOLEAN NOT NULL DEFAULT false,
    "condicion_final" TEXT,
    "ficha_url" TEXT,
    "enviado_ins" BOOLEAN NOT NULL DEFAULT false,
    "fecha_envio_ins" TIMESTAMP(3),
    "observaciones" TEXT,
    "notificado_por" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notificaciones_sivigila_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reportes_farmacovigilancia" (
    "id" TEXT NOT NULL,
    "paciente_id" TEXT,
    "producto_id" TEXT,
    "tipo_reporte" TEXT NOT NULL,
    "fecha_evento" TIMESTAMP(3) NOT NULL,
    "descripcion_reaccion" TEXT NOT NULL,
    "gravedad_reaccion" TEXT NOT NULL,
    "causalidad" TEXT,
    "desenlace" TEXT,
    "accion_tomada" TEXT,
    "reportado_invima" BOOLEAN NOT NULL DEFAULT false,
    "fecha_reporte_invima" TIMESTAMP(3),
    "reportado_por" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reportes_farmacovigilancia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reportes_tecnovigilancia" (
    "id" TEXT NOT NULL,
    "paciente_id" TEXT,
    "nombre_dispositivo" TEXT NOT NULL,
    "fabricante" TEXT,
    "registro_sanitario" TEXT,
    "lote" TEXT,
    "fecha_evento" TIMESTAMP(3) NOT NULL,
    "descripcion_incidente" TEXT NOT NULL,
    "consecuencias" TEXT,
    "gravedad_incidente" TEXT NOT NULL,
    "accion_tomada" TEXT,
    "reportado_invima" BOOLEAN NOT NULL DEFAULT false,
    "fecha_reporte_invima" TIMESTAMP(3),
    "reportado_por" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reportes_tecnovigilancia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "documentos_calidad" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "tipo" "TipoDocumentoCalidad" NOT NULL,
    "version" TEXT NOT NULL,
    "fecha_elaboracion" TIMESTAMP(3) NOT NULL,
    "fecha_revision" TIMESTAMP(3),
    "fecha_aprobacion" TIMESTAMP(3),
    "fecha_vigencia" TIMESTAMP(3),
    "fecha_proxima_revision" TIMESTAMP(3),
    "elaborado_por" UUID NOT NULL,
    "revisado_por" UUID,
    "aprobado_por" UUID,
    "proceso_relacionado" TEXT,
    "resumen" TEXT,
    "archivo_url" TEXT NOT NULL,
    "estado" "EstadoDocumentoCalidad" NOT NULL DEFAULT 'BORRADOR',
    "palabras_clave" TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "documentos_calidad_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "historial_versiones_documento" (
    "id" TEXT NOT NULL,
    "documento_id" TEXT NOT NULL,
    "version_anterior" TEXT NOT NULL,
    "version_nueva" TEXT NOT NULL,
    "cambios_realizados" TEXT NOT NULL,
    "archivo_anterior_url" TEXT,
    "fecha_cambio" TIMESTAMP(3) NOT NULL,
    "modificado_por" UUID NOT NULL,

    CONSTRAINT "historial_versiones_documento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "socializaciones_documento" (
    "id" TEXT NOT NULL,
    "documento_id" TEXT NOT NULL,
    "fecha_socializacion" TIMESTAMP(3) NOT NULL,
    "metodologia" TEXT NOT NULL,
    "participantes" JSONB,
    "evidencia_url" TEXT,
    "observaciones" TEXT,
    "realizado_por" UUID NOT NULL,

    CONSTRAINT "socializaciones_documento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "planes_accion_calidad" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL DEFAULT 'PA-' || to_char(now(), 'YYYYMMDD') || '-' || floor(random() * 10000)::text,
    "origen" TEXT NOT NULL,
    "autoevaluacion_id" TEXT,
    "visita_id" TEXT,
    "proceso_id" TEXT,
    "hallazgo_id" TEXT,
    "evento_id" TEXT,
    "ronda_id" TEXT,
    "descripcion_problema" TEXT NOT NULL,
    "causa_raiz" TEXT,
    "accion_propuesta" TEXT NOT NULL,
    "tipo_accion" TEXT NOT NULL,
    "responsable_id" UUID NOT NULL,
    "fecha_inicio" TIMESTAMP(3) NOT NULL,
    "fecha_limite" TIMESTAMP(3) NOT NULL,
    "recursos" TEXT,
    "indicador_seguimiento" TEXT,
    "meta_esperada" TEXT,
    "avance_porcentaje" INTEGER NOT NULL DEFAULT 0,
    "estado" TEXT NOT NULL DEFAULT 'Abierto',
    "fecha_cierre" TIMESTAMP(3),
    "resultado_obtenido" TEXT,
    "eficacia_verificada" BOOLEAN,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "planes_accion_calidad_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "seguimientos_plan_accion" (
    "id" TEXT NOT NULL,
    "plan_id" TEXT NOT NULL,
    "fecha_seguimiento" TIMESTAMP(3) NOT NULL,
    "avance_reportado" INTEGER NOT NULL,
    "descripcion_avance" TEXT NOT NULL,
    "dificultades" TEXT,
    "requiere_ajuste" BOOLEAN NOT NULL DEFAULT false,
    "registrado_por" UUID NOT NULL,

    CONSTRAINT "seguimientos_plan_accion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "evidencias_calidad" (
    "id" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "archivo_url" TEXT NOT NULL,
    "fecha_cargue" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cargado_por" UUID NOT NULL,
    "autoevaluacion_id" TEXT,
    "plan_accion_id" TEXT,

    CONSTRAINT "evidencias_calidad_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "estandares_acreditacion" (
    "id" TEXT NOT NULL,
    "grupo" "GrupoAcreditacion" NOT NULL,
    "codigo" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "criterios" JSONB,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "estandares_acreditacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "evaluaciones_acreditacion" (
    "id" TEXT NOT NULL,
    "estandar_id" TEXT NOT NULL,
    "fecha_evaluacion" TIMESTAMP(3) NOT NULL,
    "calificacion" INTEGER NOT NULL,
    "fortalezas" TEXT,
    "oportunidades_mejora" TEXT,
    "evidencias_url" TEXT[],
    "evaluador_id" UUID NOT NULL,

    CONSTRAINT "evaluaciones_acreditacion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "estandares_habilitacion_codigo_key" ON "estandares_habilitacion"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "indicadores_pamec_codigo_key" ON "indicadores_pamec"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "eventos_adversos_codigo_key" ON "eventos_adversos"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "analisis_causa_raiz_evento_id_key" ON "analisis_causa_raiz"("evento_id");

-- CreateIndex
CREATE UNIQUE INDEX "practicas_seguras_codigo_key" ON "practicas_seguras"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "indicadores_sic_codigo_key" ON "indicadores_sic"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "pqrs_radicado_key" ON "pqrs"("radicado");

-- CreateIndex
CREATE UNIQUE INDEX "comites_institucionales_codigo_key" ON "comites_institucionales"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "documentos_calidad_codigo_key" ON "documentos_calidad"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "planes_accion_calidad_codigo_key" ON "planes_accion_calidad"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "estandares_acreditacion_codigo_key" ON "estandares_acreditacion"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "examenes_procedimientos_codigoCUPS_key" ON "examenes_procedimientos"("codigoCUPS");

-- AddForeignKey
ALTER TABLE "admisiones" ADD CONSTRAINT "admisiones_responsable_ingreso_fkey" FOREIGN KEY ("responsable_ingreso") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admisiones" ADD CONSTRAINT "admisiones_responsable_egreso_fkey" FOREIGN KEY ("responsable_egreso") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "criterios_habilitacion" ADD CONSTRAINT "criterios_habilitacion_estandar_id_fkey" FOREIGN KEY ("estandar_id") REFERENCES "estandares_habilitacion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "autoevaluaciones_habilitacion" ADD CONSTRAINT "autoevaluaciones_habilitacion_estandar_id_fkey" FOREIGN KEY ("estandar_id") REFERENCES "estandares_habilitacion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "autoevaluaciones_habilitacion" ADD CONSTRAINT "autoevaluaciones_habilitacion_evaluador_id_fkey" FOREIGN KEY ("evaluador_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evaluaciones_criterio" ADD CONSTRAINT "evaluaciones_criterio_autoevaluacion_id_fkey" FOREIGN KEY ("autoevaluacion_id") REFERENCES "autoevaluaciones_habilitacion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evaluaciones_criterio" ADD CONSTRAINT "evaluaciones_criterio_criterio_id_fkey" FOREIGN KEY ("criterio_id") REFERENCES "criterios_habilitacion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "equipo_pamec" ADD CONSTRAINT "equipo_pamec_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "procesos_pamec" ADD CONSTRAINT "procesos_pamec_responsable_id_fkey" FOREIGN KEY ("responsable_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "indicadores_pamec" ADD CONSTRAINT "indicadores_pamec_proceso_id_fkey" FOREIGN KEY ("proceso_id") REFERENCES "procesos_pamec"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mediciones_indicador" ADD CONSTRAINT "mediciones_indicador_indicador_id_fkey" FOREIGN KEY ("indicador_id") REFERENCES "indicadores_pamec"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mediciones_indicador" ADD CONSTRAINT "mediciones_indicador_registrado_por_fkey" FOREIGN KEY ("registrado_por") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auditorias_pamec" ADD CONSTRAINT "auditorias_pamec_proceso_id_fkey" FOREIGN KEY ("proceso_id") REFERENCES "procesos_pamec"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auditorias_pamec" ADD CONSTRAINT "auditorias_pamec_auditor_id_fkey" FOREIGN KEY ("auditor_id") REFERENCES "equipo_pamec"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hallazgos_auditoria" ADD CONSTRAINT "hallazgos_auditoria_auditoria_id_fkey" FOREIGN KEY ("auditoria_id") REFERENCES "auditorias_pamec"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "eventos_adversos" ADD CONSTRAINT "eventos_adversos_paciente_id_fkey" FOREIGN KEY ("paciente_id") REFERENCES "pacientes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "eventos_adversos" ADD CONSTRAINT "eventos_adversos_cita_id_fkey" FOREIGN KEY ("cita_id") REFERENCES "citas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "eventos_adversos" ADD CONSTRAINT "eventos_adversos_admision_id_fkey" FOREIGN KEY ("admision_id") REFERENCES "admisiones"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "eventos_adversos" ADD CONSTRAINT "eventos_adversos_reportado_por_fkey" FOREIGN KEY ("reportado_por") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "analisis_causa_raiz" ADD CONSTRAINT "analisis_causa_raiz_evento_id_fkey" FOREIGN KEY ("evento_id") REFERENCES "eventos_adversos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "analisis_causa_raiz" ADD CONSTRAINT "analisis_causa_raiz_analista_id_fkey" FOREIGN KEY ("analista_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "factores_contributivos" ADD CONSTRAINT "factores_contributivos_evento_id_fkey" FOREIGN KEY ("evento_id") REFERENCES "eventos_adversos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rondas_seguridad" ADD CONSTRAINT "rondas_seguridad_ejecutor_id_fkey" FOREIGN KEY ("ejecutor_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "adherencia_practicas_seguras" ADD CONSTRAINT "adherencia_practicas_seguras_practica_id_fkey" FOREIGN KEY ("practica_id") REFERENCES "practicas_seguras"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "adherencia_practicas_seguras" ADD CONSTRAINT "adherencia_practicas_seguras_evaluador_id_fkey" FOREIGN KEY ("evaluador_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mediciones_sic" ADD CONSTRAINT "mediciones_sic_indicador_id_fkey" FOREIGN KEY ("indicador_id") REFERENCES "indicadores_sic"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mediciones_sic" ADD CONSTRAINT "mediciones_sic_registrado_por_fkey" FOREIGN KEY ("registrado_por") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pqrs" ADD CONSTRAINT "pqrs_paciente_id_fkey" FOREIGN KEY ("paciente_id") REFERENCES "pacientes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pqrs" ADD CONSTRAINT "pqrs_responsable_id_fkey" FOREIGN KEY ("responsable_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pqrs" ADD CONSTRAINT "pqrs_respondido_por_fkey" FOREIGN KEY ("respondido_por") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seguimientos_pqrs" ADD CONSTRAINT "seguimientos_pqrs_pqrs_id_fkey" FOREIGN KEY ("pqrs_id") REFERENCES "pqrs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seguimientos_pqrs" ADD CONSTRAINT "seguimientos_pqrs_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "integrantes_comite" ADD CONSTRAINT "integrantes_comite_comite_id_fkey" FOREIGN KEY ("comite_id") REFERENCES "comites_institucionales"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "integrantes_comite" ADD CONSTRAINT "integrantes_comite_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reuniones_comite" ADD CONSTRAINT "reuniones_comite_comite_id_fkey" FOREIGN KEY ("comite_id") REFERENCES "comites_institucionales"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "compromisos_comite" ADD CONSTRAINT "compromisos_comite_reunion_id_fkey" FOREIGN KEY ("reunion_id") REFERENCES "reuniones_comite"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "compromisos_comite" ADD CONSTRAINT "compromisos_comite_responsable_id_fkey" FOREIGN KEY ("responsable_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notificaciones_sivigila" ADD CONSTRAINT "notificaciones_sivigila_paciente_id_fkey" FOREIGN KEY ("paciente_id") REFERENCES "pacientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notificaciones_sivigila" ADD CONSTRAINT "notificaciones_sivigila_notificado_por_fkey" FOREIGN KEY ("notificado_por") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reportes_farmacovigilancia" ADD CONSTRAINT "reportes_farmacovigilancia_paciente_id_fkey" FOREIGN KEY ("paciente_id") REFERENCES "pacientes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reportes_farmacovigilancia" ADD CONSTRAINT "reportes_farmacovigilancia_producto_id_fkey" FOREIGN KEY ("producto_id") REFERENCES "productos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reportes_farmacovigilancia" ADD CONSTRAINT "reportes_farmacovigilancia_reportado_por_fkey" FOREIGN KEY ("reportado_por") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reportes_tecnovigilancia" ADD CONSTRAINT "reportes_tecnovigilancia_paciente_id_fkey" FOREIGN KEY ("paciente_id") REFERENCES "pacientes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reportes_tecnovigilancia" ADD CONSTRAINT "reportes_tecnovigilancia_reportado_por_fkey" FOREIGN KEY ("reportado_por") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documentos_calidad" ADD CONSTRAINT "documentos_calidad_elaborado_por_fkey" FOREIGN KEY ("elaborado_por") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documentos_calidad" ADD CONSTRAINT "documentos_calidad_revisado_por_fkey" FOREIGN KEY ("revisado_por") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documentos_calidad" ADD CONSTRAINT "documentos_calidad_aprobado_por_fkey" FOREIGN KEY ("aprobado_por") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "historial_versiones_documento" ADD CONSTRAINT "historial_versiones_documento_documento_id_fkey" FOREIGN KEY ("documento_id") REFERENCES "documentos_calidad"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "historial_versiones_documento" ADD CONSTRAINT "historial_versiones_documento_modificado_por_fkey" FOREIGN KEY ("modificado_por") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "socializaciones_documento" ADD CONSTRAINT "socializaciones_documento_documento_id_fkey" FOREIGN KEY ("documento_id") REFERENCES "documentos_calidad"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "socializaciones_documento" ADD CONSTRAINT "socializaciones_documento_realizado_por_fkey" FOREIGN KEY ("realizado_por") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "planes_accion_calidad" ADD CONSTRAINT "planes_accion_calidad_autoevaluacion_id_fkey" FOREIGN KEY ("autoevaluacion_id") REFERENCES "autoevaluaciones_habilitacion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "planes_accion_calidad" ADD CONSTRAINT "planes_accion_calidad_visita_id_fkey" FOREIGN KEY ("visita_id") REFERENCES "visitas_verificacion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "planes_accion_calidad" ADD CONSTRAINT "planes_accion_calidad_proceso_id_fkey" FOREIGN KEY ("proceso_id") REFERENCES "procesos_pamec"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "planes_accion_calidad" ADD CONSTRAINT "planes_accion_calidad_hallazgo_id_fkey" FOREIGN KEY ("hallazgo_id") REFERENCES "hallazgos_auditoria"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "planes_accion_calidad" ADD CONSTRAINT "planes_accion_calidad_evento_id_fkey" FOREIGN KEY ("evento_id") REFERENCES "eventos_adversos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "planes_accion_calidad" ADD CONSTRAINT "planes_accion_calidad_ronda_id_fkey" FOREIGN KEY ("ronda_id") REFERENCES "rondas_seguridad"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "planes_accion_calidad" ADD CONSTRAINT "planes_accion_calidad_responsable_id_fkey" FOREIGN KEY ("responsable_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seguimientos_plan_accion" ADD CONSTRAINT "seguimientos_plan_accion_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "planes_accion_calidad"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seguimientos_plan_accion" ADD CONSTRAINT "seguimientos_plan_accion_registrado_por_fkey" FOREIGN KEY ("registrado_por") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evidencias_calidad" ADD CONSTRAINT "evidencias_calidad_autoevaluacion_id_fkey" FOREIGN KEY ("autoevaluacion_id") REFERENCES "autoevaluaciones_habilitacion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evidencias_calidad" ADD CONSTRAINT "evidencias_calidad_plan_accion_id_fkey" FOREIGN KEY ("plan_accion_id") REFERENCES "planes_accion_calidad"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evidencias_calidad" ADD CONSTRAINT "evidencias_calidad_cargado_por_fkey" FOREIGN KEY ("cargado_por") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evaluaciones_acreditacion" ADD CONSTRAINT "evaluaciones_acreditacion_estandar_id_fkey" FOREIGN KEY ("estandar_id") REFERENCES "estandares_acreditacion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evaluaciones_acreditacion" ADD CONSTRAINT "evaluaciones_acreditacion_evaluador_id_fkey" FOREIGN KEY ("evaluador_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
