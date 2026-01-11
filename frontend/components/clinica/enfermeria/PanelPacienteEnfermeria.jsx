'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Activity, Droplets, FileText, Droplet } from 'lucide-react';
import GlucometriaModule from './GlucometriaModule';
import BalanceLiquidosModule from './BalanceLiquidosModule';
import TransfusionesModule from './TransfusionesModule';
import NotasEnfermeria from './NotasEnfermeria';

export default function PanelPacienteEnfermeria({ paciente, onBack, user }) {
  const [activeTab, setActiveTab] = useState('signos');

  // Helper to ensure we have the correct IDs
  // paciente object likely comes from AsignacionEnfermeria or Admision
  const pacienteId = paciente.pacienteId || paciente.id; 
  const admisionId = paciente.admisionId || paciente.id; // If it is an admision object

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft className="w-5 h-5 mr-2" />
          Volver al Tablero
        </Button>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{paciente.nombre} {paciente.apellido}</h2>
          <p className="text-gray-600">
             Habitación: {paciente.habitacion || 'N/A'} - {paciente.diagnostico || 'Sin diagnóstico'}
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="bg-white p-1 shadow-sm border w-full justify-start overflow-x-auto">
          <TabsTrigger value="signos" className="data-[state=active]:bg-blue-100 data-[state=active]:text-blue-700">
            <Activity className="w-4 h-4 mr-2" />
            Signos Vitales
          </TabsTrigger>
          <TabsTrigger value="glucometria" className="data-[state=active]:bg-teal-100 data-[state=active]:text-teal-700">
            <Droplet className="w-4 h-4 mr-2" />
            Glucometría
          </TabsTrigger>
          <TabsTrigger value="balance" className="data-[state=active]:bg-orange-100 data-[state=active]:text-orange-700">
            <Droplets className="w-4 h-4 mr-2" />
            Balance Hídrico
          </TabsTrigger>
          <TabsTrigger value="transfusiones" className="data-[state=active]:bg-red-100 data-[state=active]:text-red-700">
            <Droplet className="w-4 h-4 mr-2" />
            Transfusiones
          </TabsTrigger>
          <TabsTrigger value="notas" className="data-[state=active]:bg-purple-100 data-[state=active]:text-purple-700">
            <FileText className="w-4 h-4 mr-2" />
            Notas de Enfermería
          </TabsTrigger>
        </TabsList>

        <TabsContent value="signos">
           <div className="p-8 bg-white rounded-lg shadow text-center border border-dashed border-gray-300">
               <Activity className="w-12 h-12 mx-auto text-gray-300 mb-2" />
               <p className="text-gray-500">Gestión de Signos Vitales (Disponible en el Tablero Principal)</p>
               <Button variant="link" onClick={onBack}>Ir al Tablero</Button>
           </div>
        </TabsContent>

        <TabsContent value="glucometria">
          <div className="bg-white p-6 rounded-lg shadow">
            <GlucometriaModule pacienteId={pacienteId} admisionId={admisionId} />
          </div>
        </TabsContent>

        <TabsContent value="balance">
          <div className="bg-white p-6 rounded-lg shadow">
            <BalanceLiquidosModule pacienteId={pacienteId} admisionId={admisionId} />
          </div>
        </TabsContent>

        <TabsContent value="transfusiones">
           <div className="bg-white p-6 rounded-lg shadow">
            <TransfusionesModule pacienteId={pacienteId} admisionId={admisionId} />
          </div>
        </TabsContent>

        <TabsContent value="notas">
           <div className="bg-white p-6 rounded-lg shadow">
               <NotasEnfermeria pacienteId={pacienteId} admisionId={admisionId} user={user} />
           </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
