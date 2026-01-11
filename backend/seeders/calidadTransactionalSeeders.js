/**
 * Seeders Transaccionales para el Módulo de Calidad
 * Genera datos de prueba realistas (históricos, métricas, eventos, auditorías)
 * utilizando Faker para variabilidad.
 * 
 * Ejecutar con: node seeders/calidadTransactionalSeeders.js
 */
require('dotenv').config({ path: '../.env' });
const { PrismaClient } = require('@prisma/client');
const { fakerES: faker } = require('@faker-js/faker'); // Usar locale español
const prisma = new PrismaClient();

// ==========================================
// HELPERS
// ==========================================
const randomElement = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomFloat = (min, max, precision = 2) => parseFloat((Math.random() * (max - min) + min).toFixed(precision));
const randomBoolean = (probTrue = 0.5) => Math.random() < probTrue;

async function getContextData() {
  const users = await prisma.usuario.findMany();
  const patients = await prisma.paciente.findMany();
  const departments = await prisma.departamento.findMany();
  
  if (users.length === 0 || patients.length === 0) {
    throw new Error('Se requieren usuarios y pacientes base. Ejecute primero los seeders principales.');
  }
  return { users, patients, departments };
}

// ==========================================
// 1. HABILITACIÓN (SUH)
// ==========================================
async function seedHabilitacionTransactions({ users }) {
  console.log('📋 Generando transacciones de Habilitación...');
  
  const estandares = await prisma.estandarHabilitacion.findMany({
    include: { criterios: true }
  });

  const evaluador = users.find(u => u.rol === 'Admin') || users[0];
  
  // Generar 2 autoevaluaciones (año anterior y actual)
  const years = [new Date().getFullYear() - 1, new Date().getFullYear()];
  
  for (const year of years) {
    console.log(`   - Autoevaluación año ${year}`);
    
    // Una autoevaluación por cada estándar mayor
    for (const estandar of estandares) {
      // Simular fecha a mitad de año
      const fechaEval = new Date(year, 5, 15);
      
      const autoevaluacion = await prisma.autoevaluacionHabilitacion.create({
        data: {
          estandarId: estandar.id,
          fechaEvaluacion: fechaEval,
          evaluadorId: evaluador.id,
          porcentajeCumplimiento: 0, // Se calculará después
          observaciones: `Autoevaluación periódica ${estandar.nombre} ${year}`,
          estado: 'Cerrada',
          fechaCierre: new Date(year, 5, 20),
        }
      });

      let cumplen = 0;
      let total = 0;

      // Evaluar criterios
      for (const criterio of estandar.criterios) {
        const cumplimiento = randomElement(['CUMPLE', 'CUMPLE', 'CUMPLE_PARCIAL', 'NO_CUMPLE']); // Sesgo hacia cumplir
        
        if (cumplimiento === 'CUMPLE') cumplen++;
        total++;

        await prisma.evaluacionCriterio.create({
          data: {
            autoevaluacionId: autoevaluacion.id,
            criterioId: criterio.id,
            cumplimiento: cumplimiento,
            observacion: cumplimiento !== 'CUMPLE' ? faker.lorem.sentence() : null,
            fechaEvaluacion: fechaEval,
          }
        });

        // Si no cumple, generar plan de acción (50% prob)
        if ((cumplimiento === 'NO_CUMPLE' || cumplimiento === 'CUMPLE_PARCIAL') && randomBoolean(0.5)) {
          await createPlanAccion({
            origen: 'Autoevaluación Habilitación',
            autoevaluacionId: autoevaluacion.id,
            descripcion: `Incumplimiento en criterio ${criterio.codigo}: ${criterio.descripcion.substring(0, 50)}...`,
            responsableId: randomElement(users).id,
            fechaInicio: fechaEval
          });
        }
      }

      // Actualizar porcentaje
      const pct = total > 0 ? (cumplen / total) * 100 : 0;
      await prisma.autoevaluacionHabilitacion.update({
        where: { id: autoevaluacion.id },
        data: { porcentajeCumplimiento: pct }
      });
    }
  }

  // Generar Visita de Verificación (Secretaría de Salud)
  console.log('   - Visita de Verificación');
  await prisma.visitaVerificacion.create({
    data: {
      tipoVisita: 'Certificación',
      entidadVisitadora: 'Secretaría Distrital de Salud',
      fechaVisita: faker.date.recent({ days: 180 }),
      fechaNotificacion: faker.date.recent({ days: 200 }),
      actaNumero: `ACT-${randomInt(1000, 9999)}`,
      hallazgos: {
        pendientes: ['Infraestructura: Baño piso 2 requiere mantenimiento', 'Dotación: Mantenimiento preventivo vencido en equipo X'],
        fortalezas: ['Programa de Seguridad del Paciente bien documentado']
      },
      requierePlanMejora: true,
      fechaLimitePlan: faker.date.future(),
      estado: 'En Proceso',
      observaciones: 'Visita programada de renovación',
    }
  });
}

