'use client';

import { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Loader2, ChevronsUpDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { apiGet } from '@/services/api';

const MESES = [
  { key: 'programadoEne', label: 'Enero' },
  { key: 'programadoFeb', label: 'Febrero' },
  { key: 'programadoMar', label: 'Marzo' },
  { key: 'programadoAbr', label: 'Abril' },
  { key: 'programadoMay', label: 'Mayo' },
  { key: 'programadoJun', label: 'Junio' },
  { key: 'programadoJul', label: 'Julio' },
  { key: 'programadoAgo', label: 'Agosto' },
  { key: 'programadoSep', label: 'Septiembre' },
  { key: 'programadoOct', label: 'Octubre' },
  { key: 'programadoNov', label: 'Noviembre' },
  { key: 'programadoDic', label: 'Diciembre' },
];

const PERIODICIDADES = [
  { value: 'UNICA', label: 'Única' },
  { value: 'SEMANAL', label: 'Semanal' },
  { value: 'QUINCENAL', label: 'Quincenal' },
  { value: 'MENSUAL', label: 'Mensual' },
  { value: 'BIMESTRAL', label: 'Bimestral' },
  { value: 'TRIMESTRAL', label: 'Trimestral' },
  { value: 'SEMESTRAL', label: 'Semestral' },
  { value: 'ANUAL', label: 'Anual' },
];

const ORIENTADO_A = [
  { value: 'PERSONAL_ADMINISTRATIVO', label: 'Personal Administrativo' },
  { value: 'PERSONAL_ASISTENCIAL', label: 'Personal Asistencial' },
];

export default function CapacitacionForm({ open, onClose, onSubmit, capacitacion, categorias, anio }) {
  const [loading, setLoading] = useState(false);
  const [usuarios, setUsuarios] = useState([]);
  const [loadingUsuarios, setLoadingUsuarios] = useState(false);
  const [responsableOpen, setResponsableOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    categoriaId: '',
    tema: '',
    actividad: '',
    orientadoA: [],
    responsableId: '',
    duracionMinutos: '',
    periodicidad: 'UNICA',
    programadoEne: false,
    programadoFeb: false,
    programadoMar: false,
    programadoAbr: false,
    programadoMay: false,
    programadoJun: false,
    programadoJul: false,
    programadoAgo: false,
    programadoSep: false,
    programadoOct: false,
    programadoNov: false,
    programadoDic: false,
  });

  // Cargar usuarios al abrir el diálogo
  useEffect(() => {
    if (open && usuarios.length === 0) {
      const fetchUsuarios = async () => {
        setLoadingUsuarios(true);
        try {
          const response = await apiGet('/usuarios?limit=500');
          if (response.success && response.data) {
            setUsuarios(response.data);
          }
        } catch (error) {
          console.error('Error cargando usuarios:', error);
        } finally {
          setLoadingUsuarios(false);
        }
      };
      fetchUsuarios();
    }
  }, [open]);

  // Filtrar usuarios según búsqueda
  const usuariosFiltrados = useMemo(() => {
    if (!searchTerm) return usuarios;
    const term = searchTerm.toLowerCase();
    return usuarios.filter(u =>
      u.nombre?.toLowerCase().includes(term) ||
      u.apellido?.toLowerCase().includes(term) ||
      u.email?.toLowerCase().includes(term) ||
      `${u.nombre} ${u.apellido}`.toLowerCase().includes(term)
    );
  }, [usuarios, searchTerm]);

  // Obtener nombre del responsable seleccionado
  const responsableSeleccionado = useMemo(() => {
    if (!formData.responsableId) return null;
    return usuarios.find(u => u.id === formData.responsableId);
  }, [formData.responsableId, usuarios]);

  // Convertir orientadoA de string a array
  const parseOrientadoA = (value) => {
    if (!value) return [];
    if (Array.isArray(value)) return value;
    return value.split(',').map(v => v.trim()).filter(Boolean);
  };

  useEffect(() => {
    if (capacitacion) {
      setFormData({
        categoriaId: capacitacion.categoriaId || capacitacion.categoria?.id || '',
        tema: capacitacion.tema || '',
        actividad: capacitacion.actividad || '',
        orientadoA: parseOrientadoA(capacitacion.orientadoA),
        responsableId: capacitacion.responsableId || '',
        duracionMinutos: capacitacion.duracionMinutos?.toString() || '',
        periodicidad: capacitacion.periodicidad || 'UNICA',
        programadoEne: capacitacion.programadoEne || false,
        programadoFeb: capacitacion.programadoFeb || false,
        programadoMar: capacitacion.programadoMar || false,
        programadoAbr: capacitacion.programadoAbr || false,
        programadoMay: capacitacion.programadoMay || false,
        programadoJun: capacitacion.programadoJun || false,
        programadoJul: capacitacion.programadoJul || false,
        programadoAgo: capacitacion.programadoAgo || false,
        programadoSep: capacitacion.programadoSep || false,
        programadoOct: capacitacion.programadoOct || false,
        programadoNov: capacitacion.programadoNov || false,
        programadoDic: capacitacion.programadoDic || false,
      });
    } else {
      setFormData({
        categoriaId: '',
        tema: '',
        actividad: '',
        orientadoA: [],
        responsableId: '',
        duracionMinutos: '',
        periodicidad: 'UNICA',
        programadoEne: false,
        programadoFeb: false,
        programadoMar: false,
        programadoAbr: false,
        programadoMay: false,
        programadoJun: false,
        programadoJul: false,
        programadoAgo: false,
        programadoSep: false,
        programadoOct: false,
        programadoNov: false,
        programadoDic: false,
      });
    }
  }, [capacitacion]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleOrientadoAChange = (value, checked) => {
    setFormData(prev => ({
      ...prev,
      orientadoA: checked
        ? [...prev.orientadoA, value]
        : prev.orientadoA.filter(v => v !== value)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = {
        ...formData,
        anio,
        duracionMinutos: formData.duracionMinutos ? parseInt(formData.duracionMinutos) : null,
        orientadoA: formData.orientadoA.join(','),
      };
      await onSubmit(data);
    } finally {
      setLoading(false);
    }
  };

  const selectedMonths = MESES.filter(m => formData[m.key]).length;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {capacitacion ? 'Editar Capacitación' : 'Nueva Capacitación'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="categoriaId">Categoría *</Label>
              <Select value={formData.categoriaId} onValueChange={(v) => handleChange('categoriaId', v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar categoría" />
                </SelectTrigger>
                <SelectContent>
                  {categorias?.map(cat => (
                    <SelectItem key={cat.id} value={cat.id}>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: cat.color || '#6366f1' }}
                        />
                        {cat.nombre}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="periodicidad">Periodicidad *</Label>
              <Select value={formData.periodicidad} onValueChange={(v) => handleChange('periodicidad', v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PERIODICIDADES.map(p => (
                    <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tema">Tema *</Label>
            <Input
              id="tema"
              value={formData.tema}
              onChange={(e) => handleChange('tema', e.target.value)}
              placeholder="Nombre del tema de capacitación"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="actividad">Actividad</Label>
              <Input
                id="actividad"
                value={formData.actividad}
                onChange={(e) => handleChange('actividad', e.target.value)}
                placeholder="Ej: Taller, Charla, Capacitación..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="duracionMinutos">Duración (minutos)</Label>
              <Input
                id="duracionMinutos"
                type="number"
                value={formData.duracionMinutos}
                onChange={(e) => handleChange('duracionMinutos', e.target.value)}
                placeholder="Ej: 60"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Orientado a *</Label>
            <div className="flex flex-wrap gap-4 p-3 border rounded-lg">
              {ORIENTADO_A.map(tipo => (
                <div key={tipo.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={tipo.value}
                    checked={formData.orientadoA.includes(tipo.value)}
                    onCheckedChange={(checked) => handleOrientadoAChange(tipo.value, checked)}
                  />
                  <Label htmlFor={tipo.value} className="text-sm font-normal cursor-pointer">
                    {tipo.label}
                  </Label>
                </div>
              ))}
            </div>
            {formData.orientadoA.length === 0 && (
              <p className="text-sm text-destructive">Debe seleccionar al menos una opción</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Responsable *</Label>
            <Popover open={responsableOpen} onOpenChange={setResponsableOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={responsableOpen}
                  className="w-full justify-between font-normal"
                >
                  {responsableSeleccionado ? (
                    <span className="truncate">
                      {responsableSeleccionado.nombre} {responsableSeleccionado.apellido}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">Seleccionar responsable...</span>
                  )}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[300px] p-0" align="start">
                <Command shouldFilter={false}>
                  <CommandInput
                    placeholder="Buscar por nombre o correo..."
                    value={searchTerm}
                    onValueChange={setSearchTerm}
                  />
                  <CommandList>
                    {loadingUsuarios ? (
                      <div className="flex items-center justify-center py-6">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className="ml-2 text-sm text-muted-foreground">Cargando usuarios...</span>
                      </div>
                    ) : (
                      <>
                        <CommandEmpty>No se encontraron usuarios.</CommandEmpty>
                        <CommandGroup className="max-h-[300px] overflow-y-auto">
                          {usuariosFiltrados.map((usuario) => {
                            const isSelected = formData.responsableId === usuario.id;
                            return (
                              <CommandItem
                                key={usuario.id}
                                value={usuario.id}
                                onSelect={() => {
                                  handleChange('responsableId', usuario.id);
                                  setResponsableOpen(false);
                                  setSearchTerm('');
                                }}
                                className="cursor-pointer"
                              >
                                <Check className={cn("mr-2 h-4 w-4", isSelected ? "opacity-100" : "opacity-0")} />
                                <div className="flex flex-col">
                                  <span className="font-medium">{usuario.nombre} {usuario.apellido}</span>
                                  <span className="text-xs text-muted-foreground">{usuario.email} • {usuario.rol}</span>
                                </div>
                              </CommandItem>
                            );
                          })}
                        </CommandGroup>
                      </>
                    )}
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label>Meses Programados * ({selectedMonths} seleccionados)</Label>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 p-3 border rounded-lg">
              {MESES.map(mes => (
                <div key={mes.key} className="flex items-center space-x-2">
                  <Checkbox
                    id={mes.key}
                    checked={formData[mes.key]}
                    onCheckedChange={(checked) => handleChange(mes.key, checked)}
                  />
                  <Label htmlFor={mes.key} className="text-sm font-normal cursor-pointer">
                    {mes.label}
                  </Label>
                </div>
              ))}
            </div>
            {selectedMonths === 0 && (
              <p className="text-sm text-destructive">Debe seleccionar al menos un mes</p>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading || !formData.categoriaId || !formData.tema || formData.orientadoA.length === 0 || !formData.responsableId || selectedMonths === 0}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {capacitacion ? 'Actualizar' : 'Crear'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
