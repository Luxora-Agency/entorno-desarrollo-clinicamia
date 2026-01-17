/**
 * Script para agregar concentraciones comunes a medicamentos genéricos
 * Basado en presentaciones típicas en Colombia
 */
const prisma = require('../db/prisma');

// Concentraciones típicas de medicamentos comunes en Colombia
const CONCENTRACIONES_COMUNES = {
  // Analgésicos/Antiinflamatorios
  'ACETAMINOFÉN': { conc: '500 mg', unidad: 'mg' },
  'IBUPROFENO': { conc: '400 mg', unidad: 'mg' },
  'DICLOFENACO': { conc: '50 mg', unidad: 'mg' },
  'NAPROXENO': { conc: '250 mg', unidad: 'mg' },
  'MELOXICAM': { conc: '15 mg', unidad: 'mg' },
  'KETOROLACO': { conc: '10 mg', unidad: 'mg' },
  'TRAMADOL': { conc: '50 mg', unidad: 'mg' },
  'MORFINA': { conc: '10 mg', unidad: 'mg' },
  'DIPIRONA': { conc: '500 mg', unidad: 'mg' },
  'CELECOXIB': { conc: '200 mg', unidad: 'mg' },
  'ACECLOFENACO': { conc: '100 mg', unidad: 'mg' },

  // Antihipertensivos
  'LOSARTAN': { conc: '50 mg', unidad: 'mg' },
  'LOSARTÁN': { conc: '50 mg', unidad: 'mg' },
  'ENALAPRIL': { conc: '20 mg', unidad: 'mg' },
  'AMLODIPINA': { conc: '5 mg', unidad: 'mg' },
  'AMLODIPINO': { conc: '5 mg', unidad: 'mg' },
  'VALSARTAN': { conc: '80 mg', unidad: 'mg' },
  'VALSARTÁN': { conc: '80 mg', unidad: 'mg' },
  'METOPROLOL': { conc: '50 mg', unidad: 'mg' },
  'ATENOLOL': { conc: '50 mg', unidad: 'mg' },
  'CARVEDILOL': { conc: '25 mg', unidad: 'mg' },
  'IRBESARTÁN': { conc: '150 mg', unidad: 'mg' },
  'CANDESARTÁN': { conc: '16 mg', unidad: 'mg' },
  'NIFEDIPINA': { conc: '30 mg', unidad: 'mg' },
  'CAPTOPRIL': { conc: '25 mg', unidad: 'mg' },

  // Diuréticos
  'FUROSEMIDA': { conc: '40 mg', unidad: 'mg' },
  'HIDROCLOROTIAZIDA': { conc: '25 mg', unidad: 'mg' },
  'ESPIRONOLACTONA': { conc: '25 mg', unidad: 'mg' },

  // Estatinas
  'ATORVASTATINA': { conc: '20 mg', unidad: 'mg' },
  'SIMVASTATINA': { conc: '20 mg', unidad: 'mg' },
  'ROSUVASTATINA': { conc: '10 mg', unidad: 'mg' },
  'PRAVASTATINA': { conc: '20 mg', unidad: 'mg' },

  // Antidiabéticos
  'METFORMINA': { conc: '850 mg', unidad: 'mg' },
  'GLIBENCLAMIDA': { conc: '5 mg', unidad: 'mg' },
  'GLIMEPIRIDA': { conc: '4 mg', unidad: 'mg' },
  'SITAGLIPTINA': { conc: '100 mg', unidad: 'mg' },
  'INSULINA NPH': { conc: '100 UI/ml', unidad: 'UI/ml' },
  'INSULINA GLARGINA': { conc: '100 UI/ml', unidad: 'UI/ml' },
  'INSULINA CRISTALINA': { conc: '100 UI/ml', unidad: 'UI/ml' },

  // Antibióticos
  'AMOXICILINA': { conc: '500 mg', unidad: 'mg' },
  'AMPICILINA': { conc: '500 mg', unidad: 'mg' },
  'AZITROMICINA': { conc: '500 mg', unidad: 'mg' },
  'CIPROFLOXACINA': { conc: '500 mg', unidad: 'mg' },
  'LEVOFLOXACINA': { conc: '500 mg', unidad: 'mg' },
  'METRONIDAZOL': { conc: '500 mg', unidad: 'mg' },
  'CLINDAMICINA': { conc: '300 mg', unidad: 'mg' },
  'DOXICICLINA': { conc: '100 mg', unidad: 'mg' },
  'CEFALEXINA': { conc: '500 mg', unidad: 'mg' },
  'CEFRADINA': { conc: '500 mg', unidad: 'mg' },
  'CEFTRIAXONA': { conc: '1 g', unidad: 'g' },
  'VANCOMICINA': { conc: '500 mg', unidad: 'mg' },
  'CLARITROMICINA': { conc: '500 mg', unidad: 'mg' },
  'ERITROMICINA': { conc: '500 mg', unidad: 'mg' },
  'TRIMETOPRIM': { conc: '160 mg', unidad: 'mg' },
  'SULFAMETOXAZOL': { conc: '800 mg', unidad: 'mg' },
  'NORFLOXACINA': { conc: '400 mg', unidad: 'mg' },
  'PENICILINA G BENZATÍNICA': { conc: '1.200.000 UI', unidad: 'UI' },

  // Gastroprotectores
  'OMEPRAZOL': { conc: '20 mg', unidad: 'mg' },
  'ESOMEPRAZOL': { conc: '40 mg', unidad: 'mg' },
  'PANTOPRAZOL': { conc: '40 mg', unidad: 'mg' },
  'LANSOPRAZOL': { conc: '30 mg', unidad: 'mg' },
  'RANITIDINA': { conc: '150 mg', unidad: 'mg' },
  'FAMOTIDINA': { conc: '40 mg', unidad: 'mg' },

  // Antihistamínicos
  'LORATADINA': { conc: '10 mg', unidad: 'mg' },
  'CETIRIZINA': { conc: '10 mg', unidad: 'mg' },
  'DESLORATADINA': { conc: '5 mg', unidad: 'mg' },
  'FEXOFENADINA': { conc: '180 mg', unidad: 'mg' },
  'DIFENHIDRAMINA': { conc: '25 mg', unidad: 'mg' },
  'CLORFENIRAMINA': { conc: '4 mg', unidad: 'mg' },

  // Psiquiátricos
  'ALPRAZOLAM': { conc: '0.5 mg', unidad: 'mg' },
  'CLONAZEPAM': { conc: '2 mg', unidad: 'mg' },
  'DIAZEPAM': { conc: '10 mg', unidad: 'mg' },
  'LORAZEPAM': { conc: '2 mg', unidad: 'mg' },
  'SERTRALINA': { conc: '50 mg', unidad: 'mg' },
  'FLUOXETINA': { conc: '20 mg', unidad: 'mg' },
  'ESCITALOPRAM': { conc: '10 mg', unidad: 'mg' },
  'PAROXETINA': { conc: '20 mg', unidad: 'mg' },
  'AMITRIPTILINA': { conc: '25 mg', unidad: 'mg' },
  'QUETIAPINA': { conc: '100 mg', unidad: 'mg' },
  'RISPERIDONA': { conc: '2 mg', unidad: 'mg' },
  'HALOPERIDOL': { conc: '5 mg', unidad: 'mg' },
  'TRAZODONA': { conc: '100 mg', unidad: 'mg' },

  // Antiepilépticos
  'CARBAMAZEPINA': { conc: '200 mg', unidad: 'mg' },
  'FENITOÍNA': { conc: '100 mg', unidad: 'mg' },
  'FENITOINA': { conc: '100 mg', unidad: 'mg' },
  'VALPROATO': { conc: '500 mg', unidad: 'mg' },
  'LEVETIRACETAM': { conc: '500 mg', unidad: 'mg' },
  'LAMOTRIGINA': { conc: '100 mg', unidad: 'mg' },
  'GABAPENTINA': { conc: '300 mg', unidad: 'mg' },
  'TOPIRAMATO': { conc: '100 mg', unidad: 'mg' },

  // Corticoides
  'PREDNISONA': { conc: '50 mg', unidad: 'mg' },
  'PREDNISOLONA': { conc: '5 mg', unidad: 'mg' },
  'DEXAMETASONA': { conc: '4 mg', unidad: 'mg' },
  'HIDROCORTISONA': { conc: '100 mg', unidad: 'mg' },
  'BETAMETASONA': { conc: '4 mg', unidad: 'mg' },
  'METILPREDNISOLONA': { conc: '40 mg', unidad: 'mg' },

  // Anticoagulantes
  'WARFARINA': { conc: '5 mg', unidad: 'mg' },
  'ENOXAPARINA': { conc: '40 mg', unidad: 'mg' },
  'HEPARINA': { conc: '5000 UI/ml', unidad: 'UI/ml' },
  'RIVAROXABAN': { conc: '20 mg', unidad: 'mg' },
  'APIXABAN': { conc: '5 mg', unidad: 'mg' },
  'CLOPIDOGREL': { conc: '75 mg', unidad: 'mg' },

  // Broncodilatadores
  'SALBUTAMOL': { conc: '100 mcg/dosis', unidad: 'mcg/dosis' },
  'BECLOMETASONA': { conc: '250 mcg/dosis', unidad: 'mcg/dosis' },
  'BUDESONIDA': { conc: '200 mcg/dosis', unidad: 'mcg/dosis' },
  'FLUTICASONA': { conc: '250 mcg/dosis', unidad: 'mcg/dosis' },
  'TIOTROPIO': { conc: '18 mcg', unidad: 'mcg' },
  'IPRATROPIO': { conc: '20 mcg/dosis', unidad: 'mcg/dosis' },
  'MONTELUKAST': { conc: '10 mg', unidad: 'mg' },
  'TEOFILINA': { conc: '200 mg', unidad: 'mg' },
  'AMINOFILINA': { conc: '250 mg', unidad: 'mg' },

  // Tiroides
  'LEVOTIROXINA': { conc: '100 mcg', unidad: 'mcg' },
  'METIMAZOL': { conc: '5 mg', unidad: 'mg' },

  // Otros comunes
  'ÁCIDO FÓLICO': { conc: '1 mg', unidad: 'mg' },
  'HIERRO': { conc: '100 mg', unidad: 'mg' },
  'CALCIO': { conc: '600 mg', unidad: 'mg' },
  'VITAMINA D': { conc: '1000 UI', unidad: 'UI' },
  'VITAMINA B12': { conc: '1000 mcg', unidad: 'mcg' },
  'ALOPURINOL': { conc: '300 mg', unidad: 'mg' },
  'COLCHICINA': { conc: '0.5 mg', unidad: 'mg' },
};

async function agregarConcentracionesComunes() {
  console.log('=== AGREGANDO CONCENTRACIONES A MEDICAMENTOS GENÉRICOS ===\n');

  let actualizados = 0;

  for (const [nombre, datos] of Object.entries(CONCENTRACIONES_COMUNES)) {
    // Buscar producto exacto o que contenga el nombre
    const producto = await prisma.producto.findFirst({
      where: {
        nombre: nombre,
        OR: [
          { concentracion: null },
          { concentracion: '' }
        ]
      }
    });

    if (producto) {
      await prisma.producto.update({
        where: { id: producto.id },
        data: {
          concentracion: datos.conc,
          unidadMedida: datos.unidad
        }
      });
      actualizados++;
      console.log(`  ✓ ${nombre} -> ${datos.conc}`);
    }
  }

  console.log('\n=== RESUMEN ===');
  console.log('Productos actualizados:', actualizados);

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

agregarConcentracionesComunes();
