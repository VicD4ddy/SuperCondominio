import { createClient } from '@/utils/supabase/server'
import { Building2, Users, CreditCard, Activity, ArrowRight, ShieldCheck, Globe } from 'lucide-react'
import Link from 'next/link'

export default async function SuperadminDashboardPage() {
    const supabase = await createClient()

    // En SQL de Supabase esto debería funcionar si quitamos las restricciones de RLS
    // o si el Superadmin tiene un rol de bypass.
    // Para efectos de POC, asumimos que puede leer todo.

    // 1. Estadísticas Globales
    const { count: condoCount } = await supabase
        .from('condominios')
        .select('*', { count: 'exact', head: true })

    const { count: usuariosCount } = await supabase
        .from('perfiles')
        .select('*', { count: 'exact', head: true })

    const { count: inmueblesCount } = await supabase
        .from('inmuebles')
        .select('*', { count: 'exact', head: true })

    const { data: ultimosPagos } = await supabase
        .from('pagos_reportados')
        .select('*, condominios(nombre)')
        .order('created_at', { ascending: false })
        .limit(5)

    const { data: condominios } = await supabase
        .from('condominios')
        .select(`
            id, 
            nombre, 
            created_at,
            perfiles (count),
            inmuebles (count)
        `)
        .order('created_at', { ascending: false })
        .limit(6)

    return (
        <div className="p-6 md:p-10 space-y-8">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black tracking-tighter text-white uppercase">Centro de Comando</h1>
                    <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] mt-1 flex items-center gap-2">
                        <Globe className="w-4 h-4 text-blue-500" />
                        Visión Global del Sistema
                    </p>
                </div>
            </header>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-slate-800/50 p-6 rounded-[32px] border border-slate-700/50">
                    <div className="w-12 h-12 bg-blue-500 text-white rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-blue-500/20">
                        <Building2 className="w-6 h-6" />
                    </div>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Total Condominios</p>
                    <p className="text-3xl font-black text-white">{condoCount || 0}</p>
                </div>

                <div className="bg-slate-800/50 p-6 rounded-[32px] border border-slate-700/50">
                    <div className="w-12 h-12 bg-emerald-500 text-white rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-emerald-500/20">
                        <Users className="w-6 h-6" />
                    </div>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Usuarios Totales</p>
                    <p className="text-3xl font-black text-white">{usuariosCount || 0}</p>
                </div>

                <div className="bg-slate-800/50 p-6 rounded-[32px] border border-slate-700/50">
                    <div className="w-12 h-12 bg-amber-500 text-white rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-amber-500/20">
                        <CreditCard className="w-6 h-6" />
                    </div>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Unidades / Inmuebles</p>
                    <p className="text-3xl font-black text-white">{inmueblesCount || 0}</p>
                </div>

                <div className="bg-indigo-600 p-6 rounded-[32px] shadow-xl shadow-indigo-900/40 relative overflow-hidden">
                    <div className="relative z-10">
                        <div className="w-12 h-12 bg-white/20 text-white rounded-2xl flex items-center justify-center mb-4 backdrop-blur-md">
                            <Activity className="w-6 h-6" />
                        </div>
                        <p className="text-[10px] font-black text-indigo-100 uppercase tracking-widest mb-1">Estado del Sistema</p>
                        <p className="text-2xl font-black text-white">OPERATIVO</p>
                    </div>
                    <ShieldCheck className="absolute -right-6 -bottom-6 w-32 h-32 text-white/10" />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Condominios Recientes */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-bold text-white flex items-center gap-2">
                            Condominios Registrados
                        </h2>
                        <Link href="/dashboard/superadmin/condominios" className="text-blue-400 text-xs font-black uppercase tracking-widest hover:text-blue-300">
                            Ver todos
                        </Link>
                    </div>

                    <div className="bg-slate-800/30 rounded-[32px] border border-slate-700 divide-y divide-slate-700/50 overflow-hidden">
                        {condominios?.map((condo) => (
                            <div key={condo.id} className="p-5 flex items-center justify-between hover:bg-slate-800/50 transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 bg-slate-700 rounded-xl flex items-center justify-center text-slate-400">
                                        <Building2 className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-slate-100">{condo.nombre}</p>
                                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                                            {((condo.perfiles as any)?.[0]?.count || 0)} Vecinos • {((condo.inmuebles as any)?.[0]?.count || 0)} Inmuebles
                                        </p>
                                    </div>
                                </div>
                                <ArrowRight className="w-4 h-4 text-slate-600" />
                            </div>
                        ))}
                    </div>
                </div>

                {/* Actividad Reciente (Pagos Globales) */}
                <div className="space-y-4">
                    <h2 className="text-lg font-bold text-white">Flujo de Pagos Global</h2>
                    <div className="bg-slate-800/30 rounded-[32px] border border-slate-700 divide-y divide-slate-700/50 overflow-hidden">
                        {ultimosPagos && ultimosPagos.length > 0 ? (
                            ultimosPagos.map((pago: any) => (
                                <div key={pago.id} className="p-5 flex items-center justify-between hover:bg-slate-800/50 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 bg-emerald-500/10 text-emerald-400 rounded-xl flex items-center justify-center">
                                            <CreditCard className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-100 truncate max-w-[150px]">
                                                {pago.condominios?.nombre}
                                            </p>
                                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                                                {new Date(pago.created_at).toLocaleDateString()} • {pago.metodo_pago}
                                            </p>
                                        </div>
                                    </div>
                                    <span className="text-emerald-400 font-black text-sm">
                                        +${pago.monto?.toLocaleString()}
                                    </span>
                                </div>
                            ))
                        ) : (
                            <div className="p-12 text-center">
                                <Activity className="w-8 h-8 text-slate-700 mx-auto mb-2" />
                                <p className="text-slate-600 text-xs font-bold uppercase tracking-widest">No hay pagos recientes</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
