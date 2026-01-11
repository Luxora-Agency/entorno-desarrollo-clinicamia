'use client';

import { useState, useEffect } from 'react';
import { Plus, Search, User, Calendar, CheckCircle2, Clock, XCircle, Play, Eye, Trash2, FileText, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { useCalidad2Induccion } from '@/hooks/useCalidad2Induccion';
import { useCalidad2Personal } from '@/hooks/useCalidad2Personal';

const ESTADO_COLORS = {
  PENDIENTE: 'bg-gray-100 text-gray-800',
  EN_PROCESO: 'bg-blue-100 text-blue-800',
  COMPLETADO: 'bg-green-100 text-green-800',
  CANCELADO: 'bg-red-100 text-red-800',
};

const ESTADO_ICONS = {
  PENDIENTE: Clock,
  EN_PROCESO: Play,
  COMPLETADO: CheckCircle2,
  CANCELADO: XCircle,
};

export default function InduccionTab({ user }) {
  const {
    procesos,
    currentProceso,
    stats,
    pagination,
    loading,
    filters,
    setFilters,
    setPagination,
    loadProcesos,
    getProceso,
    createProceso,
    updateProceso,
    deleteProceso,
    iniciarProceso,
    completarProceso,
    cancelarProceso,
    addFase,
    updateFase,
    completarFase,
    deleteFase,
    registrarEvaluacion,
    loadStats,
    clearCurrentProceso,
  } = useCalidad2Induccion();

  const { personal, loadPersonal } = useCalidad2Personal();

  const [showForm, setShowForm] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelMotivo, setCancelMotivo] = useState('');
  const [procesoToCancel, setProcesoToCancel] = useState(null);
  const [formData, setFormData] = useState({
    personalId: '',
    tipo: 'INDUCCION',
    observaciones: '',
  });

  useEffect(() => {
    loadProcesos();
    loadStats();
    loadPersonal();
  }, []);

  const handleCreate = async () => {
    const result = await createProceso(formData);
    if (result) {
      setShowForm(false);
      setFormData({ personalId: '', tipo: 'INDUCCION', observaciones: '' });
    }
  };

  const handleViewDetail = async (id) => {
    await getProceso(id);
    setShowDetail(true);
  };

  const handleIniciar = async (id) => {
    await iniciarProceso(id);
    if (currentProceso?.id === id) {
      getProceso(id);
    }
  };

  const handleCompletar = async (id) => {
    await completarProceso(id);
    if (currentProceso?.id === id) {
      getProceso(id);
    }
  };

  const handleCancelar = async () => {
    if (procesoToCancel && cancelMotivo) {
      await cancelarProceso(procesoToCancel, cancelMotivo);
      setShowCancelModal(false);
      setProcesoToCancel(null);
      setCancelMotivo('');
    }
  };

  const handleCompletarFase = async (faseId) => {
    await completarFase(faseId);
    if (currentProceso) {
      getProceso(currentProceso.id);
    }
  };

  const getProgresoFases = (proceso) => {
    if (!proceso?.fases?.length) return 0;
    const completadas = proceso.fases.filter(f => f.completado).length;
    return Math.round((completadas / proceso.fases.length) * 100);
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gray-100 rounded-lg">
                  <FileText className="w-5 h-5 text-gray-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.total || 0}</p>
                  <p className="text-sm text-gray-500">Total Procesos</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Play className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.enProceso || 0}</p>
                  <p className="text-sm text-gray-500">En Proceso</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.completados || 0}</p>
                  <p className="text-sm text-gray-500">Completados</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Clock className="w-5 h-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.pendientes || 0}</p>
                  <p className="text-sm text-gray-500">Pendientes</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters and Actions */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Buscar por nombre..."
              className="pl-10"
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              onKeyDown={(e) => e.key === 'Enter' && loadProcesos()}
            />
          </div>
          <Select value={filters.tipo || '_all'} onValueChange={(v) => setFilters({ ...filters, tipo: v === '_all' ? '' : v })}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="_all">Todos</SelectItem>
              <SelectItem value="INDUCCION">Induccion</SelectItem>
              <SelectItem value="REINDUCCION">Reinduccion</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filters.estado || '_all'} onValueChange={(v) => setFilters({ ...filters, estado: v === '_all' ? '' : v })}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="_all">Todos</SelectItem>
              <SelectItem value="PENDIENTE">Pendiente</SelectItem>
              <SelectItem value="EN_PROCESO">En Proceso</SelectItem>
              <SelectItem value="COMPLETADO">Completado</SelectItem>
              <SelectItem value="CANCELADO">Cancelado</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={() => loadProcesos()}>
            Buscar
          </Button>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Proceso
        </Button>
      </div>

      {/* Lista de Procesos */}
      <div className="space-y-3">
        {loading ? (
          <div className="text-center py-8 text-gray-500">Cargando...</div>
        ) : procesos.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-gray-500">
              No hay procesos de induccion registrados
            </CardContent>
          </Card>
        ) : (
          procesos.map((proceso) => {
            const IconEstado = ESTADO_ICONS[proceso.estado] || Clock;
            const progreso = getProgresoFases(proceso);
            return (
              <Card key={proceso.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-gray-100 rounded-full">
                        <User className="w-5 h-5 text-gray-600" />
                      </div>
                      <div>
                        <h3 className="font-medium">
                          {proceso.personal?.nombreCompleto || 'Sin asignar'}
                        </h3>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <Badge variant="outline">{proceso.tipo}</Badge>
                          <span>|</span>
                          <Calendar className="w-3 h-3" />
                          <span>{new Date(proceso.fechaInicio).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="w-32">
                        <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                          <span>Progreso</span>
                          <span>{progreso}%</span>
                        </div>
                        <Progress value={progreso} className="h-2" />
                      </div>
                      <Badge className={ESTADO_COLORS[proceso.estado]}>
                        <IconEstado className="w-3 h-3 mr-1" />
                        {proceso.estado}
                      </Badge>
                      <div className="flex items-center gap-1">
                        {proceso.estado === 'PENDIENTE' && (
                          <Button size="sm" variant="ghost" onClick={() => handleIniciar(proceso.id)}>
                            <Play className="w-4 h-4" />
                          </Button>
                        )}
                        {proceso.estado === 'EN_PROCESO' && (
                          <Button size="sm" variant="ghost" onClick={() => handleCompletar(proceso.id)}>
                            <CheckCircle2 className="w-4 h-4" />
                          </Button>
                        )}
                        <Button size="sm" variant="ghost" onClick={() => handleViewDetail(proceso.id)}>
                          <Eye className="w-4 h-4" />
                        </Button>
                        {proceso.estado !== 'COMPLETADO' && proceso.estado !== 'CANCELADO' && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-red-600"
                            onClick={() => {
                              setProcesoToCancel(proceso.id);
                              setShowCancelModal(true);
                            }}
                          >
                            <XCircle className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Modal Crear Proceso */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nuevo Proceso de Induccion</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Personal</Label>
              <Select
                value={formData.personalId}
                onValueChange={(v) => setFormData({ ...formData, personalId: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar personal" />
                </SelectTrigger>
                <SelectContent>
                  {personal.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.nombreCompleto} - {p.cargo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Tipo</Label>
              <Select
                value={formData.tipo}
                onValueChange={(v) => setFormData({ ...formData, tipo: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="INDUCCION">Induccion</SelectItem>
                  <SelectItem value="REINDUCCION">Reinduccion</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Observaciones</Label>
              <Textarea
                value={formData.observaciones}
                onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                placeholder="Observaciones adicionales..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowForm(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreate} disabled={!formData.personalId}>
              Crear Proceso
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Detalle */}
      <Dialog open={showDetail} onOpenChange={(open) => { setShowDetail(open); if (!open) clearCurrentProceso(); }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalle del Proceso</DialogTitle>
          </DialogHeader>
          {currentProceso && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-lg">{currentProceso.personal?.nombreCompleto}</h3>
                  <p className="text-sm text-gray-500">{currentProceso.personal?.cargo}</p>
                </div>
                <Badge className={ESTADO_COLORS[currentProceso.estado]}>
                  {currentProceso.estado}
                </Badge>
              </div>

              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Tipo:</span>
                  <span className="ml-2 font-medium">{currentProceso.tipo}</span>
                </div>
                <div>
                  <span className="text-gray-500">Inicio:</span>
                  <span className="ml-2 font-medium">
                    {new Date(currentProceso.fechaInicio).toLocaleDateString()}
                  </span>
                </div>
                {currentProceso.fechaFin && (
                  <div>
                    <span className="text-gray-500">Fin:</span>
                    <span className="ml-2 font-medium">
                      {new Date(currentProceso.fechaFin).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>

              <div>
                <h4 className="font-medium mb-3">Fases del Proceso</h4>
                <div className="space-y-2">
                  {currentProceso.fases?.map((fase) => (
                    <div
                      key={fase.id}
                      className={`p-3 border rounded-lg flex items-center justify-between ${
                        fase.completado ? 'bg-green-50 border-green-200' : 'bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {fase.completado ? (
                          <CheckCircle2 className="w-5 h-5 text-green-600" />
                        ) : (
                          <div className="w-5 h-5 border-2 rounded-full" />
                        )}
                        <div>
                          <p className="font-medium">{fase.tema}</p>
                          <p className="text-sm text-gray-500">Fase: {fase.fase}</p>
                        </div>
                      </div>
                      {!fase.completado && currentProceso.estado === 'EN_PROCESO' && (
                        <Button size="sm" onClick={() => handleCompletarFase(fase.id)}>
                          Completar
                        </Button>
                      )}
                      {fase.completado && fase.fechaCompletado && (
                        <span className="text-sm text-gray-500">
                          {new Date(fase.fechaCompletado).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {currentProceso.evaluacion && (
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-medium mb-2">Evaluacion Final</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Calificacion:</span>
                      <span className="ml-2 font-bold text-lg">{currentProceso.evaluacion.calificacion}%</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Estado:</span>
                      <Badge className={currentProceso.evaluacion.aprobado ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                        {currentProceso.evaluacion.aprobado ? 'Aprobado' : 'No Aprobado'}
                      </Badge>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal Cancelar */}
      <Dialog open={showCancelModal} onOpenChange={setShowCancelModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancelar Proceso</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-gray-600">Ingrese el motivo de la cancelacion:</p>
            <Textarea
              value={cancelMotivo}
              onChange={(e) => setCancelMotivo(e.target.value)}
              placeholder="Motivo de cancelacion..."
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCancelModal(false)}>
              Volver
            </Button>
            <Button variant="destructive" onClick={handleCancelar} disabled={!cancelMotivo}>
              Cancelar Proceso
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
