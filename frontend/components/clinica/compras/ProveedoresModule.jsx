'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
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
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Plus, Search, Edit, Eye, RefreshCw, Loader2,
  Building2, Phone, Mail, CreditCard
} from 'lucide-react';
import { toast } from 'sonner';
import { apiGet, apiPost, apiPut, apiDelete } from '@/services/api';

const TIPOS_PROVEEDOR = [
  'MEDICAMENTOS',
  'INSUMOS_MEDICOS',
  'EQUIPOS_MEDICOS',
  'LABORATORIO',
  'SERVICIOS',
  'TECNOLOGIA',
  'OTROS'
];

const TIPOS_DOCUMENTO = [
  { value: 'NIT', label: 'NIT' },
  { value: 'CC', label: 'Cédula de Ciudadanía' },
  { value: 'CE', label: 'Cédula de Extranjería' }
];

const REGIMENES = [
  { value: 'SIMPLIFICADO', label: 'Simplificado' },
  { value: 'COMUN', label: 'Común' },
  { value: 'GRAN_CONTRIBUYENTE', label: 'Gran Contribuyente' }
];

export default function ProveedoresModule({ user }) {
  const [proveedores, setProveedores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [editingProveedor, setEditingProveedor] = useState(null);
  const [selectedProveedor, setSelectedProveedor] = useState(null);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const [formData, setFormData] = useState({
    tipoDocumento: 'NIT',
    documento: '',
    digitoVerificacion: '',
    razonSocial: '',
    nombreComercial: '',
    direccion: '',
    ciudad: '',
    departamento: '',
    telefono: '',
    email: '',
    regimenTributario: 'COMUN',
    tipoProveedor: 'MEDICAMENTOS',
    plazoCredito: 30,
    limiteCredito: '',
    banco: '',
    tipoCuenta: '',
    numeroCuenta: '',
    contactoNombre: '',
    contactoTelefono: '',
    contactoEmail: '',
    observaciones: ''
  });

  useEffect(() => {
    fetchProveedores();
  }, [page, filtroTipo]);

  const fetchProveedores = async () => {
    try {
      setLoading(true);
      const filters = { page, limit: 20 };
      if (filtroTipo !== 'all') filters.tipo = filtroTipo;
      if (search) filters.search = search;

      const response = await apiGet('/compras/proveedores', filters);
      setProveedores(response.data || []);
      setPagination(response.pagination);
    } catch (error) {
      toast.error('Error cargando proveedores: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      if (editingProveedor) {
        await apiPut(`/compras/proveedores/${editingProveedor.id}`, formData);
        toast.success('Proveedor actualizado');
      } else {
        await apiPost('/compras/proveedores', formData);
        toast.success('Proveedor creado');
      }
      setDialogOpen(false);
      resetForm();
      fetchProveedores();
    } catch (error) {
      toast.error('Error: ' + error.message);
    }
  };

  const handleSyncSiigo = async (proveedorId) => {
    try {
      await apiPost(`/compras/proveedores/${proveedorId}/sync-siigo`);
      toast.success('Proveedor sincronizado con Siigo');
      fetchProveedores();
    } catch (error) {
      toast.error('Error sincronizando: ' + error.message);
    }
  };

  const resetForm = () => {
    setEditingProveedor(null);
    setFormData({
      tipoDocumento: 'NIT',
      documento: '',
      digitoVerificacion: '',
      razonSocial: '',
      nombreComercial: '',
      direccion: '',
      ciudad: '',
      departamento: '',
      telefono: '',
      email: '',
      regimenTributario: 'COMUN',
      tipoProveedor: 'MEDICAMENTOS',
      plazoCredito: 30,
      limiteCredito: '',
      banco: '',
      tipoCuenta: '',
      numeroCuenta: '',
      contactoNombre: '',
      contactoTelefono: '',
      contactoEmail: '',
      observaciones: ''
    });
  };

  const openEditDialog = (proveedor) => {
    setEditingProveedor(proveedor);
    setFormData({
      tipoDocumento: proveedor.tipoDocumento || 'NIT',
      documento: proveedor.documento || '',
      digitoVerificacion: proveedor.digitoVerificacion || '',
      razonSocial: proveedor.razonSocial || '',
      nombreComercial: proveedor.nombreComercial || '',
      direccion: proveedor.direccion || '',
      ciudad: proveedor.ciudad || '',
      departamento: proveedor.departamento || '',
      telefono: proveedor.telefono || '',
      email: proveedor.email || '',
      regimenTributario: proveedor.regimenTributario || 'COMUN',
      tipoProveedor: proveedor.tipoProveedor || 'MEDICAMENTOS',
      plazoCredito: proveedor.plazoCredito || 30,
      limiteCredito: proveedor.limiteCredito || '',
      banco: proveedor.banco || '',
      tipoCuenta: proveedor.tipoCuenta || '',
      numeroCuenta: proveedor.numeroCuenta || '',
      contactoNombre: proveedor.contactoNombre || '',
      contactoTelefono: proveedor.contactoTelefono || '',
      contactoEmail: proveedor.contactoEmail || '',
      observaciones: proveedor.observaciones || ''
    });
    setDialogOpen(true);
  };

  const openDetailDialog = async (proveedor) => {
    try {
      const response = await apiGet(`/compras/proveedores/${proveedor.id}`);
      setSelectedProveedor(response.data);
      setDetailDialogOpen(true);
    } catch (error) {
      toast.error('Error cargando detalles: ' + error.message);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(value || 0);
  };

  const getTipoBadgeColor = (tipo) => {
    const colors = {
      'MEDICAMENTOS': 'bg-blue-100 text-blue-800',
      'INSUMOS_MEDICOS': 'bg-green-100 text-green-800',
      'EQUIPOS_MEDICOS': 'bg-purple-100 text-purple-800',
      'LABORATORIO': 'bg-yellow-100 text-yellow-800',
      'SERVICIOS': 'bg-orange-100 text-orange-800',
      'TECNOLOGIA': 'bg-cyan-100 text-cyan-800',
      'OTROS': 'bg-gray-100 text-gray-800'
    };
    return colors[tipo] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Proveedores
              </CardTitle>
              <CardDescription>
                Gestión de proveedores y terceros
              </CardDescription>
            </div>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" onClick={resetForm}>
                  <Plus className="h-4 w-4 mr-1" />
                  Nuevo Proveedor
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingProveedor ? 'Editar Proveedor' : 'Nuevo Proveedor'}
                  </DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  {/* Identificación */}
                  <div className="grid grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <Label>Tipo Doc. *</Label>
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
                    <div className="col-span-2 space-y-2">
                      <Label>Documento *</Label>
                      <Input
                        value={formData.documento}
                        onChange={(e) => setFormData({ ...formData, documento: e.target.value })}
                        placeholder="900123456"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>DV</Label>
                      <Input
                        value={formData.digitoVerificacion}
                        onChange={(e) => setFormData({ ...formData, digitoVerificacion: e.target.value })}
                        placeholder="1"
                        maxLength={1}
                      />
                    </div>
                  </div>

                  {/* Nombre */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Razón Social *</Label>
                      <Input
                        value={formData.razonSocial}
                        onChange={(e) => setFormData({ ...formData, razonSocial: e.target.value })}
                        placeholder="Laboratorios XYZ S.A.S."
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Nombre Comercial</Label>
                      <Input
                        value={formData.nombreComercial}
                        onChange={(e) => setFormData({ ...formData, nombreComercial: e.target.value })}
                        placeholder="Lab XYZ"
                      />
                    </div>
                  </div>

                  {/* Ubicación */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="col-span-2 space-y-2">
                      <Label>Dirección *</Label>
                      <Input
                        value={formData.direccion}
                        onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                        placeholder="Calle 123 # 45-67"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Ciudad *</Label>
                      <Input
                        value={formData.ciudad}
                        onChange={(e) => setFormData({ ...formData, ciudad: e.target.value })}
                        placeholder="Bogotá"
                      />
                    </div>
                  </div>

                  {/* Contacto */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Teléfono *</Label>
                      <Input
                        value={formData.telefono}
                        onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                        placeholder="3001234567"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Email *</Label>
                      <Input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="contacto@proveedor.com"
                      />
                    </div>
                  </div>

                  {/* Fiscal */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Tipo Proveedor *</Label>
                      <Select
                        value={formData.tipoProveedor}
                        onValueChange={(v) => setFormData({ ...formData, tipoProveedor: v })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {TIPOS_PROVEEDOR.map((t) => (
                            <SelectItem key={t} value={t}>
                              {t.replace(/_/g, ' ')}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Régimen Tributario</Label>
                      <Select
                        value={formData.regimenTributario}
                        onValueChange={(v) => setFormData({ ...formData, regimenTributario: v })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {REGIMENES.map((r) => (
                            <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Plazo Crédito (días)</Label>
                      <Input
                        type="number"
                        value={formData.plazoCredito}
                        onChange={(e) => setFormData({ ...formData, plazoCredito: parseInt(e.target.value) || 0 })}
                      />
                    </div>
                  </div>

                  {/* Bancario */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Banco</Label>
                      <Input
                        value={formData.banco}
                        onChange={(e) => setFormData({ ...formData, banco: e.target.value })}
                        placeholder="Bancolombia"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Tipo Cuenta</Label>
                      <Select
                        value={formData.tipoCuenta}
                        onValueChange={(v) => setFormData({ ...formData, tipoCuenta: v })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="AHORROS">Ahorros</SelectItem>
                          <SelectItem value="CORRIENTE">Corriente</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Número Cuenta</Label>
                      <Input
                        value={formData.numeroCuenta}
                        onChange={(e) => setFormData({ ...formData, numeroCuenta: e.target.value })}
                        placeholder="123456789"
                      />
                    </div>
                  </div>

                  {/* Observaciones */}
                  <div className="space-y-2">
                    <Label>Observaciones</Label>
                    <Textarea
                      value={formData.observaciones}
                      onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                      placeholder="Notas adicionales..."
                      rows={2}
                    />
                  </div>

                  <Button onClick={handleSubmit} className="w-full">
                    {editingProveedor ? 'Actualizar' : 'Crear'} Proveedor
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filtros */}
          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por NIT, razón social..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8"
                onKeyDown={(e) => e.key === 'Enter' && fetchProveedores()}
              />
            </div>
            <Select value={filtroTipo} onValueChange={setFiltroTipo}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los tipos</SelectItem>
                {TIPOS_PROVEEDOR.map((t) => (
                  <SelectItem key={t} value={t}>{t.replace(/_/g, ' ')}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tabla */}
      <Card>
        <CardContent className="pt-6">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>NIT/Doc</TableHead>
                  <TableHead>Razón Social</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Teléfono</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Siigo</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {proveedores.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      No hay proveedores registrados
                    </TableCell>
                  </TableRow>
                ) : (
                  proveedores.map((prov) => (
                    <TableRow key={prov.id}>
                      <TableCell className="font-mono">
                        {prov.documento}
                        {prov.digitoVerificacion && `-${prov.digitoVerificacion}`}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{prov.razonSocial}</div>
                          {prov.nombreComercial && (
                            <div className="text-sm text-muted-foreground">{prov.nombreComercial}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getTipoBadgeColor(prov.tipoProveedor)}>
                          {prov.tipoProveedor?.replace(/_/g, ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>{prov.telefono}</TableCell>
                      <TableCell>{prov.email}</TableCell>
                      <TableCell>
                        {prov.siigoId ? (
                          <Badge variant="outline" className="text-green-600">Sync</Badge>
                        ) : (
                          <Badge variant="outline" className="text-yellow-600">Pendiente</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="sm" onClick={() => openDetailDialog(prov)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => openEditDialog(prov)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleSyncSiigo(prov.id)}>
                            <RefreshCw className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Anterior
              </Button>
              <span className="flex items-center px-4 text-sm text-muted-foreground">
                Página {page} de {pagination.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                disabled={page === pagination.totalPages}
              >
                Siguiente
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalle del Proveedor</DialogTitle>
          </DialogHeader>
          {selectedProveedor && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Razón Social</Label>
                  <p className="font-medium">{selectedProveedor.razonSocial}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">NIT</Label>
                  <p className="font-mono">{selectedProveedor.documento}-{selectedProveedor.digitoVerificacion}</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label className="text-muted-foreground">Tipo</Label>
                  <Badge className={getTipoBadgeColor(selectedProveedor.tipoProveedor)}>
                    {selectedProveedor.tipoProveedor?.replace(/_/g, ' ')}
                  </Badge>
                </div>
                <div>
                  <Label className="text-muted-foreground">Régimen</Label>
                  <p>{selectedProveedor.regimenTributario}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Plazo Crédito</Label>
                  <p>{selectedProveedor.plazoCredito} días</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Dirección</Label>
                  <p>{selectedProveedor.direccion}, {selectedProveedor.ciudad}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Contacto</Label>
                  <p className="flex items-center gap-1"><Phone className="h-3 w-3" /> {selectedProveedor.telefono}</p>
                  <p className="flex items-center gap-1"><Mail className="h-3 w-3" /> {selectedProveedor.email}</p>
                </div>
              </div>
              {selectedProveedor.banco && (
                <div>
                  <Label className="text-muted-foreground">Datos Bancarios</Label>
                  <p className="flex items-center gap-1">
                    <CreditCard className="h-3 w-3" />
                    {selectedProveedor.banco} - {selectedProveedor.tipoCuenta} {selectedProveedor.numeroCuenta}
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
