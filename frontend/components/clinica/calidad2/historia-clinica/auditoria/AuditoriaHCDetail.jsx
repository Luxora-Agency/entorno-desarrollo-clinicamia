'use client';

import { useState, useEffect } from 'react';
import { useCalidad2AuditoriasHC } from '@/hooks/useCalidad2AuditoriasHC';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Plus,
  ClipboardCheck,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Calendar,
  User,
  FileText,
  Lock,
  Edit,
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import HallazgoForm from './HallazgoForm';

const TIPO_LABELS = {
  FORTALEZA: { label: 'Fortaleza', color: 'bg-green-100 text-green-800', icon: CheckCircle2 },
  OPORTUNIDAD_MEJORA: { label: 'Oportunidad de Mejora', color: 'bg-yellow-100 text-yellow-800', icon: AlertTriangle },
  NO_CONFORMIDAD_MENOR: { label: 'No Conformidad Menor', color: 'bg-orange-100 text-orange-800', icon: AlertTriangle },
  NO_CONFORMIDAD_MAYOR: { label: 'No Conformidad Mayor', color: 'bg-red-100 text-red-800', icon: XCircle },
};

const SEVERIDAD_LABELS = {
  OBSERVACION: { label: 'Observación', color: 'bg-blue-100 text-blue-800' },
  MENOR: { label: 'Menor', color: 'bg-yellow-100 text-yellow-800' },
  MAYOR: { label: 'Mayor', color: 'bg-orange-100 text-orange-800' },
  CRITICA: { label: 'Crítica', color: 'bg-red-100 text-red-800' },
};

const ESTADO_LABELS = {
  ABIERTO: { label: 'Abierto', color: 'bg-blue-100 text-blue-800' },
  EN_PROCESO: { label: 'En Proceso', color: 'bg-yellow-100 text-yellow-800' },
  CERRADO: { label: 'Cerrado', color: 'bg-green-100 text-green-800' },
  VERIFICADO: { label: 'Verificado', color: 'bg-purple-100 text-purple-800' },
};

