'use client'

import { ExternalLink, Loader2 } from 'lucide-react'
import { impersonateCondo } from '../actions'
import { useState } from 'react'

export default function GestionarButton({ condoId }: { condoId: string }) {
    const [isPending, setIsPending] = useState(false)

    const handleGestionar = async () => {
        try {
            setIsPending(true)
            await impersonateCondo(condoId)
        } catch (error) {
            console.error('Error al intentar gestionar:', error)
            alert('No se pudo iniciar la gestión del condominio.')
        } finally {
            setIsPending(false)
        }
    }

    return (
        <button
            onClick={handleGestionar}
            disabled={isPending}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-5 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
            {isPending ? (
                <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Iniciando...
                </>
            ) : (
                <>
                    Gestionar
                    <ExternalLink className="w-4 h-4" />
                </>
            )}
        </button>
    )
}
