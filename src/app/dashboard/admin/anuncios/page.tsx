import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import { ArrowLeft, Megaphone, Pin } from 'lucide-react'
import CrearAnuncioForm from './CrearAnuncioForm'
import { DeleteButton, PinButton } from './AnuncioActions'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { getAdminProfile } from '@/utils/supabase/admin-helper'

export default async function AdminAnunciosPage() {
    const { user, profile: adminPerfil } = await getAdminProfile()
    const supabase = await createClient()

    if (!user) {
        return (
            <div className="p-5 text-center text-slate-500">
                Sesión no iniciada. <Link href="/login" className="text-blue-600 underline">Ir al Login</Link>
            </div>
        )
    }

    if (!adminPerfil) {
        return <div className="p-5 text-red-500">Error: Perfil Admin no encontrado.</div>
    }

    // Traer todos los anuncios (Los fijados primero, y luego por fecha descendente)
    const { data: anuncios } = await supabase
        .from('cartelera_anuncios')
        .select(`
            id,
            titulo,
            contenido,
            categoria,
            fijado,
            created_at,
            perfiles ( nombres, apellidos )
        `)
        .eq('condominio_id', adminPerfil.condominio_id)
        .order('fijado', { ascending: false })
        .order('created_at', { ascending: false })

    const categoryColors: Record<string, string> = {
        'Urgente': 'bg-red-100 text-red-700 border-red-200',
        'Mantenimiento': 'bg-orange-100 text-orange-700 border-orange-200',
        'Finanzas': 'bg-emerald-100 text-emerald-700 border-emerald-200',
        'Normativa': 'bg-blue-100 text-blue-700 border-blue-200',
        'Eventos': 'bg-purple-100 text-purple-700 border-purple-200',
        'General': 'bg-slate-100 text-slate-700 border-slate-200',
    }

    return (
        <div className="min-h-screen bg-slate-50 pb-20">
            {/* Header */}
            <header className="px-5 py-6 bg-white border-b border-slate-200 sticky top-0 z-40 flex items-center gap-4">
                <Link href="/dashboard/admin" className="p-3 border border-slate-200 rounded-xl text-slate-500 hover:bg-slate-50 transition-colors">
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <div>
                    <h1 className="text-xl font-bold text-[#1e3a8a]">Cartelera</h1>
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mt-1">Gestor de Noticias</p>
                </div>
            </header>

            <div className="p-5 max-w-3xl mx-auto space-y-6">

                {/* Formulario de Redacción */}
                <CrearAnuncioForm />

                {/* Lista de Anuncios */}
                <div className="space-y-4 pt-4">
                    <h2 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                        <Megaphone className="w-5 h-5 text-[#1e3a8a]" /> Publicaciones Recientes ({anuncios?.length || 0})
                    </h2>

                    {anuncios?.length === 0 ? (
                        <div className="bg-white p-16 rounded-[40px] border border-dashed border-slate-200 text-center flex flex-col items-center gap-6 animate-in fade-in zoom-in-95 duration-700 shadow-sm">
                            <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center relative">
                                <Megaphone className="w-10 h-10 text-blue-200" />
                                <div className="absolute -top-1 -right-1 w-6 h-6 bg-amber-400 rounded-full border-4 border-white animate-pulse" />
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-xl font-bold text-slate-800">Tablero sin noticias</h3>
                                <p className="text-slate-500 max-w-sm mx-auto text-sm font-medium">Anuncia mantenimientos, eventos o normativas para mantener a tu comunidad informada y conectada.</p>
                            </div>
                        </div>
                    ) : (
                        anuncios?.map((anuncio: any) => (
                            <div key={anuncio.id} className={`bg-white p-6 rounded-3xl shadow-sm border ${anuncio.fijado ? 'border-amber-300 ring-4 ring-amber-50' : 'border-slate-200'} relative transition-all`}>

                                {anuncio.fijado && (
                                    <div className="absolute -top-3 -right-2 bg-amber-100 text-amber-700 px-3 py-1 text-[10px] font-black tracking-widest uppercase rounded-full border border-amber-200 shadow-sm flex items-center gap-1">
                                        <Pin className="w-3 h-3 fill-amber-700" /> Fijado Especial
                                    </div>
                                )}

                                <div className="flex justify-between items-start mb-3">
                                    <div className="flex flex-col gap-3 items-start w-full">
                                        <span className={`px-2.5 py-1.5 rounded-lg text-[10px] uppercase font-bold border tracking-wider ${categoryColors[anuncio.categoria] || categoryColors['General']}`}>
                                            {anuncio.categoria}
                                        </span>
                                        <h3 className="font-bold text-slate-900 text-xl">{anuncio.titulo}</h3>
                                    </div>
                                </div>

                                <p className="text-slate-600 text-sm whitespace-pre-wrap leading-relaxed mb-6 font-medium">
                                    {anuncio.contenido}
                                </p>

                                <div className="flex justify-between items-center border-t border-slate-100 pt-5 mt-2">
                                    <div className="text-[11px] text-slate-400 font-bold uppercase tracking-widest">
                                        {format(new Date(anuncio.created_at), "d 'de' MMMM, yyyy • h:mm a", { locale: es })}
                                    </div>
                                    <div className="flex gap-2">
                                        <PinButton id={anuncio.id} isPinned={anuncio.fijado} />
                                        <DeleteButton id={anuncio.id} />
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

            </div>
        </div>
    )
}
