const prisma = require('../../../db/prisma');
const { ValidationError, NotFoundError } = require('../../../utils/errors');
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');
const { format } = require('date-fns');
const { es } = require('date-fns/locale');
const fs = require('fs');
const path = require('path');

class ReporteInfraestructuraService {
  /**
   * Crear registro de reporte
   */
  async create(data) {
    return prisma.reporteInfraestructura.create({
      data,
      include: {
        generador: {
          select: {
            id: true,
            nombre: true,
            email: true,
          },
        },
      },
    });
  }

  /**
   * Obtener todos los reportes
   */
  async findAll(filters = {}) {
    const where = { activo: true };

    if (filters.tipo) {
      where.tipo = filters.tipo;
    }

    if (filters.estado) {
      where.estado = filters.estado;
    }

    if (filters.periodo) {
      where.periodo = filters.periodo;
    }

    const [reportes, total] = await Promise.all([
      prisma.reporteInfraestructura.findMany({
        where,
        include: {
          generador: {
            select: {
              id: true,
              nombre: true,
              email: true,
            },
          },
        },
        orderBy: { fechaGeneracion: 'desc' },
        take: parseInt(filters.limit) || 50,
      }),
      prisma.reporteInfraestructura.count({ where }),
    ]);

    return { reportes, total };
  }

  /**
   * Obtener reporte por ID
   */
  async findById(id) {
    const reporte = await prisma.reporteInfraestructura.findUnique({
      where: { id },
      include: {
        generador: {
          select: {
            id: true,
            nombre: true,
            email: true,
          },
        },
      },
    });

    if (!reporte) {
      throw new NotFoundError('Reporte no encontrado');
    }

    return reporte;
  }

  /**
   * Actualizar estado de reporte
   */
  async updateEstado(id, estado, archivoData = {}) {
    return prisma.reporteInfraestructura.update({
      where: { id },
      data: {
        estado,
        ...archivoData,
      },
    });
  }

  /**
   * Generar reporte mensual RH1 (Excel)
   */
  async generarReporteMensualRH1(mes, anio, userId) {
    if (!userId) {
      throw new ValidationError('Usuario no autenticado');
    }

    // Crear registro de reporte
    const periodo = `${anio}-${String(mes).padStart(2, '0')}`;
    const nombre = `Reporte RH1 - ${this.getMesNombre(mes)} ${anio}`;

    const reporte = await this.create({
      tipo: 'MENSUAL_RH1',
      periodo,
      nombre,
      descripcion: `Reporte mensual de residuos hospitalarios`,
      estado: 'GENERANDO',
      generadorId: userId,
    });

    try {
      // Obtener datos RH1 del mes
      const registros = await prisma.residuoRH1.findMany({
        where: {
          mes: parseInt(mes),
          anio: parseInt(anio),
          activo: true,
        },
        orderBy: { dia: 'asc' },
      });

      if (registros.length === 0) {
        throw new ValidationError('No hay registros RH1 para el periodo especificado');
      }

      // Generar Excel
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet(`RH1 ${mes}-${anio}`);

      // Configurar columnas
      worksheet.columns = [
        { header: 'Día', key: 'dia', width: 8 },
        { header: 'Aprovechables (kg)', key: 'aprovechables', width: 18 },
        { header: 'No Aprovechables (kg)', key: 'noAprovechables', width: 20 },
        { header: 'Infecciosos (kg)', key: 'infecciosos', width: 18 },
        { header: 'Biosanitarios (kg)', key: 'biosanitarios', width: 18 },
        { header: 'Total No Peligrosos (kg)', key: 'totalNoPeligrosos', width: 22 },
        { header: 'Total Peligrosos (kg)', key: 'totalPeligrosos', width: 22 },
        { header: 'Total Generado (kg)', key: 'totalGenerado', width: 20 },
      ];

      // Estilo del encabezado
      worksheet.getRow(1).font = { bold: true };
      worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF4472C4' },
      };
      worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };

      // Agregar datos
      registros.forEach(registro => {
        worksheet.addRow({
          dia: registro.dia,
          aprovechables: registro.residuosAprovechables,
          noAprovechables: registro.residuosNoAprovechables,
          infecciosos: registro.residuosInfecciosos,
          biosanitarios: registro.residuosBiosanitarios,
          totalNoPeligrosos: registro.totalNoPeligrosos,
          totalPeligrosos: registro.totalPeligrosos,
          totalGenerado: registro.totalGenerado,
        });
      });

