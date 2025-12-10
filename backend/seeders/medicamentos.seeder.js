/**
 * Seeder de Medicamentos (Productos farmacéuticos)
 */
const prisma = require('../db/prisma');

const medicamentosComunes = [
  // Analgésicos
  {
    nombre: 'Acetaminofén 500mg',
    principioActivo: 'Paracetamol',
    concentracion: '500mg',
    presentacion: 'Caja x 100 tabletas',
    viaAdministracion: 'Oral',
    descripcion: 'Analgésico y antipirético. Forma farmacéutica: Tableta recubierta.',
    requiereReceta: false,
    precioVenta: 5000,
    precioCompra: 3000,
    cantidadTotal: 500,
  },
  {
    nombre: 'Ibuprofeno 400mg',
    principioActivo: 'Ibuprofeno',
    concentracion: '400mg',
    presentacion: 'Caja x 50 tabletas',
    viaAdministracion: 'Oral',
    descripcion: 'Antiinflamatorio no esteroideo (AINE). Forma: Tableta recubierta.',
    requiereReceta: false,
    precioVenta: 8000,
    precioCompra: 5000,
    cantidadTotal: 300,
  },
  {
    nombre: 'Diclofenaco 75mg Inyectable',
    principioActivo: 'Diclofenaco Sódico',
    concentracion: '75mg/3ml',
    presentacion: 'Caja x 10 ampollas',
    viaAdministracion: 'Intramuscular',
    descripcion: 'Antiinflamatorio para dolor moderado a severo. Forma: Solución inyectable.',
    requiereReceta: true,
    precioVenta: 25000,
    precioCompra: 15000,
    cantidadTotal: 100,
  },
  
  // Antibióticos
  {
    nombre: 'Amoxicilina 500mg',
    principioActivo: 'Amoxicilina',
    concentracion: '500mg',
    presentacion: 'Caja x 21 cápsulas',
    viaAdministracion: 'Oral',
    descripcion: 'Antibiótico betalactámico. Forma: Cápsula.',
    requiereReceta: true,
    precioVenta: 12000,
    precioCompra: 7000,
    cantidadTotal: 200,
  },
  {
    nombre: 'Amoxicilina + Ácido Clavulánico',
    principioActivo: 'Amoxicilina + Ácido Clavulánico',
    concentracion: '875mg/125mg',
    presentacion: 'Caja x 14 tabletas',
    viaAdministracion: 'Oral',
    descripcion: 'Antibiótico de amplio espectro. Forma: Tableta recubierta.',
    requiereReceta: true,
    precioVenta: 35000,
    precioCompra: 20000,
    cantidadTotal: 150,
  },
  {
    nombre: 'Ceftriaxona 1g',
    principioActivo: 'Ceftriaxona',
    concentracion: '1g',
    presentacion: 'Frasco ampolla',
    viaAdministracion: 'Intravenosa',
    descripcion: 'Antibiótico cefalosporina de tercera generación. Forma: Polvo para solución inyectable.',
    requiereReceta: true,
    precioVenta: 15000,
    precioCompra: 8000,
    cantidadTotal: 200,
  },
  
  // Antihipertensivos
  {
    nombre: 'Losartán 50mg',
    principioActivo: 'Losartán Potásico',
    concentracion: '50mg',
    presentacion: 'Caja x 30 tabletas',
    viaAdministracion: 'Oral',
    descripcion: 'Antihipertensivo, antagonista de receptores de angiotensina II. Forma: Tableta.',
    requiereReceta: true,
    precioVenta: 20000,
    precioCompra: 12000,
    cantidadTotal: 250,
  },
  {
    nombre: 'Enalapril 10mg',
    principioActivo: 'Enalapril Maleato',
    concentracion: '10mg',
    presentacion: 'Caja x 30 tabletas',
    viaAdministracion: 'Oral',
    descripcion: 'Antihipertensivo, inhibidor de la ECA. Forma: Tableta.',
    requiereReceta: true,
    precioVenta: 15000,
    precioCompra: 9000,
    cantidadTotal: 300,
  },
  {
    nombre: 'Amlodipino 5mg',
    principioActivo: 'Amlodipino Besilato',
    concentracion: '5mg',
    presentacion: 'Caja x 30 tabletas',
    viaAdministracion: 'Oral',
    descripcion: 'Antihipertensivo, bloqueador de canales de calcio. Forma: Tableta.',
    requiereReceta: true,
    precioVenta: 18000,
    precioCompra: 10000,
    cantidadTotal: 280,
  },
  
  // Protectores Gástricos
  {
    nombre: 'Omeprazol 20mg',
    principioActivo: 'Omeprazol',
    concentracion: '20mg',
    presentacion: 'Caja x 28 cápsulas',
    viaAdministracion: 'Oral',
    descripcion: 'Inhibidor de bomba de protones. Forma: Cápsula.',
    requiereReceta: false,
    precioVenta: 12000,
    precioCompra: 7000,
    cantidadTotal: 350,
  },
  
  // Antidiabéticos
  {
    nombre: 'Metformina 850mg',
    principioActivo: 'Metformina Clorhidrato',
    concentracion: '850mg',
    presentacion: 'Caja x 60 tabletas',
    viaAdministracion: 'Oral',
    descripcion: 'Antidiabético oral. Forma: Tableta recubierta.',
    requiereReceta: true,
    precioVenta: 15000,
    precioCompra: 9000,
    cantidadTotal: 400,
  },
  
  // Soluciones IV
  {
    nombre: 'Solución Salina 0.9% 500ml',
    principioActivo: 'Cloruro de Sodio',
    concentracion: '0.9%',
    presentacion: 'Bolsa x 500ml',
    viaAdministracion: 'Intravenosa',
    descripcion: 'Solución isotónica para hidratación. Forma: Solución para infusión.',
    requiereReceta: true,
    precioVenta: 5000,
    precioCompra: 3000,
    cantidadTotal: 1000,
  },
  {
    nombre: 'Dextrosa 5% 500ml',
    principioActivo: 'Dextrosa',
    concentracion: '5%',
    presentacion: 'Bolsa x 500ml',
    viaAdministracion: 'Intravenosa',
    descripcion: 'Solución glucosada para aporte calórico. Forma: Solución para infusión.',
    requiereReceta: true,
    precioVenta: 6000,
    precioCompra: 3500,
    cantidadTotal: 800,
  },
  {
    nombre: 'Dipirona (Metamizol) 1g',
    principioActivo: 'Metamizol Sódico',
    concentracion: '1g/2ml',
    presentacion: 'Caja x 10 ampollas',
    viaAdministracion: 'Intravenosa',
    descripcion: 'Analgésico y antipirético. Forma: Solución inyectable.',
    requiereReceta: true,
    precioVenta: 20000,
    precioCompra: 12000,
    cantidadTotal: 200,
  },
];

