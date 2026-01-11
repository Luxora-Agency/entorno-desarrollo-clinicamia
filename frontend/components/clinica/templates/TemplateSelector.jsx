'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FileText, Search, Plus, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function TemplateSelector({ onSelect, category }) {
  const [open, setOpen] = useState(false);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  
  // Parameter filling state
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [params, setParams] = useState({});
  const [showParamDialog, setShowParamDialog] = useState(false);

  useEffect(() => {
    if (open) {
      fetchTemplates();
    }
  }, [open]);

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      // Adjust URL based on environment
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const response = await fetch(`${apiUrl}/plantillas-doctor?tipoCampo=${category || ''}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setTemplates(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTemplateClick = (template) => {
    // Check for parameters {{ParamName}}
    const regex = /{{\s*([^}]+)\s*}}/g;
    const matches = [...template.contenido.matchAll(regex)];
    
    if (matches.length > 0) {
      // Has parameters, show dialog
      const newParams = {};
      matches.forEach(match => {
        newParams[match[1].trim()] = '';
      });
      setParams(newParams);
      setSelectedTemplate(template);
      setShowParamDialog(true);
      setOpen(false); // Close selector popover
    } else {
      // No parameters, insert directly
      onSelect(template.contenido);
      setOpen(false);
    }
  };

  const handleParamChange = (key, value) => {
    setParams(prev => ({ ...prev, [key]: value }));
  };

  const applyTemplate = () => {
    let content = selectedTemplate.contenido;
    Object.entries(params).forEach(([key, value]) => {
      // Replace all occurrences
      const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
      content = content.replace(regex, value);
    });
    
    onSelect(content);
    setShowParamDialog(false);
    setSelectedTemplate(null);
    setParams({});
  };

  const filteredTemplates = templates.filter(t => 
    t.nombre.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2 text-blue-600 border-blue-200 hover:bg-blue-50">
            <Sparkles className="h-4 w-4" />
            Usar Plantilla
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-0" align="end">
          <div className="p-3 border-b">
            <div className="flex items-center gap-2 px-2 pb-2">
              <FileText className="h-4 w-4 text-gray-500" />
              <span className="font-medium text-sm">Plantillas Disponibles</span>
            </div>
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-3.5 w-3.5 text-gray-400" />
              <Input
                placeholder="Buscar plantilla..."
                className="h-8 pl-8 text-xs"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
          
          <ScrollArea className="h-64">
            <div className="p-2 space-y-1">
              {loading ? (
                <div className="p-4 text-center text-xs text-gray-500">Cargando...</div>
              ) : filteredTemplates.length === 0 ? (
                <div className="p-4 text-center text-xs text-gray-500">
                  No hay plantillas para {category}
                </div>
              ) : (
                filteredTemplates.map((template) => (
                  <button
                    key={template.id}
                    onClick={() => handleTemplateClick(template)}
                    className="w-full text-left px-3 py-2 text-sm rounded-md hover:bg-slate-100 transition-colors group"
                  >
                    <div className="font-medium text-gray-900 group-hover:text-blue-700">
                      {template.nombre}
                    </div>
                    <div className="text-xs text-gray-500 line-clamp-2 mt-0.5">
                      {template.contenido}
                    </div>
                  </button>
                ))
              )}
            </div>
          </ScrollArea>
        </PopoverContent>
      </Popover>

      {/* Parameter Filling Dialog */}
      <Dialog open={showParamDialog} onOpenChange={setShowParamDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Completar Plantilla</DialogTitle>
            <DialogDescription>
              Ingresa los valores para los campos de la plantilla <strong>{selectedTemplate?.nombre}</strong>.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            {Object.keys(params).map((key) => (
              <div key={key} className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor={key} className="text-right capitalize">
                  {key}
                </Label>
                <Input
                  id={key}
                  value={params[key]}
                  onChange={(e) => handleParamChange(key, e.target.value)}
                  className="col-span-3"
                  placeholder={`Valor para ${key}`}
                  autoFocus={Object.keys(params)[0] === key}
                />
              </div>
            ))}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowParamDialog(false)}>Cancelar</Button>
            <Button onClick={applyTemplate} className="bg-blue-600 hover:bg-blue-700 text-white">
              Insertar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
