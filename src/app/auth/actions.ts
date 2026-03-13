'use server'

import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'

export async function signOutAction() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    await supabase.auth.signOut()
    
    const cookieStore = await cookies()
    cookieStore.delete('propietario_token') 

    if (user) {
        redirect('/admin') // Admin
    } else {
        redirect('/') // Propietario
    }
}

export async function validarCedula(formData: FormData) {
    const prefijo = formData.get('prefijo') as string
    const numero = formData.get('numero') as string
    const cedula = `${prefijo}${numero}`

    if (!numero || numero.length < 5) return { error: 'Cédula inválida.' }

    const supabase = await createClient()

    // 1. Validar que la cédula exista en la tabla perfiles (Solo residentes)
    // Buscamos coincidencia exacta o con variantes del prefijo
    const { data: perfilOwner, error } = await supabase
        .from('perfiles')
        .select('id, rol')
        .or(`cedula.eq.${numero},cedula.eq.${prefijo}-${numero},cedula.eq.${prefijo}${numero}`)
        .eq('rol', 'propietario')
        .limit(1)
        .maybeSingle()

    if (error || !perfilOwner) {
        return { error: 'No se encontró un vecino registrado con esta cédula.' }
    }

    // 2. Crear la cookie con el ID del perfil y redirigir al Dashboard Real
    const cookieStore = await cookies()
    cookieStore.set('propietario_token', perfilOwner.id, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/'
    })

    redirect('/dashboard/propietario')
}
