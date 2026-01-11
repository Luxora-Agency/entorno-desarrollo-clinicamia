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
import { Plus, Search, Edit, Trash2, Info, Building2, Users, CheckCircle2, XCircle } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { formatDateLong } from '@/lib/dateUtils';

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
      setDepartamentos(departamentosData.data || []);

      // Cargar usuarios (sin pacientes)
      const usuariosRes = await fetch(`${apiUrl}/usuarios/no-pacientes`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const usuariosData = await usuariosRes.json();
      // La API de usuarios devuelve data.usuarios en lugar de solo data
      setUsuarios(usuariosData.data?.usuarios || []);

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
        alert(data.error || data.message || 'Error al guardar el departamento');
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
        alert(data.error || data.message);
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

  return (
    <div className="p-6 lg:p-8 bg-white min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-2.5 rounded-xl">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Departamentos</h1>
          </div>
          <p className="text-gray-600 ml-14">Gestiona los departamentos de la clínica</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-md w-full sm:w-auto h-11 font-semibold">
              <Plus className="w-4 h-4 mr-2" />
              Agregar Departamento
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl flex items-center gap-2">
                <Building2 className="w-5 h-5 text-emerald-600" />
                {editingDepartamento ? 'Editar Departamento' : 'Nuevo Departamento'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <Label htmlFor="nombre" className="text-sm font-semibold text-gray-700 mb-2 block">Nombre *</Label>
                <Input
                  id="nombre"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  required
                  placeholder="Ej: Cardiología"
                  className="h-11 border-gray-300 focus:border-emerald-500 focus:ring-emerald-500"
                />
              </div>
              <div>
                <Label htmlFor="descripcion" className="text-sm font-semibold text-gray-700 mb-2 block">Descripción</Label>
                <Textarea
                  id="descripcion"
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  rows={3}
                  placeholder="Descripción del departamento..."
                  className="border-gray-300 focus:border-emerald-500 focus:ring-emerald-500"
                />
              </div>
              <div>
                <Label htmlFor="responsable_id" className="text-sm font-semibold text-gray-700 mb-2 block">Usuario Responsable (Opcional)</Label>
                <Select 
                  value={formData.responsable_id || "none"} 
                  onValueChange={(value) => setFormData({ ...formData, responsable_id: value === "none" ? "" : value })}
                >
                  <SelectTrigger className="h-11 border-gray-300">
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

              {/* Nota informativa */}
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex gap-3">
                <Info className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-emerald-800">
                  <span className="font-semibold">Nota:</span> La cantidad de especialidades se calculará automáticamente basándose en las especialidades activas asignadas a este departamento.
                </p>
              </div>

              <div className="flex flex-col-reverse sm:flex-row gap-3 justify-end pt-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} className="w-full sm:w-auto h-11">
                  Cancelar
                </Button>
                <Button type="submit" className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white w-full sm:w-auto h-11 font-semibold">
                  {editingDepartamento ? 'Actualizar' : 'Crear'}
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
              placeholder="Buscar por nombre..."
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
            <Building2 className="w-5 h-5 text-emerald-600" />
            Lista de Departamentos
            <Badge variant="outline" className="ml-2 bg-emerald-50 text-emerald-700 border-emerald-200">
              {departamentos.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-gray-500 mt-4">Cargando...</p>
            </div>
          ) : departamentos.length === 0 ? (
            <div className="text-center py-12">
              <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No hay departamentos registrados</p>
              <p className="text-sm text-gray-400 mt-2">Agrega uno usando el botón superior</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="font-semibold">Nombre</TableHead>
                    <TableHead className="font-semibold hidden md:table-cell">Responsable</TableHead>
                    <TableHead className="font-semibold hidden lg:table-cell">Descripción</TableHead>
                    <TableHead className="font-semibold hidden sm:table-cell">Fecha Creación</TableHead>
                    <TableHead className="text-center font-semibold">Especialidades</TableHead>
                    <TableHead className="font-semibold">Estado</TableHead>
                    <TableHead className="text-right font-semibold">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {departamentos.map((departamento) => (
                    <TableRow key={departamento.id} className="hover:bg-gray-50">
                      <TableCell className="font-semibold text-gray-900">
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-emerald-600" />
                          {departamento.nombre}
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {departamento.responsableNombre === 'N/A' ? (
                          <span className="text-gray-400 italic flex items-center gap-1.5">
                            <Users className="w-3.5 h-3.5" />
                            Sin asignar
                          </span>
                        ) : (
                          <span className="flex items-center gap-1.5 text-gray-700">
                            <Users className="w-3.5 h-3.5 text-gray-500" />
                            {departamento.responsableNombre}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="max-w-xs truncate text-gray-600 hidden lg:table-cell">
                        {departamento.descripcion || '-'}
                      </TableCell>
                      <TableCell className="text-gray-600 hidden sm:table-cell">{formatDateLong(departamento.createdAt).fecha}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 font-semibold">
                          {departamento.cantidadEspecialidades}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {departamento.estado === 'Activo' ? (
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
                            onClick={() => handleEdit(departamento)}
                            className="h-9 w-9 p-0 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-9 w-9 p-0 hover:bg-red-50 hover:text-red-700 hover:border-red-300"
                            onClick={() => handleDelete(departamento.id)}
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
