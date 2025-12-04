const jwt = require('jsonwebtoken');

const authMiddleware = async (c, next) => {
  const authHeader = c.req.header('Authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: 'No token provided' }, 401);
  }

  const token = authHeader.substring(7);

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    c.set('user', decoded);
    await next();
  } catch (error) {
    return c.json({ error: 'Invalid token' }, 401);
  }
};

const roleMiddleware = (allowedRoles) => {
  return async (c, next) => {
    const user = c.get('user');
    
    if (!user || !allowedRoles.includes(user.rol)) {
      return c.json({ error: 'Access denied' }, 403);
    }
    
    await next();
  };
};

module.exports = { authMiddleware, roleMiddleware };
