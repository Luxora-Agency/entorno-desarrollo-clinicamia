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
  DialogFooter,
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
  Plus, Search, FileText, Check, X, RotateCcw, RefreshCw,
  Eye, Trash2, Loader2, ArrowUpDown, AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { apiGet, apiPost, apiPut } from '@/services/api';

const formatCurrency = (value) => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0
  }).format(value || 0);
};

const formatDate = (dateStr) => {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('es-CO', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

export default function AsientosContablesModule() {
  const [asientos, setAsientos] = useState([]);
  const [cuentas, setCuentas] = useState([]);
  const [centrosCosto, setCentrosCosto] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedAsiento, setSelectedAsiento] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, total: 0, totalPages: 0 });

  const [filtros, setFiltros] = useState({
    fechaInicio: '',
    fechaFin: '',
    tipo: 'all',
    estado: 'all'
  });

  const [formData, setFormData] = useState({
    fecha: new Date().toISOString().split('T')[0],
    tipo: 'DIARIO',
    descripcion: '',
    lineas: [
      { cuentaCodigo: '', cuentaNombre: '', descripcion: '', debito: 0, credito: 0, centroCostoId: '' },
      { cuentaCodigo: '', cuentaNombre: '', descripcion: '', debito: 0, credito: 0, centroCostoId: '' }
    ]
  });

  useEffect(() => {
    fetchAsientos();
    fetchCatalogos();
  }, [filtros, pagination.page]);

  const fetchAsientos = async () => {
    try {
      setLoading(true);
      const params = { page: pagination.page, limit: 20 };
      if (filtros.fechaInicio) params.fechaInicio = filtros.fechaInicio;
      if (filtros.fechaFin) params.fechaFin = filtros.fechaFin;
      if (filtros.tipo !== 'all') params.tipo = filtros.tipo;
      if (filtros.estado !== 'all') params.estado = filtros.estado;

      const response = await apiGet('/contabilidad/asientos', params);
      setAsientos(response.data || []);
      if (response.pagination) {
        setPagination(prev => ({ ...prev, ...response.pagination }));
      }
    } catch (error) {
      toast.error('Error cargando asientos: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchCatalogos = async () => {
    try {
      const [cuentasRes, centrosRes] = await Promise.all([
        apiGet('/contabilidad/puc/selector'),
        apiGet('/contabilidad/centros-costo/selector')
      ]);
      setCuentas(cuentasRes.data || []);
      setCentrosCosto(centrosRes.data || []);
    } catch (error) {
      console.error('Error cargando catálogos:', error);
    }
  };

  const handleAddLinea = () => {
    setFormData(prev => ({
      ...prev,
      lineas: [...prev.lineas, { cuentaCodigo: '', cuentaNombre: '', descripcion: '', debito: 0, credito: 0, centroCostoId: '' }]
    }));
  };

  const handleRemoveLinea = (index) => {
    if (formData.lineas.length <= 2) {
      toast.error('Un asiento debe tener al menos 2 líneas');
      return;
    }
    setFormData(prev => ({
      ...prev,
      lineas: prev.lineas.filter((_, i) => i !== index)
    }));
  };

  const handleLineaChange = (index, field, value) => {
    setFormData(prev => {
      const newLineas = [...prev.lineas];
      newLineas[index] = { ...newLineas[index], [field]: value };

      // Si cambia la cuenta, actualizar el nombre
      if (field === 'cuentaCodigo') {
        const cuenta = cuentas.find(c => c.codigo === value);
        if (cuenta) {
          newLineas[index].cuentaNombre = cuenta.nombre;
        }
      }

      return { ...prev, lineas: newLineas };
    });
  };

  const calcularTotales = () => {
    const totalDebitos = formData.lineas.reduce((sum, l) => sum + (parseFloat(l.debito) || 0), 0);
    const totalCreditos = formData.lineas.reduce((sum, l) => sum + (parseFloat(l.credito) || 0), 0);
    return { totalDebitos, totalCreditos, balanced: Math.abs(totalDebitos - totalCreditos) < 0.01 };
  };

  const handleSubmit = async () => {
    const { totalDebitos, totalCreditos, balanced } = calcularTotales();

    if (!balanced) {
      toast.error(`El asiento no está cuadrado. Débitos: ${formatCurrency(totalDebitos)}, Créditos: ${formatCurrency(totalCreditos)}`);
      return;
    }

    if (formData.lineas.some(l => !l.cuentaCodigo)) {
      toast.error('Todas las líneas deben tener una cuenta');
      return;
    }

    try {
      await apiPost('/contabilidad/asientos', formData);
      toast.success('Asiento contable creado');
      setDialogOpen(false);
      resetForm();
      fetchAsientos();
    } catch (error) {
      toast.error('Error: ' + error.message);
    }
  };

  const handleAprobar = async (id) => {
    try {
      await apiPost(`/contabilidad/asientos/${id}/aprobar`);
      toast.success('Asiento aprobado');
      fetchAsientos();
    } catch (error) {
      toast.error('Error: ' + error.message);
    }
  };

  const handleAnular = async (id, motivo) => {
    try {
      await apiPost(`/contabilidad/asientos/${id}/anular`, { motivo });
      toast.success('Asiento anulado');
      fetchAsientos();
    } catch (error) {
      toast.error('Error: ' + error.message);
    }
  };

  const handleSyncSiigo = async (id) => {
    try {
      await apiPost(`/contabilidad/asientos/${id}/sync-siigo`);
      toast.success('Asiento sincronizado con Siigo');
      fetchAsientos();
    } catch (error) {
      toast.error('Error sincronizando: ' + error.message);
    }
  };

  const handleViewAsiento = async (id) => {
    try {
      const response = await apiGet(`/contabilidad/asientos/${id}`);
      setSelectedAsiento(response.data);
      setViewDialogOpen(true);
    } catch (error) {
      toast.error('Error cargando asiento: ' + error.message);
    }
  };

  const resetForm = () => {
    setFormData({
      fecha: new Date().toISOString().split('T')[0],
      tipo: 'DIARIO',
      descripcion: '',
      lineas: [
        { cuentaCodigo: '', cuentaNombre: '', descripcion: '', debito: 0, credito: 0, centroCostoId: '' },
        { cuentaCodigo: '', cuentaNombre: '', descripcion: '', debito: 0, credito: 0, centroCostoId: '' }
      ]
    });
  };

  const getEstadoBadge = (estado) => {
    const config = {
      'BORRADOR': { color: 'bg-yellow-100 text-yellow-800', label: 'Borrador' },
      'APROBADO': { color: 'bg-green-100 text-green-800', label: 'Aprobado' },
      'ANULADO': { color: 'bg-red-100 text-red-800', label: 'Anulado' },
      'REVERTIDO': { color: 'bg-gray-100 text-gray-800', label: 'Revertido' }
    };
    const c = config[estado] || config['BORRADOR'];
    return <Badge className={c.color}>{c.label}</Badge>;
  };

  const { totalDebitos, totalCreditos, balanced } = calcularTotales();

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Asientos Contables
              </CardTitle>
              <CardDescription>
                Registro y gestión de comprobantes contables
              </CardDescription>
            </div>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={resetForm}>
                  <Plus className="h-4 w-4 mr-1" />
                  Nuevo Asiento
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Nuevo Asiento Contable</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Fecha</Label>
                      <Input
                        type="date"
                        value={formData.fecha}
                        onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Tipo</Label>
                      <Select
                        value={formData.tipo}
                        onValueChange={(v) => setFormData({ ...formData, tipo: v })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="APERTURA">Apertura</SelectItem>
                          <SelectItem value="DIARIO">Diario</SelectItem>
                          <SelectItem value="AJUSTE">Ajuste</SelectItem>
                          <SelectItem value="CIERRE">Cierre</SelectItem>
                          <SelectItem value="NOMINA">Nómina</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Estado del Balance</Label>
                      <div className={`p-2 rounded text-center font-medium ${balanced ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {balanced ? 'Cuadrado' : 'Descuadrado'}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Descripción</Label>
                    <Textarea
                      value={formData.descripcion}
                      onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                      placeholder="Concepto del asiento contable"
                      rows={2}
                    />
                  </div>

                  {/* Líneas del asiento */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label>Líneas del Asiento</Label>
                      <Button type="button" variant="outline" size="sm" onClick={handleAddLinea}>
                        <Plus className="h-4 w-4 mr-1" />
                        Agregar Línea
                      </Button>
                    </div>

                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[180px]">Cuenta</TableHead>
                          <TableHead>Descripción</TableHead>
                          <TableHead>Centro Costo</TableHead>
                          <TableHead className="text-right">Débito</TableHead>
                          <TableHead className="text-right">Crédito</TableHead>
                          <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {formData.lineas.map((linea, index) => (
                          <TableRow key={index}>
                            <TableCell>
                              <Select
                                value={linea.cuentaCodigo}
                                onValueChange={(v) => handleLineaChange(index, 'cuentaCodigo', v)}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Cuenta" />
                                </SelectTrigger>
                                <SelectContent>
                                  {cuentas.map((c) => (
                                    <SelectItem key={c.codigo} value={c.codigo}>
                                      {c.codigo} - {c.nombre}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </TableCell>
                            <TableCell>
                              <Input
                                value={linea.descripcion}
                                onChange={(e) => handleLineaChange(index, 'descripcion', e.target.value)}
                                placeholder="Detalle"
                              />
                            </TableCell>
                            <TableCell>
                              <Select
                                value={linea.centroCostoId || 'none'}
                                onValueChange={(v) => handleLineaChange(index, 'centroCostoId', v === 'none' ? '' : v)}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Centro" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="none">Sin centro</SelectItem>
                                  {centrosCosto.map((cc) => (
                                    <SelectItem key={cc.id} value={cc.id}>
                                      {cc.codigo} - {cc.nombre}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                value={linea.debito}
                                onChange={(e) => handleLineaChange(index, 'debito', parseFloat(e.target.value) || 0)}
                                className="text-right"
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                value={linea.credito}
                                onChange={(e) => handleLineaChange(index, 'credito', parseFloat(e.target.value) || 0)}
                                className="text-right"
                              />
                            </TableCell>
                            <TableCell>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveLinea(index)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                        {/* Totales */}
                        <TableRow className="font-bold bg-muted/50">
                          <TableCell colSpan={3} className="text-right">TOTALES</TableCell>
                          <TableCell className="text-right">{formatCurrency(totalDebitos)}</TableCell>
                          <TableCell className="text-right">{formatCurrency(totalCreditos)}</TableCell>
                          <TableCell></TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleSubmit} disabled={!balanced}>
                    Crear Asiento
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filtros */}
          <div className="flex flex-wrap gap-4 mb-4">
            <div className="space-y-1">
              <Label className="text-xs">Fecha Inicio</Label>
              <Input
                type="date"
                value={filtros.fechaInicio}
                onChange={(e) => setFiltros({ ...filtros, fechaInicio: e.target.value })}
                className="w-[150px]"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Fecha Fin</Label>
              <Input
                type="date"
                value={filtros.fechaFin}
                onChange={(e) => setFiltros({ ...filtros, fechaFin: e.target.value })}
                className="w-[150px]"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Tipo</Label>
              <Select value={filtros.tipo} onValueChange={(v) => setFiltros({ ...filtros, tipo: v })}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="APERTURA">Apertura</SelectItem>
                  <SelectItem value="DIARIO">Diario</SelectItem>
                  <SelectItem value="AJUSTE">Ajuste</SelectItem>
                  <SelectItem value="CIERRE">Cierre</SelectItem>
                  <SelectItem value="NOMINA">Nómina</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Estado</Label>
              <Select value={filtros.estado} onValueChange={(v) => setFiltros({ ...filtros, estado: v })}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="BORRADOR">Borrador</SelectItem>
                  <SelectItem value="APROBADO">Aprobado</SelectItem>
                  <SelectItem value="ANULADO">Anulado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabla de asientos */}
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
                  <TableHead>Número</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead className="text-right">Débitos</TableHead>
                  <TableHead className="text-right">Créditos</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {asientos.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      No hay asientos contables
                    </TableCell>
                  </TableRow>
                ) : (
                  asientos.map((asiento) => (
                    <TableRow key={asiento.id}>
                      <TableCell className="font-mono">{asiento.numero}</TableCell>
                      <TableCell>{formatDate(asiento.fecha)}</TableCell>
                      <TableCell>{asiento.tipo}</TableCell>
                      <TableCell className="max-w-[200px] truncate">{asiento.descripcion}</TableCell>
                      <TableCell className="text-right font-mono">
                        {formatCurrency(asiento.totalDebitos)}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {formatCurrency(asiento.totalCreditos)}
                      </TableCell>
                      <TableCell>{getEstadoBadge(asiento.estado)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="sm" onClick={() => handleViewAsiento(asiento.id)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          {asiento.estado === 'BORRADOR' && (
                            <Button variant="ghost" size="sm" onClick={() => handleAprobar(asiento.id)}>
                              <Check className="h-4 w-4 text-green-600" />
                            </Button>
                          )}
                          {asiento.estado === 'APROBADO' && !asiento.siigoId && (
                            <Button variant="ghost" size="sm" onClick={() => handleSyncSiigo(asiento.id)}>
                              <RefreshCw className="h-4 w-4 text-blue-600" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}

          {/* Paginación */}
          {pagination.totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-4">
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page === 1}
                onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}
              >
                Anterior
              </Button>
              <span className="py-2 px-4 text-sm">
                Página {pagination.page} de {pagination.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page === pagination.totalPages}
                onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}
              >
                Siguiente
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog Ver Asiento */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Asiento #{selectedAsiento?.numero}</DialogTitle>
          </DialogHeader>
          {selectedAsiento && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label className="text-muted-foreground">Fecha</Label>
                  <p className="font-medium">{formatDate(selectedAsiento.fecha)}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Tipo</Label>
                  <p className="font-medium">{selectedAsiento.tipo}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Estado</Label>
                  <p>{getEstadoBadge(selectedAsiento.estado)}</p>
                </div>
              </div>
              <div>
                <Label className="text-muted-foreground">Descripción</Label>
                <p>{selectedAsiento.descripcion}</p>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cuenta</TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead className="text-right">Débito</TableHead>
                    <TableHead className="text-right">Crédito</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedAsiento.lineas?.map((linea, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-mono">
                        {linea.cuentaCodigo} - {linea.cuentaNombre}
                      </TableCell>
                      <TableCell>{linea.descripcion}</TableCell>
                      <TableCell className="text-right">{formatCurrency(linea.debito)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(linea.credito)}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="font-bold bg-muted/50">
                    <TableCell colSpan={2}>TOTALES</TableCell>
                    <TableCell className="text-right">{formatCurrency(selectedAsiento.totalDebitos)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(selectedAsiento.totalCreditos)}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
              {selectedAsiento.siigoId && (
                <div className="text-sm text-muted-foreground">
                  Siigo ID: {selectedAsiento.siigoId}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
