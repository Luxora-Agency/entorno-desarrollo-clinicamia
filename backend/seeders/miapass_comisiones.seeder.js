const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  console.log('🌱 Seeding Mia Pass Commissions Module...');

  // 1. Create a hierarchy: Admin -> Seller 1 -> Seller 2
  const admin = await prisma.usuario.findFirst({ where: { rol: 'Admin' } });
  
  const seller1 = await prisma.usuario.upsert({
    where: { email: 'vendedor1@clinicamia.com' },
    update: { vendedorCodigo: '1000001', vendedorTipo: 'EXTERNO', vendedorPadreId: admin.id },
    create: {
      email: 'vendedor1@clinicamia.com',
      password: 'password123',
      nombre: 'Vendedor',
      apellido: 'Uno',
      rol: 'Vendedor',
      vendedorCodigo: '1000001',
      vendedorTipo: 'EXTERNO',
      vendedorPadreId: admin.id
    }
  });

  const seller2 = await prisma.usuario.upsert({
    where: { email: 'vendedor2@clinicamia.com' },
    update: { vendedorCodigo: '1000002', vendedorTipo: 'REFERIDOR', vendedorPadreId: seller1.id },
    create: {
      email: 'vendedor2@clinicamia.com',
      password: 'password123',
      nombre: 'Vendedor',
      apellido: 'Dos',
      rol: 'Vendedor',
      vendedorCodigo: '1000002',
      vendedorTipo: 'REFERIDOR',
      vendedorPadreId: seller1.id
    }
  });

  // 2. Create a Plan if not exists
  const plan = await prisma.miaPassPlan.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      nombre: 'Plan Familiar Vital',
      costo: 237881,
      duracionMeses: 12,
      activo: true
    }
  });

  // 3. Register a sale for Seller 2
  // This should trigger: 
  // - Commission for Seller 2 (25%)
  // - Level 1 Commission for Seller 1 ($10,000)
  // - Level 2 Commission for Admin ($5,000)
  
  console.log('✅ Hierarchy created.');
  console.log('Next step: Test a sale via API or Service.');
}

run()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
