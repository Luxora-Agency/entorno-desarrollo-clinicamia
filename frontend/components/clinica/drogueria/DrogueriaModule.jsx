'use client';

import { useState, useEffect } from 'react';
import { 
  Store, ShoppingCart, Package, History, 
  Wallet, TrendingUp, AlertTriangle, Search,
  Plus, ArrowLeft, CheckCircle2
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useDrogueria } from '@/hooks/useDrogueria';

// Sub-components
import POS from './POS';
import InventarioDrogueria from './InventarioDrogueria';
import VentasHistory from './VentasHistory';
import CajaManager from './CajaManager';
import DashboardDrogueria from './DashboardDrogueria';

export default function DrogueriaModule({ user }) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const { cajaActiva, fetchCajaActiva, fetchDashboardStats, loading } = useDrogueria();

  useEffect(() => {
    fetchCajaActiva();
    fetchDashboardStats();
  }, [fetchCajaActiva, fetchDashboardStats]);

  return (
    <div className="h-full flex flex-col space-y-6 p-2">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl shadow-md">
            <Store className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Droguería Clínica Mía</h1>
            <p className="text-sm text-gray-500 font-medium">Venta de medicamentos al público y POS</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {cajaActiva ? (
            <div className="flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-200 rounded-full">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-xs font-bold text-green-700 uppercase tracking-wider">Caja Abierta</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-4 py-2 bg-red-50 border border-red-200 rounded-full">
              <div className="w-2 h-2 bg-red-500 rounded-full" />
              <span className="text-xs font-bold text-red-700 uppercase tracking-wider">Caja Cerrada</span>
            </div>
          )}
        </div>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <div className="bg-white border rounded-t-xl p-1 shadow-sm">
          <TabsList className="h-11 bg-transparent gap-1">
            <TabsTrigger value="dashboard" className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 rounded-lg px-6 font-semibold">
              <TrendingUp className="w-4 h-4 mr-2" /> Resumen
            </TabsTrigger>
            <TabsTrigger value="pos" className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 rounded-lg px-6 font-semibold">
              <ShoppingCart className="w-4 h-4 mr-2" /> Punto de Venta
            </TabsTrigger>
            <TabsTrigger value="inventario" className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 rounded-lg px-6 font-semibold">
              <Package className="w-4 h-4 mr-2" /> Inventario Retail
            </TabsTrigger>
            <TabsTrigger value="ventas" className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 rounded-lg px-6 font-semibold">
              <History className="w-4 h-4 mr-2" /> Historial
            </TabsTrigger>
            <TabsTrigger value="caja" className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 rounded-lg px-6 font-semibold">
              <Wallet className="w-4 h-4 mr-2" /> Arqueo de Caja
            </TabsTrigger>
          </TabsList>
        </div>

        <div className="flex-1 bg-gray-50/50 rounded-b-xl border border-t-0 overflow-hidden min-h-[600px]">
          <TabsContent value="dashboard" className="m-0 h-full p-6">
            <DashboardDrogueria user={user} />
          </TabsContent>
          <TabsContent value="pos" className="m-0 h-full">
            <POS user={user} />
          </TabsContent>
          <TabsContent value="inventario" className="m-0 h-full p-6">
            <InventarioDrogueria user={user} />
          </TabsContent>
          <TabsContent value="ventas" className="m-0 h-full p-6">
            <VentasHistory user={user} />
          </TabsContent>
          <TabsContent value="caja" className="m-0 h-full p-6">
            <CajaManager user={user} />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
