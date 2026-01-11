/**
 * Cron Job: Limpieza de Reservas Expiradas
 *
 * Este job se ejecuta cada minuto para eliminar las reservas temporales
 * que han expirado (más de 5 minutos sin confirmar).
 *
 * Esto permite que los slots vuelvan a estar disponibles para otros usuarios.
 */
const cron = require('node-cron');
const reservaService = require('../services/reserva.service');

/**
 * Tarea de limpieza de reservas expiradas
 * Se ejecuta cada minuto
 */
const limpiarReservasJob = cron.schedule('* * * * *', async () => {
  try {
    const eliminadas = await reservaService.limpiarExpiradas();

    // Solo logear si se eliminaron reservas
    if (eliminadas > 0) {
      console.log(`[CRON] ${new Date().toISOString()} - Limpiadas ${eliminadas} reservas expiradas`);
    }
  } catch (error) {
    console.error('[CRON] Error al limpiar reservas expiradas:', error.message);
  }
}, {
  scheduled: false, // No iniciar automáticamente, se inicia desde server.js
  timezone: 'America/Bogota'
});

/**
 * Iniciar el cron job
 */
function iniciar() {
  limpiarReservasJob.start();
  console.log('[CRON] Job de limpieza de reservas iniciado (cada minuto)');
}

/**
 * Detener el cron job
 */
function detener() {
  limpiarReservasJob.stop();
  console.log('[CRON] Job de limpieza de reservas detenido');
}

module.exports = {
  iniciar,
  detener,
  job: limpiarReservasJob,
};
