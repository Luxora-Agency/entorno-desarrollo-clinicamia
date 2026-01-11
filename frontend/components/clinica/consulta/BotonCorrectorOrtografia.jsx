'use client';

import { Button } from '@/components/ui/button';
import { SpellCheck, Loader2 } from 'lucide-react';
import { useCorrectorOrtografia } from '@/hooks/useCorrectorOrtografia';

/**
 * Botón para corregir ortografía con IA
 * @param {string} texto - Texto a corregir
 * @param {function} onCorreccion - Callback con texto corregido
 * @param {string} contexto - Contexto del texto ('medico' o 'general')
 */
export default function BotonCorrectorOrtografia({ texto, onCorreccion, contexto = 'medico' }) {
  const { corregirTexto, corrigiendo } = useCorrectorOrtografia();

  const handleCorregir = async () => {
    if (!texto || texto.trim().length < 3) {
      return;
    }

    const textoCorregido = await corregirTexto(texto, contexto);
    
    if (textoCorregido && textoCorregido !== texto) {
      onCorreccion(textoCorregido);
    }
  };

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={handleCorregir}
      disabled={corrigiendo || !texto || texto.trim().length < 3}
      className="text-purple-600 hover:text-purple-700 hover:bg-purple-50"
      title="Corregir ortografía con IA"
    >
      {corrigiendo ? (
        <>
          <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
          Corrigiendo...
        </>
      ) : (
        <>
          <SpellCheck className="h-3.5 w-3.5 mr-1" />
          Corregir ortografía
        </>
      )}
    </Button>
  );
}
