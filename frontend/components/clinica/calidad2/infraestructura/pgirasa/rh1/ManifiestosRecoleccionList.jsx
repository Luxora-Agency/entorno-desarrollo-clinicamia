'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, FileText, Calendar, Building2, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useInfraestructuraManifiestos } from '@/hooks/useInfraestructuraManifiestos';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function ManifiestosRecoleccionList({ anioSeleccionado, mesSeleccionado }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editando, setEditando] = useState(null);
  const [formData, setFormData] = useState({
    numeroManifiesto: '',
    fecha: '',
    empresaRecolectora: '',
    tipoResiduo: 'PELIGROSO',
    cantidadKg: '',
    responsable: '',
    observaciones: '',
  });

  const {
    manifiestos,
    loading,
    loadManifiestos,
    createManifiesto,
    updateManifiesto,
    deleteManifiesto,
    getTotalesPorTipo,
  } = useInfraestructuraManifiestos();

  const [totales, setTotales] = useState(null);

  useEffect(() => {
    loadData();
  }, [anioSeleccionado, mesSeleccionado]);

  const loadData = async () => {
    const filters = {};
    if (anioSeleccionado) filters.anio = anioSeleccionado;
    if (mesSeleccionado) filters.mes = mesSeleccionado;

    await loadManifiestos(filters);

    const totalesData = await getTotalesPorTipo(anioSeleccionado, mesSeleccionado);
    setTotales(totalesData);
  };

  const handleOpenModal = (manifiesto = null) => {
    if (manifiesto) {
      setEditando(manifiesto);
      setFormData({
        numeroManifiesto: manifiesto.numeroManifiesto,
        fecha: manifiesto.fecha ? format(new Date(manifiesto.fecha), 'yyyy-MM-dd') : '',
        empresaRecolectora: manifiesto.empresaRecolectora,
        tipoResiduo: manifiesto.tipoResiduo,
        cantidadKg: manifiesto.cantidadKg,
        responsable: manifiesto.responsable,
        observaciones: manifiesto.observaciones || '',
      });
    } else {
      setEditando(null);
      setFormData({
        numeroManifiesto: '',
        fecha: format(new Date(), 'yyyy-MM-dd'),
        empresaRecolectora: '',
        tipoResiduo: 'PELIGROSO',
        cantidadKg: '',
        responsable: '',
        observaciones: '',
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditando(null);
    setFormData({
      numeroManifiesto: '',
      fecha: '',
      empresaRecolectora: '',
      tipoResiduo: 'PELIGROSO',
      cantidadKg: '',
      responsable: '',
      observaciones: '',
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const data = {
      ...formData,
      cantidadKg: parseFloat(formData.cantidadKg),
    };

    let success;
    if (editando) {
      success = await updateManifiesto(editando.id, data);
    } else {
      success = await createManifiesto(data);
    }

    if (success) {
      handleCloseModal();
      loadData();
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Está seguro de eliminar este manifiesto?')) {
      const success = await deleteManifiesto(id);
      if (success) {
        loadData();
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            Manifiestos de Recolección
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Registro de recolección de residuos hospitalarios
          </p>
        </div>

        <Button onClick={() => handleOpenModal()} className="gap-2">
          <Plus className="w-4 h-4" />
          Nuevo Manifiesto
        </Button>
      </div>

      {/* Totales */}
      {totales && (
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {(Number(totales.peligrosos) || 0).toFixed(2)} kg
                </div>
                <div className="text-xs text-gray-600 mt-1">Residuos Peligrosos</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {(Number(totales.noPeligrosos) || 0).toFixed(2)} kg
                </div>
                <div className="text-xs text-gray-600 mt-1">Residuos No Peligrosos</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {(Number(totales.total) || 0).toFixed(2)} kg
                </div>
                <div className="text-xs text-gray-600 mt-1">Total Recolectado</div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabla */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>N° Manifiesto</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Empresa Recolectora</TableHead>
                  <TableHead>Tipo Residuo</TableHead>
                  <TableHead className="text-right">Cantidad (kg)</TableHead>
                  <TableHead>Responsable</TableHead>
                  <TableHead className="text-center">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                      Cargando manifiestos...
                    </TableCell>
                  </TableRow>
                ) : manifiestos.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                      No hay manifiestos registrados
                    </TableCell>
                  </TableRow>
                ) : (
                  manifiestos.map((manifiesto) => (
                    <TableRow key={manifiesto.id}>
                      <TableCell className="font-medium">{manifiesto.numeroManifiesto}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          {format(new Date(manifiesto.fecha), 'dd/MM/yyyy', { locale: es })}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-gray-400" />
                          {manifiesto.empresaRecolectora}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={manifiesto.tipoResiduo === 'PELIGROSO' ? 'destructive' : 'default'}>
                          {manifiesto.tipoResiduo === 'PELIGROSO' ? 'Peligroso' : 'No Peligroso'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        <div className="flex items-center justify-end gap-2">
                          <Package className="w-4 h-4 text-gray-400" />
                          {(Number(manifiesto.cantidadKg) || 0).toFixed(2)} kg
                        </div>
                      </TableCell>
                      <TableCell>{manifiesto.responsable}</TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenModal(manifiesto)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(manifiesto.id)}
                          >
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Modal de formulario */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editando ? 'Editar Manifiesto' : 'Nuevo Manifiesto de Recolección'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="numeroManifiesto">N° Manifiesto *</Label>
                <Input
                  id="numeroManifiesto"
                  value={formData.numeroManifiesto}
                  onChange={(e) => setFormData({ ...formData, numeroManifiesto: e.target.value })}
                  required
                  placeholder="Ej: MAN-2025-001"
                />
              </div>

              <div>
                <Label htmlFor="fecha">Fecha *</Label>
                <Input
                  id="fecha"
                  type="date"
                  value={formData.fecha}
                  onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="empresaRecolectora">Empresa Recolectora *</Label>
              <Input
                id="empresaRecolectora"
                value={formData.empresaRecolectora}
                onChange={(e) => setFormData({ ...formData, empresaRecolectora: e.target.value })}
                required
                placeholder="Nombre de la empresa gestora"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="tipoResiduo">Tipo de Residuo *</Label>
                <Select
                  value={formData.tipoResiduo}
                  onValueChange={(value) => setFormData({ ...formData, tipoResiduo: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PELIGROSO">Peligroso</SelectItem>
                    <SelectItem value="NO_PELIGROSO">No Peligroso</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="cantidadKg">Cantidad (kg) *</Label>
                <Input
                  id="cantidadKg"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.cantidadKg}
                  onChange={(e) => setFormData({ ...formData, cantidadKg: e.target.value })}
                  required
                  placeholder="0.00"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="responsable">Responsable *</Label>
              <Input
                id="responsable"
                value={formData.responsable}
                onChange={(e) => setFormData({ ...formData, responsable: e.target.value })}
                required
                placeholder="Nombre del responsable"
              />
            </div>

            <div>
              <Label htmlFor="observaciones">Observaciones</Label>
              <Textarea
                id="observaciones"
                value={formData.observaciones}
                onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                rows={3}
                placeholder="Observaciones adicionales (opcional)"
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={handleCloseModal}>
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {editando ? 'Actualizar' : 'Crear'} Manifiesto
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
