const prisma = require('../db/prisma');
const { NotFoundError, ValidationError } = require('../utils/errors');

class TipoUsuarioConvenioService {
  async listar(incluirInactivos = false) {
    const where = incluirInactivos ? {} : { activo: true };
    return prisma.tipoUsuarioConvenio.findMany({
      where,
      orderBy: { nombre: 'asc' },
    });
  }

  async obtenerPorId(id) {
    const tipo = await prisma.tipoUsuarioConvenio.findUnique({
      where: { id },
    });

    if (!tipo) {
      throw new NotFoundError('Tipo de usuario no encontrado');
    }

    return tipo;
  }

  async obtenerPorNombre(nombre) {
    const tipo = await prisma.tipoUsuarioConvenio.findUnique({
      where: { nombre },
    });

    return tipo;
  }

  async crear(data) {
    // Verificar si ya existe uno con el mismo nombre
    const existente = await prisma.tipoUsuarioConvenio.findUnique({
      where: { nombre: data.nombre },
    });

    if (existente) {
      throw new ValidationError('Ya existe un tipo de usuario con ese nombre');
    }

    return prisma.tipoUsuarioConvenio.create({
      data: {
        nombre: data.nombre,
        codigoConvenio: data.codigoConvenio,
        descripcion: data.descripcion || null,
        activo: data.activo !== undefined ? data.activo : true,
      },
    });
  }

  async actualizar(id, data) {
    // Verificar que existe
    const tipo = await prisma.tipoUsuarioConvenio.findUnique({
      where: { id },
    });

    if (!tipo) {
      throw new NotFoundError('Tipo de usuario no encontrado');
    }

    // Si cambia el nombre, verificar que no exista otro con ese nombre
    if (data.nombre && data.nombre !== tipo.nombre) {
      const existente = await prisma.tipoUsuarioConvenio.findUnique({
        where: { nombre: data.nombre },
      });

      if (existente) {
        throw new ValidationError('Ya existe un tipo de usuario con ese nombre');
      }
    }

    return prisma.tipoUsuarioConvenio.update({
      where: { id },
      data: {
        nombre: data.nombre,
        codigoConvenio: data.codigoConvenio,
        descripcion: data.descripcion,
        activo: data.activo,
      },
    });
  }

  async eliminar(id) {
    const tipo = await prisma.tipoUsuarioConvenio.findUnique({
      where: { id },
    });

    if (!tipo) {
      throw new NotFoundError('Tipo de usuario no encontrado');
    }

    return prisma.tipoUsuarioConvenio.delete({
      where: { id },
    });
  }

  async toggleActivo(id) {
    const tipo = await prisma.tipoUsuarioConvenio.findUnique({
      where: { id },
    });

    if (!tipo) {
      throw new NotFoundError('Tipo de usuario no encontrado');
    }

    return prisma.tipoUsuarioConvenio.update({
      where: { id },
      data: { activo: !tipo.activo },
    });
  }
}

module.exports = new TipoUsuarioConvenioService();
