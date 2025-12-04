const { Hono } = require('hono');
const { pool } = require('../db');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');

const citas = new Hono();

// Aplicar autenticación a todas las rutas
citas.use('*', authMiddleware);

// Obtener todas las citas
citas.get('/', async (c) => {
  try {
    const { page = 1, limit = 10, fecha = '', estado = '' } = c.req.query();
    const offset = (page - 1) * limit;

    let query = `
      SELECT 
        c.*,
        p.nombre as paciente_nombre,
        p.apellido as paciente_apellido,
        p.cedula as paciente_cedula,
        u.nombre as doctor_nombre,
        u.apellido as doctor_apellido
      FROM citas c
      LEFT JOIN pacientes p ON c.paciente_id = p.id
      LEFT JOIN usuarios u ON c.doctor_id = u.id
      WHERE 1=1
    `;
    let params = [];
    let paramIndex = 1;

    if (fecha) {
      query += ` AND c.fecha = $${paramIndex}`;
      params.push(fecha);
      paramIndex++;
    }

    if (estado) {
      query += ` AND c.estado = $${paramIndex}`;
      params.push(estado);
      paramIndex++;
    }

    query += ` ORDER BY c.fecha DESC, c.hora DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);

    // Contar total
    let countQuery = 'SELECT COUNT(*) FROM citas c WHERE 1=1';
    let countParams = [];
    let countIndex = 1;
    if (fecha) {
      countQuery += ` AND c.fecha = $${countIndex}`;
      countParams.push(fecha);
      countIndex++;
    }
    if (estado) {
      countQuery += ` AND c.estado = $${countIndex}`;
      countParams.push(estado);
    }
    const countResult = await pool.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].count);

    return c.json({
      citas: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error al obtener citas:', error);
    return c.json({ error: 'Error al obtener citas' }, 500);
  }
});

// Obtener citas por doctor
citas.get('/doctor/:doctorId', async (c) => {
  try {
    const { doctorId } = c.req.param();
    const { fecha = '' } = c.req.query();

    let query = `
      SELECT 
        c.*,
        p.nombre as paciente_nombre,
        p.apellido as paciente_apellido,
        p.cedula as paciente_cedula
      FROM citas c
      LEFT JOIN pacientes p ON c.paciente_id = p.id
      WHERE c.doctor_id = $1
    `;
    let params = [doctorId];

    if (fecha) {
      query += ` AND c.fecha = $2`;
      params.push(fecha);
    }

    query += ` ORDER BY c.fecha ASC, c.hora ASC`;

    const result = await pool.query(query, params);
    return c.json({ citas: result.rows });
  } catch (error) {
    console.error('Error al obtener citas del doctor:', error);
    return c.json({ error: 'Error al obtener citas del doctor' }, 500);
  }
});

// Obtener una cita por ID
citas.get('/:id', async (c) => {
  try {
    const { id } = c.req.param();
    const result = await pool.query(`
      SELECT 
        c.*,
        p.nombre as paciente_nombre,
        p.apellido as paciente_apellido,
        p.cedula as paciente_cedula,
        p.telefono as paciente_telefono,
        u.nombre as doctor_nombre,
        u.apellido as doctor_apellido
      FROM citas c
      LEFT JOIN pacientes p ON c.paciente_id = p.id
      LEFT JOIN usuarios u ON c.doctor_id = u.id
      WHERE c.id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return c.json({ error: 'Cita no encontrada' }, 404);
    }

    return c.json({ cita: result.rows[0] });
  } catch (error) {
    console.error('Error al obtener cita:', error);
    return c.json({ error: 'Error al obtener cita' }, 500);
  }
});

