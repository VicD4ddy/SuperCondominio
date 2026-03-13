import { Search, MessageSquare, Clock, ChevronDown, CheckCircle2, ChevronRight, Receipt, FileText, Megaphone, Bell, TrendingUp, TrendingDown, Building, Calendar, Check, X, Eye, Plus, AlertCircle, Wallet, Download, Info } from 'lucide-react'
import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import CaptureViewer from './CaptureViewer'
import NotificacionesWidget from '@/components/NotificacionesWidget'
import RejectionForm from './RejectionForm'
import { getAdminProfile } from '@/utils/supabase/admin-helper'
import ReceiptDownloadButton from '@/components/ReceiptDownloadButton'
import ExportadorExcelButton from './finanzas/ExportadorExcelButton'
import FiltroPagos from './FiltroPagos'

export default async function AdminDashboardPage({
    searchParams
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
    const { user, profile: adminPerfil } = await getAdminProfile()
    const supabase = await createClient()

    if (!user) {
        return (
            <div className="p-5 text-center text-slate-500">
                Sesión no iniciada. <Link href="/admin" className="text-blue-600 underline">Ir al Login</Link>
            </div>
        )
    }

    if (!adminPerfil) {
        return <div className="p-5 text-red-500">Error: Perfil Admin no encontrado.</div>
    }

    const resolvedParams = await searchParams
    const successMsg = resolvedParams?.success === 'cobros_emitidos'
    const verPagoId = resolvedParams?.ver_pago;

    const condominioData = adminPerfil?.condominios as {
        cuentas_bancarias?: unknown
        nombre?: string | null
    } | null

    // Contar notificaciones no leídas para Admin
    const { count: unreadAdminCount } = await supabase
        .from('notificaciones')
        .select('*', { count: 'exact', head: true })
        .is('perfil_id', null)
        .eq('leida', false)

    // Cargar Pagos Pendientes (en_revision)
    const { data: pagosPendientes, error: errorPagos } = await supabase
        .from('pagos_reportados')
        .select(`
            *,
            perfiles:perfil_id (
                nombres,
                apellidos,
                inmuebles ( identificador )
            )
        `)
        .eq('estado', 'en_revision')
        .order('created_at', { ascending: false })

    const totalPendientes = pagosPendientes?.length || 0;
    const montoTotalBs = pagosPendientes?.reduce((acc, pago) => acc + Number(pago.monto_bs), 0) || 0;
    const pagoSeleccionado = pagosPendientes?.find(p => p.id === verPagoId);

    // Calcular montos desde la tabla recibos_cobro para las estadísticas Desktop
    const { data: recibos } = await supabase
        .from('recibos_cobro')
        .select('monto_usd, monto_pagado_usd, estado')

    let totalEmitido = 0;
    let totalRecaudado = 0;
    let totalCuentasPorCobrar = 0;

    if (recibos) {
        recibos.forEach(r => {
            totalEmitido += Number(r.monto_usd);
            totalRecaudado += Number(r.monto_pagado_usd);
            if (r.estado !== 'pagado') {
                totalCuentasPorCobrar += (Number(r.monto_usd) - Number(r.monto_pagado_usd));
            }
        });
    }

    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1)
    const monthStartStr = monthStart.toISOString().slice(0, 10)
    const nextMonthStartStr = nextMonthStart.toISOString().slice(0, 10)

    const { data: recibosMes } = await supabase
        .from('recibos_cobro')
        .select('monto_usd, monto_pagado_usd, estado')
        .gte('fecha_emision', monthStartStr)
        .lt('fecha_emision', nextMonthStartStr)

    let totalEmitidoMes = 0
    let totalRecaudadoMes = 0
    let totalPendienteMes = 0

    if (recibosMes) {
        recibosMes.forEach(r => {
            totalEmitidoMes += Number(r.monto_usd)
            totalRecaudadoMes += Number(r.monto_pagado_usd)
            if (r.estado !== 'pagado') {
                totalPendienteMes += (Number(r.monto_usd) - Number(r.monto_pagado_usd))
            }
        })
    }

    const { data: egresosMes } = await supabase
        .from('egresos')
        .select('monto_usd')
        .gte('fecha_gasto', monthStartStr)
        .lt('fecha_gasto', nextMonthStartStr)

    const totalEgresosMes = egresosMes?.reduce((acc, e) => acc + Number(e.monto_usd), 0) || 0
    const saldoNetoMes = totalRecaudadoMes - totalEgresosMes

    const { count: ticketsAbiertosCount } = await supabase
        .from('tickets_soporte')
        .select('*', { count: 'exact', head: true })
        .eq('estado', 'abierto')

    const { data: inmueblesData } = await supabase
        .from('inmuebles')
        .select('propietario_id')

    const inmueblesSinPropietario = (inmueblesData || []).filter(i => !i.propietario_id).length

    const { data: bitacoraLogs } = await supabase
        .from('logs_sistema')
        .select('id, evento, detalles, created_at, perfiles(nombres, apellidos)')
        .order('created_at', { ascending: false })
        .limit(8)

    let tasaBcvRegistradaHoy = true
    try {
        const { data: tasaDb } = await supabase
            .from('tasa_bcv')
            .select('fecha')
            .order('fecha', { ascending: false })
            .limit(1)
            .maybeSingle()

        const todayStr = now.toISOString().slice(0, 10)
        const lastTasaStr = (tasaDb as { fecha?: string | null } | null)?.fecha

        if (lastTasaStr === todayStr) {
            tasaBcvRegistradaHoy = true
        } else {
            // Sincronización automática de la tasa BCV si no existe la de hoy
            const apiRes = await fetch('https://ve.dolarapi.com/v1/dolares/oficial', { next: { revalidate: 3600 } })
            if (apiRes.ok) {
                const bcvData = await apiRes.json()
                if (bcvData && bcvData.promedio) {
                    await supabase.from('tasa_bcv').insert({
                        tasa: bcvData.promedio,
                        fecha: todayStr
                    })
                    tasaBcvRegistradaHoy = true
                } else {
                    tasaBcvRegistradaHoy = false
                }
            } else {
                tasaBcvRegistradaHoy = false
            }
        }
    } catch (e) {
        tasaBcvRegistradaHoy = true
    }

    const cuentasBancarias = Array.isArray(condominioData?.cuentas_bancarias) ? condominioData.cuentas_bancarias : []
    const tieneCuentasBancarias = cuentasBancarias.length > 0

    const alerts: { title: string; detail: string; href?: string }[] = []
    if (totalPendientes > 0) alerts.push({ title: 'Pagos por conciliar', detail: `Tienes ${totalPendientes} pago(s) en revisión.`, href: '/dashboard/admin' })
    if ((ticketsAbiertosCount || 0) > 0) alerts.push({ title: 'Soporte pendiente', detail: `${ticketsAbiertosCount} ticket(s) abierto(s).`, href: '/dashboard/admin/soporte' })
    if (!tieneCuentasBancarias) alerts.push({ title: 'Cuentas bancarias', detail: 'No hay cuentas bancarias configuradas.', href: '/dashboard/admin/ajustes' })
    if (!tasaBcvRegistradaHoy) alerts.push({ title: 'Tasa BCV', detail: 'No hay una tasa registrada para hoy en el sistema.', href: '/dashboard/admin/ajustes' })

    type RecaudacionMensualRow = {
        month_start: string
        emitido_usd: number
        recaudado_usd: number
        pendiente_usd: number
    }

    let tendencia6m: RecaudacionMensualRow[] = []
    try {
        const { data: tendenciaData } = await supabase
            .rpc('get_recaudacion_mensual', { months: 6 })

        tendencia6m = (tendenciaData as RecaudacionMensualRow[] | null) || []
    } catch (e) {
        tendencia6m = []
    }

    // Fallback seguro si la RPC no existe o retorna vacío: 6 meses en 0
    if (!tendencia6m || tendencia6m.length === 0) {
        const lastMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
        const months: RecaudacionMensualRow[] = []
        for (let i = 5; i >= 0; i--) {
            const d = new Date(lastMonthStart.getFullYear(), lastMonthStart.getMonth() - i, 1)
            months.push({
                month_start: d.toISOString().slice(0, 10),
                emitido_usd: 0,
                recaudado_usd: 0,
                pendiente_usd: 0,
            })
        }
        tendencia6m = months
    }

    const maxRecaudado6m = Math.max(0, ...tendencia6m.map(m => Number(m.recaudado_usd) || 0))

    // Obtener Tasa BCV Oficial para el Layout
    let tasaBcv = 36.50;
    try {
        const resBcv = await fetch('https://ve.dolarapi.com/v1/dolares/oficial', { next: { revalidate: 3600 } })
        if (resBcv.ok) {
            const dataBcv = await resBcv.json()
            tasaBcv = dataBcv.promedio
        }
    } catch (e) { }

    return (
        <>
            {/* ========================================================= */}
            {/* MODAL GLOBAL PARA DETALLES DEL PAGO (Desktop y Mobile)    */}
            {/* ========================================================= */}
            {pagoSeleccionado && (
                <div className="fixed inset-0 z-[100] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden relative">
                        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                            <h3 className="font-bold text-slate-900 text-lg">Revisar Pago <span className="text-[#1e3a8a]">#{pagoSeleccionado.referencia}</span></h3>
                            <Link href="/dashboard/admin" scroll={false} className="p-2 text-slate-400 hover:text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-full transition-colors">
                                <X className="w-5 h-5" />
                            </Link>
                        </div>
                        <div className="p-5 space-y-4">
                            <div className="flex justify-between items-center bg-slate-50 p-4 rounded-xl border border-slate-100 shadow-inner">
                                <div>
                                    <p className="text-[10px] font-bold text-slate-500 tracking-widest uppercase mb-1">CANTIDAD REPORTADA</p>
                                    <p className="text-2xl font-black text-[#1e3a8a]">{Number(pagoSeleccionado.monto_bs).toLocaleString('es-VE', { minimumFractionDigits: 2 })} Bs.</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">EQUIVALENTE</p>
                                    <p className="text-xl font-bold text-emerald-600">${(Number(pagoSeleccionado.monto_bs) / pagoSeleccionado.tasa_aplicada).toFixed(2)}</p>
                                </div>
                            </div>

                            {/* Comprobante */}
                            <div className="flex justify-center my-6 relative">
                                <CaptureViewer url={pagoSeleccionado.capture_url} referencia={pagoSeleccionado.referencia} />
                                {pagoSeleccionado.estado === 'aprobado' && (
                                    <div className="absolute -bottom-8 right-0">
                                        <ReceiptDownloadButton
                                            data={{
                                                receiptNumber: pagoSeleccionado.id.toString(),
                                                propietarioName: pagoSeleccionado.perfiles?.nombres + ' ' + (pagoSeleccionado.perfiles?.apellidos || ''),
                                                concepto: 'Abono / Cuota (Verificado por Admin)',
                                                casaApto: 'Asignado',
                                                puestoAdicional: false,
                                                montoGlobal: `${Number(pagoSeleccionado.monto_equivalente_usd).toFixed(2)} USD`,
                                                fecha: new Date(pagoSeleccionado.fecha_pago || pagoSeleccionado.created_at),
                                                formaDePago: pagoSeleccionado.banco_origen || 'Depósito',
                                                referencia: pagoSeleccionado.referencia,
                                                realizadoPor: adminPerfil?.nombres || 'Administrador',
                                                condominioName: condominioData?.nombre || 'Condominio'
                                            }}
                                        />
                                    </div>
                                )}
                            </div>

                            <p className="text-xs text-center font-medium text-slate-500 pb-2 mt-4">Verifique minuciosamente la referencia en el banco.</p>

                            {/* Acciones */}
                            <div className="grid grid-cols-2 gap-3 pt-4 border-t border-slate-100">
                                <form action={async () => {
                                    "use server"
                                    const { rechazarPagoAction } = await import('./actions')
                                    await rechazarPagoAction(pagoSeleccionado.id)
                                }}>
                                    <button type="submit" className="w-full flex items-center justify-center gap-2 bg-white border-2 border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 rounded-xl py-3.5 font-bold transition-all">
                                        <X className="w-5 h-5" /> Rechazar
                                    </button>
                                </form>

                                <form action={async () => {
                                    "use server"
                                    const { aprobarPagoAction } = await import('./actions')
                                    await aprobarPagoAction(pagoSeleccionado.id)
                                }}>
                                    <button type="submit" className="w-full flex items-center justify-center gap-2 bg-[#1e3a8a] text-white hover:bg-blue-900 hover:shadow-lg rounded-xl py-3.5 border-2 border-[#1e3a8a] hover:border-blue-900 font-bold transition-all">
                                        <Check className="w-5 h-5" /> Aprobar
                                    </button>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            )}


            {/* ========================================================= */}
            {/* VISTA DESKTOP (Basada en nuevo Mockup L-Shape)          */}
            {/* ========================================================= */}
            <div className="hidden md:block min-h-screen bg-slate-50 p-6 xl:p-8 pb-24">
                {/* Header Superior Global */}
                <header className="flex items-center justify-between mb-8 bg-white p-4 lg:p-5 rounded-2xl shadow-sm border border-slate-100">
                    <div className="flex items-center gap-4 flex-1">
                        <div className="relative w-full max-w-md hidden lg:block">
                            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input type="text" placeholder="Buscar residente o inmueble..." className="w-full bg-slate-50 border border-slate-100 rounded-xl pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-[#1e3a8a]/20 focus:border-[#1e3a8a] outline-none transition-all font-medium text-slate-700" />
                        </div>
                        <div className="bg-blue-50 text-[#1e3a8a] px-3 lg:px-4 py-1.5 lg:py-2 rounded-full text-xs font-bold border border-blue-100 flex items-center gap-2">
                            <span className="text-blue-400 uppercase tracking-widest text-[9px] lg:text-[10px]">TASA BCV OFICIAL</span>
                            <span className="text-sm">{tasaBcv.toFixed(2)} Bs/USD</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-4 min-w-fit">
                        <NotificacionesWidget count={unreadAdminCount || 0} href="/dashboard/admin/notificaciones" theme="light" />
                        <button className="text-slate-400 hover:text-slate-600 transition-colors bg-slate-50 p-2 rounded-full border border-slate-100 hover:border-slate-200">
                            <MessageSquare className="w-5 h-5" />
                        </button>
                        <div className="flex items-center gap-3 border-l border-slate-200 pl-5 ml-2 cursor-pointer group">
                            <div className="text-right hidden sm:block">
                                <p className="text-sm font-bold text-slate-800 leading-tight group-hover:text-[#1e3a8a] transition-colors">{adminPerfil?.nombres} {adminPerfil?.apellidos}</p>
                                <p className="text-[10px] text-slate-500 font-medium">Administrador</p>
                            </div>
                            <div className="w-10 h-10 bg-slate-200 rounded-full overflow-hidden border-2 border-slate-100 shadow-sm group-hover:border-[#1e3a8a]/30 transition-all flex items-center justify-center font-bold text-[#1e3a8a]">
                                {/* Initial Avatar */}
                                {adminPerfil?.nombres?.charAt(0)}{adminPerfil?.apellidos?.charAt(0)}
                            </div>
                        </div>
                    </div>
                </header>

                <div className="space-y-6 max-w-7xl mx-auto">

                    {/* Título y Acciones Macro */}
                    <div className="flex items-end justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Visión General</h1>
                            <p className="text-sm text-slate-500 mt-1 flex items-center gap-1">Estado en tiempo real de la gestión administrativa para <span className="italic font-bold text-slate-700">"{condominioData?.nombre}"</span></p>
                        </div>
                        <div className="flex items-center gap-3">
                            <ExportadorExcelButton />
                            <Link href="/dashboard/admin/emitir-cobro" className="bg-[#1e3a8a] text-white px-4 py-2.5 rounded-xl text-sm font-bold shadow-sm hover:bg-blue-900 hover:shadow-md flex items-center gap-2 transition-all">
                                <Plus className="w-4 h-4" /> Cuota Especial
                            </Link>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/30">
                            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <AlertCircle className="w-5 h-5 text-orange-500" />
                                Alertas
                            </h3>
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{alerts.length} activa(s)</span>
                        </div>
                        <div className="p-6">
                            {alerts.length === 0 ? (
                                <div className="flex items-center gap-3 text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl p-4 font-bold text-sm">
                                    <CheckCircle2 className="w-5 h-5" />
                                    Todo en orden. No hay alertas críticas.
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                                    {alerts.map((a, idx) => (
                                        <div key={idx} className="flex items-start justify-between gap-4 bg-slate-50 border border-slate-200 rounded-xl p-4">
                                            <div>
                                                <p className="text-sm font-black text-slate-900">{a.title}</p>
                                                <p className="text-xs text-slate-500 mt-1">{a.detail}</p>
                                            </div>
                                            {a.href ? (
                                                <Link href={a.href} className="text-xs font-black text-[#1e3a8a] hover:underline whitespace-nowrap">Revisar</Link>
                                            ) : (
                                                <span className="text-xs font-black text-slate-400 whitespace-nowrap">Revisar</span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden group hover:border-red-200 transition-all cursor-default">
                            <div className="flex justify-between items-start mb-4">
                                <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center text-red-500 border border-red-100">
                                    <Wallet className="w-6 h-6" />
                                </div>
                                <span className="bg-red-50 text-red-600 text-[10px] font-bold px-2 py-1.5 rounded-md border border-red-100">Total</span>
                            </div>
                            <p className="text-xs text-slate-500 font-bold tracking-wide mb-1 uppercase">Deuda Total Pendiente</p>
                            <h2 className="text-3xl font-black text-slate-900 tracking-tight">${totalCuentasPorCobrar.toLocaleString('en-US', { minimumFractionDigits: 2 })}</h2>
                            <p className="text-sm text-slate-400 font-medium mt-1">{(totalCuentasPorCobrar * tasaBcv).toLocaleString('es-VE', { minimumFractionDigits: 2 })} Bs.</p>
                        </div>

                        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden group hover:border-emerald-200 transition-all cursor-default">
                            <div className="flex justify-between items-start mb-4">
                                <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-500 border border-emerald-100">
                                    <TrendingUp className="w-6 h-6" />
                                </div>
                                <span className="bg-emerald-50 text-emerald-600 text-[10px] font-bold px-2 py-1.5 rounded-md border border-emerald-100">{totalEmitidoMes > 0 ? Math.round((totalRecaudadoMes / totalEmitidoMes) * 100) : 0}%</span>
                            </div>
                            <p className="text-xs text-slate-500 font-bold tracking-wide mb-1 uppercase">Recaudado (Mes)</p>
                            <h2 className="text-3xl font-black text-slate-900 tracking-tight">${totalRecaudadoMes.toLocaleString('en-US', { minimumFractionDigits: 2 })}</h2>
                            <p className="text-sm text-slate-400 font-medium mt-1">Emitido: ${totalEmitidoMes.toLocaleString('en-US', { minimumFractionDigits: 2 })} • Pendiente: ${totalPendienteMes.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                        </div>

                        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden group hover:border-orange-200 transition-all cursor-default">
                            <div className="flex justify-between items-start mb-4">
                                <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center text-orange-500 border border-orange-100">
                                    <Clock className="w-6 h-6" />
                                </div>
                                <span className="bg-orange-50 text-orange-600 text-[10px] font-bold px-2 py-1.5 rounded-md border border-orange-100">Revisión</span>
                            </div>
                            <p className="text-xs text-slate-500 font-bold tracking-wide mb-1 uppercase">Pagos por Conciliar</p>
                            <h2 className="text-3xl font-black text-slate-900 tracking-tight">{totalPendientes} Pago(s)</h2>
                            <p className="text-sm text-slate-400 font-medium mt-1">{montoTotalBs.toLocaleString('es-VE', { minimumFractionDigits: 2 })} Bs.</p>
                        </div>
                    </div>

                    {/* Grilla Bi-Columna Compleja */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                        {/* COLUMNA IZQUIERDA (Gráfico y Actividad) */}
                        <div className="lg:col-span-2 space-y-6">

                            {/* Tendencia Mensual */}
                            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 lg:p-8">
                                <div className="flex flex-wrap items-center justify-between mb-10 gap-4">
                                    <h3 className="text-lg lg:text-xl font-bold text-slate-900 tracking-tight">Tendencia de Recaudación Mensual</h3>
                                    <div className="border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold text-slate-600 cursor-pointer hover:bg-slate-50 flex items-center gap-2 shadow-sm">
                                        Últimos 6 Meses <ChevronDown className="w-4 h-4" />
                                    </div>
                                </div>
                                {/* CSS Bar Chart Responsivo */}
                                <div className="h-56 lg:h-64 flex items-end justify-between gap-3 lg:gap-6 relative border-b border-slate-100 pb-2 px-1">
                                    <div className="absolute w-full h-full flex flex-col justify-between pointer-events-none opacity-25">
                                        <div className="border-t border-slate-400 border-dashed w-full h-[1px]"></div>
                                        <div className="border-t border-slate-400 border-dashed w-full h-[1px]"></div>
                                        <div className="border-t border-slate-400 border-dashed w-full h-[1px]"></div>
                                        <div className="border-t border-slate-400 border-dashed w-full h-[1px]"></div>
                                    </div>
                                    {tendencia6m.map((m, i) => {
                                        const monthLabel = format(new Date(m.month_start), 'MMM', { locale: es })
                                        const value = Number(m.recaudado_usd) || 0
                                        const heightPct = maxRecaudado6m > 0 ? (value / maxRecaudado6m) * 100 : 0
                                        const heightStyle = value > 0 ? `${Math.max(6, Math.round(heightPct))}%` : '2%'
                                        const isLast = i === tendencia6m.length - 1
                                        return (
                                            <div key={m.month_start} className="flex-1 flex flex-col items-center justify-end h-full relative group cursor-pointer z-10 hover:-translate-y-2 transition-transform duration-300">
                                                {isLast && (
                                                    <div className="absolute -top-10 bg-slate-800 text-white text-xs lg:text-sm font-bold px-3 py-1.5 rounded-lg shadow-md animate-bounce">
                                                        ${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                    </div>
                                                )}
                                                <div className={`w-full max-w-[4rem] rounded-t-sm transition-all duration-500 shadow-inner ${isLast ? 'bg-[#1e3a8a] group-hover:bg-blue-900 border-t-2 border-blue-400' : 'bg-slate-300 group-hover:bg-slate-400'}`} style={{ height: heightStyle }}></div>
                                                <span className={`text-xs mt-3 font-bold ${isLast ? 'text-[#1e3a8a]' : 'text-slate-400'}`}>{monthLabel.toUpperCase()}</span>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>

                            {/* Última Actividad Social */}
                            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full max-h-[400px]">
                                <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                                    <h3 className="text-lg font-bold text-slate-900">Bitácora Vecinal Reciente</h3>
                                    <Link href="/dashboard/admin/logs" className="text-xs font-bold text-[#1e3a8a] cursor-pointer hover:underline uppercase tracking-widest bg-blue-50 px-3 py-1.5 rounded-md border border-blue-100">Ver todo</Link>
                                </div>
                                <div className="divide-y divide-slate-100 overflow-y-auto custom-scrollbar flex-1">
                                    {(!bitacoraLogs || bitacoraLogs.length === 0) ? (
                                        <div className="p-8 flex flex-col items-center justify-center text-center">
                                            <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mb-3">
                                                <Info className="w-6 h-6 text-slate-300" />
                                            </div>
                                            <p className="text-sm font-bold text-slate-500">Aún no hay actividad registrada</p>
                                        </div>
                                    ) : (
                                        bitacoraLogs.map((log) => {
                                            const isError = log.evento.toLowerCase().includes('error') || log.evento.toLowerCase().includes('rechaz');
                                            const isWarning = log.evento.toLowerCase().includes('aviso') || log.evento.toLowerCase().includes('pendiente');

                                            let IconTag = CheckCircle2;
                                            let iconColors = "bg-emerald-50 text-emerald-500 border-emerald-100";

                                            if (isError) {
                                                IconTag = AlertCircle;
                                                iconColors = "bg-red-50 text-red-500 border-red-100";
                                            } else if (isWarning) {
                                                IconTag = Info;
                                                iconColors = "bg-orange-50 text-orange-500 border-orange-100";
                                            }

                                            // Procesar detalles if JSON
                                            let logSubtitle = '';
                                            if (typeof log.detalles === 'string') {
                                                logSubtitle = log.detalles;
                                            } else if (log.detalles && typeof log.detalles === 'object') {
                                                // @ts-ignore
                                                logSubtitle = log.detalles.referencia || log.detalles.mensaje || JSON.stringify(log.detalles).substring(0, 50);
                                            }

                                            return (
                                                <div key={log.id} className="p-5 flex gap-4 hover:bg-slate-50 transition-colors">
                                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 border ${iconColors}`}>
                                                        <IconTag className="w-5 h-5" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm text-slate-800 font-medium line-clamp-2">
                                                            <span className="font-bold text-slate-900">{log.evento}:</span> {logSubtitle}
                                                        </p>
                                                        <div className="flex items-center gap-2 mt-2">
                                                            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest bg-slate-100 px-2 py-0.5 rounded-md inline-block">
                                                                {log.perfiles
                                                                    ? (Array.isArray(log.perfiles) ? `${log.perfiles[0]?.nombres} ${log.perfiles[0]?.apellidos}` : `${(log.perfiles as any).nombres} ${(log.perfiles as any).apellidos}`)
                                                                    : 'Automático'}
                                                            </span>
                                                            <span className="text-[9px] text-slate-400 font-medium">
                                                                • {format(new Date(log.created_at), "d MMM, HH:mm", { locale: es })}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            )
                                        })
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* COLUMNA DERECHA (Acciones Rápidas y Tabla de Pendientes) */}
                        <div className="space-y-6">

                            {/* Acciones Rápidas */}
                            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 lg:p-8">
                                <h3 className="text-lg font-bold text-slate-900 mb-5">Atajos Admninistrativos</h3>
                                <div className="space-y-3">
                                    <Link href="/dashboard/admin/emitir-cobro" className="flex items-center justify-between p-4 border border-slate-100 rounded-xl hover:border-[#1e3a8a]/40 hover:bg-[#1e3a8a]/5 hover:shadow-sm transition-all group">
                                        <div className="flex items-center gap-4">
                                            <div className="bg-slate-100 text-slate-500 p-2.5 rounded-lg group-hover:bg-white group-hover:text-[#1e3a8a] group-hover:shadow-sm transition-all border border-transparent group-hover:border-blue-100">
                                                <Receipt className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-slate-900 group-hover:text-[#1e3a8a]">Cuota Especial</p>
                                                <p className="text-[10px] text-slate-500">Aplicar cobro igualitario</p>
                                            </div>
                                        </div>
                                        <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-[#1e3a8a] transform group-hover:translate-x-1 transition-all" />
                                    </Link>


                                    <Link href="/dashboard/admin/finanzas" className="flex items-center justify-between p-4 border border-slate-100 rounded-xl hover:border-[#1e3a8a]/40 hover:bg-[#1e3a8a]/5 hover:shadow-sm transition-all group">
                                        <div className="flex items-center gap-4">
                                            <div className="bg-slate-100 text-slate-500 p-2.5 rounded-lg group-hover:bg-white group-hover:text-[#1e3a8a] group-hover:shadow-sm transition-all border border-transparent group-hover:border-blue-100">
                                                <FileText className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-slate-900 group-hover:text-[#1e3a8a]">Informes Financieros</p>
                                                <p className="text-[10px] text-slate-500">Libro contable y ajustes de cajas</p>
                                            </div>
                                        </div>
                                        <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-[#1e3a8a] transform group-hover:translate-x-1 transition-all" />
                                    </Link>
                                </div>
                            </div>

                            {/* Tabla en Cascada de Conciliación Pendiente */}
                            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full lg:max-h-[480px]">
                                <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/30">
                                    <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                        Fila de Conciliación
                                    </h3>
                                    {totalPendientes > 0 && <span className="bg-orange-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-sm animate-pulse">{totalPendientes} Urgentes</span>}
                                </div>
                                <FiltroPagos pagosPendientesObj={pagosPendientes || []} />
                            </div>

                        </div>
                    </div>
                </div>
            </div>



            {/* ========================================================= */}
            {/* VISTA MOBILE (Mantenida como Fallback Responsive)           */}
            {/* ========================================================= */}
            <div className="md:hidden relative pb-24 min-h-screen bg-slate-50">
                <header className="px-5 py-4 flex items-center justify-between border-b border-slate-200 bg-white sticky top-0 z-40">
                    <div className="flex items-center gap-4">
                        <h1 className="text-lg font-bold text-[#1e3a8a]">Recepción de Pagos</h1>
                    </div>
                    <NotificacionesWidget count={unreadAdminCount || 0} href="/dashboard/admin/notificaciones" theme="light" />
                </header>


                <div className="px-5 space-y-4 pt-4">
                    {successMsg && (
                        <div className="bg-emerald-50 text-emerald-700 p-4 rounded-xl border border-emerald-200 text-sm font-medium flex items-center justify-between animate-in fade-in slide-in-from-top-2">
                            <span>✅ Recibos generados y asignados exitosamente de acuerdo a las alícuotas.</span>
                        </div>
                    )}

                    <div className="flex gap-3">
                        <div className="flex-1 bg-white shadow-sm border border-slate-200 p-4 rounded-xl">
                            <p className="text-[10px] font-bold text-slate-500 tracking-widest uppercase mb-1">TOTAL BS. POR CONCILIAR</p>
                            <p className="text-xl font-bold text-[#1e3a8a] mb-2">{montoTotalBs.toLocaleString('es-VE')} Bs</p>
                        </div>
                        <div className="flex-1 bg-blue-50 border border-blue-100 p-4 rounded-xl">
                            <p className="text-[10px] font-bold text-blue-600 tracking-widest uppercase mb-1">COMPROBANTES</p>
                            <div className="flex items-center gap-2 mb-2">
                                <p className="text-3xl font-bold text-[#1e3a8a]">{totalPendientes}</p>
                                <span className="bg-red-100 text-red-600 text-[10px] font-bold px-2 py-0.5 rounded-full">EN ESPERA</span>
                            </div>
                        </div>
                    </div>


                    <Link href="/dashboard/admin/finanzas/egresos" className="flex items-center justify-between bg-red-50 border border-red-200 p-4 rounded-xl mt-4 hover:bg-red-100 transition-colors">
                        <div className="flex items-center gap-4">
                            <div className="bg-red-500 text-white p-2.5 rounded-xl shadow-sm">
                                <TrendingDown className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="font-bold text-slate-800 tracking-tight">Reportar Gastos (Transparencia)</p>
                                <p className="text-xs text-slate-500">Registra egresos para los residentes</p>
                            </div>
                        </div>
                    </Link>


                    <div className="flex items-center gap-2 mt-6 mb-2">
                        <AlertCircle className="w-4 h-4 text-orange-500" />
                        <h3 className="text-xs font-bold text-slate-500 tracking-widest uppercase">RECIBOS RECIENTES</h3>
                    </div>
                    <h3 className="text-slate-800 font-bold mb-2 pt-2 px-1">Recibos Recientes</h3>

                    <div className="grid grid-cols-1 gap-4">
                        {(!pagosPendientes || pagosPendientes.length === 0) ? (
                            <div className="bg-white border-2 border-dashed border-slate-200 rounded-2xl p-10 flex flex-col items-center justify-center text-center">
                                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4 text-slate-400">
                                    <Check className="w-8 h-8" />
                                </div>
                                <h3 className="text-slate-800 font-bold mb-1">¡Todo al día!</h3>
                                <p className="text-slate-500 text-sm max-w-[200px]">No hay reportes de pago pendientes por conciliar.</p>
                            </div>
                        ) : (
                            pagosPendientes?.map((pago) => {
                                const nombrePropietario = `${pago.perfiles?.nombres || ''} ${pago.perfiles?.apellidos || ''}`.trim() || 'Residente Desconocido';
                                let inms = 'Sin Inmueble';
                                if (pago.perfiles?.inmuebles && Array.isArray(pago.perfiles.inmuebles) && pago.perfiles.inmuebles.length > 0) {
                                    inms = pago.perfiles.inmuebles.map((i: any) => i.identificador).join(', ');
                                }

                                return (
                                    <div key={pago.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <h4 className="font-bold text-slate-900">{nombrePropietario}</h4>
                                                <div className="flex items-center gap-1 text-slate-500 text-xs mt-1">
                                                    <Building className="w-3 h-3" />
                                                    <span className="line-clamp-1 break-all">{inms}</span>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <span className="bg-slate-100 text-slate-600 font-bold px-2 py-1 rounded text-[10px] tracking-wider block mb-1">
                                                    REF: #{pago.referencia}
                                                </span>
                                                <span className="text-[10px] text-slate-400">
                                                    {format(new Date(pago.fecha_pago), "d MMM yyyy", { locale: es })}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex justify-between items-end mb-4 border-t border-slate-50 pt-4">
                                            <div>
                                                <p className="text-[10px] font-bold text-slate-400 tracking-widest mb-1">MONTO REPORTADO</p>
                                                <p className="text-xl font-bold text-[#1e3a8a]">{Number(pago.monto_bs).toLocaleString('es-VE', { minimumFractionDigits: 2 })} Bs.</p>
                                                <p className="text-xs text-slate-400 mt-1">Tasa: {pago.tasa_aplicada} Bs/$</p>
                                            </div>
                                            <CaptureViewer url={pago.capture_url} referencia={pago.referencia} />
                                        </div>

                                        <div className="flex gap-3">
                                            <div className="flex-1">
                                                <RejectionForm pagoId={pago.id} />
                                            </div>
                                            <form className="flex-1" action={async () => {
                                                "use server"
                                                const { aprobarPagoAction } = await import('./actions')
                                                await aprobarPagoAction(pago.id)
                                            }}>
                                                <button type="submit" className="w-full flex items-center justify-center gap-2 bg-[#1e3a8a] border border-[#1e3a8a] text-white hover:bg-blue-900 rounded-xl py-2.5 font-semibold text-sm transition-all shadow-sm focus:outline-none focus:ring-4 focus:ring-blue-200">
                                                    <Check className="w-4 h-4" /> Aprobar
                                                </button>
                                            </form>
                                        </div>
                                    </div>
                                )
                            })
                        )}
                    </div>
                </div>

                {/* Floating Action Button (Mobile Only) */}
                <Link
                    href="/dashboard/admin/emitir-cobro"
                    className="fixed bottom-24 right-5 bg-[#1e3a8a] text-white p-4 rounded-full shadow-lg z-50 flex items-center gap-2 hover:bg-blue-900 transition-all hover:scale-105"
                >
                    <Plus className="w-6 h-6" />
                </Link>
            </div>
        </>
    )
}
