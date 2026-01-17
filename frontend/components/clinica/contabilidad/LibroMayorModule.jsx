'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Calculator, RefreshCw, Eye, ArrowUp, ArrowDown, Loader2, Search
} from 'lucide-react';
import { toast } from 'sonner';
import { apiGet, apiPost } from '@/services/api';
import ReactECharts from 'echarts-for-react';

const formatCurrency = (value) => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0
  }).format(value || 0);
};

const formatDate = (dateStr) => {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('es-CO', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  ,
      timeZone: 'America/Bogota'
    });
};

const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

export default function LibroMayorModule() {
  const [libroMayor, setLibroMayor] = useState({ registros: [], totales: {} });
  const [movimientos, setMovimientos] = useState(null);
  const [comparativo, setComparativo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedCuenta, setSelectedCuenta] = useState(null);

  const currentDate = new Date();
  const [filtros, setFiltros] = useState({
    anio: currentDate.getFullYear(),
    mes: currentDate.getMonth() + 1,
    cuentaTipo: 'all',
    cuentaCodigo: ''
  });

  useEffect(() => {
    fetchLibroMayor();
  }, [filtros.anio, filtros.mes, filtros.cuentaTipo]);

  const fetchLibroMayor = async () => {
    try {
      setLoading(true);
      const params = {
        anio: filtros.anio,
        mes: filtros.mes
      };
      if (filtros.cuentaTipo !== 'all') params.cuentaTipo = filtros.cuentaTipo;
      if (filtros.cuentaCodigo) params.cuentaCodigo = filtros.cuentaCodigo;

      const response = await apiGet('/contabilidad/libro-mayor', params);
      setLibroMayor(response.data || { registros: [], totales: {} });
    } catch (error) {
      toast.error('Error cargando libro mayor: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerMovimientos = async (cuenta) => {
    try {
      setSelectedCuenta(cuenta);
      setViewDialogOpen(true);

      const [movResponse, compResponse] = await Promise.all([
        apiGet(`/contabilidad/libro-mayor/cuenta/${cuenta.cuentaCodigo}/movimientos`, {
          anio: filtros.anio,
          mes: filtros.mes
        }),
        apiGet(`/contabilidad/libro-mayor/cuenta/${cuenta.cuentaCodigo}/comparativo`, {
          anio: filtros.anio
        })
      ]);

      setMovimientos(movResponse.data);
      setComparativo(compResponse.data);
    } catch (error) {
      toast.error('Error cargando detalle: ' + error.message);
    }
  };

  const handleRecalcular = async () => {
    try {
      await apiPost('/contabilidad/libro-mayor/recalcular', {
        anio: filtros.anio,
        mes: filtros.mes
      });
      toast.success('Libro mayor recalculado');
      fetchLibroMayor();
    } catch (error) {
      toast.error('Error recalculando: ' + error.message);
    }
  };

  const getTipoBadgeColor = (tipo) => {
    const colors = {
      'Activo': 'bg-blue-100 text-blue-800',
      'Pasivo': 'bg-red-100 text-red-800',
      'Patrimonio': 'bg-purple-100 text-purple-800',
      'Ingreso': 'bg-green-100 text-green-800',
      'Gasto': 'bg-orange-100 text-orange-800',
      'Costo': 'bg-yellow-100 text-yellow-800'
    };
    return colors[tipo] || 'bg-gray-100 text-gray-800';
  };

  const getComparativoChartOptions = () => {
    if (!comparativo?.meses) return {};

    return {
      tooltip: { trigger: 'axis' },
      legend: { data: ['Débitos', 'Créditos', 'Saldo'] },
      xAxis: {
        type: 'category',
        data: MESES.map(m => m.substring(0, 3))
      },
      yAxis: {
        type: 'value',
        axisLabel: {
          formatter: (val) => (val / 1000000).toFixed(1) + 'M'
        }
      },
      series: [
        {
          name: 'Débitos',
          type: 'bar',
          data: comparativo.meses.map(m => m.debitos),
          itemStyle: { color: '#3b82f6' }
        },
        {
          name: 'Créditos',
          type: 'bar',
          data: comparativo.meses.map(m => m.creditos),
          itemStyle: { color: '#ef4444' }
        },
        {
          name: 'Saldo',
          type: 'line',
          data: comparativo.meses.map(m => m.saldoFinal),
          itemStyle: { color: '#22c55e' }
        }
      ]
    };
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                Libro Mayor
              </CardTitle>
              <CardDescription>
                Consulta de saldos y movimientos por cuenta contable
              </CardDescription>
            </div>
            <Button variant="outline" onClick={handleRecalcular}>
              <RefreshCw className="h-4 w-4 mr-1" />
              Recalcular
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filtros */}
          <div className="flex flex-wrap gap-4 mb-4">
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
            <div className="space-y-1">
              <Label className="text-xs">Tipo de Cuenta</Label>
              <Select
                value={filtros.cuentaTipo}
                onValueChange={(v) => setFiltros({ ...filtros, cuentaTipo: v })}
              >
                <SelectTrigger className="w-[130px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="Activo">Activo</SelectItem>
                  <SelectItem value="Pasivo">Pasivo</SelectItem>
                  <SelectItem value="Patrimonio">Patrimonio</SelectItem>
                  <SelectItem value="Ingreso">Ingreso</SelectItem>
                  <SelectItem value="Gasto">Gasto</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1 flex-1 min-w-[200px]">
              <Label className="text-xs">Buscar Cuenta</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Código o nombre..."
                  value={filtros.cuentaCodigo}
                  onChange={(e) => setFiltros({ ...filtros, cuentaCodigo: e.target.value })}
                />
                <Button onClick={fetchLibroMayor}>
                  <Search className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Resumen de totales */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
            <Card className="bg-muted/50">
              <CardContent className="pt-4">
                <div className="text-sm text-muted-foreground">Saldo Inicial</div>
                <div className="text-xl font-bold">
                  {formatCurrency(libroMayor.totales?.saldoInicial)}
                </div>
              </CardContent>
            </Card>
            <Card className="bg-blue-50">
              <CardContent className="pt-4">
                <div className="text-sm text-blue-600">Total Débitos</div>
                <div className="text-xl font-bold text-blue-700">
                  {formatCurrency(libroMayor.totales?.debitos)}
                </div>
              </CardContent>
            </Card>
            <Card className="bg-red-50">
              <CardContent className="pt-4">
                <div className="text-sm text-red-600">Total Créditos</div>
                <div className="text-xl font-bold text-red-700">
                  {formatCurrency(libroMayor.totales?.creditos)}
                </div>
              </CardContent>
            </Card>
            <Card className="bg-green-50">
              <CardContent className="pt-4">
                <div className="text-sm text-green-600">Saldo Final</div>
                <div className="text-xl font-bold text-green-700">
                  {formatCurrency(libroMayor.totales?.saldoFinal)}
                </div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      {/* Tabla de cuentas */}
      <Card>
        <CardContent className="pt-6">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>Cuenta</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead className="text-right">Saldo Inicial</TableHead>
                  <TableHead className="text-right">Débitos</TableHead>
                  <TableHead className="text-right">Créditos</TableHead>
                  <TableHead className="text-right">Saldo Final</TableHead>
                  <TableHead className="text-center">Mov.</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {libroMayor.registros?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8">
                      No hay registros para el período seleccionado
                    </TableCell>
                  </TableRow>
                ) : (
                  libroMayor.registros?.map((reg) => (
                    <TableRow key={reg.id}>
                      <TableCell className="font-mono">{reg.cuentaCodigo}</TableCell>
                      <TableCell>{reg.cuentaNombre}</TableCell>
                      <TableCell>
                        <Badge className={getTipoBadgeColor(reg.cuentaTipo)}>
                          {reg.cuentaTipo}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {formatCurrency(reg.saldoInicial)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-blue-600">
                        {formatCurrency(reg.debitos)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-red-600">
                        {formatCurrency(reg.creditos)}
                      </TableCell>
                      <TableCell className="text-right font-mono font-bold">
                        {formatCurrency(reg.saldoFinal)}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline">{reg.numMovimientos}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleVerMovimientos(reg)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Dialog Detalle de Cuenta */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedCuenta?.cuentaCodigo} - {selectedCuenta?.cuentaNombre}
            </DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="movimientos" className="mt-4">
            <TabsList>
              <TabsTrigger value="movimientos">Movimientos</TabsTrigger>
              <TabsTrigger value="comparativo">Comparativo Anual</TabsTrigger>
            </TabsList>

            <TabsContent value="movimientos" className="mt-4">
              {movimientos ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <Card>
                      <CardContent className="pt-4 text-center">
                        <div className="text-sm text-muted-foreground">Saldo Inicial</div>
                        <div className="text-lg font-bold">{formatCurrency(movimientos.saldoInicial)}</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-4 text-center">
                        <div className="text-sm text-muted-foreground">Movimientos</div>
                        <div className="text-lg font-bold">{movimientos.movimientos?.length || 0}</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-4 text-center">
                        <div className="text-sm text-muted-foreground">Saldo Final</div>
                        <div className="text-lg font-bold">{formatCurrency(movimientos.saldoFinal)}</div>
                      </CardContent>
                    </Card>
                  </div>

                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Asiento</TableHead>
                        <TableHead>Descripción</TableHead>
                        <TableHead className="text-right">Débito</TableHead>
                        <TableHead className="text-right">Crédito</TableHead>
                        <TableHead className="text-right">Saldo</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {movimientos.movimientos?.map((mov, i) => (
                        <TableRow key={i}>
                          <TableCell>{formatDate(mov.asiento?.fecha)}</TableCell>
                          <TableCell className="font-mono">{mov.asiento?.numero}</TableCell>
                          <TableCell>{mov.descripcion || mov.asiento?.descripcion}</TableCell>
                          <TableCell className="text-right text-blue-600">
                            {mov.debito > 0 ? formatCurrency(mov.debito) : '-'}
                          </TableCell>
                          <TableCell className="text-right text-red-600">
                            {mov.credito > 0 ? formatCurrency(mov.credito) : '-'}
                          </TableCell>
                          <TableCell className="text-right font-bold">
                            {formatCurrency(mov.saldoCorrido)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              )}
            </TabsContent>

            <TabsContent value="comparativo" className="mt-4">
              {comparativo ? (
                <div className="space-y-4">
                  <ReactECharts
                    option={getComparativoChartOptions()}
                    style={{ height: 300 }}
                  />

                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Mes</TableHead>
                        <TableHead className="text-right">Saldo Inicial</TableHead>
                        <TableHead className="text-right">Débitos</TableHead>
                        <TableHead className="text-right">Créditos</TableHead>
                        <TableHead className="text-right">Saldo Final</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {comparativo.meses?.map((mes, i) => (
                        <TableRow key={i} className={mes.mes === filtros.mes ? 'bg-muted/50' : ''}>
                          <TableCell>{MESES[mes.mes - 1]}</TableCell>
                          <TableCell className="text-right">{formatCurrency(mes.saldoInicial)}</TableCell>
                          <TableCell className="text-right text-blue-600">{formatCurrency(mes.debitos)}</TableCell>
                          <TableCell className="text-right text-red-600">{formatCurrency(mes.creditos)}</TableCell>
                          <TableCell className="text-right font-bold">{formatCurrency(mes.saldoFinal)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              )}
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </div>
  );
}
