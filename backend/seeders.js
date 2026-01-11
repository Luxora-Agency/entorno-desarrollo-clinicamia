/**
 * Script de Seeders para poblar la base de datos con datos de prueba
 * Ejecutar con: node seeders.js
 */
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const crypto = require("crypto");
const prisma = new PrismaClient();
const calidadSeeders = require('./seeders/calidadSeeders');

async function clearDatabase() {
  console.log('🗑️  Limpiando datos existentes...');

  // Eliminar tablas de Calidad IPS primero (respetando relaciones)
  try {
    await prisma.evidenciaCalidad.deleteMany();
    await prisma.seguimientoPlanAccion.deleteMany();
    await prisma.planAccionCalidad.deleteMany();
    await prisma.socializacionDocumento.deleteMany();
    await prisma.historialVersionDocumento.deleteMany();
    await prisma.documentoCalidad.deleteMany();
    await prisma.compromisoComite.deleteMany();
    await prisma.reunionComite.deleteMany();
    await prisma.integranteComite.deleteMany();
    await prisma.comiteInstitucional.deleteMany();
    await prisma.seguimientoPQRS.deleteMany();
    await prisma.pQRS.deleteMany();
    await prisma.medicionSIC.deleteMany();
    await prisma.indicadorSIC.deleteMany();
    await prisma.adherenciaPracticaSegura.deleteMany();
    await prisma.practicaSegura.deleteMany();
    await prisma.rondaSeguridad.deleteMany();
    await prisma.factorContributivo.deleteMany();
    await prisma.analisisCausaRaiz.deleteMany();
    await prisma.eventoAdverso.deleteMany();
    await prisma.hallazgoAuditoria.deleteMany();
    await prisma.auditoriaPAMEC.deleteMany();
    await prisma.medicionIndicador.deleteMany();
    await prisma.indicadorPAMEC.deleteMany();
    await prisma.procesoPAMEC.deleteMany();
    await prisma.equipoPAMEC.deleteMany();
    await prisma.visitaVerificacion.deleteMany();
    await prisma.evaluacionCriterio.deleteMany();
    await prisma.autoevaluacionHabilitacion.deleteMany();
    await prisma.criterioHabilitacion.deleteMany();
    await prisma.estandarHabilitacion.deleteMany();
    await prisma.evaluacionAcreditacion.deleteMany();
    await prisma.estandarAcreditacion.deleteMany();
    await prisma.notificacionSIVIGILA.deleteMany();
    await prisma.reporteFarmacovigilancia.deleteMany();
    await prisma.reporteTecnovigilancia.deleteMany();
  } catch (e) {
    // Algunas tablas pueden no existir aún
    console.log('⚠️  Algunas tablas de calidad no existen aún');
  }

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
  await prisma.rolePermiso.deleteMany();

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
    const user = await prisma.usuario.upsert({
      where: { email: usuario.email },
      update: usuario,
      create: usuario,
    });
    created.push(user);
  }
  
  console.log(`✅ ${created.length} usuarios procesados`);
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
    const departamento = await prisma.departamento.upsert({
      where: { nombre: dept.nombre },
      update: dept,
      create: dept,
    });
    created.push(departamento);
  }
  
  console.log(`✅ ${created.length} departamentos procesados`);
  return created;
}

