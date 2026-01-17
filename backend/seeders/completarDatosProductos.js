/**
 * Script para completar datos faltantes de productos
 * extrayendo información del nombre del producto e infiriendo de categorías
 */
const prisma = require('../db/prisma');

// Mapeo de formas farmacéuticas comunes
const FORMAS = {
  'tableta': 'TABLETA',
  'tabletas': 'TABLETA',
  'comprimido': 'TABLETA',
  'capsula': 'CAPSULA DURA',
  'capsulas': 'CAPSULA DURA',
  'ampolla': 'SOLUCION INYECTABLE',
  'ampollas': 'SOLUCION INYECTABLE',
  'inyectable': 'SOLUCION INYECTABLE',
  'inyeccion': 'SOLUCION INYECTABLE',
  'vial': 'POLVO PARA RECONSTITUIR',
  'jarabe': 'JARABE',
  'suspension': 'SUSPENSION ORAL',
  'solucion oral': 'SOLUCION ORAL',
  'gotas': 'SOLUCION EN GOTAS',
  'crema': 'CREMA',
  'gel': 'GEL',
  'pomada': 'POMADA',
  'unguento': 'POMADA',
  'parche': 'PARCHE TRANSDERMICO',
  'inhalador': 'AEROSOL PARA INHALACION',
  'aerosol': 'AEROSOL',
  'spray': 'SPRAY',
  'supositorio': 'SUPOSITORIO',
  'ovulo': 'OVULO VAGINAL',
  'polvo': 'POLVO',
  'granulado': 'GRANULADO',
  'sobres': 'POLVO PARA SUSPENSION',
  'liposomal': 'SOLUCION INYECTABLE',
  'vacuna': 'SOLUCION INYECTABLE'
};

