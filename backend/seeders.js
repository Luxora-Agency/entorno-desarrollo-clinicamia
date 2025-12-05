/**
 * Script de Seeders para poblar la base de datos con datos de prueba
 * Ejecutar con: node seeders.js
 */
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function clearDatabase() {
  console.log('🗑️  Limpiando datos existentes...');
  
  // Eliminar en orden para respetar relaciones
  await prisma.cita.deleteMany();
  await prisma.examenProcedimiento.deleteMany();
  await prisma.categoriaExamen.deleteMany();
  await prisma.productoEtiqueta.deleteMany();
  await prisma.producto.deleteMany();
  await prisma.etiquetaProducto.deleteMany();
  await prisma.categoriaProducto.deleteMany();
  await prisma.paciente.deleteMany();
  await prisma.doctorEspecialidad.deleteMany();
  await prisma.doctor.deleteMany();
  await prisma.especialidad.deleteMany();
  await prisma.departamento.deleteMany();
  await prisma.usuario.deleteMany();
  
  console.log('✅ Base de datos limpia');
}

async function seedUsuarios() {
  console.log('👥 Creando usuarios...');
  
  const usuarios = [
    {
      nombre: 'Admin',
      apellido: 'Sistema',
      email: 'admin@clinicamia.com',
      password: await bcrypt.hash('admin123', 10),
      rol: 'Admin',
      activo: true,
    },
    {
      nombre: 'Carlos',
      apellido: 'Rodríguez',
      email: 'doctor@clinicamia.com',
      password: await bcrypt.hash('doctor123', 10),
      rol: 'Doctor',
      cedula: '1234567890',
      telefono: '3001234567',
      activo: true,
    },
    {
      nombre: 'María',
      apellido: 'González',
      email: 'enfermera@clinicamia.com',
      password: await bcrypt.hash('enfermera123', 10),
      rol: 'Enfermera',
      activo: true,
    },
  ];

  const created = [];
  for (const usuario of usuarios) {
    const user = await prisma.usuario.create({ data: usuario });
    created.push(user);
  }
  
  console.log(`✅ ${usuarios.length} usuarios creados`);
  return created;
}

async function seedDepartamentos() {
  console.log('🏥 Creando departamentos...');
  
  const departamentos = [
    { nombre: 'Medicina General', descripcion: 'Atención médica general y consultas básicas' },
    { nombre: 'Urgencias', descripcion: 'Atención de emergencias médicas' },
    { nombre: 'Pediatría', descripcion: 'Atención médica para niños y adolescentes' },
    { nombre: 'Ginecología', descripcion: 'Salud de la mujer y obstetricia' },
  ];

  const created = [];
  for (const dept of departamentos) {
    const departamento = await prisma.departamento.create({ data: dept });
    created.push(departamento);
  }
  
  console.log(`✅ ${created.length} departamentos creados`);
  return created;
}

async function seedEspecialidades(departamentos) {
  console.log('⚕️  Creando especialidades...');
  
  const especialidades = [
    {
      titulo: 'Medicina General',
      descripcion: 'Consulta médica general',
      departamentoId: departamentos[0].id,
      duracionMinutos: 30,
      costoCOP: 50000,
    },
    {
      titulo: 'Pediatría General',
      descripcion: 'Consulta pediátrica',
      departamentoId: departamentos[2].id,
      duracionMinutos: 40,
      costoCOP: 60000,
    },
    {
      titulo: 'Ginecología',
      descripcion: 'Consulta ginecológica',
      departamentoId: departamentos[3].id,
      duracionMinutos: 45,
      costoCOP: 70000,
    },
  ];

  const created = [];
  for (const esp of especialidades) {
    const especialidad = await prisma.especialidad.create({ data: esp });
    created.push(especialidad);
  }
  
  console.log(`✅ ${created.length} especialidades creadas`);
  return created;
}

async function seedDoctores(especialidades, usuarios) {
  console.log('👨‍⚕️ Creando doctores...');
  
  // Usar el usuario doctor que ya creamos
  const usuarioDoctor = usuarios.find(u => u.rol === 'Doctor');
  
  const doctores = [
    {
      nombre: 'Carlos',
      apellido: 'Rodríguez',
      cedula: '1234567890',
      telefono: '3001234567',
      email: 'doctor@clinicamia.com',
      especialidadId: especialidades[0].id,
      registroMedico: 'RM-001',
      licenciaMedica: 'LM-12345',
      usuarioId: usuarioDoctor.id,
    },
  ];

  const created = [];
  for (const doc of doctores) {
    const doctor = await prisma.doctor.create({ data: doc });
    created.push(doctor);
  }
  
  console.log(`✅ ${created.length} doctores creados`);
  return created;
}

