-- CreateEnum
CREATE TYPE "Rol" AS ENUM ('SUPER_ADMIN', 'ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST', 'PATIENT', 'PHARMACIST', 'LAB_TECHNICIAN');

-- CreateEnum
CREATE TYPE "Genero" AS ENUM ('Masculino', 'Femenino', 'Otro');

-- CreateEnum
CREATE TYPE "EstadoCita" AS ENUM ('PorAgendar', 'Programada', 'Confirmada', 'EnEspera', 'Atendiendo', 'Completada', 'Cancelada', 'NoAsistio');

-- CreateEnum
CREATE TYPE "Estado" AS ENUM ('Activo', 'Inactivo');

-- CreateEnum
CREATE TYPE "EstadoCama" AS ENUM ('Disponible', 'Ocupada', 'Mantenimiento', 'Reservada');

-- CreateEnum
CREATE TYPE "EstadoAdmision" AS ENUM ('Activa', 'Egresada', 'Cancelada');

-- CreateEnum
CREATE TYPE "TipoMovimiento" AS ENUM ('Ingreso', 'Traslado', 'CambioCama', 'CambioUnidad', 'Egreso');

-- CreateEnum
CREATE TYPE "TipoEgreso" AS ENUM ('AltaMedica', 'Remision', 'Voluntario', 'Fallecimiento', 'Fuga');

-- CreateEnum
CREATE TYPE "EstadoPacienteEgreso" AS ENUM ('Mejorado', 'Estable', 'Complicado', 'Fallecido');

-- CreateEnum
CREATE TYPE "EstadoOrdenMedica" AS ENUM ('Pendiente', 'EnProceso', 'Completada', 'Cancelada');

-- CreateEnum
CREATE TYPE "PrioridadOrden" AS ENUM ('Normal', 'Urgente');

-- CreateEnum
CREATE TYPE "EstadoOrdenMedicamento" AS ENUM ('Pendiente', 'Preparada', 'Despachada', 'Cancelada');

-- CreateEnum
CREATE TYPE "EstadoFactura" AS ENUM ('Pendiente', 'Parcial', 'Pagada', 'Cancelada', 'Vencida');

-- CreateEnum
CREATE TYPE "TipoItemFactura" AS ENUM ('Consulta', 'OrdenMedica', 'OrdenMedicamento', 'Hospitalizacion', 'Otro');

-- CreateEnum
CREATE TYPE "MetodoPago" AS ENUM ('Efectivo', 'Tarjeta', 'Transferencia', 'EPS', 'Otro');

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

-- CreateEnum
CREATE TYPE "EstadoInterconsulta" AS ENUM ('Solicitada', 'EnProceso', 'Respondida', 'Cancelada');

-- CreateEnum
CREATE TYPE "PrioridadInterconsulta" AS ENUM ('Baja', 'Media', 'Alta', 'Urgente');

-- CreateEnum
CREATE TYPE "TipoProcedimiento" AS ENUM ('Diagnostico', 'Terapeutico', 'Quirurgico', 'Intervencionista', 'Rehabilitacion', 'Otro');

-- CreateEnum
CREATE TYPE "EstadoProcedimiento" AS ENUM ('Programado', 'EnProceso', 'Completado', 'Cancelado', 'Diferido');

-- CreateEnum
CREATE TYPE "ViaPrescripcion" AS ENUM ('Oral', 'Intravenosa', 'Intramuscular', 'Subcutanea', 'Topica', 'Inhalatoria', 'Rectal', 'Sublingual', 'Oftaelmica', 'Otica', 'Nasal', 'Otra');

-- CreateEnum
CREATE TYPE "FrecuenciaPrescripcion" AS ENUM ('Unica', 'Cada4Horas', 'Cada6Horas', 'Cada8Horas', 'Cada12Horas', 'Cada24Horas', 'PRN', 'Continua', 'Otra');

-- CreateEnum
CREATE TYPE "EstadoPrescripcion" AS ENUM ('Activa', 'Suspendida', 'Completada', 'Cancelada');

-- CreateEnum
CREATE TYPE "EstadoAdministracion" AS ENUM ('Programada', 'Administrada', 'Omitida', 'Rechazada');

