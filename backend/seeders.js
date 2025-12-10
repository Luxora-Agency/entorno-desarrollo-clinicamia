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
  await prisma.pago.deleteMany();
  await prisma.facturaItem.deleteMany();
  await prisma.factura.deleteMany();
  await prisma.ordenMedicamentoItem.deleteMany();
  await prisma.ordenMedicamento.deleteMany();
  await prisma.ordenMedica.deleteMany();
  await prisma.paqueteHospitalizacion.deleteMany();
  await prisma.movimiento.deleteMany();
  await prisma.admision.deleteMany();
  await prisma.cama.deleteMany();
  await prisma.habitacion.deleteMany();
  await prisma.unidad.deleteMany();
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
      nombre: 'SuperAdmin',
      apellido: 'Master',
      email: 'superadmin@clinicamia.com',
      password: await bcrypt.hash('superadmin123', 10),
      rol: 'SuperAdmin',
      cedula: '1111111111',
      telefono: '3001111111',
      activo: true,
    },
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
      nombre: 'Laura',
      apellido: 'Pérez',
      email: 'doctor2@clinicamia.com',
      password: await bcrypt.hash('doctor123', 10),
      rol: 'Doctor',
      cedula: '9876543210',
      telefono: '3109876543',
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
    {
      nombre: 'Ana',
      apellido: 'Martínez',
      email: 'recepcionista@clinicamia.com',
      password: await bcrypt.hash('recepcion123', 10),
      rol: 'Recepcionista',
      cedula: '5544332211',
      telefono: '3157894561',
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
  
  // Obtener los 2 usuarios doctores
  const doctorUsuarios = usuarios.filter(u => u.rol === 'Doctor');
  
  const doctoresCreados = [];
  
  // Doctor 1 - Medicina General
  const doctor1 = await prisma.doctor.create({
    data: {
      usuarioId: doctorUsuarios[0].id,
      licenciaMedica: 'RM-12345',
      universidad: 'Universidad Nacional de Colombia',
      aniosExperiencia: 10,
      biografia: 'Médico general con especialización en medicina interna',
    },
  });
  
  await prisma.doctorEspecialidad.create({
    data: {
      doctorId: doctor1.id,
      especialidadId: especialidades[0].id,
    },
  });
  
  doctoresCreados.push(doctor1);
  
  // Doctor 2 - Pediatría
  if (doctorUsuarios[1]) {
    const doctor2 = await prisma.doctor.create({
      data: {
        usuarioId: doctorUsuarios[1].id,
        licenciaMedica: 'RM-67890',
        universidad: 'Universidad de los Andes',
        aniosExperiencia: 8,
        biografia: 'Pediatra especializada en atención infantil',
      },
    });
    
    await prisma.doctorEspecialidad.create({
      data: {
        doctorId: doctor2.id,
        especialidadId: especialidades[1].id,
      },
    });
    
    doctoresCreados.push(doctor2);
  }
  
  console.log(`✅ ${doctoresCreados.length} doctores creados con especialidades asignadas`);
  return doctoresCreados;
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
    { nombre: 'Antihipertensivos', descripcion: 'Control de presión arterial', color: '#f59e0b' },
    { nombre: 'Antidiabéticos', descripcion: 'Control de diabetes', color: '#8b5cf6' },
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
    { nombre: 'Alto Riesgo', color: '#f59e0b' },
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
      nombre: 'Paracetamol 500mg',
      principioActivo: 'Paracetamol',
      concentracion: '500mg',
      presentacion: 'Caja x 100 tabletas',
      descripcion: 'Analgésico y antipirético',
      precioVenta: 5000,
      precioCompra: 3000,
      cantidadTotal: 450,
      cantidadConsumida: 0,
      cantidadMinAlerta: 200,
      lote: 'L2025-001',
      fechaVencimiento: new Date('2025-12-31'),
      categoriaId: categoriasCreadas[0].id,
      requiereReceta: false,
    },
    {
      sku: 'MED-002',
      nombre: 'Amoxicilina 500mg',
      principioActivo: 'Amoxicilina',
      concentracion: '500mg',
      presentacion: 'Caja x 21 cápsulas',
      descripcion: 'Antibiótico de amplio espectro',
      precioVenta: 12000,
      precioCompra: 7000,
      cantidadTotal: 85,
      cantidadConsumida: 15,
      cantidadMinAlerta: 100,
      lote: 'L2025-045',
      fechaVencimiento: new Date('2025-08-15'),
      categoriaId: categoriasCreadas[1].id,
      requiereReceta: true,
    },
    {
      sku: 'MED-003',
      nombre: 'Losartán 50mg',
      principioActivo: 'Losartán',
      concentracion: '50mg',
      presentacion: 'Caja x 30 tabletas',
      descripcion: 'Antihipertensivo',
      precioVenta: 8500,
      precioCompra: 5000,
      cantidadTotal: 320,
      cantidadConsumida: 0,
      cantidadMinAlerta: 150,
      lote: 'L2025-078',
      fechaVencimiento: new Date('2026-03-20'),
      categoriaId: categoriasCreadas[2].id,
      requiereReceta: true,
    },
    {
      sku: 'MED-004',
      nombre: 'Insulina Glargina 100 UI/mL',
      principioActivo: 'Insulina Glargina',
      concentracion: '100 UI/mL',
      presentacion: 'Vial 10mL',
      descripcion: 'Insulina de acción prolongada',
      precioVenta: 45000,
      precioCompra: 30000,
      cantidadTotal: 25,
      cantidadConsumida: 5,
      cantidadMinAlerta: 30,
      lote: 'L2025-112',
      fechaVencimiento: new Date('2025-06-30'),
      categoriaId: categoriasCreadas[3].id,
      requiereReceta: true,
      temperaturaAlmacenamiento: '2-8°C',
    },
    {
      sku: 'MED-005',
      nombre: 'Omeprazol 20mg',
      principioActivo: 'Omeprazol',
      concentracion: '20mg',
      presentacion: 'Caja x 28 cápsulas',
      descripcion: 'Inhibidor de la bomba de protones',
      precioVenta: 6500,
      precioCompra: 4000,
      cantidadTotal: 510,
      cantidadConsumida: 0,
      cantidadMinAlerta: 200,
      lote: 'L2025-089',
      fechaVencimiento: new Date('2026-01-15'),
      categoriaId: categoriasCreadas[0].id,
      requiereReceta: false,
    },
    {
      sku: 'MED-006',
      nombre: 'Salbutamol Inhalador 100mcg',
      principioActivo: 'Salbutamol',
      concentracion: '100mcg',
      presentacion: 'Inhalador',
      descripcion: 'Broncodilatador',
      precioVenta: 8500,
      precioCompra: 5500,
      cantidadTotal: 42,
      cantidadConsumida: 8,
      cantidadMinAlerta: 50,
      lote: 'L2025-156',
      fechaVencimiento: new Date('2025-11-30'),
      categoriaId: categoriasCreadas[0].id,
      requiereReceta: true,
    },
    {
      sku: 'MED-007',
      nombre: 'Metformina 850mg',
      principioActivo: 'Metformina',
      concentracion: '850mg',
      presentacion: 'Caja x 60 tabletas',
      descripcion: 'Antidiabético oral',
      precioVenta: 4000,
      precioCompra: 2500,
      cantidadTotal: 680,
      cantidadConsumida: 20,
      cantidadMinAlerta: 250,
      lote: 'L2025-203',
      fechaVencimiento: new Date('2026-04-10'),
      categoriaId: categoriasCreadas[3].id,
      requiereReceta: true,
    },
    {
      sku: 'MED-008',
      nombre: 'Diclofenaco 75mg Ampolla',
      principioActivo: 'Diclofenaco',
      concentracion: '75mg/3mL',
      presentacion: 'Caja x 10 ampollas',
      descripcion: 'Antiinflamatorio inyectable',
      precioVenta: 23000,
      precioCompra: 15000,
      cantidadTotal: 15,
      cantidadConsumida: 35,
      cantidadMinAlerta: 50,
      lote: 'L2025-134',
      fechaVencimiento: new Date('2025-07-20'),
      categoriaId: categoriasCreadas[0].id,
      requiereReceta: true,
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

async function seedCitas(pacientes, doctores, especialidades, usuarios) {
  console.log('📅 Creando citas...');
  
  const doctorUsuarios = usuarios.filter(u => u.rol === 'Doctor');
  const hoy = new Date();
  const manana = new Date();
  manana.setDate(manana.getDate() + 1);
  const ayer = new Date();
  ayer.setDate(ayer.getDate() - 1);
  
  const citas = [
    // Citas para HOY con diferentes estados
    {
      pacienteId: pacientes[0].id,
      doctorId: doctorUsuarios[0].id,
      especialidadId: especialidades[0].id,
      fecha: new Date(hoy),
      hora: new Date('1970-01-01T08:00:00Z'),
      motivo: 'Control médico general',
      estado: 'EnEspera',
      notas: 'Paciente llegó temprano',
    },
    {
      pacienteId: pacientes[1].id,
      doctorId: doctorUsuarios[0].id,
      especialidadId: especialidades[0].id,
      fecha: new Date(hoy),
      hora: new Date('1970-01-01T09:00:00Z'),
      motivo: 'Dolor de cabeza recurrente',
      estado: 'Programada',
    },
    {
      pacienteId: pacientes[2].id,
      doctorId: doctorUsuarios[0].id,
      especialidadId: especialidades[0].id,
      fecha: new Date(hoy),
      hora: new Date('1970-01-01T10:00:00Z'),
      motivo: 'Control de hipertensión',
      estado: 'Atendiendo',
      notas: 'Consulta en progreso',
    },
    {
      pacienteId: pacientes[0].id,
      doctorId: doctorUsuarios[1] ? doctorUsuarios[1].id : doctorUsuarios[0].id,
      especialidadId: especialidades[1].id,
      fecha: new Date(hoy),
      hora: new Date('1970-01-01T11:00:00Z'),
      motivo: 'Consulta pediátrica - fiebre',
      estado: 'Programada',
    },
    {
      pacienteId: pacientes[1].id,
      doctorId: doctorUsuarios[0].id,
      especialidadId: especialidades[0].id,
      fecha: new Date(hoy),
      hora: new Date('1970-01-01T14:00:00Z'),
      motivo: 'Revisión de resultados de laboratorio',
      estado: 'Completada',
      notas: 'Paciente atendido exitosamente',
    },
    // Citas futuras
    {
      pacienteId: pacientes[2].id,
      doctorId: doctorUsuarios[0].id,
      especialidadId: especialidades[0].id,
      fecha: new Date(manana),
      hora: new Date('1970-01-01T10:00:00Z'),
      motivo: 'Control post-operatorio',
      estado: 'Programada',
    },
    {
      pacienteId: pacientes[1].id,
      doctorId: doctorUsuarios[1] ? doctorUsuarios[1].id : doctorUsuarios[0].id,
      especialidadId: especialidades[1].id,
      fecha: new Date(manana),
      hora: new Date('1970-01-01T15:00:00Z'),
      motivo: 'Control de crecimiento',
      estado: 'Programada',
    },
    // Cita de ayer que no asistió
    {
      pacienteId: pacientes[2].id,
      doctorId: doctorUsuarios[0].id,
      especialidadId: especialidades[0].id,
      fecha: new Date(ayer),
      hora: new Date('1970-01-01T09:00:00Z'),
      motivo: 'Control general',
      estado: 'NoAsistio',
      notas: 'Paciente no se presentó a la cita',
    },
  ];

  const created = [];
  for (const cita of citas) {
    const citaCreada = await prisma.cita.create({ data: cita });
    created.push(citaCreada);
  }
  
  console.log(`✅ ${created.length} citas creadas (${citas.filter(c => c.fecha.toDateString() === new Date().toDateString()).length} para hoy)`);
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

async function seedPaquetesHospitalizacion() {
  console.log('💰 Creando paquetes de hospitalización...');
  
  const paquetes = [
    {
      nombre: 'UCI Adultos',
      descripcion: 'Cuidados intensivos para adultos. Incluye: monitoreo 24/7, enfermería especializada, equipos de soporte vital.',
      tipoUnidad: 'UCI',
      precioDia: 2500000, // $2,500,000 COP
      incluye: 'Habitación privada, monitoreo continuo, medicamentos básicos, alimentación, aseo, servicios de enfermería',
      activo: true,
    },
    {
      nombre: 'Observación General',
      descripcion: 'Unidad de observación para pacientes estables. Incluye: vigilancia médica, enfermería.',
      tipoUnidad: 'Observación',
      precioDia: 800000, // $800,000 COP
      incluye: 'Habitación compartida, monitoreo básico, alimentación, aseo, servicios de enfermería',
      activo: true,
    },
    {
      nombre: 'Hospitalización General',
      descripcion: 'Hospitalización estándar. Incluye: habitación, alimentación, cuidados básicos.',
      tipoUnidad: 'Hospitalización General',
      precioDia: 500000, // $500,000 COP
      incluye: 'Habitación compartida o privada, alimentación tres veces al día, aseo, servicios de enfermería',
      activo: true,
    },
    {
      nombre: 'Pediatría',
      descripcion: 'Hospitalización pediátrica especializada. Incluye: cuidados pediátricos especializados.',
      tipoUnidad: 'Pediatría',
      precioDia: 600000, // $600,000 COP
      incluye: 'Habitación con espacio para acompañante, alimentación especial, juegos, servicios de enfermería pediátrica',
      activo: true,
    },
  ];

  const paquetesCreados = [];
  for (const paquete of paquetes) {
    const created = await prisma.paqueteHospitalizacion.create({
      data: paquete,
    });
    paquetesCreados.push(created);
  }

  console.log(`✅ ${paquetesCreados.length} paquetes de hospitalización creados`);
  return paquetesCreados;
}

async function main() {
  try {
    console.log('🌱 Iniciando seeders...\n');
    
    await clearDatabase();
    
    const usuarios = await seedUsuarios();
    const departamentos = await seedDepartamentos();
    const especialidades = await seedEspecialidades(departamentos);
    const doctores = await seedDoctores(especialidades, usuarios);
    const pacientes = await seedPacientes();
    const categoriasExamenes = await seedCategoriasExamenes();
    await seedExamenes(categoriasExamenes);
    await seedFarmacia();
    await seedHospitalizacion();
    await seedPaquetesHospitalizacion();
    await seedCitas(pacientes, doctores, especialidades, usuarios);
    
    console.log('\n✅ ¡Seeders completados exitosamente!');
    console.log('\n📊 RESUMEN:');
    console.log(`   👥 Usuarios: ${usuarios.length}`);
    console.log(`   👨‍⚕️ Doctores: ${doctores.length}`);
    console.log(`   🧑‍🤝‍🧑 Pacientes: ${pacientes.length}`);
    console.log(`   🏥 Departamentos: ${departamentos.length}`);
    console.log(`   ⚕️ Especialidades: ${especialidades.length}`);
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