async function seedPacientes() {
  console.log('🧑‍🤝‍🧑 Creando pacientes...');
  
  const pacientes = [
    {
      nombre: 'Pedro',
      apellido: 'García',
      tipoDocumento: 'Cédula de Ciudadanía',
      cedula: '1098765432',
      fechaNacimiento: new Date('1985-03-15'),
      genero: 'Masculino',
      paisNacimiento: 'Colombia',
      departamento: 'Cundinamarca',
      municipio: 'Bogotá',
      barrio: 'Chapinero',
      direccion: 'Calle 63 #10-20',
      telefono: '3201234567',
      email: 'pedro.garcia@email.com',
      contactosEmergencia: JSON.stringify([
        { nombre: 'María García', telefono: '3109876543', parentesco: 'Esposa' }
      ]),
      eps: 'Compensar EPS',
      regimen: 'contributivo',
      tipoAfiliacion: 'cotizante',
      tipoSangre: 'O+',
      peso: 75,
      altura: 1.75,
      alergias: 'Penicilina',
      estado: 'Activo',
    },
    {
      nombre: 'Sofía',
      apellido: 'Hernández',
      tipoDocumento: 'Cédula de Ciudadanía',
      cedula: '52123456',
      fechaNacimiento: new Date('1992-07-22'),
      genero: 'Femenino',
      paisNacimiento: 'Colombia',
      departamento: 'Cundinamarca',
      municipio: 'Bogotá',
      barrio: 'Usaquén',
      direccion: 'Carrera 7 #127-35',
      telefono: '3159876543',
      email: 'sofia.hernandez@email.com',
      contactosEmergencia: JSON.stringify([
        { nombre: 'Luis Hernández', telefono: '3001234567', parentesco: 'Padre' }
      ]),
      eps: 'Sanitas EPS',
      regimen: 'contributivo',
      tipoAfiliacion: 'cotizante',
      tipoSangre: 'A+',
      peso: 62,
      altura: 1.65,
      alergias: 'Mariscos, Látex',
      enfermedadesCronicas: 'Asma',
      medicamentosActuales: 'Salbutamol 100mcg',
      estado: 'Activo',
    },
    {
      nombre: 'Carlos',
      apellido: 'Moreno',
      tipoDocumento: 'Cédula de Ciudadanía',
      cedula: '79456123',
      fechaNacimiento: new Date('1978-11-08'),
      genero: 'Masculino',
      paisNacimiento: 'Colombia',
      departamento: 'Cundinamarca',
      municipio: 'Bogotá',
      barrio: 'Suba',
      direccion: 'Calle 145 #91-20',
      telefono: '3208765432',
      email: 'carlos.moreno@email.com',
      contactosEmergencia: JSON.stringify([
        { nombre: 'Andrea Moreno', telefono: '3187654321', parentesco: 'Esposa' }
      ]),
      eps: 'Salud Total EPS',
      regimen: 'contributivo',
      tipoAfiliacion: 'cotizante',
      tipoSangre: 'B+',
      peso: 82,
      altura: 1.78,
      enfermedadesCronicas: 'Hipertensión, Diabetes Tipo 2',
      medicamentosActuales: 'Losartán 50mg, Metformina 850mg',
      antecedentesQuirurgicos: 'Apendicectomía 2010',
      estado: 'Activo',
    },
  ];

  const created = [];
  for (const pac of pacientes) {
    const paciente = await prisma.paciente.create({ data: pac });
    created.push(paciente);
  }
  
  console.log(`✅ ${created.length} pacientes creados`);
  return created;
}

async function seedCategoriasExamenes() {
  console.log('🔬 Creando categorías de exámenes...');
  
  const categorias = [
    { nombre: 'Laboratorio Clínico', descripcion: 'Análisis de muestras biológicas', colorHex: '#3b82f6' },
    { nombre: 'Imagenología', descripcion: 'Estudios de diagnóstico por imagen', colorHex: '#8b5cf6' },
    { nombre: 'Cardiología', descripcion: 'Estudios del sistema cardiovascular', colorHex: '#ef4444' },
  ];

  const created = [];
  for (const cat of categorias) {
    const categoria = await prisma.categoriaExamen.create({ data: cat });
    created.push(categoria);
  }
  
  console.log(`✅ ${created.length} categorías de exámenes creadas`);
  return created;
}

