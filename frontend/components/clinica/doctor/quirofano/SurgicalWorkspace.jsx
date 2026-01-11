'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  Play, Square, CheckCircle, Clock, Users, Package, 
  FileText, ArrowLeft, Save, AlertTriangle, PenTool
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { procedimientoService } from '@/services/procedimiento.service';
import { quirofanoService } from '@/services/quirofano.service';
import SurgicalProtocolForm from './SurgicalProtocolForm';
import FirmaDigitalPad from '../../calidad2/historia-clinica/consentimientos/FirmaDigitalPad';
import CatalogSearch from '@/components/ui/CatalogSearch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

export default function SurgicalWorkspace({ procedure, onClose, onUpdate }) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('preop');
  const [status, setStatus] = useState(procedure.estado); // Programado, EnProceso, Completado
  const [loading, setLoading] = useState(false);
  
  // Timer State
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const timerRef = useRef(null);

  // Data State
  const [team, setTeam] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [protocolData, setProtocolData] = useState({
    hallazgos: '',
    descripcion: '',
    complicaciones: '',
    sangrado: '',
    recuento: 'Completo',
    muestras: ''
  });
  const [signature, setSignature] = useState(null);

  // Load staff for team selection
  const [availableStaff, setAvailableStaff] = useState({ medicos: [], enfermeros: [] });

  useEffect(() => {
    loadStaff();
    if (procedure.estado === 'EnProceso') {
      startTimer();
    }
    return () => stopTimer();
  }, []);

  const loadStaff = async () => {
    try {
      const res = await quirofanoService.getPersonal();
      if (res.success) {
        setAvailableStaff(res.data);
      }
    } catch (error) {
      console.error('Error loading staff:', error);
    }
  };

  const startTimer = () => {
    if (timerRef.current) return;
    const startTime = new Date(procedure.inicioReal || new Date()).getTime();
    timerRef.current = setInterval(() => {
      const now = new Date().getTime();
      setElapsedSeconds(Math.floor((now - startTime) / 1000));
    }, 1000);
  };

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleStartSurgery = async () => {
    if (!confirm('¿Iniciar procedimiento quirúrgico? Esto registrará la hora de inicio.')) return;
    
    setLoading(true);
    try {
      const res = await procedimientoService.iniciar(procedure.id);
      if (res.success) {
        setStatus('EnProceso');
        startTimer();
        toast({ title: 'Cirugía Iniciada', description: 'El cronómetro ha comenzado.' });
        setActiveTab('intraop');
        if (onUpdate) onUpdate();
      }
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'No se pudo iniciar la cirugía.' });
    } finally {
      setLoading(false);
    }
  };

  const handleFinishSurgery = async () => {
    if (!protocolData.descripcion || !protocolData.hallazgos) {
      toast({ variant: 'destructive', title: 'Protocolo Incompleto', description: 'Debe completar la descripción y hallazgos antes de finalizar.' });
      setActiveTab('postop');
      return;
    }

    if (!signature) {
      toast({ variant: 'destructive', title: 'Firma Requerida', description: 'Debe firmar el protocolo antes de finalizar.' });
      setActiveTab('postop');
      return;
    }

    if (!confirm('¿Finalizar cirugía? Se generará el reporte final y no podrá editarse.')) return;

    setLoading(true);
    try {
      const payload = {
        observaciones: protocolData.descripcion, 
        resultados: protocolData.hallazgos,
        complicaciones: protocolData.complicaciones,
        firma: signature // Enviar firma al backend
      };

      const res = await procedimientoService.completar(procedure.id, payload);
      if (res.success) {
        setStatus('Completado');
        stopTimer();
        toast({ title: 'Cirugía Finalizada', description: 'El protocolo ha sido guardado.' });
        if (onUpdate) onUpdate();
        setTimeout(onClose, 2000);
      }
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'No se pudo finalizar la cirugía.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <header className="bg-slate-900 text-white p-4 shadow-md">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={onClose} className="text-slate-300 hover:text-white">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold">{procedure.nombre}</h1>
              <div className="flex items-center gap-3 text-sm text-slate-300">
                <span>{procedure.paciente?.nombre} {procedure.paciente?.apellido}</span>
                <span>•</span>
                <span>{procedure.quirofano?.nombre}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex flex-col items-end">
              <span className="text-xs text-slate-400 uppercase tracking-wider">Tiempo Quirúrgico</span>
              <div className="font-mono text-2xl font-bold text-green-400">
                {formatTime(elapsedSeconds)}
              </div>
            </div>

            {status === 'Programado' && (
              <Button onClick={handleStartSurgery} disabled={loading} className="bg-green-600 hover:bg-green-700">
                <Play className="h-4 w-4 mr-2" />
                Iniciar Cirugía
              </Button>
            )}
            
            {status === 'EnProceso' && (
              <Button onClick={handleFinishSurgery} disabled={loading} className="bg-red-600 hover:bg-red-700">
                <Square className="h-4 w-4 mr-2" />
                Finalizar Cirugía
              </Button>
            )}

            {status === 'Completado' && (
              <Badge className="bg-blue-500 text-white px-3 py-1">
                <CheckCircle className="h-4 w-4 mr-2" />
                Finalizado
              </Badge>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-6">
        <div className="max-w-5xl mx-auto">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-3 bg-white p-1 rounded-xl border shadow-sm">
              <TabsTrigger value="preop" className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700">
                1. Pre-operatorio
              </TabsTrigger>
              <TabsTrigger value="intraop" className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700">
                2. Intra-operatorio
              </TabsTrigger>
              <TabsTrigger value="postop" className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700">
                3. Post-operatorio
              </TabsTrigger>
            </TabsList>

            {/* PRE-OP CONTENT */}
            <TabsContent value="preop" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    Lista de Verificación de Seguridad (Time-Out)
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {['Identidad del paciente confirmada', 'Sitio quirúrgico marcado', 'Consentimiento informado firmado', 'Evaluación de anestesia completa', 'Equipo de monitoreo funcional'].map((item, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 border rounded-lg hover:bg-slate-50">
                      <input type="checkbox" className="h-5 w-5 text-blue-600 rounded" />
                      <label className="text-sm font-medium text-gray-700">{item}</label>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-blue-600" />
                    Equipo Quirúrgico
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Cirujano Principal</Label>
                      <Input value={procedure.medicoResponsable?.nombre || 'Dr. Actual'} disabled />
                    </div>
                    <div className="space-y-2">
                      <Label>Anestesiólogo</Label>
                      <Input placeholder="Nombre del anestesiólogo" />
                    </div>
                    <div className="space-y-2">
                      <Label>Instrumentador(a)</Label>
                      <Input placeholder="Nombre del instrumentador" />
                    </div>
                    <div className="space-y-2">
                      <Label>Circulante</Label>
                      <Input placeholder="Nombre del circulante" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* INTRA-OP CONTENT */}
            <TabsContent value="intraop" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Package className="h-5 w-5 text-amber-600" />
                      Registro de Materiales
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-sm">Buscar Producto</Label>
                      <CatalogSearch 
                        type="CUPS" // O usar un endpoint de productos si existiera
                        placeholder="Buscar insumos, suturas, medicamentos..."
                        onSelect={(item) => {
                          setMaterials([...materials, { name: item.descripcion, code: item.codigo, time: new Date() }]);
                          toast({ title: 'Material Agregado', description: item.descripcion });
                        }}
                      />
                    </div>
                    <div className="border rounded-md divide-y max-h-[200px] overflow-y-auto mt-2">
                      {materials.length === 0 ? (
                        <p className="p-4 text-center text-sm text-gray-500">No hay materiales registrados</p>
                      ) : (
                        materials.map((m, i) => (
                          <div key={i} className="p-2 text-sm flex justify-between">
                            <div>
                              <span className="font-medium block">{m.name}</span>
                              <span className="text-xs text-gray-400 font-mono">{m.code}</span>
                            </div>
                            <span className="text-gray-400 text-xs">{m.time.toLocaleTimeString()}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-red-600" />
                      Incidentes / Eventos
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Textarea placeholder="Registrar cualquier evento adverso o incidente durante la cirugía..." className="h-[200px]" />
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* POST-OP CONTENT */}
            <TabsContent value="postop" className="space-y-6">
               <SurgicalProtocolForm 
                 data={protocolData}
                 onChange={setProtocolData}
                 readOnly={status === 'Completado'}
               />

               {status !== 'Completado' && (
                 <div className="space-y-4 border-t pt-4">
                   <h3 className="text-lg font-semibold flex items-center gap-2">
                     <PenTool className="h-5 w-5 text-blue-600" />
                     Firma del Cirujano
                   </h3>
                   <div className="max-w-md">
                     <FirmaDigitalPad 
                        label="Cirujano Principal"
                        onSave={setSignature}
                     />
                   </div>
                 </div>
               )}
               
               <div className="flex justify-end pt-4">
                 {status !== 'Completado' && (
                    <Button onClick={handleFinishSurgery} className="bg-blue-600 hover:bg-blue-700 w-full md:w-auto">
                      <Save className="h-4 w-4 mr-2" />
                      Guardar y Finalizar Protocolo
                    </Button>
                 )}
               </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
