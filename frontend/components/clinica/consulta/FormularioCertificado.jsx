'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  FileCheck, Plus, Download, CheckCircle, XCircle,
  FileText, Eye, Sparkles
} from 'lucide-react';
import TemplateSelector from '../templates/TemplateSelector';
import { useToast } from '@/hooks/use-toast';
import { apiPost, getAuthToken } from '@/services/api';
import { TIPOS_CERTIFICADO, PLANTILLAS_CERTIFICADO, CONCEPTOS_APTITUD } from '@/constants/plantillasCertificados';

export default function FormularioCertificado({
  paciente,
  doctorId,
  citaId,
  diagnostico,
  onSuccess
}) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [certificados, setCertificados] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const [formData, setFormData] = useState({
    tipoCertificado: 'ConstanciaAtencion',
    titulo: 'Constancia de Atención Médica',
    contenido: '',
    destinatario: '',
    vigenciaDesde: new Date().toISOString().split('T')[0],
    vigenciaHasta: '',
  });

  // Generar contenido basado en plantilla
  const generarContenidoDePlantilla = (tipo) => {
    const plantilla = PLANTILLAS_CERTIFICADO[tipo];
    if (!plantilla) return '';

    let contenido = plantilla.contenido;

    // Reemplazar campos comunes con datos del paciente
    const fechaHoy = new Date().toLocaleDateString('es-CO', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });

    const reemplazos = {
      '{{NOMBRE_PACIENTE}}': paciente ? `${paciente.nombre} ${paciente.apellido}` : '',
      '{{TIPO_DOCUMENTO}}': paciente?.tipoDocumento || 'CC',
      '{{NUMERO_DOCUMENTO}}': paciente?.numeroDocumento || '',
      '{{EDAD}}': paciente?.fechaNacimiento
        ? Math.floor((new Date() - new Date(paciente.fechaNacimiento)) / (365.25 * 24 * 60 * 60 * 1000))
        : '',
      '{{FECHA_CONSULTA}}': fechaHoy,
      '{{DIAGNOSTICO}}': diagnostico?.principal?.descripcionCIE10 || '',
      '{{CODIGO_CIE10}}': diagnostico?.principal?.codigoCIE10 || '',
      '{{MOTIVO_CONSULTA}}': '', // Se llenará manualmente
    };

    Object.entries(reemplazos).forEach(([key, value]) => {
      contenido = contenido.replace(new RegExp(key, 'g'), value);
    });

    return contenido;
  };

  // Actualizar contenido cuando cambia el tipo
  useEffect(() => {
    const plantilla = PLANTILLAS_CERTIFICADO[formData.tipoCertificado];
    if (plantilla) {
      const contenidoGenerado = generarContenidoDePlantilla(formData.tipoCertificado);
      setFormData(prev => ({
        ...prev,
        titulo: plantilla.titulo,
        contenido: contenidoGenerado,
      }));
    }
  }, [formData.tipoCertificado, paciente, diagnostico]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Función para descargar el PDF del certificado
  const handleDownloadPDF = async (certificadoId, codigo) => {
    try {
      const token = getAuthToken();
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

      const response = await fetch(`${API_URL}/certificados/${certificadoId}/pdf`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('No se pudo descargar el PDF');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `certificado-${codigo || certificadoId}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast({
        title: 'PDF descargado',
        description: 'El certificado se ha descargado correctamente.'
      });
    } catch (error) {
      console.error('Error descargando PDF:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo descargar el PDF del certificado.'
      });
    }
  };

  const handleSubmit = async () => {
    if (!formData.contenido) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'El contenido del certificado es obligatorio.'
      });
      return;
    }

    setLoading(true);
    try {
      const payload = {
        pacienteId: paciente?.id,
        doctorId,
        citaId,
        tipoCertificado: formData.tipoCertificado,
        titulo: formData.titulo,
        contenido: formData.contenido,
        diagnostico: diagnostico?.principal?.descripcionCIE10,
        codigoCIE10: diagnostico?.principal?.codigoCIE10,
        destinatario: formData.destinatario,
        vigenciaDesde: formData.vigenciaDesde || null,
        vigenciaHasta: formData.vigenciaHasta || null,
      };

      const result = await apiPost('/certificados', payload);

      setCertificados(prev => [...prev, result.data]);
      setShowForm(false);
      setFormData({
        tipoCertificado: 'ConstanciaAtencion',
        titulo: 'Constancia de Atención Médica',
        contenido: '',
        destinatario: '',
        vigenciaDesde: new Date().toISOString().split('T')[0],
        vigenciaHasta: '',
      });

      toast({
        title: 'Certificado generado',
        description: `Certificado ${result.data.codigo} creado exitosamente.`
      });

      if (onSuccess) onSuccess(result.data);
    } catch (error) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'No se pudo crear el certificado.'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Lista de certificados creados */}
      {certificados.length > 0 && (
        <div className="space-y-2">
          {certificados.map((cert, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg"
            >
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="font-medium text-blue-900">{cert.codigo}</p>
                  <p className="text-sm text-blue-700">{cert.titulo}</p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDownloadPDF(cert.id, cert.codigo)}
              >
                <Download className="h-4 w-4 mr-1" />
                PDF
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Botón para agregar nuevo */}
      {!showForm && (
        <Button
          variant="outline"
          onClick={() => setShowForm(true)}
          className="w-full border-dashed"
        >
          <Plus className="h-4 w-4 mr-2" />
          Agregar Certificado Médico
        </Button>
      )}

      {/* Formulario de certificado */}
      {showForm && (
        <Card className="border-blue-200">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
            <CardTitle className="flex items-center gap-2 text-blue-900">
              <FileCheck className="h-5 w-5" />
              Nuevo Certificado Médico
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            {/* Tipo de certificado */}
            <div className="space-y-2">
              <Label>Tipo de Certificado</Label>
              <Select
                value={formData.tipoCertificado}
                onValueChange={(v) => handleChange('tipoCertificado', v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIPOS_CERTIFICADO.map((tipo) => (
                    <SelectItem key={tipo.value} value={tipo.value}>
                      {tipo.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Título del certificado */}
            <div className="space-y-2">
              <Label>Título del Certificado</Label>
              <Input
                value={formData.titulo}
                onChange={(e) => handleChange('titulo', e.target.value)}
                placeholder="Título del certificado..."
              />
            </div>

            {/* Destinatario */}
            <div className="space-y-2">
              <Label>Destinatario (Opcional)</Label>
              <Input
                value={formData.destinatario}
                onChange={(e) => handleChange('destinatario', e.target.value)}
                placeholder="A quien va dirigido el certificado..."
              />
            </div>

            {/* Vigencia */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Vigencia Desde</Label>
                <Input
                  type="date"
                  value={formData.vigenciaDesde}
                  onChange={(e) => handleChange('vigenciaDesde', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Vigencia Hasta (Opcional)</Label>
                <Input
                  type="date"
                  value={formData.vigenciaHasta}
                  onChange={(e) => handleChange('vigenciaHasta', e.target.value)}
                />
              </div>
            </div>

            {/* Información del diagnóstico */}
            {diagnostico?.principal?.codigoCIE10 && (
              <div className="bg-pink-50 border border-pink-200 rounded-lg p-3">
                <p className="text-xs text-pink-600 font-medium mb-1">Diagnóstico Asociado</p>
                <div className="flex items-center gap-2">
                  <Badge className="bg-pink-600 font-mono">{diagnostico.principal.codigoCIE10}</Badge>
                  <span className="text-sm text-gray-700">{diagnostico.principal.descripcionCIE10}</span>
                </div>
              </div>
            )}

            {/* Botón para usar plantilla */}
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  const contenido = generarContenidoDePlantilla(formData.tipoCertificado);
                  handleChange('contenido', contenido);
                }}
              >
                <Sparkles className="h-4 w-4 mr-1" />
                Usar Plantilla
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowPreview(!showPreview)}
              >
                <Eye className="h-4 w-4 mr-1" />
                {showPreview ? 'Ocultar Vista Previa' : 'Vista Previa'}
              </Button>
            </div>

            {/* Contenido del certificado */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Contenido del Certificado <span className="text-red-500">*</span></Label>
                <TemplateSelector 
                  category="GENERICO" 
                  onSelect={(text) => handleChange('contenido', formData.contenido + (formData.contenido ? '\n' : '') + text)} 
                />
              </div>
              <Textarea
                value={formData.contenido}
                onChange={(e) => handleChange('contenido', e.target.value)}
                placeholder="Contenido del certificado médico..."
                rows={8}
                className="font-mono text-sm"
              />
              <p className="text-xs text-gray-500">
                Los campos entre {'{{'}...{'}} '} serán reemplazados automáticamente con los datos del paciente y la consulta.
              </p>
            </div>

            {/* Vista previa */}
            {showPreview && (
              <div className="border rounded-lg p-4 bg-white">
                <div className="text-center mb-4">
                  <h3 className="text-lg font-bold">{formData.titulo}</h3>
                  <p className="text-sm text-gray-500">Clínica Mía - Vista Previa</p>
                </div>
                <div className="whitespace-pre-wrap text-sm border-t pt-4">
                  {formData.contenido}
                </div>
                <div className="border-t mt-4 pt-4 text-center text-sm text-gray-500">
                  <p>Firma del Médico</p>
                  <p>Fecha de expedición: {new Date().toLocaleDateString('es-CO')}</p>
                </div>
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
                className="bg-blue-600 hover:bg-blue-700"
              >
                {loading ? 'Generando...' : 'Generar Certificado'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
