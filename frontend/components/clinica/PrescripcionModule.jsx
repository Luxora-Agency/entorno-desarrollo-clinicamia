'use client';

import { useState } from 'react';
import { getTodayColombia, formatDateISO } from '@/services/formatters';
import { 
  Search, Plus, AlertTriangle, CheckCircle, Clock, Calendar,
  Pill, Calculator, Activity, User, FileText, Eye, Edit, Trash2,
  AlertCircle, X, ChevronDown, Filter, Download, Settings
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default function PrescripcionModule({ user, pacienteId, citaId }) {
  const [activeTab, setActiveTab] = useState('activas');
  const [showNuevaPrescripcion, setShowNuevaPrescripcion] = useState(false);
  const [searchMedicamento, setSearchMedicamento] = useState('');
  const [medicamentoSeleccionado, setMedicamentoSeleccionado] = useState(null);
  const [showAlertasInteraccion, setShowAlertasInteraccion] = useState(false);
  const [prescripcionEnEdicion, setPrescripcionEnEdicion] = useState(null);

  // Datos mock del paciente
  const pacienteMock = {
    id: '1',
    nombre: 'María González',
    edad: 45,
    peso: 68.5,
    alergias: ['Penicilina', 'Sulfonamidas'],
    funcionRenal: 'Normal',
    funcionHepatica: 'Normal',
  };

  // Catálogo de medicamentos mock
  const catalogoMedicamentos = [
    {
      id: '1',
      nombre: 'Paracetamol',
      nombreComercial: 'Acetaminofén',
      principioActivo: 'Paracetamol',
      concentracion: '500mg',
      presentacion: 'Tabletas',
      vias: ['Oral', 'IV'],
      dosisAdulto: '500-1000mg cada 6-8h',
      dosisMax: '4000mg/día',
      stock: 450,
      categoria: 'Analgésicos',
      requiereReceta: false,
    },
    {
      id: '2',
      nombre: 'Amoxicilina',
      nombreComercial: 'Amoxil',
      principioActivo: 'Amoxicilina',
      concentracion: '500mg',
      presentacion: 'Cápsulas',
      vias: ['Oral'],
      dosisAdulto: '500mg cada 8h',
      dosisMax: '3000mg/día',
      stock: 85,
      categoria: 'Antibióticos',
      requiereReceta: true,
      interacciones: ['Anticoagulantes', 'Metrotexato'],
    },
    {
      id: '3',
      nombre: 'Losartán',
      nombreComercial: 'Cozaar',
      principioActivo: 'Losartán',
      concentracion: '50mg',
      presentacion: 'Tabletas',
      vias: ['Oral'],
      dosisAdulto: '50mg cada 24h',
      dosisMax: '100mg/día',
      stock: 320,
      categoria: 'Antihipertensivos',
      requiereReceta: true,
    },
    {
      id: '4',
      nombre: 'Metformina',
      nombreComercial: 'Glucophage',
      principioActivo: 'Metformina',
      concentracion: '850mg',
      presentacion: 'Tabletas',
      vias: ['Oral'],
      dosisAdulto: '850mg cada 12h',
      dosisMax: '2550mg/día',
      stock: 680,
      categoria: 'Antidiabéticos',
      requiereReceta: true,
      contraindicaciones: ['Insuficiencia renal', 'Insuficiencia hepática'],
    },
    {
      id: '5',
      nombre: 'Omeprazol',
      nombreComercial: 'Losec',
      principioActivo: 'Omeprazol',
      concentracion: '20mg',
      presentacion: 'Cápsulas',
      vias: ['Oral', 'IV'],
      dosisAdulto: '20mg cada 24h',
      dosisMax: '80mg/día',
      stock: 510,
      categoria: 'Antiulcerosos',
      requiereReceta: false,
    },
  ];

  // Prescripciones activas mock
  const [prescripcionesActivas, setPrescripcionesActivas] = useState([
    {
      id: '1',
      medicamento: 'Paracetamol 500mg',
      dosis: '500mg',
      frecuencia: 'Cada 8 horas',
      via: 'Oral',
      duracion: '5 días',
      fechaInicio: '2025-01-10',
      fechaFin: '2025-01-15',
      estado: 'Activa',
      indicaciones: 'Administrar con alimentos',
      prescriptor: 'Dr. Carlos Rodríguez',
      administradas: 8,
      total: 15,
    },
    {
      id: '2',
      medicamento: 'Omeprazol 20mg',
      dosis: '20mg',
      frecuencia: 'Cada 24 horas',
      via: 'Oral',
      duracion: '7 días',
      fechaInicio: '2025-01-10',
      fechaFin: '2025-01-17',
      estado: 'Activa',
      indicaciones: 'En ayunas, 30 minutos antes del desayuno',
      prescriptor: 'Dr. Carlos Rodríguez',
      administradas: 3,
      total: 7,
    },
  ]);

  // Historial de prescripciones
  const historialPrescripciones = [
    {
      id: '3',
      medicamento: 'Amoxicilina 500mg',
      dosis: '500mg',
      frecuencia: 'Cada 8 horas',
      via: 'Oral',
      duracion: '7 días',
      fechaInicio: '2025-01-01',
      fechaFin: '2025-01-07',
      estado: 'Completada',
      prescriptor: 'Dr. Carlos Rodríguez',
    },
    {
      id: '4',
      medicamento: 'Losartán 50mg',
      dosis: '50mg',
      frecuencia: 'Cada 24 horas',
      via: 'Oral',
      duracion: '30 días',
      fechaInicio: '2024-12-15',
      fechaFin: '2025-01-08',
      estado: 'Suspendida',
      motivoSuspension: 'Cambio de tratamiento por efectos adversos',
      prescriptor: 'Dra. Ana Martínez',
    },
  ];

  // Calcular dosis automática (mock)
  const calcularDosis = (medicamento, peso) => {
    // Simulación de cálculo
    if (medicamento.nombre === 'Paracetamol') {
      const dosisPorKg = 10; // mg/kg
      const dosisCalculada = peso * dosisPorKg;
      return {
        dosis: dosisCalculada,
        unidad: 'mg',
        frecuencia: 'Cada 6-8 horas',
        dosisMax: peso * 60, // 60mg/kg/día
      };
    }
    return null;
  };

  // Verificar interacciones (mock)
  const verificarInteracciones = (nuevoMedicamento) => {
    const alertas = [];
    
    // Verificar alergias
    if (nuevoMedicamento.principioActivo === 'Amoxicilina' && 
        pacienteMock.alergias.includes('Penicilina')) {
      alertas.push({
        tipo: 'CRÍTICO',
        mensaje: '⚠️ ALERTA CRÍTICA: Paciente alérgico a Penicilina',
        detalle: 'La Amoxicilina es un antibiótico betalactámico que puede causar reacción cruzada',
      });
    }

    // Verificar interacciones con medicamentos activos
    prescripcionesActivas.forEach(presc => {
      if (nuevoMedicamento.interacciones?.includes(presc.medicamento.split(' ')[0])) {
        alertas.push({
          tipo: 'ADVERTENCIA',
          mensaje: `⚠️ Posible interacción con ${presc.medicamento}`,
          detalle: 'Se recomienda monitoreo adicional',
        });
      }
    });

    // Verificar contraindicaciones
    if (nuevoMedicamento.contraindicaciones) {
      if (pacienteMock.funcionRenal !== 'Normal' && 
          nuevoMedicamento.contraindicaciones.includes('Insuficiencia renal')) {
        alertas.push({
          tipo: 'ADVERTENCIA',
          mensaje: '⚠️ Contraindicación: Función renal alterada',
          detalle: 'Ajustar dosis según función renal',
        });
      }
    }

    // Verificar disponibilidad
    if (nuevoMedicamento.stock < 30) {
      alertas.push({
        tipo: 'INFO',
        mensaje: `ℹ️ Stock bajo: ${nuevoMedicamento.stock} unidades`,
        detalle: 'Considerar medicamento alternativo',
      });
    }

    return alertas;
  };

  const medicamentosFiltrados = catalogoMedicamentos.filter(med =>
    med.nombre.toLowerCase().includes(searchMedicamento.toLowerCase()) ||
    med.nombreComercial.toLowerCase().includes(searchMedicamento.toLowerCase()) ||
    med.principioActivo.toLowerCase().includes(searchMedicamento.toLowerCase())
  );

  const seleccionarMedicamento = (med) => {
    setMedicamentoSeleccionado(med);
    const alertas = verificarInteracciones(med);
    if (alertas.length > 0) {
      setShowAlertasInteraccion(true);
    }
  };

  const agregarPrescripcion = (datos) => {
    const nueva = {
      id: Date.now().toString(),
      medicamento: `${medicamentoSeleccionado.nombre} ${medicamentoSeleccionado.concentracion}`,
      ...datos,
      estado: 'Activa',
      prescriptor: `${user.nombre} ${user.apellido}`,
      administradas: 0,
      total: datos.duracion * (24 / parseInt(datos.frecuencia)),
      fechaInicio: getTodayColombia(),
    };

    setPrescripcionesActivas([...prescripcionesActivas, nueva]);
    setShowNuevaPrescripcion(false);
    setMedicamentoSeleccionado(null);
    setSearchMedicamento('');
  };

  const getEstadoBadge = (estado) => {
    const estilos = {
      Activa: 'bg-green-100 text-green-700 border-green-300',
      Completada: 'bg-gray-100 text-gray-700 border-gray-300',
      Suspendida: 'bg-red-100 text-red-700 border-red-300',
    };
    return (
      <Badge variant="outline" className={estilos[estado] || 'bg-gray-100'}>
        {estado}
      </Badge>
    );
  };

  return (
    <div className="p-6 space-y-6 bg-background">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <Pill className="h-8 w-8 text-blue-600" />
            Prescripción Médica
          </h1>
          <p className="text-muted-foreground mt-1">
            Gestión integral de medicamentos
          </p>
        </div>
        <Button
          onClick={() => setShowNuevaPrescripcion(true)}
          className="gap-2 bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          Nueva Prescripción
        </Button>
      </div>

      {/* Info del Paciente */}
      <Card className="border-2 border-blue-200 bg-blue-50/50">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <Label className="text-xs text-gray-600">Paciente</Label>
              <p className="font-semibold">{pacienteMock.nombre}</p>
            </div>
            <div>
              <Label className="text-xs text-gray-600">Edad</Label>
              <p className="font-semibold">{pacienteMock.edad} años</p>
            </div>
            <div>
              <Label className="text-xs text-gray-600">Peso</Label>
              <p className="font-semibold">{pacienteMock.peso} kg</p>
            </div>
            <div>
              <Label className="text-xs text-gray-600">Alergias</Label>
              <div className="flex gap-1 flex-wrap">
                {pacienteMock.alergias.map((alergia, idx) => (
                  <Badge key={idx} variant="outline" className="bg-red-100 text-red-700 border-red-300 text-xs">
                    {alergia}
                  </Badge>
                ))}
              </div>
            </div>
            <div>
              <Label className="text-xs text-gray-600">Función Renal</Label>
              <p className="font-semibold text-green-600">{pacienteMock.funcionRenal}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="activas" className="gap-2">
            <Activity className="h-4 w-4" />
            Prescripciones Activas ({prescripcionesActivas.length})
          </TabsTrigger>
          <TabsTrigger value="historial" className="gap-2">
            <Clock className="h-4 w-4" />
            Historial
          </TabsTrigger>
        </TabsList>

        {/* Prescripciones Activas */}
        <TabsContent value="activas" className="space-y-4 mt-4">
          {prescripcionesActivas.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Pill className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">No hay prescripciones activas</p>
                <Button
                  onClick={() => setShowNuevaPrescripcion(true)}
                  className="mt-4 gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Crear Primera Prescripción
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {prescripcionesActivas.map((presc) => (
                <Card key={presc.id} className="border-l-4 border-l-green-500">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex-1 space-y-3">
                        {/* Medicamento */}
                        <div className="flex items-center gap-3">
                          <Pill className="h-5 w-5 text-blue-600" />
                          <div>
                            <h3 className="font-bold text-lg">{presc.medicamento}</h3>
                            <p className="text-sm text-gray-600">
                              {presc.dosis} - {presc.frecuencia} - {presc.via}
                            </p>
                          </div>
                          {getEstadoBadge(presc.estado)}
                        </div>

                        {/* Detalles */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <Label className="text-xs text-gray-500">Duración</Label>
                            <p className="font-medium">{presc.duracion}</p>
                          </div>
                          <div>
                            <Label className="text-xs text-gray-500">Inicio</Label>
                            <p className="font-medium">{presc.fechaInicio}</p>
                          </div>
                          <div>
                            <Label className="text-xs text-gray-500">Fin</Label>
                            <p className="font-medium">{presc.fechaFin}</p>
                          </div>
                          <div>
                            <Label className="text-xs text-gray-500">Progreso</Label>
                            <p className="font-medium">
                              {presc.administradas}/{presc.total} dosis
                            </p>
                            <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                              <div
                                className="bg-green-600 h-2 rounded-full"
                                style={{ width: `${(presc.administradas / presc.total) * 100}%` }}
                              />
                            </div>
                          </div>
                        </div>

                        {/* Indicaciones */}
                        {presc.indicaciones && (
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                            <p className="text-sm">
                              <span className="font-semibold text-blue-900">Indicaciones:</span>{' '}
                              <span className="text-blue-800">{presc.indicaciones}</span>
                            </p>
                          </div>
                        )}

                        {/* Prescriptor */}
                        <div className="text-xs text-gray-500">
                          Prescrito por: <span className="font-medium">{presc.prescriptor}</span>
                        </div>
                      </div>

                      {/* Acciones */}
                      <div className="flex flex-col gap-2">
                        <Button size="sm" variant="outline" className="gap-2">
                          <Eye className="h-4 w-4" />
                          Ver
                        </Button>
                        <Button size="sm" variant="outline" className="gap-2">
                          <Edit className="h-4 w-4" />
                          Editar
                        </Button>
                        <Button size="sm" variant="outline" className="gap-2 text-red-600 hover:text-red-700">
                          <X className="h-4 w-4" />
                          Suspender
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Historial */}
        <TabsContent value="historial" className="mt-4">
          <Card>
            <CardContent className="p-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Medicamento</TableHead>
                    <TableHead>Dosis</TableHead>
                    <TableHead>Período</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Prescriptor</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {historialPrescripciones.map((presc) => (
                    <TableRow key={presc.id}>
                      <TableCell className="font-medium">{presc.medicamento}</TableCell>
                      <TableCell>{presc.dosis} - {presc.frecuencia}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <p>{presc.fechaInicio} al {presc.fechaFin}</p>
                          <p className="text-gray-500">{presc.duracion}</p>
                        </div>
                      </TableCell>
                      <TableCell>{getEstadoBadge(presc.estado)}</TableCell>
                      <TableCell>{presc.prescriptor}</TableCell>
                      <TableCell>
                        <Button size="sm" variant="ghost">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog: Nueva Prescripción */}
      <Dialog open={showNuevaPrescripcion} onOpenChange={setShowNuevaPrescripcion}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pill className="h-5 w-5" />
              Nueva Prescripción Médica
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Paso 1: Buscar Medicamento */}
            {!medicamentoSeleccionado && (
              <div className="space-y-4">
                <div>
                  <Label>Buscar Medicamento</Label>
                  <div className="relative mt-2">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                    <Input
                      placeholder="Buscar por nombre, principio activo o nombre comercial..."
                      value={searchMedicamento}
                      onChange={(e) => setSearchMedicamento(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                {/* Resultados de búsqueda */}
                {searchMedicamento && (
                  <div className="border rounded-lg max-h-96 overflow-y-auto">
                    {medicamentosFiltrados.length === 0 ? (
                      <div className="p-8 text-center text-gray-500">
                        No se encontraron medicamentos
                      </div>
                    ) : (
                      <div className="divide-y">
                        {medicamentosFiltrados.map((med) => (
                          <div
                            key={med.id}
                            className="p-4 hover:bg-gray-50 cursor-pointer transition"
                            onClick={() => seleccionarMedicamento(med)}
                          >
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <h4 className="font-semibold text-lg">{med.nombre}</h4>
                                <p className="text-sm text-gray-600">
                                  {med.nombreComercial} - {med.concentracion} {med.presentacion}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">
                                  Principio activo: {med.principioActivo}
                                </p>
                                <div className="flex gap-2 mt-2">
                                  <Badge variant="outline" className="text-xs">
                                    {med.categoria}
                                  </Badge>
                                  {med.requiereReceta && (
                                    <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-300 text-xs">
                                      Requiere receta
                                    </Badge>
                                  )}
                                  <Badge variant="outline" className={
                                    med.stock > 100 ? 'bg-green-50 text-green-700 border-green-300' :
                                    med.stock > 30 ? 'bg-yellow-50 text-yellow-700 border-yellow-300' :
                                    'bg-red-50 text-red-700 border-red-300'
                                  }>
                                    Stock: {med.stock}
                                  </Badge>
                                </div>
                              </div>
                              <Button size="sm" className="ml-4">
                                Seleccionar
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Paso 2: Configurar Prescripción */}
            {medicamentoSeleccionado && (
              <div className="space-y-4">
                {/* Medicamento seleccionado */}
                <Card className="bg-blue-50 border-blue-200">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-bold text-lg">{medicamentoSeleccionado.nombre}</h4>
                        <p className="text-sm text-gray-600">
                          {medicamentoSeleccionado.nombreComercial} - {medicamentoSeleccionado.concentracion}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Dosis adulto: {medicamentoSeleccionado.dosisAdulto}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setMedicamentoSeleccionado(null)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Calculadora de dosis */}
                <Card className="bg-purple-50 border-purple-200">
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Calculator className="h-4 w-4" />
                      Calculadora de Dosis Automática
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {(() => {
                      const dosisCalc = calcularDosis(medicamentoSeleccionado, pacienteMock.peso);
                      return dosisCalc ? (
                        <div className="space-y-2 text-sm">
                          <p>
                            <span className="font-semibold">Dosis calculada:</span> {dosisCalc.dosis}mg ({dosisCalc.frecuencia})
                          </p>
                          <p>
                            <span className="font-semibold">Dosis máxima diaria:</span> {dosisCalc.dosisMax}mg
                          </p>
                          <p className="text-xs text-gray-600">
                            * Basado en peso del paciente: {pacienteMock.peso}kg
                          </p>
                        </div>
                      ) : (
                        <p className="text-sm text-gray-600">
                          Cálculo automático no disponible para este medicamento
                        </p>
                      );
                    })()}
                  </CardContent>
                </Card>

                {/* Formulario de prescripción */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const formData = new FormData(e.target);
                    agregarPrescripcion({
                      dosis: formData.get('dosis'),
                      frecuencia: formData.get('frecuencia'),
                      via: formData.get('via'),
                      duracion: formData.get('duracion'),
                      indicaciones: formData.get('indicaciones'),
                    });
                  }}
                  className="space-y-4"
                >
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Dosis *</Label>
                      <Input
                        name="dosis"
                        placeholder="Ej: 500mg"
                        required
                        defaultValue={medicamentoSeleccionado.concentracion}
                      />
                    </div>
                    <div>
                      <Label>Frecuencia (horas) *</Label>
                      <Select name="frecuencia" required>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccione" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="4">Cada 4 horas</SelectItem>
                          <SelectItem value="6">Cada 6 horas</SelectItem>
                          <SelectItem value="8">Cada 8 horas</SelectItem>
                          <SelectItem value="12">Cada 12 horas</SelectItem>
                          <SelectItem value="24">Cada 24 horas</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Vía de Administración *</Label>
                      <Select name="via" required>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccione" />
                        </SelectTrigger>
                        <SelectContent>
                          {medicamentoSeleccionado.vias.map((via) => (
                            <SelectItem key={via} value={via}>
                              {via}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Duración (días) *</Label>
                      <Input
                        name="duracion"
                        type="number"
                        placeholder="Ej: 7"
                        min="1"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <Label>Indicaciones Especiales</Label>
                    <Textarea
                      name="indicaciones"
                      placeholder="Ej: Tomar con alimentos, en ayunas, etc."
                      rows={3}
                    />
                  </div>

                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setShowNuevaPrescripcion(false);
                        setMedicamentoSeleccionado(null);
                      }}
                    >
                      Cancelar
                    </Button>
                    <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                      Prescribir Medicamento
                    </Button>
                  </DialogFooter>
                </form>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog: Alertas de Interacción */}
      <Dialog open={showAlertasInteraccion} onOpenChange={setShowAlertasInteraccion}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-orange-600">
              <AlertTriangle className="h-5 w-5" />
              Alertas de Seguridad
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-4">
            {medicamentoSeleccionado && verificarInteracciones(medicamentoSeleccionado).map((alerta, idx) => (
              <div
                key={idx}
                className={`p-4 rounded-lg border-l-4 ${
                  alerta.tipo === 'CRÍTICO' ? 'bg-red-50 border-red-500' :
                  alerta.tipo === 'ADVERTENCIA' ? 'bg-orange-50 border-orange-500' :
                  'bg-blue-50 border-blue-500'
                }`}
              >
                <p className="font-semibold text-sm mb-1">{alerta.mensaje}</p>
                <p className="text-xs text-gray-700">{alerta.detalle}</p>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowAlertasInteraccion(false);
                setMedicamentoSeleccionado(null);
              }}
            >
              Cancelar Prescripción
            </Button>
            <Button onClick={() => setShowAlertasInteraccion(false)}>
              Continuar con Precaución
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
