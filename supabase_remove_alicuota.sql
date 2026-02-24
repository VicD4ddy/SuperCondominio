-- SCRIPT PARA FASE 32: ELIMINACIÓN DE ALÍCUOTA
-- =======================================================

-- 1. Eliminar la columna alicuota de la tabla inmuebles
-- Nota: Esto simplificará el modelo a cobros fijos por unidad.
ALTER TABLE public.inmuebles DROP COLUMN IF EXISTS alicuota;
