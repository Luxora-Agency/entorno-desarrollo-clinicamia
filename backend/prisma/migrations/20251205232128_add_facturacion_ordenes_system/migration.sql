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

-- CreateIndex
CREATE UNIQUE INDEX "facturas_numero_key" ON "facturas"("numero");

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
