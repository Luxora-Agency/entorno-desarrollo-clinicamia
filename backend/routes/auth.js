const { Hono } = require('hono');
const jwt = require('jsonwebtoken');
const Usuario = require('../models/Usuario');
const { authMiddleware } = require('../middleware/auth');

const auth = new Hono();

// Registro de usuario
auth.post('/register', async (c) => {
  try {
    const data = await c.req.json();

    // Validar campos requeridos
    if (!data.email || !data.password || !data.nombre || !data.apellido || !data.rol) {
      return c.json({ error: 'Todos los campos son requeridos' }, 400);
    }

    const user = await Usuario.create(data);

    // Generar token
    const token = jwt.sign(
      { id: user.id, email: user.email, rol: user.rol },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    return c.json({ user, token }, 201);
  } catch (error) {
    console.error('Error en registro:', error);
    return c.json({ error: error.message || 'Error al registrar usuario' }, 500);
  }
});

// Login
auth.post('/login', async (c) => {
  try {
    const { email, password } = await c.req.json();

    if (!email || !password) {
      return c.json({ error: 'Email y contraseña son requeridos' }, 400);
    }

    // Buscar usuario
    const user = await Usuario.findByEmail(email);
    
    if (!user) {
      return c.json({ error: 'Credenciales inválidas' }, 401);
    }

    // Verificar contraseña
    const isValidPassword = await Usuario.verifyPassword(password, user.password);
    if (!isValidPassword) {
      return c.json({ error: 'Credenciales inválidas' }, 401);
    }

    // Generar token
    const token = jwt.sign(
      { id: user.id, email: user.email, rol: user.rol },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Remover password del objeto de respuesta
    delete user.password;

    return c.json({ user, token });
  } catch (error) {
    console.error('Error en login:', error);
    return c.json({ error: 'Error al iniciar sesión' }, 500);
  }
});

// Obtener perfil del usuario actual
auth.get('/me', authMiddleware, async (c) => {
  try {
    const userId = c.get('user').id;
    const user = await Usuario.findById(userId);

    if (!user) {
      return c.json({ error: 'Usuario no encontrado' }, 404);
    }

    return c.json({ user });
  } catch (error) {
    console.error('Error al obtener perfil:', error);
    return c.json({ error: 'Error al obtener perfil' }, 500);
  }
});

module.exports = auth;
