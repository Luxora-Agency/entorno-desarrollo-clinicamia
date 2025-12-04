const { pool } = require('../db');
const bcrypt = require('bcrypt');

class Usuario {
  static async findAll({ search = '', page = 1, limit = 10 } = {}) {
    const offset = (page - 1) * limit;
    let query = 'SELECT id, email, nombre, apellido, rol, telefono, cedula, activo, created_at FROM usuarios WHERE activo = true';
    let params = [];

    if (search) {
      query += ` AND (nombre ILIKE $1 OR apellido ILIKE $1 OR email ILIKE $1)`;
      params.push(`%${search}%`);
    }

    query += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);
    
    // Contar total
    let countQuery = 'SELECT COUNT(*) FROM usuarios WHERE activo = true';
    let countParams = [];
    if (search) {
      countQuery += ` AND (nombre ILIKE $1 OR apellido ILIKE $1 OR email ILIKE $1)`;
      countParams.push(`%${search}%`);
    }
    const countResult = await pool.query(countQuery, countParams);
    
    return {
      usuarios: result.rows,
      total: parseInt(countResult.rows[0].count)
    };
  }

  static async findById(id) {
    const result = await pool.query(
      'SELECT id, email, nombre, apellido, rol, telefono, cedula, activo, created_at FROM usuarios WHERE id = $1',
      [id]
    );
    return result.rows[0];
  }

  static async findByEmail(email) {
    const result = await pool.query(
      'SELECT * FROM usuarios WHERE email = $1 AND activo = true',
      [email]
    );
    return result.rows[0];
  }

  static async create(data) {
    const { email, password, nombre, apellido, rol, telefono, cedula } = data;
    
    // Verificar si el usuario ya existe
    const existing = await this.findByEmail(email);
    if (existing) {
      throw new Error('El email ya está registrado');
    }

    // Hash de la contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await pool.query(
      'INSERT INTO usuarios (email, password, nombre, apellido, rol, telefono, cedula) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id, email, nombre, apellido, rol, telefono, cedula, activo, created_at',
      [email, hashedPassword, nombre, apellido, rol, telefono, cedula]
    );

    return result.rows[0];
  }

  static async update(id, data) {
    const fields = [];
    const values = [];
    let paramIndex = 1;

    Object.keys(data).forEach(key => {
      if (key !== 'id' && key !== 'created_at' && key !== 'password') {
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

    const query = `UPDATE usuarios SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING id, email, nombre, apellido, rol, telefono, cedula, activo, created_at`;
    const result = await pool.query(query, values);

    return result.rows[0];
  }

  static async delete(id) {
    const result = await pool.query(
      'UPDATE usuarios SET activo = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING id',
      [id]
    );
    return result.rows[0];
  }

  static async verifyPassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }
}

module.exports = Usuario;
