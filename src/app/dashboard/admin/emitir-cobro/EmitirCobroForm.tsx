'use client'

import { useState } from 'react'
import { Send, CalendarDays, DollarSign, Calendar, AlertCircle, Zap, Pencil } from 'lucide-react'
import { emitirCobroMasivoAction } from './actions'
import { useFormStatus } from 'react-dom'

function SubmitButton({ tipo }: { tipo: 'mensual' | 'especial' }) {
    const { pending } = useFormStatus()
    return (
        <button
            type="submit"
            disabled={pending}
            className="w-full mt-6 flex items-center justify-center gap-2 bg-[#1e3a8a] text-white py-4 rounded-xl font-bold shadow-md hover:bg-blue-900 transition-colors disabled:opacity-50"
        >
            <Send className="w-5 h-5" />
            {pending
                ? 'Procesando...'
                : tipo === 'mensual'
                    ? 'Emitir Cuota Mensual a Todos'
                    : 'Emitir Cuota Especial Masiva'}
        </button>
    )
}

interface Props {
    cuotaMensualUsd: number
    mesActual: string
}

export default function EmitirCobroForm({ cuotaMensualUsd, mesActual }: Props) {
    const [tipo, setTipo] = useState<'mensual' | 'especial'>('mensual')
    const [error, setError] = useState<string | null>(null)

    const today = new Date().toISOString().split('T')[0]
    const nextMonth = new Date()
    nextMonth.setDate(nextMonth.getDate() + 30)
    const nextMonthStr = nextMonth.toISOString().split('T')[0]

    async function handleSubmit(formData: FormData) {
        setError(null)
        const emision = new Date(formData.get('fecha_emision') as string)
        const vencimiento = new Date(formData.get('fecha_vencimiento') as string)
        if (vencimiento < emision) {
            setError('La fecha de vencimiento no puede ser anterior a la de emisión.')
            return
        }
        const res = await emitirCobroMasivoAction(formData)
        if (res?.error) {
            setError(res.error)
        }
    }

    return (
        <>
            {/* Info card */}
            <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm mb-6 text-center">
                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-3">
                    <DollarSign className="w-6 h-6" />
                </div>
                <h2 className="text-xl font-bold text-slate-800">Emisión de Cuota Masiva</h2>
                <p className="text-sm text-slate-500 mt-2 leading-relaxed">
                    Genera cobros simultáneos para todos los inmuebles del condominio de una sola vez.
                </p>
            </div>

            <form action={handleSubmit} className="space-y-4">
                {/* Selector de tipo */}
                <div className="flex gap-2 bg-slate-100 p-1 rounded-xl">
                    <button
                        type="button"
                        onClick={() => setTipo('mensual')}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-sm font-bold transition-all ${tipo === 'mensual' ? 'bg-white text-[#1e3a8a] shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        <Zap className="w-4 h-4" />
                        Cuota Mensual
                    </button>
                    <button
                        type="button"
                        onClick={() => setTipo('especial')}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-sm font-bold transition-all ${tipo === 'especial' ? 'bg-white text-[#1e3a8a] shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        <Pencil className="w-4 h-4" />
                        Cuota Especial
                    </button>
                </div>

                {tipo === 'mensual' ? (
                    <div className="bg-gradient-to-br from-[#1e3a8a]/5 to-blue-50 rounded-2xl p-5 border border-blue-100 space-y-3">
                        <div className="flex items-center justify-between">
                            <p className="text-[10px] font-bold text-blue-600 tracking-widest uppercase">Cuota Configurada</p>
                            {cuotaMensualUsd > 0
                                ? <p className="text-2xl font-black text-[#1e3a8a]">${cuotaMensualUsd.toFixed(2)}</p>
                                : <p className="text-sm font-bold text-amber-600">No configurada — ve a Ajustes</p>
                            }
                        </div>
                        <div className="flex items-center justify-between">
                            <p className="text-[10px] font-bold text-slate-500 tracking-widest uppercase">Período</p>
                            <p className="text-sm font-bold text-slate-700 capitalize">{mesActual}</p>
                        </div>
                        <p className="text-xs text-slate-400 mt-2">
                            Se emitirá esta cuota a <strong>todos los inmuebles</strong> del condominio automáticamente.
                        </p>
                        <input type="hidden" name="mes" value={mesActual} />
                        <input type="hidden" name="monto_total_usd" value={cuotaMensualUsd} />
                    </div>
                ) : (
                    <>
                        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm relative focus-within:ring-2 focus-within:ring-[#1e3a8a]/20 focus-within:border-[#1e3a8a] transition-all">
                            <label className="text-[10px] font-bold text-slate-400 tracking-widest uppercase block mb-1">TÍTULO DE LA CUOTA</label>
                            <div className="flex items-center gap-3">
                                <CalendarDays className="w-5 h-5 text-slate-400" />
                                <input
                                    type="text"
                                    name="mes"
                                    required
                                    className="w-full text-lg font-semibold text-slate-800 bg-transparent outline-none placeholder:font-normal placeholder:text-slate-300"
                                    placeholder="Ej: Mantenimiento Bomba Marzo"
                                />
                            </div>
                        </div>

                        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm relative focus-within:ring-2 focus-within:ring-[#1e3a8a]/20 focus-within:border-[#1e3a8a] transition-all">
                            <label className="text-[10px] font-bold text-slate-400 tracking-widest uppercase block mb-1">CUOTA A COBRAR POR INMUEBLE (USD)</label>
                            <div className="flex items-center gap-3">
                                <span className="text-xl font-bold text-slate-300">$</span>
                                <input
                                    type="number"
                                    name="monto_total_usd"
                                    step="0.01"
                                    min="1"
                                    required
                                    className="w-full text-2xl font-bold text-[#1e3a8a] bg-transparent outline-none placeholder:text-slate-200"
                                    placeholder="0.00"
                                />
                            </div>
                        </div>
                    </>
                )}

                {/* Fechas */}
                <div className="flex gap-4">
                    <div className="flex-1 bg-white p-4 rounded-xl border border-slate-200 shadow-sm focus-within:ring-2 focus-within:ring-[#1e3a8a]/20 focus-within:border-[#1e3a8a] transition-all">
                        <label className="text-[10px] font-bold text-slate-400 tracking-widest uppercase block mb-1">FECHA EMISIÓN</label>
                        <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-slate-400" />
                            <input
                                type="date"
                                name="fecha_emision"
                                required
                                defaultValue={today}
                                className="w-full text-sm font-medium text-slate-700 bg-transparent outline-none"
                            />
                        </div>
                    </div>
                    <div className="flex-1 bg-white p-4 rounded-xl border border-slate-200 shadow-sm focus-within:ring-2 focus-within:ring-[#1e3a8a]/20 focus-within:border-[#1e3a8a] transition-all">
                        <label className="text-[10px] font-bold text-slate-400 tracking-widest uppercase block mb-1">VENCIMIENTO</label>
                        <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-slate-400" />
                            <input
                                type="date"
                                name="fecha_vencimiento"
                                required
                                defaultValue={nextMonthStr}
                                className="w-full text-sm font-medium text-slate-700 bg-transparent outline-none"
                            />
                        </div>
                    </div>
                </div>

                {error && (
                    <div className="flex items-start gap-2 bg-red-50 text-red-600 p-4 rounded-xl border border-red-100 mt-4 text-sm font-medium animate-in slide-in-from-top-2">
                        <AlertCircle className="w-5 h-5 shrink-0" />
                        <p>{error}</p>
                    </div>
                )}

                <SubmitButton tipo={tipo} />
            </form>
        </>
    )
}
