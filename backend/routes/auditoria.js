/**
 * Rutas de Auditoría HCE
 */
const { Hono } = require('hono');
const auditoriaService = require('../services/auditoria.service');
const { authMiddleware } = require('../middleware/auth');
const { success, error, paginated } = require('../utils/response');

const auditoria = new Hono();

// Todas las rutas requieren autenticación
auditoria.use('*', authMiddleware);

/**
 * GET /auditoria/entidad/:entidad/:entidad_id - Obtener auditoría de una entidad
 */
auditoria.get('/entidad/:entidad/:entidad_id', async (c) => {
  try {
    const { entidad, entidad_id } = c.req.param();
    const query = c.req.query();
    
    const result = await auditoriaService.getAuditoriaPorEntidad(entidad, entidad_id, query);
    return c.json(paginated(result.registros, result.pagination));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * GET /auditoria/paciente/:paciente_id - Obtener auditoría de un paciente
 */
auditoria.get('/paciente/:paciente_id', async (c) => {
  try {
    const { paciente_id } = c.req.param();
    const query = c.req.query();
    
    const result = await auditoriaService.getAuditoriaPaciente(paciente_id, query);
    return c.json(paginated(result.registros, result.pagination));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * GET /auditoria/usuario/:usuario_id - Obtener auditoría de un usuario
 */
auditoria.get('/usuario/:usuario_id', async (c) => {
  try {
    const { usuario_id } = c.req.param();
    const query = c.req.query();
    
    const result = await auditoriaService.getAuditoriaPorUsuario(usuario_id, query);
    return c.json(paginated(result.registros, result.pagination));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

module.exports = auditoria;
