import { Building2 } from 'lucide-react'
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import ValidarForm from './ValidarForm'

export default async function ValidarPropietarioPage({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // Redirección forzada servidor-lado si ya tenemos rol asignado
    if (user) {
        const { data: profile } = await supabase
            .from('perfiles')
            .select('rol')
            .or(`auth_user_id.eq.${user.id},id.eq.${user.id}`)
            .limit(1)
            .single()

        if (profile?.rol === 'superadmin') redirect('/dashboard/superadmin')
        if (profile?.rol === 'admin') redirect('/dashboard/admin')
    }

    const resolvedParams = await searchParams

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col pt-16 px-4 items-center font-sans pb-12">
            <div className="flex flex-col items-center mb-10 text-center">
                <div className="bg-[#1e3a8a] p-3 rounded-xl shadow-sm mb-4">
                    <Building2 className="w-8 h-8 text-white" />
                </div>
                <h1 className="text-[#1e3a8a] text-2xl font-bold tracking-tight mb-2">CondoSolución</h1>
                {resolvedParams.condominioNombre ? (
                    <p className="text-slate-500 font-medium">Vecinos de {resolvedParams.condominioNombre as string}</p>
                ) : (
                    <p className="text-slate-500 font-medium">Verificación de Propietario</p>
                )}
            </div>

            <ValidarForm />
        </div>
    )
}
