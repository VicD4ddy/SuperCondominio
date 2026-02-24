'use client'

import { useState } from 'react'
import { Edit2, Check, X, Loader2 } from 'lucide-react'
import { actualizarInmuebleAction } from './actions'

interface Props {
    inmuebleId: string;
    identificadorInicial: string;
}

export default function InmuebleEditableInfo({ inmuebleId, identificadorInicial }: Props) {
    const [isEditing, setIsEditing] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [identificador, setIdentificador] = useState(identificadorInicial)

    const handleSave = async () => {
        setIsLoading(true)
        const res = await actualizarInmuebleAction(inmuebleId, {
            identificador
        })

        if (res.success) {
            setIsEditing(false)
        } else {
            alert(res.error)
            setIdentificador(identificadorInicial)
        }
        setIsLoading(false)
    }

    const handleCancel = () => {
        setIdentificador(identificadorInicial)
        setIsEditing(false)
    }

    if (isEditing) {
        return (
            <div className="flex flex-col gap-2 bg-blue-50/50 p-2 rounded-xl border border-blue-100 animate-in fade-in zoom-in-95 duration-200">
                <div className="flex items-center gap-2">
                    <input
                        type="text"
                        value={identificador}
                        onChange={(e) => setIdentificador(e.target.value)}
                        className="w-full px-2 py-1 text-sm font-bold text-slate-800 bg-white border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Identificador"
                        autoFocus
                    />
                </div>
                <div className="flex items-center justify-end gap-1">
                    <button
                        onClick={handleCancel}
                        disabled={isLoading}
                        className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-white rounded-lg transition-all"
                    >
                        <X className="w-4 h-4" />
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={isLoading}
                        className="p-1.5 bg-[#1e3a8a] text-white hover:bg-blue-900 rounded-lg transition-all shadow-sm"
                    >
                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="flex justify-between items-center mb-3 group/title">
            <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-50 rounded-lg">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#1e3a8a]"><path d="M6 22V4c0-.5.2-1 .6-1.4C7 2.2 7.5 2 8 2h8c.5 0 1 .2 1.4.6.4.4.6.9.6 1.4v18L12 18l-6 4Z" /></svg>
                </div>
                <h3 className="font-bold text-slate-800 text-lg">{identificador}</h3>
                <button
                    onClick={() => setIsEditing(true)}
                    className="p-1 text-slate-300 hover:text-blue-600 hover:bg-blue-50 rounded-md opacity-0 group-hover/title:opacity-100 transition-all"
                    title="Editar nombre del inmueble"
                >
                    <Edit2 className="w-3.5 h-3.5" />
                </button>
            </div>
        </div>
    )
}
