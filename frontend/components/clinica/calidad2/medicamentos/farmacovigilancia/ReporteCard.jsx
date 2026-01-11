'use client';

import { AlertTriangle, Calendar, User, Edit, Trash2, Send } from 'lucide-react';
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
  'Leve': 'bg-yellow-100 text-yellow-800',
  'Moderada': 'bg-orange-100 text-orange-800',
  'Grave': 'bg-red-100 text-red-800',
  'Mortal': 'bg-purple-100 text-purple-800',
};

export default function ReporteCard({ reporte, onEdit, onDelete, onReportarINVIMA }) {
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-gray-900 text-sm line-clamp-1">
              {reporte.medicamento}
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
        {/* Gravedad */}
        <div className="flex items-center gap-2">
          <AlertTriangle className={`w-4 h-4 ${
            reporte.gravedadReaccion === 'Grave' || reporte.gravedadReaccion === 'Mortal'
              ? 'text-red-500'
              : 'text-yellow-500'
          }`} />
          <Badge className={GRAVEDAD_COLORS[reporte.gravedadReaccion] || 'bg-gray-100'}>
            {reporte.gravedadReaccion}
          </Badge>
        </div>

        {/* Información básica */}
        <div className="text-xs space-y-1">
          {reporte.tipoReporte && (
            <div className="flex items-center gap-2">
              <span className="text-gray-500">Tipo:</span>
              <span className="font-medium text-gray-700">{reporte.tipoReporte}</span>
            </div>
          )}
          {reporte.laboratorio && (
            <div className="flex items-center gap-2">
              <span className="text-gray-500">Laboratorio:</span>
              <span className="font-medium text-gray-700">{reporte.laboratorio}</span>
            </div>
          )}
          {reporte.lote && (
            <div className="flex items-center gap-2">
              <span className="text-gray-500">Lote:</span>
              <span className="font-medium text-gray-700">{reporte.lote}</span>
            </div>
          )}
          {reporte.causalidad && (
            <div className="flex items-center gap-2">
              <span className="text-gray-500">Causalidad:</span>
              <span className="font-medium text-gray-700">{reporte.causalidad}</span>
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
        {reporte.descripcionReaccion && (
          <p className="text-xs text-gray-600 line-clamp-2 pt-2 border-t">
            {reporte.descripcionReaccion}
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
