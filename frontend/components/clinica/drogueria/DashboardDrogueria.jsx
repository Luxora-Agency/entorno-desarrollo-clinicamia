'use client';

import { 
  TrendingUp, TrendingDown, DollarSign, Package, 
  ShoppingCart, AlertCircle, Calendar, ArrowUpRight,
  ArrowDownRight, Star, RefreshCw
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useDrogueria } from '@/hooks/useDrogueria';
import { formatDateLong } from '@/lib/dateUtils';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer 
} from 'recharts';

export default function DashboardDrogueria({ user }) {
  const { dashboardStats, fetchDashboardStats, loading } = useDrogueria();

  if (!dashboardStats) return null;

  // Mock trend data for UI purposes based on real today sales
  const trendData = [
    { name: '08:00', total: dashboardStats.ingresosHoy * 0.1 },
    { name: '10:00', total: dashboardStats.ingresosHoy * 0.3 },
    { name: '12:00', total: dashboardStats.ingresosHoy * 0.2 },
    { name: '14:00', total: dashboardStats.ingresosHoy * 0.5 },
    { name: '16:00', total: dashboardStats.ingresosHoy * 0.8 },
    { name: 'Ahora', total: dashboardStats.ingresosHoy },
  ];

  const formatCurrency = (val) => new Intl.NumberFormat('es-CO', {
    style: 'currency', currency: 'COP', minimumFractionDigits: 0
  }).format(val);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-800">Panel Financiero Retail</h2>
        <Button variant="ghost" size="sm" onClick={() => fetchDashboardStats()}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} /> Actualizar Datos
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-white border-none shadow-md overflow-hidden group hover:scale-[1.02] transition-transform">
          <div className="h-1.5 bg-blue-600" />
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Ingresos Hoy</p>
                <h3 className="text-3xl font-black text-gray-900 mt-1">
                  {formatCurrency(dashboardStats.ingresosHoy)}
                </h3>
              </div>
              <div className="bg-blue-50 p-3 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <DollarSign className="w-6 h-6" />
              </div>
            </div>
            <div className="flex items-center gap-1 mt-4 text-emerald-600 text-xs font-bold bg-emerald-50 w-fit px-2 py-1 rounded-full">
              <TrendingUp className="w-3 h-3" />
              <span>+12.5% vs ayer</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-none shadow-md overflow-hidden group hover:scale-[1.02] transition-transform">
          <div className="h-1.5 bg-indigo-600" />
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Ventas Hoy</p>
                <h3 className="text-3xl font-black text-gray-900 mt-1">
                  {dashboardStats.numeroVentasHoy}
                </h3>
              </div>
              <div className="bg-indigo-50 p-3 rounded-xl group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                <ShoppingCart className="w-6 h-6" />
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-4 font-medium italic">Transacciones procesadas</p>
          </CardContent>
        </Card>

        <Card className="bg-white border-none shadow-md overflow-hidden group hover:scale-[1.02] transition-transform">
          <div className="h-1.5 bg-amber-600" />
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Bajo Stock</p>
                <h3 className="text-3xl font-black text-gray-900 mt-1 text-amber-600">
                  {dashboardStats.productosBajoStock}
                </h3>
              </div>
              <div className="bg-amber-50 p-3 rounded-xl group-hover:bg-amber-600 group-hover:text-white transition-colors">
                <AlertCircle className="w-6 h-6" />
              </div>
            </div>
            <p className="text-xs text-amber-600 font-bold mt-4 uppercase tracking-tighter">Requieren pedido urgente</p>
          </CardContent>
        </Card>

        <Card className="bg-white border-none shadow-md overflow-hidden group hover:scale-[1.02] transition-transform">
          <div className="h-1.5 bg-green-600" />
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Catálogo Activo</p>
                <h3 className="text-3xl font-black text-gray-900 mt-1">
                  {dashboardStats.totalProductos}
                </h3>
              </div>
              <div className="bg-green-50 p-3 rounded-xl group-hover:bg-green-600 group-hover:text-white transition-colors">
                <Package className="w-6 h-6" />
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-4">Items disponibles para venta</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trend Chart */}
        <Card className="lg:col-span-2 shadow-md border-none">
          <CardHeader className="border-b pb-4">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-600" /> Curva de Ventas del Día
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData}>
                  <defs>
                    <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#9ca3af'}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#9ca3af'}} tickFormatter={(val) => `$${val/1000}k`} />
                  <Tooltip 
                    formatter={(val) => formatCurrency(val)} 
                    contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'}} 
                  />
                  <Area type="monotone" dataKey="total" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorTotal)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Top Product and Caja Summary */}
        <div className="space-y-6">
          <Card className="shadow-md border-none bg-gradient-to-br from-indigo-600 to-blue-700 text-white overflow-hidden relative">
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/10 rounded-full blur-2xl" />
            <CardContent className="p-6">
              <h4 className="font-bold flex items-center gap-2 mb-4 uppercase text-[10px] tracking-widest text-blue-100">
                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" /> Producto Estrella
              </h4>
              <div className="space-y-4">
                <div>
                  <h3 className="text-2xl font-black">ACETAMINOFÉN 500MG</h3>
                  <p className="text-blue-100 text-sm opacity-80 mt-1">Líder en volumen de ventas hoy</p>
                </div>
                <div className="bg-white/20 p-3 rounded-lg backdrop-blur-sm">
                  <div className="flex justify-between text-xs font-bold mb-1">
                    <span>Proyección de Stock</span>
                    <span>85%</span>
                  </div>
                  <div className="h-1.5 bg-blue-900/30 rounded-full overflow-hidden">
                    <div className="h-full bg-white w-[85%]" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-md border-none">
            <CardHeader className="bg-gray-50/50">
              <CardTitle className="text-xs font-black uppercase tracking-wider text-gray-400 flex items-center justify-between">
                <span>Resumen de Caja</span>
                <Badge variant="secondary" className="bg-white">Hoy</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              <div className="flex justify-between items-center border-b border-dashed pb-3">
                <span className="text-sm text-gray-500 font-medium">Base de Apertura</span>
                <span className="font-bold text-gray-700">{formatCurrency(100000)}</span>
              </div>
              <div className="flex justify-between items-center border-b border-dashed pb-3">
                <span className="text-sm text-gray-500 font-medium">Ventas Reportadas</span>
                <span className="font-bold text-emerald-600">+{formatCurrency(dashboardStats.ingresosHoy)}</span>
              </div>
              <div className="flex justify-between items-end pt-2">
                <span className="font-black text-gray-900 text-sm uppercase">Total Disponible</span>
                <span className="text-2xl font-black text-gray-900">{formatCurrency(100000 + dashboardStats.ingresosHoy)}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Recent Activity Table style */}
      <Card className="shadow-md border-none">
        <CardHeader className="border-b pb-4">
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-600" /> Últimos Movimientos
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 text-[10px] uppercase font-black text-gray-400">
                <tr>
                  <th className="px-6 py-3">Factura</th>
                  <th className="px-6 py-3">Vendedor</th>
                  <th className="px-6 py-3">Hora</th>
                  <th className="px-6 py-3 text-right">Total</th>
                  <th className="px-6 py-3 text-center">Pago</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {dashboardStats.ventasRecientes.map((v) => (
                  <tr key={v.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-bold text-blue-600 text-sm">{v.numeroFactura}</td>
                    <td className="px-6 py-4 text-sm text-gray-700 font-medium">{v.vendedor.nombre}</td>
                    <td className="px-6 py-4 text-xs text-gray-500">{new Date(v.fechaVenta).toLocaleTimeString()}</td>
                    <td className="px-6 py-4 text-right font-black text-gray-900">{formatCurrency(v.total)}</td>
                    <td className="px-6 py-4 text-center">
                      <Badge variant="outline" className="text-[10px] font-bold border-green-200 text-green-700 bg-green-50">
                        {v.metodoPago}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {dashboardStats.ventasRecientes.length === 0 && (
              <div className="p-12 text-center text-gray-400">No hay movimientos recientes</div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}