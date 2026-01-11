/**
 * Servicio de Agenda - Manejo de bloques horarios
 */
const { PrismaClient } = require('@prisma/client');
const { NotFoundError, ValidationError } = require('../utils/errors');

const prisma = new PrismaClient();

/**
 * Generar bloques horarios para un doctor en una fecha específica
 * @param {string} doctorId - ID del registro doctor (tabla doctores)
 * @param {string} fecha - Fecha en formato YYYY-MM-DD
 * @returns {Array} Lista de bloques con estado (ocupado/disponible)
 */
async function generarBloques(doctorId, fecha) {
  console.log(`[DEBUG] Generando bloques para Doctor: ${doctorId}, Fecha: ${fecha}`);

  // 1. Obtener doctor con sus horarios y especialidades
  const doctor = await prisma.doctor.findUnique({
    where: { id: doctorId },
    include: {
      usuario: {
        select: { id: true, nombre: true, apellido: true }
      },
      especialidades: {
        include: {
          especialidad: {
            select: { titulo: true, duracionMinutos: true }
          }
        }
      }
    }
  });

  if (!doctor) {
    console.warn(`[DEBUG] Doctor no encontrado: ${doctorId}`);
    throw new NotFoundError('Doctor no encontrado');
  }

  // 2. Obtener duración de bloque (de la primera especialidad)
  const duracionBloque = doctor.especialidades[0]?.especialidad?.duracionMinutos || 30;

  // 3. Obtener horarios del doctor para esa fecha
  const horarios = doctor.horarios || {};
  
  // Calcular día de la semana (0-6) para buscar horario recurrente
  // Nota: getDay() devuelve 0 para Domingo, 1 Lunes...
  // Importante: Usar Date sin UTC para obtener el día local esperado
  // FIX: Ajustar la fecha para que getDay() sea consistente con la fecha local (YYYY-MM-DD)
  // Al crear Date('YYYY-MM-DD') se asume UTC, lo que puede devolver el día anterior dependiendo de la TZ
  // Usamos una conversión explícita
  const [year, month, day] = fecha.split('-').map(Number);
  const fechaObj = new Date(year, month - 1, day); // Mes es 0-indexado
  const diaSemana = fechaObj.getDay().toString();
  
  console.log(`[DEBUG] Buscando horarios - Fecha: ${fecha}, Día Semana: ${diaSemana} (Objeto Fecha: ${fechaObj.toISOString()})`);
  console.log(`[DEBUG] Horarios raw:`, JSON.stringify(horarios));

  // Prioridad: Fecha específica > Día de la semana recurrente
  let horariosFecha = horarios[fecha];

  if (!horariosFecha) {
    horariosFecha = horarios[diaSemana];
  }

  if (!horariosFecha || horariosFecha.length === 0) {
    console.log(`[DEBUG] No se encontraron horarios configurados para la fecha ${fecha} (Día ${diaSemana})`);
    return {
      doctor: {
        id: doctor.id,
        usuarioId: doctor.usuario.id,
        nombre: `${doctor.usuario.nombre} ${doctor.usuario.apellido}`,
        especialidades: doctor.especialidades.map(e => e.especialidad.titulo)
      },
      fecha,
      bloques: [],
      mensaje: 'El doctor no tiene horario configurado para esta fecha'
    };
  }

  console.log(`[DEBUG] Horarios a usar:`, JSON.stringify(horariosFecha));

  // 4. Obtener citas existentes del doctor en esa fecha
  // IMPORTANTE: doctorId en citas apunta a usuario.id, no a doctor.id
  const citasExistentes = await prisma.cita.findMany({
    where: {
      doctorId: doctor.usuarioId, // Usar usuarioId del doctor
      fecha: new Date(fecha),
      estado: { notIn: ['Cancelada', 'NoAsistio'] }
    },
    include: {
      paciente: {
        select: { nombre: true, apellido: true, cedula: true }
      },
      especialidad: {
        select: { titulo: true }
      },
      examenProcedimiento: {
        select: { nombre: true, tipo: true }
      }
    },
    orderBy: { hora: 'asc' }
  });

  console.log(`[DEBUG] Citas existentes: ${citasExistentes.length}`);

  // 5. Generar bloques
  const bloques = [];

  horariosFecha.forEach(rango => {
    // Soporte para inicio/fin (nuevo) y start/end (legacy)
    const inicioStr = rango.inicio || rango.start;
    const finStr = rango.fin || rango.end;

    if (!inicioStr || !finStr) {
      console.warn(`[DEBUG] Rango inválido encontrado:`, rango);
      return;
    }

    const [horaInicioH, horaInicioM] = inicioStr.split(':').map(Number);
    const [horaFinH, horaFinM] = finStr.split(':').map(Number);

    let minutosActuales = horaInicioH * 60 + horaInicioM;
    const minutosFin = horaFinH * 60 + horaFinM;

    while (minutosActuales < minutosFin) {
      const horas = Math.floor(minutosActuales / 60);
      const minutos = minutosActuales % 60;
      const horaInicio = `${String(horas).padStart(2, '0')}:${String(minutos).padStart(2, '0')}`;

      // Buscar si hay una cita en este bloque
      const citaEnBloque = citasExistentes.find(cita => {
        const horaCita = new Date(cita.hora);
        const horaCitaStr = `${String(horaCita.getHours()).padStart(2, '0')}:${String(horaCita.getMinutes()).padStart(2, '0')}`;
        return horaCitaStr === horaInicio;
      });

      if (citaEnBloque) {
        // Bloque ocupado
        bloques.push({
          hora: horaInicio,
          duracion: citaEnBloque.duracionMinutos,
          estado: 'ocupado',
          cita: {
            id: citaEnBloque.id,
            paciente: `${citaEnBloque.paciente.nombre} ${citaEnBloque.paciente.apellido}`,
            cedula: citaEnBloque.paciente.cedula,
            tipo: citaEnBloque.tipoCita,
            servicio: citaEnBloque.especialidad?.titulo || citaEnBloque.examenProcedimiento?.nombre || 'N/A',
            motivo: citaEnBloque.motivo,
            estadoCita: citaEnBloque.estado,
            costo: citaEnBloque.costo
          }
        });
        minutosActuales += citaEnBloque.duracionMinutos;
      } else {
        // Bloque disponible
        bloques.push({
          hora: horaInicio,
          duracion: duracionBloque,
          estado: 'disponible'
        });
        minutosActuales += duracionBloque;
      }
    }
  });

  return {
    doctor: {
      id: doctor.id,
      usuarioId: doctor.usuario.id,
      nombre: `${doctor.usuario.nombre} ${doctor.usuario.apellido}`,
      especialidades: doctor.especialidades.map(e => e.especialidad.titulo)
    },
    fecha,
    duracionBloque,
    bloques
  };
}

