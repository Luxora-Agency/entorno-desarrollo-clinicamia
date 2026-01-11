'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Upload, FileText, Globe, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export function ImportMedicinesModal({ isOpen, onClose, onSuccess }) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [importType, setImportType] = useState(null); // 'pbs' or 'csv'
  const [result, setResult] = useState(null);
  const [csvContent, setCsvContent] = useState('');

  const handlePBSImport = async () => {
    setLoading(true);
    setResult(null);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/productos/import-pbs`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok) {
        setResult(data.data);
        toast({ title: 'Importación Exitosa', description: 'Se han importado los medicamentos del PBS.' });
        if (onSuccess) onSuccess();
      } else {
        throw new Error(data.message || 'Error en la importación');
      }
    } catch (error) {
      console.error(error);
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleCSVFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setCsvContent(event.target.result);
      };
      reader.readAsText(file);
    }
  };

  const handleCSVImport = async () => {
    if (!csvContent) {
      toast({ title: 'Error', description: 'Seleccione un archivo CSV primero', variant: 'destructive' });
      return;
    }

    setLoading(true);
    setResult(null);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/productos/import-csv`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ csv: csvContent })
      });
      const data = await response.json();
      if (response.ok) {
        setResult(data.data);
        toast({ title: 'Importación Exitosa', description: 'Se han procesado los datos del CSV.' });
        if (onSuccess) onSuccess();
      } else {
        throw new Error(data.message || 'Error en la importación');
      }
    } catch (error) {
      console.error(error);
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5 text-emerald-600" />
            Importar Medicamentos
          </DialogTitle>
        </DialogHeader>

        {!result ? (
          <div className="space-y-6 py-4">
            {!importType ? (
              <div className="grid grid-cols-1 gap-4">
                <Button 
                  variant="outline" 
                  className="h-24 flex flex-col gap-2 hover:bg-blue-50 hover:border-blue-200"
                  onClick={() => setImportType('pbs')}
                >
                  <Globe className="w-8 h-8 text-blue-600" />
                  <span>Importar desde Datos.gov.co (PBS)</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="h-24 flex flex-col gap-2 hover:bg-emerald-50 hover:border-emerald-200"
                  onClick={() => setImportType('csv')}
                >
                  <FileText className="w-8 h-8 text-emerald-600" />
                  <span>Importar desde Archivo CSV</span>
                </Button>
              </div>
            ) : importType === 'pbs' ? (
              <div className="space-y-4">
                <Alert className="bg-blue-50 border-blue-200">
                  <Globe className="h-4 w-4 text-blue-600" />
                  <AlertTitle>API de Datos Abiertos</AlertTitle>
                  <AlertDescription>
                    Se descargarán los medicamentos del Plan de Beneficios en Salud (PBS) directamente desde el portal oficial del gobierno colombiano.
                  </AlertDescription>
                </Alert>
                <div className="flex justify-center py-4">
                  <Button 
                    onClick={handlePBSImport} 
                    disabled={loading}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {loading ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Procesando...</>
                    ) : 'Iniciar Sincronización PBS'}
                  </Button>
                </div>
                <Button variant="ghost" onClick={() => setImportType(null)} className="w-full">
                  Volver atrás
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="border-2 border-dashed border-gray-200 rounded-lg p-8 text-center bg-gray-50">
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleCSVFileChange}
                    className="hidden"
                    id="csv-file-input"
                  />
                  <Label htmlFor="csv-file-input" className="cursor-pointer flex flex-col items-center gap-2">
                    <FileText className="w-10 h-10 text-gray-400" />
                    <span className="text-sm font-medium">Click para seleccionar archivo .csv</span>
                    <span className="text-xs text-gray-500">Cabeceras sugeridas: nombre, sku, principio_activo, precio_venta, stock</span>
                  </Label>
                </div>
                {csvContent && (
                  <p className="text-xs text-green-600 font-medium text-center">✓ Archivo cargado correctamente</p>
                )}
                <div className="flex gap-2">
                  <Button variant="ghost" onClick={() => setImportType(null)} className="flex-1">
                    Cancelar
                  </Button>
                  <Button 
                    onClick={handleCSVImport} 
                    disabled={loading || !csvContent}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                  >
                    {loading ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Importando...</>
                    ) : 'Subir CSV'}
                  </Button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-6 py-4 text-center">
            <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-10 h-10 text-green-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900">Importación Finalizada</h3>
            <div className="grid grid-cols-2 gap-4 text-left">
              <div className="bg-gray-50 p-3 rounded border">
                <p className="text-xs text-gray-500 uppercase font-bold">Procesados</p>
                <p className="text-2xl font-bold">{result.procesados}</p>
              </div>
              <div className="bg-emerald-50 p-3 rounded border border-emerald-100">
                <p className="text-xs text-emerald-600 uppercase font-bold">Nuevos</p>
                <p className="text-2xl font-bold text-emerald-700">{result.creados}</p>
              </div>
              <div className="bg-blue-50 p-3 rounded border border-blue-100">
                <p className="text-xs text-blue-600 uppercase font-bold">Actualizados</p>
                <p className="text-2xl font-bold text-blue-700">{result.actualizados}</p>
              </div>
              <div className="bg-red-50 p-3 rounded border border-red-100">
                <p className="text-xs text-red-600 uppercase font-bold">Errores</p>
                <p className="text-2xl font-bold text-red-700">{result.errores}</p>
              </div>
            </div>
            <Button onClick={() => { setResult(null); setImportType(null); onClose(); }} className="w-full">
              Cerrar y Ver Productos
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
