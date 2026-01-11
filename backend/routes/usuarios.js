/**
 * @swagger
 * tags:
 *   name: Usuarios
 *   description: Gestión de usuarios del sistema
 * components:
 *   schemas:
 *     UsuarioInput:
 *       type: object
 *       required:
 *         - email
 *         - password
 *         - nombre
 *         - apellido
 *         - rol
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           description: Correo electrónico único
 *           example: usuario@clinicamia.com
 *         password:
 *           type: string
 *           format: password
 *           minLength: 6
 *           description: Contraseña (mínimo 6 caracteres)
 *         nombre:
 *           type: string
 *           description: Nombre del usuario
 *           example: Juan
 *         apellido:
 *           type: string
 *           description: Apellido del usuario
 *           example: Pérez
 *         rol:
 *           type: string
 *           description: ID del rol o nombre del rol
 *           example: Doctor
 *         telefono:
 *           type: string
 *           description: Teléfono de contacto
 *           example: "3001234567"
 *         cedula:
 *           type: string
 *           description: Número de cédula/documento
 *           example: "1234567890"
 *     UsuarioUpdate:
 *       type: object
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *         nombre:
 *           type: string
 *         apellido:
 *           type: string
 *         rol:
 *           type: string
 *         telefono:
 *           type: string
 *         cedula:
 *           type: string
 *         password:
 *           type: string
 *           format: password
 *           description: Nueva contraseña (opcional)
 */

const { Hono } = require('hono');
const prisma = require('../db/prisma');
const bcrypt = require('bcryptjs');
const roleService = require('../services/role.service');
const { requirePermission, authMiddleware } = require('../middleware/auth');

const app = new Hono();

// Apply auth middleware to all routes in this file
app.use('*', authMiddleware);

