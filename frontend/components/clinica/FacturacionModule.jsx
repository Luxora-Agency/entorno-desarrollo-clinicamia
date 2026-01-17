'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Plus,
  Search,
  FileText,
  DollarSign,
  TrendingUp,
  Download,
  Eye,
  Check,
  Clock,
  XCircle,
  CreditCard,
  Receipt,
  Building2,
  Trash2,
  Loader2,
  X,
  FileDown,
  Cloud,
  Send,
  AlertCircle,
  CheckCircle2,
  FileCheck,
} from 'lucide-react';
import { LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { apiGet, apiPost, apiPut } from '@/services/api';

export default function FacturacionModule({ user }) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('facturas');
  const [showNewFactura, setShowNewFactura] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showPago, setShowPago] = useState(false);
  const [selectedFactura, setSelectedFactura] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [estadoFilter, setEstadoFilter] = useState('todos');
  const [periodoFilter, setPeriodoFilter] = useState('mes');

  const [facturas, setFacturas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalFacturado: 0,
    totalPendiente: 0,
    totalPagado: 0,
    ventasMensuales: [],
    distribucionPagos: [],
  });

  // Cargar facturas
  const fetchFacturas = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (estadoFilter !== 'todos') params.append('estado', estadoFilter);

      const res = await apiGet(`/facturas?${params.toString()}`);
      if (res.success) {
        setFacturas(res.data || []);
        calcularEstadisticas(res.data || []);
      } else {
        toast({ variant: 'destructive', description: res.message || 'Error cargando facturas' });
      }
    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', description: 'Error de conexión' });
    } finally {
      setLoading(false);
    }
  }, [estadoFilter, toast]);

  useEffect(() => {
    fetchFacturas();
  }, [fetchFacturas]);

  // Calcular estadísticas desde las facturas
  const calcularEstadisticas = (data) => {
    const totalFacturado = data.reduce((sum, f) => sum + parseFloat(f.total || 0), 0);
    const totalPendiente = data
      .filter(f => f.estado === 'Pendiente' || f.estado === 'Parcial')
      .reduce((sum, f) => sum + parseFloat(f.saldoPendiente || 0), 0);
    const totalPagado = data
      .filter(f => f.estado === 'Pagada')
      .reduce((sum, f) => sum + parseFloat(f.total || 0), 0);

    // Agrupar por mes para gráfica
    const porMes = {};
    data.forEach(f => {
      const fecha = new Date(f.fechaEmision);
      const mesKey = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`;
      const mesLabel = fecha.toLocaleString('es-ES', { month: 'short' });
      if (!porMes[mesKey]) {
        porMes[mesKey] = { mes: mesLabel, monto: 0 };
      }
      porMes[mesKey].monto += parseFloat(f.total || 0);
    });

    const ventasMensuales = Object.values(porMes)
      .sort((a, b) => a.mes.localeCompare(b.mes))
      .slice(-6);

    // Agrupar por estado para pie chart
    const porEstado = {};
    data.forEach(f => {
      if (!porEstado[f.estado]) {
        porEstado[f.estado] = { name: f.estado, value: 0, monto: 0 };
      }
      porEstado[f.estado].value += 1;
      porEstado[f.estado].monto += parseFloat(f.total || 0);
    });

    setStats({
      totalFacturado,
      totalPendiente,
      totalPagado,
      ventasMensuales,
      distribucionPagos: Object.values(porEstado),
    });
  };

  const handleGenerarRIPS = async () => {
    const facturasParaRIPS = facturasFiltradas.filter(f => f.estado === 'Pagada');
    if (facturasParaRIPS.length === 0) {
      toast({ variant: 'destructive', description: 'No hay facturas pagadas para generar RIPS' });
      return;
    }

    try {
      const ids = facturasParaRIPS.map(f => f.id);
      const res = await apiPost('/facturas/rips/generar', { factura_ids: ids });

      if (res.success) {
        const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `RIPS-${new Date().getTime()}.json`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        toast({ description: 'RIPS generados correctamente' });
      } else {
        toast({ variant: 'destructive', description: res.message || 'Error generando RIPS' });
      }
    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', description: 'Error al generar RIPS' });
    }
  };

  const COLORS = ['#10b981', '#f59e0b', '#3b82f6', '#8b5cf6', '#ef4444'];

  const getEstadoColor = (estado) => {
    switch (estado) {
      case 'Pendiente': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'Pagada': return 'bg-green-100 text-green-800 border-green-300';
      case 'Parcial': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'Cancelada': return 'bg-red-100 text-red-800 border-red-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getEstadoDianColor = (estadoDian) => {
    switch (estadoDian) {
      case 'ACEPTADA': return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'RECHAZADA': return 'bg-red-100 text-red-800 border-red-300';
      case 'PENDIENTE': return 'bg-amber-100 text-amber-800 border-amber-300';
      default: return 'bg-gray-100 text-gray-600 border-gray-300';
    }
  };

  const handleEmitirElectronica = async (factura) => {
    try {
      const response = await apiPost(`/facturas/${factura.id}/emitir-electronica`);
      if (response.success) {
        toast({ description: `Factura ${factura.numero} emitida electrónicamente. CUFE: ${response.data.cufe}` });
        fetchFacturas();
      }
    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', description: 'Error al emitir factura electrónica: ' + error.message });
    }
  };

  const handleDescargarPdfElectronico = async (factura) => {
    try {
      window.open(`${process.env.NEXT_PUBLIC_API_URL}/facturas/${factura.id}/pdf-electronico`, '_blank');
    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', description: 'Error al descargar PDF electrónico' });
    }
  };

  const handleEnviarEmail = async (factura) => {
    try {
      const response = await apiPost(`/facturas/${factura.id}/enviar-email`);
      if (response.success) {
        toast({ description: response.data.message || 'Factura enviada por email' });
      }
    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', description: 'Error al enviar email: ' + error.message });
    }
  };

  const facturasFiltradas = facturas.filter(f => {
    const pacienteNombre = `${f.paciente?.nombre || ''} ${f.paciente?.apellido || ''}`.trim() || 'Desconocido';
    const cedula = f.paciente?.cedula || '';

    const matchSearch = searchTerm === '' ||
      f.numero?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pacienteNombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cedula.includes(searchTerm);

    const matchTab =
      (activeTab === 'facturas') ||
      (activeTab === 'pendientes' && (f.estado === 'Pendiente' || f.estado === 'Parcial')) ||
      (activeTab === 'pagadas' && f.estado === 'Pagada');

    return matchSearch && matchTab;
  });

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(value || 0);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('es-CO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      timeZone: 'America/Bogota'
    });
  };

  const handleFacturaCreada = () => {
    setShowNewFactura(false);
    fetchFacturas();
    toast({ description: 'Factura creada correctamente' });
  };

  const handlePagoRegistrado = () => {
    setShowPago(false);
    setSelectedFactura(null);
    fetchFacturas();
    toast({ description: 'Pago registrado correctamente' });
  };

  const handleVerFactura = async (factura) => {
    try {
      const res = await apiGet(`/facturas/${factura.id}`);
      if (res.success) {
        setSelectedFactura(res.data?.factura || res.data);
        setShowPreview(true);
      }
    } catch (error) {
      toast({ variant: 'destructive', description: 'Error al cargar factura' });
    }
  };

  return (
    <div className="p-6 lg:p-8 bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 min-h-screen">
      <div className="w-full">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-emerald-600 to-teal-700 rounded-lg shadow-lg">
              <Receipt className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Facturación y RIPS</h1>
              <p className="text-sm text-gray-600">Gestión de Facturación Hospitalaria</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="border-emerald-600 text-emerald-600 hover:bg-emerald-50"
              onClick={handleGenerarRIPS}
            >
              <Download className="w-4 h-4 mr-2" />
              Exportar RIPS
            </Button>
            <Dialog open={showNewFactura} onOpenChange={setShowNewFactura}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white shadow-md">
                  <Plus className="w-4 h-4 mr-2" />
                  Nueva Factura
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Nueva Factura</DialogTitle>
                </DialogHeader>
                <FormularioNuevaFactura
                  onClose={() => setShowNewFactura(false)}
                  onSuccess={handleFacturaCreada}
                />
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="border-l-4 border-l-emerald-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Facturado</p>
                  <p className="text-2xl font-bold text-emerald-600">{formatCurrency(stats.totalFacturado)}</p>
                  <p className="text-xs text-gray-500">{facturas.length} facturas</p>
                </div>
                <DollarSign className="w-8 h-8 text-emerald-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-yellow-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Pendiente Cobro</p>
                  <p className="text-2xl font-bold text-yellow-600">{formatCurrency(stats.totalPendiente)}</p>
                  <p className="text-xs text-gray-500">
                    {facturas.filter(f => f.estado === 'Pendiente' || f.estado === 'Parcial').length} facturas
                  </p>
                </div>
                <Clock className="w-8 h-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Pagado</p>
                  <p className="text-2xl font-bold text-green-600">{formatCurrency(stats.totalPagado)}</p>
                  <p className="text-xs text-gray-500">
                    {facturas.filter(f => f.estado === 'Pagada').length} facturas
                  </p>
                </div>
                <Check className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-blue-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Tasa Cobro</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {stats.totalFacturado > 0
                      ? Math.round((stats.totalPagado / stats.totalFacturado) * 100)
                      : 0}%
                  </p>
                  <p className="text-xs text-gray-500">Eficiencia</p>
                </div>
                <TrendingUp className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Gráficas */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Ingresos por Período</CardTitle>
            </CardHeader>
            <CardContent>
              {stats.ventasMensuales.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={stats.ventasMensuales}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="mes" />
                    <YAxis tickFormatter={(v) => `$${(v/1000000).toFixed(1)}M`} />
                    <Tooltip formatter={(value) => formatCurrency(value)} />
                    <Legend />
                    <Line type="monotone" dataKey="monto" stroke="#10b981" strokeWidth={2} name="Ingresos" />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[250px] flex items-center justify-center text-gray-500">
                  No hay datos para mostrar
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Distribución por Estado</CardTitle>
            </CardHeader>
            <CardContent>
              {stats.distribucionPagos.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={stats.distribucionPagos}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={70}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {stats.distribucionPagos.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    {stats.distribucionPagos.map((item, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                        <span className="text-xs text-gray-600">{item.name}: {formatCurrency(item.monto)}</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="h-[250px] flex items-center justify-center text-gray-500">
                  No hay datos para mostrar
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Búsqueda y Filtros */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="flex-1 flex items-center gap-2">
                <Search className="w-5 h-5 text-gray-400" />
                <Input
                  placeholder="Buscar por número, paciente o cédula..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1"
                />
              </div>
              <Select value={estadoFilter} onValueChange={setEstadoFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filtrar estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos los estados</SelectItem>
                  <SelectItem value="Pendiente">Pendiente</SelectItem>
                  <SelectItem value="Parcial">Parcial</SelectItem>
                  <SelectItem value="Pagada">Pagada</SelectItem>
                  <SelectItem value="Cancelada">Cancelada</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Tabs de Facturas */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-white border shadow-sm">
            <TabsTrigger value="facturas" className="data-[state=active]:bg-emerald-100 data-[state=active]:text-emerald-700">
              Todas las Facturas
            </TabsTrigger>
            <TabsTrigger value="pendientes" className="data-[state=active]:bg-yellow-100 data-[state=active]:text-yellow-700">
              Pendientes
            </TabsTrigger>
            <TabsTrigger value="pagadas" className="data-[state=active]:bg-green-100 data-[state=active]:text-green-700">
              Pagadas
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-6">
            <Card>
              <CardContent className="p-0">
                {loading ? (
                  <div className="p-8 text-center">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto text-emerald-600" />
                    <p className="mt-2 text-gray-500">Cargando facturas...</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>No. Factura</TableHead>
                        <TableHead>Paciente</TableHead>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Items</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead>Saldo</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead>DIAN</TableHead>
                        <TableHead>Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {facturasFiltradas.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={9} className="text-center text-gray-500 py-8">
                            No se encontraron facturas
                          </TableCell>
                        </TableRow>
                      ) : (
                        facturasFiltradas.map((factura) => (
                          <TableRow key={factura.id}>
                            <TableCell className="font-medium font-mono">{factura.numero}</TableCell>
                            <TableCell>
                              <div>
                                <p className="font-medium">
                                  {factura.paciente?.nombre} {factura.paciente?.apellido}
                                </p>
                                <p className="text-xs text-gray-500">
                                  CC: {factura.paciente?.cedula}
                                </p>
                              </div>
                            </TableCell>
                            <TableCell className="text-sm">{formatDate(factura.fechaEmision)}</TableCell>
                            <TableCell>
                              <Badge variant="outline">{factura.items?.length || 0} items</Badge>
                            </TableCell>
                            <TableCell className="font-semibold text-emerald-700">
                              {formatCurrency(factura.total)}
                            </TableCell>
                            <TableCell className={parseFloat(factura.saldoPendiente) > 0 ? 'text-yellow-600 font-medium' : 'text-gray-500'}>
                              {formatCurrency(factura.saldoPendiente)}
                            </TableCell>
                            <TableCell>
                              <Badge className={getEstadoColor(factura.estado)}>
                                {factura.estado}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {factura.siigoId ? (
                                <div className="flex items-center gap-1">
                                  <Badge className={getEstadoDianColor(factura.estadoDian)}>
                                    {factura.estadoDian === 'ACEPTADA' && <CheckCircle2 className="w-3 h-3 mr-1" />}
                                    {factura.estadoDian === 'RECHAZADA' && <AlertCircle className="w-3 h-3 mr-1" />}
                                    {factura.estadoDian || 'PENDIENTE'}
                                  </Badge>
                                  {factura.cufe && (
                                    <span className="text-[10px] text-gray-500 font-mono truncate max-w-[60px]" title={factura.cufe}>
                                      {factura.cufe.substring(0, 8)}...
                                    </span>
                                  )}
                                </div>
                              ) : (
                                <Badge variant="outline" className="text-gray-500">
                                  Sin emitir
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleVerFactura(factura)}
                                  title="Ver detalle"
                                >
                                  <Eye className="w-4 h-4" />
                                </Button>
                                {(factura.estado === 'Pendiente' || factura.estado === 'Parcial') && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="text-green-600 border-green-600"
                                    onClick={() => {
                                      setSelectedFactura(factura);
                                      setShowPago(true);
                                    }}
                                    title="Registrar pago"
                                  >
                                    <CreditCard className="w-4 h-4" />
                                  </Button>
                                )}
                                {!factura.siigoId && factura.estado !== 'Cancelada' && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="text-blue-600 border-blue-600"
                                    onClick={() => handleEmitirElectronica(factura)}
                                    title="Emitir Factura Electrónica DIAN"
                                  >
                                    <Cloud className="w-4 h-4" />
                                  </Button>
                                )}
                                {factura.siigoId && (
                                  <>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="text-emerald-600 border-emerald-600"
                                      onClick={() => handleDescargarPdfElectronico(factura)}
                                      title="Descargar PDF DIAN"
                                    >
                                      <FileCheck className="w-4 h-4" />
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="text-purple-600 border-purple-600"
                                      onClick={() => handleEnviarEmail(factura)}
                                      title="Reenviar por email"
                                    >
                                      <Send className="w-4 h-4" />
                                    </Button>
                                  </>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Dialog de Preview */}
        <Dialog open={showPreview} onOpenChange={setShowPreview}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Detalle de Factura</DialogTitle>
            </DialogHeader>
            {selectedFactura && (
              <PreviewFactura
                factura={selectedFactura}
                formatCurrency={formatCurrency}
                formatDate={formatDate}
                getEstadoColor={getEstadoColor}
                onRegistrarPago={() => {
                  setShowPreview(false);
                  setShowPago(true);
                }}
              />
            )}
          </DialogContent>
        </Dialog>

        {/* Dialog de Pago */}
        <Dialog open={showPago} onOpenChange={setShowPago}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Registrar Pago</DialogTitle>
            </DialogHeader>
            {selectedFactura && (
              <FormularioPago
                factura={selectedFactura}
                formatCurrency={formatCurrency}
                onClose={() => setShowPago(false)}
                onSuccess={handlePagoRegistrado}
              />
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

// Componente de Formulario de Nueva Factura
function FormularioNuevaFactura({ onClose, onSuccess }) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [pacientes, setPacientes] = useState([]);
  const [searchPaciente, setSearchPaciente] = useState('');
  const [pacienteSeleccionado, setPacienteSeleccionado] = useState(null);
  const [showPacientesList, setShowPacientesList] = useState(false);

  // Items de la factura
  const [items, setItems] = useState([
    { tipo: 'Otro', descripcion: '', cantidad: 1, precio_unitario: 0, descuento: 0 }
  ]);

  // Datos adicionales
  const [observaciones, setObservaciones] = useState('');
  const [cubiertoPorEPS, setCubiertoPorEPS] = useState(false);
  const [epsAutorizacion, setEpsAutorizacion] = useState('');

  // Buscar pacientes
  useEffect(() => {
    const buscarPacientes = async () => {
      if (searchPaciente.length < 2) {
        setPacientes([]);
        return;
      }
      try {
        const res = await apiGet(`/pacientes?search=${encodeURIComponent(searchPaciente)}&limit=10`);
        if (res.success) {
          setPacientes(res.data || []);
        }
      } catch (error) {
        console.error('Error buscando pacientes:', error);
      }
    };

    const debounce = setTimeout(buscarPacientes, 300);
    return () => clearTimeout(debounce);
  }, [searchPaciente]);

  const seleccionarPaciente = (paciente) => {
    setPacienteSeleccionado(paciente);
    setSearchPaciente(`${paciente.nombre} ${paciente.apellido} - ${paciente.cedula}`);
    setShowPacientesList(false);
  };

  const agregarItem = () => {
    setItems([...items, { tipo: 'Otro', descripcion: '', cantidad: 1, precio_unitario: 0, descuento: 0 }]);
  };

  const eliminarItem = (index) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const actualizarItem = (index, campo, valor) => {
    const nuevosItems = [...items];
    nuevosItems[index][campo] = valor;
    setItems(nuevosItems);
  };

  const calcularSubtotalItem = (item) => {
    return (parseFloat(item.precio_unitario) || 0) * (parseInt(item.cantidad) || 1) - (parseFloat(item.descuento) || 0);
  };

  const subtotal = items.reduce((sum, item) => sum + calcularSubtotalItem(item), 0);
  const total = subtotal;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!pacienteSeleccionado) {
      toast({ variant: 'destructive', description: 'Debe seleccionar un paciente' });
      return;
    }

    const itemsValidos = items.filter(item => item.descripcion && item.precio_unitario > 0);
    if (itemsValidos.length === 0) {
      toast({ variant: 'destructive', description: 'Debe agregar al menos un item con descripción y precio' });
      return;
    }

    try {
      setLoading(true);
      const res = await apiPost('/facturas', {
        paciente_id: pacienteSeleccionado.id,
        items: itemsValidos.map(item => ({
          tipo: item.tipo,
          descripcion: item.descripcion,
          cantidad: parseInt(item.cantidad) || 1,
          precio_unitario: parseFloat(item.precio_unitario) || 0,
          descuento: parseFloat(item.descuento) || 0,
        })),
        observaciones,
        cubierto_por_eps: cubiertoPorEPS,
        eps_autorizacion: epsAutorizacion || null,
      });

      if (res.success) {
        onSuccess();
      } else {
        toast({ variant: 'destructive', description: res.message || 'Error al crear factura' });
      }
    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', description: 'Error al crear factura' });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(value || 0);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Selección de Paciente */}
      <div className="relative">
        <Label>Paciente *</Label>
        <div className="relative">
          <Input
            placeholder="Buscar paciente por nombre o cédula..."
            value={searchPaciente}
            onChange={(e) => {
              setSearchPaciente(e.target.value);
              setShowPacientesList(true);
              if (!e.target.value) setPacienteSeleccionado(null);
            }}
            onFocus={() => setShowPacientesList(true)}
          />
          {pacienteSeleccionado && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 p-0"
              onClick={() => {
                setPacienteSeleccionado(null);
                setSearchPaciente('');
              }}
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
        {showPacientesList && pacientes.length > 0 && !pacienteSeleccionado && (
          <div className="absolute z-50 w-full mt-1 bg-white border rounded-md shadow-lg max-h-48 overflow-y-auto">
            {pacientes.map((p) => (
              <div
                key={p.id}
                className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                onClick={() => seleccionarPaciente(p)}
              >
                <p className="font-medium">{p.nombre} {p.apellido}</p>
                <p className="text-sm text-gray-500">CC: {p.cedula} | {p.eps || 'Sin EPS'}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Info del paciente seleccionado */}
      {pacienteSeleccionado && (
        <Card className="bg-emerald-50 border-emerald-200">
          <CardContent className="p-3">
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Paciente:</span>
                <p className="font-medium">{pacienteSeleccionado.nombre} {pacienteSeleccionado.apellido}</p>
              </div>
              <div>
                <span className="text-gray-500">Cédula:</span>
                <p className="font-medium">{pacienteSeleccionado.cedula}</p>
              </div>
              <div>
                <span className="text-gray-500">EPS:</span>
                <p className="font-medium">{pacienteSeleccionado.eps || 'No registrada'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Items de la Factura */}
      <Card>
        <CardHeader className="py-3">
          <CardTitle className="text-lg">Items de Factura</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-12 gap-2 text-xs font-medium text-gray-600 pb-2 border-b">
            <span className="col-span-2">Tipo</span>
            <span className="col-span-4">Descripción</span>
            <span className="col-span-1">Cant.</span>
            <span className="col-span-2">Valor Unit.</span>
            <span className="col-span-1">Desc.</span>
            <span className="col-span-1">Subtotal</span>
            <span className="col-span-1"></span>
          </div>

          {items.map((item, index) => (
            <div key={index} className="grid grid-cols-12 gap-2 items-center">
              <Select
                value={item.tipo}
                onValueChange={(val) => actualizarItem(index, 'tipo', val)}
              >
                <SelectTrigger className="col-span-2 h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Consulta">Consulta</SelectItem>
                  <SelectItem value="OrdenMedica">Orden Médica</SelectItem>
                  <SelectItem value="OrdenMedicamento">Medicamento</SelectItem>
                  <SelectItem value="Hospitalizacion">Hospitalización</SelectItem>
                  <SelectItem value="Otro">Otro</SelectItem>
                </SelectContent>
              </Select>
              <Input
                className="col-span-4 h-9 text-sm"
                placeholder="Descripción del servicio"
                value={item.descripcion}
                onChange={(e) => actualizarItem(index, 'descripcion', e.target.value)}
              />
              <Input
                className="col-span-1 h-9 text-sm"
                type="number"
                min="1"
                value={item.cantidad}
                onChange={(e) => actualizarItem(index, 'cantidad', e.target.value)}
              />
              <Input
                className="col-span-2 h-9 text-sm"
                type="number"
                min="0"
                placeholder="0"
                value={item.precio_unitario || ''}
                onChange={(e) => actualizarItem(index, 'precio_unitario', e.target.value)}
              />
              <Input
                className="col-span-1 h-9 text-sm"
                type="number"
                min="0"
                placeholder="0"
                value={item.descuento || ''}
                onChange={(e) => actualizarItem(index, 'descuento', e.target.value)}
              />
              <div className="col-span-1 text-sm font-medium text-right">
                {formatCurrency(calcularSubtotalItem(item))}
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="col-span-1 h-9 w-9 p-0 text-red-500 hover:text-red-700"
                onClick={() => eliminarItem(index)}
                disabled={items.length === 1}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}

          <Button type="button" variant="outline" size="sm" className="w-full" onClick={agregarItem}>
            <Plus className="w-4 h-4 mr-2" />
            Agregar Item
          </Button>
        </CardContent>
      </Card>

      {/* Cobertura EPS */}
      <div className="flex items-center gap-4">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={cubiertoPorEPS}
            onChange={(e) => setCubiertoPorEPS(e.target.checked)}
            className="w-4 h-4 rounded border-gray-300"
          />
          <span className="text-sm">Cubierto por EPS</span>
        </label>
        {cubiertoPorEPS && (
          <Input
            placeholder="No. Autorización EPS"
            value={epsAutorizacion}
            onChange={(e) => setEpsAutorizacion(e.target.value)}
            className="flex-1"
          />
        )}
      </div>

      {/* Observaciones */}
      <div>
        <Label>Observaciones</Label>
        <Textarea
          placeholder="Observaciones adicionales..."
          value={observaciones}
          onChange={(e) => setObservaciones(e.target.value)}
          rows={2}
        />
      </div>

      {/* Totales */}
      <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
        <div>
          <Label className="text-sm">Subtotal</Label>
          <p className="text-lg font-bold">{formatCurrency(subtotal)}</p>
        </div>
        <div>
          <Label className="text-sm">Total a Pagar</Label>
          <p className="text-xl font-bold text-emerald-600">{formatCurrency(total)}</p>
        </div>
      </div>

      {/* Botones */}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
          Cancelar
        </Button>
        <Button
          type="submit"
          className="bg-gradient-to-r from-emerald-600 to-teal-700"
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Creando...
            </>
          ) : (
            'Generar Factura'
          )}
        </Button>
      </div>
    </form>
  );
}

// Componente de Formulario de Pago
function FormularioPago({ factura, formatCurrency, onClose, onSuccess }) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [monto, setMonto] = useState(parseFloat(factura.saldoPendiente) || 0);
  const [metodoPago, setMetodoPago] = useState('Efectivo');
  const [referencia, setReferencia] = useState('');
  const [observaciones, setObservaciones] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!monto || monto <= 0) {
      toast({ variant: 'destructive', description: 'El monto debe ser mayor a 0' });
      return;
    }

    if (monto > parseFloat(factura.saldoPendiente)) {
      toast({ variant: 'destructive', description: 'El monto excede el saldo pendiente' });
      return;
    }

    try {
      setLoading(true);
      const res = await apiPost(`/facturas/${factura.id}/pagos`, {
        monto: parseFloat(monto),
        metodo_pago: metodoPago,
        referencia: referencia || null,
        observaciones: observaciones || null,
      });

      if (res.success) {
        onSuccess();
      } else {
        toast({ variant: 'destructive', description: res.message || 'Error al registrar pago' });
      }
    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', description: 'Error al registrar pago' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="p-4 bg-gray-50 rounded-lg">
        <div className="flex justify-between text-sm">
          <span>Factura:</span>
          <span className="font-mono font-medium">{factura.numero}</span>
        </div>
        <div className="flex justify-between text-sm mt-1">
          <span>Total Factura:</span>
          <span className="font-medium">{formatCurrency(factura.total)}</span>
        </div>
        <div className="flex justify-between text-sm mt-1">
          <span>Saldo Pendiente:</span>
          <span className="font-bold text-yellow-600">{formatCurrency(factura.saldoPendiente)}</span>
        </div>
      </div>

      <div>
        <Label>Monto a Pagar *</Label>
        <Input
          type="number"
          min="0"
          max={parseFloat(factura.saldoPendiente)}
          step="0.01"
          value={monto}
          onChange={(e) => setMonto(e.target.value)}
          required
        />
      </div>

      <div>
        <Label>Método de Pago *</Label>
        <Select value={metodoPago} onValueChange={setMetodoPago}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Efectivo">Efectivo</SelectItem>
            <SelectItem value="Tarjeta">Tarjeta</SelectItem>
            <SelectItem value="Transferencia">Transferencia</SelectItem>
            <SelectItem value="EPS">EPS</SelectItem>
            <SelectItem value="Otro">Otro</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {(metodoPago === 'Tarjeta' || metodoPago === 'Transferencia' || metodoPago === 'EPS') && (
        <div>
          <Label>Referencia/No. Transacción</Label>
          <Input
            value={referencia}
            onChange={(e) => setReferencia(e.target.value)}
            placeholder="Número de referencia"
          />
        </div>
      )}

      <div>
        <Label>Observaciones</Label>
        <Textarea
          value={observaciones}
          onChange={(e) => setObservaciones(e.target.value)}
          placeholder="Observaciones del pago..."
          rows={2}
        />
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
          Cancelar
        </Button>
        <Button
          type="submit"
          className="bg-gradient-to-r from-green-600 to-emerald-700"
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Registrando...
            </>
          ) : (
            <>
              <Check className="w-4 h-4 mr-2" />
              Registrar Pago
            </>
          )}
        </Button>
      </div>
    </form>
  );
}

// Componente de Preview de Factura
function PreviewFactura({ factura, formatCurrency, formatDate, getEstadoColor, onRegistrarPago }) {
  const { toast } = useToast();
  const [descargandoPDF, setDescargandoPDF] = useState(false);

  const descargarPDF = async () => {
    try {
      setDescargandoPDF(true);
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

      const response = await fetch(`${apiUrl}/facturas/${factura.id}/pdf`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Error al generar el PDF');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Factura-${factura.numero}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error descargando PDF:', error);
      toast({ variant: 'destructive', description: 'Error al descargar el PDF' });
    } finally {
      setDescargandoPDF(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Encabezado de Factura */}
      <Card>
        <CardContent className="p-6">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">CLÍNICA MÍA</h2>
              <p className="text-sm text-gray-600">NIT: 900.123.456-7</p>
              <p className="text-sm text-gray-600">Dirección: Calle 123 #45-67</p>
              <p className="text-sm text-gray-600">Tel: (601) 234-5678</p>
            </div>
            <div className="text-right">
              <Badge className="bg-emerald-600 text-white text-lg px-4 py-2 mb-2">
                {factura.numero}
              </Badge>
              <p className="text-sm text-gray-600">Emisión: {formatDate(factura.fechaEmision)}</p>
              {factura.fechaVencimiento && (
                <p className="text-sm text-gray-600">Vence: {formatDate(factura.fechaVencimiento)}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6 p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-2">Facturar a:</p>
              <p className="font-medium">{factura.paciente?.nombre} {factura.paciente?.apellido}</p>
              <p className="text-sm text-gray-600">CC: {factura.paciente?.cedula}</p>
              {factura.paciente?.eps && (
                <p className="text-sm text-gray-600">EPS: {factura.paciente?.eps}</p>
              )}
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-2">Cobertura:</p>
              <Badge className={factura.cubiertoPorEPS ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'}>
                {factura.cubiertoPorEPS ? 'EPS' : 'Particular'}
              </Badge>
              {factura.epsAutorizacion && (
                <p className="text-sm text-gray-600 mt-2">Autorización: {factura.epsAutorizacion}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detalle de Items */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Detalle de Servicios</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tipo</TableHead>
                <TableHead>Descripción</TableHead>
                <TableHead className="text-center">Cant.</TableHead>
                <TableHead className="text-right">Valor Unit.</TableHead>
                <TableHead className="text-right">Desc.</TableHead>
                <TableHead className="text-right">Subtotal</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {factura.items?.map((item, index) => (
                <TableRow key={index}>
                  <TableCell>
                    <Badge variant="outline">{item.tipo}</Badge>
                  </TableCell>
                  <TableCell>{item.descripcion}</TableCell>
                  <TableCell className="text-center">{item.cantidad}</TableCell>
                  <TableCell className="text-right">{formatCurrency(item.precioUnitario)}</TableCell>
                  <TableCell className="text-right text-red-600">
                    {parseFloat(item.descuento) > 0 ? `-${formatCurrency(item.descuento)}` : '-'}
                  </TableCell>
                  <TableCell className="text-right font-medium">{formatCurrency(item.subtotal)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <div className="mt-6 space-y-2 border-t pt-4">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Subtotal:</span>
              <span className="font-medium">{formatCurrency(factura.subtotal)}</span>
            </div>
            {parseFloat(factura.descuentos) > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Descuentos:</span>
                <span className="font-medium text-red-600">-{formatCurrency(factura.descuentos)}</span>
              </div>
            )}
            {parseFloat(factura.impuestos) > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Impuestos:</span>
                <span className="font-medium">{formatCurrency(factura.impuestos)}</span>
              </div>
            )}
            <div className="flex justify-between text-lg font-bold pt-2 border-t">
              <span>TOTAL:</span>
              <span className="text-emerald-600">{formatCurrency(factura.total)}</span>
            </div>
            {parseFloat(factura.saldoPendiente) > 0 && (
              <div className="flex justify-between text-md font-medium pt-1">
                <span className="text-gray-600">Saldo Pendiente:</span>
                <span className="text-yellow-600">{formatCurrency(factura.saldoPendiente)}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Historial de Pagos */}
      {factura.pagos && factura.pagos.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Historial de Pagos</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Método</TableHead>
                  <TableHead>Referencia</TableHead>
                  <TableHead className="text-right">Monto</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {factura.pagos.map((pago, index) => (
                  <TableRow key={index}>
                    <TableCell>{formatDate(pago.fechaPago)}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{pago.metodoPago}</Badge>
                    </TableCell>
                    <TableCell>{pago.referencia || '-'}</TableCell>
                    <TableCell className="text-right font-medium text-green-600">
                      {formatCurrency(pago.monto)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Observaciones */}
      {factura.observaciones && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Observaciones</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-700">{factura.observaciones}</p>
          </CardContent>
        </Card>
      )}

      {/* Estado y Acciones */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Estado de la Factura</p>
              <Badge className={`mt-1 ${getEstadoColor(factura.estado)} text-lg px-3 py-1`}>
                {factura.estado}
              </Badge>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={descargarPDF}
                disabled={descargandoPDF}
              >
                {descargandoPDF ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generando...
                  </>
                ) : (
                  <>
                    <FileDown className="w-4 h-4 mr-2" />
                    Descargar PDF
                  </>
                )}
              </Button>
              {(factura.estado === 'Pendiente' || factura.estado === 'Parcial') && (
                <Button
                  className="bg-gradient-to-r from-green-600 to-emerald-700"
                  onClick={onRegistrarPago}
                >
                  <CreditCard className="w-4 h-4 mr-2" />
                  Registrar Pago
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
