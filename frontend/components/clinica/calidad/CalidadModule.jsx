'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import DashboardCalidad from './DashboardCalidad';
import HabilitacionModule from './habilitacion/HabilitacionModule';
import PAMECModule from './pamec/PAMECModule';
import SeguridadPacienteModule from './seguridad-paciente/SeguridadPacienteModule';
import IndicadoresSICModule from './indicadores/IndicadoresSICModule';
import PQRSModule from './pqrs/PQRSModule';
import ComitesModule from './comites/ComitesModule';
import VigilanciaModule from './vigilancia/VigilanciaModule';
import DocumentosModule from './documentos/DocumentosModule';
import PlanesAccionModule from './planes-accion/PlanesAccionModule';
import AcreditacionModule from './acreditacion/AcreditacionModule';
import ProcesosPrioritariosModule from '../calidad2/procesos-prioritarios/ProcesosPrioritariosModule';
import HistoriaClinicaModule from '../calidad2/historia-clinica/HistoriaClinicaModule';
import {
  LayoutDashboard,
  Shield,
  ClipboardCheck,
  AlertTriangle,
  BarChart3,
  MessageSquare,
  Users,
  Eye,
  FileText,
  ListTodo,
  Award,
  Target,
  FileHeart,
} from 'lucide-react';

const MODULOS_CALIDAD = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, component: DashboardCalidad },
  { id: 'habilitacion', label: 'Habilitaci\u00f3n', icon: Shield, component: HabilitacionModule },
  { id: 'pamec', label: 'PAMEC', icon: ClipboardCheck, component: PAMECModule },
  { id: 'seguridad', label: 'Seguridad', icon: AlertTriangle, component: SeguridadPacienteModule },
  { id: 'procesos-prioritarios', label: 'Procesos Prioritarios', icon: Target, component: ProcesosPrioritariosModule },
  { id: 'historia-clinica', label: 'Historia Clínica', icon: FileHeart, component: HistoriaClinicaModule },
  { id: 'indicadores', label: 'Indicadores', icon: BarChart3, component: IndicadoresSICModule },
  { id: 'pqrs', label: 'PQRS', icon: MessageSquare, component: PQRSModule },
  { id: 'comites', label: 'Comit\u00e9s', icon: Users, component: ComitesModule },
  { id: 'vigilancia', label: 'Vigilancia', icon: Eye, component: VigilanciaModule },
  { id: 'documentos', label: 'Documentos', icon: FileText, component: DocumentosModule },
  { id: 'planes', label: 'Planes Acci\u00f3n', icon: ListTodo, component: PlanesAccionModule },
  { id: 'acreditacion', label: 'Acreditaci\u00f3n', icon: Award, component: AcreditacionModule },
];

export default function CalidadModule({ user }) {
  const [activeTab, setActiveTab] = useState('dashboard');

  const ActiveComponent = MODULOS_CALIDAD.find(m => m.id === activeTab)?.component || DashboardCalidad;

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4">
        <h1 className="text-2xl font-bold text-gray-900">Sistema de Gesti\u00f3n de Calidad</h1>
        <p className="text-sm text-gray-500 mt-1">
          SOGCS - Sistema Obligatorio de Garant\u00eda de Calidad en Salud
        </p>
      </div>

      {/* Tabs Navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <div className="bg-white border-b px-4 overflow-x-auto">
          <TabsList className="h-12 bg-transparent p-0 gap-1">
            {MODULOS_CALIDAD.map((modulo) => {
              const Icon = modulo.icon;
              return (
                <TabsTrigger
                  key={modulo.id}
                  value={modulo.id}
                  className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:border-b-2 data-[state=active]:border-blue-600 rounded-none px-4 py-2 text-sm font-medium flex items-center gap-2"
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{modulo.label}</span>
                </TabsTrigger>
              );
            })}
          </TabsList>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-auto bg-gray-50">
          {MODULOS_CALIDAD.map((modulo) => (
            <TabsContent key={modulo.id} value={modulo.id} className="h-full m-0 p-0">
              <modulo.component user={user} />
            </TabsContent>
          ))}
        </div>
      </Tabs>
    </div>
  );
}
