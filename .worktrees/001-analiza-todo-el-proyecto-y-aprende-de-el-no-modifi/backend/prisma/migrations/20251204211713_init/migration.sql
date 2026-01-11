-- CreateEnum
CREATE TYPE "Rol" AS ENUM ('SUPER_ADMIN', 'ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST', 'PATIENT', 'PHARMACIST', 'LAB_TECHNICIAN');

-- CreateEnum
CREATE TYPE "Genero" AS ENUM ('Masculino', 'Femenino', 'Otro');

-- CreateEnum
CREATE TYPE "EstadoCita" AS ENUM ('Programada', 'Confirmada', 'EnConsulta', 'Completada', 'Cancelada', 'NoAsistio');

-- CreateEnum
CREATE TYPE "Estado" AS ENUM ('Activo', 'Inactivo');

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
    "cedula" TEXT NOT NULL,
    "fecha_nacimiento" DATE NOT NULL,
    "genero" "Genero",
    "telefono" TEXT,
    "email" TEXT,
    "direccion" TEXT,
    "tipo_sangre" TEXT,
    "alergias" TEXT,
    "contacto_emergencia_nombre" TEXT,
    "contacto_emergencia_telefono" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pacientes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "citas" (
    "id" TEXT NOT NULL,
    "paciente_id" TEXT NOT NULL,
    "doctor_id" UUID NOT NULL,
    "especialidad_id" UUID,
    "fecha" DATE NOT NULL,
    "hora" TIME NOT NULL,
    "motivo" TEXT NOT NULL,
    "estado" "EstadoCita" NOT NULL DEFAULT 'Programada',
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

-- AddForeignKey
ALTER TABLE "citas" ADD CONSTRAINT "citas_paciente_id_fkey" FOREIGN KEY ("paciente_id") REFERENCES "pacientes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "citas" ADD CONSTRAINT "citas_doctor_id_fkey" FOREIGN KEY ("doctor_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "citas" ADD CONSTRAINT "citas_especialidad_id_fkey" FOREIGN KEY ("especialidad_id") REFERENCES "especialidades"("id") ON DELETE SET NULL ON UPDATE CASCADE;

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
