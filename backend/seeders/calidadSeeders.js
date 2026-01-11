/**
 * Seeders de Calidad IPS
 * Datos normativos según legislación colombiana
 * Ejecutar con: node seeders/calidadSeeders.js
 */
require('dotenv').config({ path: '../.env' });
const prisma = require('../db/prisma');

// ==========================================
// ESTÁNDARES DE HABILITACIÓN - Resolución 3100/2019
// ==========================================
const ESTANDARES_HABILITACION = [
  {
    tipo: 'TALENTO_HUMANO',
    codigo: 'TH',
    nombre: 'Talento Humano',
    descripcion: 'Condiciones de recurso humano requerido para la prestación de servicios de salud',
    normativaRef: 'Resolución 3100 de 2019 - Artículo 5',
    servicioAplica: ['TODOS'],
  },
  {
    tipo: 'INFRAESTRUCTURA',
    codigo: 'INF',
    nombre: 'Infraestructura',
    descripcion: 'Condiciones de infraestructura física de los servicios de salud',
    normativaRef: 'Resolución 3100 de 2019 - Artículo 6',
    servicioAplica: ['TODOS'],
  },
  {
    tipo: 'DOTACION',
    codigo: 'DOT',
    nombre: 'Dotación',
    descripcion: 'Condiciones de dotación, mantenimiento, equipos e insumos',
    normativaRef: 'Resolución 3100 de 2019 - Artículo 7',
    servicioAplica: ['TODOS'],
  },
  {
    tipo: 'MEDICAMENTOS_DISPOSITIVOS',
    codigo: 'MED',
    nombre: 'Medicamentos, Dispositivos Médicos e Insumos',
    descripcion: 'Condiciones de gestión de medicamentos y dispositivos médicos',
    normativaRef: 'Resolución 3100 de 2019 - Artículo 8',
    servicioAplica: ['TODOS'],
  },
  {
    tipo: 'PROCESOS_PRIORITARIOS',
    codigo: 'PP',
    nombre: 'Procesos Prioritarios',
    descripcion: 'Procesos prioritarios asistenciales que deben implementarse',
    normativaRef: 'Resolución 3100 de 2019 - Artículo 9',
    servicioAplica: ['TODOS'],
  },
  {
    tipo: 'HISTORIA_CLINICA',
    codigo: 'HC',
    nombre: 'Historia Clínica y Registros',
    descripcion: 'Condiciones de historia clínica y registros asistenciales',
    normativaRef: 'Resolución 3100 de 2019 - Artículo 10',
    servicioAplica: ['TODOS'],
  },
  {
    tipo: 'INTERDEPENDENCIA',
    codigo: 'INT',
    nombre: 'Interdependencia de Servicios',
    descripcion: 'Servicios que deben existir para prestar otro servicio',
    normativaRef: 'Resolución 3100 de 2019 - Artículo 11',
    servicioAplica: ['TODOS'],
  },
];

