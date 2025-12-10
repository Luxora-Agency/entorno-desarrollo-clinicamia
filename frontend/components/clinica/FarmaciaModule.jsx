'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Pill,
  Plus,
  Search,
  FileText,
  AlertTriangle,
  Package,
  TrendingDown,
  TrendingUp,
  ShoppingCart,
  ClipboardList,
  Calendar,
  User,
  CheckCircle,
  XCircle,
  Clock,
  BarChart3,
  Download,
  Eye,
  Edit,
  Trash2,
} from 'lucide-react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function FarmaciaModule({ user }) {
  const [activeTab, setActiveTab] = useState('inventario');
  const [showNewMedicamento, setShowNewMedicamento] = useState(false);
  const [showDispensacion, setShowDispensacion] = useState(false);
  const [showMovimiento, setShowMovimiento] = useState(false);
  const [selectedMedicamento, setSelectedMedicamento] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Datos mockeados de inventario
  const [inventario, setInventario] = useState([
    {
      id: 'MED-001',
      nombre: 'Paracetamol',
      presentacion: '500mg Tabletas',
      lote: 'L2025-001',
      cantidad: 450,
      stockMinimo: 200,
      stockMaximo: 1000,
      ubicacion: 'Estante A-1',
      laboratorio: 'Farmacéuticos Unidos',
      fechaVencimiento: '2025-12-31',
      precioUnitario: 0.50,
      estado: 'Normal',
      categoria: 'Analgésicos',
    },
    {
      id: 'MED-002',
      nombre: 'Amoxicilina',
      presentacion: '500mg Cápsulas',
      lote: 'L2025-045',
      cantidad: 85,
      stockMinimo: 100,
      stockMaximo: 500,
      ubicacion: 'Estante B-3',
      laboratorio: 'Antibióticos S.A.',
      fechaVencimiento: '2025-08-15',
      precioUnitario: 1.20,
      estado: 'Bajo',
      categoria: 'Antibióticos',
    },
    {
      id: 'MED-003',
      nombre: 'Losartán',
      presentacion: '50mg Tabletas',
      lote: 'L2025-078',
      cantidad: 320,
      stockMinimo: 150,
      stockMaximo: 600,
      ubicacion: 'Estante C-2',
      laboratorio: 'CardioFarma',
      fechaVencimiento: '2026-03-20',
      precioUnitario: 0.85,
      estado: 'Normal',
      categoria: 'Antihipertensivos',
    },
    {
      id: 'MED-004',
      nombre: 'Insulina Glargina',
      presentacion: '100 UI/mL Vial 10mL',
      lote: 'L2025-112',
      cantidad: 25,
      stockMinimo: 30,
      stockMaximo: 100,
      ubicacion: 'Refrigerador R-1',
      laboratorio: 'DiabetesCare',
      fechaVencimiento: '2025-06-30',
      precioUnitario: 45.00,
      estado: 'Crítico',
      categoria: 'Antidiabéticos',
    },
    {
      id: 'MED-005',
      nombre: 'Omeprazol',
      presentacion: '20mg Cápsulas',
      lote: 'L2025-089',
      cantidad: 510,
      stockMinimo: 200,
      stockMaximo: 800,
      ubicacion: 'Estante A-4',
      laboratorio: 'GastroLab',
      fechaVencimiento: '2026-01-15',
      precioUnitario: 0.65,
      estado: 'Normal',
      categoria: 'Antiulcerosos',
    },
    {
      id: 'MED-006',
      nombre: 'Salbutamol',
      presentacion: '100mcg Inhalador',
      lote: 'L2025-156',
      cantidad: 42,
      stockMinimo: 50,
      stockMaximo: 200,
      ubicacion: 'Estante D-1',
      laboratorio: 'RespiraPlus',
      fechaVencimiento: '2025-11-30',
      precioUnitario: 8.50,
      estado: 'Bajo',
      categoria: 'Broncodilatadores',
    },
    {
      id: 'MED-007',
      nombre: 'Metformina',
      presentacion: '850mg Tabletas',
      lote: 'L2025-203',
      cantidad: 680,
      stockMinimo: 250,
      stockMaximo: 1000,
      ubicacion: 'Estante C-3',
      laboratorio: 'DiabetesCare',
      fechaVencimiento: '2026-04-10',
      precioUnitario: 0.40,
      estado: 'Normal',
      categoria: 'Antidiabéticos',
    },
    {
      id: 'MED-008',
      nombre: 'Diclofenaco',
      presentacion: '75mg Ampolla',
      lote: 'L2025-134',
      cantidad: 15,
      stockMinimo: 50,
      stockMaximo: 200,
      ubicacion: 'Estante E-2',
      laboratorio: 'AntiInflam',
      fechaVencimiento: '2025-07-20',
      precioUnitario: 2.30,
      estado: 'Crítico',
      categoria: 'Antiinflamatorios',
    },
  ]);

  // Datos de dispensaciones
  const [dispensaciones, setDispensaciones] = useState([
    {
      id: 'DISP-001',
      fecha: '2025-01-15 10:30',
      paciente: { nombre: 'María González', cedula: '1234567890' },
      prescripcion: 'PRESC-2025-045',
      medico: 'Dr. Carlos Méndez',
      medicamentos: [
        { nombre: 'Paracetamol 500mg', cantidad: 20, lote: 'L2025-001' },
        { nombre: 'Omeprazol 20mg', cantidad: 14, lote: 'L2025-089' },
      ],
      total: 19.10,
      estado: 'Entregado',
      responsable: 'Farm. Ana López',
    },
    {
      id: 'DISP-002',
      fecha: '2025-01-15 11:45',
      paciente: { nombre: 'Pedro Jiménez', cedula: '7891234560' },
      prescripcion: 'PRESC-2025-046',
      medico: 'Dra. Laura Ruiz',
      medicamentos: [
        { nombre: 'Metformina 850mg', cantidad: 60, lote: 'L2025-203' },
        { nombre: 'Losartán 50mg', cantidad: 30, lote: 'L2025-078' },
      ],
      total: 49.50,
      estado: 'Entregado',
      responsable: 'Farm. Roberto Silva',
    },
    {
      id: 'DISP-003',
      fecha: '2025-01-15 14:20',
      paciente: { nombre: 'Juan Pérez', cedula: '9876543210' },
      prescripcion: 'PRESC-2025-047',
      medico: 'Dr. Carlos Méndez',
      medicamentos: [
        { nombre: 'Amoxicilina 500mg', cantidad: 21, lote: 'L2025-045' },
      ],
      total: 25.20,
      estado: 'Pendiente',
      responsable: 'Farm. Ana López',
    },
  ]);

  // Datos de movimientos
  const [movimientos, setMovimientos] = useState([
    {
      id: 'MOV-001',
      fecha: '2025-01-15 08:00',
      tipo: 'Entrada',
      medicamento: 'Paracetamol 500mg',
      lote: 'L2025-001',
      cantidad: 500,
      origen: 'Proveedor: Distribuidora MediPharm',
      destino: 'Estante A-1',
      responsable: 'Farm. Roberto Silva',
      documento: 'FAC-2025-0456',
    },
    {
      id: 'MOV-002',
      fecha: '2025-01-15 10:30',
      tipo: 'Salida',
      medicamento: 'Paracetamol 500mg',
      lote: 'L2025-001',
      cantidad: 20,
      origen: 'Estante A-1',
      destino: 'Paciente: María González',
      responsable: 'Farm. Ana López',
      documento: 'DISP-001',
    },
    {
      id: 'MOV-003',
      fecha: '2025-01-15 09:15',
      tipo: 'Ajuste',
      medicamento: 'Insulina Glargina 100 UI/mL',
      lote: 'L2025-112',
      cantidad: -2,
      origen: 'Estante R-1',
      destino: 'Vencimiento/Daño',
      responsable: 'Farm. Roberto Silva',
      documento: 'ADJ-2025-012',
      observacion: '2 viales con temperatura inadecuada',
    },
    {
      id: 'MOV-004',
      fecha: '2025-01-15 11:45',
      tipo: 'Salida',
      medicamento: 'Metformina 850mg',
      lote: 'L2025-203',
      cantidad: 60,
      origen: 'Estante C-3',
      destino: 'Paciente: Pedro Jiménez',
      responsable: 'Farm. Roberto Silva',
      documento: 'DISP-002',
    },
    {
      id: 'MOV-005',
      fecha: '2025-01-14 16:30',
      tipo: 'Transferencia',
      medicamento: 'Amoxicilina 500mg',
      lote: 'L2025-045',
      cantidad: 100,
      origen: 'Bodega Principal',
      destino: 'Estante B-3',
      responsable: 'Farm. Ana López',
      documento: 'TRANS-2025-089',
    },
  ]);

  // Datos para gráficas
  const datosConsumoMensual = [
    { mes: 'Jul', cantidad: 3200 },
    { mes: 'Ago', cantidad: 3450 },
    { mes: 'Sep', cantidad: 3100 },
    { mes: 'Oct', cantidad: 3800 },
    { mes: 'Nov', cantidad: 3650 },
    { mes: 'Dic', cantidad: 4200 },
    { mes: 'Ene', cantidad: 3900 },
  ];

  const datosCategoria = [
    { nombre: 'Analgésicos', valor: 28 },
    { nombre: 'Antibióticos', valor: 22 },
    { nombre: 'Antihipertensivos', valor: 18 },
    { nombre: 'Antidiabéticos', valor: 15 },
    { nombre: 'Antiinflamatorios', valor: 10 },
    { nombre: 'Otros', valor: 7 },
  ];

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#6b7280'];

  const datosValorInventario = [
    { categoria: 'Analgésicos', valor: 12500 },
    { categoria: 'Antibióticos', valor: 18300 },
    { categoria: 'Antihipertensivos', valor: 15200 },
    { categoria: 'Antidiabéticos', valor: 28900 },
    { categoria: 'Antiinflamatorios', valor: 8400 },
    { categoria: 'Otros', valor: 6700 },
  ];

  // KPIs
  const totalMedicamentos = inventario.length;
  const medicamentosStockBajo = inventario.filter(m => m.estado === 'Bajo' || m.estado === 'Crítico').length;
  const valorTotalInventario = inventario.reduce((acc, med) => acc + (med.cantidad * med.precioUnitario), 0);
  const dispensacionesHoy = dispensaciones.filter(d => d.fecha.includes('2025-01-15')).length;
  const medicamentosPorVencer = inventario.filter(m => {
    const fechaVenc = new Date(m.fechaVencimiento);
    const hoy = new Date();
    const tresMeses = new Date(hoy.setMonth(hoy.getMonth() + 3));
    return fechaVenc <= tresMeses;
  }).length;

  const getEstadoBadgeClass = (estado) => {
    switch (estado) {
      case 'Normal':
        return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'Bajo':
        return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'Crítico':
        return 'bg-red-500/10 text-red-500 border-red-500/20';
      case 'Entregado':
        return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'Pendiente':
        return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      default:
        return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    }
  };

  const getTipoMovimientoBadge = (tipo) => {
    switch (tipo) {
      case 'Entrada':
        return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'Salida':
        return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'Ajuste':
        return 'bg-red-500/10 text-red-500 border-red-500/20';
      case 'Transferencia':
        return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
      default:
        return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    }
  };

  const filteredInventario = inventario.filter(med =>
    med.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    med.categoria.toLowerCase().includes(searchTerm.toLowerCase()) ||
    med.lote.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6 bg-background">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <Pill className="h-8 w-8 text-primary" />
            Farmacia
          </h1>
          <p className="text-muted-foreground mt-1">
            Gestión de inventario y dispensación de medicamentos
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog open={showNewMedicamento} onOpenChange={setShowNewMedicamento}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Nuevo Medicamento
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Agregar Nuevo Medicamento</DialogTitle>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-4 py-4">
                <div className="space-y-2">
                  <Label>Nombre del Medicamento</Label>
                  <Input placeholder="Ej: Ibuprofeno" />
                </div>
                <div className="space-y-2">
                  <Label>Presentación</Label>
                  <Input placeholder="Ej: 400mg Tabletas" />
                </div>
                <div className="space-y-2">
                  <Label>Categoría</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccione categoría" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="analgesicos">Analgésicos</SelectItem>
                      <SelectItem value="antibioticos">Antibióticos</SelectItem>
                      <SelectItem value="antihipertensivos">Antihipertensivos</SelectItem>
                      <SelectItem value="antidiabeticos">Antidiabéticos</SelectItem>
                      <SelectItem value="antiinflamatorios">Antiinflamatorios</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Laboratorio</Label>
                  <Input placeholder="Nombre del laboratorio" />
                </div>
                <div className="space-y-2">
                  <Label>Lote</Label>
                  <Input placeholder="Ej: L2025-001" />
                </div>
                <div className="space-y-2">
                  <Label>Cantidad</Label>
                  <Input type="number" placeholder="0" />
                </div>
                <div className="space-y-2">
                  <Label>Stock Mínimo</Label>
                  <Input type="number" placeholder="0" />
                </div>
                <div className="space-y-2">
                  <Label>Stock Máximo</Label>
                  <Input type="number" placeholder="0" />
                </div>
                <div className="space-y-2">
                  <Label>Ubicación</Label>
                  <Input placeholder="Ej: Estante A-1" />
                </div>
                <div className="space-y-2">
                  <Label>Fecha de Vencimiento</Label>
                  <Input type="date" />
                </div>
                <div className="space-y-2">
                  <Label>Precio Unitario</Label>
                  <Input type="number" step="0.01" placeholder="0.00" />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowNewMedicamento(false)}>
                  Cancelar
                </Button>
                <Button onClick={() => setShowNewMedicamento(false)}>
                  Guardar Medicamento
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Exportar
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Medicamentos</p>
                <p className="text-2xl font-bold text-foreground mt-1">{totalMedicamentos}</p>
              </div>
              <Package className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Stock Bajo</p>
                <p className="text-2xl font-bold text-red-500 mt-1">{medicamentosStockBajo}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Valor Inventario</p>
                <p className="text-2xl font-bold text-foreground mt-1">
                  ${valorTotalInventario.toLocaleString('es-CO', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <BarChart3 className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Dispensaciones Hoy</p>
                <p className="text-2xl font-bold text-foreground mt-1">{dispensacionesHoy}</p>
              </div>
              <ShoppingCart className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Por Vencer (3 meses)</p>
                <p className="text-2xl font-bold text-yellow-500 mt-1">{medicamentosPorVencer}</p>
              </div>
              <Calendar className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4 lg:w-auto">
          <TabsTrigger value="inventario" className="gap-2">
            <Package className="h-4 w-4" />
            Inventario
          </TabsTrigger>
          <TabsTrigger value="dispensacion" className="gap-2">
            <ShoppingCart className="h-4 w-4" />
            Dispensación
          </TabsTrigger>
          <TabsTrigger value="movimientos" className="gap-2">
            <ClipboardList className="h-4 w-4" />
            Movimientos
          </TabsTrigger>
          <TabsTrigger value="reportes" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            Reportes
          </TabsTrigger>
        </TabsList>

        {/* Tab: Inventario */}
        <TabsContent value="inventario" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <CardTitle>Control de Inventario</CardTitle>
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar medicamento..."
                    className="pl-8"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Código</TableHead>
                      <TableHead>Medicamento</TableHead>
                      <TableHead>Presentación</TableHead>
                      <TableHead>Lote</TableHead>
                      <TableHead>Cantidad</TableHead>
                      <TableHead>Ubicación</TableHead>
                      <TableHead>Vencimiento</TableHead>
                      <TableHead>Precio</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredInventario.map((med) => (
                      <TableRow key={med.id}>
                        <TableCell className="font-medium">{med.id}</TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{med.nombre}</p>
                            <p className="text-xs text-muted-foreground">{med.categoria}</p>
                          </div>
                        </TableCell>
                        <TableCell>{med.presentacion}</TableCell>
                        <TableCell>{med.lote}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">{med.cantidad}</span>
                            {med.cantidad < med.stockMinimo && (
                              <AlertTriangle className="h-4 w-4 text-red-500" />
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Min: {med.stockMinimo} | Max: {med.stockMaximo}
                          </p>
                        </TableCell>
                        <TableCell>{med.ubicacion}</TableCell>
                        <TableCell>{med.fechaVencimiento}</TableCell>
                        <TableCell>${med.precioUnitario.toFixed(2)}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={getEstadoBadgeClass(med.estado)}>
                            {med.estado}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button size="sm" variant="ghost">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="ghost">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Dispensación */}
        <TabsContent value="dispensacion" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <CardTitle>Registro de Dispensaciones</CardTitle>
                <Dialog open={showDispensacion} onOpenChange={setShowDispensacion}>
                  <DialogTrigger asChild>
                    <Button className="gap-2">
                      <Plus className="h-4 w-4" />
                      Nueva Dispensación
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Nueva Dispensación de Medicamentos</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Cédula del Paciente</Label>
                          <div className="flex gap-2">
                            <Input placeholder="Buscar paciente..." />
                            <Button variant="outline">
                              <Search className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label>Número de Prescripción</Label>
                          <Input placeholder="PRESC-2025-XXX" />
                        </div>
                      </div>
                      <div className="border rounded-lg p-4 space-y-2">
                        <h4 className="font-semibold">Información del Paciente</h4>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <p><span className="text-muted-foreground">Nombre:</span> -</p>
                          <p><span className="text-muted-foreground">Médico:</span> -</p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Medicamentos a Dispensar</Label>
                        <div className="border rounded-lg p-4">
                          <div className="flex gap-2 mb-2">
                            <Select>
                              <SelectTrigger className="flex-1">
                                <SelectValue placeholder="Seleccione medicamento" />
                              </SelectTrigger>
                              <SelectContent>
                                {inventario.map(med => (
                                  <SelectItem key={med.id} value={med.id}>
                                    {med.nombre} - {med.presentacion} (Stock: {med.cantidad})
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Input type="number" placeholder="Cant." className="w-24" />
                            <Button>Agregar</Button>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            No hay medicamentos agregados
                          </div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Observaciones</Label>
                        <Textarea placeholder="Instrucciones adicionales..." rows={3} />
                      </div>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setShowDispensacion(false)}>
                        Cancelar
                      </Button>
                      <Button onClick={() => setShowDispensacion(false)}>
                        Registrar Dispensación
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Fecha/Hora</TableHead>
                      <TableHead>Paciente</TableHead>
                      <TableHead>Prescripción</TableHead>
                      <TableHead>Médico</TableHead>
                      <TableHead>Medicamentos</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Responsable</TableHead>
                      <TableHead>Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dispensaciones.map((disp) => (
                      <TableRow key={disp.id}>
                        <TableCell className="font-medium">{disp.id}</TableCell>
                        <TableCell>{disp.fecha}</TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{disp.paciente.nombre}</p>
                            <p className="text-xs text-muted-foreground">{disp.paciente.cedula}</p>
                          </div>
                        </TableCell>
                        <TableCell>{disp.prescripcion}</TableCell>
                        <TableCell>{disp.medico}</TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            {disp.medicamentos.map((med, idx) => (
                              <div key={idx} className="text-sm">
                                <p className="font-medium">{med.nombre}</p>
                                <p className="text-xs text-muted-foreground">
                                  Cant: {med.cantidad} | Lote: {med.lote}
                                </p>
                              </div>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell className="font-semibold">
                          ${disp.total.toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={getEstadoBadgeClass(disp.estado)}>
                            {disp.estado}
                          </Badge>
                        </TableCell>
                        <TableCell>{disp.responsable}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button size="sm" variant="ghost">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="ghost">
                              <Download className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Movimientos */}
        <TabsContent value="movimientos" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <CardTitle>Historial de Movimientos</CardTitle>
                <Dialog open={showMovimiento} onOpenChange={setShowMovimiento}>
                  <DialogTrigger asChild>
                    <Button className="gap-2">
                      <Plus className="h-4 w-4" />
                      Registrar Movimiento
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Registrar Movimiento de Inventario</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Tipo de Movimiento</Label>
                          <Select>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccione tipo" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="entrada">Entrada</SelectItem>
                              <SelectItem value="salida">Salida</SelectItem>
                              <SelectItem value="ajuste">Ajuste</SelectItem>
                              <SelectItem value="transferencia">Transferencia</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Medicamento</Label>
                          <Select>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccione medicamento" />
                            </SelectTrigger>
                            <SelectContent>
                              {inventario.map(med => (
                                <SelectItem key={med.id} value={med.id}>
                                  {med.nombre} - {med.presentacion}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Cantidad</Label>
                          <Input type="number" placeholder="0" />
                        </div>
                        <div className="space-y-2">
                          <Label>Lote</Label>
                          <Input placeholder="L2025-XXX" />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Origen</Label>
                          <Input placeholder="Ej: Proveedor, Estante A-1" />
                        </div>
                        <div className="space-y-2">
                          <Label>Destino</Label>
                          <Input placeholder="Ej: Estante A-1, Paciente" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Número de Documento</Label>
                        <Input placeholder="Ej: FAC-2025-0001" />
                      </div>
                      <div className="space-y-2">
                        <Label>Observaciones</Label>
                        <Textarea placeholder="Detalles adicionales..." rows={3} />
                      </div>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setShowMovimiento(false)}>
                        Cancelar
                      </Button>
                      <Button onClick={() => setShowMovimiento(false)}>
                        Registrar Movimiento
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Fecha/Hora</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Medicamento</TableHead>
                      <TableHead>Lote</TableHead>
                      <TableHead>Cantidad</TableHead>
                      <TableHead>Origen</TableHead>
                      <TableHead>Destino</TableHead>
                      <TableHead>Responsable</TableHead>
                      <TableHead>Documento</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {movimientos.map((mov) => (
                      <TableRow key={mov.id}>
                        <TableCell className="font-medium">{mov.id}</TableCell>
                        <TableCell>{mov.fecha}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={getTipoMovimientoBadge(mov.tipo)}>
                            {mov.tipo}
                          </Badge>
                        </TableCell>
                        <TableCell>{mov.medicamento}</TableCell>
                        <TableCell>{mov.lote}</TableCell>
                        <TableCell>
                          <span className={mov.cantidad < 0 ? 'text-red-500 font-semibold' : 'text-green-500 font-semibold'}>
                            {mov.cantidad > 0 ? '+' : ''}{mov.cantidad}
                          </span>
                        </TableCell>
                        <TableCell className="text-sm">{mov.origen}</TableCell>
                        <TableCell className="text-sm">{mov.destino}</TableCell>
                        <TableCell>{mov.responsable}</TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium text-sm">{mov.documento}</p>
                            {mov.observacion && (
                              <p className="text-xs text-muted-foreground">{mov.observacion}</p>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Reportes */}
        <TabsContent value="reportes" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Consumo Mensual de Medicamentos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={datosConsumoMensual}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="mes" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '6px',
                      }}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="cantidad"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      name="Unidades Dispensadas"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-primary" />
                  Distribución por Categoría
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={datosCategoria}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ nombre, valor }) => `${nombre}: ${valor}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="valor"
                    >
                      {datosCategoria.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  Valor del Inventario por Categoría
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={datosValorInventario}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="categoria" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '6px',
                      }}
                      formatter={(value) => `$${value.toLocaleString('es-CO')}`}
                    />
                    <Legend />
                    <Bar dataKey="valor" fill="#10b981" name="Valor en Inventario ($)" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Alertas y Recomendaciones */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
                Alertas y Recomendaciones
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {inventario
                  .filter(med => med.estado === 'Crítico' || med.estado === 'Bajo')
                  .map((med) => (
                    <div
                      key={med.id}
                      className="flex items-start gap-3 p-3 border rounded-lg bg-yellow-500/5"
                    >
                      <AlertTriangle className={`h-5 w-5 mt-0.5 ${med.estado === 'Crítico' ? 'text-red-500' : 'text-yellow-500'}`} />
                      <div className="flex-1">
                        <p className="font-semibold">
                          {med.nombre} - {med.presentacion}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Stock actual: {med.cantidad} unidades | Stock mínimo: {med.stockMinimo} unidades
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Ubicación: {med.ubicacion} | Lote: {med.lote}
                        </p>
                      </div>
                      <Badge variant="outline" className={getEstadoBadgeClass(med.estado)}>
                        {med.estado}
                      </Badge>
                    </div>
                  ))}
                {medicamentosPorVencer > 0 && (
                  <div className="flex items-start gap-3 p-3 border rounded-lg bg-orange-500/5">
                    <Calendar className="h-5 w-5 mt-0.5 text-orange-500" />
                    <div className="flex-1">
                      <p className="font-semibold">Medicamentos próximos a vencer</p>
                      <p className="text-sm text-muted-foreground">
                        {medicamentosPorVencer} medicamento(s) vencerán en los próximos 3 meses. Revisar inventario.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
