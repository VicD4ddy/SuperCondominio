import { CheckCircle2, FileText, Download, Banknote, ChevronRight, Megaphone, Pin, AlertTriangle } from 'lucide-react'
import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import NotificacionesWidget from '@/components/NotificacionesWidget'
import GastosTransparenciaWidget from '@/components/GastosTransparenciaWidget'
import TutorialResidentWidget from '@/components/TutorialResidentWidget'

export const dynamic = 'force-dynamic'

import { createClient as createSupabaseClient } from '@supabase/supabase-js'

export default async function PropietarioDashboardPage() {
    const cookieStore = await cookies()
    const perfilId = cookieStore.get('propietario_token')?.value

    if (!perfilId) {
        redirect('/dashboard/propietario/validar')
    }

    // Instanciar cliente de supabase en modo Service Role
    // ya que los propietarios se "autentican" solo con una cookie y su cédula, no con Auth real,
    // por lo que las políticas RLS ("authenticated") los bloquean si usamos el cliente anónimo.
    const supabaseAdmin = createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Cargar datos reales básicos del propietario
    const { data: perfil } = await supabaseAdmin
        .from('perfiles')
        .select('nombres, estado_solvencia')
        .eq('id', perfilId)
        .single()

    if (!perfil) {
        redirect('/dashboard/propietario/validar')
    }

    // Cargar configuración global (nombre de condominio)
    const { data: config } = await supabaseAdmin
        .from('configuracion_global')
        .select('nombre')
        .limit(1)
        .single()

    const nombreCondominio = config?.nombre || 'Mi Condominio'

    // Calcular saldo pendiente real (en tiempo real, no desde estado_solvencia estático)
    const { data: inmuebles } = await supabaseAdmin
        .from('inmuebles')
        .select('id')
        .eq('propietario_id', perfilId)

    const inmueblesIds = inmuebles?.map((i: any) => i.id) || []
    let saldoPendienteUsd = 0

    if (inmueblesIds.length > 0) {
        const { data: recibos } = await supabaseAdmin
            .from('recibos_cobro')
            .select('monto_usd, monto_pagado_usd')
            .in('inmueble_id', inmueblesIds)
            .neq('estado', 'pagado')

        saldoPendienteUsd = recibos?.reduce((acc: any, r: any) =>
            acc + (Number(r.monto_usd) - Number(r.monto_pagado_usd)), 0) || 0
    }

    const isSolvente = saldoPendienteUsd <= 0


    // Contar notificaciones no leídas
    const { count: unreadCount } = await supabaseAdmin
        .from('notificaciones')
        .select('*', { count: 'exact', head: true })
        .eq('perfil_id', perfilId)
        .eq('leida', false)

    // Obtener Tasa BCV Oficial
    let tasaBcv: number | null = null;
    try {
        const resBcv = await fetch('https://ve.dolarapi.com/v1/dolares/oficial', { next: { revalidate: 3600 } })
        if (resBcv.ok) {
            const dataBcv = await resBcv.json()
            tasaBcv = dataBcv.promedio
        }
    } catch (e) { console.error("Error obteniendo BCV general") }

    // Cargar Egresos para el widget de transparencia
    const { data: egresos } = await supabaseAdmin
        .from('egresos')
        .select('id, descripcion, monto_usd, fecha_gasto, categoria')
        .order('fecha_gasto', { ascending: false })
        .limit(5)

    return (
        <div className="relative">
            {/* Header */}
            <div className="relative z-50">
                <div className="bg-[#1e3a8a] text-white pt-10 pb-12 px-6 rounded-b-[40px] shadow-lg relative overflow-hidden">
                    <div className="relative z-10">
                        <div className="flex justify-between items-start mb-6">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center border border-white/20">
                                    <UserIcon className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <p className="text-sm text-blue-100 font-medium">¡Hola, {perfil.nombres}! 👋</p>
                                    <h1 className="text-xl font-bold tracking-tight">{nombreCondominio}</h1>
                                </div>
                            </div>
                            <NotificacionesWidget count={unreadCount || 0} href="/dashboard/propietario/notificaciones" theme="dark" />
                        </div>

                        {/* Badge de Solvencia Real */}
                        {isSolvente ? (
                            <div className="inline-flex items-center gap-2 bg-emerald-500/20 border border-emerald-500/50 text-emerald-50 px-3 py-1.5 rounded-full text-xs font-bold tracking-wider">
                                <CheckCircle2 className="w-4 h-4 fill-emerald-500 text-white" />
                                ESTADO: SOLVENTE ✓
                            </div>
                        ) : (
                            <div className="inline-flex items-center gap-2 bg-red-500/20 border border-red-500/50 text-red-50 px-3 py-1.5 rounded-full text-xs font-bold tracking-wider">
                                <AlertTriangle className="w-4 h-4 text-red-300" />
                                DEUDA: ${saldoPendienteUsd.toFixed(2)}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Contenido Principal */}
            <div className="px-5 mt-4 relative z-10 space-y-4">

                {/* Resumen Financiero Card */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                    <h2 className="text-xs font-bold text-slate-500 tracking-widest mb-4">RESUMEN FINANCIERO</h2>

                    <div className="flex justify-between items-start mb-6">
                        <div className="flex-1">
                            <p className="text-[10px] text-slate-400 font-medium mb-1">SALDO PENDIENTE (USD)</p>
                            <p className={`text-3xl font-bold ${isSolvente ? 'text-emerald-600' : 'text-red-600'}`}>
                                {isSolvente ? '$0.00' : `$${saldoPendienteUsd.toFixed(2)}`}
                            </p>
                        </div>
                        <div className="w-px h-12 bg-slate-100 mx-4 self-center"></div>
                        <div className="flex-1">
                            <p className="text-[10px] text-slate-400 font-medium mb-1">SALDO PENDIENTE (BS)</p>
                            <p className="text-2xl font-bold text-slate-900 mt-1">
                                {tasaBcv
                                    ? `Bs. ${(saldoPendienteUsd * tasaBcv).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                                    : 'Bs. —'}
                            </p>
                        </div>
                    </div>

                    <div className="flex justify-between items-center pt-4 border-t border-slate-100">
                        {tasaBcv ? (
                            <p className="text-xs text-slate-500 font-medium flex items-center gap-1">
                                Tasa BCV Hoy: <span className="font-bold text-[#1e3a8a]">Bs. {tasaBcv.toFixed(2)}</span>
                            </p>
                        ) : (
                            <p className="text-xs text-slate-400 font-medium">Tasa BCV no disponible</p>
                        )}
                        <Link href="/dashboard/propietario/pagos" className="text-xs font-bold text-[#1e3a8a] flex items-center gap-1 hover:underline">
                            Ver Recibos <ChevronRight className="w-3 h-3" />
                        </Link>
                    </div>
                </div>

                {/* Action Button: Reportar Pago */}
                <Link
                    href="/dashboard/propietario/pagos/nuevo"
                    className="w-full bg-[#1e3a8a] hover:bg-blue-900 text-white rounded-xl py-4 px-6 flex items-center justify-center gap-3 font-semibold shadow-sm transition-colors"
                >
                    <Banknote className="w-6 h-6" />
                    Reportar Pago Móvil
                </Link>

                {/* Tutorial Rápido */}
                <TutorialResidentWidget />

                {/* Gastos: Transparencia */}
                <GastosTransparenciaWidget egresos={egresos || []} />



            </div>
        </div>
    )
}

function UserIcon({ className }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
            <path fillRule="evenodd" d="M18.685 19.097A9.723 9.723 0 0021.75 12c0-5.385-4.365-9.75-9.75-9.75S2.25 6.615 2.25 12a9.723 9.723 0 003.065 7.097A9.716 9.716 0 0012 21.75a9.716 9.716 0 006.685-2.653zm-12.54-1.285A7.486 7.486 0 0112 15a7.486 7.486 0 015.855 2.812A8.224 8.224 0 0112 20.25a8.224 8.224 0 01-5.855-2.438zM15.75 9a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" clipRule="evenodd" />
        </svg>
    )
}
