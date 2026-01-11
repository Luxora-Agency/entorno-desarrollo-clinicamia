const { Hono } = require('hono');
const auditService = require('../services/audit.service');
const { error, success } = require('../utils/response');
const { requirePermission } = require('../middleware/auth');

const app = new Hono();

app.get('/', requirePermission('audit.view'), async (c) => {
  try {
    const query = c.req.query();
    const result = await auditService.getLogs(query);
    return c.json(success(result));
  } catch (err) {
    return c.json(error('Error fetching audit logs', err.message), 500);
  }
});

module.exports = app;
