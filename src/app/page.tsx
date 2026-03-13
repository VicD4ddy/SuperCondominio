'use client'

import { useState } from 'react'
import { validarCedula } from '@/app/auth/actions'
import { useFormStatus } from 'react-dom'
import { Search, Building2, UserCircle2 } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

function SubmitButton() {
    const { pending } = useFormStatus()

    return (
        <button
            type="submit"
            disabled={pending}
            className="w-full bg-[#1e3a8a] text-white font-bold py-3.5 px-4 rounded-xl hover:bg-blue-900 focus:outline-none focus:ring-4 focus:ring-blue-100 disabled:opacity-50 transition-all shadow-lg shadow-blue-900/10 flex items-center justify-center gap-2"
        >
            {pending ? (
                <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Buscando...</span>
                </>
            ) : (
                <>
                    <Search className="w-5 h-5" />
                    <span>Ingresar al Condominio</span>
                </>
            )}
        </button>
    )
}

export default function ResidentLogin() {
    async function handleSubmit(formData: FormData) {
        const result = await validarCedula(formData)
        if (result?.error) {
            toast.error(result.error)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
            <div className="max-w-md w-full p-8 bg-white rounded-[2rem] shadow-xl border border-slate-100 relative overflow-hidden">
                {/* Decoración superior */}
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-600 to-[#1e3a8a]" />

                <div className="text-center mb-10 mt-2">
                    <div className="w-20 h-20 bg-blue-50/80 rounded-3xl flex items-center justify-center mx-auto mb-5 text-[#1e3a8a] border border-blue-100/50 shadow-sm">
                        <Building2 className="w-10 h-10" />
                    </div>
                    <h1 className="text-3xl font-black text-[#1e3a8a] tracking-tight">SuperCondominio</h1>
                    <p className="text-slate-500 mt-2 text-sm font-medium">Buscador de Propietarios Residentes</p>
                </div>

                <form action={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <label htmlFor="numero" className="text-xs font-bold text-slate-500 uppercase tracking-widest px-1 flex items-center gap-2">
                            <UserCircle2 className="w-4 h-4" /> Número de Cédula
                        </label>
                        <div className="flex gap-2 relative group">
                            <select
                                name="prefijo"
                                className="w-1/4 min-w-[5rem] px-3 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#1e3a8a] focus:bg-white outline-none transition-all text-slate-900 font-bold appearance-none cursor-pointer"
                            >
                                <option value="V">V-</option>
                                <option value="E">E-</option>
                                <option value="J">J-</option>
                                <option value="G">G-</option>
                            </select>
                            <input
                                id="numero"
                                name="numero"
                                type="text"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                required
                                className="w-3/4 px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#1e3a8a] focus:bg-white outline-none transition-all text-slate-900 font-bold placeholder:text-slate-400 placeholder:font-medium text-lg tracking-wide"
                                placeholder="Ej. 12345678"
                            />
                        </div>
                    </div>

                    <SubmitButton />
                </form>

                <div className="mt-8 pt-6 border-t border-slate-100 text-center">
                    <p className="text-xs text-slate-400 font-medium">
                        Tu información está protegida. Solo residentes registrados por la administración pueden acceder al portal.
                    </p>
                </div>
            </div>

            {/* Enlace Oculto de Administradores */}
            <div className="absolute bottom-6 w-full text-center opacity-30 hover:opacity-100 transition-opacity">
                <Link href="/admin" className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-4 py-2 hover:bg-black/5 rounded-full transition-colors">
                    Acceso Administrativo
                </Link>
            </div>
        </div>
    )
}
