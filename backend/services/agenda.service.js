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
    throw new NotFoundError('Doctor no encontrado');
  }

  // 2. Obtener duración de bloque (de la primera especialidad)
  const duracionBloque = doctor.especialidades[0]?.especialidad?.duracionMinutos || 30;

  // 3. Obtener horarios del doctor para esa fecha
  const horarios = doctor.horarios || {};
  const horariosFecha = horarios[fecha];

  if (!horariosFecha || horariosFecha.length === 0) {
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

  // 5. Generar bloques
  const bloques = [];

  horariosFecha.forEach(rango => {
    const [horaInicioH, horaInicioM] = rango.inicio.split(':').map(Number);
    const [horaFinH, horaFinM] = rango.fin.split(':').map(Number);

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
