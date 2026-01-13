'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ClipboardList, Plus, X, AlertCircle, Sparkles, Star, ChevronDown, ChevronUp, Trash2, History } from 'lucide-react';
import CatalogSearch from '@/components/ui/CatalogSearch';
import ValidacionDiagnosticoEspecial from './ValidacionDiagnosticoEspecial';
import TemplateSelector from '../templates/TemplateSelector';
import { apiGet } from '@/services/api';

// Diagnósticos CIE-10 más comunes en consulta general
const DIAGNOSTICOS_COMUNES = [
  { codigo: 'J06.9', descripcion: 'Infección aguda de las vías respiratorias superiores, no especificada' },
  { codigo: 'J02.9', descripcion: 'Faringitis aguda, no especificada' },
  { codigo: 'J03.9', descripcion: 'Amigdalitis aguda, no especificada' },
  { codigo: 'J00', descripcion: 'Rinofaringitis aguda (resfriado común)' },
  { codigo: 'J01.9', descripcion: 'Sinusitis aguda, no especificada' },
  { codigo: 'R51', descripcion: 'Cefalea' },
  { codigo: 'G43.9', descripcion: 'Migraña, no especificada' },
  { codigo: 'K29.7', descripcion: 'Gastritis, no especificada' },
  { codigo: 'K30', descripcion: 'Dispepsia funcional' },
  { codigo: 'I10', descripcion: 'Hipertensión esencial (primaria)' },
  { codigo: 'E11.9', descripcion: 'Diabetes mellitus tipo 2, sin complicaciones' },
  { codigo: 'M54.5', descripcion: 'Lumbago no especificado' },
  { codigo: 'M54.9', descripcion: 'Dorsalgia, no especificada' },
  { codigo: 'L23.9', descripcion: 'Dermatitis alérgica de contacto, causa no especificada' },
  { codigo: 'N39.0', descripcion: 'Infección de vías urinarias, sitio no especificado' },
  { codigo: 'K59.0', descripcion: 'Estreñimiento' },
  { codigo: 'R10.4', descripcion: 'Otros dolores abdominales y los no especificados' },
  { codigo: 'F41.9', descripcion: 'Trastorno de ansiedad, no especificado' },
];

