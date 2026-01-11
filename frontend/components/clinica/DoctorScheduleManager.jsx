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

export default function DoctorScheduleManager({ doctorId, initialHorarios, onChange }) {
  const { toast } = useToast();
  const [view, setView] = useState(Views.WEEK);
  // Usamos una fecha fija para la "semana tipo" para evitar problemas de navegación
  // Pero permitimos navegar para ver cómo queda
  const [date, setDate] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);

  // Inicializar eventos desde initialHorarios
  useEffect(() => {
    if (!initialHorarios || Object.keys(initialHorarios).length === 0) return;

    const loadedEvents = [];
    const currentStartOfWeek = startOfWeek(date, { weekStartsOn: 0 }); // Domingo

    // initialHorarios formato: { "1": [{inicio: "08:00", fin: "12:00"}], ... } donde clave es día (0=Dom, 1=Lun...)
    Object.entries(initialHorarios).forEach(([dayIndex, blocks]) => {
      const day = parseInt(dayIndex);
      
      // Calcular la fecha para este día de la semana actual
      const eventDate = new Date(currentStartOfWeek);
      eventDate.setDate(currentStartOfWeek.getDate() + day);

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

          loadedEvents.push({
            id: `${day}-${idx}-${Date.now()}`, // ID temporal único
            title: 'Disponible',
            start: startDate,
            end: endDate,
            resourceId: doctorId,
          });
        });
      }
    });

    setEvents(loadedEvents);
  }, [initialHorarios]); // Solo cargar al inicio o si cambia externamente drásticamente

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

      // Verificar superposición con bloques existentes
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
    [events, notifyChange, toast, checkForOverlaps]
  );

  const handleEventDrop = useCallback(
    ({ event, start, end }) => {
      const movedEvent = { ...event, start, end };

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
    [events, notifyChange, toast, checkForOverlaps]
  );

  const handleEventResize = useCallback(
    ({ event, start, end }) => {
      const resizedEvent = { ...event, start, end };

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
    [events, notifyChange, toast, checkForOverlaps]
  );

  const handleSelectEvent = (event) => {
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

  const eventStyleGetter = (event, start, end, isSelected) => {
    const style = {
      backgroundColor: isSelected ? '#15803d' : '#22c55e', // Green
      borderRadius: '4px',
      opacity: 0.8,
      color: 'white',
      border: '0px',
      display: 'block'
    };
    return { style };
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
          events={events}
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
