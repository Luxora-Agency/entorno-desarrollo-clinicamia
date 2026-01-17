-- AlterTable: Add new medication fields to productos table
ALTER TABLE "productos" ADD COLUMN IF NOT EXISTS "codigo_barras" TEXT;
ALTER TABLE "productos" ADD COLUMN IF NOT EXISTS "forma_farmaceutica" TEXT;
ALTER TABLE "productos" ADD COLUMN IF NOT EXISTS "unidad_medida" TEXT;
ALTER TABLE "productos" ADD COLUMN IF NOT EXISTS "controlado" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "productos" ADD COLUMN IF NOT EXISTS "tipo_controlado" TEXT;
ALTER TABLE "productos" ADD COLUMN IF NOT EXISTS "requiere_cadena_frio" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "productos" ADD COLUMN IF NOT EXISTS "ubicacion_almacen" TEXT;
ALTER TABLE "productos" ADD COLUMN IF NOT EXISTS "cantidad_max_alerta" INTEGER;
ALTER TABLE "productos" ADD COLUMN IF NOT EXISTS "costo_promedio" DOUBLE PRECISION;
ALTER TABLE "productos" ADD COLUMN IF NOT EXISTS "margen_ganancia" DOUBLE PRECISION;
ALTER TABLE "productos" ADD COLUMN IF NOT EXISTS "siigo_id" TEXT;

-- Set default values for existing required fields
ALTER TABLE "productos" ALTER COLUMN "cantidad_total" SET DEFAULT 0;
ALTER TABLE "productos" ALTER COLUMN "cantidad_min_alerta" SET DEFAULT 10;
ALTER TABLE "productos" ALTER COLUMN "precio_venta" SET DEFAULT 0;

-- CreateTable: lotes_productos for batch tracking
CREATE TABLE IF NOT EXISTS "lotes_productos" (
    "id" TEXT NOT NULL,
    "producto_id" TEXT NOT NULL,
    "numero_lote" TEXT NOT NULL,
    "fecha_fabricacion" TIMESTAMP(3),
    "fecha_vencimiento" TIMESTAMP(3) NOT NULL,
    "cantidad_inicial" INTEGER NOT NULL,
    "cantidad_actual" INTEGER NOT NULL,
    "precio_compra" DOUBLE PRECISION,
    "proveedor" TEXT,
    "ubicacion" TEXT,
    "estado" TEXT NOT NULL DEFAULT 'activo',
    "observaciones" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lotes_productos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "lotes_productos_producto_id_numero_lote_key" ON "lotes_productos"("producto_id", "numero_lote");

-- AddForeignKey
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'lotes_productos_producto_id_fkey'
    ) THEN
        ALTER TABLE "lotes_productos" ADD CONSTRAINT "lotes_productos_producto_id_fkey"
        FOREIGN KEY ("producto_id") REFERENCES "productos"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;
