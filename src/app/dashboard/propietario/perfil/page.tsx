import { User, CreditCard, Shield, HelpCircle, LogOut, ChevronRight, FileText, Download } from 'lucide-react'
import { signOutAction } from '@/app/auth/actions'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'

export default async function PerfilPropietarioPage() {
    const supabase = await createClient()
    const cookieStore = await cookies()
    const perfilId = cookieStore.get('propietario_token')?.value

    let condominioData = null;

    if (perfilId) {
        const { data: perfil } = await supabase
            .from('perfiles')
            .select(`
                condominios ( nombre, carta_residencia_url )
            `)
            .eq('id', perfilId)
            .single()

        condominioData = perfil?.condominios as any;
    }

    return (
        <div className="relative pb-10">
            {/* Header Propietario */}
            <header className="bg-[#1e3a8a] px-5 pt-10 pb-16 flex items-center justify-center relative rounded-b-[40px]">
                <h1 className="text-xl font-bold text-white z-10">Mi Perfil</h1>
            </header>

            <div className="px-5 space-y-6 -mt-10 relative z-20">

                {/* Tarjeta de Usuario */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center">
                    <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-3">
                        <User className="w-10 h-10 text-slate-400" />
                    </div>
                    <h2 className="text-xl font-bold text-slate-900">Propietario Activo</h2>
                    <p className="text-sm text-slate-500 font-medium">Torre Principal</p>
                    <span className="mt-3 bg-emerald-100 text-emerald-700 border border-emerald-200 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                        Solvente
                    </span>
                </div>

                {/* Carta de Residencia (Siempre Visible) */}
                <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex items-center justify-between hover:border-slate-300 transition-colors">
                    <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${condominioData?.carta_residencia_url
                            ? 'bg-[#1e3a8a]/5 text-[#1e3a8a] border-[#1e3a8a]/10'
                            : 'bg-slate-50 text-slate-300 border-slate-100'
                            }`}>
                            <FileText className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-900 text-[15px]">Carta de Residencia</h3>
                            <p className="text-sm text-slate-500">
                                {condominioData?.carta_residencia_url ? 'Descargar documento PDF' : 'Documento no disponible todavía'}
                            </p>
                        </div>
                    </div>
                    {condominioData?.carta_residencia_url ? (
                        <a
                            href={condominioData.carta_residencia_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-3 bg-[#1e3a8a] text-white hover:bg-blue-900 rounded-xl transition-all shadow-md"
                        >
                            <Download className="w-5 h-5" />
                        </a>
                    ) : (
                        <div className="p-3 bg-slate-50 text-slate-300 rounded-xl border border-slate-100 cursor-not-allowed" title="El administrador aún no ha subido el formato">
                            <Download className="w-5 h-5" />
                        </div>
                    )}
                </div>

                {/* Opciones */}
                <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                    <Link href="/dashboard/propietario/perfil/metodos-pago" className="px-5 py-5 border-b border-slate-100 flex items-center justify-between hover:bg-slate-50 cursor-pointer transition-colors w-full group">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl group-hover:bg-blue-100 transition-colors">
                                <CreditCard className="w-6 h-6" />
                            </div>
                            <div>
                                <span className="font-bold text-slate-800 text-[15px]">Métodos de Pago</span>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Cuentas bancarias</p>
                            </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-blue-500 transition-all" />
                    </Link>

                    <Link href="/dashboard/propietario/perfil/seguridad" className="px-5 py-5 border-b border-slate-100 flex items-center justify-between hover:bg-slate-50 cursor-pointer transition-colors w-full group">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-slate-50 text-slate-600 rounded-xl group-hover:bg-slate-100 transition-colors">
                                <Shield className="w-6 h-6" />
                            </div>
                            <div>
                                <span className="font-bold text-slate-800 text-[15px]">Privacidad y Seguridad</span>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Gestión de tus datos</p>
                            </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-slate-800 transition-all" />
                    </Link>

                    <Link href="/dashboard/propietario/perfil/ayuda" className="px-5 py-5 flex items-center justify-between hover:bg-slate-50 cursor-pointer transition-colors w-full group">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-orange-50 text-orange-600 rounded-xl group-hover:bg-orange-100 transition-colors">
                                <HelpCircle className="w-6 h-6" />
                            </div>
                            <div>
                                <span className="font-bold text-slate-800 text-[15px]">Soporte y Ayuda</span>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Contacto administrativo</p>
                            </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-orange-500 transition-all" />
                    </Link>
                </div>

                {/* Botón Salir */}
                <form action={signOutAction} className="pt-2">
                    <button
                        type="submit"
                        className="w-full bg-white border border-slate-200 text-slate-700 hover:bg-red-50 hover:text-red-600 hover:border-red-200 rounded-xl p-4 flex items-center justify-center gap-2 font-bold transition-all"
                    >
                        <LogOut className="w-5 h-5" />
                        Cerrar Sesión
                    </button>
                </form>

            </div>
        </div>
    )
}
