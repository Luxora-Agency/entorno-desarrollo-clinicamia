const cron = require('node-cron');
const alertaMedicamentoService = require('../services/calidad2/medicamentos/alerta.service');

/**
 * Cron job to generate automatic alerts for medicamentos module
 * Runs every day at 6:00 AM
 *
 * Alert types generated:
 * - VENCIMIENTO_MEDICAMENTO: Items expiring in 30/60/90 days or already expired
 * - STOCK_BAJO: Items below minimum stock level
 * - TEMPERATURA_FUERA_RANGO: Temperature out of acceptable range
 * - HUMEDAD_FUERA_RANGO: Humidity out of acceptable range
 */

// Schedule: Run at 6:00 AM every day
// Cron pattern: minute hour day month weekday
// 0 6 * * * = At 6:00 AM every day
const schedule = '0 6 * * *';

let cronJob;

function startCronJob() {
  if (cronJob) {
    console.log('[CRON] Alertas Medicamentos job already running');
    return;
  }

  cronJob = cron.schedule(schedule, async () => {
    const timestamp = new Date().toISOString();
    console.log(`\n[CRON ${timestamp}] ==========================================`);
    console.log('[CRON] Ejecutando generación automática de alertas de medicamentos...');

    try {
      const resultado = await alertaMedicamentoService.generarTodasAlertas('SYSTEM');

      console.log('[CRON] ✓ Generación completada exitosamente');
      console.log(`[CRON] Total de alertas generadas: ${resultado.totalAlertas}`);
      console.log('[CRON] Detalles:');
      console.log(`[CRON]   - Vencimientos: ${resultado.detalles.vencimientos.alertasCreadas}`);
      console.log(`[CRON]   - Stock Bajo: ${resultado.detalles.stock.alertasCreadas}`);
      console.log(`[CRON]   - Temperatura/Humedad: ${resultado.detalles.temperatura.alertasCreadas}`);
      console.log('[CRON] ==========================================\n');
    } catch (error) {
      console.error('[CRON] ✗ Error en generación de alertas:', error.message);
      console.error('[CRON] Stack:', error.stack);
    }
  }, {
    scheduled: true,
    timezone: 'America/Bogota', // Colombian timezone
  });

  console.log('[CRON] Alertas Medicamentos job iniciado');
  console.log(`[CRON] Programado para ejecutarse: ${schedule} (6:00 AM diario)`);
  console.log('[CRON] Zona horaria: America/Bogota');
}

function stopCronJob() {
  if (cronJob) {
    cronJob.stop();
    cronJob = null;
    console.log('[CRON] Alertas Medicamentos job detenido');
  }
}

// Auto-start when module is loaded (unless in test environment)
if (process.env.NODE_ENV !== 'test') {
  startCronJob();
}

module.exports = {
  startCronJob,
  stopCronJob,
};
