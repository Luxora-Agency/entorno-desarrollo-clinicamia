'use client';

import { useState, useEffect } from 'react';
import { X, Save, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { useConceptosSanitarios } from '@/hooks/useConceptosSanitarios';

// Plantilla completa de los 28 ítems del concepto sanitario
// Basado en Resolución 3100 de 2019 - Habilitación de servicios de salud
const ITEMS_TEMPLATE = [
  // INFRAESTRUCTURA FÍSICA Y LOCATIVA (Ítems 1-5)
  { numero: 1, pregunta: 'Infraestructura física adecuada: área suficiente, ventilación, iluminación natural y artificial', respuesta: 'SI', observaciones: '', cumple: true, evidenciaUrl: '' },
  { numero: 2, pregunta: 'Señalización y demarcación de áreas: rutas de evacuación, salidas de emergencia, extintores', respuesta: 'SI', observaciones: '', cumple: true, evidenciaUrl: '' },
  { numero: 3, pregunta: 'Condiciones higiénicas sanitarias: limpieza, desinfección, control de plagas', respuesta: 'SI', observaciones: '', cumple: true, evidenciaUrl: '' },
  { numero: 4, pregunta: 'Baños y servicios sanitarios en cantidad suficiente y en buen estado', respuesta: 'SI', observaciones: '', cumple: true, evidenciaUrl: '' },
  { numero: 5, pregunta: 'Áreas de almacenamiento adecuadas: medicamentos, insumos, residuos', respuesta: 'SI', observaciones: '', cumple: true, evidenciaUrl: '' },

  // DOTACIÓN Y EQUIPAMIENTO (Ítems 6-10)
  { numero: 6, pregunta: 'Dotación completa de equipos médicos según servicios habilitados', respuesta: 'SI', observaciones: '', cumple: true, evidenciaUrl: '' },
  { numero: 7, pregunta: 'Mantenimiento preventivo y correctivo de equipos biomédicos documentado', respuesta: 'SI', observaciones: '', cumple: true, evidenciaUrl: '' },
  { numero: 8, pregunta: 'Hojas de vida de equipos biomédicos actualizadas', respuesta: 'SI', observaciones: '', cumple: true, evidenciaUrl: '' },
  { numero: 9, pregunta: 'Calibración de equipos que lo requieran vigente', respuesta: 'SI', observaciones: '', cumple: true, evidenciaUrl: '' },
  { numero: 10, pregunta: 'Mobiliario clínico en buen estado y suficiente', respuesta: 'SI', observaciones: '', cumple: true, evidenciaUrl: '' },

  // MEDICAMENTOS E INSUMOS (Ítems 11-13)
  { numero: 11, pregunta: 'Medicamentos almacenados adecuadamente: temperatura, humedad, cadena de frío', respuesta: 'SI', observaciones: '', cumple: true, evidenciaUrl: '' },
  { numero: 12, pregunta: 'Control de fechas de vencimiento de medicamentos e insumos', respuesta: 'SI', observaciones: '', cumple: true, evidenciaUrl: '' },
  { numero: 13, pregunta: 'Disponibilidad de medicamentos del listado básico según nivel de complejidad', respuesta: 'SI', observaciones: '', cumple: true, evidenciaUrl: '' },

  // PROCESOS PRIORITARIOS (Ítems 14-18)
  { numero: 14, pregunta: 'Historia clínica completa y diligenciada según normativa (Res. 1995/1999)', respuesta: 'SI', observaciones: '', cumple: true, evidenciaUrl: '' },
  { numero: 15, pregunta: 'Procesos de referencia y contrarreferencia documentados y operativos', respuesta: 'SI', observaciones: '', cumple: true, evidenciaUrl: '' },
  { numero: 16, pregunta: 'Protocolos de atención y guías de práctica clínica implementadas', respuesta: 'SI', observaciones: '', cumple: true, evidenciaUrl: '' },
  { numero: 17, pregunta: 'Procesos de esterilización y desinfección según normativa vigente', respuesta: 'SI', observaciones: '', cumple: true, evidenciaUrl: '' },
  { numero: 18, pregunta: 'Programa de seguridad del paciente implementado', respuesta: 'SI', observaciones: '', cumple: true, evidenciaUrl: '' },

  // TALENTO HUMANO (Ítems 19-21)
  { numero: 19, pregunta: 'Talento humano suficiente y calificado según servicios habilitados', respuesta: 'SI', observaciones: '', cumple: true, evidenciaUrl: '' },
  { numero: 20, pregunta: 'Hojas de vida del personal de salud completas con soportes de formación', respuesta: 'SI', observaciones: '', cumple: true, evidenciaUrl: '' },
  { numero: 21, pregunta: 'Programa de capacitación continua del personal documentado', respuesta: 'SI', observaciones: '', cumple: true, evidenciaUrl: '' },

  // GESTIÓN AMBIENTAL (Ítems 22-24)
  { numero: 22, pregunta: 'Plan de gestión integral de residuos hospitalarios (PGIRH) implementado', respuesta: 'SI', observaciones: '', cumple: true, evidenciaUrl: '' },
  { numero: 23, pregunta: 'Segregación adecuada de residuos: peligrosos, no peligrosos, reciclables', respuesta: 'SI', observaciones: '', cumple: true, evidenciaUrl: '' },
  { numero: 24, pregunta: 'Contrato vigente con empresa gestora de residuos peligrosos', respuesta: 'SI', observaciones: '', cumple: true, evidenciaUrl: '' },

  // DOCUMENTACIÓN Y SISTEMA DE GESTIÓN (Ítems 25-28)
  { numero: 25, pregunta: 'Manual de procesos y procedimientos actualizado', respuesta: 'SI', observaciones: '', cumple: true, evidenciaUrl: '' },
  { numero: 26, pregunta: 'Registros de indicadores de calidad y gestión de riesgos', respuesta: 'SI', observaciones: '', cumple: true, evidenciaUrl: '' },
  { numero: 27, pregunta: 'Plan de mejoramiento institucional con seguimiento documentado', respuesta: 'SI', observaciones: '', cumple: true, evidenciaUrl: '' },
  { numero: 28, pregunta: 'Cumplimiento de normativa específica según servicios habilitados', respuesta: 'SI', observaciones: '', cumple: true, evidenciaUrl: '' },
];

export default function ConceptoSanitarioForm({ concepto, anioDefault, onSuccess, onClose }) {
  const { createConcepto, updateConcepto, loading } = useConceptosSanitarios();

  const [formData, setFormData] = useState({
    anio: anioDefault || new Date().getFullYear(),
    numeroConcepto: '',
    fechaInspeccion: '',
    entidadInspectora: '',
    tipoInspeccion: 'ORDINARIA',
    observaciones: '',
  });

  const [items, setItems] = useState(ITEMS_TEMPLATE);

  useEffect(() => {
    if (concepto) {
      setFormData({
        anio: concepto.anio,
        numeroConcepto: concepto.numeroConcepto,
        fechaInspeccion: concepto.fechaInspeccion ? concepto.fechaInspeccion.split('T')[0] : '',
        entidadInspectora: concepto.entidadInspectora,
        tipoInspeccion: concepto.tipoInspeccion,
        observaciones: concepto.observaciones || '',
      });
      if (concepto.items && concepto.items.length === 28) {
        setItems(concepto.items);
      }
    }
  }, [concepto]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleItemChange = (index, field, value) => {
    setItems((prev) => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        [field]: value,
        cumple: field === 'respuesta' ? value === 'SI' : updated[index].cumple,
      };
      return updated;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.numeroConcepto.trim()) {
      alert('El número de concepto es requerido');
      return;
    }

    if (!formData.fechaInspeccion) {
      alert('La fecha de inspección es requerida');
      return;
    }

    const data = {
      ...formData,
      items,
    };

    let success;
    if (concepto) {
      success = await updateConcepto(concepto.id, data);
    } else {
      success = await createConcepto(data);
    }

    if (success) {
      onSuccess();
    }
  };

  const itemsConSI = items.filter(i => i.respuesta === 'SI').length;
  const itemsConNO = items.filter(i => i.respuesta === 'NO').length;
  const porcentajeCalculado = itemsConSI + itemsConNO > 0
    ? (itemsConSI / (itemsConSI + itemsConNO)) * 100
    : 0;

  // Categorías para renderizado dinámico con clases completas de Tailwind
  const categorias = [
    {
      id: 1,
      nombre: 'INFRAESTRUCTURA FÍSICA Y LOCATIVA',
      rango: [0, 5],
      headerBg: 'bg-blue-50',
      headerText: 'text-blue-900',
      badgeBg: 'bg-gradient-to-br from-blue-500 to-blue-600',
      hoverBg: 'hover:bg-blue-50/30'
    },
    {
      id: 2,
      nombre: 'DOTACIÓN Y EQUIPAMIENTO',
      rango: [5, 10],
      headerBg: 'bg-purple-50',
      headerText: 'text-purple-900',
      badgeBg: 'bg-gradient-to-br from-purple-500 to-purple-600',
      hoverBg: 'hover:bg-purple-50/30'
    },
    {
      id: 3,
      nombre: 'MEDICAMENTOS E INSUMOS',
      rango: [10, 13],
      headerBg: 'bg-green-50',
      headerText: 'text-green-900',
      badgeBg: 'bg-gradient-to-br from-green-500 to-green-600',
      hoverBg: 'hover:bg-green-50/30'
    },
    {
      id: 4,
      nombre: 'PROCESOS PRIORITARIOS',
      rango: [13, 18],
      headerBg: 'bg-orange-50',
      headerText: 'text-orange-900',
      badgeBg: 'bg-gradient-to-br from-orange-500 to-orange-600',
      hoverBg: 'hover:bg-orange-50/30'
    },
    {
      id: 5,
      nombre: 'TALENTO HUMANO',
      rango: [18, 21],
      headerBg: 'bg-indigo-50',
      headerText: 'text-indigo-900',
      badgeBg: 'bg-gradient-to-br from-indigo-500 to-indigo-600',
      hoverBg: 'hover:bg-indigo-50/30'
    },
    {
      id: 6,
      nombre: 'GESTIÓN AMBIENTAL',
      rango: [21, 24],
      headerBg: 'bg-teal-50',
      headerText: 'text-teal-900',
      badgeBg: 'bg-gradient-to-br from-teal-500 to-teal-600',
      hoverBg: 'hover:bg-teal-50/30'
    },
    {
      id: 7,
      nombre: 'DOCUMENTACIÓN Y SISTEMA DE GESTIÓN',
      rango: [24, 28],
      headerBg: 'bg-rose-50',
      headerText: 'text-rose-900',
      badgeBg: 'bg-gradient-to-br from-rose-500 to-rose-600',
      hoverBg: 'hover:bg-rose-50/30'
    },
  ];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-5xl w-full h-[90vh] flex flex-col overflow-hidden">
        {/* Header fijo */}
        <div className="flex-shrink-0 bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">
                {concepto ? 'Editar Concepto Sanitario' : 'Nuevo Concepto Sanitario'}
              </h2>
              <p className="text-sm text-blue-100">
                Evaluación de 28 ítems normativos • Año {formData.anio}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-white hover:bg-white/20"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Indicador de progreso */}
        <div className="flex-shrink-0 bg-white border-b px-6 py-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Progreso de evaluación</span>
            <span className="text-sm font-bold text-blue-600">
              {(Number(porcentajeCalculado) || 0).toFixed(1)}% Compliance
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                porcentajeCalculado >= 90
                  ? 'bg-green-500'
                  : porcentajeCalculado >= 70
                  ? 'bg-yellow-500'
                  : 'bg-red-500'
              }`}
              style={{ width: `${porcentajeCalculado}%` }}
            />
          </div>
          <div className="flex justify-between mt-2 text-xs">
            <span className="text-green-600 font-medium">
              ✓ {itemsConSI} Cumple
            </span>
            <span className="text-red-600 font-medium">
              ✗ {itemsConNO} No cumple
            </span>
          </div>
        </div>

        {/* Form scrolleable */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
          {/* Información básica */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Año <span className="text-red-500">*</span></Label>
              <Input
                type="number"
                value={formData.anio}
                onChange={(e) => handleChange('anio', parseInt(e.target.value))}
                min="2000"
                max="2100"
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Número de Concepto <span className="text-red-500">*</span></Label>
              <Input
                value={formData.numeroConcepto}
                onChange={(e) => handleChange('numeroConcepto', e.target.value)}
                placeholder="Ej: CS-2025-001"
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Fecha de Inspección <span className="text-red-500">*</span></Label>
              <Input
                type="date"
                value={formData.fechaInspeccion}
                onChange={(e) => handleChange('fechaInspeccion', e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Tipo de Inspección</Label>
              <Select
                value={formData.tipoInspeccion}
                onValueChange={(val) => handleChange('tipoInspeccion', val)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ORDINARIA">Ordinaria</SelectItem>
                  <SelectItem value="EXTRAORDINARIA">Extraordinaria</SelectItem>
                  <SelectItem value="SEGUIMIENTO">Seguimiento</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 col-span-2">
              <Label>Entidad Inspectora</Label>
              <Input
                value={formData.entidadInspectora}
                onChange={(e) => handleChange('entidadInspectora', e.target.value)}
                placeholder="Ej: Secretaría de Salud Municipal"
              />
            </div>

            <div className="space-y-2 col-span-2">
              <Label>Observaciones Generales</Label>
              <Textarea
                value={formData.observaciones}
                onChange={(e) => handleChange('observaciones', e.target.value)}
                rows={3}
                placeholder="Observaciones generales del concepto sanitario..."
              />
            </div>
          </div>

          {/* Lista de ítems individuales agrupados por categorías */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">Ítems de Evaluación</h3>
              <span className="text-sm text-gray-500">
                Scroll para ver todos los ítems ↓
              </span>
            </div>

            <div className="border-2 border-gray-200 rounded-xl overflow-hidden bg-gray-50">
              {categorias.map((categoria) => {
                const [start, end] = categoria.rango;
                const categoriaItems = items.slice(start, end);

                return (
                  <div key={categoria.id}>
                    {/* Header de categoría sticky */}
                    <div className={`${categoria.headerBg} px-4 py-2 border-b sticky top-0 z-10`}>
                      <h4 className={`font-semibold ${categoria.headerText} text-sm`}>
                        {categoria.id}. {categoria.nombre} (Ítems {items[start].numero}-{items[end - 1].numero})
                      </h4>
                    </div>

                    {/* Items de la categoría */}
                    <div className="divide-y divide-gray-200 bg-white">
                      {categoriaItems.map((item, idx) => {
                        const globalIndex = start + idx;

                        return (
                          <div key={globalIndex} className={`p-4 ${categoria.hoverBg} transition-colors`}>
                            <div className="flex items-start gap-3">
                              {/* Badge con número del ítem */}
                              <div className={`flex-shrink-0 w-8 h-8 ${categoria.badgeBg} rounded-lg flex items-center justify-center shadow-sm`}>
                                <span className="font-bold text-white text-xs">{item.numero}</span>
                              </div>

                              {/* Contenido del ítem */}
                              <div className="flex-1 space-y-2.5">
                                <p className="text-sm text-gray-700 leading-relaxed">{item.pregunta}</p>

                                {/* Botones SI/NO y observaciones */}
                                <div className="flex flex-col sm:flex-row gap-2">
                                  <div className="flex gap-2">
                                    <button
                                      type="button"
                                      onClick={() => handleItemChange(globalIndex, 'respuesta', 'SI')}
                                      className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                                        item.respuesta === 'SI'
                                          ? 'bg-green-600 text-white shadow-md scale-105'
                                          : 'bg-white border-2 border-gray-200 text-gray-700 hover:border-green-400 hover:text-green-600'
                                      }`}
                                    >
                                      ✓ SI
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleItemChange(globalIndex, 'respuesta', 'NO')}
                                      className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                                        item.respuesta === 'NO'
                                          ? 'bg-red-600 text-white shadow-md scale-105'
                                          : 'bg-white border-2 border-gray-200 text-gray-700 hover:border-red-400 hover:text-red-600'
                                      }`}
                                    >
                                      ✗ NO
                                    </button>
                                  </div>
                                  <Input
                                    placeholder="Observaciones (opcional)"
                                    value={item.observaciones || ''}
                                    onChange={(e) => handleItemChange(globalIndex, 'observaciones', e.target.value)}
                                    className="flex-1 text-sm border-gray-300 focus:border-blue-500"
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </form>

        {/* Footer fijo con botones */}
        <div className="flex-shrink-0 bg-gray-50 border-t-2 px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <AlertCircle className="w-4 h-4" />
              <span>
                {itemsConSI + itemsConNO === 28
                  ? '✓ Todos los ítems evaluados'
                  : `${28 - (itemsConSI + itemsConNO)} ítems pendientes de evaluar`
                }
              </span>
            </div>
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={loading}
                className="min-w-[120px]"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                onClick={handleSubmit}
                disabled={loading}
                className="min-w-[180px] bg-blue-600 hover:bg-blue-700"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Guardando...
                  </span>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    {concepto ? 'Actualizar Concepto' : 'Crear Concepto'}
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
