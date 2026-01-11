const cron = require('node-cron');
const alertaDocumentoLegalService = require('../services/calidad2/infraestructura/alertaDocumentoLegal.service');

/**
 * Cron Job: Generar alertas de documentos legales
 *
 * Ejecuta diariamente a las 8:00 AM
 *
 * Formato cron: minuto hora día mes día-semana
 * '0 8 * * *' = Todos los días a las 8:00 AM
 */

// Variable para controlar si el job está habilitado
let jobEnabled = process.env.ENABLE_CRON_JOBS !== 'false';

// Programar el cron job
const job = cron.schedule('0 8 * * *', async () => {
  if (!jobEnabled) {
    console.log('[CRON] Job de alertas deshabilitado');
    return;
  }

  console.log('[CRON] ========================================');
  console.log('[CRON] Iniciando job de alertas de documentos legales');
  console.log('[CRON] Fecha:', new Date().toISOString());
  console.log('[CRON] ========================================');

  try {
    const resultado = await alertaDocumentoLegalService.generarAlertasPendientes();

    console.log('[CRON] ========================================');
    console.log('[CRON] Job completado exitosamente');
    console.log('[CRON] Alertas creadas:', resultado.alertasCreadas);
    console.log('[CRON] Errores:', resultado.errores.length);

    if (resultado.errores.length > 0) {
      console.log('[CRON] Detalles de errores:');
      resultado.errores.forEach((err, index) => {
        console.log(`[CRON]   ${index + 1}. Documento: ${err.documentoNombre}`);
        console.log(`[CRON]      Error: ${err.error}`);
      });
    }

    console.log('[CRON] ========================================');
  } catch (error) {
    console.error('[CRON] ========================================');
    console.error('[CRON] ERROR CRÍTICO en job de alertas');
    console.error('[CRON] Mensaje:', error.message);
    console.error('[CRON] Stack:', error.stack);
    console.error('[CRON] ========================================');
  }
}, {
  scheduled: true,
  timezone: 'America/Bogota', // Timezone de Colombia
});

/**
 * Ejecutar manualmente el job (útil para testing)
 */
async function runManually() {
  console.log('[MANUAL] Ejecutando job de alertas manualmente...');

  try {
    const resultado = await alertaDocumentoLegalService.generarAlertasPendientes();
    console.log('[MANUAL] Job completado');
    console.log('[MANUAL] Resultado:', resultado);
    return resultado;
  } catch (error) {
    console.error('[MANUAL] Error:', error);
    throw error;
  }
}

/**
 * Habilitar/deshabilitar el job
 */
function setEnabled(enabled) {
  jobEnabled = enabled;
  console.log(`[CRON] Job de alertas ${enabled ? 'habilitado' : 'deshabilitado'}`);
}

/**
 * Obtener estado del job
 */
function getStatus() {
  return {
    enabled: jobEnabled,
    scheduled: true,
    nextRun: 'Diariamente a las 8:00 AM (America/Bogota)',
    timezone: 'America/Bogota',
  };
}

// Exportar funciones útiles
module.exports = {
  job,
  runManually,
  setEnabled,
  getStatus,
};

// Log de inicio
console.log('[CRON] ========================================');
console.log('[CRON] Cron job de alertas de documentos legales inicializado');
console.log('[CRON] Horario: Diariamente a las 8:00 AM (America/Bogota)');
console.log('[CRON] Estado:', jobEnabled ? 'HABILITADO' : 'DESHABILITADO');
console.log('[CRON] ========================================');
