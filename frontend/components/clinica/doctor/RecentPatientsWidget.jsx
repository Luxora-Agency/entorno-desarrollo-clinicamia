'use client';

import { useState, useEffect } from 'react';
import {
  History, User, ChevronRight, Clock, FileText,
  Stethoscope, AlertCircle, X, ExternalLink
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const RECENT_PATIENTS_KEY = 'doctor_recent_patients';
const MAX_RECENT_PATIENTS = 10;

// Helper para formatear fecha relativa
const getRelativeTime = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Justo ahora';
  if (diffMins < 60) return `Hace ${diffMins} min`;
  if (diffHours < 24) return `Hace ${diffHours}h`;
  if (diffDays === 1) return 'Ayer';
  if (diffDays < 7) return `Hace ${diffDays} días`;
  return date.toLocaleDateString('es-CO', { day: 'numeric', month: 'short' ,
      timeZone: 'America/Bogota'
    });
};

// Obtener tipo de consulta badge
const getConsultaTypeBadge = (tipo) => {
  switch (tipo) {
    case 'consulta':
      return { label: 'Consulta', className: 'bg-blue-100 text-blue-700' };
    case 'urgencia':
      return { label: 'Urgencia', className: 'bg-red-100 text-red-700' };
    case 'control':
      return { label: 'Control', className: 'bg-green-100 text-green-700' };
    case 'hospitalizacion':
      return { label: 'Hospital', className: 'bg-purple-100 text-purple-700' };
    default:
      return { label: 'Atención', className: 'bg-gray-100 text-gray-700' };
  }
};

// Función para agregar un paciente a recientes (exportada para uso externo)
export function addRecentPatient(doctorId, patient, consultaType = 'consulta') {
  if (!doctorId || !patient) return;

  const key = `${RECENT_PATIENTS_KEY}_${doctorId}`;
  const stored = localStorage.getItem(key);
  let recentPatients = stored ? JSON.parse(stored) : [];

  // Remover si ya existe
  recentPatients = recentPatients.filter(p => p.id !== patient.id);

  // Agregar al inicio
  recentPatients.unshift({
    id: patient.id,
    nombre: patient.nombre,
    apellido: patient.apellido,
    cedula: patient.cedula,
    tipoDocumento: patient.tipoDocumento,
    telefono: patient.telefono,
    fechaAtencion: new Date().toISOString(),
    tipoConsulta: consultaType,
  });

  // Limitar a MAX_RECENT_PATIENTS
  recentPatients = recentPatients.slice(0, MAX_RECENT_PATIENTS);

  localStorage.setItem(key, JSON.stringify(recentPatients));
}

// Función para limpiar pacientes recientes
export function clearRecentPatients(doctorId) {
  const key = `${RECENT_PATIENTS_KEY}_${doctorId}`;
  localStorage.removeItem(key);
}

export default function RecentPatientsWidget({
  doctorId,
  onSelectPatient,
  onViewHCE,
  className = '',
  maxItems = 5
}) {
  const [patients, setPatients] = useState([]);

  // Cargar pacientes recientes
  useEffect(() => {
    const loadRecentPatients = () => {
      if (!doctorId) return;

      const key = `${RECENT_PATIENTS_KEY}_${doctorId}`;
      const stored = localStorage.getItem(key);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          setPatients(parsed.slice(0, maxItems));
        } catch (e) {
          console.error('Error parsing recent patients:', e);
        }
      }
    };

    loadRecentPatients();

    // Escuchar cambios en localStorage
    const handleStorageChange = (e) => {
      if (e.key === `${RECENT_PATIENTS_KEY}_${doctorId}`) {
        loadRecentPatients();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [doctorId, maxItems]);

  const handleRemovePatient = (patientId, e) => {
    e.stopPropagation();
    const key = `${RECENT_PATIENTS_KEY}_${doctorId}`;
    const stored = localStorage.getItem(key);
    if (stored) {
      try {
        let parsed = JSON.parse(stored);
        parsed = parsed.filter(p => p.id !== patientId);
        localStorage.setItem(key, JSON.stringify(parsed));
        setPatients(parsed.slice(0, maxItems));
      } catch (e) {
        console.error('Error removing patient:', e);
      }
    }
  };

  return (
    <Card className={`${className} border-0 shadow-sm`}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <div className="p-1.5 bg-indigo-100 rounded-lg">
              <History className="h-4 w-4 text-indigo-600" />
            </div>
            Pacientes Recientes
            {patients.length > 0 && (
              <Badge variant="secondary" className="text-xs">
                {patients.length}
              </Badge>
            )}
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        {patients.length === 0 ? (
          <div className="text-center py-6">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <History className="h-6 w-6 text-gray-400" />
            </div>
            <p className="text-sm text-gray-500">Sin pacientes recientes</p>
            <p className="text-xs text-gray-400 mt-1">Los pacientes atendidos aparecerán aquí</p>
          </div>
        ) : (
          <ScrollArea className="h-[200px] pr-2">
            <div className="space-y-2">
              {patients.map((patient) => {
                const tipoBadge = getConsultaTypeBadge(patient.tipoConsulta);

                return (
                  <TooltipProvider key={patient.id}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div
                          onClick={() => onSelectPatient?.(patient)}
                          className="w-full flex items-center gap-3 p-2.5 rounded-lg border border-gray-100 hover:border-indigo-200 hover:bg-gray-50 transition-all cursor-pointer group"
                        >
                          <Avatar className="h-9 w-9">
                            <AvatarFallback className="bg-indigo-100 text-indigo-700 text-xs">
                              {patient.nombre?.charAt(0)}{patient.apellido?.charAt(0)}
                            </AvatarFallback>
                          </Avatar>

                          <div className="flex-1 min-w-0 text-left">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {patient.nombre} {patient.apellido}
                            </p>
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {getRelativeTime(patient.fechaAtencion)}
                              </span>
                              <Badge className={`${tipoBadge.className} text-[10px] px-1.5 py-0 border-0`}>
                                {tipoBadge.label}
                              </Badge>
                            </div>
                          </div>

                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            {onViewHCE && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onViewHCE(patient);
                                }}
                              >
                                <FileText className="h-3.5 w-3.5 text-blue-500" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={(e) => handleRemovePatient(patient.id, e)}
                            >
                              <X className="h-3.5 w-3.5 text-gray-400 hover:text-red-500" />
                            </Button>
                          </div>

                          <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-indigo-400" />
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="left" className="max-w-xs">
                        <div className="space-y-1">
                          <p className="font-medium">{patient.nombre} {patient.apellido}</p>
                          <p className="text-xs text-gray-400">
                            {patient.tipoDocumento}: {patient.cedula}
                          </p>
                          {patient.telefono && (
                            <p className="text-xs text-gray-400">Tel: {patient.telefono}</p>
                          )}
                          <p className="text-xs text-gray-400">
                            Última atención: {getRelativeTime(patient.fechaAtencion)}
                          </p>
                          <p className="text-xs text-indigo-400 pt-1">
                            <Stethoscope className="h-3 w-3 inline mr-1" />
                            Click para ver opciones
                          </p>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
