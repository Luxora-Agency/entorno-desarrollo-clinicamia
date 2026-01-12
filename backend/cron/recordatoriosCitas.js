/**
 * Cron Job: Recordatorios de Citas
 * Envía recordatorios automáticos por email:
 * - 7 días antes de la cita
 * - 4 días antes de la cita
 * - 3 horas antes de la cita (el mismo día)
 */
const cron = require('node-cron');
const prisma = require('../db/prisma');
const emailService = require('../services/email.service');

/**
 * Procesa y envía recordatorios de citas
 */
async function procesarRecordatorios() {
  const ahora = new Date();
  const hoy = new Date(ahora);
  hoy.setHours(0, 0, 0, 0);

  let enviados7Dias = 0;
  let enviados4Dias = 0;
  let enviados3Horas = 0;

  try {
    // =====================================================
    // RECORDATORIOS DE 7 DÍAS
    // =====================================================
    const fecha7Dias = new Date(hoy);
    fecha7Dias.setDate(fecha7Dias.getDate() + 7);

    const citas7Dias = await prisma.cita.findMany({
      where: {
        fecha: fecha7Dias,
        estado: 'Programada',
        recordatorio7Dias: false,
      },
      include: {
        paciente: { select: { id: true, nombre: true, apellido: true, email: true } },
        doctor: { select: { id: true, nombre: true, apellido: true } },
        especialidad: { select: { id: true, titulo: true } },
      },
    });

    for (const cita of citas7Dias) {
      if (!cita.paciente?.email) continue;

      try {
        const result = await emailService.sendAppointmentReminder({
          to: cita.paciente.email,
          paciente: cita.paciente,
          cita,
          doctor: cita.doctor,
          especialidad: cita.especialidad,
          tipoRecordatorio: '7dias',
        });

        if (result.success) {
          await prisma.cita.update({
            where: { id: cita.id },
            data: { recordatorio7Dias: true },
          });
          enviados7Dias++;
          console.log(`[Recordatorios] 7 días enviado a ${cita.paciente.email}`);
        }
      } catch (err) {
        console.error(`[Recordatorios] Error enviando 7 días a ${cita.paciente.email}:`, err.message);
      }
    }

    // =====================================================
    // RECORDATORIOS DE 4 DÍAS
    // =====================================================
    const fecha4Dias = new Date(hoy);
    fecha4Dias.setDate(fecha4Dias.getDate() + 4);

    const citas4Dias = await prisma.cita.findMany({
      where: {
        fecha: fecha4Dias,
        estado: 'Programada',
        recordatorio4Dias: false,
      },
      include: {
        paciente: { select: { id: true, nombre: true, apellido: true, email: true } },
        doctor: { select: { id: true, nombre: true, apellido: true } },
        especialidad: { select: { id: true, titulo: true } },
      },
    });

    for (const cita of citas4Dias) {
      if (!cita.paciente?.email) continue;

      try {
        const result = await emailService.sendAppointmentReminder({
          to: cita.paciente.email,
          paciente: cita.paciente,
          cita,
          doctor: cita.doctor,
          especialidad: cita.especialidad,
          tipoRecordatorio: '4dias',
        });

        if (result.success) {
          await prisma.cita.update({
            where: { id: cita.id },
            data: { recordatorio4Dias: true },
          });
          enviados4Dias++;
          console.log(`[Recordatorios] 4 días enviado a ${cita.paciente.email}`);
        }
      } catch (err) {
        console.error(`[Recordatorios] Error enviando 4 días a ${cita.paciente.email}:`, err.message);
      }
    }

    // =====================================================
    // RECORDATORIOS DE 3 HORAS (mismo día)
    // =====================================================
    // Buscar citas de hoy que tengan hora en las próximas 3-4 horas
    const horaActual = ahora.getHours();
    const minutosActuales = ahora.getMinutes();

    // Calcular rango de hora: citas entre 3 y 4 horas desde ahora
    const horaObjetivo = new Date(ahora);
    horaObjetivo.setHours(horaActual + 3, minutosActuales, 0, 0);

    const horaLimite = new Date(ahora);
    horaLimite.setHours(horaActual + 4, minutosActuales, 0, 0);

    const citasHoy = await prisma.cita.findMany({
      where: {
        fecha: hoy,
        estado: 'Programada',
        recordatorio3Horas: false,
      },
      include: {
        paciente: { select: { id: true, nombre: true, apellido: true, email: true } },
        doctor: { select: { id: true, nombre: true, apellido: true } },
        especialidad: { select: { id: true, titulo: true } },
      },
    });

    for (const cita of citasHoy) {
      if (!cita.paciente?.email || !cita.hora) continue;

      // Convertir hora de cita a Date para comparar
      const horaCita = new Date(hoy);
      if (cita.hora instanceof Date) {
        horaCita.setHours(cita.hora.getHours(), cita.hora.getMinutes(), 0, 0);
      } else {
        const [h, m] = String(cita.hora).split(':').map(Number);
        horaCita.setHours(h, m, 0, 0);
      }

      // Si la cita está entre 3 y 4 horas desde ahora, enviar recordatorio
      if (horaCita >= horaObjetivo && horaCita < horaLimite) {
        try {
          const result = await emailService.sendAppointmentReminder({
            to: cita.paciente.email,
            paciente: cita.paciente,
            cita,
            doctor: cita.doctor,
            especialidad: cita.especialidad,
            tipoRecordatorio: '3horas',
          });

          if (result.success) {
            await prisma.cita.update({
              where: { id: cita.id },
              data: { recordatorio3Horas: true },
            });
            enviados3Horas++;
            console.log(`[Recordatorios] 3 horas enviado a ${cita.paciente.email}`);
          }
        } catch (err) {
          console.error(`[Recordatorios] Error enviando 3 horas a ${cita.paciente.email}:`, err.message);
        }
      }
    }

    return { enviados7Dias, enviados4Dias, enviados3Horas };
  } catch (error) {
    console.error('[Recordatorios] Error general:', error);
    throw error;
  }
}

