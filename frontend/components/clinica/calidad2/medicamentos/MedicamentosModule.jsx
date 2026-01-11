'use client';

import { useState } from 'react';
import {
  Pill, FileText, AlertTriangle, Package,
  Thermometer, FileCheck, Bell, Activity
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import DashboardGeneralMedicamentos from './DashboardGeneralMedicamentos';
import ProtocolosTab from './protocolos/ProtocolosTab';
import InventariosTab from './inventarios/InventariosTab';
import FarmacovigilanciaTab from './farmacovigilancia/FarmacovigilanciaTab';
import TecnovigilanciaTab from './tecnovigilancia/TecnovigilanciaTab';
import TemperaturaHumedadTab from './temperatura-humedad/TemperaturaHumedadTab';
import FormatosTab from './formatos/FormatosTab';
import AlertasMedicamentosTab from './alertas/AlertasMedicamentosTab';

export default function MedicamentosModule({ user }) {
  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Medicamentos, Dispositivos e Insumos
        </h1>
        <p className="text-gray-500">
          Gestión integral de farmacovigilancia, tecnovigilancia, inventarios y control de calidad
        </p>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <TabsList className="grid w-full grid-cols-8 max-w-6xl">
          <TabsTrigger value="dashboard" className="flex items-center gap-1 text-xs">
            <Activity className="w-3.5 h-3.5" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="protocolos" className="flex items-center gap-1 text-xs">
            <FileText className="w-3.5 h-3.5" />
            Protocolos
          </TabsTrigger>
          <TabsTrigger value="farmacovigilancia" className="flex items-center gap-1 text-xs">
            <Pill className="w-3.5 h-3.5" />
            Farmacovigilancia
          </TabsTrigger>
          <TabsTrigger value="tecnovigilancia" className="flex items-center gap-1 text-xs">
            <AlertTriangle className="w-3.5 h-3.5" />
            Tecnovigilancia
          </TabsTrigger>
          <TabsTrigger value="inventarios" className="flex items-center gap-1 text-xs">
            <Package className="w-3.5 h-3.5" />
            Inventarios
          </TabsTrigger>
          <TabsTrigger value="temperatura" className="flex items-center gap-1 text-xs">
            <Thermometer className="w-3.5 h-3.5" />
            Temperatura
          </TabsTrigger>
          <TabsTrigger value="formatos" className="flex items-center gap-1 text-xs">
            <FileCheck className="w-3.5 h-3.5" />
            Formatos
          </TabsTrigger>
          <TabsTrigger value="alertas" className="flex items-center gap-1 text-xs">
            <Bell className="w-3.5 h-3.5" />
            Alertas
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="flex-1 mt-4">
          <DashboardGeneralMedicamentos user={user} />
        </TabsContent>

        <TabsContent value="protocolos" className="flex-1 mt-4">
          <ProtocolosTab user={user} />
        </TabsContent>

        <TabsContent value="farmacovigilancia" className="flex-1 mt-4">
          <FarmacovigilanciaTab user={user} />
        </TabsContent>

        <TabsContent value="tecnovigilancia" className="flex-1 mt-4">
          <TecnovigilanciaTab user={user} />
        </TabsContent>

        <TabsContent value="inventarios" className="flex-1 mt-4">
          <InventariosTab user={user} />
        </TabsContent>

        <TabsContent value="temperatura" className="flex-1 mt-4">
          <TemperaturaHumedadTab user={user} />
        </TabsContent>

        <TabsContent value="formatos" className="flex-1 mt-4">
          <FormatosTab user={user} />
        </TabsContent>

        <TabsContent value="alertas" className="flex-1 mt-4">
          <AlertasMedicamentosTab user={user} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