      // Fila de totales
      const totales = registros.reduce(
        (acc, r) => ({
          aprovechables: acc.aprovechables + r.residuosAprovechables,
          noAprovechables: acc.noAprovechables + r.residuosNoAprovechables,
          infecciosos: acc.infecciosos + r.residuosInfecciosos,
          biosanitarios: acc.biosanitarios + r.residuosBiosanitarios,
          totalNoPeligrosos: acc.totalNoPeligrosos + r.totalNoPeligrosos,
          totalPeligrosos: acc.totalPeligrosos + r.totalPeligrosos,
          totalGenerado: acc.totalGenerado + r.totalGenerado,
        }),
        {
          aprovechables: 0,
          noAprovechables: 0,
          infecciosos: 0,
          biosanitarios: 0,
          totalNoPeligrosos: 0,
          totalPeligrosos: 0,
          totalGenerado: 0,
        }
      );

      const rowTotales = worksheet.addRow({
        dia: 'TOTAL MES',
        ...totales,
      });

      rowTotales.font = { bold: true };
      rowTotales.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE7E6E6' },
      };

      // Guardar archivo
      const fileName = `RH1_${mes}_${anio}_${Date.now()}.xlsx`;
      const filePath = path.join(__dirname, '../../../public/reportes', fileName);

      // Crear directorio si no existe
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      await workbook.xlsx.writeFile(filePath);

      // Actualizar reporte
      await this.updateEstado(reporte.id, 'COMPLETADO', {
        archivoUrl: `/reportes/${fileName}`,
        archivoNombre: fileName,
        archivoTipo: 'EXCEL',
      });

      return this.findById(reporte.id);
    } catch (error) {
      // Marcar como error
      await this.updateEstado(reporte.id, 'ERROR');
      throw error;
    }
  }

  /**
   * Generar reporte semestral de indicadores (PDF)
   */
  async generarReporteSemestralIndicadores(semestre, anio, userId) {
    if (!userId) {
      throw new ValidationError('Usuario no autenticado');
    }

    const periodo = `${anio}-S${semestre}`;
    const nombre = `Reporte Indicadores - Semestre ${semestre} ${anio}`;

    const reporte = await this.create({
      tipo: 'SEMESTRAL_INDICADORES',
      periodo,
      nombre,
      descripcion: `Reporte semestral de indicadores PGIRASA`,
      estado: 'GENERANDO',
      generadorId: userId,
    });

    try {
      // Determinar meses del semestre
      const mesesSemestre = semestre === 1 ? [1, 2, 3, 4, 5, 6] : [7, 8, 9, 10, 11, 12];

      // Obtener indicadores
      const indicadores = await prisma.indicadorPGIRASA.findMany({
        where: { activo: true },
        include: {
          mediciones: {
            where: {
              anio: parseInt(anio),
              mes: { in: mesesSemestre },
              activo: true,
            },
            orderBy: { periodo: 'asc' },
          },
        },
      });

      // Crear PDF
      const doc = new PDFDocument({ margin: 50 });
      const fileName = `Indicadores_S${semestre}_${anio}_${Date.now()}.pdf`;
      const filePath = path.join(__dirname, '../../../public/reportes', fileName);

      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      const stream = fs.createWriteStream(filePath);
      doc.pipe(stream);

      // Encabezado
      doc
        .fontSize(20)
        .text('Reporte de Indicadores PGIRASA', { align: 'center' })
        .moveDown();

      doc
        .fontSize(14)
        .text(`Semestre ${semestre} - ${anio}`, { align: 'center' })
        .moveDown(2);

      // Generar sección por cada indicador
      indicadores.forEach((indicador, index) => {
        if (index > 0) {
          doc.addPage();
        }

        // Nombre del indicador
        doc
          .fontSize(16)
          .text(indicador.nombre, { underline: true })
          .moveDown();

        // Detalles
        doc.fontSize(10);
        doc.text(`Código: ${indicador.codigo}`);
        doc.text(`Dominio: ${indicador.dominio}`);
        doc.text(`Tipo de Cálculo: ${indicador.tipoCalculo}`);
        doc.text(`Frecuencia: ${indicador.frecuencia}`);
        doc.moveDown();

        doc.text(`Objetivo: ${indicador.objetivo}`);
        doc.moveDown();

        // Tabla de mediciones
        if (indicador.mediciones.length > 0) {
          doc.fontSize(12).text('Mediciones del Semestre:', { underline: true }).moveDown(0.5);

          doc.fontSize(10);
          indicador.mediciones.forEach(medicion => {
            doc.text(
              `${medicion.periodo}: ${medicion.resultado.toFixed(2)} (${medicion.numerador.toFixed(
                2
              )} / ${medicion.denominador.toFixed(2)})`
            );
          });

          // Promedio del semestre
          const promedio =
            indicador.mediciones.reduce((sum, m) => sum + m.resultado, 0) /
            indicador.mediciones.length;

          doc.moveDown();
          doc
            .fontSize(11)
            .text(`Promedio del Semestre: ${promedio.toFixed(2)}`, { bold: true });

          // Meta
          if (indicador.metaValor) {
            const cumple =
              indicador.metaTipo === 'MAYOR_IGUAL'
                ? promedio >= indicador.metaValor
                : promedio <= indicador.metaValor;

            doc.text(
              `Meta: ${indicador.metaValor} (${
                cumple ? '✓ CUMPLE' : '✗ NO CUMPLE'
              })`,
              { bold: true }
            );
          }
        } else {
          doc.text('Sin mediciones en este periodo', { italics: true });
        }

        doc.moveDown(2);
      });

      // Finalizar PDF
      doc.end();

      // Esperar a que termine de escribir
      await new Promise((resolve, reject) => {
        stream.on('finish', resolve);
        stream.on('error', reject);
      });

      // Actualizar reporte
      await this.updateEstado(reporte.id, 'COMPLETADO', {
        archivoUrl: `/reportes/${fileName}`,
        archivoNombre: fileName,
        archivoTipo: 'PDF',
      });

      return this.findById(reporte.id);
    } catch (error) {
      await this.updateEstado(reporte.id, 'ERROR');
      throw error;
    }
  }

  /**
   * Generar reporte personalizado
   */
  async generarReportePersonalizado(config, userId) {
    if (!userId) {
      throw new ValidationError('Usuario no autenticado');
    }

    const { tipo, periodo, nombre, filtros } = config;

    const reporte = await this.create({
      tipo: 'PERSONALIZADO',
      periodo,
      nombre: nombre || 'Reporte Personalizado',
      descripcion: config.descripcion || 'Reporte generado con filtros personalizados',
      filtros: JSON.stringify(filtros),
      estado: 'GENERANDO',
      generadorId: userId,
    });

    try {
      // Aquí iría la lógica personalizada según el tipo de reporte
      // Por ahora, marcar como completado sin archivo
      await this.updateEstado(reporte.id, 'COMPLETADO');

      return this.findById(reporte.id);
    } catch (error) {
      await this.updateEstado(reporte.id, 'ERROR');
      throw error;
    }
  }

  /**
   * Eliminar reporte (soft delete)
   */
  async delete(id) {
    await this.findById(id);

    return prisma.reporteInfraestructura.update({
      where: { id },
      data: { activo: false },
    });
  }

  /**
   * Obtener estadísticas de reportes
   */
  async getEstadisticas() {
    const [total, porTipo, porEstado] = await Promise.all([
      prisma.reporteInfraestructura.count({ where: { activo: true } }),
      prisma.reporteInfraestructura.groupBy({
        by: ['tipo'],
        where: { activo: true },
        _count: true,
      }),
      prisma.reporteInfraestructura.groupBy({
        by: ['estado'],
        where: { activo: true },
        _count: true,
      }),
    ]);

    return {
      total,
      porTipo: porTipo.reduce((acc, item) => {
        acc[item.tipo] = item._count;
        return acc;
      }, {}),
      porEstado: porEstado.reduce((acc, item) => {
        acc[item.estado] = item._count;
        return acc;
      }, {}),
    };
  }

  /**
   * Obtener tipos de reportes disponibles
   */
  getTiposReportes() {
    return [
      { value: 'MENSUAL_RH1', label: 'RH1 Mensual (Excel)' },
      { value: 'SEMESTRAL_INDICADORES', label: 'Indicadores Semestrales (PDF)' },
      { value: 'ANUAL_CONCEPTO', label: 'Concepto Sanitario Anual (PDF)' },
      { value: 'PERSONALIZADO', label: 'Personalizado' },
    ];
  }

  /**
   * Helper: Obtener nombre del mes
   */
  getMesNombre(mes) {
    const meses = [
      'Enero',
      'Febrero',
      'Marzo',
      'Abril',
      'Mayo',
      'Junio',
      'Julio',
      'Agosto',
      'Septiembre',
      'Octubre',
      'Noviembre',
      'Diciembre',
    ];
    return meses[mes - 1];
  }
}

module.exports = new ReporteInfraestructuraService();
