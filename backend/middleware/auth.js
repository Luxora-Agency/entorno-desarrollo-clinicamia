/**
 * Middleware de autenticación y autorización
 */
const { verifyToken } = require('../utils/auth');
const { error } = require('../utils/response');

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
 * Middleware para verificar roles
 */
const roleMiddleware = (allowedRoles = []) => {
  return async (c, next) => {
    const user = c.get('user');
    
    if (!user) {
      return c.json(error('Usuario no autenticado'), 401);
    }

    if (!allowedRoles.includes(user.rol)) {
      return c.json(error('No tiene permisos para esta acción'), 403);
    }
    
    await next();
  };
};

module.exports = {
  authMiddleware,
  roleMiddleware,
};
