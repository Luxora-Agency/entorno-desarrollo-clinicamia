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
import { Plus, Search, Edit, Trash2, Activity, Clock, DollarSign, CheckCircle2, XCircle, Building2 } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { formatDateLong } from '@/lib/dateUtils';

export default function EspecialidadesModule({ user }) {
  const [especialidades, setEspecialidades] = useState([]);
  const [departamentos, setDepartamentos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEspecialidad, setEditingEspecialidad] = useState(null);
  const [formData, setFormData] = useState({
    titulo: '',
    codigo: '',
    departamento_id: '',
    costo_cop: '',
    duracion_minutos: '',
    duracion_externa_min: '',
    duracion_interna_min: '',
    descripcion: '',
    estado: 'Activo',
  });

  useEffect(() => {
    loadData();
  }, [search]);

  const loadData = async () => {
    try {
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';

      // Cargar especialidades
      const especialidadesRes = await fetch(`${apiUrl}/especialidades?search=${search}&limit=100`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const especialidadesData = await especialidadesRes.json();
      setEspecialidades(especialidadesData.data || []);

      // Cargar departamentos
      const departamentosRes = await fetch(`${apiUrl}/departamentos?limit=100`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const departamentosData = await departamentosRes.json();
      setDepartamentos(departamentosData.data || []);

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
      const url = editingEspecialidad
        ? `${apiUrl}/especialidades/${editingEspecialidad.id}`
        : `${apiUrl}/especialidades`;

      const method = editingEspecialidad ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setIsDialogOpen(false);
        resetForm();
        loadData();
      } else {
        alert(data.error || data.message || 'Error al guardar la especialidad');
      }
    } catch (error) {
      console.error('Error saving especialidad:', error);
      alert('Error al guardar la especialidad');
    }
  };

  const handleEdit = (especialidad) => {
    setEditingEspecialidad(especialidad);
    setFormData({
      titulo: especialidad.titulo || '',
      codigo: especialidad.codigo || '',
      departamento_id: especialidad.departamentoId || '',
      costo_cop: especialidad.costoCOP || '',
      duracion_minutos: especialidad.duracionMinutos || '',
      duracion_externa_min: especialidad.duracionExternaMin || '',
      duracion_interna_min: especialidad.duracionInternaMin || '',
      descripcion: especialidad.descripcion || '',
      estado: especialidad.estado || 'Activo',
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Está seguro de eliminar esta especialidad?')) return;

    try {
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';
      const response = await fetch(`${apiUrl}/especialidades/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();
      if (response.ok) {
        loadData();
      } else {
        alert(data.error || data.message);
      }
    } catch (error) {
      console.error('Error deleting especialidad:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      titulo: '',
      codigo: '',
      departamento_id: '',
      costo_cop: '',
      duracion_minutos: '',
      duracion_externa_min: '',
      duracion_interna_min: '',
      descripcion: '',
      estado: 'Activo',
    });
    setEditingEspecialidad(null);
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
              <Activity className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Especialidades</h1>
          </div>
          <p className="text-gray-600 ml-14">Gestiona las especialidades médicas</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-md w-full sm:w-auto h-11 font-semibold">
              <Plus className="w-4 h-4 mr-2" />
              Especialidades
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl flex items-center gap-2">
                <Activity className="w-5 h-5 text-emerald-600" />
                {editingEspecialidad ? 'Editar Especialidad' : 'Nueva Especialidad'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <Label htmlFor="titulo" className="text-sm font-semibold text-gray-700 mb-2 block">Título *</Label>
                  <Input
                    id="titulo"
                    value={formData.titulo}
                    onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                    required
                    placeholder="Ej: Cardiología General"
                    className="h-11 border-gray-300 focus:border-emerald-500 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <Label htmlFor="codigo" className="text-sm font-semibold text-gray-700 mb-2 block">Código</Label>
                  <Input
                    id="codigo"
                    value={formData.codigo}
                    onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
                    placeholder="Ej: CARD-001"
                    className="h-11 border-gray-300 focus:border-emerald-500 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <Label htmlFor="departamento_id" className="text-sm font-semibold text-gray-700 mb-2 block">Departamento *</Label>
                  <Select value={formData.departamento_id} onValueChange={(value) => setFormData({ ...formData, departamento_id: value })} required>
                    <SelectTrigger className="h-11 border-gray-300">
                      <SelectValue placeholder="Seleccionar departamento" />
                    </SelectTrigger>
                    <SelectContent>
                      {departamentos.map((dept) => (
                        <SelectItem key={dept.id} value={dept.id}>
                          {dept.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="costo_cop" className="text-sm font-semibold text-gray-700 mb-2 block">Costo en COP *</Label>
                  <Input
                    id="costo_cop"
                    type="number"
                    value={formData.costo_cop}
                    onChange={(e) => setFormData({ ...formData, costo_cop: e.target.value })}
                    required
                    placeholder="50000"
                    min="0"
                    className="h-11 border-gray-300 focus:border-emerald-500 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <Label htmlFor="duracion_minutos" className="text-sm font-semibold text-gray-700 mb-2 block">Duración (minutos) *</Label>
                  <Input
                    id="duracion_minutos"
                    type="number"
                    value={formData.duracion_minutos}
                    onChange={(e) => setFormData({ ...formData, duracion_minutos: e.target.value })}
                    required
                    placeholder="30"
                    min="1"
                    className="h-11 border-gray-300 focus:border-emerald-500 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <Label htmlFor="duracion_externa_min" className="text-sm font-semibold text-gray-700 mb-2 block">Duración Externa (min)</Label>
                  <Input
                    id="duracion_externa_min"
                    type="number"
                    value={formData.duracion_externa_min}
                    onChange={(e) => setFormData({ ...formData, duracion_externa_min: e.target.value })}
                    placeholder="45"
                    min="0"
                    className="h-11 border-gray-300 focus:border-emerald-500 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <Label htmlFor="duracion_interna_min" className="text-sm font-semibold text-gray-700 mb-2 block">Duración Interna (min)</Label>
                  <Input
                    id="duracion_interna_min"
                    type="number"
                    value={formData.duracion_interna_min}
                    onChange={(e) => setFormData({ ...formData, duracion_interna_min: e.target.value })}
                    placeholder="20"
                    min="0"
                    className="h-11 border-gray-300 focus:border-emerald-500 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <Label htmlFor="estado" className="text-sm font-semibold text-gray-700 mb-2 block">Estado *</Label>
                  <Select value={formData.estado} onValueChange={(value) => setFormData({ ...formData, estado: value })} required>
                    <SelectTrigger className="h-11 border-gray-300">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Activo">Activo</SelectItem>
                      <SelectItem value="Inactivo">Inactivo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="descripcion" className="text-sm font-semibold text-gray-700 mb-2 block">Descripción</Label>
                <Textarea
                  id="descripcion"
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  rows={3}
                  placeholder="Descripción de la especialidad..."
                  className="border-gray-300 focus:border-emerald-500 focus:ring-emerald-500"
                />
              </div>
              <div className="flex flex-col-reverse sm:flex-row gap-3 justify-end pt-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} className="w-full sm:w-auto h-11">
                  Cancelar
                </Button>
                <Button type="submit" className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white w-full sm:w-auto h-11 font-semibold">
                  {editingEspecialidad ? 'Actualizar' : 'Crear'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <Card className="mb-6 shadow-sm border-gray-200">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <Search className="w-5 h-5 text-gray-400" />
            <Input
              placeholder="Buscar por título o código..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="border-0 focus-visible:ring-0 h-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="shadow-sm border-gray-200">
        <CardHeader className="border-b border-gray-100">
          <CardTitle className="text-xl flex items-center gap-2">
            <Activity className="w-5 h-5 text-emerald-600" />
            Lista de Especialidades
            <Badge variant="outline" className="ml-2 bg-emerald-50 text-emerald-700 border-emerald-200">
              {especialidades.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-gray-500 mt-4">Cargando...</p>
            </div>
          ) : especialidades.length === 0 ? (
            <div className="text-center py-12">
              <Activity className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No hay especialidades registradas</p>
              <p className="text-sm text-gray-400 mt-2">Agrega una usando el botón superior</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="font-semibold">Título</TableHead>
                    <TableHead className="font-semibold hidden md:table-cell">Departamento</TableHead>
                    <TableHead className="font-semibold hidden lg:table-cell">Fecha Creación</TableHead>
                    <TableHead className="font-semibold">Costo</TableHead>
                    <TableHead className="font-semibold hidden sm:table-cell">Dur. Ext.</TableHead>
                    <TableHead className="font-semibold hidden sm:table-cell">Dur. Int.</TableHead>
                    <TableHead className="font-semibold">Estado</TableHead>
                    <TableHead className="text-right font-semibold">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {especialidades.map((especialidad) => (
                    <TableRow key={especialidad.id} className="hover:bg-gray-50">
                      <TableCell className="font-semibold text-gray-900">
                        <div className="flex items-center gap-2">
                          <Activity className="w-4 h-4 text-emerald-600" />
                          <div>
                            {especialidad.titulo}
                            {especialidad.codigo && (
                              <div className="text-xs text-gray-500 font-normal">{especialidad.codigo}</div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <span className="flex items-center gap-1.5 text-gray-700">
                          <Building2 className="w-3.5 h-3.5 text-gray-500" />
                          {especialidad.departamentoNombre}
                        </span>
                      </TableCell>
                      <TableCell className="text-gray-600 hidden lg:table-cell">{formatDateLong(especialidad.createdAt).fecha}</TableCell>
                      <TableCell className="font-semibold text-emerald-700">
                        <div className="flex items-center gap-1.5">
                          <DollarSign className="w-4 h-4" />
                          {formatCurrency(especialidad.costoCOP)}
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        {especialidad.duracionExternaMin ? (
                          <span className="flex items-center gap-1.5 text-gray-700">
                            <Clock className="w-3.5 h-3.5 text-gray-500" />
                            {especialidad.duracionExternaMin} min
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        {especialidad.duracionInternaMin ? (
                          <span className="flex items-center gap-1.5 text-gray-700">
                            <Clock className="w-3.5 h-3.5 text-gray-500" />
                            {especialidad.duracionInternaMin} min
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {especialidad.estado === 'Activo' ? (
                          <Badge className="bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1 w-fit">
                            <CheckCircle2 className="w-3 h-3" />
                            Activo
                          </Badge>
                        ) : (
                          <Badge className="bg-gray-100 text-gray-800 border border-gray-200 flex items-center gap-1 w-fit">
                            <XCircle className="w-3 h-3" />
                            Inactivo
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(especialidad)}
                            className="h-9 w-9 p-0 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-9 w-9 p-0 hover:bg-red-50 hover:text-red-700 hover:border-red-300"
                            onClick={() => handleDelete(especialidad.id)}
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