async function seedEspecialidades(departamentos) {
  console.log('⚕️  Creando especialidades...');
  
  const especialidades = [
    {
      titulo: 'Medicina General',
      descripcion: 'Consulta médica general',
      departamentoNombre: 'Medicina General',
      duracionMinutos: 30,
      costoCOP: 50000,
    },
    {
      titulo: 'Pediatría General',
      descripcion: 'Consulta pediátrica',
      departamentoNombre: 'Pediatría',
      duracionMinutos: 40,
      costoCOP: 60000,
    },
    {
      titulo: 'Ginecología',
      descripcion: 'Consulta ginecológica',
      departamentoNombre: 'Ginecología',
      duracionMinutos: 45,
      costoCOP: 70000,
    },
  ];

  const created = [];
  for (const esp of especialidades) {
    const dept = departamentos.find(d => d.nombre === esp.departamentoNombre);
    if (!dept) continue;

    // Check if exists
    const existing = await prisma.especialidad.findFirst({
      where: { titulo: esp.titulo, departamentoId: dept.id }
    });

    let especialidad;
    const data = {
      titulo: esp.titulo,
      descripcion: esp.descripcion,
      departamentoId: dept.id,
      duracionMinutos: esp.duracionMinutos,
      costoCOP: esp.costoCOP,
    };

    if (existing) {
      especialidad = await prisma.especialidad.update({
        where: { id: existing.id },
        data
      });
    } else {
      especialidad = await prisma.especialidad.create({ data });
    }
    created.push(especialidad);
  }
  
  console.log(`✅ ${created.length} especialidades procesadas`);
  return created;
}

async function seedDoctores(especialidades, usuarios) {
  console.log('👨‍⚕️ Creando doctores...');
  
  // Obtener los 2 usuarios doctores
  const doctorUsuarios = usuarios.filter(u => u.rol === 'Doctor');
  
  const doctoresCreados = [];
  
  // Doctor 1 - Medicina General
  if (doctorUsuarios[0]) {
    const doctor1 = await prisma.doctor.upsert({
      where: { usuarioId: doctorUsuarios[0].id },
      update: {
        licenciaMedica: 'RM-12345',
        universidad: 'Universidad Nacional de Colombia',
        aniosExperiencia: 10,
        biografia: 'Médico general con especialización en medicina interna',
      },
      create: {
        usuarioId: doctorUsuarios[0].id,
        licenciaMedica: 'RM-12345',
        universidad: 'Universidad Nacional de Colombia',
        aniosExperiencia: 10,
        biografia: 'Médico general con especialización en medicina interna',
      },
    });

    const esp = especialidades.find(e => e.titulo === 'Medicina General');
    if (esp) {
       await prisma.doctorEspecialidad.upsert({
         where: { doctorId_especialidadId: { doctorId: doctor1.id, especialidadId: esp.id } },
         update: {},
         create: { doctorId: doctor1.id, especialidadId: esp.id }
       });
    }
    doctoresCreados.push(doctor1);
  }
  
  // Doctor 2 - Pediatría
  if (doctorUsuarios[1]) {
    const doctor2 = await prisma.doctor.upsert({
      where: { usuarioId: doctorUsuarios[1].id },
      update: {
        licenciaMedica: 'RM-67890',
        universidad: 'Universidad de los Andes',
        aniosExperiencia: 8,
        biografia: 'Pediatra especializada en atención infantil',
      },
      create: {
        usuarioId: doctorUsuarios[1].id,
        licenciaMedica: 'RM-67890',
        universidad: 'Universidad de los Andes',
        aniosExperiencia: 8,
        biografia: 'Pediatra especializada en atención infantil',
      },
    });
    
    const esp = especialidades.find(e => e.titulo === 'Pediatría General');
    if (esp) {
        await prisma.doctorEspecialidad.upsert({
            where: { doctorId_especialidadId: { doctorId: doctor2.id, especialidadId: esp.id } },
            update: {},
            create: { doctorId: doctor2.id, especialidadId: esp.id }
        });
    }
    doctoresCreados.push(doctor2);
  }
  
  console.log(`✅ ${doctoresCreados.length} doctores procesados`);
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
    const paciente = await prisma.paciente.upsert({
      where: { cedula: pac.cedula },
      update: pac,
      create: pac,
    });
    created.push(paciente);
  }
  
  console.log(`✅ ${created.length} pacientes procesados`);
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
    const existing = await prisma.categoriaExamen.findFirst({ where: { nombre: cat.nombre } });
    if (existing) {
        created.push(await prisma.categoriaExamen.update({ where: { id: existing.id }, data: cat }));
    } else {
        created.push(await prisma.categoriaExamen.create({ data: cat }));
    }
  }
  
  console.log(`✅ ${created.length} categorías de exámenes procesadas`);
  return created;
}

