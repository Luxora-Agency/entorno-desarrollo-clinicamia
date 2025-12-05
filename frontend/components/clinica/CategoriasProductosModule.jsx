'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, FolderOpen, Package } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { formatDateLong } from '@/lib/dateUtils';

export default function CategoriasProductosModule({ user }) {
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCategoria, setEditingCategoria] = useState(null);
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    color: '#10b981',
  });

  useEffect(() => {
    if (!isDialogOpen) {
      loadCategorias();
    }
  }, [isDialogOpen]);

  const loadCategorias = async () => {
    try {
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';
      const response = await fetch(`${apiUrl}/categorias-productos`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      setCategorias(data.data || []);
    } catch (error) {
      console.error('Error loading categorias:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (categoria) => {
    setEditingCategoria(categoria);
    setFormData({
      nombre: categoria.nombre || '',
      descripcion: categoria.descripcion || '',
      color: categoria.color || '#10b981',
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Está seguro de eliminar esta categoría?')) return;

    try {
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';
      await fetch(`${apiUrl}/categorias-productos/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      loadCategorias();
    } catch (error) {
      console.error('Error deleting categoria:', error);
      alert('Error al eliminar la categoría');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';

    try {
      const url = editingCategoria
        ? `${apiUrl}/categorias-productos/${editingCategoria.id}`
        : `${apiUrl}/categorias-productos`;
      
      const method = editingCategoria ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setIsDialogOpen(false);
        resetForm();
      } else {
        const error = await response.json();
        alert(error.error || 'Error al guardar la categoría');
      }
    } catch (error) {
      console.error('Error saving categoria:', error);
      alert('Error al guardar la categoría');
    }
  };

  const resetForm = () => {
    setFormData({
      nombre: '',
      descripcion: '',
      color: '#10b981',
    });
    setEditingCategoria(null);
  };

  return (
    <div className="p-6 lg:p-8 bg-white min-h-screen">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-2.5 rounded-xl">
              <FolderOpen className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Categorías de Productos</h1>
          </div>
          <p className="text-gray-600 ml-14">Organiza tus productos farmacéuticos por categorías</p>
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
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingCategoria ? 'Editar Categoría' : 'Nueva Categoría'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Nombre *</Label>
                <Input
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  required
                  placeholder="Ej: Analgésicos"
                  className="mt-2"
                />
              </div>
              <div>
                <Label>Descripción</Label>
                <Textarea
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  placeholder="Descripción de la categoría..."
                  className="mt-2"
                  rows={3}
                />
              </div>
              <div>
                <Label>Color</Label>
                <Input
                  type="color"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  className="mt-2 h-12"
                />
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700">
                  {editingCategoria ? 'Actualizar' : 'Guardar'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-emerald-600" />
            <CardTitle className="text-xl">Lista de Categorías</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-center py-8 text-gray-500">Cargando...</p>
          ) : categorias.length === 0 ? (
            <p className="text-center py-8 text-gray-500">No hay categorías registradas</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="font-bold">Color</TableHead>
                    <TableHead className="font-bold">Nombre</TableHead>
                    <TableHead className="font-bold">Descripción</TableHead>
                    <TableHead className="font-bold">Productos</TableHead>
                    <TableHead className="font-bold">Fecha Creación</TableHead>
                    <TableHead className="font-bold text-center">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categorias.map((categoria) => (
                    <TableRow key={categoria.id} className="hover:bg-gray-50">
                      <TableCell>
                        <div
                          className="w-8 h-8 rounded-lg border-2 border-gray-200"
                          style={{ backgroundColor: categoria.color }}
                        />
                      </TableCell>
                      <TableCell className="font-semibold text-gray-900">{categoria.nombre}</TableCell>
                      <TableCell className="text-gray-600">{categoria.descripcion || '-'}</TableCell>
                      <TableCell>
                        <Badge className="bg-blue-100 text-blue-700 border-blue-200">
                          {categoria.totalProductos || 0} productos
                        </Badge>
                      </TableCell>
                      <TableCell className="text-gray-600">
                        {formatDateLong(categoria.createdAt).fecha}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEdit(categoria)}
                            className="hover:bg-blue-50 hover:text-blue-600"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDelete(categoria.id)}
                            className="hover:bg-red-50 hover:text-red-600"
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
