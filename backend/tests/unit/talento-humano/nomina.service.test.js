/**
 * Tests para NominaService - Módulo Talento Humano
 */
const prisma = require('../../../db/prisma');
const nominaService = require('../../../services/talento-humano/nomina.service');
const { ValidationError, NotFoundError } = require('../../../utils/errors');

// Mock de calculosService y reportesService
jest.mock('../../../services/talento-humano/calculos-laborales.service', () => ({
  calcularRetencionFuente: jest.fn(() => 0),
  calcularNominaMensual: jest.fn(() => ({ totalDevengado: 3000000, netoPagar: 2500000 })),
  calcularLiquidacionDefinitiva: jest.fn(() => ({ total: 5000000 })),
  getParametrosVigentes: jest.fn(() => ({ smlv: 1300000 })),
  validarContrato: jest.fn(() => ({ valido: true })),
  calcularIncapacidad: jest.fn(() => ({ valor: 500000 })),
  calcularFechasImportantes: jest.fn(() => ({})),
  getRiesgoARL: jest.fn(() => 0.00522)
}));

jest.mock('../../../services/talento-humano/reportes-legales.service', () => ({
  generarPILA: jest.fn(() => ({ success: true })),
  generarCertificadoLaboral: jest.fn(() => ({ success: true })),
  generarCertificadoIngresosRetenciones: jest.fn(() => ({ success: true })),
  generarColillaPago: jest.fn(() => ({ success: true }))
}));

jest.mock('../../../config/normatividad-colombia-2025', () => ({
  SMLV_2025: 1300000,
  AUXILIO_TRANSPORTE_2025: 162000,
  SALUD: { EMPLEADO: 0.04, EMPLEADOR: 0.085 },
  PENSION: { EMPLEADO: 0.04, EMPLEADOR: 0.12 },
  ARL: { RIESGO_I: 0.00522 },
  PARAFISCALES: { CAJA_COMPENSACION: 0.04, SENA: 0.02, ICBF: 0.03 },
  getRiesgoARL: jest.fn(() => 0.00522)
}));

