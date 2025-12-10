/**
 * Script principal de seeding para la base de datos
 */
const bcrypt = require('bcryptjs');
const prisma = require('./db/prisma');

async function main() {
  console.log('🌱 Iniciando proceso de seeding...\n');

  try {
    // 1. Crear usuarios del sistema
    console.log('👥 Creando usuarios del sistema...');
    
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    const usuarios = [
      {
        nombre: 'Admin',
        apellido: 'Sistema',
        email: 'admin@clinicamia.com',
        password: hashedPassword,
        rol: 'Admin',
        telefono: '3001234567',
        cedula: '1000000001'
      },
      {
        nombre: 'Carlos',
        apellido: 'Méndez',
        email: 'doctor@clinicamia.com',
        password: await bcrypt.hash('doctor123', 10),
        rol: 'Medico',
        telefono: '3009876543',
        cedula: '1000000002'
      },
      {
        nombre: 'Ana',
        apellido: 'López',
        email: 'enfermera@clinicamia.com',
        password: await bcrypt.hash('enfermera123', 10),
        rol: 'Enfermera',
        telefono: '3007654321',
        cedula: '1000000003'
      }
    ];

    for (const usuario of usuarios) {
      await prisma.usuario.upsert({
        where: { email: usuario.email },
        update: {},
        create: usuario
      });
    }
    
    console.log('✅ Usuarios creados correctamente\n');

    console.log('✅ Productos se crearán desde la interfaz\n');

    console.log('✅ Pacientes se crearán desde la interfaz\n');

    console.log('🎉 Seeding completado exitosamente!');
  } catch (error) {
    console.error('❌ Error durante el seeding:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
