const prisma = require('../db/prisma');

/**
 * Checklist items por defecto para Personal de Talento Humano
 */
const CHECKLIST_PERSONAL_ITEMS = [
  // Documentos Básicos
  { nombre: 'Hoja de vida actualizada', categoria: 'Documentos Básicos', esObligatorio: true, orden: 1 },
  { nombre: 'Copia de cédula ampliada 150%', categoria: 'Documentos Básicos', esObligatorio: true, orden: 2 },
  { nombre: 'Diploma y acta de grado de profesión', categoria: 'Documentos Básicos', esObligatorio: true, orden: 3 },
  { nombre: 'Diploma y acta de grado de especialización', categoria: 'Documentos Básicos', esObligatorio: false, orden: 4 },
  { nombre: 'Copia del Rethus / Resolución', categoria: 'Documentos Básicos', esObligatorio: true, orden: 5 },
  { nombre: 'Copia de la tarjeta profesional', categoria: 'Documentos Básicos', esObligatorio: true, orden: 6 },
  {
    nombre: 'Carnet de vacunas con esquemas vigentes',
    categoria: 'Documentos Básicos',
    esObligatorio: true,
    requiereVencimiento: true,
    diasAlertaVencimiento: 30,
    orden: 7
  },
  { nombre: 'Certificados laborales', categoria: 'Documentos Básicos', esObligatorio: false, permiteMultiplesArchivos: true, orden: 8 },
  { nombre: 'Otros documentos de identificación', categoria: 'Documentos Básicos', esObligatorio: false, permiteMultiplesArchivos: true, orden: 9 },

  // Contractual
  { nombre: 'Contrato laboral firmado', categoria: 'Contractual', esObligatorio: true, orden: 10 },
  { nombre: 'Afiliación a EPS', categoria: 'Contractual', esObligatorio: true, orden: 11 },
  { nombre: 'Afiliación a ARL', categoria: 'Contractual', esObligatorio: true, orden: 12 },
  { nombre: 'Afiliación a fondo de pensiones', categoria: 'Contractual', esObligatorio: true, orden: 13 },
  { nombre: 'Caja de compensación', categoria: 'Contractual', esObligatorio: false, orden: 14 },
  { nombre: 'Exámenes médicos de ingreso', categoria: 'Contractual', esObligatorio: true, orden: 15 },

  // Cursos y Capacitaciones
  {
    nombre: 'Curso de Atención a Víctimas de Violencia Sexual',
    categoria: 'Cursos y Capacitaciones',
    esObligatorio: true,
    requiereVencimiento: true,
    diasAlertaVencimiento: 60,
    orden: 16
  },
  {
    nombre: 'Curso Soporte Vital BLS/ACLS',
    categoria: 'Cursos y Capacitaciones',
    esObligatorio: true,
    requiereVencimiento: true,
    diasAlertaVencimiento: 60,
    orden: 17
  },
  {
    nombre: 'Curso de higiene de manos de la OMS',
    categoria: 'Cursos y Capacitaciones',
    esObligatorio: true,
    requiereVencimiento: true,
    diasAlertaVencimiento: 60,
    orden: 18
  },
  {
    nombre: 'Curso de bioseguridad',
    categoria: 'Cursos y Capacitaciones',
    esObligatorio: true,
    requiereVencimiento: true,
    diasAlertaVencimiento: 60,
    orden: 19
  },
  {
    nombre: 'Curso de gestión del riesgo',
    categoria: 'Cursos y Capacitaciones',
    esObligatorio: false,
    requiereVencimiento: true,
    diasAlertaVencimiento: 60,
    orden: 20
  },
  {
    nombre: 'Otros cursos y capacitaciones',
    categoria: 'Cursos y Capacitaciones',
    esObligatorio: false,
    permiteMultiplesArchivos: true,
    orden: 21
  },

  // Evaluaciones
  { nombre: 'Evaluación de desempeño', categoria: 'Evaluaciones', esObligatorio: false, permiteMultiplesArchivos: true, orden: 22 },
  { nombre: 'Evaluación de competencias', categoria: 'Evaluaciones', esObligatorio: false, permiteMultiplesArchivos: true, orden: 23 },
];

/**
 * Checklist items para Inscripción/Habilitación
 */
const CHECKLIST_INSCRIPCION_ITEMS = [
  { nombre: 'Certificado de existencia y representación legal', categoria: 'Documentos Legales', esObligatorio: true, orden: 1 },
  { nombre: 'RUT actualizado', categoria: 'Documentos Legales', esObligatorio: true, orden: 2 },
  { nombre: 'Licencia de funcionamiento', categoria: 'Documentos Legales', esObligatorio: true, requiereVencimiento: true, diasAlertaVencimiento: 90, orden: 3 },
  { nombre: 'Resolución de habilitación', categoria: 'Documentos Legales', esObligatorio: true, requiereVencimiento: true, diasAlertaVencimiento: 90, orden: 4 },
  { nombre: 'Inscripción REPS', categoria: 'Documentos Legales', esObligatorio: true, orden: 5 },
  { nombre: 'Certificado de uso de suelos', categoria: 'Documentos Legales', esObligatorio: true, orden: 6 },
  { nombre: 'Concepto sanitario favorable', categoria: 'Documentos Legales', esObligatorio: true, requiereVencimiento: true, diasAlertaVencimiento: 60, orden: 7 },
  { nombre: 'Certificado de Bomberos', categoria: 'Documentos Legales', esObligatorio: true, requiereVencimiento: true, diasAlertaVencimiento: 60, orden: 8 },
  { nombre: 'Póliza de responsabilidad civil', categoria: 'Seguros', esObligatorio: true, requiereVencimiento: true, diasAlertaVencimiento: 30, orden: 9 },
  { nombre: 'Otros documentos de inscripción', categoria: 'Otros', esObligatorio: false, permiteMultiplesArchivos: true, orden: 10 },
];

