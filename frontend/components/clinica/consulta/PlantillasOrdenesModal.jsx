'use client';

import { useState, useMemo } from 'react';
import { X, Search, FileStack, CheckCircle, Plus, Beaker, Stethoscope, Heart, Droplets, Shield, Bug, Activity, Baby, Image, Briefcase } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PLANTILLAS_ORDENES, PLANTILLAS_POR_CATEGORIA, CATEGORIAS } from '@/constants/plantillasOrdenes';

// Iconos por categoría
const ICONOS_CATEGORIA = {
  'Endocrinología': Activity,
  'Laboratorio General': Beaker,
  'Hematología': Droplets,
  'Uroanálisis': Beaker,
  'Cardiología': Heart,
  'Inmunología': Shield,
  'Infeccioso': Bug,
  'Hormonas': Activity,
  'Prenatal': Baby,
  'Imagenología': Image,
  'Chequeo Integral': Briefcase
};

// Colores por categoría
const COLORES_CATEGORIA = {
  'Endocrinología': 'bg-purple-100 text-purple-700 border-purple-300',
  'Laboratorio General': 'bg-blue-100 text-blue-700 border-blue-300',
  'Hematología': 'bg-red-100 text-red-700 border-red-300',
  'Uroanálisis': 'bg-yellow-100 text-yellow-700 border-yellow-300',
  'Cardiología': 'bg-pink-100 text-pink-700 border-pink-300',
  'Inmunología': 'bg-green-100 text-green-700 border-green-300',
  'Infeccioso': 'bg-orange-100 text-orange-700 border-orange-300',
  'Hormonas': 'bg-fuchsia-100 text-fuchsia-700 border-fuchsia-300',
  'Prenatal': 'bg-cyan-100 text-cyan-700 border-cyan-300',
  'Imagenología': 'bg-slate-100 text-slate-700 border-slate-300',
  'Chequeo Integral': 'bg-indigo-100 text-indigo-700 border-indigo-300'
};

