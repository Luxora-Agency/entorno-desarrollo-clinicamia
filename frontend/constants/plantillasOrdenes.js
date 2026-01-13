/**
 * Plantillas de órdenes con códigos CUPS (Colombia)
 * Clasificación Única de Procedimientos en Salud
 */

export const PLANTILLAS_ORDENES = [
  // Endocrinología
  {
    id: 'perfil-tiroideo',
    nombre: 'Perfil Tiroideo Completo',
    categoria: 'Endocrinología',
    color: 'purple',
    examenes: [
      { codigoCups: '903841', nombre: 'TSH (Hormona Estimulante de la Tiroides)' },
      { codigoCups: '903842', nombre: 'T4 Libre (Tiroxina Libre)' },
      { codigoCups: '903840', nombre: 'T3 Total (Triyodotironina)' },
      { codigoCups: '903856', nombre: 'Tiroglobulina' },
      { codigoCups: '906914', nombre: 'Anticuerpos Antitiroglobulina' },
      { codigoCups: '906913', nombre: 'Anticuerpos Antiperoxidasa Tiroidea' }
    ]
  },
  {
    id: 'perfil-tiroideo-basico',
    nombre: 'Perfil Tiroideo Básico',
    categoria: 'Endocrinología',
    color: 'purple',
    examenes: [
      { codigoCups: '903841', nombre: 'TSH' },
      { codigoCups: '903842', nombre: 'T4 Libre' }
    ]
  },
  {
    id: 'diabetes-control',
    nombre: 'Control de Diabetes',
    categoria: 'Endocrinología',
    color: 'purple',
    examenes: [
      { codigoCups: '903426', nombre: 'Glucosa en Ayunas' },
      { codigoCups: '903427', nombre: 'Hemoglobina Glicosilada (HbA1c)' },
      { codigoCups: '903825', nombre: 'Creatinina' },
      { codigoCups: '907106', nombre: 'Microalbuminuria' }
    ]
  },

  // Endocrinología Pediátrica
  {
    id: 'endocrino-pediatrico-crecimiento',
    nombre: 'Evaluación de Crecimiento Pediátrico',
    categoria: 'Endocrinología',
    color: 'purple',
    examenes: [
      { codigoCups: '904909', nombre: 'Hormona del Crecimiento (GH) Basal' },
      { codigoCups: '904910', nombre: 'IGF-1 (Somatomedina C)' },
      { codigoCups: '904911', nombre: 'IGFBP-3 (Proteína Ligadora de IGF)' },
      { codigoCups: '903841', nombre: 'TSH' },
      { codigoCups: '903842', nombre: 'T4 Libre' },
      { codigoCups: '871010', nombre: 'Rx Edad Ósea (Mano y Muñeca Izquierda)' }
    ]
  },
  {
    id: 'endocrino-pediatrico-tiroides',
    nombre: 'Perfil Tiroideo Pediátrico',
    categoria: 'Endocrinología',
    color: 'purple',
    examenes: [
      { codigoCups: '903841', nombre: 'TSH' },
      { codigoCups: '903842', nombre: 'T4 Libre' },
      { codigoCups: '903840', nombre: 'T3 Total' },
      { codigoCups: '906913', nombre: 'Anticuerpos Antiperoxidasa (Anti-TPO)' },
      { codigoCups: '906914', nombre: 'Anticuerpos Antitiroglobulina' },
      { codigoCups: '881501', nombre: 'Ecografía de Tiroides' }
    ]
  },
  {
    id: 'endocrino-pediatrico-pubertad',
    nombre: 'Evaluación Pubertad Precoz/Tardía',
    categoria: 'Endocrinología',
    color: 'purple',
    examenes: [
      { codigoCups: '904903', nombre: 'FSH' },
      { codigoCups: '904904', nombre: 'LH' },
      { codigoCups: '904916', nombre: 'Estradiol' },
      { codigoCups: '904920', nombre: 'Testosterona Total' },
      { codigoCups: '904919', nombre: 'DHEA-S (Sulfato de Dehidroepiandrosterona)' },
      { codigoCups: '904912', nombre: '17-OH Progesterona' },
      { codigoCups: '871010', nombre: 'Rx Edad Ósea' }
    ]
  },
  {
    id: 'endocrino-pediatrico-suprarrenal',
    nombre: 'Función Suprarrenal Pediátrica',
    categoria: 'Endocrinología',
    color: 'purple',
    examenes: [
      { codigoCups: '904905', nombre: 'Cortisol AM (8:00 am)' },
      { codigoCups: '904906', nombre: 'ACTH' },
      { codigoCups: '904919', nombre: 'DHEA-S' },
      { codigoCups: '904912', nombre: '17-OH Progesterona' },
      { codigoCups: '903861', nombre: 'Sodio' },
      { codigoCups: '903858', nombre: 'Potasio' },
      { codigoCups: '903426', nombre: 'Glucosa en Ayunas' }
    ]
  },
  {
    id: 'endocrino-pediatrico-diabetes',
    nombre: 'Diabetes Pediátrica - Diagnóstico',
    categoria: 'Endocrinología',
    color: 'purple',
    examenes: [
      { codigoCups: '903426', nombre: 'Glucosa en Ayunas' },
      { codigoCups: '903427', nombre: 'Hemoglobina Glicosilada (HbA1c)' },
      { codigoCups: '903430', nombre: 'Curva de Tolerancia a la Glucosa' },
      { codigoCups: '904907', nombre: 'Insulina Basal' },
      { codigoCups: '904908', nombre: 'Péptido C' },
      { codigoCups: '906915', nombre: 'Anticuerpos Anti-GAD' },
      { codigoCups: '906916', nombre: 'Anticuerpos Anti-Insulina (IAA)' }
    ]
  },
  {
    id: 'endocrino-pediatrico-obesidad',
    nombre: 'Evaluación Obesidad Pediátrica',
    categoria: 'Endocrinología',
    color: 'purple',
    examenes: [
      { codigoCups: '903426', nombre: 'Glucosa en Ayunas' },
      { codigoCups: '904907', nombre: 'Insulina Basal' },
      { codigoCups: '903818', nombre: 'Colesterol Total' },
      { codigoCups: '903815', nombre: 'HDL Colesterol' },
      { codigoCups: '903816', nombre: 'LDL Colesterol' },
      { codigoCups: '903868', nombre: 'Triglicéridos' },
      { codigoCups: '903841', nombre: 'TSH' },
      { codigoCups: '903835', nombre: 'TGO (AST)' },
      { codigoCups: '903836', nombre: 'TGP (ALT)' },
      { codigoCups: '881302', nombre: 'Ecografía Hepática' }
    ]
  },
  {
    id: 'endocrino-pediatrico-metabolismo-oseo',
    nombre: 'Metabolismo Óseo Pediátrico',
    categoria: 'Endocrinología',
    color: 'purple',
    examenes: [
      { codigoCups: '903814', nombre: 'Calcio Sérico' },
      { codigoCups: '903824', nombre: 'Fósforo' },
      { codigoCups: '903823', nombre: 'Fosfatasa Alcalina' },
      { codigoCups: '904913', nombre: 'PTH (Hormona Paratiroidea)' },
      { codigoCups: '903874', nombre: 'Vitamina D (25-OH)' },
      { codigoCups: '903849', nombre: 'Magnesio' }
    ]
  },
  {
    id: 'endocrino-pediatrico-tamizaje-neonatal',
    nombre: 'Tamizaje Neonatal Ampliado',
    categoria: 'Endocrinología',
    color: 'purple',
    examenes: [
      { codigoCups: '903841', nombre: 'TSH Neonatal' },
      { codigoCups: '904912', nombre: '17-OH Progesterona Neonatal' },
      { codigoCups: '903426', nombre: 'Glucosa' },
      { codigoCups: '906801', nombre: 'Galactosa (Galactosemia)' },
      { codigoCups: '903823', nombre: 'Biotinidasa' }
    ]
  },

  // Laboratorio General
  {
    id: 'perfil-lipidico',
    nombre: 'Perfil Lipídico',
    categoria: 'Laboratorio General',
    color: 'blue',
    examenes: [
      { codigoCups: '903818', nombre: 'Colesterol Total' },
      { codigoCups: '903815', nombre: 'HDL Colesterol' },
      { codigoCups: '903816', nombre: 'LDL Colesterol (Calculado)' },
      { codigoCups: '903868', nombre: 'Triglicéridos' },
      { codigoCups: '903817', nombre: 'VLDL Colesterol' }
    ]
  },
  {
    id: 'funcion-renal',
    nombre: 'Función Renal',
    categoria: 'Laboratorio General',
    color: 'blue',
    examenes: [
      { codigoCups: '903825', nombre: 'Creatinina' },
      { codigoCups: '903809', nombre: 'BUN (Nitrógeno Ureico)' },
      { codigoCups: '903856', nombre: 'Ácido Úrico' },
      { codigoCups: '903895', nombre: 'TFG (Tasa Filtración Glomerular)' }
    ]
  },
  {
    id: 'funcion-hepatica',
    nombre: 'Función Hepática',
    categoria: 'Laboratorio General',
    color: 'blue',
    examenes: [
      { codigoCups: '903835', nombre: 'TGO (AST)' },
      { codigoCups: '903836', nombre: 'TGP (ALT)' },
      { codigoCups: '903808', nombre: 'Bilirrubina Total' },
      { codigoCups: '903807', nombre: 'Bilirrubina Directa' },
      { codigoCups: '903823', nombre: 'Fosfatasa Alcalina' },
      { codigoCups: '903424', nombre: 'GGT (Gamma Glutamil Transferasa)' },
      { codigoCups: '903801', nombre: 'Albúmina' }
    ]
  },
  {
    id: 'electrolitos',
    nombre: 'Electrolitos Séricos',
    categoria: 'Laboratorio General',
    color: 'blue',
    examenes: [
      { codigoCups: '903861', nombre: 'Sodio' },
      { codigoCups: '903858', nombre: 'Potasio' },
      { codigoCups: '903819', nombre: 'Cloro' },
      { codigoCups: '903814', nombre: 'Calcio' },
      { codigoCups: '903849', nombre: 'Magnesio' },
      { codigoCups: '903824', nombre: 'Fósforo' }
    ]
  },

  // Hematología
  {
    id: 'hemograma-completo',
    nombre: 'Hemograma Completo',
    categoria: 'Hematología',
    color: 'red',
    examenes: [
      { codigoCups: '902210', nombre: 'Hemograma IV (Automatizado)' }
    ]
  },
  {
    id: 'coagulacion',
    nombre: 'Perfil de Coagulación',
    categoria: 'Hematología',
    color: 'red',
    examenes: [
      { codigoCups: '902049', nombre: 'Tiempo de Protrombina (PT)' },
      { codigoCups: '902050', nombre: 'Tiempo de Tromboplastina (PTT)' },
      { codigoCups: '902045', nombre: 'INR' },
      { codigoCups: '902027', nombre: 'Fibrinógeno' }
    ]
  },
  {
    id: 'anemia',
    nombre: 'Perfil de Anemia',
    categoria: 'Hematología',
    color: 'red',
    examenes: [
      { codigoCups: '902210', nombre: 'Hemograma IV' },
      { codigoCups: '903829', nombre: 'Hierro Sérico' },
      { codigoCups: '903822', nombre: 'Ferritina' },
      { codigoCups: '903869', nombre: 'Transferrina' },
      { codigoCups: '903898', nombre: 'Reticulocitos' },
      { codigoCups: '903873', nombre: 'Vitamina B12' },
      { codigoCups: '903801', nombre: 'Ácido Fólico' }
    ]
  },

  // Uroanálisis
  {
    id: 'parcial-orina',
    nombre: 'Uroanálisis Completo',
    categoria: 'Uroanálisis',
    color: 'yellow',
    examenes: [
      { codigoCups: '907106', nombre: 'Parcial de Orina' },
      { codigoCups: '901309', nombre: 'Urocultivo' }
    ]
  },

  // Cardiología
  {
    id: 'riesgo-cardiovascular',
    nombre: 'Riesgo Cardiovascular',
    categoria: 'Cardiología',
    color: 'pink',
    examenes: [
      { codigoCups: '903818', nombre: 'Colesterol Total' },
      { codigoCups: '903815', nombre: 'HDL Colesterol' },
      { codigoCups: '903816', nombre: 'LDL Colesterol' },
      { codigoCups: '903868', nombre: 'Triglicéridos' },
      { codigoCups: '903857', nombre: 'Proteína C Reactiva de Alta Sensibilidad' },
      { codigoCups: '903828', nombre: 'Homocisteína' }
    ]
  },
  {
    id: 'marcadores-cardiacos',
    nombre: 'Marcadores Cardíacos',
    categoria: 'Cardiología',
    color: 'pink',
    examenes: [
      { codigoCups: '903870', nombre: 'Troponina I' },
      { codigoCups: '903821', nombre: 'CK-MB' },
      { codigoCups: '903859', nombre: 'Pro-BNP' }
    ]
  },

  // Inmunología
  {
    id: 'perfil-autoinmune',
    nombre: 'Perfil Autoinmune Básico',
    categoria: 'Inmunología',
    color: 'green',
    examenes: [
      { codigoCups: '906801', nombre: 'Anticuerpos Antinucleares (ANA)' },
      { codigoCups: '906802', nombre: 'Factor Reumatoideo' },
      { codigoCups: '903857', nombre: 'Proteína C Reactiva (PCR)' },
      { codigoCups: '903872', nombre: 'Velocidad de Sedimentación (VSG)' }
    ]
  },
  {
    id: 'artritis',
    nombre: 'Perfil Artritis',
    categoria: 'Inmunología',
    color: 'green',
    examenes: [
      { codigoCups: '906802', nombre: 'Factor Reumatoideo' },
      { codigoCups: '906810', nombre: 'Anti-CCP (Anticuerpos Antipéptido Citrulinado)' },
      { codigoCups: '903856', nombre: 'Ácido Úrico' },
      { codigoCups: '903857', nombre: 'Proteína C Reactiva' },
      { codigoCups: '903872', nombre: 'VSG' }
    ]
  },

  // Infeccioso
  {
    id: 'ets-basico',
    nombre: 'Panel ETS Básico',
    categoria: 'Infeccioso',
    color: 'orange',
    examenes: [
      { codigoCups: '906249', nombre: 'VIH (ELISA)' },
      { codigoCups: '906210', nombre: 'VDRL (Sífilis)' },
      { codigoCups: '906225', nombre: 'Hepatitis B (HBsAg)' },
      { codigoCups: '906222', nombre: 'Hepatitis C (Anti-VHC)' }
    ]
  },
  {
    id: 'hepatitis-completo',
    nombre: 'Panel Hepatitis Completo',
    categoria: 'Infeccioso',
    color: 'orange',
    examenes: [
      { codigoCups: '906223', nombre: 'Hepatitis A (IgM Anti-HAV)' },
      { codigoCups: '906225', nombre: 'Hepatitis B (HBsAg)' },
      { codigoCups: '906226', nombre: 'Anti-HBs (Anticuerpos)' },
      { codigoCups: '906227', nombre: 'Anti-HBc Total' },
      { codigoCups: '906222', nombre: 'Hepatitis C (Anti-VHC)' }
    ]
  },

  // Hormonas
  {
    id: 'hormonas-femeninas',
    nombre: 'Perfil Hormonal Femenino',
    categoria: 'Hormonas',
    color: 'fuchsia',
    examenes: [
      { codigoCups: '904903', nombre: 'FSH' },
      { codigoCups: '904904', nombre: 'LH' },
      { codigoCups: '904916', nombre: 'Estradiol' },
      { codigoCups: '904917', nombre: 'Progesterona' },
      { codigoCups: '904918', nombre: 'Prolactina' },
      { codigoCups: '903841', nombre: 'TSH' }
    ]
  },
  {
    id: 'hormonas-masculinas',
    nombre: 'Perfil Hormonal Masculino',
    categoria: 'Hormonas',
    color: 'fuchsia',
    examenes: [
      { codigoCups: '904920', nombre: 'Testosterona Total' },
      { codigoCups: '904921', nombre: 'Testosterona Libre' },
      { codigoCups: '904903', nombre: 'FSH' },
      { codigoCups: '904904', nombre: 'LH' },
      { codigoCups: '904901', nombre: 'PSA Total' },
      { codigoCups: '904902', nombre: 'PSA Libre' }
    ]
  },

  // Prenatal
  {
    id: 'control-prenatal',
    nombre: 'Control Prenatal Básico',
    categoria: 'Prenatal',
    color: 'cyan',
    examenes: [
      { codigoCups: '902210', nombre: 'Hemograma IV' },
      { codigoCups: '901214', nombre: 'Grupo Sanguíneo y Rh' },
      { codigoCups: '903426', nombre: 'Glucosa en Ayunas' },
      { codigoCups: '907106', nombre: 'Parcial de Orina' },
      { codigoCups: '901309', nombre: 'Urocultivo' },
      { codigoCups: '906249', nombre: 'VIH' },
      { codigoCups: '906210', nombre: 'VDRL' },
      { codigoCups: '906225', nombre: 'Hepatitis B' }
    ]
  },
  {
    id: 'tamizaje-prenatal',
    nombre: 'Tamizaje Prenatal',
    categoria: 'Prenatal',
    color: 'cyan',
    examenes: [
      { codigoCups: '906315', nombre: 'Toxoplasma IgG' },
      { codigoCups: '906316', nombre: 'Toxoplasma IgM' },
      { codigoCups: '906204', nombre: 'Rubéola IgG' },
      { codigoCups: '906205', nombre: 'Rubéola IgM' },
      { codigoCups: '906311', nombre: 'CMV IgG' },
      { codigoCups: '906312', nombre: 'CMV IgM' }
    ]
  },

  // Imagenología
  {
    id: 'rx-torax',
    nombre: 'Radiografía de Tórax',
    categoria: 'Imagenología',
    color: 'slate',
    examenes: [
      { codigoCups: '871121', nombre: 'Radiografía de Tórax PA y Lateral' }
    ]
  },
  {
    id: 'rx-columna',
    nombre: 'Radiografías de Columna',
    categoria: 'Imagenología',
    color: 'slate',
    examenes: [
      { codigoCups: '871010', nombre: 'Rx Columna Cervical' },
      { codigoCups: '871030', nombre: 'Rx Columna Dorsal' },
      { codigoCups: '871050', nombre: 'Rx Columna Lumbosacra' }
    ]
  },
  {
    id: 'eco-abdominal',
    nombre: 'Ecografía Abdominal',
    categoria: 'Imagenología',
    color: 'slate',
    examenes: [
      { codigoCups: '881302', nombre: 'Ecografía de Abdomen Total' }
    ]
  },
  {
    id: 'eco-obstetrica',
    nombre: 'Ecografía Obstétrica',
    categoria: 'Imagenología',
    color: 'slate',
    examenes: [
      { codigoCups: '881332', nombre: 'Ecografía Obstétrica con Perfil Biofísico' }
    ]
  },

  // Chequeo Ejecutivo
  {
    id: 'chequeo-ejecutivo-completo',
    nombre: 'Chequeo Ejecutivo Completo',
    categoria: 'Chequeo Integral',
    color: 'indigo',
    examenes: [
      { codigoCups: '902210', nombre: 'Hemograma IV' },
      { codigoCups: '903426', nombre: 'Glucosa en Ayunas' },
      { codigoCups: '903427', nombre: 'Hemoglobina Glicosilada' },
      { codigoCups: '903825', nombre: 'Creatinina' },
      { codigoCups: '903809', nombre: 'BUN' },
      { codigoCups: '903856', nombre: 'Ácido Úrico' },
      { codigoCups: '903818', nombre: 'Colesterol Total' },
      { codigoCups: '903815', nombre: 'HDL Colesterol' },
      { codigoCups: '903816', nombre: 'LDL Colesterol' },
      { codigoCups: '903868', nombre: 'Triglicéridos' },
      { codigoCups: '903835', nombre: 'TGO' },
      { codigoCups: '903836', nombre: 'TGP' },
      { codigoCups: '903841', nombre: 'TSH' },
      { codigoCups: '907106', nombre: 'Parcial de Orina' },
      { codigoCups: '871121', nombre: 'Rx Tórax' }
    ]
  }
];

// Agrupar plantillas por categoría
export const PLANTILLAS_POR_CATEGORIA = PLANTILLAS_ORDENES.reduce((acc, plantilla) => {
  if (!acc[plantilla.categoria]) {
    acc[plantilla.categoria] = [];
  }
  acc[plantilla.categoria].push(plantilla);
  return acc;
}, {});

// Obtener todas las categorías
export const CATEGORIAS = Object.keys(PLANTILLAS_POR_CATEGORIA);

// Colores por categoría
export const COLORES_CATEGORIA = {
  'Endocrinología': 'purple',
  'Laboratorio General': 'blue',
  'Hematología': 'red',
  'Uroanálisis': 'yellow',
  'Cardiología': 'pink',
  'Inmunología': 'green',
  'Infeccioso': 'orange',
  'Hormonas': 'fuchsia',
  'Prenatal': 'cyan',
  'Imagenología': 'slate',
  'Chequeo Integral': 'indigo'
};