-- CreateTable
CREATE TABLE "usuarios" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "email" VARCHAR(255) NOT NULL,
    "password" VARCHAR(255) NOT NULL,
    "nombre" VARCHAR(255) NOT NULL,
    "apellido" VARCHAR(255) NOT NULL,
    "rol" VARCHAR(50) NOT NULL,
    "telefono" VARCHAR(20),
    "cedula" VARCHAR(50),
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pacientes" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "apellido" TEXT NOT NULL,
    "tipo_documento" TEXT,
    "cedula" TEXT NOT NULL,
    "fecha_nacimiento" DATE,
    "genero" TEXT,
    "pais_nacimiento" TEXT,
    "departamento" TEXT,
    "municipio" TEXT,
    "barrio" TEXT,
    "direccion" TEXT,
    "telefono" TEXT,
    "email" TEXT,
    "contactos_emergencia" JSONB,
    "eps" TEXT,
    "regimen" TEXT,
    "tipo_afiliacion" TEXT,
    "nivel_sisben" TEXT,
    "numero_autorizacion" TEXT,
    "fecha_afiliacion" DATE,
    "tipo_sangre" TEXT,
    "peso" DOUBLE PRECISION,
    "altura" DOUBLE PRECISION,
    "alergias" TEXT,
    "enfermedades_cronicas" TEXT,
    "medicamentos_actuales" TEXT,
    "antecedentes_quirurgicos" TEXT,
    "contacto_emergencia_nombre" TEXT,
    "contacto_emergencia_telefono" TEXT,
    "estado" TEXT NOT NULL DEFAULT 'Activo',
    "ultima_consulta" DATE,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pacientes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "citas" (
    "id" TEXT NOT NULL,
    "paciente_id" TEXT NOT NULL,
    "doctor_id" UUID,
    "admision_id" TEXT,
    "especialidad_id" UUID,
    "examen_procedimiento_id" UUID,
    "tipo_cita" VARCHAR(50) DEFAULT 'Especialidad',
    "fecha" DATE,
    "hora" TIME,
    "duracion_minutos" INTEGER DEFAULT 30,
    "costo" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "motivo" TEXT NOT NULL,
    "estado" "EstadoCita" NOT NULL DEFAULT 'PorAgendar',
    "prioridad" VARCHAR(50) DEFAULT 'Media',
    "notas" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "citas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "departamentos" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "nombre" VARCHAR(255) NOT NULL,
    "descripcion" TEXT,
    "responsable_id" UUID,
    "estado" VARCHAR(20) NOT NULL DEFAULT 'Activo',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "departamentos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "especialidades" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "titulo" VARCHAR(255) NOT NULL,
    "codigo" VARCHAR(50),
    "departamento_id" UUID NOT NULL,
    "costo_cop" DECIMAL(10,2) NOT NULL,
    "duracion_minutos" INTEGER NOT NULL,
    "duracion_externa_min" INTEGER,
    "duracion_interna_min" INTEGER,
    "descripcion" TEXT,
    "estado" VARCHAR(20) NOT NULL DEFAULT 'Activo',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "especialidades_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "doctores" (
    "id" UUID NOT NULL,
    "usuario_id" UUID NOT NULL,
    "licencia_medica" TEXT NOT NULL,
    "universidad" TEXT,
    "anios_experiencia" INTEGER,
    "biografia" TEXT,
    "horarios" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "doctores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "doctores_especialidades" (
    "id" UUID NOT NULL,
    "doctor_id" UUID NOT NULL,
    "especialidad_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "doctores_especialidades_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categorias_examenes" (
    "id" UUID NOT NULL,
    "nombre" VARCHAR(255) NOT NULL,
    "descripcion" TEXT NOT NULL,
    "color_hex" VARCHAR(7) NOT NULL,
    "estado" VARCHAR(50) NOT NULL DEFAULT 'Activo',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "categorias_examenes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "examenes_procedimientos" (
    "id" UUID NOT NULL,
    "tipo" VARCHAR(50) NOT NULL,
    "nombre" VARCHAR(255) NOT NULL,
    "descripcion" TEXT,
    "categoria_id" UUID,
    "duracion_minutos" INTEGER NOT NULL,
    "costo_base" DECIMAL(10,2) NOT NULL,
    "preparacion_especial" TEXT,
    "requiere_ayuno" BOOLEAN NOT NULL DEFAULT false,
    "estado" VARCHAR(50) NOT NULL DEFAULT 'Activo',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "examenes_procedimientos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categorias_productos" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "color" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "categorias_productos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "etiquetas_productos" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "color" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "etiquetas_productos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "productos" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "categoria_id" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "laboratorio" TEXT,
    "descripcion" TEXT,
    "principio_activo" TEXT,
    "concentracion" TEXT,
    "via_administracion" TEXT,
    "presentacion" TEXT,
    "registro_sanitario" TEXT,
    "temperatura_almacenamiento" TEXT,
    "requiere_receta" BOOLEAN NOT NULL DEFAULT false,
    "cantidad_total" INTEGER NOT NULL,
    "cantidad_consumida" INTEGER NOT NULL DEFAULT 0,
    "cantidad_min_alerta" INTEGER NOT NULL,
    "lote" TEXT,
    "fecha_vencimiento" TIMESTAMP(3),
    "precio_venta" DOUBLE PRECISION NOT NULL,
    "precio_compra" DOUBLE PRECISION,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "imagen_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "productos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "productos_etiquetas" (
    "id" TEXT NOT NULL,
    "producto_id" TEXT NOT NULL,
    "etiqueta_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "productos_etiquetas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "documentos_paciente" (
    "id" TEXT NOT NULL,
    "paciente_id" TEXT NOT NULL,
    "nombre_archivo" TEXT NOT NULL,
    "nombre_original" TEXT NOT NULL,
    "tipo_archivo" TEXT NOT NULL,
    "tamano" INTEGER NOT NULL,
    "ruta_archivo" TEXT NOT NULL,
    "descripcion" TEXT,
    "categoria" TEXT,
    "uploaded_by" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "documentos_paciente_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "unidades" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "tipo" TEXT NOT NULL,
    "capacidad" INTEGER NOT NULL DEFAULT 0,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "unidades_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "habitaciones" (
    "id" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "unidad_id" TEXT NOT NULL,
    "piso" INTEGER,
    "capacidad_camas" INTEGER NOT NULL DEFAULT 1,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "habitaciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "camas" (
    "id" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "habitacion_id" TEXT NOT NULL,
    "estado" "EstadoCama" NOT NULL DEFAULT 'Disponible',
    "observaciones" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "camas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admisiones" (
    "id" TEXT NOT NULL,
    "paciente_id" TEXT NOT NULL,
    "unidad_id" TEXT NOT NULL,
    "cama_id" TEXT,
    "fecha_ingreso" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_egreso" TIMESTAMP(3),
    "motivo_ingreso" TEXT NOT NULL,
    "diagnostico_ingreso" TEXT NOT NULL,
    "diagnostico_egreso" TEXT,
    "estado" "EstadoAdmision" NOT NULL DEFAULT 'Activa',
    "observaciones" TEXT,
    "responsable_ingreso" UUID,
    "responsable_egreso" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "admisiones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "movimientos" (
    "id" TEXT NOT NULL,
    "admision_id" TEXT NOT NULL,
    "tipo" "TipoMovimiento" NOT NULL,
    "unidad_origen_id" TEXT,
    "unidad_destino_id" TEXT,
    "cama_origen_id" TEXT,
    "cama_destino_id" TEXT,
    "motivo" TEXT NOT NULL,
    "observaciones" TEXT,
    "responsable" UUID,
    "fecha_movimiento" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "movimientos_pkey" PRIMARY KEY ("id")
);

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

-- CreateTable
CREATE TABLE "paquetes_hospitalizacion" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "tipoUnidad" TEXT NOT NULL,
    "precio_dia" DECIMAL(10,2) NOT NULL,
    "incluye" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "paquetes_hospitalizacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ordenes_medicas" (
    "id" TEXT NOT NULL,
    "paciente_id" TEXT NOT NULL,
    "cita_id" TEXT,
    "admision_id" TEXT,
    "examen_procedimiento_id" UUID NOT NULL,
    "doctor_id" UUID NOT NULL,
    "estado" "EstadoOrdenMedica" NOT NULL DEFAULT 'Pendiente',
    "prioridad" "PrioridadOrden" NOT NULL DEFAULT 'Normal',
    "observaciones" TEXT,
    "resultados" TEXT,
    "archivo_resultado" TEXT,
    "precio_aplicado" DECIMAL(10,2) NOT NULL,
    "fecha_orden" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_ejecucion" TIMESTAMP(3),
    "ejecutado_por" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ordenes_medicas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ordenes_medicamentos" (
    "id" TEXT NOT NULL,
    "paciente_id" TEXT NOT NULL,
    "cita_id" TEXT,
    "admision_id" TEXT,
    "doctor_id" UUID NOT NULL,
    "estado" "EstadoOrdenMedicamento" NOT NULL DEFAULT 'Pendiente',
    "observaciones" TEXT,
    "receta_digital" TEXT,
    "archivo_receta" TEXT,
    "total" DECIMAL(10,2) NOT NULL,
    "fecha_orden" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_despacho" TIMESTAMP(3),
    "despachado_por" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ordenes_medicamentos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ordenes_medicamentos_items" (
    "id" TEXT NOT NULL,
    "orden_medicamento_id" TEXT NOT NULL,
    "producto_id" TEXT NOT NULL,
    "cantidad" INTEGER NOT NULL,
    "precio_unitario" DECIMAL(10,2) NOT NULL,
    "descuento" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "subtotal" DECIMAL(10,2) NOT NULL,
    "indicaciones" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ordenes_medicamentos_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "facturas" (
    "id" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "paciente_id" TEXT NOT NULL,
    "estado" "EstadoFactura" NOT NULL DEFAULT 'Pendiente',
    "subtotal" DECIMAL(10,2) NOT NULL,
    "descuentos" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "impuestos" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(10,2) NOT NULL,
    "saldo_pendiente" DECIMAL(10,2) NOT NULL,
    "observaciones" TEXT,
    "cubierto_por_eps" BOOLEAN NOT NULL DEFAULT false,
    "eps_autorizacion" TEXT,
    "monto_eps" DECIMAL(10,2),
    "monto_paciente" DECIMAL(10,2),
    "fecha_emision" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_vencimiento" TIMESTAMP(3),
    "creada_por" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "facturas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "facturas_items" (
    "id" TEXT NOT NULL,
    "factura_id" TEXT NOT NULL,
    "tipo" "TipoItemFactura" NOT NULL,
    "descripcion" TEXT NOT NULL,
    "cantidad" INTEGER NOT NULL DEFAULT 1,
    "precio_unitario" DECIMAL(10,2) NOT NULL,
    "descuento" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "subtotal" DECIMAL(10,2) NOT NULL,
    "cita_id" TEXT,
    "orden_medica_id" TEXT,
    "orden_medicamento_id" TEXT,
    "admision_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "facturas_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pagos" (
    "id" TEXT NOT NULL,
    "factura_id" TEXT NOT NULL,
    "monto" DECIMAL(10,2) NOT NULL,
    "metodo_pago" "MetodoPago" NOT NULL,
    "referencia" TEXT,
    "observaciones" TEXT,
    "fecha_pago" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "registrado_por" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pagos_pkey" PRIMARY KEY ("id")
);

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
    "cita_id" TEXT,
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
    "admisionId" TEXT,
    "citaId" TEXT,
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

-- CreateTable
CREATE TABLE "prescripciones" (
    "id" TEXT NOT NULL,
    "pacienteId" TEXT NOT NULL,
    "admisionId" TEXT,
    "citaId" TEXT,
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

-- CreateTable
CREATE TABLE "role_permisos" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "rol" VARCHAR(50) NOT NULL,
    "modulo" VARCHAR(100) NOT NULL,
    "acceso" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "role_permisos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");

-- CreateIndex
CREATE UNIQUE INDEX "pacientes_cedula_key" ON "pacientes"("cedula");

-- CreateIndex
CREATE UNIQUE INDEX "departamentos_nombre_key" ON "departamentos"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "doctores_usuario_id_key" ON "doctores"("usuario_id");

-- CreateIndex
CREATE UNIQUE INDEX "doctores_especialidades_doctor_id_especialidad_id_key" ON "doctores_especialidades"("doctor_id", "especialidad_id");

-- CreateIndex
CREATE UNIQUE INDEX "productos_sku_key" ON "productos"("sku");

-- CreateIndex
CREATE UNIQUE INDEX "productos_etiquetas_producto_id_etiqueta_id_key" ON "productos_etiquetas"("producto_id", "etiqueta_id");

-- CreateIndex
CREATE UNIQUE INDEX "unidades_nombre_key" ON "unidades"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "habitaciones_numero_unidad_id_key" ON "habitaciones"("numero", "unidad_id");

-- CreateIndex
CREATE UNIQUE INDEX "camas_numero_habitacion_id_key" ON "camas"("numero", "habitacion_id");

-- CreateIndex
CREATE UNIQUE INDEX "egresos_admision_id_key" ON "egresos"("admision_id");

-- CreateIndex
CREATE UNIQUE INDEX "facturas_numero_key" ON "facturas"("numero");

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

-- CreateIndex
CREATE UNIQUE INDEX "role_permisos_rol_modulo_key" ON "role_permisos"("rol", "modulo");

-- AddForeignKey
ALTER TABLE "citas" ADD CONSTRAINT "citas_paciente_id_fkey" FOREIGN KEY ("paciente_id") REFERENCES "pacientes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "citas" ADD CONSTRAINT "citas_doctor_id_fkey" FOREIGN KEY ("doctor_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "citas" ADD CONSTRAINT "citas_admision_id_fkey" FOREIGN KEY ("admision_id") REFERENCES "admisiones"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "citas" ADD CONSTRAINT "citas_especialidad_id_fkey" FOREIGN KEY ("especialidad_id") REFERENCES "especialidades"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "citas" ADD CONSTRAINT "citas_examen_procedimiento_id_fkey" FOREIGN KEY ("examen_procedimiento_id") REFERENCES "examenes_procedimientos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "departamentos" ADD CONSTRAINT "departamentos_responsable_id_fkey" FOREIGN KEY ("responsable_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "especialidades" ADD CONSTRAINT "especialidades_departamento_id_fkey" FOREIGN KEY ("departamento_id") REFERENCES "departamentos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "doctores" ADD CONSTRAINT "doctores_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "doctores_especialidades" ADD CONSTRAINT "doctores_especialidades_doctor_id_fkey" FOREIGN KEY ("doctor_id") REFERENCES "doctores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "doctores_especialidades" ADD CONSTRAINT "doctores_especialidades_especialidad_id_fkey" FOREIGN KEY ("especialidad_id") REFERENCES "especialidades"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "examenes_procedimientos" ADD CONSTRAINT "examenes_procedimientos_categoria_id_fkey" FOREIGN KEY ("categoria_id") REFERENCES "categorias_examenes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "productos" ADD CONSTRAINT "productos_categoria_id_fkey" FOREIGN KEY ("categoria_id") REFERENCES "categorias_productos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "productos_etiquetas" ADD CONSTRAINT "productos_etiquetas_producto_id_fkey" FOREIGN KEY ("producto_id") REFERENCES "productos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "productos_etiquetas" ADD CONSTRAINT "productos_etiquetas_etiqueta_id_fkey" FOREIGN KEY ("etiqueta_id") REFERENCES "etiquetas_productos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documentos_paciente" ADD CONSTRAINT "documentos_paciente_paciente_id_fkey" FOREIGN KEY ("paciente_id") REFERENCES "pacientes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "habitaciones" ADD CONSTRAINT "habitaciones_unidad_id_fkey" FOREIGN KEY ("unidad_id") REFERENCES "unidades"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "camas" ADD CONSTRAINT "camas_habitacion_id_fkey" FOREIGN KEY ("habitacion_id") REFERENCES "habitaciones"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admisiones" ADD CONSTRAINT "admisiones_paciente_id_fkey" FOREIGN KEY ("paciente_id") REFERENCES "pacientes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admisiones" ADD CONSTRAINT "admisiones_unidad_id_fkey" FOREIGN KEY ("unidad_id") REFERENCES "unidades"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admisiones" ADD CONSTRAINT "admisiones_cama_id_fkey" FOREIGN KEY ("cama_id") REFERENCES "camas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimientos" ADD CONSTRAINT "movimientos_admision_id_fkey" FOREIGN KEY ("admision_id") REFERENCES "admisiones"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimientos" ADD CONSTRAINT "movimientos_unidad_origen_id_fkey" FOREIGN KEY ("unidad_origen_id") REFERENCES "unidades"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimientos" ADD CONSTRAINT "movimientos_unidad_destino_id_fkey" FOREIGN KEY ("unidad_destino_id") REFERENCES "unidades"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimientos" ADD CONSTRAINT "movimientos_cama_origen_id_fkey" FOREIGN KEY ("cama_origen_id") REFERENCES "camas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimientos" ADD CONSTRAINT "movimientos_cama_destino_id_fkey" FOREIGN KEY ("cama_destino_id") REFERENCES "camas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "egresos" ADD CONSTRAINT "egresos_admision_id_fkey" FOREIGN KEY ("admision_id") REFERENCES "admisiones"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ordenes_medicas" ADD CONSTRAINT "ordenes_medicas_paciente_id_fkey" FOREIGN KEY ("paciente_id") REFERENCES "pacientes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ordenes_medicas" ADD CONSTRAINT "ordenes_medicas_cita_id_fkey" FOREIGN KEY ("cita_id") REFERENCES "citas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ordenes_medicas" ADD CONSTRAINT "ordenes_medicas_admision_id_fkey" FOREIGN KEY ("admision_id") REFERENCES "admisiones"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ordenes_medicas" ADD CONSTRAINT "ordenes_medicas_examen_procedimiento_id_fkey" FOREIGN KEY ("examen_procedimiento_id") REFERENCES "examenes_procedimientos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ordenes_medicas" ADD CONSTRAINT "ordenes_medicas_doctor_id_fkey" FOREIGN KEY ("doctor_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ordenes_medicas" ADD CONSTRAINT "ordenes_medicas_ejecutado_por_fkey" FOREIGN KEY ("ejecutado_por") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ordenes_medicamentos" ADD CONSTRAINT "ordenes_medicamentos_paciente_id_fkey" FOREIGN KEY ("paciente_id") REFERENCES "pacientes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ordenes_medicamentos" ADD CONSTRAINT "ordenes_medicamentos_cita_id_fkey" FOREIGN KEY ("cita_id") REFERENCES "citas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ordenes_medicamentos" ADD CONSTRAINT "ordenes_medicamentos_admision_id_fkey" FOREIGN KEY ("admision_id") REFERENCES "admisiones"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ordenes_medicamentos" ADD CONSTRAINT "ordenes_medicamentos_doctor_id_fkey" FOREIGN KEY ("doctor_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ordenes_medicamentos" ADD CONSTRAINT "ordenes_medicamentos_despachado_por_fkey" FOREIGN KEY ("despachado_por") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ordenes_medicamentos_items" ADD CONSTRAINT "ordenes_medicamentos_items_orden_medicamento_id_fkey" FOREIGN KEY ("orden_medicamento_id") REFERENCES "ordenes_medicamentos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ordenes_medicamentos_items" ADD CONSTRAINT "ordenes_medicamentos_items_producto_id_fkey" FOREIGN KEY ("producto_id") REFERENCES "productos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "facturas" ADD CONSTRAINT "facturas_paciente_id_fkey" FOREIGN KEY ("paciente_id") REFERENCES "pacientes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "facturas" ADD CONSTRAINT "facturas_creada_por_fkey" FOREIGN KEY ("creada_por") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "facturas_items" ADD CONSTRAINT "facturas_items_factura_id_fkey" FOREIGN KEY ("factura_id") REFERENCES "facturas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "facturas_items" ADD CONSTRAINT "facturas_items_cita_id_fkey" FOREIGN KEY ("cita_id") REFERENCES "citas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "facturas_items" ADD CONSTRAINT "facturas_items_orden_medica_id_fkey" FOREIGN KEY ("orden_medica_id") REFERENCES "ordenes_medicas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "facturas_items" ADD CONSTRAINT "facturas_items_orden_medicamento_id_fkey" FOREIGN KEY ("orden_medicamento_id") REFERENCES "ordenes_medicamentos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "facturas_items" ADD CONSTRAINT "facturas_items_admision_id_fkey" FOREIGN KEY ("admision_id") REFERENCES "admisiones"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pagos" ADD CONSTRAINT "pagos_factura_id_fkey" FOREIGN KEY ("factura_id") REFERENCES "facturas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pagos" ADD CONSTRAINT "pagos_registrado_por_fkey" FOREIGN KEY ("registrado_por") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

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
ALTER TABLE "signos_vitales" ADD CONSTRAINT "signos_vitales_cita_id_fkey" FOREIGN KEY ("cita_id") REFERENCES "citas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

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
ALTER TABLE "procedimientos" ADD CONSTRAINT "procedimientos_citaId_fkey" FOREIGN KEY ("citaId") REFERENCES "citas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "procedimientos" ADD CONSTRAINT "procedimientos_pacienteId_fkey" FOREIGN KEY ("pacienteId") REFERENCES "pacientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "procedimientos" ADD CONSTRAINT "procedimientos_medicoResponsableId_fkey" FOREIGN KEY ("medicoResponsableId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "procedimientos" ADD CONSTRAINT "procedimientos_firmaMedicoId_fkey" FOREIGN KEY ("firmaMedicoId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prescripciones" ADD CONSTRAINT "prescripciones_pacienteId_fkey" FOREIGN KEY ("pacienteId") REFERENCES "pacientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prescripciones" ADD CONSTRAINT "prescripciones_admisionId_fkey" FOREIGN KEY ("admisionId") REFERENCES "admisiones"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prescripciones" ADD CONSTRAINT "prescripciones_citaId_fkey" FOREIGN KEY ("citaId") REFERENCES "citas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

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
