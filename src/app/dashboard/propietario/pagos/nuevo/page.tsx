import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import NuevoPagoClient from './NuevoPagoClient'

export default async function NuevoPagoPageServer() {
    const supabase = await createClient()
    const cookieStore = await cookies()
    const perfilId = cookieStore.get('propietario_token')?.value

    if (!perfilId) {
        redirect('/dashboard/propietario/validar')
    }

    // Obtener las Cuentas Bancarias
    const { data: config } = await supabase
        .from('configuracion_global')
        .select('cuentas_bancarias')
        .limit(1)
        .single()

    const cuentas = (config?.cuentas_bancarias as any[]) || []

    return <NuevoPagoClient cuentasCondominio={cuentas} />
}
