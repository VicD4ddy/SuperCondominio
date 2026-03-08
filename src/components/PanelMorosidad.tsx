'use client'

import { useState } from 'react'
import { AlertTriangle, MessageCircle, Bell, CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react'
import { enviarRecordatoriosMorososAction } from '@/app/dashboard/admin/finanzas/actions'

interface MorosoItem {
    id: string             // inmueble id
    identificador: string
    propietario: string
    telefono?: string
    mesesMora: number
    saldoTotalUSD: number
    perfilId?: string      // needed for push notifications
}

interface Props {
    morosos: MorosoItem[]
    umbralMeses: number
}

export default function PanelMorosidad({ morosos, umbralMeses }: Props) {
    const [sending, setSending] = useState(false)
    const [sent, setSent] = useState(false)
    const [expanded, setExpanded] = useState(true)

    if (morosos.length === 0) return null

    async function handleNotificarTodos() {
        const perfilIds = morosos.map(m => m.perfilId).filter(Boolean) as string[]
        if (perfilIds.length === 0) return
        setSending(true)
        const res = await enviarRecordatoriosMorososAction(perfilIds)
        setSending(false)
        if (res?.success) setSent(true)
        setTimeout(() => setSent(false), 4000)
    }

    function buildWhatsAppUrl(item: MorosoItem) {
        const msg = encodeURIComponent(
            `Hola ${item.propietario}, le recordamos que el Estado de Cuenta del inmueble ${item.identificador} presenta un saldo pendiente de $${item.saldoTotalUSD.toFixed(2)} USD correspondiente a ${item.mesesMora} ${item.mesesMora === 1 ? 'mes' : 'meses'} de cuota. Por favor, regularice su situación a la brevedad. Gracias.\n\n— Administración Condominio`
        )
        if (item.telefono) return `https://wa.me/${item.telefono.replace(/\D/g, '')}?text=${msg}`
        return `https://wa.me/?text=${msg}`
    }

    return (
        <div className="bg-white rounded-3xl border border-red-100 shadow-sm overflow-hidden">
            {/* Header */}
            <div
                className="flex items-center justify-between p-5 cursor-pointer select-none bg-red-50/50 border-b border-red-100"
                onClick={() => setExpanded(e => !e)}
            >
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-red-100 text-red-600 rounded-xl flex items-center justify-center">
                        <AlertTriangle className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="font-bold text-red-800 text-sm">Panel de Morosidad</h3>
                        <p className="text-[10px] font-bold text-red-500 uppercase tracking-widest">
                            {morosos.length} inmueble{morosos.length !== 1 ? 's' : ''} con +{umbralMeses} {umbralMeses === 1 ? 'mes' : 'meses'} de mora
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={(e) => { e.stopPropagation(); handleNotificarTodos() }}
                        disabled={sending || sent}
                        className="flex items-center gap-1.5 bg-[#1e3a8a] text-white text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-blue-900 transition-colors disabled:opacity-50"
                    >
                        {sent
                            ? <><CheckCircle2 className="w-3.5 h-3.5" /> Enviadas</>
                            : sending
                                ? <><Bell className="w-3.5 h-3.5 animate-pulse" /> Enviando...</>
                                : <><Bell className="w-3.5 h-3.5" /> Notificar a Todos</>
                        }
                    </button>
                    {expanded ? <ChevronUp className="w-4 h-4 text-red-400" /> : <ChevronDown className="w-4 h-4 text-red-400" />}
                </div>
            </div>

            {/* Table */}
            {expanded && (
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-slate-100 bg-slate-50/50">
                                <th className="px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Inmueble</th>
                                <th className="px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Meses Mora</th>
                                <th className="px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Deuda Total</th>
                                <th className="px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Acción</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {morosos.map((item) => (
                                <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-5 py-3">
                                        <p className="font-bold text-slate-800 text-sm">{item.identificador}</p>
                                        <p className="text-[10px] text-slate-400 font-medium">{item.propietario}</p>
                                    </td>
                                    <td className="px-5 py-3 text-center">
                                        <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-xs font-black ${item.mesesMora >= 3 ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                                            {item.mesesMora}
                                        </span>
                                    </td>
                                    <td className="px-5 py-3 text-right">
                                        <span className="font-black text-red-600 font-mono">${item.saldoTotalUSD.toFixed(2)}</span>
                                    </td>
                                    <td className="px-5 py-3 text-center">
                                        <a
                                            href={buildWhatsAppUrl(item)}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-700 hover:bg-emerald-200 text-[10px] font-bold px-2.5 py-1.5 rounded-lg transition-colors"
                                        >
                                            <MessageCircle className="w-3 h-3" />
                                            WhatsApp
                                        </a>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    )
}