async function seedExamenes(categorias) {
  console.log('🧪 Creando exámenes y procedimientos...');
  
  const examenes = [
    {
      tipo: 'Examen',
      nombre: 'Hemograma Completo',
      descripcion: 'Análisis completo de células sanguíneas',
      categoriaNombre: 'Laboratorio Clínico',
      duracionMinutos: 15,
      costoBase: 25000,
      preparacionEspecial: 'Ayuno de 8 horas',
    },
    {
      tipo: 'Examen',
      nombre: 'Radiografía de Tórax',
      descripcion: 'Imagen radiológica del tórax',
      categoriaNombre: 'Imagenología',
      duracionMinutos: 20,
      costoBase: 45000,
    },
    {
      tipo: 'Procedimiento',
      nombre: 'Electrocardiograma',
      descripcion: 'Registro de la actividad eléctrica del corazón',
      categoriaNombre: 'Cardiología',
      duracionMinutos: 30,
      costoBase: 35000,
    },
  ];

  const created = [];
  for (const exam of examenes) {
    const cat = categorias.find(c => c.nombre === exam.categoriaNombre);
    if (!cat) continue;
    
    const data = {
        tipo: exam.tipo,
        nombre: exam.nombre,
        descripcion: exam.descripcion,
        categoriaId: cat.id,
        duracionMinutos: exam.duracionMinutos,
        costoBase: exam.costoBase,
        preparacionEspecial: exam.preparacionEspecial
    };

    // Use findFirst by name since codigoCUPS is optional and not provided here
    const existing = await prisma.examenProcedimiento.findFirst({ where: { nombre: exam.nombre } });
    
    if (existing) {
        created.push(await prisma.examenProcedimiento.update({ where: { id: existing.id }, data }));
    } else {
        created.push(await prisma.examenProcedimiento.create({ data }));
    }
  }
  
  console.log(`✅ ${created.length} exámenes procesados`);
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
    const existing = await prisma.categoriaProducto.findFirst({ where: { nombre: cat.nombre } });
    if (existing) {
        categoriasCreadas.push(await prisma.categoriaProducto.update({ where: { id: existing.id }, data: cat }));
    } else {
        categoriasCreadas.push(await prisma.categoriaProducto.create({ data: cat }));
    }
  }
  
  console.log(`✅ ${categorias.length} categorías de productos procesadas`);

  // Etiquetas
  const etiquetas = [
    { nombre: 'Controlado', color: '#dc2626' },
    { nombre: 'Refrigerar', color: '#2563eb' },
    { nombre: 'Genérico', color: '#059669' },
    { nombre: 'Alto Riesgo', color: '#f59e0b' },
  ];

  const etiquetasCreadas = [];
  for (const etiq of etiquetas) {
    const existing = await prisma.etiquetaProducto.findFirst({ where: { nombre: etiq.nombre } });
    if (existing) {
        etiquetasCreadas.push(await prisma.etiquetaProducto.update({ where: { id: existing.id }, data: etiq }));
    } else {
        etiquetasCreadas.push(await prisma.etiquetaProducto.create({ data: etiq }));
    }
  }
  
  console.log(`✅ ${etiquetas.length} etiquetas procesadas`);

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
      categoriaNombre: 'Analgésicos',
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
      categoriaNombre: 'Antibióticos',
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
      categoriaNombre: 'Antihipertensivos',
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
      categoriaNombre: 'Antidiabéticos',
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
      categoriaNombre: 'Analgésicos',
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
      categoriaNombre: 'Analgésicos',
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
      categoriaNombre: 'Antidiabéticos',
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
      categoriaNombre: 'Analgésicos',
      requiereReceta: true,
    },
  ];

  const productosCreados = [];
  for (const prod of productos) {
    const cat = categoriasCreadas.find(c => c.nombre === prod.categoriaNombre);
    if (!cat) continue;

    const { categoriaNombre, ...data } = prod;
    data.categoriaId = cat.id;

    const producto = await prisma.producto.upsert({
        where: { sku: prod.sku },
        update: data,
        create: data
    });
    productosCreados.push(producto);
  }
  
  console.log(`✅ ${productos.length} productos procesados`);

  return { categorias: categoriasCreadas, etiquetas: etiquetasCreadas, productos: productosCreados };
}

