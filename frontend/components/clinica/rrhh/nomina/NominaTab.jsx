'use client';

import { useState, useEffect } from 'react';
import {
  Plus, Search, DollarSign, Calendar, FileText,
  Download, Eye, Calculator, CheckCircle, Clock,
  AlertTriangle, Info, FileSpreadsheet, FileSignature,
  TrendingUp, Users, Building2, Cloud, Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import { apiPost } from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
  Table, TableBody, TableCell, TableHead,
  TableHeader, TableRow
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogDescription, DialogHeader,
  DialogTitle, DialogTrigger, DialogFooter
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import {
  Alert, AlertDescription, AlertTitle
} from '@/components/ui/alert';
import useTalentoHumano from '@/hooks/useTalentoHumano';

const ESTADO_COLORS = {
  ABIERTO: 'bg-blue-100 text-blue-700',
  EN_PROCESO: 'bg-yellow-100 text-yellow-700',
  CERRADO: 'bg-gray-100 text-gray-700',
  PAGADO: 'bg-green-100 text-green-700',
};

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

function formatCurrency(value) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value || 0);
}

function NormatividadPanel({ parametros, fechasImportantes }) {
  return (
    <div className="space-y-6">
      {/* Parametros Vigentes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-blue-600" />
            Parametros Normatividad Colombia 2025
          </CardTitle>
          <CardDescription>
            Valores vigentes segun la legislacion laboral colombiana
          </CardDescription>
        </CardHeader>
        <CardContent>
          {parametros ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Salario y Auxilio */}
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-700">Salario y Auxilio</h4>
                <div className="space-y-2">
                  <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-gray-600">SMLV 2025</span>
                    <span className="font-bold text-green-600">
                      {formatCurrency(parametros.smlv)}
                    </span>
                  </div>
                  <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-gray-600">Auxilio Transporte</span>
                    <span className="font-bold text-blue-600">
                      {formatCurrency(parametros.auxilioTransporte)}
                    </span>
                  </div>
                  <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-gray-600">UVT 2025</span>
                    <span className="font-bold text-purple-600">
                      {formatCurrency(parametros.uvt)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Aportes Empleado */}
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-700">Aportes Empleado</h4>
                <div className="space-y-2">
                  <div className="flex justify-between p-3 bg-blue-50 rounded-lg">
                    <span className="text-gray-600">Salud</span>
                    <span className="font-bold">{parametros.porcentajes?.saludEmpleado}%</span>
                  </div>
                  <div className="flex justify-between p-3 bg-blue-50 rounded-lg">
                    <span className="text-gray-600">Pension</span>
                    <span className="font-bold">{parametros.porcentajes?.pensionEmpleado}%</span>
                  </div>
                </div>
              </div>

              {/* Aportes Empleador */}
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-700">Aportes Empleador</h4>
                <div className="space-y-2">
                  <div className="flex justify-between p-3 bg-green-50 rounded-lg">
                    <span className="text-gray-600">Salud</span>
                    <span className="font-bold">{parametros.porcentajes?.saludEmpleador}%</span>
                  </div>
                  <div className="flex justify-between p-3 bg-green-50 rounded-lg">
                    <span className="text-gray-600">Pension</span>
                    <span className="font-bold">{parametros.porcentajes?.pensionEmpleador}%</span>
                  </div>
                  <div className="flex justify-between p-3 bg-green-50 rounded-lg">
                    <span className="text-gray-600">Caja Compensacion</span>
                    <span className="font-bold">{parametros.porcentajes?.cajaCompensacion}%</span>
                  </div>
                  <div className="flex justify-between p-3 bg-green-50 rounded-lg">
                    <span className="text-gray-600">SENA</span>
                    <span className="font-bold">{parametros.porcentajes?.sena}%</span>
                  </div>
                  <div className="flex justify-between p-3 bg-green-50 rounded-lg">
                    <span className="text-gray-600">ICBF</span>
                    <span className="font-bold">{parametros.porcentajes?.icbf}%</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400">
              Cargando parametros...
            </div>
          )}

          {/* Prestaciones Sociales */}
          {parametros?.prestaciones && (
            <div className="mt-6 pt-6 border-t">
              <h4 className="font-semibold text-gray-700 mb-4">Prestaciones Sociales</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-purple-50 rounded-lg text-center">
                  <p className="text-sm text-gray-600">Cesantias</p>
                  <p className="font-bold text-purple-700">{parametros.prestaciones.cesantias}</p>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg text-center">
                  <p className="text-sm text-gray-600">Int. Cesantias</p>
                  <p className="font-bold text-purple-700">{parametros.prestaciones.interesesCesantias}</p>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg text-center">
                  <p className="text-sm text-gray-600">Prima</p>
                  <p className="font-bold text-purple-700">{parametros.prestaciones.prima}</p>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg text-center">
                  <p className="text-sm text-gray-600">Vacaciones</p>
                  <p className="font-bold text-purple-700">{parametros.prestaciones.vacaciones}</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Fechas Importantes */}
      {fechasImportantes && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-orange-600" />
              Fechas Importantes {new Date().getFullYear()}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 border rounded-lg">
                <p className="text-sm text-gray-500">Prima Junio</p>
                <p className="font-medium">
                  {new Date(fechasImportantes.primaJunio).toLocaleDateString()}
                </p>
              </div>
              <div className="p-4 border rounded-lg">
                <p className="text-sm text-gray-500">Prima Diciembre</p>
                <p className="font-medium">
                  {new Date(fechasImportantes.primaDiciembre).toLocaleDateString()}
                </p>
              </div>
              <div className="p-4 border rounded-lg">
                <p className="text-sm text-gray-500">Consignacion Cesantias</p>
                <p className="font-medium">
                  {new Date(fechasImportantes.consignacionCesantias).toLocaleDateString()}
                </p>
              </div>
              <div className="p-4 border rounded-lg">
                <p className="text-sm text-gray-500">Intereses Cesantias</p>
                <p className="font-medium">
                  {new Date(fechasImportantes.interesesCesantias).toLocaleDateString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default function NominaTab({ user }) {
  const [activeSubTab, setActiveSubTab] = useState('periodos');
  const [searchTerm, setSearchTerm] = useState('');
  const [parametrosNormatividad, setParametrosNormatividad] = useState(null);
  const [fechasImportantes, setFechasImportantes] = useState(null);
  const [selectedPeriodo, setSelectedPeriodo] = useState(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [selectedReportType, setSelectedReportType] = useState(null);
  const [reportParams, setReportParams] = useState({});

  const {
    periodosNomina,
    empleados,
    loading,
    fetchPeriodosNomina,
    fetchEmpleados,
    procesarNomina,
    getParametrosNormatividad,
    getFechasImportantes,
    generarPILA,
    generarColillaDetallada,
    generarCertificadoLaboral,
    generarCertificadoIngresos,
    generarLiquidacion
  } = useTalentoHumano();

  useEffect(() => {
    fetchPeriodosNomina();
    fetchEmpleados({ estado: 'ACTIVO' });
    loadNormatividad();
  }, []);

  const loadNormatividad = async () => {
    try {
      const [params, fechas] = await Promise.all([
        getParametrosNormatividad(),
        getFechasImportantes()
      ]);
      setParametrosNormatividad(params);
      setFechasImportantes(fechas);
    } catch (err) {
      console.error('Error cargando normatividad:', err);
    }
  };

  const handleProcesar = async (periodoId) => {
    await procesarNomina(periodoId);
    fetchPeriodosNomina();
  };

  const [contabilizando, setContabilizando] = useState(null);

  const handleContabilizarSiigo = async (periodoId) => {
    try {
      setContabilizando(periodoId);
      await apiPost(`/nomina/periodos/${periodoId}/contabilizar-siigo`);
      toast.success('Nómina contabilizada exitosamente en Siigo');
      fetchPeriodosNomina();
    } catch (error) {
      toast.error('Error al contabilizar: ' + (error.message || 'Error desconocido'));
    } finally {
      setContabilizando(null);
    }
  };

  const openReportModal = (type) => {
    setSelectedReportType(type);
    setReportParams({});
    setShowReportModal(true);
  };

  const handleGenerateReport = async () => {
    try {
      let result;
      switch (selectedReportType) {
        case 'COLILLA':
          if (!reportParams.empleadoId || !reportParams.periodoId) {
            alert('Seleccione empleado y periodo');
            return;
          }
          result = await generarColillaDetallada(reportParams.empleadoId, reportParams.periodoId);
          break;
        case 'PILA':
          if (!reportParams.periodoId) {
            alert('Seleccione periodo');
            return;
          }
          result = await generarPILA(reportParams.periodoId);
          break;
        case 'CERTIFICADO_LABORAL':
          if (!reportParams.empleadoId) {
            alert('Seleccione empleado');
            return;
          }
          result = await generarCertificadoLaboral(reportParams.empleadoId, reportParams.dirigidoA);
          break;
        case 'CERTIFICADO_INGRESOS':
          if (!reportParams.empleadoId || !reportParams.anio) {
            alert('Seleccione empleado y año');
            return;
          }
          result = await generarCertificadoIngresos(reportParams.empleadoId, reportParams.anio);
          break;
        case 'LIQUIDACION':
          if (!reportParams.empleadoId || !reportParams.fechaRetiro || !reportParams.motivoRetiro) {
            alert('Complete todos los campos');
            return;
          }
          result = await generarLiquidacion(reportParams.empleadoId, reportParams.fechaRetiro, reportParams.motivoRetiro);
          break;
      }
      
      console.log('Reporte generado:', result);
      alert('Reporte generado exitosamente');
      setShowReportModal(false);
    } catch (err) {
      console.error('Error generando reporte:', err);
      alert('Error al generar el reporte: ' + err.message);
    }
  };

  const handleExportarPILA = async (periodoId) => {
    try {
      const pila = await generarPILA(periodoId);
      // En produccion, esto generaria un archivo para descargar
      console.log('PILA generada:', pila);
      alert('Planilla PILA generada exitosamente');
    } catch (err) {
      console.error('Error generando PILA:', err);
    }
  };

  // Calcular totales del ultimo periodo
  const ultimoPeriodo = periodosNomina[0];
  const totalNominaMes = ultimoPeriodo?.detalles?.reduce(
    (sum, d) => sum + Number(d.netoPagar || 0), 0
  ) || 0;

  return (
    <div className="space-y-6">
      {/* Alert de normatividad */}
      <Alert className="bg-blue-50 border-blue-200">
        <Info className="h-4 w-4 text-blue-600" />
        <AlertTitle>Normatividad Colombia 2025</AlertTitle>
        <AlertDescription>
          Este modulo esta configurado con los valores legales vigentes: SMLV {formatCurrency(parametrosNormatividad?.smlv)},
          Auxilio de Transporte {formatCurrency(parametrosNormatividad?.auxilioTransporte)}, UVT {formatCurrency(parametrosNormatividad?.uvt)}.
        </AlertDescription>
      </Alert>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <DollarSign className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{formatCurrency(totalNominaMes)}</p>
                <p className="text-sm text-gray-500">Total Nomina Mes</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Calendar className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{periodosNomina.length}</p>
                <p className="text-sm text-gray-500">Periodos</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {periodosNomina.filter(p => p.estado === 'ABIERTO').length}
                </p>
                <p className="text-sm text-gray-500">Pendientes</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {periodosNomina.filter(p => p.estado === 'PAGADO').length}
                </p>
                <p className="text-sm text-gray-500">Pagados</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeSubTab} onValueChange={setActiveSubTab}>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <TabsList>
            <TabsTrigger value="periodos">Periodos</TabsTrigger>
            <TabsTrigger value="novedades">Novedades</TabsTrigger>
            <TabsTrigger value="reportes">Reportes Legales</TabsTrigger>
            <TabsTrigger value="normatividad">Normatividad 2025</TabsTrigger>
          </TabsList>
          <div className="flex items-center gap-2">
            {selectedPeriodo && (
              <Button variant="outline" onClick={() => handleExportarPILA(selectedPeriodo)}>
                <Download className="w-4 h-4 mr-2" />
                Exportar PILA
              </Button>
            )}
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Periodo
            </Button>
          </div>
        </div>

        <TabsContent value="periodos" className="mt-6">
          <Card>
            <CardContent className="pt-6">
              {loading ? (
                <div className="text-center py-12 text-gray-400">Cargando periodos...</div>
              ) : periodosNomina.length === 0 ? (
                <div className="text-center py-12">
                  <Calendar className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                  <h3 className="text-lg font-medium text-gray-500">No hay periodos de nomina</h3>
                  <p className="text-sm text-gray-400 mt-1">Crea un nuevo periodo para procesar la nomina</p>
                  <Button className="mt-4">
                    <Plus className="w-4 h-4 mr-2" />
                    Crear Periodo
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Periodo</TableHead>
                      <TableHead>Fecha Inicio</TableHead>
                      <TableHead>Fecha Fin</TableHead>
                      <TableHead>Fecha Pago</TableHead>
                      <TableHead>Empleados</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {periodosNomina.map(periodo => (
                      <TableRow
                        key={periodo.id}
                        className={selectedPeriodo === periodo.id ? 'bg-blue-50' : ''}
                        onClick={() => setSelectedPeriodo(periodo.id)}
                      >
                        <TableCell className="font-medium">
                          {MESES[periodo.mes - 1]} {periodo.anio}
                          {periodo.quincena && ` (Q${periodo.quincena})`}
                        </TableCell>
                        <TableCell>{new Date(periodo.fechaInicio).toLocaleDateString()}</TableCell>
                        <TableCell>{new Date(periodo.fechaFin).toLocaleDateString()}</TableCell>
                        <TableCell>{new Date(periodo.fechaPago).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{periodo._count?.detalles || 0}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={ESTADO_COLORS[periodo.estado]}>
                            {periodo.estado}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm">
                              <Eye className="w-4 h-4" />
                            </Button>
                            {periodo.estado === 'ABIERTO' && (
                              <Button size="sm" onClick={() => handleProcesar(periodo.id)}>
                                <Calculator className="w-4 h-4 mr-1" />
                                Procesar
                              </Button>
                            )}
                            {(periodo.estado === 'CERRADO' || periodo.estado === 'PAGADO') && (
                              <>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleExportarPILA(periodo.id)}
                                  title="Exportar PILA"
                                >
                                  <FileSpreadsheet className="w-4 h-4" />
                                </Button>
                                {!periodo.contabilizado && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleContabilizarSiigo(periodo.id)}
                                    disabled={contabilizando === periodo.id}
                                    title="Contabilizar en Siigo"
                                    className="text-blue-600 hover:text-blue-700"
                                  >
                                    {contabilizando === periodo.id ? (
                                      <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                      <Cloud className="w-4 h-4" />
                                    )}
                                  </Button>
                                )}
                                {periodo.contabilizado && (
                                  <Badge variant="outline" className="text-green-600 border-green-300">
                                    <CheckCircle className="w-3 h-3 mr-1" />
                                    Siigo
                                  </Badge>
                                )}
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="novedades" className="mt-6">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <FileText className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-500">Novedades de Nomina</h3>
                <p className="text-sm text-gray-400 mt-1">
                  Aqui podras agregar horas extras, bonificaciones, descuentos y otras novedades
                </p>
                <div className="flex items-center justify-center gap-4 mt-6">
                  <Button variant="outline">
                    <TrendingUp className="w-4 h-4 mr-2" />
                    Horas Extras
                  </Button>
                  <Button variant="outline">
                    <DollarSign className="w-4 h-4 mr-2" />
                    Bonificacion
                  </Button>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Otra Novedad
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reportes" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="text-center">
                  <FileText className="w-10 h-10 mx-auto text-blue-600 mb-3" />
                  <h3 className="font-medium">Colillas de Pago</h3>
                  <p className="text-sm text-gray-500 mt-1">Generar colillas individuales para empleados</p>
                  <Button variant="outline" size="sm" className="mt-4" onClick={() => openReportModal('COLILLA')}>
                    Generar
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="text-center">
                  <FileSpreadsheet className="w-10 h-10 mx-auto text-green-600 mb-3" />
                  <h3 className="font-medium">Planilla PILA</h3>
                  <p className="text-sm text-gray-500 mt-1">Exportar para operador de aportes</p>
                  <Button variant="outline" size="sm" className="mt-4" onClick={() => openReportModal('PILA')}>
                    Exportar
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="text-center">
                  <FileSignature className="w-10 h-10 mx-auto text-purple-600 mb-3" />
                  <h3 className="font-medium">Certificado Laboral</h3>
                  <p className="text-sm text-gray-500 mt-1">Generar certificados de trabajo</p>
                  <Button variant="outline" size="sm" className="mt-4" onClick={() => openReportModal('CERTIFICADO_LABORAL')}>
                    Generar
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="text-center">
                  <DollarSign className="w-10 h-10 mx-auto text-orange-600 mb-3" />
                  <h3 className="font-medium">Certificado Ingresos</h3>
                  <p className="text-sm text-gray-500 mt-1">Formulario 220 - Ingresos y retenciones</p>
                  <Button variant="outline" size="sm" className="mt-4" onClick={() => openReportModal('CERTIFICADO_INGRESOS')}>
                    Generar
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="text-center">
                  <Calculator className="w-10 h-10 mx-auto text-red-600 mb-3" />
                  <h3 className="font-medium">Liquidacion Definitiva</h3>
                  <p className="text-sm text-gray-500 mt-1">Calcular prestaciones de retiro</p>
                  <Button variant="outline" size="sm" className="mt-4" onClick={() => openReportModal('LIQUIDACION')}>
                    Calcular
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="text-center">
                  <Users className="w-10 h-10 mx-auto text-indigo-600 mb-3" />
                  <h3 className="font-medium">Resumen Consolidado</h3>
                  <p className="text-sm text-gray-500 mt-1">Totales de nomina por periodo</p>
                  <Button variant="outline" size="sm" className="mt-4" onClick={() => setActiveSubTab('periodos')}>
                    Ver
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="normatividad" className="mt-6">
          <NormatividadPanel
            parametros={parametrosNormatividad}
            fechasImportantes={fechasImportantes}
          />
        </TabsContent>
      </Tabs>

      {/* Modal de Reportes */}
      <Dialog open={showReportModal} onOpenChange={setShowReportModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Generar Reporte</DialogTitle>
            <DialogDescription>
              {selectedReportType === 'COLILLA' && 'Generar colilla de pago detallada'}
              {selectedReportType === 'PILA' && 'Generar planilla PILA para operador'}
              {selectedReportType === 'CERTIFICADO_LABORAL' && 'Generar certificado laboral'}
              {selectedReportType === 'CERTIFICADO_INGRESOS' && 'Generar certificado de ingresos y retenciones'}
              {selectedReportType === 'LIQUIDACION' && 'Calcular liquidación definitiva de contrato'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {/* Selector de Empleado (común para varios reportes) */}
            {(selectedReportType === 'COLILLA' || selectedReportType === 'CERTIFICADO_LABORAL' || selectedReportType === 'CERTIFICADO_INGRESOS' || selectedReportType === 'LIQUIDACION') && (
              <div className="space-y-2">
                <Label>Empleado</Label>
                <Select
                  value={reportParams.empleadoId || ''}
                  onValueChange={(val) => setReportParams({...reportParams, empleadoId: val})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar empleado" />
                  </SelectTrigger>
                  <SelectContent>
                    {empleados?.map(emp => (
                      <SelectItem key={emp.id} value={emp.id}>
                        {emp.nombre} {emp.apellido}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Selector de Periodo (para Colilla y PILA) */}
            {(selectedReportType === 'COLILLA' || selectedReportType === 'PILA') && (
              <div className="space-y-2">
                <Label>Periodo de Nómina</Label>
                <Select
                  value={reportParams.periodoId || ''}
                  onValueChange={(val) => setReportParams({...reportParams, periodoId: val})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar periodo" />
                  </SelectTrigger>
                  <SelectContent>
                    {periodosNomina?.map(periodo => (
                      <SelectItem key={periodo.id} value={periodo.id}>
                        {MESES[periodo.mes - 1]} {periodo.anio} {periodo.quincena ? `(Q${periodo.quincena})` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Campos específicos Certificado Laboral */}
            {selectedReportType === 'CERTIFICADO_LABORAL' && (
              <div className="space-y-2">
                <Label>Dirigido a (Opcional)</Label>
                <Input
                  placeholder="A quien pueda interesar"
                  value={reportParams.dirigidoA || ''}
                  onChange={(e) => setReportParams({...reportParams, dirigidoA: e.target.value})}
                />
              </div>
            )}

            {/* Campos específicos Certificado Ingresos */}
            {selectedReportType === 'CERTIFICADO_INGRESOS' && (
              <div className="space-y-2">
                <Label>Año Gravable</Label>
                <Input
                  type="number"
                  placeholder={new Date().getFullYear() - 1}
                  value={reportParams.anio || ''}
                  onChange={(e) => setReportParams({...reportParams, anio: e.target.value})}
                />
              </div>
            )}

            {/* Campos específicos Liquidación */}
            {selectedReportType === 'LIQUIDACION' && (
              <>
                <div className="space-y-2">
                  <Label>Fecha de Retiro</Label>
                  <Input
                    type="date"
                    value={reportParams.fechaRetiro || ''}
                    onChange={(e) => setReportParams({...reportParams, fechaRetiro: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Motivo de Retiro</Label>
                  <Select
                    value={reportParams.motivoRetiro || ''}
                    onValueChange={(val) => setReportParams({...reportParams, motivoRetiro: val})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar motivo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="RENUNCIA">Renuncia Voluntaria</SelectItem>
                      <SelectItem value="DESPIDO_JUSTA_CAUSA">Despido con Justa Causa</SelectItem>
                      <SelectItem value="DESPIDO_SIN_JUSTA_CAUSA">Despido sin Justa Causa</SelectItem>
                      <SelectItem value="TERMINACION_CONTRATO">Terminación de Contrato</SelectItem>
                      <SelectItem value="MUTUO_ACUERDO">Mutuo Acuerdo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReportModal(false)}>
              Cancelar
            </Button>
            <Button onClick={handleGenerateReport}>
              Generar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
