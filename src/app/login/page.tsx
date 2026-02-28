'use client'

import { useState } from 'react'
import { login } from './actions'
import { useFormStatus } from 'react-dom'
import { Eye, EyeOff, Lock, Mail } from 'lucide-react'

function SubmitButton() {
    const { pending } = useFormStatus()

    return (
        <button
            type="submit"
            disabled={pending}
            className="w-full bg-[#1e3a8a] text-white font-bold py-3 px-4 rounded-xl hover:bg-blue-900 focus:outline-none focus:ring-4 focus:ring-blue-100 disabled:opacity-50 transition-all shadow-lg shadow-blue-900/10"
        >
            {pending ? 'Ingresando...' : 'Iniciar Sesión'}
        </button>
    )
}

import { toast } from 'sonner'

export default function LoginPage() {
    const [showPassword, setShowPassword] = useState(false)

    async function handleSubmit(formData: FormData) {
        const result = await login(formData)
        if (result?.error) {
            let message = result.error
            if (message.includes('Invalid login credentials')) {
                message = 'Correo o contraseña incorrectos.'
            }
            toast.error(message)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
            <div className="max-w-md w-full p-8 bg-white rounded-3xl shadow-xl border border-slate-100 relative overflow-hidden">
                {/* Decoración superior */}
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-600 to-[#1e3a8a]" />

                <div className="text-center mb-10">
                    <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-[#1e3a8a]">
                        <Building2 className="w-8 h-8" />
                    </div>
                    <h1 className="text-3xl font-black text-[#1e3a8a] tracking-tight">SuperCondominio</h1>
                    <p className="text-slate-500 mt-2 font-semibold">Gestión inteligente de tu comunidad</p>
                </div>

                <form action={handleSubmit} className="space-y-6">
                    <div className="space-y-1.5">
                        <label htmlFor="email" className="text-xs font-bold text-slate-500 uppercase tracking-widest px-1">
                            Correo Electrónico
                        </label>
                        <div className="relative group">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-[#1e3a8a] transition-colors" />
                            <input
                                id="email"
                                name="email"
                                type="email"
                                required
                                autoComplete="username"
                                className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#1e3a8a] focus:bg-white outline-none transition-all text-slate-900 font-medium"
                                placeholder="tu@correo.com"
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label htmlFor="password" className="text-xs font-bold text-slate-500 uppercase tracking-widest px-1">
                            Contraseña
                        </label>
                        <div className="relative group">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-[#1e3a8a] transition-colors" />
                            <input
                                id="password"
                                name="password"
                                type={showPassword ? 'text' : 'password'}
                                required
                                autoComplete="current-password"
                                className="w-full pl-12 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#1e3a8a] focus:bg-white outline-none transition-all text-slate-900 font-medium"
                                placeholder="••••••••"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none transition-colors"
                            >
                                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                        </div>
                    </div>

                    <SubmitButton />

                    <p className="text-center text-xs text-slate-400 font-medium pt-4">
                        ¿Olvidaste tu contraseña? Contacta a tu administrador
                    </p>
                </form>
            </div>
        </div>
    )
}

function Building2({ className }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z" /><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2" /><path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2" /><path d="M10 6h4" /><path d="M10 10h4" /><path d="M10 14h4" /><path d="M10 18h4" />
        </svg>
    )
}