// ==========================================
// CRITERIOS DE HABILITACIÓN (muestra por estándar)
// ==========================================
const CRITERIOS_HABILITACION = {
  TH: [
    { codigo: 'TH.01', descripcion: 'El prestador cuenta con el talento humano en salud autorizado para ejercer', modoVerificacion: 'Verificación de títulos y registros profesionales' },
    { codigo: 'TH.02', descripcion: 'El talento humano cumple con el proceso de selección, vinculación e inducción', modoVerificacion: 'Revisión de expedientes de personal' },
    { codigo: 'TH.03', descripcion: 'El talento humano cuenta con las competencias necesarias para el cargo', modoVerificacion: 'Certificados de competencia y evaluación de desempeño' },
  ],
  INF: [
    { codigo: 'INF.01', descripcion: 'La infraestructura física cumple con los requisitos de construcción', modoVerificacion: 'Inspección física del establecimiento' },
    { codigo: 'INF.02', descripcion: 'Las áreas cuentan con iluminación, ventilación y temperatura adecuadas', modoVerificacion: 'Medición de condiciones ambientales' },
    { codigo: 'INF.03', descripcion: 'El establecimiento cuenta con sistemas de seguridad y prevención de riesgos', modoVerificacion: 'Revisión de plan de emergencias y señalización' },
  ],
  DOT: [
    { codigo: 'DOT.01', descripcion: 'El equipamiento biomédico cuenta con registro sanitario o permiso de comercialización', modoVerificacion: 'Verificación de registros INVIMA' },
    { codigo: 'DOT.02', descripcion: 'Existe programa de mantenimiento preventivo y correctivo de equipos', modoVerificacion: 'Revisión de hojas de vida de equipos' },
    { codigo: 'DOT.03', descripcion: 'Los equipos cuentan con calibración vigente según normatividad', modoVerificacion: 'Certificados de calibración' },
  ],
  MED: [
    { codigo: 'MED.01', descripcion: 'Los medicamentos cuentan con registro sanitario vigente', modoVerificacion: 'Verificación de registros INVIMA' },
    { codigo: 'MED.02', descripcion: 'Existe sistema de gestión de medicamentos (recepción, almacenamiento, dispensación)', modoVerificacion: 'Revisión del proceso farmacéutico' },
    { codigo: 'MED.03', descripcion: 'Se implementa el programa de farmacovigilancia y tecnovigilancia', modoVerificacion: 'Revisión de reportes y procedimientos' },
  ],
  PP: [
    { codigo: 'PP.01', descripcion: 'El prestador cuenta con guías y protocolos de atención', modoVerificacion: 'Revisión documental de guías' },
    { codigo: 'PP.02', descripcion: 'Se implementa el programa de seguridad del paciente', modoVerificacion: 'Revisión del programa y sus componentes' },
    { codigo: 'PP.03', descripcion: 'Existe proceso de atención al usuario y PQRS', modoVerificacion: 'Verificación del sistema de PQRS' },
  ],
  HC: [
    { codigo: 'HC.01', descripcion: 'La historia clínica cumple con los requisitos de contenido y forma', modoVerificacion: 'Auditoría de historias clínicas' },
    { codigo: 'HC.02', descripcion: 'Se garantiza la confidencialidad y custodia de la historia clínica', modoVerificacion: 'Revisión de protocolos de seguridad de información' },
    { codigo: 'HC.03', descripcion: 'Se cuenta con consentimiento informado documentado', modoVerificacion: 'Verificación de formatos y registros' },
  ],
  INT: [
    { codigo: 'INT.01', descripcion: 'El prestador cuenta con servicios de apoyo diagnóstico propios o contratados', modoVerificacion: 'Verificación de contratos o servicios propios' },
    { codigo: 'INT.02', descripcion: 'Existe sistema de referencia y contrarreferencia documentado', modoVerificacion: 'Revisión de convenios y procedimientos' },
    { codigo: 'INT.03', descripcion: 'Se cuenta con servicios de urgencias según complejidad', modoVerificacion: 'Verificación de disponibilidad de servicios' },
  ],
};

