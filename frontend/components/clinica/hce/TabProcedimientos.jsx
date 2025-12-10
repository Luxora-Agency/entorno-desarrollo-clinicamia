'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Play, CheckCircle, XCircle, Clock, Calendar, AlertTriangle, Activity } from 'lucide-react';
import { apiGet, apiPost } from '@/services/api';
import { formatDateTime, formatDate } from '@/services/formatters';
import { useToast } from '@/hooks/use-toast';

const ESTADOS_PROCEDIMIENTO = {
  Programado: { color: 'bg-blue-100 text-blue-800 border-blue-200', icon: Calendar },
  EnProceso: { color: 'bg-amber-100 text-amber-800 border-amber-200', icon: Activity },
  Completado: { color: 'bg-green-100 text-green-800 border-green-200', icon: CheckCircle },
  Cancelado: { color: 'bg-gray-100 text-gray-800 border-gray-200', icon: XCircle },
  Diferido: { color: 'bg-orange-100 text-orange-800 border-orange-200', icon: Clock },
};

const TIPOS_PROCEDIMIENTO = {
  Diagnostico: 'Diagnóstico',
  Terapeutico: 'Terapéutico',
  Quirurgico: 'Quirúrgico',
  Intervencionista: 'Intervencionista',
  Rehabilitacion: 'Rehabilitación',
  Otro: 'Otro',
};

