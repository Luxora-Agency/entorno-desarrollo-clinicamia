'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Pill, Plus, X, AlertCircle, Trash2, History, Sparkles, Calculator, Package, Pencil } from 'lucide-react';
import TemplateSelector from '../templates/TemplateSelector';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { apiGet } from '@/services/api';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Check, ChevronsUpDown } from 'lucide-react';

// Función para normalizar texto: quitar tildes y convertir a minúsculas
const normalizeText = (text) => {
  if (!text) return '';
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
};

// Función para calcular cantidad total a entregar según forma farmacéutica y vía
const calcularCantidadTotal = (dosis, frecuencia, duracionDias, formaFarmaceutica, concentracion, viaAdministracion) => {
  const frecuenciasPorDia = {
    'Unica': 1,
    'Cada4Horas': 6,
    'Cada6Horas': 4,
    'Cada8Horas': 3,
    'Cada12Horas': 2,
    'Cada24Horas': 1,
    'PRN': 3, // Estimado promedio
  };

  const tomasPorDia = frecuenciasPorDia[frecuencia] || 1;
  const dias = parseInt(duracionDias) || 0;
  const totalTomas = frecuencia === 'Unica' ? 1 : tomasPorDia * dias;

  // Extraer valor numérico y unidad de la dosis
  const dosisMatch = dosis.match(/^(\d+(?:[.,]\d+)?)\s*(.*)$/);
  const cantidadPorToma = dosisMatch ? parseFloat(dosisMatch[1].replace(',', '.')) : 1;
  const unidadDosis = dosisMatch && dosisMatch[2] ? dosisMatch[2].trim().toLowerCase() : '';

  // Normalizar forma farmacéutica y vía
  const formaNorm = normalizeText(formaFarmaceutica || '');
  const viaNorm = normalizeText(viaAdministracion || '');

  // Determinar tipo de medicamento y calcular según forma farmacéutica
  let cantidadTotal = 0;
  let unidadEntrega = '';
  let descripcionCalculo = '';
  let tipoMedicamento = '';
  let colorTipo = 'gray';

  // INYECTABLES: Detectar por vía o forma
  if (viaNorm.includes('intravenosa') || viaNorm.includes('intramuscular') ||
      viaNorm.includes('subcutanea') || viaNorm.includes('iv') || viaNorm.includes('im') ||
      formaNorm.includes('ampolla') || formaNorm.includes('vial') ||
      formaNorm.includes('inyectable') || formaNorm.includes('inyeccion') ||
      unidadDosis.includes('ampolla') || unidadDosis.includes('vial')) {
    cantidadTotal = Math.ceil(cantidadPorToma * totalTomas);
    unidadEntrega = cantidadTotal === 1 ? 'ampolla' : 'ampollas';
    tipoMedicamento = 'Inyectable';
    colorTipo = 'red';
    descripcionCalculo = `${cantidadPorToma} ampolla × ${totalTomas} aplicaciones`;
    if (concentracion) {
      descripcionCalculo += ` (${concentracion})`;
    }
  }
  // SOLUCIÓN ORAL: Jarabe, Suspensión, Solución oral
  else if ((formaNorm.includes('jarabe') || formaNorm.includes('suspension') ||
           formaNorm.includes('solucion') || formaNorm.includes('elixir') ||
           formaNorm.includes('liquido') || formaNorm.includes('oral') ||
           unidadDosis.includes('ml') || unidadDosis.includes('cc') ||
           unidadDosis.includes('cucharada')) &&
           (viaNorm.includes('oral') || viaNorm === '')) {
    cantidadTotal = Math.ceil(cantidadPorToma * totalTomas);
    unidadEntrega = 'ml';
    tipoMedicamento = 'Solución Oral';
    colorTipo = 'blue';
    // Estimar frascos (frasco típico: 120ml)
    const frascos = Math.ceil(cantidadTotal / 120);
    descripcionCalculo = `${cantidadPorToma} ml × ${totalTomas} tomas = ${cantidadTotal} ml`;
    if (frascos >= 1) {
      descripcionCalculo += ` (${frascos} frasco${frascos > 1 ? 's' : ''} de 120ml)`;
    }
  }
  // TABLETAS/CÁPSULAS: Sólidos orales
  else if (formaNorm.includes('tableta') || formaNorm.includes('capsula') ||
      formaNorm.includes('comprimido') || formaNorm.includes('gragea') ||
      formaNorm.includes('pastilla') || formaNorm.includes('tab') ||
      unidadDosis.includes('tableta') || unidadDosis.includes('capsula') ||
      unidadDosis.includes('comprimido') || unidadDosis.includes('tab') ||
      (viaNorm.includes('oral') && !formaNorm)) {
    cantidadTotal = Math.ceil(cantidadPorToma * totalTomas);

    if (formaNorm.includes('capsula') || unidadDosis.includes('capsula')) {
      unidadEntrega = cantidadTotal === 1 ? 'cápsula' : 'cápsulas';
      tipoMedicamento = 'Cápsulas';
    } else {
      unidadEntrega = cantidadTotal === 1 ? 'tableta' : 'tabletas';
      tipoMedicamento = 'Tabletas';
    }
    colorTipo = 'green';
    descripcionCalculo = `${cantidadPorToma} ${unidadEntrega} × ${totalTomas} tomas`;
    if (concentracion) {
      descripcionCalculo += ` (${concentracion})`;
    }
  }
  // GOTAS: Oftálmicas, óticas, nasales, orales
  else if (formaNorm.includes('gota') || unidadDosis.includes('gota')) {
    cantidadTotal = Math.ceil(cantidadPorToma * totalTomas);
    unidadEntrega = cantidadTotal === 1 ? 'gota' : 'gotas';

    if (viaNorm.includes('oftalm')) {
      tipoMedicamento = 'Gotas Oftálmicas';
    } else if (viaNorm.includes('otica')) {
      tipoMedicamento = 'Gotas Óticas';
    } else if (viaNorm.includes('nasal')) {
      tipoMedicamento = 'Gotas Nasales';
    } else {
      tipoMedicamento = 'Gotas';
    }
    colorTipo = 'purple';
    // Aproximado: 1 frasco = ~200 gotas (20 gotas/ml × 10ml)
    const frascos = Math.ceil(cantidadTotal / 200);
    descripcionCalculo = `${cantidadTotal} gotas totales (${frascos} frasco${frascos > 1 ? 's' : ''})`;
  }
  // TÓPICOS: Crema, Ungüento, Gel, Pomada
  else if (formaNorm.includes('crema') || formaNorm.includes('unguento') ||
           formaNorm.includes('gel') || formaNorm.includes('pomada') ||
           formaNorm.includes('locion') || viaNorm.includes('topica') ||
           unidadDosis.includes('g') || unidadDosis.includes('aplicacion')) {
    // Para tópicos, estimar cantidad en gramos
    const gramosPorAplicacion = cantidadPorToma || 2; // 2g por aplicación por defecto
    cantidadTotal = Math.ceil(gramosPorAplicacion * totalTomas);
    unidadEntrega = 'gramos';
    tipoMedicamento = 'Tópico';
    colorTipo = 'amber';
    // Tubo típico: 30-40g
    const tubos = Math.ceil(cantidadTotal / 30);
    descripcionCalculo = `${gramosPorAplicacion}g × ${totalTomas} aplicaciones (${tubos} tubo${tubos > 1 ? 's' : ''} de 30g)`;
  }
  // SUPOSITORIOS/ÓVULOS
  else if (formaNorm.includes('supositorio') || formaNorm.includes('ovulo') ||
           viaNorm.includes('rectal') || viaNorm.includes('vaginal')) {
    cantidadTotal = Math.ceil(cantidadPorToma * totalTomas);
    if (formaNorm.includes('ovulo') || viaNorm.includes('vaginal')) {
      unidadEntrega = cantidadTotal === 1 ? 'óvulo' : 'óvulos';
      tipoMedicamento = 'Óvulos Vaginales';
    } else {
      unidadEntrega = cantidadTotal === 1 ? 'supositorio' : 'supositorios';
      tipoMedicamento = 'Supositorios';
    }
    colorTipo = 'pink';
    descripcionCalculo = `${cantidadPorToma} ${unidadEntrega} × ${totalTomas} aplicaciones`;
  }
  // INHALADORES
  else if (formaNorm.includes('inhalador') || formaNorm.includes('aerosol') ||
           formaNorm.includes('spray') || viaNorm.includes('inhalat') ||
           unidadDosis.includes('puff') || unidadDosis.includes('inhalacion')) {
    cantidadTotal = Math.ceil(cantidadPorToma * totalTomas);
    unidadEntrega = cantidadTotal === 1 ? 'inhalación' : 'inhalaciones';
    tipoMedicamento = 'Inhalador';
    colorTipo = 'cyan';
    // Inhalador típico: 200 dosis
    const inhaladores = Math.ceil(cantidadTotal / 200);
    descripcionCalculo = `${cantidadTotal} inhalaciones (${inhaladores} inhalador${inhaladores > 1 ? 'es' : ''})`;
  }
  // PARCHES TRANSDÉRMICOS
  else if (formaNorm.includes('parche')) {
    cantidadTotal = Math.ceil(cantidadPorToma * totalTomas);
    unidadEntrega = cantidadTotal === 1 ? 'parche' : 'parches';
    tipoMedicamento = 'Parches';
    colorTipo = 'indigo';
    descripcionCalculo = `${cantidadPorToma} parche × ${totalTomas} aplicaciones`;
  }
  // SOBRES/POLVO para reconstituir
  else if (formaNorm.includes('sobre') || formaNorm.includes('polvo') ||
           formaNorm.includes('granulado') || unidadDosis.includes('sobre')) {
    cantidadTotal = Math.ceil(cantidadPorToma * totalTomas);
    unidadEntrega = cantidadTotal === 1 ? 'sobre' : 'sobres';
    tipoMedicamento = 'Sobres/Polvo';
    colorTipo = 'orange';
    descripcionCalculo = `${cantidadPorToma} sobre × ${totalTomas} tomas`;
  }
  // DEFAULT: Usar unidad de la dosis o "unidades"
  else {
    cantidadTotal = Math.ceil(cantidadPorToma * totalTomas);
    tipoMedicamento = 'Medicamento';
    colorTipo = 'gray';
    // Intentar detectar unidad de la dosis ingresada
    if (unidadDosis) {
      unidadEntrega = unidadDosis;
    } else {
      unidadEntrega = cantidadTotal === 1 ? 'unidad' : 'unidades';
    }
    descripcionCalculo = `${cantidadPorToma} × ${totalTomas} tomas`;
  }

  return {
    cantidadTotal,
    unidadEntrega,
    descripcionCalculo,
    totalTomas,
    tomasPorDia,
    dias,
    tipoMedicamento,
    colorTipo
  };
};