export default function AuditoriaHCDetail({ auditoriaId, onClose }) {
  const {
    auditoria,
    loading,
    hallazgos,
    loadAuditoria,
    loadHallazgos,
    cerrarAuditoria,
  } = useCalidad2AuditoriasHC();

  const [showHallazgoForm, setShowHallazgoForm] = useState(false);
  const [showCerrarModal, setShowCerrarModal] = useState(false);
  const [selectedHallazgo, setSelectedHallazgo] = useState(null);
  const [cerrarData, setCerrarData] = useState({
    conclusiones: '',
    planMejoramiento: '',
  });

  useEffect(() => {
    if (auditoriaId) {
      loadAuditoria(auditoriaId);
      loadHallazgos(auditoriaId);
    }
  }, [auditoriaId]);

  const handleAddHallazgo = () => {
    setSelectedHallazgo(null);
    setShowHallazgoForm(true);
  };

  const handleEditHallazgo = (hallazgo) => {
    setSelectedHallazgo(hallazgo);
    setShowHallazgoForm(true);
  };

  const handleHallazgoFormClose = () => {
    setShowHallazgoForm(false);
    setSelectedHallazgo(null);
    if (auditoriaId) {
      loadAuditoria(auditoriaId);
      loadHallazgos(auditoriaId);
    }
  };

  const handleCerrarAuditoria = async () => {
    const success = await cerrarAuditoria(auditoriaId, cerrarData);
    if (success) {
      setShowCerrarModal(false);
      loadAuditoria(auditoriaId);
    }
  };

  if (loading || !auditoria) {
    return (
      <div className="text-center py-8">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p className="mt-2 text-gray-500">Cargando detalle...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header con información general */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>{auditoria.areaAuditada}</span>
            <div className="flex items-center gap-2">
              <Badge className={auditoria.estado === 'ABIERTA' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}>
                {auditoria.estado}
              </Badge>
              <Badge variant="outline">{auditoria.tipo}</Badge>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div>
              <p className="text-xs text-gray-500">Fecha de Auditoría</p>
              <div className="flex items-center gap-2 mt-1">
                <Calendar className="h-4 w-4 text-gray-400" />
                <p className="font-medium">
                  {format(new Date(auditoria.fechaAuditoria), 'dd/MM/yyyy', { locale: es })}
                </p>
              </div>
            </div>

            <div>
              <p className="text-xs text-gray-500">Auditor</p>
              <div className="flex items-center gap-2 mt-1">
                <User className="h-4 w-4 text-gray-400" />
                <p className="font-medium">
                  {auditoria.auditorUsuario?.nombre} {auditoria.auditorUsuario?.apellido}
                </p>
              </div>
            </div>

            <div>
              <p className="text-xs text-gray-500">HC Revisadas</p>
              <div className="flex items-center gap-2 mt-1">
                <FileText className="h-4 w-4 text-gray-400" />
                <p className="font-medium">{auditoria.historiasRevisadas}</p>
              </div>
            </div>

            <div>
              <p className="text-xs text-gray-500">Total Hallazgos</p>
              <div className="flex items-center gap-2 mt-1">
                <ClipboardCheck className="h-4 w-4 text-gray-400" />
                <p className="font-medium">{hallazgos.length}</p>
              </div>
            </div>
          </div>

          {/* Resumen de hallazgos */}
          <div className="grid grid-cols-3 gap-4 pt-4 border-t">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-xs text-gray-500">Positivos</p>
                <p className="text-lg font-semibold">{auditoria.hallazgosPositivos}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="text-xs text-gray-500">Negativos</p>
                <p className="text-lg font-semibold">{auditoria.hallazgosNegativos}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-600" />
              <div>
                <p className="text-xs text-gray-500">Críticos</p>
                <p className="text-lg font-semibold">{auditoria.hallazgosCriticos}</p>
              </div>
            </div>
          </div>

          {auditoria.observaciones && (
            <div className="mt-4 pt-4 border-t">
              <p className="text-sm font-semibold mb-2">Observaciones Generales</p>
              <p className="text-sm text-gray-600">{auditoria.observaciones}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Lista de hallazgos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Hallazgos ({hallazgos.length})</span>
            {auditoria.estado === 'ABIERTA' && (
              <Button onClick={handleAddHallazgo} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Agregar Hallazgo
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {hallazgos.length === 0 ? (
            <div className="text-center py-8">
              <ClipboardCheck className="h-12 w-12 mx-auto text-gray-400" />
              <p className="mt-2 text-gray-500">No hay hallazgos registrados</p>
              {auditoria.estado === 'ABIERTA' && (
                <Button onClick={handleAddHallazgo} className="mt-4" variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar Primer Hallazgo
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {hallazgos.map((hallazgo) => {
                const tipoInfo = TIPO_LABELS[hallazgo.tipo] || {};
                const Icon = tipoInfo.icon || ClipboardCheck;
                const severidadInfo = SEVERIDAD_LABELS[hallazgo.severidad] || {};
                const estadoInfo = ESTADO_LABELS[hallazgo.estado] || {};

                return (
                  <Card key={hallazgo.id} className="hover:shadow-sm transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Icon className="h-5 w-5" />
                          <div className="flex items-center gap-2">
                            <Badge className={tipoInfo.color}>
                              {tipoInfo.label}
                            </Badge>
                            <Badge className={severidadInfo.color}>
                              {severidadInfo.label}
                            </Badge>
                            <Badge className={estadoInfo.color}>
                              {estadoInfo.label}
                            </Badge>
                          </div>
                        </div>
                        {auditoria.estado === 'ABIERTA' && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEditHallazgo(hallazgo)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        )}
                      </div>

                      <div className="space-y-2">
                        <div>
                          <p className="text-xs text-gray-500">Criterio Evaluado</p>
                          <p className="text-sm font-medium">{hallazgo.criterio}</p>
                        </div>

                        <div>
                          <p className="text-xs text-gray-500">Descripción</p>
                          <p className="text-sm">{hallazgo.descripcion}</p>
                        </div>

                        {hallazgo.evidencia && (
                          <div>
                            <p className="text-xs text-gray-500">Evidencia</p>
                            <p className="text-sm text-gray-600">{hallazgo.evidencia}</p>
                          </div>
                        )}

                        {hallazgo.accionCorrectiva && (
                          <div>
                            <p className="text-xs text-gray-500">Acción Correctiva</p>
                            <p className="text-sm text-gray-600">{hallazgo.accionCorrectiva}</p>
                          </div>
                        )}

                        {hallazgo.responsableUsuario && (
                          <div>
                            <p className="text-xs text-gray-500">Responsable</p>
                            <p className="text-sm">
                              {hallazgo.responsableUsuario.nombre} {hallazgo.responsableUsuario.apellido}
                            </p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Botones de acción */}
      {auditoria.estado === 'ABIERTA' && (
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cerrar
          </Button>
          <Button onClick={() => setShowCerrarModal(true)} className="bg-green-600 hover:bg-green-700">
            <Lock className="h-4 w-4 mr-2" />
            Cerrar Auditoría
          </Button>
        </div>
      )}

      {/* Modal para agregar/editar hallazgo */}
      {showHallazgoForm && (
        <Dialog open={showHallazgoForm} onOpenChange={() => handleHallazgoFormClose()}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {selectedHallazgo ? 'Editar Hallazgo' : 'Nuevo Hallazgo'}
              </DialogTitle>
            </DialogHeader>
            <HallazgoForm
              auditoriaId={auditoriaId}
              hallazgo={selectedHallazgo}
              onClose={handleHallazgoFormClose}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* Modal para cerrar auditoría */}
      <Dialog open={showCerrarModal} onOpenChange={setShowCerrarModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Cerrar Auditoría</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="conclusiones">
                Conclusiones <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="conclusiones"
                value={cerrarData.conclusiones}
                onChange={(e) => setCerrarData({ ...cerrarData, conclusiones: e.target.value })}
                placeholder="Conclusiones generales de la auditoría..."
                rows={4}
              />
            </div>

            <div>
              <Label htmlFor="planMejoramiento">Plan de Mejoramiento</Label>
              <Textarea
                id="planMejoramiento"
                value={cerrarData.planMejoramiento}
                onChange={(e) => setCerrarData({ ...cerrarData, planMejoramiento: e.target.value })}
                placeholder="Plan de mejoramiento basado en los hallazgos..."
                rows={4}
              />
            </div>

            <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg">
              <p className="text-sm text-yellow-800">
                <strong>Nota:</strong> Una vez cerrada la auditoría no se podrán agregar más hallazgos.
                Asegúrese de haber registrado todos los hallazgos antes de cerrar.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCerrarModal(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleCerrarAuditoria}
              disabled={!cerrarData.conclusiones.trim()}
              className="bg-green-600 hover:bg-green-700"
            >
              Confirmar Cierre
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
