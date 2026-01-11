const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  try {
    const count = await prisma.usuario.count();
    console.log(`Total users found: ${count}`);

    if (count === 0) {
      console.log('Creating default admin user...');
      const hashedPassword = await bcrypt.hash('admin123', 10);
      
      // Get SUPER_ADMIN role
      const adminRole = await prisma.role.findFirst({
          where: { name: 'SUPER_ADMIN' }
      });

      if (!adminRole) {
          console.error('SUPER_ADMIN role not found. Please run roles seeder first.');
          return;
      }

      const user = await prisma.usuario.create({
        data: {
          email: 'admin@clinicamia.com',
          password: hashedPassword,
          nombre: 'Admin',
          apellido: 'Sistema',
          rol: 'SUPER_ADMIN', // Legacy field
          activo: true,
          userRoles: {
              create: {
                  roleId: adminRole.id
              }
          }
        }
      });
      console.log('Default admin user created: admin@clinicamia.com / admin123');
    } else {
        const users = await prisma.usuario.findMany({
            include: { userRoles: { include: { role: true } } }
        });
        console.log('Existing users:');
        users.forEach(u => {
            console.log(`- ${u.email} (${u.rol}) [Roles: ${u.userRoles.map(ur => ur.role.name).join(', ')}]`);
        });
    }
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
