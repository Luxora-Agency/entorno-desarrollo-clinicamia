'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, FileText, Pill, Activity, Loader2 } from 'lucide-react';
import { apiGet } from '@/services/api';

export default function TemplateSelector({ onSelect, trigger }) {
  const [open, setOpen] = useState(false);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (open) {
      loadTemplates();
    }
  }, [open, search]);

  const loadTemplates = async () => {
    setLoading(true);
    try {
      const response = await apiGet(`/plantillas-planes?search=${search}`);
      setTemplates(response.data || []);
    } catch (error) {
      console.error('Error loading templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (template) => {
    onSelect(template);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" className="gap-2">
            <FileText className="h-4 w-4" />
            Cargar Plantilla
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Seleccionar Plantilla de Plan</DialogTitle>
        </DialogHeader>
        
        <div className="relative mb-4">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
          <Input 
            placeholder="Buscar plantilla..." 
            className="pl-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <ScrollArea className="flex-1 pr-4">
          {loading ? (
            <div className="flex justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            </div>
          ) : templates.length === 0 ? (
            <div className="text-center p-8 text-gray-500">
              No se encontraron plantillas
            </div>
          ) : (
            <div className="grid gap-3">
              {templates.map((template) => (
                <Card 
                  key={template.id} 
                  className="cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors"
                  onClick={() => handleSelect(template)}
                >
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold text-gray-900">{template.nombre}</h3>
                      <div className="flex gap-2">
                        {template.medicamentos?.length > 0 && (
                            <span className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
                                <Pill className="h-3 w-3" /> {template.medicamentos.length}
                            </span>
                        )}
                        {template.procedimientos?.length > 0 && (
                            <span className="bg-green-100 text-green-800 text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
                                <Activity className="h-3 w-3" /> {template.procedimientos.length}
                            </span>
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 line-clamp-2">{template.descripcion}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
