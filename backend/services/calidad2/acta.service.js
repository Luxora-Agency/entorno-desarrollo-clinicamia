const prisma = require('../../db/prisma');
const { NotFoundError, ValidationError } = require('../../utils/errors');
const { safeDate } = require('../../utils/date');
const PDFDocument = require('pdfkit');

const TIPOS_REUNION_LABELS = {
  COMITE: 'Comité',
  AUDITORIA: 'Auditoría',
  REUNION_INTERNA: 'Reunión interna',
  CAPACITACION: 'Capacitación',
  REUNION_PERSONAL: 'Reunión Personal',
  JUNTA_DIRECTIVA: 'Junta Directiva',
  REUNION_CLIENTE_PROVEEDOR: 'Reunión con cliente y/o proveedores',
  VISITA_ENTES_REGULADORES: 'Visita entes reguladores',
  OTRO: 'Otro'
};

class ActaService {
  async findAll(query = {}) {
    const { tipo, fechaDesde, fechaHasta, page = 1, limit = 20, search } = query;

    const where = {};

    if (tipo) {
      where.tiposReunion = { has: tipo };
    }

    if (fechaDesde || fechaHasta) {
      where.fecha = {};
      if (fechaDesde) {
        const date = safeDate(fechaDesde);
        if (date) where.fecha.gte = date;
      }
      if (fechaHasta) {
        const date = safeDate(fechaHasta);
        if (date) where.fecha.lte = date;
      }
    }

    if (search) {
      where.OR = [
        { objetivo: { contains: search, mode: 'insensitive' } },
        { lugar: { contains: search, mode: 'insensitive' } }
      ];
    }

    const [actas, total] = await Promise.all([
      prisma.actaReunion.findMany({
        where,
        include: {
          sesion: {
            select: {
              id: true,
              capacitacion: {
                select: { id: true, tema: true }
              }
            }
          },
          _count: { select: { asistentes: true } }
        },
        orderBy: { numero: 'desc' },
        skip: (page - 1) * limit,
        take: parseInt(limit)
      }),
      prisma.actaReunion.count({ where })
    ]);

    return {
      actas,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  async findById(id) {
    const acta = await prisma.actaReunion.findUnique({
      where: { id },
      include: {
        sesion: {
          include: {
            capacitacion: {
              select: { id: true, tema: true, actividad: true }
            },
            respuestasEvaluacion: {
              include: {
                pregunta: {
                  include: { evaluacion: { select: { tipo: true } } }
                }
              }
            }
          }
        },
        asistentes: {
          include: {
            personal: { select: { id: true, nombreCompleto: true, cargo: true } }
          },
          orderBy: { nombreCompleto: 'asc' }
        }
      }
    });

    if (!acta) {
      throw new NotFoundError('Acta no encontrada');
    }

    return acta;
  }

  async getSiguienteNumero() {
    const maxNumero = await prisma.actaReunion.aggregate({
      _max: { numero: true }
    });

    return (maxNumero._max.numero || 0) + 1;
  }

  async create(data, userId) {
    const numero = await this.getSiguienteNumero();

    const { asistentes, ...actaData } = data;

    return prisma.actaReunion.create({
      data: {
        ...actaData,
        numero,
        creadoPor: userId,
        asistentes: asistentes ? {
          create: asistentes.map(a => ({
            personalId: a.personalId || null,
            nombreCompleto: a.nombreCompleto,
            cargo: a.cargo || null,
            firmaUrl: a.firmaUrl || null
          }))
        } : undefined
      },
      include: {
        asistentes: true
      }
    });
  }

  async update(id, data) {
    const existing = await prisma.actaReunion.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundError('Acta no encontrada');
    }

    const { asistentes, ...actaData } = data;

    return prisma.actaReunion.update({
      where: { id },
      data: actaData,
      include: {
        asistentes: true
      }
    });
  }

  async delete(id) {
    const existing = await prisma.actaReunion.findUnique({
      where: { id },
      include: { sesion: true }
    });

    if (!existing) {
      throw new NotFoundError('Acta no encontrada');
    }

    if (existing.sesion) {
      throw new ValidationError('No se puede eliminar un acta vinculada a una sesión de capacitación');
    }

    // Delete asistentes first, then acta
    await prisma.asistenteActa.deleteMany({ where: { actaId: id } });
    return prisma.actaReunion.delete({ where: { id } });
  }

  // ==========================================
  // ASISTENTES
  // ==========================================

  async addAsistente(actaId, data) {
    const acta = await prisma.actaReunion.findUnique({ where: { id: actaId } });
    if (!acta) {
      throw new NotFoundError('Acta no encontrada');
    }

    return prisma.asistenteActa.create({
      data: {
        actaId,
        personalId: data.personalId || null,
        nombreCompleto: data.nombreCompleto,
        cargo: data.cargo || null,
        firmaUrl: data.firmaUrl || null
      }
    });
  }

  async updateAsistente(actaId, asistenteId, data) {
    const asistente = await prisma.asistenteActa.findFirst({
      where: { id: asistenteId, actaId }
    });

    if (!asistente) {
      throw new NotFoundError('Asistente no encontrado');
    }

    return prisma.asistenteActa.update({
      where: { id: asistenteId },
      data: {
        nombreCompleto: data.nombreCompleto,
        cargo: data.cargo,
        firmaUrl: data.firmaUrl
      }
    });
  }

  async removeAsistente(actaId, asistenteId) {
    const asistente = await prisma.asistenteActa.findFirst({
      where: { id: asistenteId, actaId }
    });

    if (!asistente) {
      throw new NotFoundError('Asistente no encontrado');
    }

    return prisma.asistenteActa.delete({ where: { id: asistenteId } });
  }

  // ==========================================
  // PDF GENERATION
  // ==========================================

  async generatePDF(id) {
    const acta = await this.findById(id);

    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: 'LETTER',
          margins: { top: 50, bottom: 50, left: 50, right: 50 }
        });

