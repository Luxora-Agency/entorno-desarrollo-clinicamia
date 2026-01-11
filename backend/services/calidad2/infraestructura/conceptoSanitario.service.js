const prisma = require('../../../db/prisma');
const { ValidationError, NotFoundError } = require('../../../utils/errors');

/**
 * Servicio para gestión de Conceptos Sanitarios
 *
 * Los conceptos sanitarios son evaluaciones anuales de cumplimiento normativo
 * realizadas por entidades inspectoras (Secretaría de Salud, etc.)
 *
 * Incluyen un checklist de 28 ítems obligatorios según normativa colombiana.
 */
class ConceptoSanitarioService {
  /**
   * Crear concepto sanitario con 28 ítems
   */
  async create(data, usuarioId) {
    // Validar que se proporcionen los 28 ítems
    if (!data.items || data.items.length !== 28) {
      throw new ValidationError('Debe proporcionar exactamente 28 ítems de evaluación');
    }

    // Verificar que no exista otro concepto con el mismo año y número
    const existente = await prisma.conceptoSanitario.findUnique({
      where: {
        anio_numeroConcepto: {
          anio: data.anio,
          numeroConcepto: data.numeroConcepto,
        },
      },
    });

    if (existente) {
      throw new ValidationError(
        `Ya existe un concepto sanitario #${data.numeroConcepto} para el año ${data.anio}`
      );
    }

    // Calcular compliance automáticamente
    const itemsConSI = data.items.filter(item => item.respuesta === 'SI').length;
    const itemsConNO = data.items.filter(item => item.respuesta === 'NO').length;
    const total = itemsConSI + itemsConNO;
    const porcentajeCompliance = total > 0 ? (itemsConSI / total) * 100 : 0;

    // Determinar estado general según porcentaje
    let estadoGeneral;
    if (porcentajeCompliance >= 90) {
      estadoGeneral = 'CONFORME';
    } else if (porcentajeCompliance >= 70) {
      estadoGeneral = 'REQUIERE_MEJORA';
    } else {
      estadoGeneral = 'NO_CONFORME';
    }

    // Crear concepto con items en una transacción
    const concepto = await prisma.$transaction(async (tx) => {
      // Crear concepto
      const nuevoConcepto = await tx.conceptoSanitario.create({
        data: {
          anio: data.anio,
          numeroConcepto: data.numeroConcepto,
          fechaInspeccion: new Date(data.fechaInspeccion),
          entidadInspectora: data.entidadInspectora,
          tipoInspeccion: data.tipoInspeccion,
          estadoGeneral: data.estadoGeneral || estadoGeneral,
          porcentajeCompliance,
          observaciones: data.observaciones || null,
          evaluador: { connect: { id: usuarioId } },
          fechaEvaluacion: new Date(),
        },
      });

      // Crear los 28 items
      const itemsData = data.items.map((item, index) => ({
        conceptoId: nuevoConcepto.id,
        numero: item.numero || index + 1,
        pregunta: item.pregunta,
        respuesta: item.respuesta,
        observaciones: item.observaciones || null,
        cumple: item.respuesta === 'SI' ? true : item.respuesta === 'NO' ? false : null,
        evidenciaUrl: item.evidenciaUrl || null,
      }));

      await tx.itemConceptoSanitario.createMany({
        data: itemsData,
      });

      // Obtener concepto con items incluidos
      return tx.conceptoSanitario.findUnique({
        where: { id: nuevoConcepto.id },
        include: {
          items: { orderBy: { numero: 'asc' } },
          evaluador: { select: { id: true, nombre: true, apellido: true, email: true } },
          documentos: true,
          solicitudesVisita: true,
        },
      });
    });

    return concepto;
  }

