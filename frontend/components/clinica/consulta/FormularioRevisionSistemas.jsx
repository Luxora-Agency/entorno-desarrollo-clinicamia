'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  ChevronDown,
  ChevronUp,
  ClipboardCheck,
  AlertCircle,
  CheckCircle2,
  User,
  Heart,
  Wind,
  Apple,
  Droplets,
  Brain,
  Hand,
  Thermometer,
  Droplet,
  Eye,
  UserCircle,
  Mic,
  Bone,
  ClipboardList,
} from 'lucide-react';
import { SISTEMAS, VALOR_DEFAULT, getResumenRevision } from '@/constants/revisionPorSistemas';
import BotonCorrectorOrtografia from './BotonCorrectorOrtografia';

// Mapeo de iconos por sistema
const ICONOS = {
  User, Heart, Wind, Apple, Droplets, Brain, Hand, Thermometer, Droplet, Eye, UserCircle, Mic, Bone, ClipboardList,
};

export default function FormularioRevisionSistemas({ onChange, data }) {
  const [expandedSections, setExpandedSections] = useState({});
  const [formData, setFormData] = useState(data || {});
  const [observacionesGenerales, setObservacionesGenerales] = useState(data?.observacionesGenerales || '');

  useEffect(() => {
    if (data) {
      setFormData(data);
      setObservacionesGenerales(data.observacionesGenerales || '');
    }
  }, [data]);

  const toggleSection = (sistemaId) => {
    setExpandedSections(prev => ({
      ...prev,
      [sistemaId]: !prev[sistemaId],
    }));
  };

  const expandAll = () => {
    const allExpanded = {};
    Object.keys(SISTEMAS).forEach(key => {
      allExpanded[key] = true;
    });
    setExpandedSections(allExpanded);
  };

  const collapseAll = () => {
    setExpandedSections({});
  };

  const handleCheckChange = (sistemaId, preguntaId, checked) => {
    const newData = {
      ...formData,
      observacionesGenerales,
      [sistemaId]: {
        ...(formData[sistemaId] || {}),
        [preguntaId]: checked,
      },
    };
    setFormData(newData);
    notifyChange(newData);
  };

  const handleFreeTextChange = (sistemaId, preguntaId, text) => {
    const newData = {
      ...formData,
      observacionesGenerales,
      [sistemaId]: {
        ...(formData[sistemaId] || {}),
        [`${preguntaId}_detalle`]: text
      }
    };
    setFormData(newData);
    notifyChange(newData);
  };

  const handleObservacionesChange = (value) => {
    setObservacionesGenerales(value);
    const newData = { ...formData, observacionesGenerales: value };
    notifyChange(newData);
  };

  const notifyChange = (data) => {
    // Pasar los datos directamente ya que handleObservacionesChange incluye observacionesGenerales
    onChange(data, true);
  };

  const marcarTodoNegativo = (sistemaId) => {
    const sistema = SISTEMAS[sistemaId];
    const newSistemaData = {};
    sistema.preguntas.forEach(p => {
      newSistemaData[p.id] = false;
    });
    const newData = {
      ...formData,
      observacionesGenerales,
      [sistemaId]: newSistemaData,
    };
    setFormData(newData);
    notifyChange(newData);
  };

  const getPositivosCount = (sistemaId) => {
    const sistemaData = formData[sistemaId];
    if (!sistemaData) return 0;
    return Object.values(sistemaData).filter(v => v === true).length;
  };

  const getTotalPositivos = () => {
    return Object.keys(SISTEMAS).reduce((acc, key) => acc + getPositivosCount(key), 0);
  };

  const resumenPositivos = getResumenRevision(formData);

  return (
    <div className="space-y-6">
      {/* Header con resumen */}
      <Card className="border-indigo-200 bg-gradient-to-r from-indigo-50 to-purple-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-indigo-900">
            <ClipboardCheck className="h-5 w-5" />
            Revisión por Sistemas
            <Badge variant="secondary" className="ml-2">
              {getTotalPositivos()} síntomas positivos
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-600">
            Marque los síntomas que el paciente <strong>SÍ presenta</strong>.
            Los no marcados se consideran <strong>"{VALOR_DEFAULT}"</strong>.
          </p>

          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={expandAll}>
              Expandir todo
            </Button>
            <Button variant="outline" size="sm" onClick={collapseAll}>
              Colapsar todo
            </Button>
          </div>

          {/* Resumen de positivos */}
          {resumenPositivos.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mt-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="h-4 w-4 text-yellow-600" />
                <span className="text-sm font-semibold text-yellow-800">Síntomas Positivos:</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {resumenPositivos.map((item, idx) => (
                  <Badge key={idx} variant="outline" className="bg-yellow-100 border-yellow-300 text-yellow-800">
                    {item.sistema}: {item.sintoma}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sistemas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Object.entries(SISTEMAS).map(([sistemaId, sistema]) => {
          const Icon = ICONOS[sistema.icono] || ClipboardCheck;
          const isExpanded = expandedSections[sistemaId];
          const positivosCount = getPositivosCount(sistemaId);
          const sistemaData = formData[sistemaId] || {};

          return (
            <Card key={sistemaId} className={`border ${positivosCount > 0 ? 'border-yellow-300 bg-yellow-50/30' : 'border-gray-200'}`}>
              <CardHeader
                className="cursor-pointer py-3 hover:bg-gray-50 transition-colors"
                onClick={() => toggleSection(sistemaId)}
              >
                <CardTitle className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <Icon className={`h-4 w-4 ${positivosCount > 0 ? 'text-yellow-600' : 'text-gray-500'}`} />
                    <span className={positivosCount > 0 ? 'text-yellow-800' : 'text-gray-700'}>
                      {sistema.titulo}
                    </span>
                    {positivosCount > 0 && (
                      <Badge variant="destructive" className="text-xs px-1.5 py-0">
                        {positivosCount}
                      </Badge>
                    )}
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="h-4 w-4 text-gray-400" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-gray-400" />
                  )}
                </CardTitle>
              </CardHeader>

              {isExpanded && (
                <CardContent className="pt-0 space-y-3">
                  <div className="flex justify-end mb-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        marcarTodoNegativo(sistemaId);
                      }}
                      className="text-xs text-gray-500 hover:text-gray-700"
                    >
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Todo negativo
                    </Button>
                  </div>

                  <div className="space-y-2">
                    {sistema.preguntas.map((pregunta) => {
                      const isChecked = sistemaData[pregunta.id] === true;
                      return (
                        <div key={pregunta.id} className="space-y-2">
                          <div
                            className={`flex items-center space-x-3 p-2 rounded-md transition-colors ${
                              isChecked ? 'bg-yellow-100 border border-yellow-200' : 'hover:bg-gray-50'
                            }`}
                          >
                            <Checkbox
                              id={`${sistemaId}-${pregunta.id}`}
                              checked={isChecked}
                              onCheckedChange={(checked) => handleCheckChange(sistemaId, pregunta.id, checked)}
                            />
                            <Label
                              htmlFor={`${sistemaId}-${pregunta.id}`}
                              className={`text-sm cursor-pointer flex-1 ${
                                isChecked ? 'text-yellow-900 font-medium' : 'text-gray-600'
                              }`}
                            >
                              {pregunta.texto}
                            </Label>
                          </div>
                          {pregunta.permiteCampoLibre && isChecked && (
                            <Textarea
                              value={sistemaData[`${pregunta.id}_detalle`] || ''}
                              onChange={(e) => handleFreeTextChange(sistemaId, pregunta.id, e.target.value)}
                              placeholder="Especifique los hallazgos..."
                              className="mt-2"
                              rows={2}
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>

      {/* Observaciones generales */}
      <Card>
        <CardHeader className="bg-gray-50">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm text-gray-700">Observaciones Generales de la Revisión por Sistemas</CardTitle>
            <BotonCorrectorOrtografia
              texto={observacionesGenerales}
              onCorreccion={handleObservacionesChange}
              contexto="medico"
            />
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <Textarea
            value={observacionesGenerales}
            onChange={(e) => handleObservacionesChange(e.target.value)}
            placeholder="Agregue cualquier observación adicional sobre la revisión por sistemas..."
            rows={3}
          />
        </CardContent>
      </Card>
    </div>
  );
}
