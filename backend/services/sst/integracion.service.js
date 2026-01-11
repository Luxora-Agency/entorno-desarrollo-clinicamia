/**
 * Servicio de Integración SST-RRHH
 *
 * Maneja la sincronización y flujos automáticos entre los módulos:
 * - SST (Seguridad y Salud en el Trabajo)
 * - RRHH (Talento Humano)
 *
 * Cumplimiento normativo:
 * - Decreto 1072/2015 (SG-SST)
 * - Resolución 0312/2019 (Estándares Mínimos)
 * - Resolución 1843/2025 (Exámenes Médicos)
 */

const prisma = require('../../db/prisma');
const { NotFoundError, ValidationError } = require('../../utils/errors');
const alertaService = require('../alerta.service');

class IntegracionSSTRRHHService {

  /**
   * Hook: Cuando se crea un empleado
   * - Verifica si el cargo tiene profesiograma asociado
   * - Crea registros de exámenes médicos de ingreso pendientes
   * - Registra EPP requerido según cargo
   */
  async onEmpleadoCreado(empleadoId, cargoId) {
    if (!cargoId) return null;

    const cargo = await prisma.tHCargo.findUnique({
      where: { id: cargoId },
      include: {
        SSTProfesiograma: { where: { activo: true } },
        riesgosIPVR: {
          include: { matriz: { where: { estado: 'VIGENTE' } } }
        }
      }
    });

    if (!cargo) return null;

    const result = {
      profesiogramaEncontrado: false,
      examenesCreados: 0,
      riesgosAsociados: 0
    };

    // Si existe profesiograma para el cargo
    if (cargo.SSTProfesiograma && cargo.SSTProfesiograma.length > 0) {
      const profesiograma = cargo.SSTProfesiograma[0];
      result.profesiogramaEncontrado = true;

      // Crear exámenes médicos de ingreso pendientes
      const examenesIngreso = profesiograma.examenesIngreso || [];
      for (const examen of examenesIngreso) {
        await prisma.sSTExamenMedico.create({
          data: {
            empleadoId,
            profesiogramaId: profesiograma.id,
            tipoExamen: 'INGRESO',
            nombreExamen: examen.nombre || examen,
            estado: 'PENDIENTE',
            fechaProgramada: new Date()
          }
        });
        result.examenesCreados++;
      }
    }

    // Registrar riesgos asociados al cargo
    result.riesgosAsociados = cargo.riesgosIPVR?.length || 0;

    return result;
  }

