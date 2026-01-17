'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Plus, FileText, Search, FolderOpen, AlertTriangle, Download } from 'lucide-react';
import useSST from '@/hooks/useSST';

export default function DocumentosSSTTab({ user }) {
  const {
    documentosSST,
    fetchDocumentosSST,
    getDocumentosVencidos,
    loading
  } = useSST();

  const [search, setSearch] = useState('');
  const [tipoFilter, setTipoFilter] = useState('');
  const [vencidos, setVencidos] = useState([]);

  useEffect(() => {
    fetchDocumentosSST({ search, tipo: tipoFilter });
    getDocumentosVencidos().then(data => setVencidos(data || []));
  }, [search, tipoFilter, fetchDocumentosSST, getDocumentosVencidos]);

  const getEstadoBadge = (estado) => {
    const estados = {
      BORRADOR: { variant: 'outline', label: 'Borrador' },
      EN_REVISION: { variant: 'secondary', label: 'En Revision' },
      APROBADO: { variant: 'default', label: 'Aprobado' },
      VIGENTE: { variant: 'success', label: 'Vigente' },
      OBSOLETO: { variant: 'destructive', label: 'Obsoleto' },
    };
    const config = estados[estado] || { variant: 'outline', label: estado };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Documentos del SG-SST</h2>
          <p className="text-sm text-gray-500">Politicas, programas, procedimientos y formatos</p>
        </div>
        <Button onClick={() => {}}>
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Documento
        </Button>
      </div>

      {/* Alerta documentos vencidos */}
      {vencidos.length > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-8 h-8 text-orange-500" />
              <div>
                <p className="font-medium text-orange-700">{vencidos.length} documentos vencidos</p>
                <p className="text-sm text-orange-600">Requieren actualizacion</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filtros */}
      <Card>
        <CardContent className="py-4">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Buscar documento..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={tipoFilter}
              onChange={(e) => setTipoFilter(e.target.value)}
              className="border rounded px-3 py-2 text-sm"
            >
              <option value="">Todos los tipos</option>
              <option value="POLITICA">Politica</option>
              <option value="PROGRAMA">Programa</option>
              <option value="PROCEDIMIENTO">Procedimiento</option>
              <option value="INSTRUCTIVO">Instructivo</option>
              <option value="FORMATO">Formato</option>
              <option value="MANUAL">Manual</option>
              <option value="PLAN">Plan</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Tabla */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Codigo</TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Version</TableHead>
                <TableHead>Vigencia</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                  </TableCell>
                </TableRow>
              ) : documentosSST.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                    <FolderOpen className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    No hay documentos registrados
                  </TableCell>
                </TableRow>
              ) : (
                documentosSST.map((doc) => (
                  <TableRow key={doc.id}>
                    <TableCell className="font-mono text-sm">{doc.codigo}</TableCell>
                    <TableCell className="max-w-48 truncate">{doc.nombre}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{doc.tipoDocumento}</Badge>
                    </TableCell>
                    <TableCell>{doc.version}</TableCell>
                    <TableCell>
                      {doc.fechaVigencia && (
                        <span className={
                          new Date(doc.fechaVigencia) < new Date()
                            ? 'text-red-500 font-medium'
                            : ''
                        }>
                          {new Date(doc.fechaVigencia).toLocaleDateString('es-CO', { timeZone: 'America/Bogota' })}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>{getEstadoBadge(doc.estado)}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm">
                        <Download className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
