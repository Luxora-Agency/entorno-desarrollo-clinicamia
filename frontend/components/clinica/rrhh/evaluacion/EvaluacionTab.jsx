'use client';

import { useState, useEffect } from 'react';
import {
  Target, Star, TrendingUp, MessageSquare, Plus,
  Calendar, Users, Award, ChevronRight, ThumbsUp,
  AlertCircle, BarChart3, Eye
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import useTalentoHumano from '@/hooks/useTalentoHumano';

const ESTADO_PERIODO_COLORS = {
  CONFIGURACION: 'bg-gray-100 text-gray-700',
  ACTIVO: 'bg-blue-100 text-blue-700',
  EN_EVALUACION: 'bg-yellow-100 text-yellow-700',
  CERRADO: 'bg-green-100 text-green-700',
};

const ESTADO_OBJETIVO_COLORS = {
  EN_PROGRESO: 'bg-blue-100 text-blue-700',
  COMPLETADO: 'bg-green-100 text-green-700',
  NO_CUMPLIDO: 'bg-red-100 text-red-700',
  CANCELADO: 'bg-gray-100 text-gray-700',
};

const TIPO_FEEDBACK_COLORS = {
  RECONOCIMIENTO: 'bg-green-100 text-green-700',
  MEJORA: 'bg-orange-100 text-orange-700',
  GENERAL: 'bg-blue-100 text-blue-700',
};

export default function EvaluacionTab({ user }) {
  const [activeSubTab, setActiveSubTab] = useState('periodos');
  const [showObjetivoModal, setShowObjetivoModal] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [showPeriodoModal, setShowPeriodoModal] = useState(false);
  const [selectedEmpleado, setSelectedEmpleado] = useState(null);
  const [formData, setFormData] = useState({});

  const {
    periodosEvaluacion, objetivos, feedbacks, empleados, loading,
    fetchPeriodosEvaluacion, fetchObjetivos, fetchFeedbacks, fetchEmpleados,
    createObjetivo, updateProgresoObjetivo, createFeedback, createPeriodoEvaluacion
  } = useTalentoHumano();

  useEffect(() => {
    fetchPeriodosEvaluacion();
    fetchObjetivos();
    fetchFeedbacks();
    fetchEmpleados({ estado: 'ACTIVO' });
  }, []);

  const stats = {
    periodos: periodosEvaluacion.length,
    pendientes: periodosEvaluacion.filter(p => p.estado === 'EN_EVALUACION').length,
    objetivosActivos: objetivos.filter(o => o.estado === 'EN_PROGRESO').length,
    feedbackCount: feedbacks.length,
  };

  const handleCreateObjetivo = async () => {
    try {
      await createObjetivo(formData);
      setShowObjetivoModal(false);
      setFormData({});
      fetchObjetivos();
    } catch (error) {
      console.error('Error al crear objetivo:', error);
    }
  };

  const handleCreateFeedback = async () => {
    try {
      await createFeedback(formData);
      setShowFeedbackModal(false);
      setFormData({});
      fetchFeedbacks();
    } catch (error) {
      console.error('Error al crear feedback:', error);
    }
  };

  const handleCreatePeriodo = async () => {
    try {
      await createPeriodoEvaluacion(formData);
      setShowPeriodoModal(false);
      setFormData({});
      fetchPeriodosEvaluacion();
    } catch (error) {
      console.error('Error al crear periodo:', error);
    }
  };

  const handleUpdateProgreso = async (objetivoId, nuevoProgreso) => {
    try {
      await updateProgresoObjetivo(objetivoId, parseInt(nuevoProgreso));
      fetchObjetivos();
    } catch (error) {
      console.error('Error al actualizar progreso:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Target className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.periodos}</p>
                <p className="text-sm text-gray-500">Periodos</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Star className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.pendientes}</p>
                <p className="text-sm text-gray-500">En Evaluacion</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.objetivosActivos}</p>
                <p className="text-sm text-gray-500">Objetivos Activos</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <MessageSquare className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.feedbackCount}</p>
                <p className="text-sm text-gray-500">Feedbacks</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeSubTab} onValueChange={setActiveSubTab}>
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="periodos">Periodos</TabsTrigger>
            <TabsTrigger value="objetivos">Objetivos</TabsTrigger>
            <TabsTrigger value="feedback">Feedback</TabsTrigger>
            <TabsTrigger value="resultados">Resultados</TabsTrigger>
          </TabsList>
          <Button onClick={() => {
            if (activeSubTab === 'periodos') setShowPeriodoModal(true);
            else if (activeSubTab === 'objetivos') setShowObjetivoModal(true);
            else if (activeSubTab === 'feedback') setShowFeedbackModal(true);
          }}>
            <Plus className="w-4 h-4 mr-2" />
            {activeSubTab === 'periodos' && 'Nuevo Periodo'}
            {activeSubTab === 'objetivos' && 'Nuevo Objetivo'}
            {activeSubTab === 'feedback' && 'Dar Feedback'}
            {activeSubTab === 'resultados' && 'Ver Reporte'}
          </Button>
        </div>

        <TabsContent value="periodos" className="mt-6">
          <Card>
            <CardContent className="pt-6">
              {loading ? (
                <div className="text-center py-12 text-gray-400">Cargando periodos...</div>
              ) : periodosEvaluacion.length === 0 ? (
                <div className="text-center py-12">
                  <Calendar className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                  <h3 className="text-lg font-medium text-gray-500">No hay periodos de evaluacion</h3>
                  <p className="text-sm text-gray-400 mt-1">Crea un periodo para iniciar las evaluaciones</p>
                  <Button className="mt-4" onClick={() => setShowPeriodoModal(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Crear Periodo
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {periodosEvaluacion.map(periodo => (
                    <div key={periodo.id} className="flex items-center justify-between p-4 border rounded-lg hover:shadow-sm transition-shadow">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{periodo.nombre}</h4>
                          <Badge className={ESTADO_PERIODO_COLORS[periodo.estado]}>
                            {periodo.estado?.replace(/_/g, ' ')}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-500 mt-1">
                          {periodo.tipo} | {periodo.anio}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(periodo.fechaInicio).toLocaleDateString()} - {new Date(periodo.fechaFin).toLocaleDateString()}
                        </p>
                      </div>
                      <Button variant="outline" size="sm">
                        Ver detalles
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="objetivos" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5 text-blue-600" />
                Objetivos y KPIs
              </CardTitle>
              <Button onClick={() => setShowObjetivoModal(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Nuevo Objetivo
              </Button>
            </CardHeader>
            <CardContent>
              {objetivos.length === 0 ? (
                <div className="text-center py-12">
                  <Target className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                  <h3 className="text-lg font-medium text-gray-500">Sin objetivos definidos</h3>
                  <p className="text-sm text-gray-400 mt-1">Define objetivos SMART para cada empleado</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {objetivos.map(objetivo => (
                    <div key={objetivo.id} className="p-4 border rounded-lg">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium">{objetivo.titulo}</h4>
                            <Badge className={ESTADO_OBJETIVO_COLORS[objetivo.estado]}>
                              {objetivo.estado?.replace(/_/g, ' ')}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">
                            {objetivo.empleado?.nombre} {objetivo.empleado?.apellido}
                          </p>
                          <p className="text-sm text-gray-500 mt-1">{objetivo.descripcion}</p>
                          <p className="text-xs text-gray-400 mt-2">
                            Metrica: {objetivo.metrica}
                            {objetivo.fechaLimite && ` | Fecha limite: ${new Date(objetivo.fechaLimite).toLocaleDateString()}`}
                          </p>
                        </div>
                        <div className="text-right min-w-[120px]">
                          <p className="text-2xl font-bold text-blue-600">{objetivo.progreso}%</p>
                          <p className="text-xs text-gray-500">Progreso</p>
                        </div>
                      </div>
                      <div className="mt-4">
                        <div className="flex items-center gap-2">
                          <Progress value={objetivo.progreso} className="flex-1 h-2" />
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            value={objetivo.progreso}
                            onChange={(e) => handleUpdateProgreso(objetivo.id, e.target.value)}
                            className="w-20 h-8 text-sm"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="feedback" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-purple-600" />
                Feedback Continuo
              </CardTitle>
              <Button onClick={() => setShowFeedbackModal(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Dar Feedback
              </Button>
            </CardHeader>
            <CardContent>
              {feedbacks.length === 0 ? (
                <div className="text-center py-12">
                  <MessageSquare className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                  <h3 className="text-lg font-medium text-gray-500">Sin feedback registrado</h3>
                  <p className="text-sm text-gray-400 mt-1">Comparte reconocimientos y areas de mejora</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {feedbacks.map(feedback => (
                    <div key={feedback.id} className="p-4 border rounded-lg">
                      <div className="flex items-start gap-4">
                        <div className={`p-2 rounded-lg ${
                          feedback.tipo === 'RECONOCIMIENTO' ? 'bg-green-100' :
                          feedback.tipo === 'MEJORA' ? 'bg-orange-100' : 'bg-blue-100'
                        }`}>
                          {feedback.tipo === 'RECONOCIMIENTO' ? (
                            <ThumbsUp className={`w-5 h-5 ${
                              feedback.tipo === 'RECONOCIMIENTO' ? 'text-green-600' : 'text-blue-600'
                            }`} />
                          ) : feedback.tipo === 'MEJORA' ? (
                            <AlertCircle className="w-5 h-5 text-orange-600" />
                          ) : (
                            <MessageSquare className="w-5 h-5 text-blue-600" />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">
                              {feedback.empleado?.nombre} {feedback.empleado?.apellido}
                            </span>
                            <Badge className={TIPO_FEEDBACK_COLORS[feedback.tipo]}>
                              {feedback.tipo}
                            </Badge>
                            {feedback.esPublico && (
                              <Badge variant="outline" className="text-xs">Publico</Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mt-2">{feedback.contenido}</p>
                          {feedback.competenciaRelacionada && (
                            <p className="text-xs text-gray-400 mt-2">
                              Competencia: {feedback.competenciaRelacionada}
                            </p>
                          )}
                          <p className="text-xs text-gray-400 mt-1">
                            {new Date(feedback.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="resultados" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-green-600" />
                Resultados de Evaluaciones
              </CardTitle>
            </CardHeader>
            <CardContent>
              {periodosEvaluacion.filter(p => p.estado === 'CERRADO').length === 0 ? (
                <div className="text-center py-12">
                  <Award className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                  <h3 className="text-lg font-medium text-gray-500">Sin resultados disponibles</h3>
                  <p className="text-sm text-gray-400 mt-1">Los resultados apareceran cuando se completen las evaluaciones</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Resumen de periodos cerrados */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="bg-green-50">
                      <CardContent className="pt-4">
                        <p className="text-sm text-green-600">Evaluaciones Completadas</p>
                        <p className="text-3xl font-bold text-green-700">
                          {periodosEvaluacion.filter(p => p.estado === 'CERRADO').length}
                        </p>
                      </CardContent>
                    </Card>
                    <Card className="bg-blue-50">
                      <CardContent className="pt-4">
                        <p className="text-sm text-blue-600">Objetivos Cumplidos</p>
                        <p className="text-3xl font-bold text-blue-700">
                          {objetivos.filter(o => o.estado === 'COMPLETADO').length}
                        </p>
                      </CardContent>
                    </Card>
                    <Card className="bg-purple-50">
                      <CardContent className="pt-4">
                        <p className="text-sm text-purple-600">Feedback Positivo</p>
                        <p className="text-3xl font-bold text-purple-700">
                          {feedbacks.filter(f => f.tipo === 'RECONOCIMIENTO').length}
                        </p>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Lista de empleados con resultados */}
                  <div className="space-y-3">
                    <h4 className="font-medium text-gray-700">Empleados Evaluados</h4>
                    {empleados.slice(0, 5).map(empleado => (
                      <div key={empleado.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-semibold">
                            {empleado.nombre?.[0]}{empleado.apellido?.[0]}
                          </div>
                          <div>
                            <p className="font-medium">{empleado.nombre} {empleado.apellido}</p>
                            <p className="text-sm text-gray-500">{empleado.cargo?.nombre}</p>
                          </div>
                        </div>
                        <Button variant="outline" size="sm">
                          <Eye className="w-4 h-4 mr-1" />
                          Ver Resultados
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modal Nuevo Periodo */}
      <Dialog open={showPeriodoModal} onOpenChange={setShowPeriodoModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-600" />
              Nuevo Periodo de Evaluacion
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nombre del Periodo</Label>
              <Input
                value={formData.nombre || ''}
                onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                placeholder="Ej: Evaluacion Anual 2025"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Ano</Label>
                <Input
                  type="number"
                  value={formData.anio || new Date().getFullYear()}
                  onChange={(e) => setFormData({...formData, anio: parseInt(e.target.value)})}
                />
              </div>
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select
                  value={formData.tipo || ''}
                  onValueChange={(value) => setFormData({...formData, tipo: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ANUAL">Anual</SelectItem>
                    <SelectItem value="SEMESTRAL">Semestral</SelectItem>
                    <SelectItem value="TRIMESTRAL">Trimestral</SelectItem>
                    <SelectItem value="PRUEBA">Periodo de Prueba</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Fecha Inicio</Label>
                <Input
                  type="date"
                  value={formData.fechaInicio || ''}
                  onChange={(e) => setFormData({...formData, fechaInicio: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label>Fecha Fin</Label>
                <Input
                  type="date"
                  value={formData.fechaFin || ''}
                  onChange={(e) => setFormData({...formData, fechaFin: e.target.value})}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Fecha Limite Evaluacion</Label>
              <Input
                type="date"
                value={formData.fechaLimiteEval || ''}
                onChange={(e) => setFormData({...formData, fechaLimiteEval: e.target.value})}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPeriodoModal(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreatePeriodo}>
              Crear Periodo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Nuevo Objetivo */}
      <Dialog open={showObjetivoModal} onOpenChange={setShowObjetivoModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-blue-600" />
              Nuevo Objetivo
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Empleado</Label>
              <Select
                value={formData.empleadoId || ''}
                onValueChange={(value) => setFormData({...formData, empleadoId: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar empleado" />
                </SelectTrigger>
                <SelectContent>
                  {empleados.map(emp => (
                    <SelectItem key={emp.id} value={emp.id}>
                      {emp.nombre} {emp.apellido}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Titulo del Objetivo</Label>
              <Input
                value={formData.titulo || ''}
                onChange={(e) => setFormData({...formData, titulo: e.target.value})}
                placeholder="Ej: Aumentar satisfaccion del paciente"
              />
            </div>
            <div className="space-y-2">
              <Label>Descripcion</Label>
              <Textarea
                value={formData.descripcion || ''}
                onChange={(e) => setFormData({...formData, descripcion: e.target.value})}
                placeholder="Describe el objetivo en detalle..."
              />
            </div>
            <div className="space-y-2">
              <Label>Metrica</Label>
              <Input
                value={formData.metrica || ''}
                onChange={(e) => setFormData({...formData, metrica: e.target.value})}
                placeholder="Ej: % de encuestas positivas"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Peso (%)</Label>
                <Input
                  type="number"
                  min="1"
                  max="100"
                  value={formData.peso || 100}
                  onChange={(e) => setFormData({...formData, peso: parseInt(e.target.value)})}
                />
              </div>
              <div className="space-y-2">
                <Label>Fecha Limite</Label>
                <Input
                  type="date"
                  value={formData.fechaLimite || ''}
                  onChange={(e) => setFormData({...formData, fechaLimite: e.target.value})}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowObjetivoModal(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreateObjetivo}>
              Crear Objetivo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Dar Feedback */}
      <Dialog open={showFeedbackModal} onOpenChange={setShowFeedbackModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-purple-600" />
              Dar Feedback
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Empleado</Label>
              <Select
                value={formData.empleadoId || ''}
                onValueChange={(value) => setFormData({...formData, empleadoId: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar empleado" />
                </SelectTrigger>
                <SelectContent>
                  {empleados.map(emp => (
                    <SelectItem key={emp.id} value={emp.id}>
                      {emp.nombre} {emp.apellido}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Tipo de Feedback</Label>
              <Select
                value={formData.tipo || ''}
                onValueChange={(value) => setFormData({...formData, tipo: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="RECONOCIMIENTO">Reconocimiento</SelectItem>
                  <SelectItem value="MEJORA">Area de Mejora</SelectItem>
                  <SelectItem value="GENERAL">General</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Contenido</Label>
              <Textarea
                value={formData.contenido || ''}
                onChange={(e) => setFormData({...formData, contenido: e.target.value})}
                placeholder="Escribe tu feedback..."
                rows={4}
              />
            </div>
            <div className="space-y-2">
              <Label>Competencia Relacionada (opcional)</Label>
              <Input
                value={formData.competenciaRelacionada || ''}
                onChange={(e) => setFormData({...formData, competenciaRelacionada: e.target.value})}
                placeholder="Ej: Trabajo en equipo"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="esPublico"
                checked={formData.esPublico || false}
                onChange={(e) => setFormData({...formData, esPublico: e.target.checked})}
              />
              <Label htmlFor="esPublico" className="cursor-pointer">
                Hacer publico este feedback
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowFeedbackModal(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreateFeedback}>
              Enviar Feedback
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
