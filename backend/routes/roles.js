/**
 * @swagger
 * tags:
 *   name: Roles
 *   description: Gestión de roles y permisos RBAC
 * components:
 *   schemas:
 *     Role:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: ID único del rol
 *         name:
 *           type: string
 *           description: Nombre del rol
 *           example: Doctor
 *         description:
 *           type: string
 *           description: Descripción del rol
 *           example: Médico general con acceso a consultas y HCE
 *         isSystem:
 *           type: boolean
 *           description: Indica si es un rol del sistema (no eliminable)
 *         permissions:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               permission:
 *                 $ref: '#/components/schemas/Permission'
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     RoleInput:
 *       type: object
 *       required:
 *         - name
 *       properties:
 *         name:
 *           type: string
 *           description: Nombre único del rol
 *           example: Radiólogo
 *         description:
 *           type: string
 *           description: Descripción del rol
 *           example: Especialista en imagenología
 *         permissionIds:
 *           type: array
 *           items:
 *             type: string
 *             format: uuid
 *           description: IDs de permisos a asignar
 *     Permission:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         name:
 *           type: string
 *           description: Nombre del permiso (resource.action)
 *           example: patients.view
 *         description:
 *           type: string
 *           example: Ver listado de pacientes
 *         module:
 *           type: string
 *           example: patients
 *         action:
 *           type: string
 *           enum: [view, create, update, delete, manage]
 */

const { Hono } = require('hono');
const roleService = require('../services/role.service');
const { error, success } = require('../utils/response');
const { requirePermission, authMiddleware } = require('../middleware/auth');

const app = new Hono();

// Apply auth middleware to all routes
app.use('*', authMiddleware);

