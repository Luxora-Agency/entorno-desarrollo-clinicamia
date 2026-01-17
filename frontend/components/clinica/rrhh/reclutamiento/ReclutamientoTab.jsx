'use client';

import { useState, useEffect } from 'react';
import {
  Plus, Search, Briefcase, Users, Eye, Edit, Trash2,
  FileText, Calendar, MapPin, DollarSign, MoreVertical,
  CheckCircle, XCircle, Clock, ChevronRight, Mail, Phone,
  User, GraduationCap, Building, AlertTriangle, Globe, Car,
  Languages, Heart, Star, Loader2, Download, ExternalLink
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuTrigger, DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle
} from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import useTalentoHumano from '@/hooks/useTalentoHumano';

const ESTADO_VACANTE_COLORS = {
  ABIERTA: 'bg-green-100 text-green-700',
  EN_PROCESO: 'bg-blue-100 text-blue-700',
  CERRADA: 'bg-gray-100 text-gray-700',
  CANCELADA: 'bg-red-100 text-red-700',
};

const ESTADO_CANDIDATO_COLORS = {
  APLICADO: 'bg-gray-100 text-gray-700',
  EN_REVISION: 'bg-yellow-100 text-yellow-700',
  PRESELECCIONADO: 'bg-blue-100 text-blue-700',
  ENTREVISTA_PROGRAMADA: 'bg-purple-100 text-purple-700',
  ENTREVISTA_REALIZADA: 'bg-indigo-100 text-indigo-700',
  SELECCIONADO: 'bg-green-100 text-green-700',
  RECHAZADO: 'bg-red-100 text-red-700',
  CONTRATADO: 'bg-emerald-100 text-emerald-700',
};