async function seedCitas(pacientes, doctores, especialidades, usuarios) {
  console.log('📅 Creando citas...');
  
  const doctorUsuarios = usuarios.filter(u => u.rol === 'Doctor');
  if (doctorUsuarios.length === 0) return [];

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
      estado: 'Programada',
      notas: 'Paciente llegó temprano',
      costo: 50000,
    },
    {
      pacienteId: pacientes[1].id,
      doctorId: doctorUsuarios[0].id,
      especialidadId: especialidades[0].id,
      fecha: new Date(hoy),
      hora: new Date('1970-01-01T09:00:00Z'),
      motivo: 'Dolor de cabeza recurrente',
      estado: 'Programada',
      costo: 50000,
    },
    {
      pacienteId: pacientes[2].id,
      doctorId: doctorUsuarios[0].id,
      especialidadId: especialidades[0].id,
      fecha: new Date(hoy),
      hora: new Date('1970-01-01T10:00:00Z'),
      motivo: 'Control de hipertensión',
      estado: 'Programada',
      notas: 'Consulta en progreso',
      costo: 50000,
    },
    {
      pacienteId: pacientes[0].id,
      doctorId: doctorUsuarios[1] ? doctorUsuarios[1].id : doctorUsuarios[0].id,
      especialidadId: especialidades[1].id,
      fecha: new Date(hoy),
      hora: new Date('1970-01-01T11:00:00Z'),
      motivo: 'Consulta pediátrica - fiebre',
      estado: 'Programada',
      costo: 60000,
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
      costo: 50000,
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
      costo: 70000,
    },
    {
      pacienteId: pacientes[1].id,
      doctorId: doctorUsuarios[1] ? doctorUsuarios[1].id : doctorUsuarios[0].id,
      especialidadId: especialidades[1].id,
      fecha: new Date(manana),
      hora: new Date('1970-01-01T15:00:00Z'),
      motivo: 'Control de crecimiento',
      estado: 'Programada',
      costo: 60000,
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
      costo: 50000,
    },
  ];

  const created = [];
  let facturaCounter = 1;
  
  for (const cita of citas) {
    // Basic deduplication based on patient, doctor, and approximate time
    const existing = await prisma.cita.findFirst({
        where: {
            pacienteId: cita.pacienteId,
            doctorId: cita.doctorId,
            motivo: cita.motivo
        }
    });

    if (existing) {
        created.push(existing);
        continue;
    }

    const citaCreada = await prisma.cita.create({ data: cita });
    created.push(citaCreada);
    
    // Crear factura para citas completadas o atendiendo
    if (cita.estado === 'Completada' || cita.estado === 'Atendiendo' || cita.estado === 'Programada') {
      const numeroFactura = `F-2025-${String(facturaCounter).padStart(5, '0')}-${crypto.randomBytes(2).toString('hex')}`;
      facturaCounter++;
      
      const factura = await prisma.factura.create({
        data: {
          numero: numeroFactura,
          pacienteId: cita.pacienteId,
          estado: cita.estado === 'Completada' ? 'Pagada' : 'Pendiente',
          subtotal: cita.costo,
          descuentos: 0,
          // impuestos: cita.costo * 0.19, // 19% IVA
          total: cita.costo,
          saldoPendiente: cita.estado === 'Completada' ? 0 : cita.costo,
          cubiertoPorEPS: false,
          creadaPor: doctorUsuarios[0].id,
          items: {
            create: [
              {
                tipo: 'Consulta',
                descripcion: `Consulta ${cita.motivo}`,
                cantidad: 1,
                precioUnitario: cita.costo,
                descuento: 0,
                subtotal: cita.costo,
                citaId: citaCreada.id,
              }
            ]
          },
          pagos: cita.estado === 'Completada' ? {
            create: [
              {
                monto: cita.costo,
                metodoPago: 'Efectivo',
                referencia: `PAG-${numeroFactura}`,
                registradoPor: doctorUsuarios[0].id,
              }
            ]
          } : undefined
        }
      });
    }
  }
  
  console.log(`✅ ${created.length} citas procesadas`);
  return created;
}

