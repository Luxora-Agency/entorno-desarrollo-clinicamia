'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2,
  FolderOpen,
  CheckCircle2,
  XCircle,
  Palette
} from 'lucide-react';
import { formatDateLong } from '@/lib/dateUtils';

const COLORES_PRESET = [
  { nombre: 'Rojo', hex: '#EF4444' },
  { nombre: 'Naranja', hex: '#F97316' },
  { nombre: 'Amarillo', hex: '#EAB308' },
  { nombre: 'Verde', hex: '#10B981' },
  { nombre: 'Azul', hex: '#3B82F6' },
  { nombre: 'Índigo', hex: '#6366F1' },
  { nombre: 'Morado', hex: '#8B5CF6' },
  { nombre: 'Rosa', hex: '#EC4899' },
  { nombre: 'Gris', hex: '#6B7280' },
  { nombre: 'Negro', hex: '#1F2937' },
];

export default function CategoriasExamenesModule({ user }) {
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCategoria, setEditingCategoria] = useState(null);
  const [estadisticas, setEstadisticas] = useState({
    total: 0,
    activas: 0,
    inactivas: 0,
  });
  
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    colorHex: '#10B981',
    estado: 'Activo',
  });

  useEffect(() => {
    loadData();
  }, [search]);

  const loadData = async () => {
    try {
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';

      // Cargar categorías
      const categoriasRes = await fetch(`${apiUrl}/categorias-examenes?search=${search}&limit=100`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const categoriasData = await categoriasRes.json();
      setCategorias(categoriasData.data || []);

      // Cargar estadísticas
      const statsRes = await fetch(`${apiUrl}/categorias-examenes/estadisticas`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const statsData = await statsRes.json();
      setEstadisticas(statsData.data || {});

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
      const url = editingCategoria
        ? `${apiUrl}/categorias-examenes/${editingCategoria.id}`
        : `${apiUrl}/categorias-examenes`;

      const method = editingCategoria ? 'PUT' : 'POST';

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
        alert(`✅ Categoría ${editingCategoria ? 'actualizada' : 'creada'} exitosamente`);
        setIsDialogOpen(false);
        resetForm();
        loadData();
      } else {
        alert(data.error || data.message || 'Error al guardar la categoría');
      }
    } catch (error) {
      console.error('Error saving:', error);
      alert('Error al guardar la categoría');
    }
  };

  const handleEdit = (categoria) => {
    setEditingCategoria(categoria);
    setFormData({
      nombre: categoria.nombre || '',
      descripcion: categoria.descripcion || '',
      colorHex: categoria.colorHex || '#10B981',
      estado: categoria.estado || 'Activo',
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Está seguro de eliminar esta categoría? Los exámenes/procedimientos asociados quedarán sin categoría.')) return;

    try {
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';
      const response = await fetch(`${apiUrl}/categorias-examenes/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();
      if (response.ok) {
        alert('✅ Categoría eliminada correctamente');
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
      
      const response = await fetch(`${apiUrl}/categorias-examenes/${id}`, {
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
      nombre: '',
      descripcion: '',
      colorHex: '#10B981',
      estado: 'Activo',
    });
    setEditingCategoria(null);
  };

  return (
    <div className="p-6 lg:p-8 bg-white min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-2.5 rounded-xl">
              <FolderOpen className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Categorías de Exámenes</h1>
          </div>
          <p className="text-gray-600 ml-14">Organiza exámenes y procedimientos por categorías</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-md w-full sm:w-auto h-11 font-semibold">
              <Plus className="w-4 h-4 mr-2" />
              Agregar Categoría
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-[95vw] sm:max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl flex items-center gap-2">
                <FolderOpen className="w-5 h-5 text-emerald-600" />
                {editingCategoria ? 'Editar' : 'Nueva'} Categoría
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <Label htmlFor="nombre" className="text-sm font-semibold text-gray-700 mb-2 block">Nombre de la Categoría *</Label>
                <Input
                  id="nombre"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  required
                  placeholder="Ej: Análisis de Sangre"
                  className="h-11 border-gray-300 focus:border-emerald-500 focus:ring-emerald-500"
                />
              </div>

              <div>
                <Label htmlFor="descripcion" className="text-sm font-semibold text-gray-700 mb-2 block">Descripción *</Label>
                <Textarea
                  id="descripcion"
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  required
                  rows={3}
                  placeholder="Describe la categoría..."
                  className="border-gray-300 focus:border-emerald-500 focus:ring-emerald-500"
                />
              </div>

              <div>
                <Label className="text-sm font-semibold text-gray-700 mb-3 block">Color Identificador</Label>
                
                {/* Vista previa del color */}
                <div className="bg-gray-50 border-2 border-gray-200 rounded-xl p-4 mb-4">
                  <div className="flex items-center gap-4">
                    <div 
                      className="w-16 h-16 rounded-full shadow-md transition-all"
                      style={{ backgroundColor: formData.colorHex }}
                    ></div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Vista Previa</p>
                      <p className="font-mono text-lg font-semibold" style={{ color: formData.colorHex }}>
                        {formData.colorHex.toUpperCase()}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Paleta de colores preset */}
                <div className="mb-4">
                  <p className="text-sm text-gray-600 mb-2">Colores sugeridos:</p>
                  <div className="grid grid-cols-5 gap-2">
                    {COLORES_PRESET.map((color) => (
                      <button
                        key={color.hex}
                        type="button"
                        onClick={() => setFormData({ ...formData, colorHex: color.hex })}
                        className={`w-full h-12 rounded-lg transition-all hover:scale-110 ${
                          formData.colorHex === color.hex 
                            ? 'ring-4 ring-emerald-400 ring-offset-2' 
                            : 'hover:ring-2 hover:ring-gray-300'
                        }`}
                        style={{ backgroundColor: color.hex }}
                        title={color.nombre}
                      ></button>
                    ))}
                  </div>
                </div>

                {/* Input para código hexadecimal personalizado */}
                <div>
                  <Label htmlFor="colorHex" className="text-sm font-semibold text-gray-700 mb-2 block flex items-center gap-2">
                    <Palette className="w-4 h-4" />
                    Código Hexadecimal
                  </Label>
                  <Input
                    id="colorHex"
                    value={formData.colorHex}
                    onChange={(e) => {
                      const value = e.target.value;
                      // Asegurar que siempre empiece con #
                      if (value.startsWith('#')) {
                        setFormData({ ...formData, colorHex: value });
                      } else {
                        setFormData({ ...formData, colorHex: '#' + value });
                      }
                    }}
                    placeholder="#10B981"
                    maxLength={7}
                    className="h-11 border-gray-300 focus:border-emerald-500 focus:ring-emerald-500 font-mono"
                  />
                </div>
              </div>

              <div className="flex flex-col-reverse sm:flex-row gap-3 justify-end pt-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} className="w-full sm:w-auto h-11">
                  Cancelar
                </Button>
                <Button type="submit" className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white w-full sm:w-auto h-11 font-semibold">
                  {editingCategoria ? 'Actualizar' : 'Crear'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="shadow-sm border-emerald-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Categorías</p>
                <p className="text-3xl font-bold text-gray-900">{estadisticas.total || 0}</p>
              </div>
              <div className="bg-emerald-100 p-3 rounded-xl">
                <FolderOpen className="w-6 h-6 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-green-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Activas</p>
                <p className="text-3xl font-bold text-gray-900">{estadisticas.activas || 0}</p>
              </div>
              <div className="bg-green-100 p-3 rounded-xl">
                <CheckCircle2 className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-gray-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Inactivas</p>
                <p className="text-3xl font-bold text-gray-900">{estadisticas.inactivas || 0}</p>
              </div>
              <div className="bg-gray-100 p-3 rounded-xl">
                <XCircle className="w-6 h-6 text-gray-600" />
              </div>
            </div>
          </CardContent>
        </Card>
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
            <FolderOpen className="w-5 h-5 text-emerald-600" />
            Lista de Categorías
            <Badge variant="outline" className="ml-2 bg-emerald-50 text-emerald-700 border-emerald-200">
              {categorias.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-gray-500 mt-4">Cargando...</p>
            </div>
          ) : categorias.length === 0 ? (
            <div className="text-center py-12">
              <FolderOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No hay categorías registradas</p>
              <p className="text-sm text-gray-400 mt-2">Agrega una usando el botón superior</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="font-semibold">Categoría</TableHead>
                    <TableHead className="font-semibold text-center">Exámenes</TableHead>
                    <TableHead className="font-semibold text-center">Procedimientos</TableHead>
                    <TableHead className="font-semibold text-center">Total</TableHead>
                    <TableHead className="font-semibold">Estado</TableHead>
                    <TableHead className="font-semibold hidden lg:table-cell">Fecha de Creación</TableHead>
                    <TableHead className="text-right font-semibold">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categorias.map((categoria) => {
                    const fechaFormateada = formatDateLong(categoria.createdAt);
                    return (
                      <TableRow key={categoria.id} className="hover:bg-gray-50">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="w-10 h-10" style={{ backgroundColor: categoria.colorHex }}>
                              <AvatarFallback className="text-white font-bold">
                                {categoria.nombre.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-semibold text-gray-900">{categoria.nombre}</p>
                              <p className="text-xs text-gray-500 line-clamp-1">{categoria.descripcion}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 font-semibold">
                            {categoria.totalExamenes || 0}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 font-semibold">
                            {categoria.totalProcedimientos || 0}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 font-semibold">
                            {categoria.total || 0}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleCambiarEstado(categoria.id, categoria.estado === 'Activo' ? 'Inactivo' : 'Activo')}
                            className="h-8 px-0"
                          >
                            {categoria.estado === 'Activo' ? (
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
                        <TableCell className="hidden lg:table-cell">
                          <div>
                            <p className="text-sm text-gray-900 font-medium">{fechaFormateada.fecha}</p>
                            <p className="text-xs text-gray-500 capitalize">{fechaFormateada.dia}</p>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEdit(categoria)}
                              className="h-9 w-9 p-0 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-9 w-9 p-0 hover:bg-red-50 hover:text-red-700 hover:border-red-300"
                              onClick={() => handleDelete(categoria.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
