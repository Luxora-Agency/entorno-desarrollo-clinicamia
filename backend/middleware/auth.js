/**
 * Middleware de autenticación y autorización
 */
const { verifyToken } = require('../utils/auth');
const { error } = require('../utils/response');
const { PrismaClient } = require('@prisma/client');
const roleService = require('../services/role.service');

const prisma = new PrismaClient();

/**
 * Middleware para verificar token JWT
 * Acepta token via header Authorization o query parameter ?token=
 */
const authMiddleware = async (c, next) => {
  try {
    const authHeader = c.req.header('Authorization');
    const queryToken = c.req.query('token');

    let token = null;

    // Priorizar header, luego query string
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    } else if (queryToken) {
      token = queryToken;
    }

    if (!token) {
      return c.json(error('Token no proporcionado'), 401);
    }

    const decoded = verifyToken(token);

    if (!decoded) {
      return c.json(error('Token inválido o expirado'), 401);
    }

    // Agregar usuario al contexto
    c.set('user', decoded);
    await next();
  } catch (err) {
    return c.json(error('Error de autenticación'), 401);
  }
};

/**
 * Middleware para verificar roles (DEPRECADO - usar requirePermission)
 */
const roleMiddleware = (...allowedRoles) => {
  return async (c, next) => {
    const user = c.get('user');
    
    if (!user) {
      return c.json(error('Usuario no autenticado'), 401);
    }

    // Asegurar que allowedRoles sea un array plano (soporta array o lista de argumentos)
    const roles = Array.isArray(allowedRoles[0]) ? allowedRoles[0] : allowedRoles;

    // Comparación case-insensitive de roles
    const userRole = user.rol ? user.rol.toUpperCase() : '';
    const allowedRolesUpper = roles.map(role => role.toUpperCase());
    
    if (!allowedRolesUpper.includes(userRole)) {
      return c.json(error('No tiene permisos para esta acción'), 403);
    }
    
    await next();
  };
};

/**
 * Middleware para verificar permisos granulares
 * 
 * @param {string} permissionName - Nombre del permiso a verificar (ej: 'users.create')
 * @returns {Function} Middleware function
 */
const requirePermission = (permissionName) => {
  return async (c, next) => {
    try {
      const user = c.get('user');
      
      if (!user) {
        return c.json(error('Usuario no autenticado'), 401);
      }

      // Obtener roles y permisos del usuario usando el nuevo servicio
      const { permissions, roles } = await roleService.getUserRoles(user.id);
      
      // Check for super admin role or specific permission
      const isSuperAdmin = roles.some(r => r.name === 'SUPER_ADMIN' || r.isSystem);
      if (isSuperAdmin) {
        await next();
        return;
      }

      if (!permissions.includes(permissionName)) {
        return c.json(error(`No tiene permiso: ${permissionName}`), 403);
      }

      await next();
    } catch (err) {
      console.error('Error en requirePermission:', err);
      // Log full stack to see where "reading count" comes from
      if (err.stack) console.error(err.stack);
      return c.json(error('Error al verificar permisos'), 500);
    }
  };
};

/**
 * Middleware para compatibilidad con el sistema anterior de módulos
 */
const permissionMiddleware = (modulo) => {
  return async (c, next) => {
    try {
      const user = c.get('user');
      if (!user) return c.json(error('Usuario no autenticado'), 401);

      // Mapeo temporal o verificación simple
      // Si el usuario tiene ALGÚN permiso que empiece con el nombre del módulo, pasa
      const { permissions, roles } = await roleService.getUserRoles(user.id);
      
      const isSuperAdmin = roles.some(r => r.name === 'SUPER_ADMIN' || r.isSystem);
      if (isSuperAdmin) {
        await next();
        return;
      }

      const hasModuleAccess = permissions.some(p => p.startsWith(`${modulo}.`) || p === modulo);
      
      if (!hasModuleAccess) {
        // Fallback a la tabla antigua si no hay permisos nuevos
        const rolNormalizado = user.rol ? user.rol.toLowerCase() : '';

        const permiso = await prisma.rolePermiso.findFirst({
          where: {
            rol: { equals: rolNormalizado, mode: 'insensitive' },
            modulo: modulo,
          }
        });

        if (!permiso || !permiso.acceso) {
          return c.json(error('No tiene permisos para acceder a este módulo'), 403);
        }
      }

      await next();
    } catch (err) {
      console.error('Error en permissionMiddleware:', err);
      if (err.stack) console.error(err.stack);
      return c.json(error('Error al verificar permisos'), 500);
    }
  };
};

module.exports = {
  authMiddleware,
  roleMiddleware,
  permissionMiddleware,
  requirePermission
};