/**
 * @swagger
 * /roles:
 *   get:
 *     summary: Listar todos los roles
 *     description: Obtiene la lista de todos los roles del sistema con sus permisos asociados
 *     tags: [Roles]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de roles obtenida exitosamente
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
 *                     $ref: '#/components/schemas/Role'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
app.get('/', requirePermission('roles.view'), async (c) => {
  try {
    const roles = await roleService.getAll();
    return c.json(success(roles));
  } catch (err) {
    return c.json(error('Error fetching roles', err.message), 500);
  }
});

/**
 * @swagger
 * /roles/{id}:
 *   get:
 *     summary: Obtener rol por ID
 *     description: Obtiene los detalles de un rol específico incluyendo todos sus permisos
 *     tags: [Roles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID único del rol
 *     responses:
 *       200:
 *         description: Rol obtenido exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Role'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
app.get('/:id', requirePermission('roles.view'), async (c) => {
  try {
    const { id } = c.req.param();
    const role = await roleService.getById(id);
    if (!role) return c.json(error('Role not found'), 404);
    return c.json(success(role));
  } catch (err) {
    return c.json(error('Error fetching role', err.message), 500);
  }
});

/**
 * @swagger
 * /roles:
 *   post:
 *     summary: Crear nuevo rol
 *     description: Crea un nuevo rol con los permisos especificados
 *     tags: [Roles]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RoleInput'
 *     responses:
 *       201:
 *         description: Rol creado exitosamente
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
 *                   example: Role created successfully
 *                 data:
 *                   $ref: '#/components/schemas/Role'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
app.post('/', requirePermission('roles.create'), async (c) => {
  try {
    const body = await c.req.json();
    const user = c.get('user');
    const role = await roleService.create(body, user.id);
    return c.json(success(role, 'Role created successfully'), 201);
  } catch (err) {
    return c.json(error('Error creating role', err.message), 500);
  }
});

/**
 * @swagger
 * /roles/{id}:
 *   put:
 *     summary: Actualizar rol
 *     description: Actualiza el nombre, descripción o permisos de un rol existente
 *     tags: [Roles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID único del rol
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RoleInput'
 *     responses:
 *       200:
 *         description: Rol actualizado exitosamente
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
 *                   example: Role updated successfully
 *                 data:
 *                   $ref: '#/components/schemas/Role'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
app.put('/:id', requirePermission('roles.update'), async (c) => {
  try {
    const { id } = c.req.param();
    const body = await c.req.json();
    const user = c.get('user');
    const role = await roleService.update(id, body, user.id);
    return c.json(success(role, 'Role updated successfully'));
  } catch (err) {
    return c.json(error('Error updating role', err.message), 500);
  }
});

/**
 * @swagger
 * /roles/{id}:
 *   delete:
 *     summary: Eliminar rol
 *     description: |
 *       Elimina un rol del sistema.
 *       Los roles del sistema (isSystem=true) no pueden eliminarse.
 *       Los usuarios asignados perderán el rol.
 *     tags: [Roles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID único del rol
 *     responses:
 *       200:
 *         description: Rol eliminado exitosamente
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
 *                   example: Role deleted successfully
 *       400:
 *         description: No se puede eliminar un rol del sistema
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
app.delete('/:id', requirePermission('roles.delete'), async (c) => {
  try {
    const { id } = c.req.param();
    const user = c.get('user');
    await roleService.delete(id, user.id);
    return c.json(success(null, 'Role deleted successfully'));
  } catch (err) {
    return c.json(error('Error deleting role', err.message), 500);
  }
});

/**
 * @swagger
 * /roles/{id}/users:
 *   post:
 *     summary: Asignar rol a usuario
 *     description: Asigna un rol específico a un usuario. Puede tener fecha de expiración opcional.
 *     tags: [Roles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID del rol a asignar
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *             properties:
 *               userId:
 *                 type: string
 *                 format: uuid
 *                 description: ID del usuario al que asignar el rol
 *               expiresAt:
 *                 type: string
 *                 format: date-time
 *                 description: Fecha de expiración opcional del rol
 *     responses:
 *       200:
 *         description: Rol asignado exitosamente
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
 *                   example: Role assigned successfully
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
app.post('/:id/users', requirePermission('roles.assign'), async (c) => {
  try {
    const { id } = c.req.param();
    const { userId, expiresAt } = await c.req.json();
    const currentUser = c.get('user');
    
    await roleService.assignRoleToUser(userId, id, currentUser.id, expiresAt);
    return c.json(success(null, 'Role assigned successfully'));
  } catch (err) {
    return c.json(error('Error assigning role', err.message), 500);
  }
});

/**
 * @swagger
 * /roles/{id}/users/{userId}:
 *   delete:
 *     summary: Remover rol de usuario
 *     description: Remueve un rol específico de un usuario
 *     tags: [Roles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID del rol a remover
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID del usuario
 *     responses:
 *       200:
 *         description: Rol removido exitosamente
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
 *                   example: Role removed successfully
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
app.delete('/:id/users/:userId', requirePermission('roles.assign'), async (c) => {
  try {
    const { id, userId } = c.req.param();
    const currentUser = c.get('user');
    
    await roleService.removeRoleFromUser(userId, id, currentUser.id);
    return c.json(success(null, 'Role removed successfully'));
  } catch (err) {
    return c.json(error('Error removing role', err.message), 500);
  }
});

/**
 * @swagger
 * /roles/permisos/{rol}:
 *   get:
 *     summary: Obtener permisos de módulos por rol
 *     description: |
 *       Endpoint de compatibilidad para el frontend.
 *       Devuelve los módulos a los que tiene acceso un rol específico.
 *       Usado principalmente por el Sidebar para mostrar/ocultar opciones de menú.
 *     tags: [Roles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: rol
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del rol o nombre del rol
 *         example: Doctor
 *     responses:
 *       200:
 *         description: Permisos de módulos obtenidos
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
 *                     type: object
 *                     properties:
 *                       modulo:
 *                         type: string
 *                         example: pacientes
 *                       acceso:
 *                         type: boolean
 *                         example: true
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
app.get('/permisos/:rol', async (c) => {
  try {
    const { rol } = c.req.param();
    
    // Si es superadmin, dar acceso total
    if (rol.toLowerCase() === 'superadmin' || rol.toLowerCase() === 'admin' || rol.toLowerCase() === 'super_admin') {
      const todosLosModulos = [
        'dashboard', 'admisiones', 'doctores', 'especialidades', 'departamentos',
        'pacientes', 'citas', 'examenes', 'categorias-examenes', 'hce',
        'enfermeria', 'farmacia', 'ordenes-medicas', 'categorias-productos',
        'etiquetas-productos', 'laboratorio', 'imagenologia', 'urgencias',
        'hospitalizacion', 'admisiones-hospitalizacion', 'unidades', 'habitaciones',
        'camas', 'quirofano', 'facturacion', 'reportes', 'calidad',
        'planes-miapass', 'suscripciones-miapass', 'suscriptores-miapass',
        'cupones-miapass', 'formularios-miapass', 'tickets-soporte', 'publicaciones',
        'post-todas', 'post-categorias', 'usuarios-roles',
        // Talento Humano y SST
        'talento-humano', 'rrhh', 'sst',
        // Calidad 2.0
        'calidad2-inscripcion', 'calidad2-talento', 'calidad2-checklists',
        // Otros
        'ordenes-tienda'
      ];
      
      return c.json({
        success: true,
        data: todosLosModulos.map(m => ({ modulo: m, acceso: true }))
      });
    }

    // Buscar rol en la BD
    let role = null;
    
    // Check if rol is UUID
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(rol);
    
    if (isUuid) {
      try {
        role = await roleService.getById(rol);
      } catch (e) {
        // Ignore error if ID not found or invalid
      }
    }

    if (!role) {
      const allRoles = await roleService.getAll();
      role = allRoles.find(r => r.name.toLowerCase() === rol.toLowerCase());
    }

    if (!role) {
       // Si no existe el rol, devolver dashboard por defecto
       return c.json({
         success: true,
         data: [{ modulo: 'dashboard', acceso: true }]
       });
    }

    // Mapeo de permisos backend -> frontend
    const permissionMap = {
      'users': ['usuarios-roles'],
      'roles': ['usuarios-roles'],
      'audit': ['usuarios-roles'],
      'patients': ['pacientes'],
      'appointments': ['citas'],
      'medical_records': ['hce'],
      'billing': ['facturacion'],
      // Añadir más mapeos según sea necesario
    };

    const frontendModules = new Set(['dashboard']); // Siempre dar acceso al dashboard
    
    // Check if role has permissions (using the correct property name from Prisma relation)
    const permissions = role.role_permissions || role.permissions || [];
    
    permissions.forEach(rp => {
       // Handle both nested permission object (from Prisma include) or flattened structure
       const permission = rp.permissions || rp.permission || rp;
       
       if (!permission || !permission.module) return;
       
       const backendModule = permission.module;
       const mappedModules = permissionMap[backendModule];
       if (mappedModules) {
         mappedModules.forEach(m => frontendModules.add(m));
       }
       
       // También mapear por nombre específico si es necesario
       // e.g., 'products.view' -> 'farmacia'
    });

    return c.json({
      success: true,
      data: Array.from(frontendModules).map(m => ({ modulo: m, acceso: true }))
    });

  } catch (err) {
    console.error('Error fetching role permissions:', err);
    return c.json(error('Error fetching role permissions', err.message), 500);
  }
});

/**
 * @swagger
 * /roles/lista:
 *   get:
 *     summary: Listar roles para selectores
 *     description: |
 *       Devuelve una lista simplificada de roles para usar en componentes select del frontend.
 *       Formato optimizado para dropdowns con value/label.
 *     tags: [Roles]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de roles obtenida
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
 *                     type: object
 *                     properties:
 *                       value:
 *                         type: string
 *                         format: uuid
 *                         description: ID del rol
 *                       label:
 *                         type: string
 *                         description: Nombre del rol
 *                         example: Doctor
 *                       description:
 *                         type: string
 *                         description: Descripción del rol
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
app.get('/lista', async (c) => {
  try {
    const roles = await roleService.getAll();
    return c.json({
      success: true,
      data: roles.map(r => ({ value: r.id, label: r.name, description: r.description }))
    });
  } catch (err) {
    return c.json(error('Error fetching roles list', err.message), 500);
  }
});

module.exports = app;
