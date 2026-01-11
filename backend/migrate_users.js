const prisma = require('db/prisma');

const ROLE_MAPPING = {
  'superadmin': 'SUPER_ADMIN',
  'admin': 'ADMIN',
  'doctor': 'DOCTOR',
  'enfermera': 'NURSE',
  'recepcionista': 'RECEPTIONIST'
};

async function main() {
  try {
    const users = await prisma.usuario.findMany({
      include: { userRoles: true }
    });

    console.log(`Found ${users.length} users to check.`);

    const allRoles = await prisma.role.findMany();
    const rolesByName = {};
    allRoles.forEach(r => rolesByName[r.name] = r);

    for (const user of users) {
      if (user.userRoles.length === 0) {
        console.log(`Migrating user ${user.email} with legacy role '${user.rol}'...`);
        
        const legacyRole = user.rol.toLowerCase().trim();
        const targetRoleName = ROLE_MAPPING[legacyRole];

        if (targetRoleName && rolesByName[targetRoleName]) {
          const roleId = rolesByName[targetRoleName].id;
          
          await prisma.userRole.create({
            data: {
              usuarioId: user.id,
              roleId: roleId,
              assignedBy: null // System migration
            }
          });
          
          // Optionally update the legacy string to match new convention
          await prisma.usuario.update({
             where: { id: user.id },
             data: { rol: targetRoleName }
          });

          console.log(`  -> Assigned role ${targetRoleName}`);
        } else {
          console.warn(`  -> No matching new role found for '${legacyRole}'`);
        }
      }
    }
    console.log('Migration completed.');
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
