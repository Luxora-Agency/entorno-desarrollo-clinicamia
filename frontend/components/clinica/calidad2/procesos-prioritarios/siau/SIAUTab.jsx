'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, Star, FileText, GraduationCap } from 'lucide-react';
import EncuestasTab from './EncuestasTab';
import PQRSFTab from './PQRSFTab';
import EducacionUsuarioTab from './EducacionUsuarioTab';

export default function SIAUTab() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <Users className="h-6 w-6 text-green-600" />
          <h2 className="text-2xl font-bold">SIAU - Sistema de Información y Atención al Usuario</h2>
        </div>
        <p className="text-muted-foreground mt-1">
          Gestión de atención al usuario, encuestas de satisfacción, PQRSF y educación al paciente
        </p>
      </div>

      {/* Sub-tabs */}
      <Tabs defaultValue="pqrsf" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="pqrsf" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            PQRSF
          </TabsTrigger>
          <TabsTrigger value="encuestas" className="flex items-center gap-2">
            <Star className="h-4 w-4" />
            Encuestas
          </TabsTrigger>
          <TabsTrigger value="educacion" className="flex items-center gap-2">
            <GraduationCap className="h-4 w-4" />
            Educación al Usuario
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pqrsf" className="mt-6">
          <PQRSFTab />
        </TabsContent>

        <TabsContent value="encuestas" className="mt-6">
          <EncuestasTab />
        </TabsContent>

        <TabsContent value="educacion" className="mt-6">
          <EducacionUsuarioTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
