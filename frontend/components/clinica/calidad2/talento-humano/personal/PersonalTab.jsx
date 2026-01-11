'use client';

import { useState, useEffect, useRef } from 'react';
import { Plus, Search, Download, RefreshCw, FolderOpen, CheckCircle, XCircle, Eye, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useCalidad2Personal } from '@/hooks/useCalidad2Personal';
import PersonalCarpetaModal from './PersonalCarpetaModal';

const TIPOS_DOCUMENTO = [
  { value: 'CC', label: 'Cedula de Ciudadania' },
  { value: 'CE', label: 'Cedula de Extranjeria' },
  { value: 'PA', label: 'Pasaporte' },
  { value: 'TI', label: 'Tarjeta de Identidad' },
];

const TIPOS_PERSONAL = [
  { value: 'MEDICO', label: 'Medico' },
  { value: 'ENFERMERIA', label: 'Enfermeria' },
  { value: 'ADMINISTRATIVO', label: 'Administrativo' },
  { value: 'ASISTENCIAL', label: 'Asistencial' },
  { value: 'TECNICO', label: 'Tecnico' },
  { value: 'OTRO', label: 'Otro' },
];

const TIPOS_CONTRATO = [
  { value: 'INDEFINIDO', label: 'Indefinido' },
  { value: 'FIJO', label: 'Fijo' },
  { value: 'OBRA_LABOR', label: 'Obra o Labor' },
  { value: 'PRESTACION_SERVICIOS', label: 'Prestacion de Servicios' },
  { value: 'APRENDIZAJE', label: 'Aprendizaje' },
  { value: 'OTRO', label: 'Otro' },
];

const ESTADOS = [
  { value: 'ACTIVO', label: 'Activo' },
  { value: 'INACTIVO', label: 'Inactivo' },
  { value: 'RETIRADO', label: 'Retirado' },
  { value: 'SUSPENDIDO', label: 'Suspendido' },
];

