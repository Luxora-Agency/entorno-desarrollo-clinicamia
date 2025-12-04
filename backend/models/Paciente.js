const { pool } = require('../db');

class Paciente {
  static async findAll({ search = '', page = 1, limit = 10 } = {}) {
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
    
    return {
      pacientes: result.rows,
      total: parseInt(countResult.rows[0].count)
    };
  }

  static async findById(id) {
    const result = await pool.query(
      'SELECT * FROM pacientes WHERE id = $1 AND activo = true',
      [id]
    );
    return result.rows[0];
  }

  static async findByCedula(cedula) {
    const result = await pool.query(
      'SELECT * FROM pacientes WHERE cedula = $1',
      [cedula]
    );
    return result.rows[0];
  }

  static async create(data) {
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
    } = data;

    // Verificar si la cédula ya existe
    const existing = await this.findByCedula(cedula);
    if (existing) {
      throw new Error('La cédula ya está registrada');
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

    return result.rows[0];
  }

  static async update(id, data) {
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

    const query = `UPDATE pacientes SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`;
    const result = await pool.query(query, values);

    return result.rows[0];
  }

  static async delete(id) {
    const result = await pool.query(
      'UPDATE pacientes SET activo = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING id',
      [id]
    );
    return result.rows[0];
  }
}

module.exports = Paciente;
