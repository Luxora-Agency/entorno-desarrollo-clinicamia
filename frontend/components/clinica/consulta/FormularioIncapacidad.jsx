'use client';

import { useState, useEffect, useMemo } from 'react';
import { getTodayColombia, formatDateISO } from '@/services/formatters';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  FileText, Calendar, AlertTriangle, Info, Plus, Trash2,
  Download, Clock, Building2, CheckCircle, XCircle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiPost, getAuthToken } from '@/services/api';

// Tipos de incapacidad según normatividad colombiana
const TIPOS_INCAPACIDAD = [
  { value: 'EnfermedadGeneral', label: 'Enfermedad General' },
  { value: 'AccidenteTrabajo', label: 'Accidente de Trabajo' },
  { value: 'EnfermedadLaboral', label: 'Enfermedad Laboral' },
  { value: 'LicenciaMaternidad', label: 'Licencia de Maternidad' },
  { value: 'LicenciaPaternidad', label: 'Licencia de Paternidad' },
];

// Información de responsabilidad de pago según días
const getResponsabilidadPago = (dias, diasAcumulados = 0) => {
  const totalDias = dias + diasAcumulados;
  if (totalDias <= 2) {
    return { responsable: 'Empleador', color: 'blue', icono: Building2 };
  } else if (totalDias <= 180) {
    return { responsable: 'EPS', color: 'green', icono: CheckCircle };
  } else if (totalDias <= 540) {
    return { responsable: 'Fondo de Pensiones', color: 'orange', icono: Clock };
  } else {
    return { responsable: 'Requiere Evaluación Junta', color: 'red', icono: AlertTriangle };
  }
};

