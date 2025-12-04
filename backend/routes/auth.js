const { Hono } = require('hono');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const prisma = require('../db/prisma');
const { authMiddleware } = require('../middleware/auth');

const auth = new Hono();

// Registro de usuario
auth.post('/register', async (c) => {
  try {
    const data = await c.req.json();

    if (!data.email || !data.password || !data.nombre || !data.apellido || !data.rol) {
      return c.json({ error: 'Todos los campos son requeridos' }, 400);
    }

    // Verificar si el usuario ya existe
    const existing = await prisma.usuario.findUnique({ where: { email: data.email } });
    if (existing) {
      return c.json({ error: 'El email ya está registrado' }, 400);
    }

    // Hash de la contraseña
    const hashedPassword = await bcrypt.hash(data.password, 10);

    const user = await prisma.usuario.create({
      data: {
        email: data.email,
        password: hashedPassword,
        nombre: data.nombre,
        apellido: data.apellido,
        rol: data.rol,
        telefono: data.telefono,
        cedula: data.cedula,
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
        createdAt: true,
      },
    });

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

    const user = await prisma.usuario.findUnique({
      where: { email, activo: true },
    });

    if (!user) {
      return c.json({ error: 'Credenciales inválidas' }, 401);
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return c.json({ error: 'Credenciales inválidas' }, 401);
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, rol: user.rol },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    const { password: _, ...userWithoutPassword } = user;

    return c.json({ user: userWithoutPassword, token });
  } catch (error) {
    console.error('Error en login:', error);
    return c.json({ error: 'Error al iniciar sesión' }, 500);
  }
});

// Obtener perfil del usuario actual
auth.get('/me', authMiddleware, async (c) => {
  try {
    const userId = c.get('user').id;
    const user = await prisma.usuario.findUnique({
      where: { id: userId },
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
      },
    });

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
