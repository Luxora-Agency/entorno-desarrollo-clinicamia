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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Plus, Search, ChevronRight, ChevronDown, RefreshCw,
  BookOpen, Database, Edit, Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import { apiGet, apiPost, apiPut } from '@/services/api';

export default function PlanCuentasModule() {
  const [cuentas, setCuentas] = useState([]);
  const [cuentasArbol, setCuentasArbol] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('all');
  const [vistaArbol, setVistaArbol] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCuenta, setEditingCuenta] = useState(null);
  const [formData, setFormData] = useState({
    codigo: '',
    nombre: '',
    tipo: 'Activo',
    naturaleza: 'Debito',
    descripcion: ''
  });

  useEffect(() => {
    fetchCuentas();
  }, [filtroTipo]);

  const fetchCuentas = async () => {
    try {
      setLoading(true);
      const filters = {};
      if (filtroTipo !== 'all') filters.tipo = filtroTipo;
      if (search) filters.search = search;

      const [listResponse, arbolResponse] = await Promise.all([
        apiGet('/contabilidad/puc', filters),
        apiGet('/contabilidad/puc/arbol')
      ]);

      setCuentas(listResponse.data || []);
      setCuentasArbol(arbolResponse.data || []);
    } catch (error) {
      toast.error('Error cargando cuentas: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleInitPUC = async () => {
    try {
      await apiPost('/contabilidad/puc/inicializar');
      toast.success('PUC Colombia inicializado correctamente');
      fetchCuentas();
    } catch (error) {
      toast.error('Error inicializando PUC: ' + error.message);
    }
  };

  const handleSyncSiigo = async () => {
    try {
      await apiPost('/contabilidad/puc/sync-siigo');
      toast.success('Sincronización con Siigo completada');
      fetchCuentas();
    } catch (error) {
      toast.error('Error sincronizando: ' + error.message);
    }
  };

  const handleSubmit = async () => {
    try {
      if (editingCuenta) {
        await apiPut(`/contabilidad/puc/${editingCuenta.id}`, formData);
        toast.success('Cuenta actualizada');
      } else {
        await apiPost('/contabilidad/puc', formData);
        toast.success('Cuenta creada');
      }
      setDialogOpen(false);
      setEditingCuenta(null);
      setFormData({
        codigo: '',
        nombre: '',
        tipo: 'Activo',
        naturaleza: 'Debito',
        descripcion: ''
      });
      fetchCuentas();
    } catch (error) {
      toast.error('Error: ' + error.message);
    }
  };

  const openEditDialog = (cuenta) => {
    setEditingCuenta(cuenta);
    setFormData({
      codigo: cuenta.codigo,
      nombre: cuenta.nombre,
      tipo: cuenta.tipo,
      naturaleza: cuenta.naturaleza,
      descripcion: cuenta.descripcion || ''
    });
    setDialogOpen(true);
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

  const CuentaArbolItem = ({ cuenta, nivel = 0 }) => {
    const [isOpen, setIsOpen] = useState(nivel < 2);
    const hasChildren = cuenta.children && cuenta.children.length > 0;

    return (
      <div className="border-l-2 border-gray-200 ml-4">
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <div className={`flex items-center py-2 px-3 hover:bg-muted/50 ${nivel === 0 ? 'ml-0' : ''}`}>
            {hasChildren ? (
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="p-0 h-6 w-6">
                  {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </Button>
              </CollapsibleTrigger>
            ) : (
              <span className="w-6" />
            )}
            <span className="font-mono text-sm text-muted-foreground mr-2">{cuenta.codigo}</span>
            <span className="flex-1">{cuenta.nombre}</span>
            <Badge className={`${getTipoBadgeColor(cuenta.tipo)} mr-2`}>{cuenta.tipo}</Badge>
            <Button variant="ghost" size="sm" onClick={() => openEditDialog(cuenta)}>
              <Edit className="h-4 w-4" />
            </Button>
          </div>
          {hasChildren && (
            <CollapsibleContent>
              {cuenta.children.map((child) => (
                <CuentaArbolItem key={child.id} cuenta={child} nivel={nivel + 1} />
              ))}
            </CollapsibleContent>
          )}
        </Collapsible>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Header y acciones */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Plan Único de Cuentas (PUC)
              </CardTitle>
              <CardDescription>
                Gestión del plan de cuentas contable Colombia
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleInitPUC}>
                <Database className="h-4 w-4 mr-1" />
                Inicializar PUC
              </Button>
              <Button variant="outline" size="sm" onClick={handleSyncSiigo}>
                <RefreshCw className="h-4 w-4 mr-1" />
                Sync Siigo
              </Button>
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" onClick={() => { setEditingCuenta(null); setFormData({ codigo: '', nombre: '', tipo: 'Activo', naturaleza: 'Debito', descripcion: '' }); }}>
                    <Plus className="h-4 w-4 mr-1" />
                    Nueva Cuenta
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{editingCuenta ? 'Editar Cuenta' : 'Nueva Cuenta Contable'}</DialogTitle>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Código</Label>
                        <Input
                          value={formData.codigo}
                          onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
                          placeholder="1105"
                          disabled={!!editingCuenta}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Tipo</Label>
                        <Select
                          value={formData.tipo}
                          onValueChange={(v) => setFormData({ ...formData, tipo: v })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Activo">Activo</SelectItem>
                            <SelectItem value="Pasivo">Pasivo</SelectItem>
                            <SelectItem value="Patrimonio">Patrimonio</SelectItem>
                            <SelectItem value="Ingreso">Ingreso</SelectItem>
                            <SelectItem value="Gasto">Gasto</SelectItem>
                            <SelectItem value="Costo">Costo</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Nombre</Label>
                      <Input
                        value={formData.nombre}
                        onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                        placeholder="Caja"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Naturaleza</Label>
                      <Select
                        value={formData.naturaleza}
                        onValueChange={(v) => setFormData({ ...formData, naturaleza: v })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Debito">Débito</SelectItem>
                          <SelectItem value="Credito">Crédito</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Descripción (opcional)</Label>
                      <Input
                        value={formData.descripcion}
                        onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                        placeholder="Descripción de la cuenta"
                      />
                    </div>
                    <Button onClick={handleSubmit}>
                      {editingCuenta ? 'Actualizar' : 'Crear'} Cuenta
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filtros */}
          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por código o nombre..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8"
                onKeyDown={(e) => e.key === 'Enter' && fetchCuentas()}
              />
            </div>
            <Select value={filtroTipo} onValueChange={setFiltroTipo}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Tipo de cuenta" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los tipos</SelectItem>
                <SelectItem value="Activo">Activo</SelectItem>
                <SelectItem value="Pasivo">Pasivo</SelectItem>
                <SelectItem value="Patrimonio">Patrimonio</SelectItem>
                <SelectItem value="Ingreso">Ingreso</SelectItem>
                <SelectItem value="Gasto">Gasto</SelectItem>
                <SelectItem value="Costo">Costo</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex gap-2">
              <Button
                variant={vistaArbol ? 'default' : 'outline'}
                size="sm"
                onClick={() => setVistaArbol(true)}
              >
                Árbol
              </Button>
              <Button
                variant={!vistaArbol ? 'default' : 'outline'}
                size="sm"
                onClick={() => setVistaArbol(false)}
              >
                Lista
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contenido */}
      <Card>
        <CardContent className="pt-6">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : vistaArbol ? (
            <div className="space-y-1">
              {cuentasArbol.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No hay cuentas registradas. Haga clic en "Inicializar PUC" para crear el plan de cuentas base.
                </div>
              ) : (
                cuentasArbol.map((cuenta) => (
                  <CuentaArbolItem key={cuenta.id} cuenta={cuenta} nivel={0} />
                ))
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Naturaleza</TableHead>
                  <TableHead>Nivel</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cuentas.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      No hay cuentas que coincidan con los filtros
                    </TableCell>
                  </TableRow>
                ) : (
                  cuentas.map((cuenta) => (
                    <TableRow key={cuenta.id}>
                      <TableCell className="font-mono">{cuenta.codigo}</TableCell>
                      <TableCell>{cuenta.nombre}</TableCell>
                      <TableCell>
                        <Badge className={getTipoBadgeColor(cuenta.tipo)}>
                          {cuenta.tipo}
                        </Badge>
                      </TableCell>
                      <TableCell>{cuenta.naturaleza}</TableCell>
                      <TableCell>{cuenta.nivel}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" onClick={() => openEditDialog(cuenta)}>
                          <Edit className="h-4 w-4" />
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
    </div>
  );
}