/**
 * Envía recordatorio de prueba a un email específico
 */
async function enviarRecordatorioPrueba(email, tipoRecordatorio = '7dias') {
  // Crear datos de prueba
  const pacientePrueba = {
    nombre: 'Paciente',
    apellido: 'Prueba',
    email: email,
  };

  const fechaPrueba = new Date();
  switch (tipoRecordatorio) {
    case '7dias':
      fechaPrueba.setDate(fechaPrueba.getDate() + 7);
      break;
    case '4dias':
      fechaPrueba.setDate(fechaPrueba.getDate() + 4);
      break;
    case '3horas':
      fechaPrueba.setHours(fechaPrueba.getHours() + 3);
      break;
  }

  const citaPrueba = {
    fecha: fechaPrueba,
    hora: new Date('1970-01-01T10:30:00'),
  };

  const doctorPrueba = {
    nombre: 'María',
    apellido: 'García',
  };

  const especialidadPrueba = {
    titulo: 'Medicina General',
  };

  return emailService.sendAppointmentReminder({
    to: email,
    paciente: pacientePrueba,
    cita: citaPrueba,
    doctor: doctorPrueba,
    especialidad: especialidadPrueba,
    tipoRecordatorio,
  });
}

/**
 * Inicializa el cron job de recordatorios
 */
function initRecordatoriosCitasCron() {
  // Ejecutar cada hora para verificar recordatorios
  // Esto permite capturar los recordatorios de 3 horas de forma precisa
  cron.schedule('0 * * * *', async () => {
    try {
      console.log('[Recordatorios] ========================================');
      console.log('[Recordatorios] Procesando recordatorios de citas...');
      console.log('[Recordatorios] Hora:', new Date().toLocaleString('es-CO', { timeZone: 'America/Bogota' }));

      const resultado = await procesarRecordatorios();

      console.log(`[Recordatorios] Enviados - 7 días: ${resultado.enviados7Dias}, 4 días: ${resultado.enviados4Dias}, 3 horas: ${resultado.enviados3Horas}`);
      console.log('[Recordatorios] ========================================');
    } catch (error) {
      console.error('[Recordatorios] Error en cron job:', error);
    }
  }, {
    scheduled: true,
    timezone: 'America/Bogota'
  });

  console.log('[CRON] ========================================');
  console.log('[CRON] Cron job de recordatorios de citas inicializado');
  console.log('[CRON] Horario: Cada hora (America/Bogota)');
  console.log('[CRON] Recordatorios: 7 días, 4 días, 3 horas antes');
  console.log('[CRON] Estado: HABILITADO');
  console.log('[CRON] ========================================');
}

module.exports = {
  initRecordatoriosCitasCron,
  procesarRecordatorios,
  enviarRecordatorioPrueba,
};
