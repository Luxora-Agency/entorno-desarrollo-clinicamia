'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, FileCheck, Calendar, Wrench, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useInfraestructuraActas } from '@/hooks/useInfraestructuraActas';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function ActasDesactivacionList({ anioSeleccionado }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editando, setEditando] = useState(null);
  const [formData, setFormData] = useState({
    numeroActa: '',
    fecha: '',
    tipoEquipo: '',
    numeroSerie: '',
    motivoDesactivacion: '',
    responsable: '',
    testigos: '',
    observaciones: '',
  });

  const {
    actas,
    loading,
    loadActas,
    createActa,
    updateActa,
    deleteActa,
    getEstadisticasPorTipo,
  } = useInfraestructuraActas();

  const [estadisticas, setEstadisticas] = useState(null);

  useEffect(() => {
    loadData();
  }, [anioSeleccionado]);

  const loadData = async () => {
    const filters = {};
    if (anioSeleccionado) filters.anio = anioSeleccionado;

    await loadActas(filters);

    const stats = await getEstadisticasPorTipo(anioSeleccionado);
    setEstadisticas(stats);
  };

  const handleOpenModal = (acta = null) => {
    if (acta) {
      setEditando(acta);
      setFormData({
        numeroActa: acta.numeroActa,
        fecha: acta.fecha ? format(new Date(acta.fecha), 'yyyy-MM-dd') : '',
        tipoEquipo: acta.tipoEquipo,
        numeroSerie: acta.numeroSerie || '',
        motivoDesactivacion: acta.motivoDesactivacion,
        responsable: acta.responsable,
        testigos: Array.isArray(acta.testigos) ? acta.testigos.join(', ') : '',
        observaciones: acta.observaciones || '',
      });
    } else {
      setEditando(null);
      setFormData({
        numeroActa: '',
        fecha: format(new Date(), 'yyyy-MM-dd'),
        tipoEquipo: '',
        numeroSerie: '',
        motivoDesactivacion: '',
        responsable: '',
        testigos: '',
        observaciones: '',
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditando(null);
    setFormData({
      numeroActa: '',
      fecha: '',
      tipoEquipo: '',
      numeroSerie: '',
      motivoDesactivacion: '',
      responsable: '',
      testigos: '',
      observaciones: '',
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const data = {
      ...formData,
      testigos: formData.testigos.split(',').map(t => t.trim()).filter(Boolean),
    };

    let success;
    if (editando) {
      success = await updateActa(editando.id, data);
    } else {
      success = await createActa(data);
    }

    if (success) {
      handleCloseModal();
      loadData();
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Está seguro de eliminar esta acta?')) {
      const success = await deleteActa(id);
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
            <FileCheck className="w-5 h-5 text-purple-600" />
            Actas de Desactivación de Equipos
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Registro de desactivación y baja de equipos médicos
          </p>
        </div>

        <Button onClick={() => handleOpenModal()} className="gap-2">
          <Plus className="w-4 h-4" />
          Nueva Acta
        </Button>
      </div>

      {/* Estadísticas */}
      {estadisticas && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.entries(estadisticas).map(([tipo, count]) => (
            <Card key={tipo}>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">{count}</div>
                  <div className="text-xs text-gray-600 mt-1 capitalize">
                    {tipo.replace(/_/g, ' ')}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Tabla */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>N° Acta</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Tipo de Equipo</TableHead>
                  <TableHead>N° Serie</TableHead>
                  <TableHead>Motivo</TableHead>
                  <TableHead>Responsable</TableHead>
                  <TableHead className="text-center">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                      Cargando actas...
                    </TableCell>
                  </TableRow>
                ) : actas.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                      No hay actas registradas
                    </TableCell>
                  </TableRow>
                ) : (
                  actas.map((acta) => (
                    <TableRow key={acta.id}>
                      <TableCell className="font-medium">{acta.numeroActa}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          {format(new Date(acta.fecha), 'dd/MM/yyyy', { locale: es })}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Wrench className="w-4 h-4 text-gray-400" />
                          {acta.tipoEquipo}
                        </div>
                      </TableCell>
                      <TableCell className="text-gray-600">
                        {acta.numeroSerie || 'N/A'}
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {acta.motivoDesactivacion}
                      </TableCell>
                      <TableCell>{acta.responsable}</TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenModal(acta)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(acta.id)}
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
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editando ? 'Editar Acta' : 'Nueva Acta de Desactivación'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="numeroActa">N° Acta *</Label>
                <Input
                  id="numeroActa"
                  value={formData.numeroActa}
                  onChange={(e) => setFormData({ ...formData, numeroActa: e.target.value })}
                  required
                  placeholder="Ej: ACTA-DES-2025-001"
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

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="tipoEquipo">Tipo de Equipo *</Label>
                <Input
                  id="tipoEquipo"
                  value={formData.tipoEquipo}
                  onChange={(e) => setFormData({ ...formData, tipoEquipo: e.target.value })}
                  required
                  placeholder="Ej: Monitor de signos vitales"
                />
              </div>

              <div>
                <Label htmlFor="numeroSerie">N° de Serie</Label>
                <Input
                  id="numeroSerie"
                  value={formData.numeroSerie}
                  onChange={(e) => setFormData({ ...formData, numeroSerie: e.target.value })}
                  placeholder="Número de serie del equipo"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="motivoDesactivacion">Motivo de Desactivación *</Label>
              <Textarea
                id="motivoDesactivacion"
                value={formData.motivoDesactivacion}
                onChange={(e) => setFormData({ ...formData, motivoDesactivacion: e.target.value })}
                required
                rows={3}
                placeholder="Describa el motivo de la desactivación..."
              />
            </div>

            <div>
              <Label htmlFor="responsable">Responsable *</Label>
              <Input
                id="responsable"
                value={formData.responsable}
                onChange={(e) => setFormData({ ...formData, responsable: e.target.value })}
                required
                placeholder="Nombre del responsable de la desactivación"
              />
            </div>

            <div>
              <Label htmlFor="testigos">Testigos</Label>
              <Input
                id="testigos"
                value={formData.testigos}
                onChange={(e) => setFormData({ ...formData, testigos: e.target.value })}
                placeholder="Nombres separados por comas (Ej: Juan Pérez, María López)"
              />
              <p className="text-xs text-gray-500 mt-1">
                Separe los nombres con comas
              </p>
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
                {editando ? 'Actualizar' : 'Crear'} Acta
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
