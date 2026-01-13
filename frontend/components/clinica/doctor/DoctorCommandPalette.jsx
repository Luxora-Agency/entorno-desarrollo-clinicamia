'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Search, User, Calendar, FileText, Pill, FlaskConical,
  Scan, Brain, Stethoscope, Clock, AlertCircle, Activity,
  Home, Settings, History, UserPlus, ClipboardList, Bed
} from 'lucide-react';
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
  CommandShortcut,
} from '@/components/ui/command';
import { DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';

// Acciones rápidas disponibles (doctor no puede agendar citas)
const QUICK_ACTIONS = [
  {
    id: 'search-patient',
    label: 'Buscar paciente',
    description: 'Buscar por nombre o documento',
    icon: Search,
    shortcut: '⌘P',
    category: 'search'
  },
  {
    id: 'new-prescription',
    label: 'Nueva fórmula médica',
    description: 'Crear prescripción',
    icon: Pill,
    shortcut: '⌘R',
    category: 'actions'
  },
  {
    id: 'lab-order',
    label: 'Orden de laboratorio',
    description: 'Solicitar exámenes',
    icon: FlaskConical,
    shortcut: '⌘L',
    category: 'orders'
  },
  {
    id: 'imaging-order',
    label: 'Orden de imágenes',
    description: 'Solicitar estudios',
    icon: Scan,
    shortcut: '⌘I',
    category: 'orders'
  },
  {
    id: 'certificate',
    label: 'Generar certificado',
    description: 'Certificado médico',
    icon: FileText,
    shortcut: '⌘C',
    category: 'documents'
  },
  {
    id: 'ai-assistant',
    label: 'Asistente IA',
    description: 'Consultar asistente médico',
    icon: Brain,
    shortcut: '⌘A',
    category: 'tools'
  },
  {
    id: 'view-schedule',
    label: 'Mi agenda',
    description: 'Ver agenda del día',
    icon: Calendar,
    shortcut: '⌘G',
    category: 'navigation'
  }
];

// Navegación rápida
const NAVIGATION_ITEMS = [
  { id: 'dashboard', label: 'Panel principal', icon: Home, path: '/dashboard' },
  { id: 'hospitalization', label: 'Hospitalización', icon: Bed, path: '/hospitalizacion' },
  { id: 'history', label: 'Historial clínico', icon: ClipboardList, path: '/hce' },
];

// Máximo de pacientes recientes a guardar
const MAX_RECENT_PATIENTS = 5;
const RECENT_PATIENTS_KEY = 'doctor_recent_patients';

export default function DoctorCommandPalette({
  open,
  onOpenChange,
  onSelectPatient,
  onAction,
  onNavigate,
}) {
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [patients, setPatients] = useState([]);
  const [recentPatients, setRecentPatients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTimeout, setSearchTimeout] = useState(null);

  // Cargar pacientes recientes del localStorage
  useEffect(() => {
    const stored = localStorage.getItem(RECENT_PATIENTS_KEY);
    if (stored) {
      try {
        setRecentPatients(JSON.parse(stored));
      } catch (e) {
        console.error('Error loading recent patients:', e);
      }
    }
  }, []);

  // Guardar paciente en recientes
  const addToRecentPatients = useCallback((patient) => {
    setRecentPatients(prev => {
      const filtered = prev.filter(p => p.id !== patient.id);
      const updated = [patient, ...filtered].slice(0, MAX_RECENT_PATIENTS);
      localStorage.setItem(RECENT_PATIENTS_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  // Búsqueda de pacientes con debounce
  const searchPatients = useCallback(async (query) => {
    if (!query || query.length < 2) {
      setPatients([]);
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';

      const response = await fetch(
        `${apiUrl}/pacientes?search=${encodeURIComponent(query)}&limit=8`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const data = await response.json();
      if (data.success) {
        setPatients(data.data || []);
      }
    } catch (error) {
      console.error('Error searching patients:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Manejar cambio en búsqueda con debounce
  useEffect(() => {
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    const timeout = setTimeout(() => {
      searchPatients(search);
    }, 300);

    setSearchTimeout(timeout);

    return () => {
      if (timeout) clearTimeout(timeout);
    };
  }, [search, searchPatients]);

  // Resetear estado cuando se cierra
  useEffect(() => {
    if (!open) {
      setSearch('');
      setPatients([]);
    }
  }, [open]);

  // Manejar selección de paciente
  const handleSelectPatient = useCallback((patient) => {
    addToRecentPatients({
      id: patient.id,
      nombre: patient.nombre,
      apellido: patient.apellido,
      cedula: patient.cedula,
      tipoDocumento: patient.tipoDocumento
    });

    onOpenChange(false);
    if (onSelectPatient) {
      onSelectPatient(patient);
    }
  }, [addToRecentPatients, onOpenChange, onSelectPatient]);

  // Manejar acción rápida
  const handleAction = useCallback((action) => {
    onOpenChange(false);
    if (onAction) {
      onAction(action);
    } else {
      toast({
        title: action.label,
        description: `Acción "${action.label}" ejecutada`,
      });
    }
  }, [onAction, onOpenChange, toast]);

  // Manejar navegación
  const handleNavigate = useCallback((item) => {
    onOpenChange(false);
    if (onNavigate) {
      onNavigate(item.path);
    }
  }, [onNavigate, onOpenChange]);

  // Filtrar acciones según búsqueda
  const filteredActions = useMemo(() => {
    if (!search) return QUICK_ACTIONS;
    const searchLower = search.toLowerCase();
    return QUICK_ACTIONS.filter(action =>
      action.label.toLowerCase().includes(searchLower) ||
      action.description.toLowerCase().includes(searchLower)
    );
  }, [search]);

  // Filtrar navegación según búsqueda
  const filteredNavigation = useMemo(() => {
    if (!search) return NAVIGATION_ITEMS;
    const searchLower = search.toLowerCase();
    return NAVIGATION_ITEMS.filter(item =>
      item.label.toLowerCase().includes(searchLower)
    );
  }, [search]);

  // Determinar si mostrar pacientes recientes
  const showRecentPatients = !search && recentPatients.length > 0;
  const showSearchResults = search.length >= 2 && patients.length > 0;

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <DialogTitle className="sr-only">Buscar pacientes y acciones</DialogTitle>
      <CommandInput
        placeholder="Buscar pacientes, acciones, comandos..."
        value={search}
        onValueChange={setSearch}
      />
      <CommandList className="max-h-[400px]">
        <CommandEmpty>
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-4">
              <Clock className="h-4 w-4 animate-spin" />
              <span>Buscando...</span>
            </div>
          ) : search.length < 2 ? (
            <span>Escribe al menos 2 caracteres para buscar pacientes</span>
          ) : (
            <span>No se encontraron resultados</span>
          )}
        </CommandEmpty>

        {/* Pacientes recientes */}
        {showRecentPatients && (
          <CommandGroup heading="Pacientes Recientes">
            {recentPatients.map((patient) => (
              <CommandItem
                key={`recent-${patient.id}`}
                onSelect={() => handleSelectPatient(patient)}
                className="flex items-center gap-3 py-2"
              >
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-blue-100 text-blue-600 text-xs">
                    {patient.nombre?.charAt(0)}{patient.apellido?.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {patient.nombre} {patient.apellido}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {patient.tipoDocumento}: {patient.cedula}
                  </p>
                </div>
                <Badge variant="outline" className="text-[10px]">
                  <History className="h-3 w-3 mr-1" />
                  Reciente
                </Badge>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {/* Resultados de búsqueda de pacientes */}
        {showSearchResults && (
          <>
            <CommandGroup heading="Pacientes Encontrados">
              {patients.map((patient) => (
                <CommandItem
                  key={patient.id}
                  onSelect={() => handleSelectPatient(patient)}
                  className="flex items-center gap-3 py-2"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-emerald-100 text-emerald-600 text-xs">
                      {patient.nombre?.charAt(0)}{patient.apellido?.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {patient.nombre} {patient.apellido}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {patient.tipoDocumento}: {patient.cedula}
                      {patient.telefono && ` • ${patient.telefono}`}
                    </p>
                  </div>
                  <User className="h-4 w-4 text-muted-foreground" />
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandSeparator />
          </>
        )}

        {/* Acciones rápidas */}
        {filteredActions.length > 0 && (
          <>
            <CommandGroup heading="Acciones Rápidas">
              {filteredActions.slice(0, 6).map((action) => {
                const Icon = action.icon;
                return (
                  <CommandItem
                    key={action.id}
                    onSelect={() => handleAction(action)}
                    className="flex items-center gap-3"
                  >
                    <div className="flex items-center justify-center h-8 w-8 rounded-md bg-muted">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{action.label}</p>
                      <p className="text-xs text-muted-foreground">{action.description}</p>
                    </div>
                    {action.shortcut && (
                      <CommandShortcut>{action.shortcut}</CommandShortcut>
                    )}
                  </CommandItem>
                );
              })}
            </CommandGroup>
            <CommandSeparator />
          </>
        )}

        {/* Navegación */}
        {filteredNavigation.length > 0 && (
          <CommandGroup heading="Navegación">
            {filteredNavigation.map((item) => {
              const Icon = item.icon;
              return (
                <CommandItem
                  key={item.id}
                  onSelect={() => handleNavigate(item)}
                  className="flex items-center gap-3"
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </CommandItem>
              );
            })}
          </CommandGroup>
        )}
      </CommandList>

      {/* Footer con atajos */}
      <div className="border-t px-3 py-2 text-[10px] text-muted-foreground flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span><kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px]">↑↓</kbd> navegar</span>
          <span><kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px]">↵</kbd> seleccionar</span>
          <span><kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px]">esc</kbd> cerrar</span>
        </div>
        <div className="flex items-center gap-1">
          <Stethoscope className="h-3 w-3" />
          <span>Clínica Mía</span>
        </div>
      </div>
    </CommandDialog>
  );
}

// Hook para usar el command palette globalmente
export function useDoctorCommandPalette() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl+K o Cmd+K para abrir
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return { open, setOpen };
}
