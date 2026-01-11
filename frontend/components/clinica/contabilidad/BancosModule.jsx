'use client';

import { useState, useEffect } from 'react';
import { useBancos } from '@/hooks/useBancos';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  Landmark,
  Plus,
  RefreshCw,
  ArrowUpCircle,
  ArrowDownCircle,
  CheckCircle2,
  Clock,
  FileText,
  TrendingUp,
  TrendingDown,
  Wallet,
  Building2,
  Calendar,
  Search
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function BancosModule({ user }) {
  const {
    cuentas,
    cuentaActual,
    movimientos,
    dashboard,
    loading,
    fetchCuentas,
    fetchCuenta,
    crearCuenta,
    fetchMovimientos,
    crearMovimiento,
    fetchDashboard,
    iniciarConciliacion,
    fetchHistorialConciliaciones,
    formatCurrency
  } = useBancos();

  const [activeTab, setActiveTab] = useState('cuentas');
  const [showNewCuentaDialog, setShowNewCuentaDialog] = useState(false);
  const [showNewMovimientoDialog, setShowNewMovimientoDialog] = useState(false);
  const [selectedCuenta, setSelectedCuenta] = useState(null);
  const [filtros, setFiltros] = useState({
    fechaInicio: '',
    fechaFin: '',
    conciliado: 'all'
  });

  const [nuevaCuenta, setNuevaCuenta] = useState({
    banco: '',
    tipoCuenta: 'AHORROS',
    numeroCuenta: '',
    nombreCuenta: '',
    saldoInicial: 0
  });

  const [nuevoMovimiento, setNuevoMovimiento] = useState({
    tipo: 'CREDITO',
    descripcion: '',
    monto: 0,
    referencia: '',
    fecha: format(new Date(), 'yyyy-MM-dd')
  });

  useEffect(() => {
    fetchCuentas();
    fetchDashboard();
  }, []);

  useEffect(() => {
    if (selectedCuenta) {
      const apiFilters = {
        fechaInicio: filtros.fechaInicio || undefined,
        fechaFin: filtros.fechaFin || undefined,
        conciliado: filtros.conciliado !== 'all' ? filtros.conciliado : undefined
      };
      fetchMovimientos(selectedCuenta.id, apiFilters);
    }
  }, [selectedCuenta, filtros]);

  const handleCrearCuenta = async () => {
    try {
      await crearCuenta(nuevaCuenta);
      setShowNewCuentaDialog(false);
      setNuevaCuenta({
        banco: '',
        tipoCuenta: 'AHORROS',
        numeroCuenta: '',
        nombreCuenta: '',
        saldoInicial: 0
      });
    } catch (error) {
      console.error('Error creando cuenta:', error);
    }
  };

  const handleCrearMovimiento = async () => {
    if (!selectedCuenta) return;
    try {
      await crearMovimiento(selectedCuenta.id, nuevoMovimiento);
      setShowNewMovimientoDialog(false);
      setNuevoMovimiento({
        tipo: 'CREDITO',
        descripcion: '',
        monto: 0,
        referencia: '',
        fecha: format(new Date(), 'yyyy-MM-dd')
      });
      const apiFilters = {
        fechaInicio: filtros.fechaInicio || undefined,
        fechaFin: filtros.fechaFin || undefined,
        conciliado: filtros.conciliado !== 'all' ? filtros.conciliado : undefined
      };
      fetchMovimientos(selectedCuenta.id, apiFilters);
      fetchCuentas();
    } catch (error) {
      console.error('Error creando movimiento:', error);
    }
  };

  const bancos = [
    'Bancolombia',
    'Banco de Bogotá',
    'Davivienda',
    'BBVA',
    'Banco de Occidente',
    'Banco Popular',
    'Banco Caja Social',
    'Banco AV Villas',
    'Nequi',
    'Daviplata',
    'Otro'
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Landmark className="w-8 h-8 text-blue-600" />
            Gestión de Bancos
          </h1>
          <p className="text-gray-500 mt-1">Cuentas bancarias, movimientos y conciliación</p>
        </div>
        <Button onClick={() => setShowNewCuentaDialog(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          Nueva Cuenta
        </Button>
      </div>

      {/* KPIs */}
      {dashboard && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-600 font-medium">Saldo Total</p>
                  <p className="text-2xl font-bold text-blue-700">
                    {formatCurrency(dashboard.saldoTotal || 0)}
                  </p>
                </div>
                <Wallet className="w-10 h-10 text-blue-500 opacity-70" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-600 font-medium">Ingresos Mes</p>
                  <p className="text-2xl font-bold text-green-700">
                    {formatCurrency(dashboard.ingresosMes || 0)}
                  </p>
                </div>
                <TrendingUp className="w-10 h-10 text-green-500 opacity-70" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-red-600 font-medium">Egresos Mes</p>
                  <p className="text-2xl font-bold text-red-700">
                    {formatCurrency(dashboard.egresosMes || 0)}
                  </p>
                </div>
                <TrendingDown className="w-10 h-10 text-red-500 opacity-70" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-amber-600 font-medium">Por Conciliar</p>
                  <p className="text-2xl font-bold text-amber-700">
                    {dashboard.movimientosPendientes || 0}
                  </p>
                </div>
                <Clock className="w-10 h-10 text-amber-500 opacity-70" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="cuentas" className="gap-2">
            <Building2 className="w-4 h-4" />
            Cuentas
          </TabsTrigger>
          <TabsTrigger value="movimientos" className="gap-2">
            <FileText className="w-4 h-4" />
            Movimientos
          </TabsTrigger>
          <TabsTrigger value="conciliacion" className="gap-2">
            <CheckCircle2 className="w-4 h-4" />
            Conciliación
          </TabsTrigger>
        </TabsList>

        {/* Tab Cuentas */}
        <TabsContent value="cuentas" className="mt-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Cuentas Bancarias</CardTitle>
                <Button variant="outline" size="sm" onClick={() => fetchCuentas()} className="gap-2">
                  <RefreshCw className="w-4 h-4" />
                  Actualizar
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-8">
                  <RefreshCw className="w-8 h-8 animate-spin text-gray-400" />
                </div>
              ) : cuentas.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Landmark className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No hay cuentas bancarias registradas</p>
                  <Button onClick={() => setShowNewCuentaDialog(true)} className="mt-4" variant="outline">
                    Agregar primera cuenta
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Banco</TableHead>
                      <TableHead>Número de Cuenta</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Nombre</TableHead>
                      <TableHead className="text-right">Saldo Actual</TableHead>
                      <TableHead className="text-right">Saldo Conciliado</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="text-center">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {cuentas.map((cuenta) => (
                      <TableRow
                        key={cuenta.id}
                        className={selectedCuenta?.id === cuenta.id ? 'bg-blue-50' : 'hover:bg-gray-50'}
                      >
                        <TableCell className="font-medium">{cuenta.banco}</TableCell>
                        <TableCell className="font-mono">{cuenta.numeroCuenta}</TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {cuenta.tipoCuenta}
                          </Badge>
                        </TableCell>
                        <TableCell>{cuenta.nombreCuenta}</TableCell>
                        <TableCell className="text-right font-semibold">
                          {formatCurrency(cuenta.saldoActual)}
                        </TableCell>
                        <TableCell className="text-right text-gray-600">
                          {formatCurrency(cuenta.saldoConciliado)}
                        </TableCell>
                        <TableCell>
                          <Badge variant={cuenta.activa ? 'default' : 'secondary'}>
                            {cuenta.activa ? 'Activa' : 'Inactiva'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedCuenta(cuenta);
                              setActiveTab('movimientos');
                            }}
                          >
                            Ver Movimientos
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Movimientos */}
        <TabsContent value="movimientos" className="mt-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <CardTitle>Movimientos Bancarios</CardTitle>
                  {selectedCuenta && (
                    <CardDescription>
                      {selectedCuenta.banco} - {selectedCuenta.numeroCuenta}
                    </CardDescription>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {selectedCuenta && (
                    <Button onClick={() => setShowNewMovimientoDialog(true)} className="gap-2">
                      <Plus className="w-4 h-4" />
                      Nuevo Movimiento
                    </Button>
                  )}
                </div>
              </div>

              {/* Selector de cuenta y filtros */}
              <div className="flex flex-wrap items-center gap-4 mt-4">
                <div className="w-64">
                  <Select
                    value={selectedCuenta?.id || ''}
                    onValueChange={(value) => {
                      const cuenta = cuentas.find(c => c.id === value);
                      setSelectedCuenta(cuenta);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar cuenta" />
                    </SelectTrigger>
                    <SelectContent>
                      {cuentas.map((cuenta) => (
                        <SelectItem key={cuenta.id} value={cuenta.id}>
                          {cuenta.banco} - {cuenta.numeroCuenta}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Input
                  type="date"
                  placeholder="Desde"
                  value={filtros.fechaInicio}
                  onChange={(e) => setFiltros({ ...filtros, fechaInicio: e.target.value })}
                  className="w-40"
                />
                <Input
                  type="date"
                  placeholder="Hasta"
                  value={filtros.fechaFin}
                  onChange={(e) => setFiltros({ ...filtros, fechaFin: e.target.value })}
                  className="w-40"
                />
                <Select
                  value={filtros.conciliado}
                  onValueChange={(value) => setFiltros({ ...filtros, conciliado: value })}
                >
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="true">Conciliados</SelectItem>
                    <SelectItem value="false">Pendientes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              {!selectedCuenta ? (
                <div className="text-center py-8 text-gray-500">
                  <Building2 className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Seleccione una cuenta para ver los movimientos</p>
                </div>
              ) : loading ? (
                <div className="flex justify-center py-8">
                  <RefreshCw className="w-8 h-8 animate-spin text-gray-400" />
                </div>
              ) : movimientos.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No hay movimientos en esta cuenta</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Descripción</TableHead>
                      <TableHead>Referencia</TableHead>
                      <TableHead className="text-right">Monto</TableHead>
                      <TableHead>Estado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {movimientos.map((mov) => (
                      <TableRow key={mov.id}>
                        <TableCell>
                          {format(new Date(mov.fecha), 'dd/MM/yyyy', { locale: es })}
                        </TableCell>
                        <TableCell>
                          {mov.tipo === 'CREDITO' ? (
                            <span className="flex items-center gap-1 text-green-600">
                              <ArrowUpCircle className="w-4 h-4" />
                              Ingreso
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-red-600">
                              <ArrowDownCircle className="w-4 h-4" />
                              Egreso
                            </span>
                          )}
                        </TableCell>
                        <TableCell>{mov.descripcion}</TableCell>
                        <TableCell className="font-mono text-sm text-gray-500">
                          {mov.referencia || '-'}
                        </TableCell>
                        <TableCell className={`text-right font-semibold ${
                          mov.tipo === 'CREDITO' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {mov.tipo === 'CREDITO' ? '+' : '-'}
                          {formatCurrency(mov.monto)}
                        </TableCell>
                        <TableCell>
                          <Badge variant={mov.conciliado ? 'default' : 'secondary'}>
                            {mov.conciliado ? 'Conciliado' : 'Pendiente'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Conciliación */}
        <TabsContent value="conciliacion" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Conciliación Bancaria</CardTitle>
              <CardDescription>
                Compare los movimientos bancarios con el extracto del banco
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-gray-500">
                <CheckCircle2 className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">Módulo de Conciliación</p>
                <p className="mt-2">
                  Seleccione una cuenta y período para iniciar la conciliación bancaria
                </p>
                <div className="flex justify-center gap-4 mt-6">
                  <Select>
                    <SelectTrigger className="w-64">
                      <SelectValue placeholder="Seleccionar cuenta" />
                    </SelectTrigger>
                    <SelectContent>
                      {cuentas.map((cuenta) => (
                        <SelectItem key={cuenta.id} value={cuenta.id}>
                          {cuenta.banco} - {cuenta.numeroCuenta}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input type="month" className="w-48" />
                  <Button className="gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    Iniciar Conciliación
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog Nueva Cuenta */}
      <Dialog open={showNewCuentaDialog} onOpenChange={setShowNewCuentaDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nueva Cuenta Bancaria</DialogTitle>
            <DialogDescription>
              Registre una nueva cuenta bancaria para gestionar sus movimientos
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Banco</Label>
              <Select
                value={nuevaCuenta.banco}
                onValueChange={(value) => setNuevaCuenta({ ...nuevaCuenta, banco: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar banco" />
                </SelectTrigger>
                <SelectContent>
                  {bancos.map((banco) => (
                    <SelectItem key={banco} value={banco}>
                      {banco}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Tipo de Cuenta</Label>
              <Select
                value={nuevaCuenta.tipoCuenta}
                onValueChange={(value) => setNuevaCuenta({ ...nuevaCuenta, tipoCuenta: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="AHORROS">Ahorros</SelectItem>
                  <SelectItem value="CORRIENTE">Corriente</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Número de Cuenta</Label>
              <Input
                value={nuevaCuenta.numeroCuenta}
                onChange={(e) => setNuevaCuenta({ ...nuevaCuenta, numeroCuenta: e.target.value })}
                placeholder="Ej: 123-456789-00"
              />
            </div>
            <div className="space-y-2">
              <Label>Nombre de la Cuenta</Label>
              <Input
                value={nuevaCuenta.nombreCuenta}
                onChange={(e) => setNuevaCuenta({ ...nuevaCuenta, nombreCuenta: e.target.value })}
                placeholder="Ej: Cuenta Principal"
              />
            </div>
            <div className="space-y-2">
              <Label>Saldo Inicial</Label>
              <Input
                type="number"
                value={nuevaCuenta.saldoInicial}
                onChange={(e) => setNuevaCuenta({ ...nuevaCuenta, saldoInicial: parseFloat(e.target.value) || 0 })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewCuentaDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCrearCuenta} disabled={loading}>
              {loading ? 'Guardando...' : 'Crear Cuenta'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Nuevo Movimiento */}
      <Dialog open={showNewMovimientoDialog} onOpenChange={setShowNewMovimientoDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nuevo Movimiento</DialogTitle>
            <DialogDescription>
              Registre un nuevo movimiento bancario
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Tipo de Movimiento</Label>
              <Select
                value={nuevoMovimiento.tipo}
                onValueChange={(value) => setNuevoMovimiento({ ...nuevoMovimiento, tipo: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CREDITO">Ingreso (Crédito)</SelectItem>
                  <SelectItem value="DEBITO">Egreso (Débito)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Fecha</Label>
              <Input
                type="date"
                value={nuevoMovimiento.fecha}
                onChange={(e) => setNuevoMovimiento({ ...nuevoMovimiento, fecha: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Descripción</Label>
              <Input
                value={nuevoMovimiento.descripcion}
                onChange={(e) => setNuevoMovimiento({ ...nuevoMovimiento, descripcion: e.target.value })}
                placeholder="Descripción del movimiento"
              />
            </div>
            <div className="space-y-2">
              <Label>Monto</Label>
              <Input
                type="number"
                value={nuevoMovimiento.monto}
                onChange={(e) => setNuevoMovimiento({ ...nuevoMovimiento, monto: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div className="space-y-2">
              <Label>Referencia (opcional)</Label>
              <Input
                value={nuevoMovimiento.referencia}
                onChange={(e) => setNuevoMovimiento({ ...nuevoMovimiento, referencia: e.target.value })}
                placeholder="Número de transferencia, cheque, etc."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewMovimientoDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCrearMovimiento} disabled={loading}>
              {loading ? 'Guardando...' : 'Registrar Movimiento'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
