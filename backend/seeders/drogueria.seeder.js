const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  console.log('🌱 Seeding Droguería Module...');

  // 1. Ensure a POS role or just use existing ones
  // We'll assume admin/nurse can use it for now

  // 2. Import some products from PBS/Pharmacy to Droguería
  const internalProducts = await prisma.producto.findMany({ take: 10 });
  
  if (internalProducts.length === 0) {
    console.log('⚠️ No internal products found to import. Create some first.');
  }

  for (const p of internalProducts) {
    await prisma.drogueriaProducto.upsert({
      where: { sku: p.sku },
      update: {
        stockActual: 20,
        precioVenta: p.precioVenta * 1.2, // 20% margin for retail
      },
      create: {
        sku: p.sku,
        nombre: p.nombre,
        descripcion: p.descripcion,
        precioVenta: p.precioVenta * 1.2,
        stockActual: 20,
        stockMinimo: 5,
        productoId: p.id,
        activo: true
      }
    });
  }

  // 3. Add some retail-only products (not in clinical catalog)
  const retailProds = [
    { sku: 'RET-001', nombre: 'Crema Dental Triple Acción', precio: 8500, stock: 50 },
    { sku: 'RET-002', nombre: 'Cepillo Dental Suave', precio: 12000, stock: 30 },
    { sku: 'RET-003', nombre: 'Jabón Líquido Antibacterial', precio: 15000, stock: 25 },
  ];

  for (const rp of retailProds) {
    await prisma.drogueriaProducto.upsert({
      where: { sku: rp.sku },
      update: {},
      create: {
        sku: rp.sku,
        nombre: rp.nombre,
        precioVenta: rp.precio,
        stockActual: rp.stock,
        stockMinimo: 5,
        activo: true
      }
    });
  }

  console.log('✅ Droguería Seeding Complete');
}

run()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
