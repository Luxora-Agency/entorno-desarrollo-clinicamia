/**
 * Servicio de Evaluacion de Estandares Minimos
 * Evalua cumplimiento segun Resolucion 0312/2019
 * Normativa: Resolucion 0312/2019
 */

const prisma = require('../../db/prisma');
const { ValidationError, NotFoundError } = require('../../utils/errors');

class EvaluacionEstandaresService {
  /**
   * Obtener evaluacion del año actual
   */
  async getActual() {
    const anioActual = new Date().getFullYear();

    return prisma.sSTEvaluacionEstandares.findFirst({
      where: { anio: anioActual },
      include: {
        ciclos: {
          include: {
            items: {
              orderBy: { numeral: 'asc' },
            },
          },
          orderBy: { cicloPHVA: 'asc' },
        },
        planMejoramiento: {
          orderBy: { prioridad: 'asc' },
        },
      },
    });
  }

  /**
   * Listar evaluaciones
   */
  async findAll({ page = 1, limit = 10 }) {
    const skip = (page - 1) * limit;

    const [evaluaciones, total] = await Promise.all([
      prisma.sSTEvaluacionEstandares.findMany({
        skip,
        take: limit,
        orderBy: { anio: 'desc' },
      }),
      prisma.sSTEvaluacionEstandares.count(),
    ]);

    return {
      data: evaluaciones,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Obtener evaluacion por ID
   */
  async findById(id) {
    const evaluacion = await prisma.sSTEvaluacionEstandares.findUnique({
      where: { id },
      include: {
        ciclos: {
          include: {
            items: {
              orderBy: { numeral: 'asc' },
            },
          },
          orderBy: { cicloPHVA: 'asc' },
        },
        planMejoramiento: {
          include: {
            responsable: {
              select: { id: true, nombre: true, apellido: true },
            },
          },
          orderBy: { prioridad: 'asc' },
        },
      },
    });

    if (!evaluacion) {
      throw new NotFoundError('Evaluacion no encontrada');
    }

    return evaluacion;
  }

  /**
   * Crear evaluacion de estandares minimos
   */
  async create(data) {
    // Verificar si ya existe para el año
    const existe = await prisma.sSTEvaluacionEstandares.findFirst({
      where: { anio: data.anio },
    });

    if (existe) {
      throw new ValidationError(`Ya existe evaluacion para el año ${data.anio}`);
    }

    // Crear evaluacion con estructura de ciclos PHVA
    const evaluacion = await prisma.$transaction(async (tx) => {
      const eval_ = await tx.sSTEvaluacionEstandares.create({
        data: {
          anio: data.anio,
          fechaEvaluacion: new Date(),
          evaluadorNombre: data.evaluadorNombre,
          evaluadorCargo: data.evaluadorCargo,
          tamanoEmpresa: data.tamanoEmpresa, // MENOS_10, 11_50, MAS_50
          estado: 'EN_PROCESO',
        },
      });

      // Crear ciclos PHVA con items segun Res. 0312/2019
      const ciclos = await this.crearEstructuraEstandares(tx, eval_.id, data.tamanoEmpresa);

      return { ...eval_, ciclos };
    });

    return evaluacion;
  }

  /**
   * Crear estructura de estandares segun tamaño de empresa
   */
  async crearEstructuraEstandares(tx, evaluacionId, tamanoEmpresa) {
    // Estructura base de estandares minimos (simplificada)
    const estructura = [
      {
        ciclo: 'PLANEAR',
        peso: 25,
        items: [
          { numeral: '1.1.1', descripcion: 'Responsable del SG-SST', peso: 0.5 },
          { numeral: '1.1.2', descripcion: 'Responsabilidades en el SG-SST', peso: 0.5 },
          { numeral: '1.1.3', descripcion: 'Asignacion de recursos', peso: 0.5 },
          { numeral: '1.1.4', descripcion: 'Afiliacion al Sistema de Seguridad Social', peso: 0.5 },
          { numeral: '1.1.5', descripcion: 'Pago pension trabajadores alto riesgo', peso: 0.5 },
          { numeral: '1.1.6', descripcion: 'Conformacion COPASST', peso: 0.5 },
          { numeral: '1.1.7', descripcion: 'Capacitacion COPASST', peso: 0.5 },
          { numeral: '1.1.8', descripcion: 'Conformacion Comite Convivencia', peso: 0.5 },
          { numeral: '1.2.1', descripcion: 'Programa de capacitacion anual', peso: 2 },
          { numeral: '1.2.2', descripcion: 'Capacitacion, induccion y reinduccion', peso: 2 },
          { numeral: '1.2.3', descripcion: 'Responsables del SG-SST con curso 50h', peso: 2 },
          { numeral: '2.1.1', descripcion: 'Politica del SG-SST firmada y divulgada', peso: 1 },
          { numeral: '2.2.1', descripcion: 'Objetivos del SG-SST', peso: 1 },
          { numeral: '2.3.1', descripcion: 'Evaluacion inicial del SG-SST', peso: 1 },
          { numeral: '2.4.1', descripcion: 'Plan anual de trabajo', peso: 2 },
          { numeral: '2.5.1', descripcion: 'Archivo y retencion documental', peso: 2 },
          { numeral: '2.6.1', descripcion: 'Rendicion de cuentas', peso: 1 },
          { numeral: '2.7.1', descripcion: 'Matriz legal', peso: 2 },
          { numeral: '2.8.1', descripcion: 'Mecanismos de comunicacion', peso: 1 },
          { numeral: '2.9.1', descripcion: 'Identificacion y evaluacion requisitos legales', peso: 1 },
          { numeral: '2.10.1', descripcion: 'Gestion del cambio', peso: 1 },
          { numeral: '2.11.1', descripcion: 'Proveedores y contratistas', peso: 2 },
        ],
      },
      {
        ciclo: 'HACER',
        peso: 60,
        items: [
          { numeral: '3.1.1', descripcion: 'Evaluaciones medicas ocupacionales', peso: 1 },
          { numeral: '3.1.2', descripcion: 'Custodia de historias clinicas', peso: 1 },
          { numeral: '3.1.3', descripcion: 'Restricciones y recomendaciones medicas', peso: 1 },
          { numeral: '3.1.4', descripcion: 'Estilos de vida saludables', peso: 1 },
          { numeral: '3.1.5', descripcion: 'Agua potable, servicios sanitarios', peso: 1 },
          { numeral: '3.1.6', descripcion: 'Manejo de residuos', peso: 1 },
          { numeral: '3.1.7', descripcion: 'Reporte de accidentes y enfermedades', peso: 2 },
          { numeral: '3.1.8', descripcion: 'Investigacion de incidentes y accidentes', peso: 2 },
          { numeral: '3.1.9', descripcion: 'Registro y analisis estadistico', peso: 1 },
          { numeral: '3.2.1', descripcion: 'Identificacion de peligros, evaluacion y valoracion de riesgos', peso: 4 },
          { numeral: '3.2.2', descripcion: 'Metodologia IPVR con participacion trabajadores', peso: 4 },
          { numeral: '3.2.3', descripcion: 'Identificacion sustancias catalogadas', peso: 3 },
          { numeral: '3.3.1', descripcion: 'Medidas de prevencion y control', peso: 2.5 },
          { numeral: '3.3.2', descripcion: 'Aplicacion de medidas jerarquicamente', peso: 2.5 },
          { numeral: '3.3.3', descripcion: 'EPP con mantenimiento', peso: 2.5 },
          { numeral: '3.3.4', descripcion: 'Procedimientos e instructivos SST', peso: 2.5 },
          { numeral: '3.3.5', descripcion: 'Inspeccion con lista de chequeo', peso: 2.5 },
          { numeral: '3.3.6', descripcion: 'Mantenimiento preventivo/correctivo', peso: 2.5 },
          { numeral: '4.1.1', descripcion: 'Plan de prevencion y preparacion ante emergencias', peso: 5 },
          { numeral: '4.1.2', descripcion: 'Brigada de prevencion, preparacion y respuesta', peso: 5 },
          { numeral: '4.1.3', descripcion: 'Simulacros minimo 1 vez al año', peso: 5 },
          { numeral: '4.2.1', descripcion: 'Programa de vigilancia epidemiologica', peso: 2.5 },
          { numeral: '4.2.2', descripcion: 'Indicadores de estructura, proceso y resultado', peso: 1.25 },
          { numeral: '4.2.3', descripcion: 'Medicion indices AT, EL', peso: 1.25 },
          { numeral: '4.2.4', descripcion: 'Medicion indices ausentismo', peso: 1.25 },
          { numeral: '4.2.5', descripcion: 'Medicion de mortalidad', peso: 1.25 },
          { numeral: '4.2.6', descripcion: 'Programas de prevencion de riesgos prioritarios', peso: 2.5 },
        ],
      },
      {
        ciclo: 'VERIFICAR',
        peso: 5,
        items: [
          { numeral: '5.1.1', descripcion: 'Gestion de resultados del SG-SST', peso: 1.25 },
          { numeral: '5.1.2', descripcion: 'Resultados de auditorias aplicados', peso: 1.25 },
          { numeral: '5.1.3', descripcion: 'Revision de alta direccion', peso: 1.25 },
          { numeral: '5.1.4', descripcion: 'Planificacion de auditorias con COPASST', peso: 1.25 },
        ],
      },
      {
        ciclo: 'ACTUAR',
        peso: 10,
        items: [
          { numeral: '6.1.1', descripcion: 'Definicion de acciones preventivas y correctivas', peso: 2.5 },
          { numeral: '6.1.2', descripcion: 'Acciones de mejora', peso: 2.5 },
          { numeral: '6.1.3', descripcion: 'Acciones de mejora basadas en investigaciones', peso: 2.5 },
          { numeral: '6.1.4', descripcion: 'Plan de mejoramiento', peso: 2.5 },
        ],
      },
    ];

    const ciclosCreados = [];

    for (const cicloData of estructura) {
      const ciclo = await tx.sSTEvaluacionCiclo.create({
        data: {
          evaluacionId,
          cicloPHVA: cicloData.ciclo,
          pesoMaximo: cicloData.peso,
        },
      });

      const itemsCreados = [];
      for (const itemData of cicloData.items) {
        const item = await tx.sSTItemEvaluacionEstandar.create({
          data: {
            cicloId: ciclo.id,
            numeral: itemData.numeral,
            descripcion: itemData.descripcion,
            pesoMaximo: itemData.peso,
            cumple: null,
            puntajeObtenido: 0,
          },
        });
        itemsCreados.push(item);
      }

      ciclosCreados.push({ ...ciclo, items: itemsCreados });
    }

    return ciclosCreados;
  }

  /**
   * Evaluar item
   */
  async evaluarItem(itemId, data) {
    const item = await prisma.sSTItemEvaluacionEstandar.findUnique({
      where: { id: itemId },
    });

    if (!item) {
      throw new NotFoundError('Item no encontrado');
    }

    // Calcular puntaje: si cumple = peso maximo, si no cumple = 0
    const puntaje = data.cumple ? item.pesoMaximo : 0;

    return prisma.sSTItemEvaluacionEstandar.update({
      where: { id: itemId },
      data: {
        cumple: data.cumple,
        puntajeObtenido: puntaje,
        observaciones: data.observaciones,
        evidencia: data.evidencia,
      },
    });
  }

  /**
   * Calcular resultados de evaluacion
   */
  async calcularResultados(evaluacionId) {
    const evaluacion = await prisma.sSTEvaluacionEstandares.findUnique({
      where: { id: evaluacionId },
      include: {
        ciclos: {
          include: { items: true },
        },
      },
    });

    if (!evaluacion) {
      throw new NotFoundError('Evaluacion no encontrada');
    }

    let puntajeTotal = 0;
    const resultadosCiclo = [];

    for (const ciclo of evaluacion.ciclos) {
      const puntajeCiclo = ciclo.items.reduce((sum, item) => sum + item.puntajeObtenido, 0);
      puntajeTotal += puntajeCiclo;

      await prisma.sSTEvaluacionCiclo.update({
        where: { id: ciclo.id },
        data: { puntajeObtenido: puntajeCiclo },
      });

      resultadosCiclo.push({
        ciclo: ciclo.cicloPHVA,
        pesoMaximo: ciclo.pesoMaximo,
        puntajeObtenido: puntajeCiclo,
        porcentaje: (puntajeCiclo / ciclo.pesoMaximo) * 100,
      });
    }

    // Determinar valoracion segun Res. 0312
    let valoracion;
    if (puntajeTotal < 60) {
      valoracion = 'CRITICO';
    } else if (puntajeTotal < 85) {
      valoracion = 'MODERADAMENTE_ACEPTABLE';
    } else {
      valoracion = 'ACEPTABLE';
    }

    await prisma.sSTEvaluacionEstandares.update({
      where: { id: evaluacionId },
      data: {
        puntajeTotal,
        valoracion,
        estado: 'COMPLETADA',
      },
    });

    return {
      puntajeTotal,
      valoracion,
      resultadosCiclo,
    };
  }

  /**
   * Agregar item al plan de mejoramiento
   */
  async agregarPlanMejoramiento(evaluacionId, data) {
    const evaluacion = await prisma.sSTEvaluacionEstandares.findUnique({
      where: { id: evaluacionId },
    });

    if (!evaluacion) {
      throw new NotFoundError('Evaluacion no encontrada');
    }

    const item = await prisma.SSTPlanMejoramientoEstandar.create({
      data: {
        evaluacionId,
        numeral: data.numeral,
        hallazgo: data.hallazgo,
        accionMejora: data.accionMejora,
        responsableId: data.responsableId,
        fechaInicio: new Date(data.fechaInicio),
        fechaFin: new Date(data.fechaFin),
        recursos: data.recursos,
        prioridad: data.prioridad, // ALTA, MEDIA, BAJA
        estado: 'PENDIENTE',
      },
      include: {
        responsable: {
          select: { id: true, nombre: true, apellido: true },
        },
      },
    });

    return item;
  }

  /**
   * Actualizar estado de item del plan
   */
  async actualizarItemPlan(itemId, data) {
    return prisma.SSTPlanMejoramientoEstandar.update({
      where: { id: itemId },
      data: {
        estado: data.estado,
        avance: data.avance,
        evidencia: data.evidencia,
        observaciones: data.observaciones,
        fechaCumplimiento: data.estado === 'CUMPLIDO' ? new Date() : undefined,
      },
    });
  }

  /**
   * Obtener comparativo anual
   */
  async getComparativoAnual(anioInicio, anioFin) {
    const evaluaciones = await prisma.sSTEvaluacionEstandares.findMany({
      where: {
        anio: { gte: anioInicio, lte: anioFin },
        estado: 'COMPLETADA',
      },
      orderBy: { anio: 'asc' },
      include: {
        ciclos: {
          select: { cicloPHVA: true, puntajeObtenido: true, pesoMaximo: true },
        },
      },
    });

    return evaluaciones.map(e => ({
      anio: e.anio,
      puntajeTotal: e.puntajeTotal,
      valoracion: e.valoracion,
      ciclos: e.ciclos.map(c => ({
        ciclo: c.cicloPHVA,
        puntaje: c.puntajeObtenido,
        maximo: c.pesoMaximo,
      })),
    }));
  }
}

module.exports = new EvaluacionEstandaresService();
