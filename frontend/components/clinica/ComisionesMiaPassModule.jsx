'use client';

import { useState, useEffect } from 'react';
import {
  TrendingUp, Users, DollarSign, Award,
  Calendar, CheckCircle2, AlertCircle, FileText,
  ChevronRight, Network, ArrowUpRight, BarChart3,
  Loader2, CreditCard, Clock, BanknoteIcon
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table, TableBody, TableCell, TableHead,
  TableHeader, TableRow
} from '@/components/ui/table';
import { miaPassService } from '@/services/miaPass.service';
import { useToast } from '@/hooks/use-toast';

export default function ComisionesMiaPassModule({ user }) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [estadoVendedor, setEstadoVendedor] = useState(null);
  const [misComisiones, setMisComisiones] = useState(null);
  const [historialPagos, setHistorialPagos] = useState([]);
  const [estructuraRed, setEstructuraRed] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [estado, comisiones, historial, red] = await Promise.all([
        miaPassService.getMiEstadoVendedor(),
        miaPassService.getMisComisiones(),
        miaPassService.getHistorialPagos().catch(() => ({ data: [] })),
        miaPassService.getMiRed().catch(() => ({ data: null }))
      ]);
      setEstadoVendedor(estado.data);
      setMisComisiones(comisiones.data);
      setHistorialPagos(historial.data?.cortes || []);
      setEstructuraRed(red.data);
    } catch (error) {
      console.error('Error loading data:', error);
      toast({ title: 'Error', description: 'No se pudieron cargar los datos de comisiones.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (val) => new Intl.NumberFormat('es-CO', {
    style: 'currency', currency: 'COP', minimumFractionDigits: 0
  }).format(val);

  if (loading) return <div className="p-8 text-center">Cargando tablero comercial...</div>;

  return (
    <div className="space-y-6 p-2">
      {/* Header Con Contexto de Vendedor */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Award className="w-8 h-8 text-amber-500" /> Mi Gestión Comercial
          </h1>
          <div className="text-gray-500 mt-1 text-sm">
            Código: <span className="font-mono font-bold">{estadoVendedor?.vendedor?.vendedorCodigo || 'No asignado'}</span> ·
            Tipo: <Badge variant="outline" className="ml-2">{estadoVendedor?.vendedor?.vendedorTipo}</Badge>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadData}>Actualizar</Button>
          <Button className="bg-blue-600 hover:bg-blue-700">Ver Políticas 2026</Button>
        </div>
      </div>

      {/* Resumen de Comisiones */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white border-none shadow-lg">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-blue-100 text-sm font-medium uppercase tracking-wider">Saldo por Cobrar</p>
                <h3 className="text-3xl font-black mt-1">{formatCurrency(misComisiones?.stats?.saldoPendiente)}</h3>
              </div>
              <div className="bg-white/20 p-2 rounded-lg">
                <DollarSign className="w-6 h-6" />
              </div>
            </div>
            <p className="text-xs text-blue-200 mt-4 font-medium italic">Pendiente de cierre de corte</p>
          </CardContent>
        </Card>

        <Card className="shadow-md border-none">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-gray-500 text-sm font-medium uppercase tracking-wider">Total Pagado</p>
                <h3 className="text-3xl font-black text-gray-900 mt-1">{formatCurrency(misComisiones?.stats?.totalPagado)}</h3>
              </div>
              <div className="bg-green-50 p-2 rounded-lg text-green-600">
                <CheckCircle2 className="w-6 h-6" />
              </div>
            </div>
            <div className="flex items-center gap-1 mt-4 text-xs font-bold text-gray-400">
              <BarChart3 className="w-3 h-3" />
              <span>Histórico acumulado</span>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-md border-none overflow-hidden relative">
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-gray-500 text-sm font-medium uppercase tracking-wider">Meta del Mes</p>
                <h3 className="text-3xl font-black text-gray-900 mt-1">{estadoVendedor?.ventasMes} / 30</h3>
              </div>
              <div className="bg-amber-50 p-2 rounded-lg text-amber-600">
                <TrendingUp className="w-6 h-6" />
              </div>
            </div>
            <Progress value={(estadoVendedor?.ventasMes / 30) * 100} className="h-2" />
            <p className="text-[10px] text-gray-400 mt-2 font-bold uppercase">
              {estadoVendedor?.ventasMes >= 30 ? '¡Meta alcanzada! Estás al 30%' : `Faltan ${30 - estadoVendedor?.ventasMes} para llegar al 30%`}
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="ventas" className="w-full">
        <TabsList className="bg-white border p-1 shadow-sm rounded-xl">
          <TabsTrigger value="ventas" className="px-6">Mis Ventas</TabsTrigger>
          <TabsTrigger value="red" className="px-6">Mi Red de Referidos</TabsTrigger>
          <TabsTrigger value="historial" className="px-6">Historial Pagos</TabsTrigger>
        </TabsList>

        <TabsContent value="ventas" className="mt-6">
          <Card className="border-none shadow-sm overflow-hidden">
            <Table>
              <TableHeader className="bg-gray-50">
                <TableRow>
                  <TableHead className="font-bold">Fecha</TableHead>
                  <TableHead className="font-bold">Paciente</TableHead>
                  <TableHead className="font-bold">Canal</TableHead>
                  <TableHead className="font-bold">Total Venta</TableHead>
                  <TableHead className="font-bold">Mi Comisión</TableHead>
                  <TableHead className="font-bold text-center">Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="bg-white">
                {misComisiones?.comisiones
                  ?.filter(c => c.rolBeneficiario === 'VENDEDOR')
                  .map(com => (
                  <TableRow key={com.id}>
                    <TableCell className="text-xs text-gray-500">
                      {new Date(com.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="font-medium">
                      {com.suscripcion?.paciente?.nombre} {com.suscripcion?.paciente?.apellido}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[10px]">{com.suscripcion?.canal}</Badge>
                    </TableCell>
                    <TableCell className="text-xs text-gray-500">
                      {formatCurrency(com.suscripcion?.precioPagado)}
                    </TableCell>
                    <TableCell className="font-bold text-blue-700">
                      {formatCurrency(com.valor)}
                      <span className="text-[10px] text-gray-400 ml-1 font-normal">({com.porcentaje * 100}%)</span>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge className={com.estado === 'PENDIENTE' ? 'bg-yellow-50 text-yellow-700' : 'bg-green-50 text-green-700'}>
                        {com.estado}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
                {(!misComisiones?.comisiones || misComisiones?.comisiones.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={6} className="h-32 text-center text-gray-400">
                      Aún no tienes ventas registradas este mes.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="red" className="mt-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Resumen Multinivel */}
            <Card className="border-none shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Network className="w-5 h-5 text-indigo-600" /> Estructura de Referidos
                </CardTitle>
                <CardDescription>Ganancias por la gestión comercial de tu red</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center p-4 bg-indigo-50 rounded-xl">
                  <div>
                    <p className="text-sm font-bold text-indigo-900">Nivel 1 (Directos)</p>
                    <p className="text-xs text-indigo-600">Reconocimiento: $10,000 por venta</p>
                  </div>
                  <div className="text-right">
                    <Badge className="bg-indigo-600 text-white text-lg px-3">
                      {estructuraRed?.nivel1?.cantidad || estadoVendedor?.vendedor?._count?.referidos || 0} hijos
                    </Badge>
                    {estructuraRed?.nivel1?.ventas > 0 && (
                      <p className="text-[10px] text-indigo-500 mt-1">{estructuraRed.nivel1.ventas} ventas activas</p>
                    )}
                  </div>
                </div>
                <div className="flex justify-between items-center p-4 bg-purple-50 rounded-xl">
                  <div>
                    <p className="text-sm font-bold text-purple-900">Nivel 2 (Indirectos)</p>
                    <p className="text-xs text-purple-600">Reconocimiento: $5,000 por venta</p>
                  </div>
                  <div className="text-right">
                    <Badge className="bg-purple-600 text-white text-lg px-3">
                      {estructuraRed?.nivel2?.cantidad || 0} nietos
                    </Badge>
                    {estructuraRed?.nivel2?.ventas > 0 && (
                      <p className="text-[10px] text-purple-500 mt-1">{estructuraRed.nivel2.ventas} ventas activas</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Comisiones por Red</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Vendedor</TableHead>
                      <TableHead>Nivel</TableHead>
                      <TableHead className="text-right">Valor</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {misComisiones?.comisiones
                      .filter(c => c.rolBeneficiario.startsWith('REFERIDOR'))
                      .map(com => (
                      <TableRow key={com.id}>
                        <TableCell className="text-xs font-medium">Venta en tu red</TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="text-[10px]">
                            {com.rolBeneficiario === 'REFERIDOR_N1' ? 'Hijo (N1)' : 'Nieto (N2)'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-bold text-indigo-600">
                          {formatCurrency(com.valor)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="historial" className="mt-6">
          <Card className="border-none shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <BanknoteIcon className="w-5 h-5 text-green-600" /> Historial de Pagos de Comisiones
              </CardTitle>
              <CardDescription>Cortes de comisiones y pagos realizados</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader className="bg-gray-50">
                  <TableRow>
                    <TableHead className="font-bold">Período</TableHead>
                    <TableHead className="font-bold">Total Comisiones</TableHead>
                    <TableHead className="font-bold text-center">Estado</TableHead>
                    <TableHead className="font-bold">Fecha Pago</TableHead>
                    <TableHead className="font-bold">Método</TableHead>
                    <TableHead className="font-bold text-center">Detalles</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="bg-white">
                  {historialPagos.length > 0 ? (
                    historialPagos.map(pago => (
                      <TableRow key={pago.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            {pago.periodo}
                          </div>
                        </TableCell>
                        <TableCell className="font-bold text-green-700">
                          {formatCurrency(pago.totalComisiones)}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge className={
                            pago.estado === 'PAGADO'
                              ? 'bg-green-50 text-green-700'
                              : pago.estado === 'PENDIENTE'
                                ? 'bg-yellow-50 text-yellow-700'
                                : 'bg-gray-50 text-gray-700'
                          }>
                            {pago.estado === 'PAGADO' && <CheckCircle2 className="w-3 h-3 mr-1" />}
                            {pago.estado === 'PENDIENTE' && <Clock className="w-3 h-3 mr-1" />}
                            {pago.estado}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-gray-600">
                          {pago.fechaPago
                            ? new Date(pago.fechaPago).toLocaleDateString('es-CO', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric'
                              ,
      timeZone: 'America/Bogota'
    })
                            : '-'
                          }
                        </TableCell>
                        <TableCell>
                          {pago.metodoPago ? (
                            <div className="flex items-center gap-1 text-sm">
                              <CreditCard className="w-3 h-3 text-gray-400" />
                              {pago.metodoPago}
                            </div>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          <Button variant="ghost" size="sm" className="text-xs">
                            <FileText className="w-3 h-3 mr-1" />
                            Ver
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="h-32 text-center text-gray-400">
                        <div className="flex flex-col items-center gap-2">
                          <BanknoteIcon className="w-8 h-8 text-gray-300" />
                          <p>Aún no tienes cortes de comisiones registrados.</p>
                          <p className="text-xs">Los cortes se generan mensualmente.</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>

              {/* Resumen de pagos */}
              {historialPagos.length > 0 && (
                <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-green-50 rounded-xl">
                    <p className="text-xs text-green-600 font-medium uppercase">Total Pagado</p>
                    <p className="text-xl font-bold text-green-900">
                      {formatCurrency(
                        historialPagos
                          .filter(p => p.estado === 'PAGADO')
                          .reduce((sum, p) => sum + (p.totalComisiones || 0), 0)
                      )}
                    </p>
                  </div>
                  <div className="p-4 bg-yellow-50 rounded-xl">
                    <p className="text-xs text-yellow-600 font-medium uppercase">Pendiente por Pagar</p>
                    <p className="text-xl font-bold text-yellow-900">
                      {formatCurrency(
                        historialPagos
                          .filter(p => p.estado === 'PENDIENTE')
                          .reduce((sum, p) => sum + (p.totalComisiones || 0), 0)
                      )}
                    </p>
                  </div>
                  <div className="p-4 bg-blue-50 rounded-xl">
                    <p className="text-xs text-blue-600 font-medium uppercase">Total Cortes</p>
                    <p className="text-xl font-bold text-blue-900">{historialPagos.length}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
