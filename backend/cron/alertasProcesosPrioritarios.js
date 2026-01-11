const cron = require('node-cron');
const alertaService = require('../services/calidad2/procesos-prioritarios/alerta.service');

/**
 * Cron job para generar alertas automáticas de Procesos Prioritarios
 * Ejecuta diariamente a las 6:30 AM
 *
 * Genera alertas para:
 * - Eventos adversos sin analizar (>7 días)
 * - GPCs próximas a revisión (30 días)
 * - PQRSF vencidas
 * - Actas de comités pendientes (>7 días después de reunión)
 */

// Schedule: "30 6 * * *" = Every day at 6:30 AM
const schedule = '30 6 * * *';

const job = cron.schedule(schedule, async () => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] Ejecutando cron job de alertas de Procesos Prioritarios...`);

  try {
    const result = await alertaService.generarTodasAlertas();
    console.log(`[${timestamp}] ✅ ${result.generadas} alertas generadas exitosamente`);
  } catch (error) {
    console.error(`[${timestamp}] ❌ Error generando alertas de Procesos Prioritarios:`, error);
  }
}, {
  scheduled: false, // Don't start automatically, will be started manually
  timezone: 'America/Bogota', // Colombia timezone
});

module.exports = {
  job,
  start: () => {
    job.start();
    console.log('[Cron] Alertas Procesos Prioritarios - Programado para las 6:30 AM diariamente');
  },
  stop: () => {
    job.stop();
    console.log('[Cron] Alertas Procesos Prioritarios - Detenido');
  },
  runNow: async () => {
    console.log('[Cron] Alertas Procesos Prioritarios - Ejecución manual');
    try {
      const result = await alertaService.generarTodasAlertas();
      console.log(`[Cron] ✅ ${result.generadas} alertas generadas`);
      return result;
    } catch (error) {
      console.error('[Cron] ❌ Error:', error);
      throw error;
    }
  },
};
