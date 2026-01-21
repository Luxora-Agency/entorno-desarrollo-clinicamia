const prisma = require('../db/prisma');

/**
 * Servicio para gestionar consultas médicas
 * Detecta si es primera consulta vs control y gestiona el flujo
 */
class ConsultaService {
  /**
   * Verifica si es la primera consulta del paciente
   * @param {string} pacienteId - ID del paciente
   * @returns {Promise<boolean>} - true si es primera consulta
   */
  async esPrimeraConsulta(pacienteId) {
    const evolucionesPrevias = await prisma.evolucionClinica.count({
      where: { pacienteId }
    });

    return evolucionesPrevias === 0;
  }

  /**
   * Obtiene la última consulta del paciente
   * @param {string} pacienteId - ID del paciente
   * @returns {Promise<object|null>} - Última evolución clínica o null
   */
  async obtenerUltimaConsulta(pacienteId) {
    const consulta = await prisma.evolucionClinica.findFirst({
      where: { pacienteId },
      orderBy: { fechaEvolucion: 'desc' },
      include: {
        doctor: {
          select: {
            nombre: true,
            apellido: true,
            doctor: {
              select: {
                especialidades: {
                  include: {
                    especialidad: true
                  }
                }
              }
            }
          }
        },
        diagnosticos: true
      }
    });

    if (consulta && consulta.doctor) {
      let especialidad = 'Medicina General';
      if (consulta.doctor.doctor && consulta.doctor.doctor.especialidades && consulta.doctor.doctor.especialidades.length > 0) {
        especialidad = consulta.doctor.doctor.especialidades.map(e => e.especialidad.titulo).join(', ');
      }
      consulta.doctor.especialidad = especialidad;
      delete consulta.doctor.doctor;
    }

    return consulta;
  }

  /**
   * Obtiene información completa del tipo de consulta
   * @param {string} pacienteId - ID del paciente
   * @returns {Promise<object>} - Información del tipo de consulta
   */
  async obtenerTipoConsulta(pacienteId) {
    const esPrimera = await this.esPrimeraConsulta(pacienteId);
    const ultimaConsulta = esPrimera ? null : await this.obtenerUltimaConsulta(pacienteId);

    return {
      esPrimeraConsulta: esPrimera,
      ultimaConsulta: ultimaConsulta,
      tipo: esPrimera ? 'primera' : 'control',
      mensaje: esPrimera
        ? 'Primera consulta del paciente - Complete toda la información de anamnesis y antecedentes'
        : `Consulta de control - Última consulta: ${ultimaConsulta?.fechaEvolucion?.toLocaleDateString('es-CO')}`
    };
  }

  /**
   * Obtiene el historial de consultas del paciente
   * @param {string} pacienteId - ID del paciente
   * @param {number} limit - Límite de consultas a retornar
   * @returns {Promise<array>} - Array de evoluciones clínicas con signos vitales
   */
  async obtenerHistorialConsultas(pacienteId, limit = 10) {
    console.log('[ConsultaService] obtenerHistorialConsultas - pacienteId:', pacienteId, 'limit:', limit);
    const consultas = await prisma.evolucionClinica.findMany({
      where: { pacienteId },
      orderBy: { fechaEvolucion: 'desc' },
      take: limit,
      include: {
        doctor: {
          select: {
            nombre: true,
            apellido: true,
            doctor: {
              select: {
                especialidades: {
                  include: {
                    especialidad: true
                  }
                }
              }
            }
          }
        },
        diagnosticos: true,
        cita: {
          select: {
            id: true,
            signosVitales: {
              orderBy: { fechaRegistro: 'desc' },
              take: 1
            }
          }
        }
      }
    });

    console.log('[ConsultaService] obtenerHistorialConsultas - Encontradas:', consultas.length, 'consultas');

    return consultas.map(consulta => {
      if (consulta.doctor) {
        let especialidad = 'Medicina General';
        if (consulta.doctor.doctor && consulta.doctor.doctor.especialidades && consulta.doctor.doctor.especialidades.length > 0) {
          especialidad = consulta.doctor.doctor.especialidades.map(e => e.especialidad.titulo).join(', ');
        }
        consulta.doctor.especialidad = especialidad;
        delete consulta.doctor.doctor;
      }
      // Extraer signos vitales del primer registro de la cita
      if (consulta.cita?.signosVitales?.length > 0) {
        consulta.vitales = consulta.cita.signosVitales[0];
      }
      delete consulta.cita; // Limpiar la relación después de extraer vitales
      return consulta;
    });
  }

