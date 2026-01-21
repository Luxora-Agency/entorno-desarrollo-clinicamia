'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { GripVertical, Settings, RotateCcw, Eye, EyeOff, Lock, Unlock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

// Clave base para localStorage
const STORAGE_KEY_PREFIX = 'doctor_widget_layout_';

// Configuración por defecto de widgets
const DEFAULT_WIDGETS = [
  { id: 'proxima-cita', title: 'Próximo Paciente', visible: true, locked: false },
  { id: 'hospitalizados', title: 'Pacientes Hospitalizados', visible: true, locked: false },
  { id: 'quirofano', title: 'Cirugías del Día', visible: true, locked: false },
  { id: 'pacientes-recientes', title: 'Pacientes Recientes', visible: true, locked: false },
  { id: 'rendimiento', title: 'Rendimiento de Hoy', visible: true, locked: false },
  { id: 'analisis-ia', title: 'Análisis con IA', visible: true, locked: false },
];

// Hook para gestionar el layout de widgets
export function useWidgetLayout(doctorId) {
  const [widgets, setWidgets] = useState(DEFAULT_WIDGETS);
  const [isEditMode, setIsEditMode] = useState(false);

  // Cargar configuración guardada
  useEffect(() => {
    if (!doctorId) return;

    try {
      const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}${doctorId}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Merge con defaults para incluir nuevos widgets
        const merged = DEFAULT_WIDGETS.map(defaultWidget => {
          const savedWidget = parsed.find(w => w.id === defaultWidget.id);
          return savedWidget ? { ...defaultWidget, ...savedWidget } : defaultWidget;
        });
        setWidgets(merged);
      }
    } catch (error) {
      console.error('Error loading widget layout:', error);
    }
  }, [doctorId]);

  // Guardar configuración
  const saveLayout = useCallback((newWidgets) => {
    if (!doctorId) return;

    try {
      localStorage.setItem(`${STORAGE_KEY_PREFIX}${doctorId}`, JSON.stringify(newWidgets));
    } catch (error) {
      console.error('Error saving widget layout:', error);
    }
  }, [doctorId]);

  // Reordenar widgets
  const reorderWidgets = useCallback((fromIndex, toIndex) => {
    setWidgets(prev => {
      const newWidgets = [...prev];
      const [removed] = newWidgets.splice(fromIndex, 1);
      newWidgets.splice(toIndex, 0, removed);
      saveLayout(newWidgets);
      return newWidgets;
    });
  }, [saveLayout]);

  // Alternar visibilidad
  const toggleVisibility = useCallback((widgetId) => {
    setWidgets(prev => {
      const newWidgets = prev.map(w =>
        w.id === widgetId ? { ...w, visible: !w.visible } : w
      );
      saveLayout(newWidgets);
      return newWidgets;
    });
  }, [saveLayout]);

  // Alternar bloqueo
  const toggleLock = useCallback((widgetId) => {
    setWidgets(prev => {
      const newWidgets = prev.map(w =>
        w.id === widgetId ? { ...w, locked: !w.locked } : w
      );
      saveLayout(newWidgets);
      return newWidgets;
    });
  }, [saveLayout]);

  // Restaurar configuración por defecto
  const resetLayout = useCallback(() => {
    setWidgets(DEFAULT_WIDGETS);
    saveLayout(DEFAULT_WIDGETS);
  }, [saveLayout]);

  return {
    widgets,
    isEditMode,
    setIsEditMode,
    reorderWidgets,
    toggleVisibility,
    toggleLock,
    resetLayout,
  };
}

