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
                    {eval_.preguntas.map((preg, idx) => (
                      <div key={preg.id} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground w-6">{idx + 1}.</span>
                          <span className="text-sm">{preg.texto}</span>
                          <Badge variant="outline" className="text-xs">{TIPO_PREGUNTA[preg.tipo]}</Badge>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-muted-foreground">{preg.opciones?.length || 0} opciones</span>
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
                    ))}
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
                <Select value={preguntaFormData.tipo} onValueChange={(v) => setPreguntaFormData(p => ({ ...p, tipo: v }))}>
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
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label>Opciones de Respuesta</Label>
                <Button size="sm" variant="outline" onClick={addOpcionField}>
                  <Plus className="h-3 w-3 mr-1" />
                  Agregar
                </Button>
              </div>
              <div className="space-y-2">
                {preguntaFormData.opciones.map((op, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <Checkbox
                      checked={op.esCorrecta}
                      onCheckedChange={(checked) => updateOpcionField(idx, 'esCorrecta', checked)}
                    />
                    <Input
                      value={op.texto}
                      onChange={(e) => updateOpcionField(idx, 'texto', e.target.value)}
                      placeholder={`Opción ${idx + 1}`}
                      className="flex-1"
                    />
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8"
                      onClick={() => removeOpcionField(idx)}
                      disabled={preguntaFormData.opciones.length <= 2}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">Marca la(s) opción(es) correcta(s)</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPreguntaForm(false)}>Cancelar</Button>
            <Button onClick={handleAddPregunta} disabled={!preguntaFormData.texto || preguntaFormData.opciones.some(o => !o.texto)}>
              Agregar Pregunta
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
