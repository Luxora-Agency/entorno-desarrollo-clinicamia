'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield, AlertTriangle, FileText } from 'lucide-react';
import EventosAdversosTab from './EventosAdversosTab';
import PracticasSeguras from './PracticasSeguras';

export default function SeguridadPacienteTab() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <Shield className="h-6 w-6 text-red-600" />
          <h2 className="text-2xl font-bold">Seguridad del Paciente</h2>
        </div>
        <p className="text-muted-foreground mt-1">
          Gestión de prácticas seguras, eventos adversos y programas de seguridad del paciente
        </p>
      </div>

      {/* Sub-tabs */}
      <Tabs defaultValue="eventos" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="eventos" className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Eventos Adversos
          </TabsTrigger>
          <TabsTrigger value="practicas" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Prácticas Seguras
          </TabsTrigger>
        </TabsList>

        <TabsContent value="eventos" className="mt-6">
          <EventosAdversosTab />
        </TabsContent>

        <TabsContent value="practicas" className="mt-6">
          <PracticasSeguras />
        </TabsContent>
      </Tabs>
    </div>
  );
}
