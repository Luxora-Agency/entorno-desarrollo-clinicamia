'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { FileText, AlertCircle } from 'lucide-react';
import BotonCorrectorOrtografia from './BotonCorrectorOrtografia';
import TemplateSelector from '../templates/TemplateSelector';

export default function FormularioSOAPConsulta({ onChange, data }) {
  const [formData, setFormData] = useState({
    subjetivo: data?.subjetivo || '',
    objetivo: data?.objetivo || '',
    analisis: data?.analisis || '',
    plan: data?.plan || '',
  });

  const [errors, setErrors] = useState({});

  const handleChange = (field, value) => {
    const newData = { ...formData, [field]: value };
    setFormData(newData);
    
    // Validar campo
    let updatedErrors = { ...errors };
    if (!value.trim()) {
      updatedErrors[field] = 'Este campo es obligatorio';
    } else {
      delete updatedErrors[field];
    }
    setErrors(updatedErrors);
    
    // Notificar al padre con validación completa
    const isValid = Object.keys(updatedErrors).length === 0 && 
                    newData.subjetivo.trim() && 
                    newData.objetivo.trim() && 
                    newData.analisis.trim() && 
                    newData.plan.trim();
    onChange(newData, isValid);
  };

  const isComplete = () => {
    return formData.subjetivo.trim() && 
           formData.objetivo.trim() && 
           formData.analisis.trim() && 
           formData.plan.trim();
  };

  return (
    <Card className="border-blue-200">
      <CardHeader className="bg-blue-50">
        <CardTitle className="flex items-center gap-2 text-blue-900">
          <FileText className="h-5 w-5" />
          Notas SOAP (Obligatorio)
          {!isComplete() && (
            <span className="ml-auto flex items-center gap-1 text-sm text-red-600">
              <AlertCircle className="h-4 w-4" />
              Campos requeridos
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 pt-6">
        <div>
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <Label htmlFor="subjetivo" className="flex items-center gap-1">
                <span className="text-red-500">*</span> Subjetivo
              </Label>
              <TemplateSelector 
                category="SOAP" 
                onSelect={(text) => handleChange('subjetivo', formData.subjetivo + (formData.subjetivo ? '\n' : '') + text)} 
              />
            </div>
            <BotonCorrectorOrtografia
              texto={formData.subjetivo}
              onCorreccion={(text) => handleChange('subjetivo', text)}
              contexto="medico"
            />
          </div>
          <p className="text-xs text-gray-500 mb-2">
            Síntomas y quejas del paciente (en sus propias palabras)
          </p>
          <Textarea
            id="subjetivo"
            value={formData.subjetivo}
            onChange={(e) => handleChange('subjetivo', e.target.value)}
            placeholder="Ej: El paciente refiere dolor de cabeza desde hace 3 días..."
            rows={4}
            className={errors.subjetivo ? 'border-red-500' : ''}
          />
          {errors.subjetivo && (
            <p className="text-xs text-red-500 mt-1">{errors.subjetivo}</p>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <Label htmlFor="objetivo" className="flex items-center gap-1">
                <span className="text-red-500">*</span> Objetivo
              </Label>
              <TemplateSelector 
                category="SOAP" 
                onSelect={(text) => handleChange('objetivo', formData.objetivo + (formData.objetivo ? '\n' : '') + text)} 
              />
            </div>
            <BotonCorrectorOrtografia
              texto={formData.objetivo}
              onCorreccion={(text) => handleChange('objetivo', text)}
              contexto="medico"
            />
          </div>
          <p className="text-xs text-gray-500 mb-2">
            Hallazgos del examen físico y observaciones clínicas
          </p>
          <Textarea
            id="objetivo"
            value={formData.objetivo}
            onChange={(e) => handleChange('objetivo', e.target.value)}
            placeholder="Ej: PA: 120/80, FC: 72 lpm, Afebril. A la palpación..."
            rows={4}
            className={errors.objetivo ? 'border-red-500' : ''}
          />
          {errors.objetivo && (
            <p className="text-xs text-red-500 mt-1">{errors.objetivo}</p>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <Label htmlFor="analisis" className="flex items-center gap-1">
                <span className="text-red-500">*</span> Análisis
              </Label>
              <TemplateSelector 
                category="ANALISIS" 
                onSelect={(text) => handleChange('analisis', formData.analisis + (formData.analisis ? '\n' : '') + text)} 
              />
            </div>
            <BotonCorrectorOrtografia
              texto={formData.analisis}
              onCorreccion={(text) => handleChange('analisis', text)}
              contexto="medico"
            />
          </div>
          <p className="text-xs text-gray-500 mb-2">
            Diagnóstico e interpretación clínica
          </p>
          <Textarea
            id="analisis"
            value={formData.analisis}
            onChange={(e) => handleChange('analisis', e.target.value)}
            placeholder="Ej: Cefalea tensional. Descartar migraña..."
            rows={4}
            className={errors.analisis ? 'border-red-500' : ''}
          />
          {errors.analisis && (
            <p className="text-xs text-red-500 mt-1">{errors.analisis}</p>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <Label htmlFor="plan" className="flex items-center gap-1">
                <span className="text-red-500">*</span> Plan
              </Label>
              <TemplateSelector 
                category="PLAN" 
                onSelect={(text) => handleChange('plan', formData.plan + (formData.plan ? '\n' : '') + text)} 
              />
            </div>
            <BotonCorrectorOrtografia
              texto={formData.plan}
              onCorreccion={(text) => handleChange('plan', text)}
              contexto="medico"
            />
          </div>
          <p className="text-xs text-gray-500 mb-2">
            Plan de tratamiento y seguimiento
          </p>
          <Textarea
            id="plan"
            value={formData.plan}
            onChange={(e) => handleChange('plan', e.target.value)}
            placeholder="Ej: Prescribir analgésico. Control en 7 días..."
            rows={4}
            className={errors.plan ? 'border-red-500' : ''}
          />
          {errors.plan && (
            <p className="text-xs text-red-500 mt-1">{errors.plan}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
