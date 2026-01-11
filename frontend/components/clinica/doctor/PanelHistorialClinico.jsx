'use client';

import { useState, useEffect } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Activity,
  FileText,
  Pill,
  Heart,
  Clock,
  User,
  CheckCircle,
  AlertCircle,
  Loader2,
  ClipboardList,
  Stethoscope,
  ThermometerSun,
  TrendingUp,
  TrendingDown,
  Minus,
} from 'lucide-react';
import { apiGet } from '@/services/api';

// Formatear fecha
const formatFecha = (fecha) => {
  if (!fecha) return '--';
  return new Date(fecha).toLocaleDateString('es-CO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

// Componente de Timeline de Evoluciones
function TimelineEvoluciones({ evoluciones }) {
  const evolucionesArray = Array.isArray(evoluciones) ? evoluciones : [];

  if (evolucionesArray.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <FileText className="h-12 w-12 mx-auto text-gray-300 mb-2" />
        <p>No hay evoluciones registradas</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {evolucionesArray.map((evo, idx) => (
        <Card key={evo.id || idx} className="border-l-4 border-l-emerald-500">
          <CardContent className="p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  {evo.tipoEvolucion || 'Seguimiento'}
                </Badge>
                {evo.turno && (
                  <Badge variant="secondary" className="text-xs">
                    {evo.turno}
                  </Badge>
                )}
                {evo.firmada && (
                  <CheckCircle className="h-4 w-4 text-green-500" title="Firmada" />
                )}
              </div>
              <span className="text-xs text-gray-500">
                {formatFecha(evo.fechaEvolucion)}
              </span>
            </div>

            <div className="space-y-3 text-sm">
              {evo.subjetivo && (
                <div>
                  <span className="font-semibold text-blue-700">S:</span>
                  <p className="text-gray-700 ml-4">{evo.subjetivo}</p>
                </div>
              )}
              {evo.objetivo && (
                <div>
                  <span className="font-semibold text-green-700">O:</span>
                  <p className="text-gray-700 ml-4">{evo.objetivo}</p>
                </div>
              )}
              {evo.analisis && (
                <div>
                  <span className="font-semibold text-amber-700">A:</span>
                  <p className="text-gray-700 ml-4">{evo.analisis}</p>
                </div>
              )}
              {evo.plan && (
                <div>
                  <span className="font-semibold text-purple-700">P:</span>
                  <p className="text-gray-700 ml-4">{evo.plan}</p>
                </div>
              )}
            </div>

            {evo.doctor && (
              <div className="mt-3 pt-2 border-t flex items-center gap-2 text-xs text-gray-500">
                <User className="h-3 w-3" />
                Dr(a). {evo.doctor.nombre} {evo.doctor.apellido}
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// Componente de Notas de Enfermería
function NotasEnfermeria({ notas }) {
  const notasArray = Array.isArray(notas) ? notas : [];

  if (notasArray.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <ClipboardList className="h-12 w-12 mx-auto text-gray-300 mb-2" />
        <p>No hay notas de enfermería</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {notasArray.map((nota, idx) => (
        <Card key={nota.id || idx} className="border-l-4 border-l-pink-500">
          <CardContent className="p-3">
            <div className="flex items-center justify-between mb-2">
              <Badge variant="outline" className="text-xs">
                {nota.tipoNota || 'Nota'}
              </Badge>
              <span className="text-xs text-gray-500">
                {formatFecha(nota.createdAt)}
              </span>
            </div>
            {nota.titulo && (
              <p className="font-medium text-sm mb-1">{nota.titulo}</p>
            )}
            <p className="text-sm text-gray-700">{nota.contenido}</p>
            {nota.enfermera && (
              <p className="text-xs text-gray-500 mt-2">
                Enf. {nota.enfermera.nombre} {nota.enfermera.apellido}
              </p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// Componente de Signos Vitales
function SignosVitalesHistorial({ signos }) {
  const signosArray = Array.isArray(signos) ? signos : [];

  if (signosArray.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <Activity className="h-12 w-12 mx-auto text-gray-300 mb-2" />
        <p>No hay signos vitales registrados</p>
      </div>
    );
  }

  // Obtener tendencia
  const getTendencia = (actual, anterior) => {
    if (!anterior) return null;
    if (actual > anterior) return <TrendingUp className="h-3 w-3 text-red-500" />;
    if (actual < anterior) return <TrendingDown className="h-3 w-3 text-green-500" />;
    return <Minus className="h-3 w-3 text-gray-400" />;
  };

  return (
    <div className="space-y-3">
      {signosArray.slice(0, 10).map((sv, idx) => (
        <Card key={sv.id || idx}>
          <CardContent className="p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <ThermometerSun className="h-4 w-4 text-red-500" />
                <span className="text-sm font-medium">Signos Vitales</span>
                {sv.turno && (
                  <Badge variant="secondary" className="text-xs">{sv.turno}</Badge>
                )}
              </div>
              <span className="text-xs text-gray-500">
                {formatFecha(sv.fechaRegistro)}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-xs">
              {sv.temperatura && (
                <div className="flex items-center gap-1">
                  <span className="text-gray-500">T°:</span>
                  <span className={sv.temperatura > 38 ? 'text-red-600 font-medium' : ''}>
                    {sv.temperatura}°C
                  </span>
                </div>
              )}
              {(sv.presionSistolica || sv.presionDiastolica) && (
                <div className="flex items-center gap-1">
                  <span className="text-gray-500">PA:</span>
                  <span className={sv.presionSistolica > 140 ? 'text-red-600 font-medium' : ''}>
                    {sv.presionSistolica}/{sv.presionDiastolica}
                  </span>
                </div>
              )}
              {sv.frecuenciaCardiaca && (
                <div className="flex items-center gap-1">
                  <Heart className="h-3 w-3 text-red-500" />
                  <span>{sv.frecuenciaCardiaca} lpm</span>
                </div>
              )}
              {sv.frecuenciaRespiratoria && (
                <div className="flex items-center gap-1">
                  <span className="text-gray-500">FR:</span>
                  <span>{sv.frecuenciaRespiratoria} rpm</span>
                </div>
              )}
              {sv.saturacionOxigeno && (
                <div className="flex items-center gap-1">
                  <span className="text-gray-500">SatO2:</span>
                  <span className={sv.saturacionOxigeno < 92 ? 'text-red-600 font-medium' : ''}>
                    {sv.saturacionOxigeno}%
                  </span>
                </div>
              )}
              {sv.peso && (
                <div className="flex items-center gap-1">
                  <span className="text-gray-500">Peso:</span>
                  <span>{sv.peso} kg</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// Componente de Medicamentos/Prescripciones
function MedicamentosActivos({ prescripciones }) {
  const prescripcionesArray = Array.isArray(prescripciones) ? prescripciones : [];

  if (prescripcionesArray.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <Pill className="h-12 w-12 mx-auto text-gray-300 mb-2" />
        <p>No hay medicamentos activos</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {prescripcionesArray.map((rx, idx) => (
        <Card key={rx.id || idx} className="border-l-4 border-l-blue-500">
          <CardContent className="p-3">
            <div className="flex items-center justify-between mb-2">
              <Badge
                variant={rx.estado === 'Activa' ? 'default' : 'secondary'}
                className={rx.estado === 'Activa' ? 'bg-green-100 text-green-700' : ''}
              >
                {rx.estado}
              </Badge>
              <span className="text-xs text-gray-500">
                {formatFecha(rx.createdAt)}
              </span>
            </div>

            {rx.medicamentos?.map((med, midx) => (
              <div key={midx} className="text-sm py-1 border-b last:border-0">
                <p className="font-medium">{med.producto?.nombre || med.medicamento}</p>
                <p className="text-gray-500 text-xs">
                  {med.dosis} - {med.frecuencia} - {med.via}
                  {med.duracion && ` - ${med.duracion}`}
                </p>
              </div>
            ))}

            {rx.diagnostico && (
              <p className="text-xs text-gray-500 mt-2">
                Dx: {rx.diagnostico}
              </p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default function PanelHistorialClinico({
  open,
  onOpenChange,
  admision,
}) {
  const [activeTab, setActiveTab] = useState('evoluciones');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState({
    evoluciones: [],
    notas: [],
    signos: [],
    prescripciones: [],
    ordenes: [],
  });

  useEffect(() => {
    if (open && admision?.paciente?.id) {
      loadData();
    }
  }, [open, admision?.paciente?.id]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [evolucionesRes, notasRes, signosRes, prescripcionesRes, ordenesRes] = await Promise.all([
        apiGet(`/evoluciones?paciente_id=${admision.paciente.id}&admision_id=${admision.id}&limit=20`).catch(() => ({ data: [] })),
        apiGet(`/notas-enfermeria/admision/${admision.id}`).catch(() => ({ data: [] })),
        apiGet(`/signos-vitales?paciente_id=${admision.paciente.id}&limit=20`).catch(() => ({ data: [] })),
        apiGet(`/prescripciones?paciente_id=${admision.paciente.id}&estado=Activa`).catch(() => ({ data: [] })),
        apiGet(`/ordenes-medicas?admision_id=${admision.id}`).catch(() => ({ data: [] })),
      ]);

      setData({
        evoluciones: evolucionesRes.data?.data || evolucionesRes.data || [],
        notas: notasRes.data?.data || notasRes.data || [],
        signos: signosRes.data?.data || signosRes.data || [],
        prescripciones: prescripcionesRes.data?.data || prescripcionesRes.data || [],
        ordenes: ordenesRes.data?.data || ordenesRes.data || [],
      });
    } catch (error) {
      console.error('Error loading patient history:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!admision) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-xl overflow-hidden">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Stethoscope className="h-5 w-5 text-emerald-600" />
            Historial Clínico
          </SheetTitle>
        </SheetHeader>

        {/* Info del paciente */}
        <div className="mt-4 p-3 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-lg border border-emerald-200">
          <p className="font-semibold">
            {admision.paciente?.nombre} {admision.paciente?.apellido}
          </p>
          <p className="text-sm text-gray-600">{admision.diagnosticoIngreso}</p>
          <p className="text-xs text-gray-500 mt-1">
            {admision.unidad?.nombre} - Cama {admision.cama?.numero || '--'}
          </p>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
          <TabsList className="w-full grid grid-cols-4">
            <TabsTrigger value="evoluciones" className="text-xs">
              <FileText className="h-3 w-3 mr-1" />
              SOAP
            </TabsTrigger>
            <TabsTrigger value="notas" className="text-xs">
              <ClipboardList className="h-3 w-3 mr-1" />
              Notas
            </TabsTrigger>
            <TabsTrigger value="signos" className="text-xs">
              <Activity className="h-3 w-3 mr-1" />
              Signos
            </TabsTrigger>
            <TabsTrigger value="medicamentos" className="text-xs">
              <Pill className="h-3 w-3 mr-1" />
              Meds
            </TabsTrigger>
          </TabsList>

          <ScrollArea className="h-[calc(100vh-280px)] mt-4 pr-4">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
              </div>
            ) : (
              <>
                <TabsContent value="evoluciones">
                  <TimelineEvoluciones evoluciones={data.evoluciones} />
                </TabsContent>

                <TabsContent value="notas">
                  <NotasEnfermeria notas={data.notas} />
                </TabsContent>

                <TabsContent value="signos">
                  <SignosVitalesHistorial signos={data.signos} />
                </TabsContent>

                <TabsContent value="medicamentos">
                  <MedicamentosActivos prescripciones={data.prescripciones} />
                </TabsContent>
              </>
            )}
          </ScrollArea>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
