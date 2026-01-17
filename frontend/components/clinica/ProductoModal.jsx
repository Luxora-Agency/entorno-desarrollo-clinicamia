'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { X, Upload, Image as ImageIcon } from 'lucide-react';

export default function ProductoModal({ isOpen, onClose, editingProducto, onSuccess }) {
  const { toast } = useToast();
  const [categorias, setCategorias] = useState([]);
  const [etiquetas, setEtiquetas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  
  const [formData, setFormData] = useState({
    // Información Básica
    nombre: '',
    categoriaId: '',
    sku: '',
    codigoBarras: '',
    laboratorio: '',
    descripcion: '',
    etiquetasIds: [],

    // Información Farmacológica
    principioActivo: '',
    concentracion: '',
    formaFarmaceutica: '',
    unidadMedida: '',
    viaAdministracion: '',
    presentacion: '',
    codigoAtc: '',
    cum: '',
    registroSanitario: '',
    // Nuevos campos farmacológicos
    posologiaRecomendada: '',
    indicaciones: '',
    contraindicaciones: '',
    efectosAdversos: '',
    interacciones: '',
    riesgoEmbarazo: '',

    // Control y Regulación
    requiereReceta: false,
    controlado: false,
    tipoControlado: '',
    medicamentoAltoRiesgo: false,
    medicamentoLASA: false, // Look-Alike Sound-Alike

    // Almacenamiento
    temperaturaAlmacenamiento: '',
    requiereCadenaFrio: false,
    protegerLuz: false,
    protegerHumedad: false,
    ubicacionAlmacen: '',
    condicionesEspeciales: '',

    // Inventario
    cantidadTotal: '',
    cantidadConsumida: '',
    cantidadMinAlerta: '',
    cantidadMaxAlerta: '',
    lote: '',
    fechaVencimiento: '',
    puntoReorden: '',

    // Precios
    precioVenta: '',
    precioCompra: '',

    // Estado
    activo: true,
    imagenUrl: '',
  });

  // ==========================================
  // VÍAS DE ADMINISTRACIÓN - Lista completa
  // ==========================================
  const viasAdministracion = [
    // Vía Oral
    'Oral',
    'Sublingual',
    'Bucal',
    // Vía Parenteral
    'Intravenosa (IV)',
    'Intramuscular (IM)',
    'Subcutánea (SC)',
    'Intradérmica (ID)',
    'Intraarticular',
    'Intratecal',
    'Epidural',
    'Intraósea',
    // Vía Respiratoria
    'Inhalatoria',
    'Nebulización',
    'Nasal',
    // Vía Tópica
    'Tópica / Cutánea',
    'Transdérmica',
    'Oftálmica',
    'Ótica',
    // Vía Rectal/Vaginal
    'Rectal',
    'Vaginal',
    // Otras vías
    'Intravesical',
    'Intraperitoneal',
  ];

  // ==========================================
  // CONDICIONES DE ALMACENAMIENTO
  // ==========================================
  const temperaturasAlmacenamiento = [
    'Temperatura ambiente (15-25°C)',
    'Temperatura ambiente controlada (20-25°C)',
    'Lugar fresco (8-15°C)',
    'Refrigeración (2-8°C)',
    'Congelación (-20°C)',
    'Ultracongelación (-70°C)',
    'No refrigerar',
    'Proteger de la luz',
    'Proteger de la humedad',
    'Lugar fresco y seco',
    'Envase hermético',
  ];

  // ==========================================
  // FORMAS FARMACÉUTICAS - Lista completa
  // ==========================================
  const formasFarmaceuticas = [
    // --- SÓLIDOS ORALES ---
    'Tableta',
    'Tableta recubierta',
    'Tableta de liberación prolongada',
    'Tableta efervescente',
    'Tableta dispersable',
    'Tableta masticable',
    'Tableta sublingual',
    'Tableta bucodispersable',
    'Cápsula dura',
    'Cápsula blanda',
    'Cápsula de liberación prolongada',
    'Comprimido',
    'Gragea',
    'Pastilla',
    'Liofilizado oral',
    'Polvo para suspensión oral',
    'Granulado',
    'Granulado efervescente',
    'Sobre / Sachet',
    // --- LÍQUIDOS ORALES ---
    'Jarabe',
    'Suspensión oral',
    'Solución oral',
    'Elixir',
    'Emulsión oral',
    'Gotas orales',
    // --- INYECTABLES ---
    'Ampolla',
    'Vial',
    'Solución inyectable',
    'Suspensión inyectable',
    'Emulsión inyectable',
    'Polvo para reconstituir (inyectable)',
    'Liofilizado para inyección',
    'Jeringa prellenada',
    'Cartucho / Carpule',
    // --- INFUSIÓN ---
    'Solución para infusión IV',
    'Bolsa para infusión',
    'Concentrado para solución',
    // --- TÓPICOS ---
    'Crema',
    'Crema vaginal',
    'Gel',
    'Gel oftálmico',
    'Ungüento',
    'Pomada',
    'Loción',
    'Emulsión tópica',
    'Solución tópica',
    'Espuma',
    'Pasta',
    'Polvo tópico',
    // --- TRANSDÉRMICOS ---
    'Parche transdérmico',
    'Sistema transdérmico',
    // --- OFTÁLMICOS ---
    'Gotas oftálmicas',
    'Colirio',
    'Suspensión oftálmica',
    'Solución oftálmica',
    'Ungüento oftálmico',
    'Implante oftálmico',
    // --- ÓTICOS ---
    'Gotas óticas',
    'Solución ótica',
    // --- NASALES ---
    'Spray nasal',
    'Gotas nasales',
    'Solución nasal',
    'Gel nasal',
    // --- RESPIRATORIOS ---
    'Inhalador presurizado (MDI)',
    'Inhalador de polvo seco (DPI)',
    'Solución para nebulización',
    'Cápsula para inhalación',
    'Aerosol',
    // --- RECTALES ---
    'Supositorio',
    'Enema',
    'Espuma rectal',
    'Solución rectal',
    // --- VAGINALES ---
    'Óvulo vaginal',
    'Tableta vaginal',
    'Anillo vaginal',
    'Espuma vaginal',
    // --- ESPECIALES ---
    'Implante subcutáneo',
    'Dispositivo intrauterino (DIU)',
    'Película bucodispersable',
    'Chicle medicado',
  ];

  // ==========================================
  // UNIDADES DE MEDIDA
  // ==========================================
  const unidadesMedida = [
    // Masa
    'mcg (microgramos)',
    'mg (miligramos)',
    'g (gramos)',
    'kg (kilogramos)',
    // Volumen
    'ml (mililitros)',
    'L (litros)',
    'cc (centímetros cúbicos)',
    // Concentración
    'mg/ml',
    'mg/g',
    'mcg/ml',
    'g/L',
    '%',
    '% p/v',
    '% p/p',
    // Actividad biológica
    'UI (Unidades Internacionales)',
    'U (Unidades)',
    'mUI',
    'MUI (Millones UI)',
    // Conteo
    'Tableta',
    'Cápsula',
    'Ampolla',
    'Sobre',
    'Unidad',
    'Dosis',
    'Aplicación',
    'Puff',
    'Gota',
    // Otros
    'mEq (miliequivalentes)',
    'mmol (milimoles)',
  ];

  // ==========================================
  // TIPO DE MEDICAMENTO CONTROLADO (Colombia)
  // Según Resolución 1478 de 2006 y actualizaciones
  // ==========================================
  const tiposControlado = [
    { value: 'I', label: 'Monopolio del Estado - Sin uso médico (Ej: Heroína, LSD)' },
    { value: 'II', label: 'Receta Oficial - Alto potencial abuso (Ej: Morfina, Fentanilo, Metadona)' },
    { value: 'III', label: 'Receta Oficial - Potencial moderado (Ej: Buprenorfina, Ketamina)' },
    { value: 'IV', label: 'Fórmula Médica Vigilada (Ej: Benzodiacepinas, Tramadol, Zolpidem)' },
    { value: 'V', label: 'Venta Libre Controlada - Bajo potencial (Ej: Codeína < 10mg)' },
  ];

  // ==========================================
  // CLASIFICACIÓN RIESGO EN EMBARAZO (FDA/TGA)
  // ==========================================
  const riesgoEmbarazo = [
    { value: 'A', label: 'Categoría A - Estudios controlados no muestran riesgo' },
    { value: 'B', label: 'Categoría B - Sin evidencia de riesgo en humanos' },
    { value: 'C', label: 'Categoría C - No puede descartarse el riesgo' },
    { value: 'D', label: 'Categoría D - Evidencia positiva de riesgo' },
    { value: 'X', label: 'Categoría X - Contraindicado en embarazo' },
    { value: 'N', label: 'No clasificado' },
  ];

  useEffect(() => {
    if (isOpen) {
      loadCategorias();
      loadEtiquetas();
      
      if (editingProducto) {
        setFormData({
          // Información Básica
          nombre: editingProducto.nombre || '',
          categoriaId: editingProducto.categoriaId || '',
          sku: editingProducto.sku || '',
          codigoBarras: editingProducto.codigoBarras || '',
          laboratorio: editingProducto.laboratorio || '',
          descripcion: editingProducto.descripcion || '',
          etiquetasIds: editingProducto.etiquetas?.map(e => e.id) || [],

          // Información Farmacológica
          principioActivo: editingProducto.principioActivo || '',
          concentracion: editingProducto.concentracion || '',
          formaFarmaceutica: editingProducto.formaFarmaceutica || '',
          unidadMedida: editingProducto.unidadMedida || '',
          viaAdministracion: editingProducto.viaAdministracion || '',
          presentacion: editingProducto.presentacion || '',
          codigoAtc: editingProducto.codigoAtc || '',
          cum: editingProducto.cum || '',
          registroSanitario: editingProducto.registroSanitario || '',
          // Nuevos campos farmacológicos
          posologiaRecomendada: editingProducto.posologiaRecomendada || '',
          indicaciones: editingProducto.indicaciones || '',
          contraindicaciones: editingProducto.contraindicaciones || '',
          efectosAdversos: editingProducto.efectosAdversos || '',
          interacciones: editingProducto.interacciones || '',
          riesgoEmbarazo: editingProducto.riesgoEmbarazo || '',

          // Control y Regulación
          requiereReceta: editingProducto.requiereReceta || false,
          controlado: editingProducto.controlado || false,
          tipoControlado: editingProducto.tipoControlado || '',
          medicamentoAltoRiesgo: editingProducto.medicamentoAltoRiesgo || false,
          medicamentoLASA: editingProducto.medicamentoLASA || false,

          // Almacenamiento
          temperaturaAlmacenamiento: editingProducto.temperaturaAlmacenamiento || '',
          requiereCadenaFrio: editingProducto.requiereCadenaFrio || false,
          protegerLuz: editingProducto.protegerLuz || false,
          protegerHumedad: editingProducto.protegerHumedad || false,
          ubicacionAlmacen: editingProducto.ubicacionAlmacen || '',
          condicionesEspeciales: editingProducto.condicionesEspeciales || '',

          // Inventario
          cantidadTotal: editingProducto.cantidadTotal?.toString() || '',
          cantidadConsumida: editingProducto.cantidadConsumida?.toString() || '',
          cantidadMinAlerta: editingProducto.cantidadMinAlerta?.toString() || '',
          cantidadMaxAlerta: editingProducto.cantidadMaxAlerta?.toString() || '',
          lote: editingProducto.lote || '',
          fechaVencimiento: editingProducto.fechaVencimiento ? editingProducto.fechaVencimiento.slice(0, 16) : '',
          puntoReorden: editingProducto.puntoReorden?.toString() || '',

          // Precios
          precioVenta: editingProducto.precioVenta?.toString() || '',
          precioCompra: editingProducto.precioCompra?.toString() || '',

          // Estado
          activo: editingProducto.activo !== undefined ? editingProducto.activo : true,
          imagenUrl: editingProducto.imagenUrl || '',
        });
        setImagePreview(editingProducto.imagenUrl || null);
      } else {
        resetForm();
      }
    }
  }, [isOpen, editingProducto]);

  const loadCategorias = async () => {
    try {
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';
      const response = await fetch(`${apiUrl}/categorias-productos`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      setCategorias(data.data || []);
    } catch (error) {
      console.error('Error loading categorias:', error);
    }
  };

  const loadEtiquetas = async () => {
    try {
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';
      const response = await fetch(`${apiUrl}/etiquetas-productos`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      setEtiquetas(data.data || []);
    } catch (error) {
      console.error('Error loading etiquetas:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      // Información Básica
      nombre: '',
      categoriaId: '',
      sku: '',
      codigoBarras: '',
      laboratorio: '',
      descripcion: '',
      etiquetasIds: [],

      // Información Farmacológica
      principioActivo: '',
      concentracion: '',
      formaFarmaceutica: '',
      unidadMedida: '',
      viaAdministracion: '',
      presentacion: '',
      codigoAtc: '',
      cum: '',
      registroSanitario: '',
      posologiaRecomendada: '',
      indicaciones: '',
      contraindicaciones: '',
      efectosAdversos: '',
      interacciones: '',
      riesgoEmbarazo: '',

      // Control y Regulación
      requiereReceta: false,
      controlado: false,
      tipoControlado: '',
      medicamentoAltoRiesgo: false,
      medicamentoLASA: false,

      // Almacenamiento
      temperaturaAlmacenamiento: '',
      requiereCadenaFrio: false,
      protegerLuz: false,
      protegerHumedad: false,
      ubicacionAlmacen: '',
      condicionesEspeciales: '',

      // Inventario
      cantidadTotal: '',
      cantidadConsumida: '',
      cantidadMinAlerta: '',
      cantidadMaxAlerta: '',
      lote: '',
      fechaVencimiento: '',
      puntoReorden: '',

      // Precios
      precioVenta: '',
      precioCompra: '',

      // Estado
      activo: true,
      imagenUrl: '',
    });
    setImagePreview(null);
  };

  const handleEtiquetaToggle = (etiquetaId) => {
    if (formData.etiquetasIds.includes(etiquetaId)) {
      setFormData({
        ...formData,
        etiquetasIds: formData.etiquetasIds.filter(id => id !== etiquetaId)
      });
    } else {
      setFormData({
        ...formData,
        etiquetasIds: [...formData.etiquetasIds, etiquetaId]
      });
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Crear preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
        setFormData({ ...formData, imagenUrl: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validaciones
    if (!formData.nombre.trim()) {
      toast({ description: 'El nombre es obligatorio' });
      return;
    }
    if (!formData.categoriaId) {
      toast({ description: 'La categoría es obligatoria' });
      return;
    }
    if (!formData.sku.trim()) {
      toast({ description: 'El SKU es obligatorio' });
      return;
    }
    if (!formData.descripcion?.trim()) {
      toast({ description: 'La descripción es obligatoria' });
      return;
    }
    if (!formData.cantidadTotal) {
      toast({ description: 'La cantidad total es obligatoria' });
      return;
    }
    if (!formData.cantidadMinAlerta) {
      toast({ description: 'La cantidad mínima de alerta es obligatoria' });
      return;
    }
    if (!formData.precioVenta) {
      toast({ description: 'El precio de venta es obligatorio' });
      return;
    }

    setLoading(true);
    
    try {
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';
      
      const payload = {
        ...formData,
        cantidadTotal: parseInt(formData.cantidadTotal) || 0,
        cantidadConsumida: parseInt(formData.cantidadConsumida) || 0,
        cantidadMinAlerta: parseInt(formData.cantidadMinAlerta) || 10,
        cantidadMaxAlerta: formData.cantidadMaxAlerta ? parseInt(formData.cantidadMaxAlerta) : null,
        precioVenta: parseFloat(formData.precioVenta) || 0,
        precioCompra: formData.precioCompra ? parseFloat(formData.precioCompra) : null,
        // Limpiar campos vacíos para que el backend los maneje como null
        codigoBarras: formData.codigoBarras || null,
        formaFarmaceutica: formData.formaFarmaceutica || null,
        unidadMedida: formData.unidadMedida || null,
        tipoControlado: formData.tipoControlado || null,
        ubicacionAlmacen: formData.ubicacionAlmacen || null,
      };

      const url = editingProducto
        ? `${apiUrl}/productos/${editingProducto.id}`
        : `${apiUrl}/productos`;
      
      const method = editingProducto ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        toast({ 
          title: editingProducto ? "Producto actualizado" : "Producto creado",
          description: editingProducto ? "El producto ha sido actualizado correctamente." : "El producto ha sido creado correctamente.",
          className: "bg-green-50 border-green-200 text-green-800"
        });
        onSuccess();
      } else {
        const error = await response.json();
        
        // Handle Zod validation errors
        if (error.details && Array.isArray(error.details)) {
            const errorMessages = error.details.map(d => `${d.path.join('.')}: ${d.message}`).join('\n');
            toast({ 
                title: "Error de validación",
                description: errorMessages,
                variant: "destructive"
            });
        } else {
            toast({ 
                title: "Error",
                description: error.error || error.message || 'Error al guardar el producto',
                variant: "destructive"
            });
        }
      }
    } catch (error) {
      console.error('Error saving producto:', error);
      toast({ 
          title: "Error de conexión",
          description: 'No se pudo conectar con el servidor',
          variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">
            {editingProducto ? 'Editar Producto' : 'Nuevo Producto'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* SECCIÓN 1: Información Básica */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-gray-900 border-b pb-2">Información Básica</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-semibold">Nombre del Producto *</Label>
                <Input
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  className="mt-2"
                  placeholder="Ej: Acetaminofén"
                />
              </div>
              <div>
                <Label className="text-sm font-semibold">Categoría *</Label>
                <Select value={formData.categoriaId} onValueChange={(value) => setFormData({ ...formData, categoriaId: value })}>
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="Seleccionar categoría..." />
                  </SelectTrigger>
                  <SelectContent>
                    {categorias.map(cat => (
                      <SelectItem key={cat.id} value={cat.id}>{cat.nombre}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-sm font-semibold">SKU *</Label>
                <Input
                  value={formData.sku}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                  className="mt-2"
                  placeholder="Ej: MED-001"
                />
              </div>
              <div>
                <Label className="text-sm font-semibold">Código de Barras</Label>
                <Input
                  value={formData.codigoBarras}
                  onChange={(e) => setFormData({ ...formData, codigoBarras: e.target.value })}
                  className="mt-2"
                  placeholder="Ej: 7702057001234"
                />
              </div>
              <div>
                <Label className="text-sm font-semibold">Laboratorio</Label>
                <Input
                  value={formData.laboratorio}
                  onChange={(e) => setFormData({ ...formData, laboratorio: e.target.value })}
                  className="mt-2"
                  placeholder="Ej: Laboratorios XYZ"
                />
              </div>
              <div className="md:col-span-2">
                <Label className="text-sm font-semibold">Descripción *</Label>
                <Textarea
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  className="mt-2"
                  rows={3}
                  placeholder="Descripción del producto..."
                />
              </div>
              <div className="md:col-span-2">
                <Label className="text-sm font-semibold">Etiquetas</Label>
                <div className="mt-2 border-2 border-gray-200 rounded-lg p-3 space-y-2 max-h-40 overflow-y-auto">
                  {etiquetas.map(etq => (
                    <div key={etq.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`etq-${etq.id}`}
                        checked={formData.etiquetasIds.includes(etq.id)}
                        onCheckedChange={() => handleEtiquetaToggle(etq.id)}
                      />
                      <label htmlFor={`etq-${etq.id}`} className="text-sm cursor-pointer">
                        {etq.nombre}
                      </label>
                    </div>
                  ))}
                </div>
                {formData.etiquetasIds.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.etiquetasIds.map(etqId => {
                      const etq = etiquetas.find(e => e.id === etqId);
                      return etq ? (
                        <Badge key={etqId} className="bg-blue-100 text-blue-700">
                          {etq.nombre}
                          <X className="w-3 h-3 ml-1 cursor-pointer" onClick={() => handleEtiquetaToggle(etqId)} />
                        </Badge>
                      ) : null;
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* SECCIÓN 2: Información Farmacológica */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-gray-900 border-b pb-2 flex items-center gap-2">
              <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
              Información Farmacológica
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label className="text-sm font-semibold">Principio Activo</Label>
                <Input
                  value={formData.principioActivo}
                  onChange={(e) => setFormData({ ...formData, principioActivo: e.target.value })}
                  className="mt-2"
                  placeholder="Ej: Paracetamol"
                />
              </div>
              <div>
                <Label className="text-sm font-semibold">Concentración</Label>
                <Input
                  value={formData.concentracion}
                  onChange={(e) => setFormData({ ...formData, concentracion: e.target.value })}
                  className="mt-2"
                  placeholder="Ej: 500mg"
                />
              </div>
              <div>
                <Label className="text-sm font-semibold">Forma Farmacéutica</Label>
                <Select value={formData.formaFarmaceutica} onValueChange={(value) => setFormData({ ...formData, formaFarmaceutica: value })}>
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="Seleccionar..." />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {formasFarmaceuticas.map(forma => (
                      <SelectItem key={forma} value={forma}>{forma}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-sm font-semibold">Unidad de Medida</Label>
                <Select value={formData.unidadMedida} onValueChange={(value) => setFormData({ ...formData, unidadMedida: value })}>
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="Seleccionar..." />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {unidadesMedida.map(unidad => (
                      <SelectItem key={unidad} value={unidad}>{unidad}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-sm font-semibold">Vía de Administración</Label>
                <Select value={formData.viaAdministracion} onValueChange={(value) => setFormData({ ...formData, viaAdministracion: value })}>
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="Seleccionar..." />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {viasAdministracion.map(via => (
                      <SelectItem key={via} value={via}>{via}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-sm font-semibold">Presentación</Label>
                <Input
                  value={formData.presentacion}
                  onChange={(e) => setFormData({ ...formData, presentacion: e.target.value })}
                  className="mt-2"
                  placeholder="Ej: Caja x 20 tabletas"
                />
              </div>
              <div>
                <Label className="text-sm font-semibold">Código ATC</Label>
                <Input
                  value={formData.codigoAtc}
                  onChange={(e) => setFormData({ ...formData, codigoAtc: e.target.value })}
                  className="mt-2"
                  placeholder="Ej: N02BE01"
                />
              </div>
              <div>
                <Label className="text-sm font-semibold">CUM (Código Único)</Label>
                <Input
                  value={formData.cum}
                  onChange={(e) => setFormData({ ...formData, cum: e.target.value })}
                  className="mt-2"
                  placeholder="Ej: 1234567-1"
                />
              </div>
              <div>
                <Label className="text-sm font-semibold">Registro INVIMA</Label>
                <Input
                  value={formData.registroSanitario}
                  onChange={(e) => setFormData({ ...formData, registroSanitario: e.target.value })}
                  className="mt-2"
                  placeholder="Ej: INVIMA 2024M-0001234"
                />
              </div>
            </div>
          </div>

          {/* SECCIÓN 3: Información Clínica */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-gray-900 border-b pb-2 flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              Información Clínica
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-semibold">Posología Recomendada</Label>
                <Textarea
                  value={formData.posologiaRecomendada}
                  onChange={(e) => setFormData({ ...formData, posologiaRecomendada: e.target.value })}
                  className="mt-2"
                  rows={2}
                  placeholder="Ej: Adultos: 500mg cada 6-8 horas. Máximo 4g/día"
                />
              </div>
              <div>
                <Label className="text-sm font-semibold">Indicaciones</Label>
                <Textarea
                  value={formData.indicaciones}
                  onChange={(e) => setFormData({ ...formData, indicaciones: e.target.value })}
                  className="mt-2"
                  rows={2}
                  placeholder="Ej: Dolor leve a moderado, fiebre"
                />
              </div>
              <div>
                <Label className="text-sm font-semibold text-amber-700">Contraindicaciones</Label>
                <Textarea
                  value={formData.contraindicaciones}
                  onChange={(e) => setFormData({ ...formData, contraindicaciones: e.target.value })}
                  className="mt-2 border-amber-200 focus:border-amber-400"
                  rows={2}
                  placeholder="Ej: Hipersensibilidad al principio activo, insuficiencia hepática grave"
                />
              </div>
              <div>
                <Label className="text-sm font-semibold text-red-700">Interacciones Medicamentosas</Label>
                <Textarea
                  value={formData.interacciones}
                  onChange={(e) => setFormData({ ...formData, interacciones: e.target.value })}
                  className="mt-2 border-red-200 focus:border-red-400"
                  rows={2}
                  placeholder="Ej: Warfarina (aumenta efecto anticoagulante), Alcohol"
                />
              </div>
              <div>
                <Label className="text-sm font-semibold">Efectos Adversos</Label>
                <Textarea
                  value={formData.efectosAdversos}
                  onChange={(e) => setFormData({ ...formData, efectosAdversos: e.target.value })}
                  className="mt-2"
                  rows={2}
                  placeholder="Ej: Náuseas, erupciones cutáneas, hepatotoxicidad (dosis altas)"
                />
              </div>
              <div>
                <Label className="text-sm font-semibold">Riesgo en Embarazo</Label>
                <Select value={formData.riesgoEmbarazo} onValueChange={(value) => setFormData({ ...formData, riesgoEmbarazo: value })}>
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="Seleccionar categoría..." />
                  </SelectTrigger>
                  <SelectContent>
                    {riesgoEmbarazo.map(cat => (
                      <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* SECCIÓN 4: Control y Regulación */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-gray-900 border-b pb-2 flex items-center gap-2">
              <span className="w-2 h-2 bg-red-500 rounded-full"></span>
              Control y Regulación
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="flex items-center space-x-2 p-3 rounded-lg border bg-gray-50">
                <Checkbox
                  id="requiereReceta"
                  checked={formData.requiereReceta}
                  onCheckedChange={(checked) => setFormData({ ...formData, requiereReceta: checked })}
                />
                <label htmlFor="requiereReceta" className="text-sm font-medium cursor-pointer">
                  Requiere Receta
                </label>
              </div>
              <div className="flex items-center space-x-2 p-3 rounded-lg border bg-gray-50">
                <Checkbox
                  id="controlado"
                  checked={formData.controlado}
                  onCheckedChange={(checked) => setFormData({ ...formData, controlado: checked, tipoControlado: checked ? formData.tipoControlado : '' })}
                />
                <label htmlFor="controlado" className="text-sm font-medium cursor-pointer">
                  Controlado
                </label>
              </div>
              <div className="flex items-center space-x-2 p-3 rounded-lg border bg-amber-50 border-amber-200">
                <Checkbox
                  id="medicamentoAltoRiesgo"
                  checked={formData.medicamentoAltoRiesgo}
                  onCheckedChange={(checked) => setFormData({ ...formData, medicamentoAltoRiesgo: checked })}
                />
                <label htmlFor="medicamentoAltoRiesgo" className="text-sm font-medium cursor-pointer text-amber-800">
                  Alto Riesgo
                </label>
              </div>
              <div className="flex items-center space-x-2 p-3 rounded-lg border bg-purple-50 border-purple-200">
                <Checkbox
                  id="medicamentoLASA"
                  checked={formData.medicamentoLASA}
                  onCheckedChange={(checked) => setFormData({ ...formData, medicamentoLASA: checked })}
                />
                <label htmlFor="medicamentoLASA" className="text-sm font-medium cursor-pointer text-purple-800">
                  LASA
                </label>
              </div>
            </div>
            {formData.controlado && (
              <div>
                <Label className="text-sm font-semibold text-red-700">Tipo de Control (Resolución 1478)</Label>
                <Select value={formData.tipoControlado} onValueChange={(value) => setFormData({ ...formData, tipoControlado: value })}>
                  <SelectTrigger className="mt-2 border-red-200">
                    <SelectValue placeholder="Seleccionar grupo de control..." />
                  </SelectTrigger>
                  <SelectContent>
                    {tiposControlado.map(tipo => (
                      <SelectItem key={tipo.value} value={tipo.value}>{tipo.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            {formData.medicamentoAltoRiesgo && (
              <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-sm text-amber-800">
                <strong>Medicamento de Alto Riesgo:</strong> Requiere doble verificación antes de administrar. Incluye: anticoagulantes, insulinas, opioides, quimioterapéuticos, electrolitos concentrados.
              </div>
            )}
            {formData.medicamentoLASA && (
              <div className="p-3 rounded-lg bg-purple-50 border border-purple-200 text-sm text-purple-800">
                <strong>LASA (Look-Alike Sound-Alike):</strong> Medicamento con nombre o apariencia similar a otros. Requiere etiquetado diferenciado y almacenamiento separado.
              </div>
            )}
          </div>

          {/* SECCIÓN 5: Almacenamiento */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-gray-900 border-b pb-2 flex items-center gap-2">
              <span className="w-2 h-2 bg-cyan-500 rounded-full"></span>
              Almacenamiento
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-semibold">Temperatura de Almacenamiento</Label>
                <Select value={formData.temperaturaAlmacenamiento} onValueChange={(value) => setFormData({ ...formData, temperaturaAlmacenamiento: value })}>
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="Seleccionar..." />
                  </SelectTrigger>
                  <SelectContent>
                    {temperaturasAlmacenamiento.map(temp => (
                      <SelectItem key={temp} value={temp}>{temp}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-sm font-semibold">Ubicación en Almacén</Label>
                <Input
                  value={formData.ubicacionAlmacen}
                  onChange={(e) => setFormData({ ...formData, ubicacionAlmacen: e.target.value })}
                  className="mt-2"
                  placeholder="Ej: Estante A3, Nivel 2"
                />
              </div>
              <div className="md:col-span-2">
                <Label className="text-sm font-semibold">Condiciones Especiales</Label>
                <Textarea
                  value={formData.condicionesEspeciales}
                  onChange={(e) => setFormData({ ...formData, condicionesEspeciales: e.target.value })}
                  className="mt-2"
                  rows={2}
                  placeholder="Ej: Almacenar en envase original, proteger de la luz directa, mantener alejado de fuentes de calor"
                />
              </div>
              <div className="md:col-span-2 grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="flex items-center space-x-2 p-3 rounded-lg border bg-blue-50 border-blue-200">
                  <Checkbox
                    id="requiereCadenaFrio"
                    checked={formData.requiereCadenaFrio}
                    onCheckedChange={(checked) => setFormData({ ...formData, requiereCadenaFrio: checked })}
                  />
                  <label htmlFor="requiereCadenaFrio" className="text-sm font-medium cursor-pointer text-blue-800">
                    Cadena de Frío
                  </label>
                </div>
                <div className="flex items-center space-x-2 p-3 rounded-lg border bg-yellow-50 border-yellow-200">
                  <Checkbox
                    id="protegerLuz"
                    checked={formData.protegerLuz}
                    onCheckedChange={(checked) => setFormData({ ...formData, protegerLuz: checked })}
                  />
                  <label htmlFor="protegerLuz" className="text-sm font-medium cursor-pointer text-yellow-800">
                    Proteger de la Luz
                  </label>
                </div>
                <div className="flex items-center space-x-2 p-3 rounded-lg border bg-teal-50 border-teal-200">
                  <Checkbox
                    id="protegerHumedad"
                    checked={formData.protegerHumedad}
                    onCheckedChange={(checked) => setFormData({ ...formData, protegerHumedad: checked })}
                  />
                  <label htmlFor="protegerHumedad" className="text-sm font-medium cursor-pointer text-teal-800">
                    Proteger de Humedad
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* SECCIÓN 6: Inventario y Lote */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-gray-900 border-b pb-2 flex items-center gap-2">
              <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
              Inventario y Lote
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label className="text-sm font-semibold">Cantidad Total *</Label>
                <Input
                  type="number"
                  value={formData.cantidadTotal}
                  onChange={(e) => setFormData({ ...formData, cantidadTotal: e.target.value })}
                  className="mt-2"
                  placeholder="100"
                  min="0"
                />
              </div>
              <div>
                <Label className="text-sm font-semibold">Cantidad Consumida</Label>
                <Input
                  type="number"
                  value={formData.cantidadConsumida}
                  onChange={(e) => setFormData({ ...formData, cantidadConsumida: e.target.value })}
                  className="mt-2"
                  placeholder="0"
                  min="0"
                />
              </div>
              <div>
                <Label className="text-sm font-semibold">Stock Mínimo (Alerta) *</Label>
                <Input
                  type="number"
                  value={formData.cantidadMinAlerta}
                  onChange={(e) => setFormData({ ...formData, cantidadMinAlerta: e.target.value })}
                  className="mt-2"
                  placeholder="10"
                  min="0"
                />
              </div>
              <div>
                <Label className="text-sm font-semibold">Stock Máximo (Exceso)</Label>
                <Input
                  type="number"
                  value={formData.cantidadMaxAlerta}
                  onChange={(e) => setFormData({ ...formData, cantidadMaxAlerta: e.target.value })}
                  className="mt-2"
                  placeholder="1000"
                  min="0"
                />
              </div>
              <div>
                <Label className="text-sm font-semibold">Lote</Label>
                <Input
                  value={formData.lote}
                  onChange={(e) => setFormData({ ...formData, lote: e.target.value })}
                  className="mt-2"
                  placeholder="Ej: L2024-001"
                />
              </div>
              <div className="md:col-span-2">
                <Label className="text-sm font-semibold">Fecha de Vencimiento</Label>
                <Input
                  type="datetime-local"
                  value={formData.fechaVencimiento}
                  onChange={(e) => setFormData({ ...formData, fechaVencimiento: e.target.value })}
                  className="mt-2"
                />
              </div>
            </div>
          </div>

          {/* SECCIÓN 7: Precios */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-gray-900 border-b pb-2 flex items-center gap-2">
              <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
              Precios
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-semibold">Precio de Venta *</Label>
                <Input
                  type="number"
                  value={formData.precioVenta}
                  onChange={(e) => setFormData({ ...formData, precioVenta: e.target.value })}
                  className="mt-2"
                  placeholder="15000"
                  min="0"
                  step="0.01"
                />
              </div>
              <div>
                <Label className="text-sm font-semibold">Precio de Compra</Label>
                <Input
                  type="number"
                  value={formData.precioCompra}
                  onChange={(e) => setFormData({ ...formData, precioCompra: e.target.value })}
                  className="mt-2"
                  placeholder="10000"
                  min="0"
                  step="0.01"
                />
              </div>
              <div className="md:col-span-2">
                <div className="flex items-center space-x-2 mt-2">
                  <Checkbox
                    id="activo"
                    checked={formData.activo}
                    onCheckedChange={(checked) => setFormData({ ...formData, activo: checked })}
                  />
                  <label htmlFor="activo" className="text-sm font-semibold cursor-pointer">
                    Producto Activo
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* SECCIÓN 8: Imagen */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-gray-900 border-b pb-2 flex items-center gap-2">
              <span className="w-2 h-2 bg-pink-500 rounded-full"></span>
              Imagen del Producto
            </h3>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <Label htmlFor="imagen" className="cursor-pointer">
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-emerald-500 transition-colors">
                      <div className="flex flex-col items-center gap-2">
                        <Upload className="w-8 h-8 text-gray-400" />
                        <p className="text-sm text-gray-600">Click para subir imagen</p>
                        <p className="text-xs text-gray-400">PNG, JPG hasta 5MB</p>
                      </div>
                    </div>
                  </Label>
                  <Input
                    id="imagen"
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </div>
                {imagePreview && (
                  <div className="relative w-32 h-32">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-full h-full object-cover rounded-lg border-2 border-gray-200"
                    />
                    <Button
                      type="button"
                      size="sm"
                      variant="destructive"
                      className="absolute -top-2 -right-2 h-6 w-6 p-0 rounded-full"
                      onClick={() => {
                        setImagePreview(null);
                        setFormData({ ...formData, imagenUrl: '' });
                      }}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button 
              type="submit" 
              className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
              disabled={loading}
            >
              {loading ? 'Guardando...' : editingProducto ? 'Actualizar' : 'Guardar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
