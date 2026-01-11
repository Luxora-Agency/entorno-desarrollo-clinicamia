'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  LayoutDashboard,
  Shield,
  FileText,
  BookOpen,
  Users,
  MessageSquare,
  BarChart3,
  Bell
} from 'lucide-react';

// Import all tab components
import DashboardProcesosPrioritarios from './DashboardProcesosPrioritarios';
import SeguridadPacienteTab from './seguridad-paciente/SeguridadPacienteTab';
import GPCTab from './gpc/GPCTab';
import ProtocolosTab from './protocolos/ProtocolosTab';
import ComitesTab from './comites/ComitesTab';
import SIAUTab from './siau/SIAUTab';
import IndicadoresTab from './indicadores/IndicadoresTab';
import AlertasPPTab from './alertas/AlertasPPTab';

export default function ProcesosPrioritariosModule() {
  const [activeTab, setActiveTab] = useState('dashboard');

  const tabs = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      component: DashboardProcesosPrioritarios,
    },
    {
      id: 'seguridad',
      label: 'Seguridad del Paciente',
      icon: Shield,
      component: SeguridadPacienteTab,
    },
    {
      id: 'gpc',
      label: 'GPC',
      icon: BookOpen,
      component: GPCTab,
    },
    {
      id: 'protocolos',
      label: 'Protocolos',
      icon: FileText,
      component: ProtocolosTab,
    },
    {
      id: 'comites',
      label: 'Comités',
      icon: Users,
      component: ComitesTab,
    },
    {
      id: 'siau',
      label: 'SIAU',
      icon: MessageSquare,
      component: SIAUTab,
    },
    {
      id: 'indicadores',
      label: 'Indicadores',
      icon: BarChart3,
      component: IndicadoresTab,
    },
    {
      id: 'alertas',
      label: 'Alertas',
      icon: Bell,
      component: AlertasPPTab,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Procesos Prioritarios</h2>
          <p className="text-muted-foreground">
            Gestión integral de seguridad, calidad y atención al usuario
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4 lg:grid-cols-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <TabsTrigger key={tab.id} value={tab.id} className="flex items-center gap-2">
                <Icon className="h-4 w-4" />
                <span className="hidden lg:inline">{tab.label}</span>
              </TabsTrigger>
            );
          })}
        </TabsList>

        {tabs.map((tab) => {
          const Component = tab.component;
          return (
            <TabsContent key={tab.id} value={tab.id} className="space-y-4">
              <Component />
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
}