async function seedExamenes(categorias) {
  console.log('🧪 Creando exámenes y procedimientos...');
  
  const examenes = [
    {
      tipo: 'Examen',
      nombre: 'Hemograma Completo',
      descripcion: 'Análisis completo de células sanguíneas',
      categoriaId: categorias[0].id,
      duracionMinutos: 15,
      costoBase: 25000,
      preparacionEspecial: 'Ayuno de 8 horas',
    },
    {
      tipo: 'Examen',
      nombre: 'Radiografía de Tórax',
      descripcion: 'Imagen radiológica del tórax',
      categoriaId: categorias[1].id,
      duracionMinutos: 20,
      costoBase: 45000,
    },
    {
      tipo: 'Procedimiento',
      nombre: 'Electrocardiograma',
      descripcion: 'Registro de la actividad eléctrica del corazón',
      categoriaId: categorias[2].id,
      duracionMinutos: 30,
      costoBase: 35000,
    },
  ];

  const created = [];
  for (const exam of examenes) {
    const examen = await prisma.examenProcedimiento.create({ data: exam });
    created.push(examen);
  }
  
  console.log(`✅ ${created.length} exámenes creados`);
  return created;
}

async function seedFarmacia() {
  console.log('💊 Creando datos de farmacia...');
  
  // Categorías de productos
  const categorias = [
    { nombre: 'Analgésicos', descripcion: 'Medicamentos para el dolor', color: '#ef4444' },
    { nombre: 'Antibióticos', descripcion: 'Medicamentos antimicrobianos', color: '#3b82f6' },
    { nombre: 'Vitaminas', descripcion: 'Suplementos vitamínicos', color: '#10b981' },
  ];

  const categoriasCreadas = [];
  for (const cat of categorias) {
    const categoria = await prisma.categoriaProducto.create({ data: cat });
    categoriasCreadas.push(categoria);
  }
  
  console.log(`✅ ${categorias.length} categorías de productos creadas`);

  // Etiquetas
  const etiquetas = [
    { nombre: 'Controlado', color: '#dc2626' },
    { nombre: 'Refrigerar', color: '#2563eb' },
    { nombre: 'Genérico', color: '#059669' },
  ];

  const etiquetasCreadas = [];
  for (const etiq of etiquetas) {
    const etiqueta = await prisma.etiquetaProducto.create({ data: etiq });
    etiquetasCreadas.push(etiqueta);
  }
  
  console.log(`✅ ${etiquetas.length} etiquetas creadas`);

  // Productos
  const productos = [
    {
      sku: 'MED-001',
      nombre: 'Acetaminofén 500mg',
      descripcion: 'Analgésico y antipirético',
      precioVenta: 5000,
      stock: 150,
      cantidadTotal: 150,
      stockMinimo: 30,
      cantidadMinAlerta: 30,
      unidadMedida: 'Tableta',
      lote: 'LOT2024-001',
      fechaVencimiento: new Date('2025-12-31'),
      categoriaId: categoriasCreadas[0].id,
      requiereReceta: false,
    },
    {
      sku: 'MED-002',
      nombre: 'Amoxicilina 500mg',
      descripcion: 'Antibiótico de amplio espectro',
      precio: 15000,
      precioVenta: 15000,
      stock: 80,
      cantidadTotal: 80,
      stockMinimo: 20,
      cantidadMinAlerta: 20,
      unidadMedida: 'Cápsula',
      lote: 'LOT2024-002',
      fechaVencimiento: new Date('2025-06-30'),
      categoriaId: categoriasCreadas[1].id,
      requiereReceta: true,
    },
    {
      sku: 'MED-003',
      nombre: 'Complejo B',
      descripcion: 'Suplemento vitamínico del complejo B',
      precio: 8000,
      precioVenta: 8000,
      stock: 120,
      cantidadTotal: 120,
      stockMinimo: 25,
      cantidadMinAlerta: 25,
      unidadMedida: 'Tableta',
      lote: 'LOT2024-003',
      fechaVencimiento: new Date('2026-03-31'),
      categoriaId: categoriasCreadas[2].id,
      requiereReceta: false,
    },
  ];

  const productosCreados = [];
  for (const prod of productos) {
    const producto = await prisma.producto.create({ data: prod });
    productosCreados.push(producto);
  }
  
  console.log(`✅ ${productos.length} productos creados`);

  return { categorias: categoriasCreadas, etiquetas: etiquetasCreadas, productos: productosCreados };
}

