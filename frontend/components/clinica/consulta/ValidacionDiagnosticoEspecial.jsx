'use client';

import { useState, useEffect, useRef } from 'react';
import { getTodayColombia, formatDateISO } from '@/services/formatters';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AlertTriangle, Upload, FileText, CheckCircle2, AlertCircle, Sparkles, Loader2 } from 'lucide-react';
import {
  requiereValidacionEspecial,
  ESTADOS_CONFIRMACION,
  METODOS_CONFIRMACION
} from '@/constants/diagnosticosEspeciales';
import { apiPost } from '@/services/api';
import { toast } from 'sonner';

/**
 * Componente para validaciones adicionales en diagnósticos de cáncer y enfermedades huérfanas
 * Se muestra solo cuando se detecta un código CIE-10 que lo requiere
 */
export default function ValidacionDiagnosticoEspecial({
  codigoCIE10,
  onDataChange,
  initialData
}) {
  // Manejar null y undefined
  const data = initialData || {};

  const [validacion, setValidacion] = useState(null);
  const [datosValidacion, setDatosValidacion] = useState({
    fechaDiagnosticoExacta: data.fechaDiagnosticoExacta || '',
    estadoConfirmacion: data.estadoConfirmacion || '',
    metodoConfirmacion: data.metodoConfirmacion || '',
    metodoConfirmacionDetalle: data.metodoConfirmacionDetalle || '',
    documentoRespaldo: data.documentoRespaldo || null,
    documentoRespaldoNombre: data.documentoRespaldoNombre || '',
  });

  // Estados para OCR
  const [extrayendo, setExtrayendo] = useState(false);

  // Detectar si el código requiere validación especial
  useEffect(() => {
    const resultado = requiereValidacionEspecial(codigoCIE10);
    setValidacion(resultado.requiereValidacion ? resultado : null);
  }, [codigoCIE10]);

  // Ref para prevenir llamadas duplicadas (evita infinite loop)
  const prevDataRef = useRef(null);

  // Notificar cambios al padre (solo cuando los datos realmente cambian)
  useEffect(() => {
    if (validacion && onDataChange) {
      const isValid = validateData();
      const currentDataStr = JSON.stringify(datosValidacion);

      // Solo notificar si los datos realmente cambiaron
      if (prevDataRef.current !== currentDataStr) {
        prevDataRef.current = currentDataStr;
        onDataChange(datosValidacion, isValid);
      }
    }
  }, [datosValidacion, validacion]);

  const validateData = () => {
    if (!validacion) return true;

    // Fecha obligatoria
    if (!datosValidacion.fechaDiagnosticoExacta) return false;

    // Estado obligatorio
    if (!datosValidacion.estadoConfirmacion) return false;

    // Método obligatorio si está confirmado
    if (datosValidacion.estadoConfirmacion === 'confirmado' && !datosValidacion.metodoConfirmacion) {
      return false;
    }

    // Detalle obligatorio si método es "otro"
    if (datosValidacion.metodoConfirmacion === 'otro' && !datosValidacion.metodoConfirmacionDetalle) {
      return false;
    }

    return true;
  };

  const handleChange = (field, value) => {
    setDatosValidacion(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      // En un escenario real, aquí subirías el archivo al servidor
      // Por ahora solo guardamos el nombre
      handleChange('documentoRespaldoNombre', file.name);
      handleChange('documentoRespaldo', file);
    }
  };

  // Convertir archivo a base64
  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result.split(',')[1]);
      reader.onerror = reject;
    });
  };

  // Extraer datos del documento con IA
  const handleExtractDocument = async () => {
    if (!datosValidacion.documentoRespaldo) {
      toast.error('Debe subir un documento primero');
      return;
    }

    setExtrayendo(true);

    try {
      const base64 = await fileToBase64(datosValidacion.documentoRespaldo);
      const response = await apiPost('/ai-assistant/extract-document', {
        imageBase64: base64,
        extractionType: 'cancer_validation'
      });

      if (response.success && response.data) {
        // Auto-rellenar campos
        if (response.data.fechaDiagnosticoExacta) {
          handleChange('fechaDiagnosticoExacta', response.data.fechaDiagnosticoExacta);
        }
        if (response.data.estadoConfirmacion) {
          handleChange('estadoConfirmacion', response.data.estadoConfirmacion);
        }
        if (response.data.metodoConfirmacion) {
          handleChange('metodoConfirmacion', response.data.metodoConfirmacion);
        }
        if (response.data.metodoConfirmacionDetalle) {
          handleChange('metodoConfirmacionDetalle', response.data.metodoConfirmacionDetalle);
        }

        toast.success('Datos extraídos exitosamente', {
          description: 'Verifique y ajuste los datos antes de continuar'
        });
      } else {
        toast.warning('No se pudo extraer información del documento');
      }
    } catch (error) {
      console.error('Error extrayendo documento:', error);
      toast.error('Error al procesar el documento', {
        description: 'Complete los campos manualmente'
      });
    } finally {
      setExtrayendo(false);
    }
  };

  // Si no requiere validación especial, no mostrar nada
  if (!validacion) return null;

  const isValid = validateData();

  return (
    <Card className="border-2 border-amber-300 bg-amber-50">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className="bg-amber-100 p-2 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <CardTitle className="text-lg text-amber-900">
                Validación Especial Requerida
              </CardTitle>
              <CardDescription className="text-amber-700 mt-1">
                Este diagnóstico ({validacion.nombre}) requiere información adicional obligatoria
              </CardDescription>
            </div>
          </div>
          {isValid ? (
            <Badge className="bg-green-100 text-green-700 border-green-300">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Completo
            </Badge>
          ) : (
            <Badge className="bg-red-100 text-red-700 border-red-300">
              <AlertCircle className="h-3 w-3 mr-1" />
              Incompleto
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Tipo de diagnóstico */}
        <div className="bg-white border border-amber-200 rounded-lg p-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-amber-900">Tipo de diagnóstico:</span>
            <Badge variant="outline" className="bg-amber-100 text-amber-800">
              {validacion.tipo === 'cancer' ? 'Cáncer' : 'Enfermedad Huérfana'}
            </Badge>
          </div>
        </div>

        {/* Fecha exacta del diagnóstico */}
        <div className="space-y-2">
          <Label htmlFor="fechaDiagnosticoExacta" className="flex items-center gap-2">
            Fecha exacta del diagnóstico <span className="text-red-500">*</span>
          </Label>
          <Input
            id="fechaDiagnosticoExacta"
            type="date"
            value={datosValidacion.fechaDiagnosticoExacta}
            onChange={(e) => handleChange('fechaDiagnosticoExacta', e.target.value)}
            max={getTodayColombia()}
            className="bg-white"
          />
          {!datosValidacion.fechaDiagnosticoExacta && (
            <p className="text-xs text-red-600">Este campo es obligatorio</p>
          )}
        </div>

        {/* Estado de confirmación */}
        <div className="space-y-2">
          <Label htmlFor="estadoConfirmacion" className="flex items-center gap-2">
            Estado de confirmación <span className="text-red-500">*</span>
          </Label>
          <Select
            value={datosValidacion.estadoConfirmacion}
            onValueChange={(value) => handleChange('estadoConfirmacion', value)}
          >
            <SelectTrigger className="bg-white">
              <SelectValue placeholder="Seleccione el estado" />
            </SelectTrigger>
            <SelectContent>
              {ESTADOS_CONFIRMACION.map((estado) => (
                <SelectItem key={estado.value} value={estado.value}>
                  {estado.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {!datosValidacion.estadoConfirmacion && (
            <p className="text-xs text-red-600">Este campo es obligatorio</p>
          )}
        </div>

        {/* Método de confirmación (solo si está confirmado) */}
        {datosValidacion.estadoConfirmacion === 'confirmado' && (
          <>
            <div className="space-y-2">
              <Label htmlFor="metodoConfirmacion" className="flex items-center gap-2">
                Método de confirmación <span className="text-red-500">*</span>
              </Label>
              <Select
                value={datosValidacion.metodoConfirmacion}
                onValueChange={(value) => handleChange('metodoConfirmacion', value)}
              >
                <SelectTrigger className="bg-white">
                  <SelectValue placeholder="Seleccione el método" />
                </SelectTrigger>
                <SelectContent>
                  {METODOS_CONFIRMACION.map((metodo) => (
                    <SelectItem key={metodo.value} value={metodo.value}>
                      {metodo.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {!datosValidacion.metodoConfirmacion && (
                <p className="text-xs text-red-600">Este campo es obligatorio cuando el diagnóstico está confirmado</p>
              )}
            </div>

            {/* Detalle del método (si es "otro") */}
            {datosValidacion.metodoConfirmacion === 'otro' && (
              <div className="space-y-2">
                <Label htmlFor="metodoConfirmacionDetalle" className="flex items-center gap-2">
                  Especifique el método <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="metodoConfirmacionDetalle"
                  value={datosValidacion.metodoConfirmacionDetalle}
                  onChange={(e) => handleChange('metodoConfirmacionDetalle', e.target.value)}
                  placeholder="Describa el método utilizado..."
                  className="bg-white"
                />
                {!datosValidacion.metodoConfirmacionDetalle && (
                  <p className="text-xs text-red-600">Debe especificar el método cuando selecciona "Otro"</p>
                )}
              </div>
            )}
          </>
        )}

        {/* Documento de respaldo con OCR */}
        <div className="space-y-2">
          <Label htmlFor="documentoRespaldo" className="flex items-center gap-2">
            Documento de respaldo
            <Badge variant="outline" className="text-xs">Recomendado</Badge>
          </Label>
          <div className="flex items-center gap-2">
            <Input
              id="documentoRespaldo"
              type="file"
              onChange={handleFileUpload}
              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
              className="bg-white flex-1"
            />
            {datosValidacion.documentoRespaldo && (
              <Button
                type="button"
                onClick={handleExtractDocument}
                disabled={extrayendo}
                className="bg-purple-600 hover:bg-purple-700 text-white"
                size="sm"
              >
                {extrayendo ? (
                  <>
                    <Loader2 className="animate-spin mr-1 h-4 w-4" />
                    Extrayendo...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-1 h-4 w-4" />
                    Extraer con IA
                  </>
                )}
              </Button>
            )}
          </div>
          {datosValidacion.documentoRespaldoNombre && (
            <div className="flex items-center gap-2 text-sm text-green-600">
              <FileText className="h-4 w-4" />
              <span>{datosValidacion.documentoRespaldoNombre}</span>
            </div>
          )}
          <p className="text-xs text-gray-600">
            Adjunte el resultado de biopsia, análisis, estudio genético o documento que respalde el diagnóstico.
            {datosValidacion.documentoRespaldo && (
              <span className="text-purple-600 font-medium"> Puede usar IA para extraer datos automáticamente.</span>
            )}
          </p>
        </div>

        {/* Mensaje informativo */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-xs text-blue-900">
            <strong>Nota:</strong> La información adicional es requerida por normativa para diagnósticos de cáncer
            y enfermedades huérfanas. Esta información permite un mejor seguimiento y garantiza la trazabilidad
            del caso clínico.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
