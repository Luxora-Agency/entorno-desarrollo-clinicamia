/**
 * Middleware de autenticación y autorización
 */
const { verifyToken } = require('../utils/auth');
const { error } = require('../utils/response');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

/**
 * Middleware para verificar token JWT
 */
const authMiddleware = async (c, next) => {
  try {
    const authHeader = c.req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json(error('Token no proporcionado'), 401);
    }

    const token = authHeader.substring(7);
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
 * Middleware para verificar roles (DEPRECADO - usar permissionMiddleware)
 */
const roleMiddleware = (allowedRoles = []) => {
  return async (c, next) => {
    const user = c.get('user');
    
    if (!user) {
      return c.json(error('Usuario no autenticado'), 401);
    }

    // Comparación case-insensitive de roles
    const userRole = user.rol.toUpperCase();
    const allowedRolesUpper = allowedRoles.map(role => role.toUpperCase());
    
    if (!allowedRolesUpper.includes(userRole)) {
      return c.json(error('No tiene permisos para esta acción'), 403);
    }
    
    await next();
  };
};

/**
 * Middleware para verificar permisos basado en la tabla role_permisos
 * Este es el nuevo middleware recomendado que consulta la base de datos
 * 
 * @param {string} modulo - Nombre del módulo a verificar (ej: 'citas', 'pacientes', 'usuarios')
 * @returns {Function} Middleware function
 * 
 * @example
 * // En tus rutas:
 * citas.post('/', permissionMiddleware('citas'), async (c) => { ... });
 * pacientes.get('/', permissionMiddleware('pacientes'), async (c) => { ... });
 */
const permissionMiddleware = (modulo) => {
  return async (c, next) => {
    try {
      const user = c.get('user');
      
      if (!user) {
        return c.json(error('Usuario no autenticado'), 401);
      }

      // Normalizar el rol a minúsculas para comparación case-insensitive
      const rolNormalizado = user.rol.toLowerCase();

      // Consultar permisos en la base de datos (case-insensitive)
      const permiso = await prisma.rolePermiso.findFirst({
        where: {
          rol: {
            equals: rolNormalizado,
            mode: 'insensitive'
          },
          modulo: modulo,
        }
      });

      // Si no existe el permiso o acceso es false, denegar
      if (!permiso || !permiso.acceso) {
        return c.json(error('No tiene permisos para acceder a este módulo'), 403);
      }

      // El usuario tiene permiso, continuar
      await next();
    } catch (err) {
      console.error('Error en permissionMiddleware:', err);
      return c.json(error('Error al verificar permisos'), 500);
    }
  };
};

module.exports = {
  authMiddleware,
  roleMiddleware, // Mantener para compatibilidad con rutas antiguas
  permissionMiddleware, // Nuevo middleware recomendado
};
