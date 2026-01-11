'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Plus, X, Search, Pill, FileText, FlaskConical, Camera,
  Calendar, Stethoscope, ClipboardList, Phone, MessageSquare,
  Brain, Clock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const QUICK_ACTIONS = [
  {
    id: 'search',
    icon: Search,
    label: 'Buscar Paciente',
    shortcut: '⌘K',
    color: 'bg-blue-500 hover:bg-blue-600',
  },
  {
    id: 'prescription',
    icon: Pill,
    label: 'Nueva Fórmula',
    color: 'bg-green-500 hover:bg-green-600',
  },
  {
    id: 'lab',
    icon: FlaskConical,
    label: 'Orden de Laboratorio',
    color: 'bg-purple-500 hover:bg-purple-600',
  },
  {
    id: 'imaging',
    icon: Camera,
    label: 'Orden de Imagen',
    color: 'bg-indigo-500 hover:bg-indigo-600',
  },
  {
    id: 'certificate',
    icon: FileText,
    label: 'Certificado Médico',
    color: 'bg-amber-500 hover:bg-amber-600',
  },
  {
    id: 'ai',
    icon: Brain,
    label: 'Asistente IA',
    color: 'bg-pink-500 hover:bg-pink-600',
  },
];

export default function FloatingActionButton({
  onAction,
  className = '',
  position = 'bottom-right', // 'bottom-right' | 'bottom-left'
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const fabRef = useRef(null);
  const lastScrollY = useRef(0);

  // Cerrar al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (fabRef.current && !fabRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Ocultar al hacer scroll hacia abajo, mostrar al subir
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY.current && currentScrollY > 100) {
        setIsVisible(false);
        setIsOpen(false);
      } else {
        setIsVisible(true);
      }
      lastScrollY.current = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Cerrar con Escape
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  const handleActionClick = (actionId) => {
    setIsOpen(false);
    onAction?.(actionId);
  };

  const positionClasses = {
    'bottom-right': 'right-6 bottom-6',
    'bottom-left': 'left-6 bottom-6',
  };

  return (
    <div
      ref={fabRef}
      className={`
        fixed z-50 transition-all duration-300
        ${positionClasses[position]}
        ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0'}
        ${className}
      `}
    >
      {/* Action buttons */}
      <div
        className={`
          absolute bottom-16 flex flex-col gap-3 transition-all duration-300
          ${position === 'bottom-right' ? 'right-0 items-end' : 'left-0 items-start'}
          ${isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}
        `}
      >
        {QUICK_ACTIONS.map((action, index) => {
          const Icon = action.icon;
          return (
            <TooltipProvider key={action.id}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={() => handleActionClick(action.id)}
                    className={`
                      h-12 px-4 rounded-full shadow-lg text-white flex items-center gap-2
                      transform transition-all duration-300
                      ${action.color}
                    `}
                    style={{
                      transitionDelay: isOpen ? `${index * 50}ms` : '0ms',
                    }}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="text-sm font-medium whitespace-nowrap">
                      {action.label}
                    </span>
                    {action.shortcut && (
                      <kbd className="ml-1 px-1.5 py-0.5 bg-white/20 rounded text-xs">
                        {action.shortcut}
                      </kbd>
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side={position === 'bottom-right' ? 'left' : 'right'}>
                  <p>{action.label}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          );
        })}
      </div>

      {/* Main FAB button */}
      <Button
        onClick={() => setIsOpen(!isOpen)}
        className={`
          h-14 w-14 rounded-full shadow-xl transition-all duration-300
          ${isOpen
            ? 'bg-gray-800 hover:bg-gray-700 rotate-45'
            : 'bg-gradient-to-br from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700'
          }
        `}
      >
        {isOpen ? (
          <X className="h-6 w-6 text-white" />
        ) : (
          <Plus className="h-6 w-6 text-white" />
        )}
      </Button>

      {/* Backdrop when open */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 -z-10"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}
