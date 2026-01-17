/**
 * Script para completar concentraciones faltantes de productos
 * Busca en INVIMA y actualiza el producto con la concentración encontrada
 */
const prisma = require('../db/prisma');

const API_URL = 'https://www.datos.gov.co/resource/i7cb-raxc.json';

// Buscar concentración en INVIMA
async function buscarConcentracionINVIMA(nombre) {
  try {
    // Normalizar nombre (quitar acentos, tomar primera palabra)
    const normalizado = nombre
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .split(/[\s+\-\(\)]/)[0]
      .replace(/[^a-z0-9]/g, '');

    if (normalizado.length < 3) return null;

    const url = `${API_URL}?$where=lower(principioactivo) like '%25${encodeURIComponent(normalizado)}%25'&$limit=5&estadocum=Activo`;

    const response = await fetch(url);
    if (!response.ok) return null;

    const data = await response.json();

    if (data && data.length > 0) {
      // Buscar el primer resultado con cantidad válida
      for (const r of data) {
        const cantidad = r.cantidad;
        const unidad = r.unidadmedida || 'mg';

        if (cantidad && !isNaN(parseFloat(cantidad))) {
          return {
            concentracion: `${cantidad} ${unidad}`.trim(),
            unidadMedida: unidad,
            formaFarmaceutica: r.formafarmaceutica,
            viaAdministracion: r.viaadministracion
          };
        }
      }
    }
  } catch (error) {
    // Silenciar errores
  }
  return null;
}

// Concentraciones comunes para medicamentos que no están en INVIMA
const CONCENTRACIONES_DEFAULT = {
  // Analgésicos
  'ACETAMINOFEN': { conc: '500 mg', unidad: 'mg' },
  'ACETAMINOFÉN': { conc: '500 mg', unidad: 'mg' },
  'IBUPROFENO': { conc: '400 mg', unidad: 'mg' },
  'DICLOFENACO': { conc: '50 mg', unidad: 'mg' },
  'NAPROXENO': { conc: '250 mg', unidad: 'mg' },
  'TRAMADOL': { conc: '50 mg', unidad: 'mg' },
  'MORFINA': { conc: '10 mg', unidad: 'mg' },
  'KETOROLACO': { conc: '10 mg', unidad: 'mg' },
  'MELOXICAM': { conc: '15 mg', unidad: 'mg' },

  // Antihipertensivos
  'LOSARTAN': { conc: '50 mg', unidad: 'mg' },
  'LOSARTÁN': { conc: '50 mg', unidad: 'mg' },
  'ENALAPRIL': { conc: '20 mg', unidad: 'mg' },
  'AMLODIPINA': { conc: '5 mg', unidad: 'mg' },
  'AMLODIPINO': { conc: '5 mg', unidad: 'mg' },
  'VALSARTAN': { conc: '80 mg', unidad: 'mg' },
  'VALSARTÁN': { conc: '80 mg', unidad: 'mg' },
  'METOPROLOL': { conc: '50 mg', unidad: 'mg' },

  // Antibióticos
  'AMOXICILINA': { conc: '500 mg', unidad: 'mg' },
  'AMPICILINA': { conc: '500 mg', unidad: 'mg' },
  'AZITROMICINA': { conc: '500 mg', unidad: 'mg' },
  'CIPROFLOXACINA': { conc: '500 mg', unidad: 'mg' },
  'METRONIDAZOL': { conc: '500 mg', unidad: 'mg' },
  'CLINDAMICINA': { conc: '300 mg', unidad: 'mg' },
  'DOXICICLINA': { conc: '100 mg', unidad: 'mg' },
  'CEFALEXINA': { conc: '500 mg', unidad: 'mg' },

  // Gastroprotectores
  'OMEPRAZOL': { conc: '20 mg', unidad: 'mg' },
  'PANTOPRAZOL': { conc: '40 mg', unidad: 'mg' },
  'ESOMEPRAZOL': { conc: '40 mg', unidad: 'mg' },
  'RANITIDINA': { conc: '150 mg', unidad: 'mg' },

  // Antihistamínicos
  'LORATADINA': { conc: '10 mg', unidad: 'mg' },
  'CETIRIZINA': { conc: '10 mg', unidad: 'mg' },
  'DESLORATADINA': { conc: '5 mg', unidad: 'mg' },

  // Antidiabéticos
  'METFORMINA': { conc: '850 mg', unidad: 'mg' },
  'GLIBENCLAMIDA': { conc: '5 mg', unidad: 'mg' },

  // Estatinas
  'ATORVASTATINA': { conc: '20 mg', unidad: 'mg' },
  'SIMVASTATINA': { conc: '20 mg', unidad: 'mg' },
  'ROSUVASTATINA': { conc: '10 mg', unidad: 'mg' },

  // Psiquiátricos
  'ALPRAZOLAM': { conc: '0.5 mg', unidad: 'mg' },
  'CLONAZEPAM': { conc: '2 mg', unidad: 'mg' },
  'DIAZEPAM': { conc: '10 mg', unidad: 'mg' },
  'SERTRALINA': { conc: '50 mg', unidad: 'mg' },
  'FLUOXETINA': { conc: '20 mg', unidad: 'mg' },

  // Corticoides
  'PREDNISONA': { conc: '50 mg', unidad: 'mg' },
  'DEXAMETASONA': { conc: '4 mg', unidad: 'mg' },
  'HIDROCORTISONA': { conc: '100 mg', unidad: 'mg' },

  // Anticoagulantes
  'WARFARINA': { conc: '5 mg', unidad: 'mg' },
  'ENOXAPARINA': { conc: '40 mg', unidad: 'mg' },
  'CLOPIDOGREL': { conc: '75 mg', unidad: 'mg' },

  // Otros
  'FUROSEMIDA': { conc: '40 mg', unidad: 'mg' },
  'LEVOTIROXINA': { conc: '100 mcg', unidad: 'mcg' },
  'SALBUTAMOL': { conc: '100 mcg/dosis', unidad: 'mcg/dosis' },
};