async function seedHospitalizacion() {
  console.log('🏥 Seeding hospitalización...');

  // Crear unidades
  const unidades = [
    {
      nombre: 'UCI',
      descripcion: 'Unidad de Cuidados Intensivos',
      tipo: 'UCI',
      capacidad: 20,
      activo: true,
    },
    {
      nombre: 'Hospitalización General',
      descripcion: 'Área de hospitalización general',
      tipo: 'Hospitalización',
      capacidad: 50,
      activo: true,
    },
    {
      nombre: 'Observación',
      descripcion: 'Sala de observación y emergencias',
      tipo: 'Observación',
      capacidad: 15,
      activo: true,
    },
  ];

  const unidadesCreadas = [];
  for (const unidad of unidades) {
    const created = await prisma.unidad.upsert({
        where: { nombre: unidad.nombre },
        update: unidad,
        create: unidad
    });
    unidadesCreadas.push(created);
  }
  console.log(`✅ ${unidadesCreadas.length} unidades procesadas`);

  // Crear habitaciones
  const habitacionesCreadas = [];
  for (let index = 0; index < unidadesCreadas.length; index++) {
    const unidad = unidadesCreadas[index];
    // 3 habitaciones por unidad
    for (let i = 1; i <= 3; i++) {
      const numero = `${(index + 1) * 100 + i}`;
      const habitacionData = {
        numero: numero,
        unidadId: unidad.id,
        piso: index + 1,
        capacidadCamas: 2,
        activo: true,
      };

      const created = await prisma.habitacion.upsert({
        where: { numero_unidadId: { numero: numero, unidadId: unidad.id } },
        update: habitacionData,
        create: habitacionData
      });
      habitacionesCreadas.push(created);
    }
  }
  console.log(`✅ ${habitacionesCreadas.length} habitaciones procesadas`);

  // Crear camas
  const camasCreadas = [];
  for (const habitacion of habitacionesCreadas) {
    // 2 camas por habitación
    for (let i = 1; i <= 2; i++) {
      const numero = `${habitacion.numero}-${String.fromCharCode(64 + i)}`; // 101-A, 101-B
      const camaData = {
        numero: numero,
        habitacionId: habitacion.id,
        estado: 'Disponible',
        observaciones: null,
      };

      const created = await prisma.cama.upsert({
        where: { numero_habitacionId: { numero: numero, habitacionId: habitacion.id } },
        update: camaData,
        create: camaData
      });
      camasCreadas.push(created);
    }
  }
  console.log(`✅ ${camasCreadas.length} camas procesadas`);

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
    // Assuming name is unique enough for seeding logic, though not unique in DB
    const existing = await prisma.paqueteHospitalizacion.findFirst({ where: { nombre: paquete.nombre } });
    if (existing) {
        paquetesCreados.push(await prisma.paqueteHospitalizacion.update({ where: { id: existing.id }, data: paquete }));
    } else {
        paquetesCreados.push(await prisma.paqueteHospitalizacion.create({ data: paquete }));
    }
  }

  console.log(`✅ ${paquetesCreados.length} paquetes de hospitalización procesados`);
  return paquetesCreados;
}

