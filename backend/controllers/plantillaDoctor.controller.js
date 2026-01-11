const plantillaService = require('../services/plantillaDoctor.service');
const prisma = require('../db/prisma');
const { success, error } = require('../utils/response');

exports.create = async (c) => {
  try {
    const user = c.get('user');
    const doctor = await prisma.doctor.findUnique({
        where: { usuarioId: user.id }
    });

    if (!doctor) {
        return c.json(error('No se encontró el perfil de doctor asociado al usuario'), 404);
    }

    const body = await c.req.json();
    const data = { ...body, doctorId: doctor.id };
    const result = await plantillaService.create(data);
    return c.json(success(result, 'Plantilla creada'), 201);
  } catch (err) {
    console.error(err);
    return c.json(error(err.message), 500);
  }
};

exports.getAll = async (c) => {
  try {
    const user = c.get('user');
    const doctor = await prisma.doctor.findUnique({
        where: { usuarioId: user.id }
    });

    if (!doctor) {
        return c.json(error('No se encontró el perfil de doctor'), 404);
    }

    const { tipoCampo, nombre } = c.req.query();
    const result = await plantillaService.getAll(doctor.id, { tipoCampo, nombre });
    return c.json(success(result));
  } catch (err) {
    console.error(err);
    return c.json(error(err.message), 500);
  }
};

exports.update = async (c) => {
    try {
        const { id } = c.req.param();
        const body = await c.req.json();
        
        // TODO: Verify ownership if strict security needed, 
        // though service filters by doctor usually or we trust ID for now
        
        const result = await plantillaService.update(id, body);
        return c.json(success(result, 'Plantilla actualizada'));
    } catch (err) {
        return c.json(error(err.message), 500);
    }
}

exports.delete = async (c) => {
    try {
        const { id } = c.req.param();
        await plantillaService.delete(id);
        return c.json(success(null, 'Plantilla eliminada'));
    } catch (err) {
        return c.json(error(err.message), 500);
    }
}
