const { Hono } = require('hono');
const { PrismaClient } = require('@prisma/client');
const { authMiddleware } = require('../middleware/auth');
const prisma = new PrismaClient();

const consultasRouter = new Hono();

// Todas las rutas requieren autenticación
consultasRouter.use('*', authMiddleware);

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
    } = body;

    // Validar que venga el SOAP (obligatorio)
    if (!soap || !soap.subjetivo || !soap.objetivo || !soap.analisis || !soap.plan) {
      return c.json({ message: 'Los datos SOAP son obligatorios' }, 400);
    }

    // Usar transacción para garantizar atomicidad
    const resultado = await prisma.$transaction(async (tx) => {
      const resultados = {};

      // 1. Guardar Evolución SOAP (obligatorio)
      const evolucion = await tx.evolucionClinica.create({
        data: {
          pacienteId,
          citaId,
          doctorId,
          subjetivo: soap.subjetivo,
          objetivo: soap.objetivo,
          analisis: soap.analisis,
          plan: soap.plan,
          tipoEvolucion: 'Seguimiento', // Seguimiento para consulta ambulatoria
        },
      });
      resultados.evolucion = evolucion;

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
        const diagnosticoHCE = await tx.diagnosticoHCE.create({
          data: {
            pacienteId,
            evolucionId: evolucion.id,
            doctorId,
            codigoCIE11: diagnostico.codigoCIE11,
            descripcionCIE11: diagnostico.descripcionCIE11,
            tipoDiagnostico: diagnostico.tipoDiagnostico || 'Principal',
            estadoDiagnostico: 'Activo',
            observaciones: diagnostico.observaciones,
          },
        });
        resultados.diagnostico = diagnosticoHCE;
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

      // 5. Guardar Procedimientos/Exámenes (múltiples órdenes)
      if (procedimientos && Array.isArray(procedimientos) && procedimientos.length > 0) {
        const ordenesCreadas = [];
        const citasCreadas = [];
        
        for (const orden of procedimientos) {
          // Crear OrdenMedica
          const ordenMedica = await tx.ordenMedica.create({
            data: {
              pacienteId,
              citaId, // La consulta actual que genera la orden
              examenProcedimientoId: orden.servicioId,
              doctorId,
              precioAplicado: parseFloat(orden.costo),
              observaciones: orden.observaciones || '',
              estado: 'Pendiente',
            },
          });
          ordenesCreadas.push(ordenMedica);
          
          // Crear Cita con estado PorAgendar (sin fecha/hora/doctor)
          const citaPorAgendar = await tx.cita.create({
            data: {
              pacienteId,
              tipoCita: orden.tipo, // 'Procedimiento' o 'Examen'
              examenProcedimientoId: orden.servicioId,
              costo: parseFloat(orden.costo),
              motivo: orden.servicioNombre,
              estado: 'PorAgendar',
              // fecha, hora, doctorId son NULL
            },
          });
          citasCreadas.push(citaPorAgendar);
        }
        
        resultados.ordenesMedicas = ordenesCreadas;
        resultados.citasPorAgendar = citasCreadas;
      }

      // 6. Guardar Prescripciones (si las hay)
      if (prescripciones && prescripciones.medicamentos && prescripciones.medicamentos.length > 0) {
        // Crear una Prescripción (receta médica)
        const prescripcion = await tx.prescripcion.create({
          data: {
            pacienteId,
            citaId,
            medicoId: doctorId,
            diagnostico: prescripciones.diagnostico || '',
            estado: 'Activa',
            medicamentos: {
              create: prescripciones.medicamentos.map((med) => ({
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
        const totalOrden = prescripciones.medicamentos.reduce((sum, med) => sum + parseFloat(med.precio || 0), 0);
        
        const ordenMedicamento = await tx.ordenMedicamento.create({
          data: {
            pacienteId,
            citaId,
            doctorId,
            estado: 'Pendiente',
            observaciones: prescripciones.diagnostico || 'Orden generada desde consulta',
            total: totalOrden,
            items: {
              create: prescripciones.medicamentos.map((med) => ({
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

        resultados.prescripcion = prescripcion;
        resultados.ordenMedicamento = ordenMedicamento;
      }

      // 7. Cambiar estado de la cita a "Completada"
      const citaActualizada = await tx.cita.update({
        where: { id: citaId },
        data: { estado: 'Completada' },
      });
      resultados.cita = citaActualizada;

      return resultados;
    });

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

module.exports = consultasRouter;
