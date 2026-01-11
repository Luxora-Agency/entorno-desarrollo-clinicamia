/*
  Warnings:

  - The values [DENUNCIA] on the enum `TipoPQRS` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `codigoCIE11` on the `examenes_procedimientos` table. All the data in the column will be lost.
  - You are about to drop the column `codigoCUPS` on the `examenes_procedimientos` table. All the data in the column will be lost.
  - You are about to drop the column `archivo_respuesta` on the `pqrs` table. All the data in the column will be lost.
  - You are about to drop the column `calificacion_respuesta` on the `pqrs` table. All the data in the column will be lost.
  - You are about to drop the column `canal` on the `pqrs` table. All the data in the column will be lost.
  - You are about to drop the column `comentario_satisfaccion` on the `pqrs` table. All the data in the column will be lost.
  - You are about to drop the column `dias_habiles_limite` on the `pqrs` table. All the data in the column will be lost.
  - You are about to drop the column `direccion_peticionario` on the `pqrs` table. All the data in the column will be lost.
  - You are about to drop the column `documento_peticionario` on the `pqrs` table. All the data in the column will be lost.
  - You are about to drop the column `email_peticionario` on the `pqrs` table. All the data in the column will be lost.
  - You are about to drop the column `encuesta_enviada` on the `pqrs` table. All the data in the column will be lost.
  - You are about to drop the column `fecha_limite_respuesta` on the `pqrs` table. All the data in the column will be lost.
  - You are about to drop the column `fecha_recepcion` on the `pqrs` table. All the data in the column will be lost.
  - You are about to drop the column `fecha_respuesta` on the `pqrs` table. All the data in the column will be lost.
  - You are about to drop the column `funcionario_relacionado` on the `pqrs` table. All the data in the column will be lost.
  - You are about to drop the column `nombre_peticionario` on the `pqrs` table. All the data in the column will be lost.
  - You are about to drop the column `radicado` on the `pqrs` table. All the data in the column will be lost.
  - You are about to drop the column `respuesta` on the `pqrs` table. All the data in the column will be lost.
  - You are about to drop the column `servicio_relacionado` on the `pqrs` table. All the data in the column will be lost.
  - You are about to drop the column `telefono_peticionario` on the `pqrs` table. All the data in the column will be lost.
  - The `area_asignada` column on the `pqrs` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `prioridad` column on the `pqrs` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `estado` column on the `pqrs` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `fecha_accion` on the `seguimientos_pqrs` table. All the data in the column will be lost.
  - You are about to drop the `_PlanCoupons` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `adherencia_practicas_seguras` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `analisis_causa_raiz` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `auditorias_pamec` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `autoevaluaciones_habilitacion` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `catalogo_cups` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `comites_institucionales` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `compromisos_comite` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `criterios_habilitacion` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `documentos_calidad` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `equipo_pamec` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `estandares_acreditacion` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `estandares_habilitacion` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `evaluaciones_acreditacion` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `evaluaciones_criterio` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `eventos_adversos` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `evidencias_calidad` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `factores_contributivos` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `hallazgos_auditoria` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `historial_versiones_documento` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `indicadores_pamec` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `indicadores_sic` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `integrantes_comite` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `mediciones_indicador` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `mediciones_sic` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `mia_cupones` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `mia_planes` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `mia_suscripciones` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `notificaciones_sivigila` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `planes_accion_calidad` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `practicas_seguras` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `procesos_pamec` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `reportes_farmacovigilancia` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `reportes_tecnovigilancia` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `reuniones_comite` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `rondas_seguridad` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `seguimientos_plan_accion` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `socializaciones_documento` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `visitas_verificacion` table. If the table is not empty, all the data it contains will be lost.
  - Made the column `observaciones` on table `seguimientos_pqrs` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "EstadoPQRS" AS ENUM ('RADICADO', 'EN_TRAMITE', 'ESPERANDO_INFORMACION', 'RESUELTO', 'CERRADO');

-- CreateEnum
CREATE TYPE "PrioridadPQRS" AS ENUM ('BAJA', 'MEDIA', 'ALTA', 'URGENTE');

-- CreateEnum
CREATE TYPE "AreaHospital" AS ENUM ('ADMINISTRACION', 'CONSULTA_EXTERNA', 'URGENCIAS', 'HOSPITALIZACION', 'FARMACIA', 'LABORATORIO', 'IMAGENOLOGIA', 'ATENCION_USUARIO', 'SISTEMAS', 'MANTENIMIENTO', 'OTRO');

-- CreateEnum
CREATE TYPE "CategoriaTicket" AS ENUM ('HARDWARE', 'SOFTWARE', 'REDES', 'HCE', 'MANTENIMIENTO', 'OTRO');

-- CreateEnum
CREATE TYPE "EstadoTicket" AS ENUM ('ABIERTO', 'EN_PROGRESO', 'RESUELTO', 'CERRADO');

-- CreateEnum
CREATE TYPE "PrioridadTicket" AS ENUM ('BAJA', 'MEDIA', 'ALTA', 'CRITICA');

-- AlterEnum
BEGIN;
CREATE TYPE "TipoPQRS_new" AS ENUM ('PETICION', 'QUEJA', 'RECLAMO', 'SUGERENCIA', 'FELICITACION');
ALTER TABLE "pqrs" ALTER COLUMN "tipo" TYPE "TipoPQRS_new" USING ("tipo"::text::"TipoPQRS_new");
ALTER TYPE "TipoPQRS" RENAME TO "TipoPQRS_old";
ALTER TYPE "TipoPQRS_new" RENAME TO "TipoPQRS";
DROP TYPE "TipoPQRS_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "_PlanCoupons" DROP CONSTRAINT "_PlanCoupons_A_fkey";

-- DropForeignKey
ALTER TABLE "_PlanCoupons" DROP CONSTRAINT "_PlanCoupons_B_fkey";

-- DropForeignKey
ALTER TABLE "adherencia_practicas_seguras" DROP CONSTRAINT "adherencia_practicas_seguras_evaluador_id_fkey";

-- DropForeignKey
ALTER TABLE "adherencia_practicas_seguras" DROP CONSTRAINT "adherencia_practicas_seguras_practica_id_fkey";

-- DropForeignKey
ALTER TABLE "admisiones" DROP CONSTRAINT "admisiones_responsable_egreso_fkey";

-- DropForeignKey
ALTER TABLE "admisiones" DROP CONSTRAINT "admisiones_responsable_ingreso_fkey";

-- DropForeignKey
ALTER TABLE "analisis_causa_raiz" DROP CONSTRAINT "analisis_causa_raiz_analista_id_fkey";

-- DropForeignKey
ALTER TABLE "analisis_causa_raiz" DROP CONSTRAINT "analisis_causa_raiz_evento_id_fkey";

-- DropForeignKey
ALTER TABLE "auditorias_pamec" DROP CONSTRAINT "auditorias_pamec_auditor_id_fkey";

-- DropForeignKey
ALTER TABLE "auditorias_pamec" DROP CONSTRAINT "auditorias_pamec_proceso_id_fkey";

-- DropForeignKey
ALTER TABLE "autoevaluaciones_habilitacion" DROP CONSTRAINT "autoevaluaciones_habilitacion_estandar_id_fkey";

-- DropForeignKey
ALTER TABLE "autoevaluaciones_habilitacion" DROP CONSTRAINT "autoevaluaciones_habilitacion_evaluador_id_fkey";

-- DropForeignKey
ALTER TABLE "compromisos_comite" DROP CONSTRAINT "compromisos_comite_responsable_id_fkey";

-- DropForeignKey
ALTER TABLE "compromisos_comite" DROP CONSTRAINT "compromisos_comite_reunion_id_fkey";

-- DropForeignKey
ALTER TABLE "criterios_habilitacion" DROP CONSTRAINT "criterios_habilitacion_estandar_id_fkey";

-- DropForeignKey
ALTER TABLE "documentos_calidad" DROP CONSTRAINT "documentos_calidad_aprobado_por_fkey";

-- DropForeignKey
ALTER TABLE "documentos_calidad" DROP CONSTRAINT "documentos_calidad_elaborado_por_fkey";

-- DropForeignKey
ALTER TABLE "documentos_calidad" DROP CONSTRAINT "documentos_calidad_revisado_por_fkey";

-- DropForeignKey
ALTER TABLE "equipo_pamec" DROP CONSTRAINT "equipo_pamec_usuario_id_fkey";

-- DropForeignKey
ALTER TABLE "evaluaciones_acreditacion" DROP CONSTRAINT "evaluaciones_acreditacion_estandar_id_fkey";

-- DropForeignKey
ALTER TABLE "evaluaciones_acreditacion" DROP CONSTRAINT "evaluaciones_acreditacion_evaluador_id_fkey";

-- DropForeignKey
ALTER TABLE "evaluaciones_criterio" DROP CONSTRAINT "evaluaciones_criterio_autoevaluacion_id_fkey";

-- DropForeignKey
ALTER TABLE "evaluaciones_criterio" DROP CONSTRAINT "evaluaciones_criterio_criterio_id_fkey";

-- DropForeignKey
ALTER TABLE "eventos_adversos" DROP CONSTRAINT "eventos_adversos_admision_id_fkey";

-- DropForeignKey
ALTER TABLE "eventos_adversos" DROP CONSTRAINT "eventos_adversos_cita_id_fkey";

-- DropForeignKey
ALTER TABLE "eventos_adversos" DROP CONSTRAINT "eventos_adversos_paciente_id_fkey";

-- DropForeignKey
ALTER TABLE "eventos_adversos" DROP CONSTRAINT "eventos_adversos_reportado_por_fkey";

-- DropForeignKey
ALTER TABLE "evidencias_calidad" DROP CONSTRAINT "evidencias_calidad_autoevaluacion_id_fkey";

-- DropForeignKey
ALTER TABLE "evidencias_calidad" DROP CONSTRAINT "evidencias_calidad_cargado_por_fkey";

-- DropForeignKey
ALTER TABLE "evidencias_calidad" DROP CONSTRAINT "evidencias_calidad_plan_accion_id_fkey";

-- DropForeignKey
ALTER TABLE "factores_contributivos" DROP CONSTRAINT "factores_contributivos_evento_id_fkey";

-- DropForeignKey
ALTER TABLE "hallazgos_auditoria" DROP CONSTRAINT "hallazgos_auditoria_auditoria_id_fkey";

-- DropForeignKey
ALTER TABLE "historial_versiones_documento" DROP CONSTRAINT "historial_versiones_documento_documento_id_fkey";

-- DropForeignKey
ALTER TABLE "historial_versiones_documento" DROP CONSTRAINT "historial_versiones_documento_modificado_por_fkey";

-- DropForeignKey
ALTER TABLE "indicadores_pamec" DROP CONSTRAINT "indicadores_pamec_proceso_id_fkey";

-- DropForeignKey
ALTER TABLE "integrantes_comite" DROP CONSTRAINT "integrantes_comite_comite_id_fkey";

-- DropForeignKey
ALTER TABLE "integrantes_comite" DROP CONSTRAINT "integrantes_comite_usuario_id_fkey";

-- DropForeignKey
ALTER TABLE "mediciones_indicador" DROP CONSTRAINT "mediciones_indicador_indicador_id_fkey";

-- DropForeignKey
ALTER TABLE "mediciones_indicador" DROP CONSTRAINT "mediciones_indicador_registrado_por_fkey";

-- DropForeignKey
ALTER TABLE "mediciones_sic" DROP CONSTRAINT "mediciones_sic_indicador_id_fkey";

-- DropForeignKey
ALTER TABLE "mediciones_sic" DROP CONSTRAINT "mediciones_sic_registrado_por_fkey";

-- DropForeignKey
ALTER TABLE "mia_suscripciones" DROP CONSTRAINT "mia_suscripciones_paciente_id_fkey";

-- DropForeignKey
ALTER TABLE "mia_suscripciones" DROP CONSTRAINT "mia_suscripciones_plan_id_fkey";

-- DropForeignKey
ALTER TABLE "notificaciones_sivigila" DROP CONSTRAINT "notificaciones_sivigila_notificado_por_fkey";

-- DropForeignKey
ALTER TABLE "notificaciones_sivigila" DROP CONSTRAINT "notificaciones_sivigila_paciente_id_fkey";

-- DropForeignKey
ALTER TABLE "planes_accion_calidad" DROP CONSTRAINT "planes_accion_calidad_autoevaluacion_id_fkey";

-- DropForeignKey
ALTER TABLE "planes_accion_calidad" DROP CONSTRAINT "planes_accion_calidad_evento_id_fkey";

-- DropForeignKey
ALTER TABLE "planes_accion_calidad" DROP CONSTRAINT "planes_accion_calidad_hallazgo_id_fkey";

-- DropForeignKey
ALTER TABLE "planes_accion_calidad" DROP CONSTRAINT "planes_accion_calidad_proceso_id_fkey";

-- DropForeignKey
ALTER TABLE "planes_accion_calidad" DROP CONSTRAINT "planes_accion_calidad_responsable_id_fkey";

-- DropForeignKey
ALTER TABLE "planes_accion_calidad" DROP CONSTRAINT "planes_accion_calidad_ronda_id_fkey";

-- DropForeignKey
ALTER TABLE "planes_accion_calidad" DROP CONSTRAINT "planes_accion_calidad_visita_id_fkey";

-- DropForeignKey
ALTER TABLE "procesos_pamec" DROP CONSTRAINT "procesos_pamec_responsable_id_fkey";

-- DropForeignKey
ALTER TABLE "reportes_farmacovigilancia" DROP CONSTRAINT "reportes_farmacovigilancia_paciente_id_fkey";

-- DropForeignKey
ALTER TABLE "reportes_farmacovigilancia" DROP CONSTRAINT "reportes_farmacovigilancia_producto_id_fkey";

-- DropForeignKey
ALTER TABLE "reportes_farmacovigilancia" DROP CONSTRAINT "reportes_farmacovigilancia_reportado_por_fkey";

-- DropForeignKey
ALTER TABLE "reportes_tecnovigilancia" DROP CONSTRAINT "reportes_tecnovigilancia_paciente_id_fkey";

-- DropForeignKey
ALTER TABLE "reportes_tecnovigilancia" DROP CONSTRAINT "reportes_tecnovigilancia_reportado_por_fkey";

-- DropForeignKey
ALTER TABLE "reuniones_comite" DROP CONSTRAINT "reuniones_comite_comite_id_fkey";

-- DropForeignKey
ALTER TABLE "rondas_seguridad" DROP CONSTRAINT "rondas_seguridad_ejecutor_id_fkey";

-- DropForeignKey
ALTER TABLE "seguimientos_plan_accion" DROP CONSTRAINT "seguimientos_plan_accion_plan_id_fkey";

-- DropForeignKey
ALTER TABLE "seguimientos_plan_accion" DROP CONSTRAINT "seguimientos_plan_accion_registrado_por_fkey";

-- DropForeignKey
ALTER TABLE "seguimientos_pqrs" DROP CONSTRAINT "seguimientos_pqrs_pqrs_id_fkey";

-- DropForeignKey
ALTER TABLE "socializaciones_documento" DROP CONSTRAINT "socializaciones_documento_documento_id_fkey";

-- DropForeignKey
ALTER TABLE "socializaciones_documento" DROP CONSTRAINT "socializaciones_documento_realizado_por_fkey";

-- DropIndex
DROP INDEX "examenes_procedimientos_codigoCUPS_key";

-- DropIndex
DROP INDEX "pqrs_radicado_key";

-- AlterTable
ALTER TABLE "examenes_procedimientos" DROP COLUMN "codigoCIE11",
DROP COLUMN "codigoCUPS";

-- AlterTable
ALTER TABLE "movimientos" ADD COLUMN     "nota" TEXT;

-- AlterTable
ALTER TABLE "pqrs" DROP COLUMN "archivo_respuesta",
DROP COLUMN "calificacion_respuesta",
DROP COLUMN "canal",
DROP COLUMN "comentario_satisfaccion",
DROP COLUMN "dias_habiles_limite",
DROP COLUMN "direccion_peticionario",
DROP COLUMN "documento_peticionario",
DROP COLUMN "email_peticionario",
DROP COLUMN "encuesta_enviada",
DROP COLUMN "fecha_limite_respuesta",
DROP COLUMN "fecha_recepcion",
DROP COLUMN "fecha_respuesta",
DROP COLUMN "funcionario_relacionado",
DROP COLUMN "nombre_peticionario",
DROP COLUMN "radicado",
DROP COLUMN "respuesta",
DROP COLUMN "servicio_relacionado",
DROP COLUMN "telefono_peticionario",
ADD COLUMN     "admision_id" TEXT,
ADD COLUMN     "cita_id" TEXT,
ADD COLUMN     "datos_contacto" JSONB,
ADD COLUMN     "fecha_cierre" TIMESTAMP(3),
ADD COLUMN     "fecha_radicacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "fecha_vencimiento" TIMESTAMP(3),
ADD COLUMN     "respuesta_final" TEXT,
DROP COLUMN "area_asignada",
ADD COLUMN     "area_asignada" "AreaHospital" NOT NULL DEFAULT 'ATENCION_USUARIO',
DROP COLUMN "prioridad",
ADD COLUMN     "prioridad" "PrioridadPQRS" NOT NULL DEFAULT 'MEDIA',
DROP COLUMN "estado",
ADD COLUMN     "estado" "EstadoPQRS" NOT NULL DEFAULT 'RADICADO';

-- AlterTable
ALTER TABLE "procedimientos" ADD COLUMN     "anestesiologoId" UUID,
ADD COLUMN     "ayudantes" JSONB,
ADD COLUMN     "clasificacionASA" VARCHAR(10),
ADD COLUMN     "codigoCIE10" VARCHAR(20),
ADD COLUMN     "codigoCUPS" VARCHAR(20),
ADD COLUMN     "epicrisis" TEXT,
ADD COLUMN     "incapacidadDias" INTEGER,
ADD COLUMN     "nivelComplejidad" VARCHAR(20) DEFAULT 'Media',
ADD COLUMN     "prioridad" VARCHAR(20) DEFAULT 'Electivo',
ADD COLUMN     "quirofanoId" TEXT,
ADD COLUMN     "riesgosPotenciales" TEXT,
ADD COLUMN     "sangradoAproximado" INTEGER,
ADD COLUMN     "tiempoAyuno" INTEGER,
ADD COLUMN     "tipoAnestesia" VARCHAR(50),
ADD COLUMN     "tipoCirugia" VARCHAR(50);

-- AlterTable
ALTER TABLE "seguimientos_pqrs" DROP COLUMN "fecha_accion",
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "es_privado" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "nuevo_estado" "EstadoPQRS",
ALTER COLUMN "observaciones" SET NOT NULL;

-- DropTable
DROP TABLE "_PlanCoupons";

-- DropTable
DROP TABLE "adherencia_practicas_seguras";

-- DropTable
DROP TABLE "analisis_causa_raiz";

-- DropTable
DROP TABLE "auditorias_pamec";

-- DropTable
DROP TABLE "autoevaluaciones_habilitacion";

-- DropTable
DROP TABLE "catalogo_cups";

-- DropTable
DROP TABLE "comites_institucionales";

-- DropTable
DROP TABLE "compromisos_comite";

-- DropTable
DROP TABLE "criterios_habilitacion";

-- DropTable
DROP TABLE "documentos_calidad";

-- DropTable
DROP TABLE "equipo_pamec";

-- DropTable
DROP TABLE "estandares_acreditacion";

-- DropTable
DROP TABLE "estandares_habilitacion";

-- DropTable
DROP TABLE "evaluaciones_acreditacion";

-- DropTable
DROP TABLE "evaluaciones_criterio";

-- DropTable
DROP TABLE "eventos_adversos";

-- DropTable
DROP TABLE "evidencias_calidad";

-- DropTable
DROP TABLE "factores_contributivos";

-- DropTable
DROP TABLE "hallazgos_auditoria";

-- DropTable
DROP TABLE "historial_versiones_documento";

-- DropTable
DROP TABLE "indicadores_pamec";

-- DropTable
DROP TABLE "indicadores_sic";

-- DropTable
DROP TABLE "integrantes_comite";

-- DropTable
DROP TABLE "mediciones_indicador";

-- DropTable
DROP TABLE "mediciones_sic";

-- DropTable
DROP TABLE "mia_cupones";

-- DropTable
DROP TABLE "mia_planes";

-- DropTable
DROP TABLE "mia_suscripciones";

-- DropTable
DROP TABLE "notificaciones_sivigila";

-- DropTable
DROP TABLE "planes_accion_calidad";

-- DropTable
DROP TABLE "practicas_seguras";

-- DropTable
DROP TABLE "procesos_pamec";

-- DropTable
DROP TABLE "reportes_farmacovigilancia";

-- DropTable
DROP TABLE "reportes_tecnovigilancia";

-- DropTable
DROP TABLE "reuniones_comite";

-- DropTable
DROP TABLE "rondas_seguridad";

-- DropTable
DROP TABLE "seguimientos_plan_accion";

-- DropTable
DROP TABLE "socializaciones_documento";

-- DropTable
DROP TABLE "visitas_verificacion";

-- DropEnum
DROP TYPE "CanalPQRS";

-- DropEnum
DROP TYPE "DominioIndicador";

-- DropEnum
DROP TYPE "EstadoCumplimiento";

-- DropEnum
DROP TYPE "EstadoDocumentoCalidad";

-- DropEnum
DROP TYPE "GrupoAcreditacion";

-- DropEnum
DROP TYPE "SeveridadEvento";

-- DropEnum
DROP TYPE "TipoDocumentoCalidad";

-- DropEnum
DROP TYPE "TipoEstandarHabilitacion";

-- DropEnum
DROP TYPE "TipoEventoAdverso";

-- CreateTable
CREATE TABLE "quirofanos" (
    "id" TEXT NOT NULL,
    "nombre" VARCHAR(100) NOT NULL,
    "tipo" VARCHAR(50) NOT NULL,
    "ubicacion" VARCHAR(100),
    "estado" TEXT NOT NULL DEFAULT 'Activo',
    "capacidad" INTEGER NOT NULL DEFAULT 1,
    "equipamiento" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "quirofanos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categorias_publicaciones" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "descripcion" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "categorias_publicaciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "publicaciones" (
    "id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "contenido" TEXT NOT NULL,
    "extracto" TEXT,
    "imagen_portada" TEXT,
    "estado" TEXT NOT NULL DEFAULT 'Borrador',
    "fecha_publicacion" TIMESTAMP(3),
    "autor_id" UUID NOT NULL,
    "categoria_id" TEXT,
    "diagnosticos_relacionados" TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "publicaciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tickets_soporte" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL DEFAULT ((('TKT-'::text || to_char(now(), 'YYYYMMDD'::text)) || '-'::text) || (floor((random() * (10000)::double precision)))::text),
    "asunto" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "categoria" "CategoriaTicket" NOT NULL,
    "prioridad" "PrioridadTicket" NOT NULL DEFAULT 'MEDIA',
    "estado" "EstadoTicket" NOT NULL DEFAULT 'ABIERTO',
    "usuario_reporta_id" UUID NOT NULL,
    "usuario_asignado_id" UUID,
    "paciente_id" TEXT,
    "admision_id" TEXT,
    "cita_id" TEXT,
    "solucion" TEXT,
    "fecha_resolucion" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tickets_soporte_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "glucometrias" (
    "id" TEXT NOT NULL,
    "paciente_id" TEXT NOT NULL,
    "admision_id" TEXT,
    "valor" INTEGER NOT NULL,
    "momento" TEXT NOT NULL,
    "insulina_administrada" DECIMAL(5,2),
    "observaciones" TEXT,
    "registrado_por" UUID NOT NULL,
    "fecha_registro" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "glucometrias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "balance_liquidos" (
    "id" TEXT NOT NULL,
    "paciente_id" TEXT NOT NULL,
    "admision_id" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "via" TEXT NOT NULL,
    "cantidad" DECIMAL(10,2) NOT NULL,
    "fluido" TEXT,
    "observaciones" TEXT,
    "registrado_por" UUID NOT NULL,
    "fecha_registro" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "balance_liquidos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transfusiones" (
    "id" TEXT NOT NULL,
    "paciente_id" TEXT NOT NULL,
    "admision_id" TEXT NOT NULL,
    "hemocomponente" TEXT NOT NULL,
    "grupo_sanguineo" TEXT NOT NULL,
    "rh" TEXT NOT NULL,
    "volumen" DECIMAL(10,2) NOT NULL,
    "velocidad" TEXT,
    "lote_bolsa" TEXT NOT NULL,
    "reaccion_adversa" BOOLEAN NOT NULL DEFAULT false,
    "observaciones" TEXT,
    "signos_vitales_pre" JSONB,
    "signos_vitales_post" JSONB,
    "registrado_por" UUID NOT NULL,
    "verificado_por" UUID,
    "fecha_inicio" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_fin" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "transfusiones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plantillas_notas_enfermeria" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "tipo_nota" TEXT NOT NULL,
    "contenido" TEXT NOT NULL,
    "creado_por" UUID,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "plantillas_notas_enfermeria_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "quirofanos_nombre_key" ON "quirofanos"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "categorias_publicaciones_nombre_key" ON "categorias_publicaciones"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "categorias_publicaciones_slug_key" ON "categorias_publicaciones"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "publicaciones_slug_key" ON "publicaciones"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "tickets_soporte_codigo_key" ON "tickets_soporte"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "plantillas_notas_enfermeria_nombre_key" ON "plantillas_notas_enfermeria"("nombre");

-- AddForeignKey
ALTER TABLE "procedimientos" ADD CONSTRAINT "procedimientos_anestesiologoId_fkey" FOREIGN KEY ("anestesiologoId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "procedimientos" ADD CONSTRAINT "procedimientos_quirofanoId_fkey" FOREIGN KEY ("quirofanoId") REFERENCES "quirofanos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "publicaciones" ADD CONSTRAINT "publicaciones_autor_id_fkey" FOREIGN KEY ("autor_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "publicaciones" ADD CONSTRAINT "publicaciones_categoria_id_fkey" FOREIGN KEY ("categoria_id") REFERENCES "categorias_publicaciones"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pqrs" ADD CONSTRAINT "pqrs_admision_id_fkey" FOREIGN KEY ("admision_id") REFERENCES "admisiones"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pqrs" ADD CONSTRAINT "pqrs_cita_id_fkey" FOREIGN KEY ("cita_id") REFERENCES "citas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seguimientos_pqrs" ADD CONSTRAINT "seguimientos_pqrs_pqrs_id_fkey" FOREIGN KEY ("pqrs_id") REFERENCES "pqrs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tickets_soporte" ADD CONSTRAINT "tickets_soporte_admision_id_fkey" FOREIGN KEY ("admision_id") REFERENCES "admisiones"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tickets_soporte" ADD CONSTRAINT "tickets_soporte_cita_id_fkey" FOREIGN KEY ("cita_id") REFERENCES "citas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tickets_soporte" ADD CONSTRAINT "tickets_soporte_paciente_id_fkey" FOREIGN KEY ("paciente_id") REFERENCES "pacientes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tickets_soporte" ADD CONSTRAINT "tickets_soporte_usuario_asignado_id_fkey" FOREIGN KEY ("usuario_asignado_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tickets_soporte" ADD CONSTRAINT "tickets_soporte_usuario_reporta_id_fkey" FOREIGN KEY ("usuario_reporta_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "glucometrias" ADD CONSTRAINT "glucometrias_paciente_id_fkey" FOREIGN KEY ("paciente_id") REFERENCES "pacientes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "glucometrias" ADD CONSTRAINT "glucometrias_admision_id_fkey" FOREIGN KEY ("admision_id") REFERENCES "admisiones"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "glucometrias" ADD CONSTRAINT "glucometrias_registrado_por_fkey" FOREIGN KEY ("registrado_por") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "balance_liquidos" ADD CONSTRAINT "balance_liquidos_paciente_id_fkey" FOREIGN KEY ("paciente_id") REFERENCES "pacientes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "balance_liquidos" ADD CONSTRAINT "balance_liquidos_admision_id_fkey" FOREIGN KEY ("admision_id") REFERENCES "admisiones"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "balance_liquidos" ADD CONSTRAINT "balance_liquidos_registrado_por_fkey" FOREIGN KEY ("registrado_por") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transfusiones" ADD CONSTRAINT "transfusiones_paciente_id_fkey" FOREIGN KEY ("paciente_id") REFERENCES "pacientes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transfusiones" ADD CONSTRAINT "transfusiones_admision_id_fkey" FOREIGN KEY ("admision_id") REFERENCES "admisiones"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transfusiones" ADD CONSTRAINT "transfusiones_registrado_por_fkey" FOREIGN KEY ("registrado_por") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transfusiones" ADD CONSTRAINT "transfusiones_verificado_por_fkey" FOREIGN KEY ("verificado_por") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plantillas_notas_enfermeria" ADD CONSTRAINT "plantillas_notas_enfermeria_creado_por_fkey" FOREIGN KEY ("creado_por") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;