// ==========================================
// 2. PAMEC (Auditoría para el Mejoramiento)
// ==========================================
async function seedPamecTransactions({ users }) {
  console.log('📈 Generando transacciones PAMEC...');

  // 1. Equipo PAMEC
  const teamUsers = users.slice(0, 3);
  for (const user of teamUsers) {
    await prisma.equipoPAMEC.create({
      data: {
        usuarioId: user.id,
        rol: 'Auditor Interno',
        fechaIngreso: faker.date.past({ years: 2 }),
        activo: true
      }
    });
  }
  const auditores = await prisma.equipoPAMEC.findMany();

  // 2. Procesos e Indicadores (usando los creados en seeders base o creando nuevos)
  const procesos = await prisma.procesoPAMEC.findMany({ include: { indicadores: true } });
  
  if (procesos.length > 0) {
    const proceso = procesos[0]; // Usar el primero (ej: Urgencias)
    
    // Generar mediciones históricas (últimos 12 meses)
    if (proceso.indicadores.length > 0) {
      const indicador = proceso.indicadores[0];
      console.log(`   - Mediciones históricas para ${indicador.codigo}`);
      
      for (let i = 11; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const periodo = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        
        // Simular tendencia de mejora
        const baseVal = 80 + (11 - i); // Mejora con el tiempo
        const resultado = Math.min(100, baseVal + randomInt(-5, 5));
        const meta = Number(indicador.metaInstitucional) || 90;
        
        await prisma.medicionIndicador.create({
          data: {
            indicadorId: indicador.id,
            periodo: periodo,
            numerador: randomInt(80, 100),
            denominador: 100,
            resultado: resultado,
            meta: meta,
            cumpleMeta: resultado >= meta,
            analisis: `Análisis del periodo ${periodo}. Se observa ${resultado >= meta ? 'cumplimiento' : 'brecha'} respecto a la meta.`,
            accionesTomadas: resultado < meta ? 'Se refuerza capacitación al personal.' : null,
            registradoPor: randomElement(users).id,
            fechaRegistro: date,
          }
        });
      }
    }

    // 3. Auditoría Interna
    console.log('   - Auditorías Internas');
    const auditoria = await prisma.auditoriaPAMEC.create({
      data: {
        procesoId: proceso.id,
        tipoAuditoria: 'Interna',
        objetivo: 'Verificar adherencia a guías de práctica clínica en Urgencias',
        alcance: 'Historias clínicas del último trimestre',
        auditorId: randomElement(auditores).id,
        fechaProgramada: faker.date.recent({ days: 60 }),
        fechaEjecucion: faker.date.recent({ days: 30 }),
        estado: 'Cerrada',
        conclusiones: 'El proceso muestra madurez pero persisten fallas en el registro de hora de atención.',
      }
    });

    // Hallazgos
    await prisma.hallazgoAuditoria.create({
      data: {
        auditoriaId: auditoria.id,
        tipo: 'No Conformidad Menor',
        descripcion: 'En el 15% de las historias auditadas no se registra la hora de salida del paciente.',
        criterioAuditoria: 'Protocolo de Egreso PR-URG-05',
        requiereAccion: true,
        fechaLimiteAccion: faker.date.future(),
        estado: 'Abierto'
      }
    });
  }
}

