import { Card, CardContent } from '@/components/ui/card';
import { Pill, DollarSign, AlertTriangle, FileText } from 'lucide-react';

export function ProductStats({ stats }) {
  if (!stats) return null;

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const formatInventario = (value) => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}K`;
    }
    return value.toString();
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <Card className="shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 p-2 rounded-lg">
              <Pill className="w-5 h-5 text-blue-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-gray-600">Total Productos</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              <p className="text-xs text-gray-500 mt-1">
                {stats.activos} Activo · {stats.inactivos} Inactivo
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="bg-green-100 p-2 rounded-lg">
              <DollarSign className="w-5 h-5 text-green-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-gray-600">Valor Inventario</p>
              <p className="text-2xl font-bold text-gray-900">{formatInventario(stats.valorInventario)}</p>
              <p className="text-xs text-gray-500 mt-1">{formatCurrency(stats.valorInventario)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="bg-orange-100 p-2 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-orange-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-gray-600">Bajo Stock</p>
              <p className="text-2xl font-bold text-gray-900">{stats.bajoStock}</p>
              <p className="text-xs text-gray-500 mt-1">Productos con cantidad inferior a la alerta mínima</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="bg-red-100 p-2 rounded-lg">
              <FileText className="w-5 h-5 text-red-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-gray-600">Requieren Receta</p>
              <p className="text-2xl font-bold text-gray-900">{stats.requierenReceta}</p>
              <p className="text-xs text-gray-500 mt-1">Productos controlados</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