// ==========================================
// INDICADORES SIC - Resolución 256/2016
// ==========================================
const INDICADORES_SIC = [
  // DOMINIO: EFECTIVIDAD
  {
    codigo: 'P.1.1',
    nombre: 'Proporción de gestantes con captación de control prenatal en el primer trimestre',
    dominio: 'EFECTIVIDAD',
    definicionOperacional: 'Gestantes con inicio de control prenatal antes de la semana 12 de gestación',
    formulaNumerador: 'Número de gestantes con primer control prenatal antes de la semana 12',
    formulaDenominador: 'Total de gestantes inscritas en el programa de control prenatal',
    unidadMedida: 'Porcentaje',
    metaNacional: 80,
    fuenteDatos: 'Registros de control prenatal',
    periodicidadReporte: 'Semestral',
    serviciosAplica: ['Consulta Externa', 'Ginecología', 'Obstetricia'],
  },
  {
    codigo: 'P.1.2',
    nombre: 'Proporción de gestantes con valoración por odontología',
    dominio: 'EFECTIVIDAD',
    definicionOperacional: 'Gestantes que recibieron valoración odontológica durante el embarazo',
    formulaNumerador: 'Número de gestantes con valoración odontológica',
    formulaDenominador: 'Total de gestantes del programa',
    unidadMedida: 'Porcentaje',
    metaNacional: 90,
    fuenteDatos: 'Registros de atención odontológica',
    periodicidadReporte: 'Semestral',
    serviciosAplica: ['Odontología', 'Control Prenatal'],
  },
  {
    codigo: 'P.1.7',
    nombre: 'Proporción de reingreso hospitalario por IRA en menores de 5 años',
    dominio: 'EFECTIVIDAD',
    definicionOperacional: 'Reingresos hospitalarios por Infección Respiratoria Aguda en menores de 5 años dentro de los 15 días siguientes al egreso',
    formulaNumerador: 'Número de reingresos por IRA en menores de 5 años dentro de 15 días',
    formulaDenominador: 'Total de egresos por IRA en menores de 5 años',
    unidadMedida: 'Porcentaje',
    metaNacional: 2,
    fuenteDatos: 'Registros de hospitalización pediátrica',
    periodicidadReporte: 'Semestral',
    serviciosAplica: ['Hospitalización', 'Pediatría'],
  },
  {
    codigo: 'P.1.10',
    nombre: 'Proporción de gestantes con asesoría pre-test para VIH',
    dominio: 'EFECTIVIDAD',
    definicionOperacional: 'Gestantes que recibieron asesoría pre-test para VIH',
    formulaNumerador: 'Número de gestantes con asesoría pre-test VIH',
    formulaDenominador: 'Total de gestantes con prueba de VIH',
    unidadMedida: 'Porcentaje',
    metaNacional: 95,
    fuenteDatos: 'Registros de control prenatal y laboratorio',
    periodicidadReporte: 'Semestral',
    serviciosAplica: ['Control Prenatal', 'Laboratorio'],
  },
  // DOMINIO: SEGURIDAD
  {
    codigo: 'P.2.9',
    nombre: 'Tasa de caída de pacientes en el servicio de hospitalización',
    dominio: 'SEGURIDAD',
    definicionOperacional: 'Caídas de pacientes por cada 1000 días cama de hospitalización',
    formulaNumerador: 'Número de caídas de pacientes hospitalizados',
    formulaDenominador: 'Días cama ocupados x 1000',
    unidadMedida: 'Tasa por 1000 días cama',
    metaNacional: 1,
    fuenteDatos: 'Reportes de eventos adversos',
    periodicidadReporte: 'Semestral',
    serviciosAplica: ['Hospitalización'],
  },
  {
    codigo: 'P.2.10',
    nombre: 'Proporción de eventos adversos relacionados con medicamentos en hospitalización',
    dominio: 'SEGURIDAD',
    definicionOperacional: 'Eventos adversos por medicamentos en pacientes hospitalizados',
    formulaNumerador: 'Número de eventos adversos por medicamentos',
    formulaDenominador: 'Total de pacientes hospitalizados',
    unidadMedida: 'Porcentaje',
    metaNacional: 1,
    fuenteDatos: 'Reportes de farmacovigilancia',
    periodicidadReporte: 'Semestral',
    serviciosAplica: ['Hospitalización', 'Farmacia'],
  },
  {
    codigo: 'P.2.13',
    nombre: 'Proporción de reingreso a urgencias antes de 72 horas',
    dominio: 'SEGURIDAD',
    definicionOperacional: 'Reingresos al servicio de urgencias dentro de las 72 horas siguientes al egreso',
    formulaNumerador: 'Número de reingresos a urgencias en menos de 72 horas',
    formulaDenominador: 'Total de egresos del servicio de urgencias',
    unidadMedida: 'Porcentaje',
    metaNacional: 5,
    fuenteDatos: 'Registros de urgencias',
    periodicidadReporte: 'Semestral',
    serviciosAplica: ['Urgencias'],
  },
  {
    codigo: 'P.2.14',
    nombre: 'Tasa de reingreso hospitalario antes de 15 días',
    dominio: 'SEGURIDAD',
    definicionOperacional: 'Reingresos hospitalarios dentro de los 15 días siguientes al egreso por la misma causa',
    formulaNumerador: 'Número de reingresos hospitalarios en menos de 15 días',
    formulaDenominador: 'Total de egresos hospitalarios',
    unidadMedida: 'Porcentaje',
    metaNacional: 2,
    fuenteDatos: 'Registros de hospitalización',
    periodicidadReporte: 'Semestral',
    serviciosAplica: ['Hospitalización'],
  },
  // DOMINIO: EXPERIENCIA DEL USUARIO
  {
    codigo: 'P.3.1',
    nombre: 'Oportunidad en la asignación de cita de medicina general',
    dominio: 'EXPERIENCIA',
    definicionOperacional: 'Días transcurridos entre la solicitud de cita y la asignación de la misma',
    formulaNumerador: 'Sumatoria de días de espera para asignación de cita',
    formulaDenominador: 'Número total de citas asignadas',
    unidadMedida: 'Días promedio',
    metaNacional: 3,
    fuenteDatos: 'Sistema de asignación de citas',
    periodicidadReporte: 'Semestral',
    serviciosAplica: ['Consulta Externa', 'Medicina General'],
  },
  {
    codigo: 'P.3.14',
    nombre: 'Proporción de satisfacción global de usuarios',
    dominio: 'EXPERIENCIA',
    definicionOperacional: 'Usuarios que califican como satisfechos o muy satisfechos la atención recibida',
    formulaNumerador: 'Número de usuarios satisfechos o muy satisfechos',
    formulaDenominador: 'Total de usuarios encuestados',
    unidadMedida: 'Porcentaje',
    metaNacional: 80,
    fuenteDatos: 'Encuestas de satisfacción',
    periodicidadReporte: 'Semestral',
    serviciosAplica: ['TODOS'],
  },
  {
    codigo: 'P.3.15',
    nombre: 'Proporción de usuarios que recomendarían la IPS',
    dominio: 'EXPERIENCIA',
    definicionOperacional: 'Usuarios que recomendarían los servicios de la IPS a familiares o amigos',
    formulaNumerador: 'Número de usuarios que recomendarían la IPS',
    formulaDenominador: 'Total de usuarios encuestados',
    unidadMedida: 'Porcentaje',
    metaNacional: 85,
    fuenteDatos: 'Encuestas de satisfacción',
    periodicidadReporte: 'Semestral',
    serviciosAplica: ['TODOS'],
  },
];

