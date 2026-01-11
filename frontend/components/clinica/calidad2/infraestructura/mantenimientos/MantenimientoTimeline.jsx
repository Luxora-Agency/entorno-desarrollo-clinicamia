'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Calendar,
  FileText,
  Download,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  Paperclip,
} from 'lucide-react';
import { useMantenimientos } from '@/hooks/useMantenimientos';
import { useDocumentosMantenimiento } from '@/hooks/useDocumentosMantenimiento';

const TIPO_COLORS = {
  PREVENTIVO: 'bg-blue-100 text-blue-800',
  CORRECTIVO: 'bg-orange-100 text-orange-800',
  PREDICTIVO: 'bg-purple-100 text-purple-800',
};

const ESTADO_COLORS = {
  PROGRAMADO: 'bg-gray-100 text-gray-800',
  EN_PROGRESO: 'bg-yellow-100 text-yellow-800',
  COMPLETADO: 'bg-green-100 text-green-800',
  CANCELADO: 'bg-red-100 text-red-800',
};

const ESTADO_ICONS = {
  PROGRAMADO: Clock,
  EN_PROGRESO: AlertCircle,
  COMPLETADO: CheckCircle,
  CANCELADO: XCircle,
};

const TIPO_DOCUMENTO_LABELS = {
  INFORME: 'Informe',
  COMPROBANTE: 'Comprobante',
  CERTIFICADO: 'Certificado',
  FOTO: 'Foto',
  OTRO: 'Otro',
};

