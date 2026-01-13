/**
 * Rutas de Notificaciones para Doctores
 * Agrega notificaciones dinámicas basadas en datos reales del sistema
 */

const { Hono } = require('hono');
const prisma = require('../db/prisma');
const { authMiddleware } = require('../middleware/auth');
const { success, error } = require('../utils/response');

const router = new Hono();

router.use('*', authMiddleware);

/**
 * GET /notificaciones-doctor
 * Obtener notificaciones del doctor
 */
router.get('/', async (c) => {
  try {
    const doctorId = c.req.query('doctorId');
    const limit = parseInt(c.req.query('limit')) || 20;

    if (!doctorId) {
      return c.json(error('doctorId es requerido'), 400);
    }

    const notifications = [];
    const now = new Date();
    const todayStart = new Date(now.toDateString());
    const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);

    // 1. Pacientes en espera prolongada (más de 20 min) - Citas con estado EnEspera
    try {
      const citasEnEspera = await prisma.cita.findMany({
        where: {
          doctorId,
          estado: 'EnEspera',
          fecha: {
            gte: todayStart,
            lt: todayEnd
          }
        },
        include: {
          paciente: {
            select: { nombre: true, apellido: true }
          }
        },
        take: 10
      });

      citasEnEspera.forEach(cita => {
        // Calcular tiempo de espera desde la hora de la cita
        const horaCita = cita.hora ? new Date(cita.hora) : null;
        if (horaCita) {
          // Crear fecha completa combinando fecha de cita con hora
          const fechaCitaCompleta = new Date(cita.fecha);
          fechaCitaCompleta.setHours(horaCita.getUTCHours(), horaCita.getUTCMinutes(), 0, 0);

          const waitTime = Math.floor((now - fechaCitaCompleta) / 60000);

          if (waitTime > 20) {
            notifications.push({
              id: `wait-${cita.id}`,
              tipo: 'LONG_WAIT',
              titulo: 'Paciente en espera prolongada',
              mensaje: `${cita.paciente?.nombre || 'Paciente'} ${cita.paciente?.apellido || ''} lleva ${waitTime} minutos esperando`,
              leida: false,
              createdAt: fechaCitaCompleta.toISOString(),
              datos: { citaId: cita.id, pacienteId: cita.pacienteId }
            });
          }
        }
      });
    } catch (e) {
      console.error('Error cargando citas en espera:', e.message);
    }

    // 2. Órdenes médicas completadas (resultados listos)
    try {
      const ordenesCompletadas = await prisma.ordenMedica.findMany({
        where: {
          doctorId,
          estado: 'Completada',
          updatedAt: {
            gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) // Últimos 7 días
          }
        },
        include: {
          paciente: {
            select: { nombre: true, apellido: true }
          },
          examenProcedimiento: {
            select: { nombre: true, tipo: true }
          }
        },
        take: 10,
        orderBy: { updatedAt: 'desc' }
      });

      ordenesCompletadas.forEach(orden => {
        const tipo = orden.examenProcedimiento?.tipo;
        const tipoNotif = tipo === 'Laboratorio' ? 'LAB_RESULT' : 'IMAGING';

        notifications.push({
          id: `orden-${orden.id}`,
          tipo: tipoNotif,
          titulo: tipoNotif === 'LAB_RESULT' ? 'Resultados de laboratorio listos' : 'Imágenes disponibles',
          mensaje: `${orden.examenProcedimiento?.nombre || 'Examen'} de ${orden.paciente?.nombre || ''} ${orden.paciente?.apellido || ''} está disponible`,
          leida: false,
          createdAt: orden.updatedAt.toISOString(),
          datos: { ordenId: orden.id, pacienteId: orden.pacienteId }
        });
      });
    } catch (e) {
      console.error('Error cargando órdenes completadas:', e.message);
    }

    // 3. Interconsultas respondidas
    try {
      const interconsultasRespondidas = await prisma.interconsulta.findMany({
        where: {
          medicoSolicitanteId: doctorId,
          estado: 'Respondida',
          fechaRespuesta: {
            gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) // Últimos 7 días
          }
        },
        include: {
          paciente: {
            select: { nombre: true, apellido: true }
          }
        },
        take: 5,
        orderBy: { fechaRespuesta: 'desc' }
      });

      interconsultasRespondidas.forEach(ic => {
        notifications.push({
          id: `ic-${ic.id}`,
          tipo: 'INTERCONSULTA',
          titulo: 'Respuesta de interconsulta',
          mensaje: `Interconsulta de ${ic.especialidadSolicitada} para ${ic.paciente?.nombre || ''} ${ic.paciente?.apellido || ''} ha sido respondida`,
          leida: false,
          createdAt: (ic.fechaRespuesta || ic.fechaSolicitud).toISOString(),
          datos: { interconsultaId: ic.id, pacienteId: ic.pacienteId }
        });
      });
    } catch (e) {
      console.error('Error cargando interconsultas:', e.message);
    }

    // 4. Citas urgentes próximas (Alta o Urgente para hoy)
    try {
      const citasUrgentes = await prisma.cita.findMany({
        where: {
          doctorId,
          estado: { in: ['Programada', 'Confirmada'] },
          prioridad: { in: ['Alta', 'Urgente'] },
          fecha: {
            gte: todayStart,
            lt: todayEnd
          }
        },
        include: {
          paciente: {
            select: { nombre: true, apellido: true }
          }
        },
        take: 5,
        orderBy: { hora: 'asc' }
      });

      citasUrgentes.forEach(cita => {
        notifications.push({
          id: `urgent-${cita.id}`,
          tipo: 'URGENT',
          titulo: `Cita ${cita.prioridad}`,
          mensaje: `${cita.paciente?.nombre || ''} ${cita.paciente?.apellido || ''} - ${cita.motivo || 'Sin motivo especificado'}`,
          leida: false,
          createdAt: cita.createdAt.toISOString(),
          datos: { citaId: cita.id, pacienteId: cita.pacienteId }
        });
      });
    } catch (e) {
      console.error('Error cargando citas urgentes:', e.message);
    }

    // 5. Próximas citas (incluyendo futuras si no hay hoy)
    try {
      // Primero buscar citas de hoy
      let proximasCitas = await prisma.cita.findMany({
        where: {
          doctorId,
          estado: { in: ['Programada', 'Confirmada'] },
          fecha: {
            gte: todayStart,
            lt: todayEnd
          }
        },
        include: {
          paciente: {
            select: { nombre: true, apellido: true }
          },
          especialidad: {
            select: { titulo: true }
          }
        },
        take: 5,
        orderBy: { hora: 'asc' }
      });

      // Si no hay citas hoy, buscar próximas citas futuras
      if (proximasCitas.length === 0) {
        proximasCitas = await prisma.cita.findMany({
          where: {
            doctorId,
            estado: { in: ['Programada', 'Confirmada'] },
            fecha: { gte: todayStart }
          },
          include: {
            paciente: {
              select: { nombre: true, apellido: true }
            },
            especialidad: {
              select: { titulo: true }
            }
          },
          take: 5,
          orderBy: { fecha: 'asc' }
        });
      }

      if (proximasCitas.length > 0) {
        const esHoy = proximasCitas[0].fecha.toDateString() === todayStart.toDateString();
        notifications.push({
          id: `resumen-${todayStart.toISOString()}`,
          tipo: 'GENERAL',
          titulo: esHoy
            ? `${proximasCitas.length} citas programadas hoy`
            : `Próximas ${proximasCitas.length} citas`,
          mensaje: proximasCitas.map(c => {
            const fecha = new Date(c.fecha);
            const fechaStr = !esHoy ? ` (${fecha.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })})` : '';
            return `${c.paciente?.nombre || ''} ${c.paciente?.apellido || ''}${fechaStr}`;
          }).join(', '),
          leida: esHoy, // Las de hoy se muestran como leídas (informativo)
          createdAt: todayStart.toISOString(),
          datos: { tipo: 'resumen-citas', citas: proximasCitas.map(c => c.id) }
        });
      }
    } catch (e) {
      console.error('Error cargando resumen de citas:', e.message);
    }

    // Si no hay notificaciones, agregar mensaje de bienvenida
    if (notifications.length === 0) {
      notifications.push({
        id: `welcome-${now.toISOString()}`,
        tipo: 'GENERAL',
        titulo: 'Panel de notificaciones activo',
        mensaje: 'Las notificaciones de pacientes en espera, resultados de laboratorio, interconsultas y citas urgentes aparecerán aquí automáticamente.',
        leida: true,
        createdAt: now.toISOString(),
        datos: { tipo: 'bienvenida' }
      });
    }

    // Ordenar por fecha más reciente (no leídas primero)
    notifications.sort((a, b) => {
      // Primero las no leídas
      if (!a.leida && b.leida) return -1;
      if (a.leida && !b.leida) return 1;
      // Luego por fecha más reciente
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

    // Aplicar límite
    const limitedNotifications = notifications.slice(0, limit);

    return c.json(success(limitedNotifications, 'Notificaciones del doctor'));
  } catch (err) {
    console.error('Error en notificaciones doctor:', err);
    return c.json(error(err.message), 500);
  }
});

/**
 * PUT /notificaciones-doctor/:id/read
 * Marcar notificación como leída (para tracking local)
 */
router.put('/:id/read', async (c) => {
  try {
    const { id } = c.req.param();
    // Las notificaciones son virtuales, solo retornamos éxito
    return c.json(success({ id, read: true }, 'Notificación marcada como leída'));
  } catch (err) {
    return c.json(error(err.message), err.status || 500);
  }
});

module.exports = router;
