/**
 * Validation schemas for payment operations
 */

const { z } = require('zod');

/**
 * Schema for creating a payment session
 */
const createPaymentSessionSchema = z.object({
  cita_id: z.string().uuid('ID de cita inválido'),
});

module.exports = {
  createPaymentSessionSchema,
};