export default function PlantillasOrdenesModal({ onSelect, onClose }) {
  const [busqueda, setBusqueda] = useState('');
  const [plantillasSeleccionadas, setPlantillasSeleccionadas] = useState([]);
  const [categoriaActiva, setCategoriaActiva] = useState('todas');

  // Filtrar plantillas
  const plantillasFiltradas = useMemo(() => {
    let plantillas = PLANTILLAS_ORDENES;

    // Filtrar por búsqueda
    if (busqueda.trim()) {
      const termino = busqueda.toLowerCase();
      plantillas = plantillas.filter(p =>
        p.nombre.toLowerCase().includes(termino) ||
        p.categoria.toLowerCase().includes(termino) ||
        p.examenes.some(e =>
          e.nombre.toLowerCase().includes(termino) ||
          e.codigoCups.includes(termino)
        )
      );
    }

    // Filtrar por categoría
    if (categoriaActiva !== 'todas') {
      plantillas = plantillas.filter(p => p.categoria === categoriaActiva);
    }

    return plantillas;
  }, [busqueda, categoriaActiva]);

  // Toggle selección de plantilla
  const togglePlantilla = (plantillaId) => {
    setPlantillasSeleccionadas(prev => {
      if (prev.includes(plantillaId)) {
        return prev.filter(id => id !== plantillaId);
      }
      return [...prev, plantillaId];
    });
  };

  // Agregar todas las plantillas seleccionadas
  const handleAgregar = () => {
    const examenesAgregar = [];
    plantillasSeleccionadas.forEach(plantillaId => {
      const plantilla = PLANTILLAS_ORDENES.find(p => p.id === plantillaId);
      if (plantilla) {
        plantilla.examenes.forEach(examen => {
          // Evitar duplicados
          if (!examenesAgregar.some(e => e.codigoCups === examen.codigoCups)) {
            examenesAgregar.push({
              ...examen,
              plantillaOrigen: plantilla.nombre
            });
          }
        });
      }
    });

    if (examenesAgregar.length > 0) {
      onSelect(examenesAgregar);
    }
    onClose();
  };

  // Contar exámenes seleccionados
  const totalExamenes = useMemo(() => {
    const examenesUnicos = new Set();
    plantillasSeleccionadas.forEach(plantillaId => {
      const plantilla = PLANTILLAS_ORDENES.find(p => p.id === plantillaId);
      if (plantilla) {
        plantilla.examenes.forEach(e => examenesUnicos.add(e.codigoCups));
      }
    });
    return examenesUnicos.size;
  }, [plantillasSeleccionadas]);

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileStack className="h-6 w-6" />
              <div>
                <h2 className="text-lg font-bold">Plantillas de Órdenes CUPS</h2>
                <p className="text-sm text-blue-100">Seleccione plantillas para agregar exámenes rápidamente</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-white hover:bg-white/20"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Búsqueda */}
        <div className="p-4 border-b bg-gray-50">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar por nombre de plantilla, examen o código CUPS..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Tabs de categorías */}
        <Tabs value={categoriaActiva} onValueChange={setCategoriaActiva} className="flex-1 flex flex-col overflow-hidden">
          <div className="px-4 pt-2 border-b">
            <ScrollArea className="w-full">
              <TabsList className="inline-flex h-10 w-max bg-gray-100 p-1">
                <TabsTrigger value="todas" className="text-xs px-3">
                  Todas
                </TabsTrigger>
                {CATEGORIAS.map(cat => {
                  const Icono = ICONOS_CATEGORIA[cat] || Beaker;
                  return (
                    <TabsTrigger key={cat} value={cat} className="text-xs px-3 flex items-center gap-1">
                      <Icono className="h-3 w-3" />
                      {cat}
                    </TabsTrigger>
                  );
                })}
              </TabsList>
            </ScrollArea>
          </div>

          {/* Contenido */}
          <ScrollArea className="flex-1 p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {plantillasFiltradas.map(plantilla => {
                const isSelected = plantillasSeleccionadas.includes(plantilla.id);
                const colorClass = COLORES_CATEGORIA[plantilla.categoria] || 'bg-gray-100 text-gray-700 border-gray-300';
                const Icono = ICONOS_CATEGORIA[plantilla.categoria] || Beaker;

                return (
                  <div
                    key={plantilla.id}
                    onClick={() => togglePlantilla(plantilla.id)}
                    className={`
                      border rounded-lg p-4 cursor-pointer transition-all
                      ${isSelected
                        ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                        : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                      }
                    `}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => togglePlantilla(plantilla.id)}
                          onClick={(e) => e.stopPropagation()}
                        />
                        <div>
                          <h3 className="font-semibold text-gray-800">{plantilla.nombre}</h3>
                          <Badge className={`${colorClass} text-xs mt-1`}>
                            <Icono className="h-3 w-3 mr-1" />
                            {plantilla.categoria}
                          </Badge>
                        </div>
                      </div>
                      {isSelected && (
                        <CheckCircle className="h-5 w-5 text-blue-600" />
                      )}
                    </div>

                    <div className="mt-3 space-y-1">
                      {plantilla.examenes.map((examen, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-sm">
                          <span className="font-mono text-xs text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                            {examen.codigoCups}
                          </span>
                          <span className="text-gray-600 truncate">{examen.nombre}</span>
                        </div>
                      ))}
                    </div>

                    <div className="mt-3 pt-2 border-t border-gray-100 text-xs text-gray-500">
                      {plantilla.examenes.length} examen{plantilla.examenes.length !== 1 ? 'es' : ''}
                    </div>
                  </div>
                );
              })}
            </div>

            {plantillasFiltradas.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <FileStack className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>No se encontraron plantillas</p>
                <p className="text-sm">Intente con otro término de búsqueda</p>
              </div>
            )}
          </ScrollArea>
        </Tabs>

        {/* Footer */}
        <div className="p-4 border-t bg-gray-50 flex items-center justify-between rounded-b-xl">
          <div className="text-sm text-gray-600">
            {plantillasSeleccionadas.length > 0 ? (
              <>
                <span className="font-semibold text-blue-600">{plantillasSeleccionadas.length}</span> plantilla(s) seleccionada(s)
                {' • '}
                <span className="font-semibold text-green-600">{totalExamenes}</span> examen(es) a agregar
              </>
            ) : (
              'Seleccione una o más plantillas'
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button
              onClick={handleAgregar}
              disabled={plantillasSeleccionadas.length === 0}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Agregar Exámenes ({totalExamenes})
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
