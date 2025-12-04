const { Hono } = require('hono');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { pool } = require('../db');
const { authMiddleware } = require('../middleware/auth');

const auth = new Hono();

// Registro de usuario
auth.post('/register', async (c) => {
  try {
    const { email, password, nombre, apellido, rol, telefono, cedula } = await c.req.json();

    // Validar campos requeridos
    if (!email || !password || !nombre || !apellido || !rol) {
      return c.json({ error: 'Todos los campos son requeridos' }, 400);
    }

    // Verificar si el usuario ya existe
    const existingUser = await pool.query('SELECT * FROM usuarios WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      return c.json({ error: 'El email ya está registrado' }, 400);
    }

    // Hash de la contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insertar usuario
    const result = await pool.query(
      'INSERT INTO usuarios (email, password, nombre, apellido, rol, telefono, cedula) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id, email, nombre, apellido, rol, telefono, cedula, activo, created_at',
      [email, hashedPassword, nombre, apellido, rol, telefono, cedula]
    );

    const user = result.rows[0];

    // Generar token
    const token = jwt.sign(
      { id: user.id, email: user.email, rol: user.rol },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    return c.json({ user, token }, 201);
  } catch (error) {
    console.error('Error en registro:', error);
    return c.json({ error: 'Error al registrar usuario' }, 500);
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
    const result = await pool.query('SELECT * FROM usuarios WHERE email = $1 AND activo = true', [email]);
    
    if (result.rows.length === 0) {
      return c.json({ error: 'Credenciales inválidas' }, 401);
    }

    const user = result.rows[0];

    // Verificar contraseña
    const isValidPassword = await bcrypt.compare(password, user.password);
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
    
    const result = await pool.query(
      'SELECT id, email, nombre, apellido, rol, telefono, cedula, activo, created_at FROM usuarios WHERE id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      return c.json({ error: 'Usuario no encontrado' }, 404);
    }

    return c.json({ user: result.rows[0] });
  } catch (error) {
    console.error('Error al obtener perfil:', error);
    return c.json({ error: 'Error al obtener perfil' }, 500);
  }
});

module.exports = auth;
