import { ArrowLeft, Filter, CheckCircle2, Clock, XCircle, ReceiptIcon, Banknote, TrendingDown } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

export const dynamic = 'force-dynamic'

export default async function PagosPropietarioPage() {
    const supabase = await createClient()
    const cookieStore = await cookies()
    const perfilId = cookieStore.get('propietario_token')?.value

    if (!perfilId) {
        redirect('/dashboard/propietario/validar')
    }

    // 1. Calcular saldo pendiente real
    const { data: inmuebles } = await supabase
        .from('inmuebles')
        .select('id')
        .eq('propietario_id', perfilId)

    const inmueblesIds = inmuebles?.map(i => i.id) || []
    let saldoPendienteUsd = 0

    if (inmueblesIds.length > 0) {
        const { data: recibos } = await supabase
            .from('recibos_cobro')
            .select('monto_usd, monto_pagado_usd')
            .in('inmueble_id', inmueblesIds)
            .neq('estado', 'pagado')

        saldoPendienteUsd = recibos?.reduce((acc, r) => acc + (Number(r.monto_usd) - Number(r.monto_pagado_usd)), 0) || 0
    }

    // 2. Obtener historial de pagos reportados
    const { data: pagos } = await supabase
        .from('pagos_reportados')
        .select('*, recibos_cobro(mes)')
        .eq('perfil_id', perfilId)
        .order('created_at', { ascending: false })

    // Calcular total aprobado
    const totalAprobadoUsd = pagos
        ?.filter(p => p.estado === 'aprobado')
        .reduce((acc, curr) => acc + Number(curr.monto_equivalente_usd), 0) || 0

    // Agrupar pagos por mes para el timeline
    const pagosPorMes: Record<string, typeof pagos> = {}
    if (pagos) {
        for (const pago of pagos) {
            const llave = format(new Date(pago.created_at), "MMMM yyyy", { locale: es })
            if (!pagosPorMes[llave]) pagosPorMes[llave] = []
            pagosPorMes[llave]!.push(pago)
        }
    }

    const isSolvente = saldoPendienteUsd <= 0

    return (
        <div className="relative pb-24 bg-slate-50 min-h-screen">

            {/* Header */}
            <header className="px-5 py-4 flex items-center justify-between border-b border-slate-200 bg-white sticky top-0 z-40">
                <Link href="/dashboard/propietario" className="p-2 -ml-2 text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <h1 className="text-lg font-bold text-slate-900">Mis Pagos</h1>
                <button className="p-2 -mr-2 text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
                    <Filter className="w-5 h-5" />
                </button>
            </header>

            <div className="px-5 pt-6 space-y-6">

                {/* Tarjetas de Resumen */}
                <div className="flex gap-4">
                    <div className={`flex-1 p-4 rounded-xl border shadow-sm ${isSolvente ? 'bg-emerald-50 border-emerald-100' : 'bg-red-50 border-red-100'}`}>
                        <p className={`text-[10px] font-bold tracking-widest uppercase mb-1 ${isSolvente ? 'text-emerald-600' : 'text-red-600'}`}>
                            {isSolvente ? '✅ SOLVENTE' : '⚠️ PENDIENTE'}
                        </p>
                        <p className={`text-xl font-bold ${isSolvente ? 'text-emerald-700' : 'text-red-700'}`}>
                            {isSolvente ? '$0.00' : `$${saldoPendienteUsd.toFixed(2)}`}
                        </p>
                    </div>

                    <div className="flex-1 bg-white border border-slate-200 p-4 rounded-xl shadow-sm">
                        <p className="text-[10px] font-bold text-slate-500 tracking-widest uppercase mb-1">TOTAL PAGADO</p>
                        <p className="text-xl font-bold text-emerald-600">${totalAprobadoUsd.toFixed(2)}</p>
                    </div>
                </div>

                {/* Timeline de Pagos */}
                <div>
                    <h2 className="text-xs font-bold text-slate-500 tracking-widest uppercase mb-5">HISTORIAL DE PAGOS</h2>

                    {Object.keys(pagosPorMes).length === 0 ? (
                        <div className="text-center py-10 bg-white rounded-2xl border border-slate-200 border-dashed opacity-70">
                            <div className="bg-slate-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                <ReceiptIcon className="w-8 h-8 text-slate-400" />
                            </div>
                            <p className="text-slate-500 font-medium pb-1">No hay pagos reportados</p>
                            <p className="text-slate-400 text-sm">Los comprobantes que envíes aparecerán aquí.</p>
                        </div>
                    ) : (
                        <div className="space-y-8">
                            {Object.entries(pagosPorMes).map(([mes, pagosMes]) => (
                                <div key={mes}>
                                    {/* Mes header */}
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="w-2 h-2 rounded-full bg-[#1e3a8a]"></div>
                                        <p className="text-xs font-black text-slate-500 uppercase tracking-widest capitalize">{mes}</p>
                                        <div className="flex-1 h-px bg-slate-200"></div>
                                    </div>

                                    {/* Timeline entries */}
                                    <div className="ml-3 space-y-0 relative">
                                        {/* Vertical spine */}
                                        <div className="absolute left-[7px] top-0 bottom-0 w-px bg-slate-100"></div>

                                        {pagosMes?.map((pago, idx) => {
                                            const mesRecibo = (pago.recibos_cobro as any)?.mes || 'Abono General'
                                            const formatFecha = format(new Date(pago.fecha_pago), "d 'de' MMMM", { locale: es })
                                            const isAprobado = pago.estado === 'aprobado'
                                            const isPendiente = pago.estado === 'en_revision' || pago.estado === 'pendiente'
                                            const isRechazado = pago.estado === 'rechazado'

                                            return (
                                                <div key={pago.id} className="relative flex gap-4 pb-5">
                                                    {/* Node */}
                                                    <div className={`relative z-10 w-4 h-4 rounded-full border-2 border-white shadow-sm mt-1 shrink-0 ${isAprobado ? 'bg-emerald-500' : isPendiente ? 'bg-amber-400' : 'bg-red-400'}`}></div>

                                                    {/* Card */}
                                                    <div className="flex-1 bg-white rounded-2xl border border-slate-100 p-4 shadow-sm">
                                                        <div className="flex items-start justify-between gap-2 mb-2">
                                                            <div className="flex items-center gap-2 flex-wrap">
                                                                {isAprobado && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />}
                                                                {isPendiente && <Clock className="w-4 h-4 text-amber-500 shrink-0" />}
                                                                {isRechazado && <XCircle className="w-4 h-4 text-red-500 shrink-0" />}
                                                                <h3 className="font-bold text-slate-900 text-sm capitalize leading-tight">{mesRecibo}</h3>
                                                            </div>
                                                            <span className="font-black text-slate-900 text-base shrink-0">${Number(pago.monto_equivalente_usd).toFixed(2)}</span>
                                                        </div>

                                                        <div className="flex items-center justify-between">
                                                            <p className="text-[10px] text-slate-400 font-medium">
                                                                {pago.banco_origen} · {formatFecha}
                                                            </p>
                                                            {isAprobado && <span className="bg-emerald-100 text-emerald-700 text-[9px] font-black px-1.5 py-0.5 rounded-full tracking-wider uppercase">Aprobado</span>}
                                                            {isPendiente && <span className="bg-amber-100 text-amber-700 text-[9px] font-black px-1.5 py-0.5 rounded-full tracking-wider uppercase">Pendiente</span>}
                                                            {isRechazado && <span className="bg-red-100 text-red-700 text-[9px] font-black px-1.5 py-0.5 rounded-full tracking-wider uppercase">Rechazado</span>}
                                                        </div>

                                                        {pago.referencia && (
                                                            <p className="text-[10px] text-slate-300 font-mono mt-1">Ref: {pago.referencia}</p>
                                                        )}

                                                        {isRechazado && pago.nota_admin && (
                                                            <div className="mt-3 bg-red-50 text-red-700 text-xs p-2.5 rounded-lg border border-red-100">
                                                                <span className="font-bold">Motivo: </span>{pago.nota_admin}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Botón Flotante Inferior */}
            <div className="fixed bottom-[85px] md:static md:mt-8 left-0 right-0 max-w-md md:max-w-none mx-auto px-5 md:px-0 z-40 flex md:justify-end">
                <Link href="/dashboard/propietario/pagos/nuevo" className="w-full md:w-auto md:px-12 bg-[#1e3a8a] text-white py-4 rounded-xl font-bold shadow-lg hover:bg-blue-900 transition-colors active:scale-95 flex items-center justify-center cursor-pointer">
                    Reportar Nuevo Pago
                </Link>
            </div>

        </div>
    )
}
