'use client';

import { useRef, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Eraser, Check, PenTool } from 'lucide-react';

export default function FirmaDigitalPad({ onSave, label = 'Firma' }) {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isEmpty, setIsEmpty] = useState(true);
  const [lastPosition, setLastPosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');

    // Configurar canvas con dimensiones fijas
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;

    // Configurar estilos de dibujo
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Limpiar canvas
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, []);

  const getCoordinates = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();

    // Soporte para touch y mouse
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  };

  const startDrawing = (e) => {
    e.preventDefault();
    setIsDrawing(true);
    const coords = getCoordinates(e);
    setLastPosition(coords);
    setIsEmpty(false);
  };

  const draw = (e) => {
    e.preventDefault();
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const coords = getCoordinates(e);

    ctx.beginPath();
    ctx.moveTo(lastPosition.x, lastPosition.y);
    ctx.lineTo(coords.x, coords.y);
    ctx.stroke();

    setLastPosition(coords);
  };

  const stopDrawing = (e) => {
    e.preventDefault();
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    setIsEmpty(true);
    onSave(null); // Notificar que se limpió la firma
  };

  const saveSignature = () => {
    if (isEmpty) {
      return;
    }

    const canvas = canvasRef.current;
    const dataURL = canvas.toDataURL('image/png');

    // Enviar la firma en base64 al componente padre
    onSave(dataURL);
  };

  return (
    <Card>
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <PenTool className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">
                Firma de {label}
              </span>
            </div>
            {!isEmpty && (
              <div className="flex items-center gap-1 text-xs text-green-600">
                <Check className="h-3 w-3" />
                Firmado
              </div>
            )}
          </div>

          {/* Canvas */}
          <div className="border-2 border-dashed border-gray-300 rounded-lg overflow-hidden bg-white">
            <canvas
              ref={canvasRef}
              className="w-full h-40 cursor-crosshair touch-none"
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
              style={{ touchAction: 'none' }}
            />
          </div>

          {/* Instrucciones */}
          <p className="text-xs text-gray-500 text-center">
            {isEmpty
              ? 'Dibuje su firma en el recuadro usando el mouse o su dedo en pantallas táctiles'
              : 'Firma registrada - Puede limpiar y volver a firmar si lo desea'}
          </p>

          {/* Botones */}
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={clearCanvas}
              disabled={isEmpty}
              className="flex-1"
            >
              <Eraser className="h-4 w-4 mr-2" />
              Limpiar
            </Button>
            <Button
              type="button"
              variant="default"
              size="sm"
              onClick={saveSignature}
              disabled={isEmpty}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              <Check className="h-4 w-4 mr-2" />
              Confirmar Firma
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
