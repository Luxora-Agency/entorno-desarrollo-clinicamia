const { z } = require('zod');

const createTipoUsuarioConvenioSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido'),
  codigoConvenio: z.string().min(1, 'El código de convenio es requerido'),
  descripcion: z.string().optional().nullable(),
  activo: z.boolean().optional().default(true),
});

const updateTipoUsuarioConvenioSchema = createTipoUsuarioConvenioSchema.partial();

module.exports = {
  createTipoUsuarioConvenioSchema,
  updateTipoUsuarioConvenioSchema,
};
