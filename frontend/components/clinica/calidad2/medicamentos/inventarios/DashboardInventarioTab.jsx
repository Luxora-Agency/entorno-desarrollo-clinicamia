'use client';

import { useState, useEffect } from 'react';
import { Package, AlertTriangle, Clock, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useCalidad2InventarioMedicamentos } from '@/hooks/useCalidad2InventarioMedicamentos';

export default function DashboardInventarioTab({ user }) {
  const { estadisticas, loading, getEstadisticas } = useCalidad2InventarioMedicamentos();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setRefreshing(true);
    await getEstadisticas();
    setRefreshing(false);
  };

  if (loading || refreshing) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
      </div>
    );
  }

  if (!estadisticas) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No hay datos disponibles</p>
      </div>
    );
  }

  const total = estadisticas.total || {
    items: 0,
    medicamentos: 0,
    dispositivos: 0,
    insumos: 0,
  };
  const alertas = estadisticas.alertas || {
    vencidos: 0,
    proximosVencer: 0,
    stockBajo: 0,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-1">Dashboard de Inventario</h3>
        <p className="text-sm text-gray-500">
          Resumen general del inventario de medicamentos, dispositivos e insumos
        </p>
      </div>

      {/* Total por Tipo */}
      <div>
        <h4 className="text-sm font-semibold text-gray-700 mb-3">Totales por Tipo</h4>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="py-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Package className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-3xl font-bold text-gray-900">{total.items}</p>
                  <p className="text-sm text-gray-500">Total Items</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="py-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <Package className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-3xl font-bold text-gray-900">{total.medicamentos}</p>
                  <p className="text-sm text-gray-500">Medicamentos</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="py-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-green-100 rounded-lg">
                  <Package className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-3xl font-bold text-gray-900">{total.dispositivos}</p>
                  <p className="text-sm text-gray-500">Dispositivos</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="py-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-teal-100 rounded-lg">
                  <Package className="w-6 h-6 text-teal-600" />
                </div>
                <div>
                  <p className="text-3xl font-bold text-gray-900">{total.insumos}</p>
                  <p className="text-sm text-gray-500">Insumos</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Alertas */}
      <div>
        <h4 className="text-sm font-semibold text-gray-700 mb-3">Alertas Activas</h4>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="py-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-red-100 rounded-lg">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <p className="text-3xl font-bold text-red-600">{alertas.vencidos}</p>
                  <p className="text-sm text-gray-500">Vencidos</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="py-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-red-50 rounded-lg">
                  <Clock className="w-6 h-6 text-red-500" />
                </div>
                <div>
                  <p className="text-3xl font-bold text-red-500">{alertas.proximosVencer30}</p>
                  <p className="text-sm text-gray-500">Vencen en 30 días</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="py-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-yellow-100 rounded-lg">
                  <Clock className="w-6 h-6 text-yellow-600" />
                </div>
                <div>
                  <p className="text-3xl font-bold text-yellow-600">{alertas.proximosVencer60}</p>
                  <p className="text-sm text-gray-500">Vencen en 60 días</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="py-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-yellow-50 rounded-lg">
                  <Clock className="w-6 h-6 text-yellow-500" />
                </div>
                <div>
                  <p className="text-3xl font-bold text-yellow-500">{alertas.proximosVencer90}</p>
                  <p className="text-sm text-gray-500">Vencen en 90 días</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="py-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-orange-100 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <p className="text-3xl font-bold text-orange-600">{alertas.stockBajo}</p>
                  <p className="text-sm text-gray-500">Stock Bajo</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-red-900">
              Acción Inmediata
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-600 mb-2">
              {alertas.vencidos + alertas.proximosVencer30}
            </p>
            <p className="text-xs text-red-700">
              Items vencidos o por vencer en los próximos 30 días que requieren atención urgente
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-yellow-900">
              Seguimiento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-yellow-600 mb-2">
              {alertas.proximosVencer60 + alertas.proximosVencer90}
            </p>
            <p className="text-xs text-yellow-700">
              Items que vencen en 60-90 días y requieren planificación
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-orange-900">
              Reabastecimiento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-orange-600 mb-2">
              {alertas.stockBajo}
            </p>
            <p className="text-xs text-orange-700">
              Items con stock por debajo del mínimo configurado
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