// ==========================================
// COMITÉS OBLIGATORIOS
// ==========================================
const COMITES_OBLIGATORIOS = [
  {
    codigo: 'CSP',
    nombre: 'Comité de Seguridad del Paciente',
    normativaBase: 'Resolución 3100 de 2019',
    objetivo: 'Promover, gestionar y monitorear las acciones relacionadas con la seguridad del paciente en la institución',
    periodicidad: 'Mensual',
  },
  {
    codigo: 'COVE',
    nombre: 'Comité de Vigilancia Epidemiológica',
    normativaBase: 'Resolución 3100 de 2019, Decreto 3518 de 2006',
    objetivo: 'Realizar vigilancia epidemiológica de eventos de interés en salud pública y coordinar acciones de prevención y control',
    periodicidad: 'Mensual',
  },
  {
    codigo: 'CFT',
    nombre: 'Comité de Farmacia y Terapéutica',
    normativaBase: 'Resolución 3100 de 2019, Decreto 2200 de 2005',
    objetivo: 'Definir políticas de uso racional de medicamentos, actualizar vademécum institucional y evaluar consumo de medicamentos',
    periodicidad: 'Mensual',
  },
  {
    codigo: 'CHC',
    nombre: 'Comité de Historias Clínicas',
    normativaBase: 'Resolución 1995 de 1999, Resolución 3100 de 2019',
    objetivo: 'Velar por la calidad, seguridad y cumplimiento normativo de las historias clínicas',
    periodicidad: 'Trimestral',
  },
  {
    codigo: 'CEH',
    nombre: 'Comité de Ética Hospitalaria',
    normativaBase: 'Ley 23 de 1981, Resolución 13437 de 1991',
    objetivo: 'Velar por el cumplimiento de principios éticos en la atención y resolver dilemas éticos',
    periodicidad: 'Según demanda',
  },
  {
    codigo: 'COPASST',
    nombre: 'Comité Paritario de Seguridad y Salud en el Trabajo',
    normativaBase: 'Resolución 2013 de 1986, Decreto 1072 de 2015',
    objetivo: 'Promover prácticas seguras de trabajo, investigar accidentes y proponer medidas preventivas',
    periodicidad: 'Mensual',
  },
];

