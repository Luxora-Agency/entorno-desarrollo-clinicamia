'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UserPlus, Plus, X, Trash2, Stethoscope, AlertTriangle, Clock, ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const PRIORIDADES = [
  { value: 'Baja', label: 'Baja', color: 'bg-gray-100 text-gray-700' },
  { value: 'Media', label: 'Media', color: 'bg-blue-100 text-blue-700' },
  { value: 'Alta', label: 'Alta', color: 'bg-orange-100 text-orange-700' },
  { value: 'Urgente', label: 'Urgente', color: 'bg-red-100 text-red-700' },
];

export default function FormularioRemisiones({ onChange, data, diagnosticoConsulta }) {
  const { toast } = useToast();
  const [quiereAgregar, setQuiereAgregar] = useState(data !== null && data !== undefined && data.length > 0);
  const [remisiones, setRemisiones] = useState(data || []);
  const [especialidades, setEspecialidades] = useState([]);
  const [loadingEspecialidades, setLoadingEspecialidades] = useState(false);

  // Construir motivo inicial con diagnóstico principal
  const buildMotivoInicial = (diagnostico) => {
    if (!diagnostico?.principal) return '';
    const { codigoCIE10, descripcionCIE10, descripcion } = diagnostico.principal;
    if (codigoCIE10 && descripcionCIE10) {
      return `${codigoCIE10} - ${descripcionCIE10}`;
    }
    return descripcion || descripcionCIE10 || '';
  };

  // Obtener el prefijo del diagnóstico (texto que no se puede borrar parcialmente)
  const diagnosticoPrefijo = buildMotivoInicial(diagnosticoConsulta);

  // Manejar cambios en el motivo - no permitir borrado parcial del diagnóstico
  const handleMotivoChange = (nuevoValor) => {
    // Si hay un diagnóstico pre-cargado
    if (diagnosticoPrefijo) {
      // Si el nuevo valor es más corto que el prefijo y no está vacío
      // significa que están intentando borrar parte del diagnóstico
      if (nuevoValor.length < diagnosticoPrefijo.length && nuevoValor.length > 0) {
        // Si están borrando desde el principio, borrar todo el prefijo
        if (!nuevoValor.startsWith(diagnosticoPrefijo.substring(0, nuevoValor.length))) {
          // Borrar todo - el usuario quiere eliminar el diagnóstico
          setRemisionActual(prev => ({ ...prev, motivoConsulta: '' }));
          return;
        }
        // Están borrando del final del prefijo, borrar todo el prefijo
        setRemisionActual(prev => ({ ...prev, motivoConsulta: '' }));
        return;
      }

      // Si borraron todo, permitirlo
      if (nuevoValor === '') {
        setRemisionActual(prev => ({ ...prev, motivoConsulta: '' }));
        return;
      }

      // Si el nuevo valor no empieza con el prefijo y no es una adición
      // (es decir, están editando el medio del diagnóstico)
      if (!nuevoValor.startsWith(diagnosticoPrefijo) &&
          remisionActual.motivoConsulta.startsWith(diagnosticoPrefijo)) {
        // Borrar todo el prefijo y dejar solo lo que agregaron después
        const textoAdicional = remisionActual.motivoConsulta.substring(diagnosticoPrefijo.length);
        if (nuevoValor.length <= textoAdicional.length) {
          setRemisionActual(prev => ({ ...prev, motivoConsulta: nuevoValor }));
        } else {
          setRemisionActual(prev => ({ ...prev, motivoConsulta: '' }));
        }
        return;
      }
    }

    // Permitir el cambio normal
    setRemisionActual(prev => ({ ...prev, motivoConsulta: nuevoValor }));
  };

  const [remisionActual, setRemisionActual] = useState({
    especialidadId: '',
    especialidadNombre: '',
    motivoConsulta: buildMotivoInicial(diagnosticoConsulta),
    antecedentesRelevantes: '',
    diagnosticoPresuntivo: diagnosticoConsulta?.principal?.descripcion || diagnosticoConsulta?.principal?.descripcionCIE10 || '',
    prioridad: 'Media',
    observaciones: '',
  });

  // Cargar especialidades al montar
  useEffect(() => {
    cargarEspecialidades();
  }, []);

  // Actualizar motivo y diagnóstico presuntivo cuando cambie el diagnóstico de la consulta
  useEffect(() => {
    if (diagnosticoConsulta?.principal) {
      const nuevoMotivo = buildMotivoInicial(diagnosticoConsulta);
      const nuevoDiagnostico = diagnosticoConsulta.principal.descripcion || diagnosticoConsulta.principal.descripcionCIE10 || '';

      setRemisionActual(prev => ({
        ...prev,
        // Solo actualizar si el campo está vacío o tiene el valor anterior del diagnóstico
        motivoConsulta: !prev.motivoConsulta || prev.motivoConsulta.match(/^[A-Z]\d{2}/)
          ? nuevoMotivo
          : prev.motivoConsulta,
        diagnosticoPresuntivo: !prev.diagnosticoPresuntivo
          ? nuevoDiagnostico
          : prev.diagnosticoPresuntivo,
      }));
    }
  }, [diagnosticoConsulta]);

  const cargarEspecialidades = async () => {
    setLoadingEspecialidades(true);
    try {
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';

      const response = await fetch(`${apiUrl}/especialidades?estado=Activo&limit=100`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setEspecialidades(data.data || []);
      }
    } catch (error) {
      console.error('Error cargando especialidades:', error);
      setEspecialidades([]);
    } finally {
      setLoadingEspecialidades(false);
    }
  };

  const handleToggle = (agregar) => {
    setQuiereAgregar(agregar);
    if (!agregar) {
      setRemisiones([]);
      onChange(null, true);
    } else {
      onChange(remisiones, true);
    }
  };

  const handleEspecialidadChange = (especialidadId) => {
    const especialidad = especialidades.find(e => e.id === especialidadId);
    if (especialidad) {
      setRemisionActual({
        ...remisionActual,
        especialidadId: especialidad.id,
        especialidadNombre: especialidad.titulo,
      });
    }
  };

  const agregarRemision = () => {
    if (!remisionActual.especialidadId) {
      toast({ variant: 'destructive', description: 'Seleccione una especialidad' });
      return;
    }
    if (!remisionActual.motivoConsulta.trim()) {
      toast({ variant: 'destructive', description: 'Ingrese el motivo de la remisión' });
      return;
    }

    // Crear la remisión en formato compatible con procedimientos (tipo: Interconsulta)
    const nuevaRemision = {
      tipo: 'Interconsulta',
      servicioId: remisionActual.especialidadId,
      servicioNombre: remisionActual.especialidadNombre,
      especialidadId: remisionActual.especialidadId,
      especialidadNombre: remisionActual.especialidadNombre,
      motivoConsulta: remisionActual.motivoConsulta,
      antecedentesRelevantes: remisionActual.antecedentesRelevantes,
      diagnosticoPresuntivo: remisionActual.diagnosticoPresuntivo,
      prioridad: remisionActual.prioridad,
      observaciones: `
Motivo: ${remisionActual.motivoConsulta}
${remisionActual.diagnosticoPresuntivo ? `Dx Presuntivo: ${remisionActual.diagnosticoPresuntivo}` : ''}
${remisionActual.antecedentesRelevantes ? `Antecedentes: ${remisionActual.antecedentesRelevantes}` : ''}
${remisionActual.observaciones ? `Observaciones: ${remisionActual.observaciones}` : ''}
Prioridad: ${remisionActual.prioridad}
      `.trim(),
    };

    const nuevasRemisiones = [...remisiones, nuevaRemision];
    setRemisiones(nuevasRemisiones);
    onChange(nuevasRemisiones, true);

    // Reset formulario con diagnóstico pre-llenado
    setRemisionActual({
      especialidadId: '',
      especialidadNombre: '',
      motivoConsulta: buildMotivoInicial(diagnosticoConsulta),
      antecedentesRelevantes: '',
      diagnosticoPresuntivo: diagnosticoConsulta?.principal?.descripcion || diagnosticoConsulta?.principal?.descripcionCIE10 || '',
      prioridad: 'Media',
      observaciones: '',
    });

    toast({ title: 'Remisión agregada', description: `Remisión a ${nuevaRemision.especialidadNombre} agregada exitosamente` });
  };

  const eliminarRemision = (index) => {
    const nuevasRemisiones = remisiones.filter((_, i) => i !== index);
    setRemisiones(nuevasRemisiones);
    onChange(nuevasRemisiones.length > 0 ? nuevasRemisiones : null, true);
  };

  const getPrioridadConfig = (prioridad) => {
    return PRIORIDADES.find(p => p.value === prioridad) || PRIORIDADES[1];
  };

  return (
    <Card className="border-purple-200 bg-gradient-to-br from-purple-50/50 to-white">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2 text-purple-800">
          <UserPlus className="h-5 w-5" />
          Remisiones / Interconsultas
        </CardTitle>
        <p className="text-sm text-gray-500">
          Derive al paciente a otras especialidades médicas
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Toggle para agregar remisiones */}
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-gray-700">¿Requiere remisión a especialista?</span>
          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              variant={quiereAgregar ? 'default' : 'outline'}
              onClick={() => handleToggle(true)}
              className={quiereAgregar ? 'bg-purple-600 hover:bg-purple-700' : ''}
            >
              Sí
            </Button>
            <Button
              type="button"
              size="sm"
              variant={!quiereAgregar ? 'default' : 'outline'}
              onClick={() => handleToggle(false)}
              className={!quiereAgregar ? 'bg-gray-600 hover:bg-gray-700' : ''}
            >
              No
            </Button>
          </div>
        </div>

        {quiereAgregar && (
          <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
            {/* Lista de remisiones agregadas */}
            {remisiones.length > 0 && (
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Remisiones agregadas:</Label>
                <div className="space-y-2">
                  {remisiones.map((remision, index) => {
                    const prioridadConfig = getPrioridadConfig(remision.prioridad);
                    return (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-white border border-purple-200 rounded-lg shadow-sm"
                      >
                        <div className="flex items-center gap-3 flex-1">
                          <div className="flex-shrink-0 p-2 bg-purple-100 rounded-lg">
                            <Stethoscope className="h-4 w-4 text-purple-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-gray-900">
                                {remision.especialidadNombre || remision.servicioNombre}
                              </span>
                              <Badge className={`${prioridadConfig.color} text-xs`}>
                                {prioridadConfig.label}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-500 truncate">
                              {remision.motivoConsulta}
                            </p>
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => eliminarRemision(index)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Formulario para agregar nueva remisión */}
            <div className="p-4 border border-dashed border-purple-300 rounded-lg bg-purple-50/50 space-y-4">
              <div className="flex items-center gap-2 text-purple-700 font-medium">
                <Plus className="h-4 w-4" />
                Nueva Remisión
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Especialidad */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">
                    Especialidad <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={remisionActual.especialidadId}
                    onValueChange={handleEspecialidadChange}
                  >
                    <SelectTrigger className="bg-white">
                      <SelectValue placeholder={loadingEspecialidades ? 'Cargando...' : 'Seleccione especialidad'} />
                    </SelectTrigger>
                    <SelectContent>
                      {especialidades.map((esp) => (
                        <SelectItem key={esp.id} value={esp.id}>
                          <div className="flex items-center gap-2">
                            <Stethoscope className="h-4 w-4 text-purple-500" />
                            {esp.titulo}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Prioridad */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Prioridad</Label>
                  <Select
                    value={remisionActual.prioridad}
                    onValueChange={(value) => setRemisionActual({ ...remisionActual, prioridad: value })}
                  >
                    <SelectTrigger className="bg-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PRIORIDADES.map((p) => (
                        <SelectItem key={p.value} value={p.value}>
                          <div className="flex items-center gap-2">
                            {p.value === 'Urgente' && <AlertTriangle className="h-4 w-4 text-red-500" />}
                            {p.value === 'Alta' && <AlertTriangle className="h-4 w-4 text-orange-500" />}
                            {p.value === 'Media' && <Clock className="h-4 w-4 text-blue-500" />}
                            {p.value === 'Baja' && <Clock className="h-4 w-4 text-gray-500" />}
                            {p.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Motivo de la remisión */}
              <div className="space-y-2">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <Label className="text-sm font-medium">
                    Motivo de la Remisión <span className="text-red-500">*</span>
                  </Label>
                  <div className="flex items-center gap-2">
                    {/* Botón para restaurar diagnóstico si fue borrado */}
                    {diagnosticoPrefijo && !remisionActual.motivoConsulta.startsWith(diagnosticoPrefijo) && (
                      <button
                        type="button"
                        onClick={() => setRemisionActual(prev => ({
                          ...prev,
                          motivoConsulta: diagnosticoPrefijo + (prev.motivoConsulta ? '\n' + prev.motivoConsulta : '')
                        }))}
                        className="text-xs text-purple-600 hover:text-purple-800 hover:underline flex items-center gap-1 bg-purple-50 px-2 py-1 rounded border border-purple-200"
                        title="Click para restaurar el diagnóstico"
                      >
                        <Plus className="h-3 w-3" />
                        Dx: {diagnosticoPrefijo.length > 30 ? diagnosticoPrefijo.substring(0, 30) + '...' : diagnosticoPrefijo}
                      </button>
                    )}
                    {diagnosticoConsulta?.principal?.codigoCIE10 && remisionActual.motivoConsulta.startsWith(diagnosticoPrefijo) && (
                      <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-300">
                        Dx principal incluido
                      </Badge>
                    )}
                  </div>
                </div>
                <Textarea
                  value={remisionActual.motivoConsulta}
                  onChange={(e) => handleMotivoChange(e.target.value)}
                  placeholder="Describa el motivo por el cual remite al paciente a esta especialidad..."
                  className="bg-white min-h-[80px]"
                />
                <p className="text-xs text-gray-500">
                  {diagnosticoPrefijo
                    ? 'El diagnóstico principal se carga automáticamente. Puede agregar información adicional o borrar todo para escribir manualmente.'
                    : 'Describa el motivo de la remisión.'
                  }
                </p>
              </div>

              {/* Diagnóstico presuntivo */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Diagnóstico Presuntivo</Label>
                <Textarea
                  value={remisionActual.diagnosticoPresuntivo}
                  onChange={(e) => setRemisionActual({ ...remisionActual, diagnosticoPresuntivo: e.target.value })}
                  placeholder="Diagnóstico presuntivo o CIE-10 relacionado..."
                  className="bg-white min-h-[60px]"
                />
              </div>

              {/* Antecedentes relevantes */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Antecedentes Relevantes</Label>
                <Textarea
                  value={remisionActual.antecedentesRelevantes}
                  onChange={(e) => setRemisionActual({ ...remisionActual, antecedentesRelevantes: e.target.value })}
                  placeholder="Antecedentes médicos relevantes para esta remisión..."
                  className="bg-white min-h-[60px]"
                />
              </div>

              {/* Observaciones adicionales */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Observaciones Adicionales</Label>
                <Textarea
                  value={remisionActual.observaciones}
                  onChange={(e) => setRemisionActual({ ...remisionActual, observaciones: e.target.value })}
                  placeholder="Observaciones o indicaciones adicionales para el especialista..."
                  className="bg-white min-h-[60px]"
                />
              </div>

              {/* Botón agregar */}
              <Button
                type="button"
                onClick={agregarRemision}
                className="w-full bg-purple-600 hover:bg-purple-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Agregar Remisión
              </Button>
            </div>

            {/* Información adicional */}
            {remisiones.length > 0 && (
              <div className="p-3 bg-purple-100 rounded-lg border border-purple-200">
                <div className="flex items-start gap-2">
                  <ArrowRight className="h-5 w-5 text-purple-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-purple-800">
                      {remisiones.length} remisión(es) pendiente(s)
                    </p>
                    <p className="text-xs text-purple-600">
                      Las remisiones se crearán como interconsultas al finalizar la consulta
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
