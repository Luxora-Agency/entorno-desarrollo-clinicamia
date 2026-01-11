'use client';

import { useState, useEffect, useRef } from 'react';
import { Plus, Upload, FolderPlus, Search, LayoutGrid, List, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { FolderTree } from '../../shared/FolderTree';
import { DocumentGrid, DocumentList } from '../../shared/DocumentGrid';
import { useCalidad2Carpetas } from '@/hooks/useCalidad2Carpetas';
import { useCalidad2Documentos } from '@/hooks/useCalidad2Documentos';

const TIPO = 'PROCESOS';

export default function ProcesosTab({ user }) {
  const {
    carpetaTree,
    loading: loadingCarpetas,
    loadCarpetaTree,
    createCarpeta,
    updateCarpeta,
    deleteCarpeta,
  } = useCalidad2Carpetas(TIPO);

  const {
    documentos,
    loading: loadingDocumentos,
    uploading,
    loadDocumentos,
    uploadDocumento,
    deleteDocumento,
  } = useCalidad2Documentos(null, TIPO);

  const [selectedFolderId, setSelectedFolderId] = useState(null);
  const [viewMode, setViewMode] = useState('grid');
  const [searchTerm, setSearchTerm] = useState('');

  // Modals
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [editingFolder, setEditingFolder] = useState(null);
  const [parentFolderId, setParentFolderId] = useState(null);

  // Form states
  const [folderName, setFolderName] = useState('');
  const [folderDescription, setFolderDescription] = useState('');
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadName, setUploadName] = useState('');
  const [uploadDescription, setUploadDescription] = useState('');

  const fileInputRef = useRef(null);

  useEffect(() => {
    loadCarpetaTree(TIPO);
  }, [loadCarpetaTree]);

  useEffect(() => {
    loadDocumentos({ carpetaId: selectedFolderId, tipo: TIPO });
  }, [selectedFolderId, loadDocumentos]);

  const filteredDocuments = (documentos || []).filter((doc) =>
    !searchTerm ||
    doc.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.archivoNombre?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenCreateFolder = (parentId = null) => {
    setEditingFolder(null);
    setParentFolderId(parentId);
    setFolderName('');
    setFolderDescription('');
    setShowFolderModal(true);
  };

  const handleOpenEditFolder = (folder) => {
    setEditingFolder(folder);
    setParentFolderId(folder.parentId);
    setFolderName(folder.nombre);
    setFolderDescription(folder.descripcion || '');
    setShowFolderModal(true);
  };

  const handleSaveFolder = async () => {
    if (!folderName.trim()) return;

    const data = {
      nombre: folderName,
      descripcion: folderDescription,
      tipo: TIPO,
      parentId: parentFolderId,
    };

    if (editingFolder) {
      await updateCarpeta(editingFolder.id, data);
    } else {
      await createCarpeta(data);
    }

    setShowFolderModal(false);
  };

  const handleDeleteFolder = async (id) => {
    if (window.confirm('Esta accion eliminara la carpeta. Los documentos y subcarpetas se moverán al nivel superior.')) {
      // Primero deseleccionar si es la carpeta seleccionada
      if (selectedFolderId === id) {
        setSelectedFolderId(null);
      }
      // Luego eliminar
      await deleteCarpeta(id);
    }
  };

  const handleOpenUploadModal = () => {
    setUploadFile(null);
    setUploadName('');
    setUploadDescription('');
    setShowUploadModal(true);
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadFile(file);
      if (!uploadName) {
        setUploadName(file.name.replace(/\.[^/.]+$/, ''));
      }
    }
  };

  const handleUpload = async () => {
    if (!uploadFile) return;

    await uploadDocumento(uploadFile, {
      nombre: uploadName || uploadFile.name,
      descripcion: uploadDescription,
      carpetaId: selectedFolderId,
      tipo: TIPO,
    });

    setShowUploadModal(false);
    loadDocumentos({ carpetaId: selectedFolderId, tipo: TIPO });
  };

  const handleDeleteDocument = async (id) => {
    if (window.confirm('Esta seguro de eliminar este documento?')) {
      await deleteDocumento(id);
    }
  };

  return (
    <div className="h-full flex gap-6">
      {/* Sidebar - Folder Tree */}
      <Card className="w-64 flex-shrink-0">
        <CardHeader className="py-3">
          <CardTitle className="text-sm font-medium flex items-center justify-between">
            Carpetas
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
              onClick={() => handleOpenCreateFolder(null)}
            >
              <FolderPlus className="w-4 h-4" />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="py-0">
          <FolderTree
            folders={carpetaTree}
            selectedFolderId={selectedFolderId}
            onSelect={setSelectedFolderId}
            onCreateFolder={handleOpenCreateFolder}
            onEditFolder={handleOpenEditFolder}
            onDeleteFolder={handleDeleteFolder}
          />
        </CardContent>
      </Card>

      {/* Documents area */}
      <Card className="flex-1 flex flex-col min-w-0">
        <CardHeader className="py-3 border-b">
          <div className="flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Buscar documentos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
              >
                <LayoutGrid className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                <List className="w-4 h-4" />
              </Button>
              <Button onClick={handleOpenUploadModal}>
                <Upload className="w-4 h-4 mr-2" />
                Subir
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex-1 overflow-auto py-4">
          {loadingDocumentos ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
            </div>
          ) : viewMode === 'grid' ? (
            <DocumentGrid
              documents={filteredDocuments}
              onDelete={handleDeleteDocument}
              emptyMessage="No hay documentos de procesos"
            />
          ) : (
            <DocumentList
              documents={filteredDocuments}
              onDelete={handleDeleteDocument}
              emptyMessage="No hay documentos de procesos"
            />
          )}
        </CardContent>
      </Card>

      {/* Folder Modal */}
      <Dialog open={showFolderModal} onOpenChange={setShowFolderModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingFolder ? 'Editar carpeta' : 'Nueva carpeta'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Nombre</Label>
              <Input
                value={folderName}
                onChange={(e) => setFolderName(e.target.value)}
                placeholder="Nombre de la carpeta"
              />
            </div>
            <div>
              <Label>Descripcion (opcional)</Label>
              <Textarea
                value={folderDescription}
                onChange={(e) => setFolderDescription(e.target.value)}
                placeholder="Descripcion"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowFolderModal(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveFolder} disabled={!folderName.trim()}>
              {editingFolder ? 'Guardar' : 'Crear'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Upload Modal */}
      <Dialog open={showUploadModal} onOpenChange={setShowUploadModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Subir documento</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Archivo</Label>
              <div
                className="mt-2 border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-blue-400"
                onClick={() => fileInputRef.current?.click()}
              >
                {uploadFile ? (
                  <div>
                    <p className="font-medium">{uploadFile.name}</p>
                    <p className="text-sm text-gray-500">{(uploadFile.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                ) : (
                  <div className="text-gray-500">
                    <Upload className="w-8 h-8 mx-auto mb-2" />
                    <p>Seleccionar archivo</p>
                  </div>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.webp"
                onChange={handleFileChange}
              />
            </div>
            <div>
              <Label>Nombre</Label>
              <Input
                value={uploadName}
                onChange={(e) => setUploadName(e.target.value)}
                placeholder="Nombre del documento"
              />
            </div>
            <div>
              <Label>Descripcion (opcional)</Label>
              <Textarea
                value={uploadDescription}
                onChange={(e) => setUploadDescription(e.target.value)}
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUploadModal(false)}>
              Cancelar
            </Button>
            <Button onClick={handleUpload} disabled={!uploadFile || uploading}>
              {uploading ? 'Subiendo...' : 'Subir'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
