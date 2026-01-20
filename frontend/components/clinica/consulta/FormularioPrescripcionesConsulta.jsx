'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Pill, Plus, X, AlertCircle, Trash2, History, Sparkles, Calculator, Brain, Loader2, CheckCircle2, AlertTriangle, Package } from 'lucide-react';
import TemplateSelector from '../templates/TemplateSelector';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { apiGet } from '@/services/api';

export default function FormularioPrescripcionesConsulta({ onChange, data, diagnosticoConsulta, pacienteId, planManejoData }) {
  const { toast } = useToast();
  const [quiereAgregar, setQuiereAgregar] = useState(data !== null && data !== undefined);
  const [formData, setFormData] = useState(data || {
    diagnostico: '',
    medicamentos: [],
  });

  // Track the count of processed kits to detect new additions
  const lastKitCountRef = useRef(0);

  // Sync kit medications from planManejoData when new kits are added
  useEffect(() => {
    const aplicaciones = planManejoData?.aplicacionesItems || [];
    const currentCount = aplicaciones.length;
    const previousCount = lastKitCountRef.current;

    // Only process if new kits were added (count increased)
    if (currentCount <= previousCount) {
      lastKitCountRef.current = currentCount;
      return;
    }

    // Get only the newly added kits (slice from previous count)
    const newKits = aplicaciones.slice(previousCount);
    lastKitCountRef.current = currentCount;

    if (newKits.length === 0) return;

    // Create medications from new kits only
    const kitMedicamentos = newKits.flatMap(kit =>
      kit.medicamentos?.map(med => ({
        nombre: med.nombre,
        dosis: med.concentracion,
        frecuencia: 'Unica',
        via: med.via,
        cantidad: med.cantidad,
        duracion: '1 día',
        instrucciones: `Aplicación de Kit: ${kit.nombre} (${kit.codigo})`,
        esDeKit: true,
        kitOrigen: kit.codigo
      })) || []
    );

    if (kitMedicamentos.length === 0) return;

    // Update form data with new medications
    setFormData(prev => {
      const newData = {
        ...prev,
        medicamentos: [...prev.medicamentos, ...kitMedicamentos]
      };
      // Notify parent after state update via setTimeout
      setTimeout(() => onChange(newData, true), 0);
      return newData;
    });

    // Auto-expand form
    setQuiereAgregar(true);

  }, [planManejoData?.aplicacionesItems?.length]);

  // Auto-fill diagnosis from consultation when available
  useEffect(() => {
    if (diagnosticoConsulta?.principal?.codigoCIE10 && diagnosticoConsulta?.principal?.descripcionCIE10) {
      const diagnosticoText = `${diagnosticoConsulta.principal.codigoCIE10} - ${diagnosticoConsulta.principal.descripcionCIE10}`;
      // Only update if current field is empty or matches previous auto-fill pattern
      if (!formData.diagnostico || formData.diagnostico.match(/^[A-Z]\d{2}/)) {
        setFormData(prev => ({
          ...prev,
          diagnostico: diagnosticoText
        }));
      }
    }
  }, [diagnosticoConsulta]);
  const [medicamentoActual, setMedicamentoActual] = useState({
    productoId: '',
    nombre: '',
    precio: 0,
    dosis: '',
    via: 'Oral',
    frecuencia: 'Cada8Horas',
    duracionDias: '',
    instrucciones: '',
  });
  const [productos, setProductos] = useState([]);
  const [productosFiltrados, setProductosFiltrados] = useState([]);
  const [busquedaProducto, setBusquedaProducto] = useState('');
  const [loadingProductos, setLoadingProductos] = useState(false);

  // Medicamentos frecuentes del paciente
  const [medicamentosFrecuentes, setMedicamentosFrecuentes] = useState([]);
  const [loadingFrecuentes, setLoadingFrecuentes] = useState(false);

  // Estado para cálculo con IA
  const [calculoIA, setCalculoIA] = useState(null);
  const [loadingCalculoIA, setLoadingCalculoIA] = useState(false);
  const [iaDisponible, setIaDisponible] = useState(false);

  useEffect(() => {
    if (quiereAgregar) {
      cargarProductos();
      verificarIADisponible();
      if (pacienteId) {
        cargarMedicamentosFrecuentes();
      }
    }
  }, [quiereAgregar, pacienteId]);

  // Verificar si la IA está disponible
  const verificarIADisponible = async () => {
    try {
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';
      const response = await fetch(`${apiUrl}/prescripciones/ia-status`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const result = await response.json();
        setIaDisponible(result.data?.configurado || false);
      }
    } catch (error) {
      console.error('Error verificando IA:', error);
      setIaDisponible(false);
    }
  };

  // Calcular cantidad con IA
  const calcularConIA = async () => {
    if (!medicamentoActual.productoId || !medicamentoActual.dosis || !medicamentoActual.frecuencia || !medicamentoActual.duracionDias) {
      toast({
        variant: 'destructive',
        title: 'Datos incompletos',
        description: 'Complete medicamento, dosis, frecuencia y duración para calcular'
      });
      return;
    }

    setLoadingCalculoIA(true);
    setCalculoIA(null);

    try {
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';

      const producto = productos.find(p => p.id === medicamentoActual.productoId);

      const response = await fetch(`${apiUrl}/prescripciones/calcular-cantidad`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          productoId: medicamentoActual.productoId,
          medicamento: medicamentoActual.nombre,
          principioActivo: producto?.principioActivo,
          concentracion: producto?.concentracion,
          formaFarmaceutica: producto?.formaFarmaceutica,
          dosis: medicamentoActual.dosis,
          via: medicamentoActual.via,
          frecuencia: medicamentoActual.frecuencia,
          duracionDias: medicamentoActual.duracionDias,
          instrucciones: medicamentoActual.instrucciones,
          pacienteId: pacienteId,
          usarIA: true
        })
      });

      if (response.ok) {
        const result = await response.json();
        setCalculoIA(result.data);
        toast({
          title: 'Cálculo realizado',
          description: result.data?.metodo === 'ia' ? 'Análisis con IA completado' : 'Cálculo algorítmico completado'
        });
      } else {
        throw new Error('Error en el cálculo');
      }
    } catch (error) {
      console.error('Error calculando con IA:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo realizar el cálculo'
      });
    } finally {
      setLoadingCalculoIA(false);
    }
  };

  const cargarMedicamentosFrecuentes = async () => {
    if (!pacienteId) return;
    setLoadingFrecuentes(true);
    try {
      const response = await apiGet(`/consultas/frecuentes/${pacienteId}`);
      if (response.success && response.data?.medicamentos) {
        setMedicamentosFrecuentes(response.data.medicamentos);
      }
    } catch (error) {
      console.error('Error cargando medicamentos frecuentes:', error);
    } finally {
      setLoadingFrecuentes(false);
    }
  };

  // Agregar medicamento frecuente rápidamente
  const agregarMedicamentoFrecuente = (frecuente) => {
    if (!frecuente.producto) return;

    const nuevoMedicamento = {
      productoId: frecuente.producto.id,
      nombre: frecuente.producto.nombre,
      precio: frecuente.producto.precioVenta || 0,
      dosis: frecuente.ultimaDosis?.dosis || '',
      via: frecuente.ultimaDosis?.via || 'Oral',
      frecuencia: frecuente.ultimaDosis?.frecuencia || 'Cada8Horas',
      duracionDias: frecuente.ultimaDosis?.duracion || '',
      instrucciones: frecuente.ultimaDosis?.instrucciones || '',
    };

    const newMedicamentos = [...formData.medicamentos, nuevoMedicamento];
    const newData = { ...formData, medicamentos: newMedicamentos };
    setFormData(newData);
    onChange(newData, isComplete(newData));

    toast({
      title: 'Medicamento agregado',
      description: `${frecuente.producto.nombre} agregado con la dosis anterior`,
    });
  };

  // Búsqueda en servidor con debounce
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (busquedaProducto.trim().length >= 2) {
        buscarProductosEnServidor(busquedaProducto.trim());
      } else if (busquedaProducto.trim() === '') {
        // Si está vacío, cargar los primeros productos
        cargarProductosIniciales();
      }
    }, 300); // Debounce de 300ms

    return () => clearTimeout(timeoutId);
  }, [busquedaProducto]);

  const buscarProductosEnServidor = async (termino) => {
    setLoadingProductos(true);
    try {
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';

      const response = await fetch(`${apiUrl}/productos?activo=true&search=${encodeURIComponent(termino)}&limit=100`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        const result = await response.json();
        const data = result.data || [];
        setProductos(data);
        setProductosFiltrados(data);
      }
    } catch (error) {
      console.error('Error buscando productos:', error);
    } finally {
      setLoadingProductos(false);
    }
  };

  const cargarProductosIniciales = async () => {
    setLoadingProductos(true);
    try {
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';

      // Cargar solo los primeros 50 productos activos ordenados por nombre
      const response = await fetch(`${apiUrl}/productos?activo=true&limit=50`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        const result = await response.json();
        setProductos(result.data || []);
        setProductosFiltrados(result.data || []);
      }
    } catch (error) {
      console.error('Error cargando productos:', error);
      setProductos([]);
      setProductosFiltrados([]);
    } finally {
      setLoadingProductos(false);
    }
  };

  const cargarProductos = async () => {
    await cargarProductosIniciales();
  };

  const handleToggle = (agregar) => {
    setQuiereAgregar(agregar);
    if (!agregar) {
      setFormData({ diagnostico: '', medicamentos: [] });
      onChange(null, true);
    } else {
      onChange(formData, isComplete());
    }
  };

  const handleChange = (field, value) => {
    const newData = { ...formData, [field]: value };
    setFormData(newData);
    onChange(newData, isComplete(newData));
  };

  const handleProductoChange = (productoId) => {
    const producto = productos.find(p => p.id === productoId);
    if (producto) {
      setMedicamentoActual({
        ...medicamentoActual,
        productoId: producto.id,
        nombre: producto.nombre,
        precio: producto.precioVenta,
      });
    }
  };

  const agregarMedicamento = () => {
    if (!medicamentoActual.productoId || !medicamentoActual.dosis) {
      toast({ description: 'Seleccione un medicamento y complete la dosis' });
      return;
    }
    
    const newMedicamentos = [...formData.medicamentos, { ...medicamentoActual }];
    const newData = { ...formData, medicamentos: newMedicamentos };
    setFormData(newData);
    onChange(newData, isComplete(newData));
    
    // Reset medicamento actual
    setMedicamentoActual({
      productoId: '',
      nombre: '',
      precio: 0,
      dosis: '',
      via: 'Oral',
      frecuencia: 'Cada8Horas',
      duracionDias: '',
      instrucciones: '',
    });
  };

  const eliminarMedicamento = (index) => {
    const newMedicamentos = formData.medicamentos.filter((_, i) => i !== index);
    const newData = { ...formData, medicamentos: newMedicamentos };
    setFormData(newData);
    onChange(newData, isComplete(newData));
  };

  const isComplete = (data = formData) => {
    return data.medicamentos.length > 0;
  };

  if (!quiereAgregar) {
    return (
      <Card className="border-teal-200">
        <CardContent className="p-6 text-center">
          <Pill className="h-12 w-12 text-teal-400 mx-auto mb-4" />
          <p className="text-gray-600 mb-4">¿Desea prescribir medicamentos?</p>
          <Button 
            onClick={() => handleToggle(true)}
            className="bg-teal-600 hover:bg-teal-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Sí, agregar prescripción
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-teal-200">
      <CardHeader className="bg-teal-50">
        <CardTitle className="flex items-center gap-2 text-teal-900">
          <Pill className="h-5 w-5" />
          Prescripción de Medicamentos (Opcional)
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
        {!isComplete() && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 flex items-start gap-2">
            <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
            <p className="text-sm text-yellow-800">
              Agregue al menos un medicamento a la prescripción
            </p>
          </div>
        )}

        {/* Medicamentos Frecuentes del Paciente */}
        {medicamentosFrecuentes.length > 0 && (
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <History className="h-4 w-4 text-amber-600" />
              <span className="text-sm font-semibold text-amber-800">Medicamentos Frecuentes del Paciente</span>
              <Badge variant="outline" className="text-xs bg-amber-100 text-amber-700 border-amber-300">
                Click para agregar
              </Badge>
            </div>
            <div className="flex flex-wrap gap-2">
              {medicamentosFrecuentes.slice(0, 8).map((frecuente, idx) => {
                const yaAgregado = formData.medicamentos.some(
                  m => m.productoId === frecuente.producto?.id
                );
                return (
                  <button
                    key={idx}
                    onClick={() => !yaAgregado && agregarMedicamentoFrecuente(frecuente)}
                    disabled={yaAgregado}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm transition-all ${
                      yaAgregado
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-white hover:bg-amber-100 text-amber-800 border border-amber-200 hover:border-amber-400 cursor-pointer shadow-sm hover:shadow'
                    }`}
                  >
                    <Pill className="h-3 w-3" />
                    <span className="font-medium">{frecuente.producto?.nombre}</span>
                    <span className="text-xs text-gray-500">({frecuente.vecesRecetado}x)</span>
                    {yaAgregado && <Sparkles className="h-3 w-3 text-green-500" />}
                  </button>
                );
              })}
            </div>
            {medicamentosFrecuentes.length > 8 && (
              <p className="text-xs text-amber-600 mt-2">
                +{medicamentosFrecuentes.length - 8} medicamentos más en el historial
              </p>
            )}
          </div>
        )}

        <div>
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <Label htmlFor="diagnostico">Diagnóstico para la prescripción</Label>
              {diagnosticoConsulta?.principal?.codigoCIE10 && (
                <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-300">
                  Auto-llenado desde consulta
                </Badge>
              )}
            </div>
            <TemplateSelector 
              category="DIAGNOSTICO" 
              onSelect={(text) => handleChange('diagnostico', formData.diagnostico + (formData.diagnostico ? '\n' : '') + text)} 
            />
          </div>
          <Textarea
            id="diagnostico"
            value={formData.diagnostico}
            onChange={(e) => handleChange('diagnostico', e.target.value)}
            placeholder="Diagnóstico que justifica la prescripción..."
            rows={2}
          />
        </div>

        {/* Lista de medicamentos agregados */}
        {formData.medicamentos.length > 0 && (
          <div className="space-y-2">
            <Label>Medicamentos Prescritos ({formData.medicamentos.length})</Label>
            {formData.medicamentos.map((med, index) => (
              <div key={index} className={`${med.esDeKit ? 'bg-orange-50 border-orange-200' : 'bg-teal-50 border-teal-200'} border rounded-md p-3 flex items-start justify-between`}>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge className={med.esDeKit ? 'bg-orange-600' : 'bg-teal-600'}>
                      {med.esDeKit ? 'Kit' : 'Medicamento'}
                    </Badge>
                    <p className={`font-semibold ${med.esDeKit ? 'text-orange-900' : 'text-teal-900'}`}>{med.nombre}</p>
                  </div>
                  <p className="text-sm text-gray-600">
                    Dosis: {med.dosis} | Vía: {med.via} | {med.frecuencia}
                  </p>
                  {med.duracionDias && <p className="text-sm text-gray-600">Duración: {med.duracionDias} días</p>}
                  {med.duracion && !med.duracionDias && <p className="text-sm text-gray-600">Duración: {med.duracion}</p>}
                  {med.instrucciones && <p className="text-xs text-gray-500 mt-1">{med.instrucciones}</p>}
                  {med.esDeKit && <p className="text-xs text-orange-600 mt-1">Aplicado desde: {med.kitOrigen}</p>}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => eliminarMedicamento(index)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* Formulario para agregar medicamento */}
        <div className="border-t pt-4 space-y-4">
          <Label className="text-base font-semibold flex items-center gap-2">
            <Plus className="h-4 w-4 text-teal-600" />
            Agregar Medicamento
          </Label>

          {/* Card de búsqueda y selección */}
          <div className="bg-gradient-to-br from-teal-50 to-emerald-50 border border-teal-200 rounded-lg p-4 space-y-3">
            <div>
              <Label htmlFor="busquedaMed" className="text-sm font-medium text-teal-800">Buscar Medicamento</Label>
              <Input
                id="busquedaMed"
                value={busquedaProducto}
                onChange={(e) => setBusquedaProducto(e.target.value)}
                placeholder="Escriba el nombre del medicamento..."
                className="mt-1 bg-white border-teal-300 focus:border-teal-500"
              />
              {loadingProductos && (
                <p className="text-xs text-teal-600 mt-1 flex items-center gap-1">
                  <span className="animate-spin">⏳</span> Buscando...
                </p>
              )}
              {!loadingProductos && busquedaProducto.length >= 2 && (
                <p className="text-xs text-teal-700 mt-1">
                  {productosFiltrados.length} medicamento(s) encontrado(s)
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="productoMed" className="text-sm font-medium text-teal-800">Seleccionar Medicamento</Label>
              {loadingProductos ? (
                <div className="mt-2 p-3 bg-white rounded border border-teal-200 text-sm text-gray-500 text-center">
                  Cargando catálogo...
                </div>
              ) : (
                <Select
                  value={medicamentoActual.productoId}
                  onValueChange={handleProductoChange}
                >
                  <SelectTrigger className="mt-1 bg-white border-teal-300 h-auto min-h-[44px]">
                    <SelectValue placeholder="Seleccione un medicamento del catálogo" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[350px]">
                    {productosFiltrados.length === 0 ? (
                      <div className="p-4 text-sm text-gray-500 text-center">
                        No se encontraron medicamentos
                      </div>
                    ) : (
                      productosFiltrados.map((producto) => (
                        <SelectItem
                          key={producto.id}
                          value={producto.id}
                          className="py-2"
                          textValue={producto.nombre}
                        >
                          <div className="flex flex-col gap-0.5">
                            <span className="font-semibold text-gray-900">{producto.nombre}</span>
                            <span className="text-xs text-gray-600">
                              {producto.principioActivo && <span className="text-teal-600">{producto.principioActivo}</span>}
                              {producto.principioActivo && ' • '}
                              <span className="font-medium">${producto.precioVenta?.toLocaleString()}</span>
                              {producto.requiereReceta && <span className="text-amber-600 ml-1">• Receta</span>}
                            </span>
                          </div>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Medicamento seleccionado */}
            {medicamentoActual.productoId && (
              <div className="bg-white rounded-lg border border-teal-300 p-3">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-teal-900">{medicamentoActual.nombre}</span>
                  <Badge className="bg-teal-600">${medicamentoActual.precio?.toLocaleString()}</Badge>
                </div>
              </div>
            )}
          </div>

          {/* Card de dosificación */}
          <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
            <Label className="text-sm font-semibold text-gray-700">Dosificación</Label>

            <div>
              <Label htmlFor="dosisMed" className="text-xs text-gray-600">Dosis por toma</Label>
              <Input
                id="dosisMed"
                value={medicamentoActual.dosis}
                onChange={(e) => setMedicamentoActual({ ...medicamentoActual, dosis: e.target.value })}
                placeholder="Ej: 1 tableta, 500mg, 10ml..."
                className="mt-1"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label htmlFor="viaMed" className="text-xs text-gray-600">Vía</Label>
                <Select
                  value={medicamentoActual.via}
                  onValueChange={(value) => setMedicamentoActual({ ...medicamentoActual, via: value })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Oral">Oral</SelectItem>
                    <SelectItem value="Intravenosa">Intravenosa</SelectItem>
                    <SelectItem value="Intramuscular">Intramuscular</SelectItem>
                    <SelectItem value="Subcutanea">Subcutánea</SelectItem>
                    <SelectItem value="Topica">Tópica</SelectItem>
                    <SelectItem value="Oftalmica">Oftálmica</SelectItem>
                    <SelectItem value="Otica">Ótica</SelectItem>
                    <SelectItem value="Nasal">Nasal</SelectItem>
                    <SelectItem value="Inhalatoria">Inhalatoria</SelectItem>
                    <SelectItem value="Rectal">Rectal</SelectItem>
                    <SelectItem value="Vaginal">Vaginal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="frecuenciaMed" className="text-xs text-gray-600">Frecuencia</Label>
                <Select
                  value={medicamentoActual.frecuencia}
                  onValueChange={(value) => setMedicamentoActual({ ...medicamentoActual, frecuencia: value })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Unica">Dosis única</SelectItem>
                    <SelectItem value="Cada4Horas">Cada 4 horas (6/día)</SelectItem>
                    <SelectItem value="Cada6Horas">Cada 6 horas (4/día)</SelectItem>
                    <SelectItem value="Cada8Horas">Cada 8 horas (3/día)</SelectItem>
                    <SelectItem value="Cada12Horas">Cada 12 horas (2/día)</SelectItem>
                    <SelectItem value="Cada24Horas">Cada 24 horas (1/día)</SelectItem>
                    <SelectItem value="PRN">PRN (según necesidad)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="duracionMed" className="text-xs text-gray-600">Duración (días)</Label>
                <Input
                  id="duracionMed"
                  type="number"
                  min="1"
                  value={medicamentoActual.duracionDias}
                  onChange={(e) => setMedicamentoActual({ ...medicamentoActual, duracionDias: e.target.value })}
                  placeholder="7"
                  className="mt-1"
                />
              </div>
            </div>

            {/* Cálculo de cantidad - Básico + IA */}
            {medicamentoActual.dosis && medicamentoActual.frecuencia && medicamentoActual.duracionDias && (
              <div className="space-y-3 mt-3">
                {/* Cálculo básico */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-blue-800 flex items-center gap-2">
                      <Calculator className="h-4 w-4" />
                      <strong>Cálculo Básico:</strong>
                    </span>
                    <span className="text-lg font-bold text-blue-900">
                      {(() => {
                        const frecuenciasPorDia = {
                          'Unica': 1,
                          'Cada4Horas': 6,
                          'Cada6Horas': 4,
                          'Cada8Horas': 3,
                          'Cada12Horas': 2,
                          'Cada24Horas': 1,
                          'PRN': 3,
                        };
                        const tomasPorDia = frecuenciasPorDia[medicamentoActual.frecuencia] || 1;
                        const dias = parseInt(medicamentoActual.duracionDias) || 0;
                        // Extraer valor numérico de la dosis (ej: "2 tabletas" → 2, "10ml" → 10)
                        const dosisMatch = medicamentoActual.dosis.match(/^(\d+(?:\.\d+)?)/);
                        const cantidadPorToma = dosisMatch ? parseFloat(dosisMatch[1]) : 1;
                        const totalTomas = tomasPorDia * dias;
                        const total = Math.ceil(cantidadPorToma * totalTomas);
                        // Detectar unidad de la dosis
                        const unidadMatch = medicamentoActual.dosis.match(/\d+(?:\.\d+)?\s*(.+)/);
                        const unidad = unidadMatch ? unidadMatch[1].trim() : 'unidades';
                        return `${total} ${unidad}`;
                      })()}
                    </span>
                  </div>
                  <p className="text-xs text-blue-600 mt-1">
                    {(() => {
                      const frecuenciasPorDia = {
                        'Unica': 1,
                        'Cada4Horas': 6,
                        'Cada6Horas': 4,
                        'Cada8Horas': 3,
                        'Cada12Horas': 2,
                        'Cada24Horas': 1,
                        'PRN': 3,
                      };
                      const tomasPorDia = frecuenciasPorDia[medicamentoActual.frecuencia] || 1;
                      // Extraer valor numérico de la dosis
                      const dosisMatch = medicamentoActual.dosis.match(/^(\d+(?:\.\d+)?)/);
                      const cantidadPorToma = dosisMatch ? parseFloat(dosisMatch[1]) : 1;
                      return `${cantidadPorToma} × ${tomasPorDia} toma(s)/día × ${medicamentoActual.duracionDias} días`;
                    })()}
                  </p>
                </div>

                {/* Botón de cálculo con IA */}
                <Button
                  type="button"
                  variant="outline"
                  onClick={calcularConIA}
                  disabled={loadingCalculoIA}
                  className="w-full border-purple-300 text-purple-700 hover:bg-purple-50 h-10"
                >
                  {loadingCalculoIA ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Analizando con IA...
                    </>
                  ) : (
                    <>
                      <Brain className="h-4 w-4 mr-2" />
                      Calcular con IA {!iaDisponible && '(Algorítmico)'}
                    </>
                  )}
                </Button>

                {/* Resultado del cálculo con IA */}
                {calculoIA && (
                  <div className="bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-200 rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-purple-800 flex items-center gap-2">
                        <Sparkles className="h-4 w-4" />
                        Análisis {calculoIA.metodo === 'ia' ? 'con IA' : 'Algorítmico'}
                      </span>
                      {calculoIA.metodo === 'ia' && (
                        <Badge className="bg-purple-600 text-xs">GPT</Badge>
                      )}
                    </div>

                    {/* Cantidad total y presentación */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-white rounded-lg p-3 border border-purple-200">
                        <p className="text-xs text-gray-500">Cantidad Total</p>
                        <p className="text-xl font-bold text-purple-900">
                          {calculoIA.cantidadTotal} {calculoIA.unidadCantidad}
                        </p>
                      </div>
                      <div className="bg-white rounded-lg p-3 border border-purple-200">
                        <p className="text-xs text-gray-500">Envases Sugeridos</p>
                        <p className="text-xl font-bold text-purple-900 flex items-center gap-1">
                          <Package className="h-4 w-4" />
                          {calculoIA.cantidadEnvases || 1}
                        </p>
                        {calculoIA.presentacionSugerida && (
                          <p className="text-xs text-gray-600">{calculoIA.presentacionSugerida}</p>
                        )}
                      </div>
                    </div>

                    {/* Detalle del cálculo */}
                    {calculoIA.calculoDetallado && (
                      <div className="bg-white/50 rounded p-2 text-xs text-gray-600">
                        <strong>Detalle:</strong> {calculoIA.calculoDetallado}
                      </div>
                    )}

                    {/* Validación de dosis */}
                    {calculoIA.dosisValidacion && (
                      <div className={`rounded-lg p-3 flex items-start gap-2 ${
                        calculoIA.dosisValidacion.esCorrecta
                          ? 'bg-green-50 border border-green-200'
                          : 'bg-red-50 border border-red-200'
                      }`}>
                        {calculoIA.dosisValidacion.esCorrecta ? (
                          <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                        ) : (
                          <AlertTriangle className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
                        )}
                        <div>
                          <p className={`text-sm font-medium ${
                            calculoIA.dosisValidacion.esCorrecta ? 'text-green-800' : 'text-red-800'
                          }`}>
                            {calculoIA.dosisValidacion.esCorrecta ? 'Dosis dentro del rango normal' : 'Alerta de dosificación'}
                          </p>
                          {calculoIA.dosisValidacion.mensaje && (
                            <p className="text-xs text-gray-600 mt-0.5">{calculoIA.dosisValidacion.mensaje}</p>
                          )}
                          {calculoIA.dosisValidacion.rangoNormal && (
                            <p className="text-xs text-gray-500">Rango normal: {calculoIA.dosisValidacion.rangoNormal}</p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Alertas */}
                    {calculoIA.alertas && calculoIA.alertas.length > 0 && (
                      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                        <p className="text-sm font-medium text-amber-800 flex items-center gap-1 mb-2">
                          <AlertCircle className="h-4 w-4" />
                          Alertas
                        </p>
                        <ul className="text-xs text-amber-700 space-y-1">
                          {calculoIA.alertas.map((alerta, idx) => (
                            <li key={idx} className="flex items-start gap-1">
                              <span>•</span> {alerta}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Recomendaciones */}
                    {calculoIA.recomendaciones && calculoIA.recomendaciones.length > 0 && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <p className="text-sm font-medium text-blue-800 flex items-center gap-1 mb-2">
                          <Sparkles className="h-4 w-4" />
                          Recomendaciones
                        </p>
                        <ul className="text-xs text-blue-700 space-y-1">
                          {calculoIA.recomendaciones.map((rec, idx) => (
                            <li key={idx} className="flex items-start gap-1">
                              <span>✓</span> {rec}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            <div>
              <Label htmlFor="instruccionesMed" className="text-xs text-gray-600">Instrucciones adicionales</Label>
              <Input
                id="instruccionesMed"
                value={medicamentoActual.instrucciones}
                onChange={(e) => setMedicamentoActual({ ...medicamentoActual, instrucciones: e.target.value })}
                placeholder="Ej: Tomar con alimentos, en ayunas, antes de dormir..."
                className="mt-1"
              />
            </div>
          </div>

          <Button
            onClick={agregarMedicamento}
            className="w-full bg-teal-600 hover:bg-teal-700 h-11 text-base"
            disabled={!medicamentoActual.productoId || !medicamentoActual.dosis}
          >
            <Plus className="h-5 w-5 mr-2" />
            Agregar a la prescripción
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
