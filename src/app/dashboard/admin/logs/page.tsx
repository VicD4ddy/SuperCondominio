'use client'

import React, { useState } from 'react'
import { createClient } from '@/utils/supabase/client' // Switch to client for tab reactivity
import { History, Info, User, FileSpreadsheet, Activity } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import LibroMayorWeb from './LibroMayorWeb'
import ImportadorExcelWidget from '../finanzas/ImportadorExcelWidget'

export default function AdminLogsPage() {
    const [activeTab, setActiveTab] = useState<'bitacora' | 'ledger'>('ledger')
    const [logs, setLogs] = useState<any[]>([])
    const [loadingLogs, setLoadingLogs] = useState(true)
    const [error, setError] = useState<string | null>(null)

    // Move fetching to useEffect to support client-side tabs
    React.useEffect(() => {
        const fetchData = async () => {
            try {
                const supabase = createClient()
                
                // 1. Obtener Historial (Pagos Verificados/Rechazados)
                const { data: pagos } = await supabase
                    .from('pagos_reportados')
                    .select(`
                        id,
                        monto_bs,
                        monto_equivalente_usd,
                        estado,
                        referencia,
                        updated_at,
                        perfil:perfil_id (
                            nombres, 
                            apellidos,
                            inmuebles (identificador)
                        )
                    `)
                    .in('estado', ['verificado', 'rechazado'])
                    .order('updated_at', { ascending: false })
                    .limit(100)

                // 2. Obtener Bitácora
                const { data: logsData, error: errLogs } = await supabase
                    .from('logs_sistema')
                    .select('*, perfiles!inner(nombres, apellidos)')
                    .order('created_at', { ascending: false })
                    .limit(100)

                if (errLogs) throw errLogs

                // Mapear pagos al formato de bitácora
                const pagosMapped = (pagos || []).map(pago => {
                    const esVerificado = pago.estado === 'verificado'
                    const perfilObj: any = Array.isArray(pago.perfil) ? pago.perfil[0] : pago.perfil
                    const inmueblesArr = perfilObj?.inmuebles || []
                    const inmuebleMuestra = Array.isArray(inmueblesArr) && inmueblesArr.length > 0
                        ? inmueblesArr[0].identificador
                        : 'No vinculado'

                    return {
                        id: pago.id,
                        evento: esVerificado ? 'Pago Verificado' : 'Pago Anulado',
                        detalles: `Cobro reportado procesado por ${pago.monto_bs} Bs. (Ref: ${pago.referencia || 'N/A'}) - Inmueble: ${inmuebleMuestra}.`,
                        created_at: pago.updated_at,
                        perfil: perfilObj
                    }
                })

                const sistemLogsMapped = (logsData || []).map(log => ({
                    id: log.id,
                    evento: log.evento,
                    detalles: typeof log.detalles === 'string' ? log.detalles : JSON.stringify(log.detalles),
                    created_at: log.created_at,
                    perfil: log.perfiles
                }))

                const combined = [...pagosMapped, ...sistemLogsMapped].sort((a, b) =>
                    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                )
                
                setLogs(combined)
            } catch (err: any) {
                setError(err.message)
            } finally {
                setLoadingLogs(false)
            }
        }

        fetchData()
    }, [])

    return (
        <div className="p-6 md:p-10 space-y-8 pb-24 md:pb-10 bg-slate-50 min-h-screen">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-[#1e3a8a]/10 text-[#1e3a8a] rounded-xl flex items-center justify-center shadow-inner">
                            <History className="w-6 h-6" />
                        </div>
                        <h1 className="text-3xl font-black tracking-tighter text-slate-800 uppercase italic">Historial y Gestión</h1>
                    </div>
                    <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] pl-1">
                        Auditoría de movimientos y Libro Mayor del Condominio
                    </p>
                </div>

                {/* Switcher de Pestañas */}
                <div className="flex bg-slate-200/60 p-1 rounded-2xl w-fit border border-slate-200/50">
                    <button 
                        onClick={() => setActiveTab('ledger')}
                        className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === 'ledger' ? 'bg-white text-[#1e3a8a] shadow-md border border-slate-100' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        <FileSpreadsheet className="w-4 h-4" />
                        Gestión Mensual
                    </button>
                    <button 
                        onClick={() => setActiveTab('bitacora')}
                        className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === 'bitacora' ? 'bg-white text-[#1e3a8a] shadow-md border border-slate-100' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        <Activity className="w-4 h-4" />
                        Bitácora
                    </button>
                </div>
            </header>

            {activeTab === 'ledger' ? (
                <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <LibroMayorWeb />
                    
                    <div className="max-w-4xl mx-auto">
                        <ImportadorExcelWidget />
                    </div>
                </div>
            ) : (
                <div className="bg-white rounded-[32px] border border-slate-200 overflow-hidden shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-100 bg-slate-50/50">
                                    <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Evento</th>
                                    <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Detalles</th>
                                    <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Usuario</th>
                                    <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Fecha</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {logs && logs.length > 0 ? (
                                    logs.map((log) => (
                                        <tr key={log.id} className="hover:bg-slate-50 transition-colors group">
                                            <td className="p-5 align-top">
                                                <div className="flex items-start gap-3 mt-1">
                                                    <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${log.evento.includes('Elimin') || log.evento.includes('Error') ? 'bg-red-500' :
                                                        log.evento.includes('Pag') ? 'bg-emerald-500' : 'bg-blue-500'
                                                        }`} />
                                                    <span className="font-bold text-slate-700 text-sm">{log.evento}</span>
                                                </div>
                                            </td>
                                            <td className="p-5 align-top">
                                                <p className="text-slate-500 text-xs leading-relaxed max-w-sm lg:max-w-md">
                                                    {log.detalles}
                                                </p>
                                            </td>
                                            <td className="p-5 text-center align-top">
                                                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-full">
                                                    <User className="w-3.5 h-3.5 text-slate-400" />
                                                    <span className="text-[10px] font-bold text-slate-600 uppercase tracking-tight">
                                                        {log.perfil ? `${log.perfil.nombres} ${log.perfil.apellidos}` : 'Sistema / Admin'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="p-5 text-right align-top">
                                                <div className="flex flex-col items-end">
                                                    <span className="text-slate-700 font-bold text-xs">
                                                        {format(new Date(log.created_at), "dd 'de' MMMM", { locale: es })}
                                                    </span>
                                                    <span className="text-slate-400 text-[10px] font-black uppercase tracking-tighter mt-0.5">
                                                        {format(new Date(log.created_at), "HH:mm 'hrs'")}
                                                    </span>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={4} className="p-20 text-center">
                                            <div className="flex flex-col items-center text-slate-400">
                                                <Info className="w-12 h-12 mb-4 opacity-20" />
                                                <p className="text-xs font-black uppercase tracking-widest text-slate-400">No hay movimientos recientes</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {error && (
                <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3">
                    <div className="w-8 h-8 bg-red-100 text-red-600 rounded-lg flex items-center justify-center flex-shrink-0">
                        <History className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="text-red-800 font-bold text-sm leading-tight">Error de consulta</p>
                        <p className="text-red-600/80 text-[10px] font-bold uppercase tracking-widest mt-0.5">
                            {error}
                        </p>
                    </div>
                </div>
            )}
        </div>
    )
}