export default function MantenimientoTimeline({ equipoId, equipo }) {
  const { timeline, loading, loadTimelineEquipo } = useMantenimientos();
  const { documentos: docs, loadDocumentosByMantenimiento } = useDocumentosMantenimiento();
  const [selectedMantenimiento, setSelectedMantenimiento] = useState(null);
  const [documentos, setDocumentos] = useState({});

  useEffect(() => {
    if (equipoId) {
      loadTimelineEquipo(equipoId);
    }
  }, [equipoId, loadTimelineEquipo]);

  const loadDocumentosFor = async (mantenimientoId) => {
    if (!documentos[mantenimientoId]) {
      const docs = await loadDocumentosByMantenimiento(mantenimientoId);
      setDocumentos((prev) => ({
        ...prev,
        [mantenimientoId]: docs || [],
      }));
    }
    setSelectedMantenimiento(
      selectedMantenimiento === mantenimientoId ? null : mantenimientoId
    );
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!timeline || timeline.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-gray-500">
            <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p>No hay mantenimientos registrados para este equipo</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Timeline de Mantenimientos
            {equipo && ` - ${equipo.nombre}`}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {timeline.map((mantenimiento, index) => {
              const EstadoIcon = ESTADO_ICONS[mantenimiento.estado] || Clock;
              const isExpanded = selectedMantenimiento === mantenimiento.id;
              const mantDocs = documentos[mantenimiento.id] || [];

              return (
                <div key={mantenimiento.id} className="relative">
                  {/* Timeline line */}
                  {index < timeline.length - 1 && (
                    <div className="absolute left-5 top-12 bottom-0 w-0.5 bg-gray-200" />
                  )}

                  {/* Timeline item */}
                  <div className="flex gap-4">
                    {/* Timeline dot */}
                    <div className="flex-shrink-0">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          mantenimiento.estado === 'COMPLETADO'
                            ? 'bg-green-100'
                            : mantenimiento.estado === 'CANCELADO'
                            ? 'bg-red-100'
                            : 'bg-blue-100'
                        }`}
                      >
                        <EstadoIcon
                          className={`w-5 h-5 ${
                            mantenimiento.estado === 'COMPLETADO'
                              ? 'text-green-600'
                              : mantenimiento.estado === 'CANCELADO'
                              ? 'text-red-600'
                              : 'text-blue-600'
                          }`}
                        />
                      </div>
                    </div>

                    {/* Content card */}
                    <Card className="flex-1 hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="space-y-3">
                          {/* Header */}
                          <div className="flex items-start justify-between">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <Badge className={TIPO_COLORS[mantenimiento.tipoMantenimiento]}>
                                  {mantenimiento.tipoMantenimiento}
                                </Badge>
                                <Badge className={ESTADO_COLORS[mantenimiento.estado]}>
                                  {mantenimiento.estado}
                                </Badge>
                              </div>
                              <p className="text-sm text-gray-600">
                                {mantenimiento.descripcion}
                              </p>
                            </div>
                          </div>

                          {/* Fechas */}
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-gray-500">Programado:</span>
                              <span className="ml-2 font-medium">
                                {new Date(mantenimiento.fechaProgramada).toLocaleDateString()}
                              </span>
                            </div>
                            {mantenimiento.fechaRealizada && (
                              <div>
                                <span className="text-gray-500">Realizado:</span>
                                <span className="ml-2 font-medium">
                                  {new Date(mantenimiento.fechaRealizada).toLocaleDateString()}
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Empresa y técnico */}
                          {(mantenimiento.empresaMantenimiento ||
                            mantenimiento.tecnicoResponsable) && (
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              {mantenimiento.empresaMantenimiento && (
                                <div>
                                  <span className="text-gray-500">Empresa:</span>
                                  <span className="ml-2">
                                    {mantenimiento.empresaMantenimiento}
                                  </span>
                                </div>
                              )}
                              {mantenimiento.tecnicoResponsable && (
                                <div>
                                  <span className="text-gray-500">Técnico:</span>
                                  <span className="ml-2">
                                    {mantenimiento.tecnicoResponsable}
                                  </span>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Costos */}
                          {mantenimiento.costoTotal > 0 && (
                            <div className="text-sm">
                              <span className="text-gray-500">Costo total:</span>
                              <span className="ml-2 font-semibold text-green-600">
                                ${mantenimiento.costoTotal.toLocaleString()}
                              </span>
                            </div>
                          )}

                          {/* Botón para ver documentos */}
                          <Button
                            onClick={() => loadDocumentosFor(mantenimiento.id)}
                            variant="outline"
                            size="sm"
                            className="w-full"
                          >
                            <Paperclip className="w-4 h-4 mr-2" />
                            {isExpanded ? 'Ocultar' : 'Ver'} Documentos
                            {mantenimiento.documentos && mantenimiento.documentos.length > 0 && (
                              <Badge variant="secondary" className="ml-2">
                                {mantenimiento.documentos.length}
                              </Badge>
                            )}
                          </Button>

                          {/* Documentos expandidos */}
                          {isExpanded && mantDocs.length > 0 && (
                            <div className="mt-4 pt-4 border-t border-gray-200">
                              <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                                <FileText className="w-4 h-4" />
                                Documentos adjuntos
                              </h4>
                              <div className="space-y-2">
                                {mantDocs.map((doc) => (
                                  <div
                                    key={doc.id}
                                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                                  >
                                    <div className="flex items-center gap-3">
                                      <FileText className="w-4 h-4 text-gray-500" />
                                      <div>
                                        <p className="text-sm font-medium">{doc.nombre}</p>
                                        <p className="text-xs text-gray-500">
                                          {TIPO_DOCUMENTO_LABELS[doc.tipoDocumento] ||
                                            doc.tipoDocumento}
                                        </p>
                                      </div>
                                    </div>
                                    <Button
                                      onClick={() => window.open(doc.archivoUrl, '_blank')}
                                      variant="ghost"
                                      size="sm"
                                    >
                                      <Download className="w-4 h-4" />
                                    </Button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {isExpanded && mantDocs.length === 0 && (
                            <div className="mt-4 pt-4 border-t border-gray-200 text-center text-gray-500 text-sm">
                              No hay documentos adjuntos
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
