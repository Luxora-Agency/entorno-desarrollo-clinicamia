'use client';

import { useState } from 'react';
import { Users, FileText, BarChart3, GraduationCap, BookOpen, UserCheck, Award, FileCheck, Bell } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import PersonalTab from './personal/PersonalTab';
import ProcesosTab from './procesos/ProcesosTab';
import CapacidadTab from './capacidad/CapacidadTab';
import CapacitacionesTab from './capacitaciones/CapacitacionesTab';
import ManualFuncionesTab from './manual-funciones/ManualFuncionesTab';
import InduccionTab from './induccion/InduccionTab';
import CertificadosTab from './certificados/CertificadosTab';
import FormatosTab from './formatos/FormatosTab';
import AlertasTHTab from './alertas/AlertasTHTab';

export default function TalentoHumanoModule({ user }) {
  const [activeTab, setActiveTab] = useState('personal');

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Talento Humano</h1>
        <p className="text-gray-500">Gestion integral de personal, capacitaciones, formatos y alertas</p>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <TabsList className="grid w-full grid-cols-9 max-w-6xl">
          <TabsTrigger value="personal" className="flex items-center gap-1 text-xs">
            <Users className="w-3.5 h-3.5" />
            Personal
          </TabsTrigger>
          <TabsTrigger value="procesos" className="flex items-center gap-1 text-xs">
            <FileText className="w-3.5 h-3.5" />
            Procesos
          </TabsTrigger>
          <TabsTrigger value="capacidad" className="flex items-center gap-1 text-xs">
            <BarChart3 className="w-3.5 h-3.5" />
            Capacidad
          </TabsTrigger>
          <TabsTrigger value="capacitaciones" className="flex items-center gap-1 text-xs">
            <GraduationCap className="w-3.5 h-3.5" />
            Capacitaciones
          </TabsTrigger>
          <TabsTrigger value="manuales" className="flex items-center gap-1 text-xs">
            <BookOpen className="w-3.5 h-3.5" />
            Manuales
          </TabsTrigger>
          <TabsTrigger value="induccion" className="flex items-center gap-1 text-xs">
            <UserCheck className="w-3.5 h-3.5" />
            Induccion
          </TabsTrigger>
          <TabsTrigger value="certificados" className="flex items-center gap-1 text-xs">
            <Award className="w-3.5 h-3.5" />
            Certificados
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

        <TabsContent value="personal" className="flex-1 mt-4">
          <PersonalTab user={user} />
        </TabsContent>

        <TabsContent value="procesos" className="flex-1 mt-4">
          <ProcesosTab user={user} />
        </TabsContent>

        <TabsContent value="capacidad" className="flex-1 mt-4">
          <CapacidadTab user={user} />
        </TabsContent>

        <TabsContent value="capacitaciones" className="flex-1 mt-4">
          <CapacitacionesTab user={user} />
        </TabsContent>

        <TabsContent value="manuales" className="flex-1 mt-4">
          <ManualFuncionesTab user={user} />
        </TabsContent>

        <TabsContent value="induccion" className="flex-1 mt-4">
          <InduccionTab user={user} />
        </TabsContent>

        <TabsContent value="certificados" className="flex-1 mt-4">
          <CertificadosTab user={user} />
        </TabsContent>

        <TabsContent value="formatos" className="flex-1 mt-4">
          <FormatosTab user={user} />
        </TabsContent>

        <TabsContent value="alertas" className="flex-1 mt-4">
          <AlertasTHTab user={user} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
