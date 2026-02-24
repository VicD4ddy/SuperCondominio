'use client'

import { useState } from 'react'
import { Trash2, AlertCircle, Loader2, Tag } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { eliminarEgresoAction } from './actions'

export default function EgresosList({ initialEgresos }: { initialEgresos: any[] }) {
    const [egresos, setEgresos] = useState(initialEgresos)
    const [isDeleting, setIsDeleting] = useState<string | null>(null)

    const handleEliminar = async (id: string) => {
        if (!confirm('¿Estás seguro de eliminar este gasto?')) return

        setIsDeleting(id)
        const res = await eliminarEgresoAction(id)

        if (res.success) {
            setEgresos(prev => prev.filter(e => e.id !== id))
        } else {
            alert(res.error)
        }
        setIsDeleting(null)
    }

    if (egresos.length === 0) {
        return (
            <div className="bg-white p-10 rounded-2xl border border-dashed border-slate-300 text-center">
                <AlertCircle className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500 font-medium">No hay gastos registrados este mes.</p>
            </div>
        )
    }

    return (
        <div className="space-y-3">
            {egresos.map((egreso) => (
                <div key={egreso.id} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between group">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-slate-50 text-slate-400 rounded-xl flex items-center justify-center border border-slate-100 group-hover:bg-red-50 group-hover:text-red-600 transition-colors">
                            <Tag className="w-6 h-6" />
                        </div>
                        <div>
                            <h4 className="font-bold text-slate-800">{egreso.descripcion}</h4>
                            <div className="flex items-center gap-2 text-xs text-slate-500">
                                <span className="bg-slate-100 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider text-[9px]">
                                    {egreso.categoria}
                                </span>
                                <span>•</span>
                                <span>{format(new Date(egreso.fecha_gasto), "dd MMM yyyy", { locale: es })}</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <p className="font-bold text-lg text-red-600">-${Number(egreso.monto_usd).toFixed(2)}</p>
                        <button
                            onClick={() => handleEliminar(egreso.id)}
                            disabled={isDeleting === egreso.id}
                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                        >
                            {isDeleting === egreso.id ? <Loader2 className="w-5 h-5 animate-spin" /> : <Trash2 className="w-5 h-5" />}
                        </button>
                    </div>
                </div>
            ))}
        </div>
    )
}
