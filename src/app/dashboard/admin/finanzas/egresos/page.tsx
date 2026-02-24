import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import { ChevronLeft, Receipt, TrendingDown, ArrowLeft } from 'lucide-react'
import EgresosList from './EgresosList'
import NuevoEgresoForm from './NuevoEgresoForm'

export default async function AdminEgresosPage() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return <div className="p-5 text-center">No autorizado.</div>
    }

    // Obtener condominio del Admin
    const { data: adminPerfil } = await supabase
        .from('perfiles')
        .select('condominio_id')
        .eq('auth_user_id', user.id)
        .eq('rol', 'admin')
        .single()

    if (!adminPerfil) return <div className="p-5">Perfil no encontrado.</div>

    // Obtener egresos del mes actual (o todos por ahora para simplificar el MVP)
    const { data: egresos } = await supabase
        .from('egresos')
        .select('*')
        .eq('condominio_id', adminPerfil.condominio_id)
        .order('fecha_gasto', { ascending: false })

    const totalEgresos = egresos?.reduce((acc, curr) => acc + Number(curr.monto_usd), 0) || 0

    return (
        <div className="min-h-screen bg-slate-50 pb-20">
            {/* Header */}
            <header className="bg-white border-b border-slate-200 px-6 py-6 sticky top-0 z-40">
                <div className="flex items-center gap-4 mb-2">
                    <Link href="/dashboard/admin/finanzas" className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                        <ArrowLeft className="w-5 h-5 text-slate-600" />
                    </Link>
                    <div>
                        <h1 className="text-xl font-bold text-slate-900">Control de Egresos</h1>
                        <p className="text-sm text-slate-500">Registro de gastos del condominio</p>
                    </div>
                </div>
            </header>

            <div className="px-5 mt-6 space-y-6">
                {/* Resumen Card */}
                <div className="bg-red-600 p-6 rounded-3xl shadow-lg relative overflow-hidden">
                    <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white/10 rounded-full blur-2xl" />
                    <div className="relative z-10 flex justify-between items-center">
                        <div>
                            <p className="text-red-100 text-xs font-bold tracking-widest uppercase mb-1">Gasto Total Acumulado</p>
                            <h2 className="text-3xl font-extrabold text-white">${totalEgresos.toFixed(2)}</h2>
                        </div>
                        <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-md">
                            <TrendingDown className="w-6 h-6 text-white" />
                        </div>
                    </div>
                </div>

                {/* Formulario para nuevo gasto */}
                <NuevoEgresoForm />

                {/* Lista de Gastos */}
                <div>
                    <h3 className="text-slate-800 font-bold mb-4 px-1">Movimientos Recientes</h3>
                    <EgresosList initialEgresos={egresos || []} />
                </div>
            </div>
        </div>
    )
}
