'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Plus,
  RefreshCw,
  Users,
  FileText,
} from 'lucide-react';
import { useCalidad2Comites } from '@/hooks/useCalidad2Comites';
import { useCalidad2Actas } from '@/hooks/useCalidad2Actas';
import ComiteCard from './ComiteCard';
import ComiteForm from './ComiteForm';
import ActaComiteForm from './ActaComiteForm';

export default function ComitesTab() {
  const [showComiteForm, setShowComiteForm] = useState(false);
  const [showActaForm, setShowActaForm] = useState(false);
  const [selectedComite, setSelectedComite] = useState(null);
  const [selectedActa, setSelectedActa] = useState(null);
  const [comiteForActa, setComiteForActa] = useState(null);

  const {
    comites,
    loading: loadingComites,
    error: errorComites,
    createComite,
    updateComite,
    deleteComite,
    refreshAll: refreshComites,
  } = useCalidad2Comites();

  const {
    actas,
    loading: loadingActas,
    error: errorActas,
    createActa,
    updateActa,
    deleteActa,
    aprobarActa,
    refreshAll: refreshActas,
  } = useCalidad2Actas();

  const loading = loadingComites || loadingActas;
  const error = errorComites || errorActas;

  const handleEditComite = (comite) => {
    setSelectedComite(comite);
    setShowComiteForm(true);
  };

  const handleDeleteComite = async (id) => {
    if (confirm('¿Está seguro de eliminar este comité?')) {
      await deleteComite(id);
    }
  };

  const handleAddActa = (comite) => {
    setComiteForActa(comite);
    setShowActaForm(true);
  };

  const handleEditActa = (acta) => {
    setSelectedActa(acta);
    setShowActaForm(true);
  };

  const handleDeleteActa = async (id) => {
    if (confirm('¿Está seguro de eliminar esta acta?')) {
      await deleteActa(id);
    }
  };

  const handleAprobarActa = async (id) => {
    await aprobarActa(id);
  };

  const handleSubmitComite = async (data) => {
    if (selectedComite) {
      await updateComite(selectedComite.id, data);
    } else {
      await createComite(data);
    }
    setShowComiteForm(false);
    setSelectedComite(null);
  };

  const handleSubmitActa = async (data) => {
    const actaData = { ...data, comiteId: comiteForActa?.id || data.comiteId };
    if (selectedActa) {
      await updateActa(selectedActa.id, actaData);
    } else {
      await createActa(actaData);
    }
    setShowActaForm(false);
    setSelectedActa(null);
    setComiteForActa(null);
  };

  const handleCloseComiteForm = () => {
    setShowComiteForm(false);
    setSelectedComite(null);
  };

  const handleCloseActaForm = () => {
    setShowActaForm(false);
    setSelectedActa(null);
    setComiteForActa(null);
  };

  const getTipoComiteColor = (tipo) => {
    const colors = {
      SEGURIDAD_PACIENTE: 'red',
      HISTORIA_CLINICA: 'blue',
      INFECCIONES: 'orange',
      ETICA_ATENCION_USUARIO: 'purple',
      CALIDAD: 'green',
      VICTIMAS_VIOLENCIA_SEXUAL: 'pink',
      AMBIENTAL: 'teal',
    };
    return colors[tipo] || 'default';
  };

  const getTipoComiteLabel = (tipo) => {
    const labels = {
      SEGURIDAD_PACIENTE: 'Seguridad del Paciente',
      HISTORIA_CLINICA: 'Historia Clínica',
      INFECCIONES: 'Infecciones',
      ETICA_ATENCION_USUARIO: 'Ética y Atención al Usuario',
      CALIDAD: 'Calidad',
      VICTIMAS_VIOLENCIA_SEXUAL: 'Víctimas Violencia Sexual',
      AMBIENTAL: 'Ambiental',
    };
    return labels[tipo] || tipo;
  };

  const ComiteCard = ({ comite }) => {
    const [showActas, setShowActas] = useState(false);
    const actasComite = actas.filter(a => a.comiteId === comite.id);

    return (
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <code className="text-sm font-mono bg-muted px-2 py-1 rounded">
                  {comite.codigo}
                </code>
                <Badge variant={getTipoComiteColor(comite.tipo)}>
                  {getTipoComiteLabel(comite.tipo)}
                </Badge>
                <Badge variant={comite.estado === 'ACTIVO' ? 'success' : 'secondary'}>
                  {comite.estado}
                </Badge>
              </div>
              <CardTitle className="text-lg">{comite.nombre}</CardTitle>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Resolución */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <div>
              <span className="font-medium">Resolución:</span>
              <p className="text-muted-foreground">{comite.resolucionNumero}</p>
            </div>
            <div>
              <span className="font-medium">Fecha Resolución:</span>
              <p className="text-muted-foreground">
                {format(new Date(comite.resolucionFecha), 'dd/MM/yyyy', { locale: es })}
              </p>
            </div>
          </div>

          {/* Periodicidad */}
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Periodicidad:</span>
              <Badge variant="outline">{comite.periodicidad}</Badge>
            </div>
            {comite.diaReunion && (
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">
                  Día {comite.diaReunion} de cada período
                </span>
              </div>
            )}
          </div>

          {/* Miembros */}
          {comite.miembros && comite.miembros.length > 0 && (
            <div className="border-t pt-3">
              <div className="flex items-center gap-2 mb-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium text-sm">Miembros ({comite.miembros.length})</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {comite.miembros.slice(0, 4).map((miembro, index) => (
                  <div key={index} className="flex items-center gap-2 text-xs p-2 bg-muted rounded">
                    <User className="h-3 w-3" />
                    <span>{miembro.cargo || 'Miembro'}</span>
                  </div>
                ))}
                {comite.miembros.length > 4 && (
                  <div className="flex items-center gap-2 text-xs p-2 bg-muted rounded">
                    <span>+{comite.miembros.length - 4} más</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Actas */}
          <div className="border-t pt-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium text-sm">Actas ({actasComite.length})</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowActas(!showActas)}
              >
                {showActas ? 'Ocultar' : 'Ver Actas'}
              </Button>
            </div>

            {showActas && actasComite.length > 0 && (
              <div className="space-y-2">
                {actasComite.slice(0, 3).map((acta) => (
                  <ActaComiteCard key={acta.id} acta={acta} compact />
                ))}
              </div>
            )}

            {showActas && actasComite.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                No hay actas registradas para este comité
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  const ActaComiteCard = ({ acta, compact = false }) => {
    return (
      <Card className={compact ? 'bg-muted/50' : ''}>
        <CardHeader className={compact ? 'py-3' : 'pb-3'}>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 space-y-1">
              <div className="flex items-center gap-2">
                <code className="text-xs font-mono bg-background px-2 py-1 rounded">
                  {acta.numeroActa}
                </code>
                <Badge variant={acta.aprobada ? 'success' : 'yellow'} className="text-xs">
                  {acta.aprobada ? 'Aprobada' : 'Pendiente'}
                </Badge>
                {acta.quorum && (
                  <Badge variant="green" className="text-xs">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Quórum
                  </Badge>
                )}
                {!acta.quorum && (
                  <Badge variant="orange" className="text-xs">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    Sin Quórum
                  </Badge>
                )}
              </div>
              {!compact && <p className="text-sm font-medium">{acta.comite?.nombre}</p>}
            </div>
          </div>
        </CardHeader>

        <CardContent className={compact ? 'py-2' : 'space-y-3'}>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              <span>{format(new Date(acta.fechaReunion), 'dd/MM/yyyy', { locale: es })}</span>
            </div>
            {acta.horaInicio && (
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>{acta.horaInicio} - {acta.horaFin || '...'}</span>
              </div>
            )}
            {acta.lugar && (
              <div className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                <span>{acta.lugar}</span>
              </div>
            )}
          </div>

          {!compact && (
            <>
              {acta.desarrollo && (
                <div className="text-sm">
                  <p className="font-medium mb-1">Desarrollo:</p>
                  <p className="text-muted-foreground line-clamp-2">{acta.desarrollo}</p>
                </div>
              )}

              {acta.asistentes && acta.asistentes.length > 0 && (
                <div className="text-sm">
                  <p className="font-medium mb-1">Asistentes ({acta.asistentes.length}):</p>
                  <div className="flex flex-wrap gap-1">
                    {acta.asistentes.slice(0, 5).map((asistente, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {asistente.usuario?.nombre || 'Usuario'}
                      </Badge>
                    ))}
                    {acta.asistentes.length > 5 && (
                      <Badge variant="outline" className="text-xs">
                        +{acta.asistentes.length - 5} más
                      </Badge>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    );
  };

  if (error) {
    return (
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="text-destructive">Error al cargar comités</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{error}</p>
          <Button onClick={() => { refreshComites(); refreshActas(); }} className="mt-4">
            <RefreshCw className="mr-2 h-4 w-4" />
            Reintentar
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Comités y Actas</h3>
          <p className="text-sm text-muted-foreground">
            Gestión de comités obligatorios y sus actas de reunión
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => { refreshComites(); refreshActas(); }} variant="outline" size="sm" disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
          <Button size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Comité
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Comités Activos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{comites.filter(c => c.estado === 'ACTIVO').length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Actas Registradas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{actas.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Actas Aprobadas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {actas.filter(a => a.aprobada).length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {actas.filter(a => !a.aprobada).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="comites">
        <TabsList>
          <TabsTrigger value="comites">
            <Users className="h-4 w-4 mr-2" />
            Comités ({comites.length})
          </TabsTrigger>
          <TabsTrigger value="actas">
            <FileText className="h-4 w-4 mr-2" />
            Actas ({actas.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="comites" className="space-y-4">
          {loading && comites.length === 0 ? (
            Array(3).fill(0).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <Skeleton className="h-32 w-full" />
                </CardContent>
              </Card>
            ))
          ) : comites.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Sin comités</h3>
                <p className="text-muted-foreground">No hay comités registrados</p>
              </CardContent>
            </Card>
          ) : (
            comites.map((comite) => (
              <ComiteCard key={comite.id} comite={comite} />
            ))
          )}
        </TabsContent>

        <TabsContent value="actas" className="space-y-4">
          {loading && actas.length === 0 ? (
            Array(3).fill(0).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <Skeleton className="h-24 w-full" />
                </CardContent>
              </Card>
            ))
          ) : actas.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Sin actas</h3>
                <p className="text-muted-foreground">No hay actas registradas</p>
              </CardContent>
            </Card>
          ) : (
            actas.map((acta) => (
              <ActaComiteCard key={acta.id} acta={acta} />
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
