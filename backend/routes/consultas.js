const { Hono } = require('hono');
const prisma = require('../db/prisma');
const { authMiddleware } = require('../middleware/auth');
const firmaDigitalService = require('../services/firmaDigital.service');
const auditoriaService = require('../services/auditoria.service');
const consultaService = require('../services/consulta.service');
const emailService = require('../services/email.service');
const encuestaSatisfaccionService = require('../services/encuestaSatisfaccion.service');

const consultasRouter = new Hono();

// Todas las rutas requieren autenticación
consultasRouter.use('*', authMiddleware);

/**
 * GET /consultas/tipo-consulta/:pacienteId
 * Detecta si es primera consulta o consulta de control
 */
consultasRouter.get('/tipo-consulta/:pacienteId', async (c) => {
  try {
    const { pacienteId } = c.req.param();

    const tipoConsulta = await consultaService.obtenerTipoConsulta(pacienteId);

    return c.json({
      success: true,
      data: tipoConsulta
    });
  } catch (error) {
    console.error('Error al obtener tipo de consulta:', error);
    return c.json({
      success: false,
      message: 'Error al obtener tipo de consulta',
      error: error.message
    }, 500);
  }
});

/**
 * GET /consultas/historial/:pacienteId
 * Obtiene el historial de consultas del paciente
 */
consultasRouter.get('/historial/:pacienteId', async (c) => {
  try {
    const { pacienteId } = c.req.param();
    const limit = parseInt(c.req.query('limit')) || 10;

    const historial = await consultaService.obtenerHistorialConsultas(pacienteId, limit);

    return c.json({
      success: true,
      data: historial
    });
  } catch (error) {
    console.error('Error al obtener historial de consultas:', error);
    return c.json({
      success: false,
      message: 'Error al obtener historial de consultas',
      error: error.message
    }, 500);
  }
});

/**
 * GET /consultas/ultima-completa/:pacienteId
 * Obtiene la última consulta completa con todos sus datos para pre-llenar controles
 */
consultasRouter.get('/ultima-completa/:pacienteId', async (c) => {
  try {
    const { pacienteId } = c.req.param();

    const consultaCompleta = await consultaService.obtenerUltimaConsultaCompleta(pacienteId);

    if (!consultaCompleta) {
      return c.json({
        success: true,
        data: null,
        message: 'No hay consultas previas'
      });
    }

    return c.json({
      success: true,
      data: consultaCompleta
    });
  } catch (error) {
    console.error('Error al obtener última consulta completa:', error);
    return c.json({
      success: false,
      message: 'Error al obtener última consulta completa',
      error: error.message
    }, 500);
  }
});

/**
 * GET /consultas/frecuentes/:pacienteId
 * Obtiene medicamentos, diagnósticos y órdenes más frecuentes del paciente
 */
consultasRouter.get('/frecuentes/:pacienteId', async (c) => {
  try {
    const { pacienteId } = c.req.param();

    const frecuentes = await consultaService.obtenerFrecuentes(pacienteId);

    return c.json({
      success: true,
      data: frecuentes
    });
  } catch (error) {
    console.error('Error al obtener datos frecuentes:', error);
    return c.json({
      success: false,
      message: 'Error al obtener datos frecuentes',
      error: error.message
    }, 500);
  }
});

/**
 * POST /consultas/finalizar
 * Finaliza una consulta guardando toda la información capturada en el modal
 */
