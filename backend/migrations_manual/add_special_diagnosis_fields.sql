-- Migración manual: Agregar campos de validación especial a diagnosticos_hce
-- Fecha: 2026-01-08
-- Descripción: Campos para validación de cáncer y enfermedades huérfanas

ALTER TABLE diagnosticos_hce 
ADD COLUMN IF NOT EXISTS fecha_diagnostico_exacta TIMESTAMP,
ADD COLUMN IF NOT EXISTS estado_confirmacion TEXT,
ADD COLUMN IF NOT EXISTS metodo_confirmacion TEXT,
ADD COLUMN IF NOT EXISTS metodo_confirmacion_detalle TEXT,
ADD COLUMN IF NOT EXISTS documento_respaldo_url TEXT,
ADD COLUMN IF NOT EXISTS documento_respaldo_nombre TEXT;

-- Comentarios para documentación
COMMENT ON COLUMN diagnosticos_hce.fecha_diagnostico_exacta IS 'Fecha exacta del diagnóstico (obligatorio para cáncer/huérfanas)';
COMMENT ON COLUMN diagnosticos_hce.estado_confirmacion IS 'Estado: confirmado, sospecha, descartado';
COMMENT ON COLUMN diagnosticos_hce.metodo_confirmacion IS 'Método: biopsia, histopatologia, imagen, genetico, clinico, otro';
COMMENT ON COLUMN diagnosticos_hce.metodo_confirmacion_detalle IS 'Detalle del método si es "otro"';
COMMENT ON COLUMN diagnosticos_hce.documento_respaldo_url IS 'URL del documento de respaldo';
COMMENT ON COLUMN diagnosticos_hce.documento_respaldo_nombre IS 'Nombre del documento de respaldo';
