'use client';

import { useState, useEffect, useRef } from 'react';
import { Upload, FileText, CheckCircle, XCircle, AlertTriangle, Trash2, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Label } from '@/components/ui/label';
import { useCalidad2Personal } from '@/hooks/useCalidad2Personal';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

export default function PersonalCarpetaModal({ personalId, open, onClose }) {
  const {
    currentPersonal,
    documentos,
    checklist,
    loading,
    uploading,
    getPersonal,
    loadDocumentos,
    loadChecklist,
    uploadDocumento,
    deleteDocumento,
    updateChecklistItem,
  } = useCalidad2Personal();

  const [selectedItem, setSelectedItem] = useState(null);
  const [uploadName, setUploadName] = useState('');
  const [uploadFechaEmision, setUploadFechaEmision] = useState('');
  const [uploadFechaVencimiento, setUploadFechaVencimiento] = useState('');
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (personalId && open) {
      getPersonal(personalId);
      loadDocumentos(personalId);
      loadChecklist(personalId);
    }
  }, [personalId, open, getPersonal, loadDocumentos, loadChecklist]);

  const handleSelectItem = (item) => {
    setSelectedItem(item);
    setUploadName(item.nombre);
    setUploadFechaEmision('');
    setUploadFechaVencimiento('');
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !personalId) return;

    await uploadDocumento(personalId, file, {
      nombre: uploadName || selectedItem?.nombre || file.name,
      checklistItemId: selectedItem?.id,
      fechaEmision: uploadFechaEmision ? new Date(uploadFechaEmision).toISOString() : null,
      fechaVencimiento: uploadFechaVencimiento ? new Date(uploadFechaVencimiento).toISOString() : null,
    });

    setSelectedItem(null);
    e.target.value = '';
  };

  const handleDeleteDoc = async (docId) => {
    if (window.confirm('Esta seguro de eliminar este documento?')) {
      await deleteDocumento(personalId, docId);
    }
  };

  const handleViewDoc = (doc) => {
    const url = doc.archivoUrl?.startsWith('http')
      ? doc.archivoUrl
      : `${API_BASE_URL.replace('/api', '')}${doc.archivoUrl}`;
    window.open(url, '_blank');
  };

  // Group checklist items by category
  const groupedItems = checklist?.items?.reduce((acc, item) => {
    const cat = item.categoria || 'Sin categoría';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {}) || {};

  // Find documents linked to a checklist item
  const getItemDocuments = (itemId) => {
    return (documentos || []).filter(doc => doc.checklistItemId === itemId);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-4">
            <span>Carpeta de {currentPersonal?.nombreCompleto}</span>
            {checklist && (
              <Badge variant={checklist.porcentajeCompletado === 100 ? 'success' : 'secondary'}>
                {checklist.porcentajeCompletado}% completo
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
          </div>
        ) : (
          <div className="space-y-4">
            {/* Stats */}
            {checklist && (
              <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">{checklist.itemsCompletados}</p>
                  <p className="text-xs text-gray-500">Completados</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-yellow-600">{checklist.itemsPendientes}</p>
                  <p className="text-xs text-gray-500">Pendientes</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-600">{checklist.totalItems}</p>
                  <p className="text-xs text-gray-500">Total Items</p>
                </div>
              </div>
            )}

            {/* Checklist by category */}
            <Accordion type="multiple" defaultValue={Object.keys(groupedItems)} className="space-y-2">
              {Object.entries(groupedItems).map(([categoria, items]) => (
                <AccordionItem key={categoria} value={categoria} className="border rounded-lg">
                  <AccordionTrigger className="px-4 hover:no-underline">
                    <div className="flex items-center justify-between w-full pr-4">
                      <span className="font-medium">{categoria}</span>
                      <Badge variant="outline">
                        {items.filter(i => i.estado?.cumple).length}/{items.length}
                      </Badge>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-4">
                    <div className="space-y-3">
                      {items.map((item) => {
                        const itemDocs = getItemDocuments(item.id);
                        const hasDocs = itemDocs.length > 0;
                        const isComplete = item.estado?.cumple;

                        return (
                          <div
                            key={item.id}
                            className={`p-3 border rounded-lg ${
                              isComplete ? 'bg-green-50 border-green-200' : 'bg-white'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  {isComplete ? (
                                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                                  ) : item.esObligatorio ? (
                                    <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                                  ) : (
                                    <div className="w-5 h-5 border-2 rounded-full flex-shrink-0" />
                                  )}
                                  <span className="font-medium">{item.nombre}</span>
                                  {item.esObligatorio && (
                                    <Badge variant="destructive" className="text-xs">Obligatorio</Badge>
                                  )}
                                  {item.requiereVencimiento && (
                                    <Badge variant="outline" className="text-xs">Requiere fecha</Badge>
                                  )}
                                </div>
                                {item.descripcion && (
                                  <p className="text-sm text-gray-500 mt-1 ml-7">{item.descripcion}</p>
                                )}

                                {/* Documents linked to this item */}
                                {hasDocs && (
                                  <div className="mt-2 ml-7 space-y-1">
                                    {itemDocs.map((doc) => (
                                      <div
                                        key={doc.id}
                                        className="flex items-center gap-2 text-sm bg-white p-2 rounded border"
                                      >
                                        <FileText className="w-4 h-4 text-gray-500" />
                                        <span className="flex-1 truncate">{doc.nombre}</span>
                                        {doc.fechaVencimiento && (
                                          <Badge
                                            variant={new Date(doc.fechaVencimiento) < new Date() ? 'destructive' : 'outline'}
                                            className="text-xs"
                                          >
                                            Vence: {format(new Date(doc.fechaVencimiento), 'dd/MM/yyyy', { locale: es })}
                                          </Badge>
                                        )}
                                        <Button variant="ghost" size="sm" onClick={() => handleViewDoc(doc)}>
                                          <Eye className="w-4 h-4" />
                                        </Button>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="text-red-600"
                                          onClick={() => handleDeleteDoc(doc.id)}
                                        >
                                          <Trash2 className="w-4 h-4" />
                                        </Button>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>

                              <div className="flex-shrink-0">
                                {selectedItem?.id === item.id ? (
                                  <div className="space-y-2 p-3 bg-gray-50 rounded-lg w-64">
                                    <div>
                                      <Label className="text-xs">Nombre</Label>
                                      <Input
                                        value={uploadName}
                                        onChange={(e) => setUploadName(e.target.value)}
                                        className="h-8 text-sm"
                                      />
                                    </div>
                                    {item.requiereVencimiento && (
                                      <>
                                        <div>
                                          <Label className="text-xs">Fecha Emision</Label>
                                          <Input
                                            type="date"
                                            value={uploadFechaEmision}
                                            onChange={(e) => setUploadFechaEmision(e.target.value)}
                                            className="h-8 text-sm"
                                          />
                                        </div>
                                        <div>
                                          <Label className="text-xs">Fecha Vencimiento</Label>
                                          <Input
                                            type="date"
                                            value={uploadFechaVencimiento}
                                            onChange={(e) => setUploadFechaVencimiento(e.target.value)}
                                            className="h-8 text-sm"
                                          />
                                        </div>
                                      </>
                                    )}
                                    <div className="flex gap-2">
                                      <Button
                                        size="sm"
                                        className="flex-1"
                                        onClick={() => fileInputRef.current?.click()}
                                        disabled={uploading}
                                      >
                                        {uploading ? 'Subiendo...' : 'Seleccionar'}
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => setSelectedItem(null)}
                                      >
                                        Cancelar
                                      </Button>
                                    </div>
                                    <input
                                      ref={fileInputRef}
                                      type="file"
                                      className="hidden"
                                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                                      onChange={handleFileChange}
                                    />
                                  </div>
                                ) : (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleSelectItem(item)}
                                    disabled={!item.permiteMultiplesArchivos && hasDocs}
                                  >
                                    <Upload className="w-4 h-4 mr-1" />
                                    Subir
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