async function seedPermisos() {
  console.log('🔐 Creando permisos por rol...');
  
  const permisos = [
    // SUPERADMIN - Acceso total a todos los módulos
    { rol: 'superadmin', modulo: 'dashboard' },
    { rol: 'superadmin', modulo: 'admisiones' },
    { rol: 'superadmin', modulo: 'pacientes' },
    { rol: 'superadmin', modulo: 'citas' },
    { rol: 'superadmin', modulo: 'hce' },
    { rol: 'superadmin', modulo: 'enfermeria' },
    { rol: 'superadmin', modulo: 'farmacia' },
    { rol: 'superadmin', modulo: 'laboratorio' },
    { rol: 'superadmin', modulo: 'imagenologia' },
    { rol: 'superadmin', modulo: 'urgencias' },
    { rol: 'superadmin', modulo: 'hospitalizacion' },
    { rol: 'superadmin', modulo: 'facturacion' },
    { rol: 'superadmin', modulo: 'quirofano' },
    { rol: 'superadmin', modulo: 'reportes' },
    { rol: 'superadmin', modulo: 'doctores' },
    { rol: 'superadmin', modulo: 'especialidades' },
    { rol: 'superadmin', modulo: 'departamentos' },
    { rol: 'superadmin', modulo: 'examenes' },
    { rol: 'superadmin', modulo: 'categorias-examenes' },
    { rol: 'superadmin', modulo: 'categorias-productos' },
    { rol: 'superadmin', modulo: 'etiquetas-productos' },
    { rol: 'superadmin', modulo: 'unidades' },
    { rol: 'superadmin', modulo: 'habitaciones' },
    { rol: 'superadmin', modulo: 'camas' },
    { rol: 'superadmin', modulo: 'planes-miapass' },
    { rol: 'superadmin', modulo: 'suscripciones-miapass' },
    { rol: 'superadmin', modulo: 'suscriptores-miapass' },
    { rol: 'superadmin', modulo: 'cupones-miapass' },
    { rol: 'superadmin', modulo: 'ordenes-medicas' },
    { rol: 'superadmin', modulo: 'tickets-soporte' },
    { rol: 'superadmin', modulo: 'publicaciones' },
    { rol: 'superadmin', modulo: 'usuarios-roles' },
    { rol: 'superadmin', modulo: 'calidad' },
    { rol: 'superadmin', modulo: 'calidad_habilitacion' },
    { rol: 'superadmin', modulo: 'calidad_pamec' },
    { rol: 'superadmin', modulo: 'calidad_seguridad_paciente' },
    { rol: 'superadmin', modulo: 'calidad_indicadores' },
    { rol: 'superadmin', modulo: 'calidad_pqrs' },
    { rol: 'superadmin', modulo: 'calidad_comites' },
    { rol: 'superadmin', modulo: 'calidad_vigilancia' },
    { rol: 'superadmin', modulo: 'calidad_documentos' },
    { rol: 'superadmin', modulo: 'calidad_planes_accion' },
    { rol: 'superadmin', modulo: 'calidad_acreditacion' },

    // ADMIN - Permisos operativos principales
    { rol: 'admin', modulo: 'dashboard' },
    { rol: 'admin', modulo: 'admisiones' },
    { rol: 'admin', modulo: 'pacientes' },
    { rol: 'admin', modulo: 'citas' },
    { rol: 'admin', modulo: 'hce' },
    { rol: 'admin', modulo: 'enfermeria' },
    { rol: 'admin', modulo: 'farmacia' },
    { rol: 'admin', modulo: 'laboratorio' },
    { rol: 'admin', modulo: 'imagenologia' },
    { rol: 'admin', modulo: 'urgencias' },
    { rol: 'admin', modulo: 'hospitalizacion' },
    { rol: 'admin', modulo: 'facturacion' },
    { rol: 'admin', modulo: 'quirofano' },
    { rol: 'admin', modulo: 'reportes' },
    { rol: 'admin', modulo: 'suscripciones-miapass' },
    { rol: 'admin', modulo: 'cupones-miapass' },
    { rol: 'admin', modulo: 'ordenes-medicas' },
    { rol: 'admin', modulo: 'calidad' },
    { rol: 'admin', modulo: 'calidad_habilitacion' },
    { rol: 'admin', modulo: 'calidad_pamec' },
    { rol: 'admin', modulo: 'calidad_seguridad_paciente' },
    { rol: 'admin', modulo: 'calidad_indicadores' },
    { rol: 'admin', modulo: 'calidad_pqrs' },
    { rol: 'admin', modulo: 'calidad_comites' },
    { rol: 'admin', modulo: 'calidad_vigilancia' },
    { rol: 'admin', modulo: 'calidad_documentos' },
    { rol: 'admin', modulo: 'calidad_planes_accion' },
    { rol: 'admin', modulo: 'calidad_acreditacion' },

    // DOCTOR - Permisos médicos
    { rol: 'doctor', modulo: 'dashboard' },
    { rol: 'doctor', modulo: 'pacientes' },
    { rol: 'doctor', modulo: 'hce' },
    { rol: 'doctor', modulo: 'citas' },
    { rol: 'doctor', modulo: 'laboratorio' },
    { rol: 'doctor', modulo: 'imagenologia' },
    { rol: 'doctor', modulo: 'urgencias' },

    // RECEPCIONISTA - Permisos de recepción
    { rol: 'recepcionista', modulo: 'dashboard' },
    { rol: 'recepcionista', modulo: 'admisiones' },
    { rol: 'recepcionista', modulo: 'pacientes' },
    { rol: 'recepcionista', modulo: 'citas' },

    // ENFERMERA - Permisos de enfermería
    { rol: 'enfermera', modulo: 'dashboard' },
    { rol: 'enfermera', modulo: 'pacientes' },
    { rol: 'enfermera', modulo: 'hce' },
    { rol: 'enfermera', modulo: 'hospitalizacion' },
    { rol: 'enfermera', modulo: 'enfermeria' },

    // FARMACEUTICO - Permisos de farmacia
    { rol: 'farmaceutico', modulo: 'dashboard' },
    { rol: 'farmaceutico', modulo: 'farmacia' },
    { rol: 'farmaceutico', modulo: 'pacientes' },
    { rol: 'farmaceutico', modulo: 'ordenes-medicas' },

    // LABORATORISTA - Permisos de laboratorio
    { rol: 'laboratorista', modulo: 'dashboard' },
    { rol: 'laboratorista', modulo: 'laboratorio' },
    { rol: 'laboratorista', modulo: 'pacientes' },

    // PATIENT - Permisos del portal de pacientes
    { rol: 'patient', modulo: 'pacientes' },
  ];

  let createdCount = 0;
  for (const permiso of permisos) {
    await prisma.rolePermiso.upsert({
      where: { rol_modulo: { rol: permiso.rol, modulo: permiso.modulo } },
      update: { acceso: true },
      create: {
        rol: permiso.rol,
        modulo: permiso.modulo,
        acceso: true
      }
    });
    createdCount++;
  }

  console.log(`✅ ${createdCount} permisos procesados`);
  return createdCount;
}