async function seedCitas(pacientes, doctores, especialidades) {
  console.log('📅 Creando citas...');
  
  const citas = [
    {
      pacienteId: pacientes[0].id,
      doctorId: doctores[0].id,
      especialidadId: especialidades[0].id,
      fechaHora: new Date('2025-12-10T10:00:00'),
      motivo: 'Control médico general',
      estado: 'Programada',
    },
    {
      pacienteId: pacientes[1].id,
      doctorId: doctores[1].id,
      especialidadId: especialidades[1].id,
      fechaHora: new Date('2025-12-11T14:30:00'),
      motivo: 'Control de crecimiento',
      estado: 'Programada',
    },
    {
      pacienteId: pacientes[2].id,
      doctorId: doctores[0].id,
      especialidadId: especialidades[0].id,
      fechaHora: new Date('2025-12-08T09:00:00'),
      motivo: 'Control de hipertensión',
      estado: 'Completada',
    },
  ];

  const created = [];
  for (const cita of citas) {
    const citaCreada = await prisma.cita.create({ data: cita });
    created.push(citaCreada);
  }
  
  console.log(`✅ ${created.length} citas creadas`);
  return created;
}

async function seedHospitalizacion() {
  console.log('🏥 Seeding hospitalización...');

  // Crear unidades
  const unidades = [
    {
      id: crypto.randomUUID(),
      nombre: 'UCI',
      descripcion: 'Unidad de Cuidados Intensivos',
      tipo: 'UCI',
      capacidad: 20,
      activo: true,
    },
    {
      id: crypto.randomUUID(),
      nombre: 'Hospitalización General',
      descripcion: 'Área de hospitalización general',
      tipo: 'Hospitalización',
      capacidad: 50,
      activo: true,
    },
    {
      id: crypto.randomUUID(),
      nombre: 'Observación',
      descripcion: 'Sala de observación y emergencias',
      tipo: 'Observación',
      capacidad: 15,
      activo: true,
    },
  ];

  const unidadesCreadas = [];
  for (const unidad of unidades) {
    const created = await prisma.unidad.create({ data: unidad });
    unidadesCreadas.push(created);
  }
  console.log(`✅ ${unidadesCreadas.length} unidades creadas`);

  // Crear habitaciones
  const habitaciones = [];
  unidadesCreadas.forEach((unidad, index) => {
    // 3 habitaciones por unidad
    for (let i = 1; i <= 3; i++) {
      habitaciones.push({
        id: crypto.randomUUID(),
        numero: `${(index + 1) * 100 + i}`,
        unidadId: unidad.id,
        piso: index + 1,
        capacidadCamas: 2,
        activo: true,
      });
    }
  });

  const habitacionesCreadas = [];
  for (const habitacion of habitaciones) {
    const created = await prisma.habitacion.create({ data: habitacion });
    habitacionesCreadas.push(created);
  }
  console.log(`✅ ${habitacionesCreadas.length} habitaciones creadas`);

  // Crear camas
  const camas = [];
  habitacionesCreadas.forEach((habitacion) => {
    // 2 camas por habitación
    for (let i = 1; i <= 2; i++) {
      camas.push({
        id: crypto.randomUUID(),
        numero: `${habitacion.numero}-${String.fromCharCode(64 + i)}`, // 101-A, 101-B
        habitacionId: habitacion.id,
        estado: 'Disponible',
        observaciones: null,
      });
    }
  });

  const camasCreadas = [];
  for (const cama of camas) {
    const created = await prisma.cama.create({ data: cama });
    camasCreadas.push(created);
  }
  console.log(`✅ ${camasCreadas.length} camas creadas`);

  return { unidades: unidadesCreadas, habitaciones: habitacionesCreadas, camas: camasCreadas };
}

async function main() {
  try {
    console.log('🌱 Iniciando seeders...\n');
    
    await clearDatabase();
    
    const usuarios = await seedUsuarios();
    const departamentos = await seedDepartamentos();
    const especialidades = await seedEspecialidades(departamentos);
    const pacientes = await seedPacientes();
    const categoriasExamenes = await seedCategoriasExamenes();
    await seedExamenes(categoriasExamenes);
    await seedHospitalizacion();
    // await seedFarmacia(); // Omitido por complejidad del schema
    
    console.log('\n✅ ¡Seeders completados exitosamente!');
    console.log('\n📋 Credenciales de acceso:');
    console.log('   Admin: admin@clinicamia.com / admin123');
    console.log('   Doctor: doctor@clinicamia.com / doctor123');
    console.log('   Enfermera: enfermera@clinicamia.com / enfermera123');
    
  } catch (error) {
    console.error('❌ Error en seeders:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
