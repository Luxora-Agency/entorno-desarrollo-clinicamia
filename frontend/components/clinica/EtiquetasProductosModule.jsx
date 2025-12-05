'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Tags, Tag } from 'lucide-react';
import { formatDateLong } from '@/lib/dateUtils';

export default function EtiquetasProductosModule({ user }) {
  const [etiquetas, setEtiquetas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEtiqueta, setEditingEtiqueta] = useState(null);
  const [formData, setFormData] = useState({
    nombre: '',
    color: '#3b82f6',
  });

  useEffect(() => {
    if (!isDialogOpen) {
      loadEtiquetas();
    }
  }, [isDialogOpen]);

  const loadEtiquetas = async () => {
    try {
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';
      const response = await fetch(`${apiUrl}/etiquetas-productos`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      setEtiquetas(data.data || []);
    } catch (error) {
      console.error('Error loading etiquetas:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (etiqueta) => {
    setEditingEtiqueta(etiqueta);
    setFormData({
      nombre: etiqueta.nombre || '',
      color: etiqueta.color || '#3b82f6',
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Está seguro de eliminar esta etiqueta?')) return;

    try {
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';
      await fetch(`${apiUrl}/etiquetas-productos/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      loadEtiquetas();
    } catch (error) {
      console.error('Error deleting etiqueta:', error);
      alert('Error al eliminar la etiqueta');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';

    try {
      const url = editingEtiqueta
        ? `${apiUrl}/etiquetas-productos/${editingEtiqueta.id}`
        : `${apiUrl}/etiquetas-productos`;
      
      const method = editingEtiqueta ? 'PUT' : 'POST';

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
        alert(error.error || 'Error al guardar la etiqueta');
      }
    } catch (error) {
      console.error('Error saving etiqueta:', error);
      alert('Error al guardar la etiqueta');
    }
  };

  const resetForm = () => {
    setFormData({
      nombre: '',
      color: '#3b82f6',
    });
    setEditingEtiqueta(null);
  };

  return (
    <div className="p-6 lg:p-8 bg-white min-h-screen">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-2.5 rounded-xl">
              <Tags className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Etiquetas de Productos</h1>
          </div>
          <p className="text-gray-600 ml-14">Etiqueta y clasifica tus productos</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-md w-full sm:w-auto h-11 font-semibold">
              <Plus className="w-4 h-4 mr-2" />
              Agregar Etiqueta
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingEtiqueta ? 'Editar Etiqueta' : 'Nueva Etiqueta'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Nombre *</Label>
                <Input
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  required
                  placeholder="Ej: Genérico"
                  className="mt-2"
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
                  {editingEtiqueta ? 'Actualizar' : 'Guardar'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Tag className="w-5 h-5 text-emerald-600" />
            <CardTitle className="text-xl">Lista de Etiquetas</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-center py-8 text-gray-500">Cargando...</p>
          ) : etiquetas.length === 0 ? (
            <p className="text-center py-8 text-gray-500">No hay etiquetas registradas</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="font-bold">Color</TableHead>
                    <TableHead className="font-bold">Nombre</TableHead>
                    <TableHead className="font-bold">Productos</TableHead>
                    <TableHead className="font-bold">Fecha Creación</TableHead>
                    <TableHead className="font-bold text-center">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {etiquetas.map((etiqueta) => (
                    <TableRow key={etiqueta.id} className="hover:bg-gray-50">
                      <TableCell>
                        <div
                          className="w-8 h-8 rounded-lg border-2 border-gray-200"
                          style={{ backgroundColor: etiqueta.color }}
                        />
                      </TableCell>
                      <TableCell className="font-semibold text-gray-900">{etiqueta.nombre}</TableCell>
                      <TableCell>
                        <Badge className="bg-blue-100 text-blue-700 border-blue-200">
                          {etiqueta.totalProductos || 0} productos
                        </Badge>
                      </TableCell>
                      <TableCell className="text-gray-600">
                        {formatDateLong(etiqueta.createdAt).fecha}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEdit(etiqueta)}
                            className="hover:bg-blue-50 hover:text-blue-600"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDelete(etiqueta.id)}
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
