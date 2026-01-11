'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  FileText,
  Award,
  FileSignature,
  ClipboardCheck,
  FolderOpen,
  LayoutDashboard
} from 'lucide-react';
import DashboardHistoriaClinica from './DashboardHistoriaClinica';
import DocumentosNormativosTab from './documentos/DocumentosNormativosTab';
import CertificacionesTab from './certificaciones/CertificacionesTab';
import ConsentimientosTab from './consentimientos/ConsentimientosTab';
import AuditoriaHCTab from './auditoria/AuditoriaHCTab';
import FormatosOperativosTab from './formatos/FormatosOperativosTab';

/**
 * Módulo principal de Historia Clínica - Calidad 2.0
 *
 * Gestión de calidad de historias clínicas, cumplimiento normativo,
 * consentimientos informados, auditoría y certificaciones
 *
 * 6 Tabs:
 * 1. Dashboard - Resumen general e indicadores
 * 2. Documentos Normativos - Manuales, procedimientos, políticas
 * 3. Certificaciones - Control de vigencias y cumplimiento
 * 4. Consentimientos - Biblioteca de plantillas y registro
 * 5. Auditoría - Checklist, hallazgos, planes de mejora
 * 6. Formatos Operativos - Control movimientos, contingencia
 */
export default function HistoriaClinicaModule() {
  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Historia Clínica - Calidad</h2>
        <p className="text-muted-foreground">
          Gestión de calidad de historias clínicas y cumplimiento normativo
        </p>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="dashboard" className="gap-2">
            <LayoutDashboard className="h-4 w-4" />
            <span className="hidden md:inline">Dashboard</span>
          </TabsTrigger>
          <TabsTrigger value="documentos" className="gap-2">
            <FileText className="h-4 w-4" />
            <span className="hidden md:inline">Documentos</span>
          </TabsTrigger>
          <TabsTrigger value="certificaciones" className="gap-2">
            <Award className="h-4 w-4" />
            <span className="hidden md:inline">Certificaciones</span>
          </TabsTrigger>
          <TabsTrigger value="consentimientos" className="gap-2">
            <FileSignature className="h-4 w-4" />
            <span className="hidden md:inline">Consentimientos</span>
          </TabsTrigger>
          <TabsTrigger value="auditoria" className="gap-2">
            <ClipboardCheck className="h-4 w-4" />
            <span className="hidden md:inline">Auditoría</span>
          </TabsTrigger>
          <TabsTrigger value="formatos" className="gap-2">
            <FolderOpen className="h-4 w-4" />
            <span className="hidden md:inline">Formatos</span>
          </TabsTrigger>
        </TabsList>

        {/* Tab: Dashboard */}
        <TabsContent value="dashboard">
          <DashboardHistoriaClinica />
        </TabsContent>

        {/* Tab: Documentos Normativos */}
        <TabsContent value="documentos">
          <DocumentosNormativosTab />
        </TabsContent>

        {/* Tab: Certificaciones */}
        <TabsContent value="certificaciones">
          <CertificacionesTab />
        </TabsContent>

        {/* Tab: Consentimientos Informados */}
        <TabsContent value="consentimientos">
          <ConsentimientosTab />
        </TabsContent>

        {/* Tab: Auditoría de Calidad HC */}
        <TabsContent value="auditoria">
          <AuditoriaHCTab />
        </TabsContent>

        {/* Tab: Formatos Operativos */}
        <TabsContent value="formatos">
          <FormatosOperativosTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
