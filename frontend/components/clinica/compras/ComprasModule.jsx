'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import {
  ShoppingCart, Users, FileText, CreditCard,
  TrendingUp, RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';
import { apiPost } from '@/services/api';

import ComprasDashboard from './ComprasDashboard';
import ProveedoresModule from './ProveedoresModule';
import OrdenesCompraModule from './OrdenesCompraModule';
import FacturasProveedorModule from './FacturasProveedorModule';

export default function ComprasModule({ user }) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [syncing, setSyncing] = useState(false);

  const handleSyncSiigo = async () => {
    setSyncing(true);
    try {
      await apiPost('/compras/sync-siigo');
      toast.success('Sincronización con Siigo completada');
    } catch (error) {
      toast.error('Error en sincronización: ' + error.message);
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Compras y Proveedores</h1>
          <p className="text-muted-foreground">
            Gestión de proveedores, órdenes de compra y cuentas por pagar
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleSyncSiigo}
            disabled={syncing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
            Sincronizar Siigo
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid grid-cols-2 lg:grid-cols-4 gap-2">
          <TabsTrigger value="dashboard" className="flex items-center gap-1">
            <TrendingUp className="h-4 w-4" />
            <span className="hidden sm:inline">Dashboard</span>
          </TabsTrigger>
          <TabsTrigger value="proveedores" className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Proveedores</span>
          </TabsTrigger>
          <TabsTrigger value="ordenes" className="flex items-center gap-1">
            <ShoppingCart className="h-4 w-4" />
            <span className="hidden sm:inline">Órdenes</span>
          </TabsTrigger>
          <TabsTrigger value="facturas" className="flex items-center gap-1">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Facturas</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard">
          <ComprasDashboard />
        </TabsContent>

        <TabsContent value="proveedores">
          <ProveedoresModule user={user} />
        </TabsContent>

        <TabsContent value="ordenes">
          <OrdenesCompraModule user={user} />
        </TabsContent>

        <TabsContent value="facturas">
          <FacturasProveedorModule user={user} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
