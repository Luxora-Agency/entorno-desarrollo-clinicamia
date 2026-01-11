'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, Search, FileText, Pill, Activity, ClipboardList, Save, X } from 'lucide-react';
import { apiGet, apiPost, apiPut, apiDelete } from '@/services/api';

export default function PlantillasPlanesModule({ user }) {
  const { toast } = useToast();
  const [plantillas, setPlantillas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPlantilla, setCurrentPlantilla] = useState(null);

  // Form states
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    planManejo: '',
    observaciones: '',
    medicamentos: [],
    procedimientos: [],
    interconsultas: []
  });

  useEffect(() => {
    loadPlantillas();
  }, [search]);

  const loadPlantillas = async () => {
    setLoading(true);
    try {
      const response = await apiGet(`/plantillas-planes?search=${search}`);
      setPlantillas(response.data || []);
    } catch (error) {
      console.error('Error loading plantillas:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'No se pudieron cargar las plantillas' });
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setCurrentPlantilla(null);
    setFormData({
      nombre: '',
      descripcion: '',
      planManejo: '',
      observaciones: '',
      medicamentos: [],
      procedimientos: [],
      interconsultas: []
    });
    setIsModalOpen(true);
  };

  const handleEdit = (plantilla) => {
    setCurrentPlantilla(plantilla);
    setFormData({
      nombre: plantilla.nombre,
      descripcion: plantilla.descripcion || '',
      planManejo: plantilla.planManejo || '',
      observaciones: plantilla.observaciones || '',
      medicamentos: plantilla.medicamentos || [],
      procedimientos: plantilla.procedimientos || [],
      interconsultas: plantilla.interconsultas || []
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Está seguro de eliminar esta plantilla?')) return;
    try {
      await apiDelete(`/plantillas-planes/${id}`);
      toast({ title: 'Éxito', description: 'Plantilla eliminada correctamente' });
      loadPlantillas();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'No se pudo eliminar la plantilla' });
    }
  };

  const handleSubmit = async () => {
    if (!formData.nombre) {
      toast({ variant: 'destructive', title: 'Error', description: 'El nombre es obligatorio' });
      return;
    }

    try {
      if (currentPlantilla) {
        await apiPut(`/plantillas-planes/${currentPlantilla.id}`, formData);
        toast({ title: 'Éxito', description: 'Plantilla actualizada correctamente' });
      } else {
        await apiPost('/plantillas-planes', formData);
        toast({ title: 'Éxito', description: 'Plantilla creada correctamente' });
      }
      setIsModalOpen(false);
      loadPlantillas();
    } catch (error) {
      console.error('Error saving plantilla:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'No se pudo guardar la plantilla' });
    }
  };

  // Sub-components for form sections
  const MedicamentosForm = () => {
    const [med, setMed] = useState({ nombre: '', dosis: '', frecuencia: '', duracionDias: '', via: 'Oral' });
    
    const addMed = () => {
      if (!med.nombre || !med.dosis) return;
      setFormData({ ...formData, medicamentos: [...formData.medicamentos, med] });
      setMed({ nombre: '', dosis: '', frecuencia: '', duracionDias: '', via: 'Oral' });
    };

    const removeMed = (index) => {
      const newMeds = formData.medicamentos.filter((_, i) => i !== index);
      setFormData({ ...formData, medicamentos: newMeds });
    };

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-2">
          <Input placeholder="Nombre medicamento" value={med.nombre} onChange={e => setMed({...med, nombre: e.target.value})} />
          <Input placeholder="Dosis" value={med.dosis} onChange={e => setMed({...med, dosis: e.target.value})} />
          <Input placeholder="Frecuencia" value={med.frecuencia} onChange={e => setMed({...med, frecuencia: e.target.value})} />
          <div className="flex gap-2">
            <Input placeholder="Días" type="number" value={med.duracionDias} onChange={e => setMed({...med, duracionDias: e.target.value})} />
            <Button onClick={addMed} size="sm"><Plus className="h-4 w-4" /></Button>
          </div>
        </div>
        
        <div className="space-y-2">
            {formData.medicamentos.map((m, i) => (
                <div key={i} className="flex justify-between items-center bg-gray-50 p-2 rounded text-sm">
                    <span>{m.nombre} - {m.dosis} ({m.frecuencia} x {m.duracionDias} días)</span>
                    <Button variant="ghost" size="sm" onClick={() => removeMed(i)} className="text-red-500"><Trash2 className="h-4 w-4" /></Button>
                </div>
            ))}
            {formData.medicamentos.length === 0 && <p className="text-sm text-gray-500 italic">No hay medicamentos agregados.</p>}
        </div>
      </div>
    );
  };

  const ProcedimientosForm = () => {
    const [proc, setProc] = useState({ codigo: '', nombre: '', cantidad: 1, observacion: '' });
    
    const addProc = () => {
      if (!proc.nombre) return;
      setFormData({ ...formData, procedimientos: [...formData.procedimientos, proc] });
      setProc({ codigo: '', nombre: '', cantidad: 1, observacion: '' });
    };

    const removeProc = (index) => {
      const newProcs = formData.procedimientos.filter((_, i) => i !== index);
      setFormData({ ...formData, procedimientos: newProcs });
    };

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-2">
          <div className="flex gap-2">
             <Input placeholder="Código CUPS (Opcional)" value={proc.codigo} onChange={e => setProc({...proc, codigo: e.target.value})} className="w-1/3" />
             <Input placeholder="Nombre procedimiento" value={proc.nombre} onChange={e => setProc({...proc, nombre: e.target.value})} className="flex-1" />
          </div>
          <Input placeholder="Observación clínica" value={proc.observacion} onChange={e => setProc({...proc, observacion: e.target.value})} />
          <Button onClick={addProc} size="sm" className="w-full"><Plus className="h-4 w-4 mr-2" /> Agregar Procedimiento</Button>
        </div>
        
        <div className="space-y-2">
            {formData.procedimientos.map((p, i) => (
                <div key={i} className="flex justify-between items-center bg-gray-50 p-2 rounded text-sm">
                    <div>
                        <span className="font-semibold">{p.nombre}</span>
                        {p.codigo && <span className="text-gray-500 ml-2">({p.codigo})</span>}
                        {p.observacion && <p className="text-xs text-gray-500">{p.observacion}</p>}
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => removeProc(i)} className="text-red-500"><Trash2 className="h-4 w-4" /></Button>
                </div>
            ))}
             {formData.procedimientos.length === 0 && <p className="text-sm text-gray-500 italic">No hay procedimientos agregados.</p>}
        </div>
      </div>
    );
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Plantillas de Planes</h1>
          <p className="text-gray-500">Gestione sus plantillas de tratamiento frecuentes</p>
        </div>
        <Button onClick={handleCreate} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="h-4 w-4 mr-2" />
          Nueva Plantilla
        </Button>
      </div>

      <div className="flex gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
          <Input 
            placeholder="Buscar plantilla..." 
            className="pl-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {plantillas.map((plantilla) => (
          <Card key={plantilla.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="flex justify-between items-start">
                <span className="truncate" title={plantilla.nombre}>{plantilla.nombre}</span>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => handleEdit(plantilla)}>
                    <Edit className="h-4 w-4 text-gray-500" />
                  </Button>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => handleDelete(plantilla.id)}>
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </CardTitle>
              <CardDescription className="line-clamp-2 h-10">
                {plantilla.descripcion || 'Sin descripción'}
              </CardDescription>
            </CardHeader>
            <CardContent>
               <div className="flex flex-wrap gap-2 text-xs text-gray-500 mt-2">
                 {plantilla.medicamentos?.length > 0 && (
                   <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded flex items-center gap-1">
                     <Pill className="h-3 w-3" /> {plantilla.medicamentos.length} Meds
                   </span>
                 )}
                 {plantilla.procedimientos?.length > 0 && (
                   <span className="bg-green-50 text-green-700 px-2 py-1 rounded flex items-center gap-1">
                     <Activity className="h-3 w-3" /> {plantilla.procedimientos.length} Procs
                   </span>
                 )}
                 {plantilla.planManejo && (
                   <span className="bg-purple-50 text-purple-700 px-2 py-1 rounded flex items-center gap-1">
                     <FileText className="h-3 w-3" /> Plan
                   </span>
                 )}
               </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{currentPlantilla ? 'Editar Plantilla' : 'Nueva Plantilla'}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label>Nombre de la plantilla</Label>
                    <Input 
                        value={formData.nombre} 
                        onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                        placeholder="Ej: Infección Respiratoria Aguda"
                    />
                </div>
                <div className="space-y-2">
                    <Label>Descripción</Label>
                    <Input 
                        value={formData.descripcion} 
                        onChange={(e) => setFormData({...formData, descripcion: e.target.value})}
                        placeholder="Breve descripción para identificarla"
                    />
                </div>
            </div>

            <Tabs defaultValue="plan" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="plan">Plan de Manejo</TabsTrigger>
                <TabsTrigger value="medicamentos">Medicamentos</TabsTrigger>
                <TabsTrigger value="procedimientos">Procedimientos</TabsTrigger>
              </TabsList>
              
              <TabsContent value="plan" className="space-y-4 mt-4">
                <div className="space-y-2">
                    <Label>Plan de Manejo / Recomendaciones</Label>
                    <Textarea 
                        className="min-h-[200px]"
                        value={formData.planManejo}
                        onChange={(e) => setFormData({...formData, planManejo: e.target.value})}
                        placeholder="Escriba el plan de manejo detallado..."
                    />
                </div>
                <div className="space-y-2">
                    <Label>Observaciones Adicionales</Label>
                    <Textarea 
                        className="min-h-[100px]"
                        value={formData.observaciones}
                        onChange={(e) => setFormData({...formData, observaciones: e.target.value})}
                        placeholder="Observaciones internas o notas adicionales..."
                    />
                </div>
              </TabsContent>

              <TabsContent value="medicamentos" className="space-y-4 mt-4">
                 <MedicamentosForm />
              </TabsContent>

              <TabsContent value="procedimientos" className="space-y-4 mt-4">
                 <ProcedimientosForm />
              </TabsContent>
            </Tabs>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleSubmit} className="bg-blue-600 hover:bg-blue-700">
                <Save className="h-4 w-4 mr-2" /> Guardar Plantilla
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
