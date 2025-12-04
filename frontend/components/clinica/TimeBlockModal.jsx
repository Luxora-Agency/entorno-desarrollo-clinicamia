'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Trash2, Clock } from 'lucide-react';

export default function TimeBlockModal({ isOpen, onClose, selectedDate, onSave, existingBlocks = [] }) {
  const [blocks, setBlocks] = useState(existingBlocks.length > 0 ? existingBlocks : [{ inicio: '09:00', fin: '17:00' }]);

  const addBlock = () => {
    setBlocks([...blocks, { inicio: '09:00', fin: '17:00' }]);
  };

  const removeBlock = (index) => {
    setBlocks(blocks.filter((_, i) => i !== index));
  };

  const updateBlock = (index, field, value) => {
    const newBlocks = [...blocks];
    newBlocks[index][field] = value;
    setBlocks(newBlocks);
  };

  const handleSave = () => {
    onSave(blocks);
    onClose();
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className=\"max-w-md\">
        <DialogHeader>
          <DialogTitle className=\"text-xl font-semibold text-gray-900\">
            <Clock className=\"w-5 h-5 inline mr-2 text-blue-600\" />
            Configurar Horarios
          </DialogTitle>
          <p className=\"text-sm text-gray-600 mt-2 capitalize\">{formatDate(selectedDate)}</p>
        </DialogHeader>
        
        <div className=\"space-y-4 mt-4\">
          {blocks.map((block, index) => (
            <div key={index} className=\"flex items-end gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200\">
              <div className=\"flex-1 grid grid-cols-2 gap-3\">
                <div>
                  <Label htmlFor={`inicio-${index}`} className=\"text-xs font-medium text-gray-700 mb-1.5 block\">
                    Hora Inicio
                  </Label>
                  <Input
                    id={`inicio-${index}`}
                    type=\"time\"
                    value={block.inicio}
                    onChange={(e) => updateBlock(index, 'inicio', e.target.value)}
                    className=\"h-10 border-gray-300\"
                  />
                </div>
                <div>
                  <Label htmlFor={`fin-${index}`} className=\"text-xs font-medium text-gray-700 mb-1.5 block\">
                    Hora Fin
                  </Label>
                  <Input
                    id={`fin-${index}`}
                    type=\"time\"
                    value={block.fin}
                    onChange={(e) => updateBlock(index, 'fin', e.target.value)}
                    className=\"h-10 border-gray-300\"
                  />
                </div>
              </div>
              {blocks.length > 1 && (
                <Button
                  type=\"button\"
                  variant=\"outline\"
                  size=\"sm\"
                  onClick={() => removeBlock(index)}
                  className=\"text-red-600 hover:text-red-700 hover:bg-red-50 h-10 px-3\"
                >
                  <Trash2 className=\"w-4 h-4\" />
                </Button>
              )}
            </div>
          ))}
          
          <Button
            type=\"button\"
            variant=\"outline\"
            onClick={addBlock}
            className=\"w-full border-dashed border-2 border-gray-300 hover:border-blue-400 hover:bg-blue-50 text-gray-600 hover:text-blue-600\"
          >
            <Plus className=\"w-4 h-4 mr-2\" />
            Agregar Bloque de Tiempo
          </Button>
        </div>

        <div className=\"flex gap-3 mt-6 pt-4 border-t border-gray-200\">
          <Button
            type=\"button\"
            variant=\"outline\"
            onClick={onClose}
            className=\"flex-1\"
          >
            Cancelar
          </Button>
          <Button
            type=\"button\"
            onClick={handleSave}
            className=\"flex-1 bg-blue-600 hover:bg-blue-700\"
          >
            Guardar Horarios
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
