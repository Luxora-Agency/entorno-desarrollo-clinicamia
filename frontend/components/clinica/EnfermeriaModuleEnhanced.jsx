'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Activity,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Pill,
  User,
  Calendar,
  TrendingUp,
} from 'lucide-react';
import { apiGet, apiPost } from '@/services/api';
import { formatDateTime, formatDate, formatTime } from '@/services/formatters';
import { useToast } from '@/hooks/use-toast';

export default function EnfermeriaModule({ user }) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [administraciones, setAdministraciones] = useState([]);
  const [resumenDia, setResumenDia] = useState(null);
  const [fechaSeleccionada, setFechaSeleccionada] = useState(new Date().toISOString().split('T')[0]);
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [administracionSeleccionada, setAdministracionSeleccionada] = useState(null);
  const [accion, setAccion] = useState(null); // 'administrar', 'omitir', 'rechazar'
  
  const [formData, setFormData] = useState({
    dosisAdministrada: '',
    observaciones: '',
    reaccionAdversa: false,
    descripcionReaccion: '',
    motivo: '',
  });

  useEffect(() => {
    cargarDatos();
  }, [fechaSeleccionada]);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const [responseAdministraciones, responseResumen] = await Promise.all([
        apiGet('/administraciones', {
          fecha: fechaSeleccionada,
          estado: 'Programada',
          limit: 100,
        }),
        apiGet('/administraciones/resumen-dia', {
          fecha: fechaSeleccionada,
        }),
      ]);

      setAdministraciones(responseAdministraciones.data || []);
      setResumenDia(responseResumen.data || null);
    } catch (error) {
      console.error('Error al cargar datos:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudieron cargar las administraciones',
      });
    } finally {
      setLoading(false);
    }
  };

  const abrirDialogo = (administracion, tipoAccion) => {
    setAdministracionSeleccionada(administracion);
    setAccion(tipoAccion);
    setFormData({
      dosisAdministrada: administracion.prescripcionMedicamento?.dosis || '',
      observaciones: '',
      reaccionAdversa: false,
      descripcionReaccion: '',
      motivo: '',
    });
    setIsDialogOpen(true);
  };

  const handleAdministrar = async (e) => {
    e.preventDefault();

    try {
      await apiPost(`/administraciones/${administracionSeleccionada.id}/administrar`, {
        dosisAdministrada: formData.dosisAdministrada,
        observaciones: formData.observaciones,
        reaccionAdversa: formData.reaccionAdversa,
        descripcionReaccion: formData.reaccionAdversa ? formData.descripcionReaccion : null,
      });

      toast({
        title: '✅ Medicamento administrado',
        description: 'La administración se ha registrado exitosamente.',
      });

      if (formData.reaccionAdversa) {
        toast({
          variant: 'destructive',
          title: '⚠️ Reacción adversa reportada',
          description: 'Se ha creado una alerta clínica automáticamente.',
        });
      }

      setIsDialogOpen(false);
      await cargarDatos();
    } catch (error) {
      console.error('Error:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'No se pudo registrar la administración.',
      });
    }
  };

  const handleOmitir = async (e) => {
    e.preventDefault();

    if (!formData.motivo) {
      toast({
        variant: 'destructive',
        title: 'Motivo requerido',
        description: 'Debe indicar el motivo de la omisión.',
      });
      return;
    }

    try {
      await apiPost(`/administraciones/${administracionSeleccionada.id}/omitir`, {
        motivo: formData.motivo,
      });

      toast({
        title: 'Omisión registrada',
        description: 'La omisión del medicamento ha sido registrada.',
      });

      setIsDialogOpen(false);
      await cargarDatos();
    } catch (error) {
      console.error('Error:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'No se pudo registrar la omisión.',
      });
    }
  };

  const handleRechazar = async (e) => {
    e.preventDefault();

    if (!formData.motivo) {
      toast({
        variant: 'destructive',
        title: 'Motivo requerido',
        description: 'Debe indicar el motivo del rechazo.',
      });
      return;
    }

    try {
      await apiPost(`/administraciones/${administracionSeleccionada.id}/rechazar`, {
        motivo: formData.motivo,
      });

      toast({
        title: 'Rechazo registrado',
        description: 'El rechazo del paciente ha sido registrado.',
      });

      setIsDialogOpen(false);
      await cargarDatos();
    } catch (error) {
      console.error('Error:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'No se pudo registrar el rechazo.',
      });
    }
  };

  const getHorarioColor = (hora, estado) => {
    if (estado !== 'Programada') return 'text-gray-500';
    
    const now = new Date();
    const [h, m] = hora.split(':');
    const horaProgramada = new Date();
    horaProgramada.setHours(parseInt(h), parseInt(m), 0);

    if (horaProgramada < now) {
      return 'text-red-600 font-semibold'; // Atrasada
    } else if (horaProgramada - now < 30 * 60 * 1000) {
      return 'text-amber-600 font-semibold'; // Próxima (menos de 30 min)
    }
    return 'text-blue-600';
  };

  const agruparPorPaciente = (administraciones) => {
    const grupos = {};
    administraciones.forEach(adm => {
      const pacienteId = adm.pacienteId;
      if (!grupos[pacienteId]) {
        grupos[pacienteId] = {
          paciente: adm.paciente,
          administraciones: [],
        };
      }
      grupos[pacienteId].administraciones.push(adm);
    });
    return Object.values(grupos);
  };

  const pacientesAgrupados = agruparPorPaciente(administraciones);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Activity className="w-8 h-8 animate-spin text-blue-600" />
        <span className="ml-3 text-lg">Cargando panel de enfermería...</span>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Activity className="w-7 h-7 text-blue-600" />
            Panel de Enfermería
          </h1>
          <p className="text-gray-600 mt-1">Administración de medicamentos</p>
        </div>
        <div className="flex items-center gap-3">
          <Label className="text-sm font-medium">Fecha:</Label>
          <Input
            type="date"
            value={fechaSeleccionada}
            onChange={(e) => setFechaSeleccionada(e.target.value)}
            className="w-40"
          />
        </div>
      </div>

      {/* Resumen del día */}
      {resumenDia && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total</p>
                  <p className="text-2xl font-bold">{resumenDia.total}</p>
                </div>
                <Pill className="w-8 h-8 text-gray-400" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Administradas</p>
                  <p className="text-2xl font-bold text-green-600">{resumenDia.administradas}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Pendientes</p>
                  <p className="text-2xl font-bold text-blue-600">{resumenDia.pendientes}</p>
                </div>
                <Clock className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Omitidas</p>
                  <p className="text-2xl font-bold text-amber-600">{resumenDia.omitidas}</p>
                </div>
                <AlertTriangle className="w-8 h-8 text-amber-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Cumplimiento</p>
                  <p className="text-2xl font-bold text-purple-600">{resumenDia.porcentajeAdministrado}%</p>
                </div>
                <TrendingUp className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Lista de pacientes con medicamentos pendientes */}
      {pacientesAgrupados.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-600" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              ¡Excelente trabajo!
            </h3>
            <p className="text-gray-600">
              No hay administraciones pendientes para la fecha seleccionada
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {pacientesAgrupados.map((grupo) => (
            <Card key={grupo.paciente.id} className="overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center text-lg font-semibold">
                      {grupo.paciente.nombre[0]}{grupo.paciente.apellido[0]}
                    </div>
                    <div>
                      <CardTitle className="text-lg">
                        {grupo.paciente.nombre} {grupo.paciente.apellido}
                      </CardTitle>
                      <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                        <span>CC: {grupo.paciente.cedula}</span>
                        {grupo.paciente.admisiones?.[0]?.cama && (
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            Habitación {grupo.paciente.admisiones[0].cama.habitacion?.numero} - 
                            Cama {grupo.paciente.admisiones[0].cama.numero}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-base">
                    {grupo.administraciones.length} medicamentos
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y">
                  {grupo.administraciones.map((adm) => (
                    <div
                      key={adm.id}
                      className="p-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <div className={`text-lg font-semibold ${getHorarioColor(adm.horaProgramada, adm.estado)}`}>
                              {adm.horaProgramada}
                            </div>
                            <div className="flex items-center gap-2">
                              <Pill className="w-4 h-4 text-blue-600" />
                              <span className="font-medium text-gray-900">
                                {adm.prescripcionMedicamento?.producto?.nombre ||
                                 adm.prescripcionMedicamento?.medicamento?.nombre}
                              </span>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-3 gap-4 text-sm text-gray-600 ml-14">
                            <div>
                              <span className="font-medium">Dosis:</span> {adm.prescripcionMedicamento?.dosis}
                            </div>
                            <div>
                              <span className="font-medium">Vía:</span> {adm.prescripcionMedicamento?.via}
                            </div>
                            <div>
                              <span className="font-medium">Frecuencia:</span> {adm.prescripcionMedicamento?.frecuencia}
                            </div>
                          </div>
                          
                          {adm.prescripcionMedicamento?.instrucciones && (
                            <div className="mt-2 ml-14 p-2 bg-amber-50 rounded text-sm text-amber-900">
                              <strong>Instrucciones:</strong> {adm.prescripcionMedicamento.instrucciones}
                            </div>
                          )}
                        </div>
                        
                        <div className="flex gap-2 ml-4">
                          <Button
                            size="sm"
                            onClick={() => abrirDialogo(adm, 'administrar')}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Administrar
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => abrirDialogo(adm, 'omitir')}
                            className="border-amber-600 text-amber-600 hover:bg-amber-50"
                          >
                            Omitir
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => abrirDialogo(adm, 'rechazar')}
                            className="border-red-600 text-red-600 hover:bg-red-50"
                          >
                            Rechazar
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Dialog para administrar/omitir/rechazar */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {accion === 'administrar' && '✅ Administrar Medicamento'}
              {accion === 'omitir' && '⚠️ Omitir Administración'}
              {accion === 'rechazar' && '❌ Registrar Rechazo del Paciente'}
            </DialogTitle>
          </DialogHeader>

          {administracionSeleccionada && (
            <div className="space-y-4">
              {/* Información del medicamento */}
              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="font-medium text-blue-900 mb-2">
                  {administracionSeleccionada.prescripcionMedicamento?.producto?.nombre ||
                   administracionSeleccionada.prescripcionMedicamento?.medicamento?.nombre}
                </div>
                <div className="text-sm text-blue-800 space-y-1">
                  <div>Paciente: {administracionSeleccionada.paciente?.nombre} {administracionSeleccionada.paciente?.apellido}</div>
                  <div>Hora programada: {administracionSeleccionada.horaProgramada}</div>
                  <div>Dosis: {administracionSeleccionada.prescripcionMedicamento?.dosis}</div>
                  <div>Vía: {administracionSeleccionada.prescripcionMedicamento?.via}</div>
                </div>
              </div>

              {/* Formulario según la acción */}
              <form onSubmit={
                accion === 'administrar' ? handleAdministrar :
                accion === 'omitir' ? handleOmitir :
                handleRechazar
              }>
                {accion === 'administrar' && (
                  <>
                    <div>
                      <Label>Dosis Administrada</Label>
                      <Input
                        value={formData.dosisAdministrada}
                        onChange={(e) => setFormData({ ...formData, dosisAdministrada: e.target.value })}
                        placeholder="Ej: 500mg"
                        required
                      />
                    </div>

                    <div>
                      <Label>Observaciones</Label>
                      <Textarea
                        value={formData.observaciones}
                        onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                        placeholder="Observaciones adicionales..."
                        rows={2}
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="reaccionAdversa"
                        checked={formData.reaccionAdversa}
                        onChange={(e) => setFormData({ ...formData, reaccionAdversa: e.target.checked })}
                        className="w-4 h-4"
                      />
                      <Label htmlFor="reaccionAdversa" className="cursor-pointer">
                        ⚠️ El paciente presentó reacción adversa
                      </Label>
                    </div>

                    {formData.reaccionAdversa && (
                      <div>
                        <Label>Descripción de la Reacción Adversa *</Label>
                        <Textarea
                          value={formData.descripcionReaccion}
                          onChange={(e) => setFormData({ ...formData, descripcionReaccion: e.target.value })}
                          placeholder="Describa la reacción adversa presentada..."
                          rows={3}
                          required
                        />
                      </div>
                    )}
                  </>
                )}

                {(accion === 'omitir' || accion === 'rechazar') && (
                  <div>
                    <Label>Motivo *</Label>
                    <Textarea
                      value={formData.motivo}
                      onChange={(e) => setFormData({ ...formData, motivo: e.target.value })}
                      placeholder={
                        accion === 'omitir' 
                          ? 'Indique el motivo de la omisión...'
                          : 'Indique el motivo del rechazo del paciente...'
                      }
                      rows={3}
                      required
                    />
                  </div>
                )}

                <div className="flex justify-end gap-3 mt-6">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    className={
                      accion === 'administrar' ? 'bg-green-600 hover:bg-green-700' :
                      accion === 'omitir' ? 'bg-amber-600 hover:bg-amber-700' :
                      'bg-red-600 hover:bg-red-700'
                    }
                  >
                    Confirmar
                  </Button>
                </div>
              </form>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
