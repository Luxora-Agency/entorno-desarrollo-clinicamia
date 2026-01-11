'use client';

import * as React from 'react';
import { Check, ChevronsUpDown, Search, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

export default function PatientSelect({ onSelect, value, className }) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState('');
  const [patients, setPatients] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [selectedPatient, setSelectedPatient] = React.useState(null);

  // Simple debounce logic inside effect if hook not available
  React.useEffect(() => {
    const timer = setTimeout(() => {
        if (query.length > 2) {
            searchPatients(query);
        }
    }, 500);
    return () => clearTimeout(timer);
  }, [query]);

  const searchPatients = async (searchTerm) => {
    setLoading(true);
    try {
        const token = localStorage.getItem('token');
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
        const res = await fetch(`${apiUrl}/pacientes/search?q=${encodeURIComponent(searchTerm)}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success) {
            setPatients(data.data?.pacientes || []);
        }
    } catch (error) {
        console.error('Error searching patients:', error);
    } finally {
        setLoading(false);
    }
  };

  // If value (patientId) is provided but we don't have the patient details, we might want to fetch them
  // For now, we assume parent passes the full object or we just show "Paciente seleccionado"
  
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between", className)}
        >
          {selectedPatient ? (
              <span className="flex items-center gap-2">
                  <User className="h-4 w-4 text-blue-500" />
                  {selectedPatient.nombre} {selectedPatient.apellido}
              </span>
          ) : (
             value ? "Paciente seleccionado" : "Buscar paciente..."
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0">
        <Command shouldFilter={false}> 
          {/* Disable client-side filtering because we do server-side */}
          <CommandInput 
            placeholder="Buscar por nombre o cédula..." 
            value={query}
            onValueChange={setQuery}
          />
          <CommandList>
            {loading && <div className="p-4 text-sm text-center text-gray-500">Buscando...</div>}
            {!loading && patients.length === 0 && query.length > 2 && (
                <CommandEmpty>No se encontraron pacientes.</CommandEmpty>
            )}
            {!loading && query.length <= 2 && (
                <div className="p-4 text-sm text-center text-gray-500">Ingrese al menos 3 caracteres</div>
            )}
            
            <CommandGroup>
              {patients.map((patient) => (
                <CommandItem
                  key={patient.id}
                  value={patient.id}
                  onSelect={() => {
                    setSelectedPatient(patient);
                    onSelect(patient);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === patient.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <div className="flex flex-col">
                      <span className="font-medium">{patient.nombre} {patient.apellido}</span>
                      <span className="text-xs text-gray-500">{patient.tipoDocumento || 'CC'}: {patient.cedula}</span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
