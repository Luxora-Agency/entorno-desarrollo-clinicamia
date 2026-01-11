/**
 * Service para gestión de antecedentes médicos estructurados
 */
const prisma = require('../db/prisma');
const { ValidationError, NotFoundError } = require('../utils/errors');

class AntecedenteService {
  // ================================
  // ANTECEDENTES PATOLÓGICOS
  // ================================
  async getPatologicos(pacienteId) {
    return prisma.antecedentePatologico.findMany({
      where: { pacienteId, activo: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createPatologico(data) {
    const defaults = {
      ...data,
      observaciones: data.observaciones?.trim() || 'No manifiesta antecedentes patológicos',
      enTratamiento: data.enTratamiento ?? false,
    };
    return prisma.antecedentePatologico.create({ data: defaults });
  }

  async updatePatologico(id, data) {
    const existing = await prisma.antecedentePatologico.findUnique({ where: { id } });
    if (!existing) throw new NotFoundError('Antecedente patológico no encontrado');
    return prisma.antecedentePatologico.update({ where: { id }, data });
  }

  async deletePatologico(id) {
    return prisma.antecedentePatologico.update({
      where: { id },
      data: { activo: false },
    });
  }

  // ================================
  // ANTECEDENTES QUIRÚRGICOS
  // ================================
  async getQuirurgicos(pacienteId) {
    return prisma.antecedenteQuirurgico.findMany({
      where: { pacienteId, activo: true },
      orderBy: { fecha: 'desc' },
    });
  }

  async createQuirurgico(data) {
    const defaults = {
      ...data,
      observaciones: data.observaciones?.trim() || 'No refiere antecedentes quirúrgicos',
      complicaciones: data.complicaciones?.trim() || 'Sin complicaciones reportadas',
    };
    return prisma.antecedenteQuirurgico.create({ data: defaults });
  }

  async updateQuirurgico(id, data) {
    const existing = await prisma.antecedenteQuirurgico.findUnique({ where: { id } });
    if (!existing) throw new NotFoundError('Antecedente quirúrgico no encontrado');
    return prisma.antecedenteQuirurgico.update({ where: { id }, data });
  }

  async deleteQuirurgico(id) {
    return prisma.antecedenteQuirurgico.update({
      where: { id },
      data: { activo: false },
    });
  }

  // ================================
  // ANTECEDENTES ALÉRGICOS
  // ================================
  async getAlergicos(pacienteId) {
    return prisma.antecedenteAlergico.findMany({
      where: { pacienteId, activo: true },
      orderBy: { severidad: 'desc' },
    });
  }

  async createAlergico(data) {
    const defaults = {
      ...data,
      observaciones: data.observaciones?.trim() || 'No refiere alergias conocidas',
      confirmada: data.confirmada ?? false,
    };
    return prisma.antecedenteAlergico.create({ data: defaults });
  }

  async updateAlergico(id, data) {
    const existing = await prisma.antecedenteAlergico.findUnique({ where: { id } });
    if (!existing) throw new NotFoundError('Antecedente alérgico no encontrado');
    return prisma.antecedenteAlergico.update({ where: { id }, data });
  }

  async deleteAlergico(id) {
    return prisma.antecedenteAlergico.update({
      where: { id },
      data: { activo: false },
    });
  }

  // ================================
  // ANTECEDENTES FAMILIARES
  // ================================
  async getFamiliares(pacienteId) {
    return prisma.antecedenteFamiliar.findMany({
      where: { pacienteId, activo: true },
      orderBy: { parentesco: 'asc' },
    });
  }

  async createFamiliar(data) {
    const defaults = {
      ...data,
      observaciones: data.observaciones?.trim() || 'No refiere antecedentes familiares relevantes',
    };
    return prisma.antecedenteFamiliar.create({ data: defaults });
  }

  async updateFamiliar(id, data) {
    const existing = await prisma.antecedenteFamiliar.findUnique({ where: { id } });
    if (!existing) throw new NotFoundError('Antecedente familiar no encontrado');
    return prisma.antecedenteFamiliar.update({ where: { id }, data });
  }

  async deleteFamiliar(id) {
    return prisma.antecedenteFamiliar.update({
      where: { id },
      data: { activo: false },
    });
  }

  // ================================
  // ANTECEDENTES FARMACOLÓGICOS
  // ================================
  async getFarmacologicos(pacienteId) {
    return prisma.antecedenteFarmacologico.findMany({
      where: { pacienteId, activo: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createFarmacologico(data) {
    const defaults = {
      ...data,
      observaciones: data.observaciones?.trim() || 'No refiere medicamentos actuales',
      activo: data.activo ?? true,
    };
    return prisma.antecedenteFarmacologico.create({ data: defaults });
  }

  async updateFarmacologico(id, data) {
    const existing = await prisma.antecedenteFarmacologico.findUnique({ where: { id } });
    if (!existing) throw new NotFoundError('Antecedente farmacológico no encontrado');
    return prisma.antecedenteFarmacologico.update({ where: { id }, data });
  }

  async deleteFarmacologico(id) {
    return prisma.antecedenteFarmacologico.update({
      where: { id },
      data: { activo: false },
    });
  }

  // ================================
  // ANTECEDENTES GINECO-OBSTÉTRICOS
  // ================================
  async getGinecoObstetrico(pacienteId) {
    return prisma.antecedenteGinecoObstetrico.findUnique({
      where: { pacienteId },
    });
  }

  async upsertGinecoObstetrico(pacienteId, data) {
    const defaults = {
      ...data,
      observaciones: data.observaciones?.trim() || 'No refiere antecedentes gineco-obstétricos significativos',
      gestas: data.gestas ?? 0,
      partos: data.partos ?? 0,
      cesareas: data.cesareas ?? 0,
      abortos: data.abortos ?? 0,
    };

    return prisma.antecedenteGinecoObstetrico.upsert({
      where: { pacienteId },
      update: defaults,
      create: { pacienteId, ...defaults },
    });
  }

  // ================================
  // OBTENER TODOS LOS ANTECEDENTES
  // ================================
  async getAllByPaciente(pacienteId) {
    const [patologicos, quirurgicos, alergicos, familiares, farmacologicos, ginecoObstetrico] = await Promise.all([
      this.getPatologicos(pacienteId),
      this.getQuirurgicos(pacienteId),
      this.getAlergicos(pacienteId),
      this.getFamiliares(pacienteId),
      this.getFarmacologicos(pacienteId),
      this.getGinecoObstetrico(pacienteId),
    ]);

    return {
      patologicos,
      quirurgicos,
      alergicos,
      familiares,
      farmacologicos,
      ginecoObstetrico,
    };
  }
}

module.exports = new AntecedenteService();
