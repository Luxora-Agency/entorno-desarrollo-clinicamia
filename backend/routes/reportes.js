const { Hono } = require('hono');
const reportesService = require('../services/reportes.service');
const { authMiddleware } = require('../middleware/auth');
const { success, error } = require('../utils/response');

const reportes = new Hono();

// All reports require authentication
reportes.use('*', authMiddleware);

// General Stats
reportes.get('/general', async (c) => {
  try {
    const query = c.req.query();
    const user = c.get('user');
    // Si es doctor, filtrar solo sus estadísticas
    const doctorId = user?.rol === 'DOCTOR' ? user.id : null;
    const data = await reportesService.getGeneralStats(query, doctorId);
    return c.json(success(data));
  } catch (err) {
    return c.json(error(err.message), 500);
  }
});

// Financial Stats
reportes.get('/financial', async (c) => {
  try {
    const data = await reportesService.getFinancialStats();
    return c.json(success(data));
  } catch (err) {
    return c.json(error(err.message), 500);
  }
});

// Occupancy Stats
reportes.get('/occupancy', async (c) => {
  try {
    const data = await reportesService.getOccupancyStats();
    return c.json(success(data));
  } catch (err) {
    return c.json(error(err.message), 500);
  }
});

// Specialty Stats
reportes.get('/specialty', async (c) => {
  try {
    const data = await reportesService.getSpecialtyStats();
    return c.json(success(data));
  } catch (err) {
    return c.json(error(err.message), 500);
  }
});

// Demographics Stats
reportes.get('/demographics', async (c) => {
  try {
    const data = await reportesService.getDemographicsStats();
    return c.json(success(data));
  } catch (err) {
    return c.json(error(err.message), 500);
  }
});

// Services Stats
reportes.get('/services', async (c) => {
  try {
    const user = c.get('user');
    const doctorId = user?.rol === 'DOCTOR' ? user.id : null;
    const data = await reportesService.getServicesStats(doctorId);
    return c.json(success(data));
  } catch (err) {
    return c.json(error(err.message), 500);
  }
});

// Doctors Stats
reportes.get('/doctors', async (c) => {
  try {
    const data = await reportesService.getDoctorsStats();
    return c.json(success(data));
  } catch (err) {
    return c.json(error(err.message), 500);
  }
});

// Quality Stats
reportes.get('/quality', async (c) => {
  try {
    const data = await reportesService.getQualityStats();
    return c.json(success(data));
  } catch (err) {
    return c.json(error(err.message), 500);
  }
});

// Audit Stats
reportes.get('/audit', async (c) => {
  try {
    const data = await reportesService.getAuditStats();
    return c.json(success(data));
  } catch (err) {
    return c.json(error(err.message), 500);
  }
});

module.exports = reportes;
