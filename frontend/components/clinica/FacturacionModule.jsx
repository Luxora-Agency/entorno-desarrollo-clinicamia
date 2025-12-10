'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
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
  Calendar,
  Filter,
} from 'lucide-react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function FacturacionModule({ user }) {
  const [activeTab, setActiveTab] = useState('facturas');
  const [showNewFactura, setShowNewFactura] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [selectedFactura, setSelectedFactura] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Datos mockeados de facturas
  const [facturas, setFacturas] = useState([
    {
      id: 'FACT-2025-001',
      paciente: { nombre: 'María González', cedula: '1234567890', eps: 'Sanitas EPS' },
      fecha: '2025-01-15',
      fechaVencimiento: '2025-02-14',
      servicios: [
        { concepto: 'Consulta Medicina General', cantidad: 1, valorUnitario: 45000, total: 45000 },
        { concepto: 'Hemograma Completo', cantidad: 1, valorUnitario: 35000, total: 35000 },
        { concepto: 'Radiografía de Tórax', cantidad: 1, valorUnitario: 65000, total: 65000 },
      ],
      subtotal: 145000,
      descuento: 0,
      iva: 0,
      total: 145000,
      estado: 'Pendiente',
      tipoPago: 'EPS',
      observaciones: 'Factura generada automáticamente desde admisión',
    },
    {
      id: 'FACT-2025-002',
      paciente: { nombre: 'Juan Pérez', cedula: '9876543210', eps: 'Particular' },
      fecha: '2025-01-14',
      fechaVencimiento: '2025-02-13',
      servicios: [
        { concepto: 'Consulta Especializada Cardiología', cantidad: 1, valorUnitario: 85000, total: 85000 },
        { concepto: 'Electrocardiograma', cantidad: 1, valorUnitario: 55000, total: 55000 },
        { concepto: 'Ecocardiograma', cantidad: 1, valorUnitario: 180000, total: 180000 },
      ],
      subtotal: 320000,
      descuento: 32000,
      iva: 0,
      total: 288000,
      estado: 'Pagada',
      tipoPago: 'Particular',
      formaPago: 'Tarjeta de Crédito',
      fechaPago: '2025-01-14',
      observaciones: '10% descuento por pago inmediato',
    },
    {
      id: 'FACT-2025-003',
      paciente: { nombre: 'Laura Rodríguez', cedula: '4567891230', eps: 'Compensar EPS' },
      fecha: '2025-01-13',
      fechaVencimiento: '2025-02-12',
      servicios: [
        { concepto: 'Hospitalización 3 días', cantidad: 3, valorUnitario: 150000, total: 450000 },
        { concepto: 'Medicamentos', cantidad: 1, valorUnitario: 85000, total: 85000 },
        { concepto: 'Procedimientos', cantidad: 2, valorUnitario: 75000, total: 150000 },
      ],
      subtotal: 685000,
      descuento: 0,
      iva: 0,
      total: 685000,
      estado: 'Aprobada',
      tipoPago: 'EPS',
      observaciones: 'Factura aprobada por EPS',
    },
    {
      id: 'FACT-2025-004',
      paciente: { nombre: 'Pedro Martínez', cedula: '7891234560', eps: 'Sura EPS' },
      fecha: '2025-01-12',
      fechaVencimiento: '2025-02-11',
      servicios: [
        { concepto: 'Cirugía Apendicectomía', cantidad: 1, valorUnitario: 2500000, total: 2500000 },
        { concepto: 'Honorarios Médicos', cantidad: 1, valorUnitario: 800000, total: 800000 },
        { concepto: 'Insumos Quirúrgicos', cantidad: 1, valorUnitario: 450000, total: 450000 },
        { concepto: 'Hospitalización UCI 2 días', cantidad: 2, valorUnitario: 350000, total: 700000 },
      ],
      subtotal: 4450000,
      descuento: 0,
      iva: 0,
      total: 4450000,
      estado: 'Pendiente',
      tipoPago: 'EPS',
      observaciones: 'Paquete quirúrgico estándar',
    },
    {
      id: 'FACT-2025-005',
      paciente: { nombre: 'Ana Martínez', cedula: '3216549870', eps: 'Particular' },
      fecha: '2025-01-11',
      fechaVencimiento: '2025-02-10',
      servicios: [
        { concepto: 'Control Prenatal', cantidad: 1, valorUnitario: 65000, total: 65000 },
        { concepto: 'Ecografía Obstétrica', cantidad: 1, valorUnitario: 95000, total: 95000 },
        { concepto: 'Laboratorios', cantidad: 1, valorUnitario: 120000, total: 120000 },
      ],
      subtotal: 280000,
      descuento: 0,
      iva: 0,
      total: 280000,
      estado: 'Vencida',
      tipoPago: 'Particular',
      observaciones: 'Paciente sin respuesta',
    },
  ]);

  // Datos para gráficas
  const ventasMensuales = [
    { mes: 'Jul', monto: 12500000 },
    { mes: 'Ago', monto: 15300000 },
    { mes: 'Sep', monto: 14800000 },
    { mes: 'Oct', monto: 16200000 },
    { mes: 'Nov', monto: 18500000 },
    { mes: 'Dic', monto: 21000000 },
    { mes: 'Ene', monto: 19800000 },
  ];

  const distribucionEPS = [
    { name: 'Sanitas', value: 35, monto: 6930000 },
    { name: 'Compensar', value: 25, monto: 4950000 },
    { name: 'Sura', value: 20, monto: 3960000 },
    { name: 'Particular', value: 15, monto: 2970000 },
    { name: 'Otros', value: 5, monto: 990000 },
  ];

  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ef4444'];

  const getEstadoColor = (estado) => {
    switch (estado) {
      case 'Pendiente': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'Pagada': return 'bg-green-100 text-green-800 border-green-300';
      case 'Aprobada': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'Vencida': return 'bg-red-100 text-red-800 border-red-300';
      case 'Anulada': return 'bg-gray-100 text-gray-800 border-gray-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const facturasFiltradas = facturas.filter(f => {
    const matchSearch = searchTerm === '' ||
      f.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.paciente.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.paciente.cedula.includes(searchTerm);
    
    const matchTab = 
      (activeTab === 'facturas') ||
      (activeTab === 'pendientes' && f.estado === 'Pendiente') ||
      (activeTab === 'pagadas' && f.estado === 'Pagada');
    
    return matchSearch && matchTab;
  });

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(value);
  };

  // Calcular totales
  const totalFacturado = facturas.reduce((sum, f) => sum + f.total, 0);
  const totalPendiente = facturas.filter(f => f.estado === 'Pendiente').reduce((sum, f) => sum + f.total, 0);
  const totalPagado = facturas.filter(f => f.estado === 'Pagada').reduce((sum, f) => sum + f.total, 0);

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
            <Button variant="outline" className="border-emerald-600 text-emerald-600 hover:bg-emerald-50">
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
                <FormularioNuevaFactura onClose={() => setShowNewFactura(false)} />
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
                  <p className="text-2xl font-bold text-emerald-600">{formatCurrency(totalFacturado)}</p>
                  <p className="text-xs text-gray-500">Este mes</p>
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
                  <p className="text-2xl font-bold text-yellow-600">{formatCurrency(totalPendiente)}</p>
                  <p className="text-xs text-gray-500">{facturas.filter(f => f.estado === 'Pendiente').length} facturas</p>
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
                  <p className="text-2xl font-bold text-green-600">{formatCurrency(totalPagado)}</p>
                  <p className="text-xs text-gray-500">{facturas.filter(f => f.estado === 'Pagada').length} facturas</p>
                </div>
                <Check className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-blue-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Cartera</p>
                  <p className="text-2xl font-bold text-blue-600">45 días</p>
                  <p className="text-xs text-gray-500">Promedio cobro</p>
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
              <CardTitle className="text-lg">Ingresos Mensuales</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={ventasMensuales}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="mes" />
                  <YAxis />
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                  <Legend />
                  <Line type="monotone" dataKey="monto" stroke="#10b981" strokeWidth={2} name="Ingresos" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Distribución por EPS</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={distribucionEPS}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {distribucionEPS.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `${value}%`} />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-4 grid grid-cols-2 gap-2">
                {distribucionEPS.map((item, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index] }} />
                    <span className="text-xs text-gray-600">{item.name}: {formatCurrency(item.monto)}</span>
                  </div>
                ))}
              </div>
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
                  placeholder="Buscar por ID, paciente o cédula..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1"
                />
              </div>
              <Select defaultValue="todos">
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todas las EPS</SelectItem>
                  <SelectItem value="sanitas">Sanitas</SelectItem>
                  <SelectItem value="compensar">Compensar</SelectItem>
                  <SelectItem value="sura">Sura</SelectItem>
                  <SelectItem value="particular">Particular</SelectItem>
                </SelectContent>
              </Select>
              <Select defaultValue="mes">
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hoy">Hoy</SelectItem>
                  <SelectItem value="semana">Esta Semana</SelectItem>
                  <SelectItem value="mes">Este Mes</SelectItem>
                  <SelectItem value="trimestre">Trimestre</SelectItem>
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
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID Factura</TableHead>
                      <TableHead>Paciente</TableHead>
                      <TableHead>EPS/Pagador</TableHead>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Servicios</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {facturasFiltradas.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center text-gray-500 py-8">
                          No se encontraron facturas
                        </TableCell>
                      </TableRow>
                    ) : (
                      facturasFiltradas.map((factura) => (
                        <TableRow key={factura.id}>
                          <TableCell className="font-medium">{factura.id}</TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{factura.paciente.nombre}</p>
                              <p className="text-xs text-gray-500">CC: {factura.paciente.cedula}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Building2 className="w-4 h-4 text-gray-400" />
                              <span className="text-sm">{factura.paciente.eps}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm">{factura.fecha}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{factura.servicios.length} servicios</Badge>
                          </TableCell>
                          <TableCell className="font-semibold text-emerald-700">
                            {formatCurrency(factura.total)}
                          </TableCell>
                          <TableCell>
                            <Badge className={getEstadoColor(factura.estado)}>
                              {factura.estado}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedFactura(factura);
                                  setShowPreview(true);
                                }}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button size="sm" variant="outline">
                                <Download className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Dialog de Preview */}
        <Dialog open={showPreview} onOpenChange={setShowPreview}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Vista Previa de Factura</DialogTitle>
            </DialogHeader>
            {selectedFactura && (
              <PreviewFactura factura={selectedFactura} formatCurrency={formatCurrency} />
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

// Componente de Formulario de Nueva Factura
function FormularioNuevaFactura({ onClose }) {
  const handleSubmit = (e) => {
    e.preventDefault();
    alert('Factura creada exitosamente (mockup)');
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Paciente *</Label>
          <Input placeholder="Buscar paciente..." required />
        </div>
        <div>
          <Label>Tipo de Pagador *</Label>
          <Select required>
            <SelectTrigger>
              <SelectValue placeholder="Seleccione..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="eps">EPS</SelectItem>
              <SelectItem value="particular">Particular</SelectItem>
              <SelectItem value="aseguradora">Aseguradora</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Servicios</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="grid grid-cols-4 gap-2 text-sm font-medium text-gray-600 pb-2 border-b">
            <span>Concepto</span>
            <span>Cantidad</span>
            <span>Valor Unit.</span>
            <span>Total</span>
          </div>
          <div className="grid grid-cols-4 gap-2">
            <Input placeholder="Servicio/Producto" />
            <Input type="number" placeholder="1" />
            <Input type="number" placeholder="0" />
            <Input disabled placeholder="0" />
          </div>
          <Button type="button" variant="outline" size="sm" className="w-full">
            <Plus className="w-4 h-4 mr-2" />
            Agregar Servicio
          </Button>
        </CardContent>
      </Card>

      <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
        <div>
          <Label className="text-sm">Subtotal</Label>
          <p className="text-lg font-bold">$0</p>
        </div>
        <div>
          <Label className="text-sm">Descuento</Label>
          <Input type="number" placeholder="0" className="mt-1" />
        </div>
        <div>
          <Label className="text-sm">Total</Label>
          <p className="text-xl font-bold text-emerald-600">$0</p>
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancelar
        </Button>
        <Button type="submit" className="bg-gradient-to-r from-emerald-600 to-teal-700">
          Generar Factura
        </Button>
      </div>
    </form>
  );
}

// Componente de Preview de Factura
function PreviewFactura({ factura, formatCurrency }) {
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
                {factura.id}
              </Badge>
              <p className="text-sm text-gray-600">Fecha: {factura.fecha}</p>
              <p className="text-sm text-gray-600">Vence: {factura.fechaVencimiento}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6 p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-2">Facturar a:</p>
              <p className="font-medium">{factura.paciente.nombre}</p>
              <p className="text-sm text-gray-600">CC: {factura.paciente.cedula}</p>
              <p className="text-sm text-gray-600">EPS: {factura.paciente.eps}</p>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-2">Tipo de Pago:</p>
              <Badge className={factura.tipoPago === 'EPS' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'}>
                {factura.tipoPago}
              </Badge>
              {factura.formaPago && (
                <p className="text-sm text-gray-600 mt-2">Forma: {factura.formaPago}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detalle de Servicios */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Detalle de Servicios</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Concepto</TableHead>
                <TableHead className="text-center">Cantidad</TableHead>
                <TableHead className="text-right">Valor Unitario</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {factura.servicios.map((servicio, index) => (
                <TableRow key={index}>
                  <TableCell>{servicio.concepto}</TableCell>
                  <TableCell className="text-center">{servicio.cantidad}</TableCell>
                  <TableCell className="text-right">{formatCurrency(servicio.valorUnitario)}</TableCell>
                  <TableCell className="text-right font-medium">{formatCurrency(servicio.total)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <div className="mt-6 space-y-2 border-t pt-4">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Subtotal:</span>
              <span className="font-medium">{formatCurrency(factura.subtotal)}</span>
            </div>
            {factura.descuento > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Descuento:</span>
                <span className="font-medium text-red-600">-{formatCurrency(factura.descuento)}</span>
              </div>
            )}
            <div className="flex justify-between text-lg font-bold pt-2 border-t">
              <span>TOTAL:</span>
              <span className="text-emerald-600">{formatCurrency(factura.total)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

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

      {/* Estado */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Estado de la Factura</p>
              <Badge className={`mt-1 ${
                factura.estado === 'Pagada' ? 'bg-green-100 text-green-800' :
                factura.estado === 'Pendiente' ? 'bg-yellow-100 text-yellow-800' :
                factura.estado === 'Aprobada' ? 'bg-blue-100 text-blue-800' :
                'bg-red-100 text-red-800'
              } text-lg px-3 py-1`}>
                {factura.estado}
              </Badge>
              {factura.fechaPago && (
                <p className="text-xs text-gray-500 mt-1">Pagada el: {factura.fechaPago}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        <Button variant="outline">
          <Download className="w-4 h-4 mr-2" />
          Descargar PDF
        </Button>
        <Button variant="outline">
          <FileText className="w-4 h-4 mr-2" />
          Generar RIPS
        </Button>
        {factura.estado === 'Pendiente' && (
          <Button className="bg-gradient-to-r from-emerald-600 to-teal-700">
            <Check className="w-4 h-4 mr-2" />
            Marcar como Pagada
          </Button>
        )}
      </div>
    </div>
  );
}