// Medicamentos comunes con sus formas y vías típicas por defecto
const MEDICAMENTOS_COMUNES = {
  // Antibióticos orales típicamente tabletas/cápsulas
  'amoxicilina': { forma: 'CAPSULA DURA', via: 'ORAL' },
  'ampicilina': { forma: 'CAPSULA DURA', via: 'ORAL' },
  'azitromicina': { forma: 'TABLETA', via: 'ORAL' },
  'ciprofloxacina': { forma: 'TABLETA', via: 'ORAL' },
  'clindamicina': { forma: 'CAPSULA DURA', via: 'ORAL' },
  'doxiciclina': { forma: 'CAPSULA DURA', via: 'ORAL' },
  'metronidazol': { forma: 'TABLETA', via: 'ORAL' },
  'norfloxacina': { forma: 'TABLETA', via: 'ORAL' },
  'cefalexina': { forma: 'CAPSULA DURA', via: 'ORAL' },

  // Analgésicos/antiinflamatorios típicamente tabletas
  'acetaminofen': { forma: 'TABLETA', via: 'ORAL' },
  'acetaminofén': { forma: 'TABLETA', via: 'ORAL' },
  'ibuprofeno': { forma: 'TABLETA', via: 'ORAL' },
  'diclofenaco': { forma: 'TABLETA', via: 'ORAL' },
  'naproxeno': { forma: 'TABLETA', via: 'ORAL' },
  'aspirina': { forma: 'TABLETA', via: 'ORAL' },
  'meloxicam': { forma: 'TABLETA', via: 'ORAL' },
  'celecoxib': { forma: 'CAPSULA DURA', via: 'ORAL' },

  // Antihipertensivos típicamente tabletas
  'losartan': { forma: 'TABLETA', via: 'ORAL' },
  'enalapril': { forma: 'TABLETA', via: 'ORAL' },
  'amlodipina': { forma: 'TABLETA', via: 'ORAL' },
  'valsartan': { forma: 'TABLETA', via: 'ORAL' },
  'metoprolol': { forma: 'TABLETA', via: 'ORAL' },
  'atenolol': { forma: 'TABLETA', via: 'ORAL' },
  'candesartan': { forma: 'TABLETA', via: 'ORAL' },
  'candesartán': { forma: 'TABLETA', via: 'ORAL' },
  'hidroclorotiazida': { forma: 'TABLETA', via: 'ORAL' },

  // Estatinas típicamente tabletas
  'atorvastatina': { forma: 'TABLETA', via: 'ORAL' },
  'simvastatina': { forma: 'TABLETA', via: 'ORAL' },
  'rosuvastatina': { forma: 'TABLETA', via: 'ORAL' },

  // Antidiabéticos típicamente tabletas
  'metformina': { forma: 'TABLETA', via: 'ORAL' },
  'glibenclamida': { forma: 'TABLETA', via: 'ORAL' },
  'sitagliptina': { forma: 'TABLETA', via: 'ORAL' },

  // Antiácidos/gastroprotectores típicamente cápsulas
  'omeprazol': { forma: 'CAPSULA DURA', via: 'ORAL' },
  'pantoprazol': { forma: 'TABLETA', via: 'ORAL' },
  'esomeprazol': { forma: 'CAPSULA DURA', via: 'ORAL' },
  'ranitidina': { forma: 'TABLETA', via: 'ORAL' },

  // Antihistamínicos típicamente tabletas
  'loratadina': { forma: 'TABLETA', via: 'ORAL' },
  'cetirizina': { forma: 'TABLETA', via: 'ORAL' },
  'desloratadina': { forma: 'TABLETA', via: 'ORAL' },

  // Ansiolíticos/antidepresivos típicamente tabletas
  'sertralina': { forma: 'TABLETA', via: 'ORAL' },
  'fluoxetina': { forma: 'CAPSULA DURA', via: 'ORAL' },
  'alprazolam': { forma: 'TABLETA', via: 'ORAL' },
  'clonazepam': { forma: 'TABLETA', via: 'ORAL' },
  'diazepam': { forma: 'TABLETA', via: 'ORAL' },

  // Antiepilépticos típicamente tabletas
  'carbamazepina': { forma: 'TABLETA', via: 'ORAL' },
  'fenitoina': { forma: 'TABLETA', via: 'ORAL' },
  'valproico': { forma: 'TABLETA', via: 'ORAL' },
  'levetiracetam': { forma: 'TABLETA', via: 'ORAL' },

  // Insulinas típicamente inyectables
  'insulina': { forma: 'SOLUCION INYECTABLE', via: 'SUBCUTANEA' },

  // Vacunas típicamente inyectables
  'vacuna': { forma: 'SOLUCION INYECTABLE', via: 'INTRAMUSCULAR' },

  // Quimioterapia típicamente inyectable
  'daunorubicina': { forma: 'SOLUCION INYECTABLE', via: 'INTRAVENOSA' },
  'doxorubicina': { forma: 'SOLUCION INYECTABLE', via: 'INTRAVENOSA' },
  'ciclofosfamida': { forma: 'POLVO PARA RECONSTITUIR', via: 'INTRAVENOSA' },
  'epirubicina': { forma: 'SOLUCION INYECTABLE', via: 'INTRAVENOSA' },
  'ixabepilona': { forma: 'POLVO PARA RECONSTITUIR', via: 'INTRAVENOSA' },
  'paclitaxel': { forma: 'SOLUCION INYECTABLE', via: 'INTRAVENOSA' },

  // Biológicos típicamente inyectables
  'adalimumab': { forma: 'SOLUCION INYECTABLE', via: 'SUBCUTANEA' },
  'etanercept': { forma: 'SOLUCION INYECTABLE', via: 'SUBCUTANEA' },
  'infliximab': { forma: 'POLVO PARA RECONSTITUIR', via: 'INTRAVENOSA' },
  'rituximab': { forma: 'SOLUCION INYECTABLE', via: 'INTRAVENOSA' },
  'nivolumab': { forma: 'SOLUCION INYECTABLE', via: 'INTRAVENOSA' },
  'pembrolizumab': { forma: 'SOLUCION INYECTABLE', via: 'INTRAVENOSA' },

  // Oftálmicos típicamente gotas
  'timolol': { forma: 'SOLUCION EN GOTAS', via: 'OFTALMICA' },
  'latanoprost': { forma: 'SOLUCION EN GOTAS', via: 'OFTALMICA' },
  'bimatoprost': { forma: 'SOLUCION EN GOTAS', via: 'OFTALMICA' },

  // Tópicos
  'clotrimazol': { forma: 'CREMA', via: 'TOPICA' },
  'ketoconazol': { forma: 'CREMA', via: 'TOPICA' },
  'betametasona': { forma: 'CREMA', via: 'TOPICA' },
  'hidrocortisona': { forma: 'CREMA', via: 'TOPICA' }
};

