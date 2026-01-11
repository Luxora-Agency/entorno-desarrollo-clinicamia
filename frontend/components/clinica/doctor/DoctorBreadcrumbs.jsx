'use client';

import { ChevronRight, Home, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Configuración de rutas con iconos y labels
const ROUTE_CONFIG = {
  dashboard: {
    label: 'Panel',
    icon: Home,
  },
  consulta: {
    label: 'Consulta',
    parent: 'dashboard',
  },
  agenda: {
    label: 'Mi Agenda',
    parent: 'dashboard',
  },
  hospitalizacion: {
    label: 'Hospitalización',
    parent: 'dashboard',
  },
  quirofano: {
    label: 'Quirófano',
    parent: 'dashboard',
  },
  epicrisis: {
    label: 'Epicrisis',
    parent: 'hospitalizacion',
  },
  hce: {
    label: 'Historia Clínica',
    parent: 'dashboard',
  },
  evolucion: {
    label: 'Evolución',
    parent: 'hospitalizacion',
  },
};

export default function DoctorBreadcrumbs({
  currentView,
  patientName,
  onNavigate,
  showBackButton = true,
  className = '',
}) {
  // Construir la ruta de breadcrumbs
  const buildBreadcrumbs = () => {
    const crumbs = [];
    let current = currentView;

    while (current) {
      const config = ROUTE_CONFIG[current];
      if (config) {
        crumbs.unshift({
          key: current,
          label: config.label,
          icon: config.icon,
        });
        current = config.parent;
      } else {
        break;
      }
    }

    return crumbs;
  };

  const breadcrumbs = buildBreadcrumbs();
  const parentView = ROUTE_CONFIG[currentView]?.parent;

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Botón de volver */}
      {showBackButton && parentView && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onNavigate(parentView)}
          className="gap-1.5 text-gray-600 hover:text-gray-900 -ml-2"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Volver</span>
        </Button>
      )}

      {/* Separador */}
      {showBackButton && parentView && (
        <div className="h-4 w-px bg-gray-200 mx-1" />
      )}

      {/* Breadcrumbs */}
      <nav className="flex items-center gap-1 text-sm">
        {breadcrumbs.map((crumb, index) => {
          const isLast = index === breadcrumbs.length - 1;
          const Icon = crumb.icon;

          return (
            <div key={crumb.key} className="flex items-center gap-1">
              {index > 0 && (
                <ChevronRight className="h-3.5 w-3.5 text-gray-400 mx-0.5" />
              )}

              {isLast ? (
                <span className="flex items-center gap-1.5 text-gray-900 font-medium">
                  {Icon && <Icon className="h-4 w-4" />}
                  {crumb.label}
                  {patientName && currentView !== 'dashboard' && (
                    <span className="text-gray-500 font-normal">
                      • {patientName}
                    </span>
                  )}
                </span>
              ) : (
                <button
                  onClick={() => onNavigate(crumb.key)}
                  className="flex items-center gap-1.5 text-gray-500 hover:text-blue-600 transition-colors"
                >
                  {Icon && <Icon className="h-4 w-4" />}
                  {crumb.label}
                </button>
              )}
            </div>
          );
        })}
      </nav>
    </div>
  );
}

// Componente simplificado para usar en headers de vistas
export function ViewHeader({
  currentView,
  patientName,
  onNavigate,
  title,
  subtitle,
  actions,
  className = '',
}) {
  return (
    <div className={`bg-white border-b border-gray-100 sticky top-0 z-10 ${className}`}>
      <div className="px-6 py-4">
        {/* Breadcrumbs */}
        <DoctorBreadcrumbs
          currentView={currentView}
          patientName={patientName}
          onNavigate={onNavigate}
          className="mb-3"
        />

        {/* Title row */}
        <div className="flex items-center justify-between">
          <div>
            {title && (
              <h1 className="text-xl font-bold text-gray-900">{title}</h1>
            )}
            {subtitle && (
              <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>
            )}
          </div>

          {actions && (
            <div className="flex items-center gap-2">
              {actions}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
