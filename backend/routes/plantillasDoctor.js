const { Hono } = require('hono');
const controller = require('../controllers/plantillaDoctor.controller');
const { authMiddleware: protect, roleMiddleware: authorize } = require('../middleware/auth');

const app = new Hono();

app.use('*', protect);
// Allow DOCTOR to create/manage their own templates
app.post('/', authorize(['DOCTOR']), controller.create);
app.get('/', authorize(['DOCTOR']), controller.getAll);
app.put('/:id', authorize(['DOCTOR']), controller.update);
app.delete('/:id', authorize(['DOCTOR']), controller.delete);

module.exports = app;
