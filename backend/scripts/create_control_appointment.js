const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Iniciando creación de cita de control de ejemplo...');

  // 1. Buscar un doctor
  const doctor = await prisma.usuario.findFirst({
    where: {
      rol: 'Doctor',
      activo: true
    }
  });

  if (!doctor) {
    console.error('No se encontró ningún doctor activo en el sistema. Asegúrate de correr los seeders primero.');
    return;
  }

  console.log(`Doctor encontrado: ${doctor.nombre} ${doctor.apellido} (${doctor.email})`);

  // 2. Buscar o crear un paciente
  let paciente = await prisma.paciente.findFirst({
    where: { cedula: '999999999' }
  });

  if (paciente) {
    console.log('Limpiando datos de prueba anteriores...');
    // Eliminar citas y evoluciones anteriores de este paciente para reiniciar prueba
    await prisma.evolucionClinica.deleteMany({ where: { pacienteId: paciente.id } });
    await prisma.cita.deleteMany({ where: { pacienteId: paciente.id } });
    await prisma.paciente.delete({ where: { id: paciente.id } });
    paciente = null;
  }

  console.log('Creando paciente de prueba...');
  paciente = await prisma.paciente.create({
      data: {
        nombre: 'Paciente',
        apellido: 'De Control',
        tipoDocumento: 'CC',
        cedula: '999999999',
        fechaNacimiento: new Date('1990-01-01'),
        genero: 'Masculino',
        telefono: '3001234567',
        email: 'paciente.control@example.com',
           direccion: 'Calle Falsa 123',
           municipio: 'Bogotá',
           departamento: 'Cundinamarca',
           estadoCivil: 'Soltero',
           tipoSangre: 'O+',
           regimen: 'Contributivo',
           eps: 'Sanitas'
      }
    });

  // 3. Crear una cita PASADA completada (Hace 1 mes)
  const fechaPasada = new Date();
  fechaPasada.setMonth(fechaPasada.getMonth() - 1);
  fechaPasada.setHours(10, 0, 0, 0);

  console.log('Creando cita pasada completada...');
  const citaPasada = await prisma.cita.create({
    data: {
      pacienteId: paciente.id,
      doctorId: doctor.id,
      fecha: fechaPasada,
      hora: fechaPasada,
      tipoCita: 'Medicina General',
      estado: 'Completada',
      motivo: 'Dolor de cabeza recurrente',
      duracionMinutos: 30
    }
  });

  // Crear la evolución clínica asociada (Primera Consulta)
  await prisma.evolucionClinica.create({
    data: {
      pacienteId: paciente.id,
      citaId: citaPasada.id,
      doctorId: doctor.id,
      subjetivo: 'Paciente refiere dolor de cabeza de intensidad 7/10...',
      objetivo: 'Paciente alerta, orientado. Signos vitales normales...',
      analisis: 'Cefalea tensional probable...',
      plan: 'Acetaminofén 500mg cada 6 horas...',
      tipoEvolucion: 'Ingreso',
      esPrimeraConsulta: true,
      motivoConsulta: 'Dolor de cabeza',
      enfermedadActual: 'Cuadro de 3 días de evolución...',
      firmada: true,
      fechaFirma: new Date()
    }
  });

  // 4. Crear cita para HOY (Control)
  console.log('Creando cita de control para hoy...');
  const horaCita = new Date(); // Ahora
  
  await prisma.cita.create({
    data: {
      pacienteId: paciente.id,
      doctorId: doctor.id,
      fecha: horaCita,
      hora: horaCita,
      tipoCita: 'Control',
      estado: 'EnEspera', // Para que aparezca en la sala de espera del doctor
      motivo: 'Revisión evolución tratamiento cefalea',
      duracionMinutos: 20
    }
  });
  console.log('Cita de control creada exitosamente.');

  console.log('==========================================');
  console.log('DATOS PARA PRUEBA:');
  console.log(`Doctor Email: ${doctor.email}`);
  console.log(`Doctor Password: (La que hayas configurado, usualmente '123456' o similar en seeds)`);
  console.log(`Paciente: ${paciente.nombre} ${paciente.apellido}`);
  console.log('==========================================');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
