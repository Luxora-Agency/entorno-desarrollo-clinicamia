/**
 * Cron Job: Expiración y Notificaciones MiaPass
 * - Marca suscripciones vencidas diariamente a las 00:01
 * - Envía notificaciones de próximo vencimiento (30, 15, 7 días)
 */
const cron = require('node-cron');
const prisma = require('../db/prisma');
const miaPassNotificationService = require('../services/miaPassNotification.service');

function initMiaPassExpirationCron() {
  // Diariamente a las 00:01 AM (Colombia timezone)
  cron.schedule('1 0 * * *', async () => {
    try {
      console.log('[MiaPass CRON] ========================================');
      console.log('[MiaPass CRON] Iniciando tareas diarias...');
      console.log('[MiaPass CRON] ========================================');

      // 1. MARCAR SUSCRIPCIONES VENCIDAS
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);

      const resultado = await prisma.miaPassSuscripcion.updateMany({
        where: {
          estado: 'ACTIVA',
          fechaFin: { lt: hoy }
        },
        data: {
          estado: 'VENCIDA'
        }
      });

      if (resultado.count > 0) {
        console.log(`[MiaPass CRON] ${resultado.count} suscripciones marcadas como VENCIDA`);
      } else {
        console.log('[MiaPass CRON] No hay suscripciones para marcar como vencidas');
      }

      // 2. ENVIAR NOTIFICACIONES DE PRÓXIMO VENCIMIENTO
      console.log('[MiaPass CRON] Procesando notificaciones de vencimiento...');
      const notifResult = await miaPassNotificationService.procesarNotificacionesVencimiento();
      console.log(`[MiaPass CRON] ${notifResult.notificacionesEnviadas} notificaciones de vencimiento enviadas`);

      console.log('[MiaPass CRON] ========================================');
      console.log('[MiaPass CRON] Tareas diarias completadas');
      console.log('[MiaPass CRON] ========================================');
    } catch (error) {
      console.error('[MiaPass CRON] Error en cron de expiración:', error);
    }
  }, {
    scheduled: true,
    timezone: 'America/Bogota'
  });

  console.log('[CRON] ========================================');
  console.log('[CRON] Cron job de MiaPass inicializado');
  console.log('[CRON] Horario: Diariamente a las 00:01 AM (America/Bogota)');
  console.log('[CRON] Tareas: Expiración + Notificaciones de vencimiento');
  console.log('[CRON] Estado: HABILITADO');
  console.log('[CRON] ========================================');
}

module.exports = { initMiaPassExpirationCron };