/**
 * Obtener citas del día con filtros
 * @param {string} fecha - Fecha en formato YYYY-MM-DD
 * @param {string} doctorId - ID del registro doctor (tabla doctores), opcional
 */
async function obtenerCitasPorFiltros(fecha, doctorId = null) {
  // Crear fecha sin conversión de timezone
  const fechaSimple = new Date(fecha + 'T00:00:00.000Z');
  
  const where = {
    fecha: fechaSimple,
    estado: { notIn: ['Cancelada'] }
  };

  // Si se proporciona doctorId, primero obtener el usuarioId
  if (doctorId) {
    const doctor = await prisma.doctor.findUnique({
      where: { id: doctorId },
      select: { usuarioId: true }
    });
    
    if (doctor) {
      where.doctorId = doctor.usuarioId; // Filtrar por usuarioId
    }
  }

  const citas = await prisma.cita.findMany({
    where,
    include: {
      paciente: {
        select: { id: true, nombre: true, apellido: true, cedula: true, telefono: true }
      },
      doctor: {
        select: { id: true, nombre: true, apellido: true }
      },
      especialidad: {
        select: { titulo: true, duracionMinutos: true, costoCOP: true }
      },
      examenProcedimiento: {
        select: { nombre: true, tipo: true, duracionMinutos: true, costoBase: true }
      }
    },
    orderBy: { hora: 'asc' }
  });

  return citas.map(cita => ({
    ...cita,
    doctorNombre: cita.doctor ? `${cita.doctor.nombre} ${cita.doctor.apellido}` : 'Sin asignar'
  }));
}

/**
 * Obtener lista de doctores activos
 */
async function obtenerDoctoresActivos() {
  const doctores = await prisma.doctor.findMany({
    include: {
      usuario: {
        select: { id: true, nombre: true, apellido: true, email: true, activo: true }
      },
      especialidades: {
        include: {
          especialidad: {
            select: { titulo: true, duracionMinutos: true }
          }
        }
      }
    }
  });

  return doctores
    .filter(d => d.usuario && d.usuario.activo) // Solo doctores con usuario activo
    .map(d => ({
      id: d.id,
      usuarioId: d.usuario.id,
      nombre: `${d.usuario.nombre} ${d.usuario.apellido}`,
      email: d.usuario.email,
      especialidades: d.especialidades.map(e => e.especialidad.titulo).join(', '),
      duracionPromedio: d.especialidades[0]?.especialidad?.duracionMinutos || 30
    }));
}

module.exports = {
  generarBloques,
  obtenerCitasPorFiltros,
  obtenerDoctoresActivos
};
