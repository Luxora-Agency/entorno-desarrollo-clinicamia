'use client';

import { useState } from 'react';
import {
  UserPlus, FileText, Calendar, Pill, Stethoscope,
  ClipboardList, Brain, FlaskConical, Scan, Printer,
  Search, Clock, AlertCircle, MessageSquare
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

// Definición de acciones rápidas disponibles
const quickActions = [
  {
    id: 'nueva-cita-urgente',
    label: 'Cita Urgente',
    description: 'Agendar paciente de urgencia',
    icon: AlertCircle,
    color: 'text-red-600',
    bgColor: 'bg-red-50 hover:bg-red-100',
    borderColor: 'border-red-200',
    action: 'urgent-appointment'
  },
  {
    id: 'buscar-paciente',
    label: 'Buscar Paciente',
    description: 'Buscar por nombre o cédula',
    icon: Search,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50 hover:bg-blue-100',
    borderColor: 'border-blue-200',
    action: 'search-patient'
  },
  {
    id: 'generar-formula',
    label: 'Nueva Fórmula',
    description: 'Crear prescripción médica',
    icon: Pill,
    color: 'text-green-600',
    bgColor: 'bg-green-50 hover:bg-green-100',
    borderColor: 'border-green-200',
    action: 'new-prescription'
  },
  {
    id: 'orden-laboratorio',
    label: 'Orden Lab',
    description: 'Solicitar exámenes',
    icon: FlaskConical,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50 hover:bg-purple-100',
    borderColor: 'border-purple-200',
    action: 'lab-order'
  },
  {
    id: 'orden-imagenes',
    label: 'Orden Imágenes',
    description: 'Solicitar estudios',
    icon: Scan,
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-50 hover:bg-indigo-100',
    borderColor: 'border-indigo-200',
    action: 'imaging-order'
  },
  {
    id: 'certificado',
    label: 'Certificado',
    description: 'Generar certificado médico',
    icon: FileText,
    color: 'text-amber-600',
    bgColor: 'bg-amber-50 hover:bg-amber-100',
    borderColor: 'border-amber-200',
    action: 'certificate'
  },
  {
    id: 'asistente-ia',
    label: 'Asistente IA',
    description: 'Consultar asistente médico',
    icon: Brain,
    color: 'text-cyan-600',
    bgColor: 'bg-cyan-50 hover:bg-cyan-100',
    borderColor: 'border-cyan-200',
    action: 'ai-assistant'
  },
  {
    id: 'mi-agenda',
    label: 'Mi Agenda',
    description: 'Ver agenda completa',
    icon: Calendar,
    color: 'text-teal-600',
    bgColor: 'bg-teal-50 hover:bg-teal-100',
    borderColor: 'border-teal-200',
    action: 'view-schedule'
  }
];

export default function DoctorQuickActions({
  onAction,
  onSearchPatient,
  onOpenAIAssistant,
  onViewSchedule,
  className = '',
  compact = false
}) {
  const { toast } = useToast();
  const [searchDialogOpen, setSearchDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState([]);

  const handleAction = (action) => {
    switch (action.action) {
      case 'search-patient':
        setSearchDialogOpen(true);
        break;
      case 'ai-assistant':
        if (onOpenAIAssistant) {
          onOpenAIAssistant();
        } else {
          toast({
            title: 'Asistente IA',
            description: 'El asistente de IA se abrirá en la consulta activa.',
          });
        }
        break;
      case 'view-schedule':
        if (onViewSchedule) {
          onViewSchedule();
        }
        break;
      default:
        if (onAction) {
          onAction(action);
        } else {
          toast({
            title: action.label,
            description: `Función "${action.description}" próximamente disponible.`,
          });
        }
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setSearching(true);
    try {
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';

      const response = await fetch(
        `${apiUrl}/pacientes?search=${encodeURIComponent(searchQuery)}&limit=10`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const data = await response.json();

      if (data.success) {
        setSearchResults(data.data || []);
        if (data.data?.length === 0) {
          toast({
            title: 'Sin resultados',
            description: 'No se encontraron pacientes con ese criterio.',
            variant: 'default'
          });
        }
      }
    } catch (error) {
      console.error('Error searching patients:', error);
      toast({
        title: 'Error',
        description: 'No se pudo realizar la búsqueda.',
        variant: 'destructive'
      });
    } finally {
      setSearching(false);
    }
  };

  const handleSelectPatient = (patient) => {
    setSearchDialogOpen(false);
    setSearchQuery('');
    setSearchResults([]);
    if (onSearchPatient) {
      onSearchPatient(patient);
    }
  };

  if (compact) {
    // Versión compacta: solo iconos en una fila
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        {quickActions.slice(0, 6).map((action) => {
          const Icon = action.icon;
          return (
            <Button
              key={action.id}
              variant="ghost"
              size="sm"
              className={`${action.bgColor} ${action.color} p-2 h-9 w-9`}
              onClick={() => handleAction(action)}
              title={action.label}
            >
              <Icon className="h-4 w-4" />
            </Button>
          );
        })}
      </div>
    );
  }

  return (
    <>
      <Card className={className}>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Stethoscope className="h-4 w-4 text-emerald-500" />
            Acciones Rápidas
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <button
                  key={action.id}
                  onClick={() => handleAction(action)}
                  className={`
                    flex flex-col items-center gap-2 p-3 rounded-lg border
                    ${action.bgColor} ${action.borderColor}
                    transition-all duration-200 hover:scale-[1.02] hover:shadow-sm
                  `}
                >
                  <div className={`p-2 rounded-full bg-white shadow-sm ${action.color}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="text-center">
                    <p className={`text-xs font-medium ${action.color}`}>{action.label}</p>
                    <p className="text-[10px] text-gray-500 mt-0.5 leading-tight">
                      {action.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Dialog de búsqueda de pacientes */}
      <Dialog open={searchDialogOpen} onOpenChange={setSearchDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Search className="h-5 w-5 text-blue-500" />
              Buscar Paciente
            </DialogTitle>
            <DialogDescription>
              Busca por nombre, apellido o número de documento
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Nombre, apellido o cédula..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="flex-1"
              />
              <Button onClick={handleSearch} disabled={searching || !searchQuery.trim()}>
                {searching ? (
                  <Clock className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
              </Button>
            </div>

            {/* Resultados */}
            {searchResults.length > 0 && (
              <div className="border rounded-lg divide-y max-h-60 overflow-y-auto">
                {searchResults.map((patient) => (
                  <button
                    key={patient.id}
                    onClick={() => handleSelectPatient(patient)}
                    className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 transition-colors text-left"
                  >
                    <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-medium text-sm">
                      {patient.nombre?.charAt(0)}{patient.apellido?.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">
                        {patient.nombre} {patient.apellido}
                      </p>
                      <p className="text-xs text-gray-500">
                        {patient.tipoDocumento}: {patient.cedula}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
