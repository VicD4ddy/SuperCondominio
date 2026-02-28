import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { ArrowLeft, Landmark, CreditCard, ExternalLink } from 'lucide-react'

export default async function MetodosPagoPage() {
    const supabase = await createClient()
    const cookieStore = await cookies()
    const perfilId = cookieStore.get('propietario_token')?.value

    if (!perfilId) return null

    // Obtener condominio_id del perfil
    const { data: perfil } = await supabase
        .from('perfiles')
        .select('condominio_id')
        .eq('id', perfilId)
        .single()

    if (!perfil) return null

    // Obtener datos del condominio (cuentas bancarias)
    const { data: condominio } = await supabase
        .from('condominios')
        .select('nombre, cuentas_bancarias')
        .eq('id', perfil.condominio_id)
        .single()

    const cuentas = (condominio?.cuentas_bancarias as any[]) || []

    return (
        <div className="min-h-screen bg-slate-50 pb-20">
            <header className="px-5 py-6 bg-white border-b border-slate-200 sticky top-0 z-40 flex items-center gap-4">
                <Link href="/dashboard/propietario/perfil" className="p-3 border border-slate-200 rounded-xl text-slate-500 hover:bg-slate-50 transition-colors">
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <div>
                    <h1 className="text-xl font-bold text-[#1e3a8a]">Cuentas de Pago</h1>
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mt-1">{condominio?.nombre}</p>
                </div>
            </header>

            <div className="p-5 max-w-xl mx-auto space-y-6">
                <div className="bg-blue-600 p-6 rounded-[32px] text-white shadow-lg relative overflow-hidden">
                    <div className="relative z-10">
                        <h2 className="text-lg font-bold mb-1">Información de Pago</h2>
                        <p className="text-blue-100 text-sm leading-relaxed">
                            Utiliza estos datos para realizar tus transferencias o pago móvil. Luego, reporta el pago en el botón de abajo.
                        </p>
                    </div>
                    <div className="absolute -right-6 -bottom-6 opacity-10">
                        <Landmark className="w-32 h-32" />
                    </div>
                </div>

                <div className="space-y-4">
                    {cuentas.length === 0 ? (
                        <div className="bg-white p-10 rounded-3xl border border-dashed border-slate-300 text-center">
                            <Landmark className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                            <p className="text-slate-500 text-sm font-medium">No hay cuentas configuradas todavía. Contacta a tu administrador.</p>
                        </div>
                    ) : (
                        cuentas.map((cuenta, idx) => (
                            <div key={idx} className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-3 relative group">
                                <div className="flex justify-between items-start">
                                    <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-[#1e3a8a] border border-slate-100">
                                        <Landmark className="w-5 h-5" />
                                    </div>
                                    <span className="bg-blue-50 text-[#1e3a8a] px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-blue-100">
                                        {cuenta.tipo || 'Transferencia'}
                                    </span>
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Banco / Plataforma</p>
                                    <p className="text-slate-900 font-black text-lg">{cuenta.banco}</p>
                                </div>
                                <div className="grid grid-cols-1 gap-4 pt-2">
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Número / Teléfono</p>
                                        <p className="text-slate-700 font-bold font-mono">{cuenta.numero}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Titular / RIF</p>
                                        <p className="text-slate-700 font-bold">{cuenta.titular}</p>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <Link
                    href="/dashboard/propietario/pagos/nuevo"
                    className="flex items-center justify-center gap-3 w-full bg-[#1e3a8a] text-white p-5 rounded-2xl font-black uppercase tracking-widest shadow-xl hover:bg-blue-900 transition-all active:scale-95 text-sm"
                >
                    <CreditCard className="w-5 h-5" />
                    Reportar un Pago
                </Link>
            </div>
        </div>
    )
}
