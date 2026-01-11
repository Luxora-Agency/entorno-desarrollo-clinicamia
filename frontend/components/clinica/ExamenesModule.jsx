'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Clock,
  DollarSign,
  AlertTriangle,
  FileText,
  Activity,
  CheckCircle2,
  XCircle,
  Beaker
} from 'lucide-react';
import CatalogSearch from '@/components/ui/CatalogSearch';

export default function ExamenesModule({ user }) {
  const [items, setItems] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('todos');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [estadisticas, setEstadisticas] = useState({
    totalExamenes: 0,
    totalProcedimientos: 0,
    total: 0,
    activos: 0,
  });
  
  const [formData, setFormData] = useState({
    tipo: 'Examen',
    nombre: '',
    codigoCUPS: '',
    codigoCIE11: '',
    descripcion: '',
    categoriaId: '',
    duracionMinutos: '',
    costoBase: '',
    preparacionEspecial: '',
    requiereAyuno: false,
    estado: 'Activo',
  });

  useEffect(() => {
    loadData();
  }, [search, filtroTipo]);

  const loadData = async () => {
    try {
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';

      // Cargar items
      const itemsRes = await fetch(`${apiUrl}/examenes-procedimientos?search=${search}&tipo=${filtroTipo}&limit=100`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const itemsData = await itemsRes.json();
      setItems(itemsData.data || []);

      // Cargar estadísticas
      const statsRes = await fetch(`${apiUrl}/examenes-procedimientos/estadisticas`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const statsData = await statsRes.json();
      setEstadisticas(statsData.data || {});

      // Cargar categorías
      const categoriasRes = await fetch(`${apiUrl}/categorias-examenes?limit=100`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const categoriasData = await categoriasRes.json();
      setCategorias(categoriasData.data || []);

      setLoading(false);
    } catch (error) {
      console.error('Error loading data:', error);
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';

    try {
      const url = editingItem
        ? `${apiUrl}/examenes-procedimientos/${editingItem.id}`
        : `${apiUrl}/examenes-procedimientos`;

      const method = editingItem ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          categoriaId: formData.categoriaId || null,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        alert(`✅ ${formData.tipo} ${editingItem ? 'actualizado' : 'creado'} exitosamente`);
        setIsDialogOpen(false);
        resetForm();
        loadData();
      } else {
        alert(data.error || data.message || 'Error al guardar');
      }
    } catch (error) {
      console.error('Error saving:', error);
      alert('Error al guardar');
    }
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData({
      tipo: item.tipo || 'Examen',
      nombre: item.nombre || '',
      codigoCUPS: item.codigoCUPS || '',
      codigoCIE11: item.codigoCIE11 || '',
      descripcion: item.descripcion || '',
      categoriaId: item.categoriaId || '',
      duracionMinutos: item.duracionMinutos || '',
      costoBase: item.costoBase || '',
      preparacionEspecial: item.preparacionEspecial || '',
      requiereAyuno: item.requiereAyuno || false,
      estado: item.estado || 'Activo',
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Está seguro de eliminar este ítem?')) return;

    try {
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';
      const response = await fetch(`${apiUrl}/examenes-procedimientos/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();
      if (response.ok) {
        alert('✅ Eliminado correctamente');
        loadData();
      } else {
        alert(data.error || data.message);
      }
    } catch (error) {
      console.error('Error deleting:', error);
    }
  };

  const handleCambiarEstado = async (id, nuevoEstado) => {
    try {
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';
      
      const response = await fetch(`${apiUrl}/examenes-procedimientos/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ estado: nuevoEstado }),
      });

      if (response.ok) {
        loadData();
      }
    } catch (error) {
      console.error('Error changing status:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      tipo: 'Examen',
      nombre: '',
      codigoCUPS: '',
      codigoCIE11: '',
      descripcion: '',
      categoriaId: '',
      duracionMinutos: '',
      costoBase: '',
      preparacionEspecial: '',
      requiereAyuno: false,
      estado: 'Activo',
    });
    setEditingItem(null);
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="p-6 lg:p-8 bg-white min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-2.5 rounded-xl">
              <Beaker className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Exámenes y Procedimientos</h1>
          </div>
          <p className="text-gray-600 ml-14">Gestiona exámenes médicos y procedimientos</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-md w-full sm:w-auto h-11 font-semibold">
              <Plus className="w-4 h-4 mr-2" />
              Agregar Nuevo
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl flex items-center gap-2">
                <Beaker className="w-5 h-5 text-emerald-600" />
                {editingItem ? 'Editar' : 'Nuevo'} Examen/Procedimiento
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <Label htmlFor="tipo" className="text-sm font-semibold text-gray-700 mb-2 block">Tipo *</Label>
                <Select value={formData.tipo} onValueChange={(value) => setFormData({ ...formData, tipo: value })} required>
                  <SelectTrigger className="h-11 border-gray-300">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Examen">Examen</SelectItem>
                    <SelectItem value="Procedimiento">Procedimiento</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="nombre" className="text-sm font-semibold text-gray-700 mb-2 block">Nombre *</Label>
                <Input
                  id="nombre"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  required
                  placeholder="Ej: Hemograma Completo"
                  className="h-11 border-gray-300 focus:border-emerald-500 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="codigoCUPS" className="text-sm font-semibold text-gray-700 mb-2 block">Código CUPS</Label>
                  <CatalogSearch
                    type="CUPS"
                    placeholder="Buscar código o nombre..."
                    defaultValue={formData.codigoCUPS}
                    onSelect={(item) => {
                      setFormData(prev => ({ 
                        ...prev, 
                        codigoCUPS: item.codigo,
                        nombre: prev.nombre || item.descripcion // Auto-fill name if empty
                      }));
                    }}
                  />
                </div>
                <div>
                  <Label htmlFor="codigoCIE11" className="text-sm font-semibold text-gray-700 mb-2 block">Código CIE-11 (Ref)</Label>
                  <CatalogSearch
                    type="CIE11"
                    placeholder="Buscar diagnóstico..."
                    defaultValue={formData.codigoCIE11}
                    onSelect={(item) => {
                      setFormData(prev => ({ ...prev, codigoCIE11: item.codigo }));
                    }}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="categoriaId" className="text-sm font-semibold text-gray-700 mb-2 block">Categoría</Label>
                <Select value={formData.categoriaId || "none"} onValueChange={(value) => setFormData({ ...formData, categoriaId: value === "none" ? "" : value })}>
                  <SelectTrigger className="h-11 border-gray-300">
                    <SelectValue placeholder="Seleccionar categoría (opcional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sin categoría</SelectItem>
                    {categorias.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded-full" style={{ backgroundColor: cat.colorHex }}></div>
                          {cat.nombre}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="duracionMinutos" className="text-sm font-semibold text-gray-700 mb-2 block flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    Duración (minutos) *
                  </Label>
                  <Input
                    id="duracionMinutos"
                    type="number"
                    value={formData.duracionMinutos}
                    onChange={(e) => setFormData({ ...formData, duracionMinutos: e.target.value })}
                    required
                    min="1"
                    placeholder="30"
                    className="h-11 border-gray-300 focus:border-emerald-500 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <Label htmlFor="costoBase" className="text-sm font-semibold text-gray-700 mb-2 block">Costo Base (COP) *</Label>
                  <Input
                    id="costoBase"
                    type="number"
                    value={formData.costoBase}
                    onChange={(e) => setFormData({ ...formData, costoBase: e.target.value })}
                    required
                    min="0"
                    placeholder="50000"
                    className="h-11 border-gray-300 focus:border-emerald-500 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="preparacionEspecial" className="text-sm font-semibold text-gray-700 mb-2 block">Preparación Especial</Label>
                <Textarea
                  id="preparacionEspecial"
                  value={formData.preparacionEspecial}
                  onChange={(e) => setFormData({ ...formData, preparacionEspecial: e.target.value })}
                  rows={3}
                  placeholder="Instrucciones especiales de preparación..."
                  className="border-gray-300 focus:border-emerald-500 focus:ring-emerald-500"
                />
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <Checkbox
                    id="requiereAyuno"
                    checked={formData.requiereAyuno}
                    onCheckedChange={(checked) => setFormData({ ...formData, requiereAyuno: checked })}
                  />
                  <Label htmlFor="requiereAyuno" className="flex items-center gap-2 cursor-pointer text-yellow-900 font-semibold">
                    <AlertTriangle className="w-5 h-5" />
                    Requiere que el paciente esté en ayunas
                  </Label>
                </div>
              </div>

              <div className="flex flex-col-reverse sm:flex-row gap-3 justify-end pt-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} className="w-full sm:w-auto h-11">
                  Cancelar
                </Button>
                <Button type="submit" className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white w-full sm:w-auto h-11 font-semibold">
                  {editingItem ? 'Actualizar' : 'Crear'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="shadow-sm border-emerald-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total</p>
                <p className="text-3xl font-bold text-gray-900">{estadisticas.total || 0}</p>
              </div>
              <div className="bg-emerald-100 p-3 rounded-xl">
                <Activity className="w-6 h-6 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Exámenes</p>
                <p className="text-3xl font-bold text-gray-900">{estadisticas.totalExamenes || 0}</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-xl">
                <Beaker className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-purple-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Procedimientos</p>
                <p className="text-3xl font-bold text-gray-900">{estadisticas.totalProcedimientos || 0}</p>
              </div>
              <div className="bg-purple-100 p-3 rounded-xl">
                <Activity className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-green-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Activos</p>
                <p className="text-3xl font-bold text-gray-900">{estadisticas.activos || 0}</p>
              </div>
              <div className="bg-green-100 p-3 rounded-xl">
                <CheckCircle2 className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros y Búsqueda */}
      <Card className="mb-6 shadow-sm border-gray-200">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex items-center gap-3 flex-1">
              <Search className="w-5 h-5 text-gray-400" />
              <Input
                placeholder="Buscar por nombre..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="border-0 focus-visible:ring-0 h-10"
              />
            </div>
            <Select value={filtroTipo} onValueChange={setFiltroTipo}>
              <SelectTrigger className="w-full sm:w-48 h-10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="Examen">Solo Exámenes</SelectItem>
                <SelectItem value="Procedimiento">Solo Procedimientos</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="shadow-sm border-gray-200">
        <CardHeader className="border-b border-gray-100">
          <CardTitle className="text-xl flex items-center gap-2">
            <Beaker className="w-5 h-5 text-emerald-600" />
            Lista de Exámenes y Procedimientos
            <Badge variant="outline" className="ml-2 bg-emerald-50 text-emerald-700 border-emerald-200">
              {items.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-gray-500 mt-4">Cargando...</p>
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-12">
              <Beaker className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No hay ítems registrados</p>
              <p className="text-sm text-gray-400 mt-2">Agrega uno usando el botón superior</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="font-semibold">Tipo</TableHead>
                    <TableHead className="font-semibold">Nombre / CUPS</TableHead>
                    <TableHead className="font-semibold hidden lg:table-cell">Duración</TableHead>
                    <TableHead className="font-semibold">Costo</TableHead>
                    <TableHead className="font-semibold hidden md:table-cell">Categoría</TableHead>
                    <TableHead className="font-semibold hidden xl:table-cell">Preparación</TableHead>
                    <TableHead className="font-semibold">Estado</TableHead>
                    <TableHead className="text-right font-semibold">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item) => (
                    <TableRow key={item.id} className="hover:bg-gray-50">
                      <TableCell>
                        <Badge className={item.tipo === 'Examen' ? 'bg-blue-100 text-blue-800 border-blue-200' : 'bg-purple-100 text-purple-800 border-purple-200'}>
                          {item.tipo}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-semibold text-gray-900">
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            <Beaker className="w-4 h-4 text-emerald-600" />
                            {item.nombre}
                          </div>
                          {item.codigoCUPS && (
                            <span className="text-xs text-gray-500 ml-6">CUPS: {item.codigoCUPS}</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <span className="flex items-center gap-1.5 text-gray-700">
                          <Clock className="w-3.5 h-3.5 text-gray-500" />
                          {item.duracionMinutos} min
                        </span>
                      </TableCell>
                      <TableCell className="font-semibold text-emerald-700">
                        <div className="flex items-center gap-1.5">
                          <DollarSign className="w-4 h-4" />
                          {formatCurrency(item.costoBase)}
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {item.categoriaId ? (
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.categoriaColor }}></div>
                            <span className="text-sm text-gray-700">{item.categoriaNombre}</span>
                          </div>
                        ) : (
                          <span className="text-gray-400 text-sm">Sin categoría</span>
                        )}
                      </TableCell>
                      <TableCell className="hidden xl:table-cell">
                        {item.requiereAyuno ? (
                          <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200 flex items-center gap-1 w-fit">
                            <AlertTriangle className="w-3 h-3" />
                            Ayunas
                          </Badge>
                        ) : (
                          <span className="text-gray-400 text-sm">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleCambiarEstado(item.id, item.estado === 'Activo' ? 'Inactivo' : 'Activo')}
                          className="h-8 px-0"
                        >
                          {item.estado === 'Activo' ? (
                            <Badge className="bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1 w-fit cursor-pointer hover:bg-emerald-200">
                              <CheckCircle2 className="w-3 h-3" />
                              Activo
                            </Badge>
                          ) : (
                            <Badge className="bg-gray-100 text-gray-800 border border-gray-200 flex items-center gap-1 w-fit cursor-pointer hover:bg-gray-200">
                              <XCircle className="w-3 h-3" />
                              Inactivo
                            </Badge>
                          )}
                        </Button>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(item)}
                            className="h-9 w-9 p-0 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-9 w-9 p-0 hover:bg-red-50 hover:text-red-700 hover:border-red-300"
                            onClick={() => handleDelete(item.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
