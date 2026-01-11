'use client';

import { useState } from 'react';
import {
  LayoutDashboard, Users, Briefcase, FileText,
  DollarSign, Clock, Target, GraduationCap,
  Heart, Bot, Building2, UserPlus
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Dashboard
import DashboardRRHH from './dashboard/DashboardRRHH';
// Reclutamiento
import ReclutamientoTab from './reclutamiento/ReclutamientoTab';
// Empleados
import EmpleadosTab from './empleados/EmpleadosTab';
// Contratos
import ContratosTab from './contratos/ContratosTab';
// Nomina
import NominaTab from './nomina/NominaTab';
// Asistencia
import AsistenciaTab from './asistencia/AsistenciaTab';
// Evaluacion
import EvaluacionTab from './evaluacion/EvaluacionTab';
// Capacitacion
import CapacitacionTab from './capacitacion/CapacitacionTab';
// Bienestar
import BienestarTab from './bienestar/BienestarTab';
// AI Assistant
import AIAssistantTab from './ai/AIAssistantTab';

const TABS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'reclutamiento', label: 'Reclutamiento', icon: UserPlus },
  { id: 'empleados', label: 'Empleados', icon: Users },
  { id: 'contratos', label: 'Contratos', icon: FileText },
  { id: 'nomina', label: 'Nomina', icon: DollarSign },
  { id: 'asistencia', label: 'Asistencia', icon: Clock },
  { id: 'evaluacion', label: 'Evaluacion', icon: Target },
  { id: 'capacitacion', label: 'Capacitacion', icon: GraduationCap },
  { id: 'bienestar', label: 'Bienestar', icon: Heart },
  { id: 'ai', label: 'Asistente IA', icon: Bot },
];

export default function RRHHModule({ user }) {
  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg">
            <Building2 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Talento Humano</h1>
            <p className="text-gray-500 text-sm">
              Gestion integral de recursos humanos con inteligencia artificial
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <div className="border-b bg-white rounded-t-lg shadow-sm">
          <TabsList className="h-auto p-1 bg-transparent gap-1 flex flex-wrap justify-start">
            {TABS.map(tab => (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:border-b-2 data-[state=active]:border-blue-600 rounded-t-lg"
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <div className="flex-1 bg-gray-50 rounded-b-lg p-4 overflow-auto">
          <TabsContent value="dashboard" className="m-0 h-full">
            <DashboardRRHH user={user} />
          </TabsContent>

          <TabsContent value="reclutamiento" className="m-0 h-full">
            <ReclutamientoTab user={user} />
          </TabsContent>

          <TabsContent value="empleados" className="m-0 h-full">
            <EmpleadosTab user={user} />
          </TabsContent>

          <TabsContent value="contratos" className="m-0 h-full">
            <ContratosTab user={user} />
          </TabsContent>

          <TabsContent value="nomina" className="m-0 h-full">
            <NominaTab user={user} />
          </TabsContent>

          <TabsContent value="asistencia" className="m-0 h-full">
            <AsistenciaTab user={user} />
          </TabsContent>

          <TabsContent value="evaluacion" className="m-0 h-full">
            <EvaluacionTab user={user} />
          </TabsContent>

          <TabsContent value="capacitacion" className="m-0 h-full">
            <CapacitacionTab user={user} />
          </TabsContent>

          <TabsContent value="bienestar" className="m-0 h-full">
            <BienestarTab user={user} />
          </TabsContent>

          <TabsContent value="ai" className="m-0 h-full">
            <AIAssistantTab user={user} />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
