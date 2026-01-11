'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import {
  ClipboardCheck,
  FileSearch,
  Trash2,
  Calculator,
  BarChart3,
  FileText,
  FolderOpen,
  Recycle
} from 'lucide-react';
import ConceptosSanitariosTab from './conceptos-sanitarios/ConceptosSanitariosTab';
import AuditoriasTab from './auditorias/AuditoriasTab';
import RH1Tab from './rh1/RH1Tab';
import IndicadoresTab from './indicadores/IndicadoresTab';
import ReportesTab from './reportes/ReportesTab';
import FormatosTab from './formatos/FormatosTab';

export default function PGIRASAModule({ user }) {
  const [activeTab, setActiveTab] = useState('conceptos-sanitarios');

  return (
    <div className="space-y-4">
      {/* Header con descripción */}
      <Card className="bg-green-50 border-green-200">
        <CardContent className="py-4">
          <div className="flex items-start gap-3">
            <Recycle className="w-6 h-6 text-green-600 mt-0.5 flex-shrink-0" />
            <div>
              <h2 className="font-bold text-green-900 mb-1">
                PGIRASA - Plan de Gestión Integral de Residuos de Atención en Salud
              </h2>
              <p className="text-sm text-green-700">
                Gestión y seguimiento del manejo integral de residuos hospitalarios según normativa colombiana.
                Incluye conceptos sanitarios, auditorías, formulario RH1, indicadores y reportes.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-7 bg-white">
          <TabsTrigger value="conceptos-sanitarios" className="text-xs">
            <ClipboardCheck className="w-4 h-4 mr-1" />
            Conceptos
          </TabsTrigger>
          <TabsTrigger value="auditorias" className="text-xs">
            <FileSearch className="w-4 h-4 mr-1" />
            Auditorías
          </TabsTrigger>
          <TabsTrigger value="rh1" className="text-xs">
            <Trash2 className="w-4 h-4 mr-1" />
            RH1
          </TabsTrigger>
          <TabsTrigger value="formula-rh1" disabled className="text-xs opacity-50">
            <Calculator className="w-4 h-4 mr-1" />
            Fórmula
          </TabsTrigger>
          <TabsTrigger value="indicadores" className="text-xs">
            <BarChart3 className="w-4 h-4 mr-1" />
            Indicadores
          </TabsTrigger>
          <TabsTrigger value="reportes" className="text-xs">
            <FileText className="w-4 h-4 mr-1" />
            Reportes
          </TabsTrigger>
          <TabsTrigger value="formatos" className="text-xs">
            <FolderOpen className="w-4 h-4 mr-1" />
            Formatos
          </TabsTrigger>
        </TabsList>

        <TabsContent value="conceptos-sanitarios">
          <ConceptosSanitariosTab user={user} />
        </TabsContent>

        <TabsContent value="auditorias">
          <AuditoriasTab user={user} />
        </TabsContent>

        <TabsContent value="rh1">
          <RH1Tab user={user} />
        </TabsContent>

        <TabsContent value="formula-rh1">
          <PlaceholderTab
            icon={Calculator}
            title="Fórmula RH1"
            description="Iteración 5 - Documentación de metodología"
          />
        </TabsContent>

        <TabsContent value="indicadores">
          <IndicadoresTab user={user} />
        </TabsContent>

        <TabsContent value="reportes">
          <ReportesTab user={user} />
        </TabsContent>

        <TabsContent value="formatos">
          <FormatosTab user={user} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Componente placeholder para tabs pendientes
function PlaceholderTab({ icon: Icon, title, description }) {
  return (
    <Card>
      <CardContent className="py-16">
        <div className="text-center text-gray-500">
          <Icon className="w-20 h-20 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">{title}</h3>
          <p className="text-sm">{description}</p>
        </div>
      </CardContent>
    </Card>
  );
}
