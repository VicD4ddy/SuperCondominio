'use client'

import { useState } from 'react'
import { Trash2, UserMinus, Loader2, Sparkles } from 'lucide-react'
import { eliminarVecinoAction, desvincularInmuebleAction } from './actions'

interface Props {
    perfilId?: string;
    inmuebleId: string;
    tienePropietario: boolean;
}

export default function VecinoActions({ perfilId, inmuebleId, tienePropietario }: Props) {
    const [isLoading, setIsLoading] = useState(false)

    const handleEliminar = async () => {
        if (!perfilId) return
        if (!confirm('¿Estás seguro de eliminar este vecino? Esto borrará su perfil del sistema. Si solo quieres que el inmueble quede vacío, usa "Desvincular".')) return

        setIsLoading(true)
        const res = await eliminarVecinoAction(perfilId)
        if (!res.success) alert(res.error)
        setIsLoading(false)
    }

    const handleDesvincular = async () => {
        if (!confirm('¿Seguro que quieres desvincular al dueño de este inmueble? El dueño seguirá existiendo en el sistema pero este inmueble quedará vacío.')) return

        setIsLoading(true)
        const res = await desvincularInmuebleAction(inmuebleId)
        if (!res.success) alert(res.error)
        setIsLoading(false)
    }

    if (!tienePropietario) return (
        <div className="mt-3 flex items-center gap-2 text-[10px] font-bold text-blue-400 uppercase tracking-widest bg-blue-50/50 p-2 rounded-lg border border-blue-100/50">
            <Sparkles className="w-3 h-3" />
            Listo para asignar
        </div>
    )

    return (
        <div className="mt-4 flex items-center gap-2 border-t border-slate-100 pt-3">
            <button
                onClick={handleDesvincular}
                disabled={isLoading}
                title="Quitar dueño de este inmueble"
                className="flex-1 flex items-center justify-center gap-2 py-2 px-3 bg-slate-50 text-slate-500 hover:text-orange-600 hover:bg-orange-50 rounded-xl text-xs font-bold transition-all disabled:opacity-50 border border-slate-100"
            >
                {isLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <UserMinus className="w-3.5 h-3.5" />}
                Desvincular
            </button>
            <button
                onClick={handleEliminar}
                disabled={isLoading}
                title="Eliminar perfil por completo"
                className="p-2 bg-slate-50 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all disabled:opacity-50 border border-slate-100"
            >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            </button>
        </div>
    )
}
