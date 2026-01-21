'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Plus, Trash2, GripVertical, Edit, CheckCircle } from 'lucide-react';
import { useEvaluaciones } from '@/hooks/useEvaluaciones';
import { cn } from '@/lib/utils';

const TIPO_PREGUNTA = {
  OPCION_MULTIPLE: 'Opción Múltiple',
  VERDADERO_FALSO: 'Verdadero/Falso',
  SELECCION_MULTIPLE: 'Selección Múltiple',
};

export default function EvaluacionBuilder({ capacitacionId, evaluaciones, onRefresh }) {
  const [showForm, setShowForm] = useState(false);
  const [showPreguntaForm, setShowPreguntaForm] = useState(false);
  const [selectedEval, setSelectedEval] = useState(null);
  const [selectedPregunta, setSelectedPregunta] = useState(null);

  const { createEvaluacion, deleteEvaluacion, addPregunta, updatePregunta, deletePregunta, addOpcion, updateOpcion, deleteOpcion } = useEvaluaciones();

  const [evalFormData, setEvalFormData] = useState({
    tipo: 'PRE_TEST',
    nombre: '',
    descripcion: '',
    tiempoLimiteMin: '',
    puntajePorPregunta: '1',
  });

  const [preguntaFormData, setPreguntaFormData] = useState({
    texto: '',
    tipo: 'OPCION_MULTIPLE',
    tiempoSegundos: '',
    opciones: [
      { texto: '', esCorrecta: false },
      { texto: '', esCorrecta: false },
    ],
  });

  const handleCreateEvaluacion = async () => {
    const data = {
      ...evalFormData,
      tiempoLimiteMin: evalFormData.tiempoLimiteMin ? parseInt(evalFormData.tiempoLimiteMin) : null,
      puntajePorPregunta: parseInt(evalFormData.puntajePorPregunta) || 1,
    };
    const result = await createEvaluacion(capacitacionId, data);
    if (result) {
      setShowForm(false);
      setEvalFormData({ tipo: 'PRE_TEST', nombre: '', descripcion: '', tiempoLimiteMin: '', puntajePorPregunta: '1' });
      onRefresh?.();
    }
  };

  const handleDeleteEvaluacion = async (evalId) => {
    await deleteEvaluacion(evalId);
    onRefresh?.();
  };

  const handleAddPregunta = async () => {
    const data = {
      ...preguntaFormData,
      tiempoSegundos: preguntaFormData.tiempoSegundos ? parseInt(preguntaFormData.tiempoSegundos) : null,
    };
    const result = await addPregunta(selectedEval.id, data);
    if (result) {
      setShowPreguntaForm(false);
      setPreguntaFormData({ texto: '', tipo: 'OPCION_MULTIPLE', tiempoSegundos: '', opciones: [{ texto: '', esCorrecta: false }, { texto: '', esCorrecta: false }] });
      onRefresh?.();
    }
  };

  const handleDeletePregunta = async (preguntaId) => {
    await deletePregunta(preguntaId, selectedEval?.id);
    onRefresh?.();
  };

  const addOpcionField = () => {
    setPreguntaFormData(prev => ({
      ...prev,
      opciones: [...prev.opciones, { texto: '', esCorrecta: false }],
    }));
  };

  const updateOpcionField = (index, field, value) => {
    setPreguntaFormData(prev => ({
      ...prev,
      opciones: prev.opciones.map((op, i) => (i === index ? { ...op, [field]: value } : op)),
    }));
  };

  const removeOpcionField = (index) => {
    if (preguntaFormData.opciones.length <= 2) return;
    setPreguntaFormData(prev => ({
      ...prev,
      opciones: prev.opciones.filter((_, i) => i !== index),
    }));
  };

  const hasPreTest = evaluaciones?.some(e => e.tipo === 'PRE_TEST');
  const hasPostTest = evaluaciones?.some(e => e.tipo === 'POST_TEST');

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-medium">Evaluaciones</h3>
        <Button size="sm" onClick={() => setShowForm(true)} disabled={hasPreTest && hasPostTest}>
          <Plus className="h-4 w-4 mr-2" />
          Nueva Evaluación
        </Button>
      </div>

      {!evaluaciones || evaluaciones.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            <p>No hay evaluaciones configuradas</p>
            <p className="text-sm">Crea un Pre-Test o Post-Test para evaluar a los participantes</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {evaluaciones.map(eval_ => (
            <Card key={eval_.id}>
              <CardHeader className="py-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Badge variant={eval_.tipo === 'PRE_TEST' ? 'secondary' : 'default'}>
                      {eval_.tipo === 'PRE_TEST' ? 'Pre-Test' : 'Post-Test'}
                    </Badge>
                    {eval_.nombre}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{eval_.preguntas?.length || eval_._count?.preguntas || 0} preguntas</Badge>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => { setSelectedEval(eval_); setShowPreguntaForm(true); }}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Pregunta
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-destructive"
                      onClick={() => handleDeleteEvaluacion(eval_.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              {eval_.preguntas && eval_.preguntas.length > 0 && (
                <CardContent className="pt-0">
                  <div className="space-y-2">
                    {eval_.preguntas.map((preg, idx) => {
                      const opcionesCorrectas = preg.opciones?.filter(o => o.esCorrecta) || [];
                      return (
                        <div key={preg.id} className="p-2 bg-muted/50 rounded">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <span className="text-xs text-muted-foreground w-6 flex-shrink-0">{idx + 1}.</span>
                              <span className="text-sm truncate">{preg.texto}</span>
                              <Badge
                                variant="outline"
                                className={cn(
                                  "text-xs flex-shrink-0",
                                  preg.tipo === 'VERDADERO_FALSO' && "bg-green-50 border-green-300 text-green-700",
                                  preg.tipo === 'SELECCION_MULTIPLE' && "bg-blue-50 border-blue-300 text-blue-700",
                                  preg.tipo === 'OPCION_MULTIPLE' && "bg-amber-50 border-amber-300 text-amber-700"
                                )}
                              >
                                {TIPO_PREGUNTA[preg.tipo]}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-1 flex-shrink-0">
                              <span className="text-xs text-muted-foreground">{preg.opciones?.length || 0} opc.</span>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-6 w-6 text-destructive"
                                onClick={() => handleDeletePregunta(preg.id)}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                          {/* Mostrar respuesta(s) correcta(s) */}
                          {opcionesCorrectas.length > 0 && (
                            <div className="ml-6 mt-1 flex flex-wrap gap-1">
                              {opcionesCorrectas.map((op) => (
                                <span
                                  key={op.id}
                                  className="inline-flex items-center gap-1 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded"
                                >
                                  <CheckCircle className="h-3 w-3" />
                                  {op.texto}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Create Evaluation Modal */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nueva Evaluación</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select value={evalFormData.tipo} onValueChange={(v) => setEvalFormData(p => ({ ...p, tipo: v }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PRE_TEST" disabled={hasPreTest}>Pre-Test</SelectItem>
                  <SelectItem value="POST_TEST" disabled={hasPostTest}>Post-Test</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Nombre</Label>
              <Input
                value={evalFormData.nombre}
                onChange={(e) => setEvalFormData(p => ({ ...p, nombre: e.target.value }))}
                placeholder="Ej: Evaluación de Seguridad del Paciente"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tiempo Límite (min)</Label>
                <Input
                  type="number"
                  value={evalFormData.tiempoLimiteMin}
                  onChange={(e) => setEvalFormData(p => ({ ...p, tiempoLimiteMin: e.target.value }))}
                  placeholder="Opcional"
                />
              </div>
              <div className="space-y-2">
                <Label>Puntos por Pregunta</Label>
                <Input
                  type="number"
                  value={evalFormData.puntajePorPregunta}
                  onChange={(e) => setEvalFormData(p => ({ ...p, puntajePorPregunta: e.target.value }))}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
            <Button onClick={handleCreateEvaluacion} disabled={!evalFormData.nombre}>Crear</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Question Modal */}
      <Dialog open={showPreguntaForm} onOpenChange={setShowPreguntaForm}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Nueva Pregunta</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 max-h-[60vh] overflow-y-auto">
            <div className="space-y-2">
              <Label>Pregunta</Label>
              <Input
                value={preguntaFormData.texto}
                onChange={(e) => setPreguntaFormData(p => ({ ...p, texto: e.target.value }))}
                placeholder="Escribe la pregunta..."
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select
                  value={preguntaFormData.tipo}
                  onValueChange={(v) => {
                    if (v === 'VERDADERO_FALSO') {
                      // Auto-populate Verdadero/Falso options
                      setPreguntaFormData(p => ({
                        ...p,
                        tipo: v,
                        opciones: [
                          { texto: 'Verdadero', esCorrecta: false },
                          { texto: 'Falso', esCorrecta: false },
                        ]
                      }));
                    } else if (preguntaFormData.tipo === 'VERDADERO_FALSO') {
                      // Si cambia desde V/F, resetear opciones a default
                      setPreguntaFormData(p => ({
                        ...p,
                        tipo: v,
                        opciones: [
                          { texto: '', esCorrecta: false },
                          { texto: '', esCorrecta: false },
                        ]
                      }));
                    } else {
                      setPreguntaFormData(p => ({ ...p, tipo: v }));
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="OPCION_MULTIPLE">Opción Múltiple</SelectItem>
                    <SelectItem value="VERDADERO_FALSO">Verdadero/Falso</SelectItem>
                    <SelectItem value="SELECCION_MULTIPLE">Selección Múltiple</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Tiempo (seg)</Label>
                <Input
                  type="number"
                  value={preguntaFormData.tiempoSegundos}
                  onChange={(e) => setPreguntaFormData(p => ({ ...p, tiempoSegundos: e.target.value }))}
                  placeholder="Opcional"
                />
              </div>
            </div>

            {/* Tipo-specific hints */}
            {preguntaFormData.tipo === 'SELECCION_MULTIPLE' && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-800">
                  <strong>Selección Múltiple:</strong> Los participantes podrán seleccionar varias opciones.
                  Marca todas las opciones que sean correctas.
                </p>
              </div>
            )}
            {preguntaFormData.tipo === 'OPCION_MULTIPLE' && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <p className="text-sm text-amber-800">
                  <strong>Opción Múltiple:</strong> Los participantes solo podrán seleccionar UNA opción.
                  Marca únicamente la opción correcta.
                </p>
              </div>
            )}
            {preguntaFormData.tipo === 'VERDADERO_FALSO' && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <p className="text-sm text-green-800">
                  <strong>Verdadero/Falso:</strong> Selecciona cuál es la respuesta correcta a la afirmación.
                </p>
              </div>
            )}

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label>Opciones de Respuesta</Label>
                {preguntaFormData.tipo !== 'VERDADERO_FALSO' && (
                  <Button size="sm" variant="outline" onClick={addOpcionField}>
                    <Plus className="h-3 w-3 mr-1" />
                    Agregar
                  </Button>
                )}
              </div>
              <div className="space-y-2">
                {preguntaFormData.opciones.map((op, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    {preguntaFormData.tipo === 'VERDADERO_FALSO' ? (
                      // Radio-style for V/F (only one can be correct)
                      <input
                        type="radio"
                        name="opcionCorrecta"
                        checked={op.esCorrecta}
                        onChange={() => {
                          setPreguntaFormData(prev => ({
                            ...prev,
                            opciones: prev.opciones.map((o, i) => ({ ...o, esCorrecta: i === idx }))
                          }));
                        }}
                        className="h-4 w-4 text-primary"
                      />
                    ) : preguntaFormData.tipo === 'OPCION_MULTIPLE' ? (
                      // Radio-style for single-choice multiple
                      <input
                        type="radio"
                        name="opcionCorrecta"
                        checked={op.esCorrecta}
                        onChange={() => {
                          setPreguntaFormData(prev => ({
                            ...prev,
                            opciones: prev.opciones.map((o, i) => ({ ...o, esCorrecta: i === idx }))
                          }));
                        }}
                        className="h-4 w-4 text-primary"
                      />
                    ) : (
                      // Checkbox for multi-select
                      <Checkbox
                        checked={op.esCorrecta}
                        onCheckedChange={(checked) => updateOpcionField(idx, 'esCorrecta', checked)}
                      />
                    )}
                    <Input
                      value={op.texto}
                      onChange={(e) => updateOpcionField(idx, 'texto', e.target.value)}
                      placeholder={preguntaFormData.tipo === 'VERDADERO_FALSO' ? op.texto : `Opción ${idx + 1}`}
                      className="flex-1"
                      disabled={preguntaFormData.tipo === 'VERDADERO_FALSO'}
                    />
                    {preguntaFormData.tipo !== 'VERDADERO_FALSO' && (
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        onClick={() => removeOpcionField(idx)}
                        disabled={preguntaFormData.opciones.length <= 2}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                {preguntaFormData.tipo === 'SELECCION_MULTIPLE'
                  ? 'Marca todas las opciones correctas (pueden ser varias)'
                  : 'Marca la opción correcta'}
              </p>
            </div>
          </div>
          {/* Validation warning */}
          {preguntaFormData.texto && !preguntaFormData.opciones.some(o => o.esCorrecta) && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2">
              <span className="text-red-500 text-lg">⚠️</span>
              <p className="text-sm text-red-700 font-medium">
                Debes seleccionar al menos una respuesta correcta antes de guardar
              </p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPreguntaForm(false)}>Cancelar</Button>
            <Button
              onClick={handleAddPregunta}
              disabled={
                !preguntaFormData.texto ||
                preguntaFormData.opciones.some(o => !o.texto) ||
                !preguntaFormData.opciones.some(o => o.esCorrecta) // Debe haber al menos una respuesta correcta
              }
            >
              Agregar Pregunta
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
