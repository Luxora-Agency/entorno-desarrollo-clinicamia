
/**
 * Rutas de Tickets de Soporte
 */
const { Hono } = require('hono');
const ticketService = require('../services/ticket.service');
const { authMiddleware, permissionMiddleware } = require('../middleware/auth');
const { success, error, paginated } = require('../utils/response');

const tickets = new Hono();

// Middleware de autenticación para todas las rutas
tickets.use('*', authMiddleware);

/**
 * GET /tickets - Obtener tickets con filtros
 */
tickets.get('/', async (c) => {
  try {
    const query = c.req.query();
    const result = await ticketService.getTickets(query);
    return c.json(paginated(result.tickets, result.pagination));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * GET /tickets/:id - Obtener ticket por ID
 */
tickets.get('/:id', async (c) => {
  try {
    const { id } = c.req.param();
    const ticket = await ticketService.getTicketById(id);
    return c.json(success(ticket));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * POST /tickets - Crear un nuevo ticket
 */
tickets.post('/', async (c) => {
  try {
    const body = await c.req.json();
    const user = c.get('user');
    
    const data = {
      ...body,
      usuarioReportaId: user ? user.id : body.usuarioReportaId
    };
    
    const ticket = await ticketService.createTicket(data);
    return c.json(success(ticket, 'Ticket creado exitosamente'), 201);
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * PUT /tickets/:id - Actualizar ticket
 */
tickets.put('/:id', async (c) => {
  try {
    const { id } = c.req.param();
    const data = await c.req.json();
    const ticket = await ticketService.updateTicket(id, data);
    return c.json(success(ticket, 'Ticket actualizado exitosamente'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * DELETE /tickets/:id - Eliminar ticket
 */
tickets.delete('/:id', permissionMiddleware('admin'), async (c) => {
  try {
    const { id } = c.req.param();
    const result = await ticketService.deleteTicket(id);
    return c.json(success(result));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

module.exports = tickets;
