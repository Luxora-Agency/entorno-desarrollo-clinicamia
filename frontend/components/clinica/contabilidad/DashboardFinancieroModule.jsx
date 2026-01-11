'use client';

import { useState, useEffect } from 'react';
import { useDashboardFinanciero } from '@/hooks/useDashboardFinanciero';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  CreditCard,
  Wallet,
  Building2,
  Package,
  Users,
  AlertTriangle,
  RefreshCw,
  Calendar,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export default function DashboardFinancieroModule() {
  const {
    dashboard,
    tendencias,
    loading,
    fetchDashboard,
    fetchTendencias,
    formatCurrency,
    formatPercent
  } = useDashboardFinanciero();

  const [periodo, setPeriodo] = useState('mes');

  useEffect(() => {
    fetchDashboard();
    fetchTendencias(12);
  }, []);

  if (loading && !dashboard) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const getVariacionIcon = (variacion) => {
    if (variacion > 0) return <ArrowUpRight className="h-4 w-4 text-green-500" />;
    if (variacion < 0) return <ArrowDownRight className="h-4 w-4 text-red-500" />;
    return null;
  };

  const getAgingData = (aging) => {
    if (!aging) return [];
    return [
      { name: 'Corriente', value: aging.corriente?.monto || 0, cantidad: aging.corriente?.cantidad || 0 },
      { name: '1-30 días', value: aging.vencido_1_30?.monto || 0, cantidad: aging.vencido_1_30?.cantidad || 0 },
      { name: '31-60 días', value: aging.vencido_31_60?.monto || 0, cantidad: aging.vencido_31_60?.cantidad || 0 },
      { name: '61-90 días', value: aging.vencido_61_90?.monto || 0, cantidad: aging.vencido_61_90?.cantidad || 0 },
      { name: '+90 días', value: aging.vencido_90_mas?.monto || 0, cantidad: aging.vencido_90_mas?.cantidad || 0 }
    ].filter(item => item.value > 0);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <TrendingUp className="h-6 w-6" />
            Dashboard Financiero
          </h1>
          <p className="text-muted-foreground">
            KPIs ejecutivos y análisis financiero
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={periodo} onValueChange={setPeriodo}>
            <SelectTrigger className="w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="mes">Este mes</SelectItem>
              <SelectItem value="trimestre">Trimestre</SelectItem>
              <SelectItem value="año">Este año</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={() => fetchDashboard()}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* KPIs Principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Ingresos del Mes */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Ingresos del Mes</p>
                <p className="text-2xl font-bold">
                  {formatCurrency(dashboard?.resumenMes?.ingresos)}
                </p>
                <div className="flex items-center gap-1 mt-1">
                  {getVariacionIcon(10)}
                  <span className="text-xs text-muted-foreground">vs mes anterior</span>
                </div>
              </div>
              <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Cartera */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Cartera por Cobrar</p>
                <p className="text-2xl font-bold">
                  {formatCurrency(dashboard?.cartera?.total)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {dashboard?.cartera?.cantidad || 0} facturas pendientes
                </p>
              </div>
              <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                <CreditCard className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Cuentas por Pagar */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Cuentas por Pagar</p>
                <p className="text-2xl font-bold">
                  {formatCurrency(dashboard?.cuentasPorPagar?.total)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {dashboard?.cuentasPorPagar?.cantidad || 0} facturas
                </p>
              </div>
              <div className="h-12 w-12 bg-red-100 rounded-full flex items-center justify-center">
                <Wallet className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Capital de Trabajo */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Capital de Trabajo</p>
                <p className="text-2xl font-bold">
                  {formatCurrency(dashboard?.liquidez?.capitalDeTrabajo)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Efectivo disponible
                </p>
              </div>
              <div className="h-12 w-12 bg-purple-100 rounded-full flex items-center justify-center">
                <Building2 className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Segunda fila de KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Utilidad del Mes */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-muted-foreground">Utilidad del Mes</p>
                <p className="text-3xl font-bold">
                  {formatCurrency(dashboard?.resumenMes?.utilidad)}
                </p>
              </div>
              <Badge
                variant={parseFloat(dashboard?.resumenMes?.margen || 0) >= 20 ? 'default' : 'secondary'}
                className="text-lg"
              >
                {dashboard?.resumenMes?.margen}%
              </Badge>
            </div>
            <Progress
              value={parseFloat(dashboard?.resumenMes?.margen || 0)}
              className="mt-4"
            />
            <p className="text-xs text-muted-foreground mt-2">Margen de utilidad</p>
          </CardContent>
        </Card>

        {/* Inventario */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Inventario</p>
                <p className="text-2xl font-bold">
                  {formatCurrency(dashboard?.inventario?.valorCosto)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {dashboard?.inventario?.items || 0} productos
                </p>
              </div>
              <Package className="h-8 w-8 text-amber-500" />
            </div>
          </CardContent>
        </Card>

        {/* Activos Fijos */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Activos Fijos</p>
                <p className="text-2xl font-bold">
                  {formatCurrency(dashboard?.activosFijos?.valorEnLibros)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {dashboard?.activosFijos?.cantidad || 0} activos | Dep: {formatCurrency(dashboard?.activosFijos?.depreciacionAcumulada)}
                </p>
              </div>
              <Building2 className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tendencia de Ingresos */}
        <Card>
          <CardHeader>
            <CardTitle>Tendencia de Ingresos y Gastos</CardTitle>
            <CardDescription>Últimos 12 meses</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={tendencias}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mesNombre" fontSize={12} />
                <YAxis
                  tickFormatter={(value) => `$${(value / 1000000).toFixed(0)}M`}
                  fontSize={12}
                />
                <Tooltip
                  formatter={(value) => formatCurrency(value)}
                  labelFormatter={(label) => `Período: ${label}`}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="ingresos"
                  stroke="#22c55e"
                  strokeWidth={2}
                  name="Ingresos"
                />
                <Line
                  type="monotone"
                  dataKey="gastos"
                  stroke="#ef4444"
                  strokeWidth={2}
                  name="Gastos"
                />
                <Line
                  type="monotone"
                  dataKey="utilidad"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  name="Utilidad"
                  strokeDasharray="5 5"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Ingresos por Departamento */}
        <Card>
          <CardHeader>
            <CardTitle>Ingresos por Categoría</CardTitle>
            <CardDescription>Distribución del mes actual</CardDescription>
          </CardHeader>
          <CardContent>
            {dashboard?.ingresosPorDepartamento && dashboard.ingresosPorDepartamento.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={dashboard.ingresosPorDepartamento}
                    dataKey="ingresos"
                    nameKey="categoria"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label={({ categoria, percent }) =>
                      `${categoria}: ${(percent * 100).toFixed(0)}%`
                    }
                  >
                    {dashboard.ingresosPorDepartamento.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                Sin datos de ingresos por categoría
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Aging de Cartera y CxP */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Aging Cartera */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Aging de Cartera
            </CardTitle>
            <CardDescription>Antigüedad de cuentas por cobrar</CardDescription>
          </CardHeader>
          <CardContent>
            {getAgingData(dashboard?.cartera?.aging).length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={getAgingData(dashboard?.cartera?.aging)} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" tickFormatter={(v) => `$${(v / 1000000).toFixed(1)}M`} />
                  <YAxis type="category" dataKey="name" width={80} fontSize={12} />
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                  <Bar dataKey="value" fill="#3b82f6" name="Monto" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                Sin cartera pendiente
              </div>
            )}
          </CardContent>
        </Card>

        {/* Aging CxP */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5" />
              Aging Cuentas por Pagar
            </CardTitle>
            <CardDescription>Antigüedad de obligaciones</CardDescription>
          </CardHeader>
          <CardContent>
            {getAgingData(dashboard?.cuentasPorPagar?.aging).length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={getAgingData(dashboard?.cuentasPorPagar?.aging)} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" tickFormatter={(v) => `$${(v / 1000000).toFixed(1)}M`} />
                  <YAxis type="category" dataKey="name" width={80} fontSize={12} />
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                  <Bar dataKey="value" fill="#ef4444" name="Monto" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                Sin cuentas por pagar
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top Deudores */}
      {dashboard?.cartera?.topDeudores && dashboard.cartera.topDeudores.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Top Deudores
            </CardTitle>
            <CardDescription>Pacientes con mayor saldo pendiente</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Paciente</TableHead>
                  <TableHead className="text-right">Facturas</TableHead>
                  <TableHead className="text-right">Saldo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dashboard.cartera.topDeudores.map((deudor, index) => (
                  <TableRow key={deudor.pacienteId}>
                    <TableCell className="font-medium">
                      {index + 1}. {deudor.paciente}
                    </TableCell>
                    <TableCell className="text-right">{deudor.facturas}</TableCell>
                    <TableCell className="text-right font-bold">
                      {formatCurrency(deudor.saldo)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Indicadores de Liquidez */}
      <Card>
        <CardHeader>
          <CardTitle>Indicadores de Liquidez</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">Efectivo</p>
              <p className="text-xl font-bold">{formatCurrency(dashboard?.liquidez?.efectivo)}</p>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">Cuentas por Cobrar</p>
              <p className="text-xl font-bold">{formatCurrency(dashboard?.liquidez?.cuentasPorCobrar)}</p>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">Razón Corriente</p>
              <p className="text-xl font-bold">{dashboard?.liquidez?.razonCorriente || 'N/A'}</p>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">Prueba Ácida</p>
              <p className="text-xl font-bold">{dashboard?.liquidez?.pruebAcida || 'N/A'}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
