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
import { Plus, Search, Edit, Trash2, Info } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';

export default function DepartamentosModule({ user }) {
  const [departamentos, setDepartamentos] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingDepartamento, setEditingDepartamento] = useState(null);
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    responsable_id: '',
    estado: 'Activo',
  });

  useEffect(() => {
    loadData();
  }, [search]);

  const loadData = async () => {
    try {
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';

      // Cargar departamentos
      const departamentosRes = await fetch(`${apiUrl}/departamentos?search=${search}&limit=100`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const departamentosData = await departamentosRes.json();
      setDepartamentos(departamentosData.departamentos || []);

      // Cargar usuarios (sin pacientes)
      const usuariosRes = await fetch(`${apiUrl}/usuarios/no-pacientes`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const usuariosData = await usuariosRes.json();
      setUsuarios(usuariosData.usuarios || []);

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
      const url = editingDepartamento
        ? `${apiUrl}/departamentos/${editingDepartamento.id}`
        : `${apiUrl}/departamentos`;

      const method = editingDepartamento ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          responsable_id: formData.responsable_id || null,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setIsDialogOpen(false);
        resetForm();
        loadData();
      } else {
        alert(data.error || 'Error al guardar el departamento');
      }
    } catch (error) {
      console.error('Error saving departamento:', error);
      alert('Error al guardar el departamento');
    }
  };

  const handleEdit = (departamento) => {
    setEditingDepartamento(departamento);
    setFormData({
      nombre: departamento.nombre || '',
      descripcion: departamento.descripcion || '',
      responsable_id: departamento.responsableId || '',
      estado: departamento.estado || 'Activo',
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Está seguro de eliminar este departamento?')) return;

    try {
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';
      const response = await fetch(`${apiUrl}/departamentos/${id}`, {
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
      console.error('Error deleting departamento:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      nombre: '',
      descripcion: '',
      responsable_id: '',
      estado: 'Activo',
    });
    setEditingDepartamento(null);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-CO');
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Departamentos</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">Gestiona los departamentos de la clínica</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button className="bg-teal-500 hover:bg-teal-600 w-full sm:w-auto">
              <Plus className="w-4 h-4 mr-2" />
              Agregar Departamento
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-lg sm:text-xl">
                {editingDepartamento ? 'Editar Departamento' : 'Nuevo Departamento'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="nombre" className="text-sm sm:text-base">Nombre *</Label>
                <Input
                  id="nombre"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  required
                  placeholder="Ej: Cardiología"
                  className="h-11 sm:h-12"
                />
              </div>
              <div>
                <Label htmlFor="descripcion" className="text-sm sm:text-base">Descripción</Label>
                <Textarea
                  id="descripcion"
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  rows={3}
                  placeholder="Descripción del departamento..."
                />
              </div>
              <div>
                <Label htmlFor="responsable_id" className="text-sm sm:text-base">Usuario Responsable (Opcional)</Label>
                <Select 
                  value={formData.responsable_id || "none"} 
                  onValueChange={(value) => setFormData({ ...formData, responsable_id: value === "none" ? "" : value })}
                >
                  <SelectTrigger className="h-11 sm:h-12">
                    <SelectValue placeholder="Seleccionar responsable (opcional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sin responsable</SelectItem>
                    {usuarios.map((usuario) => (
                      <SelectItem key={usuario.id} value={usuario.id}>
                        {usuario.nombre} {usuario.apellido} - {usuario.rol}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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

              {/* Nota informativa */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4 flex gap-2 sm:gap-3">
                <Info className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs sm:text-sm text-blue-800">
                  <span className="font-semibold">💡 Nota:</span> La cantidad de especialidades se calculará automáticamente basándose en las especialidades activas asignadas a este departamento.
                </p>
              </div>

              <div className="flex flex-col-reverse sm:flex-row gap-2 justify-end pt-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} className="w-full sm:w-auto">
                  Cancelar
                </Button>
                <Button type="submit" className="bg-teal-500 hover:bg-teal-600 w-full sm:w-auto">
                  {editingDepartamento ? 'Actualizar' : 'Crear'}
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
              placeholder="Buscar por nombre..."
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
          <CardTitle className="text-lg sm:text-xl">Lista de Departamentos ({departamentos.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-center py-8 text-gray-500 text-sm sm:text-base">Cargando...</p>
          ) : departamentos.length === 0 ? (
            <p className="text-center py-8 text-gray-500 text-sm sm:text-base">No hay departamentos registrados</p>
          ) : (
            <div className="overflow-x-auto -mx-2 sm:mx-0">
              <div className="inline-block min-w-full align-middle">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs sm:text-sm">Nombre</TableHead>
                      <TableHead className="text-xs sm:text-sm hidden md:table-cell">Responsable</TableHead>
                      <TableHead className="text-xs sm:text-sm hidden lg:table-cell">Descripción</TableHead>
                      <TableHead className="text-xs sm:text-sm hidden sm:table-cell">Fecha</TableHead>
                      <TableHead className="text-center text-xs sm:text-sm">Esp.</TableHead>
                      <TableHead className="text-xs sm:text-sm">Estado</TableHead>
                      <TableHead className="text-right text-xs sm:text-sm">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {departamentos.map((departamento) => (
                      <TableRow key={departamento.id}>
                        <TableCell className="font-medium text-xs sm:text-sm">{departamento.nombre}</TableCell>
                        <TableCell className="text-xs sm:text-sm hidden md:table-cell">
                          {departamento.responsableNombre === 'N/A' ? (
                            <span className="text-gray-400 italic">N/A</span>
                          ) : (
                            departamento.responsableNombre
                          )}
                        </TableCell>
                        <TableCell className="max-w-xs truncate text-xs sm:text-sm hidden lg:table-cell">
                          {departamento.descripcion || '-'}
                        </TableCell>
                        <TableCell className="text-xs sm:text-sm hidden sm:table-cell">{formatDate(departamento.createdAt)}</TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline" className="bg-teal-50 text-teal-700 border-teal-200 text-xs">
                            {departamento.cantidadEspecialidades}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={`${departamento.estado === 'Activo' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'} text-xs`}>
                            {departamento.estado}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1 sm:gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEdit(departamento)}
                              className="h-8 w-8 p-0 sm:h-9 sm:w-9"
                            >
                              <Edit className="w-3 h-3 sm:w-4 sm:h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-red-600 hover:text-red-700 h-8 w-8 p-0 sm:h-9 sm:w-9"
                              onClick={() => handleDelete(departamento.id)}
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