// ==========================================
// PRÁCTICAS SEGURAS OBLIGATORIAS
// ==========================================
const PRACTICAS_SEGURAS = [
  {
    codigo: 'PS01',
    nombre: 'Identificación correcta del paciente',
    descripcion: 'Verificación de identidad del paciente usando al menos dos identificadores antes de cualquier procedimiento',
    categoria: 'Identificacion',
    checklistItems: JSON.stringify([
      'Verificar nombre completo del paciente',
      'Verificar número de documento de identidad',
      'Confirmar fecha de nacimiento',
      'Usar manilla de identificación',
    ]),
    frecuenciaMonitoreo: 'Mensual',
  },
  {
    codigo: 'PS02',
    nombre: 'Comunicación efectiva (SBAR)',
    descripcion: 'Uso de técnica SBAR para comunicación entre profesionales de salud',
    categoria: 'Comunicacion',
    checklistItems: JSON.stringify([
      'Situación: describir la situación actual',
      'Background: contexto relevante del paciente',
      'Assessment: evaluación y análisis',
      'Recomendación: acción sugerida',
    ]),
    frecuenciaMonitoreo: 'Mensual',
  },
  {
    codigo: 'PS03',
    nombre: 'Medicamentos de alto riesgo',
    descripcion: 'Gestión segura de medicamentos de alto riesgo con doble verificación',
    categoria: 'MedicamentosAltoRiesgo',
    checklistItems: JSON.stringify([
      'Almacenamiento diferenciado y etiquetado',
      'Doble verificación antes de administrar',
      'Lista actualizada de medicamentos LASA',
      'Uso de etiquetas de alerta',
    ]),
    frecuenciaMonitoreo: 'Mensual',
  },
  {
    codigo: 'PS04',
    nombre: 'Lista de verificación de cirugía segura (OMS)',
    descripcion: 'Aplicación del checklist de cirugía segura de la OMS en todos los procedimientos quirúrgicos',
    categoria: 'CirugiaSegura',
    checklistItems: JSON.stringify([
      'Entrada: antes de la inducción anestésica',
      'Pausa quirúrgica: antes de la incisión',
      'Salida: antes de que el paciente salga de quirófano',
      'Conteo de gasas e instrumental',
    ]),
    frecuenciaMonitoreo: 'Por procedimiento',
  },
  {
    codigo: 'PS05',
    nombre: 'Prevención de infecciones asociadas a la atención en salud (IAAS)',
    descripcion: 'Implementación de medidas de prevención de IAAS según protocolos institucionales',
    categoria: 'IAAS',
    checklistItems: JSON.stringify([
      'Higiene de manos en los 5 momentos',
      'Precauciones estándar y específicas',
      'Bundles de prevención de IAAS',
      'Vigilancia activa de infecciones',
    ]),
    frecuenciaMonitoreo: 'Mensual',
  },
  {
    codigo: 'PS06',
    nombre: 'Prevención de caídas',
    descripcion: 'Evaluación del riesgo de caídas y aplicación de medidas preventivas',
    categoria: 'Caidas',
    checklistItems: JSON.stringify([
      'Aplicar escala de valoración de riesgo de caídas',
      'Señalizar pacientes de alto riesgo',
      'Mantener barandas elevadas en pacientes de riesgo',
      'Asegurar iluminación adecuada',
    ]),
    frecuenciaMonitoreo: 'Mensual',
  },
  {
    codigo: 'PS07',
    nombre: 'Prevención de úlceras por presión',
    descripcion: 'Evaluación del riesgo de úlceras por presión y aplicación de medidas preventivas',
    categoria: 'UPP',
    checklistItems: JSON.stringify([
      'Aplicar escala de Braden al ingreso',
      'Cambios de posición cada 2-3 horas',
      'Uso de colchones antiescaras según riesgo',
      'Mantener piel limpia e hidratada',
    ]),
    frecuenciaMonitoreo: 'Mensual',
  },
];

