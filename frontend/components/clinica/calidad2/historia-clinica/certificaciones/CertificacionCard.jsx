'use client';

import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  FileCheck,
  Calendar,
  Building2,
  User,
  MoreVertical,
  Edit,
  Trash2,
  Download,
  AlertTriangle,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { es } from 'date-fns/locale';

export default function CertificacionCard({ certificacion, onEdit, onDelete }) {
  // Calcular días para vencer
  const diasParaVencer = Math.ceil(
    (new Date(certificacion.fechaVencimiento) - new Date()) / (1000 * 60 * 60 * 24)
  );

  // Determinar color y badge según estado
  const getEstadoBadge = () => {
    switch (certificacion.estado) {
      case 'VIGENTE':
        return {
          variant: 'default',
          className: 'bg-green-500',
          icon: CheckCircle2,
          label: 'Vigente',
        };
      case 'EN_RENOVACION':
        return {
          variant: 'default',
          className: 'bg-yellow-500',
          icon: AlertTriangle,
          label: 'En Renovación',
        };
      case 'VENCIDA':
        return {
          variant: 'destructive',
          className: 'bg-red-500',
          icon: XCircle,
          label: 'Vencida',
        };
      default:
        return {
          variant: 'secondary',
          className: '',
          icon: FileCheck,
          label: certificacion.estado,
        };
    }
  };

  const estadoBadge = getEstadoBadge();
  const IconEstado = estadoBadge.icon;

  // Determinar color del indicador de vencimiento
  const getVencimientoColor = () => {
    if (diasParaVencer <= 0) return 'text-red-600 bg-red-50 border-red-200';
    if (diasParaVencer <= 15) return 'text-red-600 bg-red-50 border-red-200';
    if (diasParaVencer <= 30) return 'text-orange-600 bg-orange-50 border-orange-200';
    if (diasParaVencer <= 60) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-green-600 bg-green-50 border-green-200';
  };

  // Mapeo de tipos
  const getTipoLabel = (tipo) => {
    const tipos = {
      SOFTWARE_HC: 'Software HC',
      HABILITACION: 'Habilitación',
      ACREDITACION: 'Acreditación',
      ISO: 'ISO',
      OTRO: 'Otro',
    };
    return tipos[tipo] || tipo;
  };

  const handleDownload = () => {
    if (certificacion.archivoUrl) {
      window.open(certificacion.archivoUrl, '_blank');
    }
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant={estadoBadge.variant} className={estadoBadge.className}>
                <IconEstado className="h-3 w-3 mr-1" />
                {estadoBadge.label}
              </Badge>
              <Badge variant="outline">{getTipoLabel(certificacion.tipo)}</Badge>
            </div>
            <h3 className="font-semibold text-lg line-clamp-2">{certificacion.nombre}</h3>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(certificacion)}>
                <Edit className="h-4 w-4 mr-2" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleDownload} disabled={!certificacion.archivoUrl}>
                <Download className="h-4 w-4 mr-2" />
                Descargar
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onDelete(certificacion.id)}
                className="text-red-600"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Eliminar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Entidad emisora */}
        <div className="flex items-start gap-2">
          <Building2 className="h-4 w-4 text-gray-400 mt-0.5" />
          <div className="flex-1">
            <p className="text-xs text-gray-500">Entidad Emisora</p>
            <p className="text-sm font-medium">{certificacion.entidadEmisora}</p>
          </div>
        </div>

        {/* Número de registro */}
        {certificacion.numeroRegistro && (
          <div className="flex items-start gap-2">
            <FileCheck className="h-4 w-4 text-gray-400 mt-0.5" />
            <div className="flex-1">
              <p className="text-xs text-gray-500">Número de Registro</p>
              <p className="text-sm font-medium">{certificacion.numeroRegistro}</p>
            </div>
          </div>
        )}

        {/* Fechas */}
        <div className="grid grid-cols-2 gap-2">
          <div className="flex items-start gap-2">
            <Calendar className="h-4 w-4 text-gray-400 mt-0.5" />
            <div className="flex-1">
              <p className="text-xs text-gray-500">Emisión</p>
              <p className="text-sm">
                {format(new Date(certificacion.fechaEmision), 'dd/MM/yyyy', { locale: es })}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Calendar className="h-4 w-4 text-gray-400 mt-0.5" />
            <div className="flex-1">
              <p className="text-xs text-gray-500">Vencimiento</p>
              <p className="text-sm">
                {format(new Date(certificacion.fechaVencimiento), 'dd/MM/yyyy', { locale: es })}
              </p>
            </div>
          </div>
        </div>

        {/* Indicador de días para vencer */}
        <div className={`rounded-lg border p-3 ${getVencimientoColor()}`}>
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold">
              {diasParaVencer <= 0
                ? 'Vencida'
                : diasParaVencer === 1
                ? 'Vence mañana'
                : `${diasParaVencer} días para vencer`}
            </span>
            {diasParaVencer <= 15 && diasParaVencer > 0 && (
              <AlertTriangle className="h-5 w-5" />
            )}
          </div>
        </div>

        {/* Responsable */}
        {certificacion.responsableUsuario && (
          <div className="flex items-start gap-2">
            <User className="h-4 w-4 text-gray-400 mt-0.5" />
            <div className="flex-1">
              <p className="text-xs text-gray-500">Responsable</p>
              <p className="text-sm">
                {certificacion.responsableUsuario.nombre}{' '}
                {certificacion.responsableUsuario.apellido}
              </p>
            </div>
          </div>
        )}

        {/* Observaciones */}
        {certificacion.observaciones && (
          <div className="pt-2 border-t">
            <p className="text-xs text-gray-500 mb-1">Observaciones</p>
            <p className="text-sm line-clamp-2">{certificacion.observaciones}</p>
          </div>
        )}
      </CardContent>

      <CardFooter className="pt-3 border-t">
        <div className="flex items-center justify-between w-full text-xs text-gray-500">
          <span>
            Creada:{' '}
            {format(new Date(certificacion.createdAt), 'dd/MM/yyyy', { locale: es })}
          </span>
          {certificacion.updatedAt && (
            <span>
              Actualizada:{' '}
              {format(new Date(certificacion.updatedAt), 'dd/MM/yyyy', { locale: es })}
            </span>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}
