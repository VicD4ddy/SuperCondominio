-- SCRIPT PARA FASE 28: GESTIÓN DE EGRESOS (GASTOS)
-- =======================================================

-- 1. Crear tabla de egresos
CREATE TABLE IF NOT EXISTS public.egresos (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    condominio_id UUID NOT NULL REFERENCES public.condominios(id) ON DELETE CASCADE,
    descripcion VARCHAR(255) NOT NULL,
    monto_usd DECIMAL(12, 2) NOT NULL,
    fecha_gasto DATE NOT NULL DEFAULT CURRENT_DATE,
    categoria VARCHAR(50) NOT NULL, -- Ej: Mantenimiento, Servicios, Sueldos, Otros
    comprobante_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Habilitar RLS
ALTER TABLE public.egresos ENABLE ROW LEVEL SECURITY;

-- 3. Políticas de seguridad (RLS)
-- Admins pueden hacer todo en su condominio
DROP POLICY IF EXISTS "Admins gestionan egresos de su condominio" ON public.egresos;
CREATE POLICY "Admins gestionan egresos de su condominio" 
ON public.egresos FOR ALL
TO authenticated
USING (
    condominio_id IN (
        SELECT condominio_id FROM public.perfiles 
        WHERE (id = auth.uid() OR auth_user_id = auth.uid()) AND rol = 'admin'
    )
);

-- Propietarios pueden leer los egresos de su condominio (Transparencia)
DROP POLICY IF EXISTS "Propietarios leen egresos de su condominio" ON public.egresos;
CREATE POLICY "Propietarios leen egresos de su condominio" 
ON public.egresos FOR SELECT
TO authenticated
USING (
    condominio_id IN (
        SELECT condominio_id FROM public.perfiles 
        WHERE (id = auth.uid() OR auth_user_id = auth.uid())
    )
);

-- 4. Trigger para updated_at
CREATE TRIGGER update_egresos_modtime 
BEFORE UPDATE ON public.egresos 
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- 5. Recargar esquema
NOTIFY pgrst, 'reload schema';
