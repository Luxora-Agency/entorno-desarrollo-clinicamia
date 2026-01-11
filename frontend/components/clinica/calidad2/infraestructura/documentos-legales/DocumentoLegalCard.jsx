'use client';

import { FileText, Calendar, Building2, Edit, Trash2, Download, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function DocumentoLegalCard({ documento, onEdit, onDelete }) {
  const getEstadoBadge = () => {
    if (!documento.tieneVencimiento) {
      return <Badge variant="secondary">Sin vencimiento</Badge>;
    }

    switch (documento.estadoVencimiento) {
      case 'VENCIDO':
        return (
          <Badge variant="destructive" className="gap-1">
            <AlertTriangle className="w-3 h-3" />
            Vencido
          </Badge>
        );
      case 'URGENTE':
        return (
          <Badge className="bg-orange-600 hover:bg-orange-700 gap-1">
            <AlertTriangle className="w-3 h-3" />
            Urgente ({documento.diasRestantes}d)
          </Badge>
        );
      case 'PROXIMO':
        return (
          <Badge className="bg-yellow-600 hover:bg-yellow-700">
            Próximo ({documento.diasRestantes}d)
          </Badge>
        );
      case 'ADVERTENCIA':
        return (
          <Badge className="bg-blue-600 hover:bg-blue-700">
            {documento.diasRestantes} días
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary" className="bg-green-50 text-green-700 border-green-200">
            Vigente
          </Badge>
        );
    }
  };

  const getCardBorderColor = () => {
    if (!documento.tieneVencimiento) return 'border-gray-200';

    switch (documento.estadoVencimiento) {
      case 'VENCIDO':
        return 'border-red-300 border-l-4 border-l-red-600';
      case 'URGENTE':
        return 'border-orange-300 border-l-4 border-l-orange-600';
      case 'PROXIMO':
        return 'border-yellow-300 border-l-4 border-l-yellow-600';
      case 'ADVERTENCIA':
        return 'border-blue-300 border-l-4 border-l-blue-600';
      default:
        return 'border-gray-200';
    }
  };

  return (
    <Card className={`hover:shadow-lg transition-shadow ${getCardBorderColor()}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="w-5 h-5 text-blue-600 flex-shrink-0" />
              <h3 className="font-semibold text-gray-900 truncate" title={documento.nombre}>
                {documento.nombre}
              </h3>
            </div>
            {getEstadoBadge()}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Tipo de documento */}
        <div className="flex items-center gap-2 text-sm">
          <Badge variant="outline">{documento.tipoDocumento}</Badge>
        </div>

        {/* Número de documento */}
        {documento.numeroDocumento && (
          <div className="text-sm text-gray-600">
            <span className="font-medium">N°:</span> {documento.numeroDocumento}
          </div>
        )}

        {/* Entidad emisora */}
        {documento.entidadEmisora && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Building2 className="w-4 h-4" />
            <span className="truncate">{documento.entidadEmisora}</span>
          </div>
        )}

        {/* Fechas */}
        <div className="space-y-1">
          {documento.fechaEmision && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Calendar className="w-4 h-4" />
              <span>
                Emisión: {format(new Date(documento.fechaEmision), 'dd/MM/yyyy', { locale: es })}
              </span>
            </div>
          )}

          {documento.fechaVencimiento && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Calendar className="w-4 h-4" />
              <span>
                Vencimiento: {format(new Date(documento.fechaVencimiento), 'dd/MM/yyyy', { locale: es })}
              </span>
            </div>
          )}
        </div>

        {/* Carpeta */}
        {documento.carpeta && (
          <div className="text-xs text-gray-500">
            📁 {documento.carpeta.nombre}
          </div>
        )}

        {/* Alertas activas */}
        {documento.alertas && documento.alertas.length > 0 && (
          <div className="flex items-center gap-1 text-xs text-orange-600">
            <AlertTriangle className="w-3 h-3" />
            <span>{documento.alertas.length} alerta(s) activa(s)</span>
          </div>
        )}

        {/* Descripción */}
        {documento.descripcion && (
          <p className="text-sm text-gray-600 line-clamp-2" title={documento.descripcion}>
            {documento.descripcion}
          </p>
        )}

        {/* Información del archivo */}
        <div className="text-xs text-gray-500 pt-2 border-t">
          {documento.archivoNombre && (
            <div className="truncate" title={documento.archivoNombre}>
              📄 {documento.archivoNombre}
            </div>
          )}
          {documento.archivoTamano && (
            <div className="mt-1">
              Tamaño: {(documento.archivoTamano / 1024 / 1024).toFixed(2)} MB
            </div>
          )}
        </div>

        {/* Acciones */}
        <div className="flex gap-2 pt-3 border-t">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => window.open(documento.archivoUrl, '_blank')}
            className="flex-1"
          >
            <Download className="w-4 h-4 mr-1" />
            Ver
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(documento)}
            className="flex-1"
          >
            <Edit className="w-4 h-4 mr-1" />
            Editar
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(documento.id)}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>

        {/* Metadatos */}
        <div className="text-xs text-gray-400 pt-2 border-t">
          Subido por: {documento.usuario?.nombre} {documento.usuario?.apellido}
          <div className="mt-1">
            {format(new Date(documento.createdAt), "dd/MM/yyyy 'a las' HH:mm", { locale: es })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
