'use client';

import { CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export default function SuccessModal({ isOpen, onClose, pacienteId, pacienteNombre }) {
  const handleGoToList = () => {
    onClose();
    window.location.href = '/?module=pacientes';
  };

  const handleGoToAdmisiones = () => {
    onClose();
    window.location.href = `/?module=admisiones&pacienteId=${pacienteId}`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-green-100 p-3">
              <CheckCircle2 className="w-12 h-12 text-green-600" />
            </div>
          </div>
          <DialogTitle className="text-center text-2xl">
            ¡Guardado Exitoso!
          </DialogTitle>
          <DialogDescription className="text-center text-base">
            {pacienteNombre ? (
              <>El paciente <span className="font-semibold">{pacienteNombre}</span> ha sido guardado correctamente.</>
            ) : (
              'El paciente ha sido guardado correctamente.'
            )}
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="flex flex-col sm:flex-col gap-2 mt-4">
          <Button
            onClick={handleGoToAdmisiones}
            className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-semibold"
          >
            Ver Información del Paciente
          </Button>
          <Button
            onClick={handleGoToList}
            variant="outline"
            className="w-full border-gray-300 hover:bg-gray-50"
          >
            Ir a Lista de Pacientes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
