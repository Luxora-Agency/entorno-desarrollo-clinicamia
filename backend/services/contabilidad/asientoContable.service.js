/**
 * Asientos Contables Service
 * Libro Diario - Gestión completa de asientos con sincronización Siigo
 */

const prisma = require('../../db/prisma');
const { ValidationError, NotFoundError } = require('../../utils/errors');

class AsientoContableService {
  /**
   * Obtener todos los asientos con filtros
   */
  async getAll(filters = {}) {
    const where = {};

    if (filters.periodoId) where.periodoId = filters.periodoId;
    if (filters.estado) where.estado = filters.estado;
    if (filters.tipo) where.tipo = filters.tipo;

    if (filters.fechaInicio && filters.fechaFin) {
      where.fecha = {
        gte: new Date(filters.fechaInicio),
        lte: new Date(filters.fechaFin)
      };
    }

    if (filters.search) {
      where.OR = [
        { numero: { contains: filters.search } },
        { descripcion: { contains: filters.search, mode: 'insensitive' } }
      ];
    }

    const page = parseInt(filters.page) || 1;
    const limit = parseInt(filters.limit) || 20;
    const skip = (page - 1) * limit;

    const [asientos, total] = await Promise.all([
      prisma.asientoContable.findMany({
        where,
        include: {
          periodo: { select: { nombre: true, estado: true } },
          lineas: {
            orderBy: { orden: 'asc' },
            include: {
              centroCosto: { select: { codigo: true, nombre: true } }
            }
          },
          _count: { select: { lineas: true } }
        },
        orderBy: [{ fecha: 'desc' }, { numero: 'desc' }],
        skip,
        take: limit
      }),
      prisma.asientoContable.count({ where })
    ]);

    return {
      data: asientos,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Obtener asiento por ID
   */
  async getById(id) {
    const asiento = await prisma.asientoContable.findUnique({
      where: { id },
      include: {
        periodo: true,
        lineas: {
          orderBy: { orden: 'asc' },
          include: {
            centroCosto: { select: { id: true, codigo: true, nombre: true } }
          }
        },
        asientoOriginal: { select: { id: true, numero: true } },
        reversiones: { select: { id: true, numero: true, fecha: true } }
      }
    });

    if (!asiento) {
      throw new NotFoundError('Asiento contable no encontrado');
    }

    return asiento;
  }

  /**
   * Obtener siguiente número de asiento
   */
  async getNextNumber() {
    const year = new Date().getFullYear();
    const prefix = `AC-${year}-`;

    const ultimo = await prisma.asientoContable.findFirst({
      where: { numero: { startsWith: prefix } },
      orderBy: { numero: 'desc' }
    });

    if (!ultimo) {
      return `${prefix}00001`;
    }

    const numActual = parseInt(ultimo.numero.split('-')[2]) || 0;
    return `${prefix}${String(numActual + 1).padStart(5, '0')}`;
  }

  /**
   * Crear asiento contable
   */
  async create(data, usuarioId) {
    // Validar que el período exista y esté abierto
    const periodo = await this.obtenerPeriodoAbierto(data.fecha);

    // Validar que las líneas cuadren (débitos = créditos)
    this.validarCuadre(data.lineas);

    // Validar cuentas contables
    await this.validarCuentas(data.lineas);

    const numero = await this.getNextNumber();

    const asiento = await prisma.$transaction(async (tx) => {
      // Crear asiento
      const nuevoAsiento = await tx.asientoContable.create({
        data: {
          numero,
          periodoId: periodo.id,
          fecha: new Date(data.fecha),
          tipo: data.tipo || 'DIARIO',
          descripcion: data.descripcion,
          totalDebito: this.calcularTotalDebito(data.lineas),
          totalCredito: this.calcularTotalCredito(data.lineas),
          estado: 'BORRADOR',
          creadoPor: usuarioId,
          tipoDocOrigen: data.tipoDocOrigen,
          docOrigenId: data.docOrigenId
        }
      });

      // Crear líneas
      for (let i = 0; i < data.lineas.length; i++) {
        const linea = data.lineas[i];
        await tx.asientoContableLinea.create({
          data: {
            asientoId: nuevoAsiento.id,
            cuentaCodigo: linea.cuentaCodigo,
            cuentaNombre: linea.cuentaNombre,
            debito: linea.debito || 0,
            credito: linea.credito || 0,
            descripcion: linea.descripcion,
            terceroTipo: linea.terceroTipo,
            terceroId: linea.terceroId,
            terceroNombre: linea.terceroNombre,
            centroCostoId: linea.centroCostoId,
            orden: i + 1
          }
        });
      }

      return nuevoAsiento;
    });

    return this.getById(asiento.id);
  }

  /**
   * Actualizar asiento (solo si está en BORRADOR)
   */
  async update(id, data, usuarioId) {
    const asiento = await this.getById(id);

    if (asiento.estado !== 'BORRADOR') {
      throw new ValidationError('Solo se pueden editar asientos en estado BORRADOR');
    }

    // Validar cuadre si se actualizan líneas
    if (data.lineas) {
      this.validarCuadre(data.lineas);
      await this.validarCuentas(data.lineas);
    }

    const updated = await prisma.$transaction(async (tx) => {
      // Actualizar asiento
      const asientoActualizado = await tx.asientoContable.update({
        where: { id },
        data: {
          fecha: data.fecha ? new Date(data.fecha) : undefined,
          tipo: data.tipo,
          descripcion: data.descripcion,
          totalDebito: data.lineas ? this.calcularTotalDebito(data.lineas) : undefined,
          totalCredito: data.lineas ? this.calcularTotalCredito(data.lineas) : undefined
        }
      });

      // Si se actualizan líneas, eliminar las anteriores y crear nuevas
      if (data.lineas) {
        await tx.asientoContableLinea.deleteMany({
          where: { asientoId: id }
        });

        for (let i = 0; i < data.lineas.length; i++) {
          const linea = data.lineas[i];
          await tx.asientoContableLinea.create({
            data: {
              asientoId: id,
              cuentaCodigo: linea.cuentaCodigo,
              cuentaNombre: linea.cuentaNombre,
              debito: linea.debito || 0,
              credito: linea.credito || 0,
              descripcion: linea.descripcion,
              terceroTipo: linea.terceroTipo,
              terceroId: linea.terceroId,
              terceroNombre: linea.terceroNombre,
              centroCostoId: linea.centroCostoId,
              orden: i + 1
            }
          });
        }
      }

      return asientoActualizado;
    });

    return this.getById(id);
  }

  /**
   * Aprobar asiento
   */
  async aprobar(id, usuarioId) {
    const asiento = await this.getById(id);

    if (asiento.estado !== 'BORRADOR' && asiento.estado !== 'PENDIENTE') {
      throw new ValidationError('El asiento no está en estado para aprobar');
    }

    // Verificar período abierto
    if (asiento.periodo.estado !== 'ABIERTO') {
      throw new ValidationError('El período contable está cerrado');
    }

    // Validar cuadre final
    const totalDebito = asiento.lineas.reduce((sum, l) => sum + parseFloat(l.debito), 0);
    const totalCredito = asiento.lineas.reduce((sum, l) => sum + parseFloat(l.credito), 0);

    if (Math.abs(totalDebito - totalCredito) > 0.01) {
      throw new ValidationError('El asiento no cuadra: débitos y créditos deben ser iguales');
    }

    const updated = await prisma.asientoContable.update({
      where: { id },
      data: {
        estado: 'APROBADO',
        aprobadoPor: usuarioId,
        fechaAprobacion: new Date()
      }
    });

    // Actualizar libro mayor
    await this.actualizarLibroMayor(asiento);

    return this.getById(id);
  }

  /**
   * Anular asiento
   */
  async anular(id, motivo, usuarioId) {
    const asiento = await this.getById(id);

    if (asiento.estado === 'ANULADO') {
      throw new ValidationError('El asiento ya está anulado');
    }

    // Si está aprobado, revertir libro mayor
    if (asiento.estado === 'APROBADO') {
      await this.revertirLibroMayor(asiento);
    }

    const updated = await prisma.asientoContable.update({
      where: { id },
      data: {
        estado: 'ANULADO',
        anuladoPor: usuarioId,
        fechaAnulacion: new Date(),
        motivoAnulacion: motivo
      }
    });

    return this.getById(id);
  }

  /**
   * Crear asiento de reversión
   */
  async revertir(id, usuarioId) {
    const asiento = await this.getById(id);

    if (asiento.estado !== 'APROBADO') {
      throw new ValidationError('Solo se pueden revertir asientos aprobados');
    }

    // Crear asiento inverso
    const lineasInversas = asiento.lineas.map(linea => ({
      cuentaCodigo: linea.cuentaCodigo,
      cuentaNombre: linea.cuentaNombre,
      debito: parseFloat(linea.credito),
      credito: parseFloat(linea.debito),
      descripcion: `Reversión: ${linea.descripcion || ''}`,
      terceroTipo: linea.terceroTipo,
      terceroId: linea.terceroId,
      terceroNombre: linea.terceroNombre,
      centroCostoId: linea.centroCostoId
    }));

    const numero = await this.getNextNumber();
    const periodo = await this.obtenerPeriodoAbierto(new Date());

    const reversion = await prisma.$transaction(async (tx) => {
      const nuevoAsiento = await tx.asientoContable.create({
        data: {
          numero,
          periodoId: periodo.id,
          fecha: new Date(),
          tipo: 'AJUSTE',
          descripcion: `Reversión de asiento ${asiento.numero}`,
          totalDebito: this.calcularTotalDebito(lineasInversas),
          totalCredito: this.calcularTotalCredito(lineasInversas),
          estado: 'APROBADO',
          creadoPor: usuarioId,
          aprobadoPor: usuarioId,
          fechaAprobacion: new Date(),
          esReversion: true,
          asientoOriginalId: id
        }
      });

      for (let i = 0; i < lineasInversas.length; i++) {
        const linea = lineasInversas[i];
        await tx.asientoContableLinea.create({
          data: {
            asientoId: nuevoAsiento.id,
            ...linea,
            orden: i + 1
          }
        });
      }

      return nuevoAsiento;
    });

    // Actualizar libro mayor con la reversión
    const reversionCompleta = await this.getById(reversion.id);
    await this.actualizarLibroMayor(reversionCompleta);

    return reversionCompleta;
  }

  /**
   * Crear asiento automático desde factura
   */
  async crearDesdeFactura(facturaId, usuarioId) {
    const factura = await prisma.factura.findUnique({
      where: { id: facturaId },
      include: {
        items: true,
        paciente: true
      }
    });

    if (!factura) {
      throw new NotFoundError('Factura no encontrada');
    }

    const lineas = [
      // Débito: Cuentas por cobrar
      {
        cuentaCodigo: '130505',
        cuentaNombre: 'Clientes nacionales',
        debito: parseFloat(factura.total),
        credito: 0,
        descripcion: `Factura ${factura.numero}`,
        terceroTipo: 'PACIENTE',
        terceroId: factura.pacienteId,
        terceroNombre: `${factura.paciente.nombres} ${factura.paciente.apellidos}`
      },
      // Crédito: Ingresos
      {
        cuentaCodigo: '410505',
        cuentaNombre: 'Consultas médicas',
        debito: 0,
        credito: parseFloat(factura.subtotal),
        descripcion: `Factura ${factura.numero}`
      }
    ];

    // Agregar IVA si aplica
    if (parseFloat(factura.iva) > 0) {
      lineas.push({
        cuentaCodigo: '240804',
        cuentaNombre: 'IVA generado',
        debito: 0,
        credito: parseFloat(factura.iva),
        descripcion: `IVA Factura ${factura.numero}`
      });
    }

    return this.create({
      fecha: factura.fecha,
      tipo: 'AUTOMATICO',
      descripcion: `Contabilización Factura ${factura.numero}`,
      lineas,
      tipoDocOrigen: 'FACTURA',
      docOrigenId: facturaId
    }, usuarioId);
  }

  /**
   * Crear asiento automático desde pago
   */
  async crearDesdePago(pagoId, usuarioId) {
    const pago = await prisma.pago.findUnique({
      where: { id: pagoId },
      include: {
        factura: {
          include: { paciente: true }
        }
      }
    });

    if (!pago) {
      throw new NotFoundError('Pago no encontrado');
    }

    const cuentaBanco = this.getCuentaBanco(pago.metodoPago);

    const lineas = [
      // Débito: Banco/Caja
      {
        cuentaCodigo: cuentaBanco,
        cuentaNombre: pago.metodoPago === 'EFECTIVO' ? 'Caja general' : 'Bancos',
        debito: parseFloat(pago.monto),
        credito: 0,
        descripcion: `Pago Factura ${pago.factura.numero}`
      },
      // Crédito: Cuentas por cobrar
      {
        cuentaCodigo: '130505',
        cuentaNombre: 'Clientes nacionales',
        debito: 0,
        credito: parseFloat(pago.monto),
        descripcion: `Pago Factura ${pago.factura.numero}`,
        terceroTipo: 'PACIENTE',
        terceroId: pago.factura.pacienteId,
        terceroNombre: `${pago.factura.paciente.nombres} ${pago.factura.paciente.apellidos}`
      }
    ];

    return this.create({
      fecha: pago.fecha,
      tipo: 'AUTOMATICO',
      descripcion: `Recibo de caja - Factura ${pago.factura.numero}`,
      lineas,
      tipoDocOrigen: 'PAGO',
      docOrigenId: pagoId
    }, usuarioId);
  }

  /**
   * Sincronizar con Siigo (crear journal entry)
   */
  async syncToSiigo(id, siigoService) {
    const asiento = await this.getById(id);

    if (asiento.siigoId) {
      return { message: 'Asiento ya sincronizado', siigoId: asiento.siigoId };
    }

    if (asiento.estado !== 'APROBADO') {
      throw new ValidationError('Solo se pueden sincronizar asientos aprobados');
    }

    try {
      const journalApi = siigoService.getJournalApi();

      const command = {
        document: { id: 1030 }, // Comprobante diario
        date: this.formatDateForSiigo(asiento.fecha),
        items: asiento.lineas.map(linea => ({
          account: { code: linea.cuentaCodigo },
          description: linea.descripcion || asiento.descripcion,
          debit: parseFloat(linea.debito),
          credit: parseFloat(linea.credito)
        }))
      };

      const result = await journalApi.createJournal({ createJournalEntryCommand: command });

      await prisma.asientoContable.update({
        where: { id },
        data: { siigoId: result.id }
      });

      return { message: 'Sincronizado exitosamente', siigoId: result.id };
    } catch (error) {
      console.error('Error sincronizando asiento con Siigo:', error);
      throw new ValidationError(`Error Siigo: ${error.message}`);
    }
  }

  // =====================================================
  // MÉTODOS AUXILIARES
  // =====================================================

  validarCuadre(lineas) {
    const totalDebito = this.calcularTotalDebito(lineas);
    const totalCredito = this.calcularTotalCredito(lineas);

    if (Math.abs(totalDebito - totalCredito) > 0.01) {
      throw new ValidationError(
        `El asiento no cuadra: Débitos (${totalDebito.toFixed(2)}) ≠ Créditos (${totalCredito.toFixed(2)})`
      );
    }
  }

  async validarCuentas(lineas) {
    for (const linea of lineas) {
      const cuenta = await prisma.cuentaContable.findUnique({
        where: { codigo: linea.cuentaCodigo }
      });

      if (!cuenta) {
        throw new ValidationError(`Cuenta ${linea.cuentaCodigo} no existe en el PUC`);
      }

      if (!cuenta.activa) {
        throw new ValidationError(`Cuenta ${linea.cuentaCodigo} está inactiva`);
      }
    }
  }

  calcularTotalDebito(lineas) {
    return lineas.reduce((sum, l) => sum + (parseFloat(l.debito) || 0), 0);
  }

  calcularTotalCredito(lineas) {
    return lineas.reduce((sum, l) => sum + (parseFloat(l.credito) || 0), 0);
  }

  async obtenerPeriodoAbierto(fecha) {
    const fechaObj = new Date(fecha);
    const anio = fechaObj.getFullYear();
    const mes = fechaObj.getMonth() + 1;

    let periodo = await prisma.periodoContable.findUnique({
      where: { anio_mes: { anio, mes } }
    });

    if (!periodo) {
      // Crear período automáticamente
      const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
                     'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

      periodo = await prisma.periodoContable.create({
        data: {
          anio,
          mes,
          nombre: `${meses[mes - 1]} ${anio}`,
          fechaInicio: new Date(anio, mes - 1, 1),
          fechaFin: new Date(anio, mes, 0),
          estado: 'ABIERTO'
        }
      });
    }

    if (periodo.estado !== 'ABIERTO') {
      throw new ValidationError(`El período ${periodo.nombre} está ${periodo.estado}`);
    }

    return periodo;
  }

  async actualizarLibroMayor(asiento) {
    const anio = asiento.fecha.getFullYear();
    const mes = asiento.fecha.getMonth() + 1;

    for (const linea of asiento.lineas) {
      const cuenta = await prisma.cuentaContable.findUnique({
        where: { codigo: linea.cuentaCodigo }
      });

      if (!cuenta) continue;

      await prisma.libroMayor.upsert({
        where: {
          anio_mes_cuentaCodigo_centroCostoId: {
            anio,
            mes,
            cuentaCodigo: linea.cuentaCodigo,
            centroCostoId: linea.centroCostoId || ''
          }
        },
        update: {
          debitos: { increment: parseFloat(linea.debito) || 0 },
          creditos: { increment: parseFloat(linea.credito) || 0 },
          numMovimientos: { increment: 1 },
          saldoFinal: cuenta.naturaleza === 'Débito'
            ? { increment: (parseFloat(linea.debito) || 0) - (parseFloat(linea.credito) || 0) }
            : { increment: (parseFloat(linea.credito) || 0) - (parseFloat(linea.debito) || 0) }
        },
        create: {
          anio,
          mes,
          cuentaCodigo: linea.cuentaCodigo,
          cuentaNombre: cuenta.nombre,
          cuentaTipo: cuenta.tipo,
          cuentaNaturaleza: cuenta.naturaleza,
          centroCostoId: linea.centroCostoId,
          saldoInicial: 0,
          debitos: parseFloat(linea.debito) || 0,
          creditos: parseFloat(linea.credito) || 0,
          saldoFinal: cuenta.naturaleza === 'Débito'
            ? (parseFloat(linea.debito) || 0) - (parseFloat(linea.credito) || 0)
            : (parseFloat(linea.credito) || 0) - (parseFloat(linea.debito) || 0),
          numMovimientos: 1
        }
      });
    }
  }

  async revertirLibroMayor(asiento) {
    const anio = asiento.fecha.getFullYear();
    const mes = asiento.fecha.getMonth() + 1;

    for (const linea of asiento.lineas) {
      const cuenta = await prisma.cuentaContable.findUnique({
        where: { codigo: linea.cuentaCodigo }
      });

      if (!cuenta) continue;

      await prisma.libroMayor.update({
        where: {
          anio_mes_cuentaCodigo_centroCostoId: {
            anio,
            mes,
            cuentaCodigo: linea.cuentaCodigo,
            centroCostoId: linea.centroCostoId || ''
          }
        },
        data: {
          debitos: { decrement: parseFloat(linea.debito) || 0 },
          creditos: { decrement: parseFloat(linea.credito) || 0 },
          numMovimientos: { decrement: 1 },
          saldoFinal: cuenta.naturaleza === 'Débito'
            ? { decrement: (parseFloat(linea.debito) || 0) - (parseFloat(linea.credito) || 0) }
            : { decrement: (parseFloat(linea.credito) || 0) - (parseFloat(linea.debito) || 0) }
        }
      });
    }
  }

  getCuentaBanco(metodoPago) {
    const cuentas = {
      'EFECTIVO': '110505',
      'TARJETA_CREDITO': '111005',
      'TARJETA_DEBITO': '111005',
      'TRANSFERENCIA': '111005',
      'PSE': '111005'
    };
    return cuentas[metodoPago] || '111005';
  }

  formatDateForSiigo(date) {
    const d = new Date(date);
    return d.toISOString().split('T')[0];
  }

  /**
   * Obtener estadísticas
   */
  async getStats(periodoId = null) {
    const where = periodoId ? { periodoId } : {};

    const [total, porEstado, porTipo] = await Promise.all([
      prisma.asientoContable.count({ where }),
      prisma.asientoContable.groupBy({
        by: ['estado'],
        where,
        _count: true
      }),
      prisma.asientoContable.groupBy({
        by: ['tipo'],
        where,
        _count: true
      })
    ]);

    return {
      total,
      porEstado: porEstado.reduce((acc, item) => {
        acc[item.estado] = item._count;
        return acc;
      }, {}),
      porTipo: porTipo.reduce((acc, item) => {
        acc[item.tipo] = item._count;
        return acc;
      }, {})
    };
  }
}

module.exports = new AsientoContableService();
