const { Hono } = require('hono');
const { pool } = require('../db');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');

const pacientes = new Hono();

// Aplicar autenticación a todas las rutas
pacientes.use('*', authMiddleware);

// Obtener todos los pacientes
pacientes.get('/', async (c) => {
  try {
    const { page = 1, limit = 10, search = '' } = c.req.query();
    const offset = (page - 1) * limit;

    let query = 'SELECT * FROM pacientes WHERE activo = true';
    let params = [];

    if (search) {
      query += ` AND (nombre ILIKE $1 OR apellido ILIKE $1 OR cedula ILIKE $1)`;
      params.push(`%${search}%`);
    }

    query += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);
    
    // Contar total
    let countQuery = 'SELECT COUNT(*) FROM pacientes WHERE activo = true';
    let countParams = [];
    if (search) {
      countQuery += ` AND (nombre ILIKE $1 OR apellido ILIKE $1 OR cedula ILIKE $1)`;
      countParams.push(`%${search}%`);
    }
    const countResult = await pool.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].count);

    return c.json({
      pacientes: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error al obtener pacientes:', error);
    return c.json({ error: 'Error al obtener pacientes' }, 500);
  }
});

// Obtener un paciente por ID
pacientes.get('/:id', async (c) => {
  try {
    const { id } = c.req.param();
    const result = await pool.query('SELECT * FROM pacientes WHERE id = $1 AND activo = true', [id]);

    if (result.rows.length === 0) {
      return c.json({ error: 'Paciente no encontrado' }, 404);
    }

    return c.json({ paciente: result.rows[0] });
  } catch (error) {
    console.error('Error al obtener paciente:', error);
    return c.json({ error: 'Error al obtener paciente' }, 500);
  }
});

// Crear paciente
pacientes.post('/', roleMiddleware(['SUPER_ADMIN', 'ADMIN', 'DOCTOR', 'RECEPTIONIST']), async (c) => {
  try {
    const {
      nombre,
      apellido,
      cedula,
      fecha_nacimiento,
      genero,
      telefono,
      email,
      direccion,
      tipo_sangre,
      alergias,
      contacto_emergencia_nombre,
      contacto_emergencia_telefono
    } = await c.req.json();

    // Validar campos requeridos
    if (!nombre || !apellido || !cedula || !fecha_nacimiento) {
      return c.json({ error: 'Nombre, apellido, cédula y fecha de nacimiento son requeridos' }, 400);
    }

    // Verificar si la cédula ya existe
    const existing = await pool.query('SELECT * FROM pacientes WHERE cedula = $1', [cedula]);
    if (existing.rows.length > 0) {
      return c.json({ error: 'La cédula ya está registrada' }, 400);
    }

    const result = await pool.query(
      `INSERT INTO pacientes (
        nombre, apellido, cedula, fecha_nacimiento, genero, telefono, email,
        direccion, tipo_sangre, alergias, contacto_emergencia_nombre, contacto_emergencia_telefono
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *`,
      [
        nombre, apellido, cedula, fecha_nacimiento, genero, telefono, email,
        direccion, tipo_sangre, alergias, contacto_emergencia_nombre, contacto_emergencia_telefono
      ]
    );

    return c.json({ paciente: result.rows[0] }, 201);
  } catch (error) {
    console.error('Error al crear paciente:', error);
    return c.json({ error: 'Error al crear paciente' }, 500);
  }
});

// Actualizar paciente
pacientes.put('/:id', roleMiddleware(['SUPER_ADMIN', 'ADMIN', 'DOCTOR', 'RECEPTIONIST']), async (c) => {
  try {
    const { id } = c.req.param();
    const data = await c.req.json();

    // Verificar que el paciente existe
    const existing = await pool.query('SELECT * FROM pacientes WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      return c.json({ error: 'Paciente no encontrado' }, 404);
    }

    const fields = [];
    const values = [];
    let paramIndex = 1;

    // Construir query dinámicamente
    Object.keys(data).forEach(key => {
      if (key !== 'id' && key !== 'created_at') {
        fields.push(`${key} = $${paramIndex}`);
        values.push(data[key]);
        paramIndex++;
      }
    });

    fields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const query = `UPDATE pacientes SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`;
    const result = await pool.query(query, values);

    return c.json({ paciente: result.rows[0] });
  } catch (error) {
    console.error('Error al actualizar paciente:', error);
    return c.json({ error: 'Error al actualizar paciente' }, 500);
  }
});

// Eliminar paciente (soft delete)
pacientes.delete('/:id', roleMiddleware(['SUPER_ADMIN', 'ADMIN']), async (c) => {
  try {
    const { id } = c.req.param();

    const result = await pool.query(
      'UPDATE pacientes SET activo = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return c.json({ error: 'Paciente no encontrado' }, 404);
    }

    return c.json({ message: 'Paciente eliminado correctamente' });
  } catch (error) {
    console.error('Error al eliminar paciente:', error);
    return c.json({ error: 'Error al eliminar paciente' }, 500);
  }
});

module.exports = pacientes;
