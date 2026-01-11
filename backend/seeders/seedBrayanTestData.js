/**
 * Seed de datos de prueba para el paciente Brayan Cardozo
 * Para probar el módulo de consulta médica
 */
const prisma = require('../db/prisma');

const PACIENTE_ID = '24147f68-8466-472c-9eb2-6bcf21b1fdab';
const DOCTOR_ID = '55de6641-3126-43ac-87e9-330f807f8d9e';

async function seedBrayanTestData() {
  console.log('🌱 Iniciando seed de datos de prueba para Brayan Cardozo...\n');

  try {
    // 1. Agregar Antecedentes Patológicos
    console.log('📋 Creando antecedentes patológicos...');
    await prisma.antecedentePatologico.createMany({
      data: [
        {
          pacienteId: PACIENTE_ID,
          enfermedad: 'Hipertensión Arterial',
          codigoCIE10: 'I10',
          fechaDiagnostico: new Date('2022-06-15'),
          enTratamiento: true,
          observaciones: 'Controlada con medicamento'
        },
        {
          pacienteId: PACIENTE_ID,
          enfermedad: 'Gastritis Crónica',
          codigoCIE10: 'K29.5',
          fechaDiagnostico: new Date('2021-03-20'),
          enTratamiento: true,
          observaciones: 'Toma omeprazol diariamente'
        },
        {
          pacienteId: PACIENTE_ID,
          enfermedad: 'Rinitis Alérgica',
          codigoCIE10: 'J30.4',
          fechaDiagnostico: new Date('2019-08-10'),
          enTratamiento: false,
          observaciones: 'Estacional, principalmente en época de lluvia'
        }
      ],
      skipDuplicates: true
    });

    // 2. Agregar Antecedentes Quirúrgicos
    console.log('🔪 Creando antecedentes quirúrgicos...');
    await prisma.antecedenteQuirurgico.createMany({
      data: [
        {
          pacienteId: PACIENTE_ID,
          procedimiento: 'Apendicectomía',
          fecha: new Date('2018-05-22'),
          hospital: 'Hospital Federico Lleras Acosta',
          complicaciones: 'Ninguna'
        },
        {
          pacienteId: PACIENTE_ID,
          procedimiento: 'Extracción de tercer molar',
          fecha: new Date('2020-11-15'),
          hospital: 'Clínica Dental Ibagué',
          complicaciones: 'Ninguna'
        }
      ],
      skipDuplicates: true
    });

    // 3. Agregar Antecedentes Alérgicos
    console.log('⚠️ Creando antecedentes alérgicos...');
    await prisma.antecedenteAlergico.createMany({
      data: [
        {
          pacienteId: PACIENTE_ID,
          tipoAlergia: 'Medicamento',
          sustancia: 'Penicilina',
          reaccion: 'Urticaria y dificultad respiratoria',
          severidad: 'Severa'
        },
        {
          pacienteId: PACIENTE_ID,
          tipoAlergia: 'Alimento',
          sustancia: 'Mariscos',
          reaccion: 'Hinchazón facial',
          severidad: 'Moderada'
        },
        {
          pacienteId: PACIENTE_ID,
          tipoAlergia: 'Ambiental',
          sustancia: 'Polvo',
          reaccion: 'Estornudos y congestión nasal',
          severidad: 'Leve'
        }
      ],
      skipDuplicates: true
    });

    // 4. Agregar Antecedentes Familiares
    console.log('👨‍👩‍👦 Creando antecedentes familiares...');
    await prisma.antecedenteFamiliar.createMany({
      data: [
        {
          pacienteId: PACIENTE_ID,
          parentesco: 'Padre',
          enfermedad: 'Diabetes Mellitus Tipo 2',
          vive: true
        },
        {
          pacienteId: PACIENTE_ID,
          parentesco: 'Madre',
          enfermedad: 'Hipertensión Arterial',
          vive: true
        },
        {
          pacienteId: PACIENTE_ID,
          parentesco: 'Abuelo Paterno',
          enfermedad: 'Infarto Agudo de Miocardio',
          vive: false
        },
        {
          pacienteId: PACIENTE_ID,
          parentesco: 'Abuela Materna',
          enfermedad: 'Artritis Reumatoide',
          vive: true
        }
      ],
      skipDuplicates: true
    });

    // 5. Agregar Antecedentes Farmacológicos (Medicamentos actuales)
    console.log('💊 Creando antecedentes farmacológicos...');
    await prisma.antecedenteFarmacologico.createMany({
      data: [
        {
          pacienteId: PACIENTE_ID,
          medicamento: 'Losartán',
          dosis: '50 mg',
          frecuencia: 'Cada 24 horas',
          activo: true
        },
        {
          pacienteId: PACIENTE_ID,
          medicamento: 'Omeprazol',
          dosis: '20 mg',
          frecuencia: 'Cada 24 horas en ayunas',
          activo: true
        },
        {
          pacienteId: PACIENTE_ID,
          medicamento: 'Loratadina',
          dosis: '10 mg',
          frecuencia: 'Cuando hay síntomas',
          activo: true
        }
      ],
      skipDuplicates: true
    });

    // 6. Crear historial de Signos Vitales (últimos 12 meses)
    console.log('📊 Creando historial de signos vitales...');
    const signosVitalesData = [];
    const baseDate = new Date();

    for (let i = 0; i < 15; i++) {
      const fecha = new Date(baseDate);
      fecha.setMonth(fecha.getMonth() - i);
      fecha.setDate(Math.floor(Math.random() * 28) + 1);

      // Variaciones realistas
      const pesoBase = 78 + (Math.random() * 4 - 2); // Entre 76-80 kg
      const tallaBase = 175; // 1.75m

      signosVitalesData.push({
        pacienteId: PACIENTE_ID,
        fechaRegistro: fecha,
        temperatura: parseFloat((36.2 + Math.random() * 1.2).toFixed(1)),
        presionSistolica: Math.floor(125 + Math.random() * 20 - 10),
        presionDiastolica: Math.floor(80 + Math.random() * 10 - 5),
        frecuenciaCardiaca: Math.floor(72 + Math.random() * 16 - 8),
        frecuenciaRespiratoria: Math.floor(16 + Math.random() * 4 - 2),
        saturacionOxigeno: Math.floor(96 + Math.random() * 3),
        peso: parseFloat(pesoBase.toFixed(1)),
        talla: tallaBase,
        registradoPor: DOCTOR_ID
      });
    }

    await prisma.signoVital.createMany({
      data: signosVitalesData,
      skipDuplicates: true
    });

    // 7. Crear Consultas/Evoluciones anteriores
    console.log('📝 Creando evoluciones/consultas previas...');
    const evoluciones = [
      {
        pacienteId: PACIENTE_ID,
        doctorId: DOCTOR_ID,
        fechaEvolucion: new Date('2024-11-15'),
        tipoEvolucion: 'Seguimiento',
        subjetivo: 'Paciente refiere sentirse bien, sin cefalea ni mareos. Ha tomado su medicación regularmente. Motivo: Control de Hipertensión Arterial.',
        objetivo: 'PA: 130/82 mmHg, FC: 74 lpm, Peso: 78 kg. Paciente en buen estado general.',
        analisis: 'Hipertensión arterial controlada. Buen apego al tratamiento.',
        plan: 'Continuar con Losartán 50mg cada 24 horas. Control en 3 meses.'
      },
      {
        pacienteId: PACIENTE_ID,
        doctorId: DOCTOR_ID,
        fechaEvolucion: new Date('2024-09-20'),
        tipoEvolucion: 'Seguimiento',
        subjetivo: 'Paciente refiere dolor en epigastrio de 3 días de evolución, acidez y sensación de llenura. Motivo: Dolor abdominal y acidez.',
        objetivo: 'Abdomen blando, depresible, dolor a la palpación en epigastrio, sin signos de irritación peritoneal.',
        analisis: 'Exacerbación de gastritis crónica, probablemente por estrés laboral y dieta inadecuada.',
        plan: 'Aumentar Omeprazol a 40mg por 2 semanas. Dieta blanda. Evitar irritantes.'
      },
      {
        pacienteId: PACIENTE_ID,
        doctorId: DOCTOR_ID,
        fechaEvolucion: new Date('2024-07-10'),
        tipoEvolucion: 'Seguimiento',
        subjetivo: 'Paciente con tos seca, congestión nasal, malestar general de 2 días de evolución. Motivo: Cuadro gripal.',
        objetivo: 'T: 37.8°C, Faringe eritematosa, rinorrea hialina, pulmones claros.',
        analisis: 'Infección respiratoria aguda de origen viral.',
        plan: 'Manejo sintomático: acetaminofén, antihistamínico, abundantes líquidos. Si persiste fiebre >3 días, consultar.'
      },
      {
        pacienteId: PACIENTE_ID,
        doctorId: DOCTOR_ID,
        fechaEvolucion: new Date('2024-05-05'),
        tipoEvolucion: 'Seguimiento',
        subjetivo: 'Paciente asintomático, consulta para chequeo preventivo anual. Motivo: Chequeo general anual.',
        objetivo: 'PA: 128/80 mmHg, FC: 70 lpm, IMC: 25.5. Examen físico sin alteraciones.',
        analisis: 'Paciente con factores de riesgo cardiovascular (HTA, antecedente familiar). IMC en sobrepeso leve.',
        plan: 'Solicitar perfil lipídico, glicemia, creatinina. Fomentar actividad física.'
      },
      {
        pacienteId: PACIENTE_ID,
        doctorId: DOCTOR_ID,
        fechaEvolucion: new Date('2024-02-18'),
        tipoEvolucion: 'Seguimiento',
        subjetivo: 'Paciente refiere dolor en región lumbar de 5 días, aparece después de cargar objetos pesados. Motivo: Dolor lumbar.',
        objetivo: 'Dolor a la palpación de musculatura paravertebral, sin irradiación, Lasègue negativo.',
        analisis: 'Lumbalgia mecánica por sobreesfuerzo.',
        plan: 'AINES por 5 días, relajante muscular, reposo relativo, compresas calientes.'
      }
    ];

    const evolucionesCreadas = [];
    for (const evo of evoluciones) {
      const created = await prisma.evolucionClinica.create({
        data: evo
      });
      evolucionesCreadas.push(created);
    }

    // 8. Crear Citas anteriores
    console.log('📅 Creando citas anteriores...');
    const especialidad = await prisma.especialidad.findFirst({
      where: { titulo: { contains: 'General', mode: 'insensitive' } }
    });

    const citasData = [
      { fecha: new Date('2024-11-15'), motivo: 'Control de Hipertensión', estado: 'Completada' },
      { fecha: new Date('2024-09-20'), motivo: 'Dolor abdominal', estado: 'Completada' },
      { fecha: new Date('2024-07-10'), motivo: 'Cuadro gripal', estado: 'Completada' },
      { fecha: new Date('2024-05-05'), motivo: 'Chequeo anual', estado: 'Completada' },
      { fecha: new Date('2024-02-18'), motivo: 'Dolor lumbar', estado: 'Completada' },
      { fecha: new Date('2023-11-22'), motivo: 'Control HTA', estado: 'Completada' },
      { fecha: new Date('2023-08-14'), motivo: 'Renovación de medicamentos', estado: 'Completada' }
    ];

    for (const cita of citasData) {
      // Crear hora como DateTime (1970-01-01 09:00:00)
      const horaDateTime = new Date('1970-01-01T09:00:00.000Z');

      await prisma.cita.create({
        data: {
          pacienteId: PACIENTE_ID,
          doctorId: DOCTOR_ID,
          especialidadId: especialidad?.id || null,
          fecha: cita.fecha,
          hora: horaDateTime,
          motivo: cita.motivo,
          estado: cita.estado,
          duracionMinutos: 30,
          notas: 'Cita de prueba generada automáticamente'
        }
      });
    }

    // 9. Crear Diagnósticos asociados a las evoluciones
    console.log('🏥 Creando diagnósticos...');

    const diagnosticosData = [
      { evolucionId: evolucionesCreadas[0]?.id, codigoCIE11: 'BA00', descripcionCIE11: 'Hipertensión esencial primaria', tipoDiagnostico: 'Principal', estadoDiagnostico: 'EnControl' },
      { evolucionId: evolucionesCreadas[1]?.id, codigoCIE11: 'DA43.0', descripcionCIE11: 'Gastritis crónica no especificada', tipoDiagnostico: 'Principal', estadoDiagnostico: 'EnControl' },
      { evolucionId: evolucionesCreadas[2]?.id, codigoCIE11: 'CA07', descripcionCIE11: 'Infección aguda de las vías respiratorias superiores', tipoDiagnostico: 'Principal', estadoDiagnostico: 'Resuelto' },
      { evolucionId: evolucionesCreadas[3]?.id, codigoCIE11: 'QA0Z', descripcionCIE11: 'Examen médico general', tipoDiagnostico: 'Principal', estadoDiagnostico: 'Resuelto' },
      { evolucionId: evolucionesCreadas[4]?.id, codigoCIE11: 'ME84.2', descripcionCIE11: 'Lumbago no especificado', tipoDiagnostico: 'Principal', estadoDiagnostico: 'Resuelto' }
    ];

    for (const diag of diagnosticosData) {
      if (diag.evolucionId) {
        await prisma.diagnosticoHCE.create({
          data: {
            pacienteId: PACIENTE_ID,
            doctorId: DOCTOR_ID,
            evolucionId: diag.evolucionId,
            codigoCIE11: diag.codigoCIE11,
            descripcionCIE11: diag.descripcionCIE11,
            tipoDiagnostico: diag.tipoDiagnostico,
            estadoDiagnostico: diag.estadoDiagnostico
          }
        });
      }
    }

    // 10. Actualizar datos básicos del paciente
    console.log('👤 Actualizando datos del paciente...');
    await prisma.paciente.update({
      where: { id: PACIENTE_ID },
      data: {
        peso: 78.5,
        altura: 175,
        tipoSangre: 'O+',
        alergias: 'Penicilina (severa), Mariscos (moderada), Polvo (leve)',
        enfermedadesCronicas: 'Hipertensión arterial, Gastritis crónica',
        medicamentosActuales: 'Losartán 50mg, Omeprazol 20mg, Loratadina PRN',
        ultimaConsulta: new Date('2024-11-15')
      }
    });

    console.log('\n✅ Seed completado exitosamente!');
    console.log('📊 Datos creados:');
    console.log('   - 3 Antecedentes patológicos');
    console.log('   - 2 Antecedentes quirúrgicos');
    console.log('   - 3 Antecedentes alérgicos');
    console.log('   - 4 Antecedentes familiares');
    console.log('   - 3 Medicamentos actuales');
    console.log('   - 15 Registros de signos vitales');
    console.log('   - 5 Evoluciones/Consultas');
    console.log('   - 7 Citas anteriores');
    console.log('   - 5 Diagnósticos');

  } catch (error) {
    console.error('❌ Error en el seed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

seedBrayanTestData()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
