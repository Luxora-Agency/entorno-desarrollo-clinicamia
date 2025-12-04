'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Search, Edit, Trash2, User } from 'lucide-react';

export default function PacientesModule({ user }) {
  const [pacientes, setPacientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPaciente, setEditingPaciente] = useState(null);
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    cedula: '',
    fecha_nacimiento: '',
    genero: '',
    telefono: '',
    email: '',
    direccion: '',
    tipo_sangre: '',
    alergias: '',
    contacto_emergencia_nombre: '',
    contacto_emergencia_telefono: '',
  });

  useEffect(() => {
    loadPacientes();
  }, [search]);

  const loadPacientes = async () => {
    try {
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';
      const response = await fetch(`${apiUrl}/pacientes?search=${search}&limit=50`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      setPacientes(data.pacientes || []);
    } catch (error) {
      console.error('Error loading pacientes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';

    try {
      const url = editingPaciente
        ? `${apiUrl}/pacientes/${editingPaciente.id}`
        : `${apiUrl}/pacientes`;
      
      const method = editingPaciente ? 'PUT' : 'POST';

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
        loadPacientes();
      }
    } catch (error) {
      console.error('Error saving paciente:', error);
    }
  };

  const handleEdit = (paciente) => {
    setEditingPaciente(paciente);
    setFormData({
      nombre: paciente.nombre || '',
      apellido: paciente.apellido || '',
      cedula: paciente.cedula || '',
      fecha_nacimiento: paciente.fecha_nacimiento || '',
      genero: paciente.genero || '',
      telefono: paciente.telefono || '',
      email: paciente.email || '',
      direccion: paciente.direccion || '',
      tipo_sangre: paciente.tipo_sangre || '',
      alergias: paciente.alergias || '',
      contacto_emergencia_nombre: paciente.contacto_emergencia_nombre || '',
      contacto_emergencia_telefono: paciente.contacto_emergencia_telefono || '',
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Está seguro de eliminar este paciente?')) return;

    try {
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';
      await fetch(`${apiUrl}/pacientes/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      loadPacientes();
    } catch (error) {
      console.error('Error deleting paciente:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      nombre: '',
      apellido: '',
      cedula: '',
      fecha_nacimiento: '',
      genero: '',
      telefono: '',
      email: '',
      direccion: '',
      tipo_sangre: '',
      alergias: '',
      contacto_emergencia_nombre: '',
      contacto_emergencia_telefono: '',
    });
    setEditingPaciente(null);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Gestión de Pacientes</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">Administra los pacientes de la clínica</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button className="bg-teal-500 hover:bg-teal-600 w-full sm:w-auto">
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Paciente
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-lg sm:text-xl">
                {editingPaciente ? 'Editar Paciente' : 'Nuevo Paciente'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="nombre" className="text-sm sm:text-base">Nombre *</Label>
                  <Input
                    id="nombre"
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    required
                    className="h-11 sm:h-12"
                  />
                </div>
                <div>
                  <Label htmlFor="apellido" className="text-sm sm:text-base">Apellido *</Label>
                  <Input
                    id="apellido"
                    value={formData.apellido}
                    onChange={(e) => setFormData({ ...formData, apellido: e.target.value })}
                    required
                    className="h-11 sm:h-12"
                  />
                </div>
                <div>
                  <Label htmlFor="cedula" className="text-sm sm:text-base">Cédula *</Label>
                  <Input
                    id="cedula"
                    value={formData.cedula}
                    onChange={(e) => setFormData({ ...formData, cedula: e.target.value })}
                    required
                    className="h-11 sm:h-12"
                  />
                </div>
                <div>
                  <Label htmlFor="fecha_nacimiento" className="text-sm sm:text-base">Fecha de Nacimiento *</Label>
                  <Input
                    id="fecha_nacimiento"
                    type="date"
                    value={formData.fecha_nacimiento}
                    onChange={(e) => setFormData({ ...formData, fecha_nacimiento: e.target.value })}
                    required
                    className="h-11 sm:h-12"
                  />
                </div>
                <div>
                  <Label htmlFor="genero" className="text-sm sm:text-base">Género</Label>
                  <Select value={formData.genero} onValueChange={(value) => setFormData({ ...formData, genero: value })}>
                    <SelectTrigger className="h-11 sm:h-12">
                      <SelectValue placeholder="Seleccionar" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Masculino">Masculino</SelectItem>
                      <SelectItem value="Femenino">Femenino</SelectItem>
                      <SelectItem value="Otro">Otro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="tipo_sangre" className="text-sm sm:text-base">Tipo de Sangre</Label>
                  <Input
                    id="tipo_sangre"
                    value={formData.tipo_sangre}
                    onChange={(e) => setFormData({ ...formData, tipo_sangre: e.target.value })}
                    placeholder="Ej: O+"
                    className="h-11 sm:h-12"
                  />
                </div>
                <div>
                  <Label htmlFor="telefono" className="text-sm sm:text-base">Teléfono</Label>
                  <Input
                    id="telefono"
                    value={formData.telefono}
                    onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                    className="h-11 sm:h-12"
                  />
                </div>
                <div>
                  <Label htmlFor="email" className="text-sm sm:text-base">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="h-11 sm:h-12"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="direccion" className="text-sm sm:text-base">Dirección</Label>
                <Input
                  id="direccion"
                  value={formData.direccion}
                  onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                  className="h-11 sm:h-12"
                />
              </div>
              <div>
                <Label htmlFor="alergias" className="text-sm sm:text-base">Alergias</Label>
                <Input
                  id="alergias"
                  value={formData.alergias}
                  onChange={(e) => setFormData({ ...formData, alergias: e.target.value })}
                  placeholder="Enumere las alergias conocidas"
                  className="h-11 sm:h-12"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="contacto_emergencia_nombre" className="text-sm sm:text-base">Contacto de Emergencia</Label>
                  <Input
                    id="contacto_emergencia_nombre"
                    value={formData.contacto_emergencia_nombre}
                    onChange={(e) => setFormData({ ...formData, contacto_emergencia_nombre: e.target.value })}
                    className="h-11 sm:h-12"
                  />
                </div>
                <div>
                  <Label htmlFor="contacto_emergencia_telefono" className="text-sm sm:text-base">Teléfono de Emergencia</Label>
                  <Input
                    id="contacto_emergencia_telefono"
                    value={formData.contacto_emergencia_telefono}
                    onChange={(e) => setFormData({ ...formData, contacto_emergencia_telefono: e.target.value })}
                    className="h-11 sm:h-12"
                  />
                </div>
              </div>
              <div className="flex flex-col-reverse sm:flex-row gap-2 justify-end pt-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} className="w-full sm:w-auto">
                  Cancelar
                </Button>
                <Button type="submit" className="bg-teal-500 hover:bg-teal-600 w-full sm:w-auto">
                  {editingPaciente ? 'Actualizar' : 'Crear'}
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
              placeholder="Buscar por nombre, apellido o cédula..."
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
          <CardTitle className="text-lg sm:text-xl">Lista de Pacientes ({pacientes.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-center py-8 text-gray-500 text-sm sm:text-base">Cargando...</p>
          ) : pacientes.length === 0 ? (
            <p className="text-center py-8 text-gray-500 text-sm sm:text-base">No hay pacientes registrados</p>
          ) : (
            <div className="overflow-x-auto -mx-2 sm:mx-0">
              <div className="inline-block min-w-full align-middle">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs sm:text-sm">Nombre</TableHead>
                      <TableHead className="text-xs sm:text-sm">Cédula</TableHead>
                      <TableHead className="text-xs sm:text-sm hidden md:table-cell">Teléfono</TableHead>
                      <TableHead className="text-xs sm:text-sm hidden lg:table-cell">Email</TableHead>
                      <TableHead className="text-xs sm:text-sm hidden sm:table-cell">Tipo Sangre</TableHead>
                      <TableHead className="text-right text-xs sm:text-sm">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pacientes.map((paciente) => (
                      <TableRow key={paciente.id}>
                        <TableCell className="font-medium text-xs sm:text-sm">
                          {paciente.nombre} {paciente.apellido}
                        </TableCell>
                        <TableCell className="text-xs sm:text-sm">{paciente.cedula}</TableCell>
                        <TableCell className="text-xs sm:text-sm hidden md:table-cell">{paciente.telefono || '-'}</TableCell>
                        <TableCell className="text-xs sm:text-sm hidden lg:table-cell">{paciente.email || '-'}</TableCell>
                        <TableCell className="text-xs sm:text-sm hidden sm:table-cell">{paciente.tipo_sangre || '-'}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1 sm:gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEdit(paciente)}
                              className="h-8 w-8 p-0 sm:h-9 sm:w-9"
                            >
                              <Edit className="w-3 h-3 sm:w-4 sm:h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-red-600 hover:text-red-700 h-8 w-8 p-0 sm:h-9 sm:w-9"
                              onClick={() => handleDelete(paciente.id)}
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
