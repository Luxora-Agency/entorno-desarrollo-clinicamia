'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shield, FileText, Book, Clipboard } from 'lucide-react';
import { useCalidad2ProtocolosPP } from '@/hooks/useCalidad2ProtocolosPP';

/**
 * Vista de protocolos agrupados por categoría
 * Muestra SEGURIDAD, GENERAL, ASISTENCIAL, SIAU
 */
export default function ProtocolosByCategoria() {
  const { protocolos, loading } = useCalidad2ProtocolosPP();

  // Agrupar por categoría
  const protocolosPorCategoria = protocolos.reduce((acc, protocolo) => {
    if (!acc[protocolo.categoria]) {
      acc[protocolo.categoria] = [];
    }
    acc[protocolo.categoria].push(protocolo);
    return acc;
  }, {});

  const categorias = [
    {
      id: 'SEGURIDAD',
      nombre: 'Seguridad del Paciente',
      icon: Shield,
      color: 'green',
      descripcion: 'Protocolos de prácticas seguras y prevención de eventos adversos',
    },
    {
      id: 'GENERAL',
      nombre: 'Protocolos Generales',
      icon: FileText,
      color: 'blue',
      descripcion: 'Bioseguridad, referencia, contrarreferencia y protocolos transversales',
    },
    {
      id: 'ASISTENCIAL',
      nombre: 'Protocolos Asistenciales',
      icon: Book,
      color: 'purple',
      descripcion: 'Manuales de atención por especialidad y procedimientos',
    },
    {
      id: 'SIAU',
      nombre: 'SIAU',
      icon: Clipboard,
      color: 'orange',
      descripcion: 'Educación al usuario y atención',
    },
  ];

  const getTipoColor = (tipo) => {
    const colors = {
      PROTOCOLO: 'blue',
      MANUAL: 'purple',
      POLITICA: 'green',
      PROGRAMA: 'orange',
      FORMATO: 'cyan',
    };
    return colors[tipo] || 'default';
  };

  const getCategoriaIcon = (categoriaId) => {
    const categoria = categorias.find((c) => c.id === categoriaId);
    return categoria ? categoria.icon : FileText;
  };

  const getCategoriaColor = (categoriaId) => {
    const categoria = categorias.find((c) => c.id === categoriaId);
    return categoria ? categoria.color : 'default';
  };

  return (
    <div className="space-y-6">
      {categorias.map((categoria) => {
        const Icon = categoria.icon;
        const protocolosCategoria = protocolosPorCategoria[categoria.id] || [];

        if (protocolosCategoria.length === 0) return null;

        return (
          <Card key={categoria.id}>
            <CardHeader className={`bg-${categoria.color}-50 border-b`}>
              <CardTitle className="text-base font-medium flex items-center gap-2">
                <Icon className={`h-5 w-5 text-${categoria.color}-600`} />
                {categoria.nombre}
                <Badge variant="outline" className="ml-auto">
                  {protocolosCategoria.length}
                </Badge>
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">{categoria.descripcion}</p>
            </CardHeader>
            <CardContent className="p-4">
              <div className="space-y-3">
                {protocolosCategoria.map((protocolo) => (
                  <div
                    key={protocolo.id}
                    className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className="font-mono text-xs">
                          {protocolo.codigo}
                        </Badge>
                        <Badge variant={getTipoColor(protocolo.tipo)} className="text-xs">
                          {protocolo.tipo}
                        </Badge>
                        <Badge
                          variant={protocolo.estado === 'VIGENTE' ? 'success' : 'default'}
                          className="text-xs"
                        >
                          {protocolo.estado}
                        </Badge>
                      </div>
                      <p className="font-medium">{protocolo.nombre}</p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        <span>Versión: {protocolo.version}</span>
                        <span>
                          Vigencia: {new Date(protocolo.fechaVigencia).toLocaleDateString('es-CO')}
                        </span>
                        {protocolo.documentos && protocolo.documentos.length > 0 && (
                          <span>{protocolo.documentos.length} documentos</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        );
      })}

      {Object.keys(protocolosPorCategoria).length === 0 && (
        <Card>
          <CardContent className="p-12 text-center text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No hay protocolos registrados</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
