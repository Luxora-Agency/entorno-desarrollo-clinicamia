'use client';

import { useState, useEffect } from 'react';
import { AlertTriangle, Send, Clock, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useCalidad2Farmacovigilancia } from '@/hooks/useCalidad2Farmacovigilancia';

export default function DashboardFarmacovigilancia({ user }) {
  const { estadisticas, loading, getEstadisticas } = useCalidad2Farmacovigilancia();
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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500" />
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

  const {
    total = 0,
    porEstado = {},
    porGravedad = {},
    porCausalidad = {},
    reportadosINVIMA = 0,
    pendientesINVIMA = 0,
    ultimoMes = 0,
  } = estadisticas;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-1">Dashboard de Farmacovigilancia</h3>
        <p className="text-sm text-gray-500">
          Estadísticas generales de reportes de reacciones adversas a medicamentos
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="py-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-100 rounded-lg">
                <FileText className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-3xl font-bold text-gray-900">{total}</p>
                <p className="text-sm text-gray-500">Total Reportes</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="py-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-100 rounded-lg">
                <Send className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-3xl font-bold text-green-600">{reportadosINVIMA}</p>
                <p className="text-sm text-gray-500">Reportados INVIMA</p>
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
                <p className="text-3xl font-bold text-yellow-600">{pendientesINVIMA}</p>
                <p className="text-sm text-gray-500">Pendientes INVIMA</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="py-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 rounded-lg">
                <AlertTriangle className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-3xl font-bold text-blue-600">{ultimoMes}</p>
                <p className="text-sm text-gray-500">Último Mes</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Estado Breakdown */}
      <div>
        <h4 className="text-sm font-semibold text-gray-700 mb-3">Distribución por Estado</h4>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="py-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-600">{porEstado.BORRADOR || 0}</p>
                <p className="text-xs text-gray-500 mt-1">Borradores</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="py-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">{porEstado.ENVIADO || 0}</p>
                <p className="text-xs text-gray-500 mt-1">Enviados</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="py-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">{porEstado.REPORTADO_INVIMA || 0}</p>
                <p className="text-xs text-gray-500 mt-1">Reportados INVIMA</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="py-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-red-600">{porEstado.CERRADO || 0}</p>
                <p className="text-xs text-gray-500 mt-1">Cerrados</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Gravedad Breakdown */}
      <div>
        <h4 className="text-sm font-semibold text-gray-700 mb-3">Distribución por Gravedad</h4>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-yellow-900">Leve</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-yellow-600">{porGravedad.Leve || 0}</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-orange-900">Moderada</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-orange-600">{porGravedad.Moderada || 0}</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-red-900">Grave</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-red-600">{porGravedad.Grave || 0}</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-purple-900">Mortal</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-purple-600">{porGravedad.Mortal || 0}</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Causalidad Breakdown */}
      <div>
        <h4 className="text-sm font-semibold text-gray-700 mb-3">Distribución por Causalidad</h4>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="py-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-600">{porCausalidad.POSIBLE || 0}</p>
                <p className="text-xs text-gray-500 mt-1">Posible</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="py-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">{porCausalidad.PROBABLE || 0}</p>
                <p className="text-xs text-gray-500 mt-1">Probable</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="py-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-red-600">{porCausalidad.DEFINITIVA || 0}</p>
                <p className="text-xs text-gray-500 mt-1">Definitiva</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="py-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-400">{porCausalidad.NO_RELACIONADA || 0}</p>
                <p className="text-xs text-gray-500 mt-1">No Relacionada</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
