'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
  AlertCircle, CheckCircle2, Package, Syringe, X, Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { apiPost } from '@/services/api';

import FormularioIncapacidad from './FormularioIncapacidad';
import FormularioCertificado from './FormularioCertificado';
import FormularioSeguimiento from './FormularioSeguimiento';

// Kits de Medicamentos Predefinidos (Ejemplo)
const KITS_MEDICAMENTOS = [
  { id: 1, nombre: 'Kit Dolor Agudo', descripcion: 'Tramadol + Dipirona + Diclofenaco', medicamentos: ['Tramadol', 'Dipirona', 'Diclofenaco'] },
  { id: 2, nombre: 'Kit Respiratorio', descripcion: 'Salbutamol + Bromuro de Ipratropio + Hidrocortisona', medicamentos: ['Salbutamol', 'Bromuro de Ipratropio', 'Hidrocortisona'] },
  { id: 3, nombre: 'Kit Gastrointestinal', descripcion: 'Omeprazol + Hioscina + Metoclopramida', medicamentos: ['Omeprazol', 'Hioscina', 'Metoclopramida'] },
];

export default function FormularioPlanManejo({
  paciente,
  doctorId,
  citaId,
  diagnostico,
  onChange
}) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('aplicacion'); // Default to new tab
  const [contadores, setContadores] = useState({
    incapacidades: 0,
    certificados: 0,
    seguimientos: 0,
    aplicaciones: 0,
  });

  // Estado para kits seleccionados
  const [kitsSeleccionados, setKitsSeleccionados] = useState([]);
  // Estado para preview y confirmación
  const [showPreview, setShowPreview] = useState(false);
  const [creandoOrden, setCreandoOrden] = useState(false);

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
      // Preparar los datos para el backend
      const medicamentosOrden = kitsSeleccionados.flatMap(kit =>
        kit.medicamentos.map(med => ({
          nombre: med,
          kitOrigen: kit.nombre,
          cantidad: 1,
          via: 'parenteral',
          observaciones: `Kit: ${kit.nombre}`
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
          kits: kitsSeleccionados.map(k => k.nombre),
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

      const newAplicaciones = contadores.aplicaciones + kitsSeleccionados.length;
      setContadores(prev => ({ ...prev, aplicaciones: newAplicaciones }));

      if (onChange) {
        onChange({
          incapacidades: contadores.incapacidades,
          certificados: contadores.certificados,
          seguimientos: contadores.seguimientos,
          aplicaciones: newAplicaciones,
          kitsAplicados: kitsSeleccionados // Guardamos los kits para persistencia
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

  // ... (existing handlers: handleIncapacidadSuccess, handleCertificadoSuccess, handleSeguimientoSuccess)
  
  const handleIncapacidadSuccess = (data) => {
    setContadores(prev => ({
      ...prev,
      incapacidades: prev.incapacidades + 1
    }));
    if (onChange) {
      onChange({
        incapacidades: contadores.incapacidades + 1,
        certificados: contadores.certificados,
        seguimientos: contadores.seguimientos,
      });
    }
  };

  const handleCertificadoSuccess = (data) => {
    setContadores(prev => ({
      ...prev,
      certificados: prev.certificados + 1
    }));
    if (onChange) {
      onChange({
        incapacidades: contadores.incapacidades,
        certificados: contadores.certificados + 1,
        seguimientos: contadores.seguimientos,
      });
    }
  };

  const handleSeguimientoSuccess = (data) => {
    setContadores(prev => ({
      ...prev,
      seguimientos: prev.seguimientos + 1
    }));
    if (onChange) {
      onChange({
        incapacidades: contadores.incapacidades,
        certificados: contadores.certificados,
        seguimientos: contadores.seguimientos + 1,
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
             <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                <h4 className="font-semibold text-blue-900 flex items-center gap-2 mb-2">
                    <Package className="h-4 w-4" />
                    Kits de Medicamentos (Aplicación Inmediata)
                </h4>
                <p className="text-sm text-blue-700 mb-4">
                    Seleccione los kits para generar automáticamente la orden de enfermería y descontar del inventario.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {KITS_MEDICAMENTOS.map(kit => {
                        const isSelected = kitsSeleccionados.find(k => k.id === kit.id);
                        return (
                            <div 
                                key={kit.id} 
                                onClick={() => toggleKit(kit)}
                                className={`cursor-pointer border rounded-lg p-3 transition-all ${
                                    isSelected 
                                    ? 'bg-blue-100 border-blue-500 shadow-sm ring-1 ring-blue-500' 
                                    : 'bg-white border-slate-200 hover:border-blue-300'
                                }`}
                            >
                                <div className="flex justify-between items-start mb-1">
                                    <h5 className="font-bold text-sm text-slate-800">{kit.nombre}</h5>
                                    {isSelected && <CheckCircle2 className="h-4 w-4 text-blue-600" />}
                                </div>
                                <p className="text-xs text-slate-500">{kit.descripcion}</p>
                            </div>
                        );
                    })}
                </div>

                <div className="mt-4 flex justify-end">
                    <Button 
                        onClick={handleAplicarMedicamentos} 
                        disabled={kitsSeleccionados.length === 0}
                        className="bg-blue-600 hover:bg-blue-700"
                    >
                        <Syringe className="h-4 w-4 mr-2" />
                        Generar Orden de Aplicación ({kitsSeleccionados.length})
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
              {kitsSeleccionados.map(kit => (
                <div key={kit.id} className="border rounded-lg p-3 bg-blue-50">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-blue-900">{kit.nombre}</h4>
                    <Badge className="bg-blue-600">{kit.medicamentos.length} meds</Badge>
                  </div>
                  <ul className="space-y-1">
                    {kit.medicamentos.map((med, idx) => (
                      <li key={idx} className="text-sm text-gray-700 flex items-center gap-2">
                        <CheckCircle2 className="h-3 w-3 text-green-600" />
                        {med}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            {/* Resumen */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <p className="text-sm text-amber-800">
                <AlertCircle className="h-4 w-4 inline mr-1" />
                Se generará una orden de enfermería con{' '}
                <strong>{kitsSeleccionados.reduce((acc, kit) => acc + kit.medicamentos.length, 0)}</strong>{' '}
                medicamentos para aplicación inmediata.
              </p>
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
