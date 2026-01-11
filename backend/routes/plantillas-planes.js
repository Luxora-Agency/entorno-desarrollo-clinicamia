const { Hono } = require('hono');
const plantillaService = require('../services/plantilla-plan.service');
const { success, error } = require('../utils/response');
const { authMiddleware } = require('../middleware/auth');

const router = new Hono();

router.use('*', authMiddleware);

router.get('/', async (c) => {
  try {
    const user = c.get('user');
    const { search } = c.req.query();
    const plantillas = await plantillaService.list(user.id, search);
    return c.json(success(plantillas));
  } catch (err) {
    return c.json(error(err.message), 500);
  }
});

router.post('/', async (c) => {
  try {
    const user = c.get('user');
    const data = await c.req.json();
    const plantilla = await plantillaService.create(data, user.id);
    return c.json(success(plantilla), 201);
  } catch (err) {
    return c.json(error(err.message), 400);
  }
});

router.put('/:id', async (c) => {
  try {
    const user = c.get('user');
    const { id } = c.req.param();
    const data = await c.req.json();
    const plantilla = await plantillaService.update(id, data, user.id);
    return c.json(success(plantilla));
  } catch (err) {
    return c.json(error(err.message), 400);
  }
});

router.delete('/:id', async (c) => {
  try {
    const user = c.get('user');
    const { id } = c.req.param();
    await plantillaService.delete(id, user.id);
    return c.json(success({ message: 'Plantilla eliminada' }));
  } catch (err) {
    return c.json(error(err.message), 400);
  }
});

module.exports = router;
