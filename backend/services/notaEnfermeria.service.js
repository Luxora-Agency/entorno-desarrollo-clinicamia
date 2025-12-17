/**
 * Servicio de Notas de Enfermería
 */
const prisma = require('../db/prisma');
const { ValidationError, NotFoundError } = require('../utils/errors');

class NotaEnfermeriaService {
  /**
   * Crear nota de enfermería
   */
  async crear(data) {
    const nota = await prisma.notaEnfermeria.create({
      data: {
        admisionId: data.admision_id,
        pacienteId: data.paciente_id,
        enfermeraId: data.enfermera_id,
        tipoNota: data.tipo_nota,
        titulo: data.titulo,
        contenido: data.contenido,
        turno: data.turno,
        requiereSeguimiento: data.requiere_seguimiento || false,
        seguimientoPor: data.seguimiento_por,
      },
      include: {
        enfermera: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
          },
        },
        paciente: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
          },
        },
      },
    });

    return nota;
  }

  /**
   * Obtener notas de una admisión
   */
  async obtenerPorAdmision(admisionId, limit = 50) {
    const notas = await prisma.notaEnfermeria.findMany({
      where: { admisionId },
      include: {
        enfermera: {
          select: {
            nombre: true,
            apellido: true,
          },
        },
      },
      orderBy: { fechaHora: 'desc' },
      take: parseInt(limit),
    });

    return notas;
  }

  /**
   * Obtener notas de un paciente
   */
  async obtenerPorPaciente(pacienteId, limit = 50) {
    const notas = await prisma.notaEnfermeria.findMany({
      where: { pacienteId },
      include: {
        enfermera: {
          select: {
            nombre: true,
            apellido: true,
          },
        },
        admision: {
          select: {
            id: true,
            fechaIngreso: true,
            unidad: {
              select: {
                nombre: true,
              },
            },
          },
        },
      },
      orderBy: { fechaHora: 'desc' },
      take: parseInt(limit),
    });

    return notas;
  }

  /**
   * Obtener notas de una enfermera (para su turno)
   */
  async obtenerPorEnfermera(enfermeraId, fecha, turno) {
    const fechaInicio = new Date(fecha || new Date());
    fechaInicio.setHours(0, 0, 0, 0);
    const fechaFin = new Date(fechaInicio);
    fechaFin.setHours(23, 59, 59, 999);

    const where = {
      enfermeraId,
      fechaHora: {
        gte: fechaInicio,
        lte: fechaFin,
      },
    };

    if (turno) {
      where.turno = turno;
    }

    const notas = await prisma.notaEnfermeria.findMany({
      where,
      include: {
        paciente: {
          select: {
            nombre: true,
            apellido: true,
          },
        },
        admision: {
          select: {
            cama: {
              select: {
                numero: true,
                habitacion: {
                  select: {
                    numero: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { fechaHora: 'desc' },
    });

    return notas;
  }
}

module.exports = new NotaEnfermeriaService();
