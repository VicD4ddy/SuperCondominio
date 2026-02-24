'use client'

import { useState } from 'react'
import { Plus, X, Building, Loader2 } from 'lucide-react'
import { crearInmuebleAction } from './actions'

export default function NuevoInmuebleForm() {
    const [isOpen, setIsOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setIsLoading(true)

        const formData = new FormData(e.currentTarget)
        const res = await crearInmuebleAction(formData)

        if (res.success) {
            setIsOpen(false)
            // La actualización se maneja con revalidatePath en el action
        } else {
            alert(res.error || 'Ocurrió un error al registrar el inmueble.')
        }
        setIsLoading(false)
    }

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="flex items-center gap-2 bg-white border-2 border-dashed border-slate-200 p-4 rounded-2xl w-full justify-center text-slate-500 hover:border-[#1e3a8a] hover:text-[#1e3a8a] hover:bg-blue-50/50 transition-all group"
            >
                <Plus className="w-5 h-5 group-hover:scale-110 transition-transform" />
                <span className="font-bold">Añadir Nuevo Inmueble (Casa / Apto)</span>
            </button>
        )
    }

    return (
        <div className="bg-white border-2 border-[#1e3a8a] p-6 rounded-2xl shadow-xl animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-2">
                    <div className="p-2 bg-blue-50 rounded-xl">
                        <Building className="w-5 h-5 text-[#1e3a8a]" />
                    </div>
                    <h2 className="text-xl font-bold text-slate-800">Registrar Inmueble</h2>
                </div>
                <button
                    onClick={() => setIsOpen(false)}
                    className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                >
                    <X className="w-5 h-5 text-slate-400" />
                </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest px-1">Identificador del Inmueble</label>
                    <div className="relative">
                        <Building className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                            required
                            name="identificador"
                            type="text"
                            placeholder="Ej: Casa D-22 o Apto 14-B"
                            className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all font-medium placeholder:text-slate-400"
                        />
                    </div>
                </div>

                <div className="flex gap-3 pt-2">
                    <button
                        type="button"
                        onClick={() => setIsOpen(false)}
                        className="flex-1 px-6 py-3.5 border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-all"
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="flex-[2] bg-[#1e3a8a] text-white px-6 py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-blue-900 transition-all shadow-lg shadow-blue-900/10 disabled:opacity-50"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Registrando...
                            </>
                        ) : (
                            <>
                                <Plus className="w-5 h-5" />
                                Crear Inmueble
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    )
}