consultasRouter.post('/finalizar', async (c) => {
  try {
    const user = c.get('user');
    if (!user) {
      return c.json({ message: 'No autenticado' }, 401);
    }

    const body = await c.req.json();
    const {
      citaId,
      pacienteId,
      doctorId,
      soap,
      vitales,
      diagnostico,
      alertas,
      procedimientos,
      prescripciones,
      motivoConsulta,
      enfermedadActual,
      esPrimeraConsulta,
      planManejo, // Nuevo: para kits de medicamentos
    } = body;

    // DEBUG: Log procedimientos recibidos
    console.log('[CONSULTAS/FINALIZAR] Procedimientos recibidos:', JSON.stringify(procedimientos, null, 2));
    console.log('[CONSULTAS/FINALIZAR] Total procedimientos:', procedimientos?.length || 0);

    // SOAP es opcional - si viene, validar que los campos no estén vacíos
    const isValidSoapField = (field) => typeof field === 'string' && field.trim().length > 0;
    const hasSoapData = soap && (isValidSoapField(soap.subjetivo) || isValidSoapField(soap.objetivo) ||
        isValidSoapField(soap.analisis) || isValidSoapField(soap.plan));

    // Validar diagnósticos especiales (cáncer y enfermedades huérfanas)
    if (diagnostico?.principal?.codigoCIE10) {
      const { requiereValidacionEspecial } = require('../constants/diagnosticosEspeciales');
      const requiere = requiereValidacionEspecial(diagnostico.principal.codigoCIE10);

      if (requiere.requiereValidacion) {
        const val = diagnostico.validacionEspecial;

        if (!val?.fechaDiagnosticoExacta || !val?.estadoConfirmacion) {
          return c.json({
            success: false,
            message: `Diagnóstico de ${requiere.nombre} requiere validación completa: fecha exacta y estado de confirmación son obligatorios`
          }, 400);
        }

        // Si está confirmado, requiere método
        if (val.estadoConfirmacion === 'confirmado' && !val.metodoConfirmacion) {
          return c.json({
            success: false,
            message: 'Diagnóstico confirmado requiere especificar método de confirmación'
          }, 400);
        }

        // Si método es "otro", requiere detalle
        if (val.metodoConfirmacion === 'otro' && !val.metodoConfirmacionDetalle) {
          return c.json({
            success: false,
            message: 'Método de confirmación "otro" requiere especificar detalles'
          }, 400);
        }
      }
    }

    // Usar transacción para garantizar atomicidad
    const resultado = await prisma.$transaction(async (tx) => {
      const resultados = {};
      const fechaActual = new Date();

      // 1. Guardar Evolución SOAP (opcional si viene, se usan valores por defecto si no)
      // Construir datos SOAP con valores por defecto si no vienen
      const soapSubjetivo = hasSoapData && soap.subjetivo ? soap.subjetivo : (motivoConsulta || 'Sin registro');
      const soapObjetivo = hasSoapData && soap.objetivo ? soap.objetivo : 'Ver signos vitales y examen físico';
      const soapAnalisis = hasSoapData && soap.analisis ? soap.analisis : 'Consulta sin análisis SOAP detallado';
      const soapPlan = hasSoapData && soap.plan ? soap.plan : 'Ver prescripciones y órdenes médicas';

      let planFinal = soapPlan;
      // Incorporar Kits de Medicamentos al Plan (Point of Care)
      if (planManejo && planManejo.kitsAplicados && planManejo.kitsAplicados.length > 0) {
        const kitsTexto = planManejo.kitsAplicados.map(k => `${k.nombre} (${k.medicamentos.join(', ')})`).join('; ');
        planFinal += `\n\n[APLICACIÓN INMEDIATA DE MEDICAMENTOS]\nSe aplicaron los siguientes kits: ${kitsTexto}`;
      }

      let evolucion = await tx.evolucionClinica.create({
        data: {
          pacienteId,
          citaId,
          doctorId,
          subjetivo: soapSubjetivo,
          objetivo: soapObjetivo,
          analisis: soapAnalisis,
          plan: planFinal,
          tipoEvolucion: 'Seguimiento',
          fechaEvolucion: fechaActual,
          // Nuevos campos para mejoras de consulta
          motivoConsulta: motivoConsulta || null,
          enfermedadActual: enfermedadActual || null,
          esPrimeraConsulta: esPrimeraConsulta || false,
        },
      });

      // 1.1 FIRMA DIGITAL Y HASH
      // Generar firma digital
      const dataParaFirmar = {
        subjetivo: evolucion.subjetivo,
        objetivo: evolucion.objetivo,
        analisis: evolucion.analisis,
        plan: evolucion.plan,
        fechaEvolucion: evolucion.fechaEvolucion,
      };
      
      const firma = firmaDigitalService.crearFirma(dataParaFirmar, doctorId);
      
      evolucion = await tx.evolucionClinica.update({
        where: { id: evolucion.id },
        data: {
          firmada: true,
          firmaDigital: firma.firmaDigital,
          hashRegistro: firma.hashRegistro,
          fechaFirma: firma.fechaFirma,
          ipRegistro: c.req.header('x-forwarded-for') || '127.0.0.1',
        },
      });
      resultados.evolucion = evolucion;

      // 1.2 Auditoría de Creación y Firma
      // Nota: Auditoría se hace fuera de la transacción habitualmente para no bloquear, 
      // pero aquí queremos asegurar que si falla la transacción no quede log.
      // Sin embargo, el servicio de auditoría usa `prisma` (global), no `tx`.
      // Por simplicidad y consistencia, lo llamaremos DESPUÉS de la transacción si todo sale bien,
      // o podríamos instanciar el log aquí mismo usando `tx`.
      await tx.auditoriaHCE.create({
        data: {
          entidad: 'EvolucionClinica',
          entidadId: evolucion.id,
          accion: 'Firma', // Valores válidos: Creacion, Modificacion, Eliminacion, Visualizacion, Firma, Descarga, Impresion
          usuarioId: doctorId,
          nombreUsuario: `${user?.nombre || ''} ${user?.apellido || ''}`.trim() || 'Doctor',
          rol: user?.rol || 'Doctor',
          valoresNuevos: evolucion,
          hashRegistro: firma.hashRegistro,
          ipOrigen: c.req.header('x-forwarded-for') || '127.0.0.1',
        },
      });

      // 2. Guardar Signos Vitales (si los hay)
      if (vitales) {
        // Función para validar y limitar valores numéricos
        const limitarValor = (valor, max) => {
          if (!valor) return null;
          const num = parseFloat(valor);
          return num > max ? max : num;
        };

        const signoVital = await tx.signoVital.create({
          data: {
            pacienteId,
            citaId,
            registradoPor: doctorId,
            temperatura: vitales.temperatura ? limitarValor(vitales.temperatura, 99.9) : null,
            presionSistolica: vitales.presionSistolica ? parseInt(vitales.presionSistolica) : null,
            presionDiastolica: vitales.presionDiastolica ? parseInt(vitales.presionDiastolica) : null,
            frecuenciaCardiaca: vitales.frecuenciaCardiaca ? parseInt(vitales.frecuenciaCardiaca) : null,
            frecuenciaRespiratoria: vitales.frecuenciaRespiratoria ? parseInt(vitales.frecuenciaRespiratoria) : null,
            saturacionOxigeno: vitales.saturacionOxigeno ? limitarValor(vitales.saturacionOxigeno, 100) : null,
            peso: vitales.peso ? limitarValor(vitales.peso, 999.99) : null,
            talla: vitales.talla ? limitarValor(vitales.talla, 999.99) : null,
            // Nuevos campos de examen físico avanzado
            perimetroAbdominal: vitales.perimetroAbdominal ? limitarValor(vitales.perimetroAbdominal, 999.99) : null,
            perimetroCefalico: vitales.perimetroCefalico ? limitarValor(vitales.perimetroCefalico, 999.99) : null,
            creatinina: vitales.creatinina ? limitarValor(vitales.creatinina, 99.99) : null,
            tfgCkdEpi: vitales.tfg_ckdepi ? limitarValor(vitales.tfg_ckdepi, 999.99) : null,
            glucosaAyunas: vitales.glucosaAyunas ? limitarValor(vitales.glucosaAyunas, 999.99) : null,
            hba1c: vitales.hba1c ? limitarValor(vitales.hba1c, 99.99) : null,
            colesterolTotal: vitales.colesterolTotal ? limitarValor(vitales.colesterolTotal, 999.99) : null,
            colesterolHDL: vitales.colesterolHDL ? limitarValor(vitales.colesterolHDL, 999.99) : null,
            colesterolLDL: vitales.colesterolLDL ? limitarValor(vitales.colesterolLDL, 999.99) : null,
            trigliceridos: vitales.trigliceridos ? limitarValor(vitales.trigliceridos, 999.99) : null,
            calcio: vitales.calcio ? limitarValor(vitales.calcio, 99.99) : null,
            potasio: vitales.potasio ? limitarValor(vitales.potasio, 99.99) : null,
            pth: vitales.pth ? limitarValor(vitales.pth, 999.99) : null,
            // Perfil Tiroideo
            tsh: vitales.tsh ? limitarValor(vitales.tsh, 999.999) : null,
            tiroxinaLibre: vitales.tiroxinaLibre ? limitarValor(vitales.tiroxinaLibre, 99.99) : null,
            tiroglobulina: vitales.tiroglobulina ? limitarValor(vitales.tiroglobulina, 99999.99) : null,
            anticuerposAntitiroglobulina: vitales.anticuerposAntitiroglobulina ? limitarValor(vitales.anticuerposAntitiroglobulina, 99999.99) : null,
            analisisTiroideo: vitales.analisisTiroideo || null,
            // Paraclínicos personalizados (array JSON)
            otrosParaclinicos: vitales.otrosParaclinicos || null,
            // Examen físico por sistemas (JSON estructurado)
            examenFisico: vitales.examenFisico || null,

            // Calcular IMC si hay peso y talla
            imc: (vitales.peso && vitales.talla)
              ? parseFloat((parseFloat(vitales.peso) / Math.pow(parseFloat(vitales.talla) / 100, 2)).toFixed(2))
              : null,
          },
        });
        resultados.signoVital = signoVital;
      }

      // 3. Guardar Diagnóstico (si lo hay)
      if (diagnostico) {
        // Soportar tanto CIE10 como CIE11 en los nombres de campos del frontend
        const codigoDx = diagnostico.codigoCIE11 || diagnostico.codigoCIE10 || diagnostico.principal?.codigoCIE10;
        const descripcionDx = diagnostico.descripcionCIE11 || diagnostico.descripcionCIE10 || diagnostico.principal?.descripcionCIE10;
        const observacionesDx = diagnostico.observaciones || diagnostico.principal?.observaciones;

        // Solo crear diagnóstico si hay código válido
        if (codigoDx) {
          // Obtener clasificación del diagnóstico
          const clasificacionDx = diagnostico.clasificacion || diagnostico.principal?.clasificacion || null;

          const dataDiagnostico = {
            pacienteId,
            evolucionId: evolucion.id,
            doctorId,
            codigoCIE11: codigoDx,
            descripcionCIE11: descripcionDx || codigoDx, // Fallback a código si no hay descripción
            tipoDiagnostico: diagnostico.tipoDiagnostico || 'Principal',
            estadoDiagnostico: 'Activo',
            clasificacion: clasificacionDx, // ImpresionDiagnostica, ConfirmadoNuevo, ConfirmadoRepetido
            observaciones: observacionesDx,
          };

          // Incluir campos de validación especial si existen
          if (diagnostico.validacionEspecial) {
            const val = diagnostico.validacionEspecial;
            if (val.fechaDiagnosticoExacta) {
              dataDiagnostico.fechaDiagnosticoExacta = new Date(val.fechaDiagnosticoExacta);
            }
            if (val.estadoConfirmacion) {
              dataDiagnostico.estadoConfirmacion = val.estadoConfirmacion;
            }
            if (val.metodoConfirmacion) {
              dataDiagnostico.metodoConfirmacion = val.metodoConfirmacion;
            }
            if (val.metodoConfirmacionDetalle) {
              dataDiagnostico.metodoConfirmacionDetalle = val.metodoConfirmacionDetalle;
            }
            if (val.documentoRespaldoUrl) {
              dataDiagnostico.documentoRespaldoUrl = val.documentoRespaldoUrl;
            }
            if (val.documentoRespaldoNombre) {
              dataDiagnostico.documentoRespaldoNombre = val.documentoRespaldoNombre;
            }
          }

          const diagnosticoHCE = await tx.diagnosticoHCE.create({
            data: dataDiagnostico,
          });
          resultados.diagnostico = diagnosticoHCE;
        } // cierre if (codigoDx)
      }

      // 4. Guardar Alerta (si la hay)
      if (alertas) {
        // Mapear tipos de alerta a valores válidos del enum TipoAlertaHCE
        const mapearTipoAlerta = (tipo) => {
          const mapa = {
            'Alergia': 'AlergiaMedicamento',
            'AlergiaMedicamento': 'AlergiaMedicamento',
            'Intolerancia': 'Intolerancia',
            'Recordatorio': 'Recordatorio',
            'SignoVitalCritico': 'SignoVitalCritico',
            'RiesgoCaidas': 'RiesgoCaidas',
          };
          return mapa[tipo] || 'Recordatorio'; // Default a Recordatorio si no encuentra
        };

        const alerta = await tx.alertaClinica.create({
          data: {
            pacienteId,
            tipoAlerta: mapearTipoAlerta(alertas.tipoAlerta),
            severidad: alertas.severidad || 'Moderada',
            titulo: alertas.titulo,
            descripcion: alertas.descripcion,
            visiblePara: ['DOCTOR', 'NURSE'],
            activa: true,
          },
        });
        resultados.alerta = alerta;
      }

      // 5. Guardar Procedimientos/Exámenes/Interconsultas
      // IMPORTANTE: Agrupar todos los exámenes/procedimientos de la consulta en UNA SOLA orden
      if (procedimientos && Array.isArray(procedimientos) && procedimientos.length > 0) {
        const ordenesCreadas = [];
        const citasCreadas = [];
        const interconsultasCreadas = [];

        // Separar interconsultas de exámenes/procedimientos
        const interconsultas = procedimientos.filter(p => p.tipo === 'Interconsulta');
        const examenesYProcedimientos = procedimientos.filter(p => p.tipo !== 'Interconsulta');

        // Procesar Interconsultas (cada una es independiente)
        for (const orden of interconsultas) {
          const interconsulta = await tx.interconsulta.create({
            data: {
              pacienteId,
              citaId,
              medicoSolicitanteId: doctorId,
              especialidadSolicitada: orden.especialidadNombre || orden.servicioNombre,
              motivoConsulta: orden.motivoConsulta || orden.observaciones || 'Remisión desde consulta externa',
              antecedentesRelevantes: orden.antecedentesRelevantes || null,
              diagnosticoPresuntivo: orden.diagnosticoPresuntivo || null,
              prioridad: orden.prioridad || 'Media',
              estado: 'Solicitada',
              observaciones: orden.observaciones || null,
            }
          });
          interconsultasCreadas.push(interconsulta);
        }

        // Agrupar exámenes/procedimientos en UNA SOLA orden médica
        if (examenesYProcedimientos.length > 0) {
          // Construir texto estructurado con todos los items
          const itemsTexto = examenesYProcedimientos.map((item, idx) => {
            const nombre = item.servicioNombre || item.descripcion || 'Examen/Procedimiento';
            const tipo = item.tipo || 'Examen';
            const codigo = item.codigoCups || '';
            const costo = parseFloat(item.costo) || 0;
            const obs = item.observaciones || '';

            return `${idx + 1}. [${tipo}] ${nombre}${codigo ? ` (CUPS: ${codigo})` : ''}${obs ? ` - ${obs}` : ''}`;
          }).join('\n');

          // Calcular total
          const totalOrden = examenesYProcedimientos.reduce((sum, item) => sum + (parseFloat(item.costo) || 0), 0);

          // Obtener el primer examen con servicioId válido para la relación
          const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
          const primerExamenValido = examenesYProcedimientos.find(e => e.servicioId && uuidRegex.test(e.servicioId));

          // Determinar el tipo predominante
          const tieneExamenes = examenesYProcedimientos.some(e => e.tipo === 'Examen');
          const tieneProcedimientos = examenesYProcedimientos.some(e => e.tipo === 'Procedimiento');
          let tipoOrden = 'Examen';
          if (tieneExamenes && tieneProcedimientos) {
            tipoOrden = 'Examen/Procedimiento';
          } else if (tieneProcedimientos) {
            tipoOrden = 'Procedimiento';
          }

          // Crear observaciones estructuradas
          const observacionesEstructuradas = `ORDEN DE ${tipoOrden.toUpperCase()}\nConsulta: ${citaId}\nFecha: ${new Date().toLocaleDateString('es-CO')}\n\nItems solicitados (${examenesYProcedimientos.length}):\n${itemsTexto}\n\nTotal: $${totalOrden.toLocaleString('es-CO')}`;

          // Crear UNA SOLA orden médica agrupada
          const ordenMedicaData = {
            pacienteId,
            citaId,
            doctorId,
            precioAplicado: totalOrden,
            estado: 'Pendiente',
            observaciones: observacionesEstructuradas,
          };

          // Si hay un examen válido, vincular (para mantener compatibilidad)
          if (primerExamenValido) {
            ordenMedicaData.examenProcedimientoId = primerExamenValido.servicioId;
          }

          const ordenMedica = await tx.ordenMedica.create({
            data: ordenMedicaData,
          });
          ordenesCreadas.push(ordenMedica);

          // Crear citas PorAgendar para cada examen/procedimiento individual
          for (const item of examenesYProcedimientos) {
            const servicioIdValido = item.servicioId && uuidRegex.test(item.servicioId);

            const citaData = {
              pacienteId,
              tipoCita: item.tipo || 'Examen',
              costo: parseFloat(item.costo) || 0,
              motivo: item.servicioNombre || item.descripcion || 'Orden médica',
              estado: 'PorAgendar',
            };

            if (servicioIdValido) {
              citaData.examenProcedimientoId = item.servicioId;
            }

            const citaPorAgendar = await tx.cita.create({ data: citaData });
            citasCreadas.push(citaPorAgendar);
          }
        }

        resultados.ordenesMedicas = ordenesCreadas;
        resultados.citasPorAgendar = citasCreadas;
        resultados.interconsultas = interconsultasCreadas;

        // DEBUG: Log órdenes médicas creadas
        console.log('[CONSULTAS/FINALIZAR] Órdenes médicas creadas:', ordenesCreadas.length, '(agrupadas)');
        console.log('[CONSULTAS/FINALIZAR] Citas por agendar creadas:', citasCreadas.length);
        console.log('[CONSULTAS/FINALIZAR] Interconsultas/Remisiones creadas:', interconsultasCreadas.length);
      }

      // 6. Guardar Prescripciones (si las hay)
      if (prescripciones && prescripciones.medicamentos && prescripciones.medicamentos.length > 0) {
        // Validar que todos los productoId sean UUIDs válidos
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        const medicamentosValidos = prescripciones.medicamentos.filter(med => {
          if (!med.productoId || !uuidRegex.test(med.productoId)) {
            console.warn(`Medicamento omitido: productoId inválido (${med.productoId}) para ${med.nombre || 'sin nombre'}`);
            return false;
          }
          return true;
        });

        if (medicamentosValidos.length === 0) {
          console.warn('No hay medicamentos válidos para crear prescripción');
        } else {
          // Verificar que los productos existan en la base de datos
          const productosIds = medicamentosValidos.map(med => med.productoId);
          const productosExistentes = await tx.producto.findMany({
            where: { id: { in: productosIds } },
            select: { id: true }
          });
          const idsExistentes = new Set(productosExistentes.map(p => p.id));

          const medicamentosConProductoValido = medicamentosValidos.filter(med => {
            if (!idsExistentes.has(med.productoId)) {
              console.warn(`Medicamento omitido: producto no existe (${med.productoId}) para ${med.nombre || 'sin nombre'}`);
              return false;
            }
            return true;
          });

          if (medicamentosConProductoValido.length > 0) {
            // Crear una Prescripción (receta médica)
            const prescripcion = await tx.prescripcion.create({
              data: {
                pacienteId,
                citaId,
                medicoId: doctorId,
                diagnostico: prescripciones.diagnostico || '',
                estado: 'Activa',
                medicamentos: {
                  create: medicamentosConProductoValido.map((med) => ({
                    productoId: med.productoId,
                    dosis: med.dosis,
                    via: med.via || 'Oral',
                    frecuencia: med.frecuencia || 'Cada8Horas',
                    frecuenciaDetalle: `${med.dosis} - Vía ${med.via || 'Oral'} - ${med.frecuencia || 'Cada 8 horas'}`,
                    duracionDias: med.duracionDias ? parseInt(med.duracionDias) : null,
                    instrucciones: med.instrucciones || '',
                  })),
                },
              },
              include: {
                medicamentos: {
                  include: {
                    producto: true,
                  },
                },
              },
            });

            // Crear OrdenMedicamento para que farmacia pueda despachar
            const totalOrden = medicamentosConProductoValido.reduce((sum, med) => sum + parseFloat(med.precio || 0), 0);

            const ordenMedicamento = await tx.ordenMedicamento.create({
              data: {
                pacienteId,
                citaId,
                doctorId,
                estado: 'Pendiente',
                observaciones: prescripciones.diagnostico || 'Orden generada desde consulta',
                total: totalOrden,
                items: {
                  create: medicamentosConProductoValido.map((med) => ({
                    productoId: med.productoId,
                    cantidad: 1, // Por defecto 1 unidad
                    precioUnitario: parseFloat(med.precio || 0),
                    subtotal: parseFloat(med.precio || 0),
                    indicaciones: `${med.dosis} - ${med.via || 'Oral'} - ${med.frecuencia || 'Cada 8 horas'}${med.duracionDias ? ` por ${med.duracionDias} días` : ''}`,
                  })),
                },
              },
              include: {
                items: {
                  include: {
                    producto: true,
                  },
                },
              },
            });

            // Crear OrdenMedica para que aparezca en el módulo de órdenes médicas
            // Formato estructurado para el PDF de prescripción
            const medicamentosTexto = medicamentosConProductoValido.map((med, idx) => {
              const nombre = med.nombre || 'Medicamento';
              const dosis = med.dosis || '-';
              const via = med.via || 'Oral';
              const frecuencia = med.frecuencia || 'Única';
              const duracion = med.duracionDias ? `${med.duracionDias} días` : 'Única';
              const instrucciones = med.instrucciones || '';
              return `• ${nombre} (${med.productoId?.substring(0, 8) || 'N/A'}) x1 - ${via} [${frecuencia}] [por ${duracion}]${instrucciones ? ` - ${instrucciones}` : ''}`;
            }).join('\n');

            const observacionesPrescripcion = `APLICACIÓN DE KIT: Prescripción Médica (RX-${citaId.substring(0, 6)})\nCategoría: Prescripción\nDescripción: ${prescripciones.diagnostico || 'Tratamiento médico'}\nMedicamentos incluidos:\n${medicamentosTexto}\nTotal: $${totalOrden.toLocaleString('es-CO')}`;

            const ordenMedicaPrescripcion = await tx.ordenMedica.create({
              data: {
                pacienteId,
                citaId,
                doctorId,
                precioAplicado: totalOrden,
                estado: 'Pendiente',
                observaciones: observacionesPrescripcion,
              },
            });

            resultados.prescripcion = prescripcion;
            resultados.ordenMedicamento = ordenMedicamento;
            resultados.ordenMedicaPrescripcion = ordenMedicaPrescripcion;
          }
        }
      }

      // 7. Cambiar estado de la cita a "Completada"
      const citaActualizada = await tx.cita.update({
        where: { id: citaId },
        data: { estado: 'Completada' },
      });
      resultados.cita = citaActualizada;

      return resultados;
    });

    // ==========================================
    // ENVÍO DE ENCUESTA DE SATISFACCIÓN (async)
    // ==========================================
    // Ejecutamos esto fuera de la transacción para no bloquear la respuesta
    (async () => {
      try {
        // Obtener datos completos para el email
        const citaConDatos = await prisma.cita.findUnique({
          where: { id: citaId },
          include: {
            paciente: true,
            doctor: true,
            especialidad: true
          }
        });

        if (citaConDatos?.paciente?.email) {
          // Crear encuesta y obtener token
          const encuesta = await encuestaSatisfaccionService.crearEncuestaPostConsulta({
            citaId,
            pacienteId: citaConDatos.pacienteId,
            doctorId: citaConDatos.doctorId,
            especialidad: citaConDatos.especialidad?.titulo
          });

          // Enviar email de encuesta de satisfacción
          await emailService.sendSatisfactionSurvey({
            to: citaConDatos.paciente.email,
            paciente: citaConDatos.paciente,
            doctor: citaConDatos.doctor,
            cita: citaConDatos,
            especialidad: citaConDatos.especialidad?.titulo,
            surveyToken: encuesta.token
          });

          console.log(`[Encuesta] Email de satisfacción enviado a ${citaConDatos.paciente.email} para cita ${citaId}`);
        }
      } catch (emailError) {
        // No bloqueamos la respuesta si falla el envío del email
        console.error('[Encuesta] Error al enviar email de satisfacción:', emailError.message);
      }
    })();

    return c.json({
      success: true,
      message: 'Consulta finalizada exitosamente',
      data: resultado,
    });

  } catch (error) {
    console.error('Error finalizando consulta:', error);
    return c.json(
      {
        success: false,
        message: 'Error al finalizar la consulta',
        error: error.message,
      },
      500
    );
  }
});