// ==========================================
// ESTÁNDARES DE ACREDITACIÓN - Resolución 5095/2018
// ==========================================
const ESTANDARES_ACREDITACION = [
  // GRUPO: Atención al Cliente Asistencial
  {
    grupo: 'ATENCION_CLIENTE',
    codigo: 'AC01',
    nombre: 'Direccionamiento de la Atención al Cliente Asistencial',
    descripcion: 'La organización define y despliega procesos para garantizar el acceso a los servicios de salud',
    criterios: JSON.stringify([
      'Existe proceso documentado de atención al usuario',
      'Se garantiza el acceso oportuno a los servicios',
      'Se respetan los derechos de los pacientes',
    ]),
  },
  {
    grupo: 'ATENCION_CLIENTE',
    codigo: 'AC02',
    nombre: 'Proceso de Atención',
    descripcion: 'La organización garantiza que el proceso de atención se realiza con calidad y seguridad',
    criterios: JSON.stringify([
      'Existe evaluación inicial del paciente',
      'El plan de atención está documentado',
      'Se realiza seguimiento al plan de atención',
    ]),
  },
  // GRUPO: Apoyo Administrativo
  {
    grupo: 'APOYO_ADMINISTRATIVO',
    codigo: 'AA01',
    nombre: 'Gestión Administrativa',
    descripcion: 'La organización cuenta con procesos administrativos que apoyan la atención en salud',
    criterios: JSON.stringify([
      'Existe proceso de facturación documentado',
      'Se garantiza disponibilidad de suministros',
      'Los procesos de soporte están documentados',
    ]),
  },
  // GRUPO: Direccionamiento
  {
    grupo: 'DIRECCIONAMIENTO',
    codigo: 'DIR01',
    nombre: 'Planeación Estratégica',
    descripcion: 'La organización define y despliega su direccionamiento estratégico',
    criterios: JSON.stringify([
      'Existe misión, visión y valores institucionales',
      'Se cuenta con plan estratégico documentado',
      'Los objetivos estratégicos están desplegados',
    ]),
  },
  // GRUPO: Gerencia
  {
    grupo: 'GERENCIA',
    codigo: 'GER01',
    nombre: 'Gestión Gerencial',
    descripcion: 'La alta dirección lidera y gestiona la organización hacia el logro de resultados',
    criterios: JSON.stringify([
      'La alta dirección demuestra liderazgo en calidad',
      'Existe rendición de cuentas documentada',
      'Se monitorean indicadores de gestión',
    ]),
  },
  // GRUPO: Recurso Humano
  {
    grupo: 'RECURSO_HUMANO',
    codigo: 'RH01',
    nombre: 'Gestión del Talento Humano',
    descripcion: 'La organización gestiona el talento humano para asegurar competencias',
    criterios: JSON.stringify([
      'Existe proceso de selección documentado',
      'Se realiza inducción y reinducción',
      'Se evalúa el desempeño del personal',
    ]),
  },
  // GRUPO: Ambiente Físico
  {
    grupo: 'AMBIENTE_FISICO',
    codigo: 'AF01',
    nombre: 'Gestión de Infraestructura',
    descripcion: 'La organización gestiona el ambiente físico para garantizar seguridad',
    criterios: JSON.stringify([
      'Existe plan de mantenimiento de infraestructura',
      'Se garantiza seguridad en las instalaciones',
      'El ambiente físico favorece la atención',
    ]),
  },
  // GRUPO: Información
  {
    grupo: 'INFORMACION',
    codigo: 'INF01',
    nombre: 'Gestión de la Información',
    descripcion: 'La organización gestiona la información como recurso estratégico',
    criterios: JSON.stringify([
      'Existe política de gestión de información',
      'Se garantiza seguridad de la información',
      'La información se utiliza para la toma de decisiones',
    ]),
  },
  // GRUPO: Mejoramiento de la Calidad
  {
    grupo: 'MEJORAMIENTO_CALIDAD',
    codigo: 'MC01',
    nombre: 'Sistema de Gestión de Calidad',
    descripcion: 'La organización implementa un sistema de gestión de calidad',
    criterios: JSON.stringify([
      'Existe sistema de gestión de calidad documentado',
      'Se miden indicadores de calidad',
      'Se implementan acciones de mejora',
    ]),
  },
];

