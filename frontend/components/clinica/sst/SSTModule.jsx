'use client';

import { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  AlertTriangle,
  Stethoscope,
  LayoutGrid,
  HeartPulse,
  Users,
  HeartHandshake,
  Calendar,
  GraduationCap,
  ClipboardCheck,
  TrendingUp,
  HardHat,
  Siren,
  FileText,
  Search,
  CheckSquare,
  Bell,
  Settings2
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import useSST from '@/hooks/useSST';
import SSTDashboard from './dashboard/SSTDashboard';
import AccidentesTab from './accidentes/AccidentesTab';
import EnfermedadesTab from './enfermedades/EnfermedadesTab';
import MatrizIPVRTab from './matriz-ipvr/MatrizIPVRTab';
import ExamenesMedicosTab from './examenes-medicos/ExamenesMedicosTab';
import CopasstTab from './copasst/CopasstTab';
import ComiteConvivenciaTab from './comite-convivencia/ComiteConvivenciaTab';
import PlanAnualTab from './plan-anual/PlanAnualTab';
import CapacitacionesSSTTab from './capacitaciones/CapacitacionesSSTTab';
import InspeccionesTab from './inspecciones/InspeccionesTab';
import IndicadoresTab from './indicadores/IndicadoresTab';
import EPPTab from './epp/EPPTab';
import EmergenciasTab from './emergencias/EmergenciasTab';
import DocumentosSSTTab from './documentos/DocumentosSSTTab';
import AuditoriasTab from './auditorias/AuditoriasTab';
import EstandaresTab from './estandares/EstandaresTab';
import AlertasConfigTab from './configuracion/AlertasConfigTab';

export default function SSTModule({ user }) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const { dashboard, fetchDashboard, loading } = useSST();
  const [alertas, setAlertas] = useState([]);

  useEffect(() => {
    fetchDashboard().then((data) => {
      if (data?.alertas) {
        setAlertas(data.alertas);
      }
    });
  }, [fetchDashboard]);

  const alertasCriticas = alertas.filter(a => a.tipo === 'CRITICA').length;

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="mb-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Seguridad y Salud en el Trabajo
            </h1>
            <p className="text-gray-500">
              SG-SST - Decreto 1072/2015 | Res. 0312/2019
            </p>
          </div>
          {alertasCriticas > 0 && (
            <Badge variant="destructive" className="flex items-center gap-1">
              <Bell className="w-3.5 h-3.5" />
              {alertasCriticas} alertas criticas
            </Badge>
          )}
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <div className="overflow-x-auto pb-2">
          <TabsList className="flex w-max min-w-full">
            <TabsTrigger value="dashboard" className="flex items-center gap-1 text-xs whitespace-nowrap">
              <LayoutDashboard className="w-3.5 h-3.5" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="accidentes" className="flex items-center gap-1 text-xs whitespace-nowrap">
              <AlertTriangle className="w-3.5 h-3.5" />
              Accidentes
            </TabsTrigger>
            <TabsTrigger value="enfermedades" className="flex items-center gap-1 text-xs whitespace-nowrap">
              <Stethoscope className="w-3.5 h-3.5" />
              Enfermedades
            </TabsTrigger>
            <TabsTrigger value="matriz" className="flex items-center gap-1 text-xs whitespace-nowrap">
              <LayoutGrid className="w-3.5 h-3.5" />
              Matriz IPVR
            </TabsTrigger>
            <TabsTrigger value="examenes" className="flex items-center gap-1 text-xs whitespace-nowrap">
              <HeartPulse className="w-3.5 h-3.5" />
              Examenes
            </TabsTrigger>
            <TabsTrigger value="copasst" className="flex items-center gap-1 text-xs whitespace-nowrap">
              <Users className="w-3.5 h-3.5" />
              COPASST
            </TabsTrigger>
            <TabsTrigger value="ccl" className="flex items-center gap-1 text-xs whitespace-nowrap">
              <HeartHandshake className="w-3.5 h-3.5" />
              CCL
            </TabsTrigger>
            <TabsTrigger value="plan" className="flex items-center gap-1 text-xs whitespace-nowrap">
              <Calendar className="w-3.5 h-3.5" />
              Plan Anual
            </TabsTrigger>
            <TabsTrigger value="capacitaciones" className="flex items-center gap-1 text-xs whitespace-nowrap">
              <GraduationCap className="w-3.5 h-3.5" />
              Capacitaciones
            </TabsTrigger>
            <TabsTrigger value="inspecciones" className="flex items-center gap-1 text-xs whitespace-nowrap">
              <ClipboardCheck className="w-3.5 h-3.5" />
              Inspecciones
            </TabsTrigger>
            <TabsTrigger value="indicadores" className="flex items-center gap-1 text-xs whitespace-nowrap">
              <TrendingUp className="w-3.5 h-3.5" />
              Indicadores
            </TabsTrigger>
            <TabsTrigger value="epp" className="flex items-center gap-1 text-xs whitespace-nowrap">
              <HardHat className="w-3.5 h-3.5" />
              EPP
            </TabsTrigger>
            <TabsTrigger value="emergencias" className="flex items-center gap-1 text-xs whitespace-nowrap">
              <Siren className="w-3.5 h-3.5" />
              Emergencias
            </TabsTrigger>
            <TabsTrigger value="documentos" className="flex items-center gap-1 text-xs whitespace-nowrap">
              <FileText className="w-3.5 h-3.5" />
              Documentos
            </TabsTrigger>
            <TabsTrigger value="auditorias" className="flex items-center gap-1 text-xs whitespace-nowrap">
              <Search className="w-3.5 h-3.5" />
              Auditorias
            </TabsTrigger>
            <TabsTrigger value="estandares" className="flex items-center gap-1 text-xs whitespace-nowrap">
              <CheckSquare className="w-3.5 h-3.5" />
              Estandares
            </TabsTrigger>
            <TabsTrigger value="configuracion" className="flex items-center gap-1 text-xs whitespace-nowrap">
              <Settings2 className="w-3.5 h-3.5" />
              Configuracion
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="dashboard" className="flex-1 mt-4 overflow-auto">
          <SSTDashboard user={user} />
        </TabsContent>

        <TabsContent value="accidentes" className="flex-1 mt-4 overflow-auto">
          <AccidentesTab user={user} />
        </TabsContent>

        <TabsContent value="enfermedades" className="flex-1 mt-4 overflow-auto">
          <EnfermedadesTab user={user} />
        </TabsContent>

        <TabsContent value="matriz" className="flex-1 mt-4 overflow-auto">
          <MatrizIPVRTab user={user} />
        </TabsContent>

        <TabsContent value="examenes" className="flex-1 mt-4 overflow-auto">
          <ExamenesMedicosTab user={user} />
        </TabsContent>

        <TabsContent value="copasst" className="flex-1 mt-4 overflow-auto">
          <CopasstTab user={user} />
        </TabsContent>

        <TabsContent value="ccl" className="flex-1 mt-4 overflow-auto">
          <ComiteConvivenciaTab user={user} />
        </TabsContent>

        <TabsContent value="plan" className="flex-1 mt-4 overflow-auto">
          <PlanAnualTab user={user} />
        </TabsContent>

        <TabsContent value="capacitaciones" className="flex-1 mt-4 overflow-auto">
          <CapacitacionesSSTTab user={user} />
        </TabsContent>

        <TabsContent value="inspecciones" className="flex-1 mt-4 overflow-auto">
          <InspeccionesTab user={user} />
        </TabsContent>

        <TabsContent value="indicadores" className="flex-1 mt-4 overflow-auto">
          <IndicadoresTab user={user} />
        </TabsContent>

        <TabsContent value="epp" className="flex-1 mt-4 overflow-auto">
          <EPPTab user={user} />
        </TabsContent>

        <TabsContent value="emergencias" className="flex-1 mt-4 overflow-auto">
          <EmergenciasTab user={user} />
        </TabsContent>

        <TabsContent value="documentos" className="flex-1 mt-4 overflow-auto">
          <DocumentosSSTTab user={user} />
        </TabsContent>

        <TabsContent value="auditorias" className="flex-1 mt-4 overflow-auto">
          <AuditoriasTab user={user} />
        </TabsContent>

        <TabsContent value="estandares" className="flex-1 mt-4 overflow-auto">
          <EstandaresTab user={user} />
        </TabsContent>

        <TabsContent value="configuracion" className="flex-1 mt-4 overflow-auto">
          <AlertasConfigTab user={user} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
