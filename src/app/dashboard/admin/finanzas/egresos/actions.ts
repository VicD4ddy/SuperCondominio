'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function crearEgresoAction(formData: FormData) {
    try {
        const supabase = await createClient()

        // 1. Validar Admin
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return { success: false, error: 'No autorizado' }

        const { data: adminPerfil } = await supabase
            .from('perfiles')
            .select('condominio_id')
            .eq('auth_user_id', user.id)
            .eq('rol', 'admin')
            .single()

        if (!adminPerfil) return { success: false, error: 'Perfil de admin no encontrado' }

        // 2. Extraer datos
        const descripcion = formData.get('descripcion') as string
        const montoUsd = formData.get('monto') as string
        const fecha = formData.get('fecha') as string
        const categoria = formData.get('categoria') as string

        if (!descripcion || !montoUsd || !fecha || !categoria) {
            return { success: false, error: 'Todos los campos son obligatorios.' }
        }

        // 3. Insertar
        const { error } = await supabase
            .from('egresos')
            .insert({
                condominio_id: adminPerfil.condominio_id,
                descripcion,
                monto_usd: parseFloat(montoUsd),
                fecha_gasto: fecha,
                categoria
            })

        if (error) {
            console.error("Error al crear egreso:", error)
            return { success: false, error: 'Error en la base de datos.' }
        }

        revalidatePath('/dashboard/admin/finanzas')
        revalidatePath('/dashboard/admin/finanzas/egresos')
        revalidatePath('/dashboard/propietario')

        return { success: true }
    } catch (err: any) {
        return { success: false, error: 'Error inesperado.' }
    }
}

export async function eliminarEgresoAction(id: string) {
    try {
        const supabase = await createClient()

        // Validar Admin
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return { success: false, error: 'No autorizado' }

        const { error } = await supabase
            .from('egresos')
            .delete()
            .eq('id', id)

        if (error) {
            console.error("Error al eliminar egreso:", error)
            return { success: false, error: 'No se pudo eliminar el gasto.' }
        }

        revalidatePath('/dashboard/admin/finanzas')
        revalidatePath('/dashboard/admin/finanzas/egresos')
        revalidatePath('/dashboard/propietario')

        return { success: true }
    } catch (err: any) {
        return { success: false, error: 'Error inesperado.' }
    }
}
