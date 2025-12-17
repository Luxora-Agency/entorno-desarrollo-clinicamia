/**
 * Servicio de Asignaciones de Enfermería
 */
const prisma = require('../db/prisma');
const { ValidationError, NotFoundError } = require('../utils/errors');

class AsignacionEnfermeriaService {
  /**
   * Crear asignación de enfermera a piso/unidad
   */
  async crear(data) {
    const asignacion = await prisma.asignacionEnfermeria.create({
      data: {
        enfermeraId: data.enfermera_id,
        unidadId: data.unidad_id,
        piso: data.piso ? parseInt(data.piso) : null,
        turno: data.turno,
        activo: true,
      },
      include: {
        enfermera: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            email: true,
          },
        },
        unidad: true,
      },
    });

    return asignacion;
  }

  /**
   * Obtener asignaciones activas de una enfermera
   */
  async obtenerPorEnfermera(enfermeraId) {
    const asignaciones = await prisma.asignacionEnfermeria.findMany({
      where: {
        enfermeraId,
        activo: true,
        fechaFin: null,
      },
      include: {
        unidad: true,
      },
    });

    return asignaciones;
  }

  /**
   * Obtener pacientes asignados a una enfermera (por sus pisos)
   */
  async obtenerPacientesAsignados(enfermeraId) {
    // Obtener asignaciones activas
    const asignaciones = await this.obtenerPorEnfermera(enfermeraId);
    
    if (asignaciones.length === 0) {
      return [];
    }

    // Obtener unidades y pisos asignados
    const unidadesIds = asignaciones.map(a => a.unidadId);
    const pisos = asignaciones.map(a => a.piso).filter(p => p !== null);

    // Obtener pacientes hospitalizados en esas unidades/pisos
    const admisionesActivas = await prisma.admision.findMany({
      where: {
        estado: 'Activa',
        unidadId: { in: unidadesIds },
        ...(pisos.length > 0 && {
          cama: {
            habitacion: {
              piso: { in: pisos },
            },
          },
        }),
      },
      include: {
        paciente: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            cedula: true,
            fechaNacimiento: true,
            genero: true,
          },
        },
        unidad: true,
        cama: {
          include: {
            habitacion: true,
          },
        },
        diagnosticosHCE: {
          where: { tipoDiagnostico: 'Principal', estadoDiagnostico: 'Activo' },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: [
        { unidad: { nombre: 'asc' } },
        { cama: { habitacion: { piso: 'asc' } } },
        { cama: { numero: 'asc' } },
      ],
    });

    return admisionesActivas;
  }

  /**
   * Desactivar asignación
   */
  async desactivar(id) {
    const asignacion = await prisma.asignacionEnfermeria.update({
      where: { id },
      data: {
        activo: false,
        fechaFin: new Date(),
      },
    });

    return asignacion;
  }
}

module.exports = new AsignacionEnfermeriaService();
