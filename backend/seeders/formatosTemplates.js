const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seedFormatosTemplates() {
  console.log('Seeding Formatos Templates...');

  // Template 1: Lista de Verificacion del Personal
  const listaVerificacion = await prisma.formatoTemplate.upsert({
    where: { codigo: 'FMT-VERIFICACION-PERSONAL' },
    update: {},
    create: {
      codigo: 'FMT-VERIFICACION-PERSONAL',
      nombre: 'Lista de Verificacion del Personal',
      descripcion: 'Checklist para verificar documentacion completa del personal segun normativa colombiana',
      categoria: 'Verificacion Personal',
      requiereFirmas: false,
      requiereAsistentes: false,
      tieneVencimiento: true,
      diasVigencia: 365,
      activo: true,
    },
  });

  // Secciones para Lista de Verificacion
  const seccionesVerificacion = [
    { nombre: 'INFORMACION GENERAL', orden: 0 },
    { nombre: 'ANTECEDENTES', orden: 1 },
    { nombre: 'CONTRATACION', orden: 2 },
    { nombre: 'SEGURIDAD SOCIAL', orden: 3 },
    { nombre: 'CURSOS Y CAPACITACIONES', orden: 4 },
    { nombre: 'SEGURIDAD Y SALUD EN EL TRABAJO', orden: 5 },
  ];

  const createdSecciones = {};
  for (const seccion of seccionesVerificacion) {
    const created = await prisma.seccionFormato.upsert({
      where: {
        id: `${listaVerificacion.id}-${seccion.nombre}`.replace(/\s+/g, '-').toLowerCase(),
      },
      update: { orden: seccion.orden },
      create: {
        id: `${listaVerificacion.id}-${seccion.nombre}`.replace(/\s+/g, '-').toLowerCase(),
        templateId: listaVerificacion.id,
        nombre: seccion.nombre,
        orden: seccion.orden,
      },
    });
    createdSecciones[seccion.nombre] = created;
  }

  // Campos para Lista de Verificacion
  const camposVerificacion = [
    // Informacion General
    { seccion: 'INFORMACION GENERAL', nombre: 'Hoja de vida actualizada', tipo: 'CHECKBOX_GRUPO', esObligatorio: true, orden: 0 },
    { seccion: 'INFORMACION GENERAL', nombre: 'Copia de cedula ampliada 150%', tipo: 'CHECKBOX_GRUPO', esObligatorio: true, orden: 1 },
    { seccion: 'INFORMACION GENERAL', nombre: 'Diploma de pregrado', tipo: 'CHECKBOX_GRUPO', esObligatorio: true, orden: 2 },
    { seccion: 'INFORMACION GENERAL', nombre: 'Diploma de especializacion', tipo: 'CHECKBOX_GRUPO', esObligatorio: false, orden: 3 },
    { seccion: 'INFORMACION GENERAL', nombre: 'ReTHUS o Resolucion', tipo: 'CHECKBOX_GRUPO', esObligatorio: true, orden: 4 },
    { seccion: 'INFORMACION GENERAL', nombre: 'Tarjeta profesional', tipo: 'CHECKBOX_GRUPO', esObligatorio: true, orden: 5 },
    { seccion: 'INFORMACION GENERAL', nombre: 'Carnet de vacunas', tipo: 'CHECKBOX_GRUPO', esObligatorio: true, orden: 6 },
    { seccion: 'INFORMACION GENERAL', nombre: 'Certificaciones laborales (2)', tipo: 'CHECKBOX_GRUPO', esObligatorio: true, orden: 7 },
    { seccion: 'INFORMACION GENERAL', nombre: 'RUT actualizado', tipo: 'CHECKBOX_GRUPO', esObligatorio: true, orden: 8 },
    { seccion: 'INFORMACION GENERAL', nombre: 'Certificacion bancaria', tipo: 'CHECKBOX_GRUPO', esObligatorio: true, orden: 9 },
    { seccion: 'INFORMACION GENERAL', nombre: 'Poliza de responsabilidad civil', tipo: 'CHECKBOX_GRUPO', esObligatorio: true, orden: 10 },

    // Antecedentes
    { seccion: 'ANTECEDENTES', nombre: 'Antecedentes Policia Nacional', tipo: 'CHECKBOX_GRUPO', esObligatorio: true, orden: 0 },
    { seccion: 'ANTECEDENTES', nombre: 'Antecedentes Procuraduria', tipo: 'CHECKBOX_GRUPO', esObligatorio: true, orden: 1 },
    { seccion: 'ANTECEDENTES', nombre: 'Antecedentes Contraloria', tipo: 'CHECKBOX_GRUPO', esObligatorio: true, orden: 2 },

    // Contratacion
    { seccion: 'CONTRATACION', nombre: 'Contrato laboral firmado', tipo: 'CHECKBOX_GRUPO', esObligatorio: true, orden: 0 },

    // Seguridad Social
    { seccion: 'SEGURIDAD SOCIAL', nombre: 'Afiliacion ARL', tipo: 'CHECKBOX_GRUPO', esObligatorio: true, orden: 0 },
    { seccion: 'SEGURIDAD SOCIAL', nombre: 'Afiliacion EPS', tipo: 'CHECKBOX_GRUPO', esObligatorio: true, orden: 1 },
    { seccion: 'SEGURIDAD SOCIAL', nombre: 'Afiliacion AFP', tipo: 'CHECKBOX_GRUPO', esObligatorio: true, orden: 2 },

    // Cursos y Capacitaciones
    { seccion: 'CURSOS Y CAPACITACIONES', nombre: 'Soporte vital basico/avanzado', tipo: 'CHECKBOX_GRUPO', esObligatorio: true, orden: 0 },
    { seccion: 'CURSOS Y CAPACITACIONES', nombre: 'Atencion Victimas Violencia Sexual', tipo: 'CHECKBOX_GRUPO', esObligatorio: true, orden: 1 },
    { seccion: 'CURSOS Y CAPACITACIONES', nombre: 'Higiene de manos OMS', tipo: 'CHECKBOX_GRUPO', esObligatorio: true, orden: 2 },
    { seccion: 'CURSOS Y CAPACITACIONES', nombre: 'Otros cursos', tipo: 'CHECKBOX_GRUPO', esObligatorio: false, orden: 3 },

    // SST
    { seccion: 'SEGURIDAD Y SALUD EN EL TRABAJO', nombre: 'Examen medico ocupacional', tipo: 'CHECKBOX_GRUPO', esObligatorio: true, orden: 0 },
  ];

  let campoOrden = 0;
  for (const campo of camposVerificacion) {
    const seccion = createdSecciones[campo.seccion];
    const clave = campo.nombre.toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_');

    await prisma.campoFormato.upsert({
      where: {
        templateId_clave: {
          templateId: listaVerificacion.id,
          clave: clave,
        },
      },
      update: { orden: campo.orden },
      create: {
        templateId: listaVerificacion.id,
        seccionId: seccion?.id,
        nombre: campo.nombre,
        clave: clave,
        tipo: campo.tipo,
        esRequerido: campo.esObligatorio,
        esObligatorio: campo.esObligatorio,
        orden: campo.orden,
        configuracion: {
          opciones: [
            { valor: 'cumple', etiqueta: 'C', color: '#22c55e' },
            { valor: 'no_cumple', etiqueta: 'NC', color: '#ef4444' },
            { valor: 'no_aplica', etiqueta: 'NA', color: '#9ca3af' },
          ],
          incluyeObservaciones: true,
        },
      },
    });
    campoOrden++;
  }

  console.log('Created: Lista de Verificacion del Personal');

  // Template 2: Acta de Reunion
  const actaReunion = await prisma.formatoTemplate.upsert({
    where: { codigo: 'FMT-ACTA-REUNION' },
    update: {},
    create: {
      codigo: 'FMT-ACTA-REUNION',
      nombre: 'Acta de Reunion',
      descripcion: 'Formato estandar para actas de reuniones, comites y capacitaciones',
      categoria: 'Actas',
      requiereFirmas: true,
      requiereAsistentes: true,
      tieneVencimiento: false,
      activo: true,
    },
  });

  // Secciones para Acta
  const seccionesActa = [
    { nombre: 'TIPO DE REUNION', orden: 0 },
    { nombre: 'DATOS GENERALES', orden: 1 },
    { nombre: 'TEMAS A TRATAR', orden: 2 },
    { nombre: 'COMPROMISOS ACTA ANTERIOR', orden: 3 },
    { nombre: 'DESARROLLO', orden: 4 },
    { nombre: 'NUEVOS COMPROMISOS', orden: 5 },
  ];

  const createdSeccionesActa = {};
  for (const seccion of seccionesActa) {
    const created = await prisma.seccionFormato.upsert({
      where: {
        id: `${actaReunion.id}-${seccion.nombre}`.replace(/\s+/g, '-').toLowerCase(),
      },
      update: { orden: seccion.orden },
      create: {
        id: `${actaReunion.id}-${seccion.nombre}`.replace(/\s+/g, '-').toLowerCase(),
        templateId: actaReunion.id,
        nombre: seccion.nombre,
        orden: seccion.orden,
      },
    });
    createdSeccionesActa[seccion.nombre] = created;
  }

  // Campos para Acta
  const camposActa = [
    {
      seccion: 'TIPO DE REUNION',
      nombre: 'Tipo de reunion',
      tipo: 'SELECT_MULTIPLE',
      esRequerido: true,
      orden: 0,
      configuracion: {
        opciones: [
          { valor: 'comite', etiqueta: 'Comite' },
          { valor: 'auditoria', etiqueta: 'Auditoria' },
          { valor: 'reunion_interna', etiqueta: 'Reunion interna' },
          { valor: 'capacitacion', etiqueta: 'Capacitacion' },
          { valor: 'reunion_personal', etiqueta: 'Reunion Personal' },
          { valor: 'junta_directiva', etiqueta: 'Junta Directiva' },
          { valor: 'cliente_proveedor', etiqueta: 'Reunion con cliente/proveedor' },
          { valor: 'entes_reguladores', etiqueta: 'Visita entes reguladores' },
        ],
        permitirOtro: true,
      },
    },
    { seccion: 'DATOS GENERALES', nombre: 'Objetivo', tipo: 'TEXTO_LARGO', esRequerido: true, orden: 0 },
    { seccion: 'DATOS GENERALES', nombre: 'Fecha', tipo: 'FECHA', esRequerido: true, orden: 1 },
    { seccion: 'DATOS GENERALES', nombre: 'Hora inicio', tipo: 'TEXTO_CORTO', esRequerido: true, orden: 2 },
    { seccion: 'DATOS GENERALES', nombre: 'Hora fin', tipo: 'TEXTO_CORTO', esRequerido: true, orden: 3 },
    { seccion: 'DATOS GENERALES', nombre: 'Lugar', tipo: 'TEXTO_CORTO', esRequerido: true, orden: 4 },
    {
      seccion: 'TEMAS A TRATAR',
      nombre: 'Temas',
      tipo: 'TABLA_DINAMICA',
      esRequerido: true,
      orden: 0,
      configuracion: {
        columnas: [
          { clave: 'numero', etiqueta: '#', tipo: 'numero', ancho: 10 },
          { clave: 'tema', etiqueta: 'Tema', tipo: 'texto', ancho: 90 },
        ],
        minFilas: 1,
        maxFilas: 20,
      },
    },
    {
      seccion: 'COMPROMISOS ACTA ANTERIOR',
      nombre: 'Compromisos anteriores',
      tipo: 'TABLA_DINAMICA',
      esRequerido: false,
      orden: 0,
      configuracion: {
        columnas: [
          { clave: 'compromiso', etiqueta: 'Compromiso', tipo: 'texto', ancho: 70 },
          { clave: 'cumplio', etiqueta: 'Cumplio', tipo: 'select', ancho: 30, opciones: ['SI', 'NO'] },
        ],
        minFilas: 0,
        maxFilas: 20,
      },
    },
    { seccion: 'DESARROLLO', nombre: 'Desarrollo de la reunion', tipo: 'TEXTO_ENRIQUECIDO', esRequerido: true, orden: 0 },
    {
      seccion: 'NUEVOS COMPROMISOS',
      nombre: 'Compromisos',
      tipo: 'TABLA_DINAMICA',
      esRequerido: false,
      orden: 0,
      configuracion: {
        columnas: [
          { clave: 'compromiso', etiqueta: 'Compromiso', tipo: 'texto', ancho: 50 },
          { clave: 'encargado', etiqueta: 'Encargado', tipo: 'texto', ancho: 30 },
          { clave: 'fecha', etiqueta: 'Fecha entrega', tipo: 'fecha', ancho: 20 },
        ],
        minFilas: 0,
        maxFilas: 20,
      },
    },
  ];

  for (const campo of camposActa) {
    const seccion = createdSeccionesActa[campo.seccion];
    const clave = campo.nombre.toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_');

    await prisma.campoFormato.upsert({
      where: {
        templateId_clave: {
          templateId: actaReunion.id,
          clave: clave,
        },
      },
      update: { orden: campo.orden },
      create: {
        templateId: actaReunion.id,
        seccionId: seccion?.id,
        nombre: campo.nombre,
        clave: clave,
        tipo: campo.tipo,
        esRequerido: campo.esRequerido,
        orden: campo.orden,
        configuracion: campo.configuracion || null,
      },
    });
  }

  console.log('Created: Acta de Reunion');

  // Template 3: Evaluacion de Induccion
  const evalInduccion = await prisma.formatoTemplate.upsert({
    where: { codigo: 'FMT-EVAL-INDUCCION' },
    update: {},
    create: {
      codigo: 'FMT-EVAL-INDUCCION',
      nombre: 'Evaluacion de Induccion',
      descripcion: 'Cuestionario de seguimiento para procesos de induccion y reinduccion',
      categoria: 'Evaluaciones',
      requiereFirmas: true,
      requiereAsistentes: false,
      tieneVencimiento: false,
      activo: true,
    },
  });

  // Campos para Evaluacion de Induccion
  const camposEvalInduccion = [
    { nombre: 'Nombre del empleado', tipo: 'TEXTO_CORTO', esRequerido: true, orden: 0 },
    { nombre: 'Cargo', tipo: 'TEXTO_CORTO', esRequerido: true, orden: 1 },
    { nombre: 'Fecha de ingreso', tipo: 'FECHA', esRequerido: true, orden: 2 },
    { nombre: 'Fecha de evaluacion', tipo: 'FECHA', esRequerido: true, orden: 3 },
    { nombre: 'La explicacion fue clara', tipo: 'CHECKBOX', esRequerido: true, orden: 4 },
    { nombre: 'Quisiera mas informacion sobre algun tema', tipo: 'CHECKBOX', esRequerido: true, orden: 5 },
    { nombre: 'Temas de interes adicional', tipo: 'TEXTO_LARGO', esRequerido: false, orden: 6 },
    { nombre: 'Observaciones generales', tipo: 'TEXTO_LARGO', esRequerido: false, orden: 7 },
    { nombre: 'Firma del empleado', tipo: 'FIRMA', esRequerido: true, orden: 8 },
    { nombre: 'Firma del evaluador', tipo: 'FIRMA', esRequerido: true, orden: 9 },
  ];

  for (const campo of camposEvalInduccion) {
    const clave = campo.nombre.toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_');

    await prisma.campoFormato.upsert({
      where: {
        templateId_clave: {
          templateId: evalInduccion.id,
          clave: clave,
        },
      },
      update: { orden: campo.orden },
      create: {
        templateId: evalInduccion.id,
        nombre: campo.nombre,
        clave: clave,
        tipo: campo.tipo,
        esRequerido: campo.esRequerido,
        orden: campo.orden,
      },
    });
  }

  console.log('Created: Evaluacion de Induccion');

  console.log('Formatos Templates seeding complete!');
}

module.exports = seedFormatosTemplates;

// Run if executed directly
if (require.main === module) {
  seedFormatosTemplates()
    .then(() => process.exit(0))
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(() => prisma.$disconnect());
}
