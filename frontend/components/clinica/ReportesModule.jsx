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
  GraduationCap,
  Calendar,
  BookOpen,
  Stethoscope,
  FileText,
  ClipboardList,
  Pill,
  Clock,
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

  // Determinar si el usuario es admin o doctor
  const isAdmin = user?.rol === 'SUPER_ADMIN' || user?.rol === 'ADMIN';
  const isDoctor = user?.rol === 'DOCTOR';

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
    misCapacitaciones,
    miActividad,
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
    evolucionesRealizadas: 0,
    // Admin data
    ocupacionCamas: 0,
    ingresosMes: 0,
    gastosMes: 0,
    utilidad: 0,
    satisfaccion: 0,
    // Doctor data
    capacitacionesPendientes: 0,
    capacitacionesCompletadas: 0,
    proximosEventos: 0,
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
            {isAdmin && (
              <Button variant="outline" className="border-slate-600 text-slate-600 hover:bg-slate-50">
                <Download className="w-4 h-4 mr-2" />
                Exportar
              </Button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className={`grid w-full bg-white border shadow-sm ${isDoctor ? 'grid-cols-3' : 'grid-cols-4'}`}>
            <TabsTrigger value="general" className="data-[state=active]:bg-slate-100 data-[state=active]:text-slate-700">
              Dashboard General
            </TabsTrigger>
            {isDoctor && (
              <TabsTrigger value="capacitaciones" className="data-[state=active]:bg-amber-100 data-[state=active]:text-amber-700">
                Mis Capacitaciones
              </TabsTrigger>
            )}
            {isAdmin && (
              <TabsTrigger value="servicios" className="data-[state=active]:bg-blue-100 data-[state=active]:text-blue-700">
                Servicios
              </TabsTrigger>
            )}
            {isAdmin && (
              <TabsTrigger value="calidad" className="data-[state=active]:bg-green-100 data-[state=active]:text-green-700">
                Indicadores de Calidad
              </TabsTrigger>
            )}
            <TabsTrigger value="auditoria" className="data-[state=active]:bg-purple-100 data-[state=active]:text-purple-700">
              {isDoctor ? 'Mi Actividad' : 'Auditoría'}
            </TabsTrigger>
          </TabsList>

          {/* Tab: Dashboard General */}
          <TabsContent value="general" className="mt-6 space-y-6">
            {/* KPIs Principales - Común para todos */}
            <div className={`grid grid-cols-1 gap-4 ${isDoctor ? 'md:grid-cols-4' : 'md:grid-cols-5'}`}>
              <Card className="border-l-4 border-l-blue-500">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">{isDoctor ? 'Mis Pacientes' : 'Total Pacientes'}</p>
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
                      <p className="text-sm text-gray-600">{isDoctor ? 'Mis Consultas' : 'Consultas Realizadas'}</p>
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
                      <p className="text-sm text-gray-600">{isDoctor ? 'Mis Evoluciones' : 'Evoluciones HCE'}</p>
                      <p className="text-2xl font-bold text-orange-600">{kpisGenerales.evolucionesRealizadas || 0}</p>
                      <p className="text-xs text-gray-500 mt-1">Realizadas</p>
                    </div>
                    <Activity className="w-8 h-8 text-orange-600" />
                  </div>
                </CardContent>
              </Card>

              {/* KPIs específicos para Admin */}
              {isAdmin && (
                <>
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
                </>
              )}

              {/* KPIs específicos para Doctor - Capacitaciones */}
              {isDoctor && (
                <Card className="border-l-4 border-l-purple-500">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Próximos Eventos</p>
                        <p className="text-2xl font-bold text-purple-600">{kpisGenerales.proximosEventos || 0}</p>
                        <p className="text-xs text-gray-500 mt-1">Capacitaciones</p>
                      </div>
                      <Calendar className="w-8 h-8 text-purple-600" />
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* KPIs Financieros - Solo para Admin */}
            {isAdmin && (
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
            )}

            {/* KPIs Capacitaciones - Solo para Doctor */}
            {isDoctor && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm text-gray-600">Capacitaciones Pendientes</p>
                      <BookOpen className="w-5 h-5 text-amber-600" />
                    </div>
                    <p className="text-2xl font-bold text-amber-600">{kpisGenerales.capacitacionesPendientes || 0}</p>
                    <p className="text-xs text-gray-500 mt-1">Por completar</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm text-gray-600">Capacitaciones Completadas</p>
                      <GraduationCap className="w-5 h-5 text-green-600" />
                    </div>
                    <p className="text-2xl font-bold text-green-600">{kpisGenerales.capacitacionesCompletadas || 0}</p>
                    <p className="text-xs text-gray-500 mt-1">Finalizadas</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm text-gray-600">Total Capacitaciones</p>
                      <GraduationCap className="w-5 h-5 text-blue-600" />
                    </div>
                    <p className="text-2xl font-bold text-blue-600">
                      {(kpisGenerales.capacitacionesPendientes || 0) + (kpisGenerales.capacitacionesCompletadas || 0)}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">Asignadas</p>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Gráficas */}
            <div className={`grid grid-cols-1 gap-6 ${isDoctor ? 'lg:grid-cols-2' : 'lg:grid-cols-2'}`}>
              {/* Ingresos vs Gastos - Solo Admin */}
              {isAdmin && (
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
              )}

              {/* Ocupación Mensual - Solo Admin */}
              {isAdmin && (
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
              )}

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">{isDoctor ? 'Mis Consultas por Especialidad' : 'Consultas por Especialidad'}</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={consultasPorEspecialidad}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ especialidad, porcentaje }) => `${especialidad?.split(' ')[0] || ''} ${porcentaje}%`}
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
                  <CardTitle className="text-lg">{isDoctor ? 'Mis Pacientes por Edad' : 'Distribución por Edad'}</CardTitle>
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

          {/* Tab: Mis Capacitaciones - Solo para Doctor */}
          {isDoctor && (
            <TabsContent value="capacitaciones" className="mt-6 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <GraduationCap className="w-5 h-5 text-amber-600" />
                    Mis Capacitaciones Asignadas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {misCapacitaciones.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Capacitación</TableHead>
                          <TableHead>Categoría</TableHead>
                          <TableHead>Modalidad</TableHead>
                          <TableHead>Duración</TableHead>
                          <TableHead>Fecha Inicio</TableHead>
                          <TableHead className="text-center">Estado</TableHead>
                          <TableHead className="text-center">Acción</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {misCapacitaciones.map((cap) => (
                          <TableRow key={cap.id}>
                            <TableCell>
                              <div>
                                <p className="font-medium">{cap.nombre}</p>
                                {cap.descripcion && (
                                  <p className="text-xs text-gray-500 line-clamp-1">{cap.descripcion}</p>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">{cap.categoria}</Badge>
                            </TableCell>
                            <TableCell>{cap.modalidad}</TableCell>
                            <TableCell>{cap.duracionHoras}h</TableCell>
                            <TableCell>
                              {cap.fechaInicio ? new Date(cap.fechaInicio).toLocaleDateString('es-CO') : '-'}
                            </TableCell>
                            <TableCell className="text-center">
                              {cap.estado === 'COMPLETADO' || cap.estado === 'ASISTIO' ? (
                                <Badge className="bg-green-100 text-green-800">
                                  <CheckCircle className="w-3 h-3 mr-1 inline" />
                                  Completada
                                </Badge>
                              ) : cap.estado === 'NO_ASISTIO' ? (
                                <Badge className="bg-red-100 text-red-800">
                                  <XCircle className="w-3 h-3 mr-1 inline" />
                                  No Asistió
                                </Badge>
                              ) : cap.estado === 'CANCELADO' ? (
                                <Badge className="bg-gray-100 text-gray-800">
                                  Cancelada
                                </Badge>
                              ) : cap.estado === 'EN_PROGRESO' ? (
                                <Badge className="bg-blue-100 text-blue-800">
                                  <Activity className="w-3 h-3 mr-1 inline" />
                                  En Progreso
                                </Badge>
                              ) : (
                                <Badge className="bg-amber-100 text-amber-800">
                                  <BookOpen className="w-3 h-3 mr-1 inline" />
                                  Pendiente
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-center">
                              {cap.puedeRealizar ? (
                                <Button
                                  size="sm"
                                  className="bg-amber-600 hover:bg-amber-700"
                                  onClick={() => {
                                    // TODO: Navegar a la capacitación o abrir modal
                                    window.open(`/capacitaciones/${cap.capacitacionId}`, '_blank');
                                  }}
                                >
                                  <GraduationCap className="w-4 h-4 mr-1" />
                                  Realizar
                                </Button>
                              ) : cap.certificadoUrl ? (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => window.open(cap.certificadoUrl, '_blank')}
                                >
                                  Ver Certificado
                                </Button>
                              ) : cap.notaEvaluacion ? (
                                <span className="text-sm font-medium text-green-600">
                                  Nota: {cap.notaEvaluacion}
                                </span>
                              ) : (
                                <span className="text-sm text-gray-400">-</span>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="text-center py-12">
                      <GraduationCap className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                      <p className="text-gray-500">No tienes capacitaciones asignadas</p>
                      <p className="text-sm text-gray-400 mt-1">
                        Las capacitaciones aparecerán aquí cuando sean asignadas por el administrador
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Resumen de Capacitaciones */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="border-l-4 border-l-amber-500">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Total Asignadas</p>
                        <p className="text-2xl font-bold text-amber-600">{misCapacitaciones.length}</p>
                      </div>
                      <BookOpen className="w-8 h-8 text-amber-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-green-500">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Completadas</p>
                        <p className="text-2xl font-bold text-green-600">
                          {misCapacitaciones.filter(c => ['COMPLETADO', 'ASISTIO'].includes(c.estado)).length}
                        </p>
                      </div>
                      <CheckCircle className="w-8 h-8 text-green-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-blue-500">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">En Progreso</p>
                        <p className="text-2xl font-bold text-blue-600">
                          {misCapacitaciones.filter(c => c.estado === 'EN_PROGRESO').length}
                        </p>
                      </div>
                      <Activity className="w-8 h-8 text-blue-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-purple-500">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Pendientes</p>
                        <p className="text-2xl font-bold text-purple-600">
                          {misCapacitaciones.filter(c => c.estado === 'INSCRITO').length}
                        </p>
                      </div>
                      <Calendar className="w-8 h-8 text-purple-600" />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          )}

          {/* Tab: Servicios - Solo Admin */}
          {isAdmin && (
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
                        {serviciosMasSolicitados.length > 0 ? (
                          serviciosMasSolicitados.map((servicio, index) => (
                            <TableRow key={index}>
                              <TableCell className="font-medium">{servicio.servicio}</TableCell>
                              <TableCell className="text-right">{servicio.cantidad}</TableCell>
                              <TableCell className="text-right">
                                <span className={`font-semibold ${servicio.variacion?.includes('+') ? 'text-green-600' : 'text-red-600'}`}>
                                  {servicio.variacion}
                                </span>
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={3} className="text-center text-gray-500 py-8">
                              No hay servicios registrados en este periodo
                            </TableCell>
                          </TableRow>
                        )}
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
                        {rendimientoMedicos.length > 0 ? (
                          rendimientoMedicos.map((medico, index) => (
                            <TableRow key={index}>
                              <TableCell className="font-medium">{medico.medico}</TableCell>
                              <TableCell className="text-right">{medico.consultas}</TableCell>
                              <TableCell className="text-right">{medico.cirugias}</TableCell>
                              <TableCell className="text-right">
                                {formatCurrency(medico.ingresos)}
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center text-gray-500 py-8">
                              No hay datos de rendimiento disponibles
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          )}

          {/* Tab: Indicadores de Calidad - Solo Admin */}
          {isAdmin && (
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
          )}

          {/* Tab: Auditoría / Mi Actividad */}
          <TabsContent value="auditoria" className="mt-6 space-y-6">
            {/* Vista para Doctores - Mi Actividad Reciente */}
            {isDoctor ? (
              <>
                {/* Stats de actividad */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Card className="border-l-4 border-l-blue-500">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600">Consultas (30 días)</p>
                          <p className="text-2xl font-bold text-blue-600">{miActividad.stats?.consultasUltimos30Dias || 0}</p>
                        </div>
                        <Stethoscope className="w-8 h-8 text-blue-600" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-l-4 border-l-green-500">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600">Evoluciones (30 días)</p>
                          <p className="text-2xl font-bold text-green-600">{miActividad.stats?.evolucionesUltimos30Dias || 0}</p>
                        </div>
                        <FileText className="w-8 h-8 text-green-600" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-l-4 border-l-amber-500">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600">Órdenes (30 días)</p>
                          <p className="text-2xl font-bold text-amber-600">{miActividad.stats?.ordenesUltimos30Dias || 0}</p>
                        </div>
                        <ClipboardList className="w-8 h-8 text-amber-600" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-l-4 border-l-purple-500">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600">Prescripciones (30 días)</p>
                          <p className="text-2xl font-bold text-purple-600">{miActividad.stats?.prescripcionesUltimos30Dias || 0}</p>
                        </div>
                        <Pill className="w-8 h-8 text-purple-600" />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Timeline de actividad */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Clock className="w-5 h-5 text-purple-600" />
                      Mi Actividad Reciente
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {miActividad.actividad?.length > 0 ? (
                      <div className="space-y-4">
                        {miActividad.actividad.map((item, index) => (
                          <div key={index} className="flex items-start gap-4 p-3 rounded-lg hover:bg-gray-50 border-l-4" style={{
                            borderLeftColor: item.tipo === 'consulta' ? '#3b82f6' :
                                           item.tipo === 'evolucion' ? '#10b981' :
                                           item.tipo === 'orden' ? '#f59e0b' : '#8b5cf6'
                          }}>
                            <div className={`p-2 rounded-full ${
                              item.tipo === 'consulta' ? 'bg-blue-100' :
                              item.tipo === 'evolucion' ? 'bg-green-100' :
                              item.tipo === 'orden' ? 'bg-amber-100' : 'bg-purple-100'
                            }`}>
                              {item.tipo === 'consulta' && <Stethoscope className="w-5 h-5 text-blue-600" />}
                              {item.tipo === 'evolucion' && <FileText className="w-5 h-5 text-green-600" />}
                              {item.tipo === 'orden' && <ClipboardList className="w-5 h-5 text-amber-600" />}
                              {item.tipo === 'prescripcion' && <Pill className="w-5 h-5 text-purple-600" />}
                            </div>
                            <div className="flex-1">
                              <p className="font-medium text-gray-900">{item.descripcion}</p>
                              <p className="text-sm text-gray-500">{item.detalle}</p>
                              <div className="flex items-center gap-4 mt-1">
                                <span className="text-xs text-gray-400">
                                  {new Date(item.fecha).toLocaleDateString('es-CO', {
                                    day: '2-digit',
                                    month: 'short',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </span>
                                <Badge variant="outline" className="text-xs">
                                  {item.tipo === 'consulta' ? 'Consulta' :
                                   item.tipo === 'evolucion' ? 'Evolución' :
                                   item.tipo === 'orden' ? 'Orden Médica' : 'Prescripción'}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <Clock className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                        <p className="text-gray-500">No hay actividad reciente</p>
                        <p className="text-sm text-gray-400 mt-1">
                          Tu actividad clínica aparecerá aquí
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </>
            ) : (
              /* Vista para Admin - Registro de Auditoría */
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
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
