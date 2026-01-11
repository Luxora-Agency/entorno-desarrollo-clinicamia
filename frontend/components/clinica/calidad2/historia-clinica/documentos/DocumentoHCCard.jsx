'use client';

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  MoreVertical,
  FileText,
  Edit,
  Trash2,
  CheckCircle,
  Clock,
  History,
  Share2,
  Download,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

/**
 * Card para visualizar un documento de HC
 *
 * Muestra:
 * - Información básica (código, nombre, tipo, categoría)
 * - Estado con badge coloreado
 * - Versión actual
 * - Fechas relevantes
 * - Acciones contextuales según estado
 */
export default function DocumentoHCCard({
  documento,
  onEdit,
  onDelete,
  onAprobar,
  onShowVersiones,
  onShowDistribucion,
}) {
  // Determinar color del badge según estado
  const getEstadoBadge = (estado) => {
    const badges = {
      BORRADOR: { variant: 'secondary', label: 'Borrador' },
      EN_REVISION: { variant: 'warning', label: 'En Revisión', className: 'bg-orange-500 hover:bg-orange-600' },
      VIGENTE: { variant: 'default', label: 'Vigente', className: 'bg-green-600 hover:bg-green-700' },
      OBSOLETO: { variant: 'destructive', label: 'Obsoleto' },
      ARCHIVADO: { variant: 'outline', label: 'Archivado' },
    };
    return badges[estado] || { variant: 'secondary', label: estado };
  };

  // Determinar color del badge según tipo
  const getTipoBadge = (tipo) => {
    const badges = {
      MANUAL: { className: 'bg-blue-100 text-blue-800' },
      PROCEDIMIENTO: { className: 'bg-purple-100 text-purple-800' },
      INSTRUCTIVO: { className: 'bg-cyan-100 text-cyan-800' },
      FORMATO: { className: 'bg-amber-100 text-amber-800' },
      POLITICA: { className: 'bg-indigo-100 text-indigo-800' },
      CERTIFICACION: { className: 'bg-green-100 text-green-800' },
      CONTRATO: { className: 'bg-pink-100 text-pink-800' },
      REFERENCIA: { className: 'bg-gray-100 text-gray-800' },
    };
    return badges[tipo] || { className: 'bg-gray-100 text-gray-800' };
  };

  const estadoBadge = getEstadoBadge(documento.estado);
  const tipoBadge = getTipoBadge(documento.tipo);

  // Mostrar botón de aprobación según estado
  const canRevisar = documento.estado === 'BORRADOR';
  const canAprobar = documento.estado === 'EN_REVISION';
  const canDistribuir = documento.estado === 'VIGENTE';

  return (
    <Card className="flex flex-col h-full">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <code className="text-xs font-mono text-muted-foreground">
                {documento.codigo}
              </code>
            </div>
            <CardTitle className="text-base line-clamp-2">
              {documento.nombre}
            </CardTitle>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(documento)}>
                <Edit className="mr-2 h-4 w-4" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onShowVersiones(documento)}>
                <History className="mr-2 h-4 w-4" />
                Ver Versiones ({documento._count?.versiones || 0})
              </DropdownMenuItem>
              {canDistribuir && (
                <DropdownMenuItem onClick={() => onShowDistribucion(documento)}>
                  <Share2 className="mr-2 h-4 w-4" />
                  Distribuir
                </DropdownMenuItem>
              )}
              <DropdownMenuItem>
                <Download className="mr-2 h-4 w-4" />
                Descargar
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => onDelete(documento.id)}
                className="text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Eliminar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <CardDescription className="line-clamp-2">
          {documento.descripcion || 'Sin descripción'}
        </CardDescription>
      </CardHeader>

      <CardContent className="flex-1">
        <div className="space-y-3">
          {/* Badges de tipo y categoría */}
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline" className={tipoBadge.className}>
              {documento.tipo}
            </Badge>
            <Badge variant="outline">
              {documento.categoria}
            </Badge>
          </div>

          {/* Estado */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Estado:</span>
            <Badge variant={estadoBadge.variant} className={estadoBadge.className}>
              {estadoBadge.label}
            </Badge>
          </div>

          {/* Versión */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Versión:</span>
            <span className="text-sm font-medium">{documento.version}</span>
          </div>

          {/* Fechas */}
          <div className="space-y-1 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Emisión: {format(new Date(documento.fechaEmision), 'dd/MM/yyyy', { locale: es })}
            </div>
            {documento.fechaRevision && (
              <div className="flex items-center gap-1">
                <CheckCircle className="h-3 w-3 text-green-600" />
                Revisado: {format(new Date(documento.fechaRevision), 'dd/MM/yyyy', { locale: es })}
              </div>
            )}
          </div>

          {/* Responsables */}
          <div className="space-y-1 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Elaborado por:</span>
              <span className="font-medium">
                {documento.elaborador
                  ? `${documento.elaborador.nombre} ${documento.elaborador.apellido}`
                  : 'N/A'}
              </span>
            </div>
            {documento.revisor && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Revisado por:</span>
                <span className="font-medium">
                  {`${documento.revisor.nombre} ${documento.revisor.apellido}`}
                </span>
              </div>
            )}
            {documento.aprobador && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Aprobado por:</span>
                <span className="font-medium">
                  {`${documento.aprobador.nombre} ${documento.aprobador.apellido}`}
                </span>
              </div>
            )}
          </div>

          {/* Distribución */}
          {canDistribuir && documento._count && (
            <div className="text-xs text-muted-foreground">
              Distribuido a: {documento._count.distribucion || 0} usuario(s)
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter className="flex gap-2">
        {canRevisar && (
          <Button
            size="sm"
            variant="outline"
            className="flex-1"
            onClick={() => onAprobar(documento, 'revisar')}
          >
            <CheckCircle className="mr-2 h-4 w-4" />
            Revisar
          </Button>
        )}
        {canAprobar && (
          <Button
            size="sm"
            className="flex-1"
            onClick={() => onAprobar(documento, 'aprobar')}
          >
            <CheckCircle className="mr-2 h-4 w-4" />
            Aprobar
          </Button>
        )}
        {canDistribuir && (
          <Button
            size="sm"
            variant="secondary"
            className="flex-1"
            onClick={() => onShowDistribucion(documento)}
          >
            <Share2 className="mr-2 h-4 w-4" />
            Distribuir
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
