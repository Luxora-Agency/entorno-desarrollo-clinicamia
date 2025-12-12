const { Hono } = require('hono');
const prisma = require('../db/prisma');

const app = new Hono();

// GET /api/roles/permisos - Obtener todos los permisos por rol
app.get('/permisos', async (c) => {
  try {
    const permisos = await prisma.rolePermiso.findMany({
      orderBy: [
        { rol: 'asc' },
        { modulo: 'asc' }
      ]
    });

    // Agrupar por rol
    const permisosPorRol = permisos.reduce((acc, permiso) => {
      if (!acc[permiso.rol]) {
        acc[permiso.rol] = [];
      }
      acc[permiso.rol].push({
        modulo: permiso.modulo,
        acceso: permiso.acceso
      });
      return acc;
    }, {});

    return c.json({
      success: true,
      data: permisosPorRol
    });
  } catch (error) {
    console.error('Error al obtener permisos:', error);
    return c.json({
      success: false,
      message: 'Error al obtener permisos',
      error: error.message
    }, 500);
  }
});

// GET /api/roles/permisos/:rol - Obtener permisos de un rol específico
app.get('/permisos/:rol', async (c) => {
  try {
    const { rol } = c.req.param();

    const permisos = await prisma.rolePermiso.findMany({
      where: {
        rol: rol.toLowerCase()
      },
      orderBy: {
        modulo: 'asc'
      }
    });

    return c.json({
      success: true,
      data: permisos
    });
  } catch (error) {
    console.error('Error al obtener permisos del rol:', error);
    return c.json({
      success: false,
      message: 'Error al obtener permisos del rol',
      error: error.message
    }, 500);
  }
});

// PUT /api/roles/:rol/permisos - Actualizar permisos de un rol
app.put('/:rol/permisos', async (c) => {
  try {
    const { rol } = c.req.param();
    const body = await c.req.json();
    const { permisos } = body; // Array de { modulo, acceso }

    if (!permisos || !Array.isArray(permisos)) {
      return c.json({
        success: false,
        message: 'Se requiere un array de permisos'
      }, 400);
    }

    // Eliminar permisos existentes del rol
    await prisma.rolePermiso.deleteMany({
      where: {
        rol: rol.toLowerCase()
      }
    });

    // Crear nuevos permisos
    const nuevosPermisos = await prisma.rolePermiso.createMany({
      data: permisos.map(p => ({
        rol: rol.toLowerCase(),
        modulo: p.modulo,
        acceso: p.acceso
      }))
    });

    return c.json({
      success: true,
      message: 'Permisos actualizados exitosamente',
      data: { count: nuevosPermisos.count }
    });
  } catch (error) {
    console.error('Error al actualizar permisos:', error);
    return c.json({
      success: false,
      message: 'Error al actualizar permisos',
      error: error.message
    }, 500);
  }
});

// POST /api/roles/permisos - Agregar o actualizar un permiso específico
app.post('/permisos', async (c) => {
  try {
    const body = await c.req.json();
    const { rol, modulo, acceso } = body;

    if (!rol || !modulo) {
      return c.json({
        success: false,
        message: 'Se requieren rol y modulo'
      }, 400);
    }

    const permiso = await prisma.rolePermiso.upsert({
      where: {
        rol_modulo: {
          rol: rol.toLowerCase(),
          modulo: modulo
        }
      },
      update: {
        acceso: acceso !== undefined ? acceso : true,
        updatedAt: new Date()
      },
      create: {
        rol: rol.toLowerCase(),
        modulo: modulo,
        acceso: acceso !== undefined ? acceso : true
      }
    });

    return c.json({
      success: true,
      message: 'Permiso actualizado exitosamente',
      data: permiso
    });
  } catch (error) {
    console.error('Error al actualizar permiso:', error);
    return c.json({
      success: false,
      message: 'Error al actualizar permiso',
      error: error.message
    }, 500);
  }
});

// GET /api/roles/lista - Obtener lista de roles disponibles
app.get('/lista', async (c) => {
  try {
    const roles = [
      { value: 'superadmin', label: 'Super Admin' },
      { value: 'admin', label: 'Admin' },
      { value: 'doctor', label: 'Doctor' },
      { value: 'enfermera', label: 'Enfermera' },
      { value: 'recepcionista', label: 'Recepcionista' },
      { value: 'farmaceutico', label: 'Farmacéutico' },
      { value: 'laboratorista', label: 'Laboratorista' }
    ];

    return c.json({
      success: true,
      data: roles
    });
  } catch (error) {
    console.error('Error al obtener lista de roles:', error);
    return c.json({
      success: false,
      message: 'Error al obtener lista de roles',
      error: error.message
    }, 500);
  }
});

module.exports = app;
