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
  Calendar as CalendarIcon, Trash2, CalendarDays, Save, X
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
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);

  // Estado para bloques pendientes (selección múltiple antes de guardar)
  const [pendingBlocks, setPendingBlocks] = useState([]);

  // Estado local de horarios para evitar sobrescribir eventos al navegar
  const [localHorarios, setLocalHorarios] = useState(initialHorarios || {});
  const [isInitialized, setIsInitialized] = useState(false);

  // Contador para forzar re-render del calendario
  const [calendarVersion, setCalendarVersion] = useState(0);

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
              title: 'Disponible',
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

      // Convertir dayIndex (0=Dom, 1=Lun, etc.) a offset desde el inicio de semana (Lunes)
      // Lunes=0, Martes=1, ..., Sábado=5, Domingo=6
      const offsetFromMonday = dayIndex === 0 ? 6 : dayIndex - 1;
      const eventDate = new Date(weekStart);
      eventDate.setDate(weekStart.getDate() + offsetFromMonday);

      data.events.forEach(({ block, idx, startStr, endStr }) => {
        const [startH, startM] = startStr.split(':').map(Number);
        const [endH, endM] = endStr.split(':').map(Number);

        const startDate = new Date(eventDate);
        startDate.setHours(startH, startM, 0);

        const endDate = new Date(eventDate);
        endDate.setHours(endH, endM, 0);

        loadedEvents.push({
          id: `template-${dayIndex}-${idx}`,
          title: 'Disponible',
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

  // Inicializar desde props o sincronizar cuando cambian significativamente
  useEffect(() => {
    if (!isInitialized && initialHorarios) {
      console.log('[DoctorScheduleManager] Inicializando horarios desde props:', {
        keys: Object.keys(initialHorarios),
        data: JSON.stringify(initialHorarios)
      });
      setLocalHorarios(initialHorarios);
      setIsInitialized(true);
      setCalendarVersion(prev => prev + 1);
    }
  }, [initialHorarios, isInitialized]);

  // Convertir horarios a eventos cuando cambia la semana visible o los horarios locales
  useEffect(() => {
    const currentStartOfWeek = startOfWeek(date, { weekStartsOn: 1 });
    const newEvents = convertHorariosToEvents(localHorarios, currentStartOfWeek);
    console.log('[DoctorScheduleManager] Convirtiendo horarios a eventos:', {
      horariosKeys: Object.keys(localHorarios),
      horariosData: JSON.stringify(localHorarios).substring(0, 500),
      eventosGenerados: newEvents.length,
      eventosDetalle: newEvents.map(e => ({
        id: e.id,
        title: e.title,
        start: e.start.toISOString(),
        isSpecific: e.isSpecificDate
      })),
      semanaInicio: currentStartOfWeek.toISOString().split('T')[0],
      calendarVersion
    });
    setEvents(newEvents);
  }, [localHorarios, date, convertHorariosToEvents, calendarVersion]);

  // Procesar bloqueos para mostrarlos en el calendario (usando useMemo para cálculo directo)
  const blockEvents = useMemo(() => {
    console.log('[DoctorScheduleManager] Procesando bloqueos (useMemo):', {
      total: bloqueos?.length || 0,
      bloqueos: bloqueos?.map(b => ({ id: b.id?.substring(0, 8), fechaInicio: b.fechaInicio, motivo: b.motivo })) || []
    });

    if (!bloqueos || bloqueos.length === 0) {
      return [];
    }

    const parseDateLocal = (dateString) => {
      if (!dateString) return null;
      const dateOnly = dateString.split('T')[0];
      const [year, month, day] = dateOnly.split('-').map(Number);
      return new Date(year, month - 1, day);
    };

    const currentWeekStart = startOfWeek(date, { weekStartsOn: 1 });
    const currentWeekEnd = new Date(currentWeekStart);
    currentWeekEnd.setDate(currentWeekEnd.getDate() + 7);

    const bloqueosEvents = [];

    bloqueos.forEach((bloqueo) => {
      if (!bloqueo.activo) return;

      const fechaInicio = parseDateLocal(bloqueo.fechaInicio);
      const fechaFin = parseDateLocal(bloqueo.fechaFin);

      if (!fechaInicio || !fechaFin) return;

      // Filtrar bloqueos fuera de la semana visible (>= para el límite superior porque el loop es exclusivo)
      const fueraDeRango = fechaFin < currentWeekStart || fechaInicio >= currentWeekEnd;
      console.log('[DoctorScheduleManager] Procesando bloqueo:', {
        motivo: bloqueo.motivo,
        fecha: format(fechaInicio, 'yyyy-MM-dd (EEEE)'),
        fueraDeRango,
        razon: fueraDeRango ? (fechaFin < currentWeekStart ? 'antes de semana' : 'después de semana') : 'en rango'
      });
      if (fueraDeRango) return;

      // Iterar sobre cada día de la semana
      for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
        const currentDay = new Date(currentWeekStart);
        currentDay.setDate(currentWeekStart.getDate() + dayOffset);
        currentDay.setHours(0, 0, 0, 0);

        const fechaInicioNorm = new Date(fechaInicio);
        fechaInicioNorm.setHours(0, 0, 0, 0);
        const fechaFinNorm = new Date(fechaFin);
        fechaFinNorm.setHours(23, 59, 59, 999);

        if (currentDay < fechaInicioNorm || currentDay > fechaFinNorm) continue;

        if (!bloqueo.horaInicio || !bloqueo.horaFin) {
          // Bloqueo de todo el día - usar horario completo visible
          const startOfDay = new Date(currentDay);
          startOfDay.setHours(6, 0, 0, 0);
          const endOfDay = new Date(currentDay);
          endOfDay.setHours(22, 0, 0, 0);

          bloqueosEvents.push({
            id: `bloqueo-${bloqueo.id}-${currentDay.getTime()}`,
            title: `🚫 ${bloqueo.motivo || bloqueo.tipo || 'Bloqueado'}`,
            start: startOfDay,
            end: endOfDay,
            isBloqueo: true,
            bloqueoTipo: bloqueo.tipo,
            bloqueoMotivo: bloqueo.motivo,
            resourceId: doctorId,
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
            title: `🚫 ${bloqueo.motivo || bloqueo.tipo || 'Bloqueado'}`,
            start: startDate,
            end: endDate,
            isBloqueo: true,
            bloqueoTipo: bloqueo.tipo,
            bloqueoMotivo: bloqueo.motivo,
            resourceId: doctorId,
          });
        }
      }
    });

    console.log('[DoctorScheduleManager] Bloqueos generados para calendario:', {
      total: bloqueosEvents.length,
      semana: `${format(currentWeekStart, 'yyyy-MM-dd (EEEE)')} - ${format(currentWeekEnd, 'yyyy-MM-dd (EEEE)')}`,
      eventos: bloqueosEvents.map(e => ({
        id: e.id.substring(0, 20),
        title: e.title,
        fecha: format(e.start, 'yyyy-MM-dd (EEEE)'),
        hora: format(e.start, 'HH:mm') + '-' + format(e.end, 'HH:mm')
      }))
    });

    return bloqueosEvents;
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

    // Limpiar fechas específicas de la semana actual solamente
    const currentWeekStart = startOfWeek(date, { weekStartsOn: 1 });
    for (let i = 0; i < 7; i++) {
      const dayDate = new Date(currentWeekStart);
      dayDate.setDate(dayDate.getDate() + i);
      const dateKey = formatDateKey(dayDate);
      delete schedule[dateKey];
    }

    // Reconstruir desde eventos actuales - siempre guardar por fecha específica
    currentEvents.forEach(event => {
      if (event.isBloqueo) return;

      const startStr = format(event.start, 'HH:mm');
      const endStr = format(event.end, 'HH:mm');
      const bloque = { inicio: startStr, fin: endStr };

      // Siempre guardar por fecha específica
      const dateKey = event.dateKey || formatDateKey(event.start);
      if (!schedule[dateKey]) {
        schedule[dateKey] = [];
      }
      schedule[dateKey].push(bloque);
    });

    // Ordenar bloques por hora de inicio
    Object.keys(schedule).forEach(key => {
      if (Array.isArray(schedule[key])) {
        schedule[key].sort((a, b) => a.inicio.localeCompare(b.inicio));
      }
    });

    // Actualizar estado local inmediatamente y forzar re-render
    setLocalHorarios(schedule);
    setCalendarVersion(prev => prev + 1);

    // Notificar al padre
    if (onChange) {
      onChange(schedule);
    }
  }, [onChange, date, localHorarios]);

  // Manejar selección de slot (nuevo bloque pendiente)
  const handleSelectSlot = useCallback(
    ({ start, end }) => {
      console.log('[DoctorScheduleManager] handleSelectSlot llamado:', {
        start: start.toISOString(),
        end: end.toISOString()
      });

      const newBlock = {
        id: `pending-${Date.now()}`,
        title: 'Pendiente',
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
      console.log('[DoctorScheduleManager] Agregando bloque pendiente:', newBlock.id);
      setPendingBlocks(prev => {
        const updated = [...prev, newBlock];
        console.log('[DoctorScheduleManager] Total bloques pendientes:', updated.length);
        return updated;
      });

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

  // Guardar todos los bloques pendientes directamente por fecha
  const handleSaveBlocks = useCallback(() => {
    if (pendingBlocks.length === 0) {
      toast({
        title: 'Sin bloques pendientes',
        description: 'Primero selecciona franjas horarias en el calendario.',
        variant: 'destructive'
      });
      return;
    }

    const newSchedule = { ...localHorarios };

    console.log('[DoctorScheduleManager] Guardando bloques por fecha:', {
      pendingBlocks: pendingBlocks.length,
      horariosAntes: JSON.stringify(localHorarios)
    });

    // Agregar cada bloque pendiente al schedule por fecha específica
    pendingBlocks.forEach(block => {
      const { start, end } = block;
      const dateKey = formatDateKey(start);

      const bloque = {
        inicio: format(start, 'HH:mm'),
        fin: format(end, 'HH:mm')
      };

      if (!newSchedule[dateKey]) {
        newSchedule[dateKey] = [];
      }
      newSchedule[dateKey].push(bloque);
    });

    // Ordenar bloques por hora de inicio
    Object.keys(newSchedule).forEach(key => {
      if (Array.isArray(newSchedule[key])) {
        newSchedule[key].sort((a, b) => a.inicio.localeCompare(b.inicio));
      }
    });

    console.log('[DoctorScheduleManager] Horarios después:', JSON.stringify(newSchedule));

    // Actualizar estado local y forzar re-render del calendario
    setLocalHorarios(newSchedule);
    setCalendarVersion(prev => prev + 1);

    // Notificar al padre
    if (onChange) {
      console.log('[DoctorScheduleManager] Notificando al padre onChange con keys:', Object.keys(newSchedule));
      onChange(newSchedule);
    }

    // Limpiar bloques pendientes
    setPendingBlocks([]);

    toast({
      title: '✅ Bloques agregados',
      description: `${pendingBlocks.length} bloque(s) agregado(s). Haz clic en "Guardar Horarios" para persistir los cambios.`,
      duration: 5000
    });
  }, [pendingBlocks, localHorarios, onChange, toast]);

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
      description: 'El horario ha sido removido. Guarda los cambios para confirmar.',
    });
  };

  // Combinar eventos (guardados + bloqueos + pendientes)
  const allEvents = useMemo(() => {
    const combined = [...events, ...blockEvents, ...pendingBlocks];
    console.log('[DoctorScheduleManager] allEvents:', {
      events: events.length,
      blockEvents: blockEvents.length,
      pendingBlocks: pendingBlocks.length,
      total: combined.length
    });
    return combined;
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

    // Todos los bloques de disponibilidad = azul
    return {
      style: {
        backgroundColor: '#3b82f6',
        borderRadius: '4px',
        opacity: 0.85,
        color: 'white',
        border: '2px solid #2563eb',
      }
    };
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Header simplificado */}
      <div className="flex items-center justify-between p-3 border-b bg-gray-50 flex-shrink-0">
        <div className="flex items-center gap-2">
          <CalendarIcon className="w-5 h-5 text-emerald-600" />
          <span className="font-semibold text-gray-900">Disponibilidad</span>
          {pendingBlocks.length === 0 && (
            <span className="text-xs text-gray-500 hidden sm:inline">
              — Arrastra para seleccionar horarios
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {/* Debug: mostrar estado de bloqueos */}
          {(bloqueos?.length > 0 || blockEvents.length > 0) && (
            <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-300 text-xs">
              🚫 {bloqueos?.length || 0} bloqueos → {blockEvents.length} eventos
            </Badge>
          )}
          {pendingBlocks.length > 0 && (
            <Badge className="bg-amber-500 text-white text-xs">
              {pendingBlocks.length} pendiente{pendingBlocks.length !== 1 ? 's' : ''}
            </Badge>
          )}
        </div>
      </div>

      {/* Panel de bloqueos activos en la semana */}
      {blockEvents.length > 0 && (
        <div className="mb-2 p-2 bg-orange-50 border border-orange-200 rounded-lg">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-medium text-orange-700">Bloqueos esta semana:</span>
            {blockEvents.map(event => (
              <span
                key={event.id}
                className="inline-flex items-center gap-1 px-2 py-1 bg-orange-100 border border-orange-300 rounded text-xs text-orange-800"
              >
                🚫 {format(event.start, 'dd/MM HH:mm', { locale: esES })}-{format(event.end, 'HH:mm', { locale: esES })}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Barra de bloques pendientes */}
      {pendingBlocks.length > 0 && (
        <div className="mb-2 p-2 bg-amber-50 border border-amber-200 rounded-lg">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 flex-wrap flex-1">
              {pendingBlocks.map(block => (
                <span
                  key={block.id}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-amber-100 border border-amber-300 rounded text-xs"
                >
                  <span className="text-amber-800">
                    {format(block.start, 'dd/MM', { locale: esES })} {format(block.start, 'HH:mm')}-{format(block.end, 'HH:mm')}
                  </span>
                  <button
                    onClick={() => handleRemovePendingBlock(block.id)}
                    className="text-amber-600 hover:text-amber-800"
                    tabIndex={-1}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearPendingBlocks}
                className="h-7 px-2 text-xs"
                tabIndex={-1}
              >
                <X className="w-3 h-3" />
              </Button>
              <Button
                size="sm"
                onClick={handleSaveBlocks}
                className="h-7 px-3 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                tabIndex={-1}
              >
                <Save className="w-3 h-3 mr-1" />
                Agregar
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden" style={{ minHeight: '550px' }}>
        <DnDCalendar
          key={`calendar-v${calendarVersion}-${allEvents.length}`}
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


      {/* Modal de eliminación */}
      <Dialog open={isEventModalOpen} onOpenChange={setIsEventModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Eliminar Bloque de Horario</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            {selectedEvent && (
              <>
                <div className="p-3 rounded-lg mb-4 bg-blue-50 border border-blue-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className="bg-blue-100 text-blue-800">
                      <CalendarDays className="w-3 h-3 mr-1" />
                      Horario Disponible
                    </Badge>
                  </div>
                  <p className="text-sm"><strong>Fecha:</strong> {format(selectedEvent.start, "EEEE d 'de' MMMM", { locale: esES })}</p>
                  <p className="text-sm"><strong>Horario:</strong> {format(selectedEvent.start, 'HH:mm')} - {format(selectedEvent.end, 'HH:mm')}</p>
                </div>

                <p className="text-sm text-gray-600">
                  Este bloque de disponibilidad será eliminado. Recuerda guardar los cambios con el botón "Guardar Horarios".
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