// ==========================================
// 3. SEGURIDAD DEL PACIENTE
// ==========================================
async function seedSeguridadTransactions({ users, patients, departments }) {
  console.log('🛡️ Generando transacciones de Seguridad del Paciente...');

  // 1. Eventos Adversos
  const tiposEvento = ['INCIDENTE', 'EVENTO_ADVERSO_LEVE', 'EVENTO_ADVERSO_MODERADO']; // Simplificado mapping to schema enums
  // Schema enums: EVENTO_ADVERSO_PREVENIBLE, EVENTO_ADVERSO_NO_PREVENIBLE, INCIDENTE, CUASI_INCIDENTE, COMPLICACION
  
  const eventosCount = 10;
  console.log(`   - Generando ${eventosCount} eventos adversos`);

  for (let i = 0; i < eventosCount; i++) {
    const fecha = faker.date.recent({ days: 365 });
    const esSerio = randomBoolean(0.2); // 20% serios
    
    const tipo = esSerio ? 'EVENTO_ADVERSO_PREVENIBLE' : randomElement(['INCIDENTE', 'CUASI_INCIDENTE']);
    const severidad = esSerio ? randomElement(['MODERADO', 'GRAVE']) : 'LEVE';

    const evento = await prisma.eventoAdverso.create({
      data: {
        pacienteId: randomElement(patients).id,
        tipoEvento: tipo,
        severidad: severidad,
        fechaEvento: fecha,
        horaEvento: `${randomInt(0, 23)}:${randomInt(0, 59)}`,
        servicioOcurrencia: randomElement(departments).nombre,
        descripcionEvento: faker.lorem.paragraph(),
        reportadoPor: randomElement(users).id,
        fechaReporte: new Date(fecha.getTime() + 86400000), // 1 día después
        estado: esSerio ? 'En Análisis' : 'Cerrado',
        requiereAnalisis: esSerio
      }
    });

    // Si es serio, crear Análisis Causa Raíz (Protocolo Londres)
    if (esSerio) {
      await prisma.analisisCausaRaiz.create({
        data: {
          eventoId: evento.id,
          metodoAnalisis: 'Protocolo de Londres',
          fechaAnalisis: new Date(fecha.getTime() + 172800000), // 2 días después
          analistaId: randomElement(users).id,
          fallasActivas: { descripcion: 'Omisión en verificación de identificación' },
          condicionesLatentes: { descripcion: 'Sobrecarga laboral en turno noche' },
          causaRaizFinal: 'Falta de adherencia al protocolo de identificación por fatiga y alta carga laboral.',
          estado: 'Cerrado',
          leccionesAprendidas: 'Reforzar pausas activas en turnos nocturnos.'
        }
      });

      // Crear Plan de Acción para el evento
      await createPlanAccion({
        origen: 'Evento Adverso',
        eventoId: evento.id,
        descripcion: 'Implementar sistema de doble chequeo digital',
        responsableId: randomElement(users).id,
        fechaInicio: new Date()
      });
    }
  }

  // 2. Rondas de Seguridad
  console.log('   - Rondas de Seguridad');
  await prisma.rondaSeguridad.create({
    data: {
      servicioId: randomElement(departments).nombre, // Schema uses string currently or relation? Schema says servicioId String map to ID usually but departments have ID.
      // Looking at schema: rondaSeguridad.servicioId is String. It might be ID or Name. Assuming Name based on previous usage, or ID if relation exists. 
      // Actually schema: servicioId String? @map("servicio_id") -- no relation defined. Let's use name.
      fechaProgramada: faker.date.recent({ days: 7 }),
      fechaEjecucion: new Date(),
      ejecutorId: randomElement(users).id,
      hallazgos: {
        positivos: ['Personal conoce metas de seguridad', 'Carro de paro completo'],
        negativos: ['Medicamentos vencidos en un cajón (ya retirados)']
      },
      estado: 'Ejecutada',
      observaciones: 'Buena adherencia general.'
    }
  });
}

