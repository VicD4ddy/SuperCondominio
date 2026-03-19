import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import { TrendingUp, HandCoins, ArrowRight, Receipt, FileText, TrendingDown, ClipboardList } from 'lucide-react'
import ParametrosFinancierosCard from './ParametrosFinancierosCard'
import { getReporteConsolidadosAction, getReporteAnualAction } from './actions'
import ReporteCuentasPorCobrar from '@/components/ReporteCuentasPorCobrar'
import ExcelActions from '@/components/ExcelActions'
import { getAdminProfile } from '@/utils/supabase/admin-helper'
import PanelMorosidad from '@/components/PanelMorosidad'
import ImportadorExcelWidget from './ImportadorExcelWidget'

export const dynamic = 'force-dynamic';

export default async function AdminFinanzasPage() {
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

    // El adminPerfil retornado por getAdminProfile ya incluye la data del condominio.

    // Obtener Tasa BCV Oficial
    let tasaBcv = 36.50;
    try {
        const resBcv = await fetch('https://ve.dolarapi.com/v1/dolares/oficial', { next: { revalidate: 3600 } })
        if (resBcv.ok) {
            const dataBcv = await resBcv.json()
            tasaBcv = dataBcv.promedio
        }
    } catch (e) { }

    // Obtener Data para el Reporte Consolidado y Anual
    const { data: reporteData } = await getReporteConsolidadosAction()
    const { data: reporteAnualData } = await getReporteAnualAction()

    // Calcular montos desde la tabla recibos_cobro (INGRESOS en USD base comercial)
    const { data: recibos } = await supabase
        .from('recibos_cobro')
        .select('monto_usd, monto_pagado_usd, estado')

    let totalEmitido = 0;
    let totalRecaudadoUsd = 0;
    let totalCuentasPorCobrar = 0;

    if (recibos) {
        recibos.forEach(r => {
            totalEmitido += Number(r.monto_usd);
            totalRecaudadoUsd += Number(r.monto_pagado_usd);
            if (r.estado !== 'pagado') {
                totalCuentasPorCobrar += (Number(r.monto_usd) - Number(r.monto_pagado_usd));
            }
        });
    }

    // Calcular monto real tranzado en Bs. desde los Pagos Aprobados
    const { data: pagosAprobados } = await supabase
        .from('pagos_reportados')
        .select('monto_bs, monto_equivalente_usd, banco_origen')
        .eq('estado', 'aprobado');
        
    let totalRealUsd = 0;
    let totalRealBs = 0;

    if (pagosAprobados) {
        pagosAprobados.forEach(pago => {
            const banco = (pago.banco_origen || '').toLowerCase();
            // Lógica de separación de divisas / bancos
            const isUsd = banco.includes('zelle') || banco.includes('binance') || banco === 'efectivo' || banco.includes('efectivo usd');
            
            if (isUsd) {
                totalRealUsd += Number(pago.monto_equivalente_usd);
            } else {
                totalRealBs += Number(pago.monto_bs);
            }
        });
    }

    // Calcular montos de egresos (GASTOS)
    const { data: egresos } = await supabase
        .from('egresos')
        .select('monto_usd')

    const totalEgresos = egresos?.reduce((acc, curr) => acc + Number(curr.monto_usd), 0) || 0;

    return (
        <div className="min-h-screen bg-slate-50 pb-20 overflow-x-hidden">
            {/* Header Rediseñado - Sticky a nivel de mobile */}
            <div className="bg-[#1e3a8a] text-white px-6 pt-12 pb-8 rounded-b-3xl shadow-lg sticky top-0 z-50">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Centro Financiero</h1>
                        <p className="text-blue-100/80 text-sm mt-1">Estado contable del Condominio</p>
                    </div>
                </div>
            </div>

            <div className="px-5 mt-6 space-y-4">

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-emerald-50/50 border border-emerald-100 p-5 rounded-2xl relative overflow-hidden group shadow-sm">
                        <TrendingUp className="w-5 h-5 text-emerald-600 mb-3" />
                        <p className="text-[10px] font-bold text-emerald-700 tracking-widest uppercase mb-1">INGRESOS EN DÓLARES MENSUALES</p>
                        <h2 className="text-3xl font-black text-emerald-700 tracking-tight mt-1">${totalRealUsd.toFixed(2)}</h2>
                    </div>

                    <div className="bg-emerald-50/50 border border-emerald-100 p-5 rounded-2xl relative overflow-hidden group shadow-sm">
                        <TrendingUp className="w-5 h-5 text-emerald-600 mb-3" />
                        <p className="text-[10px] font-bold text-emerald-700 tracking-widest uppercase mb-1">INGRESOS EN BOLÍVARES MENSUALES</p>
                        <h2 className="text-3xl font-black text-emerald-700 tracking-tight mt-1">{totalRealBs.toLocaleString('es-VE', { minimumFractionDigits: 2 })} Bs.</h2>
                    </div>
                </div>

                <div className="bg-orange-50 border border-orange-100 p-4 rounded-xl flex justify-between items-center">
                    <div>
                        <p className="text-[10px] font-bold text-orange-600 tracking-widest uppercase">CUENTAS POR COBRAR</p>
                        <p className="text-xl font-bold text-orange-700">${totalCuentasPorCobrar.toFixed(2)}</p>
                    </div>
                    <div className="bg-white/50 p-2 rounded-lg text-orange-600 text-xs font-bold">
                        {(totalCuentasPorCobrar * tasaBcv).toLocaleString('es-VE')} Bs.
                    </div>
                </div>

                {/* === REPORTE CONSOLIDADO (NUEVO) === */}
                <div className="pt-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 px-1">
                        <div className="flex items-center gap-2">
                            <ClipboardList className="w-5 h-5 text-slate-800" />
                            <h3 className="text-slate-800 font-bold">Reporte Consolidado de Deudas</h3>
                        </div>
                        <ExcelActions condominioName={adminPerfil.condominios?.nombre} />
                    </div>
                    {reporteData ? (
                        <ReporteCuentasPorCobrar data={reporteData} dataAnual={reporteAnualData} tasaBcv={tasaBcv} condominioName={adminPerfil.condominios?.nombre} />
                    ) : (
                        <div className="p-10 text-center bg-white rounded-3xl border border-slate-100 text-slate-400 text-sm">
                            Cargando reporte...
                        </div>
                    )}
                </div>
                {/* =================================== */}

                {/* === PANEL MOROSIDAD === */}
                {(() => {
                    const UMBRAL_MESES = 2
                    const morosos = (reporteData || []).filter((item: any) => item.mesesMora >= UMBRAL_MESES)
                        .map((item: any) => ({
                            id: item.id,
                            identificador: item.identificador,
                            propietario: item.propietario,
                            mesesMora: item.mesesMora,
                            saldoTotalUSD: item.saldoTotalUSD,
                            perfilId: item.perfilId
                        }))
                    return morosos.length > 0 ? (
                        <div className="pt-6">
                            <PanelMorosidad morosos={morosos} umbralMeses={UMBRAL_MESES} />
                        </div>
                    ) : null
                })()}
                {/* ================================ */}

                {/* === INYECCIÓN DE LA CARTA DE PARAMETROS (FASE 16) === */}
                <div className="pt-6">
                    <ParametrosFinancierosCard
                        // @ts-ignore
                        montoMensualInicial={adminPerfil.condominios?.monto_mensual_usd || 0}
                        // @ts-ignore
                        diaCobroInicial={adminPerfil.condominios?.dia_cobro || 1}
                    />
                </div>
                {/* ======================================================= */}


                <h3 className="text-slate-800 font-bold mt-8 mb-2 px-1">Acciones Rápidas</h3>

                <Link href="/dashboard/admin/emitir-cobro" className="flex items-center justify-between bg-white border border-slate-200 p-5 rounded-2xl shadow-sm hover:shadow-md transition-shadow group">
                    <div className="flex items-center gap-4">
                        <div className="bg-blue-50 text-blue-600 p-3 rounded-xl">
                            <Receipt className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="font-bold text-slate-800 text-lg">Emitir Cuota Masiva</p>
                            <p className="text-sm text-slate-500">Mensual o especial a todos los vecinos</p>
                        </div>
                    </div>
                    <div className="bg-slate-50 w-10 h-10 rounded-full flex items-center justify-center text-slate-400 group-hover:text-blue-600 group-hover:bg-blue-50 transition-colors">
                        <ArrowRight className="w-5 h-5" />
                    </div>
                </Link>

                <Link href="/dashboard/admin/finanzas/egresos" className="flex items-center justify-between bg-white border border-slate-200 p-5 rounded-2xl shadow-sm hover:shadow-md transition-shadow group">
                    <div className="flex items-center gap-4">
                        <div className="bg-red-50 text-red-600 p-3 rounded-xl">
                            <TrendingDown className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="font-bold text-slate-800 text-lg">Control de Egresos</p>
                            <p className="text-sm text-slate-500">Registro de facturas y gastos</p>
                        </div>
                    </div>
                    <div className="bg-slate-50 w-10 h-10 rounded-full flex items-center justify-center text-slate-400 group-hover:text-red-600 group-hover:bg-red-50 transition-colors">
                        <ArrowRight className="w-5 h-5" />
                    </div>
                </Link>

                <div className="md:col-span-2 pt-4">
                     <ImportadorExcelWidget />
                </div>

            </div>
        </div>
    )
}