async function completarConcentraciones() {
  console.log('=== COMPLETANDO CONCENTRACIONES FALTANTES ===\n');

  // Obtener productos sin concentración y sin presentaciones
  const productos = await prisma.producto.findMany({
    where: {
      OR: [{ concentracion: null }, { concentracion: '' }],
      presentaciones: { none: {} }
    },
    select: { id: true, nombre: true, unidadMedida: true, formaFarmaceutica: true, viaAdministracion: true }
  });

  console.log('Productos sin concentración:', productos.length);

  let actualizados = 0;
  let porINVIMA = 0;
  let porDefault = 0;
  let sinDatos = 0;

  for (let i = 0; i < productos.length; i++) {
    const p = productos[i];

    // Ignorar productos que son descripciones de políticas PBS
    if (p.nombre.startsWith('SE FINANCIAN')) {
      sinDatos++;
      continue;
    }

    const updateData = {};

    // Primero intentar buscar en INVIMA
    const invimaData = await buscarConcentracionINVIMA(p.nombre);

    if (invimaData && invimaData.concentracion) {
      updateData.concentracion = invimaData.concentracion;
      updateData.unidadMedida = invimaData.unidadMedida;
      if (!p.formaFarmaceutica && invimaData.formaFarmaceutica) {
        updateData.formaFarmaceutica = invimaData.formaFarmaceutica;
      }
      if (!p.viaAdministracion && invimaData.viaAdministracion) {
        updateData.viaAdministracion = invimaData.viaAdministracion;
      }
      porINVIMA++;
    } else {
      // Buscar en defaults
      const nombreUpper = p.nombre.toUpperCase().split(/[\s+\-\(\)]/)[0];
      const defaultData = CONCENTRACIONES_DEFAULT[nombreUpper] || CONCENTRACIONES_DEFAULT[p.nombre];

      if (defaultData) {
        updateData.concentracion = defaultData.conc;
        updateData.unidadMedida = defaultData.unidad;
        porDefault++;
      } else {
        sinDatos++;
      }
    }

    if (Object.keys(updateData).length > 0) {
      await prisma.producto.update({
        where: { id: p.id },
        data: updateData
      });
      actualizados++;

      if (actualizados <= 20) {
        console.log(`  ✓ ${p.nombre} -> ${updateData.concentracion}`);
      } else if (actualizados % 100 === 0) {
        console.log(`Progreso: ${actualizados} actualizados...`);
      }
    }

    // Pausa cada 10 productos para no saturar API
    if (i % 10 === 0 && i > 0) {
      await new Promise(r => setTimeout(r, 100));
    }
  }

  console.log('\n=== RESUMEN ===');
  console.log('Total actualizados:', actualizados);
  console.log('  - Por INVIMA:', porINVIMA);
  console.log('  - Por default:', porDefault);
  console.log('Sin datos encontrados:', sinDatos);

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

completarConcentraciones();