async function seedMedicamentos() {
  console.log('🌱 Iniciando seeder de medicamentos...');

  try {
    // Buscar o crear categoría "Medicamentos"
    let categoria = await prisma.categoriaProducto.findFirst({
      where: { nombre: 'Medicamentos' },
    });

    if (!categoria) {
      console.log('📦 Creando categoría Medicamentos...');
      categoria = await prisma.categoriaProducto.create({
        data: {
          nombre: 'Medicamentos',
          descripcion: 'Productos farmacéuticos y medicamentos',
          activo: true,
        },
      });
    }

    console.log(`✅ Categoría: ${categoria.nombre} (${categoria.id})`);

    // Agregar categoría, SKU y campos requeridos
    const medicamentosConDatos = medicamentosComunes.map((med, index) => ({
      ...med,
      sku: `MED-${med.principioActivo.substring(0, 4).toUpperCase().replace(/\s/g, '')}-${String(index + 1).padStart(3, '0')}`,
      categoriaId: categoria.id,
      cantidadMinAlerta: Math.max(10, Math.floor(med.cantidadTotal * 0.1)),
      activo: true,
    }));

    // Verificar existentes
    const existentes = await prisma.producto.findMany({
      where: {
        principioActivo: {
          in: medicamentosConDatos.map(m => m.principioActivo),
        },
      },
      select: { principioActivo: true, nombre: true },
    });

    console.log(`📊 Existentes: ${existentes.length}`);

    // Filtrar nuevos
    const nuevos = medicamentosConDatos.filter(
      med => !existentes.find(e => e.principioActivo === med.principioActivo)
    );

    console.log(`📝 Nuevos a crear: ${nuevos.length}`);

    if (nuevos.length > 0) {
      const created = await prisma.producto.createMany({
        data: nuevos,
        skipDuplicates: true,
      });

      console.log(`✅ ${created.count} medicamentos creados`);
    } else {
      console.log('ℹ️  Todos los medicamentos ya existen');
    }

    const totalMedicamentos = await prisma.producto.count({
      where: { categoriaId: categoria.id },
    });

    console.log('\n📊 RESUMEN:');
    console.log(`   Total medicamentos: ${totalMedicamentos}`);
    console.log('\n🎉 Seeder completado!');

    return { success: true, count: totalMedicamentos };
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  }
}

if (require.main === module) {
  seedMedicamentos()
    .then(() => {
      console.log('✅ Proceso finalizado');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Error fatal:', error);
      process.exit(1);
    });
}

module.exports = seedMedicamentos;
