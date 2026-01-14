'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Calendar, dateFnsLocalizer, Views } from 'react-big-calendar';
import withDragAndDrop from 'react-big-calendar/lib/addons/dragAndDrop';
import format from 'date-fns/format';
import parse from 'date-fns/parse';
import startOfWeek from 'date-fns/startOfWeek';
import getDay from 'date-fns/getDay';
import esES from 'date-fns/locale/es';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import {
  Calendar as CalendarIcon, Trash2, CheckCircle2, CalendarDays, Repeat, Save, X, Clock
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import 'react-big-calendar/lib/addons/dragAndDrop/styles.css';

// Configuración de localización
const locales = {
  'es': esES,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

const DnDCalendar = withDragAndDrop(Calendar);

// Helper para verificar si una key es fecha específica (YYYY-MM-DD) o día de semana (0-6)
const isSpecificDate = (key) => {
  return key && key.includes('-');
};

// Helper para formatear fecha como YYYY-MM-DD
const formatDateKey = (date) => {
  return format(date, 'yyyy-MM-dd');
};

export default function DoctorScheduleManager({ doctorId, initialHorarios, onChange, bloqueos = [] }) {
  const { toast } = useToast();
  const [view, setView] = useState(Views.WEEK);
  const [date, setDate] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [blockEvents, setBlockEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);

  // Estado para bloques pendientes (selección múltiple antes de guardar)
  const [pendingBlocks, setPendingBlocks] = useState([]);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [createMode, setCreateMode] = useState('template'); // 'template' o 'specific'

  // Estado local de horarios para evitar sobrescribir eventos al navegar
  const [localHorarios, setLocalHorarios] = useState(initialHorarios || {});
  const [isInitialized, setIsInitialized] = useState(false);

  // Convertir horarios guardados a eventos del calendario
  const convertHorariosToEvents = useCallback((horariosData, weekStart) => {
    if (!horariosData || Object.keys(horariosData).length === 0) return [];

    const loadedEvents = [];
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);

    // Primero, crear eventos de plantilla semanal
    const templateEvents = {};

    Object.entries(horariosData).forEach(([key, blocks]) => {
      if (!Array.isArray(blocks)) return;

      if (isSpecificDate(key)) {
        // Es fecha específica - verificar si está en la semana visible
        const specificDate = new Date(key + 'T00:00:00');
        if (specificDate >= weekStart && specificDate < weekEnd) {
          const dayIndex = getDay(specificDate);

          blocks.forEach((block, idx) => {
            const startStr = block.inicio || block.start;
            const endStr = block.fin || block.end;
            if (!startStr || !endStr) return;

            const [startH, startM] = startStr.split(':').map(Number);
            const [endH, endM] = endStr.split(':').map(Number);

            const startDate = new Date(specificDate);
            startDate.setHours(startH, startM, 0);

            const endDate = new Date(specificDate);
            endDate.setHours(endH, endM, 0);

            // Marcar que este día tiene fecha específica (para no mostrar plantilla)
            if (!templateEvents[dayIndex]) {
              templateEvents[dayIndex] = { hasSpecific: true, events: [] };
            } else {
              templateEvents[dayIndex].hasSpecific = true;
            }

            loadedEvents.push({
              id: `specific-${key}-${idx}`,
              title: 'Disponible (Esta fecha)',
              start: startDate,
              end: endDate,
              resourceId: doctorId,
              isSpecificDate: true,
              dateKey: key,
              dayOfWeek: dayIndex,
            });
          });
        }
      } else {
        // Es plantilla semanal (día de semana 0-6)
        const dayIndex = parseInt(key);
        if (isNaN(dayIndex) || dayIndex < 0 || dayIndex > 6) return;

        // Marcar que existe plantilla para este día
        if (!templateEvents[dayIndex]) {
          templateEvents[dayIndex] = { hasSpecific: false, events: [] };
        }

        blocks.forEach((block, idx) => {
          const startStr = block.inicio || block.start;
          const endStr = block.fin || block.end;
          if (!startStr || !endStr) return;

          templateEvents[dayIndex].events.push({ block, idx, startStr, endStr });
        });
      }
    });

    // Ahora agregar eventos de plantilla solo para días sin fecha específica
    Object.entries(templateEvents).forEach(([dayIndexStr, data]) => {
      const dayIndex = parseInt(dayIndexStr);

      // Si este día tiene fecha específica, no mostrar plantilla
      if (data.hasSpecific) return;

      const eventDate = new Date(weekStart);
      eventDate.setDate(weekStart.getDate() + dayIndex);

      data.events.forEach(({ block, idx, startStr, endStr }) => {
        const [startH, startM] = startStr.split(':').map(Number);
        const [endH, endM] = endStr.split(':').map(Number);

        const startDate = new Date(eventDate);
        startDate.setHours(startH, startM, 0);

        const endDate = new Date(eventDate);
        endDate.setHours(endH, endM, 0);

        loadedEvents.push({
          id: `template-${dayIndex}-${idx}`,
          title: 'Disponible (Semanal)',
          start: startDate,
          end: endDate,
          resourceId: doctorId,
          isSpecificDate: false,
          dayOfWeek: dayIndex,
        });
      });
    });

    return loadedEvents;
  }, [doctorId]);

  // Inicializar desde props solo una vez
  useEffect(() => {
    if (!isInitialized && initialHorarios) {
      setLocalHorarios(initialHorarios);
      setIsInitialized(true);
    }
  }, [initialHorarios, isInitialized]);

  // Convertir horarios a eventos cuando cambia la semana visible o los horarios locales
  useEffect(() => {
    const currentStartOfWeek = startOfWeek(date, { weekStartsOn: 0 });
    const newEvents = convertHorariosToEvents(localHorarios, currentStartOfWeek);
    setEvents(newEvents);
  }, [localHorarios, date, convertHorariosToEvents]);

  // Procesar bloqueos para mostrarlos en el calendario
  useEffect(() => {
    if (!bloqueos || bloqueos.length === 0) {
      setBlockEvents([]);
      return;
    }

    const parseDateLocal = (dateString) => {
      if (!dateString) return null;
      const dateOnly = dateString.split('T')[0];
      const [year, month, day] = dateOnly.split('-').map(Number);
      return new Date(year, month - 1, day);
    };

    const currentWeekStart = startOfWeek(date, { weekStartsOn: 0 });
    const currentWeekEnd = new Date(currentWeekStart);
    currentWeekEnd.setDate(currentWeekEnd.getDate() + 7);

    const bloqueosEvents = [];

    bloqueos.forEach((bloqueo) => {
      if (!bloqueo.activo) return;

      const fechaInicio = parseDateLocal(bloqueo.fechaInicio);
      const fechaFin = parseDateLocal(bloqueo.fechaFin);

      if (!fechaInicio || !fechaFin) return;
      if (fechaFin < currentWeekStart || fechaInicio > currentWeekEnd) return;

      for (let d = new Date(currentWeekStart); d < currentWeekEnd; d.setDate(d.getDate() + 1)) {
        const currentDay = new Date(d);
        currentDay.setHours(0, 0, 0, 0);

        const fechaInicioNorm = new Date(fechaInicio);
        fechaInicioNorm.setHours(0, 0, 0, 0);
        const fechaFinNorm = new Date(fechaFin);
        fechaFinNorm.setHours(23, 59, 59, 999);

        if (currentDay < fechaInicioNorm || currentDay > fechaFinNorm) continue;

        if (!bloqueo.horaInicio || !bloqueo.horaFin) {
          const startOfDay = new Date(currentDay);
          startOfDay.setHours(6, 0, 0);
          const endOfDay = new Date(currentDay);
          endOfDay.setHours(22, 0, 0);

          bloqueosEvents.push({
            id: `bloqueo-${bloqueo.id}-${currentDay.getTime()}`,
            title: `${bloqueo.motivo || bloqueo.tipo || 'Bloqueado'}`,
            start: startOfDay,
            end: endOfDay,
            isBloqueo: true,
            bloqueoTipo: bloqueo.tipo,
            bloqueoMotivo: bloqueo.motivo,
          });
        } else {
          const [startH, startM] = bloqueo.horaInicio.split(':').map(Number);
          const [endH, endM] = bloqueo.horaFin.split(':').map(Number);

          const startDate = new Date(currentDay);
          startDate.setHours(startH, startM, 0);

          const endDate = new Date(currentDay);
          endDate.setHours(endH, endM, 0);

          bloqueosEvents.push({
            id: `bloqueo-${bloqueo.id}-${currentDay.getTime()}`,
            title: `${bloqueo.motivo || bloqueo.tipo || 'Bloqueado'}`,
            start: startDate,
            end: endDate,
            isBloqueo: true,
            bloqueoTipo: bloqueo.tipo,
            bloqueoMotivo: bloqueo.motivo,
          });
        }
      }
    });

    setBlockEvents(bloqueosEvents);
  }, [bloqueos, date]);

  // Función para verificar superposición
  const hasOverlap = useCallback((event1, event2) => {
    if (event1.id === event2.id) return false;
    if (getDay(event1.start) !== getDay(event2.start)) return false;
    return event1.start < event2.end && event1.end > event2.start;
  }, []);

  const checkForOverlaps = useCallback((newEvent, existingEvents, excludeEventId = null) => {
    const eventsToCheck = excludeEventId
      ? existingEvents.filter(e => e.id !== excludeEventId)
      : existingEvents;

    for (const existing of eventsToCheck) {
      if (hasOverlap(newEvent, existing)) {
        return true;
      }
    }
    return false;
  }, [hasOverlap]);

  const checkForBlockOverlaps = useCallback((newEvent) => {
    for (const bloqueo of blockEvents) {
      if (hasOverlap(newEvent, bloqueo)) {
        return bloqueo;
      }
    }
    return null;
  }, [blockEvents, hasOverlap]);

  // Notificar cambios al padre y actualizar estado local
  const notifyChange = useCallback((currentEvents) => {
    // Crear copia de horarios existentes preservando fechas específicas de otras semanas
    const schedule = { ...localHorarios };

    // Limpiar plantilla semanal (0-6)
    for (let i = 0; i <= 6; i++) {
      delete schedule[i];
      delete schedule[String(i)];
    }

    // Limpiar fechas específicas de la semana actual
    const currentWeekStart = startOfWeek(date, { weekStartsOn: 0 });
    for (let i = 0; i < 7; i++) {
      const dayDate = new Date(currentWeekStart);
      dayDate.setDate(dayDate.getDate() + i);
      const dateKey = formatDateKey(dayDate);
      delete schedule[dateKey];
    }

    // Reconstruir desde eventos actuales
    currentEvents.forEach(event => {
      if (event.isBloqueo) return;

      const startStr = format(event.start, 'HH:mm');
      const endStr = format(event.end, 'HH:mm');
      const bloque = { inicio: startStr, fin: endStr };

      if (event.isSpecificDate) {
        // Guardar por fecha específica
        const dateKey = event.dateKey || formatDateKey(event.start);
        if (!schedule[dateKey]) {
          schedule[dateKey] = [];
        }
        schedule[dateKey].push(bloque);
      } else {
        // Guardar por día de semana (plantilla)
        const dayIndex = getDay(event.start);
        if (!schedule[dayIndex]) {
          schedule[dayIndex] = [];
        }
        schedule[dayIndex].push(bloque);
      }
    });

    // Ordenar bloques por hora de inicio
    Object.keys(schedule).forEach(key => {
      if (Array.isArray(schedule[key])) {
        schedule[key].sort((a, b) => a.inicio.localeCompare(b.inicio));
      }
    });

    // Actualizar estado local inmediatamente
    setLocalHorarios(schedule);

    // Notificar al padre
    if (onChange) {
      onChange(schedule);
    }
  }, [onChange, date, localHorarios]);

  // Manejar selección de slot (nuevo bloque pendiente)
  const handleSelectSlot = useCallback(
    ({ start, end }) => {
      const newBlock = {
        id: `pending-${Date.now()}`,
        title: 'Nuevo (sin guardar)',
        start,
        end,
        isPending: true,
      };

      const bloqueoConflicto = checkForBlockOverlaps(newBlock);
      if (bloqueoConflicto) {
        toast({
          title: 'Horario Bloqueado',
          description: `No se puede crear disponibilidad: ${bloqueoConflicto.bloqueoMotivo || 'Horario bloqueado'}`,
          variant: 'destructive'
        });
        return;
      }

      // Verificar conflictos con eventos existentes
      if (checkForOverlaps(newBlock, events)) {
        toast({
          title: 'Conflicto de horarios',
          description: 'El bloque se superpone con otro horario existente.',
          variant: 'destructive'
        });
        return;
      }

      // Verificar conflictos con otros bloques pendientes
      if (checkForOverlaps(newBlock, pendingBlocks)) {
        toast({
          title: 'Conflicto de horarios',
          description: 'El bloque se superpone con otro bloque pendiente.',
          variant: 'destructive'
        });
        return;
      }

      // Agregar a bloques pendientes
      setPendingBlocks(prev => [...prev, newBlock]);

      toast({
        title: 'Bloque agregado',
        description: 'Sigue seleccionando más franjas o haz clic en "Guardar bloques" cuando termines.',
      });
    },
    [events, pendingBlocks, toast, checkForOverlaps, checkForBlockOverlaps]
  );

  // Eliminar un bloque pendiente
  const handleRemovePendingBlock = useCallback((blockId) => {
    setPendingBlocks(prev => prev.filter(b => b.id !== blockId));
  }, []);

  // Limpiar todos los bloques pendientes
  const handleClearPendingBlocks = useCallback(() => {
    setPendingBlocks([]);
    toast({
      title: 'Bloques descartados',
      description: 'Se han eliminado todos los bloques pendientes.',
    });
  }, [toast]);

  // Abrir modal para confirmar y guardar bloques
  const handleOpenConfirmModal = useCallback(() => {
    if (pendingBlocks.length === 0) {
      toast({
        title: 'Sin bloques pendientes',
        description: 'Primero selecciona franjas horarias en el calendario.',
        variant: 'destructive'
      });
      return;
    }
    setCreateMode('template');
    setIsConfirmModalOpen(true);
  }, [pendingBlocks, toast]);

  // Confirmar y guardar todos los bloques pendientes
  const handleConfirmCreate = useCallback(() => {
    if (pendingBlocks.length === 0) return;

    const isSpecific = createMode === 'specific';
    const newSchedule = { ...localHorarios };

    // Agregar cada bloque pendiente al schedule
    pendingBlocks.forEach(block => {
      const { start, end } = block;
      const dateKey = formatDateKey(start);
      const dayOfWeek = getDay(start);

      const bloque = {
        inicio: format(start, 'HH:mm'),
        fin: format(end, 'HH:mm')
      };

      if (isSpecific) {
        // Guardar por fecha específica
        if (!newSchedule[dateKey]) {
          newSchedule[dateKey] = [];
        }
        newSchedule[dateKey].push(bloque);
      } else {
        // Guardar por día de semana (plantilla)
        if (!newSchedule[dayOfWeek]) {
          newSchedule[dayOfWeek] = [];
        }
        newSchedule[dayOfWeek].push(bloque);
      }
    });

    // Ordenar bloques por hora de inicio
    Object.keys(newSchedule).forEach(key => {
      if (Array.isArray(newSchedule[key])) {
        newSchedule[key].sort((a, b) => a.inicio.localeCompare(b.inicio));
      }
    });

    // Actualizar estado local
    setLocalHorarios(newSchedule);

    // Notificar al padre
    if (onChange) {
      onChange(newSchedule);
    }

    // Limpiar bloques pendientes y cerrar modal
    setPendingBlocks([]);
    setIsConfirmModalOpen(false);

    toast({
      title: 'Bloques Guardados',
      description: isSpecific
        ? `${pendingBlocks.length} bloque(s) guardado(s) como fechas específicas.`
        : `${pendingBlocks.length} bloque(s) guardado(s) como plantilla semanal.`
    });
  }, [pendingBlocks, createMode, localHorarios, onChange, toast]);

  // Manejar arrastrar evento
  const handleEventDrop = useCallback(
    ({ event, start, end }) => {
      if (event.isBloqueo) {
        toast({
          title: 'No permitido',
          description: 'Los bloqueos no se pueden mover desde aquí.',
        });
        return;
      }

      const movedEvent = { ...event, start, end };

      const bloqueoConflicto = checkForBlockOverlaps(movedEvent);
      if (bloqueoConflicto) {
        toast({
          title: 'Horario Bloqueado',
          description: `No se puede mover aquí: ${bloqueoConflicto.bloqueoMotivo || 'Horario bloqueado'}`,
          variant: 'destructive'
        });
        return;
      }

      if (checkForOverlaps(movedEvent, events, event.id)) {
        toast({
          title: 'Conflicto de horarios',
          description: 'No se puede mover: el bloque se superpondría con otro horario.',
          variant: 'destructive'
        });
        return;
      }

      // Reconstruir horarios actualizando la posición del evento movido
      const updatedEvents = events.map(existingEvent => {
        if (existingEvent.id !== event.id) return existingEvent;
        return { ...existingEvent, start, end };
      });

      notifyChange(updatedEvents);
    },
    [events, notifyChange, toast, checkForOverlaps, checkForBlockOverlaps]
  );

  // Manejar redimensionar evento
  const handleEventResize = useCallback(
    ({ event, start, end }) => {
      if (event.isBloqueo) {
        toast({
          title: 'No permitido',
          description: 'Los bloqueos no se pueden modificar desde aquí.',
        });
        return;
      }

      const resizedEvent = { ...event, start, end };

      const bloqueoConflicto = checkForBlockOverlaps(resizedEvent);
      if (bloqueoConflicto) {
        toast({
          title: 'Horario Bloqueado',
          description: `No se puede extender hasta aquí: ${bloqueoConflicto.bloqueoMotivo || 'Horario bloqueado'}`,
          variant: 'destructive'
        });
        return;
      }

      if (checkForOverlaps(resizedEvent, events, event.id)) {
        toast({
          title: 'Conflicto de horarios',
          description: 'No se puede redimensionar: el bloque se superpondría con otro horario.',
          variant: 'destructive'
        });
        return;
      }

      const updatedEvents = events.map(existingEvent =>
        existingEvent.id === event.id
          ? { ...existingEvent, start, end }
          : existingEvent
      );

      notifyChange(updatedEvents);
    },
    [events, notifyChange, toast, checkForOverlaps, checkForBlockOverlaps]
  );

  // Manejar selección de evento (para eliminar)
  const handleSelectEvent = (event) => {
    if (event.isBloqueo) {
      toast({
        title: 'Bloqueo de Agenda',
        description: `${event.bloqueoMotivo || event.bloqueoTipo || 'Horario bloqueado'}. Para modificar, ve a la pestaña "Bloqueos".`,
      });
      return;
    }
    setSelectedEvent(event);
    setIsEventModalOpen(true);
  };

  // Eliminar evento
  const handleDeleteEvent = () => {
    if (!selectedEvent) return;
    const updatedEvents = events.filter(e => e.id !== selectedEvent.id);
    notifyChange(updatedEvents);
    setIsEventModalOpen(false);

    toast({
      title: 'Bloque Eliminado',
      description: selectedEvent.isSpecificDate
        ? 'El horario de esta fecha específica ha sido removido.'
        : 'El horario semanal ha sido removido de todos los días iguales.'
    });
  };

  // Combinar eventos (guardados + bloqueos + pendientes)
  const allEvents = useMemo(() => {
    return [...events, ...blockEvents, ...pendingBlocks];
  }, [events, blockEvents, pendingBlocks]);

  // Estilos de eventos
  const eventStyleGetter = (event) => {
    // Bloqueos = naranja
    if (event.isBloqueo) {
      return {
        style: {
          backgroundColor: '#f97316',
          borderRadius: '4px',
          opacity: 0.9,
          color: 'white',
          border: '2px solid #ea580c',
          cursor: 'not-allowed',
        }
      };
    }

    // Bloques pendientes = amarillo/dorado con borde punteado
    if (event.isPending) {
      return {
        style: {
          backgroundColor: '#fbbf24',
          borderRadius: '4px',
          opacity: 0.9,
          color: '#78350f',
          border: '2px dashed #d97706',
          fontWeight: 'bold',
        }
      };
    }

    // Fecha específica = azul
    if (event.isSpecificDate) {
      return {
        style: {
          backgroundColor: '#3b82f6',
          borderRadius: '4px',
          opacity: 0.85,
          color: 'white',
          border: '2px solid #2563eb',
        }
      };
    }

    // Plantilla semanal = verde
    return {
      style: {
        backgroundColor: '#22c55e',
        borderRadius: '4px',
        opacity: 0.8,
        color: 'white',
        border: '2px solid #16a34a',
      }
    };
  };

  return (
    <div className="flex flex-col h-full bg-gray-50/50 p-4 rounded-xl border border-gray-200">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-emerald-600" />
            Configuración de Disponibilidad
          </h2>
          <p className="text-sm text-gray-500">
            Selecciona múltiples franjas horarias y guárdalas juntas.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
            <Repeat className="w-3 h-3 mr-1" />
            Semanal
          </Badge>
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            <CalendarDays className="w-3 h-3 mr-1" />
            Fecha específica
          </Badge>
          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
            <Clock className="w-3 h-3 mr-1" />
            Pendiente
          </Badge>
        </div>
      </div>

      {/* Barra de bloques pendientes */}
      {pendingBlocks.length > 0 && (
        <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-600" />
              <span className="font-medium text-amber-800">
                {pendingBlocks.length} bloque{pendingBlocks.length !== 1 ? 's' : ''} pendiente{pendingBlocks.length !== 1 ? 's' : ''}
              </span>
              <span className="text-sm text-amber-600">
                (sin guardar)
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearPendingBlocks}
                className="text-amber-700 border-amber-300 hover:bg-amber-100"
              >
                <X className="w-4 h-4 mr-1" />
                Descartar
              </Button>
              <Button
                size="sm"
                onClick={handleOpenConfirmModal}
                className="bg-amber-600 hover:bg-amber-700 text-white"
              >
                <Save className="w-4 h-4 mr-1" />
                Guardar bloques
              </Button>
            </div>
          </div>

          {/* Lista de bloques pendientes */}
          <div className="mt-2 flex flex-wrap gap-2">
            {pendingBlocks.map(block => (
              <div
                key={block.id}
                className="inline-flex items-center gap-1 px-2 py-1 bg-amber-100 border border-amber-300 rounded text-sm"
              >
                <span className="text-amber-800">
                  {format(block.start, 'EEE', { locale: esES })} {format(block.start, 'HH:mm')}-{format(block.end, 'HH:mm')}
                </span>
                <button
                  onClick={() => handleRemovePendingBlock(block.id)}
                  className="ml-1 text-amber-600 hover:text-amber-800"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden h-[600px]">
        <DnDCalendar
          localizer={localizer}
          events={allEvents}
          startAccessor="start"
          endAccessor="end"
          defaultView={Views.WEEK}
          views={[Views.WEEK, Views.DAY]}
          view={view}
          onView={setView}
          date={date}
          onNavigate={setDate}
          selectable
          resizable
          onSelectSlot={handleSelectSlot}
          onEventDrop={handleEventDrop}
          onEventResize={handleEventResize}
          onSelectEvent={handleSelectEvent}
          eventPropGetter={eventStyleGetter}
          messages={{
            next: "Siguiente",
            previous: "Anterior",
            today: "Hoy",
            week: "Semana",
            day: "Día",
            noEventsInRange: "Sin horarios configurados",
          }}
          culture='es'
          className="h-full p-4 font-sans"
          step={30}
          timeslots={2}
          min={new Date(0, 0, 0, 6, 0, 0)}
          max={new Date(0, 0, 0, 22, 0, 0)}
        />
      </div>

      {/* Modal de confirmación - elegir tipo para todos los bloques pendientes */}
      <Dialog open={isConfirmModalOpen} onOpenChange={setIsConfirmModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-emerald-600" />
              Guardar Bloques de Disponibilidad
            </DialogTitle>
            <DialogDescription>
              {pendingBlocks.length} bloque{pendingBlocks.length !== 1 ? 's' : ''} seleccionado{pendingBlocks.length !== 1 ? 's' : ''}
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            {/* Lista de bloques a guardar */}
            <div className="mb-4 p-3 bg-gray-50 rounded-lg max-h-32 overflow-y-auto">
              <p className="text-xs text-gray-500 mb-2 font-medium">Bloques a guardar:</p>
              <div className="flex flex-wrap gap-1">
                {pendingBlocks.map(block => (
                  <span key={block.id} className="text-xs px-2 py-1 bg-amber-100 text-amber-800 rounded">
                    {format(block.start, 'EEE', { locale: esES })} {format(block.start, 'HH:mm')}-{format(block.end, 'HH:mm')}
                  </span>
                ))}
              </div>
            </div>

            <p className="text-sm text-gray-600 mb-4">
              ¿Estos horarios deben aplicar a todas las semanas o solo a estas fechas específicas?
            </p>

            <RadioGroup value={createMode} onValueChange={setCreateMode} className="space-y-3">
              <div className={`flex items-start space-x-3 p-3 rounded-lg border-2 cursor-pointer transition-colors ${createMode === 'template' ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200 hover:border-gray-300'}`}
                   onClick={() => setCreateMode('template')}>
                <RadioGroupItem value="template" id="template" className="mt-1" />
                <div className="flex-1">
                  <Label htmlFor="template" className="font-medium flex items-center gap-2 cursor-pointer">
                    <Repeat className="w-4 h-4 text-emerald-600" />
                    Plantilla Semanal
                  </Label>
                  <p className="text-sm text-gray-500 mt-1">
                    Los bloques se repetirán cada semana en los días correspondientes.
                  </p>
                </div>
              </div>

              <div className={`flex items-start space-x-3 p-3 rounded-lg border-2 cursor-pointer transition-colors ${createMode === 'specific' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}
                   onClick={() => setCreateMode('specific')}>
                <RadioGroupItem value="specific" id="specific" className="mt-1" />
                <div className="flex-1">
                  <Label htmlFor="specific" className="font-medium flex items-center gap-2 cursor-pointer">
                    <CalendarDays className="w-4 h-4 text-blue-600" />
                    Solo Estas Fechas
                  </Label>
                  <p className="text-sm text-gray-500 mt-1">
                    Los bloques solo aplicarán a las fechas específicas seleccionadas.
                  </p>
                </div>
              </div>
            </RadioGroup>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsConfirmModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleConfirmCreate} className={createMode === 'template' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-blue-600 hover:bg-blue-700'}>
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Guardar {pendingBlocks.length} Bloque{pendingBlocks.length !== 1 ? 's' : ''}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de eliminación */}
      <Dialog open={isEventModalOpen} onOpenChange={setIsEventModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Eliminar Bloque de Horario</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            {selectedEvent && (
              <>
                <div className={`p-3 rounded-lg mb-4 ${selectedEvent.isSpecificDate ? 'bg-blue-50 border border-blue-200' : 'bg-emerald-50 border border-emerald-200'}`}>
                  <div className="flex items-center gap-2 mb-2">
                    {selectedEvent.isSpecificDate ? (
                      <Badge className="bg-blue-100 text-blue-800">
                        <CalendarDays className="w-3 h-3 mr-1" />
                        Fecha Específica
                      </Badge>
                    ) : (
                      <Badge className="bg-emerald-100 text-emerald-800">
                        <Repeat className="w-3 h-3 mr-1" />
                        Plantilla Semanal
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm"><strong>Día:</strong> {format(selectedEvent.start, "EEEE d 'de' MMMM", { locale: esES })}</p>
                  <p className="text-sm"><strong>Horario:</strong> {format(selectedEvent.start, 'HH:mm')} - {format(selectedEvent.end, 'HH:mm')}</p>
                </div>

                <p className="text-sm text-gray-600">
                  {selectedEvent.isSpecificDate
                    ? 'Este bloque solo afecta a esta fecha específica. Al eliminarlo, la plantilla semanal (si existe) volverá a aplicar.'
                    : 'Este bloque es parte de la plantilla semanal. Al eliminarlo, se removerá de TODOS los días iguales en el calendario.'}
                </p>
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEventModalOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDeleteEvent}>
              <Trash2 className="w-4 h-4 mr-2" />
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