export default function PersonalTab({ user }) {
  const {
    personal,
    loading,
    pagination,
    filters,
    setFilters,
    loadPersonal,
    createPersonal,
    updatePersonal,
    deletePersonal,
    exportExcel,
  } = useCalidad2Personal();

  const [showFormModal, setShowFormModal] = useState(false);
  const [showCarpetaModal, setShowCarpetaModal] = useState(false);
  const [editingPersonal, setEditingPersonal] = useState(null);
  const [selectedPersonalId, setSelectedPersonalId] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    tipoDocumento: 'CC',
    numeroDocumento: '',
    nombreCompleto: '',
    cargo: '',
    tipoPersonal: 'MEDICO',
    correo: '',
    telefono: '',
    tipoContrato: 'INDEFINIDO',
    fechaIngreso: '',
  });

  useEffect(() => {
    loadPersonal();
  }, [loadPersonal]);

  const handleSearch = (value) => {
    setFilters({ ...filters, search: value });
  };

  const handleFilterChange = (key, value) => {
    setFilters({ ...filters, [key]: value === 'all' ? '' : value });
  };

  const handleOpenCreate = () => {
    setEditingPersonal(null);
    setFormData({
      tipoDocumento: 'CC',
      numeroDocumento: '',
      nombreCompleto: '',
      cargo: '',
      tipoPersonal: 'MEDICO',
      correo: '',
      telefono: '',
      tipoContrato: 'INDEFINIDO',
      fechaIngreso: '',
    });
    setShowFormModal(true);
  };

  const handleOpenEdit = (p) => {
    setEditingPersonal(p);
    setFormData({
      tipoDocumento: p.tipoDocumento || 'CC',
      numeroDocumento: p.numeroDocumento || '',
      nombreCompleto: p.nombreCompleto || '',
      cargo: p.cargo || '',
      tipoPersonal: p.tipoPersonal || 'MEDICO',
      correo: p.correo || '',
      telefono: p.telefono || '',
      tipoContrato: p.tipoContrato || 'INDEFINIDO',
      fechaIngreso: p.fechaIngreso ? p.fechaIngreso.split('T')[0] : '',
    });
    setShowFormModal(true);
  };

  const handleSave = async () => {
    const data = {
      ...formData,
      fechaIngreso: formData.fechaIngreso ? new Date(formData.fechaIngreso).toISOString() : null,
    };

    if (editingPersonal) {
      await updatePersonal(editingPersonal.id, data);
    } else {
      await createPersonal(data);
    }

    setShowFormModal(false);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Esta seguro de eliminar este registro de personal?')) {
      await deletePersonal(id);
    }
  };

  const handleOpenCarpeta = (personalId) => {
    setSelectedPersonalId(personalId);
    setShowCarpetaModal(true);
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Buscar por nombre o documento..."
              value={filters.search}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select
            value={filters.tipoPersonal || 'all'}
            onValueChange={(v) => handleFilterChange('tipoPersonal', v)}
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {TIPOS_PERSONAL.map((t) => (
                <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={filters.estado || 'ACTIVO'}
            onValueChange={(v) => handleFilterChange('estado', v)}
          >
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {ESTADOS.map((e) => (
                <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => loadPersonal()}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Actualizar
          </Button>
          <Button variant="outline" onClick={exportExcel}>
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
          <Button onClick={handleOpenCreate}>
            <Plus className="w-4 h-4 mr-2" />
            Nuevo
          </Button>
        </div>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">N</TableHead>
                <TableHead className="w-20">Tip. Doc</TableHead>
                <TableHead>Documento</TableHead>
                <TableHead>Nombre Completo</TableHead>
                <TableHead>Cargo</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Correo</TableHead>
                <TableHead>Telefono</TableHead>
                <TableHead>Contrato</TableHead>
                <TableHead className="w-16 text-center">OK</TableHead>
                <TableHead className="w-24">Carpeta</TableHead>
                <TableHead className="w-24">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={12} className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto" />
                  </TableCell>
                </TableRow>
              ) : personal.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={12} className="text-center py-8 text-gray-500">
                    No hay registros de personal
                  </TableCell>
                </TableRow>
              ) : (
                personal.map((p, index) => (
                  <TableRow key={p.id}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{p.tipoDocumento}</Badge>
                    </TableCell>
                    <TableCell>{p.numeroDocumento}</TableCell>
                    <TableCell className="font-medium">{p.nombreCompleto}</TableCell>
                    <TableCell>{p.cargo}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {TIPOS_PERSONAL.find((t) => t.value === p.tipoPersonal)?.label || p.tipoPersonal}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">{p.correo || '-'}</TableCell>
                    <TableCell className="text-sm">{p.telefono || '-'}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {TIPOS_CONTRATO.find((t) => t.value === p.tipoContrato)?.label || p.tipoContrato}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      {p.checklistCompleto ? (
                        <CheckCircle className="w-5 h-5 text-green-500 mx-auto" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-500 mx-auto" />
                      )}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenCarpeta(p.id)}
                      >
                        <FolderOpen className="w-4 h-4" />
                      </Button>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenEdit(p)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600"
                          onClick={() => handleDelete(p.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={pagination.page <= 1}
            onClick={() => loadPersonal({ page: pagination.page - 1 })}
          >
            Anterior
          </Button>
          <span className="text-sm text-gray-500">
            Pagina {pagination.page} de {pagination.totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={pagination.page >= pagination.totalPages}
            onClick={() => loadPersonal({ page: pagination.page + 1 })}
          >
            Siguiente
          </Button>
        </div>
      )}

      {/* Form Modal */}
      <Dialog open={showFormModal} onOpenChange={setShowFormModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingPersonal ? 'Editar Personal' : 'Nuevo Personal'}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div>
              <Label>Tipo Documento</Label>
              <Select
                value={formData.tipoDocumento}
                onValueChange={(v) => setFormData({ ...formData, tipoDocumento: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIPOS_DOCUMENTO.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Numero Documento</Label>
              <Input
                value={formData.numeroDocumento}
                onChange={(e) => setFormData({ ...formData, numeroDocumento: e.target.value })}
                placeholder="123456789"
              />
            </div>
            <div className="col-span-2">
              <Label>Nombre Completo</Label>
              <Input
                value={formData.nombreCompleto}
                onChange={(e) => setFormData({ ...formData, nombreCompleto: e.target.value })}
                placeholder="Nombre completo del personal"
              />
            </div>
            <div>
              <Label>Cargo</Label>
              <Input
                value={formData.cargo}
                onChange={(e) => setFormData({ ...formData, cargo: e.target.value })}
                placeholder="Cargo del personal"
              />
            </div>
            <div>
              <Label>Tipo de Personal</Label>
              <Select
                value={formData.tipoPersonal}
                onValueChange={(v) => setFormData({ ...formData, tipoPersonal: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIPOS_PERSONAL.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Correo</Label>
              <Input
                type="email"
                value={formData.correo}
                onChange={(e) => setFormData({ ...formData, correo: e.target.value })}
                placeholder="correo@ejemplo.com"
              />
            </div>
            <div>
              <Label>Telefono</Label>
              <Input
                value={formData.telefono}
                onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                placeholder="3001234567"
              />
            </div>
            <div>
              <Label>Tipo de Contrato</Label>
              <Select
                value={formData.tipoContrato}
                onValueChange={(v) => setFormData({ ...formData, tipoContrato: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIPOS_CONTRATO.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Fecha de Ingreso</Label>
              <Input
                type="date"
                value={formData.fechaIngreso}
                onChange={(e) => setFormData({ ...formData, fechaIngreso: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowFormModal(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={!formData.numeroDocumento || !formData.nombreCompleto || !formData.cargo}>
              {editingPersonal ? 'Guardar' : 'Crear'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Carpeta Modal */}
      {showCarpetaModal && selectedPersonalId && (
        <PersonalCarpetaModal
          personalId={selectedPersonalId}
          open={showCarpetaModal}
          onClose={() => {
            setShowCarpetaModal(false);
            setSelectedPersonalId(null);
            loadPersonal(); // Refresh to update checklistCompleto status
          }}
        />
      )}
    </div>
  );
}
