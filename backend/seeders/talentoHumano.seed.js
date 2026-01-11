/**
 * Seeder completo para el módulo de Talento Humano
 * Crea datos de prueba para todos los submódulos
 */
const prisma = require('../db/prisma');

// Función para generar fecha aleatoria dentro de un rango
const randomDate = (start, end) => {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
};

// Función para generar número de documento aleatorio
const randomDoc = () => Math.floor(1000000000 + Math.random() * 900000000).toString();

async function seedTalentoHumano() {
  console.log('🌱 Iniciando seed de Talento Humano...\n');

  try {
    // Limpiar datos existentes para que el seeder sea idempotente
    console.log('🧹 Limpiando datos existentes...');

    // Eliminar en orden inverso a las dependencias
    await prisma.tHRespuestaEncuesta.deleteMany({});
    await prisma.tHEncuesta.deleteMany({});
    await prisma.tHAsistenteEvento.deleteMany({});
    await prisma.tHEvento.deleteMany({});
    await prisma.tHReconocimiento.deleteMany({});
    await prisma.tHFeedback.deleteMany({});
    await prisma.tHBeneficioEmpleado.deleteMany({});
    await prisma.tHBeneficio.deleteMany({});
    await prisma.tHAsistenteCapacitacion.deleteMany({});
    await prisma.tHSesionCapacitacion.deleteMany({});
    await prisma.tHCapacitacion.deleteMany({});
    await prisma.tHObjetivo.deleteMany({});
    await prisma.tHEvaluacionDesempeno.deleteMany({});
    await prisma.tHPeriodoEvaluacion.deleteMany({});
    await prisma.tHNominaDetalle.deleteMany({});
    await prisma.tHNovedadNomina.deleteMany({});
    await prisma.tHPeriodoNomina.deleteMany({});
    await prisma.tHPermiso.deleteMany({});
    await prisma.tHVacacion.deleteMany({});
    await prisma.tHAsistencia.deleteMany({});
    await prisma.tHAsignacionTurno.deleteMany({});
    await prisma.tHTurno.deleteMany({});
    await prisma.tHEntrevista.deleteMany({});
    await prisma.tHCandidatoVacante.deleteMany({});
    await prisma.tHCandidato.deleteMany({});
    await prisma.tHVacante.deleteMany({});
    await prisma.tHMovimiento.deleteMany({});
    await prisma.tHDocumentoEmpleado.deleteMany({});
    await prisma.tHContrato.deleteMany({});
    await prisma.tHEmpleado.deleteMany({});
    await prisma.tHCargo.deleteMany({});

    console.log('   ✅ Datos existentes eliminados\n');

    // Obtener usuario admin para createdBy
    let adminUser = await prisma.usuario.findFirst({
      where: { rol: { in: ['Admin', 'ADMIN', 'SuperAdmin', 'SUPER_ADMIN'] } }
    });
    if (!adminUser) {
      console.log('⚠️ No se encontró usuario admin. Creando uno...');
      adminUser = await prisma.usuario.create({
        data: {
          email: 'admin.th@clinicamia.com',
          password: '$2b$10$YourHashedPasswordHere', // placeholder
          nombre: 'Admin',
          apellido: 'TH',
          rol: 'Admin',
        }
      });
    }
    const createdById = adminUser.id;

    // Obtener departamentos existentes
    let departamentos = await prisma.departamento.findMany({ take: 5 });
    if (departamentos.length === 0) {
      console.log('Creando departamentos...');
      departamentos = await Promise.all([
        prisma.departamento.create({ data: { nombre: 'Urgencias', descripcion: 'Departamento de urgencias' } }),
        prisma.departamento.create({ data: { nombre: 'Consulta Externa', descripcion: 'Consultas ambulatorias' } }),
        prisma.departamento.create({ data: { nombre: 'Hospitalización', descripcion: 'Área de hospitalización' } }),
        prisma.departamento.create({ data: { nombre: 'Administración', descripcion: 'Área administrativa' } }),
        prisma.departamento.create({ data: { nombre: 'Laboratorio', descripcion: 'Laboratorio clínico' } }),
      ]);
    }

    // ============================================
    // 1. CARGOS
    // ============================================
    console.log('📋 Creando cargos...');
    const cargosData = [
      { codigo: 'DIR-001', nombre: 'Director Médico', nivel: 1, salarioMinimo: 15000000, salarioMaximo: 25000000, competencias: ['Liderazgo', 'Gestión', 'Medicina'] },
      { codigo: 'MED-001', nombre: 'Médico General', nivel: 2, salarioMinimo: 5000000, salarioMaximo: 8000000, competencias: ['Medicina General', 'Atención al paciente'] },
      { codigo: 'MED-002', nombre: 'Médico Especialista', nivel: 2, salarioMinimo: 8000000, salarioMaximo: 15000000, competencias: ['Especialidad médica', 'Investigación'] },
      { codigo: 'ENF-001', nombre: 'Jefe de Enfermería', nivel: 2, salarioMinimo: 4000000, salarioMaximo: 6000000, competencias: ['Liderazgo', 'Enfermería', 'Gestión'] },
      { codigo: 'ENF-002', nombre: 'Enfermero(a)', nivel: 3, salarioMinimo: 2500000, salarioMaximo: 4000000, competencias: ['Enfermería', 'Cuidado del paciente'] },
      { codigo: 'AUX-001', nombre: 'Auxiliar de Enfermería', nivel: 4, salarioMinimo: 1500000, salarioMaximo: 2500000, competencias: ['Apoyo clínico', 'Cuidado básico'] },
      { codigo: 'ADM-001', nombre: 'Coordinador Administrativo', nivel: 2, salarioMinimo: 3500000, salarioMaximo: 5500000, competencias: ['Administración', 'Gestión'] },
      { codigo: 'ADM-002', nombre: 'Asistente Administrativo', nivel: 4, salarioMinimo: 1500000, salarioMaximo: 2500000, competencias: ['Office', 'Atención al cliente'] },
      { codigo: 'REC-001', nombre: 'Recepcionista', nivel: 5, salarioMinimo: 1300000, salarioMaximo: 1800000, competencias: ['Atención al cliente', 'Comunicación'] },
      { codigo: 'LAB-001', nombre: 'Bacteriólogo', nivel: 3, salarioMinimo: 3500000, salarioMaximo: 5000000, competencias: ['Laboratorio', 'Análisis clínico'] },
      { codigo: 'LAB-002', nombre: 'Auxiliar de Laboratorio', nivel: 4, salarioMinimo: 1500000, salarioMaximo: 2200000, competencias: ['Laboratorio', 'Toma de muestras'] },
      { codigo: 'TEC-001', nombre: 'Técnico en Sistemas', nivel: 3, salarioMinimo: 2500000, salarioMaximo: 4000000, competencias: ['Tecnología', 'Soporte técnico'] },
    ];

    const cargos = [];
    for (const cargo of cargosData) {
      const created = await prisma.tHCargo.upsert({
        where: { codigo: cargo.codigo },
        update: cargo,
        create: { ...cargo, departamentoId: departamentos[Math.floor(Math.random() * departamentos.length)].id }
      });
      cargos.push(created);
    }
    console.log(`   ✅ ${cargos.length} cargos creados`);

    // ============================================
    // 2. EMPLEADOS
    // ============================================
    console.log('👥 Creando empleados...');
    const empleadosData = [
      // Activos
      { nombre: 'Carlos', apellido: 'Rodríguez Méndez', email: 'carlos.rodriguez@clinicamia.com', tipoEmpleado: 'MEDICO', estado: 'ACTIVO', cargoIdx: 1 },
      { nombre: 'Laura', apellido: 'Martínez Gómez', email: 'laura.martinez@clinicamia.com', tipoEmpleado: 'MEDICO', estado: 'ACTIVO', cargoIdx: 2 },
      { nombre: 'Ana María', apellido: 'López Pérez', email: 'ana.lopez@clinicamia.com', tipoEmpleado: 'ENFERMERIA', estado: 'ACTIVO', cargoIdx: 3 },
      { nombre: 'Juan Pablo', apellido: 'García Hernández', email: 'juan.garcia@clinicamia.com', tipoEmpleado: 'ENFERMERIA', estado: 'ACTIVO', cargoIdx: 4 },
      { nombre: 'María José', apellido: 'Sánchez Ruiz', email: 'maria.sanchez@clinicamia.com', tipoEmpleado: 'ENFERMERIA', estado: 'ACTIVO', cargoIdx: 5 },
      { nombre: 'Pedro', apellido: 'Jiménez Torres', email: 'pedro.jimenez@clinicamia.com', tipoEmpleado: 'ADMINISTRATIVO', estado: 'ACTIVO', cargoIdx: 6 },
      { nombre: 'Sofía', apellido: 'Ramírez Castro', email: 'sofia.ramirez@clinicamia.com', tipoEmpleado: 'ADMINISTRATIVO', estado: 'ACTIVO', cargoIdx: 7 },
      { nombre: 'Diego', apellido: 'Moreno Vargas', email: 'diego.moreno@clinicamia.com', tipoEmpleado: 'TECNICO', estado: 'ACTIVO', cargoIdx: 9 },
      { nombre: 'Valentina', apellido: 'Ortiz Mendoza', email: 'valentina.ortiz@clinicamia.com', tipoEmpleado: 'ASISTENCIAL', estado: 'ACTIVO', cargoIdx: 8 },
      { nombre: 'Andrés', apellido: 'Díaz Rojas', email: 'andres.diaz@clinicamia.com', tipoEmpleado: 'TECNICO', estado: 'ACTIVO', cargoIdx: 11 },
      // En vacaciones
      { nombre: 'Camila', apellido: 'Herrera Muñoz', email: 'camila.herrera@clinicamia.com', tipoEmpleado: 'ENFERMERIA', estado: 'VACACIONES', cargoIdx: 4 },
      // En incapacidad
      { nombre: 'Santiago', apellido: 'Pineda Osorio', email: 'santiago.pineda@clinicamia.com', tipoEmpleado: 'ADMINISTRATIVO', estado: 'INCAPACIDAD', cargoIdx: 7 },
      // Suspendido
      { nombre: 'Lucía', apellido: 'Fernández Villa', email: 'lucia.fernandez@clinicamia.com', tipoEmpleado: 'ASISTENCIAL', estado: 'SUSPENDIDO', cargoIdx: 5 },
      // Retirados
      { nombre: 'Roberto', apellido: 'Gómez Salazar', email: 'roberto.gomez@clinicamia.com', tipoEmpleado: 'MEDICO', estado: 'RETIRADO', cargoIdx: 1, fechaRetiro: new Date('2025-10-15') },
      { nombre: 'Patricia', apellido: 'Álvarez Duque', email: 'patricia.alvarez@clinicamia.com', tipoEmpleado: 'ENFERMERIA', estado: 'RETIRADO', cargoIdx: 4, fechaRetiro: new Date('2025-11-30') },
    ];

    const empleados = [];
    for (const emp of empleadosData) {
      const fechaIngreso = randomDate(new Date('2020-01-01'), new Date('2024-12-31'));
      const created = await prisma.tHEmpleado.create({
        data: {
          tipoDocumento: 'CC',
          documento: randomDoc(),
          nombre: emp.nombre,
          apellido: emp.apellido,
          email: emp.email,
          telefono: `3${Math.floor(100000000 + Math.random() * 900000000)}`,
          tipoEmpleado: emp.tipoEmpleado,
          estado: emp.estado,
          fechaIngreso,
          fechaRetiro: emp.fechaRetiro || null,
          cargoId: cargos[emp.cargoIdx].id,
          departamentoId: departamentos[Math.floor(Math.random() * departamentos.length)].id,
          fechaNacimiento: randomDate(new Date('1970-01-01'), new Date('2000-01-01')),
          genero: Math.random() > 0.5 ? 'M' : 'F',
          estadoCivil: ['SOLTERO', 'CASADO', 'UNION_LIBRE'][Math.floor(Math.random() * 3)],
          eps: ['Sura', 'Sanitas', 'Compensar', 'Nueva EPS'][Math.floor(Math.random() * 4)],
          afp: ['Porvenir', 'Protección', 'Colfondos', 'Skandia'][Math.floor(Math.random() * 4)],
          arl: 'Sura ARL',
          banco: ['Bancolombia', 'Davivienda', 'BBVA', 'Banco de Bogotá'][Math.floor(Math.random() * 4)],
          tipoCuenta: Math.random() > 0.5 ? 'AHORRO' : 'CORRIENTE',
          numeroCuenta: Math.floor(1000000000 + Math.random() * 9000000000).toString(),
        }
      });
      empleados.push(created);
    }
    console.log(`   ✅ ${empleados.length} empleados creados`);

    // ============================================
    // 3. CONTRATOS
    // ============================================
    console.log('📄 Creando contratos...');
    const contratos = [];
    for (const emp of empleados.filter(e => e.estado !== 'RETIRADO')) {
      const tipoContrato = ['INDEFINIDO', 'FIJO', 'PRESTACION_SERVICIOS'][Math.floor(Math.random() * 3)];
      const salarioBase = cargos.find(c => c.id === emp.cargoId)?.salarioMinimo || 2000000;

      const contrato = await prisma.tHContrato.create({
        data: {
          empleadoId: emp.id,
          numeroContrato: `CTR-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          tipoContrato,
          fechaInicio: emp.fechaIngreso,
          fechaFin: tipoContrato === 'FIJO' ? new Date(new Date().setFullYear(new Date().getFullYear() + 1)) : null,
          salarioBase,
          auxTransporte: salarioBase <= 2847000,
          jornada: 'COMPLETA',
          horasSemana: 48,
          periodoPruebaDias: tipoContrato === 'INDEFINIDO' ? 60 : null,
          estado: 'ACTIVO',
        }
      });
      contratos.push(contrato);
    }
    console.log(`   ✅ ${contratos.length} contratos creados`);

    // ============================================
    // 4. VACANTES
    // ============================================
    console.log('💼 Creando vacantes...');
    const vacantesData = [
      { titulo: 'Médico General - Urgencias', estado: 'ABIERTA', cargoIdx: 1 },
      { titulo: 'Enfermera para Hospitalización', estado: 'ABIERTA', cargoIdx: 4 },
      { titulo: 'Auxiliar de Enfermería - Turno Noche', estado: 'EN_PROCESO', cargoIdx: 5 },
      { titulo: 'Recepcionista Bilingüe', estado: 'EN_PROCESO', cargoIdx: 8 },
      { titulo: 'Coordinador de Calidad', estado: 'ABIERTA', cargoIdx: 6 },
      { titulo: 'Médico Especialista en Pediatría', estado: 'CERRADA', cargoIdx: 2 },
    ];

    const vacantes = [];
    for (const vac of vacantesData) {
      const cargo = cargos[vac.cargoIdx];
      const vacante = await prisma.tHVacante.create({
        data: {
          titulo: vac.titulo,
          descripcion: `Se requiere ${vac.titulo.toLowerCase()} para trabajar en nuestra clínica. Excelente ambiente laboral y beneficios.`,
          cargoId: cargo.id,
          departamentoId: departamentos[Math.floor(Math.random() * departamentos.length)].id,
          requisitos: {
            educacion: 'Profesional en el área',
            experiencia: '2 años mínimo',
            conocimientos: ['Atención al paciente', 'Trabajo en equipo']
          },
          salarioMin: cargo.salarioMinimo,
          salarioMax: cargo.salarioMaximo,
          tipoContrato: 'INDEFINIDO',
          jornada: 'COMPLETA',
          cantidadPuestos: Math.floor(Math.random() * 3) + 1,
          fechaApertura: randomDate(new Date('2025-10-01'), new Date()),
          fechaCierre: vac.estado === 'CERRADA' ? new Date() : null,
          estado: vac.estado,
          publicarExterno: true,
          createdBy: createdById,
        }
      });
      vacantes.push(vacante);
    }
    console.log(`   ✅ ${vacantes.length} vacantes creadas`);

    // ============================================
    // 5. CANDIDATOS
    // ============================================
    console.log('👤 Creando candidatos...');
    const candidatosData = [
      // Para vacante 1 (Médico General)
      { nombre: 'Fernando', apellido: 'Reyes López', estado: 'APLICADO', vacanteIdx: 0 },
      { nombre: 'Gabriela', apellido: 'Mendoza Arias', estado: 'EN_REVISION', vacanteIdx: 0 },
      { nombre: 'Héctor', apellido: 'Suárez Pineda', estado: 'PRESELECCIONADO', vacanteIdx: 0 },
      // Para vacante 2 (Enfermera)
      { nombre: 'Isabel', apellido: 'Quintero Ruiz', estado: 'ENTREVISTA_PROGRAMADA', vacanteIdx: 1 },
      { nombre: 'Juliana', apellido: 'Ospina Cardona', estado: 'ENTREVISTA_REALIZADA', vacanteIdx: 1 },
      { nombre: 'Kevin', apellido: 'Montoya Duque', estado: 'PRUEBAS_PENDIENTES', vacanteIdx: 1 },
      // Para vacante 3 (Auxiliar)
      { nombre: 'Lorena', apellido: 'Gutiérrez Mesa', estado: 'SELECCIONADO', vacanteIdx: 2 },
      { nombre: 'Manuel', apellido: 'Zapata Henao', estado: 'OFERTA_ENVIADA', vacanteIdx: 2 },
      // Rechazados
      { nombre: 'Natalia', apellido: 'Bernal Ríos', estado: 'RECHAZADO', vacanteIdx: 0 },
      { nombre: 'Oscar', apellido: 'Mejía Correa', estado: 'RECHAZADO', vacanteIdx: 1 },
      // Contratado
      { nombre: 'Paula', apellido: 'Agudelo Marín', estado: 'CONTRATADO', vacanteIdx: 5 },
    ];

    const candidatos = [];
    for (const cand of candidatosData) {
      const candidato = await prisma.tHCandidato.create({
        data: {
          tipoDocumento: 'CC',
          documento: randomDoc(),
          nombre: cand.nombre,
          apellido: cand.apellido,
          email: `${cand.nombre.toLowerCase()}.${cand.apellido.split(' ')[0].toLowerCase()}@gmail.com`,
          telefono: `3${Math.floor(100000000 + Math.random() * 900000000)}`,
          profesion: 'Profesional de la salud',
          nivelEducativo: 'PROFESIONAL',
          experienciaAnios: Math.floor(Math.random() * 10) + 1,
          expectativaSalarial: 3500000 + Math.floor(Math.random() * 3000000),
          disponibilidad: 'INMEDIATA',
          cvTexto: `Profesional con experiencia en el sector salud. Habilidades en atención al paciente, trabajo en equipo y manejo de situaciones de emergencia.`,
          scoreIA: Math.floor(Math.random() * 40) + 60,
          fuenteAplicacion: ['WEB', 'LINKEDIN', 'REFERIDO'][Math.floor(Math.random() * 3)],
        }
      });
      candidatos.push(candidato);

      // Crear relación candidato-vacante
      await prisma.tHCandidatoVacante.create({
        data: {
          candidatoId: candidato.id,
          vacanteId: vacantes[cand.vacanteIdx].id,
          estado: cand.estado,
          etapaActual: cand.estado,
          fechaAplicacion: randomDate(new Date('2025-11-01'), new Date()),
        }
      });
    }
    console.log(`   ✅ ${candidatos.length} candidatos creados`);

    // ============================================
    // 6. ENTREVISTAS
    // ============================================
    console.log('🎤 Creando entrevistas...');
    const entrevistasCreadas = [];
    const candidatosEntrevista = candidatos.slice(3, 6); // Isabel, Juliana, Kevin
    for (const cand of candidatosEntrevista) {
      const entrevista = await prisma.tHEntrevista.create({
        data: {
          candidatoId: cand.id,
          vacanteId: vacantes[1].id,
          tipo: ['TELEFONICA', 'VIRTUAL', 'PRESENCIAL'][Math.floor(Math.random() * 3)],
          fechaProgramada: randomDate(new Date(), new Date(new Date().setDate(new Date().getDate() + 14))),
          duracionMinutos: 60,
          modalidad: 'Virtual',
          entrevistadorId: createdById, // Usuario admin como entrevistador
          estado: ['PROGRAMADA', 'CONFIRMADA', 'COMPLETADA'][Math.floor(Math.random() * 3)],
          preguntasIA: {
            tecnicas: ['¿Cuál es su experiencia en emergencias?', '¿Cómo maneja situaciones de estrés?'],
            competencias: ['Cuénteme sobre un logro profesional', 'Descríbame cómo trabaja en equipo'],
          },
        }
      });
      entrevistasCreadas.push(entrevista);
    }
    console.log(`   ✅ ${entrevistasCreadas.length} entrevistas creadas`);

    // ============================================
    // 7. TURNOS
    // ============================================
    console.log('⏰ Creando turnos...');
    const turnosData = [
      { nombre: 'Turno Mañana', codigo: 'TM', horaInicio: '06:00', horaFin: '14:00', horasJornada: 8, esNocturno: false },
      { nombre: 'Turno Tarde', codigo: 'TT', horaInicio: '14:00', horaFin: '22:00', horasJornada: 8, esNocturno: false },
      { nombre: 'Turno Noche', codigo: 'TN', horaInicio: '22:00', horaFin: '06:00', horasJornada: 8, esNocturno: true },
      { nombre: 'Turno Administrativo', codigo: 'TA', horaInicio: '08:00', horaFin: '17:00', horasJornada: 8, esNocturno: false },
      { nombre: 'Turno Largo', codigo: 'TL', horaInicio: '06:00', horaFin: '18:00', horasJornada: 12, esNocturno: false },
    ];

    const turnos = [];
    for (const turno of turnosData) {
      const created = await prisma.tHTurno.upsert({
        where: { codigo: turno.codigo },
        update: { ...turno, horaInicio: turno.horaInicio, horaFin: turno.horaFin },
        create: {
          nombre: turno.nombre,
          codigo: turno.codigo,
          horaInicio: turno.horaInicio,
          horaFin: turno.horaFin,
          horasJornada: turno.horasJornada,
          esNocturno: turno.esNocturno,
          color: ['#3B82F6', '#10B981', '#6366F1', '#F59E0B', '#EF4444'][turnos.length],
        }
      });
      turnos.push(created);
    }
    console.log(`   ✅ ${turnos.length} turnos creados`);

    // ============================================
    // 8. ASISTENCIAS (Últimos 30 días)
    // ============================================
    console.log('📅 Creando registros de asistencia...');
    const empleadosActivos = empleados.filter(e => e.estado === 'ACTIVO');
    let asistenciasCount = 0;

    for (const emp of empleadosActivos) {
      for (let i = 0; i < 30; i++) {
        const fecha = new Date();
        fecha.setDate(fecha.getDate() - i);
        if (fecha.getDay() === 0) continue; // Saltar domingos

        const estado = Math.random() > 0.1 ? 'PRESENTE' : (Math.random() > 0.5 ? 'TARDANZA' : 'AUSENTE');

        try {
          await prisma.tHAsistencia.create({
            data: {
              empleadoId: emp.id,
              fecha,
              horaEntrada: estado !== 'AUSENTE' ? new Date(`${fecha.toISOString().split('T')[0]}T0${6 + Math.floor(Math.random() * 2)}:${Math.floor(Math.random() * 60).toString().padStart(2, '0')}:00`) : null,
              horaSalida: estado !== 'AUSENTE' ? new Date(`${fecha.toISOString().split('T')[0]}T${14 + Math.floor(Math.random() * 4)}:${Math.floor(Math.random() * 60).toString().padStart(2, '0')}:00`) : null,
              horasTrabajadas: estado !== 'AUSENTE' ? 8 + Math.random() * 2 : null,
              tipoRegistro: 'BIOMETRICO',
              estado,
              turnoId: turnos[Math.floor(Math.random() * turnos.length)].id,
            }
          });
          asistenciasCount++;
        } catch (e) {
          // Ignorar duplicados
        }
      }
    }
    console.log(`   ✅ ${asistenciasCount} registros de asistencia creados`);

    // ============================================
    // 9. VACACIONES Y PERMISOS
    // ============================================
    console.log('🏖️ Creando vacaciones y permisos...');
    const vacacionesData = [
      { empleadoIdx: 10, tipo: 'ORDINARIAS', dias: 15, estado: 'APROBADA' }, // Camila en vacaciones
      { empleadoIdx: 0, tipo: 'ORDINARIAS', dias: 5, estado: 'PENDIENTE' },
      { empleadoIdx: 2, tipo: 'ANTICIPADAS', dias: 3, estado: 'APROBADA' },
    ];

    for (const vac of vacacionesData) {
      await prisma.tHVacacion.create({
        data: {
          empleadoId: empleados[vac.empleadoIdx].id,
          tipo: vac.tipo,
          fechaInicio: new Date(),
          fechaFin: new Date(new Date().setDate(new Date().getDate() + vac.dias)),
          diasSolicitados: vac.dias,
          diasHabiles: vac.dias,
          estado: vac.estado,
        }
      });
    }

    const permisosData = [
      { empleadoIdx: 3, tipoPermiso: 'CITA_MEDICA', estado: 'APROBADA' },
      { empleadoIdx: 5, tipoPermiso: 'PERSONAL', estado: 'PENDIENTE' },
      { empleadoIdx: 7, tipoPermiso: 'ESTUDIO', estado: 'APROBADA' },
    ];

    for (const perm of permisosData) {
      await prisma.tHPermiso.create({
        data: {
          empleadoId: empleados[perm.empleadoIdx].id,
          tipoPermiso: perm.tipoPermiso,
          fechaInicio: new Date(),
          fechaFin: new Date(new Date().setHours(new Date().getHours() + 4)),
          motivo: 'Solicitud de permiso personal',
          estado: perm.estado,
        }
      });
    }
    console.log(`   ✅ Vacaciones y permisos creados`);

    // ============================================
    // 10. PERIODOS DE NÓMINA
    // ============================================
    console.log('💰 Creando periodos de nómina...');
    const periodosNomina = [];
    for (let mes = 1; mes <= 12; mes++) {
      for (let quincena = 1; quincena <= 2; quincena++) {
        const fechaInicio = new Date(2025, mes - 1, quincena === 1 ? 1 : 16);
        const fechaFin = new Date(2025, mes - 1, quincena === 1 ? 15 : new Date(2025, mes, 0).getDate());
        const fechaPago = new Date(fechaFin);
        fechaPago.setDate(fechaPago.getDate() + 3);

        const periodo = await prisma.tHPeriodoNomina.create({
          data: {
            anio: 2025,
            mes,
            quincena,
            fechaInicio,
            fechaFin,
            fechaPago,
            estado: mes < 12 ? 'PAGADO' : (quincena === 1 ? 'CERRADO' : 'ABIERTO'),
          }
        });
        periodosNomina.push(periodo);
      }
    }
    console.log(`   ✅ ${periodosNomina.length} periodos de nómina creados`);

    // Crear detalles para el último periodo cerrado
    const ultimoPeriodoCerrado = periodosNomina.find(p => p.estado === 'CERRADO');
    if (ultimoPeriodoCerrado) {
      for (const emp of empleadosActivos) {
        const contrato = contratos.find(c => c.empleadoId === emp.id);
        if (!contrato) continue;

        const salarioBase = Number(contrato.salarioBase) / 2; // Quincenal
        const auxTransporte = contrato.auxTransporte ? 81000 : 0; // Auxilio transporte 2025
        const totalDevengado = salarioBase + auxTransporte;
        const saludEmpleado = salarioBase * 0.04;
        const pensionEmpleado = salarioBase * 0.04;
        const totalDeducciones = saludEmpleado + pensionEmpleado;

        await prisma.tHNominaDetalle.create({
          data: {
            periodoId: ultimoPeriodoCerrado.id,
            empleadoId: emp.id,
            salarioBase,
            auxTransporte,
            totalDevengado,
            saludEmpleado,
            pensionEmpleado,
            totalDeducciones,
            netoPagar: totalDevengado - totalDeducciones,
            saludEmpresa: salarioBase * 0.085,
            pensionEmpresa: salarioBase * 0.12,
            arl: salarioBase * 0.00522,
            cajaCompensacion: salarioBase * 0.04,
            cesantias: totalDevengado * 0.0833,
            intCesantias: totalDevengado * 0.0833 * 0.12,
            prima: totalDevengado * 0.0833,
            vacacionesProv: salarioBase * 0.0417,
          }
        });
      }
      console.log(`   ✅ Detalles de nómina creados para ${empleadosActivos.length} empleados`);
    }

    // ============================================
    // 11. CAPACITACIONES
    // ============================================
    console.log('📚 Creando capacitaciones...');
    const capacitacionesData = [
      { nombre: 'Primeros Auxilios Básicos', modalidad: 'PRESENCIAL', duracion: 16, estado: 'EN_CURSO', categoria: 'Seguridad' },
      { nombre: 'Atención al Cliente en Salud', modalidad: 'VIRTUAL', duracion: 8, estado: 'PROGRAMADA', categoria: 'Servicio' },
      { nombre: 'Manejo de Historia Clínica Electrónica', modalidad: 'MIXTA', duracion: 12, estado: 'COMPLETADA', categoria: 'Tecnología' },
      { nombre: 'Seguridad del Paciente', modalidad: 'PRESENCIAL', duracion: 20, estado: 'PROGRAMADA', categoria: 'Calidad' },
      { nombre: 'Normativa Laboral 2025', modalidad: 'ELEARNING', duracion: 4, estado: 'EN_CURSO', categoria: 'Legal' },
      { nombre: 'Liderazgo en Equipos de Salud', modalidad: 'VIRTUAL', duracion: 8, estado: 'COMPLETADA', categoria: 'Liderazgo' },
    ];

    const capacitaciones = [];
    for (const cap of capacitacionesData) {
      const capacitacion = await prisma.tHCapacitacion.create({
        data: {
          nombre: cap.nombre,
          descripcion: `Capacitación en ${cap.nombre.toLowerCase()} para el personal de la clínica.`,
          categoria: cap.categoria,
          modalidad: cap.modalidad,
          duracionHoras: cap.duracion,
          instructor: 'Instructor Externo',
          esInterno: Math.random() > 0.5,
          costoTotal: Math.floor(Math.random() * 5000000) + 500000,
          cuposMaximos: 20,
          estado: cap.estado,
          fechaInicio: cap.estado === 'COMPLETADA' ? new Date('2025-10-01') : new Date(),
          fechaFin: cap.estado === 'COMPLETADA' ? new Date('2025-10-15') : new Date(new Date().setDate(new Date().getDate() + 14)),
        }
      });
      capacitaciones.push(capacitacion);

      // Inscribir empleados aleatorios
      const empleadosInscritos = empleadosActivos.slice(0, Math.floor(Math.random() * 8) + 3);
      for (const emp of empleadosInscritos) {
        await prisma.tHAsistenteCapacitacion.create({
          data: {
            capacitacionId: capacitacion.id,
            empleadoId: emp.id,
            estado: cap.estado === 'COMPLETADA' ? 'ASISTIO' : 'INSCRITO',
            asistio: cap.estado === 'COMPLETADA' ? true : null,
            notaEvaluacion: cap.estado === 'COMPLETADA' ? Math.floor(Math.random() * 20) + 80 : null,
          }
        });
      }
    }
    console.log(`   ✅ ${capacitaciones.length} capacitaciones creadas con asistentes`);

    // ============================================
    // 12. PERIODOS DE EVALUACIÓN Y EVALUACIONES
    // ============================================
    console.log('📊 Creando evaluaciones de desempeño...');
    const periodoEval = await prisma.tHPeriodoEvaluacion.create({
      data: {
        nombre: 'Evaluación Anual 2025',
        anio: 2025,
        tipo: 'ANUAL',
        fechaInicio: new Date('2025-12-01'),
        fechaFin: new Date('2025-12-31'),
        fechaLimiteEval: new Date('2025-12-20'),
        estado: 'ACTIVO',
        competencias: ['Trabajo en equipo', 'Orientación al cliente', 'Responsabilidad', 'Comunicación', 'Liderazgo'],
        pesosEvaluadores: { jefe: 50, auto: 30, pares: 20 },
      }
    });

    // Crear evaluaciones para empleados activos
    for (const emp of empleadosActivos) {
      // Autoevaluación
      await prisma.tHEvaluacionDesempeno.create({
        data: {
          periodoId: periodoEval.id,
          empleadoId: emp.id,
          evaluadorId: emp.id,
          tipoEvaluador: 'AUTO',
          estado: Math.random() > 0.5 ? 'COMPLETADA' : 'PENDIENTE',
          respuestas: Math.random() > 0.5 ? {
            'Trabajo en equipo': 4,
            'Orientación al cliente': 5,
            'Responsabilidad': 4,
            'Comunicación': 4,
            'Liderazgo': 3,
          } : null,
          scoreTotal: Math.random() > 0.5 ? 4.0 : null,
        }
      });

      // Evaluación del jefe
      await prisma.tHEvaluacionDesempeno.create({
        data: {
          periodoId: periodoEval.id,
          empleadoId: emp.id,
          evaluadorId: empleados[0].id, // El primer empleado como jefe
          tipoEvaluador: 'JEFE',
          estado: Math.random() > 0.7 ? 'COMPLETADA' : 'PENDIENTE',
          respuestas: Math.random() > 0.7 ? {
            'Trabajo en equipo': Math.floor(Math.random() * 2) + 3,
            'Orientación al cliente': Math.floor(Math.random() * 2) + 3,
            'Responsabilidad': Math.floor(Math.random() * 2) + 3,
            'Comunicación': Math.floor(Math.random() * 2) + 3,
            'Liderazgo': Math.floor(Math.random() * 2) + 3,
          } : null,
          scoreTotal: Math.random() > 0.7 ? 3.5 + Math.random() * 1.5 : null,
        }
      });
    }
    console.log(`   ✅ Periodo de evaluación y evaluaciones creadas`);

    // ============================================
    // 13. OBJETIVOS
    // ============================================
    console.log('🎯 Creando objetivos...');
    const objetivosData = [
      { titulo: 'Reducir tiempo de espera en urgencias', peso: 30 },
      { titulo: 'Completar certificación de calidad', peso: 25 },
      { titulo: 'Mejorar satisfacción del paciente', peso: 25 },
      { titulo: 'Implementar protocolo de seguridad', peso: 20 },
    ];

    for (const emp of empleadosActivos.slice(0, 5)) {
      for (const obj of objetivosData) {
        await prisma.tHObjetivo.create({
          data: {
            empleadoId: emp.id,
            anio: 2025,
            titulo: obj.titulo,
            descripcion: `Objetivo de ${obj.titulo.toLowerCase()} para el año 2025`,
            metrica: 'Porcentaje de cumplimiento',
            valorMeta: 100,
            valorActual: Math.floor(Math.random() * 100),
            peso: obj.peso,
            estado: Math.random() > 0.7 ? 'COMPLETADO' : 'EN_PROGRESO',
            progreso: Math.floor(Math.random() * 100),
          }
        });
      }
    }
    console.log(`   ✅ Objetivos creados`);

    // ============================================
    // 14. BENEFICIOS
    // ============================================
    console.log('🎁 Creando beneficios...');
    const beneficiosData = [
      { nombre: 'Seguro de Vida', tipo: 'SALUD', valorMensual: 50000 },
      { nombre: 'Medicina Prepagada', tipo: 'SALUD', valorMensual: 150000 },
      { nombre: 'Auxilio Educativo', tipo: 'EDUCACION', valorMensual: 200000 },
      { nombre: 'Bono de Alimentación', tipo: 'FINANCIERO', valorMensual: 100000 },
      { nombre: 'Gimnasio', tipo: 'RECREACION', valorMensual: 80000 },
    ];

    const beneficios = [];
    for (const ben of beneficiosData) {
      const beneficio = await prisma.tHBeneficio.create({
        data: {
          nombre: ben.nombre,
          descripcion: `Beneficio de ${ben.nombre.toLowerCase()} para empleados`,
          tipo: ben.tipo,
          valorMensual: ben.valorMensual,
          activo: true,
        }
      });
      beneficios.push(beneficio);
    }

    // Asignar beneficios a algunos empleados
    for (const emp of empleadosActivos.slice(0, 8)) {
      const beneficiosAleatorios = beneficios.slice(0, Math.floor(Math.random() * 3) + 1);
      for (const ben of beneficiosAleatorios) {
        await prisma.tHBeneficioEmpleado.create({
          data: {
            beneficioId: ben.id,
            empleadoId: emp.id,
            fechaInicio: emp.fechaIngreso,
            estado: 'ACTIVO',
          }
        });
      }
    }
    console.log(`   ✅ ${beneficios.length} beneficios creados y asignados`);

    // ============================================
    // 15. EVENTOS
    // ============================================
    console.log('🎉 Creando eventos...');
    const eventosData = [
      { titulo: 'Celebración de Cumpleaños - Enero', tipo: 'CELEBRACION', fecha: new Date('2025-01-25') },
      { titulo: 'Capacitación Anual de Seguridad', tipo: 'CAPACITACION', fecha: new Date('2025-01-15') },
      { titulo: 'Feria de Salud para Empleados', tipo: 'SALUD', fecha: new Date('2025-02-10') },
      { titulo: 'Integración Fin de Año', tipo: 'INTEGRACION', fecha: new Date('2025-12-20') },
    ];

    for (const evento of eventosData) {
      const ev = await prisma.tHEvento.create({
        data: {
          titulo: evento.titulo,
          descripcion: `Evento de ${evento.tipo.toLowerCase()} para el equipo de la clínica`,
          tipo: evento.tipo,
          fecha: evento.fecha,
          ubicacion: 'Instalaciones de la Clínica',
          cupoMaximo: 50,
          esObligatorio: evento.tipo === 'CAPACITACION',
          estado: 'PROGRAMADO',
        }
      });

      // Confirmar asistencia de algunos empleados
      for (const emp of empleadosActivos.slice(0, Math.floor(Math.random() * 10) + 5)) {
        await prisma.tHAsistenteEvento.create({
          data: {
            eventoId: ev.id,
            empleadoId: emp.id,
            confirmado: Math.random() > 0.3,
          }
        });
      }
    }
    console.log(`   ✅ ${eventosData.length} eventos creados`);

    // ============================================
    // 16. RECONOCIMIENTOS
    // ============================================
    console.log('🏆 Creando reconocimientos...');
    const reconocimientosData = [
      { empleadoIdx: 0, tipo: 'EMPLEADO_MES', titulo: 'Empleado del Mes - Noviembre 2025' },
      { empleadoIdx: 2, tipo: 'LOGRO', titulo: 'Mejor Atención al Paciente' },
      { empleadoIdx: 4, tipo: 'ANTIGUEDAD', titulo: '5 Años de Servicio' },
      { empleadoIdx: 6, tipo: 'VALORES', titulo: 'Reconocimiento por Trabajo en Equipo' },
    ];

    for (const rec of reconocimientosData) {
      await prisma.tHReconocimiento.create({
        data: {
          empleadoId: empleados[rec.empleadoIdx].id,
          tipo: rec.tipo,
          titulo: rec.titulo,
          descripcion: `Felicitaciones por ${rec.titulo.toLowerCase()}`,
          fecha: randomDate(new Date('2025-01-01'), new Date()),
          otorgadoPor: createdById, // UUID del usuario admin
          esPublico: true,
        }
      });
    }
    console.log(`   ✅ ${reconocimientosData.length} reconocimientos creados`);

    // ============================================
    // 17. FEEDBACK
    // ============================================
    console.log('💬 Creando feedback...');
    for (let i = 0; i < 10; i++) {
      await prisma.tHFeedback.create({
        data: {
          empleadoId: empleadosActivos[Math.floor(Math.random() * empleadosActivos.length)].id,
          deParte: empleadosActivos[Math.floor(Math.random() * empleadosActivos.length)].id,
          tipo: ['RECONOCIMIENTO', 'MEJORA', 'GENERAL'][Math.floor(Math.random() * 3)],
          contenido: [
            'Excelente trabajo en el proyecto de mejora continua',
            'Muy buena actitud con los pacientes',
            'Sugerencia: Mejorar la comunicación en los cambios de turno',
            'Felicitaciones por el manejo de la emergencia de ayer',
            'Gracias por el apoyo en el turno nocturno',
          ][Math.floor(Math.random() * 5)],
          esPublico: Math.random() > 0.5,
        }
      });
    }
    console.log(`   ✅ Feedback creado`);

    // ============================================
    // 18. ENCUESTAS
    // ============================================
    console.log('📋 Creando encuestas...');
    const encuesta = await prisma.tHEncuesta.create({
      data: {
        titulo: 'Encuesta de Clima Laboral 2025',
        descripcion: 'Evalúa tu satisfacción con el ambiente de trabajo',
        tipo: 'CLIMA',
        fechaInicio: new Date('2025-12-01'),
        fechaFin: new Date('2025-12-31'),
        esAnonima: true,
        estado: 'ACTIVA',
        preguntas: [
          { pregunta: '¿Qué tan satisfecho está con su trabajo?', tipo: 'escala', opciones: [1, 2, 3, 4, 5] },
          { pregunta: '¿Recomendaría trabajar en esta clínica?', tipo: 'si_no' },
          { pregunta: '¿Qué aspectos podríamos mejorar?', tipo: 'texto' },
          { pregunta: '¿Cómo califica el liderazgo de su jefe?', tipo: 'escala', opciones: [1, 2, 3, 4, 5] },
        ],
      }
    });

    // Algunas respuestas
    for (const emp of empleadosActivos.slice(0, 5)) {
      await prisma.tHRespuestaEncuesta.create({
        data: {
          encuestaId: encuesta.id,
          empleadoId: null, // Anónima
          respuestas: {
            '1': Math.floor(Math.random() * 5) + 1,
            '2': Math.random() > 0.3 ? 'SI' : 'NO',
            '3': 'Más capacitaciones y flexibilidad horaria',
            '4': Math.floor(Math.random() * 5) + 1,
          },
        }
      });
    }
    console.log(`   ✅ Encuesta de clima laboral creada con respuestas`);

    console.log('\n✅ Seed de Talento Humano completado exitosamente!\n');
    console.log('Resumen:');
    console.log(`   - ${cargos.length} cargos`);
    console.log(`   - ${empleados.length} empleados`);
    console.log(`   - ${contratos.length} contratos`);
    console.log(`   - ${vacantes.length} vacantes`);
    console.log(`   - ${candidatos.length} candidatos`);
    console.log(`   - ${turnos.length} turnos`);
    console.log(`   - ${periodosNomina.length} periodos de nómina`);
    console.log(`   - ${capacitaciones.length} capacitaciones`);
    console.log(`   - Y más datos de prueba...\n`);

  } catch (error) {
    console.error('❌ Error en seed:', error);
    throw error;
  }
}

async function main() {
  try {
    await seedTalentoHumano();
  } catch (e) {
    console.error(e);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  main();
}

module.exports = { seedTalentoHumano };
