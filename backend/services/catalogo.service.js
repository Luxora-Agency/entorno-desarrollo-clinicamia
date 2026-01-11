/**
 * Service para gestión de catálogos oficiales (CUPS, CIE-11)
 */
const prisma = require('../db/prisma');
const { NotFoundError } = require('../utils/errors');

class CatalogoService {
  /**
   * Buscar en catálogo CUPS
   */
  async searchCups({ query, limit = 20 }) {
    if (!query) return [];

    const searchTerm = query.trim();

    const items = await prisma.catalogoCups.findMany({
      where: {
        OR: [
          { codigo: { contains: searchTerm, mode: 'insensitive' } },
          { descripcion: { contains: searchTerm, mode: 'insensitive' } },
        ],
        estado: 'Activo',
      },
      take: parseInt(limit),
      orderBy: { codigo: 'asc' },
    });

    return items;
  }

  /**
   * Buscar en catálogo CIE-11
   */
  async searchCie11({ query, limit = 20 }) {
    if (!query) return [];

    const searchTerm = query.trim();

    const items = await prisma.catalogoCie11.findMany({
      where: {
        OR: [
          { codigo: { contains: searchTerm, mode: 'insensitive' } },
          { descripcion: { contains: searchTerm, mode: 'insensitive' } },
        ],
        estado: 'Activo',
      },
      take: parseInt(limit),
      orderBy: { codigo: 'asc' },
    });

    return items;
  }

  /**
   * Buscar en catálogo CIE-10
   */
  async searchCie10({ query, limit = 20 }) {
    if (!query) return [];

    const searchTerm = query.trim();

    const items = await prisma.catalogoCie10.findMany({
      where: {
        OR: [
          { codigo: { contains: searchTerm, mode: 'insensitive' } },
          { descripcion: { contains: searchTerm, mode: 'insensitive' } },
        ],
        estado: 'Activo',
      },
      take: parseInt(limit),
      orderBy: { codigo: 'asc' },
    });

    return items;
  }

  /**
   * Obtener un código CIE-10 específico
   */
  async getCie10ByCode(codigo) {
    const item = await prisma.catalogoCie10.findUnique({
      where: { codigo },
    });
    return item;
  }

  /**
   * Obtener un código CUPS específico
   */
  async getCupsByCode(codigo) {
    const item = await prisma.catalogoCups.findUnique({
      where: { codigo },
    });
    return item;
  }

  /**
   * Obtener un código CIE-11 específico
   */
  async getCie11ByCode(codigo) {
    const item = await prisma.catalogoCie11.findUnique({
      where: { codigo },
    });
    return item;
  }

  /**
   * Actualizar catálogos (Simulación/Carga masiva)
   * En un escenario real, esto podría consumir una API externa o leer un archivo
   */
  async updateCatalogos(tipo, data) {
    // data es un array de objetos { codigo, descripcion, ... }
    if (tipo === 'CUPS') {
      let count = 0;
      for (const item of data) {
        await prisma.catalogoCups.upsert({
          where: { codigo: item.codigo },
          update: {
            descripcion: item.descripcion,
            seccion: item.seccion,
            capitulo: item.capitulo,
            grupo: item.grupo,
            subgrupo: item.subgrupo,
          },
          create: {
            codigo: item.codigo,
            descripcion: item.descripcion,
            seccion: item.seccion,
            capitulo: item.capitulo,
            grupo: item.grupo,
            subgrupo: item.subgrupo,
          },
        });
        count++;
      }
      return { message: `Actualizados ${count} registros CUPS` };
    } else if (tipo === 'CIE11') {
      let count = 0;
      for (const item of data) {
        await prisma.catalogoCie11.upsert({
          where: { codigo: item.codigo },
          update: {
            descripcion: item.descripcion,
            capitulo: item.capitulo,
            titulo: item.titulo,
          },
          create: {
            codigo: item.codigo,
            descripcion: item.descripcion,
            capitulo: item.capitulo,
            titulo: item.titulo,
          },
        });
        count++;
      }
      return { message: `Actualizados ${count} registros CIE-11` };
    } else {
      throw new Error('Tipo de catálogo no soportado');
    }
  }
}

module.exports = new CatalogoService();
