/**
 * Service de Signos Vitales
 */
const prisma = require('../db/prisma');
const { ValidationError, NotFoundError } = require('../utils/errors');
const auditoriaService = require('./auditoria.service');

class SignosVitalesService {
  /**
   * Obtener signos vitales con filtros
   */
  async getAll({ page = 1, limit = 50, paciente_id, admision_id, fecha_desde, fecha_hasta }) {
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {};
    if (paciente_id) where.pacienteId = paciente_id;
    if (admision_id) where.admisionId = admision_id;
    
    if (fecha_desde || fecha_hasta) {
      where.fechaRegistro = {};
      if (fecha_desde) where.fechaRegistro.gte = new Date(fecha_desde);
      if (fecha_hasta) where.fechaRegistro.lte = new Date(fecha_hasta);
    }

    const [signos, total] = await Promise.all([
      prisma.signoVital.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { fechaRegistro: 'desc' },
        include: {
          paciente: {
            select: {
              id: true,
              nombre: true,
              apellido: true,
            },
          },
          registrador: {
            select: {
              id: true,
              nombre: true,
              apellido: true,
            },
          },
        },
      }),
      prisma.signoVital.count({ where }),
    ]);

    return {
      signos,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    };
  }

  /**
   * Crear registro de signos vitales
   */
  async create(data, usuarioId, usuarioData, ipOrigen = null) {
    if (!data.paciente_id) throw new ValidationError('paciente_id es requerido');

    // Calcular IMC si hay peso y talla
    let imc = null;
    if (data.peso && data.talla) {
      const pesoNum = parseFloat(data.peso);
      const tallaMetros = parseFloat(data.talla) / 100;
      imc = pesoNum / (tallaMetros * tallaMetros);
    }

    const signoVital = await prisma.signoVital.create({
      data: {
        pacienteId: data.paciente_id,
        admisionId: data.admision_id || null,
        registradoPor: usuarioId,
        // Signos vitales básicos
        temperatura: data.temperatura ? parseFloat(data.temperatura) : null,
        presionSistolica: data.presion_sistolica ? parseInt(data.presion_sistolica) : null,
        presionDiastolica: data.presion_diastolica ? parseInt(data.presion_diastolica) : null,
        frecuenciaCardiaca: data.frecuencia_cardiaca ? parseInt(data.frecuencia_cardiaca) : null,
        frecuenciaRespiratoria: data.frecuencia_respiratoria ? parseInt(data.frecuencia_respiratoria) : null,
        saturacionOxigeno: data.saturacion_oxigeno ? parseFloat(data.saturacion_oxigeno) : null,
        peso: data.peso ? parseFloat(data.peso) : null,
        talla: data.talla ? parseFloat(data.talla) : null,
        imc: imc ? parseFloat(imc.toFixed(2)) : null,
        // Antropometría
        perimetroCefalico: data.perimetro_cefalico ? parseFloat(data.perimetro_cefalico) : null,
        perimetroAbdominal: data.perimetro_abdominal ? parseFloat(data.perimetro_abdominal) : null,
        perimetroBraquial: data.perimetro_braquial ? parseFloat(data.perimetro_braquial) : null,
        escalaDolor: data.escala_dolor ? parseInt(data.escala_dolor) : null,
        // Función renal
        creatinina: data.creatinina ? parseFloat(data.creatinina) : null,
        tfgCkdEpi: data.tfg_ckd_epi ? parseFloat(data.tfg_ckd_epi) : null,
        potasio: data.potasio ? parseFloat(data.potasio) : null,
        calcio: data.calcio ? parseFloat(data.calcio) : null,
        pth: data.pth ? parseFloat(data.pth) : null,
        // Perfil metabólico
        glucosaAyunas: data.glucosa_ayunas ? parseFloat(data.glucosa_ayunas) : null,
        hba1c: data.hba1c ? parseFloat(data.hba1c) : null,
        // Perfil lipídico
        colesterolTotal: data.colesterol_total ? parseFloat(data.colesterol_total) : null,
        colesterolHDL: data.colesterol_hdl ? parseFloat(data.colesterol_hdl) : null,
        colesterolLDL: data.colesterol_ldl ? parseFloat(data.colesterol_ldl) : null,
        trigliceridos: data.trigliceridos ? parseFloat(data.trigliceridos) : null,
        // Perfil tiroideo
        tsh: data.tsh ? parseFloat(data.tsh) : null,
        tiroxinaLibre: data.tiroxina_libre ? parseFloat(data.tiroxina_libre) : null,
        tiroglobulina: data.tiroglobulina ? parseFloat(data.tiroglobulina) : null,
        anticuerposAntitiroglobulina: data.anticuerpos_antitiroglobulina ? parseFloat(data.anticuerpos_antitiroglobulina) : null,
        analisisTiroideo: data.analisis_tiroideo || null,
        // Paraclínicos personalizados (array JSON)
        otrosParaclinicos: data.otros_paraclinicos || null,
        // Examen físico por sistemas (JSON estructurado)
        examenFisico: data.examen_fisico || null,
        // Otros
        turno: data.turno || null,
        observaciones: data.observaciones || null,
        fechaRegistro: data.fecha_registro ? new Date(data.fecha_registro) : new Date(),
      },
      include: {
        paciente: true,
        registrador: true,
      },
    });

    // Verificar alertas automáticas
    await this.verificarAlertas(signoVital);

    // Auditoría
    await auditoriaService.registrarAccion({
      entidad: 'SignoVital',
      entidadId: signoVital.id,
      accion: 'Creacion',
      usuarioId,
      nombreUsuario: `${usuarioData.nombre} ${usuarioData.apellido}`,
      rol: usuarioData.rol,
      valoresNuevos: signoVital,
      ipOrigen,
    });

    return signoVital;
  }

  /**
   * Verificar si los signos vitales están fuera de rango
   */
  async verificarAlertas(signoVital) {
    const alertas = [];

    // Temperatura alta (fiebre)
    if (signoVital.temperatura && parseFloat(signoVital.temperatura) >= 38) {
      alertas.push({
        tipo: 'SignoVitalCritico',
        severidad: 'Moderada',
        titulo: 'Temperatura elevada',
        descripcion: `Temperatura de ${signoVital.temperatura}°C`,
      });
    }

    // Presión arterial alta
    if (signoVital.presionSistolica && signoVital.presionSistolica >= 140) {
      alertas.push({
        tipo: 'SignoVitalCritico',
        severidad: 'Moderada',
        titulo: 'Presión arterial elevada',
        descripcion: `PA: ${signoVital.presionSistolica}/${signoVital.presionDiastolica} mmHg`,
      });
    }

    // Saturación de oxígeno baja
    if (signoVital.saturacionOxigeno && parseFloat(signoVital.saturacionOxigeno) < 90) {
      alertas.push({
        tipo: 'SignoVitalCritico',
        severidad: 'Grave',
        titulo: 'Saturación de oxígeno baja',
        descripcion: `SpO2: ${signoVital.saturacionOxigeno}%`,
      });
    }

    // Crear alertas en la base de datos
    for (const alerta of alertas) {
      await prisma.alertaClinica.create({
        data: {
          pacienteId: signoVital.pacienteId,
          tipoAlerta: alerta.tipo,
          severidad: alerta.severidad,
          titulo: alerta.titulo,
          descripcion: alerta.descripcion,
          origen: 'Signos Vitales',
          valorReferencia: signoVital.id,
          visiblePara: ['DOCTOR', 'NURSE', 'ADMIN'],
          colorAlerta: alerta.severidad === 'Grave' ? 'red' : 'orange',
        },
      });
    }

    if (alertas.length > 0) {
      await prisma.signoVital.update({
        where: { id: signoVital.id },
        data: { alertaGenerada: true },
      });
    }
  }

  /**
   * Obtener gráfica de evolución
   */
  async getGraficaEvolucion(pacienteId, tipo, diasAtras = 7) {
    const fechaDesde = new Date();
    fechaDesde.setDate(fechaDesde.getDate() - diasAtras);

    const signos = await prisma.signoVital.findMany({
      where: {
        pacienteId,
        fechaRegistro: { gte: fechaDesde },
      },
      orderBy: { fechaRegistro: 'asc' },
      select: {
        fechaRegistro: true,
        temperatura: tipo === 'temperatura',
        presionSistolica: tipo === 'presion',
        presionDiastolica: tipo === 'presion',
        frecuenciaCardiaca: tipo === 'frecuenciaCardiaca',
        saturacionOxigeno: tipo === 'saturacionOxigeno',
      },
    });

    return signos;
  }
}

module.exports = new SignosVitalesService();