/**
 * @swagger
 * /usuarios:
 *   get:
 *     summary: Listar todos los usuarios
 *     description: Obtiene la lista de todos los usuarios del sistema con sus roles asignados
 *     tags: [Usuarios]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de usuarios obtenida exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Usuario'
 *                 total:
 *                   type: integer
 *                   example: 15
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
app.get('/', requirePermission('users.view'), async (c) => {
  try {
    console.log('GET /usuarios request received');
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
        updatedAt: true,
        userRoles: {
          include: {
            role: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Map user roles to legacy format if needed or just return as is
    const mappedUsuarios = usuarios.map(u => ({
      ...u,
      rol: (u.userRoles && u.userRoles.length > 0 && u.userRoles[0].role) ? u.userRoles[0].role.name : (u.rol || 'Sin Rol')
    }));
    
    console.log(`Returning ${mappedUsuarios.length} users`);

    return c.json({
      success: true,
      data: mappedUsuarios,
      total: mappedUsuarios.length
    });
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    return c.json({
      success: false,
      message: 'Error al obtener usuarios',
      error: error.message,
      data: [] // Return empty array to prevent frontend crash if it ignores success flag
    }, 500);
  }
});

/**
 * @swagger
 * /usuarios:
 *   post:
 *     summary: Crear nuevo usuario
 *     description: |
 *       Crea un nuevo usuario en el sistema y le asigna un rol.
 *       Requiere permiso users.create.
 *     tags: [Usuarios]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UsuarioInput'
 *     responses:
 *       201:
 *         description: Usuario creado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Usuario creado exitosamente
 *                 data:
 *                   $ref: '#/components/schemas/Usuario'
 *       400:
 *         description: Datos inválidos o email ya registrado
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
app.post('/', requirePermission('users.create'), async (c) => {
  try {
    const body = await c.req.json();
    const { email, password, nombre, apellido, rol, telefono, cedula } = body;
    const currentUser = c.get('user');

    if (!email || !password || !nombre || !apellido || !rol) {
      return c.json({ success: false, message: 'Faltan campos requeridos' }, 400);
    }

    const existingUser = await prisma.usuario.findUnique({ where: { email } });
    if (existingUser) {
      return c.json({ success: false, message: 'El email ya está registrado' }, 400);
    }

    // Check if role is an ID or Name
    let roleId = rol;
    let roleName = rol;
    let roleObj = null;
    
    // Try to find role by ID if it looks like a UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (uuidRegex.test(rol)) {
        try {
            roleObj = await roleService.getById(rol);
        } catch (e) {
            // Ignore error if ID not found or invalid
        }
    }

    if (!roleObj) {
        // Try to find by Name (legacy support)
        const allRoles = await roleService.getAll();
        roleObj = allRoles.find(r => r.name.toLowerCase() === rol.toLowerCase());
    }

    if (roleObj) {
        roleId = roleObj.id;
        roleName = roleObj.name;
    } else {
        // Fallback for legacy hardcoded roles if not in DB (should be seeded though)
        roleName = rol;
        roleId = null; 
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const usuario = await prisma.usuario.create({
      data: {
        email,
        password: hashedPassword,
        nombre,
        apellido,
        rol: roleName, // Legacy field
        telefono: telefono || null,
        cedula: cedula || null,
        activo: true
      }
    });

    // Assign role if found
    if (roleId) {
        await roleService.assignRoleToUser(usuario.id, roleId, currentUser.id);
    }

    return c.json({
      success: true,
      message: 'Usuario creado exitosamente',
      data: usuario
    }, 201);
  } catch (error) {
    console.error('Error al crear usuario:', error);
    return c.json({ success: false, message: 'Error al crear usuario', error: error.message }, 500);
  }
});

/**
 * @swagger
 * /usuarios/{id}:
 *   put:
 *     summary: Actualizar usuario
 *     description: |
 *       Actualiza los datos de un usuario existente.
 *       Si se proporciona password, se hashea automáticamente.
 *       Requiere permiso users.update.
 *     tags: [Usuarios]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID único del usuario
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UsuarioUpdate'
 *     responses:
 *       200:
 *         description: Usuario actualizado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Usuario actualizado exitosamente
 *                 data:
 *                   $ref: '#/components/schemas/Usuario'
 *       400:
 *         description: Email ya en uso
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
app.put('/:id', requirePermission('users.update'), async (c) => {
  try {
    const { id } = c.req.param();
    const body = await c.req.json();
    const { email, nombre, apellido, rol, telefono, cedula, password } = body;
    const currentUser = c.get('user');

    const existingUser = await prisma.usuario.findUnique({ where: { id } });
    if (!existingUser) return c.json({ success: false, message: 'Usuario no encontrado' }, 404);

    if (email && email !== existingUser.email) {
      const emailExists = await prisma.usuario.findUnique({ where: { email } });
      if (emailExists) return c.json({ success: false, message: 'El email ya está en uso' }, 400);
    }

    // Handle Role Update
    let roleName = existingUser.rol;
    if (rol) {
        let roleId = rol;
        let roleObj = await roleService.getById(rol);
        if (!roleObj) {
            const allRoles = await roleService.getAll();
            roleObj = allRoles.find(r => r.name.toLowerCase() === rol.toLowerCase());
        }

        if (roleObj) {
            roleId = roleObj.id;
            roleName = roleObj.name;
            
            // Update UserRole relation
            // First remove old roles (assuming single role for now for simplicity in UI)
            await prisma.userRole.deleteMany({ where: { usuarioId: id } });
            await roleService.assignRoleToUser(id, roleId, currentUser.id);
        } else {
            roleName = rol;
        }
    }

    const updateData = {
      email: email || existingUser.email,
      nombre: nombre || existingUser.nombre,
      apellido: apellido || existingUser.apellido,
      rol: roleName,
      telefono: telefono !== undefined ? telefono : existingUser.telefono,
      cedula: cedula !== undefined ? cedula : existingUser.cedula,
      updatedAt: new Date()
    };

    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    const usuario = await prisma.usuario.update({
      where: { id },
      data: updateData
    });

    return c.json({
      success: true,
      message: 'Usuario actualizado exitosamente',
      data: usuario
    });
  } catch (error) {
    console.error('Error al actualizar usuario:', error);
    return c.json({ success: false, message: 'Error al actualizar usuario', error: error.message }, 500);
  }
});

/**
 * @swagger
 * /usuarios/{id}/toggle-activo:
 *   put:
 *     summary: Activar/Desactivar usuario
 *     description: |
 *       Alterna el estado activo de un usuario.
 *       Los usuarios desactivados no pueden iniciar sesión.
 *     tags: [Usuarios]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID único del usuario
 *     responses:
 *       200:
 *         description: Estado del usuario actualizado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Usuario activado exitosamente
 *                 data:
 *                   $ref: '#/components/schemas/Usuario'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
app.put('/:id/toggle-activo', requirePermission('users.update'), async (c) => {
  try {
    const { id } = c.req.param();
    const usuario = await prisma.usuario.findUnique({ where: { id } });
    if (!usuario) return c.json({ success: false, message: 'Usuario no encontrado' }, 404);

    const updatedUsuario = await prisma.usuario.update({
      where: { id },
      data: { activo: !usuario.activo, updatedAt: new Date() }
    });

    return c.json({
      success: true,
      message: `Usuario ${updatedUsuario.activo ? 'activado' : 'desactivado'} exitosamente`,
      data: updatedUsuario
    });
  } catch (error) {
    return c.json({ success: false, message: 'Error al cambiar estado', error: error.message }, 500);
  }
});

/**
 * @swagger
 * /usuarios/{id}:
 *   delete:
 *     summary: Eliminar usuario
 *     description: |
 *       Elimina permanentemente un usuario del sistema.
 *       Esta acción no se puede deshacer.
 *       Requiere permiso users.delete.
 *     tags: [Usuarios]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID único del usuario
 *     responses:
 *       200:
 *         description: Usuario eliminado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Usuario eliminado exitosamente
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
app.delete('/:id', requirePermission('users.delete'), async (c) => {
  try {
    const { id } = c.req.param();
    await prisma.usuario.delete({ where: { id } });
    return c.json({ success: true, message: 'Usuario eliminado exitosamente' });
  } catch (error) {
    return c.json({ success: false, message: 'Error al eliminar usuario', error: error.message }, 500);
  }
});

module.exports = app;
