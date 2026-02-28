import { createClient } from '@/utils/supabase/server'
import { ShieldCheck, Calendar, Info, User, Building2 } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

export default async function SystemLogsPage() {
    const supabase = await createClient()

    // 1. Obtener Logs
    const { data: logs, error } = await supabase
        .from('logs_sistema')
        .select('*, perfiles(nombres, apellidos)')
        .order('created_at', { ascending: false })
        .limit(50)

    return (
        <div className="p-6 md:p-10 space-y-8">
            <header>
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-blue-600/10 text-blue-500 rounded-xl flex items-center justify-center">
                        <ShieldCheck className="w-6 h-6" />
                    </div>
                    <h1 className="text-3xl font-black tracking-tighter text-white uppercase italic">Bitácora de Sistema</h1>
                </div>
                <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] pl-1">
                    Historial global de auditoría y seguridad
                </p>
            </header>

            <div className="bg-slate-800/30 rounded-[32px] border border-slate-700/50 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-slate-700/50 bg-slate-800/50">
                                <th className="p-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Evento</th>
                                <th className="p-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Detalles</th>
                                <th className="p-5 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Usuario</th>
                                <th className="p-5 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Fecha</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700/30">
                            {logs && logs.length > 0 ? (
                                logs.map((log) => (
                                    <tr key={log.id} className="hover:bg-slate-800/40 transition-colors group">
                                        <td className="p-5">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-2 h-2 rounded-full ${log.evento.includes('Error') ? 'bg-red-500 animate-pulse' :
                                                        log.evento.includes('Imperson') ? 'bg-blue-500' : 'bg-emerald-500'
                                                    }`} />
                                                <span className="font-bold text-slate-200 text-sm whitespace-nowrap">{log.evento}</span>
                                            </div>
                                        </td>
                                        <td className="p-5">
                                            <p className="text-slate-400 text-xs leading-relaxed max-w-md">
                                                {typeof log.detalles === 'string' ? log.detalles : JSON.stringify(log.detalles)}
                                            </p>
                                        </td>
                                        <td className="p-5 text-center">
                                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-700/30 rounded-full border border-slate-700">
                                                <User className="w-3 h-3 text-slate-500" />
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">
                                                    {log.perfiles ? `${log.perfiles.nombres} ${log.perfiles.apellidos}` : 'Sistema'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="p-5 text-right">
                                            <div className="flex flex-col items-end">
                                                <span className="text-slate-200 font-bold text-xs">
                                                    {format(new Date(log.created_at), "dd 'de' MMMM", { locale: es })}
                                                </span>
                                                <span className="text-slate-500 text-[10px] font-black uppercase tracking-tighter">
                                                    {format(new Date(log.created_at), "HH:mm 'hrs'")}
                                                </span>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={4} className="p-20 text-center">
                                        <div className="flex flex-col items-center opacity-20">
                                            <Info className="w-12 h-12 mb-4" />
                                            <p className="text-xs font-black uppercase tracking-widest">No se han registrado eventos aún</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3">
                    <div className="w-8 h-8 bg-red-500 text-white rounded-lg flex items-center justify-center flex-shrink-0">
                        <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="text-red-400 font-bold text-sm leading-tight italic">Error de Base de Datos</p>
                        <p className="text-red-400/60 text-[10px] font-bold uppercase tracking-widest mt-0.5">
                            {error.message} - Asegúrese de crear la tabla 'logs_sistema'
                        </p>
                    </div>
                </div>
            )}
        </div>
    )
}
