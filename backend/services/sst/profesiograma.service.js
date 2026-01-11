/**
 * Servicio de Profesiogramas
 * Define perfiles de cargo con riesgos y examenes requeridos
 * Normativa: Resolucion 1843/2025
 */

const prisma = require('../../db/prisma');
const { ValidationError, NotFoundError } = require('../../utils/errors');

class ProfesiogramaService {
  /**
   * Listar profesiogramas
   */
  async findAll({ page = 1, limit = 20, vigente }) {
    const skip = (page - 1) * limit;
    const where = {};

    if (vigente !== undefined) where.vigente = vigente;

    const [profesiogramas, total] = await Promise.all([
      prisma.sSTProfesiograma.findMany({
        where,
        skip,
        take: limit,
        orderBy: { cargo: { nombre: 'asc' } },
        include: {
          cargo: {
            select: { id: true, nombre: true },
          },
          _count: {
            select: { examenes: true, riesgos: true },
          },
        },
      }),
      prisma.sSTProfesiograma.count({ where }),
    ]);

    return {
      data: profesiogramas,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Obtener profesiograma por ID
   */
  async findById(id) {
    const profesiograma = await prisma.sSTProfesiograma.findUnique({
      where: { id },
      include: {
        cargo: true,
        examenes: true,
        riesgos: {
          include: {
            factorRiesgo: true,
          },
        },
      },
    });

    if (!profesiograma) {
      throw new NotFoundError('Profesiograma no encontrado');
    }

    return profesiograma;
  }

  /**
   * Obtener profesiograma por cargo
   */
  async findByCargo(cargoId) {
    return prisma.sSTProfesiograma.findFirst({
      where: { cargoId, vigente: true },
      include: {
        cargo: true,
        examenes: true,
        riesgos: {
          include: {
            factorRiesgo: true,
          },
        },
      },
    });
  }

  /**
   * Crear profesiograma
   */
  async create(data) {
    // Validar que el cargo existe
    const cargo = await prisma.tHCargo.findUnique({
      where: { id: data.cargoId },
    });

    if (!cargo) {
      throw new ValidationError('Cargo no encontrado');
    }

    // Verificar si ya existe profesiograma vigente para el cargo
    const existente = await prisma.sSTProfesiograma.findFirst({
      where: { cargoId: data.cargoId, vigente: true },
    });

    // Si existe, desactivarlo
    if (existente) {
      await prisma.sSTProfesiograma.update({
        where: { id: existente.id },
        data: { vigente: false },
      });
    }

    const profesiograma = await prisma.sSTProfesiograma.create({
      data: {
        cargoId: data.cargoId,
        descripcionCargo: data.descripcionCargo,
        funcionesPrincipales: data.funcionesPrincipales,
        requisitosEducacion: data.requisitosEducacion,
        requisitosExperiencia: data.requisitosExperiencia,
        condicionesTrabajo: data.condicionesTrabajo,
        eppsRequeridos: data.eppsRequeridos,
        capacitacionesRequeridas: data.capacitacionesRequeridas,
        contraindicacionesMedicas: data.contraindicacionesMedicas,
        vigente: true,
        version: (existente?.version || 0) + 1,
        fechaElaboracion: new Date(),
      },
      include: {
        cargo: true,
      },
    });

    return profesiograma;
  }

  /**
   * Actualizar profesiograma
   */
  async update(id, data) {
    const profesiograma = await prisma.sSTProfesiograma.findUnique({
      where: { id },
    });

    if (!profesiograma) {
      throw new NotFoundError('Profesiograma no encontrado');
    }

    const updated = await prisma.sSTProfesiograma.update({
      where: { id },
      data,
    });

    return updated;
  }

  /**
   * Agregar examen requerido al profesiograma
   */
  async agregarExamen(profesiogramaId, data) {
    const profesiograma = await prisma.sSTProfesiograma.findUnique({
      where: { id: profesiogramaId },
    });

    if (!profesiograma) {
      throw new NotFoundError('Profesiograma no encontrado');
    }

    const examen = await prisma.sSTExamenProfesiograma.create({
      data: {
        profesiogramaId,
        nombre: data.nombre,
        tipo: data.tipo, // LABORATORIO, IMAGENOLOGIA, ESPECIALIZADO, etc
        momentos: data.momentos, // Array: ['INGRESO', 'PERIODICO', 'EGRESO']
        periodicidad: data.periodicidad, // ANUAL, SEMESTRAL, BIENAL
        obligatorio: data.obligatorio || true,
        justificacion: data.justificacion,
      },
    });

    return examen;
  }

  /**
   * Eliminar examen del profesiograma
   */
  async eliminarExamen(examenId) {
    await prisma.sSTExamenProfesiograma.delete({
      where: { id: examenId },
    });

    return { message: 'Examen eliminado del profesiograma' };
  }

  /**
   * Agregar riesgo al profesiograma
   */
  async agregarRiesgo(profesiogramaId, data) {
    const profesiograma = await prisma.sSTProfesiograma.findUnique({
      where: { id: profesiogramaId },
    });

    if (!profesiograma) {
      throw new NotFoundError('Profesiograma no encontrado');
    }

    // Validar factor de riesgo
    if (data.factorRiesgoId) {
      const factor = await prisma.sSTFactorRiesgo.findUnique({
        where: { id: data.factorRiesgoId },
      });
      if (!factor) {
        throw new ValidationError('Factor de riesgo no encontrado');
      }
    }

    const riesgo = await prisma.sSTRiesgoProfesiograma.create({
      data: {
        profesiogramaId,
        factorRiesgoId: data.factorRiesgoId,
        descripcion: data.descripcion,
        nivelExposicion: data.nivelExposicion, // ALTO, MEDIO, BAJO
        tiempoExposicion: data.tiempoExposicion,
        medidasControl: data.medidasControl,
      },
      include: {
        factorRiesgo: true,
      },
    });

    return riesgo;
  }

  /**
   * Eliminar riesgo del profesiograma
   */
  async eliminarRiesgo(riesgoId) {
    await prisma.sSTRiesgoProfesiograma.delete({
      where: { id: riesgoId },
    });

    return { message: 'Riesgo eliminado del profesiograma' };
  }

  /**
   * Obtener cargos sin profesiograma
   */
  async getCargosSinProfesiograma() {
    const cargosConProfesiograma = await prisma.sSTProfesiograma.findMany({
      where: { vigente: true },
      select: { cargoId: true },
    });

    const cargoIds = cargosConProfesiograma.map(p => p.cargoId);

    return prisma.tHCargo.findMany({
      where: {
        id: { notIn: cargoIds },
        estado: 'ACTIVO',
      },
      orderBy: { nombre: 'asc' },
    });
  }
}

module.exports = new ProfesiogramaService();
