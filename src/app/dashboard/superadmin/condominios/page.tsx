import { createClient } from '@/utils/supabase/server'
import { Building2, Search, ArrowLeft, Filter, MoreVertical } from 'lucide-react'
import Link from 'next/link'
import GestionarButton from './GestionarButton'
import NuevoCondoModal from './NuevoCondoModal'
import CondoMenu from './CondoMenu'

export default async function SuperadminCondosPage() {
    const supabase = await createClient()

    // Obtener todos los condominios con conteo de inmuebles y perfiles
    const { data: condominios, error } = await supabase
        .from('condominios')
        .select(`
            *,
            perfiles (count),
            inmuebles (count)
        `)
        .order('nombre', { ascending: true })

    return (
        <div className="p-6 md:p-10 space-y-8">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                    <Link href="/dashboard/superadmin" className="p-3 bg-slate-800 rounded-2xl hover:bg-slate-700 transition-colors border border-slate-700">
                        <ArrowLeft className="w-5 h-5 text-slate-300" />
                    </Link>
                    <div>
                        <h1 className="text-3xl font-black tracking-tighter text-white uppercase">Gestión de Condominios</h1>
                        <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] mt-1">Directorio Global de Instancias</p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
                        <input
                            type="text"
                            placeholder="Buscar condominio..."
                            className="bg-slate-800/50 border border-slate-700 rounded-2xl py-3 pl-11 pr-5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 w-full md:w-64 transition-all text-white"
                        />
                    </div>
                    <button className="p-3 bg-slate-800 border border-slate-700 rounded-2xl hover:bg-slate-700 transition-colors">
                        <Filter className="w-5 h-5 text-slate-400" />
                    </button>
                    <NuevoCondoModal />
                </div>
            </header>

            <div className="grid grid-cols-1 gap-4">
                {condominios?.map((condo) => (
                    <div key={condo.id} className="bg-slate-800/30 rounded-[32px] border border-slate-700/50 p-6 hover:border-slate-600 transition-all group relative">
                        {/* Contenedor para la decoración con overflow hidden */}
                        <div className="absolute inset-0 rounded-[32px] overflow-hidden pointer-events-none">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/5 blur-3xl rounded-full -mr-10 -mt-10 group-hover:scale-150 transition-transform duration-700" />
                        </div>
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                            <div className="flex items-center gap-5">
                                <div className="w-16 h-16 bg-blue-600/10 text-blue-400 rounded-3xl flex items-center justify-center border border-blue-500/20 group-hover:bg-blue-600 group-hover:text-white transition-all duration-500">
                                    <Building2 className="w-8 h-8" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-white">{condo.nombre}</h3>
                                    <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">RIF: {condo.rif || 'N/A'}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 lg:grid-cols-3 gap-8 md:gap-12">
                                <div>
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Residentes</p>
                                    <p className="text-lg font-bold text-slate-200">{(condo.perfiles as any)?.[0]?.count || 0}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Inmuebles</p>
                                    <p className="text-lg font-bold text-slate-200">{(condo.inmuebles as any)?.[0]?.count || 0}</p>
                                </div>
                                <div className="hidden lg:block">
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Desde</p>
                                    <p className="text-sm font-bold text-slate-400">{new Date(condo.created_at).toLocaleDateString()}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <CondoMenu condo={{
                                    id: condo.id,
                                    nombre: condo.nombre,
                                    rif: condo.rif,
                                    direccion: (condo as any).direccion
                                }} />
                                <GestionarButton condoId={condo.id} />
                            </div>
                        </div>

                    </div>
                ))}

                {(!condominios || condominios.length === 0) && (
                    <div className="py-20 text-center bg-slate-900 rounded-[40px] border-4 border-dashed border-slate-800/50">
                        <Building2 className="w-16 h-16 text-slate-800 mx-auto mb-4" />
                        <p className="text-slate-500 font-black uppercase tracking-[0.3em]">No hay condominios registrados</p>
                    </div>
                )}
            </div>
        </div>
    )
}