        const chunks = [];
        doc.on('data', chunk => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        // Header
        doc.fontSize(16).font('Helvetica-Bold')
          .text(`ACTA DE REUNIÓN N° ${acta.numero}`, { align: 'center' });
        doc.moveDown();

        // Tipo de reunión
        doc.fontSize(10).font('Helvetica-Bold').text('TIPO DE REUNIÓN:');
        doc.font('Helvetica').text(
          acta.tiposReunion.map(t => TIPOS_REUNION_LABELS[t] || t).join(', ') +
          (acta.tipoOtro ? ` - ${acta.tipoOtro}` : '')
        );
        doc.moveDown(0.5);

        // Datos generales
        doc.font('Helvetica-Bold').text('OBJETIVO:');
        doc.font('Helvetica').text(acta.objetivo);
        doc.moveDown(0.5);

        const fecha = new Date(acta.fecha).toLocaleDateString('es-CO', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
        doc.font('Helvetica-Bold').text('FECHA: ', { continued: true });
        doc.font('Helvetica').text(fecha);

        doc.font('Helvetica-Bold').text('HORA: ', { continued: true });
        doc.font('Helvetica').text(`${acta.horaInicio} - ${acta.horaFin}`);

        doc.font('Helvetica-Bold').text('LUGAR: ', { continued: true });
        doc.font('Helvetica').text(acta.lugar);
        doc.moveDown();

        // Temas a tratar
        if (acta.temasTratar && acta.temasTratar.length > 0) {
          doc.font('Helvetica-Bold').text('TEMAS A TRATAR:');
          acta.temasTratar.forEach((tema, i) => {
            doc.font('Helvetica').text(`${i + 1}. ${tema}`);
          });
          doc.moveDown();
        }

        // Compromisos anteriores
        if (acta.compromisosAnteriores && acta.compromisosAnteriores.length > 0) {
          doc.font('Helvetica-Bold').text('COMPROMISOS ACTA ANTERIOR:');
          doc.moveDown(0.3);

          const tableTop = doc.y;
          const col1 = 50;
          const col2 = 400;
          const colWidth1 = 340;
          const colWidth2 = 100;

          // Header row
          doc.rect(col1, tableTop, colWidth1, 20).stroke();
          doc.rect(col2, tableTop, colWidth2, 20).stroke();
          doc.font('Helvetica-Bold').fontSize(9);
          doc.text('Compromiso', col1 + 5, tableTop + 5, { width: colWidth1 - 10 });
          doc.text('Cumplió', col2 + 5, tableTop + 5, { width: colWidth2 - 10, align: 'center' });

          let currentY = tableTop + 20;
          doc.font('Helvetica').fontSize(9);

          acta.compromisosAnteriores.forEach(comp => {
            const textHeight = doc.heightOfString(comp.descripcion, { width: colWidth1 - 10 });
            const rowHeight = Math.max(textHeight + 10, 20);

            doc.rect(col1, currentY, colWidth1, rowHeight).stroke();
            doc.rect(col2, currentY, colWidth2, rowHeight).stroke();
            doc.text(comp.descripcion, col1 + 5, currentY + 5, { width: colWidth1 - 10 });
            doc.text(comp.cumplio || 'N/A', col2 + 5, currentY + 5, { width: colWidth2 - 10, align: 'center' });

            currentY += rowHeight;
          });

          doc.y = currentY + 10;
          doc.moveDown();
        }

        // Desarrollo de la reunión
        if (acta.desarrolloReunion) {
          doc.font('Helvetica-Bold').fontSize(10).text('DESARROLLO DE LA REUNIÓN:');
          doc.font('Helvetica').text(acta.desarrolloReunion.replace(/<[^>]*>/g, ''));
          doc.moveDown();
        }

        // Análisis de evaluación
        if (acta.analisisEvaluacion) {
          doc.font('Helvetica-Bold').text('ANÁLISIS PRE-TEST VS POST-TEST:');
          doc.moveDown(0.3);

          const analisis = acta.analisisEvaluacion;
          if (analisis.preTest) {
            doc.font('Helvetica').text(
              `Pre-Test: ${analisis.preTest.correctas} de ${analisis.preTest.total} correctas (${analisis.preTest.porcentaje}%)`
            );
          }
          if (analisis.postTest) {
            doc.font('Helvetica').text(
              `Post-Test: ${analisis.postTest.correctas} de ${analisis.postTest.total} correctas (${analisis.postTest.porcentaje}%)`
            );
          }
          doc.moveDown();
        }

        // Informe de adherencia
        if (acta.informeAdherencia) {
          doc.font('Helvetica-Bold').text('INFORME DE ADHERENCIA:');
          doc.font('Helvetica').text(acta.informeAdherencia.replace(/<[^>]*>/g, ''));
          doc.moveDown();
        }

        // Compromisos siguientes
        if (acta.compromisosSiguientes && acta.compromisosSiguientes.length > 0) {
          doc.font('Helvetica-Bold').text('COMPROMISOS PRÓXIMA ACTA:');
          doc.moveDown(0.3);

          acta.compromisosSiguientes.forEach((comp, i) => {
            doc.font('Helvetica').text(
              `${i + 1}. ${comp.descripcion} - Encargado: ${comp.encargado || 'N/A'} - Fecha: ${comp.fechaEntrega || 'N/A'}`
            );
          });
          doc.moveDown();
        }

        // Asistentes
        if (acta.asistentes && acta.asistentes.length > 0) {
          doc.addPage();
          doc.font('Helvetica-Bold').fontSize(12).text('ASISTENTES:', { align: 'center' });
          doc.moveDown();

          const tableTop = doc.y;
          const col1 = 50;
          const col2 = 200;
          const col3 = 320;
          const colWidth1 = 150;
          const colWidth2 = 120;
          const colWidth3 = 180;

          // Header row
          doc.rect(col1, tableTop, colWidth1, 20).stroke();
          doc.rect(col2, tableTop, colWidth2, 20).stroke();
          doc.rect(col3, tableTop, colWidth3, 20).stroke();
          doc.font('Helvetica-Bold').fontSize(9);
          doc.text('Nombre', col1 + 5, tableTop + 5);
          doc.text('Cargo', col2 + 5, tableTop + 5);
          doc.text('Firma', col3 + 5, tableTop + 5);

          let currentY = tableTop + 20;
          doc.font('Helvetica').fontSize(9);

          for (const asistente of acta.asistentes) {
            const rowHeight = 40;

            doc.rect(col1, currentY, colWidth1, rowHeight).stroke();
            doc.rect(col2, currentY, colWidth2, rowHeight).stroke();
            doc.rect(col3, currentY, colWidth3, rowHeight).stroke();

            doc.text(asistente.nombreCompleto, col1 + 5, currentY + 5, { width: colWidth1 - 10 });
            doc.text(asistente.cargo || '', col2 + 5, currentY + 5, { width: colWidth2 - 10 });

            // Include signature if available
            if (asistente.firmaUrl) {
              try {
                doc.image(asistente.firmaUrl, col3 + 5, currentY + 2, {
                  width: colWidth3 - 10,
                  height: rowHeight - 4,
                  fit: [colWidth3 - 10, rowHeight - 4]
                });
              } catch (e) {
                doc.text('[Firma]', col3 + 5, currentY + 15, { width: colWidth3 - 10, align: 'center' });
              }
            }

            currentY += rowHeight;

            if (currentY > 700) {
              doc.addPage();
              currentY = 50;
            }
          }
        }

        // Footer
        doc.fontSize(8).text(
          `Generado el ${new Date().toLocaleString('es-CO')}`,
          50, doc.page.height - 50,
          { align: 'center' }
        );

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  // ==========================================
  // ESTADÍSTICAS
  // ==========================================

  async getStats(query = {}) {
    const { fechaDesde, fechaHasta } = query;

    const where = {};
    if (fechaDesde || fechaHasta) {
      where.fecha = {};
      if (fechaDesde) {
        const date = safeDate(fechaDesde);
        if (date) where.fecha.gte = date;
      }
      if (fechaHasta) {
        const date = safeDate(fechaHasta);
        if (date) where.fecha.lte = date;
      }
    }

    // Obtener total y actas con sus tipos
    const [total, actas] = await Promise.all([
      prisma.actaReunion.count({ where }),
      prisma.actaReunion.findMany({
        where,
        select: { tiposReunion: true }
      })
    ]);

    // Contar tipos de reunión manualmente
    const tipoCounts = {};
    actas.forEach(acta => {
      acta.tiposReunion.forEach(tipo => {
        tipoCounts[tipo] = (tipoCounts[tipo] || 0) + 1;
      });
    });

    // Convertir a array y ordenar por cantidad
    const porTipo = Object.entries(tipoCounts)
      .map(([tipo, count]) => ({
        tipo,
        label: TIPOS_REUNION_LABELS[tipo] || tipo,
        count
      }))
      .sort((a, b) => b.count - a.count);

    return {
      total,
      porTipo
    };
  }
}

module.exports = new ActaService();
