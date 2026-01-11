const { Hono } = require('hono');
const controller = require('../controllers/plantillaNota.controller');
const { authMiddleware: protect, roleMiddleware: authorize } = require('../middleware/auth');

const app = new Hono();

app.use('*', protect);
app.post('/', authorize('NURSE', 'ADMIN'), controller.create);
app.get('/', authorize('NURSE', 'DOCTOR', 'ADMIN'), controller.getAll);
app.put('/:id', authorize('NURSE', 'ADMIN'), controller.update);
app.delete('/:id', authorize('NURSE', 'ADMIN'), controller.delete);

module.exports = app;
