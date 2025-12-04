const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

async function initDatabase() {
  const client = await pool.connect();
  try {
    // Crear tabla de usuarios
    await client.query(`
      CREATE TABLE IF NOT EXISTS usuarios (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        nombre VARCHAR(255) NOT NULL,
        apellido VARCHAR(255) NOT NULL,
        rol VARCHAR(50) NOT NULL CHECK (rol IN ('SUPER_ADMIN', 'ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST', 'PATIENT', 'PHARMACIST', 'LAB_TECHNICIAN')),
        telefono VARCHAR(20),
        cedula VARCHAR(50),
        activo BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Crear tabla de pacientes
    await client.query(`
      CREATE TABLE IF NOT EXISTS pacientes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        nombre VARCHAR(255) NOT NULL,
        apellido VARCHAR(255) NOT NULL,
        cedula VARCHAR(50) UNIQUE NOT NULL,
        fecha_nacimiento DATE NOT NULL,
        genero VARCHAR(20) CHECK (genero IN ('Masculino', 'Femenino', 'Otro')),
        telefono VARCHAR(20),
        email VARCHAR(255),
        direccion TEXT,
        tipo_sangre VARCHAR(5),
        alergias TEXT,
        contacto_emergencia_nombre VARCHAR(255),
        contacto_emergencia_telefono VARCHAR(20),
        activo BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Crear tabla de citas
    await client.query(`
      CREATE TABLE IF NOT EXISTS citas (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        paciente_id UUID REFERENCES pacientes(id) ON DELETE CASCADE,
        doctor_id UUID REFERENCES usuarios(id) ON DELETE CASCADE,
        fecha DATE NOT NULL,
        hora TIME NOT NULL,
        motivo TEXT NOT NULL,
        estado VARCHAR(50) DEFAULT 'Programada' CHECK (estado IN ('Programada', 'Confirmada', 'En Consulta', 'Completada', 'Cancelada', 'No Asistió')),
        notas TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Crear índices
    await client.query('CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_pacientes_cedula ON pacientes(cedula)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_citas_fecha ON citas(fecha)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_citas_paciente ON citas(paciente_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_citas_doctor ON citas(doctor_id)');

    console.log('✅ Database tables created successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  } finally {
    client.release();
  }
}

module.exports = { pool, initDatabase };
