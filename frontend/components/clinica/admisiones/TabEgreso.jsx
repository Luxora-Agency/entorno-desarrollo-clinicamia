'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  LogOut, 
  FileText, 
  Calendar, 
  User,
  CheckCircle2,
  AlertCircle,
  Download,
  Clock,
  Stethoscope
} from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';

export default function TabEgreso({ pacienteId, paciente, user }) {
  const [egreso, setEgreso] = useState(null);
  const [admisionActiva, setAdmisionActiva] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showModalEgreso, setShowModalEgreso] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    diagnostico_salida: '',
    descripcion_diagnostico: '',
    resumen_clinico: '',
    tratamiento_domiciliario: '',
    recomendaciones: '',
    tipo_egreso: 'AltaMedica',
    estado_paciente: 'Mejorado',
    requiere_control: false,
    fecha_control: '',
    observaciones: '',
  });

  // Diagnósticos CIE-10 comunes para búsqueda rápida
  const diagnosticosComunes = [
    { codigo: 'J00', descripcion: 'Rinofaringitis aguda (resfriado común)' },
    { codigo: 'A09', descripcion: 'Diarrea y gastroenteritis de presunto origen infeccioso' },
    { codigo: 'K29.7', descripcion: 'Gastritis no especificada' },
    { codigo: 'I10', descripcion: 'Hipertensión esencial (primaria)' },
    { codigo: 'E11', descripcion: 'Diabetes mellitus no insulinodependiente' },
    { codigo: 'J18.9', descripcion: 'Neumonía no especificada' },
    { codigo: 'N39.0', descripcion: 'Infección de vías urinarias sitio no especificado' },
    { codigo: 'M54.5', descripcion: 'Lumbago no especificado' },
    { codigo: 'K80.2', descripcion: 'Cálculo de la vesícula biliar sin colecistitis' },
    { codigo: 'O80', descripcion: 'Parto único espontáneo' },
  ];

  useEffect(() => {
    if (pacienteId) {
      cargarDatos();
    }
  }, [pacienteId]);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      // Cargar admisión activa
      const admisionesRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admisiones?pacienteId=${pacienteId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const admisionesData = await admisionesRes.json();
      
      if (admisionesData.success) {
        const activa = admisionesData.data.admisiones?.find(a => a.estado === 'Activa');
        setAdmisionActiva(activa);
        
        // Si hay admisión activa, verificar si tiene egreso
        if (activa) {
          const egresoRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/egresos/admision/${activa.id}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          const egresoData = await egresoRes.json();
          
          if (egresoData.success && egresoData.data) {
            setEgreso(egresoData.data);
          }
        }
      }
    } catch (error) {
      console.error('Error al cargar datos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!admisionActiva) {
      alert('No hay una admisión activa para este paciente');
      return;
    }

    if (!formData.diagnostico_salida || !formData.descripcion_diagnostico || !formData.resumen_clinico) {
      alert('Por favor complete los campos obligatorios');
      return;
    }

    if (formData.requiere_control && !formData.fecha_control) {
      alert('Si requiere control, debe especificar la fecha');
      return;
    }

    setSubmitting(true);
    
    try {
      const token = localStorage.getItem('token');
      const payload = {
        admision_id: admisionActiva.id,
        ...formData,
        profesional_responsable_id: user?.id,
      };

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/egresos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        alert('Egreso registrado exitosamente');
        setShowModalEgreso(false);
        resetForm();
        cargarDatos();
      } else {
        alert(`Error: ${data.message || 'No se pudo registrar el egreso'}`);
      }
    } catch (error) {
      console.error('Error al registrar egreso:', error);
      alert('Error al registrar el egreso');
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      diagnostico_salida: '',
      descripcion_diagnostico: '',
      resumen_clinico: '',
      tratamiento_domiciliario: '',
      recomendaciones: '',
      tipo_egreso: 'AltaMedica',
      estado_paciente: 'Mejorado',
      requiere_control: false,
      fecha_control: '',
      observaciones: '',
    });
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('es-CO', {
      year: 'numeric',
      month: 'long',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getTipoEgresoLabel = (tipo) => {
    const labels = {
      AltaMedica: 'Alta Médica',
      Remision: 'Remisión',
      Voluntario: 'Voluntario',
      Fallecimiento: 'Fallecimiento',
      Fuga: 'Fuga',
    };
    return labels[tipo] || tipo;
  };

  const getTipoEgresoColor = (tipo) => {
    const colors = {
      AltaMedica: 'bg-green-100 text-green-700 border-green-200',
      Remision: 'bg-blue-100 text-blue-700 border-blue-200',
      Voluntario: 'bg-yellow-100 text-yellow-700 border-yellow-200',
      Fallecimiento: 'bg-gray-100 text-gray-700 border-gray-200',
      Fuga: 'bg-red-100 text-red-700 border-red-200',
    };
    return colors[tipo] || 'bg-gray-100 text-gray-700 border-gray-200';
  };

  const getEstadoColor = (estado) => {
    const colors = {
      Mejorado: 'bg-green-100 text-green-700',
      Estable: 'bg-blue-100 text-blue-700',
      Complicado: 'bg-orange-100 text-orange-700',
      Fallecido: 'bg-gray-100 text-gray-700',
    };
    return colors[estado] || 'bg-gray-100 text-gray-700';
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">Cargando información...</p>
      </div>
    );
  }

  // Si no hay admisión activa
  if (!admisionActiva) {
    return (
      <Card className="border-2 border-dashed">
        <CardContent className="p-12 text-center">
          <div className="rounded-full bg-gray-100 w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No hay admisión activa
          </h3>
          <p className="text-gray-600">
            El paciente debe tener una admisión activa para poder registrar un egreso.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Si ya existe egreso
  if (egreso) {
    return (
      <div className="space-y-6">
        {/* Header con badge de egresado */}
        <Card className="border-2 border-emerald-200 bg-gradient-to-r from-emerald-50 to-white">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-emerald-600 rounded-lg">
                  <CheckCircle2 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-2xl">Egreso Registrado</CardTitle>
                  <p className="text-sm text-gray-600 mt-1">
                    El paciente fue egresado el {formatDate(egreso.fechaEgreso)}
                  </p>
                </div>
              </div>
              <Badge className={`${getTipoEgresoColor(egreso.tipoEgreso)} border text-base px-4 py-2`}>
                {getTipoEgresoLabel(egreso.tipoEgreso)}
              </Badge>
            </div>
          </CardHeader>
        </Card>

        {/* Detalles del egreso */}
        <Card>
          <CardHeader>
            <CardTitle>Información del Egreso</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Información general */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label className="text-xs text-gray-600">Fecha y Hora</Label>
                <p className="font-semibold">{formatDate(egreso.fechaEgreso)}</p>
              </div>
              <div>
                <Label className="text-xs text-gray-600">Estado del Paciente</Label>
                <Badge className={getEstadoColor(egreso.estadoPaciente)}>
                  {egreso.estadoPaciente}
                </Badge>
              </div>
              <div>
                <Label className="text-xs text-gray-600">Profesional Responsable</Label>
                <p className="font-semibold">{user?.nombre || 'N/A'}</p>
              </div>
            </div>

            {/* Diagnóstico */}
            <div>
              <Label className="text-sm font-semibold mb-2 flex items-center gap-2">
                <Stethoscope className="w-4 h-4 text-emerald-600" />
                Diagnóstico de Salida
              </Label>
              <div className="bg-gray-50 p-4 rounded-lg">
                <Badge className="bg-emerald-100 text-emerald-700 font-mono mb-2">
                  {egreso.diagnosticoSalida}
                </Badge>
                <p className="text-sm text-gray-700">{egreso.descripcionDiagnostico}</p>
              </div>
            </div>

            {/* Resumen clínico */}
            <div>
              <Label className="text-sm font-semibold mb-2">Resumen Clínico</Label>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{egreso.resumenClinico}</p>
              </div>
            </div>

            {/* Tratamiento domiciliario */}
            {egreso.tratamientoDomiciliario && (
              <div>
                <Label className="text-sm font-semibold mb-2">Tratamiento Domiciliario</Label>
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{egreso.tratamientoDomiciliario}</p>
                </div>
              </div>
            )}

            {/* Recomendaciones */}
            {egreso.recomendaciones && (
              <div>
                <Label className="text-sm font-semibold mb-2">Recomendaciones</Label>
                <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{egreso.recomendaciones}</p>
                </div>
              </div>
            )}

            {/* Control */}
            {egreso.requiereControl && (
              <Card className="bg-orange-50 border-orange-200">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="w-4 h-4 text-orange-600" />
                    <Label className="text-sm font-semibold">Requiere Control Médico</Label>
                  </div>
                  <p className="text-sm text-gray-700">
                    Fecha programada: <span className="font-semibold">{egreso.fechaControl ? new Date(egreso.fechaControl).toLocaleDateString('es-CO') : 'No especificada'}</span>
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Observaciones */}
            {egreso.observaciones && (
              <div>
                <Label className="text-sm font-semibold mb-2">Observaciones Adicionales</Label>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{egreso.observaciones}</p>
                </div>
              </div>
            )}

            {/* Firma digital */}
            <Card className="bg-green-50 border-green-200">
              <CardContent className="p-4 flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5" />
                <div>
                  <p className="text-xs text-green-800 font-semibold">Documento con Firma Digital</p>
                  <p className="text-xs text-green-700 mt-1">
                    Este egreso está protegido con firma digital y no puede ser modificado.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Botón de descarga PDF */}
            <div className="flex justify-end">
              <Button 
                variant="outline" 
                className="border-emerald-600 text-emerald-700 hover:bg-emerald-50"
                onClick={() => alert('Funcionalidad de generación de PDF pendiente')}
              >
                <Download className="w-4 h-4 mr-2" />
                Descargar Resumen PDF
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Formulario de egreso
  return (
    <div className="space-y-6">
      {/* Header con información de admisión */}
      <Card className="border-2 border-emerald-200 bg-gradient-to-r from-emerald-50 to-white">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-emerald-600 rounded-lg">
                <LogOut className="w-6 h-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-2xl">Registrar Egreso Hospitalario</CardTitle>
                <p className="text-sm text-gray-600 mt-1">
                  Admisión activa desde: {formatDate(admisionActiva.fechaIngreso)}
                </p>
              </div>
            </div>
            <Button 
              onClick={() => setShowModalEgreso(true)}
              className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Registrar Egreso
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Información de la admisión actual */}
      <Card>
        <CardHeader>
          <CardTitle>Información de la Admisión Actual</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label className="text-xs text-gray-600">Unidad</Label>
              <p className="font-semibold">{admisionActiva.unidad?.nombre || 'N/A'}</p>
            </div>
            <div>
              <Label className="text-xs text-gray-600">Motivo de Ingreso</Label>
              <p className="font-semibold">{admisionActiva.motivoIngreso}</p>
            </div>
            <div>
              <Label className="text-xs text-gray-600">Diagnóstico de Ingreso</Label>
              <p className="font-semibold">{admisionActiva.diagnosticoIngreso}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Modal de formulario de egreso */}
      <Dialog open={showModalEgreso} onOpenChange={setShowModalEgreso}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <LogOut className="w-5 h-5 text-emerald-600" />
              Formulario de Egreso Hospitalario
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Información del paciente */}
            <Card className="bg-emerald-50 border-emerald-200">
              <CardContent className="p-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-semibold">Paciente:</span> {paciente?.nombre} {paciente?.apellido}
                  </div>
                  <div>
                    <span className="font-semibold">Cédula:</span> {paciente?.cedula}
                  </div>
                  <div>
                    <span className="font-semibold">Ingreso:</span> {formatDate(admisionActiva?.fechaIngreso)}
                  </div>
                  <div>
                    <span className="font-semibold">Profesional:</span> {user?.nombre} {user?.apellido}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Diagnósticos comunes */}
            <Card className="bg-gray-50 border-gray-200">
              <CardContent className="p-4">
                <Label className="text-sm font-semibold mb-2 flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Diagnósticos Frecuentes (click para seleccionar)
                </Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {diagnosticosComunes.map((diag) => (
                    <Button
                      key={diag.codigo}
                      type="button"
                      variant="outline"
                      size="sm"
                      className="justify-start text-xs h-auto py-2"
                      onClick={() => {
                        setFormData({
                          ...formData,
                          diagnostico_salida: diag.codigo,
                          descripcion_diagnostico: diag.descripcion,
                        });
                      }}
                    >
                      <span className="font-bold mr-2">{diag.codigo}</span>
                      <span className="truncate">{diag.descripcion}</span>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Diagnóstico de salida */}
            <div className="grid grid-cols-4 gap-4">
              <div>
                <Label htmlFor="diagnostico_salida">Código CIE-10 *</Label>
                <Input
                  id="diagnostico_salida"
                  value={formData.diagnostico_salida}
                  onChange={(e) => setFormData({ ...formData, diagnostico_salida: e.target.value })}
                  placeholder="Ej: J18.9"
                  required
                />
              </div>
              <div className="col-span-3">
                <Label htmlFor="descripcion_diagnostico">Descripción del Diagnóstico *</Label>
                <Input
                  id="descripcion_diagnostico"
                  value={formData.descripcion_diagnostico}
                  onChange={(e) => setFormData({ ...formData, descripcion_diagnostico: e.target.value })}
                  placeholder="Ej: Neumonía no especificada"
                  required
                />
              </div>
            </div>

            {/* Tipo y estado */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="tipo_egreso">Tipo de Egreso *</Label>
                <Select 
                  value={formData.tipo_egreso} 
                  onValueChange={(value) => setFormData({ ...formData, tipo_egreso: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="AltaMedica">Alta Médica</SelectItem>
                    <SelectItem value="Remision">Remisión a otra institución</SelectItem>
                    <SelectItem value="Voluntario">Retiro Voluntario</SelectItem>
                    <SelectItem value="Fallecimiento">Fallecimiento</SelectItem>
                    <SelectItem value="Fuga">Fuga</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="estado_paciente">Estado del Paciente *</Label>
                <Select 
                  value={formData.estado_paciente} 
                  onValueChange={(value) => setFormData({ ...formData, estado_paciente: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Mejorado">Mejorado</SelectItem>
                    <SelectItem value="Estable">Estable</SelectItem>
                    <SelectItem value="Complicado">Complicado</SelectItem>
                    <SelectItem value="Fallecido">Fallecido</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Resumen clínico */}
            <div>
              <Label htmlFor="resumen_clinico">Resumen Clínico *</Label>
              <Textarea
                id="resumen_clinico"
                value={formData.resumen_clinico}
                onChange={(e) => setFormData({ ...formData, resumen_clinico: e.target.value })}
                rows={5}
                className="resize-none"
                placeholder="Resuma la evolución del paciente durante su hospitalización, procedimientos realizados, respuesta al tratamiento..."
                required
              />
            </div>

            {/* Tratamiento domiciliario */}
            <div>
              <Label htmlFor="tratamiento_domiciliario">Tratamiento Domiciliario</Label>
              <Textarea
                id="tratamiento_domiciliario"
                value={formData.tratamiento_domiciliario}
                onChange={(e) => setFormData({ ...formData, tratamiento_domiciliario: e.target.value })}
                rows={4}
                className="resize-none"
                placeholder="Medicamentos, dosis, duración del tratamiento...&#10;Ej: 1. Amoxicilina 500mg cada 8 horas por 7 días&#10;2. Ibuprofeno 400mg cada 8 horas si dolor"
              />
            </div>

            {/* Recomendaciones */}
            <div>
              <Label htmlFor="recomendaciones">Recomendaciones y Cuidados</Label>
              <Textarea
                id="recomendaciones"
                value={formData.recomendaciones}
                onChange={(e) => setFormData({ ...formData, recomendaciones: e.target.value })}
                rows={3}
                className="resize-none"
                placeholder="Signos de alarma, cuidados especiales, restricciones de actividad..."
              />
            </div>

            {/* Control médico */}
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="requiere_control"
                  checked={formData.requiere_control}
                  onCheckedChange={(checked) => setFormData({ ...formData, requiere_control: checked })}
                />
                <Label htmlFor="requiere_control" className="cursor-pointer">
                  ¿Requiere control médico?
                </Label>
              </div>
              
              {formData.requiere_control && (
                <div>
                  <Label htmlFor="fecha_control">Fecha de Control *</Label>
                  <Input
                    id="fecha_control"
                    type="date"
                    value={formData.fecha_control}
                    onChange={(e) => setFormData({ ...formData, fecha_control: e.target.value })}
                    required={formData.requiere_control}
                  />
                </div>
              )}
            </div>

            {/* Observaciones */}
            <div>
              <Label htmlFor="observaciones">Observaciones Adicionales</Label>
              <Textarea
                id="observaciones"
                value={formData.observaciones}
                onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                rows={2}
                className="resize-none"
                placeholder="Cualquier información adicional relevante..."
              />
            </div>

            {/* Alerta */}
            <Card className="bg-amber-50 border-amber-300">
              <CardContent className="p-4 flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-amber-900">Importante</p>
                  <p className="text-xs text-amber-800 mt-1">
                    Una vez registrado el egreso:
                  </p>
                  <ul className="text-xs text-amber-800 mt-1 list-disc list-inside">
                    <li>La admisión se marcará como "Egresada"</li>
                    <li>La cama asignada pasará a estado "Mantenimiento"</li>
                    <li>El documento quedará firmado digitalmente</li>
                    <li>No se podrán modificar campos críticos</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* Botones */}
            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowModalEgreso(false)}
                disabled={submitting}
              >
                Cancelar
              </Button>
              <Button 
                type="submit"
                className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700"
                disabled={submitting}
              >
                {submitting ? 'Guardando...' : 'Registrar Egreso'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
