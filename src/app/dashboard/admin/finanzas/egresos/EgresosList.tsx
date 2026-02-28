'use client'

import { useState } from 'react'
import { Trash2, AlertCircle, Loader2, Tag, Eye, Receipt } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { eliminarEgresoAction } from './actions'
import { toast } from 'sonner'

export default function EgresosList({ initialEgresos }: { initialEgresos: any[] }) {
    const [egresos, setEgresos] = useState(initialEgresos)
    const [isDeleting, setIsDeleting] = useState<string | null>(null)

    const handleEliminar = async (id: string) => {
        if (!confirm('¿Estás seguro de eliminar este gasto?')) return

        setIsDeleting(id)
        const res = await eliminarEgresoAction(id)

        if (res.success) {
            setEgresos(prev => prev.filter(e => e.id !== id))
            toast.success('Gasto eliminado correctamente')
        } else {
            toast.error(res.error)
        }
        setIsDeleting(null)
    }

    if (egresos.length === 0) {
        return (
            <div className="bg-white p-12 rounded-3xl border border-dashed border-slate-200 text-center flex flex-col items-center gap-4 animate-in fade-in zoom-in-95 duration-500">
                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-2">
                    <Receipt className="w-10 h-10 text-slate-200" />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-slate-800">No hay egresos registrados</h3>
                    <p className="text-slate-500 max-w-[240px] mx-auto text-sm">Comienza registrando los gastos del mes para mantener las cuentas claras.</p>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-3">
            {egresos.map((egreso) => (
                <div key={egreso.id} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between group">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-slate-50 text-slate-400 rounded-xl flex items-center justify-center border border-slate-100 group-hover:bg-[#1e3a8a]/10 group-hover:text-[#1e3a8a] transition-colors relative">
                            {egreso.foto_url ? (
                                <>
                                    <img src={egreso.foto_url} className="w-full h-full object-cover rounded-xl" />
                                    <div className="absolute inset-0 bg-black/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <Eye className="w-5 h-5 text-white" />
                                    </div>
                                    <button
                                        onClick={() => window.open(egreso.foto_url, '_blank')}
                                        className="absolute inset-0 z-10"
                                        title="Ver Recibo"
                                    />
                                </>
                            ) : (
                                <Tag className="w-6 h-6" />
                            )}
                        </div>
                        <div>
                            <h4 className="font-bold text-slate-800 flex items-center gap-2">
                                {egreso.descripcion}
                                {egreso.foto_url && <Receipt className="w-3 h-3 text-blue-500" />}
                            </h4>
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
                        <div className="flex items-center gap-1">
                            {egreso.foto_url && (
                                <button
                                    onClick={() => window.open(egreso.foto_url, '_blank')}
                                    className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                    title="Ver Comprobante"
                                >
                                    <Eye className="w-5 h-5" />
                                </button>
                            )}
                            <button
                                onClick={() => handleEliminar(egreso.id)}
                                disabled={isDeleting === egreso.id}
                                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                title="Eliminar"
                            >
                                {isDeleting === egreso.id ? <Loader2 className="w-5 h-5 animate-spin" /> : <Trash2 className="w-5 h-5" />}
                            </button>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    )
}
