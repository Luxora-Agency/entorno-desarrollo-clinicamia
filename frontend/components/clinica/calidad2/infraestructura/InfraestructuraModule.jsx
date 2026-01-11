'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Building2, FileText, Recycle, Wrench, Files } from 'lucide-react';
import DocumentosLegalesTab from './documentos-legales/DocumentosLegalesTab';
import ProcesosInfraestructuraTab from './procesos-documentados/ProcesosInfraestructuraTab';
import PGIRASAModule from './pgirasa/PGIRASAModule';
import MantenimientosModule from './mantenimientos/MantenimientosModule';
import FormatosTab from './formatos/FormatosTab';

export default function InfraestructuraModule({ user }) {
  const [activeTab, setActiveTab] = useState('documentos-legales');

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Building2 className="w-7 h-7 text-blue-600" />
            Infraestructura
          </h1>
          <p className="text-gray-600 mt-1">
            Gestión de documentos legales, procesos, PGIRASA, mantenimientos y formatos
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="documentos-legales">
            <FileText className="w-4 h-4 mr-2" />
            Documentos Legales
          </TabsTrigger>
          <TabsTrigger value="procesos">
            <FileText className="w-4 h-4 mr-2" />
            Procesos Documentados
          </TabsTrigger>
          <TabsTrigger value="pgirasa">
            <Recycle className="w-4 h-4 mr-2" />
            PGIRASA
          </TabsTrigger>
          <TabsTrigger value="mantenimientos">
            <Wrench className="w-4 h-4 mr-2" />
            Mantenimientos
          </TabsTrigger>
          <TabsTrigger value="formatos">
            <Files className="w-4 h-4 mr-2" />
            Formatos
          </TabsTrigger>
        </TabsList>

        <TabsContent value="documentos-legales">
          <DocumentosLegalesTab user={user} />
        </TabsContent>

        <TabsContent value="procesos">
          <ProcesosInfraestructuraTab user={user} />
        </TabsContent>

        <TabsContent value="pgirasa">
          <PGIRASAModule user={user} />
        </TabsContent>

        <TabsContent value="mantenimientos">
          <MantenimientosModule user={user} />
        </TabsContent>

        <TabsContent value="formatos">
          <FormatosTab user={user} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
