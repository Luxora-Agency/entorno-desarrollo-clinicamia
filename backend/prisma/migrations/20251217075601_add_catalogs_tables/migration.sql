-- AlterTable
ALTER TABLE "eventos_adversos" ALTER COLUMN "codigo" SET DEFAULT 'EA-' || to_char(now(), 'YYYYMMDD') || '-' || floor(random() * 10000)::text;

-- AlterTable
ALTER TABLE "planes_accion_calidad" ALTER COLUMN "codigo" SET DEFAULT 'PA-' || to_char(now(), 'YYYYMMDD') || '-' || floor(random() * 10000)::text;

-- AlterTable
ALTER TABLE "pqrs" ALTER COLUMN "radicado" SET DEFAULT 'PQRS-' || to_char(now(), 'YYYYMMDD') || '-' || floor(random() * 10000)::text;

-- CreateTable
CREATE TABLE "catalogo_cups" (
    "id" TEXT NOT NULL,
    "codigo" VARCHAR(20) NOT NULL,
    "descripcion" TEXT NOT NULL,
    "seccion" TEXT,
    "capitulo" TEXT,
    "grupo" TEXT,
    "subgrupo" TEXT,
    "estado" TEXT NOT NULL DEFAULT 'Activo',
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "catalogo_cups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "catalogo_cie11" (
    "id" TEXT NOT NULL,
    "codigo" VARCHAR(20) NOT NULL,
    "descripcion" TEXT NOT NULL,
    "capitulo" TEXT,
    "titulo" TEXT,
    "estado" TEXT NOT NULL DEFAULT 'Activo',
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "catalogo_cie11_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "catalogo_cups_codigo_key" ON "catalogo_cups"("codigo");

-- CreateIndex
CREATE INDEX "catalogo_cups_codigo_idx" ON "catalogo_cups"("codigo");

-- CreateIndex
CREATE INDEX "catalogo_cups_descripcion_idx" ON "catalogo_cups"("descripcion");

-- CreateIndex
CREATE UNIQUE INDEX "catalogo_cie11_codigo_key" ON "catalogo_cie11"("codigo");

-- CreateIndex
CREATE INDEX "catalogo_cie11_codigo_idx" ON "catalogo_cie11"("codigo");

-- CreateIndex
CREATE INDEX "catalogo_cie11_descripcion_idx" ON "catalogo_cie11"("descripcion");
