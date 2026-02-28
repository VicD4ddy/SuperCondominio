'use client'

import { useState } from 'react'
import { X, Check } from 'lucide-react'
import { rechazarPagoAction } from './actions'
import { toast } from 'sonner'

interface RejectionFormProps {
    pagoId: string;
}

export default function RejectionForm({ pagoId }: RejectionFormProps) {
    const [isPrompting, setIsPrompting] = useState(false)
    const [reason, setReason] = useState('')
    const [isLoading, setIsLoading] = useState(false)

    const handleReject = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!reason.trim()) return

        setIsLoading(true)
        try {
            const res = await rechazarPagoAction(pagoId, reason)
            if (!res.success) {
                toast.error(res.error)
            } else {
                toast.success('Pago rechazado correctamente')
            }
        } catch (err) {
            toast.error('Ocurrió un error inesperado')
            console.error(err)
        } finally {
            setIsLoading(false)
            setIsPrompting(false)
        }
    }

    if (!isPrompting) {
        return (
            <button
                onClick={() => setIsPrompting(true)}
                className="w-full flex items-center justify-center gap-2 bg-slate-50 border border-slate-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200 text-slate-500 rounded-xl py-2.5 font-semibold text-sm transition-all focus:outline-none focus:ring-4 focus:ring-red-100"
            >
                <X className="w-4 h-4" /> Rechazar
            </button>
        )
    }

    return (
        <form onSubmit={handleReject} className="flex flex-col gap-2 w-full animate-in fade-in slide-in-from-top-2 duration-200">
            <input
                autoFocus
                type="text"
                placeholder="Motivo del rechazo..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                required
                className="w-full px-3 py-2 text-sm border border-red-200 rounded-lg focus:ring-2 focus:ring-red-500 outline-none bg-red-50/30"
            />
            <div className="flex gap-2">
                <button
                    type="button"
                    onClick={() => setIsPrompting(false)}
                    className="flex-1 py-1.5 text-xs font-bold text-slate-500 bg-slate-100 rounded-lg hover:bg-slate-200 transition-all"
                >
                    Cancelar
                </button>
                <button
                    type="submit"
                    disabled={isLoading || !reason.trim()}
                    className="flex-1 py-1.5 text-xs font-bold text-white bg-red-600 rounded-lg hover:bg-red-700 transition-all disabled:opacity-50"
                >
                    {isLoading ? '...' : 'Confirmar'}
                </button>
            </div>
        </form>
    )
}
