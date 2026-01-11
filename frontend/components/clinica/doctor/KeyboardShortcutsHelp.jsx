'use client';

import { useState, useEffect } from 'react';
import { Keyboard, X, Search, Command, ArrowUp, ArrowDown } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const SHORTCUT_CATEGORIES = [
  {
    title: 'Navegación General',
    shortcuts: [
      { keys: ['⌘', 'K'], description: 'Abrir búsqueda rápida / Command Palette' },
      { keys: ['Esc'], description: 'Cerrar modal / Cancelar acción' },
      { keys: ['?'], description: 'Mostrar esta ayuda' },
    ],
  },
  {
    title: 'Durante la Consulta',
    shortcuts: [
      { keys: ['Alt', '1'], description: 'Ir a Motivo de Consulta' },
      { keys: ['Alt', '2'], description: 'Ir a Signos Vitales' },
      { keys: ['Alt', '3'], description: 'Ir a Examen Físico (SOAP)' },
      { keys: ['Alt', '4'], description: 'Ir a Diagnóstico' },
      { keys: ['Alt', '5'], description: 'Ir a Prescripciones' },
      { keys: ['Alt', '6'], description: 'Ir a Procedimientos' },
      { keys: ['Alt', 'S'], description: 'Guardar progreso' },
      { keys: ['Alt', 'F'], description: 'Finalizar consulta' },
    ],
  },
  {
    title: 'Acciones Rápidas',
    shortcuts: [
      { keys: ['⌘', 'P'], description: 'Nueva prescripción' },
      { keys: ['⌘', 'L'], description: 'Nueva orden de laboratorio' },
      { keys: ['⌘', 'I'], description: 'Nueva orden de imagen' },
      { keys: ['⌘', 'Enter'], description: 'Confirmar acción principal' },
    ],
  },
  {
    title: 'Navegación en Listas',
    shortcuts: [
      { keys: ['↑', '↓'], description: 'Navegar entre elementos' },
      { keys: ['Enter'], description: 'Seleccionar elemento' },
      { keys: ['Tab'], description: 'Siguiente campo' },
      { keys: ['Shift', 'Tab'], description: 'Campo anterior' },
    ],
  },
];

export function useKeyboardShortcutsHelp() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e) => {
      // Mostrar ayuda con "?"
      if (e.key === '?' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        // Solo si no estamos en un input
        const activeElement = document.activeElement;
        const isInputFocused =
          activeElement?.tagName === 'INPUT' ||
          activeElement?.tagName === 'TEXTAREA' ||
          activeElement?.isContentEditable;

        if (!isInputFocused) {
          e.preventDefault();
          setIsOpen(true);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return { isOpen, setIsOpen };
}

export default function KeyboardShortcutsHelp({ open, onOpenChange }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2 text-lg">
            <div className="p-2 bg-gray-100 rounded-lg">
              <Keyboard className="h-5 w-5 text-gray-600" />
            </div>
            Atajos de Teclado
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto pr-2 space-y-6 py-4">
          {SHORTCUT_CATEGORIES.map((category) => (
            <div key={category.title}>
              <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <div className="h-px flex-1 bg-gray-200" />
                <span>{category.title}</span>
                <div className="h-px flex-1 bg-gray-200" />
              </h3>
              <div className="space-y-2">
                {category.shortcuts.map((shortcut, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <span className="text-sm text-gray-600">
                      {shortcut.description}
                    </span>
                    <div className="flex items-center gap-1">
                      {shortcut.keys.map((key, keyIndex) => (
                        <span key={keyIndex} className="flex items-center">
                          {keyIndex > 0 && (
                            <span className="text-gray-400 mx-1 text-xs">+</span>
                          )}
                          <kbd className="inline-flex items-center justify-center min-w-[24px] h-6 px-2 bg-gray-100 border border-gray-200 rounded text-xs font-mono text-gray-700 shadow-sm">
                            {key === '⌘' ? (
                              <Command className="h-3 w-3" />
                            ) : key === '↑' ? (
                              <ArrowUp className="h-3 w-3" />
                            ) : key === '↓' ? (
                              <ArrowDown className="h-3 w-3" />
                            ) : (
                              key
                            )}
                          </kbd>
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="flex-shrink-0 pt-4 border-t border-gray-100">
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-400 flex items-center gap-2">
              <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-[10px] font-mono">?</kbd>
              para abrir esta ayuda en cualquier momento
            </p>
            <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
              Cerrar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Componente pequeño para mostrar en el footer o como indicador
export function ShortcutsHint({ onClick }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 transition-colors"
    >
      <Keyboard className="h-3.5 w-3.5" />
      <span>Presiona</span>
      <kbd className="px-1 py-0.5 bg-gray-100 rounded text-[10px] font-mono">?</kbd>
      <span>para atajos</span>
    </button>
  );
}
