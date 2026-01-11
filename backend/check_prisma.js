const prisma = require('./db/prisma');
const roleService = require('./services/role.service');

async function main() {
  console.log('Checking prisma.roles...');
  if (prisma.roles) {
    console.log('prisma.roles is defined');
  } else {
    console.error('prisma.roles is UNDEFINED');
  }

  console.log('Checking roleService.getAll()...');
  try {
    const roles = await roleService.getAll();
    console.log('getAll result count:', roles.length);
  } catch (e) {
    console.error('Error in getAll:', e);
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
