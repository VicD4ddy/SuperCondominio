import { TrendingDown, Calendar, Tag } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

export default function GastosTransparenciaWidget({ egresos }: { egresos: any[] }) {
    if (!egresos || egresos.length === 0) {
        return (
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <h3 className="text-slate-800 font-bold mb-3">Transparencia: Gastos</h3>
                <p className="text-sm text-slate-500 italic">No hay gastos reportados este mes.</p>
            </div>
        )
    }

    return (
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-slate-800 font-bold">Transparencia: Gastos</h3>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Últimos Movimientos</span>
            </div>

            <div className="space-y-4">
                {egresos.slice(0, 3).map((egreso) => (
                    <div key={egreso.id} className="flex items-start gap-3 pb-3 border-b border-slate-50 last:border-0 last:pb-0">
                        <div className="w-8 h-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center shrink-0">
                            <TrendingDown className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-slate-800 truncate">{egreso.descripcion}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-[9px] font-bold text-slate-400 uppercase">{egreso.categoria}</span>
                                <span className="text-slate-200">•</span>
                                <span className="text-[10px] text-slate-500">
                                    {format(new Date(egreso.fecha_gasto), "dd MMM", { locale: es })}
                                </span>
                            </div>
                        </div>
                        <p className="text-sm font-bold text-red-600">-${Number(egreso.monto_usd).toFixed(0)}</p>
                    </div>
                ))}
            </div>

            {egresos.length > 3 && (
                <p className="text-center text-[10px] text-slate-400 font-medium mt-4">
                    + {egresos.length - 3} gastos adicionales registrados
                </p>
            )}
        </div>
    )
}
