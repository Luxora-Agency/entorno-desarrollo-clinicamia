'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Stethoscope,
  ClipboardList,
  Pill,
  FileText,
  CheckCircle2,
  Lightbulb,
  Copy,
  Sparkles
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Plantillas de recomendaciones predefinidas
const PLANTILLAS_RECOMENDACIONES = {
  diagnostico: [
    'Control en 2 semanas para seguimiento de evolución clínica.',
    'Si persisten los síntomas o empeoran, consultar antes de la cita programada.',
    'Se recomienda seguimiento por especialista según evolución.',
    'Continuar con tratamiento ambulatorio bajo supervisión médica.',
  ],
  ordenes: [
    'Realizar exámenes en ayunas de 8-12 horas.',
    'Traer resultados de exámenes a la próxima consulta.',
    'En caso de resultados alterados, comunicarse inmediatamente.',
    'Ecografía abdominal con vejiga llena.',
  ],
  tratamiento: [
    'Tomar medicamentos con alimentos para evitar molestias gástricas.',
    'No suspender tratamiento sin autorización médica.',
    'Evitar consumo de alcohol durante el tratamiento.',
    'Mantener horario regular de medicación.',
    'Si presenta reacciones adversas, suspender y consultar.',
  ],
  generales: [
    'Mantener reposo relativo durante la fase aguda.',
    'Dieta blanda, fraccionada, sin irritantes.',
    'Hidratación abundante (mínimo 2 litros diarios).',
    'Evitar esfuerzos físicos intensos.',
    'Signos de alarma: fiebre alta, dolor intenso, sangrado, dificultad respiratoria.',
    'Acudir a urgencias si presenta deterioro clínico.',
    'Control de signos vitales en casa si es posible.',
    'Mantener ambiente ventilado y limpio.',
  ]
};