// ==========================================
// EVENTOS SIVIGILA
// ==========================================
const EVENTOS_SIVIGILA = [
  { codigo: '100', nombre: 'Accidente ofídico', tipoNotificacion: 'Semanal' },
  { codigo: '110', nombre: 'Agresiones por animales potencialmente transmisores de rabia', tipoNotificacion: 'Semanal' },
  { codigo: '210', nombre: 'Dengue', tipoNotificacion: 'Semanal' },
  { codigo: '220', nombre: 'Dengue grave', tipoNotificacion: 'Inmediata' },
  { codigo: '230', nombre: 'Fiebre amarilla', tipoNotificacion: 'Inmediata' },
  { codigo: '240', nombre: 'Leishmaniasis cutánea', tipoNotificacion: 'Semanal' },
  { codigo: '250', nombre: 'Leishmaniasis mucosa', tipoNotificacion: 'Semanal' },
  { codigo: '260', nombre: 'Leishmaniasis visceral', tipoNotificacion: 'Semanal' },
  { codigo: '270', nombre: 'Malaria', tipoNotificacion: 'Semanal' },
  { codigo: '280', nombre: 'Chagas agudo', tipoNotificacion: 'Inmediata' },
  { codigo: '300', nombre: 'Hepatitis A', tipoNotificacion: 'Semanal' },
  { codigo: '310', nombre: 'Hepatitis B', tipoNotificacion: 'Semanal' },
  { codigo: '320', nombre: 'Hepatitis C', tipoNotificacion: 'Semanal' },
  { codigo: '346', nombre: 'COVID-19', tipoNotificacion: 'Inmediata' },
  { codigo: '350', nombre: 'IRA inusitado', tipoNotificacion: 'Inmediata' },
  { codigo: '370', nombre: 'Sarampión', tipoNotificacion: 'Inmediata' },
  { codigo: '380', nombre: 'Rubéola', tipoNotificacion: 'Inmediata' },
  { codigo: '420', nombre: 'Meningitis bacteriana', tipoNotificacion: 'Inmediata' },
  { codigo: '430', nombre: 'Tuberculosis pulmonar', tipoNotificacion: 'Semanal' },
  { codigo: '440', nombre: 'Tuberculosis extrapulmonar', tipoNotificacion: 'Semanal' },
  { codigo: '450', nombre: 'Lepra', tipoNotificacion: 'Semanal' },
  { codigo: '460', nombre: 'Sífilis gestacional', tipoNotificacion: 'Semanal' },
  { codigo: '470', nombre: 'Sífilis congénita', tipoNotificacion: 'Semanal' },
  { codigo: '480', nombre: 'VIH/SIDA', tipoNotificacion: 'Semanal' },
  { codigo: '510', nombre: 'Intoxicaciones', tipoNotificacion: 'Semanal' },
  { codigo: '520', nombre: 'Accidentes de trabajo', tipoNotificacion: 'Semanal' },
  { codigo: '530', nombre: 'Violencia intrafamiliar', tipoNotificacion: 'Semanal' },
  { codigo: '540', nombre: 'Intento de suicidio', tipoNotificacion: 'Semanal' },
  { codigo: '550', nombre: 'Bajo peso al nacer', tipoNotificacion: 'Semanal' },
  { codigo: '560', nombre: 'Mortalidad materna', tipoNotificacion: 'Inmediata' },
  { codigo: '570', nombre: 'Mortalidad perinatal', tipoNotificacion: 'Semanal' },
];

// ==========================================
// FUNCIONES DE SEED
// ==========================================

async function seedEstandaresHabilitacion() {
  console.log('📋 Creando estándares de habilitación...');

  for (const estandar of ESTANDARES_HABILITACION) {
    const createdEstandar = await prisma.estandarHabilitacion.upsert({
      where: { codigo: estandar.codigo },
      update: estandar,
      create: estandar,
    });

    // Crear criterios para este estándar
    const criterios = CRITERIOS_HABILITACION[estandar.codigo] || [];
    for (const criterio of criterios) {
      // Manual check for existence as unique constraint is not guaranteed
      const existing = await prisma.criterioHabilitacion.findFirst({
          where: { estandarId: createdEstandar.id, codigo: criterio.codigo }
      });

      const data = {
          ...criterio,
          estandarId: createdEstandar.id,
      };

      if (existing) {
          await prisma.criterioHabilitacion.update({
              where: { id: existing.id },
              data
          });
      } else {
          await prisma.criterioHabilitacion.create({ data });
      }
    }
  }

  console.log('✅ Estándares de habilitación creados');
}

