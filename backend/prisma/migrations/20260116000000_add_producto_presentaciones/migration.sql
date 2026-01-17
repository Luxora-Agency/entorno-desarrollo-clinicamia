-- CreateTable
CREATE TABLE "producto_presentaciones" (
    "id" TEXT NOT NULL,
    "producto_id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "concentracion" TEXT NOT NULL,
    "unidad_medida" TEXT,
    "cantidad_unidades" INTEGER DEFAULT 1,
    "descripcion" TEXT,

    -- Códigos únicos por presentación
    "sku" TEXT NOT NULL,
    "codigo_barras" TEXT,
    "cum" TEXT,
    "registro_sanitario" TEXT,

    -- Inventario separado
    "cantidad_total" INTEGER NOT NULL DEFAULT 0,
    "cantidad_minima_alerta" INTEGER NOT NULL DEFAULT 10,
    "cantidad_maxima_alerta" INTEGER,

    -- Precios separados
    "precio_compra" DOUBLE PRECISION,
    "precio_venta" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "costo_promedio" DOUBLE PRECISION,
    "margen_ganancia" DOUBLE PRECISION,

    -- Estado
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "es_predeterminada" BOOLEAN NOT NULL DEFAULT false,

    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "producto_presentaciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable for lots per presentation
CREATE TABLE "lotes_presentaciones" (
    "id" TEXT NOT NULL,
    "presentacion_id" TEXT NOT NULL,
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

    CONSTRAINT "lotes_presentaciones_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "producto_presentaciones_sku_key" ON "producto_presentaciones"("sku");

-- CreateIndex
CREATE INDEX "producto_presentaciones_producto_id_idx" ON "producto_presentaciones"("producto_id");

-- CreateIndex
CREATE INDEX "producto_presentaciones_concentracion_idx" ON "producto_presentaciones"("concentracion");

-- CreateIndex
CREATE UNIQUE INDEX "lotes_presentaciones_presentacion_id_numero_lote_key" ON "lotes_presentaciones"("presentacion_id", "numero_lote");

-- AddForeignKey
ALTER TABLE "producto_presentaciones" ADD CONSTRAINT "producto_presentaciones_producto_id_fkey" FOREIGN KEY ("producto_id") REFERENCES "productos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lotes_presentaciones" ADD CONSTRAINT "lotes_presentaciones_presentacion_id_fkey" FOREIGN KEY ("presentacion_id") REFERENCES "producto_presentaciones"("id") ON DELETE CASCADE ON UPDATE CASCADE;