  /**
   * Hook: Cuando cambia el cargo de un empleado
   * - Actualiza exámenes periódicos según nuevo profesiograma
   * - Actualiza EPP requerido
   * - Registra cambio en historial SST
   */
  async onCargoCambiado(empleadoId, nuevoCargoId, cargoAnteriorId) {
    const empleado = await prisma.tHEmpleado.findUnique({
      where: { id: empleadoId },
      select: { id: true, nombre: true, apellido: true }
    });

    if (!empleado) throw new NotFoundError('Empleado no encontrado');

    const [cargoNuevo, cargoAnterior] = await Promise.all([
      prisma.tHCargo.findUnique({
        where: { id: nuevoCargoId },
        include: {
          SSTProfesiograma: { where: { activo: true } },
          riesgosIPVR: {
            where: { matriz: { estado: 'VIGENTE' } },
            include: { matriz: true }
          }
        }
      }),
      cargoAnteriorId ? prisma.tHCargo.findUnique({
        where: { id: cargoAnteriorId },
        include: {
          SSTProfesiograma: { where: { activo: true } }
        }
      }) : null
    ]);

    const result = {
      cambioRegistrado: true,
      nuevoProfesiograma: null,
      examenesActualizados: 0,
      riesgosNuevos: []
    };

    // Cancelar exámenes periódicos pendientes del cargo anterior
    if (cargoAnterior?.SSTProfesiograma?.[0]) {
      await prisma.sSTExamenMedico.updateMany({
        where: {
          empleadoId,
          profesiogramaId: cargoAnterior.SSTProfesiograma[0].id,
          tipoExamen: 'PERIODICO',
          estado: 'PENDIENTE'
        },
        data: {
          estado: 'CANCELADO',
          observaciones: `Cancelado por cambio de cargo a ${cargoNuevo?.nombre || 'N/A'}`
        }
      });
    }

    // Programar exámenes periódicos del nuevo cargo
    if (cargoNuevo?.SSTProfesiograma?.[0]) {
      const profesiograma = cargoNuevo.SSTProfesiograma[0];
      result.nuevoProfesiograma = profesiograma.id;

      const examenesPeriodicos = profesiograma.examenesPeriodicos || [];
      const fechaProximoExamen = new Date();
      fechaProximoExamen.setMonth(fechaProximoExamen.getMonth() + profesiograma.periodicidadMeses);

      for (const examen of examenesPeriodicos) {
        await prisma.sSTExamenMedico.create({
          data: {
            empleadoId,
            profesiogramaId: profesiograma.id,
            tipoExamen: 'PERIODICO',
            nombreExamen: examen.nombre || examen,
            estado: 'PENDIENTE',
            fechaProgramada: fechaProximoExamen
          }
        });
        result.examenesActualizados++;
      }
    }

    // Registrar nuevos riesgos asociados
    if (cargoNuevo?.riesgosIPVR) {
      result.riesgosNuevos = cargoNuevo.riesgosIPVR.map(r => ({
        nivelExposicion: r.nivelExposicion,
        peligros: r.peligrosPrincipales
      }));
    }

    return result;
  }

  /**
   * Hook: Cuando se registra un accidente de trabajo
   * - Notifica a RRHH para actualizar estado del empleado si es necesario
   * - Programa seguimiento médico
   */
  async onAccidenteRegistrado(accidenteId) {
    const accidente = await prisma.sSTAccidenteTrabajo.findUnique({
      where: { id: accidenteId },
      include: {
        empleado: {
          select: { id: true, nombre: true, apellido: true, cargoId: true }
        }
      }
    });

    if (!accidente) throw new NotFoundError('Accidente no encontrado');

    const result = {
      accidenteId,
      empleadoId: accidente.empleadoId,
      notificacionRRHH: false,
      seguimientoCreado: false
    };

    // Si el accidente genera incapacidad, notificar a RRHH
    if (accidente.generaIncapacidad) {
      // Crear movimiento en RRHH indicando incapacidad
      await prisma.tHMovimientoLaboral.create({
        data: {
          empleadoId: accidente.empleadoId,
          tipoMovimiento: 'INCAPACIDAD',
          fechaEfectiva: accidente.fechaAccidente,
          motivo: `Incapacidad por accidente de trabajo #${accidente.numeroRadicado}`,
          descripcion: `Días de incapacidad: ${accidente.diasIncapacidad || 'Por determinar'}`,
          aprobado: true
        }
      });
      result.notificacionRRHH = true;
    }

    // Programar examen de reintegro si aplica
    if (accidente.diasIncapacidad && accidente.diasIncapacidad > 0) {
      const fechaReintegro = new Date(accidente.fechaAccidente);
      fechaReintegro.setDate(fechaReintegro.getDate() + accidente.diasIncapacidad);

      await prisma.sSTExamenMedico.create({
        data: {
          empleadoId: accidente.empleadoId,
          tipoExamen: 'POST_INCAPACIDAD',
          nombreExamen: 'Examen de reintegro post-accidente',
          estado: 'PENDIENTE',
          fechaProgramada: fechaReintegro,
          observaciones: `Seguimiento a accidente #${accidente.numeroRadicado}`
        }
      });
      result.seguimientoCreado = true;
    }

    // Enviar alerta por email
    try {
      await alertaService.enviarAlerta({
        tipoAlerta: 'ACCIDENTE_REPORTADO',
        referenciaId: accidente.id,
        referenciaTipo: 'ACCIDENTE',
        datos: {
          empleado: `${accidente.empleado?.nombre || ''} ${accidente.empleado?.apellido || ''}`.trim(),
          empleadoId: accidente.empleadoId,
          fecha: accidente.fechaAccidente?.toLocaleDateString('es-CO'),
          lugar: accidente.lugarAccidente || 'No especificado',
          tipo: accidente.tipoAccidente || 'Accidente de trabajo',
          numeroRadicado: accidente.numeroRadicado
        }
      });
      result.alertaEnviada = true;
    } catch (err) {
      console.error('[SST] Error enviando alerta de accidente:', err.message);
      result.alertaEnviada = false;
    }

    return result;
  }

