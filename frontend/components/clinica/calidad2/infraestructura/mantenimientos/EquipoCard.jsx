'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  MoreVertical,
  Calendar,
  AlertCircle,
  CheckCircle,
  Wrench,
  Eye,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const ESTADO_COLORS = {
  ACTIVO: 'bg-green-100 text-green-800',
  INACTIVO: 'bg-gray-100 text-gray-800',
  MANTENIMIENTO: 'bg-yellow-100 text-yellow-800',
  FUERA_SERVICIO: 'bg-red-100 text-red-800',
};

const ESTADO_ICONS = {
  ACTIVO: CheckCircle,
  INACTIVO: AlertCircle,
  MANTENIMIENTO: Wrench,
  FUERA_SERVICIO: AlertCircle,
};

export default function EquipoCard({ equipo, onView, onEdit, onDelete, onTimeline }) {
  const EstadoIcon = ESTADO_ICONS[equipo.estado] || AlertCircle;

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">
          {equipo.nombre}
        </CardTitle>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onView(equipo)}>
              <Eye className="mr-2 h-4 w-4" />
              Ver detalles
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onTimeline(equipo)}>
              <Calendar className="mr-2 h-4 w-4" />
              Ver timeline
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onEdit(equipo)}>
              <Wrench className="mr-2 h-4 w-4" />
              Editar
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onDelete(equipo)}
              className="text-red-600"
            >
              Eliminar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {/* Código y Estado */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">Código: {equipo.codigo}</span>
            <Badge className={ESTADO_COLORS[equipo.estado]}>
              <EstadoIcon className="w-3 h-3 mr-1" />
              {equipo.estado}
            </Badge>
          </div>

          {/* Ubicación */}
          <div className="text-sm">
            <span className="text-gray-500">Ubicación:</span>
            <span className="ml-2 font-medium">{equipo.ubicacion}</span>
          </div>

          {/* Información adicional */}
          {equipo.marca && (
            <div className="text-xs text-gray-500">
              {equipo.marca} {equipo.modelo && `- ${equipo.modelo}`}
            </div>
          )}

          {/* Última inspección */}
          {equipo.fechaUltimaInspeccion && (
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <Calendar className="w-3 h-3" />
              Última inspección: {new Date(equipo.fechaUltimaInspeccion).toLocaleDateString()}
            </div>
          )}

          {/* Estadísticas de mantenimientos */}
          {equipo.mantenimientos && equipo.mantenimientos.length > 0 && (
            <div className="pt-2 border-t border-gray-200">
              <div className="text-xs text-gray-500">
                {equipo.mantenimientos.length} mantenimiento(s) registrado(s)
              </div>
            </div>
          )}

          {/* Botón de acción rápida */}
          <Button
            onClick={() => onTimeline(equipo)}
            className="w-full mt-2"
            variant="outline"
            size="sm"
          >
            <Calendar className="w-4 h-4 mr-2" />
            Ver Timeline
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
