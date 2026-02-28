'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { getAdminProfile } from '@/utils/supabase/admin-helper'

export async function crearEgresoAction(formData: FormData) {
    try {
        const { user, profile: adminPerfil } = await getAdminProfile()
        const supabase = await createClient()

        if (!user || !adminPerfil) return { success: false, error: 'No autorizado o perfil no encontrado' }

        // 2. Extraer datos
        const descripcion = formData.get('descripcion') as string
        const montoUsd = formData.get('monto') as string
        const fecha = formData.get('fecha') as string
        const categoria = formData.get('categoria') as string
        const imagen = formData.get('imagen') as File

        if (!descripcion || !montoUsd || !fecha || !categoria) {
            return { success: false, error: 'Todos los campos son obligatorios.' }
        }

        let fotoUrl = null

        // 3. Subir Imagen si existe
        if (imagen && imagen.size > 0) {
            const fileExt = imagen.name.split('.').pop() || 'jpg'
            const fileName = `egreso-${Date.now()}-${adminPerfil.condominio_id}.${fileExt}`

            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('documentos')
                .upload(fileName, imagen, {
                    cacheControl: '3600',
                    upsert: true
                })

            if (uploadError) {
                console.error("Storage Error:", uploadError)
                // No bloqueamos el registro por el error de imagen, pero avisamos?
                // Decidimos continuar para no perder el dato financiero, o fallar según rigor.
                // Para "WOW", mejor que sea exitoso o informar bien.
            } else {
                const { data: publicUrlData } = supabase.storage
                    .from('documentos')
                    .getPublicUrl(fileName)
                fotoUrl = publicUrlData.publicUrl
            }
        }

        // 4. Insertar
        const { error } = await supabase
            .from('egresos')
            .insert({
                condominio_id: adminPerfil.condominio_id,
                descripcion,
                monto_usd: parseFloat(montoUsd),
                fecha_gasto: fecha,
                categoria,
                foto_url: fotoUrl
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
        const { user, profile: adminPerfil } = await getAdminProfile()
        const supabase = await createClient()

        if (!user || !adminPerfil) return { success: false, error: 'No autorizado' }

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