export default function FormularioPrescripcionesConsulta({ onChange, data, diagnosticoConsulta, pacienteId, planManejoData }) {
  const { toast } = useToast();
  const [quiereAgregar, setQuiereAgregar] = useState(data !== null && data !== undefined);
  const [editandoIndex, setEditandoIndex] = useState(null); // Índice del medicamento en edición
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
    // Información adicional del producto
    concentracion: '',
    formaFarmaceutica: '',
    presentacion: '',
    presentaciones: [],
  });
  const [productos, setProductos] = useState([]);
  const [productosFiltrados, setProductosFiltrados] = useState([]);
  const [busquedaProducto, setBusquedaProducto] = useState('');
  const [loadingProductos, setLoadingProductos] = useState(false);

  // Estado para Combobox de medicamentos
  const [comboboxOpen, setComboboxOpen] = useState(false);
  const [comboboxSearch, setComboboxSearch] = useState('');

  // Filtrar productos en Combobox (insensible a mayúsculas y tildes)
  const productosCombobox = comboboxSearch.trim().length >= 1
    ? productosFiltrados.filter((producto) => {
        const searchNorm = normalizeText(comboboxSearch);
        const nombreNorm = normalizeText(producto.nombre);
        const principioNorm = normalizeText(producto.principioActivo || '');
        return nombreNorm.includes(searchNorm) || principioNorm.includes(searchNorm);
      })
    : productosFiltrados;

  // Buscar en servidor cuando cambia busquedaProducto (principio activo) con debounce
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (busquedaProducto.trim().length >= 2) {
        buscarProductosEnServidor(busquedaProducto.trim());
      } else if (busquedaProducto.trim() === '') {
        cargarProductosIniciales();
      }
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [busquedaProducto]);

  // Medicamentos frecuentes del paciente
  const [medicamentosFrecuentes, setMedicamentosFrecuentes] = useState([]);
  const [loadingFrecuentes, setLoadingFrecuentes] = useState(false);

  useEffect(() => {
    if (quiereAgregar) {
      cargarProductos();
      if (pacienteId) {
        cargarMedicamentosFrecuentes();
      }
    }
  }, [quiereAgregar, pacienteId]);

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

  // Agregar medicamento frecuente directamente a la lista (editable)
  const agregarMedicamentoFrecuente = (frecuente) => {
    if (!frecuente.producto) return;

    const nuevoMedicamento = {
      productoId: frecuente.producto.id,
      nombre: frecuente.producto.nombre,
      precio: frecuente.producto.precioVenta || 0,
      dosis: frecuente.ultimaDosis?.dosis || '',
      via: frecuente.ultimaDosis?.via || frecuente.producto.viaAdministracion || 'Oral',
      frecuencia: frecuente.ultimaDosis?.frecuencia || 'Cada8Horas',
      duracionDias: frecuente.ultimaDosis?.duracion ? String(frecuente.ultimaDosis.duracion).replace(/\D/g, '') : '',
      instrucciones: frecuente.ultimaDosis?.instrucciones || '',
      // Información adicional del producto
      concentracion: frecuente.producto.concentracion || '',
      formaFarmaceutica: frecuente.producto.formaFarmaceutica || '',
      presentacion: frecuente.producto.presentacion || '',
      esDeFrecuente: true, // Marcar que viene de frecuentes para hacerlo editable
    };

    const newMedicamentos = [...formData.medicamentos, nuevoMedicamento];
    const newData = { ...formData, medicamentos: newMedicamentos };
    setFormData(newData);
    onChange(newData, isComplete(newData));

    toast({
      title: 'Medicamento agregado',
      description: `${frecuente.producto.nombre} - Puede editar dosis, frecuencia y duración`,
    });
  };

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
        // Información adicional del producto
        concentracion: producto.concentracion || '',
        formaFarmaceutica: producto.formaFarmaceutica || '',
        presentacion: producto.presentacion || '',
        presentaciones: producto.presentaciones || [],
        // Si el producto tiene vía de administración, usarla
        via: producto.viaAdministracion || medicamentoActual.via,
      });
      setComboboxOpen(false);
      setComboboxSearch('');
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
      concentracion: '',
      formaFarmaceutica: '',
      presentacion: '',
      presentaciones: [],
    });
  };

  const eliminarMedicamento = (index) => {
    const newMedicamentos = formData.medicamentos.filter((_, i) => i !== index);
    const newData = { ...formData, medicamentos: newMedicamentos };
    setFormData(newData);
    onChange(newData, isComplete(newData));
  };

  // Función para actualizar un campo específico de un medicamento
  const actualizarMedicamento = (index, field, value) => {
    const newMedicamentos = [...formData.medicamentos];
    newMedicamentos[index] = { ...newMedicamentos[index], [field]: value };
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
                Click para agregar con dosis anterior
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
                        ? 'bg-green-100 text-green-700 border border-green-300 cursor-not-allowed'
                        : 'bg-white hover:bg-amber-100 text-amber-800 border border-amber-200 hover:border-amber-400 cursor-pointer shadow-sm hover:shadow'
                    }`}
                  >
                    <Pill className="h-3 w-3" />
                    <span className="font-medium">{frecuente.producto?.nombre}</span>
                    <span className="text-xs text-gray-500">({frecuente.vecesRecetado}x)</span>
                    {yaAgregado && <Sparkles className="h-3 w-3 text-green-600" />}
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
            {formData.medicamentos.map((med, index) => {
              // Determinar estilo según origen del medicamento
              const esEditable = med.esDeKit || med.esDeFrecuente;
              const estaEditando = editandoIndex === index;
              const colorClass = med.esDeKit
                ? 'bg-orange-50 border-orange-200'
                : med.esDeFrecuente
                ? 'bg-amber-50 border-amber-200'
                : 'bg-teal-50 border-teal-200';
              const badgeClass = med.esDeKit
                ? 'bg-orange-600'
                : med.esDeFrecuente
                ? 'bg-amber-600'
                : 'bg-teal-600';
              const textClass = med.esDeKit
                ? 'text-orange-900'
                : med.esDeFrecuente
                ? 'text-amber-900'
                : 'text-teal-900';
              const labelClass = med.esDeKit
                ? 'text-orange-700'
                : med.esDeFrecuente
                ? 'text-amber-700'
                : 'text-teal-700';
              const inputBorderClass = med.esDeKit
                ? 'border-orange-300 focus:border-orange-500'
                : 'border-amber-300 focus:border-amber-500';

              // Formatear frecuencia para mostrar
              const frecuenciaTexto = {
                'Unica': 'Dosis única',
                'Cada4Horas': 'c/4h',
                'Cada6Horas': 'c/6h',
                'Cada8Horas': 'c/8h',
                'Cada12Horas': 'c/12h',
                'Cada24Horas': 'c/24h',
                'PRN': 'PRN'
              }[med.frecuencia] || med.frecuencia;

              // Calcular cantidad a entregar para este medicamento
              const calculoMed = calcularCantidadTotal(
                med.dosis || '1',
                med.frecuencia || 'Cada8Horas',
                med.duracionDias || med.duracion?.replace(/\D/g, '') || '1',
                med.formaFarmaceutica || '',
                med.concentracion || '',
                med.via || 'Oral'
              );

              return (
                <div key={index} className={`${colorClass} border rounded-md p-2 flex items-center justify-between gap-2`}>
                  <div className="flex-1 min-w-0">
                    {/* Vista condensada (siempre visible) */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge className={`${badgeClass} text-xs`}>
                        {med.esDeKit ? 'Kit' : med.esDeFrecuente ? 'Frecuente' : 'Rx'}
                      </Badge>
                      <span className={`font-medium text-sm ${textClass} truncate`}>{med.nombre}</span>
                      {med.concentracion && (
                        <span className="text-xs px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded">
                          {med.concentracion}
                        </span>
                      )}
                      {med.formaFarmaceutica && (
                        <span className="text-xs px-1.5 py-0.5 bg-purple-100 text-purple-700 rounded">
                          {med.formaFarmaceutica}
                        </span>
                      )}
                    </div>
                    {/* Detalles de dosificación y cantidad */}
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className="text-xs text-gray-600">
                        {med.dosis} | {med.via} | {frecuenciaTexto} | {med.duracionDias || med.duracion || '-'} días
                      </span>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${
                        calculoMed.colorTipo === 'green' ? 'bg-green-100 text-green-800 border-green-300' :
                        calculoMed.colorTipo === 'blue' ? 'bg-blue-100 text-blue-800 border-blue-300' :
                        calculoMed.colorTipo === 'red' ? 'bg-red-100 text-red-800 border-red-300' :
                        calculoMed.colorTipo === 'purple' ? 'bg-purple-100 text-purple-800 border-purple-300' :
                        calculoMed.colorTipo === 'amber' ? 'bg-amber-100 text-amber-800 border-amber-300' :
                        'bg-gray-100 text-gray-800 border-gray-300'
                      }`}>
                        {calculoMed.tipoMedicamento}: {calculoMed.cantidadTotal} {calculoMed.unidadEntrega}
                      </span>
                    </div>

                    {/* Campos editables (solo si está editando) */}
                    {esEditable && estaEditando && (
                      <div className="mt-3 space-y-2 border-t pt-2">
                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <Label className={`text-xs ${labelClass}`}>Dosis</Label>
                            <Input
                              value={med.dosis || ''}
                              onChange={(e) => actualizarMedicamento(index, 'dosis', e.target.value)}
                              placeholder="Ej: 1 tableta..."
                              className={`h-8 text-sm bg-white ${inputBorderClass}`}
                            />
                          </div>
                          <div>
                            <Label className={`text-xs ${labelClass}`}>Frecuencia</Label>
                            <Select
                              value={med.frecuencia || 'Cada8Horas'}
                              onValueChange={(value) => actualizarMedicamento(index, 'frecuencia', value)}
                            >
                              <SelectTrigger className={`h-8 text-sm bg-white ${inputBorderClass}`}>
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
                            <Label className={`text-xs ${labelClass}`}>Duración (días)</Label>
                            <Input
                              value={med.duracionDias || med.duracion || ''}
                              onChange={(e) => actualizarMedicamento(index, 'duracionDias', e.target.value)}
                              placeholder="Ej: 5"
                              className={`h-8 text-sm bg-white ${inputBorderClass}`}
                            />
                          </div>
                        </div>
                        {med.instrucciones && <p className="text-xs text-gray-500">{med.instrucciones}</p>}
                        {med.esDeKit && <p className="text-xs text-orange-600">Kit: {med.kitOrigen}</p>}
                        {med.esDeFrecuente && <p className="text-xs text-amber-600 flex items-center gap-1"><History className="h-3 w-3" /> Del historial</p>}
                      </div>
                    )}
                  </div>

                  {/* Botones de acción */}
                  <div className="flex items-center gap-1">
                    {esEditable && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditandoIndex(estaEditando ? null : index)}
                        className={`h-8 w-8 p-0 ${estaEditando ? 'text-blue-600 bg-blue-100' : 'text-gray-500 hover:text-blue-600'}`}
                        title={estaEditando ? 'Cerrar edición' : 'Editar dosis'}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => eliminarMedicamento(index)}
                      className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                      title="Eliminar"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
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
            {/* Buscador por principio activo */}
            <div>
              <Label htmlFor="busquedaMed" className="text-sm font-medium text-teal-800">Buscar por Principio Activo</Label>
              <Input
                id="busquedaMed"
                value={busquedaProducto}
                onChange={(e) => setBusquedaProducto(e.target.value)}
                placeholder="Escriba el principio activo (ej: Acetaminofén, Ibuprofeno...)"
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

            {/* Selector de medicamento */}
            <div>
              <Label htmlFor="productoMed" className="text-sm font-medium text-teal-800">Seleccionar Medicamento</Label>
              {loadingProductos ? (
                <div className="mt-2 p-3 bg-white rounded border border-teal-200 text-sm text-gray-500 text-center flex items-center justify-center gap-2">
                  <span className="animate-spin">⏳</span> Cargando...
                </div>
              ) : (
                <Popover open={comboboxOpen} onOpenChange={setComboboxOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={comboboxOpen}
                      className="mt-1 w-full justify-between bg-white border-teal-300 h-auto min-h-[44px] hover:bg-gray-50 font-normal"
                    >
                      {medicamentoActual.productoId ? (
                        <span className="truncate">{medicamentoActual.nombre}</span>
                      ) : (
                        <span className="text-muted-foreground">Escriba para buscar medicamento...</span>
                      )}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                    <Command shouldFilter={false}>
                      <CommandInput
                        placeholder="Buscar por nombre o principio activo..."
                        value={comboboxSearch}
                        onValueChange={setComboboxSearch}
                      />
                      <CommandList className="max-h-[300px]">
                        <CommandEmpty>
                          {comboboxSearch.length > 0 ? 'No se encontraron medicamentos' : 'Escriba para buscar...'}
                        </CommandEmpty>
                        <CommandGroup>
                          {productosCombobox.slice(0, 50).map((producto) => (
                            <CommandItem
                              key={producto.id}
                              value={producto.id}
                              onSelect={() => handleProductoChange(producto.id)}
                              className="py-2 cursor-pointer"
                            >
                              <Check
                                className={`mr-2 h-4 w-4 ${medicamentoActual.productoId === producto.id ? 'opacity-100' : 'opacity-0'}`}
                              />
                              <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                                <span className="font-semibold text-gray-900 truncate">{producto.nombre}</span>
                                <span className="text-xs text-gray-600">
                                  {producto.principioActivo && <span className="text-teal-600">{producto.principioActivo}</span>}
                                  {producto.principioActivo && ' • '}
                                  <span className="font-medium">${producto.precioVenta?.toLocaleString()}</span>
                                  {producto.requiereReceta && <span className="text-amber-600 ml-1">• Receta</span>}
                                </span>
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              )}
            </div>

            {/* Medicamento seleccionado */}
            {medicamentoActual.productoId && (
              <div className="bg-white rounded-lg border border-teal-300 p-3 space-y-2">
                {/* Nombre y precio */}
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-teal-900">{medicamentoActual.nombre}</span>
                  <Badge className="bg-teal-600">${medicamentoActual.precio?.toLocaleString()}</Badge>
                </div>

                {/* Concentración y forma farmacéutica */}
                {(medicamentoActual.concentracion || medicamentoActual.formaFarmaceutica || medicamentoActual.presentacion) && (
                  <div className="flex flex-wrap gap-1.5 text-xs">
                    {medicamentoActual.concentracion && (
                      <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full">
                        {medicamentoActual.concentracion}
                      </span>
                    )}
                    {medicamentoActual.formaFarmaceutica && (
                      <span className="px-2 py-0.5 bg-purple-50 text-purple-700 rounded-full">
                        {medicamentoActual.formaFarmaceutica}
                      </span>
                    )}
                    {medicamentoActual.presentacion && (
                      <span className="px-2 py-0.5 bg-amber-50 text-amber-700 rounded-full">
                        {medicamentoActual.presentacion}
                      </span>
                    )}
                  </div>
                )}

                {/* Presentaciones disponibles */}
                {medicamentoActual.presentaciones && medicamentoActual.presentaciones.length > 0 && (
                  <div className="pt-1 border-t border-teal-100">
                    <p className="text-xs text-gray-500 mb-1">Presentaciones disponibles:</p>
                    <div className="flex flex-wrap gap-1">
                      {medicamentoActual.presentaciones.map((pres, idx) => (
                        <span
                          key={idx}
                          className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded"
                        >
                          {pres.nombre}{pres.concentracion && ` - ${pres.concentracion}`}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
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

            {/* Cantidad Total a Entregar - Cálculo Inteligente */}
            {medicamentoActual.dosis && medicamentoActual.frecuencia && medicamentoActual.duracionDias && (
              <div className="space-y-3 mt-3">
                {/* Cálculo inteligente según forma farmacéutica y vía */}
                {(() => {
                  const calculo = calcularCantidadTotal(
                    medicamentoActual.dosis,
                    medicamentoActual.frecuencia,
                    medicamentoActual.duracionDias,
                    medicamentoActual.formaFarmaceutica,
                    medicamentoActual.concentracion,
                    medicamentoActual.via
                  );

                  // Colores dinámicos según tipo
                  const colorClasses = {
                    red: 'from-red-50 to-rose-50 border-red-300',
                    blue: 'from-blue-50 to-sky-50 border-blue-300',
                    green: 'from-green-50 to-emerald-50 border-green-300',
                    purple: 'from-purple-50 to-violet-50 border-purple-300',
                    amber: 'from-amber-50 to-yellow-50 border-amber-300',
                    pink: 'from-pink-50 to-rose-50 border-pink-300',
                    cyan: 'from-cyan-50 to-teal-50 border-cyan-300',
                    indigo: 'from-indigo-50 to-blue-50 border-indigo-300',
                    orange: 'from-orange-50 to-amber-50 border-orange-300',
                    gray: 'from-gray-50 to-slate-50 border-gray-300',
                  };

                  const badgeColors = {
                    red: 'bg-red-100 text-red-800 border-red-300',
                    blue: 'bg-blue-100 text-blue-800 border-blue-300',
                    green: 'bg-green-100 text-green-800 border-green-300',
                    purple: 'bg-purple-100 text-purple-800 border-purple-300',
                    amber: 'bg-amber-100 text-amber-800 border-amber-300',
                    pink: 'bg-pink-100 text-pink-800 border-pink-300',
                    cyan: 'bg-cyan-100 text-cyan-800 border-cyan-300',
                    indigo: 'bg-indigo-100 text-indigo-800 border-indigo-300',
                    orange: 'bg-orange-100 text-orange-800 border-orange-300',
                    gray: 'bg-gray-100 text-gray-800 border-gray-300',
                  };

                  const bgClass = colorClasses[calculo.colorTipo] || colorClasses.gray;
                  const badgeClass = badgeColors[calculo.colorTipo] || badgeColors.gray;

                  return (
                    <div className={`bg-gradient-to-r ${bgClass} border rounded-lg p-4`}>
                      {/* Tipo de medicamento */}
                      <div className="flex items-center justify-between mb-3">
                        <span className={`text-xs font-semibold px-2 py-1 rounded-full border ${badgeClass}`}>
                          {calculo.tipoMedicamento}
                        </span>
                        <span className="text-xl font-bold text-gray-900">
                          {calculo.cantidadTotal} {calculo.unidadEntrega}
                        </span>
                      </div>

                      {/* Cantidad a entregar */}
                      <div className="flex items-center gap-2 mb-2">
                        <Package className="h-4 w-4 text-gray-600" />
                        <span className="text-sm font-medium text-gray-700">Cantidad Total a Entregar</span>
                      </div>

                      {/* Detalle del cálculo */}
                      <div className="bg-white/60 rounded-md p-2 space-y-1">
                        <p className="text-xs text-gray-700 flex items-center gap-1">
                          <Calculator className="h-3 w-3" />
                          <span>{calculo.descripcionCalculo}</span>
                        </p>
                        <p className="text-xs text-gray-600">
                          {calculo.tomasPorDia} toma(s)/día × {calculo.dias} día(s) = {calculo.totalTomas} tomas totales
                        </p>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {medicamentoActual.via && (
                            <span className="text-xs px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded">
                              Vía: {medicamentoActual.via}
                            </span>
                          )}
                          {medicamentoActual.formaFarmaceutica && (
                            <span className="text-xs px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded">
                              Forma: {medicamentoActual.formaFarmaceutica}
                            </span>
                          )}
                          {medicamentoActual.concentracion && (
                            <span className="text-xs px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded">
                              Conc: {medicamentoActual.concentracion}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })()}
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
