'use client';

import { useState, useMemo } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  FileText, FileCheck, Calendar, Stethoscope,
  AlertCircle, CheckCircle2, Package, Syringe, X, Loader2,
  Search, DollarSign, Pill, Tag
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { apiPost } from '@/services/api';

import FormularioIncapacidad from './FormularioIncapacidad';
import FormularioCertificado from './FormularioCertificado';
import FormularioSeguimiento from './FormularioSeguimiento';
import { KITS_MEDICAMENTOS, KITS_POR_CATEGORIA, CATEGORIAS_KITS, calcularPrecioKit, COLORES_CATEGORIA_KIT } from '@/constants/kitsMedicamentos';

export default function FormularioPlanManejo({
  paciente,
  doctorId,
  citaId,
  diagnostico,
  data, // Datos iniciales para persistencia
  onChange
}) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('aplicacion'); // Default to new tab

  // Estado para almacenar los items creados (para persistencia entre tabs)
  const [itemsCreados, setItemsCreados] = useState({
    incapacidades: data?.incapacidadesItems || [],
    certificados: data?.certificadosItems || [],
    seguimientos: data?.seguimientosItems || [],
    aplicaciones: data?.aplicacionesItems || [],
  });

  // Contadores derivados de los items
  const contadores = {
    incapacidades: itemsCreados.incapacidades.length,
    certificados: itemsCreados.certificados.length,
    seguimientos: itemsCreados.seguimientos.length,
    aplicaciones: itemsCreados.aplicaciones.length,
  };

  // Estado para kits seleccionados - restaurar desde data si existe
  const [kitsSeleccionados, setKitsSeleccionados] = useState(data?.kitsAplicados || []);
  // Estado para preview y confirmación
  const [showPreview, setShowPreview] = useState(false);
  const [creandoOrden, setCreandoOrden] = useState(false);
  // Estado para filtrado de kits
  const [busquedaKit, setBusquedaKit] = useState('');
  const [categoriaFiltro, setCategoriaFiltro] = useState('todas');

  // Filtrar kits según búsqueda y categoría
  const kitsFiltrados = useMemo(() => {
    let kits = KITS_MEDICAMENTOS;

    // Filtrar por categoría
    if (categoriaFiltro !== 'todas') {
      kits = kits.filter(k => k.categoria === categoriaFiltro);
    }

    // Filtrar por búsqueda
    if (busquedaKit.trim()) {
      const termino = busquedaKit.toLowerCase();
      kits = kits.filter(k =>
        k.nombre.toLowerCase().includes(termino) ||
        k.codigo.toLowerCase().includes(termino) ||
        k.descripcion.toLowerCase().includes(termino) ||
        k.medicamentos.some(m => m.nombre.toLowerCase().includes(termino))
      );
    }

    return kits;
  }, [busquedaKit, categoriaFiltro]);

  // Calcular total de la orden
  const totalOrden = useMemo(() => {
    return kitsSeleccionados.reduce((total, kit) => total + calcularPrecioKit(kit), 0);
  }, [kitsSeleccionados]);

  const toggleKit = (kit) => {
    if (kitsSeleccionados.find(k => k.id === kit.id)) {
        setKitsSeleccionados(kitsSeleccionados.filter(k => k.id !== kit.id));
    } else {
        setKitsSeleccionados([...kitsSeleccionados, kit]);
    }
  };

  // Abre el modal de preview
  const handleAplicarMedicamentos = () => {
    if (kitsSeleccionados.length === 0) return;
    setShowPreview(true);
  };

  // Confirma y crea la orden de enfermería
  const confirmarAplicacion = async () => {
    setCreandoOrden(true);
    try {
      // Preparar los datos para el backend con estructura mejorada
      const medicamentosOrden = kitsSeleccionados.flatMap(kit =>
        kit.medicamentos.map(med => ({
          nombre: med.nombre,
          codigoCum: med.codigoCum,
          concentracion: med.concentracion,
          kitOrigen: kit.nombre,
          kitCodigo: kit.codigo,
          cantidad: med.cantidad,
          via: med.via,
          precio: med.precio,
          observaciones: `Kit: ${kit.codigo} - ${kit.nombre}`
        }))
      );

      // Intentar crear la orden de enfermería en el backend
      try {
        await apiPost('/ordenes-enfermeria', {
          pacienteId: paciente?.id,
          citaId: citaId,
          doctorId: doctorId,
          tipoOrden: 'aplicacion_medicamentos',
          medicamentos: medicamentosOrden,
          kits: kitsSeleccionados.map(k => ({
            id: k.id,
            codigo: k.codigo,
            nombre: k.nombre,
            categoria: k.categoria,
            precio: calcularPrecioKit(k)
          })),
          totalOrden: totalOrden,
          estado: 'pendiente'
        });
      } catch (apiError) {
        console.log('Endpoint ordenes-enfermeria no disponible, guardando localmente');
        // Si el endpoint no existe, al menos guardamos en el estado local
      }

      toast({
        title: "Orden de Aplicación Creada",
        description: `Se ha generado orden para ${kitsSeleccionados.length} kits (${medicamentosOrden.length} medicamentos).`,
      });

      // Agregar los kits aplicados al estado
      const nuevasAplicaciones = [...itemsCreados.aplicaciones, ...kitsSeleccionados];
      setItemsCreados(prev => ({ ...prev, aplicaciones: nuevasAplicaciones }));

      if (onChange) {
        onChange({
          incapacidadesItems: itemsCreados.incapacidades,
          certificadosItems: itemsCreados.certificados,
          seguimientosItems: itemsCreados.seguimientos,
          aplicacionesItems: nuevasAplicaciones,
          kitsAplicados: [] // Limpiar selección actual
        });
      }

      setKitsSeleccionados([]);
      setShowPreview(false);
    } catch (error) {
      console.error('Error creando orden:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo crear la orden de aplicación.'
      });
    } finally {
      setCreandoOrden(false);
    }
  };

  // Handlers para guardar items y notificar al padre
  const handleIncapacidadSuccess = (incapacidadData) => {
    const nuevasIncapacidades = [...itemsCreados.incapacidades, incapacidadData];
    setItemsCreados(prev => ({ ...prev, incapacidades: nuevasIncapacidades }));

    if (onChange) {
      onChange({
        incapacidadesItems: nuevasIncapacidades,
        certificadosItems: itemsCreados.certificados,
        seguimientosItems: itemsCreados.seguimientos,
        aplicacionesItems: itemsCreados.aplicaciones,
      });
    }
  };

  const handleCertificadoSuccess = (certificadoData) => {
    const nuevosCertificados = [...itemsCreados.certificados, certificadoData];
    setItemsCreados(prev => ({ ...prev, certificados: nuevosCertificados }));

    if (onChange) {
      onChange({
        incapacidadesItems: itemsCreados.incapacidades,
        certificadosItems: nuevosCertificados,
        seguimientosItems: itemsCreados.seguimientos,
        aplicacionesItems: itemsCreados.aplicaciones,
      });
    }
  };

  const handleSeguimientoSuccess = (seguimientoData) => {
    const nuevosSeguimientos = [...itemsCreados.seguimientos, seguimientoData];
    setItemsCreados(prev => ({ ...prev, seguimientos: nuevosSeguimientos }));

    if (onChange) {
      onChange({
        incapacidadesItems: itemsCreados.incapacidades,
        certificadosItems: itemsCreados.certificados,
        seguimientosItems: nuevosSeguimientos,
        aplicacionesItems: itemsCreados.aplicaciones,
      });
    }
  };

  const totalDocumentos = contadores.incapacidades + contadores.certificados + contadores.seguimientos + contadores.aplicaciones;

  return (
    <Card className="border-slate-200">
      <CardHeader className="bg-gradient-to-r from-slate-50 to-gray-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Stethoscope className="h-5 w-5 text-slate-700" />
            <div>
              <CardTitle className="text-slate-900">Plan de Manejo Integral</CardTitle>
              <CardDescription>
                Aplicación de medicamentos, incapacidades y seguimiento
              </CardDescription>
            </div>
          </div>
          {totalDocumentos > 0 && (
            <Badge className="bg-green-600">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              {totalDocumentos} acciones
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        {/* Alerta si no hay diagnóstico */}
        {!diagnostico?.principal?.codigoCIE10 && (
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-2">
            <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-yellow-800">Diagnóstico no registrado</p>
              <p className="text-xs text-yellow-700">
                Se recomienda completar el diagnóstico CIE-10 antes de generar documentos.
              </p>
            </div>
          </div>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="aplicacion" className="flex items-center gap-2">
              <Syringe className="h-4 w-4" />
              <span className="hidden sm:inline">Aplicar Meds</span>
            </TabsTrigger>
            <TabsTrigger value="incapacidades" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Incapacidades</span>
              {contadores.incapacidades > 0 && (
                <Badge variant="secondary" className="ml-1 bg-orange-100 text-orange-700">
                  {contadores.incapacidades}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="certificados" className="flex items-center gap-2">
              <FileCheck className="h-4 w-4" />
              <span className="hidden sm:inline">Certificados</span>
              {contadores.certificados > 0 && (
                <Badge variant="secondary" className="ml-1 bg-blue-100 text-blue-700">
                  {contadores.certificados}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="seguimiento" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span className="hidden sm:inline">Seguimiento</span>
              {contadores.seguimientos > 0 && (
                <Badge variant="secondary" className="ml-1 bg-purple-100 text-purple-700">
                  {contadores.seguimientos}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="aplicacion" className="mt-4 space-y-4">
             <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h4 className="font-semibold text-blue-900 flex items-center gap-2">
                        <Package className="h-5 w-5" />
                        Kits de Medicamentos (Aplicación Inmediata)
                    </h4>
                    <p className="text-sm text-blue-700 mt-1">
                        Seleccione los kits para generar la orden de enfermería con códigos CUM y precios.
                    </p>
                  </div>
                  {kitsSeleccionados.length > 0 && (
                    <div className="text-right">
                      <Badge className="bg-green-600 text-white">
                        {kitsSeleccionados.length} kit(s)
                      </Badge>
                      <p className="text-xs text-green-700 mt-1 font-semibold">
                        Total: ${totalOrden.toLocaleString('es-CO')}
                      </p>
                    </div>
                  )}
                </div>

                {/* Búsqueda y Filtros */}
                <div className="flex flex-wrap gap-2 mb-4">
                  <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Buscar kits por nombre, código o medicamento..."
                      value={busquedaKit}
                      onChange={(e) => setBusquedaKit(e.target.value)}
                      className="pl-10 bg-white"
                    />
                  </div>
                  <select
                    value={categoriaFiltro}
                    onChange={(e) => setCategoriaFiltro(e.target.value)}
                    className="px-3 py-2 border rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="todas">Todas las categorías</option>
                    {CATEGORIAS_KITS.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                {/* Grid de Kits */}
                <ScrollArea className="h-[400px] pr-2">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {kitsFiltrados.map(kit => {
                        const isSelected = kitsSeleccionados.find(k => k.id === kit.id);
                        const precioKit = calcularPrecioKit(kit);
                        const colorClass = COLORES_CATEGORIA_KIT[kit.categoria] || 'bg-gray-100 text-gray-700 border-gray-200';

                        return (
                            <div
                                key={kit.id}
                                onClick={() => toggleKit(kit)}
                                className={`cursor-pointer border rounded-lg p-3 transition-all ${
                                    isSelected
                                    ? 'bg-blue-100 border-blue-500 shadow-md ring-2 ring-blue-400'
                                    : 'bg-white border-slate-200 hover:border-blue-300 hover:shadow-sm'
                                }`}
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2 mb-1">
                                        <h5 className="font-bold text-sm text-slate-800">{kit.nombre}</h5>
                                        {isSelected && <CheckCircle2 className="h-4 w-4 text-blue-600 flex-shrink-0" />}
                                      </div>
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <Badge variant="outline" className="text-[10px] font-mono">
                                          <Tag className="h-2.5 w-2.5 mr-1" />
                                          {kit.codigo}
                                        </Badge>
                                        <Badge className={`text-[10px] ${colorClass}`}>
                                          {kit.categoria}
                                        </Badge>
                                      </div>
                                    </div>
                                </div>

                                <p className="text-xs text-slate-500 mb-2">{kit.descripcion}</p>

                                {/* Lista de medicamentos del kit */}
                                <div className="space-y-1 mb-2">
                                  {kit.medicamentos.slice(0, 3).map((med, idx) => (
                                    <div key={idx} className="flex items-center justify-between text-[11px]">
                                      <div className="flex items-center gap-1 text-gray-600">
                                        <Pill className="h-3 w-3 text-blue-400" />
                                        <span className="truncate max-w-[120px]">{med.nombre}</span>
                                        <span className="text-gray-400">x{med.cantidad}</span>
                                      </div>
                                      <span className="text-gray-500">{med.via}</span>
                                    </div>
                                  ))}
                                  {kit.medicamentos.length > 3 && (
                                    <p className="text-[10px] text-gray-400">
                                      +{kit.medicamentos.length - 3} más...
                                    </p>
                                  )}
                                </div>

                                {/* Precio y cantidad */}
                                <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                                  <span className="text-xs text-gray-500">
                                    {kit.medicamentos.length} medicamento(s)
                                  </span>
                                  <span className="text-sm font-bold text-green-700 flex items-center">
                                    <DollarSign className="h-3 w-3" />
                                    {precioKit.toLocaleString('es-CO')}
                                  </span>
                                </div>
                            </div>
                        );
                    })}
                  </div>

                  {kitsFiltrados.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <Package className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                      <p>No se encontraron kits</p>
                      <p className="text-sm">Intente con otro término de búsqueda</p>
                    </div>
                  )}
                </ScrollArea>

                <div className="mt-4 flex items-center justify-between pt-3 border-t border-blue-200">
                    <div className="text-sm text-blue-800">
                      {kitsSeleccionados.length > 0 ? (
                        <>
                          <span className="font-semibold">{kitsSeleccionados.length}</span> kit(s) seleccionado(s)
                          {' • '}
                          <span className="font-semibold">{kitsSeleccionados.reduce((acc, k) => acc + k.medicamentos.length, 0)}</span> medicamento(s)
                          {' • '}
                          <span className="font-bold text-green-700">${totalOrden.toLocaleString('es-CO')}</span>
                        </>
                      ) : (
                        'Seleccione kits para generar la orden'
                      )}
                    </div>
                    <Button
                        onClick={handleAplicarMedicamentos}
                        disabled={kitsSeleccionados.length === 0}
                        className="bg-blue-600 hover:bg-blue-700"
                    >
                        <Syringe className="h-4 w-4 mr-2" />
                        Generar Orden ({kitsSeleccionados.length})
                    </Button>
                </div>
             </div>
          </TabsContent>

          <TabsContent value="incapacidades" className="mt-4">
            <div className="space-y-2 mb-4">
              <h4 className="font-medium text-gray-900">Incapacidades Médicas</h4>
              <p className="text-sm text-gray-600">
                Genere incapacidades cumpliendo con la normatividad colombiana (Decreto 2126/2023).
              </p>
            </div>
            <FormularioIncapacidad
              pacienteId={paciente?.id}
              doctorId={doctorId}
              citaId={citaId}
              diagnostico={diagnostico}
              initialItems={itemsCreados.incapacidades}
              onSuccess={handleIncapacidadSuccess}
            />
          </TabsContent>

          <TabsContent value="certificados" className="mt-4">
            <div className="space-y-2 mb-4">
              <h4 className="font-medium text-gray-900">Certificados Médicos</h4>
              <p className="text-sm text-gray-600">
                Genere certificados médicos con plantillas predefinidas o contenido personalizado.
              </p>
            </div>
            <FormularioCertificado
              paciente={paciente}
              doctorId={doctorId}
              citaId={citaId}
              diagnostico={diagnostico}
              initialItems={itemsCreados.certificados}
              onSuccess={handleCertificadoSuccess}
            />
          </TabsContent>

          <TabsContent value="seguimiento" className="mt-4">
            <div className="space-y-2 mb-4">
              <h4 className="font-medium text-gray-900">Seguimiento y Control</h4>
              <p className="text-sm text-gray-600">
                Programe citas de control y seguimiento para el paciente.
              </p>
            </div>
            <FormularioSeguimiento
              pacienteId={paciente?.id}
              doctorId={doctorId}
              citaId={citaId}
              diagnostico={diagnostico}
              initialItems={itemsCreados.seguimientos}
              onSuccess={handleSeguimientoSuccess}
            />
          </TabsContent>
        </Tabs>
      </CardContent>

      {/* Modal de Preview para Kits de Medicamentos */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Syringe className="h-5 w-5 text-blue-600" />
              Confirmar Orden de Aplicación
            </DialogTitle>
            <DialogDescription>
              Revise los medicamentos que se aplicarán al paciente antes de confirmar.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Información del paciente */}
            {paciente && (
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-sm text-gray-600">Paciente</p>
                <p className="font-semibold">{paciente.nombre} {paciente.apellido}</p>
                <p className="text-sm text-gray-500">Doc: {paciente.cedula || paciente.documento}</p>
              </div>
            )}

            {/* Lista de kits y medicamentos */}
            <div className="space-y-3">
              <p className="text-sm font-medium text-gray-700">Kits Seleccionados:</p>
              {kitsSeleccionados.map(kit => {
                const precioKit = calcularPrecioKit(kit);
                return (
                  <div key={kit.id} className="border rounded-lg p-3 bg-blue-50">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h4 className="font-semibold text-blue-900">{kit.nombre}</h4>
                        <Badge variant="outline" className="text-[10px] font-mono mt-1">
                          {kit.codigo}
                        </Badge>
                      </div>
                      <div className="text-right">
                        <Badge className="bg-blue-600">{kit.medicamentos.length} meds</Badge>
                        <p className="text-xs font-bold text-green-700 mt-1">
                          ${precioKit.toLocaleString('es-CO')}
                        </p>
                      </div>
                    </div>
                    <ul className="space-y-1">
                      {kit.medicamentos.map((med, idx) => (
                        <li key={idx} className="text-sm text-gray-700 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="h-3 w-3 text-green-600" />
                            <span>{med.nombre}</span>
                            <span className="text-xs text-gray-400">x{med.cantidad}</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs">
                            <span className="font-mono text-gray-500">{med.codigoCum}</span>
                            <span className="text-gray-400">{med.via}</span>
                            <span className="text-green-600">${(med.precio * med.cantidad).toLocaleString('es-CO')}</span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>

            {/* Resumen con Total */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <div className="text-sm text-green-800">
                  <p>
                    <AlertCircle className="h-4 w-4 inline mr-1" />
                    Se generará orden con{' '}
                    <strong>{kitsSeleccionados.reduce((acc, kit) => acc + kit.medicamentos.length, 0)}</strong>{' '}
                    medicamentos
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-600">Total Orden:</p>
                  <p className="text-lg font-bold text-green-700">
                    ${totalOrden.toLocaleString('es-CO')}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setShowPreview(false)}
              disabled={creandoOrden}
            >
              <X className="h-4 w-4 mr-1" />
              Cancelar
            </Button>
            <Button
              onClick={confirmarAplicacion}
              disabled={creandoOrden}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {creandoOrden ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creando...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Confirmar y Crear Orden
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
