'use client';

import { useState, useEffect } from 'react';
import {
  Plus, Search, Filter, Users, Eye, FileText, Phone, Mail,
  Building2, Calendar, MoreVertical, Download, Upload, Grid, List
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuTrigger, DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import useTalentoHumano from '@/hooks/useTalentoHumano';

const ESTADO_COLORS = {
  ACTIVO: 'bg-green-100 text-green-700',
  INACTIVO: 'bg-gray-100 text-gray-700',
  VACACIONES: 'bg-blue-100 text-blue-700',
  INCAPACIDAD: 'bg-orange-100 text-orange-700',
  LICENCIA: 'bg-purple-100 text-purple-700',
  SUSPENDIDO: 'bg-red-100 text-red-700',
  RETIRADO: 'bg-gray-100 text-gray-500',
};

const TIPO_EMPLEADO_LABELS = {
  MEDICO: 'Medico',
  ENFERMERIA: 'Enfermeria',
  ADMINISTRATIVO: 'Administrativo',
  ASISTENCIAL: 'Asistencial',
  TECNICO: 'Tecnico',
  DIRECTIVO: 'Directivo',
  OPERATIVO: 'Operativo',
  PRACTICANTE: 'Practicante',
};

function EmpleadoCard({ empleado, onView, onEdit }) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="pt-4">
        <div className="flex items-start gap-4">
          <Avatar className="w-14 h-14">
            <AvatarImage src={empleado.fotoUrl} />
            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
              {empleado.nombre[0]}{empleado.apellido[0]}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold truncate">{empleado.nombre} {empleado.apellido}</h3>
              <Badge className={ESTADO_COLORS[empleado.estado]}>{empleado.estado}</Badge>
            </div>
            <p className="text-sm text-gray-600">{empleado.cargo?.nombre || 'Sin cargo'}</p>
            <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <Building2 className="w-3 h-3" />
                {empleado.departamentoRel?.nombre || 'Sin departamento'}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {new Date(empleado.fechaIngreso).toLocaleDateString()}
              </span>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onView(empleado)}>
                <Eye className="w-4 h-4 mr-2" />
                Ver expediente
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onEdit(empleado)}>
                <FileText className="w-4 h-4 mr-2" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Phone className="w-4 h-4 mr-2" />
                {empleado.telefono}
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Mail className="w-4 h-4 mr-2" />
                {empleado.email}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="flex items-center justify-between mt-4 pt-3 border-t">
          <Badge variant="outline">{TIPO_EMPLEADO_LABELS[empleado.tipoEmpleado]}</Badge>
          <span className="text-xs text-gray-400">ID: {empleado.documento}</span>
        </div>
      </CardContent>
    </Card>
  );
}

