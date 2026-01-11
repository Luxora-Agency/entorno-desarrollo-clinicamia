'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  BarChart3,
  TrendingUp,
  Download,
  Users,
  Activity,
  DollarSign,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell, 
  AreaChart,
  Area,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
} from 'recharts';
import useReportes from '@/hooks/useReportes';

export default function ReportesModule({ user }) {
  const [activeTab, setActiveTab] = useState('general');
  const [periodoSeleccionado, setPeriodoSeleccionado] = useState('mes');
  
  const {
    loading,
    generalStats,
    financialStats,
    occupancyStats,
    specialtyStats,
    demographicsStats,
    servicesStats,
    doctorsStats,
    qualityStats,
    auditStats,
    fetchAllStats
  } = useReportes();

  useEffect(() => {
    fetchAllStats(periodoSeleccionado);
  }, [fetchAllStats, periodoSeleccionado]);

  // Fallback data structure if loading or error
  const kpisGenerales = generalStats || {
    totalPacientes: 0,
    pacientesNuevos: 0,
    consultasRealizadas: 0,
    ocupacionCamas: 0,
    ingresosMes: 0,
    gastosMes: 0,
    utilidad: 0,
    satisfaccion: 0,
  };

  const consultasPorEspecialidad = specialtyStats.length > 0 ? specialtyStats : [];
  const ocupacionMensual = occupancyStats.length > 0 ? occupancyStats : [];
  const ingresosGastos = financialStats.length > 0 ? financialStats : [];
  const pacientesPorEdad = demographicsStats.length > 0 ? demographicsStats : [];
  const serviciosMasSolicitados = servicesStats.length > 0 ? servicesStats : [];
  const indicadoresCalidad = qualityStats.length > 0 ? qualityStats : [];
  const registrosAuditoria = auditStats.length > 0 ? auditStats : [];
  const rendimientoMedicos = doctorsStats.length > 0 ? doctorsStats : [];

  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ef4444', '#6366f1'];

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(value || 0);
  };

  const getTipoAuditoriaColor = (tipo) => {
    switch (tipo) {
      case 'Creación': return 'bg-green-100 text-green-800';
      case 'Modificación': return 'bg-yellow-100 text-yellow-800';
      case 'Eliminación': return 'bg-red-100 text-red-800';
      case 'Registro': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading && !generalStats) {
    return <div className="p-8 text-center">Cargando reportes...</div>;
  }

  return (
    <div className="p-6 lg:p-8 bg-gradient-to-br from-slate-50 via-gray-50 to-zinc-50 min-h-screen">
      <div className="w-full">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-slate-600 to-gray-700 rounded-lg shadow-lg">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Reportes y Auditoría</h1>
              <p className="text-sm text-gray-600">Analytics y Control de Gestión</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Select value={periodoSeleccionado} onValueChange={setPeriodoSeleccionado}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="dia">Hoy</SelectItem>
                <SelectItem value="semana">Esta Semana</SelectItem>
                <SelectItem value="mes">Este Mes</SelectItem>
                <SelectItem value="trimestre">Trimestre</SelectItem>
                <SelectItem value="ano">Año</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" className="border-slate-600 text-slate-600 hover:bg-slate-50">
              <Download className="w-4 h-4 mr-2" />
              Exportar
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-white border shadow-sm">
            <TabsTrigger value="general" className="data-[state=active]:bg-slate-100 data-[state=active]:text-slate-700">
              Dashboard General
            </TabsTrigger>
            <TabsTrigger value="servicios" className="data-[state=active]:bg-blue-100 data-[state=active]:text-blue-700">
              Servicios
            </TabsTrigger>
            <TabsTrigger value="calidad" className="data-[state=active]:bg-green-100 data-[state=active]:text-green-700">
              Indicadores de Calidad
            </TabsTrigger>
            <TabsTrigger value="auditoria" className="data-[state=active]:bg-purple-100 data-[state=active]:text-purple-700">
              Auditoría
            </TabsTrigger>
          </TabsList>

          {/* Tab: Dashboard General */}
          <TabsContent value="general" className="mt-6 space-y-6">
            {/* KPIs Principales */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <Card className="border-l-4 border-l-blue-500">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Total Pacientes</p>
                      <p className="text-2xl font-bold text-blue-600">{kpisGenerales.totalPacientes}</p>
                      <p className="text-xs text-green-600 flex items-center gap-1 mt-1">
                        <TrendingUp className="w-3 h-3" />
                        +{kpisGenerales.pacientesNuevos} nuevos
                      </p>
                    </div>
                    <Users className="w-8 h-8 text-blue-600" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-green-500">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Consultas Realizadas</p>
                      <p className="text-2xl font-bold text-green-600">{kpisGenerales.consultasRealizadas}</p>
                      <p className="text-xs text-gray-500 mt-1">Este periodo</p>
                    </div>
                    <Activity className="w-8 h-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-orange-500">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Evoluciones HCE</p>
                      <p className="text-2xl font-bold text-orange-600">{kpisGenerales.evolucionesRealizadas || 0}</p>
                      <p className="text-xs text-gray-500 mt-1">Realizadas</p>
                    </div>
                    <Activity className="w-8 h-8 text-orange-600" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-purple-500">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Ocupación Camas</p>
                      <p className="text-2xl font-bold text-purple-600">{kpisGenerales.ocupacionCamas}%</p>
                      <p className="text-xs text-gray-500 mt-1">Actual</p>
                    </div>
                    <Activity className="w-8 h-8 text-purple-600" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-emerald-500">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Satisfacción</p>
                      <p className="text-2xl font-bold text-emerald-600">{kpisGenerales.satisfaccion}/5</p>
                      <p className="text-xs text-gray-500 mt-1">Rating promedio</p>
                    </div>
                    <CheckCircle className="w-8 h-8 text-emerald-600" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* KPIs Financieros */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm text-gray-600">Ingresos del Periodo</p>
                    <DollarSign className="w-5 h-5 text-green-600" />
                  </div>
                  <p className="text-2xl font-bold text-green-600">{formatCurrency(kpisGenerales.ingresosMes)}</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm text-gray-600">Gastos del Periodo</p>
                    <DollarSign className="w-5 h-5 text-red-600" />
                  </div>
                  <p className="text-2xl font-bold text-red-600">{formatCurrency(kpisGenerales.gastosMes)}</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm text-gray-600">Utilidad Neta</p>
                    <TrendingUp className="w-5 h-5 text-blue-600" />
                  </div>
                  <p className="text-2xl font-bold text-blue-600">{formatCurrency(kpisGenerales.utilidad)}</p>
                </CardContent>
              </Card>
            </div>

            {/* Gráficas */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Ingresos vs Gastos (7 meses)</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={ingresosGastos}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="mes" />
                      <YAxis />
                      <Tooltip formatter={(value) => formatCurrency(value)} />
                      <Legend />
                      <Area type="monotone" dataKey="ingresos" stackId="1" stroke="#10b981" fill="#10b981" name="Ingresos" />
                      <Area type="monotone" dataKey="gastos" stackId="2" stroke="#ef4444" fill="#ef4444" name="Gastos" />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Ocupación Mensual (%)</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={ocupacionMensual}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="mes" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="ocupacion" fill="#8b5cf6" name="Ocupación %" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Consultas por Especialidad</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={consultasPorEspecialidad}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ especialidad, porcentaje }) => `${especialidad.split(' ')[0]} ${porcentaje}%`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="cantidad"
                      >
                        {consultasPorEspecialidad.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Distribución por Edad</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={pacientesPorEdad}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="rango" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="cantidad" fill="#3b82f6" name="Pacientes" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Tab: Servicios */}
          <TabsContent value="servicios" className="mt-6 space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Servicios Más Solicitados</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Servicio</TableHead>
                        <TableHead className="text-right">Cantidad</TableHead>
                        <TableHead className="text-right">Variación</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {serviciosMasSolicitados.map((servicio, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{servicio.servicio}</TableCell>
                          <TableCell className="text-right">{servicio.cantidad}</TableCell>
                          <TableCell className="text-right">
                            <span className={`font-semibold ${servicio.variacion.includes('+') ? 'text-green-600' : 'text-red-600'}`}>
                              {servicio.variacion}
                            </span>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Rendimiento por Médico</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Médico</TableHead>
                        <TableHead className="text-right">Consultas</TableHead>
                        <TableHead className="text-right">Cirugías</TableHead>
                        <TableHead className="text-right">Ingresos</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rendimientoMedicos.map((medico, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{medico.medico}</TableCell>
                          <TableCell className="text-right">{medico.consultas}</TableCell>
                          <TableCell className="text-right">{medico.cirugias}</TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(medico.ingresos)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Tab: Indicadores de Calidad */}
          <TabsContent value="calidad" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Indicadores de Calidad</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Indicador</TableHead>
                      <TableHead className="text-right">Valor Actual</TableHead>
                      <TableHead className="text-right">Meta</TableHead>
                      <TableHead className="text-center">Estado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {indicadoresCalidad.map((indicador, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{indicador.indicador}</TableCell>
                        <TableCell className="text-right text-lg font-semibold">
                          {indicador.valor}
                          {indicador.indicador.includes('%') ? '' : indicador.indicador.includes('Satisfacción') ? '/5' : ''}
                        </TableCell>
                        <TableCell className="text-right text-gray-600">
                          {indicador.meta}
                        </TableCell>
                        <TableCell className="text-center">
                          {indicador.cumple ? (
                            <Badge className="bg-green-100 text-green-800">
                              <CheckCircle className="w-3 h-3 mr-1 inline" />
                              Cumple
                            </Badge>
                          ) : (
                            <Badge className="bg-red-100 text-red-800">
                              <XCircle className="w-3 h-3 mr-1 inline" />
                              No Cumple
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Auditoría */}
          <TabsContent value="auditoria" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Registro de Auditoría</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Fecha/Hora</TableHead>
                      <TableHead>Usuario</TableHead>
                      <TableHead>Acción</TableHead>
                      <TableHead>Módulo</TableHead>
                      <TableHead>Detalle</TableHead>
                      <TableHead>Tipo</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {registrosAuditoria.map((registro) => (
                      <TableRow key={registro.id}>
                        <TableCell className="font-medium">{registro.id}</TableCell>
                        <TableCell className="text-sm">{registro.fecha}</TableCell>
                        <TableCell>{registro.usuario}</TableCell>
                        <TableCell className="font-medium">{registro.accion}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{registro.modulo}</Badge>
                        </TableCell>
                        <TableCell className="max-w-xs text-sm text-gray-600">
                          {registro.detalle}
                        </TableCell>
                        <TableCell>
                          <Badge className={getTipoAuditoriaColor(registro.tipo)}>
                            {registro.tipo}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
