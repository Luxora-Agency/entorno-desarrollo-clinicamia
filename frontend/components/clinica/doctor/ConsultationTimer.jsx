'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Timer, Play, Pause, RotateCcw, Clock, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

// Formatear segundos a mm:ss o hh:mm:ss
const formatTime = (totalSeconds) => {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

// Hook para usar el temporizador
export function useConsultationTimer(options = {}) {
  const {
    autoStart = true,
    warningThreshold = 20 * 60, // 20 minutos
    criticalThreshold = 30 * 60, // 30 minutos
    onWarning,
    onCritical,
  } = options;

  const [seconds, setSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(autoStart);
  const [startTime, setStartTime] = useState(autoStart ? new Date() : null);
  const intervalRef = useRef(null);
  const warningTriggeredRef = useRef(false);
  const criticalTriggeredRef = useRef(false);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setSeconds((prev) => {
          const newSeconds = prev + 1;

          // Disparar warning
          if (newSeconds >= warningThreshold && !warningTriggeredRef.current) {
            warningTriggeredRef.current = true;
            onWarning?.();
          }

          // Disparar critical
          if (newSeconds >= criticalThreshold && !criticalTriggeredRef.current) {
            criticalTriggeredRef.current = true;
            onCritical?.();
          }

          return newSeconds;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, warningThreshold, criticalThreshold, onWarning, onCritical]);

  const start = useCallback(() => {
    if (!startTime) {
      setStartTime(new Date());
    }
    setIsRunning(true);
  }, [startTime]);

  const pause = useCallback(() => {
    setIsRunning(false);
  }, []);

  const reset = useCallback(() => {
    setSeconds(0);
    setIsRunning(false);
    setStartTime(null);
    warningTriggeredRef.current = false;
    criticalTriggeredRef.current = false;
  }, []);

  const toggle = useCallback(() => {
    if (isRunning) {
      pause();
    } else {
      start();
    }
  }, [isRunning, start, pause]);

  return {
    seconds,
    isRunning,
    startTime,
    formattedTime: formatTime(seconds),
    isWarning: seconds >= warningThreshold,
    isCritical: seconds >= criticalThreshold,
    start,
    pause,
    reset,
    toggle,
  };
}

// Componente compacto para mostrar en la barra de contexto del paciente
export function CompactTimer({
  seconds,
  isRunning,
  isWarning,
  isCritical,
  onToggle,
  onReset,
  className = '',
}) {
  const formattedTime = formatTime(seconds);

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={`
              flex items-center gap-2 px-3 py-1.5 rounded-lg cursor-pointer transition-all
              ${isCritical
                ? 'bg-red-100 text-red-700 border border-red-200'
                : isWarning
                  ? 'bg-amber-100 text-amber-700 border border-amber-200'
                  : 'bg-gray-100 text-gray-700 border border-gray-200'
              }
              ${className}
            `}
            onClick={onToggle}
          >
            <div className={`flex items-center gap-1.5 ${isRunning ? 'animate-pulse' : ''}`}>
              <Timer className="h-4 w-4" />
              <span className="font-mono text-sm font-medium">{formattedTime}</span>
            </div>
            {!isRunning && seconds > 0 && (
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5 p-0"
                onClick={(e) => {
                  e.stopPropagation();
                  onReset?.();
                }}
              >
                <RotateCcw className="h-3 w-3" />
              </Button>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p className="font-medium">Tiempo de consulta</p>
          <p className="text-xs text-gray-400">
            {isRunning ? 'Click para pausar' : 'Click para continuar'}
          </p>
          {isWarning && !isCritical && (
            <p className="text-xs text-amber-500 mt-1">
              <AlertCircle className="h-3 w-3 inline mr-1" />
              Consulta extendida
            </p>
          )}
          {isCritical && (
            <p className="text-xs text-red-500 mt-1">
              <AlertCircle className="h-3 w-3 inline mr-1" />
              Tiempo excedido
            </p>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// Componente principal del temporizador
export default function ConsultationTimer({
  autoStart = true,
  warningMinutes = 20,
  criticalMinutes = 30,
  onWarning,
  onCritical,
  showControls = true,
  compact = false,
  className = '',
}) {
  const {
    seconds,
    isRunning,
    formattedTime,
    isWarning,
    isCritical,
    start,
    pause,
    reset,
    toggle,
  } = useConsultationTimer({
    autoStart,
    warningThreshold: warningMinutes * 60,
    criticalThreshold: criticalMinutes * 60,
    onWarning,
    onCritical,
  });

  if (compact) {
    return (
      <CompactTimer
        seconds={seconds}
        isRunning={isRunning}
        isWarning={isWarning}
        isCritical={isCritical}
        onToggle={toggle}
        onReset={reset}
        className={className}
      />
    );
  }

  return (
    <div
      className={`
        flex items-center gap-3 p-3 rounded-xl border transition-all
        ${isCritical
          ? 'bg-red-50 border-red-200'
          : isWarning
            ? 'bg-amber-50 border-amber-200'
            : 'bg-white border-gray-200'
        }
        ${className}
      `}
    >
      <div className={`p-2 rounded-lg ${
        isCritical ? 'bg-red-100' :
        isWarning ? 'bg-amber-100' :
        'bg-blue-100'
      }`}>
        <Timer className={`h-5 w-5 ${
          isCritical ? 'text-red-600' :
          isWarning ? 'text-amber-600' :
          'text-blue-600'
        }`} />
      </div>

      <div className="flex-1">
        <p className="text-xs text-gray-500 mb-0.5">Tiempo de consulta</p>
        <p className={`text-xl font-mono font-bold ${
          isCritical ? 'text-red-700' :
          isWarning ? 'text-amber-700' :
          'text-gray-900'
        }`}>
          {formattedTime}
        </p>
      </div>

      {showControls && (
        <div className="flex items-center gap-1">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggle}
                  className="h-8 w-8"
                >
                  {isRunning ? (
                    <Pause className="h-4 w-4" />
                  ) : (
                    <Play className="h-4 w-4" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {isRunning ? 'Pausar' : 'Continuar'}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={reset}
                  className="h-8 w-8"
                  disabled={seconds === 0}
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Reiniciar</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      )}

      {isWarning && (
        <Badge className={`${
          isCritical ? 'bg-red-500' : 'bg-amber-500'
        } text-white animate-pulse`}>
          {isCritical ? 'Excedido' : 'Extendida'}
        </Badge>
      )}
    </div>
  );
}
