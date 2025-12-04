const { Hono } = require('hono');
const prisma = require('../db/prisma');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');

const usuarios = new Hono();

usuarios.use('*', authMiddleware);

// Obtener todos los usuarios (excepto pacientes para el selector)
usuarios.get('/no-pacientes', async (c) => {
  try {
    const usuarios = await prisma.usuario.findMany({
      where: {
        activo: true,
        rol: { not: 'PATIENT' },
      },
      select: {
        id: true,
        nombre: true,
        apellido: true,
        email: true,
        rol: true,
      },
      orderBy: [
        { nombre: 'asc' },
        { apellido: 'asc' },
      ],
    });

    return c.json({ usuarios });
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    return c.json({ error: 'Error al obtener usuarios' }, 500);
  }
});

module.exports = usuarios;
