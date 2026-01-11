const prisma = require('../db/prisma');

// ==========================================
// DATA: CUPS (Clasificación Única de Procedimientos en Salud)
// ==========================================
const cupsData = [
  // --- CONSULTA EXTERNA (GENERAL Y ESPECIALIZADA) ---
  { codigo: '890201', descripcion: 'CONSULTA DE PRIMERA VEZ POR MEDICINA GENERAL', seccion: 'CONSULTA', grupo: 'Consulta Externa' },
  { codigo: '890301', descripcion: 'CONSULTA DE CONTROL O DE SEGUIMIENTO POR MEDICINA GENERAL', seccion: 'CONSULTA', grupo: 'Consulta Externa' },
  { codigo: '890202', descripcion: 'CONSULTA DE PRIMERA VEZ POR MEDICINA ESPECIALIZADA', seccion: 'CONSULTA', grupo: 'Consulta Externa' },
  { codigo: '890302', descripcion: 'CONSULTA DE CONTROL O DE SEGUIMIENTO POR MEDICINA ESPECIALIZADA', seccion: 'CONSULTA', grupo: 'Consulta Externa' },
  { codigo: '890203', descripcion: 'CONSULTA DE PRIMERA VEZ POR ODONTOLOGIA GENERAL', seccion: 'CONSULTA', grupo: 'Consulta Externa' },
  { codigo: '890303', descripcion: 'CONSULTA DE CONTROL O DE SEGUIMIENTO POR ODONTOLOGIA GENERAL', seccion: 'CONSULTA', grupo: 'Consulta Externa' },
  { codigo: '890208', descripcion: 'CONSULTA DE PRIMERA VEZ POR PSICOLOGIA', seccion: 'CONSULTA', grupo: 'Consulta Externa' },
  { codigo: '890308', descripcion: 'CONSULTA DE CONTROL O DE SEGUIMIENTO POR PSICOLOGIA', seccion: 'CONSULTA', grupo: 'Consulta Externa' },
  { codigo: '890205', descripcion: 'CONSULTA DE PRIMERA VEZ POR ENFERMERIA', seccion: 'CONSULTA', grupo: 'Consulta Externa' },
  { codigo: '890305', descripcion: 'CONSULTA DE CONTROL O DE SEGUIMIENTO POR ENFERMERIA', seccion: 'CONSULTA', grupo: 'Consulta Externa' },
  { codigo: '890701', descripcion: 'CONSULTA DE URGENCIAS', seccion: 'CONSULTA', grupo: 'Urgencias' },
  { codigo: '890702', descripcion: 'CONSULTA DE TRIAJE', seccion: 'CONSULTA', grupo: 'Urgencias' },

  // --- PROMOCIÓN Y PREVENCIÓN (PYP) ---
  { codigo: '993101', descripcion: 'EDUCACION GRUPAL EN SALUD', seccion: 'PYP', grupo: 'Promoción y Prevención' },
  { codigo: '993102', descripcion: 'EDUCACION INDIVIDUAL EN SALUD', seccion: 'PYP', grupo: 'Promoción y Prevención' },
  { codigo: '993501', descripcion: 'VACUNACION', seccion: 'PYP', grupo: 'Promoción y Prevención' },
  { codigo: '890206', descripcion: 'CONSULTA DE CRECIMIENTO Y DESARROLLO', seccion: 'PYP', grupo: 'Promoción y Prevención' },
  { codigo: '890207', descripcion: 'CONSULTA DE PLANIFICACION FAMILIAR', seccion: 'PYP', grupo: 'Promoción y Prevención' },
  { codigo: '690101', descripcion: 'ATENCION DEL PARTO VAGINAL', seccion: 'PYP', grupo: 'Atención al Parto' },

  // --- LABORATORIO CLÍNICO (Listado Base) ---
  // Hematología
  { codigo: '903101', descripcion: 'Cuadro hemático', seccion: 'LABORATORIO CLINICO', grupo: 'Hematología' },
  { codigo: '903102', descripcion: 'Hemoglobina', seccion: 'LABORATORIO CLINICO', grupo: 'Hematología' },
  { codigo: '903103', descripcion: 'Hematocrito', seccion: 'LABORATORIO CLINICO', grupo: 'Hematología' },
  { codigo: '903104', descripcion: 'Recuento de leucocitos', seccion: 'LABORATORIO CLINICO', grupo: 'Hematología' },
  { codigo: '903105', descripcion: 'Recuento de plaquetas', seccion: 'LABORATORIO CLINICO', grupo: 'Hematología' },
  { codigo: '903106', descripcion: 'Velocidad de sedimentación globular (VSG)', seccion: 'LABORATORIO CLINICO', grupo: 'Hematología' },
  { codigo: '903107', descripcion: 'Frotis de sangre periférica', seccion: 'LABORATORIO CLINICO', grupo: 'Hematología' },
  // Química Sanguínea
  { codigo: '903201', descripcion: 'Glucosa en sangre', seccion: 'LABORATORIO CLINICO', grupo: 'Química Sanguínea' },
  { codigo: '903202', descripcion: 'Glucosa postprandial', seccion: 'LABORATORIO CLINICO', grupo: 'Química Sanguínea' },
  { codigo: '903203', descripcion: 'Hemoglobina glicosilada (HbA1c)', seccion: 'LABORATORIO CLINICO', grupo: 'Química Sanguínea' },
  { codigo: '903204', descripcion: 'Urea', seccion: 'LABORATORIO CLINICO', grupo: 'Química Sanguínea' },
  { codigo: '903205', descripcion: 'Creatinina', seccion: 'LABORATORIO CLINICO', grupo: 'Química Sanguínea' },
  { codigo: '903206', descripcion: 'Ácido úrico', seccion: 'LABORATORIO CLINICO', grupo: 'Química Sanguínea' },
  { codigo: '903207', descripcion: 'Colesterol total', seccion: 'LABORATORIO CLINICO', grupo: 'Química Sanguínea' },
  { codigo: '903208', descripcion: 'Colesterol HDL', seccion: 'LABORATORIO CLINICO', grupo: 'Química Sanguínea' },
  { codigo: '903209', descripcion: 'Colesterol LDL', seccion: 'LABORATORIO CLINICO', grupo: 'Química Sanguínea' },
  { codigo: '903210', descripcion: 'Triglicéridos', seccion: 'LABORATORIO CLINICO', grupo: 'Química Sanguínea' },
  { codigo: '903211', descripcion: 'Bilirrubina total', seccion: 'LABORATORIO CLINICO', grupo: 'Química Sanguínea' },
  { codigo: '903212', descripcion: 'Bilirrubina directa', seccion: 'LABORATORIO CLINICO', grupo: 'Química Sanguínea' },
  { codigo: '903213', descripcion: 'Bilirrubina indirecta', seccion: 'LABORATORIO CLINICO', grupo: 'Química Sanguínea' },
  // Enzimas y Perfil Hepático
  { codigo: '903301', descripcion: 'AST (TGO)', seccion: 'LABORATORIO CLINICO', grupo: 'Enzimas y Perfil Hepático' },
  { codigo: '903302', descripcion: 'ALT (TGP)', seccion: 'LABORATORIO CLINICO', grupo: 'Enzimas y Perfil Hepático' },
  { codigo: '903303', descripcion: 'Fosfatasa alcalina', seccion: 'LABORATORIO CLINICO', grupo: 'Enzimas y Perfil Hepático' },
  { codigo: '903304', descripcion: 'GGT', seccion: 'LABORATORIO CLINICO', grupo: 'Enzimas y Perfil Hepático' },
  { codigo: '903305', descripcion: 'Albúmina', seccion: 'LABORATORIO CLINICO', grupo: 'Enzimas y Perfil Hepático' },
  { codigo: '903306', descripcion: 'Proteínas totales', seccion: 'LABORATORIO CLINICO', grupo: 'Enzimas y Perfil Hepático' },
  // Perfil Renal
  { codigo: '903401', descripcion: 'Creatinina sérica', seccion: 'LABORATORIO CLINICO', grupo: 'Perfil Renal' },
  { codigo: '903402', descripcion: 'Urea', seccion: 'LABORATORIO CLINICO', grupo: 'Perfil Renal' },
  { codigo: '903403', descripcion: 'Depuración de creatinina', seccion: 'LABORATORIO CLINICO', grupo: 'Perfil Renal' },
  { codigo: '903404', descripcion: 'Microalbuminuria', seccion: 'LABORATORIO CLINICO', grupo: 'Perfil Renal' },
  // Inmunología / Serología
  { codigo: '904101', descripcion: 'VDRL', seccion: 'LABORATORIO CLINICO', grupo: 'Inmunología / Serología' },
  { codigo: '904102', descripcion: 'VIH 1 y 2', seccion: 'LABORATORIO CLINICO', grupo: 'Inmunología / Serología' },
  { codigo: '904103', descripcion: 'HBsAg', seccion: 'LABORATORIO CLINICO', grupo: 'Inmunología / Serología' },
  { codigo: '904104', descripcion: 'Anti-HBs', seccion: 'LABORATORIO CLINICO', grupo: 'Inmunología / Serología' },
  { codigo: '904105', descripcion: 'Anti-HCV', seccion: 'LABORATORIO CLINICO', grupo: 'Inmunología / Serología' },
  { codigo: '904106', descripcion: 'Prueba de embarazo (BHCG)', seccion: 'LABORATORIO CLINICO', grupo: 'Inmunología / Serología' },
  { codigo: '904107', descripcion: 'PCR C reactiva', seccion: 'LABORATORIO CLINICO', grupo: 'Inmunología / Serología' },
  // Hormonas
  { codigo: '904201', descripcion: 'TSH', seccion: 'LABORATORIO CLINICO', grupo: 'Hormonas' },
  { codigo: '904202', descripcion: 'T4 libre', seccion: 'LABORATORIO CLINICO', grupo: 'Hormonas' },
  { codigo: '904203', descripcion: 'T3', seccion: 'LABORATORIO CLINICO', grupo: 'Hormonas' },
  { codigo: '904204', descripcion: 'Insulina', seccion: 'LABORATORIO CLINICO', grupo: 'Hormonas' },
  { codigo: '904205', descripcion: 'Cortisol', seccion: 'LABORATORIO CLINICO', grupo: 'Hormonas' },
  { codigo: '904206', descripcion: 'Prolactina', seccion: 'LABORATORIO CLINICO', grupo: 'Hormonas' },
  { codigo: '904207', descripcion: 'PSA total', seccion: 'LABORATORIO CLINICO', grupo: 'Hormonas' },
  { codigo: '904208', descripcion: 'PSA libre', seccion: 'LABORATORIO CLINICO', grupo: 'Hormonas' },
  // Electrolitos
  { codigo: '903501', descripcion: 'Sodio', seccion: 'LABORATORIO CLINICO', grupo: 'Electrolitos' },
  { codigo: '903502', descripcion: 'Potasio', seccion: 'LABORATORIO CLINICO', grupo: 'Electrolitos' },
  { codigo: '903503', descripcion: 'Cloro', seccion: 'LABORATORIO CLINICO', grupo: 'Electrolitos' },
  { codigo: '903504', descripcion: 'Calcio', seccion: 'LABORATORIO CLINICO', grupo: 'Electrolitos' },
  { codigo: '903505', descripcion: 'Magnesio', seccion: 'LABORATORIO CLINICO', grupo: 'Electrolitos' },
  // Uroanálisis y Coprológico
  { codigo: '905101', descripcion: 'Parcial de orina', seccion: 'LABORATORIO CLINICO', grupo: 'Uroanálisis y Coprológico' },
  { codigo: '905102', descripcion: 'Urocultivo', seccion: 'LABORATORIO CLINICO', grupo: 'Uroanálisis y Coprológico' },
  { codigo: '905103', descripcion: 'Coprológico', seccion: 'LABORATORIO CLINICO', grupo: 'Uroanálisis y Coprológico' },
  { codigo: '905104', descripcion: 'Coprocultivo', seccion: 'LABORATORIO CLINICO', grupo: 'Uroanálisis y Coprológico' },
  { codigo: '905105', descripcion: 'Sangre oculta en heces', seccion: 'LABORATORIO CLINICO', grupo: 'Uroanálisis y Coprológico' },
  // Coagulación
  { codigo: '903601', descripcion: 'TP', seccion: 'LABORATORIO CLINICO', grupo: 'Coagulación' },
  { codigo: '903602', descripcion: 'TPT', seccion: 'LABORATORIO CLINICO', grupo: 'Coagulación' },
  { codigo: '903603', descripcion: 'INR', seccion: 'LABORATORIO CLINICO', grupo: 'Coagulación' },
  { codigo: '903604', descripcion: 'Fibrinógeno', seccion: 'LABORATORIO CLINICO', grupo: 'Coagulación' },

  // --- IMAGENOLOGÍA ---
  // Radiografía
  { codigo: '870101', descripcion: 'Radiografía de tórax simple', seccion: 'IMAGENOLOGIA', grupo: 'Radiografía (RX)' },
  { codigo: '870102', descripcion: 'Radiografía de tórax AP y lateral', seccion: 'IMAGENOLOGIA', grupo: 'Radiografía (RX)' },
  { codigo: '870103', descripcion: 'Radiografía de abdomen simple', seccion: 'IMAGENOLOGIA', grupo: 'Radiografía (RX)' },
  { codigo: '870104', descripcion: 'Radiografía de columna cervical', seccion: 'IMAGENOLOGIA', grupo: 'Radiografía (RX)' },
  { codigo: '870105', descripcion: 'Radiografía de columna dorsal', seccion: 'IMAGENOLOGIA', grupo: 'Radiografía (RX)' },
  { codigo: '870106', descripcion: 'Radiografía de columna lumbar', seccion: 'IMAGENOLOGIA', grupo: 'Radiografía (RX)' },
  { codigo: '870107', descripcion: 'Radiografía de pelvis', seccion: 'IMAGENOLOGIA', grupo: 'Radiografía (RX)' },
  { codigo: '870108', descripcion: 'Radiografía de cráneo', seccion: 'IMAGENOLOGIA', grupo: 'Radiografía (RX)' },
  { codigo: '870109', descripcion: 'Radiografía de senos paranasales', seccion: 'IMAGENOLOGIA', grupo: 'Radiografía (RX)' },
  { codigo: '870110', descripcion: 'Radiografía de extremidad superior', seccion: 'IMAGENOLOGIA', grupo: 'Radiografía (RX)' },
  { codigo: '870111', descripcion: 'Radiografía de extremidad inferior', seccion: 'IMAGENOLOGIA', grupo: 'Radiografía (RX)' },
  // TAC
  { codigo: '871201', descripcion: 'TAC de cráneo simple', seccion: 'IMAGENOLOGIA', grupo: 'TAC / TC' },
  { codigo: '871202', descripcion: 'TAC de cráneo con contraste', seccion: 'IMAGENOLOGIA', grupo: 'TAC / TC' },
  { codigo: '871203', descripcion: 'TAC de tórax', seccion: 'IMAGENOLOGIA', grupo: 'TAC / TC' },
  { codigo: '871204', descripcion: 'TAC de abdomen', seccion: 'IMAGENOLOGIA', grupo: 'TAC / TC' },
  { codigo: '871205', descripcion: 'TAC de abdomen y pelvis', seccion: 'IMAGENOLOGIA', grupo: 'TAC / TC' },
  { codigo: '871206', descripcion: 'TAC de columna', seccion: 'IMAGENOLOGIA', grupo: 'TAC / TC' },
  { codigo: '871207', descripcion: 'AngioTAC', seccion: 'IMAGENOLOGIA', grupo: 'TAC / TC' },
  { codigo: '871208', descripcion: 'TAC de senos paranasales', seccion: 'IMAGENOLOGIA', grupo: 'TAC / TC' },
  // Resonancia Magnética
  { codigo: '872101', descripcion: 'Resonancia magnética de cráneo', seccion: 'IMAGENOLOGIA', grupo: 'Resonancia Magnética (RM)' },
  { codigo: '872102', descripcion: 'RM cerebral con contraste', seccion: 'IMAGENOLOGIA', grupo: 'Resonancia Magnética (RM)' },
  { codigo: '872103', descripcion: 'RM de columna cervical', seccion: 'IMAGENOLOGIA', grupo: 'Resonancia Magnética (RM)' },
  { codigo: '872104', descripcion: 'RM de columna dorsal', seccion: 'IMAGENOLOGIA', grupo: 'Resonancia Magnética (RM)' },
  { codigo: '872105', descripcion: 'RM de columna lumbar', seccion: 'IMAGENOLOGIA', grupo: 'Resonancia Magnética (RM)' },
  { codigo: '872106', descripcion: 'RM de rodilla', seccion: 'IMAGENOLOGIA', grupo: 'Resonancia Magnética (RM)' },
  { codigo: '872107', descripcion: 'RM de hombro', seccion: 'IMAGENOLOGIA', grupo: 'Resonancia Magnética (RM)' },
  { codigo: '872108', descripcion: 'RM de pelvis', seccion: 'IMAGENOLOGIA', grupo: 'Resonancia Magnética (RM)' },
  // Ecografía
  { codigo: '873101', descripcion: 'Ecografía abdominal total', seccion: 'IMAGENOLOGIA', grupo: 'Ecografía / Ultrasonido' },
  { codigo: '873102', descripcion: 'Ecografía abdominal superior', seccion: 'IMAGENOLOGIA', grupo: 'Ecografía / Ultrasonido' },
  { codigo: '873103', descripcion: 'Ecografía renal', seccion: 'IMAGENOLOGIA', grupo: 'Ecografía / Ultrasonido' },
  { codigo: '873104', descripcion: 'Ecografía pélvica', seccion: 'IMAGENOLOGIA', grupo: 'Ecografía / Ultrasonido' },
  { codigo: '873105', descripcion: 'Ecografía obstétrica', seccion: 'IMAGENOLOGIA', grupo: 'Ecografía / Ultrasonido' },
  { codigo: '873106', descripcion: 'Ecografía transvaginal', seccion: 'IMAGENOLOGIA', grupo: 'Ecografía / Ultrasonido' },
  { codigo: '873107', descripcion: 'Ecografía prostática', seccion: 'IMAGENOLOGIA', grupo: 'Ecografía / Ultrasonido' },
  { codigo: '873108', descripcion: 'Ecografía de tiroides', seccion: 'IMAGENOLOGIA', grupo: 'Ecografía / Ultrasonido' },
  { codigo: '873109', descripcion: 'Ecografía mamaria', seccion: 'IMAGENOLOGIA', grupo: 'Ecografía / Ultrasonido' },
  { codigo: '873110', descripcion: 'Ecografía Doppler arterial', seccion: 'IMAGENOLOGIA', grupo: 'Ecografía / Ultrasonido' },
  { codigo: '873111', descripcion: 'Ecografía Doppler venoso', seccion: 'IMAGENOLOGIA', grupo: 'Ecografía / Ultrasonido' },
  { codigo: '873112', descripcion: 'Doppler carotídeo', seccion: 'IMAGENOLOGIA', grupo: 'Ecografía / Ultrasonido' },
  // Imagenología Cardiovascular
  { codigo: '873201', descripcion: 'Ecocardiograma transtorácico', seccion: 'IMAGENOLOGIA', grupo: 'Imagenología Cardiovascular' },
  { codigo: '873202', descripcion: 'Ecocardiograma Doppler', seccion: 'IMAGENOLOGIA', grupo: 'Imagenología Cardiovascular' },
  { codigo: '873203', descripcion: 'Ecocardiograma transesofágico', seccion: 'IMAGENOLOGIA', grupo: 'Imagenología Cardiovascular' },
  { codigo: '873204', descripcion: 'Prueba de esfuerzo con imagen', seccion: 'IMAGENOLOGIA', grupo: 'Imagenología Cardiovascular' },
  // Medicina Nuclear
  { codigo: '874101', descripcion: 'Gammagrafía ósea', seccion: 'IMAGENOLOGIA', grupo: 'Medicina Nuclear' },
  { codigo: '874102', descripcion: 'Gammagrafía renal', seccion: 'IMAGENOLOGIA', grupo: 'Medicina Nuclear' },
  { codigo: '874103', descripcion: 'Gammagrafía tiroidea', seccion: 'IMAGENOLOGIA', grupo: 'Medicina Nuclear' },
  { codigo: '874104', descripcion: 'PET-CT', seccion: 'IMAGENOLOGIA', grupo: 'Medicina Nuclear' },
  // Mamografía
  { codigo: '875101', descripcion: 'Mamografía bilateral', seccion: 'IMAGENOLOGIA', grupo: 'Mamografía' },
  { codigo: '875102', descripcion: 'Mamografía unilateral', seccion: 'IMAGENOLOGIA', grupo: 'Mamografía' },
  { codigo: '875103', descripcion: 'Mamografía con proyección adicional', seccion: 'IMAGENOLOGIA', grupo: 'Mamografía' },

  // --- PROCEDIMIENTOS QUIRÚRGICOS ---
  // Cirugía General
  { codigo: '430101', descripcion: 'Apendicectomía', seccion: 'PROCEDIMIENTOS QUIRURGICOS', grupo: 'Cirugía General' },
  { codigo: '430102', descripcion: 'Colecistectomía abierta', seccion: 'PROCEDIMIENTOS QUIRURGICOS', grupo: 'Cirugía General' },
  { codigo: '430103', descripcion: 'Colecistectomía laparoscópica', seccion: 'PROCEDIMIENTOS QUIRURGICOS', grupo: 'Cirugía General' },
  { codigo: '430104', descripcion: 'Herniorrafia inguinal', seccion: 'PROCEDIMIENTOS QUIRURGICOS', grupo: 'Cirugía General' },
  { codigo: '430105', descripcion: 'Hernioplastia inguinal', seccion: 'PROCEDIMIENTOS QUIRURGICOS', grupo: 'Cirugía General' },
  { codigo: '430106', descripcion: 'Herniorrafia umbilical', seccion: 'PROCEDIMIENTOS QUIRURGICOS', grupo: 'Cirugía General' },
  { codigo: '430107', descripcion: 'Laparotomía exploratoria', seccion: 'PROCEDIMIENTOS QUIRURGICOS', grupo: 'Cirugía General' },
  { codigo: '430108', descripcion: 'Resección intestinal', seccion: 'PROCEDIMIENTOS QUIRURGICOS', grupo: 'Cirugía General' },
  { codigo: '430109', descripcion: 'Drenaje de absceso', seccion: 'PROCEDIMIENTOS QUIRURGICOS', grupo: 'Cirugía General' },
  { codigo: '430110', descripcion: 'Biopsia quirúrgica', seccion: 'PROCEDIMIENTOS QUIRURGICOS', grupo: 'Cirugía General' },
  // Ginecología
  { codigo: '450101', descripcion: 'Cesárea', seccion: 'PROCEDIMIENTOS QUIRURGICOS', grupo: 'Ginecología y Obstetricia' },
  { codigo: '450102', descripcion: 'Histerectomía abdominal', seccion: 'PROCEDIMIENTOS QUIRURGICOS', grupo: 'Ginecología y Obstetricia' },
  { codigo: '450103', descripcion: 'Histerectomía vaginal', seccion: 'PROCEDIMIENTOS QUIRURGICOS', grupo: 'Ginecología y Obstetricia' },
  { codigo: '450104', descripcion: 'Histerectomía laparoscópica', seccion: 'PROCEDIMIENTOS QUIRURGICOS', grupo: 'Ginecología y Obstetricia' },
  { codigo: '450105', descripcion: 'Legrado uterino', seccion: 'PROCEDIMIENTOS QUIRURGICOS', grupo: 'Ginecología y Obstetricia' },
  { codigo: '450106', descripcion: 'Salpingectomía', seccion: 'PROCEDIMIENTOS QUIRURGICOS', grupo: 'Ginecología y Obstetricia' },
  { codigo: '450107', descripcion: 'Ooforectomía', seccion: 'PROCEDIMIENTOS QUIRURGICOS', grupo: 'Ginecología y Obstetricia' },
  { codigo: '450108', descripcion: 'Ligadura de trompas', seccion: 'PROCEDIMIENTOS QUIRURGICOS', grupo: 'Ginecología y Obstetricia' },
  { codigo: '450109', descripcion: 'Miomectomía', seccion: 'PROCEDIMIENTOS QUIRURGICOS', grupo: 'Ginecología y Obstetricia' },
  { codigo: '450110', descripcion: 'Colporrafia', seccion: 'PROCEDIMIENTOS QUIRURGICOS', grupo: 'Ginecología y Obstetricia' },
  // Cirugía Cardiovascular
  { codigo: '460101', descripcion: 'Cateterismo cardíaco diagnóstico', seccion: 'PROCEDIMIENTOS QUIRURGICOS', grupo: 'Cirugía Cardiovascular' },
  { codigo: '460102', descripcion: 'Angioplastia coronaria', seccion: 'PROCEDIMIENTOS QUIRURGICOS', grupo: 'Cirugía Cardiovascular' },
  { codigo: '460103', descripcion: 'Colocación de stent coronario', seccion: 'PROCEDIMIENTOS QUIRURGICOS', grupo: 'Cirugía Cardiovascular' },
  { codigo: '460104', descripcion: 'Marcapasos definitivo', seccion: 'PROCEDIMIENTOS QUIRURGICOS', grupo: 'Cirugía Cardiovascular' },
  { codigo: '460105', descripcion: 'Cirugía de bypass coronario', seccion: 'PROCEDIMIENTOS QUIRURGICOS', grupo: 'Cirugía Cardiovascular' },
  { codigo: '460106', descripcion: 'Endarterectomía carotídea', seccion: 'PROCEDIMIENTOS QUIRURGICOS', grupo: 'Cirugía Cardiovascular' },
  // Neurocirugía
  { codigo: '470101', descripcion: 'Craneotomía', seccion: 'PROCEDIMIENTOS QUIRURGICOS', grupo: 'Neurocirugía' },
  { codigo: '470102', descripcion: 'Drenaje de hematoma subdural', seccion: 'PROCEDIMIENTOS QUIRURGICOS', grupo: 'Neurocirugía' },
  { codigo: '470103', descripcion: 'Colocación de válvula ventriculoperitoneal', seccion: 'PROCEDIMIENTOS QUIRURGICOS', grupo: 'Neurocirugía' },
  { codigo: '470104', descripcion: 'Laminectomía', seccion: 'PROCEDIMIENTOS QUIRURGICOS', grupo: 'Neurocirugía' },
  { codigo: '470105', descripcion: 'Discectomía lumbar', seccion: 'PROCEDIMIENTOS QUIRURGICOS', grupo: 'Neurocirugía' },
  { codigo: '470106', descripcion: 'Biopsia cerebral', seccion: 'PROCEDIMIENTOS QUIRURGICOS', grupo: 'Neurocirugía' },
  // Ortopedia
  { codigo: '440101', descripcion: 'Reducción cerrada de fractura', seccion: 'PROCEDIMIENTOS QUIRURGICOS', grupo: 'Ortopedia y Traumatología' },
  { codigo: '440102', descripcion: 'Reducción abierta de fractura', seccion: 'PROCEDIMIENTOS QUIRURGICOS', grupo: 'Ortopedia y Traumatología' },
  { codigo: '440103', descripcion: 'Osteosíntesis', seccion: 'PROCEDIMIENTOS QUIRURGICOS', grupo: 'Ortopedia y Traumatología' },
  { codigo: '440104', descripcion: 'Artroscopia de rodilla', seccion: 'PROCEDIMIENTOS QUIRURGICOS', grupo: 'Ortopedia y Traumatología' },
  { codigo: '440105', descripcion: 'Reemplazo total de cadera', seccion: 'PROCEDIMIENTOS QUIRURGICOS', grupo: 'Ortopedia y Traumatología' },
  { codigo: '440106', descripcion: 'Reemplazo total de rodilla', seccion: 'PROCEDIMIENTOS QUIRURGICOS', grupo: 'Ortopedia y Traumatología' },
  { codigo: '440107', descripcion: 'Amputación', seccion: 'PROCEDIMIENTOS QUIRURGICOS', grupo: 'Ortopedia y Traumatología' },
  { codigo: '440108', descripcion: 'Reparación de ligamentos', seccion: 'PROCEDIMIENTOS QUIRURGICOS', grupo: 'Ortopedia y Traumatología' },
  // Oftalmología
  { codigo: '480101', descripcion: 'Cirugía de catarata', seccion: 'PROCEDIMIENTOS QUIRURGICOS', grupo: 'Oftalmología' },
  { codigo: '480102', descripcion: 'Facoemulsificación', seccion: 'PROCEDIMIENTOS QUIRURGICOS', grupo: 'Oftalmología' },
  { codigo: '480103', descripcion: 'Vitrectomía', seccion: 'PROCEDIMIENTOS QUIRURGICOS', grupo: 'Oftalmología' },
  { codigo: '480104', descripcion: 'Cirugía de glaucoma', seccion: 'PROCEDIMIENTOS QUIRURGICOS', grupo: 'Oftalmología' },
  { codigo: '480105', descripcion: 'Corrección de estrabismo', seccion: 'PROCEDIMIENTOS QUIRURGICOS', grupo: 'Oftalmología' },
  // Otorrinolaringología
  { codigo: '490101', descripcion: 'Amigdalectomía', seccion: 'PROCEDIMIENTOS QUIRURGICOS', grupo: 'Otorrinolaringología' },
  { codigo: '490102', descripcion: 'Adenoidectomía', seccion: 'PROCEDIMIENTOS QUIRURGICOS', grupo: 'Otorrinolaringología' },
  { codigo: '490103', descripcion: 'Septoplastia', seccion: 'PROCEDIMIENTOS QUIRURGICOS', grupo: 'Otorrinolaringología' },
  { codigo: '490104', descripcion: 'Rinoplastia funcional', seccion: 'PROCEDIMIENTOS QUIRURGICOS', grupo: 'Otorrinolaringología' },
  { codigo: '490105', descripcion: 'Mastoidectomía', seccion: 'PROCEDIMIENTOS QUIRURGICOS', grupo: 'Otorrinolaringología' },
  // Urología
  { codigo: '500101', descripcion: 'Prostatectomía', seccion: 'PROCEDIMIENTOS QUIRURGICOS', grupo: 'Urología' },
  { codigo: '500102', descripcion: 'Resección transuretral de próstata (RTUP)', seccion: 'PROCEDIMIENTOS QUIRURGICOS', grupo: 'Urología' },
  { codigo: '500103', descripcion: 'Cistoscopia', seccion: 'PROCEDIMIENTOS QUIRURGICOS', grupo: 'Urología' },
  { codigo: '500104', descripcion: 'Nefrectomía', seccion: 'PROCEDIMIENTOS QUIRURGICOS', grupo: 'Urología' },
  { codigo: '500105', descripcion: 'Litotricia extracorpórea', seccion: 'PROCEDIMIENTOS QUIRURGICOS', grupo: 'Urología' },
  // Cirugía Oral
  { codigo: '520101', descripcion: 'Exodoncia quirúrgica', seccion: 'PROCEDIMIENTOS QUIRURGICOS', grupo: 'Cirugía Oral y Maxilofacial' },
  { codigo: '520102', descripcion: 'Cirugía de terceros molares', seccion: 'PROCEDIMIENTOS QUIRURGICOS', grupo: 'Cirugía Oral y Maxilofacial' },
  { codigo: '520103', descripcion: 'Drenaje de absceso odontogénico', seccion: 'PROCEDIMIENTOS QUIRURGICOS', grupo: 'Cirugía Oral y Maxilofacial' },
  { codigo: '520104', descripcion: 'Biopsia oral', seccion: 'PROCEDIMIENTOS QUIRURGICOS', grupo: 'Cirugía Oral y Maxilofacial' },
  // Cirugía Plástica
  { codigo: '510101', descripcion: 'Reconstrucción cutánea', seccion: 'PROCEDIMIENTOS QUIRURGICOS', grupo: 'Cirugía Plástica (Funcional)' },
  { codigo: '510102', descripcion: 'Injerto de piel', seccion: 'PROCEDIMIENTOS QUIRURGICOS', grupo: 'Cirugía Plástica (Funcional)' },
  { codigo: '510103', descripcion: 'Colgajo cutáneo', seccion: 'PROCEDIMIENTOS QUIRURGICOS', grupo: 'Cirugía Plástica (Funcional)' },
  { codigo: '510104', descripcion: 'Reparación de quemaduras', seccion: 'PROCEDIMIENTOS QUIRURGICOS', grupo: 'Cirugía Plástica (Funcional)' },

  // --- ENFERMERÍA Y TERAPIAS ---
  { codigo: '931001', descripcion: 'TERAPIA FISICA INTEGRAL', seccion: 'TERAPIAS', grupo: 'Rehabilitación' },
  { codigo: '933601', descripcion: 'TERAPIA RESPIRATORIA INTEGRAL', seccion: 'TERAPIAS', grupo: 'Rehabilitación' },
  { codigo: '938301', descripcion: 'TERAPIA OCUPACIONAL INTEGRAL', seccion: 'TERAPIAS', grupo: 'Rehabilitación' },
  { codigo: '937001', descripcion: 'TERAPIA DE LENGUAJE / FONOAUDIOLOGIA INTEGRAL', seccion: 'TERAPIAS', grupo: 'Rehabilitación' },
  { codigo: '890106', descripcion: 'CURACION DE HERIDA', seccion: 'PROCEDIMIENTOS NO QUIRURGICOS', grupo: 'Enfermería' },
  { codigo: '890105', descripcion: 'RETIRO DE PUNTOS', seccion: 'PROCEDIMIENTOS NO QUIRURGICOS', grupo: 'Enfermería' },
  { codigo: '963301', descripcion: 'LAVADO GASTRICO', seccion: 'PROCEDIMIENTOS NO QUIRURGICOS', grupo: 'Enfermería' },
  { codigo: '960401', descripcion: 'PASO DE SONDA VESICAL', seccion: 'PROCEDIMIENTOS NO QUIRURGICOS', grupo: 'Enfermería' },
  { codigo: '960501', descripcion: 'PASO DE SONDA NASOGASTRICA', seccion: 'PROCEDIMIENTOS NO QUIRURGICOS', grupo: 'Enfermería' },
  { codigo: '901101', descripcion: 'TOMA DE MUESTRA DE LABORATORIO CLINICO', seccion: 'PROCEDIMIENTOS NO QUIRURGICOS', grupo: 'Laboratorio' },
  { codigo: '992101', descripcion: 'INYECCION INTRAMUSCULAR', seccion: 'PROCEDIMIENTOS NO QUIRURGICOS', grupo: 'Enfermería' },
  { codigo: '992102', descripcion: 'INYECCION INTRAVENOSA', seccion: 'PROCEDIMIENTOS NO QUIRURGICOS', grupo: 'Enfermería' }
];