function EmpleadoRow({ empleado, onView, onEdit }) {
  return (
    <div className="flex items-center justify-between p-4 bg-white rounded-lg border hover:shadow-sm transition-shadow">
      <div className="flex items-center gap-4">
        <Avatar>
          <AvatarImage src={empleado.fotoUrl} />
          <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
            {empleado.nombre[0]}{empleado.apellido[0]}
          </AvatarFallback>
        </Avatar>
        <div>
          <h4 className="font-medium">{empleado.nombre} {empleado.apellido}</h4>
          <p className="text-sm text-gray-500">{empleado.cargo?.nombre}</p>
        </div>
      </div>
      <div className="flex items-center gap-8">
        <div className="text-sm">
          <p className="text-gray-500">{empleado.departamentoRel?.nombre}</p>
        </div>
        <div className="text-sm">
          <p className="text-gray-500">{empleado.email}</p>
        </div>
        <Badge className={ESTADO_COLORS[empleado.estado]}>{empleado.estado}</Badge>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => onView(empleado)}>
            <Eye className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => onEdit(empleado)}>
            <FileText className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function EmpleadosTab({ user }) {
  const [viewMode, setViewMode] = useState('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEstado, setFilterEstado] = useState('');
  const [filterTipo, setFilterTipo] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedEmpleado, setSelectedEmpleado] = useState(null);

  const { empleados, loading, fetchEmpleados, createEmpleado, updateEmpleado } = useTalentoHumano();

  useEffect(() => {
    fetchEmpleados();
  }, []);

  const filteredEmpleados = empleados.filter(e => {
    const matchSearch =
      e.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.apellido.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.documento.includes(searchTerm) ||
      e.email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchEstado = !filterEstado || filterEstado === 'ALL' || e.estado === filterEstado;
    const matchTipo = !filterTipo || filterTipo === 'ALL' || e.tipoEmpleado === filterTipo;

    return matchSearch && matchEstado && matchTipo;
  });

  const handleCreateEmpleado = async (data) => {
    try {
      await createEmpleado(data);
      setShowCreateModal(false);
      fetchEmpleados();
    } catch (error) {
      console.error('Error creating empleado:', error);
    }
  };

  const handleUpdateEmpleado = async (id, data) => {
    try {
      await updateEmpleado(id, data);
      setShowEditModal(false);
      setSelectedEmpleado(null);
      fetchEmpleados();
    } catch (error) {
      console.error('Error updating empleado:', error);
    }
  };

  const openViewModal = (empleado) => {
    setSelectedEmpleado(empleado);
    setShowViewModal(true);
  };

  const openEditModal = (empleado) => {
    setSelectedEmpleado(empleado);
    setShowEditModal(true);
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="text-center">
              <p className="text-3xl font-bold text-blue-600">{empleados.length}</p>
              <p className="text-sm text-gray-500">Total</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-center">
              <p className="text-3xl font-bold text-green-600">
                {empleados.filter(e => e.estado === 'ACTIVO').length}
              </p>
              <p className="text-sm text-gray-500">Activos</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-center">
              <p className="text-3xl font-bold text-blue-600">
                {empleados.filter(e => e.estado === 'VACACIONES').length}
              </p>
              <p className="text-sm text-gray-500">Vacaciones</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-center">
              <p className="text-3xl font-bold text-orange-600">
                {empleados.filter(e => e.estado === 'INCAPACIDAD').length}
              </p>
              <p className="text-sm text-gray-500">Incapacidad</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-center">
              <p className="text-3xl font-bold text-gray-600">
                {empleados.filter(e => e.estado === 'RETIRADO').length}
              </p>
              <p className="text-sm text-gray-500">Retirados</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Buscar por nombre, documento o email..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Select value={filterEstado} onValueChange={setFilterEstado}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todos</SelectItem>
              <SelectItem value="ACTIVO">Activo</SelectItem>
              <SelectItem value="INACTIVO">Inactivo</SelectItem>
              <SelectItem value="VACACIONES">Vacaciones</SelectItem>
              <SelectItem value="INCAPACIDAD">Incapacidad</SelectItem>
              <SelectItem value="LICENCIA">Licencia</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterTipo} onValueChange={setFilterTipo}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todos</SelectItem>
              <SelectItem value="MEDICO">Medico</SelectItem>
              <SelectItem value="ENFERMERIA">Enfermeria</SelectItem>
              <SelectItem value="ADMINISTRATIVO">Administrativo</SelectItem>
              <SelectItem value="ASISTENCIAL">Asistencial</SelectItem>
              <SelectItem value="TECNICO">Tecnico</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center border rounded-lg">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
              className="rounded-r-none"
            >
              <Grid className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="rounded-l-none"
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Empleado
          </Button>
        </div>
      </div>

      {/* Lista de empleados */}
      {loading ? (
        <div className="text-center py-12 text-gray-400">Cargando empleados...</div>
      ) : filteredEmpleados.length === 0 ? (
        <div className="text-center py-12">
          <Users className="w-12 h-12 mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-500">No hay empleados</h3>
          <p className="text-sm text-gray-400 mt-1">
            {searchTerm ? 'No se encontraron resultados' : 'Agrega un nuevo empleado para comenzar'}
          </p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredEmpleados.map(empleado => (
            <EmpleadoCard
              key={empleado.id}
              empleado={empleado}
              onView={openViewModal}
              onEdit={openEditModal}
            />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {filteredEmpleados.map(empleado => (
            <EmpleadoRow
              key={empleado.id}
              empleado={empleado}
              onView={openViewModal}
              onEdit={openEditModal}
            />
          ))}
        </div>
      )}

      {/* Modal crear empleado */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nuevo Empleado</DialogTitle>
            <DialogDescription>
              Registra un nuevo empleado en el sistema
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            handleCreateEmpleado({
              tipoDocumento: formData.get('tipoDocumento'),
              documento: formData.get('documento'),
              nombre: formData.get('nombre'),
              apellido: formData.get('apellido'),
              email: formData.get('email'),
              telefono: formData.get('telefono'),
              tipoEmpleado: formData.get('tipoEmpleado'),
              cargoId: formData.get('cargoId') || null,
              fechaIngreso: new Date().toISOString(),
            });
          }}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Tipo Documento</Label>
                  <Select name="tipoDocumento" defaultValue="CC">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CC">Cedula Ciudadania</SelectItem>
                      <SelectItem value="CE">Cedula Extranjeria</SelectItem>
                      <SelectItem value="PA">Pasaporte</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Numero Documento</Label>
                  <Input name="documento" placeholder="1234567890" required />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Nombre</Label>
                  <Input name="nombre" placeholder="Nombre" required />
                </div>
                <div className="grid gap-2">
                  <Label>Apellido</Label>
                  <Input name="apellido" placeholder="Apellido" required />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Email</Label>
                  <Input name="email" type="email" placeholder="email@ejemplo.com" required />
                </div>
                <div className="grid gap-2">
                  <Label>Telefono</Label>
                  <Input name="telefono" placeholder="3001234567" required />
                </div>
              </div>
              <div className="grid gap-2">
                <Label>Tipo de Empleado</Label>
                <Select name="tipoEmpleado" defaultValue="ADMINISTRATIVO">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MEDICO">Medico</SelectItem>
                    <SelectItem value="ENFERMERIA">Enfermeria</SelectItem>
                    <SelectItem value="ADMINISTRATIVO">Administrativo</SelectItem>
                    <SelectItem value="ASISTENCIAL">Asistencial</SelectItem>
                    <SelectItem value="TECNICO">Tecnico</SelectItem>
                    <SelectItem value="DIRECTIVO">Directivo</SelectItem>
                    <SelectItem value="OPERATIVO">Operativo</SelectItem>
                    <SelectItem value="PRACTICANTE">Practicante</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowCreateModal(false)}>
                Cancelar
              </Button>
              <Button type="submit">
                Crear Empleado
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal Editar Empleado */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Empleado</DialogTitle>
            <DialogDescription>
              Actualizar información del empleado
            </DialogDescription>
          </DialogHeader>
          {selectedEmpleado && (
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.target);
              handleUpdateEmpleado(selectedEmpleado.id, {
                nombre: formData.get('nombre'),
                apellido: formData.get('apellido'),
                email: formData.get('email'),
                telefono: formData.get('telefono'),
                tipoEmpleado: formData.get('tipoEmpleado'),
                estado: formData.get('estado'),
              });
            }}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Nombre</Label>
                    <Input name="nombre" defaultValue={selectedEmpleado.nombre} required />
                  </div>
                  <div className="grid gap-2">
                    <Label>Apellido</Label>
                    <Input name="apellido" defaultValue={selectedEmpleado.apellido} required />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Email</Label>
                    <Input name="email" type="email" defaultValue={selectedEmpleado.email} required />
                  </div>
                  <div className="grid gap-2">
                    <Label>Teléfono</Label>
                    <Input name="telefono" defaultValue={selectedEmpleado.telefono} required />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Tipo de Empleado</Label>
                    <Select name="tipoEmpleado" defaultValue={selectedEmpleado.tipoEmpleado}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MEDICO">Médico</SelectItem>
                        <SelectItem value="ENFERMERIA">Enfermería</SelectItem>
                        <SelectItem value="ADMINISTRATIVO">Administrativo</SelectItem>
                        <SelectItem value="ASISTENCIAL">Asistencial</SelectItem>
                        <SelectItem value="TECNICO">Técnico</SelectItem>
                        <SelectItem value="DIRECTIVO">Directivo</SelectItem>
                        <SelectItem value="OPERATIVO">Operativo</SelectItem>
                        <SelectItem value="PRACTICANTE">Practicante</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label>Estado</Label>
                    <Select name="estado" defaultValue={selectedEmpleado.estado}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ACTIVO">Activo</SelectItem>
                        <SelectItem value="INACTIVO">Inactivo</SelectItem>
                        <SelectItem value="VACACIONES">Vacaciones</SelectItem>
                        <SelectItem value="INCAPACIDAD">Incapacidad</SelectItem>
                        <SelectItem value="LICENCIA">Licencia</SelectItem>
                        <SelectItem value="SUSPENDIDO">Suspendido</SelectItem>
                        <SelectItem value="RETIRADO">Retirado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowEditModal(false)}>
                  Cancelar
                </Button>
                <Button type="submit">
                  Guardar Cambios
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal Ver Empleado */}
      <Dialog open={showViewModal} onOpenChange={setShowViewModal}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Expediente del Empleado</DialogTitle>
          </DialogHeader>
          {selectedEmpleado && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-4">
              <div className="col-span-1 flex flex-col items-center text-center space-y-3">
                <Avatar className="w-32 h-32">
                  <AvatarImage src={selectedEmpleado.fotoUrl} />
                  <AvatarFallback className="text-4xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
                    {selectedEmpleado.nombre[0]}{selectedEmpleado.apellido[0]}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-bold text-xl">{selectedEmpleado.nombre} {selectedEmpleado.apellido}</h3>
                  <Badge className={ESTADO_COLORS[selectedEmpleado.estado]}>{selectedEmpleado.estado}</Badge>
                </div>
                <div className="text-sm text-gray-500 space-y-1">
                  <p>{selectedEmpleado.tipoDocumento}: {selectedEmpleado.documento}</p>
                  <p>{selectedEmpleado.email}</p>
                  <p>{selectedEmpleado.telefono}</p>
                </div>
              </div>
              <div className="col-span-2 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-gray-500">Cargo</Label>
                    <p className="font-medium">{selectedEmpleado.cargo?.nombre || 'Sin cargo asignado'}</p>
                  </div>
                  <div>
                    <Label className="text-gray-500">Departamento</Label>
                    <p className="font-medium">{selectedEmpleado.departamentoRel?.nombre || 'Sin departamento'}</p>
                  </div>
                  <div>
                    <Label className="text-gray-500">Tipo de Contrato</Label>
                    <p className="font-medium">{selectedEmpleado.tipoEmpleado}</p>
                  </div>
                  <div>
                    <Label className="text-gray-500">Fecha Ingreso</Label>
                    <p className="font-medium">{new Date(selectedEmpleado.fechaIngreso).toLocaleDateString()}</p>
                  </div>
                </div>
                
                <div className="border-t pt-4">
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Información Laboral
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-500">Salario Base</p>
                      <p className="font-bold text-lg">
                        ${selectedEmpleado.salarioBase ? selectedEmpleado.salarioBase.toLocaleString() : '0'}
                      </p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-500">EPS</p>
                      <p className="font-medium">{selectedEmpleado.eps || 'No registrada'}</p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-500">Fondo Pensiones</p>
                      <p className="font-medium">{selectedEmpleado.fondoPensiones || 'No registrado'}</p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-500">ARL</p>
                      <p className="font-medium">{selectedEmpleado.arl || 'No registrada'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
             <Button variant="outline" onClick={() => setShowViewModal(false)}>
              Cerrar
            </Button>
            <Button onClick={() => {
              setShowViewModal(false);
              setShowEditModal(true);
            }}>
              Editar Información
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
