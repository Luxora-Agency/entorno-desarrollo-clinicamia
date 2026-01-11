'use client';

import { useState, useEffect } from 'react';
import { useActivosFijos } from '@/hooks/useActivosFijos';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  Building2,
  Plus,
  Search,
  Calculator,
  Wrench,
  TrendingDown,
  AlertTriangle,
  FileText,
  RefreshCw,
  DollarSign,
  Calendar
} from 'lucide-react';
import { toast } from 'sonner';

export default function ActivosFijosModule() {
  const {
    activos,
    dashboard,
    loading,
    fetchActivos,
    fetchDashboard,
    fetchTipos,
    crearActivo,
    ejecutarDepreciacion,
    fetchDepreciaciones,
    registrarMantenimiento,
    fetchMantenimientosPendientes
  } = useActivosFijos();

  const [activeTab, setActiveTab] = useState('lista');
  const [tiposActivo, setTiposActivo] = useState([]);
  const [filtroTipo, setFiltroTipo] = useState('all');
  const [filtroEstado, setFiltroEstado] = useState('all');
  const [busqueda, setBusqueda] = useState('');
  const [showNuevoActivo, setShowNuevoActivo] = useState(false);
  const [showDepreciacion, setShowDepreciacion] = useState(false);
  const [showMantenimiento, setShowMantenimiento] = useState(false);
  const [activoSeleccionado, setActivoSeleccionado] = useState(null);
  const [depreciacionesPeriodo, setDepreciacionesPeriodo] = useState(null);
  const [mantenimientosPendientes, setMantenimientosPendientes] = useState([]);

  // Formulario nuevo activo
  const [nuevoActivo, setNuevoActivo] = useState({
    codigo: '',
    nombre: '',
    descripcion: '',
    tipo: '',
    grupo: '',
    ubicacionFisica: '',
    valorAdquisicion: '',
    fechaAdquisicion: '',
    vidaUtilAnios: '',
    valorResidual: ''
  });

  // Período para depreciación
  const [periodoDepreciacion, setPeriodoDepreciacion] = useState(() => {
    const hoy = new Date();
    return `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}`;
  });

  // Cargar datos iniciales
  useEffect(() => {
    fetchActivos();
    fetchDashboard();
    fetchTipos().then(setTiposActivo);
    fetchMantenimientosPendientes().then(setMantenimientosPendientes);
  }, []);

  // Filtrar activos
  useEffect(() => {
    fetchActivos({
      tipo: filtroTipo !== 'all' ? filtroTipo : undefined,
      estado: filtroEstado !== 'all' ? filtroEstado : undefined,
      search: busqueda || undefined
    });
  }, [filtroTipo, filtroEstado, busqueda]);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(value || 0);
  };

  const handleCrearActivo = async () => {
    try {
      await crearActivo({
        ...nuevoActivo,
        valorAdquisicion: parseFloat(nuevoActivo.valorAdquisicion),
        valorResidual: parseFloat(nuevoActivo.valorResidual) || 0,
        vidaUtilAnios: parseInt(nuevoActivo.vidaUtilAnios)
      });
      setShowNuevoActivo(false);
      setNuevoActivo({
        codigo: '', nombre: '', descripcion: '', tipo: '', grupo: '',
        ubicacionFisica: '', valorAdquisicion: '', fechaAdquisicion: '',
        vidaUtilAnios: '', valorResidual: ''
      });
      fetchDashboard();
    } catch (err) {
      // Error ya mostrado por el hook
    }
  };

  const handleEjecutarDepreciacion = async () => {
    try {
      const resultado = await ejecutarDepreciacion(periodoDepreciacion);
      setDepreciacionesPeriodo(resultado);
      setShowDepreciacion(false);
    } catch (err) {
      // Error ya mostrado por el hook
    }
  };

  const handleConsultarDepreciacion = async () => {
    const data = await fetchDepreciaciones(periodoDepreciacion);
    setDepreciacionesPeriodo(data);
  };

  const getEstadoBadge = (estado) => {
    const variants = {
      'Activo': 'default',
      'Dado de baja': 'destructive',
      'En mantenimiento': 'warning'
    };
    return <Badge variant={variants[estado] || 'secondary'}>{estado}</Badge>;
  };

  const getTipoBadge = (tipo) => {
    const colors = {
      'EquipoMedico': 'bg-blue-100 text-blue-800',
      'Mobiliario': 'bg-amber-100 text-amber-800',
      'Vehiculo': 'bg-green-100 text-green-800',
      'Inmueble': 'bg-purple-100 text-purple-800',
      'Tecnologia': 'bg-cyan-100 text-cyan-800'
    };
    return <span className={`px-2 py-1 rounded text-xs ${colors[tipo] || 'bg-gray-100'}`}>{tipo}</span>;
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Building2 className="h-6 w-6" />
            Activos Fijos
          </h1>
          <p className="text-muted-foreground">
            Gestión de equipos, depreciación y mantenimientos
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowDepreciacion(true)}>
            <Calculator className="h-4 w-4 mr-2" />
            Depreciación
          </Button>
          <Button onClick={() => setShowNuevoActivo(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Activo
          </Button>
        </div>
      </div>

      {/* KPIs Dashboard */}
      {dashboard && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Activos</p>
                  <p className="text-2xl font-bold">{dashboard.resumen?.totalActivos || 0}</p>
                </div>
                <Building2 className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Valor Adquisición</p>
                  <p className="text-2xl font-bold">{formatCurrency(dashboard.resumen?.valorAdquisicionTotal)}</p>
                </div>
                <DollarSign className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Depreciación Acum.</p>
                  <p className="text-2xl font-bold">{formatCurrency(dashboard.resumen?.depreciacionAcumuladaTotal)}</p>
                </div>
                <TrendingDown className="h-8 w-8 text-red-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Valor en Libros</p>
                  <p className="text-2xl font-bold">{formatCurrency(dashboard.resumen?.valorEnLibrosTotal)}</p>
                </div>
                <FileText className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Alertas de mantenimiento */}
      {mantenimientosPendientes.length > 0 && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
              <span className="font-medium text-amber-800">
                {mantenimientosPendientes.length} activo(s) requieren mantenimiento
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="lista">Lista de Activos</TabsTrigger>
          <TabsTrigger value="depreciacion">Depreciación</TabsTrigger>
          <TabsTrigger value="mantenimientos">Mantenimientos</TabsTrigger>
          <TabsTrigger value="reportes">Reportes</TabsTrigger>
        </TabsList>

        {/* Tab: Lista de Activos */}
        <TabsContent value="lista" className="space-y-4">
          {/* Filtros */}
          <Card>
            <CardContent className="pt-4">
              <div className="flex gap-4 flex-wrap">
                <div className="flex-1 min-w-[200px]">
                  <div className="relative">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar por código o nombre..."
                      className="pl-9"
                      value={busqueda}
                      onChange={(e) => setBusqueda(e.target.value)}
                    />
                  </div>
                </div>
                <Select value={filtroTipo} onValueChange={setFiltroTipo}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Tipo de activo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los tipos</SelectItem>
                    {tiposActivo.map(tipo => (
                      <SelectItem key={tipo.codigo} value={tipo.codigo}>{tipo.nombre}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={filtroEstado} onValueChange={setFiltroEstado}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="Activo">Activo</SelectItem>
                    <SelectItem value="Dado de baja">Dado de baja</SelectItem>
                    <SelectItem value="En mantenimiento">En mantenimiento</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" onClick={() => fetchActivos()}>
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Tabla de activos */}
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Valor Adq.</TableHead>
                  <TableHead>Dep. Acum.</TableHead>
                  <TableHead>Valor Libros</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activos.map(activo => (
                  <TableRow key={activo.id}>
                    <TableCell className="font-mono">{activo.codigo}</TableCell>
                    <TableCell>{activo.nombre}</TableCell>
                    <TableCell>{getTipoBadge(activo.tipo)}</TableCell>
                    <TableCell>{formatCurrency(activo.valorAdquisicion)}</TableCell>
                    <TableCell className="text-red-600">{formatCurrency(activo.depreciacionAcumulada)}</TableCell>
                    <TableCell className="font-medium">{formatCurrency(activo.valorEnLibros)}</TableCell>
                    <TableCell>{getEstadoBadge(activo.estado)}</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setActivoSeleccionado(activo);
                          setShowMantenimiento(true);
                        }}
                      >
                        <Wrench className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {activos.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      No hay activos fijos registrados
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* Tab: Depreciación */}
        <TabsContent value="depreciacion" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Consultar Depreciación por Período</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 items-end">
                <div>
                  <Label>Período (YYYY-MM)</Label>
                  <Input
                    type="month"
                    value={periodoDepreciacion}
                    onChange={(e) => setPeriodoDepreciacion(e.target.value)}
                    className="w-[200px]"
                  />
                </div>
                <Button onClick={handleConsultarDepreciacion}>
                  Consultar
                </Button>
                <Button variant="outline" onClick={() => setShowDepreciacion(true)}>
                  <Calculator className="h-4 w-4 mr-2" />
                  Ejecutar Depreciación
                </Button>
              </div>
            </CardContent>
          </Card>

          {depreciacionesPeriodo && (
            <Card>
              <CardHeader>
                <CardTitle>Depreciaciones - {depreciacionesPeriodo.periodo}</CardTitle>
                <CardDescription>
                  Total: {formatCurrency(depreciacionesPeriodo.totales?.totalDepreciacion)} |
                  Activos: {depreciacionesPeriodo.totales?.cantidad}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Código</TableHead>
                      <TableHead>Activo</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Depreciación</TableHead>
                      <TableHead>Acumulada</TableHead>
                      <TableHead>Valor Libros</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {depreciacionesPeriodo.detalle?.map(dep => (
                      <TableRow key={dep.id}>
                        <TableCell className="font-mono">{dep.activoFijo?.codigo}</TableCell>
                        <TableCell>{dep.activoFijo?.nombre}</TableCell>
                        <TableCell>{getTipoBadge(dep.activoFijo?.tipo)}</TableCell>
                        <TableCell className="text-red-600">{formatCurrency(dep.valorDepreciacion)}</TableCell>
                        <TableCell>{formatCurrency(dep.depreciacionAcumulada)}</TableCell>
                        <TableCell className="font-medium">{formatCurrency(dep.valorEnLibros)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Tab: Mantenimientos */}
        <TabsContent value="mantenimientos" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Activos Pendientes de Mantenimiento</CardTitle>
            </CardHeader>
            <CardContent>
              {mantenimientosPendientes.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Código</TableHead>
                      <TableHead>Activo</TableHead>
                      <TableHead>Próximo Mantenimiento</TableHead>
                      <TableHead>Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mantenimientosPendientes.map(activo => (
                      <TableRow key={activo.id}>
                        <TableCell className="font-mono">{activo.codigo}</TableCell>
                        <TableCell>{activo.nombre}</TableCell>
                        <TableCell>
                          <Badge variant="destructive">
                            {new Date(activo.proximoMantenimiento).toLocaleDateString('es-CO')}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            onClick={() => {
                              setActivoSeleccionado(activo);
                              setShowMantenimiento(true);
                            }}
                          >
                            <Wrench className="h-4 w-4 mr-2" />
                            Registrar
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-center py-8 text-muted-foreground">
                  No hay activos pendientes de mantenimiento
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Reportes */}
        <TabsContent value="reportes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Resumen por Tipo de Activo</CardTitle>
            </CardHeader>
            <CardContent>
              {dashboard?.activosPorTipo && (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Cantidad</TableHead>
                      <TableHead>Valor Adquisición</TableHead>
                      <TableHead>Dep. Acumulada</TableHead>
                      <TableHead>Valor en Libros</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dashboard.activosPorTipo.map(item => (
                      <TableRow key={item.tipo}>
                        <TableCell>{getTipoBadge(item.tipo)}</TableCell>
                        <TableCell>{item.cantidad}</TableCell>
                        <TableCell>{formatCurrency(item.valorAdquisicion)}</TableCell>
                        <TableCell className="text-red-600">{formatCurrency(item.depreciacionAcumulada)}</TableCell>
                        <TableCell className="font-medium">{formatCurrency(item.valorEnLibros)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog: Nuevo Activo */}
      <Dialog open={showNuevoActivo} onOpenChange={setShowNuevoActivo}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Registrar Nuevo Activo Fijo</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Código *</Label>
              <Input
                value={nuevoActivo.codigo}
                onChange={(e) => setNuevoActivo({...nuevoActivo, codigo: e.target.value})}
                placeholder="EQ-MED-001"
              />
            </div>
            <div>
              <Label>Nombre *</Label>
              <Input
                value={nuevoActivo.nombre}
                onChange={(e) => setNuevoActivo({...nuevoActivo, nombre: e.target.value})}
                placeholder="Nombre del activo"
              />
            </div>
            <div className="col-span-2">
              <Label>Descripción</Label>
              <Input
                value={nuevoActivo.descripcion}
                onChange={(e) => setNuevoActivo({...nuevoActivo, descripcion: e.target.value})}
                placeholder="Descripción detallada"
              />
            </div>
            <div>
              <Label>Tipo *</Label>
              <Select
                value={nuevoActivo.tipo}
                onValueChange={(v) => setNuevoActivo({...nuevoActivo, tipo: v})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar tipo" />
                </SelectTrigger>
                <SelectContent>
                  {tiposActivo.map(tipo => (
                    <SelectItem key={tipo.codigo} value={tipo.codigo}>
                      {tipo.nombre} ({tipo.vidaUtilSugerida} años)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Grupo Contable *</Label>
              <Input
                value={nuevoActivo.grupo}
                onChange={(e) => setNuevoActivo({...nuevoActivo, grupo: e.target.value})}
                placeholder="Equipos médicos"
              />
            </div>
            <div>
              <Label>Ubicación Física</Label>
              <Input
                value={nuevoActivo.ubicacionFisica}
                onChange={(e) => setNuevoActivo({...nuevoActivo, ubicacionFisica: e.target.value})}
                placeholder="Sala 101"
              />
            </div>
            <div>
              <Label>Fecha Adquisición *</Label>
              <Input
                type="date"
                value={nuevoActivo.fechaAdquisicion}
                onChange={(e) => setNuevoActivo({...nuevoActivo, fechaAdquisicion: e.target.value})}
              />
            </div>
            <div>
              <Label>Valor Adquisición *</Label>
              <Input
                type="number"
                value={nuevoActivo.valorAdquisicion}
                onChange={(e) => setNuevoActivo({...nuevoActivo, valorAdquisicion: e.target.value})}
                placeholder="0"
              />
            </div>
            <div>
              <Label>Valor Residual</Label>
              <Input
                type="number"
                value={nuevoActivo.valorResidual}
                onChange={(e) => setNuevoActivo({...nuevoActivo, valorResidual: e.target.value})}
                placeholder="0"
              />
            </div>
            <div>
              <Label>Vida Útil (años) *</Label>
              <Input
                type="number"
                value={nuevoActivo.vidaUtilAnios}
                onChange={(e) => setNuevoActivo({...nuevoActivo, vidaUtilAnios: e.target.value})}
                placeholder="10"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNuevoActivo(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCrearActivo} disabled={loading}>
              {loading ? 'Guardando...' : 'Guardar Activo'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Ejecutar Depreciación */}
      <Dialog open={showDepreciacion} onOpenChange={setShowDepreciacion}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ejecutar Depreciación Mensual</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Período</Label>
              <Input
                type="month"
                value={periodoDepreciacion}
                onChange={(e) => setPeriodoDepreciacion(e.target.value)}
              />
            </div>
            <p className="text-sm text-muted-foreground">
              Se calculará la depreciación de todos los activos activos para el período seleccionado.
              Esta acción no se puede deshacer.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDepreciacion(false)}>
              Cancelar
            </Button>
            <Button onClick={handleEjecutarDepreciacion} disabled={loading}>
              <Calculator className="h-4 w-4 mr-2" />
              {loading ? 'Procesando...' : 'Ejecutar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Registrar Mantenimiento */}
      <Dialog open={showMantenimiento} onOpenChange={setShowMantenimiento}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar Mantenimiento</DialogTitle>
          </DialogHeader>
          {activoSeleccionado && (
            <MantenimientoForm
              activo={activoSeleccionado}
              onSubmit={async (data) => {
                await registrarMantenimiento(activoSeleccionado.id, data);
                setShowMantenimiento(false);
                fetchMantenimientosPendientes().then(setMantenimientosPendientes);
              }}
              onCancel={() => setShowMantenimiento(false)}
              loading={loading}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Componente interno para formulario de mantenimiento
function MantenimientoForm({ activo, onSubmit, onCancel, loading }) {
  const [data, setData] = useState({
    tipo: '',
    descripcion: '',
    costo: '',
    fecha: new Date().toISOString().split('T')[0]
  });

  const handleSubmit = () => {
    if (!data.tipo || !data.descripcion) {
      toast.error('Complete los campos requeridos');
      return;
    }
    onSubmit({
      ...data,
      costo: parseFloat(data.costo) || 0
    });
  };

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm text-muted-foreground">Activo</p>
        <p className="font-medium">{activo.codigo} - {activo.nombre}</p>
      </div>
      <div>
        <Label>Tipo de Mantenimiento *</Label>
        <Select value={data.tipo} onValueChange={(v) => setData({...data, tipo: v})}>
          <SelectTrigger>
            <SelectValue placeholder="Seleccionar tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Preventivo">Preventivo</SelectItem>
            <SelectItem value="Correctivo">Correctivo</SelectItem>
            <SelectItem value="Calibración">Calibración</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>Descripción *</Label>
        <Input
          value={data.descripcion}
          onChange={(e) => setData({...data, descripcion: e.target.value})}
          placeholder="Descripción del mantenimiento realizado"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Fecha</Label>
          <Input
            type="date"
            value={data.fecha}
            onChange={(e) => setData({...data, fecha: e.target.value})}
          />
        </div>
        <div>
          <Label>Costo</Label>
          <Input
            type="number"
            value={data.costo}
            onChange={(e) => setData({...data, costo: e.target.value})}
            placeholder="0"
          />
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onCancel}>Cancelar</Button>
        <Button onClick={handleSubmit} disabled={loading}>
          {loading ? 'Guardando...' : 'Guardar'}
        </Button>
      </DialogFooter>
    </div>
  );
}
