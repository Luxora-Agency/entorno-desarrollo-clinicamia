'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Zap, Search, Pill, FlaskConical, Scan, FileText,
  Brain, Calendar, ClipboardList, Activity
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const QUICK_ACTIONS = [
  {
    id: 'search-patient',
    label: 'Buscar Paciente',
    icon: Search,
    shortcut: '⌘K',
    color: 'bg-blue-500 hover:bg-blue-600',
    description: 'Buscar por nombre o documento'
  },
  {
    id: 'new-prescription',
    label: 'Fórmula Médica',
    icon: Pill,
    shortcut: '⌘R',
    color: 'bg-green-500 hover:bg-green-600',
    description: 'Crear nueva prescripción'
  },
  {
    id: 'lab-order',
    label: 'Laboratorio',
    icon: FlaskConical,
    shortcut: '⌘L',
    color: 'bg-purple-500 hover:bg-purple-600',
    description: 'Solicitar exámenes'
  },
  {
    id: 'imaging-order',
    label: 'Imágenes',
    icon: Scan,
    shortcut: '⌘I',
    color: 'bg-indigo-500 hover:bg-indigo-600',
    description: 'Solicitar estudios'
  },
  {
    id: 'certificate',
    label: 'Certificado',
    icon: FileText,
    shortcut: '⌘C',
    color: 'bg-amber-500 hover:bg-amber-600',
    description: 'Generar certificado'
  },
  {
    id: 'ai-assistant',
    label: 'Asistente IA',
    icon: Brain,
    shortcut: '⌘A',
    color: 'bg-pink-500 hover:bg-pink-600',
    description: 'Consultar asistente médico'
  },
  {
    id: 'view-schedule',
    label: 'Mi Agenda',
    icon: Calendar,
    shortcut: '⌘G',
    color: 'bg-cyan-500 hover:bg-cyan-600',
    description: 'Ver agenda del día'
  },
  {
    id: 'view-history',
    label: 'Historial',
    icon: ClipboardList,
    shortcut: '⌘H',
    color: 'bg-gray-500 hover:bg-gray-600',
    description: 'Ver historial clínico'
  }
];

export default function QuickActionsWidget({
  onAction,
  selectedPatient,
  className = ''
}) {
  const { toast } = useToast();

  const handleAction = (action) => {
    // Acciones que requieren paciente seleccionado
    const requiresPatient = ['new-prescription', 'lab-order', 'imaging-order', 'certificate', 'view-history'];

    if (requiresPatient.includes(action.id) && !selectedPatient) {
      toast({
        title: 'Seleccione un paciente',
        description: `Para "${action.label}" primero debe seleccionar un paciente.`,
        variant: 'default'
      });
      return;
    }

    if (onAction) {
      onAction(action);
    }
  };

  return (
    <Card className={`${className}`}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Zap className="h-4 w-4 text-yellow-500" />
          Acciones Rápidas
          {selectedPatient && (
            <Badge variant="outline" className="ml-auto text-xs font-normal">
              {selectedPatient.nombre} {selectedPatient.apellido}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-4 gap-2">
          {QUICK_ACTIONS.map((action) => {
            const Icon = action.icon;
            const requiresPatient = ['new-prescription', 'lab-order', 'imaging-order', 'certificate', 'view-history'].includes(action.id);
            const isDisabled = requiresPatient && !selectedPatient;

            return (
              <Button
                key={action.id}
                variant="ghost"
                className={`
                  flex flex-col items-center justify-center h-20 p-2 gap-1
                  hover:bg-gray-100 transition-all group relative
                  ${isDisabled ? 'opacity-50' : ''}
                `}
                onClick={() => handleAction(action)}
                title={`${action.description}${action.shortcut ? ` (${action.shortcut})` : ''}`}
              >
                <div className={`
                  p-2 rounded-lg text-white transition-transform group-hover:scale-110
                  ${action.color}
                `}>
                  <Icon className="h-4 w-4" />
                </div>
                <span className="text-[10px] text-gray-600 text-center leading-tight">
                  {action.label}
                </span>
                {action.shortcut && (
                  <span className="absolute top-1 right-1 text-[8px] text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">
                    {action.shortcut}
                  </span>
                )}
              </Button>
            );
          })}
        </div>

        {/* Indicador de paciente requerido */}
        {!selectedPatient && (
          <div className="mt-3 text-center">
            <p className="text-xs text-gray-400 flex items-center justify-center gap-1">
              <Activity className="h-3 w-3" />
              Algunas acciones requieren seleccionar un paciente primero
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
