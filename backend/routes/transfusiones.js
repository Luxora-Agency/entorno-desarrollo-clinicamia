const { Hono } = require('hono');
const controller = require('../controllers/transfusion.controller');
const { authMiddleware: protect, roleMiddleware: authorize } = require('../middleware/auth');

const app = new Hono();

app.use('*', protect);
app.post('/', authorize('NURSE', 'DOCTOR', 'ADMIN'), controller.create);
app.get('/', authorize('NURSE', 'DOCTOR', 'ADMIN'), controller.getAll);
app.put('/:id/verify', authorize('NURSE', 'DOCTOR', 'ADMIN'), controller.verify);

module.exports = app;