// ==========================================
// SEEDERS DE CALIDAD IPS
// ==========================================
// The functions from calidadSeeders.js are imported from ./seeders/calidadSeeders.js
// But the original file defined local functions. I'll rely on the imported module or redefine them if they were local.
// In the original seeders.js, they were defined inline. 
// I will just use the imported calidadSeeders.main() if available or its exported functions.
// I will assume I can modify calidadSeeders.js to be idempotent as well.

async function seedCalidad(usuarios, pacientes) {
  console.log('\n🏥 ========== SEEDERS MÓDULO DE CALIDAD ==========\n');

  try {
      // Execute the main quality seeder which handles all sub-seeders
      await calidadSeeders.main();
      
      // Execute local specific seeders that depend on users
      await seedCalidadIndicadoresPAMEC(usuarios);

  } catch (error) {
      console.error("Error executing Calidad seeders:", error);
  }

  console.log('\n✅ ¡Seeders de Calidad completados!');
}

async function seedCalidadIndicadoresPAMEC(usuarios) {
  console.log('📈 Creando indicadores PAMEC...');

  const adminUser = usuarios.find(u => u.rol === 'Admin');

  // Crear proceso PAMEC de ejemplo
  // Check if exists
  let proceso = await prisma.procesoPAMEC.findFirst({ where: { nombre: 'Atención de Urgencias' } });
  
  const procesoData = {
      nombre: 'Atención de Urgencias',
      descripcion: 'Proceso de atención de pacientes en el servicio de urgencias',
      areaResponsable: 'Urgencias',
      responsableId: adminUser?.id,
      calidadObservada: 75.00,
      calidadEsperada: 90.00,
      brecha: 15.00,
      prioridad: 1,
      estado: 'Identificado',
  };

  if (proceso) {
      proceso = await prisma.procesoPAMEC.update({ where: { id: proceso.id }, data: procesoData });
  } else {
      proceso = await prisma.procesoPAMEC.create({ data: procesoData });
  }

  // Crear indicadores PAMEC
  const indicadores = [
    { codigo: 'PAMEC-001', nombre: 'Tiempo promedio de espera en triage', objetivo: 'Medir el tiempo desde llegada hasta clasificación', formulaCalculo: 'Suma tiempos triage / Total pacientes', fuenteDatos: 'Sistema de urgencias', frecuenciaMedicion: 'Mensual', metaInstitucional: 15.00, unidadMedida: 'Minutos', tendenciaEsperada: 'Descendente' },
    { codigo: 'PAMEC-002', nombre: 'Proporción de clasificación correcta en triage', objetivo: 'Evaluar la calidad de la clasificación', formulaCalculo: 'Clasificaciones correctas / Total clasificaciones x 100', fuenteDatos: 'Auditoría de historias', frecuenciaMedicion: 'Mensual', metaInstitucional: 95.00, unidadMedida: 'Porcentaje', tendenciaEsperada: 'Ascendente' },
    { codigo: 'PAMEC-003', nombre: 'Satisfacción del usuario en urgencias', objetivo: 'Medir percepción del usuario', formulaCalculo: 'Usuarios satisfechos / Total encuestados x 100', fuenteDatos: 'Encuestas', frecuenciaMedicion: 'Mensual', metaInstitucional: 85.00, unidadMedida: 'Porcentaje', tendenciaEsperada: 'Ascendente' },
  ];

  const created = [];
  for (const ind of indicadores) {
    const indicador = await prisma.indicadorPAMEC.upsert({
        where: { codigo: ind.codigo },
        update: { ...ind, procesoId: proceso.id },
        create: { ...ind, procesoId: proceso.id }
    });
    created.push(indicador);
  }

  console.log(`✅ 1 proceso PAMEC y ${created.length} indicadores PAMEC procesados`);
  return { proceso, indicadores: created };
}

