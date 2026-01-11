import { useState } from 'react';
import { apiPost } from '@/services/api';
import { toast } from 'sonner';

/**
 * Hook para corrección ortográfica con IA
 * @returns {object} - { corregirTexto, corrigiendo }
 */
export function useCorrectorOrtografia() {
  const [corrigiendo, setCorrigiendo] = useState(false);

  const corregirTexto = async (texto, contexto = 'medico') => {
    if (!texto || texto.length < 3) {
      toast.info('El texto es demasiado corto para corregir');
      return null;
    }

    setCorrigiendo(true);

    try {
      const response = await apiPost('/ai-assistant/corregir-ortografia', {
        texto,
        contexto
      });

      if (response.success && response.data) {
        const { textoCorregido, cambios } = response.data;

        if (cambios && cambios.length > 0) {
          toast.success(`Se realizaron ${cambios.length} corrección${cambios.length > 1 ? 'es' : ''}`, {
            description: cambios.slice(0, 3).map(c => `"${c.original}" → "${c.correccion}"`).join('\n')
          });
        } else {
          toast.info('No se encontraron errores ortográficos');
        }

        return textoCorregido;
      } else {
        toast.warning('Servicio de corrección no disponible');
        return null;
      }
    } catch (error) {
      console.error('Error al corregir ortografía:', error);
      toast.error('Error al corregir el texto');
      return null;
    } finally {
      setCorrigiendo(false);
    }
  };

  return { corregirTexto, corrigiendo };
}
