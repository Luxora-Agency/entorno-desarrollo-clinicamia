'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BookOpen, Plus, ExternalLink, Trash2, FileText } from 'lucide-react';
import { toast } from 'sonner';

/**
 * Lista y gestión de bibliografía de una GPC
 * Permite agregar referencias, artículos y documentos de soporte
 */
export default function BibliografiaGPCList({ gpcId, bibliografia = [], onAdd, onDelete }) {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    titulo: '',
    autor: '',
    fuente: '',
    anio: new Date().getFullYear().toString(),
    pais: '',
    tipo: 'ARTICULO',
    url: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.titulo || !formData.fuente) {
      toast.error('Título y fuente son obligatorios');
      return;
    }

    const data = {
      gpcId,
      ...formData,
      anio: parseInt(formData.anio),
    };

    await onAdd(data);
    setShowForm(false);
    setFormData({
      titulo: '',
      autor: '',
      fuente: '',
      anio: new Date().getFullYear().toString(),
      pais: '',
      tipo: 'ARTICULO',
      url: '',
    });
  };

  const handleDelete = async (id) => {
    if (confirm('¿Está seguro de eliminar esta referencia bibliográfica?')) {
      await onDelete(id);
    }
  };

  const getTipoColor = (tipo) => {
    const colors = {
      ARTICULO: 'blue',
      GUIA: 'green',
      MANUAL: 'purple',
      LIBRO: 'orange',
    };
    return colors[tipo] || 'default';
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-muted-foreground" />
          <h3 className="font-medium">Bibliografía y Referencias</h3>
          <Badge variant="outline">{bibliografia.length}</Badge>
        </div>
        <Button size="sm" onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Agregar Referencia
        </Button>
      </div>

      {bibliografia.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            <BookOpen className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No hay referencias bibliográficas</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {bibliografia.map((ref) => (
            <Card key={ref.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant={getTipoColor(ref.tipo)}>{ref.tipo}</Badge>
                      {ref.anio && <Badge variant="outline">{ref.anio}</Badge>}
                      {ref.pais && <Badge variant="outline">{ref.pais}</Badge>}
                    </div>

                    <h4 className="font-medium mb-1">{ref.titulo}</h4>

                    {ref.autor && (
                      <p className="text-sm text-muted-foreground mb-1">
                        <span className="font-medium">Autor:</span> {ref.autor}
                      </p>
                    )}

                    {ref.fuente && (
                      <p className="text-sm text-muted-foreground mb-1">
                        <span className="font-medium">Fuente:</span> {ref.fuente}
                      </p>
                    )}

                    {ref.url && (
                      <a
                        href={ref.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline inline-flex items-center gap-1 mt-2"
                      >
                        Ver enlace <ExternalLink className="h-3 w-3" />
                      </a>
                    )}

                    {ref.archivoUrl && (
                      <a
                        href={ref.archivoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline inline-flex items-center gap-1 mt-2 ml-4"
                      >
                        <FileText className="h-3 w-3" />
                        Ver documento
                      </a>
                    )}
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(ref.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Formulario para agregar referencia */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Agregar Referencia Bibliográfica</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="titulo">
                Título <span className="text-red-500">*</span>
              </Label>
              <Input
                id="titulo"
                name="titulo"
                value={formData.titulo}
                onChange={handleChange}
                required
                placeholder="Título de la referencia"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tipo">Tipo de Referencia</Label>
                <Select
                  name="tipo"
                  value={formData.tipo}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, tipo: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ARTICULO">Artículo</SelectItem>
                    <SelectItem value="GUIA">Guía</SelectItem>
                    <SelectItem value="MANUAL">Manual</SelectItem>
                    <SelectItem value="LIBRO">Libro</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="anio">Año</Label>
                <Input
                  type="number"
                  id="anio"
                  name="anio"
                  value={formData.anio}
                  onChange={handleChange}
                  min="1900"
                  max={new Date().getFullYear() + 1}
                  placeholder="2024"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="autor">Autor(es)</Label>
              <Input
                id="autor"
                name="autor"
                value={formData.autor}
                onChange={handleChange}
                placeholder="Nombre del autor o autores"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="fuente">
                Fuente <span className="text-red-500">*</span>
              </Label>
              <Input
                id="fuente"
                name="fuente"
                value={formData.fuente}
                onChange={handleChange}
                required
                placeholder="Revista, institución, editorial, etc."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="pais">País</Label>
              <Input
                id="pais"
                name="pais"
                value={formData.pais}
                onChange={handleChange}
                placeholder="País de origen"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="url">URL</Label>
              <Input
                type="url"
                id="url"
                name="url"
                value={formData.url}
                onChange={handleChange}
                placeholder="https://..."
              />
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                Cancelar
              </Button>
              <Button type="submit">Agregar Referencia</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