/**
 * Checklist items para Procesos
 */
const CHECKLIST_PROCESOS_ITEMS = [
  { nombre: 'Manual de calidad', categoria: 'Manuales', esObligatorio: true, orden: 1 },
  { nombre: 'Manual de procedimientos', categoria: 'Manuales', esObligatorio: true, orden: 2 },
  { nombre: 'Manual de bioseguridad', categoria: 'Manuales', esObligatorio: true, orden: 3 },
  { nombre: 'Manual de gestión del riesgo', categoria: 'Manuales', esObligatorio: true, orden: 4 },
  { nombre: 'Plan de emergencias', categoria: 'Planes', esObligatorio: true, orden: 5 },
  { nombre: 'Plan de gestión de residuos', categoria: 'Planes', esObligatorio: true, orden: 6 },
  { nombre: 'Protocolos clínicos', categoria: 'Protocolos', esObligatorio: true, permiteMultiplesArchivos: true, orden: 7 },
  { nombre: 'Guías de práctica clínica', categoria: 'Protocolos', esObligatorio: false, permiteMultiplesArchivos: true, orden: 8 },
];

async function seedChecklistTemplates() {
  console.log('Seeding checklist templates for Calidad 2.0...');

  // Template para Personal
  const templatePersonal = await prisma.checklistTemplateCalidad2.upsert({
    where: { id: '00000000-0000-0000-0000-000000000001' },
    update: {
      nombre: 'Checklist de Personal - Talento Humano',
      descripcion: 'Documentos requeridos para la carpeta de personal según normativa colombiana',
      tipoEntidad: 'PERSONAL',
    },
    create: {
      id: '00000000-0000-0000-0000-000000000001',
      nombre: 'Checklist de Personal - Talento Humano',
      descripcion: 'Documentos requeridos para la carpeta de personal según normativa colombiana',
      tipoEntidad: 'PERSONAL',
    },
  });
  console.log(`Template Personal created/updated: ${templatePersonal.id}`);

  // Items para Personal
  for (const item of CHECKLIST_PERSONAL_ITEMS) {
    await prisma.checklistItemCalidad2.upsert({
      where: {
        id: `personal-item-${item.orden.toString().padStart(3, '0')}`,
      },
      update: {
        ...item,
        templateId: templatePersonal.id,
      },
      create: {
        id: `personal-item-${item.orden.toString().padStart(3, '0')}`,
        templateId: templatePersonal.id,
        ...item,
      },
    });
  }
  console.log(`  - ${CHECKLIST_PERSONAL_ITEMS.length} items de Personal creados/actualizados`);

  // Template para Inscripción
  const templateInscripcion = await prisma.checklistTemplateCalidad2.upsert({
    where: { id: '00000000-0000-0000-0000-000000000002' },
    update: {
      nombre: 'Checklist de Inscripción/Habilitación',
      descripcion: 'Documentos legales requeridos para habilitación de IPS',
      tipoEntidad: 'INSCRIPCION',
    },
    create: {
      id: '00000000-0000-0000-0000-000000000002',
      nombre: 'Checklist de Inscripción/Habilitación',
      descripcion: 'Documentos legales requeridos para habilitación de IPS',
      tipoEntidad: 'INSCRIPCION',
    },
  });
  console.log(`Template Inscripción created/updated: ${templateInscripcion.id}`);

  // Items para Inscripción
  for (const item of CHECKLIST_INSCRIPCION_ITEMS) {
    await prisma.checklistItemCalidad2.upsert({
      where: {
        id: `inscripcion-item-${item.orden.toString().padStart(3, '0')}`,
      },
      update: {
        ...item,
        templateId: templateInscripcion.id,
      },
      create: {
        id: `inscripcion-item-${item.orden.toString().padStart(3, '0')}`,
        templateId: templateInscripcion.id,
        ...item,
      },
    });
  }
  console.log(`  - ${CHECKLIST_INSCRIPCION_ITEMS.length} items de Inscripción creados/actualizados`);

  // Template para Procesos
  const templateProcesos = await prisma.checklistTemplateCalidad2.upsert({
    where: { id: '00000000-0000-0000-0000-000000000003' },
    update: {
      nombre: 'Checklist de Procesos y Manuales',
      descripcion: 'Documentos de procesos requeridos para el sistema de gestión de calidad',
      tipoEntidad: 'PROCESOS',
    },
    create: {
      id: '00000000-0000-0000-0000-000000000003',
      nombre: 'Checklist de Procesos y Manuales',
      descripcion: 'Documentos de procesos requeridos para el sistema de gestión de calidad',
      tipoEntidad: 'PROCESOS',
    },
  });
  console.log(`Template Procesos created/updated: ${templateProcesos.id}`);

  // Items para Procesos
  for (const item of CHECKLIST_PROCESOS_ITEMS) {
    await prisma.checklistItemCalidad2.upsert({
      where: {
        id: `procesos-item-${item.orden.toString().padStart(3, '0')}`,
      },
      update: {
        ...item,
        templateId: templateProcesos.id,
      },
      create: {
        id: `procesos-item-${item.orden.toString().padStart(3, '0')}`,
        templateId: templateProcesos.id,
        ...item,
      },
    });
  }
  console.log(`  - ${CHECKLIST_PROCESOS_ITEMS.length} items de Procesos creados/actualizados`);

  console.log('Checklist templates seeded successfully!');
}

async function main() {
  try {
    await seedChecklistTemplates();
  } catch (e) {
    console.error('Error seeding checklists:', e);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  main();
}

module.exports = { main, seedChecklistTemplates };
