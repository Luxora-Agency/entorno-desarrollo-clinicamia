-- CreateEnum
CREATE TYPE "EstadoCama" AS ENUM ('Disponible', 'Ocupada', 'Mantenimiento', 'Reservada');

-- CreateEnum
CREATE TYPE "EstadoAdmision" AS ENUM ('Activa', 'Egresada', 'Cancelada');

-- CreateEnum
CREATE TYPE "TipoMovimiento" AS ENUM ('Ingreso', 'Traslado', 'CambioCama', 'CambioUnidad', 'Egreso');

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

-- CreateIndex
CREATE UNIQUE INDEX "unidades_nombre_key" ON "unidades"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "habitaciones_numero_unidad_id_key" ON "habitaciones"("numero", "unidad_id");

-- CreateIndex
CREATE UNIQUE INDEX "camas_numero_habitacion_id_key" ON "camas"("numero", "habitacion_id");

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
