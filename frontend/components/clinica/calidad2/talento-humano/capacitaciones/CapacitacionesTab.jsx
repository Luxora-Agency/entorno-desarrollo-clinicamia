'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, BookOpen, FileText, Settings2 } from 'lucide-react';
import CronogramaAnual from './cronograma/CronogramaAnual';
import ActasLista from './actas/ActasLista';
import CategoriasManager from './categorias/CategoriasManager';
import CapacitacionesDashboard from './stats/CapacitacionesDashboard';

export default function CapacitacionesTab({ user }) {
  const [activeTab, setActiveTab] = useState('cronograma');

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full max-w-2xl grid-cols-4">
          <TabsTrigger value="cronograma" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span className="hidden sm:inline">Cronograma</span>
          </TabsTrigger>
          <TabsTrigger value="actas" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Actas</span>
          </TabsTrigger>
          <TabsTrigger value="dashboard" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            <span className="hidden sm:inline">Dashboard</span>
          </TabsTrigger>
          <TabsTrigger value="config" className="flex items-center gap-2">
            <Settings2 className="h-4 w-4" />
            <span className="hidden sm:inline">Config</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="cronograma" className="mt-4">
          <CronogramaAnual user={user} />
        </TabsContent>

        <TabsContent value="actas" className="mt-4">
          <ActasLista user={user} />
        </TabsContent>

        <TabsContent value="dashboard" className="mt-4">
          <CapacitacionesDashboard />
        </TabsContent>

        <TabsContent value="config" className="mt-4">
          <CategoriasManager />
        </TabsContent>
      </Tabs>
    </div>
  );
}