// ==========================================
// 4. INDICADORES SIC
// ==========================================
async function seedSicTransactions({ users }) {
  console.log('📊 Generando mediciones SIC...');
  
  const indicadores = await prisma.indicadorSIC.findMany();
  
  if (indicadores.length === 0) {
    console.log('   (Saltando: No hay indicadores SIC base)');
    return;
  }

  // Generar reporte semestre anterior
  const periodo = '2024-1'; // Ejemplo
  
  for (const ind of indicadores) {
    const num = randomInt(80, 100);
    const den = 100;
    const res = (num/den) * 100;
    
    await prisma.medicionSIC.create({
      data: {
        indicadorId: ind.id,
        periodo: periodo,
        numerador: num,
        denominador: den,
        resultado: res,
        metaVigente: ind.metaNacional || 90,
        cumpleMeta: res >= (ind.metaNacional || 90),
        semaforoEstado: res >= 90 ? 'Verde' : (res >= 80 ? 'Amarillo' : 'Rojo'),
        analisis: faker.lorem.sentence(),
        reportadoSISPRO: true,
        fechaReporteSISPRO: faker.date.recent(),
        registradoPor: randomElement(users).id,
        fechaRegistro: new Date()
      }
    });
  }
}

// ==========================================
// 5. PQRS
// ==========================================
async function seedPqrsTransactions({ users, patients }) {
  console.log('📨 Generando PQRS...');

  const tipos = ['PETICION', 'QUEJA', 'RECLAMO', 'SUGERENCIA', 'FELICITACION'];
  
  for (let i = 0; i < 15; i++) {
    const tipo = randomElement(tipos);
    const estado = randomElement(['RADICADO', 'EN_TRAMITE', 'CERRADO']);
    const fecha = faker.date.past({ years: 1 });
    
    const pacienteId = randomBoolean() ? randomElement(patients).id : null;
    const responsableId = randomElement(users).id;
    const respondidoPor = estado === 'CERRADO' ? randomElement(users).id : null;
    
    const pqrs = await prisma.pQRS.create({
      data: {
        tipo: tipo,
        // canal removed as it is not in schema
        fechaRecepcion: fecha,
        asunto: `${tipo} sobre servicio`,
        descripcion: faker.lorem.paragraph(),
        datosContacto: { nombre: faker.person.fullName() },
        esAnonimo: false,
        estado: estado,
        fechaLimiteRespuesta: new Date(fecha.getTime() + (15 * 86400000)),
        // Si está cerrada, agregar respuesta
        respuestaFinal: estado === 'CERRADO' ? faker.lorem.paragraph() : null,
        fechaCierre: estado === 'CERRADO' ? new Date(fecha.getTime() + (5 * 86400000)) : null,
        
        paciente: pacienteId ? { connect: { id: pacienteId } } : undefined,
        responsable: responsableId ? { connect: { id: responsableId } } : undefined,
        respondedor: respondidoPor ? { connect: { id: respondidoPor } } : undefined,
      }
    });

    // Agregar seguimiento
    await prisma.seguimientoPQRS.create({
      data: {
        pqrsId: pqrs.id,
        accion: 'Asignación a responsable',
        observaciones: 'Se remite al área encargada para gestión.',
        usuarioId: randomElement(users).id,
        createdAt: new Date(fecha.getTime() + 86400000)
      }
    });
  }
}

