-- AlterTable: Add citaId to signos_vitales
ALTER TABLE "signos_vitales" ADD COLUMN "cita_id" TEXT;

-- AlterTable: Add citaId to procedimientos and make admisionId nullable
ALTER TABLE "procedimientos" ALTER COLUMN "admisionId" DROP NOT NULL;
ALTER TABLE "procedimientos" ADD COLUMN "citaId" TEXT;

-- AlterTable: Add citaId to prescripciones
ALTER TABLE "prescripciones" ADD COLUMN "citaId" TEXT;

-- AddForeignKey
ALTER TABLE "signos_vitales" ADD CONSTRAINT "signos_vitales_cita_id_fkey" FOREIGN KEY ("cita_id") REFERENCES "citas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "procedimientos" ADD CONSTRAINT "procedimientos_citaId_fkey" FOREIGN KEY ("citaId") REFERENCES "citas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prescripciones" ADD CONSTRAINT "prescripciones_citaId_fkey" FOREIGN KEY ("citaId") REFERENCES "citas"("id") ON DELETE SET NULL ON UPDATE CASCADE;
