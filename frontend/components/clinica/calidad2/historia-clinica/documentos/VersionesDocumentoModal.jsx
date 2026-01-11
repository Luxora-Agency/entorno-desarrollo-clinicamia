'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Download, History, FileText } from 'lucide-react';
import { useCalidad2DocumentosHC } from '@/hooks/useCalidad2DocumentosHC';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

/**
 * Modal para ver y crear versiones de un documento
 *
 * Features:
 * - Lista de versiones ordenadas por fecha
 * - Formulario para crear nueva versión
 * - Descarga de versiones anteriores
 * - Información del creador de cada versión
 */
export default function VersionesDocumentoModal({ documento, onClose }) {
  const { versiones, loading, fetchVersiones, crearVersion } = useCalidad2DocumentosHC();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    version: '',
    cambiosRealizados: '',
    archivoUrl: '',
    archivoNombre: '',
    creadoPor: '', // TODO: Get from auth context
  });

  // Cargar versiones al abrir
  useEffect(() => {
    if (documento?.id) {
      fetchVersiones(documento.id);
    }
  }, [documento, fetchVersiones]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.version.trim()) {
      return;
    }

    // TODO: Get userId from auth context
    const versionData = {
      ...formData,
      creadoPor: formData.creadoPor || 'ae30340c-c5a1-46a2-854d-38011aeaf20c', // Placeholder
    };

    const result = await crearVersion(documento.id, versionData);
    if (result.success) {
      setShowForm(false);
      setFormData({
        version: '',
        cambiosRealizados: '',
        archivoUrl: '',
        archivoNombre: '',
        creadoPor: '',
      });
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Versiones del Documento
              </DialogTitle>
              <DialogDescription>
                {documento?.codigo} - {documento?.nombre}
              </DialogDescription>
            </div>
            <Button size="sm" onClick={() => setShowForm(!showForm)}>
              <Plus className="mr-2 h-4 w-4" />
              Nueva Versión
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {/* Formulario de nueva versión */}
          {showForm && (
            <Card className="border-dashed">
              <CardHeader>
                <CardTitle className="text-base">Crear Nueva Versión</CardTitle>
                <CardDescription>
                  Complete la información de la nueva versión
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="version">Número de Versión *</Label>
                    <Input
                      id="version"
                      placeholder="2.0"
                      value={formData.version}
                      onChange={(e) => handleChange('version', e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cambiosRealizados">Cambios Realizados *</Label>
                    <Textarea
                      id="cambiosRealizados"
                      placeholder="Describa los cambios y mejoras en esta versión..."
                      value={formData.cambiosRealizados}
                      onChange={(e) => handleChange('cambiosRealizados', e.target.value)}
                      rows={3}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="archivoUrl">URL del Archivo</Label>
                    <Input
                      id="archivoUrl"
                      type="url"
                      placeholder="https://..."
                      value={formData.archivoUrl}
                      onChange={(e) => handleChange('archivoUrl', e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="archivoNombre">Nombre del Archivo</Label>
                    <Input
                      id="archivoNombre"
                      placeholder="manual_hc_v2.pdf"
                      value={formData.archivoNombre}
                      onChange={(e) => handleChange('archivoNombre', e.target.value)}
                    />
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowForm(false)}
                    >
                      Cancelar
                    </Button>
                    <Button type="submit">Crear Versión</Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Lista de versiones */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium">
                Historial de Versiones ({versiones.length})
              </h4>
            </div>

            {loading ? (
              <Card>
                <CardContent className="py-8 text-center">
                  <p className="text-sm text-muted-foreground">Cargando versiones...</p>
                </CardContent>
              </Card>
            ) : versiones.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center">
                  <History className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-sm text-muted-foreground">No hay versiones registradas</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {versiones.map((version, index) => (
                  <Card key={version.id} className={index === 0 ? 'border-primary' : ''}>
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            <span className="font-semibold">Versión {version.version}</span>
                            {index === 0 && (
                              <Badge variant="default" className="ml-2">
                                Actual
                              </Badge>
                            )}
                          </div>

                          <div className="text-sm text-muted-foreground">
                            {format(
                              new Date(version.fechaVersion),
                              "dd 'de' MMMM 'de' yyyy 'a las' HH:mm",
                              { locale: es }
                            )}
                          </div>

                          <div className="text-sm">
                            <span className="font-medium">Creado por:</span>{' '}
                            {version.creador
                              ? `${version.creador.nombre} ${version.creador.apellido}`
                              : 'N/A'}
                          </div>

                          <div className="text-sm bg-muted p-3 rounded-md mt-2">
                            <span className="font-medium">Cambios:</span>
                            <p className="mt-1 whitespace-pre-wrap">
                              {version.cambiosRealizados}
                            </p>
                          </div>

                          {version.archivoNombre && (
                            <div className="text-sm text-muted-foreground">
                              Archivo: {version.archivoNombre}
                            </div>
                          )}
                        </div>

                        {version.archivoUrl && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => window.open(version.archivoUrl, '_blank')}
                          >
                            <Download className="mr-2 h-4 w-4" />
                            Descargar
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
