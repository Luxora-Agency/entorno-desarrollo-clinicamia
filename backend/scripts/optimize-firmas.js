/**
 * Script para optimizar firmas y sellos existentes en la base de datos
 * Reduce el tamaño de las imágenes para mejorar rendimiento de PDF
 */
const { PrismaClient } = require('@prisma/client');
const { resizeBase64Image } = require('../utils/upload');

const prisma = new PrismaClient();

async function optimizeFirmas() {
  console.log('=== Iniciando optimización de firmas y sellos ===\n');

  // Get all doctors with firma or sello
  const doctors = await prisma.doctor.findMany({
    where: {
      OR: [
        { firma: { not: null } },
        { sello: { not: null } }
      ]
    },
    select: {
      id: true,
      firma: true,
      sello: true,
      usuario: { select: { nombre: true, apellido: true } }
    }
  });

  console.log(`Encontrados ${doctors.length} doctores con firma/sello\n`);

  let optimizedCount = 0;

  for (const doctor of doctors) {
    const nombre = `${doctor.usuario?.nombre || ''} ${doctor.usuario?.apellido || ''}`.trim();
    console.log(`Procesando: ${nombre} (${doctor.id})`);

    let updateData = {};
    let needsUpdate = false;

    // Optimize firma if exists and is large
    if (doctor.firma && doctor.firma.startsWith('data:image') && doctor.firma.length > 50000) {
      console.log(`  Firma actual: ${(doctor.firma.length / 1024).toFixed(1)} KB`);
      try {
        const optimized = await resizeBase64Image(doctor.firma, { maxWidth: 400, maxHeight: 200 });
        if (optimized && optimized.length < doctor.firma.length) {
          updateData.firma = optimized;
          needsUpdate = true;
          console.log(`  Firma optimizada: ${(optimized.length / 1024).toFixed(1)} KB (${Math.round((1 - optimized.length / doctor.firma.length) * 100)}% reducción)`);
        }
      } catch (e) {
        console.log(`  Error optimizando firma: ${e.message}`);
      }
    }

    // Optimize sello if exists and is large
    if (doctor.sello && doctor.sello.startsWith('data:image') && doctor.sello.length > 50000) {
      console.log(`  Sello actual: ${(doctor.sello.length / 1024).toFixed(1)} KB`);
      try {
        const optimized = await resizeBase64Image(doctor.sello, { maxWidth: 300, maxHeight: 300 });
        if (optimized && optimized.length < doctor.sello.length) {
          updateData.sello = optimized;
          needsUpdate = true;
          console.log(`  Sello optimizado: ${(optimized.length / 1024).toFixed(1)} KB (${Math.round((1 - optimized.length / doctor.sello.length) * 100)}% reducción)`);
        }
      } catch (e) {
        console.log(`  Error optimizando sello: ${e.message}`);
      }
    }

    if (needsUpdate) {
      await prisma.doctor.update({
        where: { id: doctor.id },
        data: updateData
      });
      optimizedCount++;
      console.log(`  ✓ Actualizado en BD`);
    } else {
      console.log(`  - Sin cambios necesarios`);
    }

    console.log('');
  }

  console.log(`=== Optimización completada: ${optimizedCount} doctores actualizados ===`);
  await prisma.$disconnect();
}

optimizeFirmas().catch(e => {
  console.error('Error:', e);
  process.exit(1);
});
