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

-- CreateIndex
CREATE UNIQUE INDEX "productos_sku_key" ON "productos"("sku");

-- CreateIndex
CREATE UNIQUE INDEX "productos_etiquetas_producto_id_etiqueta_id_key" ON "productos_etiquetas"("producto_id", "etiqueta_id");

-- AddForeignKey
ALTER TABLE "productos" ADD CONSTRAINT "productos_categoria_id_fkey" FOREIGN KEY ("categoria_id") REFERENCES "categorias_productos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "productos_etiquetas" ADD CONSTRAINT "productos_etiquetas_producto_id_fkey" FOREIGN KEY ("producto_id") REFERENCES "productos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "productos_etiquetas" ADD CONSTRAINT "productos_etiquetas_etiqueta_id_fkey" FOREIGN KEY ("etiqueta_id") REFERENCES "etiquetas_productos"("id") ON DELETE CASCADE ON UPDATE CASCADE;
