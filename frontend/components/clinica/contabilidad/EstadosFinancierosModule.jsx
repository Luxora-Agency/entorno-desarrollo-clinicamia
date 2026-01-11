'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import {
  TrendingUp, TrendingDown, FileText, Download, Loader2,
  BarChart3, PieChart, ArrowUpRight, ArrowDownRight, Minus
} from 'lucide-react';
import { toast } from 'sonner';
import { apiGet } from '@/services/api';
import ReactECharts from 'echarts-for-react';

const formatCurrency = (value) => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0
  }).format(value || 0);
};

const formatPercent = (value) => {
  return new Intl.NumberFormat('es-CO', {
    style: 'percent',
    minimumFractionDigits: 2
  }).format(value / 100);
};

const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

export default function EstadosFinancierosModule() {
  const [activeTab, setActiveTab] = useState('balance');
  const [balanceGeneral, setBalanceGeneral] = useState(null);
  const [estadoResultados, setEstadoResultados] = useState(null);
  const [flujoEfectivo, setFlujoEfectivo] = useState(null);
  const [indicadores, setIndicadores] = useState(null);
  const [balanceComprobacion, setBalanceComprobacion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [comparativo, setComparativo] = useState(false);

  const currentDate = new Date();
  const [filtros, setFiltros] = useState({
    anio: currentDate.getFullYear(),
    mes: currentDate.getMonth() + 1
  });

  useEffect(() => {
    fetchEstados();
  }, [filtros.anio, filtros.mes, comparativo]);

  const fetchEstados = async () => {
    try {
      setLoading(true);
      const params = { anio: filtros.anio, mes: filtros.mes, comparativo };

      const [balanceRes, resultadosRes, flujoRes, indicadoresRes, comprobacionRes] = await Promise.all([
        apiGet('/contabilidad/estados-financieros/balance-general', params),
        apiGet('/contabilidad/estados-financieros/estado-resultados', params),
        apiGet('/contabilidad/estados-financieros/flujo-efectivo', params),
        apiGet('/contabilidad/estados-financieros/indicadores', params),
        apiGet('/contabilidad/estados-financieros/balance-comprobacion', { ...params, nivel: 2 })
      ]);

      setBalanceGeneral(balanceRes.data);
      setEstadoResultados(resultadosRes.data);
      setFlujoEfectivo(flujoRes.data);
      setIndicadores(indicadoresRes.data);
      setBalanceComprobacion(comprobacionRes.data);
    } catch (error) {
      toast.error('Error cargando estados financieros: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const getBalanceChartOption = () => {
    if (!balanceGeneral) return {};

    return {
      tooltip: { trigger: 'item' },
      legend: { bottom: 0 },
      series: [{
        type: 'pie',
        radius: ['40%', '70%'],
        avoidLabelOverlap: false,
        label: {
          show: false,
          position: 'center'
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 14,
            fontWeight: 'bold'
          }
        },
        data: [
          { value: Math.abs(balanceGeneral.totalActivos || 0), name: 'Activos', itemStyle: { color: '#3b82f6' } },
          { value: Math.abs(balanceGeneral.totalPasivos || 0), name: 'Pasivos', itemStyle: { color: '#ef4444' } },
          { value: Math.abs(balanceGeneral.totalPatrimonio || 0), name: 'Patrimonio', itemStyle: { color: '#22c55e' } }
        ]
      }]
    };
  };

  const getResultadosChartOption = () => {
    if (!estadoResultados) return {};

    return {
      tooltip: { trigger: 'axis' },
      xAxis: { type: 'category', data: ['Ingresos', 'Costos', 'Gastos', 'Utilidad'] },
      yAxis: {
        type: 'value',
        axisLabel: { formatter: (val) => (val / 1000000).toFixed(1) + 'M' }
      },
      series: [{
        type: 'bar',
        data: [
          { value: estadoResultados.totalIngresos || 0, itemStyle: { color: '#22c55e' } },
          { value: estadoResultados.totalCostos || 0, itemStyle: { color: '#f97316' } },
          { value: estadoResultados.totalGastos || 0, itemStyle: { color: '#ef4444' } },
          {
            value: estadoResultados.utilidadNeta || 0,
            itemStyle: { color: (estadoResultados.utilidadNeta || 0) >= 0 ? '#3b82f6' : '#ef4444' }
          }
        ]
      }]
    };
  };

  const IndicadorCard = ({ titulo, valor, formato = 'currency', trend, descripcion }) => {
    const formattedValue = formato === 'percent'
      ? formatPercent(valor)
      : formato === 'ratio'
        ? (valor || 0).toFixed(2)
        : formatCurrency(valor);

    const isPositive = valor > 0;
    const TrendIcon = isPositive ? ArrowUpRight : valor < 0 ? ArrowDownRight : Minus;
    const trendColor = isPositive ? 'text-green-600' : valor < 0 ? 'text-red-600' : 'text-gray-600';

    return (
      <Card>
        <CardContent className="pt-4">
          <div className="flex justify-between items-start">
            <div>
              <div className="text-sm text-muted-foreground">{titulo}</div>
              <div className="text-2xl font-bold mt-1">{formattedValue}</div>
              {descripcion && <div className="text-xs text-muted-foreground mt-1">{descripcion}</div>}
            </div>
            {trend !== undefined && (
              <Badge variant="outline" className={trendColor}>
                <TrendIcon className="h-3 w-3 mr-1" />
                {Math.abs(trend).toFixed(1)}%
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Estados Financieros
              </CardTitle>
              <CardDescription>
                Balance General, Estado de Resultados e Indicadores Financieros
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline">
                <Download className="h-4 w-4 mr-1" />
                Exportar PDF
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filtros */}
          <div className="flex flex-wrap gap-4 items-end">
            <div className="space-y-1">
              <Label className="text-xs">Año</Label>
              <Select
                value={String(filtros.anio)}
                onValueChange={(v) => setFiltros({ ...filtros, anio: parseInt(v) })}
              >
                <SelectTrigger className="w-[100px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[2024, 2025, 2026].map(a => (
                    <SelectItem key={a} value={String(a)}>{a}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Mes</Label>
              <Select
                value={String(filtros.mes)}
                onValueChange={(v) => setFiltros({ ...filtros, mes: parseInt(v) })}
              >
                <SelectTrigger className="w-[130px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MESES.map((m, i) => (
                    <SelectItem key={i + 1} value={String(i + 1)}>{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="comparativo"
                checked={comparativo}
                onCheckedChange={setComparativo}
              />
              <Label htmlFor="comparativo">Comparativo mes anterior</Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs de Estados */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid grid-cols-5 w-full">
          <TabsTrigger value="balance">Balance General</TabsTrigger>
          <TabsTrigger value="resultados">Estado de Resultados</TabsTrigger>
          <TabsTrigger value="flujo">Flujo de Efectivo</TabsTrigger>
          <TabsTrigger value="indicadores">Indicadores</TabsTrigger>
          <TabsTrigger value="comprobacion">Balance Comprobación</TabsTrigger>
        </TabsList>

        {loading ? (
          <Card>
            <CardContent className="pt-6">
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Balance General */}
            <TabsContent value="balance">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle>Balance General</CardTitle>
                    <CardDescription>{MESES[filtros.mes - 1]} {filtros.anio}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Cuenta</TableHead>
                          <TableHead className="text-right">Saldo</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {/* Activos */}
                        <TableRow className="bg-blue-50 font-bold">
                          <TableCell colSpan={2}>ACTIVOS</TableCell>
                        </TableRow>
                        {balanceGeneral?.activos?.map((cuenta, i) => (
                          <TableRow key={i}>
                            <TableCell className="pl-6">{cuenta.nombre}</TableCell>
                            <TableCell className="text-right font-mono">{formatCurrency(cuenta.saldo)}</TableCell>
                          </TableRow>
                        ))}
                        <TableRow className="bg-blue-100 font-bold">
                          <TableCell>Total Activos</TableCell>
                          <TableCell className="text-right">{formatCurrency(balanceGeneral?.totalActivos)}</TableCell>
                        </TableRow>

                        {/* Pasivos */}
                        <TableRow className="bg-red-50 font-bold">
                          <TableCell colSpan={2}>PASIVOS</TableCell>
                        </TableRow>
                        {balanceGeneral?.pasivos?.map((cuenta, i) => (
                          <TableRow key={i}>
                            <TableCell className="pl-6">{cuenta.nombre}</TableCell>
                            <TableCell className="text-right font-mono">{formatCurrency(cuenta.saldo)}</TableCell>
                          </TableRow>
                        ))}
                        <TableRow className="bg-red-100 font-bold">
                          <TableCell>Total Pasivos</TableCell>
                          <TableCell className="text-right">{formatCurrency(balanceGeneral?.totalPasivos)}</TableCell>
                        </TableRow>

                        {/* Patrimonio */}
                        <TableRow className="bg-green-50 font-bold">
                          <TableCell colSpan={2}>PATRIMONIO</TableCell>
                        </TableRow>
                        {balanceGeneral?.patrimonio?.map((cuenta, i) => (
                          <TableRow key={i}>
                            <TableCell className="pl-6">{cuenta.nombre}</TableCell>
                            <TableCell className="text-right font-mono">{formatCurrency(cuenta.saldo)}</TableCell>
                          </TableRow>
                        ))}
                        <TableRow className="bg-green-100 font-bold">
                          <TableCell>Total Patrimonio</TableCell>
                          <TableCell className="text-right">{formatCurrency(balanceGeneral?.totalPatrimonio)}</TableCell>
                        </TableRow>

                        {/* Ecuación Contable */}
                        <TableRow className="bg-gray-200 font-bold text-lg">
                          <TableCell>PASIVO + PATRIMONIO</TableCell>
                          <TableCell className="text-right">
                            {formatCurrency((balanceGeneral?.totalPasivos || 0) + (balanceGeneral?.totalPatrimonio || 0))}
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Composición</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ReactECharts option={getBalanceChartOption()} style={{ height: 300 }} />
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Estado de Resultados */}
            <TabsContent value="resultados">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle>Estado de Resultados</CardTitle>
                    <CardDescription>{MESES[filtros.mes - 1]} {filtros.anio}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableBody>
                        {/* Ingresos */}
                        <TableRow className="bg-green-50 font-bold">
                          <TableCell colSpan={2}>INGRESOS OPERACIONALES</TableCell>
                        </TableRow>
                        {estadoResultados?.ingresos?.map((cuenta, i) => (
                          <TableRow key={i}>
                            <TableCell className="pl-6">{cuenta.nombre}</TableCell>
                            <TableCell className="text-right font-mono text-green-600">
                              {formatCurrency(cuenta.saldo)}
                            </TableCell>
                          </TableRow>
                        ))}
                        <TableRow className="bg-green-100 font-bold">
                          <TableCell>Total Ingresos</TableCell>
                          <TableCell className="text-right text-green-700">
                            {formatCurrency(estadoResultados?.totalIngresos)}
                          </TableCell>
                        </TableRow>

                        {/* Costos */}
                        <TableRow className="bg-orange-50 font-bold">
                          <TableCell colSpan={2}>COSTOS DE OPERACIÓN</TableCell>
                        </TableRow>
                        {estadoResultados?.costos?.map((cuenta, i) => (
                          <TableRow key={i}>
                            <TableCell className="pl-6">{cuenta.nombre}</TableCell>
                            <TableCell className="text-right font-mono text-orange-600">
                              {formatCurrency(cuenta.saldo)}
                            </TableCell>
                          </TableRow>
                        ))}
                        <TableRow className="bg-orange-100 font-bold">
                          <TableCell>Total Costos</TableCell>
                          <TableCell className="text-right text-orange-700">
                            {formatCurrency(estadoResultados?.totalCostos)}
                          </TableCell>
                        </TableRow>

                        {/* Utilidad Bruta */}
                        <TableRow className="font-bold text-lg">
                          <TableCell>UTILIDAD BRUTA</TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(estadoResultados?.utilidadBruta)}
                          </TableCell>
                        </TableRow>

                        {/* Gastos */}
                        <TableRow className="bg-red-50 font-bold">
                          <TableCell colSpan={2}>GASTOS OPERACIONALES</TableCell>
                        </TableRow>
                        {estadoResultados?.gastos?.map((cuenta, i) => (
                          <TableRow key={i}>
                            <TableCell className="pl-6">{cuenta.nombre}</TableCell>
                            <TableCell className="text-right font-mono text-red-600">
                              {formatCurrency(cuenta.saldo)}
                            </TableCell>
                          </TableRow>
                        ))}
                        <TableRow className="bg-red-100 font-bold">
                          <TableCell>Total Gastos</TableCell>
                          <TableCell className="text-right text-red-700">
                            {formatCurrency(estadoResultados?.totalGastos)}
                          </TableCell>
                        </TableRow>

                        {/* Utilidades */}
                        <TableRow className="font-bold text-lg">
                          <TableCell>UTILIDAD OPERACIONAL</TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(estadoResultados?.utilidadOperacional)}
                          </TableCell>
                        </TableRow>

                        <TableRow className="bg-blue-200 font-bold text-xl">
                          <TableCell>UTILIDAD NETA</TableCell>
                          <TableCell className={`text-right ${(estadoResultados?.utilidadNeta || 0) >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                            {formatCurrency(estadoResultados?.utilidadNeta)}
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Composición</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ReactECharts option={getResultadosChartOption()} style={{ height: 300 }} />
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Flujo de Efectivo */}
            <TabsContent value="flujo">
              <Card>
                <CardHeader>
                  <CardTitle>Estado de Flujo de Efectivo</CardTitle>
                  <CardDescription>{MESES[filtros.mes - 1]} {filtros.anio}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <IndicadorCard
                      titulo="Actividades de Operación"
                      valor={flujoEfectivo?.operacion || 0}
                    />
                    <IndicadorCard
                      titulo="Actividades de Inversión"
                      valor={flujoEfectivo?.inversion || 0}
                    />
                    <IndicadorCard
                      titulo="Actividades de Financiación"
                      valor={flujoEfectivo?.financiacion || 0}
                    />
                  </div>

                  <Table>
                    <TableBody>
                      <TableRow>
                        <TableCell className="font-bold">Efectivo al inicio del período</TableCell>
                        <TableCell className="text-right font-mono">
                          {formatCurrency(flujoEfectivo?.efectivoInicial)}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="pl-6">+ Flujo de actividades de operación</TableCell>
                        <TableCell className="text-right font-mono">
                          {formatCurrency(flujoEfectivo?.operacion)}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="pl-6">+ Flujo de actividades de inversión</TableCell>
                        <TableCell className="text-right font-mono">
                          {formatCurrency(flujoEfectivo?.inversion)}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="pl-6">+ Flujo de actividades de financiación</TableCell>
                        <TableCell className="text-right font-mono">
                          {formatCurrency(flujoEfectivo?.financiacion)}
                        </TableCell>
                      </TableRow>
                      <TableRow className="bg-muted font-bold text-lg">
                        <TableCell>Efectivo al final del período</TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(flujoEfectivo?.efectivoFinal)}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Indicadores Financieros */}
            <TabsContent value="indicadores">
              <div className="space-y-4">
                {/* Liquidez */}
                <Card>
                  <CardHeader>
                    <CardTitle>Indicadores de Liquidez</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <IndicadorCard
                        titulo="Razón Corriente"
                        valor={indicadores?.liquidez?.razonCorriente}
                        formato="ratio"
                        descripcion="Activo Corriente / Pasivo Corriente"
                      />
                      <IndicadorCard
                        titulo="Prueba Ácida"
                        valor={indicadores?.liquidez?.pruebaAcida}
                        formato="ratio"
                        descripcion="(AC - Inventarios) / PC"
                      />
                      <IndicadorCard
                        titulo="Capital de Trabajo"
                        valor={indicadores?.liquidez?.capitalTrabajo}
                        descripcion="Activo Corriente - Pasivo Corriente"
                      />
                      <IndicadorCard
                        titulo="Días de Caja"
                        valor={indicadores?.liquidez?.diasCaja}
                        formato="ratio"
                        descripcion="Efectivo / Gastos Diarios"
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Endeudamiento */}
                <Card>
                  <CardHeader>
                    <CardTitle>Indicadores de Endeudamiento</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <IndicadorCard
                        titulo="Nivel de Endeudamiento"
                        valor={indicadores?.endeudamiento?.nivelEndeudamiento}
                        formato="percent"
                        descripcion="Pasivo Total / Activo Total"
                      />
                      <IndicadorCard
                        titulo="Concentración CP"
                        valor={indicadores?.endeudamiento?.concentracionCP}
                        formato="percent"
                        descripcion="Pasivo Corriente / Pasivo Total"
                      />
                      <IndicadorCard
                        titulo="Apalancamiento"
                        valor={indicadores?.endeudamiento?.apalancamiento}
                        formato="ratio"
                        descripcion="Pasivo Total / Patrimonio"
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Rentabilidad */}
                <Card>
                  <CardHeader>
                    <CardTitle>Indicadores de Rentabilidad</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <IndicadorCard
                        titulo="Margen Bruto"
                        valor={indicadores?.rentabilidad?.margenBruto}
                        formato="percent"
                        descripcion="Utilidad Bruta / Ingresos"
                      />
                      <IndicadorCard
                        titulo="Margen Operacional"
                        valor={indicadores?.rentabilidad?.margenOperacional}
                        formato="percent"
                        descripcion="Utilidad Operacional / Ingresos"
                      />
                      <IndicadorCard
                        titulo="Margen Neto"
                        valor={indicadores?.rentabilidad?.margenNeto}
                        formato="percent"
                        descripcion="Utilidad Neta / Ingresos"
                      />
                      <IndicadorCard
                        titulo="ROE"
                        valor={indicadores?.rentabilidad?.roe}
                        formato="percent"
                        descripcion="Utilidad Neta / Patrimonio"
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Balance de Comprobación */}
            <TabsContent value="comprobacion">
              <Card>
                <CardHeader>
                  <CardTitle>Balance de Comprobación</CardTitle>
                  <CardDescription>{MESES[filtros.mes - 1]} {filtros.anio}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Código</TableHead>
                        <TableHead>Cuenta</TableHead>
                        <TableHead className="text-right">Saldo Anterior</TableHead>
                        <TableHead className="text-right">Débitos</TableHead>
                        <TableHead className="text-right">Créditos</TableHead>
                        <TableHead className="text-right">Saldo Final</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {balanceComprobacion?.cuentas?.map((cuenta, i) => (
                        <TableRow key={i} className={cuenta.nivel === 1 ? 'bg-muted font-bold' : ''}>
                          <TableCell className="font-mono">{cuenta.codigo}</TableCell>
                          <TableCell>{cuenta.nombre}</TableCell>
                          <TableCell className="text-right font-mono">
                            {formatCurrency(cuenta.saldoAnterior)}
                          </TableCell>
                          <TableCell className="text-right font-mono text-blue-600">
                            {formatCurrency(cuenta.debitos)}
                          </TableCell>
                          <TableCell className="text-right font-mono text-red-600">
                            {formatCurrency(cuenta.creditos)}
                          </TableCell>
                          <TableCell className="text-right font-mono font-bold">
                            {formatCurrency(cuenta.saldoFinal)}
                          </TableCell>
                        </TableRow>
                      ))}
                      <TableRow className="bg-gray-200 font-bold text-lg">
                        <TableCell colSpan={2}>TOTALES</TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(balanceComprobacion?.totales?.saldoAnterior)}
                        </TableCell>
                        <TableCell className="text-right text-blue-700">
                          {formatCurrency(balanceComprobacion?.totales?.debitos)}
                        </TableCell>
                        <TableCell className="text-right text-red-700">
                          {formatCurrency(balanceComprobacion?.totales?.creditos)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(balanceComprobacion?.totales?.saldoFinal)}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
          </>
        )}
      </Tabs>
    </div>
  );
}
