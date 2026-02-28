'use client'

import { useState } from 'react'
import { X, Building2, MapPin, Hash, Loader2, Save } from 'lucide-react'
import { updateCondo } from '../actions'

interface EditarCondoModalProps {
    isOpen: boolean
    onClose: () => void
    condo: {
        id: string
        nombre: string
        rif: string
        direccion?: string
    }
}

export default function EditarCondoModal({ isOpen, onClose, condo }: EditarCondoModalProps) {
    const [isPending, setIsPending] = useState(false)
    const [error, setError] = useState<string | null>(null)

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setError(null)
        setIsPending(true)

        const formData = new FormData(e.currentTarget)
        try {
            const res = await updateCondo(condo.id, formData)
            if (res?.error) {
                setError(res.error)
            } else {
                onClose()
            }
        } catch (err) {
            setError('Ocurrió un error inesperado.')
        } finally {
            setIsPending(false)
        }
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-300"
                onClick={() => !isPending && onClose()}
            />

            {/* Modal */}
            <div className="bg-slate-900 border border-slate-700/50 w-full max-w-md rounded-[40px] shadow-2xl relative z-10 overflow-hidden animate-in zoom-in-95 duration-200">
                <header className="p-8 pb-4 flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-black text-white uppercase tracking-tighter italic">Editar Condominio</h2>
                        <p className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.2em] mt-1">Actualizar Datos de Instancia</p>
                    </div>
                    <button
                        onClick={onClose}
                        disabled={isPending}
                        className="p-2 bg-slate-800 text-slate-400 rounded-xl hover:text-white transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </header>

                <form onSubmit={handleSubmit} className="p-8 pt-0 space-y-6">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Nombre Comercial</label>
                            <div className="relative">
                                <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                <input
                                    name="nombre"
                                    type="text"
                                    required
                                    defaultValue={condo.nombre}
                                    placeholder="Ej. Residencias El Sol"
                                    className="w-full bg-slate-800 border border-slate-700 rounded-2xl py-4 pl-12 pr-4 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">RIF / Identificación</label>
                            <div className="relative">
                                <Hash className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                <input
                                    name="rif"
                                    type="text"
                                    required
                                    defaultValue={condo.rif}
                                    placeholder="J-12345678-9"
                                    className="w-full bg-slate-800 border border-slate-700 rounded-2xl py-4 pl-12 pr-4 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Ubicación / Dirección</label>
                            <div className="relative">
                                <MapPin className="absolute left-4 top-4 w-4 h-4 text-slate-500" />
                                <textarea
                                    name="direccion"
                                    required
                                    defaultValue={condo.direccion}
                                    placeholder="Dirección exacta del edificio..."
                                    rows={3}
                                    className="w-full bg-slate-800 border border-slate-700 rounded-2xl py-4 pl-12 pr-4 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all resize-none"
                                />
                            </div>
                        </div>
                    </div>

                    {error && (
                        <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-bold rounded-2xl">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={isPending}
                        className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-black uppercase tracking-widest py-4 rounded-2xl transition-all shadow-lg shadow-blue-900/40 flex items-center justify-center gap-2"
                    >
                        {isPending ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Guardando Cambios...
                            </>
                        ) : (
                            <>
                                <Save className="w-5 h-5" />
                                Guardar Cambios
                            </>
                        )}
                    </button>
                </form>
            </div>
        </div>
    )
}
