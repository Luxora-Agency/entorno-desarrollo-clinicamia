'use client';

import React, { useEffect, useState } from 'react';
import { getTodayColombia, formatDateISO } from '@/services/formatters';
import {
  Users, Calendar, Activity, TrendingUp, DollarSign,
  Bed, FileText, Download, RefreshCw, AlertTriangle,
  CreditCard, Package, Stethoscope, Clock, CheckCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { TrendChart, CategoryBarChart, DonutChart } from './Charts';
import { apiGet } from '@/services/api';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';

export default function DashboardAdminNew({ user }) {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [period, setPeriod] = useState('month');
  const [customRange, setCustomRange] = useState({
    start: getTodayColombia(),
    end: getTodayColombia()
  });

  const fetchStats = async () => {
    setLoading(true);
    try {
      let query = `?period=${period}`;
      if (period === 'custom') {
        query += `&startDate=${customRange.start}&endDate=${customRange.end}`;
      }
      
      const response = await apiGet(`/dashboard/stats${query}`);
      if (response.success) {
        setStats(response.data);
        toast.success('Datos actualizados');
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      toast.error('Error al cargar estadísticas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (period !== 'custom') {
      fetchStats();
    }
  }, [period]);

  const handleCustomRangeSearch = () => {
    if (period === 'custom') {
      fetchStats();
    }
  };

  const handleExport = () => {
    if (!stats) return;

    const wb = XLSX.utils.book_new();

    // Hoja 1: Resumen General
    const kpiData = [
      ['Métrica', 'Valor', 'Detalle'],
      ['Ingresos Periodo', stats.kpis.ingresosPeriodo, 'Total facturado'],
      ['Cartera Pendiente', stats.kpis.carteraPendiente, 'Por cobrar'],
      ['Citas Realizadas', stats.kpis.citasPeriodo, ''],
      ['Tasa Cancelación', `${stats.kpis.tasaCancelacion}%`, ''],
      ['Pacientes Activos', stats.kpis.totalPacientes, ''],
      ['Admisiones Activas', stats.kpis.admisionesActivas, '']
    ];
    const wsKPI = XLSX.utils.aoa_to_sheet(kpiData);
    XLSX.utils.book_append_sheet(wb, wsKPI, 'Resumen KPIs');

    // Hoja 2: Operativo
    const operationalData = [
      ['Doctor', 'Citas Atendidas'],
      ...(stats.operational.topDoctores || []).map(d => [d.name, d.value])
    ];
    const wsOps = XLSX.utils.aoa_to_sheet(operationalData);
    XLSX.utils.book_append_sheet(wb, wsOps, 'Operativo');

    // Hoja 3: Financiero
    const financialData = [
      ['Método Pago', 'Monto'],
      ...(stats.financial.ingresosPorMetodo || []).map(d => [d.name, d.value])
    ];
    const wsFin = XLSX.utils.aoa_to_sheet(financialData);
    XLSX.utils.book_append_sheet(wb, wsFin, 'Financiero');

    // Hoja 4: Inventario
    const inventoryData = [
      ['Producto', 'Estado', 'Cantidad/Fecha'],
      ...(stats.inventory.lowStock || []).map(i => [i.nombre, 'Stock Bajo', `${i.cantidadTotal} (Min: ${i.cantidadMinAlerta})`]),
      ...(stats.inventory.expiringSoon || []).map(i => [i.nombre, 'Por Vencer', new Date(i.fechaVencimiento).toLocaleDateString()])
    ];
    const wsInv = XLSX.utils.aoa_to_sheet(inventoryData);
    XLSX.utils.book_append_sheet(wb, wsInv, 'Inventario');

    // Generar archivo
    const fileName = `Reporte_Clinica_Mia_${getTodayColombia()}.xlsx`;
    XLSX.writeFile(wb, fileName);
    toast.success('Reporte exportado exitosamente');
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(value);
  };

  if (loading && !stats) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const kpis = stats?.kpis || {};
  const financial = stats?.financial || {};
  const operational = stats?.operational || {};
  const inventory = stats?.inventory || {};
  const clinical = stats?.clinical || {};

  return (
    <div className="p-6 lg:p-8 bg-gray-50 min-h-screen space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Panel de Control</h1>
          <p className="text-gray-500 mt-1">
            Visión integral de Clinica Mía
          </p>
        </div>
        
        <div className="flex flex-wrap gap-2 items-center bg-white p-2 rounded-lg border shadow-sm">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Periodo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Últimos 7 días</SelectItem>
              <SelectItem value="month">Este Mes</SelectItem>
              <SelectItem value="year">Este Año</SelectItem>
              <SelectItem value="custom">Rango Personalizado</SelectItem>
            </SelectContent>
          </Select>

          {period === 'custom' && (
            <div className="flex gap-2 items-center">
              <Input 
                type="date" 
                value={customRange.start}
                onChange={(e) => setCustomRange(prev => ({ ...prev, start: e.target.value }))}
                className="w-auto"
              />
              <span className="text-gray-400">-</span>
              <Input 
                type="date" 
                value={customRange.end}
                onChange={(e) => setCustomRange(prev => ({ ...prev, end: e.target.value }))}
                className="w-auto"
              />
              <Button size="sm" onClick={handleCustomRangeSearch}>
                Aplicar
              </Button>
            </div>
          )}

          <div className="h-6 w-px bg-gray-200 mx-2 hidden md:block"></div>

          <Button variant="outline" size="icon" onClick={fetchStats} title="Refrescar datos">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
          
          <Button onClick={handleExport} className="bg-green-600 hover:bg-green-700">
            <Download className="w-4 h-4 mr-2" />
            Exportar Excel
          </Button>
        </div>
      </div>

      {/* Top KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard 
          title="Ingresos del Periodo" 
          value={formatCurrency(kpis.ingresosPeriodo)} 
          icon={DollarSign} 
          color="green" 
          subtext={`Cartera: ${formatCurrency(kpis.carteraPendiente)}`}
        />
        <KpiCard 
          title="Citas Realizadas" 
          value={kpis.citasPeriodo} 
          icon={Calendar} 
          color="blue" 
          subtext={`${kpis.tasaCancelacion}% Cancelación`}
        />
        <KpiCard 
          title="Pacientes Activos" 
          value={kpis.totalPacientes} 
          icon={Users} 
          color="purple" 
          subtext="Base total"
        />
        <KpiCard 
          title="Admisiones Activas" 
          value={kpis.admisionesActivas} 
          icon={Bed} 
          color="orange" 
          subtext="En hospitalización"
        />
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="bg-white p-1 rounded-lg border">
          <TabsTrigger value="overview">Resumen</TabsTrigger>
          <TabsTrigger value="financial">Financiero</TabsTrigger>
          <TabsTrigger value="operational">Operativo</TabsTrigger>
          <TabsTrigger value="inventory">Inventario</TabsTrigger>
        </TabsList>

        {/* OVERVIEW TAB */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="shadow-sm border-none">
              <CardHeader>
                <CardTitle>Tendencia de Ingresos</CardTitle>
                <CardDescription>Comportamiento de facturación últimos 6 meses</CardDescription>
              </CardHeader>
              <CardContent>
                <TrendChart data={financial.revenueTrend?.map(d => ({ date: d.date, count: d.value })) || []} title="" color="#10b981" />
              </CardContent>
            </Card>
            
            <Card className="shadow-sm border-none">
              <CardHeader>
                <CardTitle>Top Diagnósticos</CardTitle>
                <CardDescription>Causas de consulta más frecuentes</CardDescription>
              </CardHeader>
              <CardContent>
                <CategoryBarChart 
                  data={clinical.topDiagnosticos?.map(d => ({ name: d.name.substring(0, 20) + '...', value: d.value })) || []} 
                  title="" 
                />
              </CardContent>
            </Card>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
               <Card className="shadow-sm border-none h-full">
                <CardHeader>
                  <CardTitle>Alertas de Inventario</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {inventory.lowStock?.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium text-red-600 flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4" /> Stock Crítico
                        </h4>
                        <div className="space-y-1">
                          {inventory.lowStock.map((item, i) => (
                            <div key={i} className="flex justify-between text-sm p-2 bg-red-50 rounded">
                              <span>{item.nombre}</span>
                              <span className="font-bold">{item.cantidadTotal} / {item.cantidadMinAlerta}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                     {inventory.expiringSoon?.length > 0 && (
                      <div className="space-y-2 mt-4">
                        <h4 className="text-sm font-medium text-orange-600 flex items-center gap-2">
                          <Clock className="w-4 h-4" /> Próximos a Vencer
                        </h4>
                        <div className="space-y-1">
                          {inventory.expiringSoon.map((item, i) => (
                            <div key={i} className="flex justify-between text-sm p-2 bg-orange-50 rounded">
                              <span>{item.nombre}</span>
                              <span className="font-bold">{new Date(item.fechaVencimiento).toLocaleDateString()}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {(!inventory.lowStock?.length && !inventory.expiringSoon?.length) && (
                      <div className="text-center py-8 text-gray-500">
                        <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-500" />
                        Inventario saludable
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <Card className="shadow-sm border-none">
              <CardHeader>
                <CardTitle>Estado de Citas</CardTitle>
              </CardHeader>
              <CardContent>
                <DonutChart data={operational.citasStatus || []} title="" />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* FINANCIAL TAB */}
        <TabsContent value="financial" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader><CardTitle>Ingresos por Método de Pago</CardTitle></CardHeader>
              <CardContent>
                 <DonutChart data={financial.ingresosPorMetodo || []} title="" />
              </CardContent>
            </Card>
             <Card>
              <CardHeader><CardTitle>Cartera Pendiente</CardTitle></CardHeader>
              <CardContent className="flex flex-col items-center justify-center h-[300px]">
                <div className="text-4xl font-bold text-red-600 mb-2">
                  {formatCurrency(kpis.carteraPendiente)}
                </div>
                <p className="text-gray-500">Total por cobrar a pacientes y entidades</p>
                <Button className="mt-4" variant="outline">Ver Reporte Detallado</Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* OPERATIONAL TAB */}
        <TabsContent value="operational" className="space-y-4">
           <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader><CardTitle>Top Doctores (Volumen de Citas)</CardTitle></CardHeader>
              <CardContent>
                <CategoryBarChart 
                  data={operational.topDoctores || []} 
                  title="" 
                />
              </CardContent>
            </Card>
             <Card>
              <CardHeader><CardTitle>Distribución de Citas</CardTitle></CardHeader>
              <CardContent>
                 <DonutChart data={operational.citasStatus || []} title="" />
              </CardContent>
            </Card>
           </div>
        </TabsContent>

        {/* INVENTORY TAB */}
        <TabsContent value="inventory">
          <Card>
            <CardHeader><CardTitle>Gestión de Inventario Farmacéutico</CardTitle></CardHeader>
            <CardContent>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <h3 className="font-semibold mb-4 text-red-600 flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5" /> Stock Bajo
                    </h3>
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left border-b">
                          <th className="pb-2">Producto</th>
                          <th className="pb-2 text-right">Actual</th>
                          <th className="pb-2 text-right">Mínimo</th>
                        </tr>
                      </thead>
                      <tbody>
                        {inventory.lowStock?.map((item, i) => (
                          <tr key={i} className="border-b last:border-0">
                            <td className="py-2">{item.nombre}</td>
                            <td className="py-2 text-right font-bold text-red-600">{item.cantidadTotal}</td>
                            <td className="py-2 text-right text-gray-500">{item.cantidadMinAlerta}</td>
                          </tr>
                        ))}
                         {!inventory.lowStock?.length && <tr><td colSpan="3" className="py-4 text-center text-gray-500">Sin alertas</td></tr>}
                      </tbody>
                    </table>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold mb-4 text-orange-600 flex items-center gap-2">
                      <Clock className="w-5 h-5" /> Vencimiento Próximo (30 días)
                    </h3>
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left border-b">
                          <th className="pb-2">Producto</th>
                          <th className="pb-2 text-right">Vence</th>
                        </tr>
                      </thead>
                      <tbody>
                        {inventory.expiringSoon?.map((item, i) => (
                          <tr key={i} className="border-b last:border-0">
                            <td className="py-2">{item.nombre}</td>
                            <td className="py-2 text-right font-bold text-orange-600">
                              {new Date(item.fechaVencimiento).toLocaleDateString()}
                            </td>
                          </tr>
                        ))}
                        {!inventory.expiringSoon?.length && <tr><td colSpan="2" className="py-4 text-center text-gray-500">Sin alertas</td></tr>}
                      </tbody>
                    </table>
                  </div>
               </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function KpiCard({ title, value, icon: Icon, color, subtext }) {
  const colorClasses = {
    blue: 'text-blue-600 bg-blue-50',
    green: 'text-green-600 bg-green-50',
    purple: 'text-purple-600 bg-purple-50',
    orange: 'text-orange-600 bg-orange-50',
    red: 'text-red-600 bg-red-50',
  };

  return (
    <Card className="shadow-sm hover:shadow-md transition-shadow border-none">
      <CardContent className="p-6">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm font-medium text-gray-500">{title}</p>
            <h3 className="text-2xl font-bold text-gray-900 mt-2">{value}</h3>
            {subtext && <p className="text-xs text-gray-500 mt-1">{subtext}</p>}
          </div>
          <div className={`p-3 rounded-xl ${colorClasses[color]}`}>
            <Icon className="w-6 h-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
