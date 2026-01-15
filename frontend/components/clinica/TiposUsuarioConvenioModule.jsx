'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Users, FileText, Power, PowerOff } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { formatDateLong } from '@/lib/dateUtils';

export default function TiposUsuarioConvenioModule({ user }) {
  const [tipos, setTipos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTipo, setEditingTipo] = useState(null);
  const [formData, setFormData] = useState({
    nombre: '',
    codigoConvenio: '',
    descripcion: '',
    activo: true,
  });

  useEffect(() => {
    if (!isDialogOpen) {
      loadTipos();
    }
  }, [isDialogOpen]);

  const loadTipos = async () => {
    try {
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';
      const response = await fetch(`${apiUrl}/tipos-usuario-convenio?incluirInactivos=true`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      setTipos(data.data || []);
    } catch (error) {
      console.error('Error loading tipos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (tipo) => {
    setEditingTipo(tipo);
    setFormData({
      nombre: tipo.nombre || '',
      codigoConvenio: tipo.codigoConvenio || '',
      descripcion: tipo.descripcion || '',
      activo: tipo.activo !== undefined ? tipo.activo : true,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Está seguro de eliminar este tipo de usuario?')) return;

    try {
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';
      await fetch(`${apiUrl}/tipos-usuario-convenio/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      loadTipos();
    } catch (error) {
      console.error('Error deleting tipo:', error);
      alert('Error al eliminar el tipo de usuario');
    }
  };

  const handleToggleActivo = async (id) => {
    try {
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';
      await fetch(`${apiUrl}/tipos-usuario-convenio/${id}/toggle`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });
      loadTipos();
    } catch (error) {
      console.error('Error toggling tipo:', error);
      alert('Error al cambiar estado');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';

    try {
      const url = editingTipo
        ? `${apiUrl}/tipos-usuario-convenio/${editingTipo.id}`
        : `${apiUrl}/tipos-usuario-convenio`;

      const method = editingTipo ? 'PUT' : 'POST';

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
        alert(error.message || 'Error al guardar el tipo de usuario');
      }
    } catch (error) {
      console.error('Error saving tipo:', error);
      alert('Error al guardar el tipo de usuario');
    }
  };

  const resetForm = () => {
    setFormData({
      nombre: '',
      codigoConvenio: '',
      descripcion: '',
      activo: true,
    });
    setEditingTipo(null);
  };

  return (
    <div className="p-6 lg:p-8 bg-white min-h-screen">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-gradient-to-br from-violet-500 to-purple-600 p-2.5 rounded-xl">
              <Users className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Tipos de Usuario y Convenios</h1>
          </div>
          <p className="text-gray-600 ml-14">Configura los tipos de usuario y sus códigos de convenio asociados</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white shadow-md w-full sm:w-auto h-11 font-semibold">
              <Plus className="w-4 h-4 mr-2" />
              Agregar Tipo de Usuario
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingTipo ? 'Editar Tipo de Usuario' : 'Nuevo Tipo de Usuario'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Nombre del Tipo *</Label>
                <Input
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  required
                  placeholder="Ej: Cotizante, Beneficiario, Pensionado"
                  className="mt-2"
                />
              </div>
              <div>
                <Label>Código de Convenio *</Label>
                <Input
                  value={formData.codigoConvenio}
                  onChange={(e) => setFormData({ ...formData, codigoConvenio: e.target.value })}
                  required
                  placeholder="Ej: CONV-001"
                  className="mt-2"
                />
              </div>
              <div>
                <Label>Descripción</Label>
                <Textarea
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  placeholder="Descripción del tipo de usuario..."
                  className="mt-2"
                  rows={3}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label>Estado Activo</Label>
                <Switch
                  checked={formData.activo}
                  onCheckedChange={(checked) => setFormData({ ...formData, activo: checked })}
                />
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700">
                  {editingTipo ? 'Actualizar' : 'Guardar'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-violet-600" />
            <CardTitle className="text-xl">Lista de Tipos de Usuario</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-center py-8 text-gray-500">Cargando...</p>
          ) : tipos.length === 0 ? (
            <p className="text-center py-8 text-gray-500">No hay tipos de usuario registrados</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="font-bold">Nombre</TableHead>
                    <TableHead className="font-bold">Código Convenio</TableHead>
                    <TableHead className="font-bold">Descripción</TableHead>
                    <TableHead className="font-bold">Estado</TableHead>
                    <TableHead className="font-bold">Fecha Creación</TableHead>
                    <TableHead className="font-bold text-center">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tipos.map((tipo) => (
                    <TableRow key={tipo.id} className={`hover:bg-gray-50 ${!tipo.activo ? 'opacity-60' : ''}`}>
                      <TableCell className="font-semibold text-gray-900">{tipo.nombre}</TableCell>
                      <TableCell>
                        <Badge className="bg-violet-100 text-violet-700 border-violet-200 font-mono">
                          {tipo.codigoConvenio}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-gray-600 max-w-xs truncate">{tipo.descripcion || '-'}</TableCell>
                      <TableCell>
                        <Badge className={tipo.activo
                          ? 'bg-green-100 text-green-700 border-green-200'
                          : 'bg-gray-100 text-gray-600 border-gray-200'
                        }>
                          {tipo.activo ? 'Activo' : 'Inactivo'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-gray-600">
                        {tipo.createdAt ? formatDateLong(tipo.createdAt).fecha : '-'}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleToggleActivo(tipo.id)}
                            className={tipo.activo
                              ? 'hover:bg-orange-50 hover:text-orange-600'
                              : 'hover:bg-green-50 hover:text-green-600'
                            }
                            title={tipo.activo ? 'Desactivar' : 'Activar'}
                          >
                            {tipo.activo ? <PowerOff className="w-4 h-4" /> : <Power className="w-4 h-4" />}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEdit(tipo)}
                            className="hover:bg-blue-50 hover:text-blue-600"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDelete(tipo.id)}
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