export default function FormularioIncapacidad({
  pacienteId,
  doctorId,
  citaId,
  diagnostico, // Diagnóstico de la consulta
  initialItems = [], // Items persistidos desde el padre
  onSuccess
}) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [incapacidades, setIncapacidades] = useState(initialItems);
  const [showForm, setShowForm] = useState(false);

  const [formData, setFormData] = useState({
    tipoIncapacidad: 'EnfermedadGeneral',
    fechaInicio: getTodayColombia(),
    diasIncapacidad: 3,
    diagnosticoCIE10: diagnostico?.principal?.codigoCIE10 || '',
    descripcionDiagnostico: diagnostico?.principal?.descripcionCIE10 || '',
    esProrrogada: false,
    incapacidadOriginalId: '',
    justificacion: '',
    restricciones: '',
    conceptoRehabilitacion: '',
  });

  // Calcular fecha fin
  const fechaFin = useMemo(() => {
    if (!formData.fechaInicio || !formData.diasIncapacidad) return '';
    const inicio = new Date(formData.fechaInicio);
    inicio.setDate(inicio.getDate() + parseInt(formData.diasIncapacidad) - 1);
    return formatDateISO(inicio);
  }, [formData.fechaInicio, formData.diasIncapacidad]);

  // Información de pago
  const responsabilidad = useMemo(() => {
    return getResponsabilidadPago(formData.diasIncapacidad, formData.esProrrogada ? 0 : 0);
  }, [formData.diasIncapacidad, formData.esProrrogada]);

  // Actualizar diagnóstico cuando cambie desde la consulta
  useEffect(() => {
    if (diagnostico?.principal?.codigoCIE10) {
      setFormData(prev => ({
        ...prev,
        diagnosticoCIE10: diagnostico.principal.codigoCIE10,
        descripcionDiagnostico: diagnostico.principal.descripcionCIE10,
      }));
    }
  }, [diagnostico]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!formData.diagnosticoCIE10 || !formData.descripcionDiagnostico) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'El diagnóstico CIE-10 es obligatorio para la incapacidad.'
      });
      return;
    }

    if (!formData.justificacion) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Debe proporcionar una justificación clínica para la incapacidad.'
      });
      return;
    }

    setLoading(true);
    try {
      const payload = {
        pacienteId,
        doctorId,
        citaId,
        tipoIncapacidad: formData.tipoIncapacidad,
        fechaInicio: formData.fechaInicio,
        fechaFin,
        diasIncapacidad: parseInt(formData.diasIncapacidad),
        diagnosticoCIE10: formData.diagnosticoCIE10,
        descripcionDiagnostico: formData.descripcionDiagnostico,
        esProrrogada: formData.esProrrogada,
        incapacidadOriginalId: formData.esProrrogada ? formData.incapacidadOriginalId : null,
        justificacion: formData.justificacion,
        restricciones: formData.restricciones,
        conceptoRehabilitacion: formData.diasIncapacidad > 90 ? formData.conceptoRehabilitacion : null,
      };

      const result = await apiPost('/incapacidades', payload);

      setIncapacidades(prev => [...prev, result.data]);
      setShowForm(false);
      setFormData({
        tipoIncapacidad: 'EnfermedadGeneral',
        fechaInicio: getTodayColombia(),
        diasIncapacidad: 3,
        diagnosticoCIE10: diagnostico?.principal?.codigoCIE10 || '',
        descripcionDiagnostico: diagnostico?.principal?.descripcionCIE10 || '',
        esProrrogada: false,
        incapacidadOriginalId: '',
        justificacion: '',
        restricciones: '',
        conceptoRehabilitacion: '',
      });

      toast({
        title: 'Incapacidad generada',
        description: `Incapacidad ${result.data.codigo} creada exitosamente.`
      });

      if (onSuccess) onSuccess(result.data);
    } catch (error) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'No se pudo crear la incapacidad.'
      });
    } finally {
      setLoading(false);
    }
  };

  const ResponsabilidadIcon = responsabilidad.icono;

  return (
    <div className="space-y-4">
      {/* Lista de incapacidades creadas */}
      {incapacidades.length > 0 && (
        <div className="space-y-2">
          {incapacidades.map((inc, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg"
            >
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <div>
                  <p className="font-medium text-green-900">{inc.codigo}</p>
                  <p className="text-sm text-green-700">
                    {inc.diasIncapacidad} días - {inc.tipoIncapacidad}
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  try {
                    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
                    const token = getAuthToken();
                    const response = await fetch(`${apiUrl}/incapacidades/${inc.id}/pdf`, {
                      headers: { 'Authorization': `Bearer ${token}` }
                    });
                    if (!response.ok) throw new Error('Error al descargar PDF');
                    const blob = await response.blob();
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `incapacidad-${inc.codigo || inc.id}.pdf`;
                    document.body.appendChild(a);
                    a.click();
                    window.URL.revokeObjectURL(url);
                    document.body.removeChild(a);
                  } catch (error) {
                    toast({ variant: 'destructive', title: 'Error', description: 'No se pudo descargar el PDF' });
                  }
                }}
              >
                <Download className="h-4 w-4 mr-1" />
                PDF
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Botón para agregar nueva */}
      {!showForm && (
        <Button
          variant="outline"
          onClick={() => setShowForm(true)}
          className="w-full border-dashed"
        >
          <Plus className="h-4 w-4 mr-2" />
          Agregar Incapacidad Médica
        </Button>
      )}

      {/* Formulario de incapacidad */}
      {showForm && (
        <Card className="border-orange-200">
          <CardHeader className="bg-gradient-to-r from-orange-50 to-amber-50">
            <CardTitle className="flex items-center gap-2 text-orange-900">
              <FileText className="h-5 w-5" />
              Nueva Incapacidad Médica
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            {/* Alerta normativa */}
            <Alert className="bg-blue-50 border-blue-200">
              <Info className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800 text-sm">
                <strong>Normatividad colombiana:</strong> Decreto 2126/2023 y Resolución 1843/2025.
                Días 1-2: Empleador | Días 3-180: EPS | Días 181-540: Fondo de Pensiones.
              </AlertDescription>
            </Alert>

            {/* Tipo de incapacidad */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tipo de Incapacidad</Label>
                <Select
                  value={formData.tipoIncapacidad}
                  onValueChange={(v) => handleChange('tipoIncapacidad', v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIPOS_INCAPACIDAD.map((tipo) => (
                      <SelectItem key={tipo.value} value={tipo.value}>
                        {tipo.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2 pt-6">
                <Checkbox
                  id="esProrrogada"
                  checked={formData.esProrrogada}
                  onCheckedChange={(checked) => handleChange('esProrrogada', checked)}
                />
                <Label htmlFor="esProrrogada" className="cursor-pointer">
                  Es prórroga de incapacidad anterior
                </Label>
              </div>
            </div>

            {/* Fechas y días */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Fecha Inicio</Label>
                <Input
                  type="date"
                  value={formData.fechaInicio}
                  onChange={(e) => handleChange('fechaInicio', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Días de Incapacidad</Label>
                <Input
                  type="number"
                  min={1}
                  max={180}
                  value={formData.diasIncapacidad}
                  onChange={(e) => handleChange('diasIncapacidad', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Fecha Fin (Calculada)</Label>
                <Input
                  type="date"
                  value={fechaFin}
                  disabled
                  className="bg-gray-100"
                />
              </div>
            </div>

            {/* Indicador de responsabilidad de pago */}
            <div className={`p-3 rounded-lg border flex items-center gap-3 bg-${responsabilidad.color}-50 border-${responsabilidad.color}-200`}>
              <ResponsabilidadIcon className={`h-5 w-5 text-${responsabilidad.color}-600`} />
              <div>
                <p className={`font-medium text-${responsabilidad.color}-900`}>
                  Responsable del pago: {responsabilidad.responsable}
                </p>
                <p className={`text-sm text-${responsabilidad.color}-700`}>
                  Según normatividad colombiana vigente
                </p>
              </div>
            </div>

            {/* Diagnóstico */}
            <div className="space-y-2">
              <Label>Diagnóstico CIE-10</Label>
              <div className="flex items-center gap-2 p-3 bg-gray-50 border rounded-lg">
                {formData.diagnosticoCIE10 ? (
                  <>
                    <Badge className="bg-pink-600 font-mono">{formData.diagnosticoCIE10}</Badge>
                    <span className="text-sm text-gray-700">{formData.descripcionDiagnostico}</span>
                  </>
                ) : (
                  <p className="text-sm text-gray-500 italic">
                    El diagnóstico se tomará del paso de Diagnóstico de la consulta
                  </p>
                )}
              </div>
            </div>

            {/* Justificación clínica */}
            <div className="space-y-2">
              <Label>Justificación Clínica <span className="text-red-500">*</span></Label>
              <Textarea
                value={formData.justificacion}
                onChange={(e) => handleChange('justificacion', e.target.value)}
                placeholder="Describa el motivo clínico que justifica la incapacidad..."
                rows={3}
              />
            </div>

            {/* Restricciones */}
            <div className="space-y-2">
              <Label>Restricciones Laborales</Label>
              <Textarea
                value={formData.restricciones}
                onChange={(e) => handleChange('restricciones', e.target.value)}
                placeholder="Actividades que el paciente debe evitar durante la incapacidad..."
                rows={2}
              />
            </div>

            {/* Concepto de rehabilitación (solo si > 90 días) */}
            {parseInt(formData.diasIncapacidad) > 90 && (
              <div className="space-y-2">
                <Label>
                  Concepto de Rehabilitación
                  <Badge variant="outline" className="ml-2">Requerido &gt; 90 días</Badge>
                </Label>
                <Textarea
                  value={formData.conceptoRehabilitacion}
                  onChange={(e) => handleChange('conceptoRehabilitacion', e.target.value)}
                  placeholder="Pronóstico de rehabilitación y posibilidad de reintegro laboral..."
                  rows={3}
                />
              </div>
            )}

            {/* Botones */}
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => setShowForm(false)}
              >
                <XCircle className="h-4 w-4 mr-2" />
                Cancelar
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={loading}
                className="bg-orange-600 hover:bg-orange-700"
              >
                {loading ? 'Generando...' : 'Generar Incapacidad'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
