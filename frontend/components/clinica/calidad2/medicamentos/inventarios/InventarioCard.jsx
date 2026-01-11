'use client';

import { AlertTriangle, Clock, Package, Edit, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function InventarioCard({ item, onEdit, onDelete }) {
  const today = new Date();
  const fechaVencimiento = new Date(item.fechaVencimiento);
  const isVencido = fechaVencimiento < today;
  const diasParaVencer = item.diasParaVencer || 0;

  // Determine alert level
  let alertColor = 'bg-green-100 text-green-800';
  let alertIcon = null;
  let alertText = null;

  if (isVencido) {
    alertColor = 'bg-red-100 text-red-800';
    alertIcon = <AlertTriangle className="w-3.5 h-3.5" />;
    alertText = 'Vencido';
  } else if (diasParaVencer <= 30) {
    alertColor = 'bg-red-100 text-red-600';
    alertIcon = <Clock className="w-3.5 h-3.5" />;
    alertText = `Vence en ${diasParaVencer} días`;
  } else if (diasParaVencer <= 60) {
    alertColor = 'bg-yellow-100 text-yellow-700';
    alertIcon = <Clock className="w-3.5 h-3.5" />;
    alertText = `Vence en ${diasParaVencer} días`;
  } else if (diasParaVencer <= 90) {
    alertColor = 'bg-yellow-50 text-yellow-600';
    alertIcon = <Clock className="w-3.5 h-3.5" />;
    alertText = `Vence en ${diasParaVencer} días`;
  }

  const stockPercentage = item.stockMinimo
    ? (item.cantidadActual / item.stockMinimo) * 100
    : 100;

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-500 font-medium">{item.codigo}</p>
            <h4 className="font-semibold text-gray-900 mt-1 line-clamp-2 text-sm">
              {item.nombre}
            </h4>
          </div>
          {alertText && (
            <Badge className={`${alertColor} flex items-center gap-1 text-xs shrink-0`}>
              {alertIcon}
              {alertText}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Type-specific info */}
        {item.tipo === 'MEDICAMENTO' && (
          <div className="text-xs space-y-1">
            {item.principioActivo && (
              <div className="flex items-center gap-2">
                <span className="text-gray-500">P. Activo:</span>
                <span className="font-medium text-gray-700">{item.principioActivo}</span>
              </div>
            )}
            {item.concentracion && (
              <div className="flex items-center gap-2">
                <span className="text-gray-500">Concentración:</span>
                <span className="font-medium text-gray-700">{item.concentracion}</span>
              </div>
            )}
            {item.formaFarmaceutica && (
              <div className="flex items-center gap-2">
                <span className="text-gray-500">Forma:</span>
                <span className="font-medium text-gray-700">{item.formaFarmaceutica}</span>
              </div>
            )}
            {item.laboratorio && (
              <div className="flex items-center gap-2">
                <span className="text-gray-500">Laboratorio:</span>
                <span className="font-medium text-gray-700">{item.laboratorio}</span>
              </div>
            )}
          </div>
        )}

        {item.tipo === 'DISPOSITIVO_MEDICO' && (
          <div className="text-xs space-y-1">
            {item.fabricante && (
              <div className="flex items-center gap-2">
                <span className="text-gray-500">Fabricante:</span>
                <span className="font-medium text-gray-700">{item.fabricante}</span>
              </div>
            )}
            {item.clasificacionRiesgo && (
              <div className="flex items-center gap-2">
                <span className="text-gray-500">Clasificación:</span>
                <span className="font-medium text-gray-700">{item.clasificacionRiesgo}</span>
              </div>
            )}
          </div>
        )}

        {item.tipo === 'INSUMO_MEDICO_QUIRURGICO' && (
          <div className="text-xs space-y-1">
            {item.fabricante && (
              <div className="flex items-center gap-2">
                <span className="text-gray-500">Fabricante:</span>
                <span className="font-medium text-gray-700">{item.fabricante}</span>
              </div>
            )}
          </div>
        )}

        {/* Common info */}
        <div className="text-xs space-y-1 pt-2 border-t">
          <div className="flex items-center gap-2">
            <span className="text-gray-500">Lote:</span>
            <span className="font-medium text-gray-700">{item.lote}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray-500">Vencimiento:</span>
            <span className="font-medium text-gray-700">
              {new Date(item.fechaVencimiento).toLocaleDateString()}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Package className="w-3.5 h-3.5 text-gray-400" />
            <span className="font-medium text-gray-900">
              {item.cantidadActual} {item.unidadMedida}
            </span>
            {item.stockMinimo && (
              <span className="text-xs text-gray-500">
                (Min: {item.stockMinimo})
              </span>
            )}
          </div>
        </div>

        {/* Stock indicator */}
        {item.stockMinimo && (
          <div className="pt-2">
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all ${
                  stockPercentage < 50
                    ? 'bg-red-500'
                    : stockPercentage < 100
                    ? 'bg-yellow-500'
                    : 'bg-green-500'
                }`}
                style={{ width: `${Math.min(stockPercentage, 100)}%` }}
              />
            </div>
          </div>
        )}

        {/* Stock alert */}
        {item.tieneAlertaStock && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-2">
            <div className="flex items-center gap-2 text-xs text-orange-700">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span className="font-medium">Stock por debajo del mínimo</span>
            </div>
          </div>
        )}

        {/* Location */}
        {item.ubicacionFisica && (
          <div className="text-xs text-gray-500 pt-2 border-t">
            <span className="font-medium">Ubicación:</span> {item.ubicacionFisica}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2 pt-3 border-t">
          <Button
            size="sm"
            variant="outline"
            className="flex-1"
            onClick={() => onEdit(item)}
          >
            <Edit className="w-3.5 h-3.5 mr-1" />
            Editar
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={() => onDelete(item.id)}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
