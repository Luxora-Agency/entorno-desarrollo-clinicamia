'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Users, ShoppingCart, FileText, AlertTriangle,
  TrendingUp, Clock, CheckCircle, DollarSign, Loader2
} from 'lucide-react';
import { apiGet } from '@/services/api';
import ReactECharts from 'echarts-for-react';

export default function ComprasDashboard() {
  const [stats, setStats] = useState(null);
  const [ordenesStats, setOrdenesStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [proveedoresRes, ordenesRes] = await Promise.all([
        apiGet('/compras/proveedores/stats'),
        apiGet('/compras/ordenes/stats')
      ]);
      setStats(proveedoresRes.data);
      setOrdenesStats(ordenesRes.data);
    } catch (error) {
      console.error('Error cargando dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(value || 0);
  };

  const getComprasPorMesChart = () => {
    if (!ordenesStats?.comprasPorMes) return {};

    const meses = ordenesStats.comprasPorMes.map(m => m.mes);
    const montos = ordenesStats.comprasPorMes.map(m => parseFloat(m.total));

    return {
      tooltip: {
        trigger: 'axis',
        formatter: (params) => {
          return `${params[0].name}<br/>${params[0].marker} ${formatCurrency(params[0].value)}`;
        }
      },
      xAxis: {
        type: 'category',
        data: meses
      },
      yAxis: {
        type: 'value',
        axisLabel: {
          formatter: (value) => formatCurrency(value)
        }
      },
      series: [{
        name: 'Compras',
        type: 'bar',
        data: montos,
        itemStyle: { color: '#3b82f6' }
      }]
    };
  };

  const getProveedoresPorTipoChart = () => {
    if (!stats?.porTipo) return {};

    return {
      tooltip: {
        trigger: 'item',
        formatter: '{b}: {c} ({d}%)'
      },
      legend: {
        orient: 'vertical',
        left: 'left'
      },
      series: [{
        type: 'pie',
        radius: ['40%', '70%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 10,
          borderColor: '#fff',
          borderWidth: 2
        },
        label: {
          show: false
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 14,
            fontWeight: 'bold'
          }
        },
        data: stats.porTipo.map(t => ({
          name: t.tipo,
          value: t._count
        }))
      }]
    };
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              <span className="text-sm text-muted-foreground">Proveedores Activos</span>
            </div>
            <div className="text-2xl font-bold mt-2">
              {stats?.total || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-green-600" />
              <span className="text-sm text-muted-foreground">Órdenes Este Mes</span>
            </div>
            <div className="text-2xl font-bold mt-2">
              {ordenesStats?.totalMes || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-yellow-600" />
              <span className="text-sm text-muted-foreground">Pendientes</span>
            </div>
            <div className="text-2xl font-bold mt-2">
              {ordenesStats?.pendientes || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-purple-600" />
              <span className="text-sm text-muted-foreground">Total CxP</span>
            </div>
            <div className="text-2xl font-bold mt-2">
              {formatCurrency(stats?.saldoPendiente)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Compras por Mes</CardTitle>
            <CardDescription>Últimos 6 meses</CardDescription>
          </CardHeader>
          <CardContent>
            {ordenesStats?.comprasPorMes?.length > 0 ? (
              <ReactECharts option={getComprasPorMesChart()} style={{ height: '300px' }} />
            ) : (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                Sin datos de compras
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Proveedores por Tipo</CardTitle>
            <CardDescription>Distribución de proveedores</CardDescription>
          </CardHeader>
          <CardContent>
            {stats?.porTipo?.length > 0 ? (
              <ReactECharts option={getProveedoresPorTipoChart()} style={{ height: '300px' }} />
            ) : (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                Sin datos de proveedores
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Alertas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Órdenes Vencidas */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              Órdenes Vencidas
            </CardTitle>
          </CardHeader>
          <CardContent>
            {ordenesStats?.vencidas?.length > 0 ? (
              <div className="space-y-2">
                {ordenesStats.vencidas.slice(0, 5).map((orden, idx) => (
                  <div key={idx} className="flex justify-between items-center p-2 bg-red-50 rounded">
                    <div>
                      <span className="font-mono text-sm">{orden.numero}</span>
                      <span className="text-sm text-muted-foreground ml-2">{orden.proveedor}</span>
                    </div>
                    <Badge variant="destructive">
                      {orden.diasVencida} días
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 text-muted-foreground">
                <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
                Sin órdenes vencidas
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Proveedores */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-500" />
              Top 5 Proveedores (Por Volumen)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats?.topProveedores?.length > 0 ? (
              <div className="space-y-2">
                {stats.topProveedores.slice(0, 5).map((prov, idx) => (
                  <div key={idx} className="flex justify-between items-center p-2 hover:bg-muted/50 rounded">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{idx + 1}</Badge>
                      <span className="text-sm">{prov.razonSocial}</span>
                    </div>
                    <span className="font-medium text-sm">
                      {formatCurrency(prov.totalCompras)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 text-muted-foreground">
                Sin datos de proveedores
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
