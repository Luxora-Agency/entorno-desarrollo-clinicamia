/**
 * Servicio de Generacion FURAT/FUREL
 * Genera reportes oficiales de accidentes y enfermedades laborales
 * Normativa: Resolucion 156/2005, Decreto 1295/1994
 */

const prisma = require('../../db/prisma');
const PDFDocument = require('pdfkit');
const { NotFoundError } = require('../../utils/errors');

class FuratService {
  /**
   * Generar FURAT (Formato Unico de Reporte de Accidente de Trabajo)
   */
  async generarFURAT(accidenteId) {
    const accidente = await prisma.sSTAccidenteTrabajo.findUnique({
      where: { id: accidenteId },
      include: {
        empleado: {
          include: {
            cargo: true,
            contratos: { where: { estado: 'ACTIVO' }, take: 1 },
          },
        },
        reportante: true,
        testigos: true,
      },
    });

    if (!accidente) {
      throw new NotFoundError('Accidente no encontrado');
    }

    // Obtener datos de la empresa (configuracion SST)
    const config = await prisma.sSTConfiguracion.findFirst({
      where: { activa: true },
    });

    return new Promise((resolve, reject) => {
      const chunks = [];
      const doc = new PDFDocument({ size: 'LETTER', margin: 50 });

      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Encabezado
      doc.fontSize(14).font('Helvetica-Bold')
        .text('FORMATO UNICO DE REPORTE DE ACCIDENTE DE TRABAJO', { align: 'center' });
      doc.moveDown(0.5);
      doc.fontSize(10).font('Helvetica')
        .text('FURAT - Resolucion 156 de 2005', { align: 'center' });
      doc.moveDown(1);

      // Seccion 1: Datos del empleador
      this.seccionTitulo(doc, 'I. IDENTIFICACION DEL EMPLEADOR O CONTRATANTE');
      this.campo(doc, 'Razon Social', config?.nombreEmpresa || 'CLINICA MIA S.A.S.');
      this.campo(doc, 'NIT', config?.nit || '900.123.456-7');
      this.campo(doc, 'Direccion', config?.direccion || '');
      this.campo(doc, 'Telefono', config?.telefono || '');
      this.campo(doc, 'Ciudad', config?.ciudad || '');
      this.campo(doc, 'Actividad Economica', config?.actividadEconomica || '');
      this.campo(doc, 'Clase de Riesgo', config?.claseRiesgo || '');
      doc.moveDown(0.5);

      // Seccion 2: Datos del trabajador
      this.seccionTitulo(doc, 'II. IDENTIFICACION DEL TRABAJADOR');
      const emp = accidente.empleado;
      this.campo(doc, 'Nombres y Apellidos', `${emp.nombre} ${emp.apellido}`);
      this.campo(doc, 'Tipo y Numero Documento', `${emp.tipoDocumento || 'CC'} ${emp.documento}`);
      this.campo(doc, 'Fecha Nacimiento', this.formatFecha(emp.fechaNacimiento));
      this.campo(doc, 'Sexo', emp.genero || 'N/A');
      this.campo(doc, 'Direccion', emp.direccion || 'N/A');
      this.campo(doc, 'Telefono', emp.telefono || 'N/A');
      this.campo(doc, 'Ocupacion', emp.cargo?.nombre || 'N/A');
      this.campo(doc, 'Tipo Vinculacion', emp.contratos?.[0]?.tipoContrato || 'N/A');
      this.campo(doc, 'Fecha Ingreso', this.formatFecha(emp.contratos?.[0]?.fechaInicio));
      this.campo(doc, 'Tiempo en la Empresa', this.calcularTiempo(emp.contratos?.[0]?.fechaInicio));
      doc.moveDown(0.5);

      // Seccion 3: Datos del accidente
      this.seccionTitulo(doc, 'III. INFORMACION DEL ACCIDENTE');
      this.campo(doc, 'Fecha del Accidente', this.formatFecha(accidente.fechaAccidente));
      this.campo(doc, 'Hora del Accidente', accidente.horaAccidente || 'N/A');
      this.campo(doc, 'Dia de la Semana', this.getDiaSemana(accidente.fechaAccidente));
      this.campo(doc, 'Jornada', 'Normal'); // TODO: obtener de contrato
      this.campo(doc, 'Lugar del Accidente', accidente.lugarAccidente);
      this.campo(doc, 'Tipo de Accidente', this.formatTipoAccidente(accidente.tipoAccidente));
      this.campo(doc, 'Sitio', accidente.lugarAccidente.includes('empresa') ? 'Dentro de la empresa' : 'Fuera de la empresa');
      doc.moveDown(0.5);

      // Seccion 4: Descripcion del accidente
      this.seccionTitulo(doc, 'IV. DESCRIPCION DEL ACCIDENTE');
      this.campo(doc, 'Actividad que realizaba', accidente.actividadRealizaba || 'N/A');
      doc.moveDown(0.3);
      doc.fontSize(9).text('Descripcion detallada de los hechos:');
      doc.fontSize(9).text(accidente.descripcionHechos || 'No especificado', { indent: 20 });
      doc.moveDown(0.5);

      // Seccion 5: Agente y mecanismo
      this.seccionTitulo(doc, 'V. AGENTE, MECANISMO Y LESION');
      this.campo(doc, 'Agente del Accidente', accidente.agenteAccidente || 'N/A');
      this.campo(doc, 'Mecanismo del Accidente', accidente.mecanismoAccidente || 'N/A');
      this.campo(doc, 'Tipo de Lesion', accidente.tipoLesion || 'N/A');
      this.campo(doc, 'Parte del Cuerpo Afectada', accidente.parteCuerpoAfectada || 'N/A');
      doc.moveDown(0.5);

      // Seccion 6: Atencion medica
      this.seccionTitulo(doc, 'VI. ATENCION MEDICA');
      this.campo(doc, 'Recibio Atencion Medica', accidente.atencionMedica ? 'Si' : 'No');
      this.campo(doc, 'Requirio Hospitalizacion', accidente.hospitalizacion ? 'Si' : 'No');
      this.campo(doc, 'IPS que Atendio', accidente.nombreIPS || 'N/A');
      this.campo(doc, 'Dias de Incapacidad', accidente.diasIncapacidad?.toString() || '0');
      doc.moveDown(0.5);

      // Seccion 7: Testigos
      if (accidente.testigos?.length > 0 || accidente.testigosNombres) {
        this.seccionTitulo(doc, 'VII. TESTIGOS');
        if (accidente.testigos?.length > 0) {
          accidente.testigos.forEach((t, i) => {
            this.campo(doc, `Testigo ${i + 1}`, `${t.nombreTestigo} - ${t.telefonoTestigo || 'Sin telefono'}`);
          });
        } else if (accidente.testigosNombres) {
          doc.fontSize(9).text(accidente.testigosNombres);
        }
        doc.moveDown(0.5);
      }

      // Seccion 8: Datos del reportante
      this.seccionTitulo(doc, 'VIII. DATOS DEL REPORTANTE');
      if (accidente.reportante) {
        this.campo(doc, 'Nombre', `${accidente.reportante.nombre} ${accidente.reportante.apellido}`);
        this.campo(doc, 'Cargo', accidente.reportante.cargo?.nombre || 'N/A');
      }
      this.campo(doc, 'Fecha del Reporte', this.formatFecha(accidente.createdAt));
      doc.moveDown(1);

      // Firmas
      doc.moveDown(2);
      doc.fontSize(9);
      const y = doc.y;
      doc.text('_________________________', 100, y);
      doc.text('Firma del Reportante', 100, y + 15);
      doc.text('_________________________', 350, y);
      doc.text('Firma del Trabajador', 350, y + 15);

      // Pie de pagina
      doc.fontSize(8).text(`Generado el ${new Date().toLocaleString('es-CO')}`, 50, 730);

      doc.end();
    });
  }

