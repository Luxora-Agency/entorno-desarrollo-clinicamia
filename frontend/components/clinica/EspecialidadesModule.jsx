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
import { Plus, Search, Edit, Trash2 } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';

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
      setEspecialidades(especialidadesData.especialidades || []);

      // Cargar departamentos
      const departamentosRes = await fetch(`${apiUrl}/departamentos?limit=100`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const departamentosData = await departamentosRes.json();
      setDepartamentos(departamentosData.departamentos || []);

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
        alert(data.error || 'Error al guardar la especialidad');
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
        alert(data.error);
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

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-CO');
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Especialidades</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">Gestiona las especialidades médicas</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button className="bg-teal-500 hover:bg-teal-600 w-full sm:w-auto">
              <Plus className="w-4 h-4 mr-2" />
              Agregar Especialidad
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-lg sm:text-xl">
                {editingEspecialidad ? 'Editar Especialidad' : 'Nueva Especialidad'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <Label htmlFor="titulo" className="text-sm sm:text-base">Título *</Label>
                  <Input
                    id="titulo"
                    value={formData.titulo}
                    onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                    required
                    placeholder="Ej: Cardiología General"
                    className="h-11 sm:h-12"
                  />
                </div>
                <div>
                  <Label htmlFor="codigo" className="text-sm sm:text-base">Código</Label>
                  <Input
                    id="codigo"
                    value={formData.codigo}
                    onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
                    placeholder="Ej: CARD-001"
                    className="h-11 sm:h-12"
                  />
                </div>
                <div>
                  <Label htmlFor="departamento_id" className="text-sm sm:text-base">Departamento *</Label>
                  <Select value={formData.departamento_id} onValueChange={(value) => setFormData({ ...formData, departamento_id: value })} required>
                    <SelectTrigger className="h-11 sm:h-12">
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
                  <Label htmlFor="costo_cop" className="text-sm sm:text-base">Costo en COP *</Label>
                  <Input
                    id="costo_cop"
                    type="number"
                    value={formData.costo_cop}
                    onChange={(e) => setFormData({ ...formData, costo_cop: e.target.value })}
                    required
                    placeholder="50000"
                    min="0"
                    className="h-11 sm:h-12"
                  />
                </div>
                <div>
                  <Label htmlFor="duracion_minutos" className="text-sm sm:text-base">Duración (minutos) *</Label>
                  <Input
                    id="duracion_minutos"
                    type="number"
                    value={formData.duracion_minutos}
                    onChange={(e) => setFormData({ ...formData, duracion_minutos: e.target.value })}
                    required
                    placeholder="30"
                    min="1"
                    className="h-11 sm:h-12"
                  />
                </div>
                <div>
                  <Label htmlFor="duracion_externa_min" className="text-sm sm:text-base">Duración Externa (min)</Label>
                  <Input
                    id="duracion_externa_min"
                    type="number"
                    value={formData.duracion_externa_min}
                    onChange={(e) => setFormData({ ...formData, duracion_externa_min: e.target.value })}
                    placeholder="45"
                    min="0"
                    className="h-11 sm:h-12"
                  />
                </div>
                <div>
                  <Label htmlFor="duracion_interna_min" className="text-sm sm:text-base">Duración Interna (min)</Label>
                  <Input
                    id="duracion_interna_min"
                    type="number"
                    value={formData.duracion_interna_min}
                    onChange={(e) => setFormData({ ...formData, duracion_interna_min: e.target.value })}
                    placeholder="20"
                    min="0"
                    className="h-11 sm:h-12"
                  />
                </div>
                <div>
                  <Label htmlFor="estado" className="text-sm sm:text-base">Estado *</Label>
                  <Select value={formData.estado} onValueChange={(value) => setFormData({ ...formData, estado: value })} required>
                    <SelectTrigger className="h-11 sm:h-12">
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
                <Label htmlFor="descripcion" className="text-sm sm:text-base">Descripción</Label>
                <Textarea
                  id="descripcion"
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  rows={3}
                  placeholder="Descripción de la especialidad..."
                />
              </div>
              <div className="flex flex-col-reverse sm:flex-row gap-2 justify-end pt-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} className="w-full sm:w-auto">
                  Cancelar
                </Button>
                <Button type="submit" className="bg-teal-500 hover:bg-teal-600 w-full sm:w-auto">
                  {editingEspecialidad ? 'Actualizar' : 'Crear'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <Card className="mb-6">
        <CardContent className="p-3 sm:p-4">
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
            <Input
              placeholder="Buscar por título o código..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="border-0 focus-visible:ring-0 text-sm sm:text-base"
            />
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl">Lista de Especialidades ({especialidades.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-center py-8 text-gray-500 text-sm sm:text-base">Cargando...</p>
          ) : especialidades.length === 0 ? (
            <p className="text-center py-8 text-gray-500 text-sm sm:text-base">No hay especialidades registradas</p>
          ) : (
            <div className="overflow-x-auto -mx-2 sm:mx-0">
              <div className="inline-block min-w-full align-middle">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs sm:text-sm">Título</TableHead>
                      <TableHead className="text-xs sm:text-sm hidden md:table-cell">Departamento</TableHead>
                      <TableHead className="text-xs sm:text-sm hidden lg:table-cell">Fecha</TableHead>
                      <TableHead className="text-xs sm:text-sm">Costo</TableHead>
                      <TableHead className="text-xs sm:text-sm hidden sm:table-cell">Dur. Ext.</TableHead>
                      <TableHead className="text-xs sm:text-sm hidden sm:table-cell">Dur. Int.</TableHead>
                      <TableHead className="text-xs sm:text-sm">Estado</TableHead>
                      <TableHead className="text-right text-xs sm:text-sm">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {especialidades.map((especialidad) => (
                      <TableRow key={especialidad.id}>
                        <TableCell className="font-medium text-xs sm:text-sm">
                          {especialidad.titulo}
                          {especialidad.codigo && (
                            <div className="text-xs text-gray-500">{especialidad.codigo}</div>
                          )}
                        </TableCell>
                        <TableCell className="text-xs sm:text-sm hidden md:table-cell">{especialidad.departamentoNombre}</TableCell>
                        <TableCell className="text-xs sm:text-sm hidden lg:table-cell">{formatDate(especialidad.createdAt)}</TableCell>
                        <TableCell className="font-semibold text-teal-600 text-xs sm:text-sm">
                          {formatCurrency(especialidad.costoCOP)}
                        </TableCell>
                        <TableCell className="text-xs sm:text-sm hidden sm:table-cell">{especialidad.duracionExternaMin ? `${especialidad.duracionExternaMin} min` : '-'}</TableCell>
                        <TableCell className="text-xs sm:text-sm hidden sm:table-cell">{especialidad.duracionInternaMin ? `${especialidad.duracionInternaMin} min` : '-'}</TableCell>
                        <TableCell>
                          <Badge className={`${especialidad.estado === 'Activo' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'} text-xs`}>
                            {especialidad.estado}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1 sm:gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEdit(especialidad)}
                              className="h-8 w-8 p-0 sm:h-9 sm:w-9"
                            >
                              <Edit className="w-3 h-3 sm:w-4 sm:h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-red-600 hover:text-red-700 h-8 w-8 p-0 sm:h-9 sm:w-9"
                              onClick={() => handleDelete(especialidad.id)}
                            >
                              <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