function VacanteCard({ vacante, onView, onEdit, onDelete, onViewCandidatos }) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="pt-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Badge className={ESTADO_VACANTE_COLORS[vacante.estado]}>
                {vacante.estado}
              </Badge>
              {vacante.publicarExterno && (
                <Badge variant="outline" className="text-xs">Publicada</Badge>
              )}
            </div>
            <h3 className="font-semibold text-lg">{vacante.titulo}</h3>
            <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
              {vacante.departamento && (
                <span className="flex items-center gap-1">
                  <Briefcase className="w-4 h-4" />
                  {vacante.departamento.nombre}
                </span>
              )}
              {vacante.ubicacion && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  {vacante.ubicacion}
                </span>
              )}
            </div>
            <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
              <span className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                {vacante._count?.candidatos || 0} candidatos
              </span>
              {vacante.salarioMin && vacante.salarioMax && (
                <span className="flex items-center gap-1">
                  <DollarSign className="w-4 h-4" />
                  ${vacante.salarioMin.toLocaleString()} - ${vacante.salarioMax.toLocaleString()}
                </span>
              )}
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onView(vacante)}>
                <Eye className="w-4 h-4 mr-2" />
                Ver detalles
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onEdit(vacante)}>
                <Edit className="w-4 h-4 mr-2" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onViewCandidatos(vacante)}>
                <Users className="w-4 h-4 mr-2" />
                Ver candidatos
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => onDelete(vacante)}
                className="text-red-600 focus:text-red-600"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Eliminar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="flex items-center justify-between mt-4 pt-4 border-t">
          <span className="text-xs text-gray-400">
            Apertura: {new Date(vacante.fechaApertura).toLocaleDateString()}
          </span>
          <Button variant="outline" size="sm" onClick={() => onViewCandidatos(vacante)}>
            Ver candidatos
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function CandidatoRow({ candidato, onView, onEdit, onDelete }) {
  return (
    <div className="flex items-center justify-between p-4 bg-white rounded-lg border hover:shadow-sm transition-shadow">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-semibold">
          {candidato.nombre[0]}{candidato.apellido[0]}
        </div>
        <div>
          <h4 className="font-medium">{candidato.nombre} {candidato.apellido}</h4>
          <p className="text-sm text-gray-500">{candidato.profesion || candidato.cargoActual || 'Sin cargo especificado'}</p>
          <p className="text-xs text-gray-400">{candidato.email}</p>
        </div>
      </div>
      <div className="flex items-center gap-4">
        {candidato.scoreIA && (
          <div className="text-center">
            <div className="text-lg font-bold text-blue-600">{candidato.scoreIA}%</div>
            <div className="text-xs text-gray-400">Match IA</div>
          </div>
        )}
        <Badge className={ESTADO_CANDIDATO_COLORS[candidato.vacantes?.[0]?.estado || 'APLICADO']}>
          {candidato.vacantes?.[0]?.estado?.replace(/_/g, ' ') || 'APLICADO'}
        </Badge>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={() => onView(candidato)}>
            <Eye className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => onEdit(candidato)}>
            <Edit className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => onDelete(candidato)} className="text-red-500 hover:text-red-600">
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function ReclutamientoTab({ user }) {
  const { toast } = useToast();
  const [activeSubTab, setActiveSubTab] = useState('vacantes');
  const [searchTerm, setSearchTerm] = useState('');

  // Modal states
  const [showVacanteModal, setShowVacanteModal] = useState(false);
  const [editingVacante, setEditingVacante] = useState(null);
  const [viewingVacante, setViewingVacante] = useState(null);
  const [deleteVacanteConfirm, setDeleteVacanteConfirm] = useState(null);

  const [showCandidatoModal, setShowCandidatoModal] = useState(false);
  const [viewingCandidato, setViewingCandidato] = useState(null);
  const [editingCandidato, setEditingCandidato] = useState(null);
  const [deleteCandidatoConfirm, setDeleteCandidatoConfirm] = useState(null);
  const [loadingCandidatoDetails, setLoadingCandidatoDetails] = useState(false);
  const [filteringByVacante, setFilteringByVacante] = useState(null); // Vacante selected for filtering candidates

  const {
    vacantes, candidatos, loading,
    fetchVacantes, fetchCandidatos, getCandidato,
    createVacante, updateVacante, deleteVacante,
    updateCandidato, deleteCandidato, updateEstadoCandidato
  } = useTalentoHumano();

  useEffect(() => {
    fetchVacantes();
    fetchCandidatos();
  }, []);

  // Vacante handlers
  const handleCreateVacante = async (data) => {
    await createVacante(data);
    setShowVacanteModal(false);
    setEditingVacante(null);
    fetchVacantes();
  };

  const handleUpdateVacante = async (data) => {
    await updateVacante(editingVacante.id, data);
    setShowVacanteModal(false);
    setEditingVacante(null);
    fetchVacantes();
  };

  const handleDeleteVacante = async () => {
    if (deleteVacanteConfirm) {
      try {
        await deleteVacante(deleteVacanteConfirm.id);
        toast({
          title: 'Vacante eliminada',
          description: 'La vacante se ha eliminado correctamente.',
        });
        setDeleteVacanteConfirm(null);
        fetchVacantes();
      } catch (err) {
        toast({
          title: 'Error al eliminar',
          description: err.message || 'No se pudo eliminar la vacante.',
          variant: 'destructive',
        });
        setDeleteVacanteConfirm(null);
      }
    }
  };

  const openEditVacante = (vacante) => {
    setEditingVacante(vacante);
    setViewingVacante(null);
    setShowVacanteModal(true);
  };

  const openViewVacante = (vacante) => {
    setViewingVacante(vacante);
    setEditingVacante(null);
    setShowVacanteModal(true);
  };

  // Candidato handlers
  const handleUpdateCandidato = async (data) => {
    await updateCandidato(editingCandidato.id, data);
    setShowCandidatoModal(false);
    setEditingCandidato(null);
    fetchCandidatos();
  };

  const handleDeleteCandidato = async () => {
    if (deleteCandidatoConfirm) {
      await deleteCandidato(deleteCandidatoConfirm.id);
      setDeleteCandidatoConfirm(null);
      fetchCandidatos();
    }
  };

  const openViewCandidato = async (candidato) => {
    setEditingCandidato(null);
    setShowCandidatoModal(true);
    setLoadingCandidatoDetails(true);

    try {
      // Fetch full candidate details
      const fullDetails = await getCandidato(candidato.id);
      setViewingCandidato(fullDetails.data || fullDetails);
    } catch (err) {
      console.error('Error fetching candidate details:', err);
      // Fallback to basic data if fetch fails
      setViewingCandidato(candidato);
    } finally {
      setLoadingCandidatoDetails(false);
    }
  };

  const openEditCandidato = (candidato) => {
    setEditingCandidato(candidato);
    setViewingCandidato(null);
    setShowCandidatoModal(true);
  };

  // Handler to view candidates for a specific vacancy
  const openCandidatosForVacante = (vacante) => {
    setFilteringByVacante(vacante);
    setActiveSubTab('candidatos');
  };

  // Clear vacancy filter
  const clearVacanteFilter = () => {
    setFilteringByVacante(null);
  };

  const filteredVacantes = vacantes.filter(v =>
    v.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.departamento?.nombre?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Filter candidates by search term AND by vacancy if one is selected
  const filteredCandidatos = candidatos.filter(c => {
    const matchesSearch =
      c.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.apellido.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.email.toLowerCase().includes(searchTerm.toLowerCase());

    // If filtering by vacancy, only show candidates who applied to that vacancy
    if (filteringByVacante) {
      const appliedToVacante = c.vacantes?.some(v => v.vacanteId === filteringByVacante.id);
      return matchesSearch && appliedToVacante;
    }

    return matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Stats rapidas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Briefcase className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{vacantes.filter(v => v.estado === 'ABIERTA').length}</p>
                <p className="text-sm text-gray-500">Vacantes Abiertas</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{candidatos.length}</p>
                <p className="text-sm text-gray-500">Candidatos Totales</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Clock className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {candidatos.filter(c => c.vacantes?.some(v => v.estado === 'ENTREVISTA_PROGRAMADA')).length}
                </p>
                <p className="text-sm text-gray-500">En Entrevista</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <CheckCircle className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {candidatos.filter(c => c.vacantes?.some(v => v.estado === 'CONTRATADO')).length}
                </p>
                <p className="text-sm text-gray-500">Contratados</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs y contenido */}
      <Tabs value={activeSubTab} onValueChange={setActiveSubTab}>
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="vacantes" className="flex items-center gap-2">
              <Briefcase className="w-4 h-4" />
              Vacantes
            </TabsTrigger>
            <TabsTrigger value="candidatos" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Candidatos
            </TabsTrigger>
            <TabsTrigger value="pipeline" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Pipeline
            </TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Buscar..."
                className="pl-10 w-64"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            {activeSubTab === 'vacantes' && (
              <Button onClick={() => { setEditingVacante(null); setShowVacanteModal(true); }}>
                <Plus className="w-4 h-4 mr-2" />
                Nueva Vacante
              </Button>
            )}
          </div>
        </div>

        <TabsContent value="vacantes" className="mt-6">
          {loading ? (
            <div className="text-center py-12 text-gray-400">Cargando vacantes...</div>
          ) : filteredVacantes.length === 0 ? (
            <div className="text-center py-12">
              <Briefcase className="w-12 h-12 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-500">No hay vacantes</h3>
              <p className="text-sm text-gray-400 mt-1">Crea una nueva vacante para empezar</p>
              <Button onClick={() => { setEditingVacante(null); setShowVacanteModal(true); }} className="mt-4">
                <Plus className="w-4 h-4 mr-2" />
                Nueva Vacante
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredVacantes.map(vacante => (
                <VacanteCard
                  key={vacante.id}
                  vacante={vacante}
                  onView={openViewVacante}
                  onEdit={openEditVacante}
                  onDelete={setDeleteVacanteConfirm}
                  onViewCandidatos={openCandidatosForVacante}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="candidatos" className="mt-6">
          {/* Filter header when viewing candidates for a specific vacancy */}
          {filteringByVacante && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Briefcase className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="text-sm text-blue-700">
                    Mostrando candidatos para:
                  </p>
                  <p className="font-semibold text-blue-900">{filteringByVacante.titulo}</p>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={clearVacanteFilter}>
                <XCircle className="w-4 h-4 mr-2" />
                Ver todos los candidatos
              </Button>
            </div>
          )}

          {loading ? (
            <div className="text-center py-12 text-gray-400">Cargando candidatos...</div>
          ) : filteredCandidatos.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-12 h-12 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-500">
                {filteringByVacante ? 'No hay candidatos para esta vacante' : 'No hay candidatos'}
              </h3>
              <p className="text-sm text-gray-400 mt-1">
                {filteringByVacante
                  ? 'Aún no hay postulantes para esta vacante'
                  : 'Los candidatos aparecerán aquí cuando apliquen'}
              </p>
              {filteringByVacante && (
                <Button variant="outline" className="mt-4" onClick={clearVacanteFilter}>
                  Ver todos los candidatos
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredCandidatos.map(candidato => (
                <CandidatoRow
                  key={candidato.id}
                  candidato={candidato}
                  onView={openViewCandidato}
                  onEdit={openEditCandidato}
                  onDelete={setDeleteCandidatoConfirm}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="pipeline" className="mt-6">
          <div className="grid grid-cols-5 gap-4">
            {['APLICADO', 'EN_REVISION', 'ENTREVISTA', 'SELECCIONADO', 'CONTRATADO'].map(etapa => (
              <div key={etapa} className="bg-gray-50 rounded-lg p-4 min-h-[400px]">
                <h3 className="font-medium text-sm text-gray-700 mb-4 flex items-center gap-2">
                  {etapa.replace(/_/g, ' ')}
                  <Badge variant="secondary" className="text-xs">
                    {candidatos.filter(c =>
                      c.vacantes?.some(v => v.estado === etapa || v.estado?.includes(etapa))
                    ).length}
                  </Badge>
                </h3>
                <div className="space-y-2">
                  {candidatos
                    .filter(c => c.vacantes?.some(v => v.estado === etapa || v.estado?.includes(etapa)))
                    .map(c => (
                      <div
                        key={c.id}
                        className="bg-white p-3 rounded-lg shadow-sm border cursor-pointer hover:shadow-md transition-shadow"
                        onClick={() => openViewCandidato(c)}
                      >
                        <p className="font-medium text-sm">{c.nombre} {c.apellido}</p>
                        <p className="text-xs text-gray-500">{c.profesion || 'Sin cargo'}</p>
                        {c.scoreIA && (
                          <div className="mt-2">
                            <div className="text-xs text-blue-600 font-medium">{c.scoreIA}% match</div>
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Modal crear/editar/ver vacante */}
      <Dialog open={showVacanteModal} onOpenChange={(open) => { setShowVacanteModal(open); if (!open) { setEditingVacante(null); setViewingVacante(null); } }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {viewingVacante && !editingVacante ? 'Detalle de Vacante' : editingVacante ? 'Editar Vacante' : 'Nueva Vacante'}
            </DialogTitle>
            <DialogDescription>
              {viewingVacante && !editingVacante
                ? 'Informacion completa de la vacante'
                : editingVacante
                  ? 'Modifica los datos de la vacante'
                  : 'Crea una nueva vacante para iniciar el proceso de reclutamiento'}
            </DialogDescription>
          </DialogHeader>

          {/* View mode */}
          {viewingVacante && !editingVacante && (
            <div className="space-y-6 max-h-[60vh] overflow-y-auto">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div>
                  <Badge className={ESTADO_VACANTE_COLORS[viewingVacante.estado]}>{viewingVacante.estado}</Badge>
                  <h3 className="text-xl font-semibold mt-2">{viewingVacante.titulo}</h3>
                  {viewingVacante.cargo && (
                    <p className="text-gray-500">{viewingVacante.cargo.nombre}</p>
                  )}
                </div>
                <Button variant="outline" onClick={() => { setEditingVacante(viewingVacante); setViewingVacante(null); }}>
                  <Edit className="w-4 h-4 mr-2" />
                  Editar
                </Button>
              </div>

              {/* Info Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-xs text-gray-500">Tipo de Contrato</Label>
                  <p className="flex items-center gap-2"><FileText className="w-4 h-4 text-gray-400" />{viewingVacante.tipoContrato || 'No especificado'}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-gray-500">Jornada</Label>
                  <p className="flex items-center gap-2"><Clock className="w-4 h-4 text-gray-400" />{viewingVacante.jornada || 'No especificada'}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-gray-500">Ubicacion</Label>
                  <p className="flex items-center gap-2"><MapPin className="w-4 h-4 text-gray-400" />{viewingVacante.ubicacion || 'No especificada'}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-gray-500">Puestos Disponibles</Label>
                  <p className="flex items-center gap-2"><Users className="w-4 h-4 text-gray-400" />{viewingVacante.cantidadPuestos || 1}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-gray-500">Rango Salarial</Label>
                  <p className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-gray-400" />
                    {viewingVacante.salarioMin && viewingVacante.salarioMax
                      ? `$${Number(viewingVacante.salarioMin).toLocaleString()} - $${Number(viewingVacante.salarioMax).toLocaleString()}`
                      : 'No especificado'}
                  </p>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-gray-500">Candidatos</Label>
                  <p className="flex items-center gap-2"><Users className="w-4 h-4 text-gray-400" />{viewingVacante._count?.candidatos || 0} aplicaciones</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-gray-500">Fecha de Apertura</Label>
                  <p className="flex items-center gap-2"><Calendar className="w-4 h-4 text-gray-400" />{new Date(viewingVacante.fechaApertura).toLocaleDateString()}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-gray-500">Publicada Externamente</Label>
                  <p className="flex items-center gap-2">
                    {viewingVacante.publicarExterno ? <CheckCircle className="w-4 h-4 text-green-500" /> : <XCircle className="w-4 h-4 text-gray-400" />}
                    {viewingVacante.publicarExterno ? 'Si' : 'No'}
                  </p>
                </div>
              </div>

              {/* Descripcion */}
              {viewingVacante.descripcion && (
                <div className="border-t pt-4">
                  <Label className="text-xs text-gray-500">Descripcion</Label>
                  <p className="mt-1 text-gray-700 whitespace-pre-wrap">{viewingVacante.descripcion}</p>
                </div>
              )}

              {/* Requisitos */}
              {viewingVacante.requisitos && (
                <div className="border-t pt-4">
                  <Label className="text-xs text-gray-500">Requisitos</Label>
                  <div className="mt-1 text-gray-700">
                    {typeof viewingVacante.requisitos === 'object' ? (
                      <ul className="list-disc list-inside space-y-1">
                        {Object.entries(viewingVacante.requisitos).map(([key, value]) => (
                          <li key={key}><strong>{key}:</strong> {typeof value === 'object' ? JSON.stringify(value) : value}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="whitespace-pre-wrap">{viewingVacante.requisitos}</p>
                    )}
                  </div>
                </div>
              )}

              <DialogFooter>
                <Button variant="outline" onClick={() => { setShowVacanteModal(false); setViewingVacante(null); }}>
                  Cerrar
                </Button>
              </DialogFooter>
            </div>
          )}

          {/* Create/Edit mode */}
          {(!viewingVacante || editingVacante) && (
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.target);
              const data = {
                titulo: formData.get('titulo'),
                descripcion: formData.get('descripcion'),
                tipoContrato: formData.get('tipoContrato'),
                jornada: formData.get('jornada'),
                ubicacion: formData.get('ubicacion'),
                salarioMin: Number(formData.get('salarioMin')) || null,
                salarioMax: Number(formData.get('salarioMax')) || null,
                cantidadPuestos: Number(formData.get('cantidadPuestos')) || 1,
                requisitos: formData.get('requisitos'),
                publicarExterno: formData.get('publicarExterno') === 'on',
                fechaApertura: editingVacante ? editingVacante.fechaApertura : new Date().toISOString(),
              };
              if (editingVacante) {
                handleUpdateVacante(data);
              } else {
                handleCreateVacante(data);
              }
            }}>
              <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto">
                <div className="grid gap-2">
                  <Label>Titulo del cargo *</Label>
                  <Input name="titulo" defaultValue={editingVacante?.titulo || ''} placeholder="Ej: Enfermera Jefe UCI" required />
                </div>
                <div className="grid gap-2">
                  <Label>Descripcion</Label>
                  <Textarea name="descripcion" defaultValue={editingVacante?.descripcion || ''} placeholder="Descripcion del cargo y responsabilidades" rows={3} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Tipo de contrato</Label>
                    <Select name="tipoContrato" defaultValue={editingVacante?.tipoContrato || 'INDEFINIDO'}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="INDEFINIDO">Indefinido</SelectItem>
                        <SelectItem value="FIJO">Termino Fijo</SelectItem>
                        <SelectItem value="OBRA_LABOR">Obra o Labor</SelectItem>
                        <SelectItem value="PRESTACION_SERVICIOS">Prestacion Servicios</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label>Jornada</Label>
                    <Select name="jornada" defaultValue={editingVacante?.jornada || 'COMPLETA'}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="COMPLETA">Tiempo Completo</SelectItem>
                        <SelectItem value="MEDIA">Medio Tiempo</SelectItem>
                        <SelectItem value="POR_HORAS">Por Horas</SelectItem>
                        <SelectItem value="TURNOS">Turnos</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Ubicacion</Label>
                    <Input name="ubicacion" defaultValue={editingVacante?.ubicacion || ''} placeholder="Ej: Ibague, Colombia" />
                  </div>
                  <div className="grid gap-2">
                    <Label>Cantidad de puestos</Label>
                    <Input name="cantidadPuestos" type="number" min="1" defaultValue={editingVacante?.cantidadPuestos || 1} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Salario minimo (COP)</Label>
                    <Input name="salarioMin" type="number" defaultValue={editingVacante?.salarioMin || ''} placeholder="0" />
                  </div>
                  <div className="grid gap-2">
                    <Label>Salario maximo (COP)</Label>
                    <Input name="salarioMax" type="number" defaultValue={editingVacante?.salarioMax || ''} placeholder="0" />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label>Requisitos</Label>
                  <Textarea name="requisitos" defaultValue={editingVacante?.requisitos || ''} placeholder="Requisitos del cargo" rows={3} />
                </div>
                <div className="flex items-center gap-2">
                  <Switch name="publicarExterno" defaultChecked={editingVacante?.publicarExterno ?? true} />
                  <Label>Publicar en portal de empleo externo</Label>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => { setShowVacanteModal(false); setEditingVacante(null); setViewingVacante(null); }}>
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingVacante ? 'Guardar Cambios' : 'Crear Vacante'}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal ver/editar candidato */}
      <Dialog open={showCandidatoModal} onOpenChange={(open) => { setShowCandidatoModal(open); if (!open) { setViewingCandidato(null); setEditingCandidato(null); } }}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>
              {editingCandidato ? 'Editar Candidato' : 'Información Completa del Candidato'}
            </DialogTitle>
          </DialogHeader>

          {loadingCandidatoDetails && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              <span className="ml-2 text-gray-500">Cargando información...</span>
            </div>
          )}

          {!loadingCandidatoDetails && (viewingCandidato || editingCandidato) && (
            <ScrollArea className="max-h-[75vh] pr-4">
              {/* View mode */}
              {viewingCandidato && !editingCandidato && (
                <div className="space-y-6">
                  {/* Header */}
                  <div className="flex items-center gap-4 pb-4 border-b">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-2xl font-semibold shadow-lg">
                      {(viewingCandidato.firstName || viewingCandidato.nombre)?.[0]}{(viewingCandidato.lastName || viewingCandidato.apellido)?.[0]}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-2xl font-bold">{viewingCandidato.firstName || viewingCandidato.nombre} {viewingCandidato.lastName || viewingCandidato.apellido}</h3>
                      <p className="text-gray-500 text-lg">{viewingCandidato.profession || viewingCandidato.profesion || 'Sin profesión especificada'}</p>
                      <div className="flex gap-2 mt-2">
                        <Badge className="bg-blue-100 text-blue-700">{viewingCandidato.estado || 'Pendiente'}</Badge>
                        {viewingCandidato.immediateAvailability && <Badge className="bg-green-100 text-green-700">Disponibilidad Inmediata</Badge>}
                      </div>
                    </div>
                    <Button variant="outline" onClick={() => { setEditingCandidato(viewingCandidato); setViewingCandidato(null); }}>
                      <Edit className="w-4 h-4 mr-2" />
                      Editar
                    </Button>
                  </div>

                  {/* SECCIÓN: Información Personal */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-semibold text-lg mb-4 flex items-center gap-2 text-blue-700">
                      <User className="w-5 h-5" />
                      Información Personal
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <div className="space-y-1">
                        <Label className="text-xs text-gray-500 uppercase">Documento</Label>
                        <p className="font-medium">{viewingCandidato.documentType || viewingCandidato.tipoDocumento} {viewingCandidato.documentNumber || viewingCandidato.documento}</p>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-gray-500 uppercase">Fecha de Nacimiento</Label>
                        <p className="font-medium">{viewingCandidato.birthDate ? new Date(viewingCandidato.birthDate).toLocaleDateString('es-CO', { timeZone: 'America/Bogota' }) : 'No especificada'}</p>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-gray-500 uppercase">Género</Label>
                        <p className="font-medium">{viewingCandidato.gender === 'male' ? 'Masculino' : viewingCandidato.gender === 'female' ? 'Femenino' : viewingCandidato.gender || 'No especificado'}</p>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-gray-500 uppercase">Estado Civil</Label>
                        <p className="font-medium">{viewingCandidato.maritalStatus === 'single' ? 'Soltero/a' : viewingCandidato.maritalStatus === 'married' ? 'Casado/a' : viewingCandidato.maritalStatus === 'common_law' ? 'Unión Libre' : viewingCandidato.maritalStatus || 'No especificado'}</p>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-gray-500 uppercase">Nacionalidad</Label>
                        <p className="font-medium">{viewingCandidato.nationality || 'No especificada'}</p>
                      </div>
                    </div>
                  </div>

                  {/* SECCIÓN: Información de Contacto */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-semibold text-lg mb-4 flex items-center gap-2 text-green-700">
                      <Mail className="w-5 h-5" />
                      Información de Contacto
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <Label className="text-xs text-gray-500 uppercase">Email Principal</Label>
                        <p className="font-medium flex items-center gap-2">
                          <Mail className="w-4 h-4 text-gray-400" />
                          {viewingCandidato.email}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-gray-500 uppercase">Email Alternativo</Label>
                        <p className="font-medium">{viewingCandidato.alternativeEmail || 'No especificado'}</p>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-gray-500 uppercase">Teléfono Móvil</Label>
                        <p className="font-medium flex items-center gap-2">
                          <Phone className="w-4 h-4 text-gray-400" />
                          {viewingCandidato.mobilePhone || viewingCandidato.telefono || 'No especificado'}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-gray-500 uppercase">Teléfono Fijo</Label>
                        <p className="font-medium">{viewingCandidato.landlinePhone || 'No especificado'}</p>
                      </div>
                      <div className="col-span-2 space-y-1">
                        <Label className="text-xs text-gray-500 uppercase">Dirección de Residencia</Label>
                        <p className="font-medium flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-gray-400" />
                          {viewingCandidato.residenceAddress || 'No especificada'}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-gray-500 uppercase">Ciudad</Label>
                        <p className="font-medium">{viewingCandidato.city || viewingCandidato.ciudad || 'No especificada'}</p>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-gray-500 uppercase">Departamento</Label>
                        <p className="font-medium">{viewingCandidato.department || 'No especificado'}</p>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-gray-500 uppercase">País</Label>
                        <p className="font-medium">{viewingCandidato.country || 'Colombia'}</p>
                      </div>
                    </div>
                  </div>

                  {/* SECCIÓN: Información Profesional */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-semibold text-lg mb-4 flex items-center gap-2 text-purple-700">
                      <GraduationCap className="w-5 h-5" />
                      Información Profesional
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <div className="space-y-1">
                        <Label className="text-xs text-gray-500 uppercase">Profesión</Label>
                        <p className="font-medium">{viewingCandidato.profession || viewingCandidato.profesion || 'No especificada'}</p>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-gray-500 uppercase">Especialidad</Label>
                        <p className="font-medium">{viewingCandidato.specialty || 'No especificada'}</p>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-gray-500 uppercase">Subespecialidad</Label>
                        <p className="font-medium">{viewingCandidato.subspecialty || 'No especificada'}</p>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-gray-500 uppercase">No. Tarjeta Profesional</Label>
                        <p className="font-medium">{viewingCandidato.professionalLicenseNumber || 'No especificado'}</p>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-gray-500 uppercase">Registro Médico Nacional</Label>
                        <p className="font-medium">{viewingCandidato.medicalRegistryNumber || 'No especificado'}</p>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-gray-500 uppercase">Institución Educativa</Label>
                        <p className="font-medium">{viewingCandidato.educationInstitution || viewingCandidato.institucionEducativa || 'No especificada'}</p>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-gray-500 uppercase">País de Formación</Label>
                        <p className="font-medium">{viewingCandidato.educationCountry || 'No especificado'}</p>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-gray-500 uppercase">Año de Graduación</Label>
                        <p className="font-medium">{viewingCandidato.graduationYear || 'No especificado'}</p>
                      </div>
                    </div>
                  </div>

                  {/* SECCIÓN: Experiencia Laboral */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-semibold text-lg mb-4 flex items-center gap-2 text-orange-700">
                      <Briefcase className="w-5 h-5" />
                      Experiencia Laboral
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <div className="space-y-1">
                        <Label className="text-xs text-gray-500 uppercase">Años de Experiencia</Label>
                        <p className="font-medium text-lg">{viewingCandidato.yearsOfExperience || viewingCandidato.experienciaAnios || 0} años</p>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-gray-500 uppercase">Actualmente Empleado</Label>
                        <p className="font-medium">{viewingCandidato.currentlyEmployed ? 'Sí' : 'No'}</p>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-gray-500 uppercase">Disponibilidad Inmediata</Label>
                        <p className="font-medium">{viewingCandidato.immediateAvailability ? 'Sí' : 'No'}</p>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-gray-500 uppercase">Cargo Actual</Label>
                        <p className="font-medium">{viewingCandidato.currentPosition || viewingCandidato.cargoActual || 'No especificado'}</p>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-gray-500 uppercase">Institución/Empresa Actual</Label>
                        <p className="font-medium">{viewingCandidato.currentInstitution || viewingCandidato.empresaActual || 'No especificada'}</p>
                      </div>
                    </div>
                    {viewingCandidato.previousExperience && (
                      <div className="mt-4 space-y-1">
                        <Label className="text-xs text-gray-500 uppercase">Descripción de Experiencia Previa</Label>
                        <p className="text-gray-700 whitespace-pre-wrap bg-white p-3 rounded border">{viewingCandidato.previousExperience}</p>
                      </div>
                    )}
                    {viewingCandidato.previousInstitutions?.length > 0 && (
                      <div className="mt-4 space-y-1">
                        <Label className="text-xs text-gray-500 uppercase">Instituciones Previas</Label>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {viewingCandidato.previousInstitutions.map((inst, i) => (
                            <Badge key={i} variant="secondary">{inst}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* SECCIÓN: Preferencias Laborales */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-semibold text-lg mb-4 flex items-center gap-2 text-teal-700">
                      <Star className="w-5 h-5" />
                      Preferencias Laborales
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <div className="space-y-1">
                        <Label className="text-xs text-gray-500 uppercase">Modalidad Preferida</Label>
                        <p className="font-medium">{viewingCandidato.preferredModality === 'on_site' ? 'Presencial' : viewingCandidato.preferredModality === 'remote' ? 'Remoto' : viewingCandidato.preferredModality === 'hybrid' ? 'Híbrido' : viewingCandidato.preferredModality || 'No especificada'}</p>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-gray-500 uppercase">Tipo de Contrato Preferido</Label>
                        <p className="font-medium">{viewingCandidato.preferredContractType === 'full_time' ? 'Tiempo Completo' : viewingCandidato.preferredContractType === 'part_time' ? 'Medio Tiempo' : viewingCandidato.preferredContractType || 'No especificado'}</p>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-gray-500 uppercase">Expectativa Salarial</Label>
                        <p className="font-medium text-lg text-green-600">{viewingCandidato.salaryExpectation || viewingCandidato.expectativaSalarial ? `$${(viewingCandidato.salaryExpectation || viewingCandidato.expectativaSalarial).toLocaleString()} COP` : 'No especificada'}</p>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-gray-500 uppercase">Disponibilidad de Horario</Label>
                        <p className="font-medium">{viewingCandidato.scheduleAvailability || 'No especificada'}</p>
                      </div>
                    </div>
                    {viewingCandidato.availableShifts?.length > 0 && (
                      <div className="mt-4 space-y-1">
                        <Label className="text-xs text-gray-500 uppercase">Turnos Disponibles</Label>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {viewingCandidato.availableShifts.map((shift, i) => (
                            <Badge key={i} variant="outline">{shift === 'morning' ? 'Mañana' : shift === 'afternoon' ? 'Tarde' : shift === 'night' ? 'Noche' : shift === 'weekend' ? 'Fin de Semana' : shift}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    {viewingCandidato.areasOfInterest?.length > 0 && (
                      <div className="mt-4 space-y-1">
                        <Label className="text-xs text-gray-500 uppercase">Áreas de Interés</Label>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {viewingCandidato.areasOfInterest.map((area, i) => (
                            <Badge key={i} className="bg-purple-100 text-purple-700">{area}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* SECCIÓN: Información Adicional */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-semibold text-lg mb-4 flex items-center gap-2 text-indigo-700">
                      <Heart className="w-5 h-5" />
                      Información Adicional
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="space-y-1">
                        <Label className="text-xs text-gray-500 uppercase">Dispuesto a Viajar</Label>
                        <p className="font-medium">{viewingCandidato.willingToTravel ? '✅ Sí' : '❌ No'}</p>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-gray-500 uppercase">Dispuesto a Reubicarse</Label>
                        <p className="font-medium">{viewingCandidato.willingToRelocate ? '✅ Sí' : '❌ No'}</p>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-gray-500 uppercase">Tiene Vehículo Propio</Label>
                        <p className="font-medium flex items-center gap-1">
                          {viewingCandidato.hasOwnVehicle ? <><Car className="w-4 h-4 text-green-600" /> Sí</> : 'No'}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-gray-500 uppercase">Licencia de Conducir</Label>
                        <p className="font-medium">{viewingCandidato.driverLicense || 'No especificada'}</p>
                      </div>
                    </div>
                    {viewingCandidato.howDidYouHear && (
                      <div className="mt-4 space-y-1">
                        <Label className="text-xs text-gray-500 uppercase">¿Cómo se enteró de nosotros?</Label>
                        <p className="font-medium">{viewingCandidato.howDidYouHear}</p>
                      </div>
                    )}
                  </div>

                  {/* SECCIÓN: Idiomas */}
                  {viewingCandidato.languages?.length > 0 && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="font-semibold text-lg mb-4 flex items-center gap-2 text-cyan-700">
                        <Languages className="w-5 h-5" />
                        Idiomas
                      </h4>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {viewingCandidato.languages.map((lang, i) => (
                          <div key={i} className="bg-white p-3 rounded border">
                            <p className="font-semibold">{lang.language}</p>
                            <Badge variant="outline" className="mt-1">
                              {lang.level === 'basic' ? 'Básico' : lang.level === 'intermediate' ? 'Intermedio' : lang.level === 'advanced' ? 'Avanzado' : lang.level === 'native' ? 'Nativo' : lang.level}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* SECCIÓN: Referencias Profesionales */}
                  {viewingCandidato.references?.length > 0 && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="font-semibold text-lg mb-4 flex items-center gap-2 text-rose-700">
                        <Users className="w-5 h-5" />
                        Referencias Profesionales
                      </h4>
                      <div className="space-y-3">
                        {viewingCandidato.references.map((ref, i) => (
                          <div key={i} className="bg-white p-4 rounded border">
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="font-semibold text-lg">{ref.name}</p>
                                <p className="text-gray-600">{ref.position}</p>
                                <p className="text-gray-500 text-sm">{ref.institution}</p>
                              </div>
                              <Badge variant="outline">{ref.relationship}</Badge>
                            </div>
                            <div className="mt-2 flex gap-4 text-sm">
                              <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{ref.phone}</span>
                              <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{ref.email}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* SECCIÓN: Motivación y Expectativas */}
                  {(viewingCandidato.motivation || viewingCandidato.professionalExpectations) && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="font-semibold text-lg mb-4 flex items-center gap-2 text-amber-700">
                        <FileText className="w-5 h-5" />
                        Motivación y Expectativas
                      </h4>
                      {viewingCandidato.motivation && (
                        <div className="space-y-1 mb-4">
                          <Label className="text-xs text-gray-500 uppercase">Motivación para Aplicar</Label>
                          <p className="text-gray-700 whitespace-pre-wrap bg-white p-3 rounded border">{viewingCandidato.motivation}</p>
                        </div>
                      )}
                      {viewingCandidato.professionalExpectations && (
                        <div className="space-y-1">
                          <Label className="text-xs text-gray-500 uppercase">Expectativas Profesionales</Label>
                          <p className="text-gray-700 whitespace-pre-wrap bg-white p-3 rounded border">{viewingCandidato.professionalExpectations}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* SECCIÓN: Documentos Adjuntos */}
                  {viewingCandidato.documentIds?.length > 0 && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="font-semibold text-lg mb-4 flex items-center gap-2 text-gray-700">
                        <Download className="w-5 h-5" />
                        Documentos Adjuntos
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {viewingCandidato.documentIds.map((docId, i) => (
                          <Button key={i} variant="outline" size="sm" asChild>
                            <a href={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/uploads/candidatos/${docId}`} target="_blank" rel="noopener noreferrer">
                              <Download className="w-4 h-4 mr-2" />
                              Documento {i + 1}
                            </a>
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* SECCIÓN: Notas Internas */}
                  {viewingCandidato.notasInternas && (
                    <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                      <h4 className="font-semibold text-lg mb-2 flex items-center gap-2 text-yellow-700">
                        <AlertTriangle className="w-5 h-5" />
                        Notas Internas (Solo visible para RRHH)
                      </h4>
                      <p className="text-gray-700 whitespace-pre-wrap">{viewingCandidato.notasInternas}</p>
                    </div>
                  )}

                  {/* Metadatos */}
                  <div className="text-xs text-gray-400 border-t pt-4 flex justify-between">
                    <span>Fecha de aplicación: {viewingCandidato.createdAt ? new Date(viewingCandidato.createdAt).toLocaleString('es-CO', { timeZone: 'America/Bogota' }) : 'N/A'}</span>
                    <span>Última actualización: {viewingCandidato.updatedAt ? new Date(viewingCandidato.updatedAt).toLocaleString('es-CO', { timeZone: 'America/Bogota' }) : 'N/A'}</span>
                  </div>

                  {/* Vacantes aplicadas (del sistema THCandidato) */}
                  {viewingCandidato.vacantes?.length > 0 && (
                    <div className="border-t pt-4">
                      <h4 className="font-medium mb-3">Vacantes Aplicadas</h4>
                      <div className="space-y-2">
                        {viewingCandidato.vacantes.map((cv, idx) => (
                          <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div>
                              <p className="font-medium">{cv.vacante?.titulo || 'Vacante'}</p>
                              <p className="text-xs text-gray-500">Aplicado: {new Date(cv.createdAt).toLocaleDateString()}</p>
                            </div>
                            <Badge className={ESTADO_CANDIDATO_COLORS[cv.estado]}>{cv.estado?.replace(/_/g, ' ')}</Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Edit mode */}
              {editingCandidato && (
                <form onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.target);
                  handleUpdateCandidato({
                    nombre: formData.get('nombre'),
                    apellido: formData.get('apellido'),
                    email: formData.get('email'),
                    telefono: formData.get('telefono'),
                    profesion: formData.get('profesion'),
                    ciudad: formData.get('ciudad'),
                    experienciaAnios: Number(formData.get('experienciaAnios')) || 0,
                    cargoActual: formData.get('cargoActual'),
                    empresaActual: formData.get('empresaActual'),
                    expectativaSalarial: Number(formData.get('expectativaSalarial')) || null,
                  });
                }}>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label>Nombre *</Label>
                        <Input name="nombre" defaultValue={editingCandidato.nombre} required />
                      </div>
                      <div className="grid gap-2">
                        <Label>Apellido *</Label>
                        <Input name="apellido" defaultValue={editingCandidato.apellido} required />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label>Email *</Label>
                        <Input name="email" type="email" defaultValue={editingCandidato.email} required />
                      </div>
                      <div className="grid gap-2">
                        <Label>Telefono</Label>
                        <Input name="telefono" defaultValue={editingCandidato.telefono || ''} />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label>Profesion</Label>
                        <Input name="profesion" defaultValue={editingCandidato.profesion || ''} />
                      </div>
                      <div className="grid gap-2">
                        <Label>Ciudad</Label>
                        <Input name="ciudad" defaultValue={editingCandidato.ciudad || ''} />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label>Anos de Experiencia</Label>
                        <Input name="experienciaAnios" type="number" defaultValue={editingCandidato.experienciaAnios || 0} />
                      </div>
                      <div className="grid gap-2">
                        <Label>Expectativa Salarial (COP)</Label>
                        <Input name="expectativaSalarial" type="number" defaultValue={editingCandidato.expectativaSalarial || ''} />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label>Cargo Actual</Label>
                        <Input name="cargoActual" defaultValue={editingCandidato.cargoActual || ''} />
                      </div>
                      <div className="grid gap-2">
                        <Label>Empresa Actual</Label>
                        <Input name="empresaActual" defaultValue={editingCandidato.empresaActual || ''} />
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => { setEditingCandidato(null); setShowCandidatoModal(false); }}>
                      Cancelar
                    </Button>
                    <Button type="submit">
                      Guardar Cambios
                    </Button>
                  </DialogFooter>
                </form>
              )}
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>

      {/* Confirmacion eliminar vacante */}
      <AlertDialog open={!!deleteVacanteConfirm} onOpenChange={(open) => !open && setDeleteVacanteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              Eliminar Vacante
            </AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estas seguro de eliminar la vacante <strong>{deleteVacanteConfirm?.titulo}</strong>?
              Esta accion no se puede deshacer y se eliminaran todos los datos asociados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteVacante} className="bg-red-600 hover:bg-red-700">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Confirmacion eliminar candidato */}
      <AlertDialog open={!!deleteCandidatoConfirm} onOpenChange={(open) => !open && setDeleteCandidatoConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              Eliminar Candidato
            </AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estas seguro de eliminar al candidato <strong>{deleteCandidatoConfirm?.nombre} {deleteCandidatoConfirm?.apellido}</strong>?
              Esta accion no se puede deshacer y se eliminara toda su informacion.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteCandidato} className="bg-red-600 hover:bg-red-700">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