// ==========================================
// DATA: CIE-11 (International Classification of Diseases 11th Revision)
// ==========================================
const cie11Data = [
  // 01 Ciertas enfermedades infecciosas o parasitarias
  { codigo: '1A00', descripcion: 'Cólera', capitulo: '01 Infecciosas' },
  { codigo: '1B10', descripcion: 'Tuberculosis respiratoria, confirmada', capitulo: '01 Infecciosas' },
  { codigo: '1C60', descripcion: 'Paludismo por Plasmodium falciparum', capitulo: '01 Infecciosas' },
  { codigo: '1D01', descripcion: 'Dengue sin signos de alarma', capitulo: '01 Infecciosas' },
  { codigo: '1D01.1', descripcion: 'Dengue con signos de alarma', capitulo: '01 Infecciosas' },
  { codigo: '1D01.2', descripcion: 'Dengue grave', capitulo: '01 Infecciosas' },
  { codigo: 'RA01', descripcion: 'COVID-19', capitulo: '01 Infecciosas' },
  { codigo: '1C82', descripcion: 'Enfermedad por virus Zika', capitulo: '01 Infecciosas' },
  { codigo: '1C40', descripcion: 'VIH sin síntomas', capitulo: '01 Infecciosas' },
  { codigo: '1E30', descripcion: 'Varicela', capitulo: '01 Infecciosas' },
  { codigo: '1F00', descripcion: 'Herpes simple', capitulo: '01 Infecciosas' },
  
  // 02 Neoplasias
  { codigo: '2A90', descripcion: 'Neoplasias malignas del labio', capitulo: '02 Neoplasias' },
  { codigo: '2C60', descripcion: 'Neoplasia maligna de la mama', capitulo: '02 Neoplasias' },
  { codigo: '2C82', descripcion: 'Neoplasia maligna de la próstata', capitulo: '02 Neoplasias' },
  { codigo: '2C25', descripcion: 'Neoplasia maligna de bronquios o pulmón', capitulo: '02 Neoplasias' },
  { codigo: '2B90', descripcion: 'Neoplasia maligna del colon', capitulo: '02 Neoplasias' },
  { codigo: '2C32', descripcion: 'Neoplasia maligna de la piel (Melanoma)', capitulo: '02 Neoplasias' },
  
  // 03 Enfermedades de la sangre
  { codigo: '3A00', descripcion: 'Anemia por deficiencia de hierro', capitulo: '03 Sangre' },
  { codigo: '3A01', descripcion: 'Anemia por deficiencia de vitamina B12', capitulo: '03 Sangre' },
  { codigo: '3A70', descripcion: 'Anemia de células falciformes', capitulo: '03 Sangre' },
  
  // 04 Enfermedades del sistema inmunitario
  { codigo: '4A00', descripcion: 'Hipersensibilidad alérgica', capitulo: '04 Sistema Inmune' },
  { codigo: '4A40', descripcion: 'Lupus eritematoso sistémico', capitulo: '04 Sistema Inmune' },
  
  // 05 Enfermedades endocrinas, nutricionales y metabólicas
  { codigo: '5A10', descripcion: 'Diabetes mellitus tipo 1', capitulo: '05 Endocrinas' },
  { codigo: '5A11', descripcion: 'Diabetes mellitus tipo 2', capitulo: '05 Endocrinas' },
  { codigo: '5A00', descripcion: 'Hipotiroidismo', capitulo: '05 Endocrinas' },
  { codigo: '5B81', descripcion: 'Obesidad', capitulo: '05 Endocrinas' },
  { codigo: '5D00', descripcion: 'Desnutrición', capitulo: '05 Endocrinas' },
  
  // 06 Trastornos mentales, del comportamiento o del neurodesarrollo
  { codigo: '6A00', descripcion: 'Trastornos del espectro autista', capitulo: '06 Mental' },
  { codigo: '6A02', descripcion: 'Trastorno por déficit de atención con hiperactividad (TDAH)', capitulo: '06 Mental' },
  { codigo: '6A20', descripcion: 'Esquizofrenia', capitulo: '06 Mental' },
  { codigo: '6A60', descripcion: 'Trastorno bipolar', capitulo: '06 Mental' },
  { codigo: '6A70', descripcion: 'Trastorno depresivo mayor', capitulo: '06 Mental' },
  { codigo: '6B00', descripcion: 'Trastorno de ansiedad generalizada', capitulo: '06 Mental' },
  
  // 07 Trastornos del ciclo sueño-vigilia
  { codigo: '7A00', descripcion: 'Insomnio crónico', capitulo: '07 Sueño' },
  { codigo: '7A40', descripcion: 'Apnea obstructiva del sueño', capitulo: '07 Sueño' },
  
  // 08 Enfermedades del sistema nervioso
  { codigo: '8A00', descripcion: 'Epilepsia', capitulo: '08 Nervioso' },
  { codigo: '8A20', descripcion: 'Enfermedad de Alzheimer', capitulo: '08 Nervioso' },
  { codigo: '8A80', descripcion: 'Migraña', capitulo: '08 Nervioso' },
  { codigo: '8B41', descripcion: 'Accidente cerebrovascular isquémico', capitulo: '08 Nervioso' },
  { codigo: '8A60', descripcion: 'Enfermedad de Parkinson', capitulo: '08 Nervioso' },
  
  // 09 Enfermedades del sistema visual
  { codigo: '9A00', descripcion: 'Conjuntivitis', capitulo: '09 Ojo' },
  { codigo: '9B10', descripcion: 'Catarata senil', capitulo: '09 Ojo' },
  { codigo: '9C61', descripcion: 'Glaucoma primario de ángulo abierto', capitulo: '09 Ojo' },
  { codigo: '9D00', descripcion: 'Miopía', capitulo: '09 Ojo' },
  
  // 10 Enfermedades del oído
  { codigo: 'AA00', descripcion: 'Otitis externa', capitulo: '10 Oído' },
  { codigo: 'AA30', descripcion: 'Otitis media', capitulo: '10 Oído' },
  { codigo: 'AB00', descripcion: 'Hipoacusia', capitulo: '10 Oído' },
  { codigo: 'AB31', descripcion: 'Vértigo', capitulo: '10 Oído' },
  
  // 11 Enfermedades del sistema circulatorio
  { codigo: 'BA00', descripcion: 'Hipertensión esencial', capitulo: '11 Circulatorio' },
  { codigo: 'BA41', descripcion: 'Infarto agudo de miocardio', capitulo: '11 Circulatorio' },
  { codigo: 'BD10', descripcion: 'Insuficiencia cardíaca', capitulo: '11 Circulatorio' },
  { codigo: 'BD71', descripcion: 'Venas varicosas de extremidades inferiores', capitulo: '11 Circulatorio' },
  { codigo: 'BC20', descripcion: 'Fibrilación auricular', capitulo: '11 Circulatorio' },
  
  // 12 Enfermedades del sistema respiratorio
  { codigo: 'CA00', descripcion: 'Rinitis alérgica', capitulo: '12 Respiratorio' },
  { codigo: 'CA20', descripcion: 'Faringitis aguda', capitulo: '12 Respiratorio' },
  { codigo: 'CA40', descripcion: 'Neumonía', capitulo: '12 Respiratorio' },
  { codigo: 'CA80', descripcion: 'Asma', capitulo: '12 Respiratorio' },
  { codigo: 'CA81', descripcion: 'EPOC (Enfermedad pulmonar obstructiva crónica)', capitulo: '12 Respiratorio' },
  
  // 13 Enfermedades del sistema digestivo
  { codigo: 'DA00', descripcion: 'Caries dental', capitulo: '13 Digestivo' },
  { codigo: 'DA40', descripcion: 'Enfermedad por reflujo gastroesofágico', capitulo: '13 Digestivo' },
  { codigo: 'DA50', descripcion: 'Gastritis', capitulo: '13 Digestivo' },
  { codigo: 'DB10', descripcion: 'Apendicitis aguda', capitulo: '13 Digestivo' },
  { codigo: 'DB90', descripcion: 'Hepatitis A', capitulo: '13 Digestivo' },
  { codigo: 'DD90', descripcion: 'Síndrome de intestino irritable', capitulo: '13 Digestivo' },
  
  // 14 Enfermedades de la piel
  { codigo: 'EA00', descripcion: 'Dermatitis atópica', capitulo: '14 Piel' },
  { codigo: 'EA80', descripcion: 'Acné', capitulo: '14 Piel' },
  { codigo: 'EA90', descripcion: 'Rosácea', capitulo: '14 Piel' },
  { codigo: 'EB00', descripcion: 'Psoriasis', capitulo: '14 Piel' },
  { codigo: 'EB40', descripcion: 'Urticaria', capitulo: '14 Piel' },
  
  // 15 Enfermedades del sistema musculoesquelético
  { codigo: 'FA00', descripcion: 'Artritis reumatoide', capitulo: '15 Musculoesquelético' },
  { codigo: 'FA01', descripcion: 'Osteoartritis de rodilla', capitulo: '15 Musculoesquelético' },
  { codigo: 'FB82', descripcion: 'Lumbago (Dolor lumbar)', capitulo: '15 Musculoesquelético' },
  { codigo: 'FC00', descripcion: 'Fibromialgia', capitulo: '15 Musculoesquelético' },
  
  // 16 Enfermedades del sistema genitourinario
  { codigo: 'GA00', descripcion: 'Nefritis tubulointersticial aguda (Infección Renal)', capitulo: '16 Genitourinario' },
  { codigo: 'GA20', descripcion: 'Insuficiencia renal crónica', capitulo: '16 Genitourinario' },
  { codigo: 'GB00', descripcion: 'Cálculo renal', capitulo: '16 Genitourinario' },
  { codigo: 'GC00', descripcion: 'Infección de vías urinarias (Cistitis)', capitulo: '16 Genitourinario' },
  { codigo: 'GA90', descripcion: 'Hiperplasia prostática benigna', capitulo: '16 Genitourinario' },
  
  // 17 Condiciones relacionadas con la salud sexual
  { codigo: 'HA00', descripcion: 'Disfunción sexual femenina', capitulo: '17 Salud Sexual' },
  { codigo: 'HA01', descripcion: 'Disfunción sexual masculina', capitulo: '17 Salud Sexual' },
  
  // 18 Embarazo, parto y puerperio
  { codigo: 'JA00', descripcion: 'Embarazo confirmado', capitulo: '18 Embarazo' },
  { codigo: 'JA20', descripcion: 'Hipertensión gestacional', capitulo: '18 Embarazo' },
  { codigo: 'JA24', descripcion: 'Preeclampsia', capitulo: '18 Embarazo' },
  { codigo: 'JB00', descripcion: 'Trabajo de parto espontáneo', capitulo: '18 Embarazo' },
  { codigo: 'JB05', descripcion: 'Cesárea', capitulo: '18 Embarazo' },
  
  // 19 Ciertas afecciones originadas en el período perinatal
  { codigo: 'KA00', descripcion: 'Feto o recién nacido afectado por factores maternos', capitulo: '19 Perinatal' },
  { codigo: 'KA20', descripcion: 'Trastornos relacionados con la duración de la gestación (Prematurez)', capitulo: '19 Perinatal' },
  { codigo: 'KB80', descripcion: 'Ictericia neonatal', capitulo: '19 Perinatal' },
  
  // 20 Anomalías del desarrollo
  { codigo: 'LD00', descripcion: 'Síndrome de Down', capitulo: '20 Congénitas' },
  { codigo: 'LA40', descripcion: 'Labio leporino', capitulo: '20 Congénitas' },
  
  // 21 Síntomas, signos o hallazgos clínicos
  { codigo: 'MG26', descripcion: 'Fiebre de origen desconocido', capitulo: '21 Síntomas' },
  { codigo: 'MG30', descripcion: 'Dolor generalizado', capitulo: '21 Síntomas' },
  { codigo: 'MD10', descripcion: 'Tos', capitulo: '21 Síntomas' },
  { codigo: 'ME05', descripcion: 'Diarrea', capitulo: '21 Síntomas' },
  { codigo: 'MB20', descripcion: 'Cefalea', capitulo: '21 Síntomas' },
  { codigo: 'MC10', descripcion: 'Dolor torácico', capitulo: '21 Síntomas' },
  { codigo: 'MD80', descripcion: 'Disnea (Dificultad respiratoria)', capitulo: '21 Síntomas' },
  
  // 22 Traumatismos, envenenamientos
  { codigo: 'NA00', descripcion: 'Traumatismo superficial de la cabeza', capitulo: '22 Trauma' },
  { codigo: 'NB30', descripcion: 'Esguince de tobillo', capitulo: '22 Trauma' },
  { codigo: 'NC10', descripcion: 'Fractura de radio', capitulo: '22 Trauma' },
  { codigo: 'ND90', descripcion: 'Quemadura de primer grado', capitulo: '22 Trauma' },
  
  // 24 Factores que influyen en el estado de salud
  { codigo: 'QA20', descripcion: 'Contacto para inmunización (Vacunación)', capitulo: '24 Factores Salud' },
  { codigo: 'QA30', descripcion: 'Contacto para supervisión de salud del niño (Control Sano)', capitulo: '24 Factores Salud' },
  { codigo: 'QA40', descripcion: 'Contacto para asesoramiento anticonceptivo', capitulo: '24 Factores Salud' },
  { codigo: 'QC20', descripcion: 'Examen médico general', capitulo: '24 Factores Salud' },
];

async function main() {
  console.log('🚀 Seeding Extended Catalogs (CUPS & CIE-11)...');

  // CUPS
  console.log(`📦 Procesando ${cupsData.length} códigos CUPS...`);
  for (const item of cupsData) {
    await prisma.catalogoCups.upsert({
      where: { codigo: item.codigo },
      update: {
        descripcion: item.descripcion,
        seccion: item.seccion,
        grupo: item.grupo,
      },
      create: {
        codigo: item.codigo,
        descripcion: item.descripcion,
        seccion: item.seccion,
        grupo: item.grupo,
      },
    });
  }

  // CIE-11
  console.log(`📦 Procesando ${cie11Data.length} códigos CIE-11...`);
  for (const item of cie11Data) {
    await prisma.catalogoCie11.upsert({
      where: { codigo: item.codigo },
      update: {
        descripcion: item.descripcion,
        capitulo: item.capitulo
      },
      create: {
        id: item.codigo,
        codigo: item.codigo,
        descripcion: item.descripcion,
        capitulo: item.capitulo
      },
    });
  }

  console.log('✅ Catalogs seeded successfully.');
}

if (require.main === module) {
  main()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}

module.exports = { main };