export default function FormularioRecomendaciones({ onChange, data }) {
  const { toast } = useToast();
  const [recomendaciones, setRecomendaciones] = useState({
    diagnostico: data?.diagnostico || '',
    ordenes: data?.ordenes || '',
    tratamiento: data?.tratamiento || '',
    generales: data?.generales || '',
  });
  const [expandedSections, setExpandedSections] = useState(['generales']);

  useEffect(() => {
    if (onChange) {
      // Solo notificar si hay alguna recomendación
      const tieneContenido = Object.values(recomendaciones).some(v => v.trim());
      onChange(tieneContenido ? recomendaciones : null, true);
    }
  }, [recomendaciones, onChange]);

  const handleChange = (section, value) => {
    setRecomendaciones(prev => ({
      ...prev,
      [section]: value
    }));
  };

  const agregarPlantilla = (section, texto) => {
    setRecomendaciones(prev => ({
      ...prev,
      [section]: prev[section]
        ? `${prev[section]}\n${texto}`
        : texto
    }));
    toast({ description: 'Recomendación agregada' });
  };

  const copiarTodo = () => {
    const textoCompleto = Object.entries(recomendaciones)
      .filter(([_, v]) => v.trim())
      .map(([key, value]) => {
        const titulo = key === 'diagnostico' ? 'Sobre el Diagnóstico'
          : key === 'ordenes' ? 'Sobre Órdenes/Exámenes'
          : key === 'tratamiento' ? 'Sobre el Tratamiento'
          : 'Recomendaciones Generales';
        return `${titulo}:\n${value}`;
      })
      .join('\n\n');

    navigator.clipboard.writeText(textoCompleto);
    toast({ description: 'Recomendaciones copiadas al portapapeles' });
  };

  const contarRecomendaciones = () => {
    return Object.values(recomendaciones).filter(v => v.trim()).length;
  };

  const getSectionConfig = (section) => {
    switch (section) {
      case 'diagnostico':
        return {
          icon: Stethoscope,
          titulo: 'Recomendaciones sobre Diagnóstico',
          color: 'text-blue-600',
          bgColor: 'bg-blue-50',
          placeholder: 'Recomendaciones relacionadas con el diagnóstico, seguimiento, pronóstico...'
        };
      case 'ordenes':
        return {
          icon: ClipboardList,
          titulo: 'Recomendaciones sobre Órdenes/Exámenes',
          color: 'text-indigo-600',
          bgColor: 'bg-indigo-50',
          placeholder: 'Indicaciones para exámenes solicitados, preparación, interpretación...'
        };
      case 'tratamiento':
        return {
          icon: Pill,
          titulo: 'Recomendaciones sobre Tratamiento',
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          placeholder: 'Indicaciones sobre medicamentos, dosis, horarios, precauciones...'
        };
      case 'generales':
        return {
          icon: FileText,
          titulo: 'Recomendaciones Generales',
          color: 'text-amber-600',
          bgColor: 'bg-amber-50',
          placeholder: 'Indicaciones generales de cuidado, dieta, actividad física, signos de alarma...'
        };
      default:
        return {
          icon: FileText,
          titulo: 'Recomendaciones',
          color: 'text-gray-600',
          bgColor: 'bg-gray-50',
          placeholder: 'Escriba las recomendaciones...'
        };
    }
  };

  return (
    <Card className="border-amber-200">
      <CardHeader className="bg-gradient-to-r from-amber-50 to-orange-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-600 rounded-lg">
              <Lightbulb className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-amber-900">Recomendaciones al Paciente</CardTitle>
              <CardDescription>
                Indicaciones estructuradas para el plan de manejo
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {contarRecomendaciones() > 0 && (
              <>
                <Badge className="bg-amber-600">
                  {contarRecomendaciones()} sección(es)
                </Badge>
                <Button variant="outline" size="sm" onClick={copiarTodo}>
                  <Copy className="h-4 w-4 mr-1" />
                  Copiar
                </Button>
              </>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        <Accordion
          type="multiple"
          value={expandedSections}
          onValueChange={setExpandedSections}
          className="space-y-2"
        >
          {['diagnostico', 'ordenes', 'tratamiento', 'generales'].map(section => {
            const config = getSectionConfig(section);
            const IconComponent = config.icon;
            const tieneContenido = recomendaciones[section].trim();

            return (
              <AccordionItem
                key={section}
                value={section}
                className={`border rounded-lg overflow-hidden ${tieneContenido ? 'border-2 border-green-300' : ''}`}
              >
                <AccordionTrigger className={`px-4 hover:no-underline ${config.bgColor}`}>
                  <div className="flex items-center gap-3">
                    <IconComponent className={`h-5 w-5 ${config.color}`} />
                    <span className="font-semibold text-gray-800">{config.titulo}</span>
                    {tieneContenido && (
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    )}
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4 pt-2">
                  {/* Plantillas rápidas */}
                  <div className="mb-3">
                    <p className="text-xs text-gray-500 mb-2 flex items-center gap-1">
                      <Sparkles className="h-3 w-3" />
                      Plantillas rápidas:
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {PLANTILLAS_RECOMENDACIONES[section].map((plantilla, idx) => (
                        <Button
                          key={idx}
                          variant="outline"
                          size="sm"
                          className="text-xs h-7"
                          onClick={() => agregarPlantilla(section, plantilla)}
                        >
                          {plantilla.substring(0, 40)}...
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Textarea para la recomendación */}
                  <Textarea
                    placeholder={config.placeholder}
                    value={recomendaciones[section]}
                    onChange={(e) => handleChange(section, e.target.value)}
                    rows={4}
                    className="resize-none"
                  />
                  <p className="text-xs text-gray-400 mt-1 text-right">
                    {recomendaciones[section].length} caracteres
                  </p>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>

        {/* Resumen */}
        {contarRecomendaciones() > 0 && (
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-800 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              Se han registrado recomendaciones en {contarRecomendaciones()} sección(es).
              Estas serán incluidas en el resumen de la consulta.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