  /**
   * Generar FUREL (Formato Unico de Reporte de Enfermedad Laboral)
   */
  async generarFUREL(enfermedadId) {
    const enfermedad = await prisma.sSTEnfermedadLaboral.findUnique({
      where: { id: enfermedadId },
      include: {
        empleado: {
          include: {
            cargo: true,
            contratos: { where: { estado: 'ACTIVO' }, take: 1 },
          },
        },
      },
    });

    if (!enfermedad) {
      throw new NotFoundError('Enfermedad laboral no encontrada');
    }

    const config = await prisma.sSTConfiguracion.findFirst({
      where: { activa: true },
    });

    return new Promise((resolve, reject) => {
      const chunks = [];
      const doc = new PDFDocument({ size: 'LETTER', margin: 50 });

      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Encabezado
      doc.fontSize(14).font('Helvetica-Bold')
        .text('FORMATO UNICO DE REPORTE DE ENFERMEDAD LABORAL', { align: 'center' });
      doc.moveDown(0.5);
      doc.fontSize(10).font('Helvetica')
        .text('FUREL - Resolucion 156 de 2005', { align: 'center' });
      doc.moveDown(1);

      // Seccion 1: Datos del empleador
      this.seccionTitulo(doc, 'I. IDENTIFICACION DEL EMPLEADOR');
      this.campo(doc, 'Razon Social', config?.nombreEmpresa || 'CLINICA MIA S.A.S.');
      this.campo(doc, 'NIT', config?.nit || '900.123.456-7');
      this.campo(doc, 'Direccion', config?.direccion || '');
      this.campo(doc, 'Actividad Economica', config?.actividadEconomica || '');
      doc.moveDown(0.5);

      // Seccion 2: Datos del trabajador
      this.seccionTitulo(doc, 'II. IDENTIFICACION DEL TRABAJADOR');
      const emp = enfermedad.empleado;
      this.campo(doc, 'Nombres y Apellidos', `${emp.nombre} ${emp.apellido}`);
      this.campo(doc, 'Documento', `${emp.tipoDocumento || 'CC'} ${emp.documento}`);
      this.campo(doc, 'Cargo', emp.cargo?.nombre || 'N/A');
      this.campo(doc, 'Antiguedad', this.calcularTiempo(emp.contratos?.[0]?.fechaInicio));
      doc.moveDown(0.5);

      // Seccion 3: Datos de la enfermedad
      this.seccionTitulo(doc, 'III. INFORMACION DE LA ENFERMEDAD');
      this.campo(doc, 'Codigo CIE-10', enfermedad.codigoCIE10 || 'N/A');
      this.campo(doc, 'Nombre Enfermedad', enfermedad.nombreEnfermedad);
      this.campo(doc, 'Fecha Diagnostico', this.formatFecha(enfermedad.fechaDiagnostico));
      this.campo(doc, 'Agente Etiologico', enfermedad.agenteEtiologico || 'N/A');
      this.campo(doc, 'Factor de Riesgo', enfermedad.factorRiesgoAsociado || 'N/A');
      this.campo(doc, 'Tiempo Exposicion', enfermedad.tiempoExposicion || 'N/A');
      doc.moveDown(0.5);

      // Seccion 4: Relacion causal
      this.seccionTitulo(doc, 'IV. RELACION CAUSAL');
      doc.fontSize(9).text(enfermedad.relacionCausal || 'No especificada', { indent: 20 });
      doc.moveDown(0.5);

      // Seccion 5: Calificacion
      this.seccionTitulo(doc, 'V. CALIFICACION');
      this.campo(doc, 'IPS Calificadora', enfermedad.ipsCalificadora || 'Pendiente');
      this.campo(doc, 'Fecha Calificacion', this.formatFecha(enfermedad.fechaCalificacion));
      this.campo(doc, 'Porcentaje PCL', enfermedad.porcentajePCL ? `${enfermedad.porcentajePCL}%` : 'Pendiente');
      this.campo(doc, 'Estado', enfermedad.estado);
      doc.moveDown(0.5);

      // Seccion 6: Incapacidad
      this.seccionTitulo(doc, 'VI. INCAPACIDAD');
      this.campo(doc, 'Dias de Incapacidad', enfermedad.diasIncapacidad?.toString() || '0');
      this.campo(doc, 'Reubicacion Laboral', enfermedad.reubicacionLaboral ? 'Si' : 'No');
      if (enfermedad.descripcionReubicacion) {
        this.campo(doc, 'Descripcion Reubicacion', enfermedad.descripcionReubicacion);
      }
      doc.moveDown(0.5);

      // Recomendaciones
      if (enfermedad.recomendacionesMedicas) {
        this.seccionTitulo(doc, 'VII. RECOMENDACIONES MEDICAS');
        doc.fontSize(9).text(enfermedad.recomendacionesMedicas, { indent: 20 });
      }

      doc.moveDown(2);
      doc.fontSize(8).text(`Generado el ${new Date().toLocaleString('es-CO')}`, 50, 730);

      doc.end();
    });
  }

