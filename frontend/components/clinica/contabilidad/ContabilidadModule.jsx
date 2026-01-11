'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  BookOpen, FileText, Calculator, Calendar, Building2,
  TrendingUp, RefreshCw, Settings
} from 'lucide-react';
import { toast } from 'sonner';
import { apiGet, apiPost } from '@/services/api';

import PlanCuentasModule from './PlanCuentasModule';
import AsientosContablesModule from './AsientosContablesModule';
import LibroMayorModule from './LibroMayorModule';
import EstadosFinancierosModule from './EstadosFinancierosModule';
import PeriodosContablesModule from './PeriodosContablesModule';
import CentrosCostoModule from './CentrosCostoModule';
import DashboardFinancieroModule from './DashboardFinancieroModule';

export default function ContabilidadModule() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [syncing, setSyncing] = useState(false);

  const handleSyncSiigo = async () => {
    setSyncing(true);
    try {
      // Sync all accounting data with Siigo
      await Promise.all([
        apiPost('/contabilidad/puc/sync-siigo'),
        apiPost('/contabilidad/centros-costo/sync-siigo')
      ]);
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
          <h1 className="text-2xl font-bold">Contabilidad</h1>
          <p className="text-muted-foreground">
            Sistema contable profesional con sincronización Siigo
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
        <TabsList className="grid grid-cols-4 lg:grid-cols-7 gap-2">
          <TabsTrigger value="dashboard" className="flex items-center gap-1">
            <TrendingUp className="h-4 w-4" />
            <span className="hidden sm:inline">Dashboard</span>
          </TabsTrigger>
          <TabsTrigger value="puc" className="flex items-center gap-1">
            <BookOpen className="h-4 w-4" />
            <span className="hidden sm:inline">PUC</span>
          </TabsTrigger>
          <TabsTrigger value="asientos" className="flex items-center gap-1">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Asientos</span>
          </TabsTrigger>
          <TabsTrigger value="libro-mayor" className="flex items-center gap-1">
            <Calculator className="h-4 w-4" />
            <span className="hidden sm:inline">Libro Mayor</span>
          </TabsTrigger>
          <TabsTrigger value="estados" className="flex items-center gap-1">
            <TrendingUp className="h-4 w-4" />
            <span className="hidden sm:inline">Estados</span>
          </TabsTrigger>
          <TabsTrigger value="periodos" className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            <span className="hidden sm:inline">Períodos</span>
          </TabsTrigger>
          <TabsTrigger value="centros" className="flex items-center gap-1">
            <Building2 className="h-4 w-4" />
            <span className="hidden sm:inline">Centros</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard">
          <DashboardFinancieroModule />
        </TabsContent>

        <TabsContent value="puc">
          <PlanCuentasModule />
        </TabsContent>

        <TabsContent value="asientos">
          <AsientosContablesModule />
        </TabsContent>

        <TabsContent value="libro-mayor">
          <LibroMayorModule />
        </TabsContent>

        <TabsContent value="estados">
          <EstadosFinancierosModule />
        </TabsContent>

        <TabsContent value="periodos">
          <PeriodosContablesModule />
        </TabsContent>

        <TabsContent value="centros">
          <CentrosCostoModule />
        </TabsContent>
      </Tabs>
    </div>
  );
}
