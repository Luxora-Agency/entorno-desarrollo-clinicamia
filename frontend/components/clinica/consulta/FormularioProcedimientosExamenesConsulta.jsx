'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Stethoscope, Plus, X, AlertCircle, Trash2, TestTube, FileStack } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import PlantillasOrdenesModal from './PlantillasOrdenesModal';

export default function FormularioProcedimientosExamenesConsulta({ onChange, data }) {
  const { toast } = useToast();
  const [quiereAgregar, setQuiereAgregar] = useState(data !== null && data !== undefined);
  const [ordenes, setOrdenes] = useState(data || []);
  const [ordenActual, setOrdenActual] = useState({
    tipo: 'Procedimiento', // Procedimiento o Examen
    servicioId: '',
    servicioNombre: '',
    costo: 0,
    observaciones: '',
  });
  const [servicios, setServicios] = useState([]);
  const [loadingServicios, setLoadingServicios] = useState(false);
  const [showPlantillasModal, setShowPlantillasModal] = useState(false);

  useEffect(() => {
    if (quiereAgregar && ordenActual.tipo) {
      cargarServicios(ordenActual.tipo);
    }
  }, [ordenActual.tipo, quiereAgregar]);

  const cargarServicios = async (tipo) => {
    setLoadingServicios(true);
    try {
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';
      
      const response = await fetch(`${apiUrl}/examenes-procedimientos?tipo=${tipo}&estado=Activo&limit=100`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setServicios(data.data || []);
      }
    } catch (error) {
      console.error('Error cargando servicios:', error);
      setServicios([]);
    } finally {
      setLoadingServicios(false);
    }
  };

  const handleToggle = (agregar) => {
    setQuiereAgregar(agregar);
    if (!agregar) {
      setOrdenes([]);
      onChange(null, true);
    } else {
      onChange(ordenes, ordenes.length > 0);
    }
  };

  const handleServicioChange = (servicioId) => {
    const servicio = servicios.find(s => s.id === servicioId);
    if (servicio) {
      setOrdenActual({
        ...ordenActual,
        servicioId: servicio.id,
        servicioNombre: servicio.nombre + (servicio.codigoCUPS ? ` (CUPS: ${servicio.codigoCUPS})` : ''),
        costo: servicio.costoBase || 0,
      });
    }
  };

  const agregarOrden = () => {
    if (!ordenActual.servicioId) {
      toast({ description: 'Seleccione un servicio' });
      return;
    }

    const nuevasOrdenes = [...ordenes, { ...ordenActual }];
    setOrdenes(nuevasOrdenes);
    onChange(nuevasOrdenes, true);

    // Reset
    setOrdenActual({
      tipo: ordenActual.tipo,
      servicioId: '',
      servicioNombre: '',
      costo: 0,
      observaciones: '',
    });
  };

  const eliminarOrden = (index) => {
    const nuevasOrdenes = ordenes.filter((_, i) => i !== index);
    setOrdenes(nuevasOrdenes);
    onChange(nuevasOrdenes, true);
  };

  // Agregar exámenes desde plantillas CUPS
  const handleAgregarDesdeTemplate = (examenes) => {
    const nuevasOrdenes = [...ordenes];
    let agregados = 0;

    examenes.forEach(examen => {
      // Verificar si ya existe este examen (por código CUPS)
      const yaExiste = nuevasOrdenes.some(o =>
        o.servicioNombre?.includes(examen.codigoCups) ||
        o.codigoCups === examen.codigoCups
      );

      if (!yaExiste) {
        nuevasOrdenes.push({
          tipo: 'Examen',
          servicioId: `cups_${examen.codigoCups}`,
          servicioNombre: `${examen.nombre} (CUPS: ${examen.codigoCups})`,
          codigoCups: examen.codigoCups,
          costo: 0,
          observaciones: examen.plantillaOrigen ? `Desde plantilla: ${examen.plantillaOrigen}` : '',
        });
        agregados++;
      }
    });

    if (agregados > 0) {
      setOrdenes(nuevasOrdenes);
      onChange(nuevasOrdenes, true);
      toast({
        title: 'Exámenes agregados',
        description: `Se agregaron ${agregados} examen(es) desde la plantilla`,
      });
    } else {
      toast({
        description: 'Todos los exámenes seleccionados ya estaban en la lista',
      });
    }
  };

  if (!quiereAgregar) {
    return (
      <Card className="border-indigo-200">
        <CardContent className="p-6 text-center">
          <div className="flex items-center justify-center gap-4 mb-4">
            <Stethoscope className="h-12 w-12 text-indigo-400" />
            <TestTube className="h-12 w-12 text-teal-400" />
          </div>
          <p className="text-gray-600 mb-4">¿Desea solicitar procedimientos o exámenes?</p>
          <Button 
            onClick={() => handleToggle(true)}
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Sí, solicitar procedimientos/exámenes
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-indigo-200">
      <CardHeader className="bg-indigo-50">
        <CardTitle className="flex items-center gap-2 text-indigo-900">
          <Stethoscope className="h-5 w-5" />
          Procedimientos y Exámenes (Opcional)
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleToggle(false)}
            className="ml-auto text-red-600 hover:text-red-700"
          >
            <X className="h-4 w-4 mr-1" />
            No agregar
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 pt-6">
        {/* Lista de órdenes agregadas */}
        {ordenes.length > 0 && (
          <div className="space-y-2">
            <Label>Órdenes Solicitadas ({ordenes.length})</Label>
            {ordenes.map((orden, index) => (
              <div key={index} className="bg-indigo-50 border border-indigo-200 rounded-md p-3 flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge className={
                      orden.tipo === 'Procedimiento' ? 'bg-indigo-600' : 
                      orden.tipo === 'Examen' ? 'bg-teal-600' : 'bg-orange-600'
                    }>
                      {orden.tipo}
                    </Badge>
                    <p className="font-semibold text-indigo-900">{orden.servicioNombre}</p>
                  </div>
                  {orden.observaciones && (
                    <p className="text-xs text-gray-500 mt-1">{orden.observaciones}</p>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => eliminarOrden(index)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* Formulario para agregar orden */}
        <div className="border-t pt-4 space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-base font-semibold">Agregar Procedimiento o Examen</Label>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowPlantillasModal(true)}
              className="border-indigo-300 text-indigo-600 hover:bg-indigo-50"
            >
              <FileStack className="h-4 w-4 mr-2" />
              Usar Plantillas CUPS
            </Button>
          </div>
          
          <div>
            <Label htmlFor="tipo" className="text-sm">Tipo</Label>
            <Select
              value={ordenActual.tipo}
              onValueChange={(value) => setOrdenActual({ ...ordenActual, tipo: value, servicioId: '', servicioNombre: '' })}
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Procedimiento">Procedimiento</SelectItem>
                <SelectItem value="Examen">Examen</SelectItem>
                <SelectItem value="Interconsulta">Interconsulta / Remisión</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="servicio" className="text-sm">Seleccionar Servicio</Label>
            {loadingServicios ? (
              <p className="text-sm text-gray-500 mt-2">Cargando servicios...</p>
            ) : (
              <Select
                value={ordenActual.servicioId}
                onValueChange={handleServicioChange}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Seleccione un servicio" />
                </SelectTrigger>
                <SelectContent>
                  {servicios.map((servicio) => (
                    <SelectItem key={servicio.id} value={servicio.id}>
                      {servicio.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <div>
            <Label htmlFor="observaciones" className="text-sm">Observaciones / Indicaciones</Label>
            <Textarea
              id="observaciones"
              value={ordenActual.observaciones}
              onChange={(e) => setOrdenActual({ ...ordenActual, observaciones: e.target.value })}
              placeholder="Indicaciones médicas, motivo, etc..."
              rows={2}
              className="mt-1"
            />
          </div>

          <Button
            onClick={agregarOrden}
            className="w-full bg-indigo-600 hover:bg-indigo-700"
            size="sm"
            disabled={!ordenActual.servicioId}
          >
            <Plus className="h-4 w-4 mr-2" />
            Agregar a la solicitud
          </Button>
        </div>

        {/* Modal de Plantillas CUPS */}
        {showPlantillasModal && (
          <PlantillasOrdenesModal
            onSelect={handleAgregarDesdeTemplate}
            onClose={() => setShowPlantillasModal(false)}
          />
        )}
      </CardContent>
    </Card>
  );
}
