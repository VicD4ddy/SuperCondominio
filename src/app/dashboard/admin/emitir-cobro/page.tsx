import { createClient } from '@/utils/supabase/server'
import { getAdminProfile } from '@/utils/supabase/admin-helper'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import EmitirCobroForm from './EmitirCobroForm'

export const dynamic = 'force-dynamic'

export default async function EmitirCobroPage() {
    const { profile: adminPerfil } = await getAdminProfile()
    const supabase = await createClient()

    // Obtener parámetros financieros del condominio
    let cuotaMensualUsd = 0
    if (adminPerfil?.condominio_id) {
        const { data: params } = await supabase
            .from('parametros_financieros')
            .select('monto_mensual_usd')
            .eq('condominio_id', adminPerfil.condominio_id)
            .single()
        cuotaMensualUsd = Number(params?.monto_mensual_usd || 0)
    }

    // Calcular el nombre del mes actual en español
    const now = new Date()
    const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
    const mesActual = `${meses[now.getMonth()]} ${now.getFullYear()}`

    return (
        <div className="min-h-screen bg-slate-50 pb-20">
            <header className="px-5 py-4 flex items-center justify-between border-b border-slate-200 bg-white sticky top-0 z-40">
                <div className="flex items-center gap-4">
                    <Link href="/dashboard/admin" className="p-2 border border-slate-200 rounded-full text-slate-500 hover:bg-slate-50 transition-colors">
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <h1 className="text-lg font-bold text-[#1e3a8a]">Emitir Cuota</h1>
                </div>
            </header>

            <div className="px-5 pt-6 max-w-lg mx-auto">
                <EmitirCobroForm
                    cuotaMensualUsd={cuotaMensualUsd}
                    mesActual={mesActual}
                />
            </div>
        </div>
    )
}
