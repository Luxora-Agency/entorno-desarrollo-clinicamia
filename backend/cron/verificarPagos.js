/**
 * Cron Job: Verificación de Pagos ePayco
 *
 * Este job verifica periódicamente el estado de los pagos pendientes
 * con ePayco y actualiza el estado de las citas correspondientes.
 *
 * Útil para casos donde el webhook no llegó o hubo problemas de comunicación.
 */
const cron = require('node-cron');
const prisma = require('../db/prisma');
const epaycoService = require('../services/epayco.service');

/**
 * Verificar estado de un pago en ePayco
 * @param {string} refPayco - Referencia de ePayco
 * @returns {Object} Estado del pago
 */
async function verificarPagoEpayco(refPayco) {
  try {
    const response = await fetch(
      `https://secure.epayco.co/validation/v1/reference/${refPayco}`
    );

    if (!response.ok) {
      return { success: false, error: 'Error consultando ePayco' };
    }

    const data = await response.json();

    if (!data.success || !data.data) {
      return { success: false, error: 'Respuesta inválida de ePayco' };
    }

    // x_cod_response: 1=Aceptada, 2=Rechazada, 3=Pendiente, 4=Fallida
    const statusMap = {
      1: 'approved',
      2: 'rejected',
      3: 'pending',
      4: 'failed',
    };

    return {
      success: true,
      status: statusMap[data.data.x_cod_response] || 'unknown',
      refPayco: data.data.x_ref_payco,
      transactionId: data.data.x_transaction_id,
      amount: data.data.x_amount,
      responseReason: data.data.x_response_reason_text,
      rawResponse: data.data,
    };
  } catch (error) {
    console.error('[CRON Pagos] Error verificando pago:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Procesar pagos pendientes
 */
async function procesarPagosPendientes() {
  let procesados = 0;
  let actualizados = 0;

  try {
    // Buscar sesiones de pago pendientes con referencia de ePayco
    const sesionesPendientes = await prisma.paymentSession.findMany({
      where: {
        status: 'pending',
        epaycoRef: { not: null },
        // Solo verificar sesiones creadas hace más de 2 minutos
        createdAt: {
          lt: new Date(Date.now() - 2 * 60 * 1000),
        },
      },
      include: {
        cita: {
          select: {
            id: true,
            estado: true,
            paciente: {
              select: {
                email: true,
                nombre: true,
                apellido: true,
              },
            },
            especialidad: {
              select: {
                titulo: true,
              },
            },
            doctor: {
              select: {
                nombre: true,
                apellido: true,
              },
            },
          },
        },
      },
    });

    for (const sesion of sesionesPendientes) {
      procesados++;

      const resultado = await verificarPagoEpayco(sesion.epaycoRef);

      if (!resultado.success) {
        console.log(`[CRON Pagos] No se pudo verificar pago ${sesion.epaycoRef}: ${resultado.error}`);
        continue;
      }

      // Si el estado cambió, actualizar
      if (resultado.status !== 'pending' && resultado.status !== sesion.status) {
        console.log(`[CRON Pagos] Actualizando pago ${sesion.epaycoRef}: ${sesion.status} -> ${resultado.status}`);

        // Actualizar sesión de pago
        await prisma.paymentSession.update({
          where: { id: sesion.id },
          data: {
            status: resultado.status,
            responseCode: String(resultado.rawResponse?.x_cod_response || ''),
            responseMessage: resultado.responseReason,
          },
        });

        // Si fue aprobado, completar el pago
        if (resultado.status === 'approved' && sesion.cita?.estado === 'PendientePago') {
          try {
            await epaycoService.completePayment(sesion.citaId, {
              status: resultado.status,
              refPayco: resultado.refPayco,
              transactionId: resultado.transactionId,
              amount: resultado.amount,
              responseReason: resultado.responseReason,
            });
            actualizados++;
            console.log(`[CRON Pagos] Cita ${sesion.citaId} actualizada a Programada`);
          } catch (err) {
            console.error(`[CRON Pagos] Error completando pago para cita ${sesion.citaId}:`, err.message);
          }
        }

        // Si fue rechazado o fallido, cancelar la cita
        if ((resultado.status === 'rejected' || resultado.status === 'failed') &&
            sesion.cita?.estado === 'PendientePago') {
          await prisma.cita.update({
            where: { id: sesion.citaId },
            data: { estado: 'Cancelada' },
          });
          actualizados++;
          console.log(`[CRON Pagos] Cita ${sesion.citaId} cancelada por pago ${resultado.status}`);
        }
      }
    }

    // También buscar citas PendientePago sin sesión que tienen más de 24 horas
    const citasExpiradas = await prisma.cita.findMany({
      where: {
        estado: 'PendientePago',
        createdAt: {
          lt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 24 horas
        },
      },
      select: { id: true },
    });

    for (const cita of citasExpiradas) {
      await prisma.cita.update({
        where: { id: cita.id },
        data: { estado: 'Cancelada' },
      });
      actualizados++;
      console.log(`[CRON Pagos] Cita ${cita.id} cancelada por expiración (24h sin pago)`);
    }

  } catch (error) {
    console.error('[CRON Pagos] Error procesando pagos:', error.message);
  }

  return { procesados, actualizados };
}

/**
 * Tarea de verificación de pagos
 * Se ejecuta cada 5 minutos
 */
const verificarPagosJob = cron.schedule('*/5 * * * *', async () => {
  try {
    const resultado = await procesarPagosPendientes();

    // Solo logear si hubo actividad
    if (resultado.procesados > 0 || resultado.actualizados > 0) {
      console.log(`[CRON Pagos] ${new Date().toISOString()} - Procesados: ${resultado.procesados}, Actualizados: ${resultado.actualizados}`);
    }
  } catch (error) {
    console.error('[CRON Pagos] Error en job:', error.message);
  }
}, {
  scheduled: false,
  timezone: 'America/Bogota',
});

/**
 * Iniciar el cron job
 */
function iniciar() {
  verificarPagosJob.start();
  console.log('[CRON] ========================================');
  console.log('[CRON] Cron job de verificación de pagos inicializado');
  console.log('[CRON] Horario: Cada 5 minutos');
  console.log('[CRON] Estado: HABILITADO');
  console.log('[CRON] ========================================');
}

/**
 * Detener el cron job
 */
function detener() {
  verificarPagosJob.stop();
  console.log('[CRON Pagos] Job detenido');
}

/**
 * Ejecutar verificación manualmente
 */
async function ejecutarManualmente() {
  console.log('[CRON Pagos] Ejecutando verificación manual...');
  return await procesarPagosPendientes();
}

module.exports = {
  iniciar,
  detener,
  ejecutarManualmente,
  job: verificarPagosJob,
};