  /**
   * Marcar accidente con FURAT generado
   */
  async marcarFURATGenerado(accidenteId) {
    return prisma.sSTAccidenteTrabajo.update({
      where: { id: accidenteId },
      data: {
        furatGenerado: true,
        fechaFurat: new Date(),
      },
    });
  }

  // Helpers para formato PDF
  seccionTitulo(doc, titulo) {
    doc.fontSize(10).font('Helvetica-Bold')
      .fillColor('#144F79')
      .text(titulo)
      .fillColor('black')
      .font('Helvetica');
    doc.moveDown(0.3);
  }

  campo(doc, etiqueta, valor) {
    doc.fontSize(9)
      .font('Helvetica-Bold').text(`${etiqueta}: `, { continued: true })
      .font('Helvetica').text(valor || 'N/A');
  }

  formatFecha(fecha) {
    if (!fecha) return 'N/A';
    return new Date(fecha).toLocaleDateString('es-CO');
  }

  getDiaSemana(fecha) {
    const dias = ['Domingo', 'Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado'];
    return dias[new Date(fecha).getDay()];
  }

  formatTipoAccidente(tipo) {
    const tipos = {
      DE_TRABAJO: 'Accidente de Trabajo',
      IN_ITINERE: 'Accidente In Itinere (trayecto)',
      DEPORTIVO: 'Accidente Deportivo/Recreativo',
    };
    return tipos[tipo] || tipo;
  }

  calcularTiempo(fechaInicio) {
    if (!fechaInicio) return 'N/A';
    const inicio = new Date(fechaInicio);
    const ahora = new Date();
    const meses = (ahora.getFullYear() - inicio.getFullYear()) * 12 + (ahora.getMonth() - inicio.getMonth());
    if (meses < 12) return `${meses} meses`;
    const anos = Math.floor(meses / 12);
    const mesesRestantes = meses % 12;
    return `${anos} año(s) ${mesesRestantes} mes(es)`;
  }
}

module.exports = new FuratService();
