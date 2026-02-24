'use client'

import { useState } from 'react'
import { Plus, X, Loader2, User, CreditCard, Phone, Building } from 'lucide-react'
import { crearVecinoAction } from './actions'

export default function NuevoVecinoForm({ inmueblesDisponibles }: { inmueblesDisponibles: any[] }) {
    const [isOpen, setIsOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setIsLoading(true)

        const formData = new FormData(e.currentTarget)
        const res = await crearVecinoAction(formData)

        if (res.success) {
            setIsOpen(false)
            // La actualización se maneja por revalidatePath en el action
        } else {
            alert(res.error)
        }
        setIsLoading(false)
    }

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="w-full sm:w-auto px-6 py-3 bg-[#1e3a8a] text-white rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg hover:bg-blue-900 transition-all active:scale-[0.98]"
            >
                <Plus className="w-5 h-5" />
                Registrar Nuevo Vecino
            </button>
        )
    }

    return (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xl relative animate-in fade-in slide-in-from-bottom-4 duration-300 mb-8">
            <button
                onClick={() => setIsOpen(false)}
                className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-all"
            >
                <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                <User className="w-6 h-6 text-[#1e3a8a]" /> Alta de Propietario
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest px-1">Nombres</label>
                        <div className="relative">
                            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                            <input
                                type="text"
                                name="nombres"
                                required
                                placeholder="Ej: Juan"
                                className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all font-medium"
                            />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest px-1">Apellidos</label>
                        <div className="relative">
                            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                            <input
                                type="text"
                                name="apellidos"
                                required
                                placeholder="Ej: Pérez"
                                className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all font-medium"
                            />
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest px-1">Número de Cédula</label>
                        <div className="relative">
                            <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                            <input
                                type="text"
                                name="cedula"
                                required
                                placeholder="Ej: V-12345678"
                                className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all font-medium"
                            />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest px-1">Teléfono (Opcional)</label>
                        <div className="relative">
                            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                            <input
                                type="text"
                                name="telefono"
                                placeholder="Ej: 04121234567"
                                className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all font-medium"
                            />
                        </div>
                    </div>
                </div>

                <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest px-1">Asignar a Inmueble (Opcional)</label>
                    <div className="relative">
                        <Building className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <select
                            name="inmueble_id"
                            className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all font-medium appearance-none"
                        >
                            <option value="">Dejar sin asignar por ahora</option>
                            {inmueblesDisponibles.map(inm => (
                                <option key={inm.id} value={inm.id}>
                                    {inm.identificador}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="pt-4 flex flex-col sm:flex-row gap-3">
                    <button
                        type="button"
                        onClick={() => setIsOpen(false)}
                        className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-200 transition-all"
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="flex-[2] py-4 bg-[#1e3a8a] text-white rounded-2xl font-bold shadow-lg hover:bg-blue-900 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Plus className="w-5 h-5" /> Crear y Vincular Vecino</>}
                    </button>
                </div>
            </form>
        </div>
    )
}