/**
 * POST /consultas/nota-ingreso
 * Genera una nota de ingreso para hospitalización desde una consulta
 */
consultasRouter.post('/nota-ingreso', async (c) => {
  try {
    const user = c.get('user');
    if (!user) {
      return c.json({ success: false, message: 'No autenticado' }, 401);
    }

    const body = await c.req.json();
    const {
      citaId,
      pacienteId,
      doctorId,
      diagnostico,
      evolucion,
      vitales,
      unidadId,
      observaciones
    } = body;

    // Validaciones básicas
    if (!pacienteId) {
      return c.json({
        success: false,
        message: 'El ID del paciente es obligatorio'
      }, 400);
    }

    // Generar nota de ingreso
    const admision = await consultaService.generarNotaIngreso({
      citaId,
      pacienteId,
      doctorId: doctorId || user.id,
      diagnostico,
      evolucion,
      vitales,
      unidadId,
      observaciones
    });

    // Registrar auditoría
    await prisma.auditoriaHCE.create({
      data: {
        entidad: 'Admision',
        entidadId: admision.id,
        accion: 'Creacion',
        usuarioId: user.id,
        nombreUsuario: `${user.nombre || ''} ${user.apellido || ''}`.trim() || 'Doctor',
        rol: user.rol || 'Doctor',
        valoresNuevos: admision,
        ipOrigen: c.req.header('x-forwarded-for') || '127.0.0.1',
      },
    });

    return c.json({
      success: true,
      message: 'Nota de ingreso generada exitosamente. El paciente ha sido registrado para hospitalización.',
      data: admision
    }, 201);

  } catch (error) {
    console.error('Error generando nota de ingreso:', error);
    return c.json({
      success: false,
      message: 'Error al generar la nota de ingreso',
      error: error.message
    }, 500);
  }
});

module.exports = consultasRouter;
