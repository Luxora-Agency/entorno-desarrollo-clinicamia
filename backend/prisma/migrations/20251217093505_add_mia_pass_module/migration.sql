-- CreateTable
CREATE TABLE "mia_planes" (
    "id" SERIAL NOT NULL,
    "nombre" VARCHAR(255) NOT NULL,
    "descripcion" TEXT,
    "costo" DECIMAL(10,2) NOT NULL,
    "duracion_meses" INTEGER NOT NULL,
    "color" VARCHAR(50),
    "icono" VARCHAR(50),
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "destacado" BOOLEAN NOT NULL DEFAULT false,
    "beneficios" JSONB,
    "descuentos" JSONB,
    "items_consumibles" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mia_planes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mia_suscripciones" (
    "id" SERIAL NOT NULL,
    "plan_id" INTEGER NOT NULL,
    "paciente_id" TEXT NOT NULL,
    "fecha_inicio" TIMESTAMP(3) NOT NULL,
    "fecha_fin" TIMESTAMP(3) NOT NULL,
    "estado" VARCHAR(50) NOT NULL,
    "metodo_pago" VARCHAR(50),
    "precio_pagado" DECIMAL(10,2) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mia_suscripciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mia_cupones" (
    "id" SERIAL NOT NULL,
    "codigo" VARCHAR(50) NOT NULL,
    "descripcion" TEXT,
    "tipo_descuento" VARCHAR(20) NOT NULL,
    "valor_descuento" DECIMAL(10,2) NOT NULL,
    "fecha_inicio" TIMESTAMP(3) NOT NULL,
    "fecha_fin" TIMESTAMP(3) NOT NULL,
    "usos" INTEGER NOT NULL DEFAULT 0,
    "usos_maximos" INTEGER NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mia_cupones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_PlanCoupons" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "mia_cupones_codigo_key" ON "mia_cupones"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "_PlanCoupons_AB_unique" ON "_PlanCoupons"("A", "B");

-- CreateIndex
CREATE INDEX "_PlanCoupons_B_index" ON "_PlanCoupons"("B");

-- AddForeignKey
ALTER TABLE "mia_suscripciones" ADD CONSTRAINT "mia_suscripciones_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "mia_planes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mia_suscripciones" ADD CONSTRAINT "mia_suscripciones_paciente_id_fkey" FOREIGN KEY ("paciente_id") REFERENCES "pacientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PlanCoupons" ADD CONSTRAINT "_PlanCoupons_A_fkey" FOREIGN KEY ("A") REFERENCES "mia_cupones"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PlanCoupons" ADD CONSTRAINT "_PlanCoupons_B_fkey" FOREIGN KEY ("B") REFERENCES "mia_planes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