describe('NominaService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('listPeriodos', () => {
    it('debe listar periodos sin filtros', async () => {
      const mockPeriodos = [
        { id: '1', anio: 2025, mes: 1, quincena: 1 },
        { id: '2', anio: 2025, mes: 1, quincena: 2 }
      ];

      prisma.tHPeriodoNomina.findMany.mockResolvedValue(mockPeriodos);
      prisma.tHPeriodoNomina.count.mockResolvedValue(2);

      const result = await nominaService.listPeriodos({});

      expect(prisma.tHPeriodoNomina.findMany).toHaveBeenCalled();
      expect(result.data).toHaveLength(2);
      expect(result.pagination.total).toBe(2);
    });

    it('debe filtrar por anio', async () => {
      prisma.tHPeriodoNomina.findMany.mockResolvedValue([]);
      prisma.tHPeriodoNomina.count.mockResolvedValue(0);

      await nominaService.listPeriodos({ anio: 2025 });

      expect(prisma.tHPeriodoNomina.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ anio: 2025 })
        })
      );
    });

    it('debe filtrar por estado', async () => {
      prisma.tHPeriodoNomina.findMany.mockResolvedValue([]);
      prisma.tHPeriodoNomina.count.mockResolvedValue(0);

      await nominaService.listPeriodos({ estado: 'ABIERTO' });

      expect(prisma.tHPeriodoNomina.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ estado: 'ABIERTO' })
        })
      );
    });
  });

  describe('createPeriodo', () => {
    const validData = {
      anio: 2025,
      mes: 2,
      quincena: 1,
      fechaInicio: new Date('2025-02-01'),
      fechaFin: new Date('2025-02-15'),
      fechaPago: new Date('2025-02-16')
    };

    it('debe crear un periodo correctamente', async () => {
      prisma.tHPeriodoNomina.findUnique.mockResolvedValue(null);
      prisma.tHPeriodoNomina.create.mockResolvedValue({ id: '1', ...validData });

      const result = await nominaService.createPeriodo(validData);

      expect(prisma.tHPeriodoNomina.create).toHaveBeenCalledWith({ data: validData });
      expect(result.anio).toBe(2025);
    });

    it('debe lanzar ValidationError si el periodo ya existe', async () => {
      prisma.tHPeriodoNomina.findUnique.mockResolvedValue({ id: '1', ...validData });

      await expect(nominaService.createPeriodo(validData)).rejects.toThrow(ValidationError);
      await expect(nominaService.createPeriodo(validData)).rejects.toThrow('El periodo de nómina ya existe');
    });
  });

  describe('getPeriodo', () => {
    it('debe obtener periodo con detalles', async () => {
      const mockPeriodo = {
        id: '1',
        anio: 2025,
        mes: 1,
        detalles: [],
        procesador: { nombre: 'Admin' }
      };

      prisma.tHPeriodoNomina.findUnique.mockResolvedValue(mockPeriodo);

      const result = await nominaService.getPeriodo('1');

      expect(prisma.tHPeriodoNomina.findUnique).toHaveBeenCalledWith({
        where: { id: '1' },
        include: expect.objectContaining({
          detalles: expect.any(Object),
          procesador: expect.any(Object)
        })
      });
      expect(result).toEqual(mockPeriodo);
    });

    it('debe lanzar NotFoundError si no existe', async () => {
      prisma.tHPeriodoNomina.findUnique.mockResolvedValue(null);

      await expect(nominaService.getPeriodo('999')).rejects.toThrow(NotFoundError);
    });
  });

  describe('procesarNomina', () => {
    it('debe procesar nómina del periodo', async () => {
      const mockPeriodo = { id: '1', estado: 'ABIERTO' };
      const mockEmpleados = [
        {
          id: 'emp-1',
          estado: 'ACTIVO',
          contratos: [{ salarioBase: 2000000, auxTransporte: true }]
        }
      ];

      prisma.tHPeriodoNomina.findUnique
        .mockResolvedValueOnce(mockPeriodo)
        .mockResolvedValueOnce({ ...mockPeriodo, estado: 'EN_PROCESO', detalles: [] });
      prisma.tHEmpleado.findMany.mockResolvedValue(mockEmpleados);
      prisma.tHNovedadNomina.findMany.mockResolvedValue([]);
      prisma.tHNominaDetalle.deleteMany.mockResolvedValue({});
      prisma.tHNominaDetalle.createMany.mockResolvedValue({ count: 1 });
      prisma.tHPeriodoNomina.update.mockResolvedValue({ ...mockPeriodo, estado: 'EN_PROCESO' });

      const result = await nominaService.procesarNomina('1', 'user-1');

      expect(prisma.tHEmpleado.findMany).toHaveBeenCalled();
      expect(prisma.tHNominaDetalle.deleteMany).toHaveBeenCalled();
      expect(prisma.tHNominaDetalle.createMany).toHaveBeenCalled();
      expect(prisma.tHPeriodoNomina.update).toHaveBeenCalled();
    });

    it('debe lanzar NotFoundError si periodo no existe', async () => {
      prisma.tHPeriodoNomina.findUnique.mockResolvedValue(null);

      await expect(nominaService.procesarNomina('999', 'user-1')).rejects.toThrow(NotFoundError);
    });

    it('debe lanzar ValidationError si periodo no está abierto', async () => {
      prisma.tHPeriodoNomina.findUnique.mockResolvedValue({ id: '1', estado: 'CERRADO' });

      await expect(nominaService.procesarNomina('1', 'user-1')).rejects.toThrow(ValidationError);
      await expect(nominaService.procesarNomina('1', 'user-1')).rejects.toThrow('Solo se pueden procesar periodos abiertos');
    });
  });

  describe('calcularNominaEmpleado', () => {
    it('debe calcular nómina correctamente con auxilio transporte', () => {
      const contrato = {
        salarioBase: 2000000,
        auxTransporte: true
      };
      const novedades = [];

      const result = nominaService.calcularNominaEmpleado(contrato, novedades);

      expect(result.salarioBase).toBe(2000000);
      expect(result.auxTransporte).toBe(162000); // AUXILIO_TRANSPORTE_2025
      expect(result.totalDevengado).toBeGreaterThan(0);
      expect(result.netoPagar).toBeGreaterThan(0);
      expect(result.saludEmpleado).toBeGreaterThan(0);
      expect(result.pensionEmpleado).toBeGreaterThan(0);
    });

    it('debe calcular sin auxilio transporte para salarios altos', () => {
      const contrato = {
        salarioBase: 3000000, // Mayor a 2 SMLV
        auxTransporte: true
      };
      const novedades = [];

      const result = nominaService.calcularNominaEmpleado(contrato, novedades);

      expect(result.auxTransporte).toBe(0);
    });

    it('debe procesar novedades de horas extra', () => {
      const contrato = { salarioBase: 2000000, auxTransporte: true };
      const novedades = [
        { tipo: 'HORA_EXTRA', valor: 10 }
      ];

      const result = nominaService.calcularNominaEmpleado(contrato, novedades);

      expect(result.horasExtras.diurnas).toBe(10);
    });

    it('debe procesar novedades de comisiones', () => {
      const contrato = { salarioBase: 2000000, auxTransporte: true };
      const novedades = [
        { tipo: 'COMISION', valor: 500000 }
      ];

      const result = nominaService.calcularNominaEmpleado(contrato, novedades);

      expect(result.comisiones).toBe(500000);
    });

    it('debe procesar novedades de bonificaciones', () => {
      const contrato = { salarioBase: 2000000, auxTransporte: true };
      const novedades = [
        { tipo: 'BONIFICACION', valor: 200000 }
      ];

      const result = nominaService.calcularNominaEmpleado(contrato, novedades);

      expect(result.bonificaciones).toBe(200000);
    });

    it('debe procesar novedades de descuentos', () => {
      const contrato = { salarioBase: 2000000, auxTransporte: true };
      const novedades = [
        { tipo: 'DESCUENTO', valor: 50000 },
        { tipo: 'PRESTAMO', valor: 100000 }
      ];

      const result = nominaService.calcularNominaEmpleado(contrato, novedades);

      expect(result.otrosDescuentos).toBe(50000);
      expect(result.prestamos).toBe(100000);
    });

    it('debe calcular fondo solidaridad para salarios altos', () => {
      const contrato = {
        salarioBase: 6000000, // > 4 SMLV
        auxTransporte: false
      };
      const novedades = [];

      const result = nominaService.calcularNominaEmpleado(contrato, novedades);

      expect(result.fondoSolidaridad).toBeGreaterThan(0);
    });
  });

  describe('cerrarPeriodo', () => {
    it('debe cerrar un periodo en proceso', async () => {
      const mockPeriodo = { id: '1', estado: 'EN_PROCESO' };

      prisma.tHPeriodoNomina.findUnique.mockResolvedValue(mockPeriodo);
      prisma.tHPeriodoNomina.update.mockResolvedValue({ ...mockPeriodo, estado: 'CERRADO' });

      const result = await nominaService.cerrarPeriodo('1');

      expect(prisma.tHPeriodoNomina.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: { estado: 'CERRADO' }
      });
      expect(result.estado).toBe('CERRADO');
    });

    it('debe lanzar NotFoundError si periodo no existe', async () => {
      prisma.tHPeriodoNomina.findUnique.mockResolvedValue(null);

      await expect(nominaService.cerrarPeriodo('999')).rejects.toThrow(NotFoundError);
    });

    it('debe lanzar ValidationError si periodo no está en proceso', async () => {
      prisma.tHPeriodoNomina.findUnique.mockResolvedValue({ id: '1', estado: 'ABIERTO' });

      await expect(nominaService.cerrarPeriodo('1')).rejects.toThrow(ValidationError);
      await expect(nominaService.cerrarPeriodo('1')).rejects.toThrow('Solo se pueden cerrar periodos en proceso');
    });
  });

  describe('getColilla', () => {
    it('debe obtener colilla de pago', async () => {
      const mockDetalle = {
        empleadoId: 'emp-1',
        periodoId: 'per-1',
        salarioBase: 2000000,
        netoPagar: 1700000,
        empleado: { nombre: 'Juan', cargo: { nombre: 'Médico' } },
        periodo: { anio: 2025, mes: 1 }
      };

      prisma.tHNominaDetalle.findUnique.mockResolvedValue(mockDetalle);

      const result = await nominaService.getColilla('emp-1', 'per-1');

      expect(prisma.tHNominaDetalle.findUnique).toHaveBeenCalledWith({
        where: {
          periodoId_empleadoId: { periodoId: 'per-1', empleadoId: 'emp-1' }
        },
        include: expect.any(Object)
      });
      expect(result).toEqual(mockDetalle);
    });

    it('debe lanzar NotFoundError si colilla no existe', async () => {
      prisma.tHNominaDetalle.findUnique.mockResolvedValue(null);

      await expect(nominaService.getColilla('emp-1', 'per-1')).rejects.toThrow(NotFoundError);
      await expect(nominaService.getColilla('emp-1', 'per-1')).rejects.toThrow('Colilla no encontrada');
    });
  });

  describe('createNovedad', () => {
    it('debe crear una novedad de nómina', async () => {
      const novedadData = {
        empleadoId: 'emp-1',
        tipo: 'HORA_EXTRA',
        concepto: 'Horas extra enero',
        valor: 100000
      };

      prisma.tHNovedadNomina.create.mockResolvedValue({ id: '1', ...novedadData });

      const result = await nominaService.createNovedad(novedadData);

      expect(prisma.tHNovedadNomina.create).toHaveBeenCalledWith({ data: novedadData });
      expect(result.tipo).toBe('HORA_EXTRA');
    });
  });

  describe('listNovedades', () => {
    it('debe listar novedades con filtros', async () => {
      prisma.tHNovedadNomina.findMany.mockResolvedValue([]);
      prisma.tHNovedadNomina.count.mockResolvedValue(0);

      await nominaService.listNovedades({ empleadoId: 'emp-1', tipo: 'HORA_EXTRA' });

      expect(prisma.tHNovedadNomina.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            empleadoId: 'emp-1',
            tipo: 'HORA_EXTRA'
          })
        })
      );
    });
  });

  describe('aprobarNovedad', () => {
    it('debe aprobar una novedad', async () => {
      const mockNovedad = { id: '1', estado: 'PENDIENTE' };

      prisma.tHNovedadNomina.findUnique.mockResolvedValue(mockNovedad);
      prisma.tHNovedadNomina.update.mockResolvedValue({ ...mockNovedad, estado: 'APROBADO', aprobadoPor: 'user-1' });

      const result = await nominaService.aprobarNovedad('1', 'user-1');

      expect(prisma.tHNovedadNomina.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: { estado: 'APROBADO', aprobadoPor: 'user-1' }
      });
      expect(result.estado).toBe('APROBADO');
    });

    it('debe lanzar NotFoundError si novedad no existe', async () => {
      prisma.tHNovedadNomina.findUnique.mockResolvedValue(null);

      await expect(nominaService.aprobarNovedad('999', 'user-1')).rejects.toThrow(NotFoundError);
    });
  });

  describe('getResumenPeriodo', () => {
    it('debe obtener resumen del periodo', async () => {
      const mockPeriodo = {
        id: '1',
        anio: 2025,
        mes: 1,
        quincena: 1,
        estado: 'CERRADO',
        detalles: [
          {
            totalDevengado: 2000000,
            totalDeducciones: 300000,
            netoPagar: 1700000,
            saludEmpresa: 170000,
            pensionEmpresa: 240000,
            arl: 10000,
            cajaCompensacion: 80000,
            sena: 40000,
            icbf: 60000,
            cesantias: 166000,
            intCesantias: 1660,
            prima: 166000,
            vacacionesProv: 83000
          },
          {
            totalDevengado: 3000000,
            totalDeducciones: 450000,
            netoPagar: 2550000,
            saludEmpresa: 255000,
            pensionEmpresa: 360000,
            arl: 15000,
            cajaCompensacion: 120000,
            sena: 60000,
            icbf: 90000,
            cesantias: 250000,
            intCesantias: 2500,
            prima: 250000,
            vacacionesProv: 125000
          }
        ]
      };

      prisma.tHPeriodoNomina.findUnique.mockResolvedValue(mockPeriodo);

      const result = await nominaService.getResumenPeriodo('1');

      expect(result.periodo.anio).toBe(2025);
      expect(result.resumen.empleados).toBe(2);
      expect(result.resumen.totalDevengado).toBe(5000000);
      expect(result.resumen.netoPagar).toBe(4250000);
      expect(result.resumen.costoTotal).toBeGreaterThan(result.resumen.netoPagar);
    });

    it('debe lanzar NotFoundError si periodo no existe', async () => {
      prisma.tHPeriodoNomina.findUnique.mockResolvedValue(null);

      await expect(nominaService.getResumenPeriodo('999')).rejects.toThrow(NotFoundError);
    });
  });

  describe('generarLiquidacion', () => {
    it('debe generar liquidación de empleado', async () => {
      const mockEmpleado = {
        id: 'emp-1',
        contratos: [{ fechaInicio: new Date('2024-01-01'), salarioBase: 2000000 }]
      };

      prisma.tHEmpleado.findUnique.mockResolvedValue(mockEmpleado);
      prisma.tHNominaDetalle.findMany.mockResolvedValue([]);
      prisma.tHVacacion.aggregate.mockResolvedValue({ _sum: { diasHabiles: 5 } });

      const calculosService = require('../../../services/talento-humano/calculos-laborales.service');

      const result = await nominaService.generarLiquidacion('emp-1', '2025-01-31', 'RENUNCIA');

      expect(calculosService.calcularLiquidacionDefinitiva).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('debe lanzar NotFoundError si empleado no existe', async () => {
      prisma.tHEmpleado.findUnique.mockResolvedValue(null);

      await expect(nominaService.generarLiquidacion('999', '2025-01-31')).rejects.toThrow(NotFoundError);
    });

    it('debe lanzar ValidationError si no tiene contrato', async () => {
      prisma.tHEmpleado.findUnique.mockResolvedValue({ id: 'emp-1', contratos: [] });

      await expect(nominaService.generarLiquidacion('emp-1', '2025-01-31')).rejects.toThrow(ValidationError);
    });
  });
});
