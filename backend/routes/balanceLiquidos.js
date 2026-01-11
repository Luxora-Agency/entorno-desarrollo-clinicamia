const { Hono } = require('hono');
const controller = require('../controllers/balanceLiquidos.controller');
const { authMiddleware: protect, roleMiddleware: authorize } = require('../middleware/auth');

const app = new Hono();

app.use('*', protect);
app.post('/', authorize('NURSE', 'DOCTOR', 'ADMIN'), controller.create);
app.get('/', authorize('NURSE', 'DOCTOR', 'ADMIN'), controller.getAll);
app.get('/balance/:admisionId', authorize('NURSE', 'DOCTOR', 'ADMIN'), controller.getBalance);

module.exports = app;
