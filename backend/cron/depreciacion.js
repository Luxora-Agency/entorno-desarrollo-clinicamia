/**
 * Cron Job - Depreciación Automática de Activos Fijos
 *
 * Ejecuta el cálculo de depreciación mensual el día 1 de cada mes a las 2:00 AM
 * Zona horaria: America/Bogota
 */

const cron = require('node-cron');
const activoFijoService = require('../services/activoFijo.service');

class DepreciacionCronJob {
  constructor() {
    this.job = null;
    this.isRunning = false;
  }

  /**
   * Iniciar el cron job
   */
  iniciar() {
    // Ejecutar el día 1 de cada mes a las 2:00 AM (Colombia)
    // Formato: segundo minuto hora díaMes mes díaSemana
    this.job = cron.schedule('0 0 2 1 * *', async () => {
      await this.ejecutarDepreciacion();
    }, {
      scheduled: true,
      timezone: 'America/Bogota'
    });

    console.log('[CRON] ========================================');
    console.log('[CRON] Cron job de depreciación de activos inicializado');
    console.log('[CRON] Horario: Día 1 de cada mes a las 2:00 AM (America/Bogota)');
    console.log('[CRON] Estado: HABILITADO');
    console.log('[CRON] ========================================');

    return this;
  }

  /**
   * Ejecutar depreciación del mes anterior
   */
  async ejecutarDepreciacion() {
    if (this.isRunning) {
      console.log('[CRON] Depreciación ya en ejecución, omitiendo...');
      return;
    }

    this.isRunning = true;
    const inicio = Date.now();

    try {
      // Calcular el período del mes anterior
      const ahora = new Date();
      const mesAnterior = new Date(ahora.getFullYear(), ahora.getMonth() - 1, 1);
      const periodo = `${mesAnterior.getFullYear()}-${String(mesAnterior.getMonth() + 1).padStart(2, '0')}`;

      console.log(`[CRON] Iniciando depreciación automática para período ${periodo}...`);

      const resultado = await activoFijoService.ejecutarDepreciacionMensual(periodo, 'SISTEMA');

      const duracion = ((Date.now() - inicio) / 1000).toFixed(2);

      console.log('[CRON] ========================================');
      console.log(`[CRON] Depreciación completada en ${duracion}s`);
      console.log(`[CRON] Período: ${periodo}`);
      console.log(`[CRON] Activos procesados: ${resultado.procesados}`);
      console.log(`[CRON] Activos omitidos: ${resultado.omitidos}`);
      console.log(`[CRON] Total depreciación: $${resultado.totalDepreciacion.toLocaleString('es-CO')}`);
      console.log('[CRON] ========================================');

      return resultado;
    } catch (error) {
      // Si ya se ejecutó este período, no es un error crítico
      if (error.message.includes('Ya se ejecutó la depreciación')) {
        console.log(`[CRON] Depreciación ya ejecutada para este período, omitiendo...`);
        return null;
      }

      console.error('[CRON] Error ejecutando depreciación automática:', error.message);
      throw error;
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Ejecutar manualmente (para testing o ejecución forzada)
   */
  async ejecutarManual(periodo) {
    if (!periodo) {
      const ahora = new Date();
      periodo = `${ahora.getFullYear()}-${String(ahora.getMonth() + 1).padStart(2, '0')}`;
    }

    console.log(`[CRON] Ejecución manual de depreciación para período ${periodo}`);
    return this.ejecutarDepreciacion();
  }

  /**
   * Detener el cron job
   */
  detener() {
    if (this.job) {
      this.job.stop();
      console.log('[CRON] Cron job de depreciación detenido');
    }
  }

  /**
   * Obtener estado del job
   */
  getEstado() {
    return {
      activo: this.job?.running || false,
      ejecutando: this.isRunning,
      proximaEjecucion: this.getProximaEjecucion()
    };
  }

  /**
   * Calcular próxima ejecución
   */
  getProximaEjecucion() {
    const ahora = new Date();
    let proxima;

    if (ahora.getDate() === 1 && ahora.getHours() < 2) {
      // Hoy es día 1 y aún no son las 2 AM
      proxima = new Date(ahora.getFullYear(), ahora.getMonth(), 1, 2, 0, 0);
    } else {
      // Próximo mes día 1
      proxima = new Date(ahora.getFullYear(), ahora.getMonth() + 1, 1, 2, 0, 0);
    }

    return proxima.toISOString();
  }
}

module.exports = new DepreciacionCronJob();
