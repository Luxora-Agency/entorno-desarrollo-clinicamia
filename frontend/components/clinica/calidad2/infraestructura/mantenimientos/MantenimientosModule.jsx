'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Wrench,
  Building2,
  Shield,
  Flame,
  Droplets,
  Waves,
  Zap,
  Calendar,
} from 'lucide-react';
import EquipoTab from './EquipoTab';
import CronogramaTab from './CronogramaTab';

export default function MantenimientosModule({ user }) {
  const [activeTab, setActiveTab] = useState('ascensores');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Wrench className="w-7 h-7 text-blue-600" />
            Mantenimientos de Infraestructura
          </h1>
          <p className="text-gray-600 mt-1">
            Gestión integral de mantenimientos preventivos y correctivos
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="ascensores" className="flex items-center gap-2">
            <Building2 className="w-4 h-4" />
            <span className="hidden md:inline">Ascensores</span>
          </TabsTrigger>
          <TabsTrigger value="bomberos" className="flex items-center gap-2">
            <Flame className="w-4 h-4" />
            <span className="hidden md:inline">Bomberos</span>
          </TabsTrigger>
          <TabsTrigger value="extintores" className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            <span className="hidden md:inline">Extintores</span>
          </TabsTrigger>
          <TabsTrigger value="fumigacion" className="flex items-center gap-2">
            <Droplets className="w-4 h-4" />
            <span className="hidden md:inline">Fumigación</span>
          </TabsTrigger>
          <TabsTrigger value="lavado-tanques" className="flex items-center gap-2">
            <Waves className="w-4 h-4" />
            <span className="hidden md:inline">Tanques</span>
          </TabsTrigger>
          <TabsTrigger value="planta-electrica" className="flex items-center gap-2">
            <Zap className="w-4 h-4" />
            <span className="hidden md:inline">Planta</span>
          </TabsTrigger>
          <TabsTrigger value="cronograma" className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            <span className="hidden md:inline">Cronograma</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="ascensores">
          <EquipoTab tipo="ASCENSOR" user={user} />
        </TabsContent>

        <TabsContent value="bomberos">
          <EquipoTab tipo="BOMBEROS" user={user} />
        </TabsContent>

        <TabsContent value="extintores">
          <EquipoTab tipo="EXTINTOR" user={user} />
        </TabsContent>

        <TabsContent value="fumigacion">
          <EquipoTab tipo="FUMIGACION" user={user} />
        </TabsContent>

        <TabsContent value="lavado-tanques">
          <EquipoTab tipo="LAVADO_TANQUES" user={user} />
        </TabsContent>

        <TabsContent value="planta-electrica">
          <EquipoTab tipo="PLANTA_ELECTRICA" user={user} />
        </TabsContent>

        <TabsContent value="cronograma">
          <CronogramaTab user={user} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
