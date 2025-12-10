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
import { Plus, UserCheck, Clock, CheckCircle, XCircle, AlertTriangle, FileText, Stethoscope } from 'lucide-react';
import { apiGet, apiPost } from '@/services/api';
import { formatDateTime, formatDate } from '@/services/formatters';
import { useToast } from '@/hooks/use-toast';

const ESTADOS_INTERCONSULTA = {
  Solicitada: { color: 'bg-blue-100 text-blue-800 border-blue-200', icon: Clock },
  EnProceso: { color: 'bg-amber-100 text-amber-800 border-amber-200', icon: UserCheck },
  Respondida: { color: 'bg-green-100 text-green-800 border-green-200', icon: CheckCircle },
  Cancelada: { color: 'bg-gray-100 text-gray-800 border-gray-200', icon: XCircle },
};

const PRIORIDADES = {
  Baja: { color: 'bg-gray-100 text-gray-800', label: 'Baja' },
  Media: { color: 'bg-blue-100 text-blue-800', label: 'Media' },
  Alta: { color: 'bg-orange-100 text-orange-800', label: 'Alta' },
  Urgente: { color: 'bg-red-100 text-red-800', label: 'Urgente' },
};

export default function TabInterconsultas({ pacienteId, admisionId, user }) {
  const { toast } = useToast();
  const [interconsultas, setInterconsultas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedInterconsulta, setSelectedInterconsulta] = useState(null);
  const [viewMode, setViewMode] = useState(null); // 'create', 'view', 'respond'
  const [admisionActiva, setAdmisionActiva] = useState(null);
  const [formData, setFormData] = useState({
    especialidadSolicitada: '',
    motivoConsulta: '',
    antecedentesRelevantes: '',
    examenesSolicitados: '',
    diagnosticoPresuntivo: '',
    prioridad: 'Media',
  });
  const [responseData, setResponseData] = useState({
    evaluacionEspecialista: '',
    diagnosticoEspecialista: '',
    recomendaciones: '',
    requiereSeguimiento: false,
    fechaSeguimiento: '',
    observaciones: '',
  });

  useEffect(() => {
    if (pacienteId) {
      cargarDatos();
    }
  }, [pacienteId]);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      // Cargar interconsultas
      const responseInterconsultas = await apiGet('/interconsultas', {
        pacienteId,
        admisionId: admisionId || undefined,
      });
      setInterconsultas(responseInterconsultas.data || []);

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

  const cargarInterconsultas = async () => {
    try {
      const response = await apiGet('/interconsultas', {
        pacienteId,
        admisionId: admisionId || undefined,
      });
      setInterconsultas(response.data || []);
    } catch (error) {
      console.error('Error al cargar interconsultas:', error);
    }
  };

  const handleCrearInterconsulta = async (e) => {
    e.preventDefault();

    // Verificar si hay admisión activa
    const admisionIdAUsar = admisionId || admisionActiva?.id;
    
    if (!admisionIdAUsar) {
      toast({
        variant: 'destructive',
        title: 'Admisión requerida',
        description: 'El paciente debe tener una admisión hospitalaria activa para solicitar una interconsulta.',
      });
      return;
    }

    try {
      await apiPost('/interconsultas', {
        ...formData,
        pacienteId,
        admisionId: admisionIdAUsar,
      });

      toast({
        title: '✅ Interconsulta creada',
        description: 'La solicitud de interconsulta se ha registrado exitosamente.',
      });

      setIsDialogOpen(false);
      resetForm();
      await cargarInterconsultas();
    } catch (error) {
      console.error('Error al crear interconsulta:', error);
      toast({
        variant: 'destructive',
        title: 'Error al crear interconsulta',
        description: error.message || 'No se pudo crear la interconsulta. Por favor, intente nuevamente.',
      });
    }
  };

  const handleResponderInterconsulta = async (e) => {
    e.preventDefault();
    try {
      await apiPost(`/interconsultas/${selectedInterconsulta.id}/responder`, responseData);

      toast({
        title: '✅ Respuesta enviada',
        description: 'La respuesta de interconsulta se ha registrado exitosamente.',
      });

      setIsDialogOpen(false);
      setSelectedInterconsulta(null);
      setResponseData({
        evaluacionEspecialista: '',
        diagnosticoEspecialista: '',
        recomendaciones: '',
        requiereSeguimiento: false,
        fechaSeguimiento: '',
        observaciones: '',
      });
      await cargarInterconsultas();
    } catch (error) {
      console.error('Error al responder interconsulta:', error);
      toast({
        variant: 'destructive',
        title: 'Error al responder',
        description: error.message || 'No se pudo registrar la respuesta. Por favor, intente nuevamente.',
      });
    }
  };

  const resetForm = () => {
    setFormData({
      especialidadSolicitada: '',
      motivoConsulta: '',
      antecedentesRelevantes: '',
      examenesSolicitados: '',
      diagnosticoPresuntivo: '',
      prioridad: 'Media',
    });
  };

  const openDialog = (mode, interconsulta = null) => {
    setViewMode(mode);
    setSelectedInterconsulta(interconsulta);
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
          <h3 className="text-lg font-semibold text-gray-900">Interconsultas</h3>
          <p className="text-sm text-gray-500">Gestión de interconsultas entre especialidades</p>
          {!admisionId && !admisionActiva && (
            <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              Requiere admisión hospitalaria activa
            </p>
          )}
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => openDialog('create')}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nueva Interconsulta
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Stethoscope className="w-5 h-5 text-blue-600" />
                {viewMode === 'create' && 'Solicitar Interconsulta'}
                {viewMode === 'view' && 'Detalle de Interconsulta'}
                {viewMode === 'respond' && 'Responder Interconsulta'}
              </DialogTitle>
            </DialogHeader>

            {/* Formulario de creación */}
            {viewMode === 'create' && (
              <form onSubmit={handleCrearInterconsulta} className="space-y-4">
                <div>
                  <Label>Especialidad Solicitada *</Label>
                  <Input
                    value={formData.especialidadSolicitada}
                    onChange={(e) => setFormData({ ...formData, especialidadSolicitada: e.target.value })}
                    placeholder="Ej: Cardiología, Neurología..."
                    required
                  />
                </div>

                <div>
                  <Label>Prioridad *</Label>
                  <Select
                    value={formData.prioridad}
                    onValueChange={(value) => setFormData({ ...formData, prioridad: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(PRIORIDADES).map(([key, { label }]) => (
                        <SelectItem key={key} value={key}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Motivo de Consulta *</Label>
                  <Textarea
                    value={formData.motivoConsulta}
                    onChange={(e) => setFormData({ ...formData, motivoConsulta: e.target.value })}
                    rows={3}
                    required
                  />
                </div>

                <div>
                  <Label>Antecedentes Relevantes</Label>
                  <Textarea
                    value={formData.antecedentesRelevantes}
                    onChange={(e) => setFormData({ ...formData, antecedentesRelevantes: e.target.value })}
                    rows={2}
                  />
                </div>

                <div>
                  <Label>Exámenes Solicitados</Label>
                  <Textarea
                    value={formData.examenesSolicitados}
                    onChange={(e) => setFormData({ ...formData, examenesSolicitados: e.target.value })}
                    rows={2}
                  />
                </div>

                <div>
                  <Label>Diagnóstico Presuntivo</Label>
                  <Textarea
                    value={formData.diagnosticoPresuntivo}
                    onChange={(e) => setFormData({ ...formData, diagnosticoPresuntivo: e.target.value })}
                    rows={2}
                  />
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                    Solicitar Interconsulta
                  </Button>
                </div>
              </form>
            )}

            {/* Vista de detalle */}
            {viewMode === 'view' && selectedInterconsulta && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Estado</p>
                    <Badge className={ESTADOS_INTERCONSULTA[selectedInterconsulta.estado].color}>
                      {selectedInterconsulta.estado}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Prioridad</p>
                    <Badge className={PRIORIDADES[selectedInterconsulta.prioridad].color}>
                      {PRIORIDADES[selectedInterconsulta.prioridad].label}
                    </Badge>
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-500">Especialidad Solicitada</p>
                  <p className="mt-1">{selectedInterconsulta.especialidadSolicitada}</p>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-500">Motivo de Consulta</p>
                  <p className="mt-1 text-sm">{selectedInterconsulta.motivoConsulta}</p>
                </div>

                {selectedInterconsulta.evaluacionEspecialista && (
                  <div className="bg-green-50 p-4 rounded-lg">
                    <p className="text-sm font-medium text-green-900 mb-2">Respuesta del Especialista</p>
                    <div className="space-y-2 text-sm">
                      <div>
                        <p className="font-medium">Evaluación:</p>
                        <p>{selectedInterconsulta.evaluacionEspecialista}</p>
                      </div>
                      {selectedInterconsulta.diagnosticoEspecialista && (
                        <div>
                          <p className="font-medium">Diagnóstico:</p>
                          <p>{selectedInterconsulta.diagnosticoEspecialista}</p>
                        </div>
                      )}
                      {selectedInterconsulta.recomendaciones && (
                        <div>
                          <p className="font-medium">Recomendaciones:</p>
                          <p>{selectedInterconsulta.recomendaciones}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Formulario de respuesta */}
            {viewMode === 'respond' && selectedInterconsulta && (
              <form onSubmit={handleResponderInterconsulta} className="space-y-4">
                <div className="bg-blue-50 p-3 rounded-lg text-sm">
                  <p className="font-medium">Motivo: {selectedInterconsulta.motivoConsulta}</p>
                </div>

                <div>
                  <Label>Evaluación del Especialista *</Label>
                  <Textarea
                    value={responseData.evaluacionEspecialista}
                    onChange={(e) => setResponseData({ ...responseData, evaluacionEspecialista: e.target.value })}
                    rows={4}
                    required
                  />
                </div>

                <div>
                  <Label>Diagnóstico del Especialista</Label>
                  <Textarea
                    value={responseData.diagnosticoEspecialista}
                    onChange={(e) => setResponseData({ ...responseData, diagnosticoEspecialista: e.target.value })}
                    rows={2}
                  />
                </div>

                <div>
                  <Label>Recomendaciones</Label>
                  <Textarea
                    value={responseData.recomendaciones}
                    onChange={(e) => setResponseData({ ...responseData, recomendaciones: e.target.value })}
                    rows={3}
                  />
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" className="bg-green-600 hover:bg-green-700">
                    Enviar Respuesta
                  </Button>
                </div>
              </form>
            )}
          </DialogContent>
        </Dialog>
      </div>

      {/* Lista de Interconsultas */}
      {interconsultas.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-gray-500">
            <Stethoscope className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>No hay interconsultas registradas</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {interconsultas.map((ic) => {
            const EstadoIcon = ESTADOS_INTERCONSULTA[ic.estado].icon;
            return (
              <Card key={ic.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Badge className={ESTADOS_INTERCONSULTA[ic.estado].color}>
                          <EstadoIcon className="w-3 h-3 mr-1" />
                          {ic.estado}
                        </Badge>
                        <Badge className={PRIORIDADES[ic.prioridad].color}>
                          {PRIORIDADES[ic.prioridad].label}
                        </Badge>
                        <span className="text-sm text-gray-500">
                          {formatDate(ic.fechaSolicitud)}
                        </span>
                      </div>
                      <h4 className="font-semibold text-gray-900">{ic.especialidadSolicitada}</h4>
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">{ic.motivoConsulta}</p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                        <span>Solicitante: Dr. {ic.medicoSolicitante?.nombre} {ic.medicoSolicitante?.apellido}</span>
                        {ic.medicoEspecialista && (
                          <span>Especialista: Dr. {ic.medicoEspecialista?.nombre} {ic.medicoEspecialista?.apellido}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openDialog('view', ic)}
                      >
                        <FileText className="w-4 h-4" />
                      </Button>
                      {ic.estado === 'EnProceso' && ic.medicoEspecialistaId === user?.id && (
                        <Button
                          size="sm"
                          className="bg-green-600 hover:bg-green-700"
                          onClick={() => openDialog('respond', ic)}
                        >
                          Responder
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
