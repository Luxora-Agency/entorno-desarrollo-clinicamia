'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Plus, Edit, Trash2, GripVertical, Loader2 } from 'lucide-react';
import { useCategoriasCapacitacion } from '@/hooks/useCategoriasCapacitacion';

const COLORES = [
  '#3b82f6', '#22c55e', '#eab308', '#ef4444', '#8b5cf6',
  '#ec4899', '#14b8a6', '#f97316', '#6366f1', '#84cc16',
];

export default function CategoriasManager() {
  const [showForm, setShowForm] = useState(false);
  const [selectedCategoria, setSelectedCategoria] = useState(null);
  const [formData, setFormData] = useState({ nombre: '', descripcion: '', color: '#3b82f6' });
  const [saving, setSaving] = useState(false);

  const { categorias, loading, loadCategorias, createCategoria, updateCategoria, deleteCategoria } = useCategoriasCapacitacion();

  useEffect(() => {
    loadCategorias();
  }, [loadCategorias]);

  useEffect(() => {
    if (selectedCategoria) {
      setFormData({
        nombre: selectedCategoria.nombre || '',
        descripcion: selectedCategoria.descripcion || '',
        color: selectedCategoria.color || '#3b82f6',
      });
    } else {
      setFormData({ nombre: '', descripcion: '', color: '#3b82f6' });
    }
  }, [selectedCategoria]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (selectedCategoria) {
        await updateCategoria(selectedCategoria.id, formData);
      } else {
        await createCategoria(formData);
      }
      setShowForm(false);
      setSelectedCategoria(null);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (confirm('Esta seguro de eliminar esta categoria?')) {
      await deleteCategoria(id);
    }
  };

  const handleEdit = (cat) => {
    setSelectedCategoria(cat);
    setShowForm(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold">Categorias de Capacitacion</h2>
          <p className="text-sm text-muted-foreground">
            Administra las categorias para organizar el cronograma
          </p>
        </div>
        <Button onClick={() => { setSelectedCategoria(null); setShowForm(true); }}>
          <Plus className="h-4 w-4 mr-2" />
          Nueva Categoria
        </Button>
      </div>

      {loading ? (
        <Card>
          <CardContent className="py-8 text-center">
            <Loader2 className="h-6 w-6 animate-spin mx-auto" />
          </CardContent>
        </Card>
      ) : categorias.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No hay categorias creadas
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {categorias.map((cat, idx) => (
            <Card key={cat.id} className="hover:border-primary/50 transition-colors">
              <CardContent className="py-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <GripVertical className="h-5 w-5 text-muted-foreground cursor-grab" />
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: cat.color || '#6366f1' }}
                    />
                    <div>
                      <p className="font-medium">{cat.nombre}</p>
                      {cat.descripcion && (
                        <p className="text-sm text-muted-foreground">{cat.descripcion}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">
                      {cat._count?.capacitaciones || 0} capacitaciones
                    </Badge>
                    <Button size="icon" variant="ghost" onClick={() => handleEdit(cat)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="text-destructive"
                      onClick={() => handleDelete(cat.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Form Modal */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedCategoria ? 'Editar Categoria' : 'Nueva Categoria'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Nombre *</Label>
              <Input
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                placeholder="Ej: ESTANDAR DE TALENTO HUMANO"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Descripcion</Label>
              <Input
                value={formData.descripcion}
                onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                placeholder="Descripcion opcional"
              />
            </div>
            <div className="space-y-2">
              <Label>Color</Label>
              <div className="flex gap-2">
                {COLORES.map(color => (
                  <button
                    key={color}
                    type="button"
                    className={`w-8 h-8 rounded-full transition-all ${formData.color === color ? 'ring-2 ring-offset-2 ring-primary' : ''}`}
                    style={{ backgroundColor: color }}
                    onClick={() => setFormData({ ...formData, color })}
                  />
                ))}
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={saving || !formData.nombre}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {selectedCategoria ? 'Actualizar' : 'Crear'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