// ==========================================
// 6. COMITÉS
// ==========================================
async function seedComitesTransactions({ users }) {
  console.log('👥 Generando gestión de Comités...');
  
  const comites = await prisma.comiteInstitucional.findMany();
  
  for (const comite of comites) {
    // 1. Asignar integrantes (si no tienen)
    const existingMembers = await prisma.integranteComite.count({ where: { comiteId: comite.id } });
    if (existingMembers === 0) {
      const miembros = users.slice(0, 4); // Tomar 4 usuarios random
      for (const m of miembros) {
        await prisma.integranteComite.create({
          data: {
            comiteId: comite.id,
            usuarioId: m.id,
            rol: 'Miembro Principal',
            fechaIngreso: new Date(),
            activo: true
          }
        });
      }
    }

    // 2. Crear actas de reunión (últimos 3 meses)
    for (let i = 0; i < 3; i++) {
      const date = faker.date.recent({ days: 90 });
      const acta = await prisma.reunionComite.create({
        data: {
          comiteId: comite.id,
          numeroActa: `${comite.codigo}-00${i+1}-2024`,
          fechaProgramada: date,
          fechaRealizacion: date,
          lugar: 'Sala de Juntas 1',
          ordenDelDia: ['Verificación quórum', 'Lectura acta anterior', 'Análisis indicadores', 'Varios'],
          temasDiscutidos: { tema1: 'Baja adherencia higiene manos', tema2: 'Faltantes medicamentos' },
          decisiones: { decision1: 'Iniciar campaña educativa' },
          estado: 'Realizada'
        }
      });

      // Compromiso
      await prisma.compromisoComite.create({
        data: {
          reunionId: acta.id,
          descripcion: 'Presentar informe de campaña educativa',
          responsableId: randomElement(users).id,
          fechaLimite: new Date(date.getTime() + (30 * 86400000)),
          estado: 'Pendiente'
        }
      });
    }
  }
}

// ==========================================
// 7. GESTIÓN DOCUMENTAL
// ==========================================
async function seedDocumentosTransactions({ users }) {
  console.log('📄 Generando documentos de calidad...');

  const tipos = ['POLITICA', 'MANUAL', 'PROTOCOLO', 'GUIA', 'FORMATO'];
  
  for (let i = 0; i < 10; i++) {
    const tipo = randomElement(tipos);
    const estado = randomElement(['BORRADOR', 'VIGENTE', 'OBSOLETO']);
    
    const doc = await prisma.documentoCalidad.create({
      data: {
        codigo: `DOC-${tipo.substring(0,3)}-${randomInt(100,999)}`,
        nombre: `${tipo} de ${faker.commerce.department()}`,
        tipo: tipo,
        version: '1.0',
        fechaElaboracion: faker.date.past(),
        elaboradoPor: randomElement(users).id,
        estado: estado,
        archivoUrl: 'https://example.com/doc.pdf', // Fake URL
        procesoRelacionado: 'Urgencias'
      }
    });

    if (estado === 'VIGENTE') {
      // Socialización
      await prisma.socializacionDocumento.create({
        data: {
          documentoId: doc.id,
          fechaSocializacion: new Date(),
          metodologia: 'Charla educativa',
          participantes: { total: 15, listado: ['Juan', 'Maria'] },
          realizadoPor: randomElement(users).id
        }
      });
    }
  }
}

// ==========================================
// UTIL: Crear Plan de Acción Genérico
// ==========================================
async function createPlanAccion(data) {
  // data espera: origen, descripcion, responsableId, fechaInicio, y los IDs opcionales (autoevaluacionId, eventoId, etc.)
  
  // Validar si tenemos al menos un ID de enlace
  const hasLink = data.autoevaluacionId || data.visitaId || data.procesoId || data.hallazgoId || data.eventoId || data.rondaId;
  
  const plan = await prisma.planAccionCalidad.create({
    data: {
      codigo: `PA-${new Date().getFullYear()}${String(new Date().getMonth()+1).padStart(2,'0')}-${randomInt(10000, 99999)}`,
      origen: data.origen,
      descripcionProblema: data.descripcion,
      accionPropuesta: 'Realizar análisis de causa y definir barreras.',
      tipoAccion: 'Correctiva',
      responsableId: data.responsableId,
      fechaInicio: data.fechaInicio || new Date(),
      fechaLimite: faker.date.future(),
      estado: 'Abierto',
      avancePorcentaje: 0,
      
      // Enlaces opcionales
      autoevaluacionId: data.autoevaluacionId,
      visitaId: data.visitaId,
      procesoId: data.procesoId,
      hallazgoId: data.hallazgoId,
      eventoId: data.eventoId,
      rondaId: data.rondaId
    }
  });
  
  return plan;
}

