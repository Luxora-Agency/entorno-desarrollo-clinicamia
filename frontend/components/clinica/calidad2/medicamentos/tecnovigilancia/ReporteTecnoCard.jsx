'use client';

import { AlertTriangle, Calendar, Edit, Trash2, Send } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const ESTADO_COLORS = {
  BORRADOR: 'bg-gray-100 text-gray-800',
  ENVIADO: 'bg-blue-100 text-blue-800',
  REPORTADO_INVIMA: 'bg-green-100 text-green-800',
  CERRADO: 'bg-red-100 text-red-800',
};

const GRAVEDAD_COLORS = {
  'LEVE': 'bg-yellow-100 text-yellow-800',
  'MODERADA': 'bg-orange-100 text-orange-800',
  'GRAVE': 'bg-red-100 text-red-800',
  'MORTAL': 'bg-purple-100 text-purple-800',
};

const TIPO_EVENTO_COLORS = {
  'LESION': 'bg-orange-100 text-orange-700',
  'MUERTE': 'bg-purple-100 text-purple-700',
  'FALLA_DISPOSITIVO': 'bg-blue-100 text-blue-700',
  'USO_INADECUADO': 'bg-yellow-100 text-yellow-700',
};

export default function ReporteTecnoCard({ reporte, onEdit, onDelete, onReportarINVIMA }) {
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-gray-900 text-sm line-clamp-1">
              {reporte.dispositivoMedico}
            </h4>
            <p className="text-xs text-gray-500 mt-1">
              Paciente: {reporte.paciente?.nombre || 'N/A'}
            </p>
          </div>
          <Badge className={ESTADO_COLORS[reporte.estado] || 'bg-gray-100'}>
            {reporte.estado}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Gravedad y Tipo */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <AlertTriangle className={`w-4 h-4 ${
              reporte.gravedadEvento === 'GRAVE' || reporte.gravedadEvento === 'MORTAL'
                ? 'text-red-500'
                : 'text-yellow-500'
            }`} />
            <Badge className={GRAVEDAD_COLORS[reporte.gravedadEvento] || 'bg-gray-100'}>
              {reporte.gravedadEvento}
            </Badge>
          </div>
          {reporte.tipoEvento && (
            <Badge className={TIPO_EVENTO_COLORS[reporte.tipoEvento] || 'bg-gray-100'}>
              {reporte.tipoEvento.replace(/_/g, ' ')}
            </Badge>
          )}
        </div>

        {/* Información del dispositivo */}
        <div className="text-xs space-y-1">
          {reporte.fabricante && (
            <div className="flex items-center gap-2">
              <span className="text-gray-500">Fabricante:</span>
              <span className="font-medium text-gray-700">{reporte.fabricante}</span>
            </div>
          )}
          {reporte.modelo && (
            <div className="flex items-center gap-2">
              <span className="text-gray-500">Modelo:</span>
              <span className="font-medium text-gray-700">{reporte.modelo}</span>
            </div>
          )}
          {reporte.numeroSerie && (
            <div className="flex items-center gap-2">
              <span className="text-gray-500">S/N:</span>
              <span className="font-medium text-gray-700">{reporte.numeroSerie}</span>
            </div>
          )}
          {reporte.lote && (
            <div className="flex items-center gap-2">
              <span className="text-gray-500">Lote:</span>
              <span className="font-medium text-gray-700">{reporte.lote}</span>
            </div>
          )}
          {reporte.clasificacion && (
            <div className="flex items-center gap-2">
              <span className="text-gray-500">Clasificación:</span>
              <span className="font-medium text-gray-700">
                {reporte.clasificacion.replace(/_/g, ' ')}
              </span>
            </div>
          )}
        </div>

        {/* Fecha del evento */}
        <div className="flex items-center gap-2 text-xs text-gray-500 pt-2 border-t">
          <Calendar className="w-3.5 h-3.5" />
          <span>Evento: {new Date(reporte.fechaEvento).toLocaleDateString()}</span>
        </div>

        {/* INVIMA info */}
        {reporte.reportadoINVIMA && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-2">
            <div className="flex items-center gap-2 text-xs text-green-700">
              <Send className="w-3.5 h-3.5" />
              <div>
                <p className="font-medium">Reportado a INVIMA</p>
                {reporte.numeroReporteINVIMA && (
                  <p className="text-green-600">N° {reporte.numeroReporteINVIMA}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Descripción breve */}
        {reporte.descripcionEvento && (
          <p className="text-xs text-gray-600 line-clamp-2 pt-2 border-t">
            {reporte.descripcionEvento}
          </p>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2 pt-3 border-t">
          <Button
            size="sm"
            variant="outline"
            className="flex-1"
            onClick={() => onEdit(reporte)}
          >
            <Edit className="w-3.5 h-3.5 mr-1" />
            Ver/Editar
          </Button>

          {!reporte.reportadoINVIMA && reporte.estado !== 'CERRADO' && (
            <Button
              size="sm"
              variant="default"
              onClick={() => onReportarINVIMA(reporte.id)}
              className="bg-green-600 hover:bg-green-700"
            >
              <Send className="w-3.5 h-3.5" />
            </Button>
          )}

          {!reporte.reportadoINVIMA && (
            <Button
              size="sm"
              variant="destructive"
              onClick={() => onDelete(reporte.id)}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
