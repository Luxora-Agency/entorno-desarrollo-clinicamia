-- CreateEnum
CREATE TYPE "Rol" AS ENUM ('SUPER_ADMIN', 'ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST', 'PATIENT', 'PHARMACIST', 'LAB_TECHNICIAN');

-- CreateEnum
CREATE TYPE "Genero" AS ENUM ('Masculino', 'Femenino', 'Otro');

-- CreateEnum
CREATE TYPE "EstadoCita" AS ENUM ('Programada', 'Confirmada', 'EnConsulta', 'Completada', 'Cancelada', 'NoAsistio');

-- CreateEnum
CREATE TYPE "Estado" AS ENUM ('Activo', 'Inactivo');

-- Crear tabla departamentos
CREATE TABLE "departamentos" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "responsable_id" TEXT,
    "estado" "Estado" NOT NULL DEFAULT 'Activo',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "departamentos_pkey" PRIMARY KEY ("id")
);

-- Crear tabla especialidades
CREATE TABLE "especialidades" (
    "id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "codigo" TEXT,
    "departamento_id" TEXT NOT NULL,
    "costo_cop" DOUBLE PRECISION NOT NULL,
    "duracion_minutos" INTEGER NOT NULL,
    "duracion_externa_min" INTEGER,
    "duracion_interna_min" INTEGER,
    "descripcion" TEXT,
    "estado" "Estado" NOT NULL DEFAULT 'Activo',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "especialidades_pkey" PRIMARY KEY ("id")
);

-- Alterar tabla citas para agregar especialidad_id
ALTER TABLE "citas" ADD COLUMN "especialidad_id" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "departamentos_nombre_key" ON "departamentos"("nombre");

-- AddForeignKey
ALTER TABLE "departamentos" ADD CONSTRAINT "departamentos_responsable_id_fkey" FOREIGN KEY ("responsable_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "especialidades" ADD CONSTRAINT "especialidades_departamento_id_fkey" FOREIGN KEY ("departamento_id") REFERENCES "departamentos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "citas" ADD CONSTRAINT "citas_especialidad_id_fkey" FOREIGN KEY ("especialidad_id") REFERENCES "especialidades"("id") ON DELETE SET NULL ON UPDATE CASCADE;
