'use client';

import { useState, useEffect } from 'react';
import { Plus, Search, FileText, Settings, Eye, Trash2, Copy, CheckCircle, Clock, XCircle, AlertTriangle, LayoutTemplate, FileCheck, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useCalidad2FormatoTemplates, useCalidad2FormatoInstancias, useCalidad2FormatoAlertas } from '@/hooks/useCalidad2Formatos';

const ESTADO_COLORS = {
  BORRADOR: 'bg-gray-100 text-gray-800',
  EN_PROCESO: 'bg-blue-100 text-blue-800',
  COMPLETADO: 'bg-green-100 text-green-800',
  VENCIDO: 'bg-red-100 text-red-800',
  CANCELADO: 'bg-yellow-100 text-yellow-800',
};

const TIPO_CAMPO_OPTIONS = [
  { value: 'TEXTO_CORTO', label: 'Texto corto' },
  { value: 'TEXTO_LARGO', label: 'Texto largo' },
  { value: 'NUMERO', label: 'Numero' },
  { value: 'FECHA', label: 'Fecha' },
  { value: 'CHECKBOX', label: 'Checkbox' },
  { value: 'CHECKBOX_GRUPO', label: 'C/NC/NA' },
  { value: 'SELECT', label: 'Lista desplegable' },
  { value: 'FIRMA', label: 'Firma' },
  { value: 'ARCHIVO', label: 'Archivo' },
];

