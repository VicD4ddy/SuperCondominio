'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { getAdminProfile } from '@/utils/supabase/admin-helper'

export async function guardarAnuncioAction(formData: FormData) {
    try {
        const { user, profile: adminPerfil, config } = await getAdminProfile()
        const supabase = await createClient()

        if (!user || !adminPerfil || !config) return { error: 'No autorizado o perfil de admin no encontrado' }

        const nuevoAnuncio = formData.get('anuncio') as string
        const textoLimpio = nuevoAnuncio?.trim() || null // Si envía vacío, limpiamos el tablón

        // 2. Actualizar Tabla configuracion_global
        const { data, error } = await supabase
            .from('configuracion_global')
            .update({ anuncio_tablon: textoLimpio })
            .eq('id', config.id)
            .select()

        if (error) {
            console.error(error)
            return { error: 'Error al actualizar el tablón.' }
        }

        if (!data || data.length === 0) {
            console.warn('Bitácora: RLS bloqueando actualización de condominios')
            return { error: 'Error de permisos (RLS) al actualizar el tablón.' }
        }

        revalidatePath('/dashboard/admin/ajustes')
        revalidatePath('/dashboard/propietario') // Refrescar vista del inquilino
        return { success: true }
    } catch (err) {
        return { error: 'Error inesperado.' }
    }
}

export async function guardarCuentasAction(cuentasJson: any[]) {
    try {
        const { user, profile: adminPerfil, config } = await getAdminProfile()
        const supabase = await createClient()

        if (!user || !adminPerfil || !config) return { error: 'No autorizado o perfil no encontrado' }

        console.log('DEBUG: Guardando cuentas globales')
        console.log('DEBUG: JSON:', JSON.stringify(cuentasJson))

        const { data, error } = await supabase
            .from('configuracion_global')
            .update({ cuentas_bancarias: cuentasJson })
            .eq('id', config.id)
            .select()

        if (error) {
            console.error('Error DB:', error)
            return { error: 'Error al guardar cuentas.' }
        }

        if (!data || data.length === 0) {
            console.warn('DEBUG: No se actualizó el condominio (RLS Fail)')
            return { error: 'No tienes permiso para actualizar este condominio (RLS).' }
        }

        console.log('DEBUG: Guardado exitoso')
        revalidatePath('/dashboard/admin/ajustes')
        return { success: true }
    } catch (err: any) {
        console.error('Fatal:', err)
        return { error: 'Error inesperado: ' + err.message }
    }
}

export async function subirCartaResidenciaAction(formData: FormData) {
    try {
        const { user, profile: adminPerfil, config } = await getAdminProfile()
        const supabase = await createClient()

        if (!user || !adminPerfil || !config) return { success: false, error: 'No autorizado o perfil no encontrado' }

        // 2. Extraer archivo
        const archivo = formData.get('documento') as File
        if (!archivo || archivo.size === 0) {
            return { success: false, error: 'Debe adjuntar un archivo válido.' }
        }

        // 3. Subir archivo a Storage (documentos)
        const fileExt = archivo.name.split('.').pop()
        // Usamos genérico "global" en un solo inquilino
        const fileName = `carta-residencia-global.${fileExt}`

        const { error: uploadError } = await supabase.storage
            .from('documentos')
            .upload(fileName, archivo, {
                cacheControl: '3600',
                upsert: true
            })

        if (uploadError) {
            console.error("Storage Error:", uploadError)
            return { success: false, error: 'Error al subir el documento.' }
        }

        // 4. Obtener URL Pública
        const { data: publicUrlData } = supabase.storage
            .from('documentos')
            .getPublicUrl(fileName)

        const fileUrl = publicUrlData.publicUrl

        // 5. Insertar URL en configuracion_global
        const { error: updateError } = await supabase
            .from('configuracion_global')
            .update({ carta_residencia_url: fileUrl })
            .eq('id', config.id)

        if (updateError) {
            console.error(updateError)
            return { success: false, error: 'Error al actualizar base de datos.' }
        }

        revalidatePath('/dashboard/admin/ajustes')
        revalidatePath('/dashboard/propietario/perfil')
        return { success: true }
    } catch (err: any) {
        return { success: false, error: 'Error inesperado al subir el documento.' }
    }
}
