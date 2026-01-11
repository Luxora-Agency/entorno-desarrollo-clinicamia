'use client';

import { FileText, FileSpreadsheet, FileImage, File, Download, Trash2, MoreVertical, Eye, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

function getFileIcon(tipo) {
  if (tipo?.includes('pdf')) return <FileText className="w-8 h-8 text-red-500" />;
  if (tipo?.includes('word') || tipo?.includes('document')) return <FileText className="w-8 h-8 text-blue-500" />;
  if (tipo?.includes('sheet') || tipo?.includes('excel')) return <FileSpreadsheet className="w-8 h-8 text-green-500" />;
  if (tipo?.includes('image')) return <FileImage className="w-8 h-8 text-purple-500" />;
  return <File className="w-8 h-8 text-gray-500" />;
}

function formatFileSize(bytes) {
  if (!bytes) return '0 B';
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
}

export function DocumentGrid({
  documents = [],
  onView,
  onEdit,
  onDelete,
  onDownload,
  showActions = true,
  emptyMessage = 'No hay documentos',
  renderExtra,
  extraActions,
}) {
  if (documents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-gray-500">
        <FileText className="w-12 h-12 mb-4 opacity-50" />
        <p>{emptyMessage}</p>
      </div>
    );
  }

  const handleDownload = (doc) => {
    if (onDownload) {
      onDownload(doc);
    } else {
      // Default download behavior
      const url = doc.archivoUrl?.startsWith('http')
        ? doc.archivoUrl
        : `${API_BASE_URL.replace('/api', '')}${doc.archivoUrl}`;
      window.open(url, '_blank');
    }
  };

  const handleView = (doc) => {
    if (onView) {
      onView(doc);
    } else {
      handleDownload(doc);
    }
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      {documents.map((doc) => (
        <Card
          key={doc.id}
          className="p-4 hover:shadow-md transition-shadow cursor-pointer group"
          onClick={() => handleView(doc)}
        >
          <div className="flex flex-col items-center">
            <div className="mb-3">
              {getFileIcon(doc.archivoTipo)}
            </div>
            <p className="text-sm font-medium text-center truncate w-full" title={doc.nombre}>
              {doc.nombre || doc.archivoNombre}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {formatFileSize(doc.archivoTamano)}
            </p>
            {doc.createdAt && (
              <p className="text-xs text-gray-400 mt-1">
                {formatDistanceToNow(new Date(doc.createdAt), { addSuffix: true, locale: es })}
              </p>
            )}
            {renderExtra && renderExtra(doc)}
          </div>

          {showActions && (
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleView(doc); }}>
                    <Eye className="w-4 h-4 mr-2" />
                    Ver
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleDownload(doc); }}>
                    <Download className="w-4 h-4 mr-2" />
                    Descargar
                  </DropdownMenuItem>
                  {onEdit && (
                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(doc); }}>
                      <Edit className="w-4 h-4 mr-2" />
                      Editar
                    </DropdownMenuItem>
                  )}
                  {onDelete && (
                    <DropdownMenuItem
                      className="text-red-600"
                      onClick={(e) => { e.stopPropagation(); onDelete(doc.id); }}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Eliminar
                    </DropdownMenuItem>
                  )}
                  {extraActions && extraActions(doc)}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </Card>
      ))}
    </div>
  );
}

export function DocumentList({
  documents = [],
  onView,
  onEdit,
  onDelete,
  onDownload,
  showActions = true,
  emptyMessage = 'No hay documentos',
}) {
  if (documents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-gray-500">
        <FileText className="w-12 h-12 mb-4 opacity-50" />
        <p>{emptyMessage}</p>
      </div>
    );
  }

  const handleDownload = (doc) => {
    if (onDownload) {
      onDownload(doc);
    } else {
      const url = doc.archivoUrl?.startsWith('http')
        ? doc.archivoUrl
        : `${API_BASE_URL.replace('/api', '')}${doc.archivoUrl}`;
      window.open(url, '_blank');
    }
  };

  return (
    <div className="space-y-2">
      {documents.map((doc) => (
        <div
          key={doc.id}
          className="flex items-center gap-4 p-3 border rounded-lg hover:bg-gray-50 group"
        >
          {getFileIcon(doc.archivoTipo)}
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">{doc.nombre || doc.archivoNombre}</p>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span>{formatFileSize(doc.archivoTamano)}</span>
              {doc.createdAt && (
                <>
                  <span>-</span>
                  <span>{formatDistanceToNow(new Date(doc.createdAt), { addSuffix: true, locale: es })}</span>
                </>
              )}
            </div>
          </div>

          {showActions && (
            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              {onView && (
                <Button variant="ghost" size="sm" onClick={() => onView(doc)}>
                  <Eye className="w-4 h-4" />
                </Button>
              )}
              <Button variant="ghost" size="sm" onClick={() => handleDownload(doc)}>
                <Download className="w-4 h-4" />
              </Button>
              {onEdit && (
                <Button variant="ghost" size="sm" onClick={() => onEdit(doc)}>
                  <Edit className="w-4 h-4" />
                </Button>
              )}
              {onDelete && (
                <Button variant="ghost" size="sm" className="text-red-600" onClick={() => onDelete(doc.id)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
