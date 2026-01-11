/**
 * Seeder for SST (Seguridad y Salud en el Trabajo) module
 * Populates catalogs with Colombian regulatory compliance data
 *
 * Normative references:
 * - Decreto 1072/2015 (SG-SST)
 * - Resolucion 0312/2019 (Estandares Minimos)
 * - GTC 45 (Matriz IPVR)
 * - Resolucion 1401/2007 (Investigacion accidentes)
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// ============ FACTORES DE RIESGO (GTC 45) ============
const factoresRiesgo = [
  // BIOLOGICO
  { clasificacion: 'BIOLOGICO', nombre: 'Virus', descripcion: 'Exposicion a virus patogenos', ejemplos: 'COVID-19, Hepatitis, VIH, Influenza', medidasControl: 'Vacunacion, EPP, protocolos de bioseguridad' },
  { clasificacion: 'BIOLOGICO', nombre: 'Bacterias', descripcion: 'Exposicion a bacterias patogenas', ejemplos: 'Tuberculosis, Legionella, Salmonella', medidasControl: 'Vacunacion, EPP, higiene de manos' },
  { clasificacion: 'BIOLOGICO', nombre: 'Hongos', descripcion: 'Exposicion a hongos y esporas', ejemplos: 'Aspergillus, Candida', medidasControl: 'Ventilacion, EPP, control de humedad' },
  { clasificacion: 'BIOLOGICO', nombre: 'Parasitos', descripcion: 'Exposicion a parasitos', ejemplos: 'Protozoarios, helmintos', medidasControl: 'Higiene, agua potable, EPP' },
  { clasificacion: 'BIOLOGICO', nombre: 'Fluidos biologicos', descripcion: 'Contacto con sangre y fluidos corporales', ejemplos: 'Sangre, orina, saliva, secreciones', medidasControl: 'Precauciones universales, EPP' },
  { clasificacion: 'BIOLOGICO', nombre: 'Material corto-punzante', descripcion: 'Riesgo de pinchazos y cortes', ejemplos: 'Agujas, bisturis, lancetas', medidasControl: 'Contenedores seguros, tecnicas seguras' },

  // FISICO
  { clasificacion: 'FISICO', nombre: 'Ruido', descripcion: 'Exposicion a niveles de ruido elevados', ejemplos: 'Maquinaria, equipos, alarmas', medidasControl: 'Audiometrias, proteccion auditiva, aislamiento' },
  { clasificacion: 'FISICO', nombre: 'Iluminacion', descripcion: 'Iluminacion deficiente o excesiva', ejemplos: 'Pantallas, trabajo nocturno, deslumbramiento', medidasControl: 'Estudios de iluminacion, ajustes' },
  { clasificacion: 'FISICO', nombre: 'Vibraciones', descripcion: 'Exposicion a vibraciones mano-brazo o cuerpo entero', ejemplos: 'Herramientas vibratorias, vehiculos', medidasControl: 'Mantenimiento, EPP, rotacion' },
  { clasificacion: 'FISICO', nombre: 'Temperaturas extremas', descripcion: 'Calor o frio extremo', ejemplos: 'Hornos, cuartos frios, exteriores', medidasControl: 'Ventilacion, EPP, hidratacion, pausas' },
  { clasificacion: 'FISICO', nombre: 'Radiaciones ionizantes', descripcion: 'Exposicion a rayos X, gamma', ejemplos: 'Rayos X, tomografia, medicina nuclear', medidasControl: 'Dosimetria, barreras, EPP, distancia' },
  { clasificacion: 'FISICO', nombre: 'Radiaciones no ionizantes', descripcion: 'UV, laser, microondas', ejemplos: 'Lampara UV, laser quirurgico', medidasControl: 'EPP, senalizacion, controles' },
  { clasificacion: 'FISICO', nombre: 'Presion atmosferica', descripcion: 'Trabajo en altura o profundidad', ejemplos: 'Buceo, camaras hiperbaricas', medidasControl: 'Protocolos, equipos certificados' },

  // QUIMICO
  { clasificacion: 'QUIMICO', nombre: 'Gases y vapores', descripcion: 'Exposicion a gases y vapores toxicos', ejemplos: 'Oxido de etileno, formaldehido, anestesicos', medidasControl: 'Ventilacion, EPP, monitoreo' },
  { clasificacion: 'QUIMICO', nombre: 'Aerosoles liquidos', descripcion: 'Nieblas y rocio', ejemplos: 'Desinfectantes, medicamentos nebulizados', medidasControl: 'Cabinas, EPP respiratorio' },
  { clasificacion: 'QUIMICO', nombre: 'Aerosoles solidos', descripcion: 'Polvos y humos', ejemplos: 'Polvo de cemento, humo de soldadura', medidasControl: 'EPP, ventilacion, extraccion' },
  { clasificacion: 'QUIMICO', nombre: 'Material particulado', descripcion: 'Particulas suspendidas', ejemplos: 'PM2.5, PM10', medidasControl: 'Filtracion, EPP respiratorio' },
  { clasificacion: 'QUIMICO', nombre: 'Sustancias citotoxicas', descripcion: 'Medicamentos citotoxicos', ejemplos: 'Quimioterapia, antineoplasicos', medidasControl: 'Cabinas de bioseguridad, EPP, protocolos' },

  // PSICOSOCIAL
  { clasificacion: 'PSICOSOCIAL', nombre: 'Carga mental', descripcion: 'Demandas cognitivas elevadas', ejemplos: 'Toma de decisiones criticas, atencion constante', medidasControl: 'Pausas, rotacion, capacitacion' },
  { clasificacion: 'PSICOSOCIAL', nombre: 'Contenido de la tarea', descripcion: 'Tareas monotonas o complejas', ejemplos: 'Trabajo repetitivo, alta responsabilidad', medidasControl: 'Rotacion, enriquecimiento del cargo' },
  { clasificacion: 'PSICOSOCIAL', nombre: 'Organizacion del trabajo', descripcion: 'Jornadas, turnos, pausas', ejemplos: 'Turnos nocturnos, horas extras', medidasControl: 'Programacion adecuada, pausas' },
  { clasificacion: 'PSICOSOCIAL', nombre: 'Relaciones interpersonales', descripcion: 'Conflictos, acoso, violencia', ejemplos: 'Acoso laboral, mobbing, agresion', medidasControl: 'Comite convivencia, protocolos' },
  { clasificacion: 'PSICOSOCIAL', nombre: 'Condiciones de la tarea', descripcion: 'Autonomia, control, reconocimiento', ejemplos: 'Falta de participacion, supervision excesiva', medidasControl: 'Participacion, retroalimentacion' },
  { clasificacion: 'PSICOSOCIAL', nombre: 'Demandas emocionales', descripcion: 'Exposicion a sufrimiento', ejemplos: 'Atencion a pacientes criticos, duelo', medidasControl: 'Apoyo psicologico, debriefing' },

  // BIOMECANICO
  { clasificacion: 'BIOMECANICO', nombre: 'Postura prolongada', descripcion: 'Mantenimiento de posturas', ejemplos: 'De pie, sentado, inclinado', medidasControl: 'Pausas activas, mobiliario ergonomico' },
  { clasificacion: 'BIOMECANICO', nombre: 'Postura forzada', descripcion: 'Posturas no neutras', ejemplos: 'Flexion lumbar, torsion, extension', medidasControl: 'Ayudas mecanicas, capacitacion' },
  { clasificacion: 'BIOMECANICO', nombre: 'Movimiento repetitivo', descripcion: 'Movimientos ciclicos', ejemplos: 'Digitacion, suturas, punciones', medidasControl: 'Pausas, rotacion, herramientas ergonomicas' },
  { clasificacion: 'BIOMECANICO', nombre: 'Manipulacion de cargas', descripcion: 'Levantamiento, empuje, arrastre', ejemplos: 'Traslado de pacientes, equipos', medidasControl: 'Ayudas mecanicas, tecnicas seguras' },
  { clasificacion: 'BIOMECANICO', nombre: 'Esfuerzo', descripcion: 'Uso de fuerza', ejemplos: 'Apertura de empaques, maniobras', medidasControl: 'Herramientas, mecanizacion' },

  // CONDICIONES DE SEGURIDAD
  { clasificacion: 'CONDICIONES_SEGURIDAD', nombre: 'Mecanico', descripcion: 'Maquinas y herramientas', ejemplos: 'Equipo medico, herramientas cortantes', medidasControl: 'Protecciones, mantenimiento, capacitacion' },
  { clasificacion: 'CONDICIONES_SEGURIDAD', nombre: 'Electrico', descripcion: 'Contacto con electricidad', ejemplos: 'Equipos electricos, cableado', medidasControl: 'Mantenimiento, EPP, protocolos' },
  { clasificacion: 'CONDICIONES_SEGURIDAD', nombre: 'Locativo', descripcion: 'Superficies, almacenamiento', ejemplos: 'Pisos humedos, escaleras, espacios reducidos', medidasControl: 'Mantenimiento, senalizacion, orden' },
  { clasificacion: 'CONDICIONES_SEGURIDAD', nombre: 'Tecnologico', descripcion: 'Incendio, explosion, fuga', ejemplos: 'Cilindros de gas, sustancias inflamables', medidasControl: 'Sistemas contra incendio, protocolos' },
  { clasificacion: 'CONDICIONES_SEGURIDAD', nombre: 'Publicos', descripcion: 'Robos, atracos, orden publico', ejemplos: 'Violencia externa, manifestaciones', medidasControl: 'Seguridad fisica, protocolos' },
  { clasificacion: 'CONDICIONES_SEGURIDAD', nombre: 'Transito', descripcion: 'Accidentes de transito', ejemplos: 'Desplazamientos laborales', medidasControl: 'Seguridad vial, capacitacion' },
  { clasificacion: 'CONDICIONES_SEGURIDAD', nombre: 'Trabajo en alturas', descripcion: 'Trabajo sobre 1.5m', ejemplos: 'Mantenimiento, instalaciones', medidasControl: 'Certificacion, EPP, protocolos' },
  { clasificacion: 'CONDICIONES_SEGURIDAD', nombre: 'Espacios confinados', descripcion: 'Espacios con acceso limitado', ejemplos: 'Tanques, ductos', medidasControl: 'Permisos, EPP, monitoreo' },

  // FENOMENOS NATURALES
  { clasificacion: 'FENOMENOS_NATURALES', nombre: 'Sismo', descripcion: 'Movimientos telluricos', ejemplos: 'Terremotos', medidasControl: 'Plan de emergencias, evacuacion' },
  { clasificacion: 'FENOMENOS_NATURALES', nombre: 'Vendaval', descripcion: 'Vientos fuertes', ejemplos: 'Tormentas, huracanes', medidasControl: 'Plan de emergencias, infraestructura' },
  { clasificacion: 'FENOMENOS_NATURALES', nombre: 'Inundacion', descripcion: 'Desbordamientos, lluvias', ejemplos: 'Crecientes, deslizamientos', medidasControl: 'Plan de emergencias, ubicacion' },
  { clasificacion: 'FENOMENOS_NATURALES', nombre: 'Precipitaciones', descripcion: 'Lluvias, granizo', ejemplos: 'Tormentas electricas', medidasControl: 'Proteccion, plan de emergencias' },
];

// ============ INDICADORES SST (Res. 0312/2019) ============
const indicadores = [
  // INDICADORES DE RESULTADO
  { codigo: 'IF', nombre: 'Indice de Frecuencia', tipo: 'RESULTADO', formula: '(No. AT incapacitantes x 240,000) / HHT', metaAnual: 10, unidad: 'Indice', frecuenciaMedicion: 'MENSUAL', descripcion: 'Mide la frecuencia de accidentes incapacitantes por horas trabajadas' },
  { codigo: 'IS', nombre: 'Indice de Severidad', tipo: 'RESULTADO', formula: '(Dias perdidos x 240,000) / HHT', metaAnual: 50, unidad: 'Indice', frecuenciaMedicion: 'MENSUAL', descripcion: 'Mide la severidad de los accidentes en dias perdidos' },
  { codigo: 'ILI', nombre: 'Indice de Lesion Incapacitante', tipo: 'RESULTADO', formula: 'IF x IS / 1,000', metaAnual: 0.5, unidad: 'Indice', frecuenciaMedicion: 'MENSUAL', descripcion: 'Combina frecuencia y severidad de accidentes' },
  { codigo: 'TA', nombre: 'Tasa de Accidentalidad', tipo: 'RESULTADO', formula: '(No. AT / No. Trabajadores) x 100', metaAnual: 5, unidad: '%', frecuenciaMedicion: 'MENSUAL', descripcion: 'Porcentaje de trabajadores accidentados' },
  { codigo: 'TM', nombre: 'Tasa de Mortalidad', tipo: 'RESULTADO', formula: '(No. Muertes x 100,000) / No. Trabajadores', metaAnual: 0, unidad: 'Por 100,000', frecuenciaMedicion: 'ANUAL', descripcion: 'Muertes por cada 100,000 trabajadores' },
  { codigo: 'PEL', nombre: 'Prevalencia Enfermedad Laboral', tipo: 'RESULTADO', formula: '(Casos EL / Trabajadores) x 100,000', metaAnual: 100, unidad: 'Por 100,000', frecuenciaMedicion: 'ANUAL', descripcion: 'Casos de enfermedad laboral existentes' },
  { codigo: 'IEL', nombre: 'Incidencia Enfermedad Laboral', tipo: 'RESULTADO', formula: '(Casos nuevos EL / Expuestos) x 100,000', metaAnual: 50, unidad: 'Por 100,000', frecuenciaMedicion: 'ANUAL', descripcion: 'Casos nuevos de enfermedad laboral' },
  { codigo: 'TAU', nombre: 'Tasa de Ausentismo', tipo: 'RESULTADO', formula: '(Dias perdidos / Dias programados) x 100', metaAnual: 3, unidad: '%', frecuenciaMedicion: 'MENSUAL', descripcion: 'Porcentaje de ausentismo por causa medica' },

  // INDICADORES DE ESTRUCTURA
  { codigo: 'PSS', nombre: 'Politica SST', tipo: 'ESTRUCTURA', formula: 'Existe politica firmada y divulgada (Si=100, No=0)', metaAnual: 100, unidad: '%', frecuenciaMedicion: 'ANUAL', descripcion: 'Politica de SST documentada y comunicada' },
  { codigo: 'OSS', nombre: 'Objetivos SST', tipo: 'ESTRUCTURA', formula: 'Existen objetivos SST medibles (Si=100, No=0)', metaAnual: 100, unidad: '%', frecuenciaMedicion: 'ANUAL', descripcion: 'Objetivos de SST definidos y medibles' },
  { codigo: 'RST', nombre: 'Responsable SST', tipo: 'ESTRUCTURA', formula: 'Existe responsable SST con licencia (Si=100, No=0)', metaAnual: 100, unidad: '%', frecuenciaMedicion: 'ANUAL', descripcion: 'Responsable del SG-SST designado' },
  { codigo: 'REC', nombre: 'Recursos SST', tipo: 'ESTRUCTURA', formula: 'Presupuesto asignado para SST (Si=100, No=0)', metaAnual: 100, unidad: '%', frecuenciaMedicion: 'ANUAL', descripcion: 'Recursos financieros, tecnicos y humanos' },
  { codigo: 'COP', nombre: 'COPASST Conformado', tipo: 'ESTRUCTURA', formula: 'COPASST vigente (Si=100, No=0)', metaAnual: 100, unidad: '%', frecuenciaMedicion: 'ANUAL', descripcion: 'Comite Paritario conformado y funcionando' },
  { codigo: 'CCL', nombre: 'CCL Conformado', tipo: 'ESTRUCTURA', formula: 'Comite Convivencia vigente (Si=100, No=0)', metaAnual: 100, unidad: '%', frecuenciaMedicion: 'ANUAL', descripcion: 'Comite de Convivencia Laboral activo' },

  // INDICADORES DE PROCESO
  { codigo: 'CPA', nombre: 'Cumplimiento Plan Anual', tipo: 'PROCESO', formula: '(Actividades ejecutadas / Actividades programadas) x 100', metaAnual: 90, unidad: '%', frecuenciaMedicion: 'TRIMESTRAL', descripcion: 'Ejecucion del plan de trabajo anual' },
  { codigo: 'CIN', nombre: 'Cobertura Induccion SST', tipo: 'PROCESO', formula: '(Trabajadores con induccion SST / Ingresos) x 100', metaAnual: 100, unidad: '%', frecuenciaMedicion: 'MENSUAL', descripcion: 'Trabajadores con induccion en SST' },
  { codigo: 'CCA', nombre: 'Cobertura Capacitacion SST', tipo: 'PROCESO', formula: '(Trabajadores capacitados SST / Total trabajadores) x 100', metaAnual: 100, unidad: '%', frecuenciaMedicion: 'ANUAL', descripcion: 'Cobertura del programa de capacitacion' },
  { codigo: 'CEX', nombre: 'Cobertura Examenes Medicos', tipo: 'PROCESO', formula: '(Examenes realizados / Examenes programados) x 100', metaAnual: 100, unidad: '%', frecuenciaMedicion: 'TRIMESTRAL', descripcion: 'Cumplimiento de examenes ocupacionales' },
  { codigo: 'INS', nombre: 'Inspecciones Realizadas', tipo: 'PROCESO', formula: '(Inspecciones ejecutadas / Inspecciones programadas) x 100', metaAnual: 100, unidad: '%', frecuenciaMedicion: 'MENSUAL', descripcion: 'Cumplimiento de inspecciones de seguridad' },
  { codigo: 'SIM', nombre: 'Simulacros Realizados', tipo: 'PROCESO', formula: '(Simulacros ejecutados / Simulacros programados) x 100', metaAnual: 100, unidad: '%', frecuenciaMedicion: 'SEMESTRAL', descripcion: 'Cumplimiento de simulacros programados' },
  { codigo: 'IRE', nombre: 'Investigacion Riesgo Expuesto', tipo: 'PROCESO', formula: '(Trabajadores expuestos identificados / Total trabajadores) x 100', metaAnual: 100, unidad: '%', frecuenciaMedicion: 'ANUAL', descripcion: 'Identificacion de exposicion a riesgos' },
  { codigo: 'CIA', nombre: 'Cierre Acciones Investigacion', tipo: 'PROCESO', formula: '(Acciones cerradas / Acciones propuestas) x 100', metaAnual: 90, unidad: '%', frecuenciaMedicion: 'TRIMESTRAL', descripcion: 'Cierre de acciones de investigacion' },
  { codigo: 'EPP', nombre: 'Entrega EPP', tipo: 'PROCESO', formula: '(Trabajadores con EPP / Trabajadores que requieren EPP) x 100', metaAnual: 100, unidad: '%', frecuenciaMedicion: 'TRIMESTRAL', descripcion: 'Cobertura de entrega de EPP' },
];

// ============ ELEMENTOS EPP ============
const elementosEPP = [
  // PROTECCION CABEZA
  { categoria: 'CABEZA', nombre: 'Casco de seguridad', descripcion: 'Proteccion contra impactos en la cabeza', normaAplicable: 'NTC 1523', vidaUtil: 24 },
  { categoria: 'CABEZA', nombre: 'Gorro quirurgico', descripcion: 'Gorro desechable para areas esteriles', normaAplicable: 'ISO 22609', vidaUtil: 1 },
  { categoria: 'CABEZA', nombre: 'Cofia', descripcion: 'Cofia para contencion de cabello', normaAplicable: 'NTC 2019', vidaUtil: 1 },

  // PROTECCION OJOS Y CARA
  { categoria: 'OJOS_CARA', nombre: 'Gafas de seguridad', descripcion: 'Proteccion contra impactos y salpicaduras', normaAplicable: 'NTC 1771', vidaUtil: 12 },
  { categoria: 'OJOS_CARA', nombre: 'Monogafas', descripcion: 'Proteccion hermetica ojos', normaAplicable: 'NTC 1825', vidaUtil: 12 },
  { categoria: 'OJOS_CARA', nombre: 'Careta facial', descripcion: 'Proteccion completa cara', normaAplicable: 'NTC 3610', vidaUtil: 24 },
  { categoria: 'OJOS_CARA', nombre: 'Careta con visor', descripcion: 'Proteccion contra salpicaduras', normaAplicable: 'ANSI Z87.1', vidaUtil: 12 },
  { categoria: 'OJOS_CARA', nombre: 'Gafas para soldadura', descripcion: 'Proteccion contra radiacion de soldadura', normaAplicable: 'NTC 1825', vidaUtil: 12 },

  // PROTECCION AUDITIVA
  { categoria: 'AUDITIVA', nombre: 'Tapones auditivos', descripcion: 'Proteccion auditiva de insercion', normaAplicable: 'NTC 2272', vidaUtil: 1 },
  { categoria: 'AUDITIVA', nombre: 'Orejeras', descripcion: 'Proteccion auditiva tipo copa', normaAplicable: 'NTC 2272', vidaUtil: 24 },

  // PROTECCION RESPIRATORIA
  { categoria: 'RESPIRATORIA', nombre: 'Mascarilla N95', descripcion: 'Respirador para particulas', normaAplicable: 'NIOSH 42 CFR 84', vidaUtil: 1 },
  { categoria: 'RESPIRATORIA', nombre: 'Mascarilla quirurgica', descripcion: 'Mascarilla desechable', normaAplicable: 'ASTM F2100', vidaUtil: 1 },
  { categoria: 'RESPIRATORIA', nombre: 'Respirador media cara', descripcion: 'Respirador reutilizable media cara', normaAplicable: 'NTC 1728', vidaUtil: 12 },
  { categoria: 'RESPIRATORIA', nombre: 'Respirador cara completa', descripcion: 'Respirador cara completa', normaAplicable: 'NTC 1728', vidaUtil: 24 },
  { categoria: 'RESPIRATORIA', nombre: 'Cartuchos para gases', descripcion: 'Cartuchos para vapores organicos', normaAplicable: 'NIOSH', vidaUtil: 3 },

  // PROTECCION MANOS
  { categoria: 'MANOS', nombre: 'Guantes de latex', descripcion: 'Guantes desechables latex', normaAplicable: 'NTC 2190', vidaUtil: 1 },
  { categoria: 'MANOS', nombre: 'Guantes de nitrilo', descripcion: 'Guantes desechables nitrilo', normaAplicable: 'NTC 2190', vidaUtil: 1 },
  { categoria: 'MANOS', nombre: 'Guantes de vinilo', descripcion: 'Guantes desechables vinilo', normaAplicable: 'EN 455', vidaUtil: 1 },
  { categoria: 'MANOS', nombre: 'Guantes de neopreno', descripcion: 'Guantes para quimicos', normaAplicable: 'EN 374', vidaUtil: 6 },
  { categoria: 'MANOS', nombre: 'Guantes de cuero', descripcion: 'Guantes para trabajo mecanico', normaAplicable: 'NTC 2190', vidaUtil: 6 },
  { categoria: 'MANOS', nombre: 'Guantes anticorte', descripcion: 'Guantes resistentes a cortes', normaAplicable: 'EN 388', vidaUtil: 6 },
  { categoria: 'MANOS', nombre: 'Guantes aislantes', descripcion: 'Guantes para trabajo electrico', normaAplicable: 'ASTM D120', vidaUtil: 12 },

  // PROTECCION CORPORAL
  { categoria: 'CORPORAL', nombre: 'Bata desechable', descripcion: 'Bata para aislamiento', normaAplicable: 'AAMI PB70', vidaUtil: 1 },
  { categoria: 'CORPORAL', nombre: 'Bata antifluidos', descripcion: 'Bata resistente a fluidos', normaAplicable: 'AAMI PB70', vidaUtil: 6 },
  { categoria: 'CORPORAL', nombre: 'Overol', descripcion: 'Overol de trabajo', normaAplicable: 'NTC 2021', vidaUtil: 12 },
  { categoria: 'CORPORAL', nombre: 'Delantal de PVC', descripcion: 'Delantal para quimicos', normaAplicable: 'EN 340', vidaUtil: 12 },
  { categoria: 'CORPORAL', nombre: 'Chaleco reflectivo', descripcion: 'Chaleco de alta visibilidad', normaAplicable: 'NTC 3616', vidaUtil: 12 },
  { categoria: 'CORPORAL', nombre: 'Traje Tyvek', descripcion: 'Traje de proteccion quimica', normaAplicable: 'EN 14126', vidaUtil: 1 },

  // PROTECCION PIES
  { categoria: 'PIES', nombre: 'Botas de seguridad', descripcion: 'Botas con puntera de acero', normaAplicable: 'NTC 2257', vidaUtil: 12 },
  { categoria: 'PIES', nombre: 'Zapatos antideslizantes', descripcion: 'Calzado para superficies humedas', normaAplicable: 'EN ISO 20347', vidaUtil: 12 },
  { categoria: 'PIES', nombre: 'Botas de caucho', descripcion: 'Botas impermeables', normaAplicable: 'NTC 1741', vidaUtil: 12 },
  { categoria: 'PIES', nombre: 'Polainas', descripcion: 'Proteccion piernas y pies', normaAplicable: 'EN ISO 20345', vidaUtil: 12 },
  { categoria: 'PIES', nombre: 'Cubrezapatos', descripcion: 'Proteccion desechable calzado', normaAplicable: 'EN 13795', vidaUtil: 1 },

  // PROTECCION ALTURAS
  { categoria: 'ALTURAS', nombre: 'Arnes de seguridad', descripcion: 'Arnes cuerpo completo', normaAplicable: 'NTC 2021', vidaUtil: 60 },
  { categoria: 'ALTURAS', nombre: 'Linea de vida', descripcion: 'Linea de anclaje', normaAplicable: 'ANSI Z359.1', vidaUtil: 60 },
  { categoria: 'ALTURAS', nombre: 'Mosquetones', descripcion: 'Conectores de seguridad', normaAplicable: 'ANSI Z359.12', vidaUtil: 60 },
  { categoria: 'ALTURAS', nombre: 'Eslingas', descripcion: 'Elementos de conexion', normaAplicable: 'ANSI Z359.3', vidaUtil: 36 },
];

async function main() {
  console.log('Starting SST seeder...');

  // Seed Factores de Riesgo
  console.log('Seeding factores de riesgo...');
  for (const factor of factoresRiesgo) {
    await prisma.sSTFactorRiesgo.upsert({
      where: {
        clasificacion_nombre: {
          clasificacion: factor.clasificacion,
          nombre: factor.nombre,
        },
      },
      update: {
        descripcion: factor.descripcion,
        ejemplos: factor.ejemplos,
        medidasControl: factor.medidasControl,
      },
      create: factor,
    });
  }
  console.log(`Seeded ${factoresRiesgo.length} factores de riesgo`);

  // Seed Indicadores
  console.log('Seeding indicadores SST...');
  for (const indicador of indicadores) {
    await prisma.sSTIndicador.upsert({
      where: { codigo: indicador.codigo },
      update: {
        nombre: indicador.nombre,
        tipo: indicador.tipo,
        formula: indicador.formula,
        metaAnual: indicador.metaAnual,
        unidad: indicador.unidad,
        frecuenciaMedicion: indicador.frecuenciaMedicion,
        descripcion: indicador.descripcion,
      },
      create: indicador,
    });
  }
  console.log(`Seeded ${indicadores.length} indicadores SST`);

  // Seed Elementos EPP
  console.log('Seeding elementos EPP...');
  for (const elemento of elementosEPP) {
    await prisma.sSTElementoEPP.upsert({
      where: {
        categoria_nombre: {
          categoria: elemento.categoria,
          nombre: elemento.nombre,
        },
      },
      update: {
        descripcion: elemento.descripcion,
        normaAplicable: elemento.normaAplicable,
        vidaUtil: elemento.vidaUtil,
      },
      create: elemento,
    });
  }
  console.log(`Seeded ${elementosEPP.length} elementos EPP`);

  // Seed Configuracion SST inicial
  console.log('Checking SST configuration...');
  const config = await prisma.sSTConfiguracion.findFirst();
  if (!config) {
    await prisma.sSTConfiguracion.create({
      data: {
        nombreResponsableSST: 'Por asignar',
        cargoResponsableSST: 'Responsable SG-SST',
        arlNombre: 'ARL SURA',
        horasTrabajoDiario: 8,
        diasTrabajoMes: 22,
        horasHombreAnio: 2112,
        politicaSSTUrl: null,
        fechaPolitica: new Date(),
        versionPolitica: 1,
      },
    });
    console.log('Created initial SST configuration');
  } else {
    console.log('SST configuration already exists');
  }

  console.log('SST seeder completed successfully!');
}

// Export for use in run_all_seeds.js
module.exports = { main };

// Run directly if executed as script
if (require.main === module) {
  main()
    .catch((e) => {
      console.error('Error in SST seeder:', e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
