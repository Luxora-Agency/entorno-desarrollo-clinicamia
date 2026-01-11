'use client';

import { useState } from 'react';
import { Pill, Stethoscope, Scissors, BarChart3 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import InventarioMedicamentosTab from './InventarioMedicamentosTab';
import InventarioDispositivosTab from './InventarioDispositivosTab';
import InventarioInsumosTab from './InventarioInsumosTab';
import DashboardInventarioTab from './DashboardInventarioTab';

export default function InventariosTab({ user }) {
  const [activeSubTab, setActiveSubTab] = useState('medicamentos');

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="py-4">
          <div className="flex items-start gap-3">
            <BarChart3 className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-blue-900 mb-1">
                Control de Inventarios
              </h3>
              <p className="text-sm text-blue-700">
                Gestión de medicamentos, dispositivos médicos e insumos médico-quirúrgicos con alertas automáticas
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sub-Tabs */}
      <Tabs value={activeSubTab} onValueChange={setActiveSubTab} className="flex-1">
        <TabsList className="grid w-full grid-cols-4 max-w-3xl">
          <TabsTrigger value="medicamentos" className="flex items-center gap-2">
            <Pill className="w-4 h-4" />
            Medicamentos
          </TabsTrigger>
          <TabsTrigger value="dispositivos" className="flex items-center gap-2">
            <Stethoscope className="w-4 h-4" />
            Dispositivos
          </TabsTrigger>
          <TabsTrigger value="insumos" className="flex items-center gap-2">
            <Scissors className="w-4 h-4" />
            Insumos
          </TabsTrigger>
          <TabsTrigger value="dashboard" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Dashboard
          </TabsTrigger>
        </TabsList>

        <TabsContent value="medicamentos" className="mt-4">
          <InventarioMedicamentosTab user={user} />
        </TabsContent>

        <TabsContent value="dispositivos" className="mt-4">
          <InventarioDispositivosTab user={user} />
        </TabsContent>

        <TabsContent value="insumos" className="mt-4">
          <InventarioInsumosTab user={user} />
        </TabsContent>

        <TabsContent value="dashboard" className="mt-4">
          <DashboardInventarioTab user={user} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