// Crear cita
citas.post('/', roleMiddleware(['SUPER_ADMIN', 'ADMIN', 'DOCTOR', 'RECEPTIONIST']), async (c) => {
  try {
    const { paciente_id, doctor_id, fecha, hora, motivo, notas } = await c.req.json();

    // Validar campos requeridos
    if (!paciente_id || !doctor_id || !fecha || !hora || !motivo) {
      return c.json({ error: 'Todos los campos son requeridos' }, 400);
    }

    // Verificar que el paciente existe
    const pacienteExists = await pool.query('SELECT id FROM pacientes WHERE id = $1', [paciente_id]);
    if (pacienteExists.rows.length === 0) {
      return c.json({ error: 'Paciente no encontrado' }, 404);
    }

    // Verificar que el doctor existe
    const doctorExists = await pool.query('SELECT id FROM usuarios WHERE id = $1 AND rol = \'DOCTOR\'', [doctor_id]);
    if (doctorExists.rows.length === 0) {
      return c.json({ error: 'Doctor no encontrado' }, 404);
    }

    // Verificar disponibilidad del doctor
    const conflicto = await pool.query(
      'SELECT id FROM citas WHERE doctor_id = $1 AND fecha = $2 AND hora = $3 AND estado NOT IN (\'Cancelada\', \'No Asistió\')',
      [doctor_id, fecha, hora]
    );
    if (conflicto.rows.length > 0) {
      return c.json({ error: 'El doctor ya tiene una cita programada en ese horario' }, 400);
    }

    const result = await pool.query(
      'INSERT INTO citas (paciente_id, doctor_id, fecha, hora, motivo, notas) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [paciente_id, doctor_id, fecha, hora, motivo, notas]
    );

    return c.json({ cita: result.rows[0] }, 201);
  } catch (error) {
    console.error('Error al crear cita:', error);
    return c.json({ error: 'Error al crear cita' }, 500);
  }
});

// Actualizar cita
citas.put('/:id', roleMiddleware(['SUPER_ADMIN', 'ADMIN', 'DOCTOR', 'RECEPTIONIST']), async (c) => {
  try {
    const { id } = c.req.param();
    const data = await c.req.json();

    // Verificar que la cita existe
    const existing = await pool.query('SELECT * FROM citas WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      return c.json({ error: 'Cita no encontrada' }, 404);
    }

    // Si se cambia el horario, verificar disponibilidad
    if (data.doctor_id || data.fecha || data.hora) {
      const doctorId = data.doctor_id || existing.rows[0].doctor_id;
      const fecha = data.fecha || existing.rows[0].fecha;
      const hora = data.hora || existing.rows[0].hora;

      const conflicto = await pool.query(
        'SELECT id FROM citas WHERE doctor_id = $1 AND fecha = $2 AND hora = $3 AND id != $4 AND estado NOT IN (\'Cancelada\', \'No Asistió\')',
        [doctorId, fecha, hora, id]
      );
      if (conflicto.rows.length > 0) {
        return c.json({ error: 'El doctor ya tiene una cita programada en ese horario' }, 400);
      }
    }

    const fields = [];
    const values = [];
    let paramIndex = 1;

    Object.keys(data).forEach(key => {
      if (key !== 'id' && key !== 'created_at') {
        fields.push(`${key} = $${paramIndex}`);
        values.push(data[key]);
        paramIndex++;
      }
    });

    fields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const query = `UPDATE citas SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`;
    const result = await pool.query(query, values);

    return c.json({ cita: result.rows[0] });
  } catch (error) {
    console.error('Error al actualizar cita:', error);
    return c.json({ error: 'Error al actualizar cita' }, 500);
  }
});

// Cancelar cita
citas.delete('/:id', roleMiddleware(['SUPER_ADMIN', 'ADMIN', 'DOCTOR', 'RECEPTIONIST']), async (c) => {
  try {
    const { id } = c.req.param();

    const result = await pool.query(
      'UPDATE citas SET estado = \'Cancelada\', updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return c.json({ error: 'Cita no encontrada' }, 404);
    }

    return c.json({ message: 'Cita cancelada correctamente' });
  } catch (error) {
    console.error('Error al cancelar cita:', error);
    return c.json({ error: 'Error al cancelar cita' }, 500);
  }
});

module.exports = citas;