// Mapeo de vías de administración
const VIAS = {
  'oral': 'ORAL',
  'tableta': 'ORAL',
  'capsula': 'ORAL',
  'jarabe': 'ORAL',
  'inyectable': 'PARENTERAL',
  'iv': 'INTRAVENOSA',
  'im': 'INTRAMUSCULAR',
  'sc': 'SUBCUTANEA',
  'intravenosa': 'INTRAVENOSA',
  'intramuscular': 'INTRAMUSCULAR',
  'subcutanea': 'SUBCUTANEA',
  'topico': 'TOPICA',
  'crema': 'TOPICA',
  'gel': 'TOPICA',
  'pomada': 'TOPICA',
  'inhalador': 'INHALATORIA',
  'nasal': 'NASAL',
  'oftalmica': 'OFTALMICA',
  'otica': 'OTICA',
  'rectal': 'RECTAL',
  'vaginal': 'VAGINAL',
  'parche': 'TRANSDERMICA'
};

async function completarDesdeNombre() {
  console.log('=== COMPLETANDO DATOS DESDE NOMBRE ===\n');

  const productos = await prisma.producto.findMany({
    where: {
      OR: [
        { formaFarmaceutica: null },
        { viaAdministracion: null },
        { concentracion: null }
      ]
    },
    select: { id: true, nombre: true, formaFarmaceutica: true, viaAdministracion: true, concentracion: true, unidadMedida: true }
  });

  console.log('Productos con datos faltantes:', productos.length);

  let actualizados = 0;

  for (const p of productos) {
    const nombreLower = p.nombre.toLowerCase();
    const updateData = {};

    // Extraer concentración del nombre (ej: "ACETAMINOFEN 500MG")
    if (!p.concentracion) {
      const concMatch = p.nombre.match(/(\d+(?:\.\d+)?\s*(?:mg|g|ml|mcg|ui|%|meq)(?:\/(?:ml|g|kg))?)/i);
      if (concMatch) {
        updateData.concentracion = concMatch[1].toUpperCase().replace(/\s+/g, ' ');
      }
    }

    // Extraer unidad de medida
    if (!p.unidadMedida) {
      const texto = (updateData.concentracion || p.concentracion || '').toLowerCase();
      if (texto.includes('mg/ml')) updateData.unidadMedida = 'mg/ml';
      else if (texto.includes('g/ml')) updateData.unidadMedida = 'g/ml';
      else if (texto.includes('ui/ml')) updateData.unidadMedida = 'UI/ml';
      else if (texto.includes('mcg')) updateData.unidadMedida = 'mcg';
      else if (texto.includes('mg')) updateData.unidadMedida = 'mg';
      else if (texto.match(/\dg\b/) || texto.endsWith('g')) updateData.unidadMedida = 'g';
      else if (texto.includes('ml')) updateData.unidadMedida = 'ml';
      else if (texto.includes('ui') || texto.includes('u.i')) updateData.unidadMedida = 'UI';
      else if (texto.includes('%')) updateData.unidadMedida = '%';
      else if (texto.includes('meq')) updateData.unidadMedida = 'mEq';
    }

    // Detectar forma farmacéutica desde palabras clave en nombre
    if (!p.formaFarmaceutica) {
      for (const [key, value] of Object.entries(FORMAS)) {
        if (nombreLower.includes(key)) {
          updateData.formaFarmaceutica = value;
          break;
        }
      }
    }

    // Detectar vía de administración desde palabras clave en nombre
    if (!p.viaAdministracion) {
      for (const [key, value] of Object.entries(VIAS)) {
        if (nombreLower.includes(key)) {
          updateData.viaAdministracion = value;
          break;
        }
      }
    }

    // Si aún no tenemos forma o vía, intentar con medicamentos comunes
    if (!p.formaFarmaceutica || !p.viaAdministracion) {
      // Normalizar nombre quitando acentos para comparación
      const nombreNormalizado = nombreLower
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9\s]/g, '');

      // Extraer palabras del nombre
      const palabras = nombreNormalizado.split(/[\s+\-]/);

      for (const palabra of palabras) {
        // Buscar en medicamentos comunes
        for (const [med, datos] of Object.entries(MEDICAMENTOS_COMUNES)) {
          const medNormalizado = med.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
          if (palabra.includes(medNormalizado) || medNormalizado.includes(palabra)) {
            if (!p.formaFarmaceutica && !updateData.formaFarmaceutica) {
              updateData.formaFarmaceutica = datos.forma;
            }
            if (!p.viaAdministracion && !updateData.viaAdministracion) {
              updateData.viaAdministracion = datos.via;
            }
            break;
          }
        }
        if (updateData.formaFarmaceutica && updateData.viaAdministracion) break;
      }
    }

    if (Object.keys(updateData).length > 0) {
      await prisma.producto.update({
        where: { id: p.id },
        data: updateData
      });
      actualizados++;

      if (actualizados <= 10) {
        console.log(`  ✓ ${p.nombre} -> conc: ${updateData.concentracion || '-'}, forma: ${updateData.formaFarmaceutica || '-'}`);
      }
    }
  }

  console.log('\nProductos actualizados:', actualizados);

  // Estadísticas finales
  const stats = await prisma.$queryRaw`
    SELECT
      COUNT(*) as total,
      COUNT(CASE WHEN concentracion IS NOT NULL AND concentracion != '' THEN 1 END) as con_concentracion,
      COUNT(CASE WHEN forma_farmaceutica IS NOT NULL AND forma_farmaceutica != '' THEN 1 END) as con_forma,
      COUNT(CASE WHEN unidad_medida IS NOT NULL AND unidad_medida != '' THEN 1 END) as con_unidad,
      COUNT(CASE WHEN via_administracion IS NOT NULL AND via_administracion != '' THEN 1 END) as con_via,
      COUNT(CASE WHEN laboratorio IS NOT NULL AND laboratorio != '' THEN 1 END) as con_lab,
      COUNT(CASE WHEN registro_sanitario IS NOT NULL AND registro_sanitario != '' THEN 1 END) as con_reg
    FROM productos
  `;

  console.log('\n=== ESTADÍSTICAS FINALES ===');
  const s = stats[0];
  const total = Number(s.total);
  console.log('Total productos:', total);
  console.log('Con concentración:', Number(s.con_concentracion), `(${Math.round(Number(s.con_concentracion)/total*100)}%)`);
  console.log('Con forma farmacéutica:', Number(s.con_forma), `(${Math.round(Number(s.con_forma)/total*100)}%)`);
  console.log('Con unidad de medida:', Number(s.con_unidad), `(${Math.round(Number(s.con_unidad)/total*100)}%)`);
  console.log('Con vía administración:', Number(s.con_via), `(${Math.round(Number(s.con_via)/total*100)}%)`);
  console.log('Con laboratorio:', Number(s.con_lab), `(${Math.round(Number(s.con_lab)/total*100)}%)`);
  console.log('Con registro sanitario:', Number(s.con_reg), `(${Math.round(Number(s.con_reg)/total*100)}%)`);

  await prisma.$disconnect();
}

completarDesdeNombre();