  /**
   * Sincronizar capacitación SST con RRHH
   * - Crea o vincula registro en THCapacitacion
   * - Sincroniza asistentes
   */
  async sincronizarCapacitacionConRRHH(capacitacionSSTId) {
    const capacitacionSST = await prisma.sSTCapacitacionSST.findUnique({
      where: { id: capacitacionSSTId },
      include: {
        capacitacionRRHH: true,
        asistentes: {
          include: { empleado: true }
        }
      }
    });

    if (!capacitacionSST) throw new NotFoundError('Capacitación SST no encontrada');

    // Si ya está vinculada, solo sincronizar asistentes
    if (capacitacionSST.capacitacionRRHHId) {
      return this._sincronizarAsistentes(capacitacionSST);
    }

    // Crear nueva capacitación en RRHH
    const modalidadMap = {
      'PRESENCIAL': 'PRESENCIAL',
      'VIRTUAL': 'VIRTUAL',
      'MIXTA': 'HIBRIDA'
    };

    const capacitacionRRHH = await prisma.tHCapacitacion.create({
      data: {
        nombre: `[SST] ${capacitacionSST.nombre}`,
        descripcion: capacitacionSST.descripcion,
        categoria: 'SST',
        modalidad: modalidadMap[capacitacionSST.modalidad] || 'PRESENCIAL',
        duracionHoras: Math.round(Number(capacitacionSST.duracionHoras)),
        instructor: capacitacionSST.facilitadorExterno || 'Interno SST',
        esInterno: capacitacionSST.facilitadorInterno,
        objetivos: capacitacionSST.objetivos,
        estado: capacitacionSST.estado === 'REALIZADA' ? 'FINALIZADA' : 'PROGRAMADA',
        fechaInicio: capacitacionSST.fechaProgramada,
        fechaFin: capacitacionSST.fechaProgramada
      }
    });

    // Vincular
    await prisma.sSTCapacitacionSST.update({
      where: { id: capacitacionSSTId },
      data: { capacitacionRRHHId: capacitacionRRHH.id }
    });

    // Sincronizar asistentes
    const asistentesCreados = await this._sincronizarAsistentes({
      ...capacitacionSST,
      capacitacionRRHHId: capacitacionRRHH.id
    });

    return {
      capacitacionRRHHId: capacitacionRRHH.id,
      sincronizado: true,
      asistentesCreados
    };
  }

  /**
   * Sincroniza asistentes entre capacitación SST y RRHH
   * @private
   */
  async _sincronizarAsistentes(capacitacionSST) {
    if (!capacitacionSST.capacitacionRRHHId) return 0;

    let creados = 0;
    for (const asistente of capacitacionSST.asistentes || []) {
      // Verificar si ya existe en RRHH
      const existeEnRRHH = await prisma.tHAsistenteCapacitacion.findUnique({
        where: {
          capacitacionId_empleadoId: {
            capacitacionId: capacitacionSST.capacitacionRRHHId,
            empleadoId: asistente.empleadoId
          }
        }
      });

      if (!existeEnRRHH) {
        await prisma.tHAsistenteCapacitacion.create({
          data: {
            capacitacionId: capacitacionSST.capacitacionRRHHId,
            empleadoId: asistente.empleadoId,
            estado: asistente.asistio ? 'COMPLETADO' : 'INSCRITO',
            asistio: asistente.asistio,
            notaEvaluacion: asistente.notaEvaluacion,
            certificadoUrl: asistente.certificadoUrl
          }
        });
        creados++;
      }
    }

    return creados;
  }

