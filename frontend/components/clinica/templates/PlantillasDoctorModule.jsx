'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { FileText, Plus, Pencil, Trash2, Search, Braces } from 'lucide-react';
import { toast } from 'sonner';

export default function PlantillasDoctorModule({ user }) {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('ALL');
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentTemplate, setCurrentTemplate] = useState(null);
  const [formData, setFormData] = useState({
    nombre: '',
    tipoCampo: 'SOAP',
    contenido: '',
    descripcion: ''
  });

  const TIPOS_CAMPO = [
    { value: 'SOAP', label: 'Nota SOAP (General)' },
    { value: 'MOTIVO', label: 'Motivo de Consulta' },
    { value: 'ANALISIS', label: 'Análisis' },
    { value: 'PLAN', label: 'Plan de Manejo' },
    { value: 'DIAGNOSTICO', label: 'Diagnóstico' },
    { value: 'GENERICO', label: 'Genérico / Otro' },
  ];

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const response = await fetch(`${apiUrl}/plantillas-doctor`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setTemplates(data.data || []);
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al cargar plantillas');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.nombre || !formData.contenido) {
      toast.error('Nombre y contenido son obligatorios');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      
      const url = currentTemplate 
        ? `${apiUrl}/plantillas-doctor/${currentTemplate.id}`
        : `${apiUrl}/plantillas-doctor`;
        
      const method = currentTemplate ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        toast.success(currentTemplate ? 'Plantilla actualizada' : 'Plantilla creada');
        fetchTemplates();
        setIsModalOpen(false);
        resetForm();
      } else {
        const err = await response.json();
        toast.error(err.message || 'Error al guardar');
      }
    } catch (error) {
      toast.error('Error de conexión');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Estás seguro de eliminar esta plantilla?')) return;

    try {
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      
      const response = await fetch(`${apiUrl}/plantillas-doctor/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        toast.success('Plantilla eliminada');
        fetchTemplates();
      }
    } catch (error) {
      toast.error('Error al eliminar');
    }
  };

  const resetForm = () => {
    setCurrentTemplate(null);
    setFormData({
      nombre: '',
      tipoCampo: 'SOAP',
      contenido: '',
      descripcion: ''
    });
  };

  const openEdit = (template) => {
    setCurrentTemplate(template);
    setFormData({
      nombre: template.nombre,
      tipoCampo: template.tipoCampo,
      contenido: template.contenido,
      descripcion: template.descripcion || ''
    });
    setIsModalOpen(true);
  };

  const insertVariable = () => {
    const varName = prompt('Nombre de la variable (ej: Peso, Talla):');
    if (varName) {
      setFormData(prev => ({
        ...prev,
        contenido: prev.contenido + ` {{${varName}}} `
      }));
    }
  };

  const filteredTemplates = templates.filter(t => {
    const matchesSearch = t.nombre.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'ALL' || t.tipoCampo === filterType;
    return matchesSearch && matchesType;
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <FileText className="h-6 w-6 text-blue-600" />
            Mis Plantillas
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Gestiona tus textos predefinidos para agilizar las consultas.
          </p>
        </div>
        <Button onClick={() => { resetForm(); setIsModalOpen(true); }} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="h-4 w-4 mr-2" />
          Nueva Plantilla
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Buscar plantillas..."
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filtrar por tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Todos los tipos</SelectItem>
                {TIPOS_CAMPO.map(type => (
                  <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Contenido (Vista previa)</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center h-24">Cargando...</TableCell>
                  </TableRow>
                ) : filteredTemplates.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center h-24 text-gray-500">
                      No tienes plantillas creadas. ¡Crea una para empezar!
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTemplates.map((template) => (
                    <TableRow key={template.id}>
                      <TableCell className="font-medium">
                        {template.nombre}
                        {template.descripcion && (
                          <div className="text-xs text-gray-400 font-normal">{template.descripcion}</div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{template.tipoCampo}</Badge>
                      </TableCell>
                      <TableCell className="max-w-md truncate text-gray-500">
                        {template.contenido}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" onClick={() => openEdit(template)}>
                            <Pencil className="h-4 w-4 text-blue-600" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(template.id)}>
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{currentTemplate ? 'Editar Plantilla' : 'Nueva Plantilla'}</DialogTitle>
            <DialogDescription>
              Usa <code>{`{{Variable}}`}</code> para crear campos que llenarás al usar la plantilla.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nombre">Nombre</Label>
                <Input
                  id="nombre"
                  placeholder="Ej: Migraña Común"
                  value={formData.nombre}
                  onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tipo">Tipo de Campo</Label>
                <Select 
                  value={formData.tipoCampo} 
                  onValueChange={(val) => setFormData({...formData, tipoCampo: val})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIPOS_CAMPO.map(type => (
                      <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="descripcion">Descripción (Opcional)</Label>
              <Input
                id="descripcion"
                placeholder="Breve descripción para identificarla mejor"
                value={formData.descripcion}
                onChange={(e) => setFormData({...formData, descripcion: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="contenido">Contenido</Label>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="xs" 
                  className="h-6 text-xs gap-1"
                  onClick={insertVariable}
                >
                  <Braces className="h-3 w-3" />
                  Insertar Variable
                </Button>
              </div>
              <Textarea
                id="contenido"
                placeholder="Paciente refiere dolor en {{Localizacion}} con intensidad {{Intensidad}}/10..."
                className="h-32 font-mono text-sm"
                value={formData.contenido}
                onChange={(e) => setFormData({...formData, contenido: e.target.value})}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleSubmit} className="bg-blue-600 text-white">Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
