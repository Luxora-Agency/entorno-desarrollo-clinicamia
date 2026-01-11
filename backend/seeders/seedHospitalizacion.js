/**
 * Seed de datos de hospitalización para el doctor
 * Crea pacientes hospitalizados asignados al doctor de prueba
 */
const prisma = require('../db/prisma');

const DOCTOR_ID = '55de6641-3126-43ac-87e9-330f807f8d9e';

// Pacientes a hospitalizar
const PACIENTES = [
  { id: '137b813c-6fcf-4010-86d4-87d8369139cb', nombre: 'Karol Dahian Garcia' },
  { id: '15358609-5ab9-47e5-9004-e36a73978cde', nombre: 'Sofía Hernández' },
  { id: '5d463b78-aaa5-4f82-b3a0-043b4d6617bd', nombre: 'Carlos Moreno' },
  { id: '9dc9789a-ed0e-4d12-bad7-b471758fe38a', nombre: 'Pedro García' },
];

async function seedHospitalizacion() {
  console.log('🏥 Iniciando seed de hospitalización...\n');

  try {
    // 1. Obtener unidades y camas disponibles
    const unidades = await prisma.unidad.findMany();
    const camasDisponibles = await prisma.cama.findMany({
      where: { estado: 'Disponible' },
      include: { habitacion: { include: { unidad: true } } },
      take: 10,
    });

    if (unidades.length === 0) {
      throw new Error('No hay unidades disponibles. Ejecute primero el seeder de unidades.');
    }

    if (camasDisponibles.length < 4) {
      console.log('⚠️  Pocas camas disponibles. Se crearán admisiones sin cama asignada.');
    }

    console.log(`📋 Unidades disponibles: ${unidades.length}`);
    console.log(`🛏️  Camas disponibles: ${camasDisponibles.length}\n`);

    // Datos de hospitalización para cada paciente
    const hospitalizacionesData = [
      {
        pacienteId: PACIENTES[0].id,
        motivoIngreso: 'Neumonía adquirida en la comunidad',
        diagnosticoIngreso: 'J18.9 - Neumonía no especificada',
        diasIngresado: 3,
        tipoEvolucion: 'Seguimiento',
        subjetivo: 'Paciente refiere mejoría de la disnea. Tos productiva disminuida. Afebril en las últimas 24 horas.',
        objetivo: 'Signos vitales estables. T: 36.8°C, FC: 78 lpm, FR: 18 rpm, SatO2: 95% ambiente. Murmullo vesicular disminuido en base derecha.',
        analisis: 'Neumonía en resolución. Buena respuesta al tratamiento antibiótico.',
        plan: 'Continuar antibiótico IV por 48h más. Control radiográfico mañana. Si evolución favorable, considerar egreso con antibiótico oral.',
      },
      {
        pacienteId: PACIENTES[1].id,
        motivoIngreso: 'Dolor abdominal agudo - Apendicitis',
        diagnosticoIngreso: 'K35.8 - Apendicitis aguda, otras y las no especificadas',
        diasIngresado: 1,
        tipoEvolucion: 'Postquirurgico',
        subjetivo: 'Paciente postoperada de apendicectomía laparoscópica hace 12 horas. Refiere dolor leve en sitios de incisión. Sin náuseas ni vómitos.',
        objetivo: 'Abdomen blando, heridas quirúrgicas limpias sin signos de infección. Peristalsis presente. Diuresis adecuada.',
        analisis: 'Postoperatorio inmediato sin complicaciones.',
        plan: 'Iniciar tolerancia oral. Analgesia con Acetaminofén. Deambulación temprana. Si tolera dieta, egreso mañana.',
      },
      {
        pacienteId: PACIENTES[2].id,
        motivoIngreso: 'Crisis hipertensiva',
        diagnosticoIngreso: 'I10 - Hipertensión esencial primaria',
        diasIngresado: 2,
        tipoEvolucion: 'Seguimiento',
        subjetivo: 'Paciente refiere cefalea leve ocasional. Sin mareos ni visión borrosa. Ha tolerado bien los medicamentos.',
        objetivo: 'PA: 140/85 mmHg (mejorada), FC: 72 lpm. Examen neurológico sin focalización. Fondo de ojo sin papiledema.',
        analisis: 'Crisis hipertensiva en resolución. Cifras tensionales en descenso progresivo.',
        plan: 'Ajustar medicación antihipertensiva oral. Monitoreo de PA cada 4 horas. Si PA estable <140/90 por 24h, considerar egreso.',
      },
      {
        pacienteId: PACIENTES[3].id,
        motivoIngreso: 'Cetoacidosis diabética',
        diagnosticoIngreso: 'E10.1 - Diabetes mellitus tipo 1 con cetoacidosis',
        diasIngresado: 4,
        tipoEvolucion: 'Seguimiento',
        subjetivo: 'Paciente alerta, orientado. Refiere apetito recuperado. Sin dolor abdominal. Poliuria en disminución.',
        objetivo: 'Glicemia: 180 mg/dL, pH: 7.38, HCO3: 22 mEq/L. Cetonas negativas. Hidratación adecuada.',
        analisis: 'Cetoacidosis diabética resuelta. Glucemia aún elevada pero con tendencia a la baja.',
        plan: 'Transición a insulina subcutánea. Educación sobre manejo de diabetes. Interconsulta con Endocrinología. Egreso probable en 24-48h.',
      },
    ];

    // 2. Crear admisiones y evoluciones
    for (let i = 0; i < hospitalizacionesData.length; i++) {
      const data = hospitalizacionesData[i];
      const paciente = PACIENTES[i];
      const cama = camasDisponibles[i] || null;
      const unidad = cama?.habitacion?.unidad || unidades[0];

      // Calcular fecha de ingreso
      const fechaIngreso = new Date();
      fechaIngreso.setDate(fechaIngreso.getDate() - data.diasIngresado);

      console.log(`🏥 Creando admisión para ${paciente.nombre}...`);

      // Verificar si ya existe una admisión activa para este paciente
      const admisionExistente = await prisma.admision.findFirst({
        where: {
          pacienteId: data.pacienteId,
          estado: 'Activa',
        },
      });

      if (admisionExistente) {
        console.log(`   ⚠️  Ya tiene admisión activa, saltando...`);
        continue;
      }

      // Crear admisión
      const admision = await prisma.admision.create({
        data: {
          pacienteId: data.pacienteId,
          unidadId: unidad.id,
          camaId: cama?.id || null,
          fechaIngreso,
          motivoIngreso: data.motivoIngreso,
          diagnosticoIngreso: data.diagnosticoIngreso,
          estado: 'Activa',
          responsableIngreso: DOCTOR_ID,
          observaciones: `Paciente ingresado por ${data.motivoIngreso.toLowerCase()}. Requiere monitoreo continuo.`,
        },
      });

      // Actualizar estado de la cama
      if (cama) {
        await prisma.cama.update({
          where: { id: cama.id },
          data: { estado: 'Ocupada' },
        });
      }

      // Crear evolución clínica
      await prisma.evolucionClinica.create({
        data: {
          pacienteId: data.pacienteId,
          admisionId: admision.id,
          doctorId: DOCTOR_ID,
          tipoEvolucion: data.tipoEvolucion,
          subjetivo: data.subjetivo,
          objetivo: data.objetivo,
          analisis: data.analisis,
          plan: data.plan,
          turno: 'Mañana',
          areaHospitalizacion: unidad.nombre,
        },
      });

      // Crear signos vitales
      await prisma.signoVital.create({
        data: {
          pacienteId: data.pacienteId,
          admisionId: admision.id,
          registradoPor: DOCTOR_ID,
          temperatura: 36.5 + Math.random() * 1.5,
          presionSistolica: Math.floor(110 + Math.random() * 30),
          presionDiastolica: Math.floor(70 + Math.random() * 15),
          frecuenciaCardiaca: Math.floor(65 + Math.random() * 20),
          frecuenciaRespiratoria: Math.floor(14 + Math.random() * 6),
          saturacionOxigeno: Math.floor(94 + Math.random() * 5),
          turno: 'Mañana',
        },
      });

      // Crear diagnóstico HCE
      await prisma.diagnosticoHCE.create({
        data: {
          pacienteId: data.pacienteId,
          admisionId: admision.id,
          doctorId: DOCTOR_ID,
          codigoCIE11: data.diagnosticoIngreso.split(' - ')[0],
          descripcionCIE11: data.diagnosticoIngreso.split(' - ')[1] || data.diagnosticoIngreso,
          tipoDiagnostico: 'Principal',
          estadoDiagnostico: 'Activo',
        },
      });

      console.log(`   ✅ Admisión creada (Cama: ${cama?.numero || 'Sin asignar'}, Unidad: ${unidad.nombre})`);
    }

    console.log('\n✅ Seed de hospitalización completado!');
    console.log('📊 Datos creados:');
    console.log(`   - 4 Admisiones activas`);
    console.log(`   - 4 Evoluciones clínicas`);
    console.log(`   - 4 Registros de signos vitales`);
    console.log(`   - 4 Diagnósticos HCE`);

  } catch (error) {
    console.error('❌ Error en el seed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

seedHospitalizacion()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
