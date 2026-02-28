import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { ArrowLeft, HelpCircle, MessageSquare, Phone, User, ExternalLink, Mail } from 'lucide-react'

export default async function AyudaPage() {
    const supabase = await createClient()
    const cookieStore = await cookies()
    const perfilId = cookieStore.get('propietario_token')?.value

    if (!perfilId) return null

    // 1. Obtener condominio_id del residente
    const { data: residente } = await supabase
        .from('perfiles')
        .select('condominio_id')
        .eq('id', perfilId)
        .single()

    if (!residente) return null

    // 2. Obtener el perfil del administrador de ese condominio
    const { data: admin } = await supabase
        .from('perfiles')
        .select('*')
        .eq('condominio_id', residente.condominio_id)
        .eq('rol', 'admin')
        .single()

    return (
        <div className="min-h-screen bg-slate-50 pb-20">
            <header className="px-5 py-6 bg-white border-b border-slate-200 sticky top-0 z-40 flex items-center gap-4">
                <Link href="/dashboard/propietario/perfil" className="p-3 border border-slate-200 rounded-xl text-slate-500 hover:bg-slate-50 transition-colors">
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <div>
                    <h1 className="text-xl font-bold text-[#1e3a8a]">Soporte y Ayuda</h1>
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mt-1">Contacto Administrativo</p>
                </div>
            </header>

            <div className="p-5 max-w-xl mx-auto space-y-6">
                {/* Sección de Contacto Directo */}
                <div className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm space-y-8 relative overflow-hidden">
                    <div className="relative z-10 space-y-6 text-center flex flex-col items-center">
                        <div className="w-24 h-24 bg-orange-50 text-orange-600 rounded-full flex items-center justify-center shadow-inner">
                            <HelpCircle className="w-12 h-12" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-slate-900 tracking-tighter">¿Necesitas Ayuda?</h2>
                            <p className="text-sm text-slate-500 font-medium max-w-[240px] mt-2">
                                Contacta directamente con la administración de tu condominio para resolver dudas sobre tus pagos o el sistema.
                            </p>
                        </div>
                    </div>

                    <div className="space-y-4 relative z-10">
                        {admin ? (
                            <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 flex items-center gap-5">
                                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center border border-slate-200 shadow-sm text-slate-400">
                                    <User className="w-8 h-8" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Administrador Asignado</p>
                                    <p className="font-bold text-slate-900 text-lg leading-tight">{admin.nombres} {admin.apellidos}</p>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-slate-50 p-6 rounded-3xl border border-dashed border-slate-300 text-center">
                                <p className="text-sm text-slate-500 font-medium">Información administrativa no disponible actualmente.</p>
                            </div>
                        )}

                        <div className="grid grid-cols-1 gap-3">
                            {admin?.celular && (
                                <a
                                    href={`https://wa.me/${admin.celular.replace(/[^0-9]/g, '')}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center justify-center gap-3 w-full bg-[#128C7E] text-white p-4 rounded-2xl font-black uppercase tracking-widest shadow-lg hover:shadow-[#128C7E]/20 hover:scale-[1.02] transition-all active:scale-95 text-xs"
                                >
                                    <MessageSquare className="w-5 h-5" />
                                    Enviar WhatsApp
                                </a>
                            )}

                            <a
                                href="mailto:soporte@supercondominio.com"
                                className="flex items-center justify-center gap-3 w-full bg-slate-800 text-white p-4 rounded-2xl font-black uppercase tracking-widest shadow-lg hover:bg-slate-950 transition-all active:scale-95 text-xs"
                            >
                                <Mail className="w-5 h-5" />
                                Soporte Técnico
                            </a>
                        </div>
                    </div>

                    <div className="absolute -right-20 -bottom-20 opacity-5">
                        <MessageSquare className="w-72 h-72 text-orange-200" />
                    </div>
                </div>

                {/* Preguntas Frecuentes Placeholder */}
                <div className="px-4">
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-4 text-center">Preguntas Frecuentes</h3>
                    <div className="space-y-3">
                        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between group cursor-pointer hover:border-blue-200 transition-colors">
                            <span className="text-sm font-bold text-slate-700">¿Cómo reporto un pago?</span>
                            <ExternalLink className="w-4 h-4 text-slate-300 group-hover:text-blue-500 transition-colors" />
                        </div>
                        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between group cursor-pointer hover:border-blue-200 transition-colors">
                            <span className="text-sm font-bold text-slate-700">Mis datos son incorrectos</span>
                            <ExternalLink className="w-4 h-4 text-slate-300 group-hover:text-blue-500 transition-colors" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