  /**
   * Obtener todos los conceptos con filtros
   */
  async findAll(filters = {}) {
    const { anio, tipoInspeccion, estadoGeneral, page = 1, limit = 50 } = filters;

    const where = {
      activo: true,
    };

    if (anio) where.anio = parseInt(anio);
    if (tipoInspeccion) where.tipoInspeccion = tipoInspeccion;
    if (estadoGeneral) where.estadoGeneral = estadoGeneral;

    const [conceptos, total] = await Promise.all([
      prisma.conceptoSanitario.findMany({
        where,
        include: {
          evaluador: { select: { nombre: true, apellido: true } },
          items: { select: { numero: true, cumple: true } },
          documentos: { select: { id: true } },
          solicitudesVisita: { select: { id: true, estado: true } },
        },
        orderBy: [
          { anio: 'desc' },
          { fechaInspeccion: 'desc' },
        ],
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.conceptoSanitario.count({ where }),
    ]);

    return {
      data: conceptos,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Obtener conceptos por año
   */
  async findByAnio(anio) {
    return prisma.conceptoSanitario.findMany({
      where: {
        anio: parseInt(anio),
        activo: true,
      },
      include: {
        evaluador: { select: { nombre: true, apellido: true } },
        items: { select: { numero: true, cumple: true } },
        documentos: true,
        solicitudesVisita: true,
      },
      orderBy: { fechaInspeccion: 'desc' },
    });
  }

  /**
   * Obtener concepto por ID
   */
  async findById(id) {
    const concepto = await prisma.conceptoSanitario.findUnique({
      where: { id },
      include: {
        items: { orderBy: { numero: 'asc' } },
        evaluador: { select: { id: true, nombre: true, apellido: true, email: true } },
        documentos: {
          include: {
            usuario: { select: { nombre: true, apellido: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
        solicitudesVisita: {
          include: {
            solicitante: { select: { nombre: true, apellido: true } },
            documentos: true,
          },
          orderBy: { fechaSolicitud: 'desc' },
        },
      },
    });

    if (!concepto) {
      throw new NotFoundError('Concepto sanitario no encontrado');
    }

    return concepto;
  }

  /**
   * Actualizar concepto sanitario
   */
  async update(id, data, usuarioId) {
    const concepto = await this.findById(id);

    // Si se actualizan los items, recalcular compliance
    let updateData = {
      ...data,
      fechaInspeccion: data.fechaInspeccion ? new Date(data.fechaInspeccion) : undefined,
    };

    // Si se proporcionan items, recalcular porcentaje
    if (data.items && data.items.length === 28) {
      const itemsConSI = data.items.filter(item => item.respuesta === 'SI').length;
      const itemsConNO = data.items.filter(item => item.respuesta === 'NO').length;
      const total = itemsConSI + itemsConNO;
      const porcentajeCompliance = total > 0 ? (itemsConSI / total) * 100 : 0;

      let estadoGeneral;
      if (porcentajeCompliance >= 90) {
        estadoGeneral = 'CONFORME';
      } else if (porcentajeCompliance >= 70) {
        estadoGeneral = 'REQUIERE_MEJORA';
      } else {
        estadoGeneral = 'NO_CONFORME';
      }

      updateData.porcentajeCompliance = porcentajeCompliance;
      updateData.estadoGeneral = estadoGeneral;

      // Actualizar items en transacción
      return prisma.$transaction(async (tx) => {
        // Actualizar concepto
        const updated = await tx.conceptoSanitario.update({
          where: { id },
          data: updateData,
        });

        // Eliminar items antiguos y crear nuevos
        await tx.itemConceptoSanitario.deleteMany({
          where: { conceptoId: id },
        });

        const itemsData = data.items.map((item, index) => ({
          conceptoId: id,
          numero: item.numero || index + 1,
          pregunta: item.pregunta,
          respuesta: item.respuesta,
          observaciones: item.observaciones || null,
          cumple: item.respuesta === 'SI' ? true : item.respuesta === 'NO' ? false : null,
          evidenciaUrl: item.evidenciaUrl || null,
        }));

        await tx.itemConceptoSanitario.createMany({
          data: itemsData,
        });

        // Retornar concepto actualizado
        return tx.conceptoSanitario.findUnique({
          where: { id },
          include: {
            items: { orderBy: { numero: 'asc' } },
            evaluador: { select: { id: true, nombre: true, apellido: true } },
            documentos: true,
            solicitudesVisita: true,
          },
        });
      });
    }

    // Actualizar solo el concepto (sin items)
    const updated = await prisma.conceptoSanitario.update({
      where: { id },
      data: updateData,
      include: {
        items: { orderBy: { numero: 'asc' } },
        evaluador: { select: { id: true, nombre: true, apellido: true } },
        documentos: true,
        solicitudesVisita: true,
      },
    });

    return updated;
  }

  /**
   * Actualizar un ítem específico del checklist
   */
  async updateItem(conceptoId, itemId, data) {
    // Verificar que el concepto existe
    await this.findById(conceptoId);

    // Actualizar el item
    const item = await prisma.itemConceptoSanitario.update({
      where: { id: itemId },
      data: {
        respuesta: data.respuesta,
        observaciones: data.observaciones || null,
        cumple: data.respuesta === 'SI' ? true : data.respuesta === 'NO' ? false : null,
        evidenciaUrl: data.evidenciaUrl || null,
      },
    });

    // Recalcular compliance del concepto
    await this.recalcularCompliance(conceptoId);

    return item;
  }

  /**
   * Recalcular porcentaje de compliance de un concepto
   */
  async recalcularCompliance(conceptoId) {
    const items = await prisma.itemConceptoSanitario.findMany({
      where: { conceptoId },
    });

    const itemsConSI = items.filter(item => item.respuesta === 'SI').length;
    const itemsConNO = items.filter(item => item.respuesta === 'NO').length;
    const total = itemsConSI + itemsConNO;
    const porcentajeCompliance = total > 0 ? (itemsConSI / total) * 100 : 0;

    let estadoGeneral;
    if (porcentajeCompliance >= 90) {
      estadoGeneral = 'CONFORME';
    } else if (porcentajeCompliance >= 70) {
      estadoGeneral = 'REQUIERE_MEJORA';
    } else {
      estadoGeneral = 'NO_CONFORME';
    }

    return prisma.conceptoSanitario.update({
      where: { id: conceptoId },
      data: {
        porcentajeCompliance,
        estadoGeneral,
      },
    });
  }

  /**
   * Soft delete
   */
  async delete(id) {
    await this.findById(id);

    return prisma.conceptoSanitario.update({
      where: { id },
      data: { activo: false },
    });
  }

  /**
   * Subir documento al concepto sanitario
   */
  async uploadDocumento(conceptoId, archivo, metadata, usuarioId) {
    await this.findById(conceptoId);

    return prisma.documentoConceptoSanitario.create({
      data: {
        conceptoId,
        nombre: metadata.nombre,
        descripcion: metadata.descripcion || null,
        archivoUrl: archivo.archivoUrl,
        archivoNombre: archivo.archivoNombre,
        archivoTipo: archivo.archivoTipo,
        archivoTamano: archivo.archivoTamano,
        tipoDocumento: metadata.tipoDocumento || 'EVIDENCIA',
        subidoPor: usuarioId,
      },
      include: {
        usuario: { select: { nombre: true, apellido: true } },
      },
    });
  }

  /**
   * Eliminar documento
   */
  async deleteDocumento(documentoId) {
    return prisma.documentoConceptoSanitario.delete({
      where: { id: documentoId },
    });
  }

  /**
   * Obtener estadísticas por año
   */
  async getEstadisticasPorAnio(anio) {
    const conceptos = await prisma.conceptoSanitario.findMany({
      where: { anio: parseInt(anio), activo: true },
    });

    const total = conceptos.length;
    const conformes = conceptos.filter(c => c.estadoGeneral === 'CONFORME').length;
    const requierenMejora = conceptos.filter(c => c.estadoGeneral === 'REQUIERE_MEJORA').length;
    const noConformes = conceptos.filter(c => c.estadoGeneral === 'NO_CONFORME').length;

    const promedioCompliance =
      total > 0
        ? conceptos.reduce((sum, c) => sum + c.porcentajeCompliance, 0) / total
        : 0;

    return {
      anio: parseInt(anio),
      total,
      conformes,
      requierenMejora,
      noConformes,
      promedioCompliance: Math.round(promedioCompliance * 100) / 100,
    };
  }

  /**
   * Obtener lista de años disponibles
   */
  async getAniosDisponibles() {
    const result = await prisma.conceptoSanitario.groupBy({
      by: ['anio'],
      where: { activo: true },
      orderBy: { anio: 'desc' },
    });

    return result.map(r => r.anio);
  }
}

module.exports = new ConceptoSanitarioService();
