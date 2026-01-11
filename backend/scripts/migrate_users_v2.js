const prisma = require('../db/prisma');
const { main: seedRolesAndPermissions } = require('../seeders/rolesAndPermissions');

const ROLE_MAPPING = {
  'ADMIN': 'ADMIN',
  'ADMINISTRADOR': 'ADMIN',
  'DOCTOR': 'DOCTOR',
  'MEDICO': 'DOCTOR',
  'ENFERMERA': 'NURSE',
  'ENFERMERO': 'NURSE',
  'NURSE': 'NURSE',
  'RECEPCIONISTA': 'RECEPTIONIST',
  'RECEPTIONIST': 'RECEPTIONIST',
  'PACIENTE': 'PATIENT',
  'PATIENT': 'PATIENT'
};

async function migrateUsers() {
  console.log('Starting migration...');

  // 1. Seed Roles & Permissions first
  console.log('Ensuring roles and permissions exist...');
  await seedRolesAndPermissions();

  // 2. Get all users
  const users = await prisma.usuario.findMany({
    include: { userRoles: true }
  });

  console.log(`Found ${users.length} users.`);

  let migratedCount = 0;

  for (const user of users) {
    if (user.userRoles.length > 0) {
      console.log(`User ${user.email} already has roles assigned. Skipping.`);
      continue;
    }

    const currentRol = user.rol ? user.rol.toUpperCase() : null;
    if (!currentRol) {
      console.warn(`User ${user.email} has no role string. Skipping.`);
      continue;
    }

    const targetRoleName = ROLE_MAPPING[currentRol];
    
    if (!targetRoleName) {
      console.warn(`No mapping found for role "${currentRol}" (User: ${user.email})`);
      continue;
    }

    const role = await prisma.role.findUnique({ where: { name: targetRoleName } });
    
    if (!role) {
      console.error(`Target role "${targetRoleName}" not found in DB!`);
      continue;
    }

    // Assign role
    await prisma.userRole.create({
      data: {
        usuarioId: user.id,
        roleId: role.id,
        assignedBy: null // System migration
      }
    });

    console.log(`Migrated user ${user.email}: ${currentRol} -> ${targetRoleName}`);
    migratedCount++;
  }

  console.log(`Migration completed. Migrated ${migratedCount} users.`);
}

migrateUsers()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