async function seedIndicadoresSIC() {
  console.log('📊 Creando indicadores SIC (Res. 256/2016)...');

  for (const indicador of INDICADORES_SIC) {
    await prisma.indicadorSIC.upsert({
      where: { codigo: indicador.codigo },
      update: indicador,
      create: indicador,
    });
  }

  console.log('✅ Indicadores SIC creados');
}

async function seedComites() {
  console.log('👥 Creando comités institucionales...');

  for (const comite of COMITES_OBLIGATORIOS) {
    await prisma.comiteInstitucional.upsert({
      where: { codigo: comite.codigo },
      update: comite,
      create: comite,
    });
  }

  console.log('✅ Comités creados');
}

async function seedPracticasSeguras() {
  console.log('🛡️ Creando prácticas seguras...');

  for (const practica of PRACTICAS_SEGURAS) {
    await prisma.practicaSegura.upsert({
      where: { codigo: practica.codigo },
      update: practica,
      create: practica,
    });
  }

  console.log('✅ Prácticas seguras creadas');
}

async function seedEstandaresAcreditacion() {
  console.log('🏆 Creando estándares de acreditación (Res. 5095/2018)...');

  for (const estandar of ESTANDARES_ACREDITACION) {
    await prisma.estandarAcreditacion.upsert({
      where: { codigo: estandar.codigo },
      update: estandar,
      create: estandar,
    });
  }

  console.log('✅ Estándares de acreditación creados');
}

async function main() {
  console.log('🚀 Iniciando seeders de Calidad IPS...');
  console.log('='.repeat(50));

  try {
    // Ejecutar seeders
    await seedEstandaresHabilitacion();
    await seedIndicadoresSIC();
    await seedComites();
    await seedPracticasSeguras();
    await seedEstandaresAcreditacion();

    console.log('='.repeat(50));
    console.log('✅ Todos los seeders de Calidad ejecutados exitosamente');

    // Mostrar resumen
    const conteos = {
      estandaresHabilitacion: await prisma.estandarHabilitacion.count(),
      criteriosHabilitacion: await prisma.criterioHabilitacion.count(),
      indicadoresSIC: await prisma.indicadorSIC.count(),
      comites: await prisma.comiteInstitucional.count(),
      practicasSeguras: await prisma.practicaSegura.count(),
      estandaresAcreditacion: await prisma.estandarAcreditacion.count(),
    };

    console.log('\n📊 Resumen de datos creados:');
    console.log(`   - Estándares de Habilitación: ${conteos.estandaresHabilitacion}`);
    console.log(`   - Criterios de Habilitación: ${conteos.criteriosHabilitacion}`);
    console.log(`   - Indicadores SIC: ${conteos.indicadoresSIC}`);
    console.log(`   - Comités Institucionales: ${conteos.comites}`);
    console.log(`   - Prácticas Seguras: ${conteos.practicasSeguras}`);
    console.log(`   - Estándares de Acreditación: ${conteos.estandaresAcreditacion}`);

  } catch (error) {
    console.error('❌ Error ejecutando seeders:', error);
    throw error;
  }
}

// Exportar funciones individuales y main
module.exports = {
  main,
  seedEstandaresHabilitacion,
  seedIndicadoresSIC,
  seedComites,
  seedPracticasSeguras,
  seedEstandaresAcreditacion,
  ESTANDARES_HABILITACION,
  CRITERIOS_HABILITACION,
  INDICADORES_SIC,
  COMITES_OBLIGATORIOS,
  PRACTICAS_SEGURAS,
  ESTANDARES_ACREDITACION,
  EVENTOS_SIVIGILA,
};

// Ejecutar si es el archivo principal
if (require.main === module) {
  main()
    .finally(async () => {
      await prisma.$disconnect();
    });
}
