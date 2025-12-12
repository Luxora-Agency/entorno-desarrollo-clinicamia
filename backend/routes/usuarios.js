const { Hono } = require('hono');
const prisma = require('../db/prisma');
const bcrypt = require('bcryptjs');

const app = new Hono();

// GET /api/usuarios - Listar todos los usuarios
app.get('/', async (c) => {
  try {
    const usuarios = await prisma.usuario.findMany({
      select: {
        id: true,
        email: true,
        nombre: true,
        apellido: true,
        rol: true,
        telefono: true,
        cedula: true,
        activo: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return c.json({
      success: true,
      data: usuarios,
      total: usuarios.length
    });
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    return c.json({
      success: false,
      message: 'Error al obtener usuarios',
      error: error.message
    }, 500);
  }
});

// POST /api/usuarios - Crear nuevo usuario
app.post('/', async (c) => {
  try {
    const body = await c.req.json();
    const { email, password, nombre, apellido, rol, telefono, cedula } = body;

    // Validar campos requeridos
    if (!email || !password || !nombre || !apellido || !rol) {
      return c.json({
        success: false,
        message: 'Faltan campos requeridos'
      }, 400);
    }

    // Verificar si el email ya existe
    const existingUser = await prisma.usuario.findUnique({
      where: { email }
    });

    if (existingUser) {
      return c.json({
        success: false,
        message: 'El email ya está registrado'
      }, 400);
    }

    // Hash de la contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // Crear usuario
    const usuario = await prisma.usuario.create({
      data: {
        email,
        password: hashedPassword,
        nombre,
        apellido,
        rol: rol.toLowerCase(),
        telefono: telefono || null,
        cedula: cedula || null,
        activo: true
      },
      select: {
        id: true,
        email: true,
        nombre: true,
        apellido: true,
        rol: true,
        telefono: true,
        cedula: true,
        activo: true,
        createdAt: true
      }
    });

    return c.json({
      success: true,
      message: 'Usuario creado exitosamente',
      data: usuario
    }, 201);
  } catch (error) {
    console.error('Error al crear usuario:', error);
    return c.json({
      success: false,
      message: 'Error al crear usuario',
      error: error.message
    }, 500);
  }
});

// PUT /api/usuarios/:id - Actualizar usuario
app.put('/:id', async (c) => {
  try {
    const { id } = c.req.param();
    const body = await c.req.json();
    const { email, nombre, apellido, rol, telefono, cedula, password } = body;

    // Verificar que el usuario existe
    const existingUser = await prisma.usuario.findUnique({
      where: { id }
    });

    if (!existingUser) {
      return c.json({
        success: false,
        message: 'Usuario no encontrado'
      }, 404);
    }

    // Si se cambia el email, verificar que no exista
    if (email && email !== existingUser.email) {
      const emailExists = await prisma.usuario.findUnique({
        where: { email }
      });

      if (emailExists) {
        return c.json({
          success: false,
          message: 'El email ya está en uso'
        }, 400);
      }
    }

    // Preparar datos de actualización
    const updateData = {
      email: email || existingUser.email,
      nombre: nombre || existingUser.nombre,
      apellido: apellido || existingUser.apellido,
      rol: rol ? rol.toLowerCase() : existingUser.rol,
      telefono: telefono !== undefined ? telefono : existingUser.telefono,
      cedula: cedula !== undefined ? cedula : existingUser.cedula,
      updatedAt: new Date()
    };

    // Si se proporciona nueva contraseña
    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    const usuario = await prisma.usuario.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        nombre: true,
        apellido: true,
        rol: true,
        telefono: true,
        cedula: true,
        activo: true,
        updatedAt: true
      }
    });

    return c.json({
      success: true,
      message: 'Usuario actualizado exitosamente',
      data: usuario
    });
  } catch (error) {
    console.error('Error al actualizar usuario:', error);
    return c.json({
      success: false,
      message: 'Error al actualizar usuario',
      error: error.message
    }, 500);
  }
});

// PUT /api/usuarios/:id/toggle-activo - Activar/Desactivar usuario
app.put('/:id/toggle-activo', async (c) => {
  try {
    const { id } = c.req.param();

    const usuario = await prisma.usuario.findUnique({
      where: { id }
    });

    if (!usuario) {
      return c.json({
        success: false,
        message: 'Usuario no encontrado'
      }, 404);
    }

    const updatedUsuario = await prisma.usuario.update({
      where: { id },
      data: {
        activo: !usuario.activo,
        updatedAt: new Date()
      },
      select: {
        id: true,
        email: true,
        nombre: true,
        apellido: true,
        rol: true,
        activo: true
      }
    });

    return c.json({
      success: true,
      message: `Usuario ${updatedUsuario.activo ? 'activado' : 'desactivado'} exitosamente`,
      data: updatedUsuario
    });
  } catch (error) {
    console.error('Error al cambiar estado de usuario:', error);
    return c.json({
      success: false,
      message: 'Error al cambiar estado de usuario',
      error: error.message
    }, 500);
  }
});

// DELETE /api/usuarios/:id - Eliminar usuario
app.delete('/:id', async (c) => {
  try {
    const { id } = c.req.param();

    const usuario = await prisma.usuario.findUnique({
      where: { id }
    });

    if (!usuario) {
      return c.json({
        success: false,
        message: 'Usuario no encontrado'
      }, 404);
    }

    await prisma.usuario.delete({
      where: { id }
    });

    return c.json({
      success: true,
      message: 'Usuario eliminado exitosamente'
    });
  } catch (error) {
    console.error('Error al eliminar usuario:', error);
    return c.json({
      success: false,
      message: 'Error al eliminar usuario',
      error: error.message
    }, 500);
  }
});

module.exports = app;
