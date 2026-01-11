'use client';

import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Edit, Trash2, FileText, Calendar, Building2 } from 'lucide-react';

export default function ConceptoSanitarioCard({ concepto, onEdit, onDelete }) {
  const getEstadoBadge = () => {
    switch (concepto.estadoGeneral) {
      case 'CONFORME':
        return (
          <Badge className="bg-green-600 hover:bg-green-700">
            Conforme
          </Badge>
        );
      case 'REQUIERE_MEJORA':
        return (
          <Badge className="bg-yellow-600 hover:bg-yellow-700">
            Requiere Mejora
          </Badge>
        );
      case 'NO_CONFORME':
        return (
          <Badge variant="destructive">
            No Conforme
          </Badge>
        );
      default:
        return <Badge variant="secondary">{concepto.estadoGeneral}</Badge>;
    }
  };

  const getTipoInspeccionBadge = () => {
    const tipos = {
      ORDINARIA: 'default',
      EXTRAORDINARIA: 'destructive',
      SEGUIMIENTO: 'secondary',
    };
    return (
      <Badge variant={tipos[concepto.tipoInspeccion] || 'secondary'}>
        {concepto.tipoInspeccion}
      </Badge>
    );
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="w-5 h-5 text-blue-600" />
              <h3 className="font-semibold text-gray-900">
                Concepto #{concepto.numeroConcepto}
              </h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {getEstadoBadge()}
              {getTipoInspeccionBadge()}
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Porcentaje de compliance */}
        <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
          <span className="text-sm font-medium text-blue-900">Compliance</span>
          <span className="text-2xl font-bold text-blue-600">
            {(Number(concepto.porcentajeCompliance) || 0).toFixed(1)}%
          </span>
        </div>

        {/* Fecha de inspección */}
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Calendar className="w-4 h-4" />
          <span>
            {format(new Date(concepto.fechaInspeccion), 'dd/MM/yyyy', { locale: es })}
          </span>
        </div>

        {/* Entidad inspectora */}
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Building2 className="w-4 h-4" />
          <span className="truncate" title={concepto.entidadInspectora}>
            {concepto.entidadInspectora}
          </span>
        </div>

        {/* Información de ítems */}
        {concepto.items && (
          <div className="text-xs text-gray-500 pt-2 border-t">
            {concepto.items.filter(i => i.cumple === true).length} de {concepto.items.length} ítems cumplidos
          </div>
        )}

        {/* Documentos */}
        {concepto.documentos && concepto.documentos.length > 0 && (
          <div className="text-xs text-gray-500">
            📄 {concepto.documentos.length} documento(s) adjunto(s)
          </div>
        )}

        {/* Acciones */}
        <div className="flex gap-2 pt-3 border-t">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(concepto)}
            className="flex-1"
          >
            <Edit className="w-4 h-4 mr-1" />
            Editar
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(concepto.id)}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>

        {/* Evaluador */}
        <div className="text-xs text-gray-400 pt-2 border-t">
          Evaluado por: {concepto.evaluador?.nombre} {concepto.evaluador?.apellido}
        </div>
      </CardContent>
    </Card>
  );
}
