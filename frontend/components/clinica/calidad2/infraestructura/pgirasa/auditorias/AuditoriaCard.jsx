'use client';

import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Edit, Trash2, Calendar, FileText, Users, CheckCircle, XCircle, Clock, PlayCircle } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function AuditoriaCard({ auditoria, onEdit, onDelete, onCambiarEstado }) {
  const getTipoBadge = () => {
    if (auditoria.tipo === 'INTERNA') {
      return <Badge className="bg-blue-600 hover:bg-blue-700">Interna</Badge>;
    }
    return <Badge className="bg-purple-600 hover:bg-purple-700">Externa</Badge>;
  };

  const getEstadoBadge = () => {
    switch (auditoria.estado) {
      case 'PROGRAMADA':
        return (
          <Badge variant="outline" className="border-orange-500 text-orange-700 bg-orange-50">
            <Clock className="w-3 h-3 mr-1" />
            Programada
          </Badge>
        );
      case 'EN_CURSO':
        return (
          <Badge variant="outline" className="border-yellow-500 text-yellow-700 bg-yellow-50">
            <PlayCircle className="w-3 h-3 mr-1" />
            En Curso
          </Badge>
        );
      case 'COMPLETADA':
        return (
          <Badge variant="outline" className="border-green-500 text-green-700 bg-green-50">
            <CheckCircle className="w-3 h-3 mr-1" />
            Completada
          </Badge>
        );
      case 'CANCELADA':
        return (
          <Badge variant="outline" className="border-red-500 text-red-700 bg-red-50">
            <XCircle className="w-3 h-3 mr-1" />
            Cancelada
          </Badge>
        );
      default:
        return <Badge variant="secondary">{auditoria.estado}</Badge>;
    }
  };

  const handleEstadoChange = (nuevoEstado) => {
    if (window.confirm(`¿Cambiar estado a ${nuevoEstado}?`)) {
      onCambiarEstado(auditoria.id, nuevoEstado);
    }
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="w-5 h-5 text-blue-600" />
              <h3 className="font-semibold text-gray-900 truncate" title={auditoria.nombre}>
                {auditoria.nombre}
              </h3>
            </div>
            <p className="text-xs text-gray-500 font-mono">{auditoria.codigo}</p>
            <div className="flex flex-wrap gap-2 mt-2">
              {getTipoBadge()}
              {getEstadoBadge()}
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Fechas */}
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2 text-gray-600">
            <Calendar className="w-4 h-4 flex-shrink-0" />
            <div>
              <span className="font-medium">Inicio:</span>{' '}
              {format(new Date(auditoria.fechaInicio), 'dd/MM/yyyy', { locale: es })}
            </div>
          </div>
          {auditoria.fechaFin && (
            <div className="flex items-center gap-2 text-gray-600 ml-6">
              <span className="font-medium">Fin:</span>{' '}
              {format(new Date(auditoria.fechaFin), 'dd/MM/yyyy', { locale: es })}
            </div>
          )}
        </div>

        {/* Equipo */}
        {auditoria.equipo && auditoria.equipo.length > 0 && (
          <div className="flex items-start gap-2 text-sm text-gray-600">
            <Users className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="font-medium">Equipo:</span>{' '}
              <span className="text-xs">{auditoria.equipo.join(', ')}</span>
            </div>
          </div>
        )}

        {/* Objetivo (truncado) */}
        {auditoria.objetivo && (
          <div className="text-xs text-gray-500 pt-2 border-t">
            <span className="font-medium">Objetivo:</span>{' '}
            {auditoria.objetivo.length > 100
              ? `${auditoria.objetivo.substring(0, 100)}...`
              : auditoria.objetivo}
          </div>
        )}

        {/* Documentos */}
        {auditoria.documentos && auditoria.documentos.length > 0 && (
          <div className="text-xs text-gray-500">
            📄 {auditoria.documentos.length} documento(s) adjunto(s)
          </div>
        )}

        {/* Cambiar estado */}
        {auditoria.estado !== 'CANCELADA' && auditoria.estado !== 'COMPLETADA' && (
          <div className="pt-3 border-t">
            <Select onValueChange={handleEstadoChange} value={auditoria.estado}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Cambiar estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PROGRAMADA">Programada</SelectItem>
                <SelectItem value="EN_CURSO">En Curso</SelectItem>
                <SelectItem value="COMPLETADA">Completada</SelectItem>
                <SelectItem value="CANCELADA">Cancelada</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Acciones */}
        <div className="flex gap-2 pt-3 border-t">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(auditoria)}
            className="flex-1"
          >
            <Edit className="w-4 h-4 mr-1" />
            Editar
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(auditoria.id)}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>

        {/* Creador */}
        <div className="text-xs text-gray-400 pt-2 border-t">
          Creada por: {auditoria.creador?.nombre} {auditoria.creador?.apellido}
        </div>
      </CardContent>
    </Card>
  );
}