  /**
   * Obtiene la última consulta completa con todos sus datos relacionados
   * Para pre-llenar formularios en consultas de control
   * @param {string} pacienteId - ID del paciente
   * @returns {Promise<object|null>} - Última consulta completa o null
   */
  async obtenerUltimaConsultaCompleta(pacienteId) {
    // Obtener la última evolución clínica
    const evolucion = await prisma.evolucionClinica.findFirst({
      where: { pacienteId },
      orderBy: { fechaEvolucion: 'desc' },
      include: {
        doctor: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            doctor: {
              select: {
                especialidades: {
                  include: { especialidad: true }
                }
              }
            }
          }
        },
        diagnosticos: true,
        cita: {
          select: {
            id: true,
            fecha: true,
            tipoCita: true,
            motivo: true
          }
        }
      }
    });

    if (!evolucion) return null;

    // Obtener signos vitales de la misma fecha
    const vitales = await prisma.signoVital.findFirst({
      where: {
        pacienteId,
        fechaRegistro: {
          gte: new Date(evolucion.fechaEvolucion.getTime() - 24 * 60 * 60 * 1000), // Mismo día
          lte: new Date(evolucion.fechaEvolucion.getTime() + 24 * 60 * 60 * 1000)
        }
      },
      orderBy: { fechaRegistro: 'desc' }
    });

    // Obtener prescripciones/medicamentos
    const prescripciones = await prisma.prescripcion.findMany({
      where: {
        pacienteId,
        fechaPrescripcion: {
          gte: new Date(evolucion.fechaEvolucion.getTime() - 24 * 60 * 60 * 1000),
          lte: new Date(evolucion.fechaEvolucion.getTime() + 24 * 60 * 60 * 1000)
        }
      },
      include: {
        medicamentos: {
          include: {
            producto: {
              select: {
                id: true,
                nombre: true,
                principioActivo: true,
                concentracion: true,
                presentacion: true
              }
            }
          }
        }
      },
      orderBy: { fechaPrescripcion: 'desc' },
      take: 1
    });

    // Obtener órdenes médicas
    const ordenes = await prisma.ordenMedica.findMany({
      where: {
        pacienteId,
        fechaOrden: {
          gte: new Date(evolucion.fechaEvolucion.getTime() - 24 * 60 * 60 * 1000),
          lte: new Date(evolucion.fechaEvolucion.getTime() + 24 * 60 * 60 * 1000)
        }
      },
      include: {
        examenProcedimiento: {
          select: {
            id: true,
            nombre: true,
            tipo: true
          }
        }
      },
      orderBy: { fechaOrden: 'desc' }
    });

    // Formatear respuesta
    const especialidad = evolucion.doctor?.doctor?.especialidades?.[0]?.especialidad?.titulo || 'Medicina General';

    return {
      id: evolucion.id,
      fechaEvolucion: evolucion.fechaEvolucion,
      evolucion: {
        subjetivo: evolucion.subjetivo,
        objetivo: evolucion.objetivo,
        analisis: evolucion.analisis,
        plan: evolucion.plan,
        motivoConsulta: evolucion.motivoConsulta,
        enfermedadActual: evolucion.enfermedadActual,
        revisionPorSistemas: evolucion.revisionPorSistemas,
        examenFisico: evolucion.examenFisico,
        recomendaciones: evolucion.recomendaciones,
        observaciones: evolucion.observaciones
      },
      doctor: evolucion.doctor ? {
        id: evolucion.doctor.id,
        nombre: `${evolucion.doctor.nombre} ${evolucion.doctor.apellido}`,
        especialidad
      } : null,
      diagnosticos: evolucion.diagnosticos || [],
      vitales: vitales || null,
      prescripciones: prescripciones?.[0]?.medicamentos || [],
      ordenes: ordenes || [],
      cita: evolucion.cita
    };
  }

  /**
   * Obtiene datos frecuentes del paciente (medicamentos, diagnósticos, órdenes)
   * @param {string} pacienteId - ID del paciente
   * @returns {Promise<object>} - Datos frecuentes
   */
  async obtenerFrecuentes(pacienteId) {
    // Medicamentos más recetados
    const medicamentosFrecuentes = await prisma.prescripcionMedicamento.groupBy({
      by: ['productoId'],
      where: {
        prescripcion: { pacienteId }
      },
      _count: { productoId: true },
      orderBy: { _count: { productoId: 'desc' } },
      take: 10
    });

    // Obtener detalles de los medicamentos
    const medicamentosDetalles = await Promise.all(
      medicamentosFrecuentes.map(async (m) => {
        const producto = await prisma.producto.findUnique({
          where: { id: m.productoId },
          select: {
            id: true,
            nombre: true,
            principioActivo: true,
            concentracion: true,
            presentacion: true
          }
        });

        // Obtener la última prescripción de este medicamento
        const ultimaPrescripcion = await prisma.prescripcionMedicamento.findFirst({
          where: {
            productoId: m.productoId,
            prescripcion: { pacienteId }
          },
          orderBy: { createdAt: 'desc' },
          select: {
            dosis: true,
            via: true,
            frecuencia: true,
            duracionDias: true,
            instrucciones: true
          }
        });

        return {
          productoId: m.productoId,
          vecesRecetado: m._count.productoId,
          producto,
          ultimaDosis: ultimaPrescripcion
        };
      })
    );

    // Diagnósticos más frecuentes
    const diagnosticosFrecuentes = await prisma.diagnosticoHCE.groupBy({
      by: ['codigoCIE11', 'descripcionCIE11'],
      where: { pacienteId },
      _count: { codigoCIE11: true },
      orderBy: { _count: { codigoCIE11: 'desc' } },
      take: 10
    });

    // Órdenes más frecuentes (filtrar nulls después del groupBy)
    const ordenesFrecuentesRaw = await prisma.ordenMedica.groupBy({
      by: ['examenProcedimientoId'],
      where: { pacienteId },
      _count: { examenProcedimientoId: true },
      orderBy: { _count: { examenProcedimientoId: 'desc' } },
      take: 15 // Tomar más para compensar posibles nulls
    });

    // Filtrar nulls y limitar a 10
    const ordenesFrecuentes = ordenesFrecuentesRaw
      .filter(o => o.examenProcedimientoId !== null)
      .slice(0, 10);

    // Obtener detalles de las órdenes
    const ordenesDetalles = await Promise.all(
      ordenesFrecuentes.map(async (o) => {
        const examen = await prisma.examenProcedimiento.findUnique({
          where: { id: o.examenProcedimientoId },
          select: {
            id: true,
            nombre: true,
            tipo: true
          }
        });
        return {
          examenId: o.examenProcedimientoId,
          vecesOrdenado: o._count.examenProcedimientoId,
          examen
        };
      })
    );

    return {
      medicamentos: medicamentosDetalles.filter(m => m.producto),
      diagnosticos: diagnosticosFrecuentes.map(d => ({
        codigoCIE11: d.codigoCIE11,
        descripcion: d.descripcionCIE11,
        vecesRegistrado: d._count.codigoCIE11
      })),
      ordenes: ordenesDetalles.filter(o => o.examen)
    };
  }

  /**
   * Valida los datos de la consulta según el tipo
   * @param {object} data - Datos de la consulta
   * @param {boolean} esPrimera - Si es primera consulta
   * @returns {object} - Datos validados
   */
  validarDatosConsulta(data, esPrimera) {
    const errores = [];

    // Campos obligatorios para primera consulta
    if (esPrimera) {
      if (!data.motivoConsulta) {
        errores.push('El motivo de consulta es obligatorio en primera consulta');
      }
      if (!data.enfermedadActual) {
        errores.push('La enfermedad actual es obligatoria en primera consulta');
      }
    }

    // Campos obligatorios para todas las consultas
    if (!data.subjetivo || !data.objetivo || !data.analisis || !data.plan) {
      errores.push('Los campos SOAP son obligatorios');
    }

    if (errores.length > 0) {
      throw new Error(errores.join(', '));
    }

    return {
      ...data,
      esPrimeraConsulta: esPrimera
    };
  }

  /**
   * Genera una nota de ingreso para hospitalización desde una consulta
   * @param {object} data - Datos de la consulta
   * @returns {Promise<object>} - Admisión creada
   */
  async generarNotaIngreso(data) {
    const {
      citaId,
      pacienteId,
      doctorId,
      diagnostico,
      evolucion,
      vitales,
      unidadId, // Opcional: si no viene, buscar unidad de hospitalización por defecto
      observaciones
    } = data;

    // Buscar unidad de hospitalización si no se especifica
    let unidadHospitalizacion = unidadId;
    if (!unidadHospitalizacion) {
      const unidad = await prisma.unidad.findFirst({
        where: {
          activo: true,
          tipo: { in: ['Hospitalizacion', 'hospitalizacion', 'HOSPITALIZACION', 'Medicina Interna', 'General'] }
        }
      });

      if (!unidad) {
        // Si no hay unidad de hospitalización, buscar cualquier unidad activa
        const cualquierUnidad = await prisma.unidad.findFirst({
          where: { activo: true }
        });
        if (!cualquierUnidad) {
          throw new Error('No hay unidades disponibles para hospitalización');
        }
        unidadHospitalizacion = cualquierUnidad.id;
      } else {
        unidadHospitalizacion = unidad.id;
      }
    }

    // Construir descripción del diagnóstico
    let diagnosticoTexto = 'Pendiente de diagnóstico';
    if (diagnostico) {
      if (diagnostico.descripcionCIE11) {
        diagnosticoTexto = `${diagnostico.codigoCIE11 || ''} - ${diagnostico.descripcionCIE11}`;
      } else if (diagnostico.descripcion) {
        diagnosticoTexto = `${diagnostico.codigoCIE10 || diagnostico.codigoCIE11 || ''} - ${diagnostico.descripcion}`;
      }
    }

    // Construir motivo de ingreso desde evolución
    let motivoIngreso = 'Hospitalización indicada desde consulta externa';
    if (evolucion) {
      if (evolucion.subjetivo) {
        motivoIngreso = evolucion.subjetivo.substring(0, 500); // Limitar a 500 caracteres
      } else if (evolucion.analisis) {
        motivoIngreso = evolucion.analisis.substring(0, 500);
      }
    }

    // Crear admisión en transacción
    const resultado = await prisma.$transaction(async (tx) => {
      // 1. Crear la admisión
      const admision = await tx.admision.create({
        data: {
          pacienteId,
          unidadId: unidadHospitalizacion,
          motivoIngreso,
          diagnosticoIngreso: diagnosticoTexto,
          estado: 'Activa',
          responsableIngreso: doctorId,
          observaciones: observaciones || 'Ingreso generado desde consulta externa - Requiere asignación de cama',
        },
        include: {
          paciente: {
            select: {
              id: true,
              nombre: true,
              apellido: true,
              cedula: true
            }
          },
          unidad: {
            select: {
              id: true,
              nombre: true,
              tipo: true
            }
          }
        }
      });

      // 2. Crear evolución clínica de tipo Ingreso
      if (evolucion) {
        await tx.evolucionClinica.create({
          data: {
            pacienteId,
            admisionId: admision.id,
            doctorId,
            subjetivo: evolucion.subjetivo || '',
            objetivo: evolucion.objetivo || '',
            analisis: evolucion.analisis || '',
            plan: evolucion.plan || '',
            tipoEvolucion: 'Ingreso',
            fechaEvolucion: new Date(),
            motivoConsulta: evolucion.motivoConsulta || motivoIngreso,
          }
        });
      }

      // 3. Copiar signos vitales si existen
      if (vitales) {
        const limitarValor = (valor, max) => {
          if (!valor) return null;
          const num = parseFloat(valor);
          return num > max ? max : num;
        };

        await tx.signoVital.create({
          data: {
            pacienteId,
            admisionId: admision.id,
            registradoPor: doctorId,
            // Signos vitales básicos
            temperatura: vitales.temperatura ? limitarValor(vitales.temperatura, 99.9) : null,
            presionSistolica: vitales.presionSistolica ? parseInt(vitales.presionSistolica) : null,
            presionDiastolica: vitales.presionDiastolica ? parseInt(vitales.presionDiastolica) : null,
            frecuenciaCardiaca: vitales.frecuenciaCardiaca ? parseInt(vitales.frecuenciaCardiaca) : null,
            frecuenciaRespiratoria: vitales.frecuenciaRespiratoria ? parseInt(vitales.frecuenciaRespiratoria) : null,
            saturacionOxigeno: vitales.saturacionOxigeno ? limitarValor(vitales.saturacionOxigeno, 100) : null,
            peso: vitales.peso ? limitarValor(vitales.peso, 999.99) : null,
            talla: vitales.talla ? limitarValor(vitales.talla, 999.99) : null,
            imc: (vitales.peso && vitales.talla)
              ? parseFloat((parseFloat(vitales.peso) / Math.pow(parseFloat(vitales.talla) / 100, 2)).toFixed(2))
              : null,
            // Antropometría adicional
            perimetroAbdominal: vitales.perimetroAbdominal ? limitarValor(vitales.perimetroAbdominal, 999.99) : null,
            perimetroCefalico: vitales.perimetroCefalico ? limitarValor(vitales.perimetroCefalico, 999.99) : null,
            // Función renal
            creatinina: vitales.creatinina ? limitarValor(vitales.creatinina, 99.99) : null,
            tfgCkdEpi: vitales.tfg_ckdepi ? limitarValor(vitales.tfg_ckdepi, 999.99) : null,
            potasio: vitales.potasio ? limitarValor(vitales.potasio, 99.99) : null,
            calcio: vitales.calcio ? limitarValor(vitales.calcio, 99.99) : null,
            pth: vitales.pth ? limitarValor(vitales.pth, 999.99) : null,
            // Perfil metabólico
            glucosaAyunas: vitales.glucosaAyunas ? limitarValor(vitales.glucosaAyunas, 999.99) : null,
            hba1c: vitales.hba1c ? limitarValor(vitales.hba1c, 99.99) : null,
            // Perfil lipídico
            colesterolTotal: vitales.colesterolTotal ? limitarValor(vitales.colesterolTotal, 999.99) : null,
            colesterolHDL: vitales.colesterolHDL ? limitarValor(vitales.colesterolHDL, 999.99) : null,
            colesterolLDL: vitales.colesterolLDL ? limitarValor(vitales.colesterolLDL, 999.99) : null,
            trigliceridos: vitales.trigliceridos ? limitarValor(vitales.trigliceridos, 999.99) : null,
            // Perfil tiroideo
            tsh: vitales.tsh ? limitarValor(vitales.tsh, 999.999) : null,
            tiroxinaLibre: vitales.tiroxinaLibre ? limitarValor(vitales.tiroxinaLibre, 99.99) : null,
            tiroglobulina: vitales.tiroglobulina ? limitarValor(vitales.tiroglobulina, 99999.99) : null,
            anticuerposAntitiroglobulina: vitales.anticuerposAntitiroglobulina ? limitarValor(vitales.anticuerposAntitiroglobulina, 99999.99) : null,
            analisisTiroideo: vitales.analisisTiroideo || null,
          }
        });
      }

      // 4. Copiar diagnóstico a la admisión si existe
      if (diagnostico && diagnostico.codigoCIE11) {
        await tx.diagnosticoHCE.create({
          data: {
            pacienteId,
            admisionId: admision.id,
            doctorId,
            codigoCIE11: diagnostico.codigoCIE11 || diagnostico.codigoCIE10,
            descripcionCIE11: diagnostico.descripcionCIE11 || diagnostico.descripcion,
            tipoDiagnostico: 'Principal',
            estadoDiagnostico: 'Activo',
            observaciones: 'Diagnóstico de ingreso hospitalario'
          }
        });
      }

      // 5. Actualizar la cita original si existe
      if (citaId) {
        await tx.cita.update({
          where: { id: citaId },
          data: {
            admisionId: admision.id,
            estado: 'Completada'
          }
        });
      }

      return admision;
    });

    return resultado;
  }
}

module.exports = new ConsultaService();
