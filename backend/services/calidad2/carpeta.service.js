const prisma = require('../../db/prisma');
const { ValidationError, NotFoundError } = require('../../utils/errors');

class CarpetaCalidad2Service {
  /**
   * Obtener todas las carpetas con filtros
   */
  async findAll(query = {}) {
    const { tipo, parentId, activo = true } = query;

    const where = {
      activo: activo === 'true' || activo === true,
      ...(tipo && { tipo }),
      ...(parentId === 'null' ? { parentId: null } : parentId ? { parentId } : {}),
    };

    const carpetas = await prisma.carpetaCalidad2.findMany({
      where,
      include: {
        children: {
          where: { activo: true },
          orderBy: { orden: 'asc' },
        },
        _count: {
          select: { documentos: true, children: true },
        },
      },
      orderBy: { orden: 'asc' },
    });

    return carpetas;
  }

  /**
   * Obtener carpeta por ID con hijos y documentos
   */
  async findById(id) {
    const carpeta = await prisma.carpetaCalidad2.findUnique({
      where: { id },
      include: {
        parent: true,
        children: {
          where: { activo: true },
          orderBy: { orden: 'asc' },
        },
        documentos: {
          where: { activo: true },
          orderBy: { createdAt: 'desc' },
          include: {
            usuario: {
              select: { id: true, nombre: true, apellido: true },
            },
          },
        },
      },
    });

    if (!carpeta) {
      throw new NotFoundError('Carpeta no encontrada');
    }

    return carpeta;
  }

  /**
   * Crear nueva carpeta
   */
  async create(data) {
    const { nombre, descripcion, tipo, parentId, orden } = data;

    // Validar que el tipo sea válido
    const tiposValidos = ['INSCRIPCION', 'PROCESOS', 'CAPACIDAD', 'PERSONAL', 'PROCESOS_INFRAESTRUCTURA'];
    if (!tiposValidos.includes(tipo)) {
      throw new ValidationError(`Tipo de carpeta inválido. Valores permitidos: ${tiposValidos.join(', ')}`);
    }

    // Si tiene parentId, verificar que exista
    if (parentId) {
      const parent = await prisma.carpetaCalidad2.findUnique({
        where: { id: parentId },
      });
      if (!parent) {
        throw new ValidationError('Carpeta padre no encontrada');
      }
    }

    // Verificar nombre único dentro del mismo nivel
    const existente = await prisma.carpetaCalidad2.findFirst({
      where: {
        nombre,
        tipo,
        parentId: parentId || null,
        activo: true,
      },
    });

    if (existente) {
      const ubicacion = parentId ? 'en esta carpeta' : 'en el nivel raíz';
      throw new ValidationError(`Ya existe una carpeta llamada "${nombre}" ${ubicacion}. Por favor, elija otro nombre.`);
    }

    const carpeta = await prisma.carpetaCalidad2.create({
      data: {
        nombre,
        descripcion,
        tipo,
        parentId: parentId || null,
        orden: orden || 0,
      },
      include: {
        parent: true,
      },
    });

    return carpeta;
  }

  /**
   * Actualizar carpeta
   */
  async update(id, data) {
    const carpeta = await prisma.carpetaCalidad2.findUnique({
      where: { id },
    });

    if (!carpeta) {
      throw new NotFoundError('Carpeta no encontrada');
    }

    const { nombre, descripcion, orden, parentId } = data;

    // Si cambia el nombre, verificar unicidad
    if (nombre && nombre !== carpeta.nombre) {
      const parentIdFinal = parentId !== undefined ? parentId : carpeta.parentId;
      const existente = await prisma.carpetaCalidad2.findFirst({
        where: {
          nombre,
          tipo: carpeta.tipo,
          parentId: parentIdFinal,
          activo: true,
          NOT: { id },
        },
      });

      if (existente) {
        const ubicacion = parentIdFinal ? 'en esta carpeta' : 'en el nivel raíz';
        throw new ValidationError(`Ya existe una carpeta llamada "${nombre}" ${ubicacion}. Por favor, elija otro nombre.`);
      }
    }

    // Evitar ciclos en la jerarquía
    if (parentId) {
      if (parentId === id) {
        throw new ValidationError('Una carpeta no puede ser su propio padre');
      }
      // Verificar que el nuevo padre no sea un hijo
      const esDescendiente = await this.esDescendiente(parentId, id);
      if (esDescendiente) {
        throw new ValidationError('No se puede mover una carpeta dentro de sus propios descendientes');
      }
    }

    const updated = await prisma.carpetaCalidad2.update({
      where: { id },
      data: {
        ...(nombre && { nombre }),
        ...(descripcion !== undefined && { descripcion }),
        ...(orden !== undefined && { orden }),
        ...(parentId !== undefined && { parentId }),
      },
      include: {
        parent: true,
        children: true,
      },
    });

    return updated;
  }

  /**
   * Eliminar carpeta (soft delete)
   */
  async delete(id) {
    const carpeta = await prisma.carpetaCalidad2.findUnique({
      where: { id },
      include: {
        children: { where: { activo: true } },
        documentos: { where: { activo: true } },
      },
    });

    if (!carpeta) {
      throw new NotFoundError('Carpeta no encontrada');
    }

    // Mover subcarpetas al abuelo (parentId de la carpeta actual)
    if (carpeta.children.length > 0) {
      await prisma.carpetaCalidad2.updateMany({
        where: { parentId: id, activo: true },
        data: { parentId: carpeta.parentId },
      });
    }

    // Mover documentos al abuelo
    if (carpeta.documentos.length > 0) {
      await prisma.documentoCalidad2.updateMany({
        where: { carpetaId: id, activo: true },
        data: { carpetaId: carpeta.parentId },
      });
    }

    // Ahora eliminar la carpeta (soft delete)
    await prisma.carpetaCalidad2.update({
      where: { id },
      data: { activo: false },
    });

    return { message: 'Carpeta eliminada correctamente' };
  }

  /**
   * Obtener árbol de carpetas por tipo
   */
  async getTree(tipo) {
    const carpetas = await prisma.carpetaCalidad2.findMany({
      where: {
        tipo,
        activo: true,
        parentId: null,
      },
      include: {
        children: {
          where: { activo: true },
          include: {
            children: {
              where: { activo: true },
              include: {
                children: {
                  where: { activo: true },
                },
              },
            },
          },
        },
        _count: {
          select: { documentos: true },
        },
      },
      orderBy: { orden: 'asc' },
    });

    return carpetas;
  }

  /**
   * Verificar si una carpeta es descendiente de otra
   */
  async esDescendiente(posibleDescendienteId, ancestroId) {
    let currentId = posibleDescendienteId;
    const visited = new Set();

    while (currentId) {
      if (visited.has(currentId)) break;
      visited.add(currentId);

      const carpeta = await prisma.carpetaCalidad2.findUnique({
        where: { id: currentId },
        select: { parentId: true },
      });

      if (!carpeta) break;
      if (carpeta.parentId === ancestroId) return true;
      currentId = carpeta.parentId;
    }

    return false;
  }
}

module.exports = new CarpetaCalidad2Service();
