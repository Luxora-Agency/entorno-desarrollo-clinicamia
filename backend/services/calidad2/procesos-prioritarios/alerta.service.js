const prisma = require('../../../db/prisma');
const { ValidationError, NotFoundError } = require('../../../utils/errors');

class AlertaService {
  async findAll(query = {}) {
    const { page = 1, limit = 50, tipo = '', prioridad = '', atendida = '', sortBy = 'fechaAlerta', sortOrder = 'desc' } = query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);
    const where = { activo: true };
    if (tipo) where.tipo = tipo;
    if (prioridad) where.prioridad = prioridad;
    if (atendida !== '') where.atendida = atendida === 'true';

    const [alertas, total] = await Promise.all([
      prisma.alertaProcesosPrioritarios.findMany({ where, include: { atendedor: { select: { id: true, nombre: true, apellido: true } } }, skip, take, orderBy: { [sortBy]: sortOrder } }),
      prisma.alertaProcesosPrioritarios.count({ where }),
    ]);

    return { data: alertas, pagination: { page: parseInt(page), limit: parseInt(limit), total, totalPages: Math.ceil(total / parseInt(limit)) } };
  }

  async findActivas() {
    const alertas = await prisma.alertaProcesosPrioritarios.findMany({ where: { activo: true, atendida: false }, orderBy: [{ prioridad: 'asc' }, { fechaAlerta: 'desc' }] });
    return alertas;
  }

  async atenderAlerta(id, observaciones, userId) {
    const alerta = await prisma.alertaProcesosPrioritarios.findUnique({ where: { id } });
    if (!alerta) throw new NotFoundError('Alerta no encontrada');
    if (alerta.atendida) throw new ValidationError('Esta alerta ya fue atendida');

    const updated = await prisma.alertaProcesosPrioritarios.update({ where: { id }, data: { atendida: true, atendidoPor: userId, fechaAtencion: new Date(), observacionesAtencion: observaciones }, include: { atendedor: { select: { id: true, nombre: true, apellido: true } } } });
    return updated;
  }

  async generarTodasAlertas() {
    let generadas = 0;

    // 1. Eventos adversos sin analizar (>7 días)
    const eventosAdversosSinAnalizar = await prisma.eventoAdversoPP.findMany({ where: { activo: true, analisisRealizado: false, estado: { not: 'CERRADO' }, fechaEvento: { lte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } } });
    for (const evento of eventosAdversosSinAnalizar) {
      await prisma.alertaProcesosPrioritarios.upsert({
        where: { moduloOrigen_entityType_entityId: { moduloOrigen: 'PROCESOS_PRIORITARIOS', entityType: 'EventoAdversoPP', entityId: evento.id } },
        create: { tipo: 'EVENTO_ADVERSO_PENDIENTE', prioridad: 'ALTA', titulo: 'Evento adverso sin analizar', descripcion: `El evento ${evento.codigo} no ha sido analizado después de 7 días`, moduloOrigen: 'PROCESOS_PRIORITARIOS', submodulo: 'SEGURIDAD', entityType: 'EventoAdversoPP', entityId: evento.id },
        update: { fechaAlerta: new Date() }
      });
      generadas++;
    }

    // 2. GPCs próximas a revisión (30 días)
    const gpcsPorRevisar = await prisma.guiaPracticaClinica.findMany({ where: { activo: true, estado: 'VIGENTE', proximaRevision: { lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) } } });
    for (const gpc of gpcsPorRevisar) {
      await prisma.alertaProcesosPrioritarios.upsert({
        where: { moduloOrigen_entityType_entityId: { moduloOrigen: 'PROCESOS_PRIORITARIOS', entityType: 'GuiaPracticaClinica', entityId: gpc.id } },
        create: { tipo: 'GPC_REVISION', prioridad: 'MEDIA', titulo: 'GPC próxima a revisión', descripcion: `La GPC ${gpc.codigo} debe revisarse pronto`, moduloOrigen: 'PROCESOS_PRIORITARIOS', submodulo: 'GPC', entityType: 'GuiaPracticaClinica', entityId: gpc.id },
        update: { fechaAlerta: new Date() }
      });
      generadas++;
    }

    // 3. PQRSF vencidas
    const pqrsfVencidas = await prisma.pQRSF.findMany({ where: { activo: true, estado: { in: ['RADICADA', 'EN_GESTION'] }, fechaRespuestaEsperada: { lt: new Date() } } });
    for (const pqrsf of pqrsfVencidas) {
      await prisma.alertaProcesosPrioritarios.upsert({
        where: { moduloOrigen_entityType_entityId: { moduloOrigen: 'PROCESOS_PRIORITARIOS', entityType: 'PQRSF', entityId: pqrsf.id } },
        create: { tipo: 'PQRSF_VENCIDA', prioridad: 'CRITICA', titulo: 'PQRSF vencida sin responder', descripcion: `La PQRSF ${pqrsf.codigo} está vencida`, moduloOrigen: 'PROCESOS_PRIORITARIOS', submodulo: 'SIAU', entityType: 'PQRSF', entityId: pqrsf.id },
        update: { fechaAlerta: new Date() }
      });
      generadas++;
    }

    // 4. Actas pendientes (>7 días después de reunión)
    const actasPendientes = await prisma.cronogramaComite.findMany({ where: { activo: true, estado: 'PROGRAMADA', fechaProgramada: { lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } }, include: { comite: true } });
    for (const cronograma of actasPendientes) {
      await prisma.alertaProcesosPrioritarios.upsert({
        where: { moduloOrigen_entityType_entityId: { moduloOrigen: 'PROCESOS_PRIORITARIOS', entityType: 'CronogramaComite', entityId: cronograma.id } },
        create: { tipo: 'ACTA_PENDIENTE', prioridad: 'ALTA', titulo: 'Acta de comité pendiente', descripcion: `Falta acta del comité ${cronograma.comite.nombre}`, moduloOrigen: 'PROCESOS_PRIORITARIOS', submodulo: 'COMITES', entityType: 'CronogramaComite', entityId: cronograma.id },
        update: { fechaAlerta: new Date() }
      });
      generadas++;
    }

    return { generadas };
  }

  async getEstadisticas() {
    const [total, porTipo, porPrioridad, atendidas, pendientes, criticas] = await Promise.all([
      prisma.alertaProcesosPrioritarios.count({ where: { activo: true } }),
      prisma.alertaProcesosPrioritarios.groupBy({ by: ['tipo'], where: { activo: true }, _count: true }),
      prisma.alertaProcesosPrioritarios.groupBy({ by: ['prioridad'], where: { activo: true }, _count: true }),
      prisma.alertaProcesosPrioritarios.count({ where: { activo: true, atendida: true } }),
      prisma.alertaProcesosPrioritarios.count({ where: { activo: true, atendida: false } }),
      prisma.alertaProcesosPrioritarios.count({ where: { activo: true, atendida: false, prioridad: 'CRITICA' } }),
    ]);

    return { total, porTipo: porTipo.reduce((acc, item) => { acc[item.tipo] = item._count; return acc; }, {}), porPrioridad: porPrioridad.reduce((acc, item) => { acc[item.prioridad] = item._count; return acc; }, {}), atendidas, pendientes, criticas };
  }
}

module.exports = new AlertaService();
