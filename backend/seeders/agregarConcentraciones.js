/**
 * Script para agregar concentraciones faltantes a productos
 * Extrae concentraciones numéricas del nombre del producto
 */
const prisma = require('../db/prisma');

// Función para extraer concentración del nombre
function extraerConcentracionDeNombre(nombre) {
  // Ignorar productos que son descripciones de políticas PBS
  if (nombre.startsWith('SE FINANCIAN')) return null;

  // Patrones ordenados de más específico a menos específico
  const patrones = [
    // Combinaciones: "1g + 500mg", "500mg + 125mg"
    /(\d+(?:[.,]\d+)?)\s*(mg|g)\s*\+\s*(\d+(?:[.,]\d+)?)\s*(mg|g)/i,
    // Con volumen: "500mg/5ml", "10mg/2ml", "100UI/ml"
    /(\d+(?:[.,]\d+)?)\s*(mg|g|mcg|µg|ui|u\.?i\.?)\s*\/\s*(\d+(?:[.,]\d+)?)?\s*(ml|l|dosis)/i,
    // Por dosis: "250mcg/dosis", "100mg/tableta"
    /(\d+(?:[.,]\d+)?)\s*(mg|g|mcg|µg|ui)\s*\/\s*(dosis|tableta|cápsula|capsula)/i,
    // Porcentaje: "0.9%", "5%", "70%"
    /(\d+(?:[.,]\d+)?)\s*%/,
    // Simple con unidad: "500mg", "500 mg", "1g", "100UI", "250mcg"
    /(\d+(?:[.,]\d+)?)\s*(mg|g|mcg|µg|ui|u\.?i\.?|meq|ml)\b/i,
    // X seguido de volumen: "x 500ml", "x 1000ml"
    /x\s*(\d+(?:[.,]\d+)?)\s*(ml|l)\b/i
  ];

  for (const patron of patrones) {
    const match = nombre.match(patron);
    if (match) {
      // Limpiar y formatear
      let concentracion = match[0]
        .replace(/\s+/g, ' ')
        .replace(',', '.')
        .replace(/ui/gi, 'UI')
        .replace(/u\.i\.?/gi, 'UI')
        .replace(/mcg/gi, 'mcg')
        .replace(/µg/gi, 'mcg')
        .replace(/meq/gi, 'mEq')
        .replace(/^x\s*/i, '') // Quitar "x" inicial
        .trim();

      // Formatear unidades
      concentracion = concentracion
        .replace(/MG/g, 'mg')
        .replace(/ML/g, 'ml')
        .replace(/\sG\b/g, ' g')
        .replace(/(\d)G\b/g, '$1 g');

      return concentracion;
    }
  }

  return null;
}

// Función para extraer unidad de medida de la concentración
function extraerUnidad(concentracion) {
  if (!concentracion) return null;
  const c = concentracion.toLowerCase();

  if (c.includes('mg/ml')) return 'mg/ml';
  if (c.includes('g/ml')) return 'g/ml';
  if (c.includes('ui/ml')) return 'UI/ml';
  if (c.includes('mcg/ml')) return 'mcg/ml';
  if (c.includes('meq/l')) return 'mEq/L';
  if (c.includes('mcg/dosis')) return 'mcg/dosis';
  if (c.includes('mg/dosis')) return 'mg/dosis';
  if (c.includes('%')) return '%';
  if (c.includes('mcg')) return 'mcg';
  if (c.includes('mg')) return 'mg';
  if (c.match(/\dg\b/)) return 'g';
  if (c.includes('ml')) return 'ml';
  if (c.includes('ui')) return 'UI';
  if (c.includes('meq')) return 'mEq';

  return null;
}

async function agregarConcentraciones() {
  console.log('=== AGREGANDO CONCENTRACIONES FALTANTES ===\n');

  const productosSinConc = await prisma.producto.findMany({
    where: {
      OR: [
        { concentracion: null },
        { concentracion: '' }
      ]
    },
    select: { id: true, nombre: true, unidadMedida: true }
  });

  console.log('Productos sin concentración:', productosSinConc.length);

  let actualizados = 0;

  for (const p of productosSinConc) {
    const updateData = {};

    // Extraer del nombre del producto
    const concentracion = extraerConcentracionDeNombre(p.nombre);

    if (concentracion) {
      updateData.concentracion = concentracion;

      // Agregar unidad de medida si no tiene
      if (!p.unidadMedida) {
        const unidad = extraerUnidad(concentracion);
        if (unidad) {
          updateData.unidadMedida = unidad;
        }
      }

      await prisma.producto.update({
        where: { id: p.id },
        data: updateData
      });
      actualizados++;

      if (actualizados <= 30) {
        console.log(`  ✓ ${p.nombre} -> ${concentracion}`);
      } else if (actualizados % 50 === 0) {
        console.log(`Progreso: ${actualizados} actualizados...`);
      }
    }
  }

  console.log('\n=== RESUMEN ===');
  console.log('Total actualizados:', actualizados);

  // Estadísticas finales
  const stats = await prisma.$queryRaw`
    SELECT
      COUNT(*) as total,
      COUNT(CASE WHEN concentracion IS NOT NULL AND concentracion != '' THEN 1 END) as con_conc,
      COUNT(CASE WHEN unidad_medida IS NOT NULL AND unidad_medida != '' THEN 1 END) as con_unidad
    FROM productos
  `;

  const s = stats[0];
  const total = Number(s.total);
  console.log('\n=== ESTADÍSTICAS FINALES ===');
  console.log('Total productos:', total);
  console.log('Con concentración:', Number(s.con_conc), `(${Math.round(Number(s.con_conc)/total*100)}%)`);
  console.log('Con unidad medida:', Number(s.con_unidad), `(${Math.round(Number(s.con_unidad)/total*100)}%)`);

  await prisma.$disconnect();
}

agregarConcentraciones();
