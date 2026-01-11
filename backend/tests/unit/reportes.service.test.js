const reportesService = require('../../services/reportes.service');
const prisma = require('../../db/prisma');
const { startOfMonth, endOfMonth, subMonths } = require('date-fns');

// Mock prisma
jest.mock('../../db/prisma', () => ({
  paciente: {
    count: jest.fn(),
    findMany: jest.fn(),
  },
  cita: {
    count: jest.fn(),
    groupBy: jest.fn(),
  },
  cama: {
    count: jest.fn(),
  },
  factura: {
    findMany: jest.fn(),
  },
  ordenMedica: {
    findMany: jest.fn(),
    groupBy: jest.fn(),
    aggregate: jest.fn(),
  },
  ordenMedicamentoItem: {
    findMany: jest.fn(),
  },
  pQRS: {
    findMany: jest.fn(),
  },
  especialidad: {
    findMany: jest.fn(),
  },
  examenProcedimiento: {
    findMany: jest.fn(),
  },
  doctor: {
    findMany: jest.fn(),
  },
  procedimiento: {
    count: jest.fn(),
  },
  atencionUrgencia: {
    findMany: jest.fn(),
  },
  auditLog: {
    findMany: jest.fn(),
  },
  admision: {
    count: jest.fn(),
  },
  evolucionClinica: {
    count: jest.fn(),
  }
}));

describe('ReportesService', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getGeneralStats', () => {
    it('should return general stats', async () => {
      prisma.paciente.count.mockResolvedValueOnce(100); // total
      prisma.paciente.count.mockResolvedValueOnce(10); // nuevos
      prisma.cita.count.mockResolvedValue(50);
      prisma.evolucionClinica.count.mockResolvedValue(30);
      prisma.cama.count.mockResolvedValueOnce(20); // total
      prisma.cama.count.mockResolvedValueOnce(15); // ocupadas
      prisma.factura.findMany.mockResolvedValue([{ total: 1000 }, { total: 2000 }]);
      prisma.ordenMedica.findMany.mockResolvedValue([{ examenProcedimiento: { costoBase: 500 } }]);
      prisma.ordenMedicamentoItem.findMany.mockResolvedValue([{ producto: { precioCompra: 100 }, cantidad: 2 }]);
      prisma.pQRS.findMany.mockResolvedValue([{ calificacionRespuesta: 5 }, { calificacionRespuesta: 4 }]);

      const result = await reportesService.getGeneralStats({ periodo: 'mes' });

      expect(result).toEqual({
        totalPacientes: 100,
        pacientesNuevos: 10,
        consultasRealizadas: 50,
        evolucionesRealizadas: 30,
        ocupacionCamas: 75, // 15/20 * 100
        ingresosMes: 3000,
        gastosMes: 700, // 500 + (100*2)
        utilidad: 2300,
        satisfaccion: "4.5"
      });
    });
  });

  describe('getFinancialStats', () => {
    it('should return financial stats for last 7 months', async () => {
      prisma.factura.findMany.mockResolvedValue([{ total: 1000 }]);
      prisma.ordenMedica.findMany.mockResolvedValue([]);
      prisma.ordenMedicamentoItem.findMany.mockResolvedValue([]);

      const result = await reportesService.getFinancialStats();

      expect(result).toHaveLength(7);
      expect(result[0]).toHaveProperty('mes');
      expect(result[0]).toHaveProperty('ingresos');
      expect(result[0]).toHaveProperty('gastos');
    });
  });

  describe('getOccupancyStats', () => {
    it('should return occupancy stats for last 7 months', async () => {
      prisma.cama.count.mockResolvedValue(10);
      prisma.admision.count.mockResolvedValue(5);

      const result = await reportesService.getOccupancyStats();

      expect(result).toHaveLength(7);
      expect(result[0].ocupacion).toBe(50);
    });
  });

  describe('getSpecialtyStats', () => {
    it('should return specialty stats', async () => {
      prisma.cita.groupBy.mockResolvedValue([
        { especialidadId: '1', _count: { id: 10 } },
        { especialidadId: '2', _count: { id: 5 } }
      ]);
      prisma.especialidad.findMany.mockResolvedValue([
        { id: '1', titulo: 'Cardiologia' },
        { id: '2', titulo: 'Pediatria' }
      ]);

      const result = await reportesService.getSpecialtyStats();

      expect(result).toHaveLength(2);
      expect(result[0].especialidad).toBe('Cardiologia');
      expect(result[0].cantidad).toBe(10);
    });
  });
});
