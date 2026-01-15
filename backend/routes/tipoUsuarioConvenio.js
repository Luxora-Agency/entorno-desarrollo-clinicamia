const { Hono } = require('hono');
const { authMiddleware, permissionMiddleware } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { success, error } = require('../utils/response');
const tipoUsuarioConvenioService = require('../services/tipoUsuarioConvenio.service');
const {
  createTipoUsuarioConvenioSchema,
  updateTipoUsuarioConvenioSchema,
} = require('../validators/tipoUsuarioConvenio.schema');

const router = new Hono();

// Listar todos los tipos de usuario (público para el formulario de paciente)
router.get('/', authMiddleware, async (c) => {
  try {
    const incluirInactivos = c.req.query('incluirInactivos') === 'true';
    const tipos = await tipoUsuarioConvenioService.listar(incluirInactivos);
    return c.json(success(tipos, 'Tipos de usuario obtenidos exitosamente'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// Obtener por ID
router.get('/:id', authMiddleware, async (c) => {
  try {
    const { id } = c.req.param();
    const tipo = await tipoUsuarioConvenioService.obtenerPorId(id);
    return c.json(success(tipo, 'Tipo de usuario obtenido exitosamente'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// Crear nuevo tipo de usuario (solo admin)
router.post(
  '/',
  authMiddleware,
  permissionMiddleware('configuracion'),
  validate(createTipoUsuarioConvenioSchema),
  async (c) => {
    try {
      const data = c.req.validData;
      const tipo = await tipoUsuarioConvenioService.crear(data);
      return c.json(success(tipo, 'Tipo de usuario creado exitosamente'), 201);
    } catch (err) {
      return c.json(error(err.message), err.statusCode || 500);
    }
  }
);

// Actualizar tipo de usuario (solo admin)
router.put(
  '/:id',
  authMiddleware,
  permissionMiddleware('configuracion'),
  validate(updateTipoUsuarioConvenioSchema),
  async (c) => {
    try {
      const { id } = c.req.param();
      const data = c.req.validData;
      const tipo = await tipoUsuarioConvenioService.actualizar(id, data);
      return c.json(success(tipo, 'Tipo de usuario actualizado exitosamente'));
    } catch (err) {
      return c.json(error(err.message), err.statusCode || 500);
    }
  }
);

// Eliminar tipo de usuario (solo admin)
router.delete(
  '/:id',
  authMiddleware,
  permissionMiddleware('configuracion'),
  async (c) => {
    try {
      const { id } = c.req.param();
      await tipoUsuarioConvenioService.eliminar(id);
      return c.json(success(null, 'Tipo de usuario eliminado exitosamente'));
    } catch (err) {
      return c.json(error(err.message), err.statusCode || 500);
    }
  }
);

// Toggle activo/inactivo (solo admin)
router.patch(
  '/:id/toggle',
  authMiddleware,
  permissionMiddleware('configuracion'),
  async (c) => {
    try {
      const { id } = c.req.param();
      const tipo = await tipoUsuarioConvenioService.toggleActivo(id);
      return c.json(success(tipo, `Tipo de usuario ${tipo.activo ? 'activado' : 'desactivado'} exitosamente`));
    } catch (err) {
      return c.json(error(err.message), err.statusCode || 500);
    }
  }
);

module.exports = router;