// ==========================================
// 8. VIGILANCIA EN SALUD PÚBLICA
// ==========================================
async function seedVigilanciaTransactions({ users, patients }) {
  console.log('🚑 Generando reportes de Vigilancia (SIVIGILA)...');

  // SIVIGILA
  for (let i = 0; i < 5; i++) {
    await prisma.notificacionSIVIGILA.create({
      data: {
        pacienteId: randomElement(patients).id,
        codigoEvento: '346',
        nombreEvento: 'COVID-19',
        tipoNotificacion: 'Inmediata',
        semanaEpidemiologica: randomInt(1, 52),
        anioEpidemiologico: 2024,
        fechaNotificacion: faker.date.recent(),
        clasificacionInicial: 'Sospechoso',
        notificadoPor: randomElement(users).id
      }
    });
  }

  // Farmacovigilancia
  for (let i = 0; i < 5; i++) {
    await prisma.reporteFarmacovigilancia.create({
      data: {
        pacienteId: randomElement(patients).id,
        tipoReporte: 'Reacción Adversa',
        fechaEvento: faker.date.recent(),
        descripcionReaccion: 'Rash cutáneo leve tras administración',
        gravedadReaccion: 'Leve',
        reportadoPor: randomElement(users).id,
        reportadoINVIMA: false
      }
    });
  }
}

// ==========================================
// 9. ACREDITACIÓN (Res. 5095/2018)
// ==========================================
async function seedAcreditacionTransactions({ users }) {
  console.log('🏆 Generando gestión de Acreditación...');

  const estandares = await prisma.estandarAcreditacion.findMany();
  
  if (estandares.length === 0) {
    console.log('   (Saltando: No hay estándares de acreditación base)');
    return;
  }
  
  // Generar autoevaluación de Acreditación
  for (const estandar of estandares) {
    const calificacion = randomInt(1, 5); // Schema expects Int
    
    await prisma.evaluacionAcreditacion.create({ // Correct model name: EvaluacionAcreditacion
      data: {
        estandarId: estandar.id,
        // ciclo: 'Ciclo 1 - 2024', // Removed: Not in schema
        calificacion: calificacion,
        fortalezas: calificacion > 3 ? 'Proceso documentado y socializado.' : null,
        oportunidadesMejora: calificacion <= 3 ? 'Falta despliegue en todos los servicios.' : null,
        evaluadorId: randomElement(users).id,
        fechaEvaluacion: faker.date.recent({ days: 120 })
      }
    });
    
    // Si la calificación es baja, crear plan de mejora
    if (calificacion <= 3 && randomBoolean(0.5)) {
        await createPlanAccion({
            origen: 'Acreditación',
            descripcion: `Brecha en estándar ${estandar.codigo}`,
            responsableId: randomElement(users).id
        });
    }
  }
}

// ==========================================
// MAIN
// ==========================================
async function main() {
  console.log('🚀 Iniciando Seeders Transaccionales de Calidad...');
  
  try {
    const context = await getContextData();
    
    // Ejecutar por módulos
    await seedHabilitacionTransactions(context);
    await seedPamecTransactions(context);
    await seedSeguridadTransactions(context);
    await seedSicTransactions(context);
    await seedPqrsTransactions(context);
    await seedComitesTransactions(context);
    await seedDocumentosTransactions(context);
    await seedVigilanciaTransactions(context);
    await seedAcreditacionTransactions(context);
    
    console.log('\n✅ Seeders Transaccionales completados exitosamente.');
    
  } catch (error) {
    console.error('❌ Error en seeders transaccionales:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  main();
}

module.exports = { main };
