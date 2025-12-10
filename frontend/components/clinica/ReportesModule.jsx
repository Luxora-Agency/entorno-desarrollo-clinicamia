'use client';

import { useState } from 'react';
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
  Calendar,
  Users,
  Activity,
  DollarSign,
  FileText,
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle,
  Eye,
  Filter,
  PieChart as PieChartIcon,
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
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
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from 'recharts';

export default function ReportesModule({ user }) {
  const [activeTab, setActiveTab] = useState('general');
  const [periodoSeleccionado, setPeriodoSeleccionado] = useState('mes');

  // Datos para Dashboard General
  const kpisGenerales = {
    totalPacientes: 1247,
    pacientesNuevos: 89,
    consultasRealizadas: 456,
    ocupacionCamas: 78,
    ingresosMes: 24850000,
    gastosMes: 18200000,
    utilidad: 6650000,
    satisfaccion: 4.6,
  };

  // Datos de consultas por especialidad
  const consultasPorEspecialidad = [
    { especialidad: 'Medicina General', cantidad: 145, porcentaje: 32 },
    { especialidad: 'Pediatría', cantidad: 98, porcentaje: 21 },
    { especialidad: 'Ginecología', cantidad: 76, porcentaje: 17 },
    { especialidad: 'Cardiología', cantidad: 54, porcentaje: 12 },
    { especialidad: 'Ortopedia', cantidad: 43, porcentaje: 9 },
    { especialidad: 'Otros', cantidad: 40, porcentaje: 9 },
  ];

  // Datos de ocupación por mes
  const ocupacionMensual = [
    { mes: 'Jul', ocupacion: 72, capacidad: 100 },
    { mes: 'Ago', ocupacion: 78, capacidad: 100 },
    { mes: 'Sep', ocupacion: 75, capacidad: 100 },
    { mes: 'Oct', ocupacion: 81, capacidad: 100 },
    { mes: 'Nov', ocupacion: 85, capacidad: 100 },
    { mes: 'Dic', ocupacion: 88, capacidad: 100 },
    { mes: 'Ene', ocupacion: 78, capacidad: 100 },
  ];

  // Datos de ingresos vs gastos
  const ingresosGastos = [
    { mes: 'Jul', ingresos: 21500000, gastos: 16200000 },
    { mes: 'Ago', ingresos: 23800000, gastos: 17500000 },
    { mes: 'Sep', ingresos: 22100000, gastos: 16800000 },
    { mes: 'Oct', ingresos: 25300000, gastos: 18900000 },
    { mes: 'Nov', ingresos: 26700000, gastos: 19200000 },
    { mes: 'Dic', ingresos: 28500000, gastos: 20100000 },
    { mes: 'Ene', ingresos: 24850000, gastos: 18200000 },
  ];

  // Datos de distribución de pacientes por edad
  const pacientesPorEdad = [
    { rango: '0-18', cantidad: 156 },
    { rango: '19-35', cantidad: 342 },
    { rango: '36-50', cantidad: 398 },
    { rango: '51-65', cantidad: 245 },
    { rango: '65+', cantidad: 106 },
  ];

  // Datos de servicios más solicitados
  const serviciosMasSolicitados = [
    { servicio: 'Consulta Externa', cantidad: 456, variacion: '+12%' },
    { servicio: 'Laboratorio Clínico', cantidad: 234, variacion: '+8%' },
    { servicio: 'Imagenología', cantidad: 189, variacion: '+15%' },
    { servicio: 'Urgencias', cantidad: 145, variacion: '+5%' },
    { servicio: 'Cirugías', cantidad: 87, variacion: '+3%' },
    { servicio: 'Hospitalización', cantidad: 62, variacion: '-2%' },
  ];

  // Datos de indicadores de calidad
  const indicadoresCalidad = [
    { indicador: 'Satisfacción del Paciente', valor: 4.6, meta: 4.5, cumple: true },
    { indicador: 'Tiempo de Espera (min)', valor: 18, meta: 20, cumple: true },
    { indicador: 'Tasa de Ocupación (%)', valor: 78, meta: 75, cumple: true },
    { indicador: 'Reingresos 30 días (%)', valor: 3.2, meta: 5, cumple: true },
    { indicador: 'Infecciones Nosocomiales (%)', valor: 1.1, meta: 2, cumple: true },
    { indicador: 'Quejas y Reclamos', valor: 8, meta: 10, cumple: true },
  ];

  // Datos de auditoría
  const registrosAuditoria = [
    {
      id: 'AUD-001',
      fecha: '2025-01-15 14:35',
      usuario: 'Dr. Carlos Méndez',
      accion: 'Modificación HCE',
      modulo: 'Historia Clínica',
      detalle: 'Actualización de evolución clínica - Paciente: María González',
      tipo: 'Modificación',
    },
    {
      id: 'AUD-002',
      fecha: '2025-01-15 13:22',
      usuario: 'Admin Sistema',
      accion: 'Creación Usuario',
      modulo: 'Administración',
      detalle: 'Nuevo usuario médico: Dr. Roberto Silva',
      tipo: 'Creación',
    },
    {
      id: 'AUD-003',
      fecha: '2025-01-15 11:45',
      usuario: 'Enf. Laura Díaz',
      accion: 'Administración Medicamento',
      modulo: 'Enfermería',
      detalle: 'Medicamento administrado - Paciente: Juan Pérez',
      tipo: 'Registro',
    },
    {
      id: 'AUD-004',
      fecha: '2025-01-15 10:15',
      usuario: 'Dr. Patricia Gómez',
      accion: 'Eliminación Registro',
      modulo: 'Laboratorio',
      detalle: 'Orden de laboratorio cancelada por error',
      tipo: 'Eliminación',
    },
    {
      id: 'AUD-005',
      fecha: '2025-01-15 09:30',
      usuario: 'Admin Facturación',
      accion: 'Modificación Factura',
      modulo: 'Facturación',
      detalle: 'Corrección de valor en factura FACT-2025-003',
      tipo: 'Modificación',
    },
  ];

  // Datos de rendimiento por médico
  const rendimientoMedicos = [
    { medico: 'Dr. Carlos Méndez', consultas: 87, cirugias: 12, satisfaccion: 4.8, ingresos: 8500000 },
    { medico: 'Dra. Patricia Gómez', consultas: 76, cirugias: 15, satisfaccion: 4.7, ingresos: 9200000 },
    { medico: 'Dr. Eduardo Torres', consultas: 54, cirugias: 8, satisfaccion: 4.6, ingresos: 6800000 },
    { medico: 'Dra. Sandra Reyes', consultas: 92, cirugias: 6, satisfaccion: 4.9, ingresos: 7100000 },
    { medico: 'Dr. Jorge Ramírez', consultas: 45, cirugias: 18, satisfaccion: 4.5, ingresos: 10500000 },
  ];

  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ef4444', '#6366f1'];

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(value);
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
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="border-l-4 border-l-blue-500">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Total Pacientes</p>
                      <p className="text-2xl font-bold text-blue-600">{kpisGenerales.totalPacientes}</p>
                      <p className="text-xs text-green-600 flex items-center gap-1 mt-1">
                        <TrendingUp className="w-3 h-3" />
                        +{kpisGenerales.pacientesNuevos} este mes
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
                      <p className="text-xs text-gray-500 mt-1">Este mes</p>
                    </div>
                    <Activity className="w-8 h-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-purple-500">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Ocupación Camas</p>
                      <p className="text-2xl font-bold text-purple-600">{kpisGenerales.ocupacionCamas}%</p>
                      <p className="text-xs text-gray-500 mt-1">Promedio mes</p>
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
                    <p className="text-sm text-gray-600">Ingresos del Mes</p>
                    <DollarSign className="w-5 h-5 text-green-600" />
                  </div>
                  <p className="text-2xl font-bold text-green-600">{formatCurrency(kpisGenerales.ingresosMes)}</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm text-gray-600">Gastos del Mes</p>
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
                        <TableHead className="text-right">Rating</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rendimientoMedicos.map((medico, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{medico.medico}</TableCell>
                          <TableCell className="text-right">{medico.consultas}</TableCell>
                          <TableCell className="text-right">{medico.cirugias}</TableCell>
                          <TableCell className="text-right">
                            <Badge className="bg-green-100 text-green-800">
                              {medico.satisfaccion} ⭐
                            </Badge>
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
