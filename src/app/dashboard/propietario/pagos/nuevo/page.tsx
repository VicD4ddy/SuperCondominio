import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import NuevoPagoClient from './NuevoPagoClient'

export default async function NuevoPagoPageServer() {
    const cookieStore = await cookies()
    const perfilId = cookieStore.get('propietario_token')?.value

    if (!perfilId) {
        redirect('/dashboard/propietario/validar')
    }

    const supabaseAdmin = createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Obtener las Cuentas Bancarias
    const { data: config } = await supabaseAdmin
        .from('configuracion_global')
        .select('cuentas_bancarias')
        .limit(1)
        .single()

    const cuentas = (config?.cuentas_bancarias as any[]) || []

    return <NuevoPagoClient cuentasCondominio={cuentas} />
}
