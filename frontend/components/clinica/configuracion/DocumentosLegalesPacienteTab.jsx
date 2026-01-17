'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  FileText,
  Shield,
  Save,
  RefreshCw,
  Sparkles,
  Eye,
  Edit2,
} from 'lucide-react';
import { useDocumentosLegalesPaciente } from '@/hooks/useDocumentosLegalesPaciente';

const TIPOS_DOCUMENTO = [
  {
    tipo: 'TERMINOS_CONDICIONES',
    titulo: 'Términos y Condiciones',
    descripcion: 'Términos y condiciones de uso del servicio de citas',
    icon: FileText,
  },
  {
    tipo: 'POLITICA_PRIVACIDAD',
    titulo: 'Política de Privacidad',
    descripcion: 'Política de tratamiento de datos personales (Ley 1581/2012)',
    icon: Shield,
  },
];

export default function DocumentosLegalesPacienteTab() {
  const {
    documentos,
    loading,
    saving,
    fetchDocumentos,
    saveDocumento,
    seedDocumentos,
  } = useDocumentosLegalesPaciente();

  const [activeTab, setActiveTab] = useState('TERMINOS_CONDICIONES');
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    TERMINOS_CONDICIONES: { titulo: '', contenido: '', version: '1.0', activo: true },
    POLITICA_PRIVACIDAD: { titulo: '', contenido: '', version: '1.0', activo: true },
  });

  useEffect(() => {
    fetchDocumentos();
  }, [fetchDocumentos]);

  useEffect(() => {
    // Actualizar formData cuando se carguen los documentos
    if (documentos.length > 0) {
      const newFormData = { ...formData };
      documentos.forEach(doc => {
        if (newFormData[doc.tipo]) {
          newFormData[doc.tipo] = {
            titulo: doc.titulo || '',
            contenido: doc.contenido || '',
            version: doc.version || '1.0',
            activo: doc.activo !== undefined ? doc.activo : true,
          };
        }
      });
      setFormData(newFormData);
    }
  }, [documentos]);

  const handleChange = (tipo, field, value) => {
    setFormData(prev => ({
      ...prev,
      [tipo]: {
        ...prev[tipo],
        [field]: value,
      },
    }));
  };

  const handleSave = async (tipo) => {
    const data = formData[tipo];
    if (!data.titulo || !data.contenido) {
      alert('El título y contenido son requeridos');
      return;
    }
    await saveDocumento(tipo, data);
    setEditMode(false);
  };

  const handleSeed = async () => {
    if (confirm('¿Desea crear los documentos de ejemplo? Esto no sobrescribirá documentos existentes.')) {
      await seedDocumentos();
    }
  };

  const getDocumento = (tipo) => documentos.find(d => d.tipo === tipo);

  const renderDocumentoEditor = (tipoConfig) => {
    const { tipo, titulo, descripcion, icon: Icon } = tipoConfig;
    const documento = getDocumento(tipo);
    const data = formData[tipo];
    const hasContent = documento?.contenido || data.contenido;

    return (
      <Card className="mb-4">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">{titulo}</CardTitle>
                <CardDescription>{descripcion}</CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {documento && (
                <span className="text-xs text-muted-foreground">
                  v{documento.version} - Actualizado: {new Date(documento.updatedAt).toLocaleDateString('es-CO', { timeZone: 'America/Bogota' })}
                </span>
              )}
              <Button
                variant={editMode ? 'default' : 'outline'}
                size="sm"
                onClick={() => setEditMode(!editMode)}
              >
                {editMode ? <Eye className="h-4 w-4 mr-1" /> : <Edit2 className="h-4 w-4 mr-1" />}
                {editMode ? 'Vista previa' : 'Editar'}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {editMode ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor={`${tipo}-titulo`}>Título del documento</Label>
                  <Input
                    id={`${tipo}-titulo`}
                    value={data.titulo}
                    onChange={(e) => handleChange(tipo, 'titulo', e.target.value)}
                    placeholder="Ej: Términos y Condiciones de Servicio"
                  />
                </div>
                <div className="flex items-center gap-4">
                  <div>
                    <Label htmlFor={`${tipo}-version`}>Versión</Label>
                    <Input
                      id={`${tipo}-version`}
                      value={data.version}
                      onChange={(e) => handleChange(tipo, 'version', e.target.value)}
                      placeholder="1.0"
                      className="w-24"
                    />
                  </div>
                  <div className="flex items-center gap-2 mt-6">
                    <Switch
                      id={`${tipo}-activo`}
                      checked={data.activo}
                      onCheckedChange={(checked) => handleChange(tipo, 'activo', checked)}
                    />
                    <Label htmlFor={`${tipo}-activo`}>Activo</Label>
                  </div>
                </div>
              </div>

              <div>
                <Label htmlFor={`${tipo}-contenido`}>
                  Contenido (soporta Markdown)
                </Label>
                <Textarea
                  id={`${tipo}-contenido`}
                  value={data.contenido}
                  onChange={(e) => handleChange(tipo, 'contenido', e.target.value)}
                  placeholder="Escriba el contenido del documento aquí. Puede usar formato Markdown."
                  className="min-h-[400px] font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Tip: Use # para títulos, ## para subtítulos, **texto** para negritas, *texto* para cursivas
                </p>
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setEditMode(false)}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={() => handleSave(tipo)}
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Guardar cambios
                    </>
                  )}
                </Button>
              </div>
            </div>
          ) : hasContent ? (
            <div className="prose prose-sm max-w-none dark:prose-invert">
              <div className="bg-muted/50 rounded-lg p-4 max-h-[400px] overflow-y-auto">
                <pre className="whitespace-pre-wrap font-sans text-sm">
                  {data.contenido || documento?.contenido}
                </pre>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Icon className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No hay contenido configurado para este documento.</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={() => setEditMode(true)}
              >
                <Edit2 className="h-4 w-4 mr-1" />
                Agregar contenido
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  if (loading && documentos.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Documentos Legales</h2>
          <p className="text-muted-foreground">
            Configure los términos y condiciones y la política de privacidad que se muestran a los pacientes
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={fetchDocumentos}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
          {documentos.length === 0 && (
            <Button
              onClick={handleSeed}
              disabled={saving}
            >
              <Sparkles className="h-4 w-4 mr-2" />
              Crear ejemplos
            </Button>
          )}
        </div>
      </div>

      {/* Tabs para cada tipo de documento */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          {TIPOS_DOCUMENTO.map(({ tipo, titulo, icon: Icon }) => (
            <TabsTrigger key={tipo} value={tipo} className="flex items-center gap-2">
              <Icon className="h-4 w-4" />
              {titulo}
            </TabsTrigger>
          ))}
        </TabsList>

        {TIPOS_DOCUMENTO.map((tipoConfig) => (
          <TabsContent key={tipoConfig.tipo} value={tipoConfig.tipo}>
            {renderDocumentoEditor(tipoConfig)}
          </TabsContent>
        ))}
      </Tabs>

      {/* Info adicional */}
      <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
        <CardContent className="pt-4">
          <div className="flex gap-3">
            <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800 dark:text-blue-200">
              <p className="font-medium mb-1">Información importante:</p>
              <ul className="list-disc list-inside space-y-1 text-blue-700 dark:text-blue-300">
                <li>Los documentos se muestran a los pacientes durante el agendamiento de citas</li>
                <li>Los cambios se reflejan inmediatamente en la plataforma de pacientes</li>
                <li>Asegúrese de cumplir con la Ley 1581 de 2012 para la política de privacidad</li>
                <li>El contenido soporta formato Markdown para una mejor presentación</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