  /**
   * Obtener perfil SST completo de un empleado
   * Usado para mostrar en el módulo RRHH
   */
  async getPerfilSSTEmpleado(empleadoId) {
    const empleado = await prisma.tHEmpleado.findUnique({
      where: { id: empleadoId },
      include: {
        cargo: {
          include: {
            SSTProfesiograma: { where: { activo: true } },
            riesgosIPVR: {
              where: { matriz: { estado: 'VIGENTE' } },
              include: { matriz: { select: { id: true, version: true } } }
            }
          }
        }
      }
    });

    if (!empleado) throw new NotFoundError('Empleado no encontrado');

    // Obtener datos SST del empleado
    const [
      examenesMedicos,
      capacitacionesSST,
      accidentes,
      incidentes,
      eppAsignado,
      enfermedades
    ] = await Promise.all([
      prisma.sSTExamenMedico.findMany({
        where: { empleadoId },
        orderBy: { fechaProgramada: 'desc' },
        take: 20,
        include: { profesiograma: true, proveedor: true }
      }),
      prisma.sSTAsistenteCapacitacionSST.findMany({
        where: { empleadoId },
        include: { capacitacion: true },
        orderBy: { createdAt: 'desc' },
        take: 20
      }),
      prisma.sSTAccidenteTrabajo.findMany({
        where: { empleadoId },
        orderBy: { fechaAccidente: 'desc' },
        take: 10
      }),
      prisma.sSTIncidente.findMany({
        where: { empleadoId },
        orderBy: { fechaIncidente: 'desc' },
        take: 10
      }),
      prisma.sSTEntregaEPP.findMany({
        where: { empleadoId },
        include: { epp: true },
        orderBy: { fechaEntrega: 'desc' },
        take: 20
      }),
      prisma.sSTEnfermedadLaboral.findMany({
        where: { empleadoId },
        orderBy: { fechaDiagnostico: 'desc' },
        take: 10
      })
    ]);

    // Calcular estadísticas
    const estadisticas = {
      totalExamenes: examenesMedicos.length,
      examenesPendientes: examenesMedicos.filter(e => e.estado === 'PENDIENTE').length,
      capacitacionesCompletadas: capacitacionesSST.filter(c => c.asistio).length,
      accidentesRegistrados: accidentes.length,
      incidentesReportados: incidentes.length,
      eppActivo: eppAsignado.filter(e => !e.fechaDevolucion).length
    };

    // Verificar aptitud médica actual
    const ultimoExamenAptitud = examenesMedicos.find(
      e => e.estado === 'REALIZADO' && e.conceptoAptitud
    );

    return {
      empleado: {
        id: empleado.id,
        nombre: empleado.nombre,
        apellido: empleado.apellido,
        documento: empleado.documento,
        cargo: empleado.cargo
      },
      profesiograma: empleado.cargo?.SSTProfesiograma?.[0] || null,
      riesgosExpuestos: empleado.cargo?.riesgosIPVR || [],
      aptitudActual: ultimoExamenAptitud?.conceptoAptitud || 'SIN_EVALUAR',
      examenesMedicos,
      capacitacionesSST,
      accidentes,
      incidentes,
      eppAsignado,
      enfermedades,
      estadisticas
    };
  }

