const prisma = require('../../db/prisma');
const { NotFoundError, ValidationError } = require('../../utils/errors');
const { safeDate } = require('../../utils/date');
const PDFDocument = require('pdfkit');
const openRouterService = require('../openrouter.service');
const path = require('path');
const fs = require('fs');

// Ruta al logo de la clínica
const LOGO_PATH = path.join(__dirname, '../../assets/clinica-mia-logo.png');

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

// Colores de marca Clínica MÍA
const COLORS = {
  primary: '#0d9488',
  primaryDark: '#0f766e',
  accent: '#2dd4bf',
  text: '#1e293b',
  textLight: '#475569',
  textMuted: '#64748b',
  border: '#e2e8f0',
  headerBg: '#f0fdfa',
  white: '#ffffff',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
};

// Información institucional
const CLINICA_INFO = {
  nombre: 'CLINICA MIA MEDICINA INTEGRAL SAS',
  nit: '901497975-7',
  codigoHabilitacion: '7300103424',
  tipoEntidad: 'IPS',
  direccion: 'Avenida Ferrocarril 41-23',
  ciudad: 'Ibagué, Tolima',
  telefono: '(608) 324 333 8555',
  email: 'infoclinicamia@gmail.com',
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
              include: {
                categoria: { select: { id: true, nombre: true } },
                responsable: { select: { id: true, nombre: true, apellido: true } },
                evaluaciones: {
                  where: { activo: true },
                  select: { id: true, tipo: true, nombre: true }
                }
              }
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

    // Si tiene sesión, calcular resultados de evaluaciones por participante
    if (acta.sesion && acta.sesion.respuestasEvaluacion?.length > 0) {
      const participantesMap = {};

      for (const respuesta of acta.sesion.respuestasEvaluacion) {
        const key = respuesta.nombreParticipante || respuesta.participanteId;
        if (!key) continue;

        if (!participantesMap[key]) {
          participantesMap[key] = {
            nombre: respuesta.nombreParticipante,
            preTest: { correctas: 0, total: 0, puntaje: 0 },
            postTest: { correctas: 0, total: 0, puntaje: 0 }
          };
        }

        const tipo = respuesta.pregunta.evaluacion.tipo === 'PRE_TEST' ? 'preTest' : 'postTest';
        participantesMap[key][tipo].total++;
        if (respuesta.esCorrecta) {
          participantesMap[key][tipo].correctas++;
          participantesMap[key][tipo].puntaje += respuesta.puntaje || 0;
        }
      }

      // Calcular porcentajes
      acta.resultadosEvaluaciones = Object.values(participantesMap).map(p => ({
        ...p,
        preTest: {
          ...p.preTest,
          porcentaje: p.preTest.total > 0 ? Math.round((p.preTest.correctas / p.preTest.total) * 100) : null
        },
        postTest: {
          ...p.postTest,
          porcentaje: p.postTest.total > 0 ? Math.round((p.postTest.correctas / p.postTest.total) * 100) : null
        },
        mejora: p.preTest.total > 0 && p.postTest.total > 0
          ? Math.round((p.postTest.correctas / p.postTest.total) * 100) - Math.round((p.preTest.correctas / p.preTest.total) * 100)
          : null,
        puntajeTotal: p.preTest.puntaje + p.postTest.puntaje
      })).sort((a, b) => b.puntajeTotal - a.puntajeTotal);
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

  drawHeader(doc, titulo, subtitulo) {
    const pageWidth = doc.page.width - 100;
    const logoSize = 45;
    const logoX = 55;
    const logoY = 12;

    // Barra superior decorativa
    doc.rect(0, 0, doc.page.width, 6).fill(COLORS.primary);
    doc.rect(0, 6, doc.page.width, 2).fill(COLORS.accent);

    // Encabezado institucional
    const headerY = 15;
    const headerHeight = 55;
    doc.rect(50, headerY, pageWidth, headerHeight).fill(COLORS.primary);

    // Logo
    let logoMostrado = false;
    try {
      if (fs.existsSync(LOGO_PATH)) {
        doc.image(LOGO_PATH, logoX, logoY + 5, {
          width: logoSize,
          height: logoSize,
          fit: [logoSize, logoSize]
        });
        logoMostrado = true;
      }
    } catch (e) {
      console.log('Error cargando logo:', e.message);
    }

    // Si no hay logo, mostrar placeholder
    if (!logoMostrado) {
      doc.circle(logoX + logoSize/2, logoY + headerHeight/2, 18).fill(COLORS.white);
      doc.fontSize(14).font('Helvetica-Bold').fillColor(COLORS.primary)
         .text('CM', logoX + 10, logoY + headerHeight/2 - 5);
    }

    // Info institucional (al lado del logo)
    const textStartX = logoX + logoSize + 12;
    const textWidth = pageWidth - logoSize - 30;

    doc.fillColor(COLORS.white).fontSize(11).font('Helvetica-Bold')
       .text(CLINICA_INFO.nombre, textStartX, headerY + 8, { width: textWidth });

    doc.fontSize(7).font('Helvetica').fillColor(COLORS.accent)
       .text(`NIT: ${CLINICA_INFO.nit} | Código Habilitación: ${CLINICA_INFO.codigoHabilitacion} | ${CLINICA_INFO.tipoEntidad}`, textStartX, headerY + 24);

    doc.fillColor('#e0f2f1').fontSize(7)
       .text(`${CLINICA_INFO.direccion}, ${CLINICA_INFO.ciudad}`, textStartX, headerY + 35)
       .text(`Tel: ${CLINICA_INFO.telefono} | ${CLINICA_INFO.email}`, textStartX, headerY + 45);

    // Título del documento
    let y = headerY + headerHeight + 5;
    doc.rect(50, y, pageWidth, 24).fill(COLORS.headerBg);

    doc.fillColor(COLORS.primary).fontSize(13).font('Helvetica-Bold')
       .text(titulo, 58, y + 6);

    if (subtitulo) {
      doc.fontSize(9).font('Helvetica').fillColor(COLORS.textMuted)
         .text(subtitulo, 50 + pageWidth - 160, y + 7, { width: 150, align: 'right' });
    }

    return y + 32;
  }

  drawSectionTitle(doc, titulo, y) {
    const pageWidth = doc.page.width - 100;
    // Línea decorativa izquierda
    doc.rect(50, y, 4, 20).fill(COLORS.primary);
    doc.rect(54, y, pageWidth - 4, 20).fill(COLORS.headerBg);
    doc.fillColor(COLORS.primary).fontSize(10).font('Helvetica-Bold')
       .text(titulo, 62, y + 5);
    return y + 26;
  }

  checkPageBreak(doc, neededSpace = 100) {
    if (doc.y > doc.page.height - 80 - neededSpace) {
      doc.addPage();
      doc.y = 50;
      return true;
    }
    return false;
  }

  async generatePDF(id) {
    const acta = await this.findById(id);

    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: 'LETTER',
          margins: { top: 50, bottom: 60, left: 50, right: 50 },
          bufferPages: true
        });

        const chunks = [];
        doc.on('data', chunk => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        const pageWidth = doc.page.width - 100;
        const marginLeft = 50;

        // === PÁGINA 1: INFORMACIÓN DEL ACTA ===
        doc.y = this.drawHeader(doc, `ACTA DE REUNIÓN N° ${acta.numero}`,
          acta.fecha ? new Date(acta.fecha).toLocaleDateString('es-CO') : '');

        // Tipo de reunión
        doc.fillColor(COLORS.text).fontSize(9).font('Helvetica-Bold')
           .text('Tipo de Reunión: ', marginLeft, doc.y, { continued: true });
        const tiposText = (acta.tiposReunion || []).map(t => TIPOS_REUNION_LABELS[t] || t).join(', ') +
          (acta.tipoOtro ? ` - ${acta.tipoOtro}` : '') || '-';
        doc.font('Helvetica').text(tiposText, { width: pageWidth - 100 });
        doc.moveDown(0.5);

        // === INFORMACIÓN GENERAL ===
        doc.y = this.drawSectionTitle(doc, 'INFORMACIÓN GENERAL', doc.y);

        doc.fillColor(COLORS.text).fontSize(9);
        doc.font('Helvetica-Bold').text('Objetivo: ', marginLeft, doc.y, { continued: true });
        doc.font('Helvetica').text(acta.objetivo || '-', { width: pageWidth - 50 });
        doc.moveDown(0.3);

        const fecha = acta.fecha ? new Date(acta.fecha).toLocaleDateString('es-CO', {
          weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
        }) : '-';
        doc.font('Helvetica-Bold').text('Fecha: ', marginLeft, doc.y, { continued: true });
        doc.font('Helvetica').text(fecha);
        doc.moveDown(0.2);

        doc.font('Helvetica-Bold').text('Horario: ', marginLeft, doc.y, { continued: true });
        doc.font('Helvetica').text(`${acta.horaInicio || '-'} - ${acta.horaFin || '-'}`);
        doc.moveDown(0.2);

        doc.font('Helvetica-Bold').text('Lugar: ', marginLeft, doc.y, { continued: true });
        doc.font('Helvetica').text(acta.lugar || '-');
        doc.moveDown(0.8);

        // === INFORMACIÓN DE LA CAPACITACIÓN ===
        if (acta.sesion?.capacitacion) {
          const cap = acta.sesion.capacitacion;

          if (doc.y > doc.page.height - 200) {
            doc.addPage();
            doc.y = 50;
          }

          doc.y = this.drawSectionTitle(doc, 'INFORMACIÓN DE LA CAPACITACIÓN', doc.y);

          // Tema
          doc.fillColor(COLORS.textMuted).fontSize(7).text('TEMA', marginLeft, doc.y);
          doc.fillColor(COLORS.primary).fontSize(11).font('Helvetica-Bold')
             .text(cap.tema || '-', marginLeft, doc.y + 10, { width: pageWidth });
          doc.moveDown(0.8);

          // Actividad
          if (cap.actividad) {
            doc.fillColor(COLORS.text).fontSize(9).font('Helvetica-Bold')
               .text('Actividad: ', marginLeft, doc.y, { continued: true });
            doc.font('Helvetica').text(cap.actividad, { width: pageWidth - 60 });
            doc.moveDown(0.5);
          }

          // Detalles en línea
          const detalles = [];
          if (cap.categoria?.nombre) detalles.push(`Categoría: ${cap.categoria.nombre}`);
          if (cap.responsable) detalles.push(`Responsable: ${cap.responsable.nombre} ${cap.responsable.apellido}`);
          if (cap.duracionMinutos) detalles.push(`Duración: ${cap.duracionMinutos} min`);

          if (detalles.length > 0) {
            doc.fillColor(COLORS.textLight).fontSize(8).font('Helvetica')
               .text(detalles.join('  |  '), marginLeft, doc.y, { width: pageWidth });
            doc.moveDown(0.5);
          }

          // Orientado a
          if (cap.orientadoA) {
            doc.fillColor(COLORS.text).fontSize(9).font('Helvetica-Bold')
               .text('Orientado a: ', marginLeft, doc.y, { continued: true });
            doc.font('Helvetica').text(cap.orientadoA, { width: pageWidth - 70 });
            doc.moveDown(0.8);
          }
        }

        // === RESULTADOS DE EVALUACIONES ===
        if (acta.resultadosEvaluaciones && acta.resultadosEvaluaciones.length > 0) {
          if (doc.y > doc.page.height - 180) {
            doc.addPage();
            doc.y = 50;
          }

          doc.y = this.drawSectionTitle(doc, `RESULTADOS DE EVALUACIONES (${acta.resultadosEvaluaciones.length} participantes)`, doc.y);

          // Tabla compacta
          const colWidths = [20, 160, 65, 65, 55, 50];
          const tableX = marginLeft;
          let tableY = doc.y;

          // Header
          doc.rect(tableX, tableY, pageWidth, 16).fill(COLORS.primary);
          doc.fillColor(COLORS.white).fontSize(7).font('Helvetica-Bold');
          const headers = ['#', 'Participante', 'Pre-Test', 'Post-Test', 'Mejora', 'Pts'];
          let xPos = tableX + 3;
          headers.forEach((h, i) => {
            doc.text(h, xPos, tableY + 5, { width: colWidths[i], align: i > 1 ? 'center' : 'left' });
            xPos += colWidths[i];
          });
          tableY += 16;

          // Filas
          doc.font('Helvetica').fontSize(7);
          acta.resultadosEvaluaciones.forEach((p, idx) => {
            if (tableY > doc.page.height - 80) {
              doc.addPage();
              tableY = 50;
            }

            const rowColor = idx % 2 === 0 ? '#ffffff' : '#f8fafc';
            doc.rect(tableX, tableY, pageWidth, 16).fill(rowColor);

            xPos = tableX + 3;
            doc.fillColor(COLORS.text).text(`${idx + 1}`, xPos, tableY + 5, { width: colWidths[0] });
            xPos += colWidths[0];

            doc.text(p.nombre || '-', xPos, tableY + 5, { width: colWidths[1] - 5 });
            xPos += colWidths[1];

            // Pre-Test
            if (p.preTest.porcentaje !== null) {
              const preColor = p.preTest.porcentaje >= 70 ? COLORS.success : p.preTest.porcentaje >= 50 ? COLORS.warning : COLORS.danger;
              doc.fillColor(preColor).text(`${p.preTest.porcentaje}% (${p.preTest.correctas}/${p.preTest.total})`, xPos, tableY + 5, { width: colWidths[2], align: 'center' });
            } else {
              doc.fillColor(COLORS.textMuted).text('-', xPos, tableY + 5, { width: colWidths[2], align: 'center' });
            }
            xPos += colWidths[2];

            // Post-Test
            if (p.postTest.porcentaje !== null) {
              const postColor = p.postTest.porcentaje >= 70 ? COLORS.success : p.postTest.porcentaje >= 50 ? COLORS.warning : COLORS.danger;
              doc.fillColor(postColor).text(`${p.postTest.porcentaje}% (${p.postTest.correctas}/${p.postTest.total})`, xPos, tableY + 5, { width: colWidths[3], align: 'center' });
            } else {
              doc.fillColor(COLORS.textMuted).text('-', xPos, tableY + 5, { width: colWidths[3], align: 'center' });
            }
            xPos += colWidths[3];

            // Mejora
            if (p.mejora !== null) {
              const mejoraColor = p.mejora > 0 ? COLORS.success : p.mejora < 0 ? COLORS.danger : COLORS.textMuted;
              doc.fillColor(mejoraColor).text(`${p.mejora > 0 ? '+' : ''}${p.mejora}%`, xPos, tableY + 5, { width: colWidths[4], align: 'center' });
            } else {
              doc.fillColor(COLORS.textMuted).text('-', xPos, tableY + 5, { width: colWidths[4], align: 'center' });
            }
            xPos += colWidths[4];

            // Puntaje
            doc.fillColor(COLORS.primary).font('Helvetica-Bold').text(`${p.puntajeTotal}`, xPos, tableY + 5, { width: colWidths[5], align: 'center' });
            doc.font('Helvetica');

            tableY += 16;
          });

          doc.y = tableY + 10;
        }

        // === TEMAS A TRATAR ===
        if (acta.temasTratar && acta.temasTratar.length > 0) {
          if (doc.y > doc.page.height - 100) {
            doc.addPage();
            doc.y = 50;
          }
          doc.y = this.drawSectionTitle(doc, 'TEMAS A TRATAR', doc.y);
          doc.fillColor(COLORS.text).fontSize(9).font('Helvetica');
          acta.temasTratar.forEach((tema, i) => {
            doc.text(`${i + 1}. ${tema}`, marginLeft + 8, doc.y, { width: pageWidth - 16 });
            doc.moveDown(0.2);
          });
          doc.moveDown(0.5);
        }

        // === COMPROMISOS ANTERIORES ===
        if (acta.compromisosAnteriores && acta.compromisosAnteriores.length > 0) {
          if (doc.y > doc.page.height - 100) {
            doc.addPage();
            doc.y = 50;
          }
          doc.y = this.drawSectionTitle(doc, 'COMPROMISOS DEL ACTA ANTERIOR', doc.y);
          acta.compromisosAnteriores.forEach((comp, i) => {
            const cumplioColor = comp.cumplio === 'SI' ? COLORS.success : comp.cumplio === 'NO' ? COLORS.danger : COLORS.textMuted;
            doc.fillColor(COLORS.text).fontSize(9).text(`${i + 1}. ${comp.descripcion} `, marginLeft + 8, doc.y, { continued: true, width: pageWidth - 60 });
            doc.fillColor(cumplioColor).text(`[${comp.cumplio || 'Pendiente'}]`);
            doc.moveDown(0.2);
          });
          doc.moveDown(0.5);
        }

        // === DESARROLLO DE LA REUNIÓN ===
        if (acta.desarrolloReunion) {
          if (doc.y > doc.page.height - 100) {
            doc.addPage();
            doc.y = 50;
          }
          doc.y = this.drawSectionTitle(doc, 'DESARROLLO DE LA REUNIÓN', doc.y);
          doc.fillColor(COLORS.text).fontSize(9).font('Helvetica');
          const textoDesarrollo = acta.desarrolloReunion.replace(/<[^>]*>/g, '').trim();
          doc.text(textoDesarrollo, marginLeft, doc.y, { width: pageWidth, lineGap: 2 });
          doc.moveDown(0.8);
        }

        // === COMPROMISOS PRÓXIMA ACTA ===
        if (acta.compromisosSiguientes && acta.compromisosSiguientes.length > 0) {
          if (doc.y > doc.page.height - 100) {
            doc.addPage();
            doc.y = 50;
          }
          doc.y = this.drawSectionTitle(doc, 'COMPROMISOS PRÓXIMA ACTA', doc.y);
          acta.compromisosSiguientes.forEach((comp, i) => {
            doc.fillColor(COLORS.text).fontSize(9).font('Helvetica')
               .text(`${i + 1}. ${comp.descripcion}`, marginLeft + 8, doc.y, { width: pageWidth - 16 });
            doc.fillColor(COLORS.textMuted).fontSize(8)
               .text(`   Encargado: ${comp.encargado || 'N/A'} | Fecha: ${comp.fechaEntrega || 'N/A'}`, marginLeft + 8, doc.y);
            doc.moveDown(0.3);
          });
        }

        // === PÁGINA DE ASISTENTES ===
        if (acta.asistentes && acta.asistentes.length > 0) {
          doc.addPage();
          doc.y = this.drawHeader(doc, `ACTA N° ${acta.numero} - ASISTENTES`, `${acta.asistentes.length} participantes`);

          const colWidths = [200, 150, 160];
          const tableX = marginLeft;
          let tableY = doc.y;

          // Header
          doc.rect(tableX, tableY, pageWidth, 18).fill(COLORS.primary);
          doc.fillColor(COLORS.white).fontSize(9).font('Helvetica-Bold');
          let xPos = tableX + 5;
          ['Nombre', 'Cargo', 'Firma'].forEach((h, i) => {
            doc.text(h, xPos, tableY + 5, { width: colWidths[i] - 10 });
            xPos += colWidths[i];
          });
          tableY += 18;

          // Filas
          doc.font('Helvetica').fontSize(9);
          for (const asistente of acta.asistentes) {
            if (tableY > doc.page.height - 80) {
              doc.addPage();
              tableY = 50;
            }

            const rowHeight = 32;
            doc.rect(tableX, tableY, colWidths[0], rowHeight).stroke(COLORS.border);
            doc.rect(tableX + colWidths[0], tableY, colWidths[1], rowHeight).stroke(COLORS.border);
            doc.rect(tableX + colWidths[0] + colWidths[1], tableY, colWidths[2], rowHeight).stroke(COLORS.border);

            doc.fillColor(COLORS.text);
            doc.text(asistente.nombreCompleto || '', tableX + 5, tableY + 10, { width: colWidths[0] - 10 });
            doc.text(asistente.cargo || '', tableX + colWidths[0] + 5, tableY + 10, { width: colWidths[1] - 10 });

            tableY += rowHeight;
          }
        }

        // === PÁGINA DE ANÁLISIS DE ADHERENCIA (IA) ===
        if (acta.informeAdherencia) {
          doc.addPage();
          doc.y = this.drawHeader(doc, `ACTA N° ${acta.numero} - ANÁLISIS DE ADHERENCIA`, 'Generado con IA');

          // Metadatos
          if (acta.analisisEvaluacion?.fechaGeneracion) {
            doc.fillColor(COLORS.textMuted).fontSize(7);
            doc.text(`Generado: ${new Date(acta.analisisEvaluacion.fechaGeneracion).toLocaleString('es-CO')} | Modelo: ${acta.analisisEvaluacion.modelo || 'IA'}`, marginLeft, doc.y, { width: pageWidth, align: 'right' });
            doc.moveDown(0.8);
          }

          // Resumen de métricas
          if (acta.analisisEvaluacion?.datosAnalizados) {
            const datos = acta.analisisEvaluacion.datosAnalizados;
            const boxWidth = (pageWidth - 30) / 4;
            const boxY = doc.y;
            const boxHeight = 40;

            // Pre-Test
            doc.rect(marginLeft, boxY, boxWidth, boxHeight).fill('#eff6ff');
            doc.fillColor('#2563eb').fontSize(14).font('Helvetica-Bold')
               .text(`${datos.promedioPreTest}%`, marginLeft, boxY + 8, { width: boxWidth, align: 'center' });
            doc.fillColor('#3b82f6').fontSize(7).font('Helvetica')
               .text('Pre-Test', marginLeft, boxY + 26, { width: boxWidth, align: 'center' });

            // Post-Test
            doc.rect(marginLeft + boxWidth + 10, boxY, boxWidth, boxHeight).fill('#f0fdf4');
            doc.fillColor('#16a34a').fontSize(14).font('Helvetica-Bold')
               .text(`${datos.promedioPostTest}%`, marginLeft + boxWidth + 10, boxY + 8, { width: boxWidth, align: 'center' });
            doc.fillColor('#22c55e').fontSize(7).font('Helvetica')
               .text('Post-Test', marginLeft + boxWidth + 10, boxY + 26, { width: boxWidth, align: 'center' });

            // Mejora
            const mejoraColor = datos.mejoraPorcentual > 0 ? '#10b981' : datos.mejoraPorcentual < 0 ? '#ef4444' : '#6b7280';
            const mejoraBg = datos.mejoraPorcentual > 0 ? '#ecfdf5' : datos.mejoraPorcentual < 0 ? '#fef2f2' : '#f9fafb';
            doc.rect(marginLeft + (boxWidth + 10) * 2, boxY, boxWidth, boxHeight).fill(mejoraBg);
            doc.fillColor(mejoraColor).fontSize(14).font('Helvetica-Bold')
               .text(`${datos.mejoraPorcentual > 0 ? '+' : ''}${datos.mejoraPorcentual}%`, marginLeft + (boxWidth + 10) * 2, boxY + 8, { width: boxWidth, align: 'center' });
            doc.fillColor(mejoraColor).fontSize(7).font('Helvetica')
               .text('Mejora', marginLeft + (boxWidth + 10) * 2, boxY + 26, { width: boxWidth, align: 'center' });

            // Evaluados
            doc.rect(marginLeft + (boxWidth + 10) * 3, boxY, boxWidth, boxHeight).fill('#f5f3ff');
            doc.fillColor('#7c3aed').fontSize(14).font('Helvetica-Bold')
               .text(`${datos.totalParticipantes}`, marginLeft + (boxWidth + 10) * 3, boxY + 8, { width: boxWidth, align: 'center' });
            doc.fillColor('#8b5cf6').fontSize(7).font('Helvetica')
               .text('Evaluados', marginLeft + (boxWidth + 10) * 3, boxY + 26, { width: boxWidth, align: 'center' });

            doc.y = boxY + boxHeight + 15;
          }

          // Título del análisis
          doc.y = this.drawSectionTitle(doc, 'ANÁLISIS DE ADHERENCIA', doc.y);

          // Contenido del análisis (párrafo conciso)
          doc.rect(marginLeft, doc.y, pageWidth, 60).fill('#f5f3ff');
          doc.rect(marginLeft, doc.y, 3, 60).fill(COLORS.primary);

          const contenido = acta.informeAdherencia.replace(/<[^>]*>/g, '').trim();
          doc.fillColor(COLORS.text).fontSize(9).font('Helvetica')
             .text(contenido, marginLeft + 12, doc.y + 10, { width: pageWidth - 24, lineGap: 2 });

          doc.y = doc.y + 70;
        }

        // === FOOTER EN TODAS LAS PÁGINAS ===
        const pages = doc.bufferedPageRange();
        for (let i = 0; i < pages.count; i++) {
          doc.switchToPage(i);
          doc.fillColor(COLORS.textMuted).fontSize(7);
          doc.text(
            `${CLINICA_INFO.nombre} | Página ${i + 1} de ${pages.count}`,
            marginLeft, doc.page.height - 35,
            { align: 'center', width: pageWidth }
          );
        }

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  // ==========================================
  // ANÁLISIS DE IA
  // ==========================================

  /**
   * Genera un análisis de adherencia usando IA (OpenRouter)
   * También genera compromisos automáticamente y los almacena
   */
  async generarAnalisisIA(id) {
    // Verificar que OpenRouter está configurado
    if (!openRouterService.isConfigured()) {
      throw new ValidationError('El servicio de IA (OpenRouter) no está configurado. Configure OPENROUTER_API_KEY en las variables de entorno.');
    }

    // Obtener el acta con todos los datos necesarios
    const acta = await this.findById(id);

    if (!acta) {
      throw new NotFoundError('Acta no encontrada');
    }

    // Verificar que tiene datos de evaluaciones para analizar
    if (!acta.resultadosEvaluaciones || acta.resultadosEvaluaciones.length === 0) {
      throw new ValidationError('No hay resultados de evaluaciones para analizar. Asegúrese de que los participantes hayan completado las evaluaciones.');
    }

    // Preparar los datos para el análisis
    const datosCapacitacion = {
      tema: acta.sesion?.capacitacion?.tema || acta.objetivo,
      actividad: acta.sesion?.capacitacion?.actividad,
      categoria: acta.sesion?.capacitacion?.categoria?.nombre,
      orientadoA: acta.sesion?.capacitacion?.orientadoA,
      duracionMinutos: acta.sesion?.capacitacion?.duracionMinutos,
      resultadosEvaluaciones: acta.resultadosEvaluaciones,
      asistentes: acta.asistentes,
      sesionFecha: acta.fecha ? new Date(acta.fecha).toLocaleDateString('es-CO') : null
    };

    // Generar el análisis con IA (ahora incluye compromisos)
    const resultado = await openRouterService.generarAnalisisAdherencia(datosCapacitacion);

    // Guardar el análisis Y los compromisos en la base de datos
    await prisma.actaReunion.update({
      where: { id },
      data: {
        informeAdherencia: resultado.analisis,
        analisisEvaluacion: resultado.metadatos,
        // Guardar compromisos generados por IA
        compromisosSiguientes: resultado.compromisos && resultado.compromisos.length > 0
          ? resultado.compromisos
          : undefined
      }
    });

    return {
      informeAdherencia: resultado.analisis,
      compromisos: resultado.compromisos,
      metadatos: resultado.metadatos
    };
  }

  /**
   * Verifica si el servicio de IA está disponible
   */
  isIAConfigured() {
    return openRouterService.isConfigured();
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
