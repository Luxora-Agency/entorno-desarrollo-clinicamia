'use client';

import { useState, useEffect } from 'react';
import {
  Wallet, Banknote, History, ArrowUpCircle,
  ArrowDownCircle, Calculator, CheckCircle2,
  AlertTriangle, Receipt, CreditCard, QrCode,
  Clock, DollarSign, Eye, Loader2, X, Users,
  Building2, TrendingUp, BarChart3, ChevronRight
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { useDrogueria } from '@/hooks/useDrogueria';
import { formatDateLong } from '@/lib/dateUtils';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import {
  Tabs, TabsContent, TabsList, TabsTrigger
} from '@/components/ui/tabs';

// Roles que pueden ver todas las cajas
const ADMIN_ROLES = ['SUPER_ADMIN', 'ADMIN'];

export default function CajaManager({ user }) {
  const {
    cajaActiva, fetchCajaActiva, abrirCaja, cerrarCaja,
    cajaDetalle, fetchCajaDetalle, historialCajas, fetchHistorialCajas,
    cajasAbiertas, fetchCajasAbiertas,
    loading
  } = useDrogueria();

  const [montoInicial, setMontoInicial] = useState('100000');
  const [nombreCaja, setNombreCaja] = useState('Caja Principal');
  const [montoFinal, setMontoFinal] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showCierreResumen, setShowCierreResumen] = useState(null);
  const [showHistorial, setShowHistorial] = useState(false);
  const [selectedCajaDetalle, setSelectedCajaDetalle] = useState(null);
  const [loadingDetalle, setLoadingDetalle] = useState(false);

  const isAdmin = ADMIN_ROLES.includes(user?.role);

  useEffect(() => {
    fetchCajaActiva();
    fetchHistorialCajas({ limit: 20 });
    if (isAdmin) {
      fetchCajasAbiertas();
    }
  }, [fetchCajaActiva, fetchHistorialCajas, fetchCajasAbiertas, isAdmin]);

  useEffect(() => {
    if (cajaActiva) {
      fetchCajaDetalle(cajaActiva.id);
    }
  }, [cajaActiva, fetchCajaDetalle]);

  const handleVerDetalleCaja = async (caja) => {
    setLoadingDetalle(true);
    try {
      const detalle = await fetchCajaDetalle(caja.id);
      setSelectedCajaDetalle({ ...caja, detalle });
    } finally {
      setLoadingDetalle(false);
    }
  };

  const handleAbrir = async () => {
    try {
      await abrirCaja(parseFloat(montoInicial), nombreCaja);
      setMontoInicial('100000');
      if (isAdmin) fetchCajasAbiertas();
    } catch (err) {}
  };

  const handleCerrar = async () => {
    if (!montoFinal) return;
    try {
      const resultado = await cerrarCaja(parseFloat(montoFinal), observaciones);
      setShowConfirmation(false);
      setMontoFinal('');
      setObservaciones('');
      if (resultado) {
        setShowCierreResumen(resultado);
      }
      fetchHistorialCajas({ limit: 20 });
      if (isAdmin) fetchCajasAbiertas();
    } catch (err) {}
  };

  const formatCurrency = (val) => new Intl.NumberFormat('es-CO', {
    style: 'currency', currency: 'COP', minimumFractionDigits: 0
  }).format(val || 0);

  // Estadísticas de la caja activa del usuario
  const stats = cajaDetalle?.estadisticas || {
    cantidadVentas: 0,
    totalEfectivo: 0,
    totalTarjeta: 0,
    totalTransferencia: 0,
    totalGeneral: 0,
    efectivoEnCaja: cajaActiva?.montoInicial || 0
  };

  // Calcular totales consolidados de todas las cajas (para admin)
  const totalesConsolidados = cajasAbiertas.reduce((acc, caja) => {
    return {
      cantidadCajas: acc.cantidadCajas + 1,
      totalVentas: acc.totalVentas + (caja._count?.ventas || 0),
      montoInicial: acc.montoInicial + (caja.montoInicial || 0)
    };
  }, { cantidadCajas: 0, totalVentas: 0, montoInicial: 0 });

  if (loading && !cajaActiva && !cajaDetalle) {
    return (
      <div className="p-12 text-center text-gray-400 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin mr-3" />
        Cargando información de caja...
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Gestión de Caja</h2>
          {isAdmin && (
            <p className="text-sm text-gray-500">Vista de administrador - Todas las cajas</p>
          )}
        </div>
        <Button variant="outline" onClick={() => setShowHistorial(true)}>
          <History className="w-4 h-4 mr-2" /> Ver Historial de Cierres
        </Button>
      </div>

      {/* Vista de Admin: Tabs para consolidado vs individual */}
      {isAdmin ? (
        <Tabs defaultValue="consolidado" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="consolidado" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" /> Consolidado
            </TabsTrigger>
            <TabsTrigger value="individual" className="flex items-center gap-2">
              <Wallet className="w-4 h-4" /> Mi Caja
            </TabsTrigger>
          </TabsList>

          {/* Tab: Vista Consolidada (Admin) */}
          <TabsContent value="consolidado" className="space-y-6">
            {/* KPIs Consolidados */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-2">
                    <Building2 className="w-6 h-6 opacity-80" />
                    <span className="text-indigo-100 text-sm font-medium">Cajas Abiertas</span>
                  </div>
                  <p className="text-4xl font-black">{totalesConsolidados.cantidadCajas}</p>
                  <p className="text-indigo-100 text-xs mt-1">En operación ahora</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-2">
                    <Banknote className="w-6 h-6 opacity-80" />
                    <span className="text-green-100 text-sm font-medium">Base Total</span>
                  </div>
                  <p className="text-3xl font-black">{formatCurrency(totalesConsolidados.montoInicial)}</p>
                  <p className="text-green-100 text-xs mt-1">Monto inicial combinado</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-blue-500 to-cyan-600 text-white shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-2">
                    <Receipt className="w-6 h-6 opacity-80" />
                    <span className="text-blue-100 text-sm font-medium">Ventas Totales</span>
                  </div>
                  <p className="text-4xl font-black">{totalesConsolidados.totalVentas}</p>
                  <p className="text-blue-100 text-xs mt-1">Transacciones hoy</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-2">
                    <TrendingUp className="w-6 h-6 opacity-80" />
                    <span className="text-amber-100 text-sm font-medium">Estado</span>
                  </div>
                  <p className="text-2xl font-black">
                    {totalesConsolidados.cantidadCajas > 0 ? 'Operando' : 'Sin Cajas'}
                  </p>
                  <p className="text-amber-100 text-xs mt-1">
                    {totalesConsolidados.cantidadCajas > 0 ? 'Sistema activo' : 'Abra una caja'}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Lista de Cajas Abiertas */}
            <Card className="shadow-lg border-none">
              <CardHeader className="bg-gradient-to-r from-gray-700 to-gray-900 rounded-t-xl py-4">
                <CardTitle className="text-white flex items-center gap-2">
                  <Users className="w-5 h-5" /> Cajas Abiertas en Tiempo Real
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {cajasAbiertas.length === 0 ? (
                  <div className="p-12 text-center text-gray-400">
                    <Wallet className="w-12 h-12 mx-auto mb-4 opacity-30" />
                    <p className="text-lg font-medium">No hay cajas abiertas</p>
                    <p className="text-sm">Los cajeros deben abrir sus cajas para comenzar a vender</p>
                  </div>
                ) : (
                  <div className="divide-y">
                    {cajasAbiertas.map(caja => (
                      <div
                        key={caja.id}
                        className="p-4 hover:bg-gray-50 cursor-pointer transition-colors flex items-center justify-between"
                        onClick={() => handleVerDetalleCaja(caja)}
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                            <Wallet className="w-6 h-6 text-green-600" />
                          </div>
                          <div>
                            <p className="font-bold text-gray-900">{caja.nombre}</p>
                            <p className="text-sm text-gray-500">
                              {caja.usuario?.nombre} {caja.usuario?.apellido}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-6">
                          <div className="text-right">
                            <p className="text-xs text-gray-400">Apertura</p>
                            <p className="font-medium text-gray-700">
                              {new Date(caja.fechaApertura).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-gray-400">Base</p>
                            <p className="font-bold text-green-600">{formatCurrency(caja.montoInicial)}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-gray-400">Ventas</p>
                            <Badge variant="secondary" className="text-sm">
                              {caja._count?.ventas || 0}
                            </Badge>
                          </div>
                          <ChevronRight className="w-5 h-5 text-gray-400" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Mi Caja (Vista individual para admin también) */}
          <TabsContent value="individual">
            {renderMiCaja()}
          </TabsContent>
        </Tabs>
      ) : (
        // Vista normal para usuarios no admin
        renderMiCaja()
      )}

      {/* Modal de detalle de caja específica (para admin) */}
      <Dialog open={!!selectedCajaDetalle} onOpenChange={() => setSelectedCajaDetalle(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wallet className="w-5 h-5 text-blue-600" />
              Detalle: {selectedCajaDetalle?.nombre}
            </DialogTitle>
          </DialogHeader>
          {loadingDetalle ? (
            <div className="p-12 text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto" />
            </div>
          ) : selectedCajaDetalle?.detalle && (
            <div className="space-y-6">
              {/* Info de la caja */}
              <div className="grid grid-cols-4 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-xs text-gray-400 uppercase font-bold">Responsable</p>
                  <p className="font-semibold text-gray-900">
                    {selectedCajaDetalle.usuario?.nombre} {selectedCajaDetalle.usuario?.apellido}
                  </p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-xs text-gray-400 uppercase font-bold">Apertura</p>
                  <p className="font-semibold text-gray-900">
                    {new Date(selectedCajaDetalle.fechaApertura).toLocaleTimeString('es-CO')}
                  </p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-xs text-gray-400 uppercase font-bold">Base Inicial</p>
                  <p className="font-bold text-green-600">{formatCurrency(selectedCajaDetalle.montoInicial)}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-xs text-gray-400 uppercase font-bold">Efectivo Esperado</p>
                  <p className="font-bold text-blue-600 text-xl">
                    {formatCurrency(selectedCajaDetalle.detalle?.estadisticas?.efectivoEnCaja)}
                  </p>
                </div>
              </div>

              {/* KPIs por método de pago */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Banknote className="w-5 h-5 text-green-600" />
                    <span className="text-sm font-medium text-green-700">Efectivo</span>
                  </div>
                  <p className="text-2xl font-black text-green-700">
                    {formatCurrency(selectedCajaDetalle.detalle?.estadisticas?.totalEfectivo)}
                  </p>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <div className="flex items-center gap-2 mb-2">
                    <CreditCard className="w-5 h-5 text-blue-600" />
                    <span className="text-sm font-medium text-blue-700">Tarjeta</span>
                  </div>
                  <p className="text-2xl font-black text-blue-700">
                    {formatCurrency(selectedCajaDetalle.detalle?.estadisticas?.totalTarjeta)}
                  </p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                  <div className="flex items-center gap-2 mb-2">
                    <QrCode className="w-5 h-5 text-purple-600" />
                    <span className="text-sm font-medium text-purple-700">Transferencia</span>
                  </div>
                  <p className="text-2xl font-black text-purple-700">
                    {formatCurrency(selectedCajaDetalle.detalle?.estadisticas?.totalTransferencia)}
                  </p>
                </div>
              </div>

              {/* Tabla de ventas */}
              <div className="border rounded-lg overflow-hidden">
                <div className="bg-gray-50 px-4 py-2 border-b">
                  <h4 className="font-bold text-sm text-gray-700">
                    Ventas ({selectedCajaDetalle.detalle?.ventas?.length || 0})
                  </h4>
                </div>
                <div className="max-h-[300px] overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50">
                        <TableHead className="text-xs">Factura</TableHead>
                        <TableHead className="text-xs">Hora</TableHead>
                        <TableHead className="text-xs">Cliente</TableHead>
                        <TableHead className="text-xs text-center">Método</TableHead>
                        <TableHead className="text-xs text-right">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(selectedCajaDetalle.detalle?.ventas || []).map(v => (
                        <TableRow key={v.id} className={v.estado === 'Anulada' ? 'opacity-50 line-through' : ''}>
                          <TableCell className="text-xs font-bold text-blue-600">{v.numeroFactura}</TableCell>
                          <TableCell className="text-xs text-gray-500">
                            {new Date(v.fechaVenta).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
                          </TableCell>
                          <TableCell className="text-xs">{v.clienteNombre || 'Consumidor Final'}</TableCell>
                          <TableCell className="text-center">
                            <Badge variant="outline" className="text-[10px]">{v.metodoPago}</Badge>
                          </TableCell>
                          <TableCell className="text-xs text-right font-bold">{formatCurrency(v.total)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedCajaDetalle(null)}>Cerrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de confirmación de cierre */}
      <Dialog open={showConfirmation} onOpenChange={setShowConfirmation}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="text-amber-500" /> Confirmar Cierre de Caja
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-gray-600">
              Al cerrar la caja se registrará el arqueo final. Esta acción no se puede deshacer.
            </p>
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Efectivo esperado:</span>
                <span className="font-bold">{formatCurrency(stats.efectivoEnCaja)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Efectivo contado:</span>
                <span className="font-bold">{formatCurrency(parseFloat(montoFinal))}</span>
              </div>
              <div className="flex justify-between text-sm border-t pt-2">
                <span className="font-bold">Diferencia:</span>
                <span className={`font-bold ${
                  parseFloat(montoFinal) >= stats.efectivoEnCaja ? 'text-green-600' : 'text-red-600'
                }`}>
                  {formatCurrency(parseFloat(montoFinal) - stats.efectivoEnCaja)}
                </span>
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowConfirmation(false)}>Cancelar</Button>
            <Button className="bg-red-600 hover:bg-red-700" onClick={handleCerrar}>
              Sí, Cerrar Caja
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de resumen post-cierre */}
      <Dialog open={!!showCierreResumen} onOpenChange={() => setShowCierreResumen(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-green-600">
              <CheckCircle2 /> Caja Cerrada Exitosamente
            </DialogTitle>
          </DialogHeader>
          {showCierreResumen && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-green-50 p-4 rounded-lg text-center">
                  <Banknote className="w-6 h-6 mx-auto text-green-600 mb-2" />
                  <p className="text-xs text-gray-500">Efectivo</p>
                  <p className="text-xl font-black text-green-700">{formatCurrency(showCierreResumen.resumen?.totalEfectivo)}</p>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg text-center">
                  <CreditCard className="w-6 h-6 mx-auto text-blue-600 mb-2" />
                  <p className="text-xs text-gray-500">Tarjeta</p>
                  <p className="text-xl font-black text-blue-700">{formatCurrency(showCierreResumen.resumen?.totalTarjeta)}</p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg text-center">
                  <QrCode className="w-6 h-6 mx-auto text-purple-600 mb-2" />
                  <p className="text-xs text-gray-500">Transferencia</p>
                  <p className="text-xl font-black text-purple-700">{formatCurrency(showCierreResumen.resumen?.totalTransferencia)}</p>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Base Inicial</p>
                    <p className="font-bold">{formatCurrency(showCierreResumen.resumen?.montoInicial)}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Total Ventas</p>
                    <p className="font-bold">{formatCurrency(showCierreResumen.resumen?.totalVentas)}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Efectivo Esperado</p>
                    <p className="font-bold">{formatCurrency(showCierreResumen.resumen?.montoEsperadoEfectivo)}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Efectivo Contado</p>
                    <p className="font-bold">{formatCurrency(showCierreResumen.resumen?.montoContado)}</p>
                  </div>
                </div>
                <div className="border-t mt-4 pt-4 flex justify-between items-center">
                  <span className="font-bold text-lg">Diferencia de Arqueo</span>
                  <span className={`text-2xl font-black ${
                    showCierreResumen.resumen?.diferencia >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {formatCurrency(showCierreResumen.resumen?.diferencia)}
                  </span>
                </div>
              </div>

              <p className="text-center text-gray-500 text-sm">
                {showCierreResumen.resumen?.cantidadVentas} ventas procesadas en este turno
              </p>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setShowCierreResumen(null)}>Cerrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de historial */}
      <Dialog open={showHistorial} onOpenChange={setShowHistorial}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="w-5 h-5" /> Historial de Cierres de Caja
            </DialogTitle>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Caja</TableHead>
                  <TableHead>Fecha Cierre</TableHead>
                  <TableHead>Responsable</TableHead>
                  <TableHead className="text-center">Ventas</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Diferencia</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {historialCajas.map(c => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.nombre}</TableCell>
                    <TableCell className="text-sm">
                      {c.fechaCierre && formatDateLong(c.fechaCierre).fecha}
                      <br />
                      <span className="text-gray-400 text-xs">
                        {c.fechaCierre && new Date(c.fechaCierre).toLocaleTimeString()}
                      </span>
                    </TableCell>
                    <TableCell>{c.usuario?.nombre} {c.usuario?.apellido}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary">{c._count?.ventas || 0}</Badge>
                    </TableCell>
                    <TableCell className="text-right font-bold">
                      {formatCurrency(c.montoFinal)}
                    </TableCell>
                    <TableCell className="text-right">
                      <span className={`font-bold ${
                        (c.diferencia || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {formatCurrency(c.diferencia)}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
                {historialCajas.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-gray-400 py-8">
                      No hay registros de cierres anteriores
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowHistorial(false)}>Cerrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );

  // Función para renderizar "Mi Caja" (vista individual)
  function renderMiCaja() {
    return (
      <>
        {!cajaActiva ? (
          /* Sin caja activa - Mostrar formulario de apertura */
          <Card className="shadow-lg border-t-4 border-blue-600">
            <CardHeader className="text-center pb-2">
              <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Wallet className="w-10 h-10 text-blue-600" />
              </div>
              <CardTitle className="text-2xl font-bold">Apertura de Caja</CardTitle>
              <p className="text-gray-500">Inicie una nueva sesión de venta indicando el monto base en efectivo.</p>
            </CardHeader>
            <CardContent className="p-8">
              <div className="max-w-sm mx-auto space-y-4">
                <div className="space-y-2">
                  <Label className="font-bold text-gray-700">Nombre de la Caja</Label>
                  <Select value={nombreCaja} onValueChange={setNombreCaja}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Caja Principal">Caja Principal</SelectItem>
                      <SelectItem value="Caja 1">Caja 1</SelectItem>
                      <SelectItem value="Caja 2">Caja 2</SelectItem>
                      <SelectItem value="Caja Urgencias">Caja Urgencias</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="font-bold text-gray-700">Monto Inicial en Efectivo (Base)</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-gray-400">$</span>
                    <Input
                      type="number"
                      className="pl-8 h-12 text-lg font-bold"
                      value={montoInicial}
                      onChange={(e) => setMontoInicial(e.target.value)}
                    />
                  </div>
                </div>
                <Button className="w-full h-12 bg-blue-600 hover:bg-blue-700 font-bold" onClick={handleAbrir}>
                  ABRIR CAJA AHORA
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          /* Caja activa - Mostrar dashboard y opción de cierre */
          <div className="space-y-6">
            {/* KPIs de la sesión */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-2">
                    <Banknote className="w-6 h-6 opacity-80" />
                    <span className="text-green-100 text-sm font-medium">Efectivo</span>
                  </div>
                  <p className="text-3xl font-black">{formatCurrency(stats.totalEfectivo)}</p>
                  <p className="text-green-100 text-xs mt-1">En caja: {formatCurrency(stats.efectivoEnCaja)}</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-2">
                    <CreditCard className="w-6 h-6 opacity-80" />
                    <span className="text-blue-100 text-sm font-medium">Tarjeta</span>
                  </div>
                  <p className="text-3xl font-black">{formatCurrency(stats.totalTarjeta)}</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-purple-500 to-violet-600 text-white shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-2">
                    <QrCode className="w-6 h-6 opacity-80" />
                    <span className="text-purple-100 text-sm font-medium">Transferencia</span>
                  </div>
                  <p className="text-3xl font-black">{formatCurrency(stats.totalTransferencia)}</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-gray-700 to-gray-900 text-white shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-2">
                    <Receipt className="w-6 h-6 opacity-80" />
                    <span className="text-gray-300 text-sm font-medium">Total Ventas</span>
                  </div>
                  <p className="text-3xl font-black">{formatCurrency(stats.totalGeneral)}</p>
                  <p className="text-gray-300 text-xs mt-1">{stats.cantidadVentas} transacciones</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Info de sesión activa */}
              <Card className="shadow-md border-none lg:col-span-2">
                <CardHeader className="bg-gradient-to-r from-green-600 to-emerald-700 rounded-t-xl py-4">
                  <CardTitle className="text-white flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5" /> Sesión Activa: {cajaActiva.nombre}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div>
                      <p className="text-xs text-gray-400 uppercase font-bold tracking-wider">Apertura</p>
                      <p className="font-semibold text-gray-900">{formatDateLong(cajaActiva.fechaApertura).fecha}</p>
                      <p className="text-xs text-gray-500">{new Date(cajaActiva.fechaApertura).toLocaleTimeString()}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 uppercase font-bold tracking-wider">Responsable</p>
                      <p className="font-semibold text-gray-900">{cajaActiva.usuario?.nombre} {cajaActiva.usuario?.apellido}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 uppercase font-bold tracking-wider">Base Inicial</p>
                      <p className="font-semibold text-gray-900">{formatCurrency(cajaActiva.montoInicial)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 uppercase font-bold tracking-wider">Efectivo Esperado</p>
                      <p className="font-bold text-green-600 text-xl">{formatCurrency(stats.efectivoEnCaja)}</p>
                    </div>
                  </div>

                  {/* Tabla de ventas del turno */}
                  <div className="border rounded-lg overflow-hidden">
                    <div className="bg-gray-50 px-4 py-2 border-b">
                      <h4 className="font-bold text-sm text-gray-700">Ventas del Turno ({cajaDetalle?.ventas?.length || 0})</h4>
                    </div>
                    <div className="max-h-[300px] overflow-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-gray-50">
                            <TableHead className="text-xs">Factura</TableHead>
                            <TableHead className="text-xs">Hora</TableHead>
                            <TableHead className="text-xs">Cliente</TableHead>
                            <TableHead className="text-xs text-center">Pago</TableHead>
                            <TableHead className="text-xs text-right">Total</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {(cajaDetalle?.ventas || []).map(v => (
                            <TableRow key={v.id} className={v.estado === 'Anulada' ? 'opacity-50 line-through' : ''}>
                              <TableCell className="text-xs font-bold text-blue-600">{v.numeroFactura}</TableCell>
                              <TableCell className="text-xs text-gray-500">
                                {new Date(v.fechaVenta).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
                              </TableCell>
                              <TableCell className="text-xs">{v.clienteNombre || 'Consumidor Final'}</TableCell>
                              <TableCell className="text-center">
                                <Badge variant="outline" className="text-[10px]">
                                  {v.metodoPago === 'Efectivo' && <Banknote className="w-3 h-3 mr-1 inline" />}
                                  {v.metodoPago === 'Tarjeta' && <CreditCard className="w-3 h-3 mr-1 inline" />}
                                  {v.metodoPago === 'Transferencia' && <QrCode className="w-3 h-3 mr-1 inline" />}
                                  {v.metodoPago}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-xs text-right font-bold">{formatCurrency(v.total)}</TableCell>
                            </TableRow>
                          ))}
                          {(!cajaDetalle?.ventas || cajaDetalle.ventas.length === 0) && (
                            <TableRow>
                              <TableCell colSpan={5} className="text-center text-gray-400 py-8">
                                No hay ventas en este turno
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Formulario de cierre */}
              <Card className="shadow-md border-none">
                <CardHeader className="py-4">
                  <CardTitle className="text-lg font-bold flex items-center gap-2 text-gray-800">
                    <Calculator className="w-5 h-5 text-blue-600" /> Arqueo y Cierre
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                    <p className="text-xs text-blue-600 font-bold uppercase mb-1">Efectivo Esperado</p>
                    <p className="text-2xl font-black text-blue-700">{formatCurrency(stats.efectivoEnCaja)}</p>
                    <p className="text-xs text-blue-500 mt-1">
                      Base ({formatCurrency(cajaActiva.montoInicial)}) + Efectivo ({formatCurrency(stats.totalEfectivo)})
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label className="font-bold">Efectivo Físico Contado</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-gray-400">$</span>
                      <Input
                        type="number"
                        className="pl-8 h-12 text-lg font-bold"
                        placeholder="Ingrese el monto contado"
                        value={montoFinal}
                        onChange={(e) => setMontoFinal(e.target.value)}
                      />
                    </div>
                  </div>

                  {montoFinal && (
                    <div className={`p-3 rounded-lg ${
                      parseFloat(montoFinal) === stats.efectivoEnCaja
                        ? 'bg-green-50 border border-green-200'
                        : parseFloat(montoFinal) > stats.efectivoEnCaja
                        ? 'bg-blue-50 border border-blue-200'
                        : 'bg-red-50 border border-red-200'
                    }`}>
                      <p className="text-xs font-bold uppercase mb-1">
                        {parseFloat(montoFinal) === stats.efectivoEnCaja ? 'Arqueo Exacto' :
                         parseFloat(montoFinal) > stats.efectivoEnCaja ? 'Sobrante' : 'Faltante'}
                      </p>
                      <p className="text-xl font-black">
                        {formatCurrency(Math.abs(parseFloat(montoFinal) - stats.efectivoEnCaja))}
                      </p>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label className="font-bold">Observaciones (Opcional)</Label>
                    <Textarea
                      placeholder="Notas sobre el cierre..."
                      value={observaciones}
                      onChange={(e) => setObservaciones(e.target.value)}
                      rows={2}
                    />
                  </div>

                  <Button
                    className="w-full h-12 bg-red-600 hover:bg-red-700 font-bold"
                    disabled={!montoFinal}
                    onClick={() => setShowConfirmation(true)}
                  >
                    CERRAR CAJA Y FINALIZAR TURNO
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </>
    );
  }
}