// Componente wrapper para widgets arrastrables
export function DraggableWidget({
  id,
  index,
  isEditMode,
  isDragging,
  isLocked,
  onDragStart,
  onDragOver,
  onDragEnd,
  onDrop,
  children
}) {
  const [isOver, setIsOver] = useState(false);

  const handleDragStart = (e) => {
    if (isLocked) {
      e.preventDefault();
      return;
    }
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index.toString());
    onDragStart(index);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setIsOver(true);
    onDragOver(index);
  };

  const handleDragLeave = () => {
    setIsOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsOver(false);
    const fromIndex = parseInt(e.dataTransfer.getData('text/plain'));
    onDrop(fromIndex, index);
  };

  const handleDragEnd = () => {
    setIsOver(false);
    onDragEnd();
  };

  return (
    <div
      draggable={isEditMode && !isLocked}
      onDragStart={handleDragStart}
      onDragOver={isEditMode ? handleDragOver : undefined}
      onDragLeave={isEditMode ? handleDragLeave : undefined}
      onDrop={isEditMode ? handleDrop : undefined}
      onDragEnd={handleDragEnd}
      className={`
        relative transition-all duration-200
        ${isEditMode ? 'cursor-grab active:cursor-grabbing' : ''}
        ${isDragging ? 'opacity-50 scale-95' : ''}
        ${isOver ? 'ring-2 ring-blue-400 ring-offset-2 rounded-lg' : ''}
        ${isLocked && isEditMode ? 'opacity-75' : ''}
      `}
    >
      {/* Indicador de arrastre en modo edición */}
      {isEditMode && (
        <div className={`
          absolute -left-2 top-1/2 -translate-y-1/2 z-10
          p-1 rounded bg-white shadow-md border
          ${isLocked ? 'text-gray-300 cursor-not-allowed' : 'text-gray-400 hover:text-gray-600'}
        `}>
          {isLocked ? (
            <Lock className="h-4 w-4" />
          ) : (
            <GripVertical className="h-4 w-4" />
          )}
        </div>
      )}
      {children}
    </div>
  );
}

// Panel de control de widgets
export function WidgetLayoutControls({
  widgets,
  isEditMode,
  onToggleEditMode,
  onToggleVisibility,
  onToggleLock,
  onReset
}) {
  return (
    <div className="flex items-center gap-2">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={isEditMode ? "default" : "outline"}
              size="sm"
              onClick={onToggleEditMode}
              className={isEditMode ? "bg-blue-600 hover:bg-blue-700" : ""}
            >
              <Settings className={`h-4 w-4 ${isEditMode ? 'animate-spin-slow' : ''}`} />
              <span className="ml-2 hidden sm:inline">
                {isEditMode ? 'Guardar' : 'Personalizar'}
              </span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{isEditMode ? 'Guardar cambios' : 'Personalizar widgets'}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            <Eye className="h-4 w-4" />
            <span className="ml-2 hidden sm:inline">Widgets</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <div className="px-2 py-1.5 text-sm font-semibold text-gray-700">
            Mostrar/Ocultar Widgets
          </div>
          <DropdownMenuSeparator />
          {widgets.map((widget) => (
            <DropdownMenuCheckboxItem
              key={widget.id}
              checked={widget.visible}
              onCheckedChange={() => onToggleVisibility(widget.id)}
            >
              <span className="flex items-center gap-2">
                {widget.title}
                {widget.locked && <Lock className="h-3 w-3 text-gray-400" />}
              </span>
            </DropdownMenuCheckboxItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={onReset} className="text-amber-600">
            <RotateCcw className="h-4 w-4 mr-2" />
            Restaurar por defecto
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

// Componente principal del contenedor de widgets
export default function DraggableWidgetsContainer({
  doctorId,
  widgets,
  isEditMode,
  onReorder,
  renderWidget,
  className = ''
}) {
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [overIndex, setOverIndex] = useState(null);

  const handleDragStart = (index) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (index) => {
    setOverIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setOverIndex(null);
  };

  const handleDrop = (fromIndex, toIndex) => {
    if (fromIndex !== toIndex) {
      onReorder(fromIndex, toIndex);
    }
    setDraggedIndex(null);
    setOverIndex(null);
  };

  // Solo renderizar widgets visibles
  const visibleWidgets = widgets.filter(w => w.visible);

  return (
    <div className={`space-y-6 ${className}`}>
      {isEditMode && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-700 flex items-center gap-2">
          <GripVertical className="h-4 w-4" />
          <span>
            Arrastra los widgets para reorganizarlos. Los cambios se guardan automáticamente.
          </span>
        </div>
      )}

      {visibleWidgets.map((widget, index) => {
        const content = renderWidget(widget.id);
        if (!content) return null;

        return (
          <DraggableWidget
            key={widget.id}
            id={widget.id}
            index={index}
            isEditMode={isEditMode}
            isDragging={draggedIndex === index}
            isLocked={widget.locked}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
            onDrop={handleDrop}
          >
            {content}
          </DraggableWidget>
        );
      })}
    </div>
  );
}