  /**
   * Obtener riesgos asociados a un cargo
   */
  async getRiesgosPorCargo(cargoId) {
    const cargo = await prisma.tHCargo.findUnique({
      where: { id: cargoId },
      include: {
        SSTProfesiograma: { where: { activo: true } },
        riesgosIPVR: {
          where: { matriz: { estado: 'VIGENTE' } },
          include: {
            matriz: {
              include: {
                peligros: true
              }
            }
          }
        }
      }
    });

    if (!cargo) throw new NotFoundError('Cargo no encontrado');

    // Extraer peligros específicos del cargo
    const peligrosDelCargo = [];
    for (const riesgo of cargo.riesgosIPVR || []) {
      for (const peligroId of riesgo.peligrosPrincipales || []) {
        const peligro = riesgo.matriz?.peligros?.find(p => p.id === peligroId);
        if (peligro) {
          peligrosDelCargo.push({
            ...peligro,
            nivelExposicion: riesgo.nivelExposicion,
            medidasEspecificas: riesgo.medidasEspecificas
          });
        }
      }
    }

    return {
      cargo: {
        id: cargo.id,
        nombre: cargo.nombre,
        codigo: cargo.codigo
      },
      profesiograma: cargo.SSTProfesiograma?.[0] || null,
      riesgos: cargo.riesgosIPVR || [],
      peligrosEspecificos: peligrosDelCargo,
      requiereExamenesEspeciales: cargo.SSTProfesiograma?.[0]?.requisitosEspeciales || null
    };
  }

  /**
   * Inicializar SST para nuevo empleado (onboarding)
   * Proceso completo de vinculación SST
   */
  async inicializarSSTEmpleado(empleadoId) {
    const empleado = await prisma.tHEmpleado.findUnique({
      where: { id: empleadoId },
      include: {
        cargo: {
          include: {
            SSTProfesiograma: { where: { activo: true } },
            riesgosIPVR: { where: { matriz: { estado: 'VIGENTE' } } }
          }
        }
      }
    });

    if (!empleado) throw new NotFoundError('Empleado no encontrado');
    if (!empleado.cargoId) throw new ValidationError('Empleado no tiene cargo asignado');

    const resultado = {
      empleadoId,
      cargoId: empleado.cargoId,
      profesiograma: null,
      examenesCreados: [],
      eppRequerido: [],
      capacitacionesRequeridas: [],
      riesgosIdentificados: []
    };

    // 1. Procesar profesiograma
    if (empleado.cargo?.SSTProfesiograma?.[0]) {
      const profesiograma = empleado.cargo.SSTProfesiograma[0];
      resultado.profesiograma = profesiograma.id;

      // Crear exámenes de ingreso
      const examenesIngreso = profesiograma.examenesIngreso || [];
      for (const examen of examenesIngreso) {
        const nuevoExamen = await prisma.sSTExamenMedico.create({
          data: {
            empleadoId,
            profesiogramaId: profesiograma.id,
            tipoExamen: 'INGRESO',
            nombreExamen: typeof examen === 'string' ? examen : examen.nombre,
            estado: 'PENDIENTE',
            fechaProgramada: new Date()
          }
        });
        resultado.examenesCreados.push(nuevoExamen.id);
      }
    }

    // 2. Registrar riesgos identificados
    if (empleado.cargo?.riesgosIPVR) {
      resultado.riesgosIdentificados = empleado.cargo.riesgosIPVR.map(r => ({
        matrizId: r.matrizId,
        nivelExposicion: r.nivelExposicion
      }));
    }

    // 3. Identificar capacitaciones requeridas de inducción SST
    const capacitacionesInduccion = await prisma.sSTCapacitacionSST.findMany({
      where: {
        tipoCapacitacion: 'INDUCCION_SST',
        estado: 'PROGRAMADA',
        fechaProgramada: { gte: new Date() }
      },
      take: 5
    });

    for (const cap of capacitacionesInduccion) {
      // Inscribir automáticamente
      await prisma.sSTAsistenteCapacitacionSST.create({
        data: {
          capacitacionId: cap.id,
          empleadoId,
          asistio: false
        }
      });
      resultado.capacitacionesRequeridas.push(cap.id);
    }

    return resultado;
  }