export default function TabProcedimientos({ pacienteId, admisionId, user }) {
  const { toast } = useToast();
  const [procedimientos, setProcedimientos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedProcedimiento, setSelectedProcedimiento] = useState(null);
  const [viewMode, setViewMode] = useState(null); // 'create', 'view', 'complete', 'cancel'
  const [admisionActiva, setAdmisionActiva] = useState(null);
  const [formData, setFormData] = useState({
    nombre: '',
    tipo: 'Terapeutico',
    descripcion: '',
    indicacion: '',
    fechaProgramada: '',
    duracionEstimada: '',
  });
  const [completarData, setCompletarData] = useState({
    tecnicaUtilizada: '',
    hallazgos: '',
    complicaciones: '',
    resultados: '',
    insumosUtilizados: '',
    equipoMedico: '',
    personalAsistente: '',
    recomendacionesPost: '',
    cuidadosEspeciales: '',
    observaciones: '',
    duracionReal: '',
  });

  useEffect(() => {
    if (pacienteId) {
      cargarDatos();
    }
  }, [pacienteId]);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      // Cargar procedimientos
      const responseProcedimientos = await apiGet('/procedimientos', {
        pacienteId,
        admisionId: admisionId || undefined,
      });
      setProcedimientos(responseProcedimientos.data || []);

      // Verificar si hay una admisión activa
      if (!admisionId) {
        const responseAdmisiones = await apiGet('/admisiones', {
          pacienteId,
        });
        const admisionesActivas = responseAdmisiones.data.admisiones?.filter(
          (adm) => adm.estado === 'Activa'
        );
        if (admisionesActivas && admisionesActivas.length > 0) {
          setAdmisionActiva(admisionesActivas[0]);
        }
      } else {
        setAdmisionActiva({ id: admisionId });
      }
    } catch (error) {
      console.error('Error al cargar datos:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudieron cargar los datos',
      });
    } finally {
      setLoading(false);
    }
  };

  const cargarProcedimientos = async () => {
    try {
      const response = await apiGet('/procedimientos', {
        pacienteId,
        admisionId: admisionId || undefined,
      });
      setProcedimientos(response.data || []);
    } catch (error) {
      console.error('Error al cargar procedimientos:', error);
    }
  };

  const handleCrearProcedimiento = async (e) => {
    e.preventDefault();

    // Verificar si hay admisión activa
    const admisionIdAUsar = admisionId || admisionActiva?.id;
    
    if (!admisionIdAUsar) {
      toast({
        variant: 'destructive',
        title: 'Admisión requerida',
        description: 'El paciente debe tener una admisión hospitalaria activa para programar un procedimiento.',
      });
      return;
    }

    try {
      await apiPost('/procedimientos', {
        ...formData,
        pacienteId,
        admisionId: admisionIdAUsar,
      });

      toast({
        title: '✅ Procedimiento creado',
        description: 'El procedimiento se ha programado exitosamente.',
      });

      setIsDialogOpen(false);
      resetForm();
      await cargarProcedimientos();
    } catch (error) {
      console.error('Error al crear procedimiento:', error);
      toast({
        variant: 'destructive',
        title: 'Error al crear procedimiento',
        description: error.message || 'No se pudo programar el procedimiento. Por favor, intente nuevamente.',
      });
    }
  };

  const handleIniciarProcedimiento = async (procedimientoId) => {
    if (!confirm('¿Está seguro de iniciar este procedimiento?')) return;
    
    try {
      await apiPost(`/procedimientos/${procedimientoId}/iniciar`);
      toast({
        title: '✅ Procedimiento iniciado',
        description: 'El procedimiento ha sido marcado como en proceso.',
      });
      await cargarProcedimientos();
    } catch (error) {
      console.error('Error al iniciar procedimiento:', error);
      toast({
        variant: 'destructive',
        title: 'Error al iniciar',
        description: error.message || 'No se pudo iniciar el procedimiento.',
      });
    }
  };

  const handleCompletarProcedimiento = async (e) => {
    e.preventDefault();
    try {
      await apiPost(`/procedimientos/${selectedProcedimiento.id}/completar`, completarData);

      toast({
        title: '✅ Procedimiento completado',
        description: 'El procedimiento se ha marcado como completado exitosamente.',
      });

      setIsDialogOpen(false);
      setSelectedProcedimiento(null);
      setCompletarData({
        tecnicaUtilizada: '',
        hallazgos: '',
        complicaciones: '',
        resultados: '',
        insumosUtilizados: '',
        equipoMedico: '',
        personalAsistente: '',
        recomendacionesPost: '',
        cuidadosEspeciales: '',
        observaciones: '',
        duracionReal: '',
      });
      await cargarProcedimientos();
    } catch (error) {
      console.error('Error al completar procedimiento:', error);
      toast({
        variant: 'destructive',
        title: 'Error al completar',
        description: error.message || 'No se pudo completar el procedimiento.',
      });
    }
  };

  const handleCancelarProcedimiento = async (e) => {
    e.preventDefault();
    try {
      const motivo = e.target.motivo.value;
      await apiPost(`/procedimientos/${selectedProcedimiento.id}/cancelar`, { motivo });

      toast({
        title: '✅ Procedimiento cancelado',
        description: 'El procedimiento ha sido cancelado.',
      });

      setIsDialogOpen(false);
      setSelectedProcedimiento(null);
      await cargarProcedimientos();
    } catch (error) {
      console.error('Error al cancelar procedimiento:', error);
      toast({
        variant: 'destructive',
        title: 'Error al cancelar',
        description: error.message || 'No se pudo cancelar el procedimiento.',
      });
    }
  };

  const resetForm = () => {
    setFormData({
      nombre: '',
      tipo: 'Terapeutico',
      descripcion: '',
      indicacion: '',
      fechaProgramada: '',
      duracionEstimada: '',
    });
  };

  const openDialog = (mode, procedimiento = null) => {
    setViewMode(mode);
    setSelectedProcedimiento(procedimiento);
    setIsDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Procedimientos</h3>
          <p className="text-sm text-gray-500">Gestión de procedimientos clínicos y quirúrgicos</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => openDialog('create')}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Procedimiento
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-blue-600" />
                {viewMode === 'create' && 'Programar Procedimiento'}
                {viewMode === 'view' && 'Detalle del Procedimiento'}
                {viewMode === 'complete' && 'Completar Procedimiento'}
                {viewMode === 'cancel' && 'Cancelar Procedimiento'}
              </DialogTitle>
            </DialogHeader>

            {/* Formulario de creación */}
            {viewMode === 'create' && (
              <form onSubmit={handleCrearProcedimiento} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <Label>Nombre del Procedimiento *</Label>
                    <Input
                      value={formData.nombre}
                      onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                      placeholder="Ej: Cateterismo cardíaco, Endoscopia..."
                      required
                    />
                  </div>

                  <div>
                    <Label>Tipo *</Label>
                    <Select
                      value={formData.tipo}
                      onValueChange={(value) => setFormData({ ...formData, tipo: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(TIPOS_PROCEDIMIENTO).map(([key, label]) => (
                          <SelectItem key={key} value={key}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Fecha Programada</Label>
                    <Input
                      type="datetime-local"
                      value={formData.fechaProgramada}
                      onChange={(e) => setFormData({ ...formData, fechaProgramada: e.target.value })}
                    />
                  </div>

                  <div className="col-span-2">
                    <Label>Duración Estimada (minutos)</Label>
                    <Input
                      type="number"
                      value={formData.duracionEstimada}
                      onChange={(e) => setFormData({ ...formData, duracionEstimada: e.target.value })}
                      placeholder="60"
                    />
                  </div>
                </div>

                <div>
                  <Label>Descripción *</Label>
                  <Textarea
                    value={formData.descripcion}
                    onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                    rows={3}
                    required
                  />
                </div>

                <div>
                  <Label>Indicación Médica *</Label>
                  <Textarea
                    value={formData.indicacion}
                    onChange={(e) => setFormData({ ...formData, indicacion: e.target.value })}
                    rows={3}
                    required
                  />
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                    Programar Procedimiento
                  </Button>
                </div>
              </form>
            )}

            {/* Vista de detalle */}
            {viewMode === 'view' && selectedProcedimiento && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Estado</p>
                    <Badge className={ESTADOS_PROCEDIMIENTO[selectedProcedimiento.estado].color}>
                      {selectedProcedimiento.estado}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Tipo</p>
                    <Badge variant="outline">{TIPOS_PROCEDIMIENTO[selectedProcedimiento.tipo]}</Badge>
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-500">Nombre</p>
                  <p className="mt-1 font-semibold">{selectedProcedimiento.nombre}</p>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-500">Descripción</p>
                  <p className="mt-1 text-sm">{selectedProcedimiento.descripcion}</p>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-500">Indicación</p>
                  <p className="mt-1 text-sm">{selectedProcedimiento.indicacion}</p>
                </div>

                {selectedProcedimiento.fechaProgramada && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Fecha Programada</p>
                    <p className="mt-1">{formatDateTime(selectedProcedimiento.fechaProgramada)}</p>
                  </div>
                )}

                {selectedProcedimiento.estado === 'Completado' && (
                  <div className="bg-green-50 p-4 rounded-lg space-y-3">
                    <p className="text-sm font-medium text-green-900">Resultado del Procedimiento</p>
                    
                    {selectedProcedimiento.hallazgos && (
                      <div className="text-sm">
                        <p className="font-medium">Hallazgos:</p>
                        <p className="text-gray-700">{selectedProcedimiento.hallazgos}</p>
                      </div>
                    )}

                    {selectedProcedimiento.resultados && (
                      <div className="text-sm">
                        <p className="font-medium">Resultados:</p>
                        <p className="text-gray-700">{selectedProcedimiento.resultados}</p>
                      </div>
                    )}

                    {selectedProcedimiento.recomendacionesPost && (
                      <div className="text-sm">
                        <p className="font-medium">Recomendaciones:</p>
                        <p className="text-gray-700">{selectedProcedimiento.recomendacionesPost}</p>
                      </div>
                    )}

                    {selectedProcedimiento.fechaFirma && (
                      <div className="text-xs text-gray-500 pt-2 border-t border-green-200">
                        Firmado el {formatDateTime(selectedProcedimiento.fechaFirma)}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Formulario de completar */}
            {viewMode === 'complete' && selectedProcedimiento && (
              <form onSubmit={handleCompletarProcedimiento} className="space-y-4">
                <div className="bg-blue-50 p-3 rounded-lg text-sm">
                  <p className="font-medium">{selectedProcedimiento.nombre}</p>
                  <p className="text-gray-600">{TIPOS_PROCEDIMIENTO[selectedProcedimiento.tipo]}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <Label>Técnica Utilizada</Label>
                    <Textarea
                      value={completarData.tecnicaUtilizada}
                      onChange={(e) => setCompletarData({ ...completarData, tecnicaUtilizada: e.target.value })}
                      rows={2}
                    />
                  </div>

                  <div className="col-span-2">
                    <Label>Hallazgos *</Label>
                    <Textarea
                      value={completarData.hallazgos}
                      onChange={(e) => setCompletarData({ ...completarData, hallazgos: e.target.value })}
                      rows={3}
                      required
                    />
                  </div>

                  <div className="col-span-2">
                    <Label>Resultados</Label>
                    <Textarea
                      value={completarData.resultados}
                      onChange={(e) => setCompletarData({ ...completarData, resultados: e.target.value })}
                      rows={2}
                    />
                  </div>

                  <div className="col-span-2">
                    <Label>Complicaciones</Label>
                    <Textarea
                      value={completarData.complicaciones}
                      onChange={(e) => setCompletarData({ ...completarData, complicaciones: e.target.value })}
                      rows={2}
                      placeholder="Ninguna"
                    />
                  </div>

                  <div>
                    <Label>Duración Real (minutos)</Label>
                    <Input
                      type="number"
                      value={completarData.duracionReal}
                      onChange={(e) => setCompletarData({ ...completarData, duracionReal: e.target.value })}
                    />
                  </div>

                  <div>
                    <Label>Personal Asistente</Label>
                    <Input
                      value={completarData.personalAsistente}
                      onChange={(e) => setCompletarData({ ...completarData, personalAsistente: e.target.value })}
                      placeholder="Enfermeras, técnicos..."
                    />
                  </div>

                  <div className="col-span-2">
                    <Label>Insumos Utilizados</Label>
                    <Textarea
                      value={completarData.insumosUtilizados}
                      onChange={(e) => setCompletarData({ ...completarData, insumosUtilizados: e.target.value })}
                      rows={2}
                    />
                  </div>

                  <div className="col-span-2">
                    <Label>Recomendaciones Post-Procedimiento</Label>
                    <Textarea
                      value={completarData.recomendacionesPost}
                      onChange={(e) => setCompletarData({ ...completarData, recomendacionesPost: e.target.value })}
                      rows={2}
                    />
                  </div>

                  <div className="col-span-2">
                    <Label>Observaciones</Label>
                    <Textarea
                      value={completarData.observaciones}
                      onChange={(e) => setCompletarData({ ...completarData, observaciones: e.target.value })}
                      rows={2}
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" className="bg-green-600 hover:bg-green-700">
                    Completar y Firmar
                  </Button>
                </div>
              </form>
            )}

            {/* Formulario de cancelar */}
            {viewMode === 'cancel' && selectedProcedimiento && (
              <form onSubmit={handleCancelarProcedimiento} className="space-y-4">
                <div className="bg-red-50 p-4 rounded-lg">
                  <p className="text-sm text-red-800">
                    ¿Está seguro de cancelar el procedimiento "<strong>{selectedProcedimiento.nombre}</strong>"?
                  </p>
                </div>

                <div>
                  <Label>Motivo de Cancelación *</Label>
                  <Textarea
                    name="motivo"
                    rows={3}
                    required
                    placeholder="Indique el motivo de la cancelación..."
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Volver
                  </Button>
                  <Button type="submit" variant="destructive">
                    Confirmar Cancelación
                  </Button>
                </div>
              </form>
            )}
          </DialogContent>
        </Dialog>
      </div>

      {/* Lista de Procedimientos */}
      {procedimientos.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-gray-500">
            <Activity className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>No hay procedimientos registrados</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {procedimientos.map((proc) => {
            const EstadoIcon = ESTADOS_PROCEDIMIENTO[proc.estado].icon;
            return (
              <Card key={proc.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Badge className={ESTADOS_PROCEDIMIENTO[proc.estado].color}>
                          <EstadoIcon className="w-3 h-3 mr-1" />
                          {proc.estado}
                        </Badge>
                        <Badge variant="outline">{TIPOS_PROCEDIMIENTO[proc.tipo]}</Badge>
                        {proc.fechaProgramada && (
                          <span className="text-sm text-gray-500">
                            {formatDate(proc.fechaProgramada)}
                          </span>
                        )}
                      </div>
                      <h4 className="font-semibold text-gray-900">{proc.nombre}</h4>
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">{proc.descripcion}</p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                        <span>Dr. {proc.medicoResponsable?.nombre} {proc.medicoResponsable?.apellido}</span>
                        {proc.duracionEstimada && (
                          <span>{proc.duracionEstimada} min</span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openDialog('view', proc)}
                      >
                        Ver
                      </Button>
                      {proc.estado === 'Programado' && proc.medicoResponsableId === user?.id && (
                        <Button
                          size="sm"
                          className="bg-amber-600 hover:bg-amber-700"
                          onClick={() => handleIniciarProcedimiento(proc.id)}
                        >
                          <Play className="w-4 h-4 mr-1" />
                          Iniciar
                        </Button>
                      )}
                      {proc.estado === 'EnProceso' && proc.medicoResponsableId === user?.id && (
                        <Button
                          size="sm"
                          className="bg-green-600 hover:bg-green-700"
                          onClick={() => openDialog('complete', proc)}
                        >
                          Completar
                        </Button>
                      )}
                      {(proc.estado === 'Programado' || proc.estado === 'EnProceso') &&
                        proc.medicoResponsableId === user?.id && (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => openDialog('cancel', proc)}
                          >
                            <XCircle className="w-4 h-4" />
                          </Button>
                        )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
