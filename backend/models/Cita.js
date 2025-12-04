const { pool } = require('../db');

class Cita {
  static async findAll({ fecha = '', estado = '', page = 1, limit = 10 } = {}) {
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
    
    return {
      citas: result.rows,
      total: parseInt(countResult.rows[0].count)
    };
  }

  static async findById(id) {
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

    return result.rows[0];
  }

  static async findByDoctor(doctorId, fecha = '') {
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
    return result.rows;
  }

  static async create(data) {
    const { paciente_id, doctor_id, fecha, hora, motivo, notas } = data;

    // Verificar que el paciente existe
    const pacienteCheck = await pool.query('SELECT id FROM pacientes WHERE id = $1', [paciente_id]);
    if (pacienteCheck.rows.length === 0) {
      throw new Error('Paciente no encontrado');
    }

    // Verificar que el doctor existe
    const doctorCheck = await pool.query('SELECT id FROM usuarios WHERE id = $1 AND rol = \'DOCTOR\'', [doctor_id]);
    if (doctorCheck.rows.length === 0) {
      throw new Error('Doctor no encontrado');
    }

    // Verificar disponibilidad del doctor
    const conflicto = await pool.query(
      'SELECT id FROM citas WHERE doctor_id = $1 AND fecha = $2 AND hora = $3 AND estado NOT IN (\'Cancelada\', \'No Asistió\')',
      [doctor_id, fecha, hora]
    );
    if (conflicto.rows.length > 0) {
      throw new Error('El doctor ya tiene una cita programada en ese horario');
    }

    const result = await pool.query(
      'INSERT INTO citas (paciente_id, doctor_id, fecha, hora, motivo, notas) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [paciente_id, doctor_id, fecha, hora, motivo, notas]
    );

    return result.rows[0];
  }

  static async update(id, data) {
    // Verificar que la cita existe
    const existing = await pool.query('SELECT * FROM citas WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      throw new Error('Cita no encontrada');
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
        throw new Error('El doctor ya tiene una cita programada en ese horario');
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

    if (fields.length === 0) {
      throw new Error('No hay campos para actualizar');
    }

    fields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const query = `UPDATE citas SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`;
    const result = await pool.query(query, values);

    return result.rows[0];
  }

  static async cancel(id) {
    const result = await pool.query(
      'UPDATE citas SET estado = \'Cancelada\', updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      throw new Error('Cita no encontrada');
    }

    return result.rows[0];
  }
}

module.exports = Cita;
