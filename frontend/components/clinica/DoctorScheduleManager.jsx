'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Calendar, dateFnsLocalizer, Views } from 'react-big-calendar';
import withDragAndDrop from 'react-big-calendar/lib/addons/dragAndDrop';
import format from 'date-fns/format';
import parse from 'date-fns/parse';
import startOfWeek from 'date-fns/startOfWeek';
import getDay from 'date-fns/getDay';
import enUS from 'date-fns/locale/en-US';
import esES from 'date-fns/locale/es';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { 
  Calendar as CalendarIcon, Trash2, Info, CheckCircle2
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
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

export default function DoctorScheduleManager({ doctorId, initialHorarios, onChange, bloqueos = [] }) {
  const { toast } = useToast();
  const [view, setView] = useState(Views.WEEK);
  // Usamos una fecha fija para la "semana tipo" para evitar problemas de navegación
  // Pero permitimos navegar para ver cómo queda
  const [date, setDate] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [blockEvents, setBlockEvents] = useState([]); // Eventos de bloqueo
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);

  // Convertir horarios guardados a eventos del calendario para la semana visible
  // Esta función recalcula las posiciones cada vez que cambia la semana visible
  const convertHorariosToEvents = useCallback((horariosData, weekStart) => {
    if (!horariosData || Object.keys(horariosData).length === 0) return [];

    const loadedEvents = [];

    // initialHorarios formato: { "0": [{inicio: "08:00", fin: "12:00"}], "1": [...], ... }
    // donde clave es día de la semana (0=Dom, 1=Lun, ..., 6=Sáb)
    Object.entries(horariosData).forEach(([dayIndex, blocks]) => {
      const day = parseInt(dayIndex);

      // Calcular la fecha para este día de la semana actual visible
      const eventDate = new Date(weekStart);
      eventDate.setDate(weekStart.getDate() + day);

      if (Array.isArray(blocks)) {
        blocks.forEach((block, idx) => {
          // Soporte para ambos formatos (start/end o inicio/fin) por compatibilidad
          const startStr = block.inicio || block.start;
          const endStr = block.fin || block.end;

          if (!startStr || !endStr) return;

          const [startH, startM] = startStr.split(':').map(Number);
          const [endH, endM] = endStr.split(':').map(Number);

          const startDate = new Date(eventDate);
          startDate.setHours(startH, startM, 0);

          const endDate = new Date(eventDate);
          endDate.setHours(endH, endM, 0);

          // ID único basado en día y bloque (no en timestamp para mantener consistencia)
          loadedEvents.push({
            id: `horario-${day}-${idx}`,
            title: 'Disponible',
            start: startDate,
            end: endDate,
            resourceId: doctorId,
            dayOfWeek: day, // Guardar el día de la semana para referencia
          });
        });
      }
    });

    return loadedEvents;
  }, [doctorId]);

  // Inicializar eventos desde initialHorarios cuando cambia la semana visible
  useEffect(() => {
    const currentStartOfWeek = startOfWeek(date, { weekStartsOn: 0 }); // Domingo
    const newEvents = convertHorariosToEvents(initialHorarios, currentStartOfWeek);
    setEvents(newEvents);
  }, [initialHorarios, date, convertHorariosToEvents]);

  // Procesar bloqueos para mostrarlos en el calendario
  useEffect(() => {
    if (!bloqueos || bloqueos.length === 0) {
      setBlockEvents([]);
      return;
    }

    // Helper para parsear fecha sin problemas de timezone
    // Convierte "2026-01-15T00:00:00.000Z" o "2026-01-15" a fecha local
    const parseDateLocal = (dateString) => {
      if (!dateString) return null;
      // Extraer solo la parte YYYY-MM-DD
      const dateOnly = dateString.split('T')[0];
      const [year, month, day] = dateOnly.split('-').map(Number);
      return new Date(year, month - 1, day); // month is 0-indexed
    };

    const currentWeekStart = startOfWeek(date, { weekStartsOn: 0 });
    const currentWeekEnd = new Date(currentWeekStart);
    currentWeekEnd.setDate(currentWeekEnd.getDate() + 7);

    const bloqueosEvents = [];

    bloqueos.forEach((bloqueo, index) => {
      if (!bloqueo.activo) return;

      // Parsear fechas sin conversión de timezone
      const fechaInicio = parseDateLocal(bloqueo.fechaInicio);
      const fechaFin = parseDateLocal(bloqueo.fechaFin);

      if (!fechaInicio || !fechaFin) return;

      // Verificar si el bloqueo afecta la semana actual visible
      if (fechaFin < currentWeekStart || fechaInicio > currentWeekEnd) return;

      // Iterar por cada día del bloqueo dentro de la semana visible
      for (let d = new Date(currentWeekStart); d < currentWeekEnd; d.setDate(d.getDate() + 1)) {
        const currentDay = new Date(d);
        currentDay.setHours(0, 0, 0, 0); // Normalizar a medianoche

        // Verificar si este día está dentro del rango del bloqueo
        const fechaInicioNorm = new Date(fechaInicio);
        fechaInicioNorm.setHours(0, 0, 0, 0);
        const fechaFinNorm = new Date(fechaFin);
        fechaFinNorm.setHours(23, 59, 59, 999);

        if (currentDay < fechaInicioNorm || currentDay > fechaFinNorm) continue;

        // Bloqueo de día completo
        if (!bloqueo.horaInicio || !bloqueo.horaFin) {
          const startOfDay = new Date(currentDay);
          startOfDay.setHours(6, 0, 0); // Desde las 6 AM
          const endOfDay = new Date(currentDay);
          endOfDay.setHours(22, 0, 0); // Hasta las 10 PM

          bloqueosEvents.push({
            id: `bloqueo-${bloqueo.id}-${currentDay.getTime()}`,
            title: `🚫 ${bloqueo.motivo || bloqueo.tipo || 'Bloqueado'}`,
            start: startOfDay,
            end: endOfDay,
            isBloqueo: true,
            bloqueoTipo: bloqueo.tipo,
            bloqueoMotivo: bloqueo.motivo,
          });
        } else {
          // Bloqueo de franja horaria
          const [startH, startM] = bloqueo.horaInicio.split(':').map(Number);
          const [endH, endM] = bloqueo.horaFin.split(':').map(Number);

          const startDate = new Date(currentDay);
          startDate.setHours(startH, startM, 0);

          const endDate = new Date(currentDay);
          endDate.setHours(endH, endM, 0);

          bloqueosEvents.push({
            id: `bloqueo-${bloqueo.id}-${currentDay.getTime()}`,
            title: `🚫 ${bloqueo.motivo || bloqueo.tipo || 'Bloqueado'}`,
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

  // Función para verificar si dos eventos se superponen
  const hasOverlap = useCallback((event1, event2) => {
    // Ignorar si son el mismo evento o de días diferentes
    if (event1.id === event2.id) return false;
    if (getDay(event1.start) !== getDay(event2.start)) return false;

    // Superposición: (StartA < EndB) AND (EndA > StartB)
    return event1.start < event2.end && event1.end > event2.start;
  }, []);

  // Verificar si un evento tiene conflictos con otros eventos existentes
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

  // Verificar si un evento se superpone con algún bloqueo
  const checkForBlockOverlaps = useCallback((newEvent) => {
    for (const bloqueo of blockEvents) {
      if (hasOverlap(newEvent, bloqueo)) {
        return bloqueo; // Retorna el bloqueo que causa el conflicto
      }
    }
    return null;
  }, [blockEvents, hasOverlap]);

  // Función para notificar cambios al padre (DoctorForm)
  const notifyChange = useCallback((currentEvents) => {
    const schedule = {};

    currentEvents.forEach(event => {
      const dayIndex = getDay(event.start);
      const startStr = format(event.start, 'HH:mm');
      const endStr = format(event.end, 'HH:mm');

      if (!schedule[dayIndex]) {
        schedule[dayIndex] = [];
      }

      schedule[dayIndex].push({
        inicio: startStr,
        fin: endStr
      });
    });

    // Ordenar bloques por hora de inicio
    Object.keys(schedule).forEach(key => {
        schedule[key].sort((a, b) => a.inicio.localeCompare(b.inicio));
    });

    if (onChange) {
      onChange(schedule);
    }
  }, [onChange]);

  const handleSelectSlot = useCallback(
    ({ start, end }) => {
      const newEvent = {
        id: Date.now(),
        title: 'Disponible',
        start,
        end,
      };

      // Verificar superposición con bloqueos de agenda
      const bloqueoConflicto = checkForBlockOverlaps(newEvent);
      if (bloqueoConflicto) {
        toast({
          title: 'Horario Bloqueado',
          description: `No se puede crear disponibilidad: ${bloqueoConflicto.bloqueoMotivo || bloqueoConflicto.bloqueoTipo || 'Horario bloqueado'}`,
          variant: 'destructive'
        });
        return;
      }

      // Verificar superposición con bloques de disponibilidad existentes
      if (checkForOverlaps(newEvent, events)) {
        toast({
          title: 'Conflicto de horarios',
          description: 'El bloque se superpone con otro horario existente.',
          variant: 'destructive'
        });
        return;
      }

      const newEvents = [...events, newEvent];
      setEvents(newEvents);
      notifyChange(newEvents);

      toast({
          title: 'Bloque Agregado',
          description: `Horario disponible agregado para ${format(start, 'EEEE', { locale: esES })}.`
      });
    },
    [events, notifyChange, toast, checkForOverlaps, checkForBlockOverlaps]
  );

  const handleEventDrop = useCallback(
    ({ event, start, end }) => {
      // No permitir mover bloqueos
      if (event.isBloqueo) {
        toast({
          title: 'No permitido',
          description: 'Los bloqueos no se pueden mover desde aquí. Ve a la pestaña "Bloqueos".',
        });
        return;
      }

      const movedEvent = { ...event, start, end };

      // Verificar superposición con bloqueos de agenda
      const bloqueoConflicto = checkForBlockOverlaps(movedEvent);
      if (bloqueoConflicto) {
        toast({
          title: 'Horario Bloqueado',
          description: `No se puede mover aquí: ${bloqueoConflicto.bloqueoMotivo || 'Horario bloqueado'}`,
          variant: 'destructive'
        });
        return;
      }

      // Verificar superposición con otros bloques (excluyendo el evento que se mueve)
      if (checkForOverlaps(movedEvent, events, event.id)) {
        toast({
          title: 'Conflicto de horarios',
          description: 'No se puede mover: el bloque se superpondría con otro horario.',
          variant: 'destructive'
        });
        return;
      }

      const updatedEvents = events.map(existingEvent =>
        existingEvent.id === event.id
          ? { ...existingEvent, start, end }
          : existingEvent
      );

      setEvents(updatedEvents);
      notifyChange(updatedEvents);
    },
    [events, notifyChange, toast, checkForOverlaps, checkForBlockOverlaps]
  );

  const handleEventResize = useCallback(
    ({ event, start, end }) => {
      // No permitir redimensionar bloqueos
      if (event.isBloqueo) {
        toast({
          title: 'No permitido',
          description: 'Los bloqueos no se pueden modificar desde aquí. Ve a la pestaña "Bloqueos".',
        });
        return;
      }

      const resizedEvent = { ...event, start, end };

      // Verificar superposición con bloqueos de agenda
      const bloqueoConflicto = checkForBlockOverlaps(resizedEvent);
      if (bloqueoConflicto) {
        toast({
          title: 'Horario Bloqueado',
          description: `No se puede extender hasta aquí: ${bloqueoConflicto.bloqueoMotivo || 'Horario bloqueado'}`,
          variant: 'destructive'
        });
        return;
      }

      // Verificar superposición con otros bloques
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

      setEvents(updatedEvents);
      notifyChange(updatedEvents);
    },
    [events, notifyChange, toast, checkForOverlaps, checkForBlockOverlaps]
  );

  const handleSelectEvent = (event) => {
    // No permitir editar bloqueos desde aquí
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

  const handleDeleteEvent = () => {
    if (!selectedEvent) return;
    const updatedEvents = events.filter(e => e.id !== selectedEvent.id);
    setEvents(updatedEvents);
    notifyChange(updatedEvents);
    setIsEventModalOpen(false);
    toast({ title: 'Bloque Eliminado', description: 'El horario ha sido removido.' });
  };

  // Combinar eventos de disponibilidad + bloqueos para mostrar
  const allEvents = useMemo(() => {
    return [...events, ...blockEvents];
  }, [events, blockEvents]);

  const eventStyleGetter = (event, start, end, isSelected) => {
    // Estilo para bloqueos (naranja/rojo)
    if (event.isBloqueo) {
      return {
        style: {
          backgroundColor: isSelected ? '#c2410c' : '#f97316', // Orange
          borderRadius: '4px',
          opacity: 0.9,
          color: 'white',
          border: '2px solid #ea580c',
          display: 'block',
          cursor: 'not-allowed',
        }
      };
    }

    // Estilo para disponibilidad (verde)
    return {
      style: {
        backgroundColor: isSelected ? '#15803d' : '#22c55e', // Green
        borderRadius: '4px',
        opacity: 0.8,
        color: 'white',
        border: '0px',
        display: 'block'
      }
    };
  };

  return (
    <div className="flex flex-col h-full bg-gray-50/50 p-4 rounded-xl border border-gray-200">
      <div className="flex justify-between items-center mb-4">
        <div>
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-emerald-600" />
                Configuración de Disponibilidad Semanal
            </h2>
            <p className="text-sm text-gray-500">
                Arrastre el mouse para crear bloques de horarios disponibles. Mueva o redimensione para ajustar.
            </p>
        </div>
        <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                <CheckCircle2 className="w-3 h-3 mr-1" />
                Modo Edición Libre
            </Badge>
        </div>
      </div>

      <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden h-[600px]">
        <DnDCalendar
          localizer={localizer}
          events={allEvents}
          startAccessor="start"
          endAccessor="end"
          defaultView={Views.WEEK}
          views={[Views.WEEK, Views.DAY]} // Solo semana y día tienen sentido para disponibilidad recurrente
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
            next: "Siguiente Semana",
            previous: "Anterior Semana",
            today: "Hoy",
            month: "Mes",
            week: "Semana",
            day: "Día",
            date: "Fecha",
            time: "Hora",
            event: "Bloque",
            noEventsInRange: "Sin horarios configurados",
          }}
          culture='es'
          className="h-full p-4 font-sans"
          step={30}
          timeslots={2}
          min={new Date(0, 0, 0, 6, 0, 0)} // 6 AM
          max={new Date(0, 0, 0, 22, 0, 0)} // 10 PM
        />
      </div>

      <Dialog open={isEventModalOpen} onOpenChange={setIsEventModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Gestionar Bloque de Horario</DialogTitle>
          </DialogHeader>
          <div className="py-4">
             <p className="text-sm text-gray-600 mb-4">
                 ¿Desea eliminar este bloque de disponibilidad?
             </p>
             {selectedEvent && (
                 <div className="bg-gray-100 p-3 rounded-md text-sm">
                     <p><strong>Día:</strong> {format(selectedEvent.start, 'EEEE', { locale: esES })}</p>
                     <p><strong>Horario:</strong> {format(selectedEvent.start, 'HH:mm')} - {format(selectedEvent.end, 'HH:mm')}</p>
                 </div>
             )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEventModalOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDeleteEvent}>
              <Trash2 className="w-4 h-4 mr-2" />
              Eliminar Bloque
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
