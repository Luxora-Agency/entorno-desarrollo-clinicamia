/**
 * @swagger
 * tags:
 *   name: Permisos
 *   description: Catálogo de permisos del sistema RBAC
 */

const { Hono } = require('hono');
const permissionService = require('../services/permission.service');
const { error, success } = require('../utils/response');
const { requirePermission } = require('../middleware/auth');

const app = new Hono();

/**
 * @swagger
 * /permissions:
 *   get:
 *     summary: Listar todos los permisos disponibles
 *     description: |
 *       Obtiene el catálogo completo de permisos del sistema.
 *       Cada permiso tiene formato `module.action` (ej: patients.view, billing.create).
 *       Los permisos se usan para configurar roles con control de acceso granular.
 *     tags: [Permisos]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de permisos obtenida exitosamente
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
 *                     $ref: '#/components/schemas/Permission'
 *             example:
 *               success: true
 *               data:
 *                 - id: "123e4567-e89b-12d3-a456-426614174000"
 *                   name: "patients.view"
 *                   description: "Ver listado de pacientes"
 *                   module: "patients"
 *                   action: "view"
 *                 - id: "123e4567-e89b-12d3-a456-426614174001"
 *                   name: "patients.create"
 *                   description: "Crear nuevos pacientes"
 *                   module: "patients"
 *                   action: "create"
 *                 - id: "123e4567-e89b-12d3-a456-426614174002"
 *                   name: "billing.manage"
 *                   description: "Gestión completa de facturación"
 *                   module: "billing"
 *                   action: "manage"
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
app.get('/', requirePermission('roles.view'), async (c) => {
  try {
    const permissions = await permissionService.getAll();
    return c.json(success(permissions));
  } catch (err) {
    return c.json(error('Error fetching permissions', err.message), 500);
  }
});

module.exports = app;