async function main(options = {}) {
  try {
    console.log('🌱 Iniciando seeders...\n');

    if (options.clean) {
        await clearDatabase();
    } else {
        console.log('ℹ️  Saltando limpieza de base de datos (modo append/upsert)');
    }

    const usuarios = await seedUsuarios();
    await seedPermisos();
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

    // Seeders de Calidad IPS
    await seedCalidad(usuarios, pacientes);
    
    console.log('\n✅ ¡Seeders completados exitosamente!');
    console.log('\n📊 RESUMEN:');
    console.log(`   👥 Usuarios: ${usuarios.length}`);
    // console.log(`   👨‍⚕️ Doctores: ${doctores.length}`); // doctores might be undefined if skipped
    console.log(`   🧑‍🤝‍🧑 Pacientes: ${pacientes.length}`);
    console.log(`   🏥 Departamentos: ${departamentos.length}`);
    // console.log(`   ⚕️ Especialidades: ${especialidades.length}`);
    console.log(`   🔐 Sistema de permisos configurado`);
    console.log('\n📋 Credenciales de acceso:');
    console.log('   SuperAdmin: superadmin@clinicamia.com / superadmin123');
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

// Allow running directly
if (require.main === module) {
  // Check for --clean flag
  const clean = process.argv.includes('--clean');
  main({ clean })
    .catch((e) => {
      console.error(e);
      process.exit(1);
    });
}

module.exports = {
    main,
    seedUsuarios,
    seedDepartamentos,
    seedEspecialidades,
    seedDoctores,
    seedPacientes,
    seedCategoriasExamenes,
    seedExamenes,
    seedFarmacia,
    seedCitas,
    seedHospitalizacion,
    seedPaquetesHospitalizacion,
    seedPermisos,
    seedCalidad
};
