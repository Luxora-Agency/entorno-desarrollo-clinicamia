'use client';

import { FileText, Edit, Trash2, Plus, FileCheck } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const ESTADO_COLORS = {
  VIGENTE: 'bg-green-100 text-green-800 border-green-300',
  BORRADOR: 'bg-gray-100 text-gray-800 border-gray-300',
  EN_REVISION: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  OBSOLETO: 'bg-red-100 text-red-800 border-red-300',
};

const ESTADO_LABELS = {
  VIGENTE: 'Vigente',
  BORRADOR: 'Borrador',
  EN_REVISION: 'En Revisión',
  OBSOLETO: 'Obsoleto',
};

export default function FormatoCard({ formato, onEdit, onDelete, onCreateInstancia }) {
  const estadoColor = ESTADO_COLORS[formato.estado] || ESTADO_COLORS.BORRADOR;
  const estadoLabel = ESTADO_LABELS[formato.estado] || formato.estado;

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <FileText className="w-4 h-4 text-purple-600 flex-shrink-0" />
              <h4 className="font-semibold text-gray-900 text-sm truncate">
                {formato.codigo}
              </h4>
            </div>
            <p className="text-sm text-gray-700 font-medium">
              {formato.nombre}
            </p>
          </div>
          <Badge className={estadoColor}>
            {estadoLabel}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Categoria */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Categoría:</span>
          <span className="font-medium text-gray-900">{formato.categoria}</span>
        </div>

        {/* Version */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Versión:</span>
          <span className="font-medium text-gray-900">{formato.version}</span>
        </div>

        {/* Periodicidad */}
        {formato.periodicidad && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Periodicidad:</span>
            <span className="font-medium text-gray-900">{formato.periodicidad}</span>
          </div>
        )}

        {/* Instancias count */}
        {formato._count && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Instancias:</span>
            <span className="font-medium text-purple-700">
              {formato._count.instancias || 0}
            </span>
          </div>
        )}

        {/* Descripcion */}
        {formato.descripcion && (
          <div className="pt-2 border-t">
            <p className="text-xs text-gray-600 line-clamp-2">
              {formato.descripcion}
            </p>
          </div>
        )}

        {/* Creador */}
        {formato.creador && (
          <div className="text-xs text-gray-500 pt-2 border-t">
            Creado por: {formato.creador.nombre}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2 pt-3 border-t">
          {formato.estado === 'VIGENTE' && (
            <Button
              size="sm"
              variant="default"
              className="flex-1 bg-purple-600 hover:bg-purple-700"
              onClick={() => onCreateInstancia(formato)}
            >
              <Plus className="w-3.5 h-3.5 mr-1" />
              Instancia
            </Button>
          )}

          <Button
            size="sm"
            variant="outline"
            className={formato.estado === 'VIGENTE' ? '' : 'flex-1'}
            onClick={() => onEdit(formato)}
          >
            <Edit className="w-3.5 h-3.5 mr-1" />
            Editar
          </Button>

          <Button
            size="sm"
            variant="destructive"
            onClick={() => onDelete(formato.id)}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>

        {/* Download link */}
        {formato.archivoUrl && (
          <div className="pt-2">
            <a
              href={formato.archivoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-purple-600 hover:text-purple-700 hover:underline flex items-center gap-1"
            >
              <FileCheck className="w-3 h-3" />
              Descargar plantilla
            </a>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