export default function FormularioDiagnosticoConsulta({ onChange, data, pacienteId }) {
  const [showSecundarios, setShowSecundarios] = useState(false);
  const [showComunes, setShowComunes] = useState(true);
  const [showFrecuentes, setShowFrecuentes] = useState(true);

  // Diagnósticos frecuentes del paciente
  const [diagnosticosFrecuentes, setDiagnosticosFrecuentes] = useState([]);
  const [loadingFrecuentes, setLoadingFrecuentes] = useState(false);

  const [formData, setFormData] = useState(data || {
    principal: {
      codigoCIE10: '',
      descripcionCIE10: '',
      observaciones: '',
    },
    secundarios: [
      { codigoCIE10: '', descripcionCIE10: '', observaciones: '' },
      { codigoCIE10: '', descripcionCIE10: '', observaciones: '' },
    ],
  });

  // Estados para validación especial de diagnósticos (cáncer/huérfanas)
  const [validacionEspecial, setValidacionEspecial] = useState(data?.validacionEspecial || null);
  const [validacionEspecialValida, setValidacionEspecialValida] = useState(true);

  // Ref para prevenir actualizaciones innecesarias desde el padre
  const lastDataRef = useRef(null);

  useEffect(() => {
    if (data) {
      // Solo actualizar si el contenido realmente cambió (no solo la referencia)
      const dataStr = JSON.stringify({
        principal: data.principal,
        secundarios: data.secundarios
      });
      if (lastDataRef.current !== dataStr) {
        lastDataRef.current = dataStr;
        setFormData(data);
        // Show secondary section if any secondary has data
        if (data.secundarios?.some(s => s.codigoCIE10)) {
          setShowSecundarios(true);
        }
      }
    }
  }, [data]);

  // Cargar diagnósticos frecuentes del paciente
  useEffect(() => {
    if (pacienteId) {
      cargarDiagnosticosFrecuentes();
    }
  }, [pacienteId]);

  // NOTA: La validación especial se notifica directamente desde el callback onDataChange
  // sin causar loops porque ValidacionDiagnosticoEspecial usa prevDataRef para evitar
  // llamadas duplicadas

  const cargarDiagnosticosFrecuentes = async () => {
    if (!pacienteId) return;
    setLoadingFrecuentes(true);
    try {
      const response = await apiGet(`/consultas/frecuentes/${pacienteId}`);
      if (response.success && response.data?.diagnosticos) {
        setDiagnosticosFrecuentes(response.data.diagnosticos);
      }
    } catch (error) {
      console.error('Error cargando diagnósticos frecuentes:', error);
    } finally {
      setLoadingFrecuentes(false);
    }
  };

  // Seleccionar diagnóstico frecuente como principal
  const seleccionarDiagnosticoFrecuente = (frecuente) => {
    const newData = {
      ...formData,
      principal: {
        ...formData.principal,
        codigoCIE10: frecuente.codigoCIE11,
        descripcionCIE10: frecuente.descripcion,
      },
    };
    setFormData(newData);
    notifyChange(newData);
  };

  const handlePrincipalChange = (field, value) => {
    const newData = {
      ...formData,
      principal: { ...formData.principal, [field]: value },
    };
    setFormData(newData);
    notifyChange(newData);
  };

  const handleSecundarioChange = (index, field, value) => {
    const newSecundarios = [...formData.secundarios];
    newSecundarios[index] = { ...newSecundarios[index], [field]: value };
    const newData = { ...formData, secundarios: newSecundarios };
    setFormData(newData);
    notifyChange(newData);
  };

  const seleccionarDiagnosticoPrincipal = (diagnostico) => {
    const newData = {
      ...formData,
      principal: {
        ...formData.principal,
        codigoCIE10: diagnostico.codigo,
        descripcionCIE10: diagnostico.descripcion,
      },
    };
    setFormData(newData);
    notifyChange(newData);
  };

  const seleccionarDiagnosticoSecundario = (index, diagnostico) => {
    const newSecundarios = [...formData.secundarios];
    newSecundarios[index] = {
      ...newSecundarios[index],
      codigoCIE10: diagnostico.codigo,
      descripcionCIE10: diagnostico.descripcion,
    };
    const newData = { ...formData, secundarios: newSecundarios };
    setFormData(newData);
    notifyChange(newData);
  };

  const limpiarSecundario = (index) => {
    const newSecundarios = [...formData.secundarios];
    newSecundarios[index] = { codigoCIE10: '', descripcionCIE10: '', observaciones: '' };
    const newData = { ...formData, secundarios: newSecundarios };
    setFormData(newData);
    notifyChange(newData);
  };

  // Ref para prevenir notificaciones duplicadas
  const lastNotifiedRef = useRef(null);

  // Callback memoizado para ValidacionDiagnosticoEspecial
  const handleValidacionEspecialChange = useCallback((data, isValid) => {
    setValidacionEspecial(data);
    setValidacionEspecialValida(isValid);
  }, []);

  const notifyChange = (data) => {
    // Incluir validación especial en los datos
    const dataCompleta = {
      ...data,
      validacionEspecial
    };

    // Validar: diagnóstico principal completo Y validación especial válida (si aplica)
    const isPrincipalValid = data.principal.codigoCIE10 && data.principal.descripcionCIE10;
    const isValid = isPrincipalValid && validacionEspecialValida;

    // Solo notificar si realmente cambió
    const notifyKey = JSON.stringify({ data: dataCompleta, isValid });
    if (lastNotifiedRef.current === notifyKey) return;
    lastNotifiedRef.current = notifyKey;

    onChange(dataCompleta, isValid);
  };

  const isPrincipalComplete = formData.principal.codigoCIE10 && formData.principal.descripcionCIE10;

  return (
    <div className="space-y-6">
      {/* Diagnóstico Principal - OBLIGATORIO */}
      <Card className="border-2 border-pink-300 shadow-md">
        <CardHeader className="bg-gradient-to-r from-pink-50 to-rose-50">
          <CardTitle className="flex items-center gap-2 text-pink-900">
            <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
            <ClipboardList className="h-5 w-5" />
            Diagnóstico Principal (CIE-10)
            <Badge variant="destructive" className="ml-2">Obligatorio</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-6">
          {!isPrincipalComplete && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
              <p className="text-sm text-yellow-800">
                Debe seleccionar un diagnóstico principal para poder finalizar la consulta.
              </p>
            </div>
          )}

          {/* Buscador Oficial CIE-10 */}
          <div className="space-y-2">
            <Label className="text-pink-900 font-semibold">Buscar en Catálogo CIE-10</Label>
            <CatalogSearch
              type="CIE10"
              placeholder="Buscar por código o descripción (ej: J06.9, Faringitis...)"
              onSelect={seleccionarDiagnosticoPrincipal}
              defaultValue={formData.principal.codigoCIE10}
            />
          </div>

          {/* Diagnósticos Frecuentes del Paciente */}
          {diagnosticosFrecuentes.length > 0 && (
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-lg p-4">
              <button
                type="button"
                onClick={() => setShowFrecuentes(!showFrecuentes)}
                className="flex items-center gap-2 w-full text-left"
              >
                <History className="h-5 w-5 text-amber-600" />
                <Label className="text-amber-900 font-semibold cursor-pointer">Diagnósticos del Historial del Paciente</Label>
                <Badge variant="outline" className="ml-2 text-xs bg-amber-100 text-amber-700 border-amber-300">
                  {diagnosticosFrecuentes.length}
                </Badge>
                {showFrecuentes ? <ChevronUp className="h-4 w-4 ml-auto" /> : <ChevronDown className="h-4 w-4 ml-auto" />}
              </button>
              {showFrecuentes && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {diagnosticosFrecuentes.map((freq, index) => {
                    const yaSeleccionado = formData.principal.codigoCIE10 === freq.codigoCIE11;
                    return (
                      <button
                        key={index}
                        onClick={() => !yaSeleccionado && seleccionarDiagnosticoFrecuente(freq)}
                        disabled={yaSeleccionado}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm transition-all ${
                          yaSeleccionado
                            ? 'bg-amber-200 text-amber-600 cursor-not-allowed'
                            : 'bg-white hover:bg-amber-100 text-amber-800 border border-amber-200 hover:border-amber-400 cursor-pointer shadow-sm hover:shadow'
                        }`}
                      >
                        <span className="font-mono text-xs font-bold">{freq.codigoCIE11}</span>
                        <span className="text-xs truncate max-w-[150px]">{freq.descripcion}</span>
                        <span className="text-xs text-gray-500">({freq.vecesRegistrado}x)</span>
                        {yaSeleccionado && <Star className="h-3 w-3 text-amber-500" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Diagnósticos Comunes */}
          <div className="bg-gradient-to-r from-pink-50 to-rose-50 border border-pink-200 rounded-lg p-4">
            <button
              type="button"
              onClick={() => setShowComunes(!showComunes)}
              className="flex items-center gap-2 w-full text-left"
            >
              <Sparkles className="h-5 w-5 text-pink-600" />
              <Label className="text-pink-900 font-semibold cursor-pointer">Diagnósticos Comunes (General)</Label>
              {showComunes ? <ChevronUp className="h-4 w-4 ml-auto" /> : <ChevronDown className="h-4 w-4 ml-auto" />}
            </button>
            {showComunes && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-48 overflow-y-auto mt-3">
                {DIAGNOSTICOS_COMUNES.map((diag, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    onClick={() => seleccionarDiagnosticoPrincipal(diag)}
                    className="justify-start text-left h-auto py-2 px-3 hover:bg-pink-100 hover:border-pink-400"
                  >
                    <div className="flex flex-col">
                      <span className="font-mono text-xs text-pink-700 font-bold">{diag.codigo}</span>
                      <span className="text-xs text-gray-700 line-clamp-1">{diag.descripcion}</span>
                    </div>
                  </Button>
                ))}
              </div>
            )}
          </div>

          {/* Código y descripción seleccionados */}
          {isPrincipalComplete && (
            <div className="border-t pt-4 mt-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-green-600 font-semibold uppercase">Diagnóstico Principal Seleccionado</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge className="bg-pink-600 text-white font-mono">{formData.principal.codigoCIE10}</Badge>
                      <span className="text-gray-800 font-medium">{formData.principal.descripcionCIE10}</span>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handlePrincipalChange('codigoCIE10', '') || handlePrincipalChange('descripcionCIE10', '')}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Observaciones del diagnóstico principal */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="observacionesPrincipal">Observaciones / Análisis Clínico</Label>
              <TemplateSelector 
                category="ANALISIS" 
                onSelect={(text) => handlePrincipalChange('observaciones', text)} 
              />
            </div>
            <Textarea
              id="observacionesPrincipal"
              value={formData.principal.observaciones}
              onChange={(e) => handlePrincipalChange('observaciones', e.target.value)}
              placeholder="Describa el análisis clínico que justifica este diagnóstico..."
              rows={2}
            />
          </div>
        </CardContent>
      </Card>

      {/* Validación Especial para Cáncer y Enfermedades Huérfanas */}
      {formData.principal.codigoCIE10 && (
        <ValidacionDiagnosticoEspecial
          codigoCIE10={formData.principal.codigoCIE10}
          onDataChange={handleValidacionEspecialChange}
          initialData={validacionEspecial}
        />
      )}

      {/* Diagnósticos Secundarios - OPCIONALES */}
      <Card className="border border-gray-200">
        <CardHeader className="bg-gray-50 cursor-pointer" onClick={() => setShowSecundarios(!showSecundarios)}>
          <CardTitle className="flex items-center gap-2 text-gray-700">
            <Plus className="h-5 w-5" />
            Diagnósticos Secundarios (CIE-10)
            <Badge variant="outline" className="ml-2">Opcional - Máx. 2</Badge>
            {showSecundarios ? <ChevronUp className="h-4 w-4 ml-auto" /> : <ChevronDown className="h-4 w-4 ml-auto" />}
          </CardTitle>
        </CardHeader>

        {showSecundarios && (
          <CardContent className="space-y-6 pt-6">
            {[0, 1].map((index) => (
              <div key={index} className="border border-dashed border-gray-300 rounded-lg p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-gray-700 font-semibold">Diagnóstico Secundario {index + 1}</Label>
                  {formData.secundarios[index].codigoCIE10 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => limpiarSecundario(index)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Limpiar
                    </Button>
                  )}
                </div>

                <div className="space-y-2">
                  <CatalogSearch
                    type="CIE10"
                    placeholder="Buscar diagnóstico secundario..."
                    onSelect={(diag) => seleccionarDiagnosticoSecundario(index, diag)}
                    defaultValue={formData.secundarios[index].codigoCIE10}
                  />
                </div>

                {formData.secundarios[index].codigoCIE10 && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-blue-600 text-white font-mono">{formData.secundarios[index].codigoCIE10}</Badge>
                      <span className="text-gray-700 text-sm">{formData.secundarios[index].descripcionCIE10}</span>
                    </div>
                  </div>
                )}

                <div>
                  <Label htmlFor={`obsSecundario${index}`}>Observaciones</Label>
                  <Textarea
                    id={`obsSecundario${index}`}
                    value={formData.secundarios[index].observaciones}
                    onChange={(e) => handleSecundarioChange(index, 'observaciones', e.target.value)}
                    placeholder="Observaciones del diagnóstico secundario..."
                    rows={2}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        )}
      </Card>
    </div>
  );
}
