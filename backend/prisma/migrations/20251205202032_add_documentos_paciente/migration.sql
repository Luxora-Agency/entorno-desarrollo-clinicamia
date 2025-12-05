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

-- AddForeignKey
ALTER TABLE "documentos_paciente" ADD CONSTRAINT "documentos_paciente_paciente_id_fkey" FOREIGN KEY ("paciente_id") REFERENCES "pacientes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
