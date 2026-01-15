'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Award, User, Stethoscope, FileSignature } from 'lucide-react';

/**
 * Componente para mostrar la firma profesional del doctor en documentos clínicos.
 * Según normatividad colombiana, debe incluir:
 * - Nombre completo del profesional
 * - Número de registro médico (RM)
 * - Especialidades
 * - Firma digital (si está disponible)
 *
 * @param {Object} doctor - Datos del doctor
 * @param {string} doctor.nombre - Nombre del doctor
 * @param {string} doctor.apellido - Apellido del doctor
 * @param {string} doctor.licenciaMedica - Número de registro médico (RM)
 * @param {string[]} doctor.especialidades - Lista de especialidades
 * @param {string} doctor.firma - URL o base64 de la firma digital
 * @param {string} doctor.sello - URL o base64 del sello (opcional)
 * @param {Date|string} fechaFirma - Fecha y hora de la firma
 * @param {boolean} compact - Si se debe mostrar en formato compacto
 */
export default function FirmaProfesional({
  doctor,
  fechaFirma = new Date(),
  compact = false,
  showSello = true
}) {
  if (!doctor) {
    return null;
  }

  const nombreCompleto = `${doctor.nombre || ''} ${doctor.apellido || ''}`.trim();
  const registroMedico = doctor.licenciaMedica || doctor.registroMedico || 'Sin RM';
  const especialidades = doctor.especialidades || [];
  const firma = doctor.firma;
  const sello = doctor.sello;

  // Formatear fecha
  const formatearFecha = (fecha) => {
    if (!fecha) return '';
    const d = new Date(fecha);
    return d.toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (compact) {
    return (
      <div className="flex items-center gap-4 py-3 px-4 bg-gray-50 rounded-lg border border-gray-200">
        {firma ? (
          <img
            src={firma}
            alt="Firma del doctor"
            className="h-12 w-auto object-contain"
          />
        ) : (
          <FileSignature className="h-8 w-8 text-gray-400" />
        )}
        <div className="flex-1">
          <p className="font-semibold text-gray-900">{nombreCompleto}</p>
          <p className="text-sm text-gray-600">RM: {registroMedico}</p>
          {especialidades.length > 0 && (
            <p className="text-xs text-gray-500">{especialidades.join(' | ')}</p>
          )}
        </div>
        {showSello && sello && (
          <img
            src={sello}
            alt="Sello del doctor"
            className="h-16 w-16 object-contain opacity-80"
          />
        )}
      </div>
    );
  }

  return (
    <Card className="border-indigo-200 bg-gradient-to-r from-indigo-50 to-purple-50">
      <CardContent className="py-6">
        <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
          {/* Firma Digital */}
          <div className="flex flex-col items-center">
            {firma ? (
              <div className="border-b-2 border-gray-400 pb-2 mb-2">
                <img
                  src={firma}
                  alt="Firma del doctor"
                  className="h-20 w-auto object-contain max-w-[200px]"
                />
              </div>
            ) : (
              <div className="border-b-2 border-gray-300 pb-2 mb-2 px-16">
                <FileSignature className="h-12 w-12 text-gray-300" />
              </div>
            )}
            <p className="text-xs text-gray-500">Firma Profesional</p>
          </div>

          {/* Información del Profesional */}
          <div className="flex-1 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
              <User className="h-5 w-5 text-indigo-600" />
              <h4 className="font-bold text-lg text-gray-900">{nombreCompleto}</h4>
            </div>

            <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
              <Award className="h-4 w-4 text-indigo-500" />
              <p className="text-sm text-gray-700">
                <span className="font-semibold">Registro Médico:</span> {registroMedico}
              </p>
            </div>

            {especialidades.length > 0 && (
              <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
                <Stethoscope className="h-4 w-4 text-indigo-500" />
                <p className="text-sm text-gray-700">
                  <span className="font-semibold">Especialidad{especialidades.length > 1 ? 'es' : ''}:</span>{' '}
                  {especialidades.join(', ')}
                </p>
              </div>
            )}

            <p className="text-xs text-gray-500 mt-3">
              Firmado electrónicamente el {formatearFecha(fechaFirma)}
            </p>
          </div>

          {/* Sello (si existe) */}
          {showSello && sello && (
            <div className="flex flex-col items-center">
              <img
                src={sello}
                alt="Sello del doctor"
                className="h-24 w-24 object-contain opacity-80"
              />
              <p className="text-xs text-gray-500 mt-1">Sello</p>
            </div>
          )}
        </div>

        {/* Nota de validez */}
        <div className="mt-4 pt-4 border-t border-indigo-200">
          <p className="text-xs text-center text-gray-500">
            Documento firmado electrónicamente conforme a la Ley 527 de 1999 y el Decreto 2364 de 2012.
            <br />
            La firma electrónica tiene la misma validez jurídica que la firma manuscrita.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Versión simplificada para mostrar en PDFs o impresión
 */
export function FirmaProfesionalPDF({ doctor, fechaFirma }) {
  if (!doctor) return null;

  const nombreCompleto = `${doctor.nombre || ''} ${doctor.apellido || ''}`.trim();
  const registroMedico = doctor.licenciaMedica || doctor.registroMedico || 'Sin RM';
  const especialidades = doctor.especialidades || [];

  return (
    <div className="text-center py-4 border-t border-gray-300 mt-8">
      {doctor.firma && (
        <img
          src={doctor.firma}
          alt="Firma"
          className="h-16 mx-auto mb-2"
        />
      )}
      <div className="border-t border-gray-400 w-48 mx-auto mb-2"></div>
      <p className="font-bold text-sm">{nombreCompleto}</p>
      <p className="text-xs">RM: {registroMedico}</p>
      {especialidades.length > 0 && (
        <p className="text-xs text-gray-600">{especialidades.join(' - ')}</p>
      )}
    </div>
  );
}
