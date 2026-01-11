'use client';

import { useState, useEffect } from 'react';
import { Plus, Calendar, TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useConceptosSanitarios } from '@/hooks/useConceptosSanitarios';
import ConceptoSanitarioCard from './ConceptoSanitarioCard';
import ConceptoSanitarioForm from './ConceptoSanitarioForm';

export default function ConceptosSanitariosTab({ user }) {
  const [anioSeleccionado, setAnioSeleccionado] = useState(new Date().getFullYear());
  const [showForm, setShowForm] = useState(false);
  const [conceptoEditando, setConceptoEditando] = useState(null);
  const [estadisticas, setEstadisticas] = useState(null);

  const {
    conceptos,
    loading,
    loadConceptosPorAnio,
    deleteConcepto,
    getEstadisticas,
    getAniosDisponibles,
  } = useConceptosSanitarios();

  const [aniosDisponibles, setAniosDisponibles] = useState([]);

  useEffect(() => {
    loadAnios();
  }, []);

  useEffect(() => {
    if (anioSeleccionado) {
      loadConceptosPorAnio(anioSeleccionado);
      loadEstadisticas();
    }
  }, [anioSeleccionado]);

  const loadAnios = async () => {
    const anios = await getAniosDisponibles();
    const anioActual = new Date().getFullYear();
    const todosAnios = Array.from(new Set([...anios, anioActual, anioActual - 1, anioActual + 1])).sort(
      (a, b) => b - a
    );
    setAniosDisponibles(todosAnios);
  };

  const loadEstadisticas = async () => {
    const stats = await getEstadisticas(anioSeleccionado);
    setEstadisticas(stats);
  };

  const handleCreate = () => {
    setConceptoEditando(null);
    setShowForm(true);
  };

  const handleEdit = (concepto) => {
    setConceptoEditando(concepto);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Está seguro de eliminar este concepto sanitario?')) {
      const success = await deleteConcepto(id);
      if (success) {
        loadConceptosPorAnio(anioSeleccionado);
        loadEstadisticas();
      }
    }
  };

  const handleSuccess = () => {
    setShowForm(false);
    setConceptoEditando(null);
    loadConceptosPorAnio(anioSeleccionado);
    loadEstadisticas();
    loadAnios();
  };

  const handleClose = () => {
    setShowForm(false);
    setConceptoEditando(null);
  };

  return (
    <div className="space-y-6">
      {/* Header y filtros */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-gray-600" />
            <Select value={String(anioSeleccionado)} onValueChange={(val) => setAnioSeleccionado(parseInt(val))}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Año" />
              </SelectTrigger>
              <SelectContent>
                {aniosDisponibles.map((anio) => (
                  <SelectItem key={anio} value={String(anio)}>
                    {anio}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button onClick={handleCreate}>
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Concepto Sanitario
        </Button>
      </div>

      {/* Estadísticas */}
      {estadisticas && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900">{estadisticas.total}</div>
                <div className="text-sm text-gray-600 mt-1">Total Conceptos</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">{estadisticas.conformes}</div>
                <div className="text-sm text-gray-600 mt-1 flex items-center justify-center gap-1">
                  <CheckCircle className="w-3 h-3" />
                  Conformes
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-yellow-600">{estadisticas.requierenMejora}</div>
                <div className="text-sm text-gray-600 mt-1 flex items-center justify-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  Requieren Mejora
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-red-600">{estadisticas.noConformes}</div>
                <div className="text-sm text-gray-600 mt-1 flex items-center justify-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  No Conformes
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">{(Number(estadisticas.promedioCompliance) || 0).toFixed(1)}%</div>
                <div className="text-sm text-gray-600 mt-1">Compliance Promedio</div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Lista de conceptos */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Conceptos Sanitarios {anioSeleccionado}
        </h3>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
          </div>
        ) : conceptos.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center text-gray-500">
                <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p className="text-lg font-medium">No hay conceptos sanitarios para {anioSeleccionado}</p>
                <p className="text-sm mt-2">Cree el primer concepto sanitario del año</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {conceptos.map((concepto) => (
              <ConceptoSanitarioCard
                key={concepto.id}
                concepto={concepto}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modal de formulario */}
      {showForm && (
        <ConceptoSanitarioForm
          concepto={conceptoEditando}
          anioDefault={anioSeleccionado}
          onSuccess={handleSuccess}
          onClose={handleClose}
        />
      )}
    </div>
  );
}
