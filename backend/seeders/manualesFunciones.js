const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seedManualesFunciones() {
  console.log('Seeding Manuales de Funciones...');

  // Manual 1: Medico Especialista en Endocrinologia
  const manualEndocrino = await prisma.manualFunciones.upsert({
    where: { codigo: 'MF-END-001' },
    update: {},
    create: {
      codigo: 'MF-END-001',
      denominacionCargo: 'Medico Especialista en Endocrinologia',
      dependencia: 'Direccion Medica',
      cargoJefeInmediato: 'Director Medico',
      area: 'Consulta Externa',
      supervisorDirecto: 'Coordinador de Especialidades',
      nivel: 'PROFESIONAL',
      propositoPrincipal: 'Realizar consulta e intervenciones de medicina especializada de Endocrinologia, brindando atencion integral a pacientes con patologias del sistema endocrino, aplicando los lineamientos institucionales y la normatividad vigente.',
      estado: 'VIGENTE',
      version: 1,
    },
  });

  // Funciones esenciales del Endocrinologo
  const funcionesEndocrino = [
    'Prestar la atencion medica acorde con los servicios y planes de beneficio de la IPS.',
    'Aplicar los lineamientos y politicas institucionales de Endocrinologia.',
    'Realizar la consulta y las interconsultas de Endocrinologia segun los protocolos establecidos.',
    'Cumplir con las normas de bioseguridad establecidas.',
    'Participar en investigaciones y estudios clinicos autorizados.',
    'Diligenciar de manera completa y oportuna la historia clinica electronica.',
    'Elaborar informes medicos y certificaciones requeridas.',
    'Participar en actividades de control interno y auditoria medica.',
    'Aplicar guias de practica clinica y protocolos de atencion.',
    'Participar en actividades de educacion continuada.',
    'Reportar eventos adversos e incidentes.',
    'Cumplir con los horarios y jornadas de atencion asignados.',
  ];

  for (let i = 0; i < funcionesEndocrino.length; i++) {
    await prisma.funcionEsencial.upsert({
      where: { id: `${manualEndocrino.id}-func-${i}` },
      update: { descripcion: funcionesEndocrino[i] },
      create: {
        id: `${manualEndocrino.id}-func-${i}`,
        manualId: manualEndocrino.id,
        numero: i + 1,
        descripcion: funcionesEndocrino[i],
      },
    });
  }

  // Contribuciones individuales
  const contribucionesEndocrino = [
    'Consultas especializadas realizadas con calidad y oportunidad.',
    'Adherencia a guias y protocolos clinicos.',
    'Actividades de promocion y prevencion ejecutadas.',
    'Registros clinicos completos y oportunos.',
  ];

  for (let i = 0; i < contribucionesEndocrino.length; i++) {
    await prisma.contribucionIndividual.upsert({
      where: { id: `${manualEndocrino.id}-contrib-${i}` },
      update: { descripcion: contribucionesEndocrino[i] },
      create: {
        id: `${manualEndocrino.id}-contrib-${i}`,
        manualId: manualEndocrino.id,
        descripcion: contribucionesEndocrino[i],
      },
    });
  }

  // Conocimientos basicos
  const conocimientosEndocrino = [
    { tipo: 'CIENTIFICO', descripcion: 'Conocimientos en patologias endocrinas, diabetes, tiroides, obesidad.' },
    { tipo: 'CIENTIFICO', descripcion: 'Manejo de insulinoterapia y medicamentos antidiabeticos.' },
    { tipo: 'TECNICO', descripcion: 'Interpretacion de examenes de laboratorio especializados.' },
    { tipo: 'ADMINISTRATIVO', descripcion: 'Normatividad del Sistema General de Seguridad Social en Salud.' },
    { tipo: 'LEGAL', descripcion: 'Ley 23 de 1981 - Etica Medica.' },
    { tipo: 'LEGAL', descripcion: 'Resolucion 2003 de 2014 - Habilitacion.' },
  ];

  for (let i = 0; i < conocimientosEndocrino.length; i++) {
    await prisma.conocimientoBasico.upsert({
      where: { id: `${manualEndocrino.id}-conocimiento-${i}` },
      update: { tipo: conocimientosEndocrino[i].tipo, descripcion: conocimientosEndocrino[i].descripcion },
      create: {
        id: `${manualEndocrino.id}-conocimiento-${i}`,
        manualId: manualEndocrino.id,
        tipo: conocimientosEndocrino[i].tipo,
        descripcion: conocimientosEndocrino[i].descripcion,
      },
    });
  }

  // Requisitos del cargo
  await prisma.requisitosCargo.upsert({
    where: { manualId: manualEndocrino.id },
    update: {},
    create: {
      manualId: manualEndocrino.id,
      formacionAcademica: 'Titulo universitario en Medicina. Postgrado en Medicina Interna. Subespecializacion en Endocrinologia.',
      experienciaAnios: 1,
      experienciaTipo: 'Experiencia profesional relacionada con las funciones del cargo en instituciones de salud.',
      certificaciones: ['Soporte Vital Avanzado', 'ReTHUS vigente'],
    },
  });

  // Responsabilidades SGC
  const responsabilidadesEndocrino = [
    { tipo: 'RESPONSABILIDAD', descripcion: 'Participar activamente en el Sistema de Gestion de Calidad.' },
    { tipo: 'RESPONSABILIDAD', descripcion: 'Reportar incidentes y eventos adversos.' },
    { tipo: 'RESPONSABILIDAD', descripcion: 'Usar correctamente los elementos de proteccion personal.' },
    { tipo: 'RESPONSABILIDAD', descripcion: 'Clasificar correctamente los residuos.' },
    { tipo: 'AUTORIDAD', descripcion: 'Solicitar examenes diagnosticos pertinentes.' },
    { tipo: 'AUTORIDAD', descripcion: 'Formular medicamentos segun protocolos.' },
  ];

  for (let i = 0; i < responsabilidadesEndocrino.length; i++) {
    await prisma.responsabilidadSGC.upsert({
      where: { id: `${manualEndocrino.id}-resp-${i}` },
      update: { tipo: responsabilidadesEndocrino[i].tipo, descripcion: responsabilidadesEndocrino[i].descripcion },
      create: {
        id: `${manualEndocrino.id}-resp-${i}`,
        manualId: manualEndocrino.id,
        tipo: responsabilidadesEndocrino[i].tipo,
        descripcion: responsabilidadesEndocrino[i].descripcion,
      },
    });
  }

  // Competencias
  const competenciasEndocrino = [
    { tipo: 'COMUN', nombre: 'Orientacion al resultado', nivel: 'AVANZADO' },
    { tipo: 'COMUN', nombre: 'Orientacion al usuario', nivel: 'AVANZADO' },
    { tipo: 'COMUN', nombre: 'Compromiso institucional', nivel: 'AVANZADO' },
    { tipo: 'COMPORTAMENTAL', nombre: 'Experticia profesional', nivel: 'AVANZADO' },
    { tipo: 'COMPORTAMENTAL', nombre: 'Toma de decisiones', nivel: 'AVANZADO' },
    { tipo: 'COMPORTAMENTAL', nombre: 'Creatividad e innovacion', nivel: 'INTERMEDIO' },
  ];

  for (let i = 0; i < competenciasEndocrino.length; i++) {
    await prisma.competenciaCargo.upsert({
      where: { id: `${manualEndocrino.id}-comp-${i}` },
      update: { tipo: competenciasEndocrino[i].tipo, nombre: competenciasEndocrino[i].nombre, nivel: competenciasEndocrino[i].nivel },
      create: {
        id: `${manualEndocrino.id}-comp-${i}`,
        manualId: manualEndocrino.id,
        tipo: competenciasEndocrino[i].tipo,
        nombre: competenciasEndocrino[i].nombre,
        nivel: competenciasEndocrino[i].nivel,
      },
    });
  }

  console.log('Created: Manual de Endocrinologia');

  // Manual 2: Nutricionista
  const manualNutricionista = await prisma.manualFunciones.upsert({
    where: { codigo: 'MF-NUT-001' },
    update: {},
    create: {
      codigo: 'MF-NUT-001',
      denominacionCargo: 'Nutricionista Dietista',
      dependencia: 'Direccion Medica',
      cargoJefeInmediato: 'Director Medico',
      area: 'Consulta Externa',
      nivel: 'PROFESIONAL',
      propositoPrincipal: 'Brindar atencion nutricional especializada a pacientes, realizando valoracion, diagnostico nutricional, plan de tratamiento y seguimiento, promoviendo habitos alimentarios saludables.',
      estado: 'VIGENTE',
      version: 1,
    },
  });

  // Funciones del Nutricionista
  const funcionesNutricionista = [
    'Realizar valoracion nutricional integral de pacientes.',
    'Elaborar planes de alimentacion personalizados.',
    'Brindar educacion nutricional individual y grupal.',
    'Realizar seguimiento y ajuste de tratamientos nutricionales.',
    'Participar en el equipo interdisciplinario de atencion.',
    'Diligenciar historia clinica nutricional.',
    'Participar en programas de promocion y prevencion.',
    'Cumplir con protocolos y guias de practica clinica.',
  ];

  for (let i = 0; i < funcionesNutricionista.length; i++) {
    await prisma.funcionEsencial.upsert({
      where: { id: `${manualNutricionista.id}-func-${i}` },
      update: { descripcion: funcionesNutricionista[i] },
      create: {
        id: `${manualNutricionista.id}-func-${i}`,
        manualId: manualNutricionista.id,
        numero: i + 1,
        descripcion: funcionesNutricionista[i],
      },
    });
  }

  await prisma.requisitosCargo.upsert({
    where: { manualId: manualNutricionista.id },
    update: {},
    create: {
      manualId: manualNutricionista.id,
      formacionAcademica: 'Titulo universitario en Nutricion y Dietetica.',
      experienciaAnios: 1,
      experienciaTipo: 'Experiencia profesional en atencion clinica nutricional.',
      certificaciones: ['Tarjeta profesional vigente'],
    },
  });

  console.log('Created: Manual de Nutricionista');

  // Manual 3: Medico del Deporte
  const manualMedicoDeporte = await prisma.manualFunciones.upsert({
    where: { codigo: 'MF-DEP-001' },
    update: {},
    create: {
      codigo: 'MF-DEP-001',
      denominacionCargo: 'Medico Especialista en Medicina del Deporte',
      dependencia: 'Direccion Medica',
      cargoJefeInmediato: 'Director Medico',
      area: 'Consulta Externa',
      nivel: 'PROFESIONAL',
      propositoPrincipal: 'Brindar atencion medica especializada en medicina del deporte, realizando valoraciones pre-participativas, atencion de lesiones deportivas, y programas de rehabilitacion y prevencion.',
      estado: 'VIGENTE',
      version: 1,
    },
  });

  const funcionesMedicoDeporte = [
    'Realizar valoracion medico-deportiva integral.',
    'Atender lesiones deportivas agudas y cronicas.',
    'Disenar programas de rehabilitacion deportiva.',
    'Realizar examenes pre-participativos.',
    'Asesorar en planes de entrenamiento.',
    'Participar en actividades de promocion del ejercicio.',
    'Diligenciar historia clinica especializada.',
    'Aplicar protocolos de atencion de emergencias deportivas.',
  ];

  for (let i = 0; i < funcionesMedicoDeporte.length; i++) {
    await prisma.funcionEsencial.upsert({
      where: { id: `${manualMedicoDeporte.id}-func-${i}` },
      update: { descripcion: funcionesMedicoDeporte[i] },
      create: {
        id: `${manualMedicoDeporte.id}-func-${i}`,
        manualId: manualMedicoDeporte.id,
        numero: i + 1,
        descripcion: funcionesMedicoDeporte[i],
      },
    });
  }

  await prisma.requisitosCargo.upsert({
    where: { manualId: manualMedicoDeporte.id },
    update: {},
    create: {
      manualId: manualMedicoDeporte.id,
      formacionAcademica: 'Titulo universitario en Medicina. Especializacion en Medicina del Deporte.',
      experienciaAnios: 1,
      experienciaTipo: 'Experiencia profesional relacionada con medicina deportiva.',
      certificaciones: ['ReTHUS vigente', 'Soporte Vital Basico'],
    },
  });

  console.log('Created: Manual de Medico del Deporte');

  console.log('Manuales de Funciones seeding complete!');
}

module.exports = seedManualesFunciones;

// Run if executed directly
if (require.main === module) {
  seedManualesFunciones()
    .then(() => process.exit(0))
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(() => prisma.$disconnect());
}