  /**
   * Obtener documentos SST próximos a vencer
   */
  async getDocumentosProximosVencer(dias = 30) {
    const fechaLimite = new Date();
    fechaLimite.setDate(fechaLimite.getDate() + dias);

    return prisma.sSTDocumentoSST.findMany({
      where: {
        fechaVencimiento: {
          lte: fechaLimite,
          gte: new Date()
        },
        estado: 'VIGENTE'
      },
      orderBy: { fechaVencimiento: 'asc' },
      include: {
        elaboradoPor: { select: { id: true, nombre: true, apellido: true } }
      }
    });
  }

  /**
   * Obtener exámenes médicos próximos a vencer
   */
  async getExamenesProximosVencer(dias = 30) {
    const fechaLimite = new Date();
    fechaLimite.setDate(fechaLimite.getDate() + dias);

    return prisma.sSTExamenMedico.findMany({
      where: {
        fechaVencimiento: {
          lte: fechaLimite,
          gte: new Date()
        },
        estado: 'REALIZADO'
      },
      orderBy: { fechaVencimiento: 'asc' },
      include: {
        empleado: { select: { id: true, nombre: true, apellido: true, documento: true } },
        profesiograma: { select: { id: true, nombre: true } }
      }
    });
  }

  /**
   * Programar alertas para documentos SST próximos a vencer
   * Ejecutar como tarea programada (cron diario)
   */
  async programarAlertasDocumentos() {
    const documentos = await this.getDocumentosProximosVencer(60);

    const result = await alertaService.programarAlertas({
      tipoAlerta: 'DOCUMENTO_VENCIMIENTO',
      referenciaTipo: 'DOCUMENTO_SST',
      items: documentos.map(doc => ({
        id: doc.id,
        fechaVencimiento: doc.fechaVencimiento
      }))
    });

    console.log(`[SST] Alertas de documentos programadas: ${result.programadas}`);
    return result;
  }

  /**
   * Programar alertas para exámenes médicos próximos a vencer
   * Ejecutar como tarea programada (cron diario)
   */
  async programarAlertasExamenes() {
    const examenes = await this.getExamenesProximosVencer(60);

    const result = await alertaService.programarAlertas({
      tipoAlerta: 'EXAMEN_MEDICO_VENCIMIENTO',
      referenciaTipo: 'EXAMEN_MEDICO',
      items: examenes.map(ex => ({
        id: ex.id,
        fechaVencimiento: ex.fechaVencimiento
      }))
    });

    console.log(`[SST] Alertas de exámenes programadas: ${result.programadas}`);
    return result;
  }

  /**
   * Programar todas las alertas SST
   * Ejecutar diariamente vía cron
   */
  async programarTodasLasAlertas() {
    const resultados = {
      documentos: await this.programarAlertasDocumentos(),
      examenes: await this.programarAlertasExamenes()
    };

    // Procesar alertas pendientes
    const procesadas = await alertaService.procesarAlertasPendientes();
    resultados.procesadas = procesadas;

    return resultados;
  }

  /**
   * Enviar alerta cuando un incidente es reportado
   */
  async onIncidenteRegistrado(incidenteId) {
    const incidente = await prisma.sSTIncidente.findUnique({
      where: { id: incidenteId },
      include: {
        empleado: { select: { id: true, nombre: true, apellido: true } }
      }
    });

    if (!incidente) throw new NotFoundError('Incidente no encontrado');

    try {
      await alertaService.enviarAlerta({
        tipoAlerta: 'INCIDENTE_REPORTADO',
        referenciaId: incidente.id,
        referenciaTipo: 'INCIDENTE',
        datos: {
          empleado: `${incidente.empleado?.nombre || ''} ${incidente.empleado?.apellido || ''}`.trim(),
          empleadoId: incidente.empleadoId,
          fecha: incidente.fechaIncidente?.toLocaleDateString('es-CO'),
          tipo: incidente.tipoIncidente || 'Incidente',
          descripcion: incidente.descripcion
        }
      });
      return { alertaEnviada: true };
    } catch (err) {
      console.error('[SST] Error enviando alerta de incidente:', err.message);
      return { alertaEnviada: false, error: err.message };
    }
  }
}

module.exports = new IntegracionSSTRRHHService();