export default function FormatosTab({ user }) {
  const [activeSubTab, setActiveSubTab] = useState('templates');

  return (
    <div className="space-y-4">
      <Tabs value={activeSubTab} onValueChange={setActiveSubTab}>
        <TabsList>
          <TabsTrigger value="templates" className="flex items-center gap-2">
            <LayoutTemplate className="w-4 h-4" />
            Templates
          </TabsTrigger>
          <TabsTrigger value="instancias" className="flex items-center gap-2">
            <FileCheck className="w-4 h-4" />
            Documentos
          </TabsTrigger>
          <TabsTrigger value="alertas" className="flex items-center gap-2">
            <Bell className="w-4 h-4" />
            Alertas
          </TabsTrigger>
        </TabsList>

        <TabsContent value="templates">
          <TemplatesSection user={user} />
        </TabsContent>

        <TabsContent value="instancias">
          <InstanciasSection user={user} />
        </TabsContent>

        <TabsContent value="alertas">
          <AlertasSection user={user} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ==========================================
// TEMPLATES SECTION
// ==========================================

function TemplatesSection({ user }) {
  const {
    templates,
    currentTemplate,
    pagination,
    loading,
    filters,
    setFilters,
    loadTemplates,
    getTemplate,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    duplicateTemplate,
    addSeccion,
    updateSeccion,
    deleteSeccion,
    addCampo,
    updateCampo,
    deleteCampo,
    clearCurrentTemplate,
  } = useCalidad2FormatoTemplates();

  const [showForm, setShowForm] = useState(false);
  const [showBuilder, setShowBuilder] = useState(false);
  const [formData, setFormData] = useState({
    codigo: '',
    nombre: '',
    descripcion: '',
    categoria: '',
    requiereFirmas: false,
    requiereAsistentes: false,
    tieneVencimiento: false,
    diasVigencia: null,
  });

  useEffect(() => {
    loadTemplates();
  }, []);

  const handleCreate = async () => {
    const result = await createTemplate(formData);
    if (result) {
      setShowForm(false);
      setFormData({
        codigo: '',
        nombre: '',
        descripcion: '',
        categoria: '',
        requiereFirmas: false,
        requiereAsistentes: false,
        tieneVencimiento: false,
        diasVigencia: null,
      });
    }
  };

  const handleEdit = async (id) => {
    await getTemplate(id);
    setShowBuilder(true);
  };

  const handleDuplicate = async (id) => {
    await duplicateTemplate(id, { codigo: `COPY-${Date.now()}` });
  };

  const handleDelete = async (id) => {
    if (confirm('Esta seguro de eliminar este template?')) {
      await deleteTemplate(id);
    }
  };

  return (
    <div className="space-y-4">
      {/* Actions */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Buscar templates..."
              className="pl-10"
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              onKeyDown={(e) => e.key === 'Enter' && loadTemplates()}
            />
          </div>
          <Select value={filters.categoria || '_all'} onValueChange={(v) => setFilters({ ...filters, categoria: v === '_all' ? '' : v })}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="_all">Todas</SelectItem>
              <SelectItem value="Verificacion Personal">Verificacion Personal</SelectItem>
              <SelectItem value="Actas">Actas</SelectItem>
              <SelectItem value="Evaluaciones">Evaluaciones</SelectItem>
              <SelectItem value="Checklists">Checklists</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Template
        </Button>
      </div>

      {/* Lista */}
      <div className="grid grid-cols-2 gap-4">
        {loading ? (
          <div className="col-span-2 text-center py-8 text-gray-500">Cargando...</div>
        ) : templates.length === 0 ? (
          <div className="col-span-2">
            <Card>
              <CardContent className="py-8 text-center text-gray-500">
                No hay templates creados
              </CardContent>
            </Card>
          </div>
        ) : (
          templates.map((template) => (
            <Card key={template.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <LayoutTemplate className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-medium">{template.nombre}</h3>
                      <p className="text-sm text-gray-500">{template.codigo}</p>
                      {template.descripcion && (
                        <p className="text-sm text-gray-400 mt-1 line-clamp-2">{template.descripcion}</p>
                      )}
                      <div className="flex items-center gap-2 mt-2">
                        {template.categoria && (
                          <Badge variant="outline">{template.categoria}</Badge>
                        )}
                        <Badge className={template.activo ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                          {template.activo ? 'Activo' : 'Inactivo'}
                        </Badge>
                        <span className="text-xs text-gray-400">
                          v{template.version} | {template._count?.campos || 0} campos
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button size="sm" variant="ghost" onClick={() => handleEdit(template.id)}>
                      <Settings className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => handleDuplicate(template.id)}>
                      <Copy className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="ghost" className="text-red-600" onClick={() => handleDelete(template.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Modal Crear Template */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Nuevo Template de Formato</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Codigo</Label>
                <Input
                  value={formData.codigo}
                  onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
                  placeholder="FMT-001"
                />
              </div>
              <div>
                <Label>Categoria</Label>
                <Select value={formData.categoria} onValueChange={(v) => setFormData({ ...formData, categoria: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Verificacion Personal">Verificacion Personal</SelectItem>
                    <SelectItem value="Actas">Actas</SelectItem>
                    <SelectItem value="Evaluaciones">Evaluaciones</SelectItem>
                    <SelectItem value="Checklists">Checklists</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Nombre</Label>
              <Input
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                placeholder="Nombre del formato"
              />
            </div>
            <div>
              <Label>Descripcion</Label>
              <Textarea
                value={formData.descripcion}
                onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                placeholder="Descripcion del formato..."
              />
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Requiere Firmas</Label>
                <Switch
                  checked={formData.requiereFirmas}
                  onCheckedChange={(v) => setFormData({ ...formData, requiereFirmas: v })}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label>Requiere Asistentes</Label>
                <Switch
                  checked={formData.requiereAsistentes}
                  onCheckedChange={(v) => setFormData({ ...formData, requiereAsistentes: v })}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label>Tiene Vencimiento</Label>
                <Switch
                  checked={formData.tieneVencimiento}
                  onCheckedChange={(v) => setFormData({ ...formData, tieneVencimiento: v })}
                />
              </div>
              {formData.tieneVencimiento && (
                <div>
                  <Label>Dias de Vigencia</Label>
                  <Input
                    type="number"
                    value={formData.diasVigencia || ''}
                    onChange={(e) => setFormData({ ...formData, diasVigencia: parseInt(e.target.value) || null })}
                    placeholder="30"
                  />
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowForm(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreate} disabled={!formData.codigo || !formData.nombre}>
              Crear Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Builder */}
      <Dialog open={showBuilder} onOpenChange={(open) => { setShowBuilder(open); if (!open) clearCurrentTemplate(); }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editor de Template: {currentTemplate?.nombre}</DialogTitle>
          </DialogHeader>
          {currentTemplate && (
            <TemplateBuilder
              template={currentTemplate}
              onAddSeccion={addSeccion}
              onUpdateSeccion={updateSeccion}
              onDeleteSeccion={deleteSeccion}
              onAddCampo={addCampo}
              onUpdateCampo={updateCampo}
              onDeleteCampo={deleteCampo}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ==========================================
// TEMPLATE BUILDER
// ==========================================

function TemplateBuilder({ template, onAddSeccion, onUpdateSeccion, onDeleteSeccion, onAddCampo, onUpdateCampo, onDeleteCampo }) {
  const [showAddSeccion, setShowAddSeccion] = useState(false);
  const [showAddCampo, setShowAddCampo] = useState(false);
  const [selectedSeccion, setSelectedSeccion] = useState(null);
  const [seccionData, setSeccionData] = useState({ nombre: '', descripcion: '' });
  const [campoData, setCampoData] = useState({
    nombre: '',
    tipo: 'TEXTO_CORTO',
    descripcion: '',
    esRequerido: false,
    esObligatorio: false,
    seccionId: null,
    configuracion: null,
  });

  const handleAddSeccion = async () => {
    const result = await onAddSeccion(template.id, seccionData);
    if (result) {
      setShowAddSeccion(false);
      setSeccionData({ nombre: '', descripcion: '' });
    }
  };

  const handleAddCampo = async () => {
    const result = await onAddCampo(template.id, { ...campoData, seccionId: selectedSeccion });
    if (result) {
      setShowAddCampo(false);
      setCampoData({
        nombre: '',
        tipo: 'TEXTO_CORTO',
        descripcion: '',
        esRequerido: false,
        esObligatorio: false,
        seccionId: null,
        configuracion: null,
      });
    }
  };

  const handleDeleteSeccion = async (seccionId) => {
    if (confirm('Eliminar esta seccion y todos sus campos?')) {
      await onDeleteSeccion(seccionId);
    }
  };

  const handleDeleteCampo = async (campoId) => {
    if (confirm('Eliminar este campo?')) {
      await onDeleteCampo(campoId);
    }
  };

  // Group campos by seccion
  const camposPorSeccion = {};
  const camposSinSeccion = [];

  template.campos?.forEach(campo => {
    if (campo.seccionId) {
      if (!camposPorSeccion[campo.seccionId]) {
        camposPorSeccion[campo.seccionId] = [];
      }
      camposPorSeccion[campo.seccionId].push(campo);
    } else {
      camposSinSeccion.push(campo);
    }
  });

  return (
    <div className="space-y-6">
      {/* Secciones */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="font-medium">Secciones y Campos</h4>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => setShowAddSeccion(true)}>
              <Plus className="w-4 h-4 mr-1" />
              Seccion
            </Button>
            <Button size="sm" onClick={() => { setSelectedSeccion(null); setShowAddCampo(true); }}>
              <Plus className="w-4 h-4 mr-1" />
              Campo
            </Button>
          </div>
        </div>

        {/* Campos sin seccion */}
        {camposSinSeccion.length > 0 && (
          <Card>
            <CardHeader className="py-3">
              <CardTitle className="text-sm text-gray-500">Campos Generales</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {camposSinSeccion.map(campo => (
                <CampoItem key={campo.id} campo={campo} onDelete={() => handleDeleteCampo(campo.id)} />
              ))}
            </CardContent>
          </Card>
        )}

        {/* Secciones con campos */}
        {template.secciones?.sort((a, b) => a.orden - b.orden).map(seccion => (
          <Card key={seccion.id}>
            <CardHeader className="py-3 flex flex-row items-center justify-between">
              <CardTitle className="text-sm">{seccion.nombre}</CardTitle>
              <div className="flex items-center gap-1">
                <Button size="sm" variant="ghost" onClick={() => { setSelectedSeccion(seccion.id); setShowAddCampo(true); }}>
                  <Plus className="w-4 h-4" />
                </Button>
                <Button size="sm" variant="ghost" className="text-red-600" onClick={() => handleDeleteSeccion(seccion.id)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {(camposPorSeccion[seccion.id] || []).sort((a, b) => a.orden - b.orden).map(campo => (
                <CampoItem key={campo.id} campo={campo} onDelete={() => handleDeleteCampo(campo.id)} />
              ))}
              {(!camposPorSeccion[seccion.id] || camposPorSeccion[seccion.id].length === 0) && (
                <p className="text-sm text-gray-400 text-center py-2">Sin campos</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Modal Agregar Seccion */}
      <Dialog open={showAddSeccion} onOpenChange={setShowAddSeccion}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nueva Seccion</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nombre</Label>
              <Input
                value={seccionData.nombre}
                onChange={(e) => setSeccionData({ ...seccionData, nombre: e.target.value })}
                placeholder="Ej: INFORMACION GENERAL"
              />
            </div>
            <div>
              <Label>Descripcion (opcional)</Label>
              <Textarea
                value={seccionData.descripcion}
                onChange={(e) => setSeccionData({ ...seccionData, descripcion: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddSeccion(false)}>Cancelar</Button>
            <Button onClick={handleAddSeccion} disabled={!seccionData.nombre}>Agregar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Agregar Campo */}
      <Dialog open={showAddCampo} onOpenChange={setShowAddCampo}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nuevo Campo</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nombre</Label>
              <Input
                value={campoData.nombre}
                onChange={(e) => setCampoData({ ...campoData, nombre: e.target.value })}
                placeholder="Nombre del campo"
              />
            </div>
            <div>
              <Label>Tipo</Label>
              <Select value={campoData.tipo} onValueChange={(v) => setCampoData({ ...campoData, tipo: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIPO_CAMPO_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Descripcion/Ayuda</Label>
              <Input
                value={campoData.descripcion}
                onChange={(e) => setCampoData({ ...campoData, descripcion: e.target.value })}
                placeholder="Texto de ayuda"
              />
            </div>
            <div className="flex items-center justify-between">
              <Label>Campo Requerido</Label>
              <Switch
                checked={campoData.esRequerido}
                onCheckedChange={(v) => setCampoData({ ...campoData, esRequerido: v })}
              />
            </div>
            {campoData.tipo === 'CHECKBOX_GRUPO' && (
              <div className="flex items-center justify-between">
                <Label>Es Obligatorio (checklist)</Label>
                <Switch
                  checked={campoData.esObligatorio}
                  onCheckedChange={(v) => setCampoData({ ...campoData, esObligatorio: v })}
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddCampo(false)}>Cancelar</Button>
            <Button onClick={handleAddCampo} disabled={!campoData.nombre}>Agregar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CampoItem({ campo, onDelete }) {
  const tipoLabel = TIPO_CAMPO_OPTIONS.find(o => o.value === campo.tipo)?.label || campo.tipo;

  return (
    <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
      <div className="flex items-center gap-3">
        <div className="w-2 h-2 rounded-full bg-blue-500" />
        <div>
          <span className="font-medium text-sm">{campo.nombre}</span>
          <span className="text-xs text-gray-500 ml-2">({tipoLabel})</span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {campo.esRequerido && <Badge variant="outline" className="text-xs">Requerido</Badge>}
        {campo.esObligatorio && <Badge variant="outline" className="text-xs bg-red-50">Obligatorio</Badge>}
        <Button size="sm" variant="ghost" className="text-red-600 h-6 w-6 p-0" onClick={onDelete}>
          <Trash2 className="w-3 h-3" />
        </Button>
      </div>
    </div>
  );
}

// ==========================================
// INSTANCIAS SECTION
// ==========================================

function InstanciasSection({ user }) {
  const {
    instancias,
    currentInstancia,
    pagination,
    loading,
    filters,
    setFilters,
    loadInstancias,
    getInstancia,
    createInstancia,
    deleteInstancia,
    completarInstancia,
    clearCurrentInstancia,
  } = useCalidad2FormatoInstancias();

  const { templates, loadTemplates } = useCalidad2FormatoTemplates();

  const [showForm, setShowForm] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [formData, setFormData] = useState({ templateId: '', personalId: '', titulo: '' });

  useEffect(() => {
    loadInstancias();
    loadTemplates();
  }, []);

  const handleCreate = async () => {
    const result = await createInstancia(formData);
    if (result) {
      setShowForm(false);
      setFormData({ templateId: '', personalId: '', titulo: '' });
    }
  };

  const handleView = async (id) => {
    await getInstancia(id);
    setShowDetail(true);
  };

  const handleDelete = async (id) => {
    if (confirm('Esta seguro de eliminar este documento?')) {
      await deleteInstancia(id);
    }
  };

  return (
    <div className="space-y-4">
      {/* Actions */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Buscar documentos..."
              className="pl-10"
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              onKeyDown={(e) => e.key === 'Enter' && loadInstancias()}
            />
          </div>
          <Select value={filters.estado || '_all'} onValueChange={(v) => setFilters({ ...filters, estado: v === '_all' ? '' : v })}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="_all">Todos</SelectItem>
              <SelectItem value="BORRADOR">Borrador</SelectItem>
              <SelectItem value="EN_PROCESO">En Proceso</SelectItem>
              <SelectItem value="COMPLETADO">Completado</SelectItem>
              <SelectItem value="VENCIDO">Vencido</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={() => loadInstancias()}>Buscar</Button>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Documento
        </Button>
      </div>

      {/* Lista */}
      <div className="space-y-3">
        {loading ? (
          <div className="text-center py-8 text-gray-500">Cargando...</div>
        ) : instancias.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-gray-500">
              No hay documentos creados
            </CardContent>
          </Card>
        ) : (
          instancias.map((inst) => (
            <Card key={inst.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-gray-100 rounded-full">
                      <FileCheck className="w-5 h-5 text-gray-600" />
                    </div>
                    <div>
                      <h3 className="font-medium">{inst.titulo || inst.template?.nombre}</h3>
                      <p className="text-sm text-gray-500">
                        #{inst.numero} | {inst.template?.codigo}
                      </p>
                      {inst.personal && (
                        <p className="text-sm text-gray-400">{inst.personal.nombreCompleto}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <Badge className={ESTADO_COLORS[inst.estado]}>
                      {inst.estado}
                    </Badge>
                    <span className="text-sm text-gray-400">
                      {new Date(inst.fechaCreacion).toLocaleDateString()}
                    </span>
                    <div className="flex items-center gap-1">
                      <Button size="sm" variant="ghost" onClick={() => handleView(inst.id)}>
                        <Eye className="w-4 h-4" />
                      </Button>
                      {inst.estado !== 'COMPLETADO' && (
                        <Button size="sm" variant="ghost" onClick={() => completarInstancia(inst.id)}>
                          <CheckCircle className="w-4 h-4" />
                        </Button>
                      )}
                      <Button size="sm" variant="ghost" className="text-red-600" onClick={() => handleDelete(inst.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Modal Crear */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nuevo Documento</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Template</Label>
              <Select value={formData.templateId} onValueChange={(v) => setFormData({ ...formData, templateId: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar template" />
                </SelectTrigger>
                <SelectContent>
                  {templates.filter(t => t.activo).map(t => (
                    <SelectItem key={t.id} value={t.id}>{t.nombre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Titulo (opcional)</Label>
              <Input
                value={formData.titulo}
                onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                placeholder="Titulo personalizado"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
            <Button onClick={handleCreate} disabled={!formData.templateId}>Crear</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Detalle */}
      <Dialog open={showDetail} onOpenChange={(open) => { setShowDetail(open); if (!open) clearCurrentInstancia(); }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {currentInstancia?.titulo || currentInstancia?.template?.nombre}
            </DialogTitle>
          </DialogHeader>
          {currentInstancia && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Badge className={ESTADO_COLORS[currentInstancia.estado]}>
                  {currentInstancia.estado}
                </Badge>
                <span className="text-sm text-gray-500">
                  Creado: {new Date(currentInstancia.fechaCreacion).toLocaleDateString()}
                </span>
              </div>

              {currentInstancia.respuestas?.length > 0 ? (
                <div className="space-y-3">
                  <h4 className="font-medium">Respuestas</h4>
                  {currentInstancia.respuestas.map(resp => (
                    <div key={resp.id} className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm font-medium">{resp.campo?.nombre}</p>
                      <p className="text-sm text-gray-600">
                        {resp.valorTexto || resp.valorNumero || (resp.valorBoolean ? 'Si' : 'No') || '-'}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-500 py-4">Sin respuestas registradas</p>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ==========================================
// ALERTAS SECTION
// ==========================================

function AlertasSection({ user }) {
  const {
    alertas,
    dashboard,
    loading,
    filters,
    setFilters,
    loadAlertas,
    loadDashboard,
    atenderAlerta,
    generarAlertas,
  } = useCalidad2FormatoAlertas();

  useEffect(() => {
    loadAlertas();
    loadDashboard();
  }, []);

  return (
    <div className="space-y-4">
      {/* Dashboard */}
      {dashboard && (
        <div className="grid grid-cols-4 gap-4">
          <Card className="border-red-200">
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                <div>
                  <p className="text-2xl font-bold text-red-600">{dashboard.vencidos || 0}</p>
                  <p className="text-sm text-gray-500">Vencidos</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-yellow-200">
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-yellow-600" />
                <div>
                  <p className="text-2xl font-bold text-yellow-600">{dashboard.proximosVencer || 0}</p>
                  <p className="text-sm text-gray-500">Proximos a Vencer</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <Bell className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="text-2xl font-bold">{dashboard.pendientes || 0}</p>
                  <p className="text-sm text-gray-500">Pendientes</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-green-200">
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <div>
                  <p className="text-2xl font-bold text-green-600">{dashboard.atendidas || 0}</p>
                  <p className="text-sm text-gray-500">Atendidas</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between">
        <Select value={filters.atendida || '_all'} onValueChange={(v) => { const val = v === '_all' ? '' : v; setFilters({ ...filters, atendida: val }); loadAlertas({ atendida: val }); }}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="_all">Todas</SelectItem>
            <SelectItem value="false">Pendientes</SelectItem>
            <SelectItem value="true">Atendidas</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={generarAlertas}>
          Generar Alertas
        </Button>
      </div>

      {/* Lista */}
      <div className="space-y-3">
        {loading ? (
          <div className="text-center py-8 text-gray-500">Cargando...</div>
        ) : alertas.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-gray-500">
              No hay alertas
            </CardContent>
          </Card>
        ) : (
          alertas.map((alerta) => (
            <Card key={alerta.id} className={alerta.atendida ? 'opacity-60' : ''}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className={`w-5 h-5 ${alerta.tipo === 'VENCIDO' ? 'text-red-600' : 'text-yellow-600'}`} />
                    <div>
                      <p className="font-medium">{alerta.mensaje}</p>
                      <p className="text-sm text-gray-500">
                        Vence: {new Date(alerta.fechaAlerta).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  {!alerta.atendida && (
                    <Button size="sm" onClick={() => atenderAlerta(alerta.id)}>
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Atender
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
