import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { ArrowLeft, Shield, User, Key, Lock, CheckCircle2 } from 'lucide-react'

export default async function SeguridadPage() {
    const supabase = await createClient()
    const cookieStore = await cookies()
    const perfilId = cookieStore.get('propietario_token')?.value

    if (!perfilId) return null

    // Obtener datos del perfil
    const { data: perfil } = await supabase
        .from('perfiles')
        .select('*')
        .eq('id', perfilId)
        .single()

    if (!perfil) return null

    return (
        <div className="min-h-screen bg-slate-50 pb-20">
            <header className="px-5 py-6 bg-white border-b border-slate-200 sticky top-0 z-40 flex items-center gap-4">
                <Link href="/dashboard/propietario/perfil" className="p-3 border border-slate-200 rounded-xl text-slate-500 hover:bg-slate-50 transition-colors">
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <div>
                    <h1 className="text-xl font-bold text-[#1e3a8a]">Privacidad y Seguridad</h1>
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mt-1">Gestión de datos</p>
                </div>
            </header>

            <div className="p-5 max-w-xl mx-auto space-y-6">
                {/* Sección de Perfil */}
                <div className="bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm space-y-6">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-blue-50 text-[#1e3a8a] rounded-2xl flex items-center justify-center border border-blue-100">
                            <User className="w-7 h-7" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h2 className="font-black text-slate-900 text-lg uppercase tracking-tight">Datos del Perfil</h2>
                                <span className="p-1 bg-slate-100 text-slate-400 rounded-md" title="Información protegida">
                                    <Lock className="w-3 h-3" />
                                </span>
                            </div>
                            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Información Registrada por Administración</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Nombre Completo</p>
                            <p className="text-slate-800 font-bold">{perfil.nombres} {perfil.apellidos}</p>
                        </div>
                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Documento de Identidad</p>
                            <p className="text-slate-800 font-bold font-mono text-lg">{perfil.cedula}</p>
                        </div>
                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Rol en el Sistema</p>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="bg-emerald-100 text-emerald-700 border border-emerald-200 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                                    {perfil.rol}
                                </span>
                                <span className="bg-blue-100 text-[#1e3a8a] border border-blue-200 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                                    Activo
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sección de Seguridad */}
                <div className="bg-[#1e3a8a] p-8 rounded-[40px] text-white shadow-xl relative overflow-hidden">
                    <div className="relative z-10 space-y-6">
                        <div className="flex items-center gap-3">
                            <Shield className="w-8 h-8 text-blue-300" />
                            <h2 className="text-xl font-black uppercase tracking-tighter">Tu Seguridad</h2>
                        </div>

                        <div className="space-y-4">
                            <div className="flex gap-4">
                                <div className="mt-1">
                                    <CheckCircle2 className="w-5 h-5 text-blue-400" />
                                </div>
                                <div>
                                    <p className="font-bold text-sm">Cifrado de Extremo a Extremo</p>
                                    <p className="text-blue-200 text-xs">Tus datos bancarios y reportes están protegidos bajo estándares bancarios.</p>
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <div className="mt-1">
                                    <Lock className="w-5 h-5 text-blue-400" />
                                </div>
                                <div>
                                    <p className="font-bold text-sm">Control de Acceso</p>
                                    <p className="text-blue-200 text-xs">Solo tú y el administrador de tu condominio pueden ver tu información financiera.</p>
                                </div>
                            </div>
                        </div>

                        <div className="pt-4 border-t border-blue-400/30">
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-300 mb-2">Seguridad de la Cuenta</p>
                            <p className="text-sm text-blue-100">
                                La contraseña de acceso es gestionada globalmente para el condominio. Contacta a tu administrador si necesitas recuperarla.
                            </p>
                        </div>
                    </div>
                    <div className="absolute -left-10 -bottom-10 opacity-5">
                        <Shield className="w-64 h-64" />
                    </div>
                </div>
            </div>
        </div>
    )
}
