import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { CheckCircle2, Building2, Calendar, FileText, User } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import ReceiptDownloadButton from '@/components/ReceiptDownloadButton'

export const dynamic = 'force-dynamic'

export default async function HistorialVecinalPage() {
    const supabase = await createClient()
    const cookieStore = await cookies()
    const perfilId = cookieStore.get('propietario_token')?.value

    if (!perfilId) {
        redirect('/')
    }

    // Obtener los últimos 50 pagos reportados que hayan sido aprobados (verificados)
    const { data: pagosVerificados, error } = await supabase
        .from('pagos_reportados')
        .select(`
            id,
            monto_equivalente_usd,
            fecha_pago,
            created_at,
            perfiles (
                nombres,
                apellidos
            )
        `)
        .eq('estado', 'aprobado')
        .order('created_at', { ascending: false })
        .limit(50)

    return (
        <div className="min-h-screen bg-slate-50 font-sans pb-24">
            {/* Header */}
            <div className="bg-[#1e3a8a] text-white pt-10 pb-12 px-6 rounded-b-[40px] shadow-lg mb-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-10">
                    <Building2 className="w-32 h-32" />
                </div>
                <div className="relative z-10 flex flex-col gap-2">
                    <div className="inline-flex items-center gap-2 bg-white/20 px-3 py-1 rounded-full text-xs font-medium backdrop-blur-sm self-start mb-2">
                        <CheckCircle2 className="w-4 h-4" />
                        Transparencia
                    </div>
                    <h1 className="text-2xl font-black tracking-tight">Historial Vecinal</h1>
                    <p className="text-blue-100 text-sm font-medium">Actividad reciente de pagos verificados en la comunidad.</p>
                </div>
            </div>

            {/* Main Content - Timeline */}
            <div className="px-5">
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 relative">
                    <h2 className="text-xs font-bold text-slate-500 tracking-widest mb-6 bg-slate-50 py-2 px-4 rounded-xl inline-block">ÚLTIMOS PAGOS VERIFICADOS</h2>

                    {(!pagosVerificados || pagosVerificados.length === 0) ? (
                        <div className="text-center py-12 px-4">
                            <div className="w-16 h-16 bg-slate-50 rounded-full flex flex-col items-center justify-center mx-auto mb-4 border border-slate-100">
                                <FileText className="w-8 h-8 text-slate-300" />
                            </div>
                            <p className="text-slate-500 font-medium text-sm">No hay pagos verificados recientes para mostrar en el historial.</p>
                        </div>
                    ) : (
                            <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent">
                                {pagosVerificados.map((pago: any) => {
                                    const nombres = pago.perfiles?.nombres || 'Vecino'
                                    const apellidos = pago.perfiles?.apellidos || ''
                                    const fullName = `${nombres} ${apellidos}`.trim()
                                    
                                    return (
                                        <div key={pago.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                                            {/* Icon */}
                                            <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white bg-emerald-100 text-emerald-600 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 mr-4 md:mr-0">
                                                <CheckCircle2 className="w-5 h-5" />
                                            </div>
                                            {/* Card */}
                                            <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-white p-4 rounded-2xl border border-slate-100 shadow-sm md:group-odd:text-right group-hover:border-emerald-200 group-hover:shadow-md transition-all">
                                                <div className="flex items-center justify-between md:justify-start md:group-odd:flex-row-reverse mb-1 gap-2">
                                                    <div className="flex items-center gap-1.5 text-emerald-600 font-bold bg-emerald-50 px-2.5 py-1 rounded-lg text-xs md:group-odd:ml-2 md:group-even:mr-2">
                                                        <span>+ ${Number(pago.monto_equivalente_usd).toFixed(2)}</span>
                                                    </div>
                                                    <time className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                                                        <Calendar className="w-3 h-3" />
                                                        {format(parseISO(pago.fecha_pago || pago.created_at), "d 'de' MMM, yyyy", { locale: es })}
                                                    </time>
                                                </div>
                                                <div className="flex items-center gap-2 md:group-odd:justify-end mt-2 justify-between">
                                                    <div className="flex items-center gap-2 md:group-odd:justify-end">
                                                        <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center">
                                                            <User className="w-3.5 h-3.5 text-slate-400" />
                                                        </div>
                                                        <p className="text-sm font-semibold text-slate-700">
                                                            {fullName} <span className="text-slate-400 font-normal">registró un pago</span>
                                                        </p>
                                                    </div>
                                                    
                                                    <ReceiptDownloadButton
                                                        data={{
                                                            receiptNumber: pago.id.toString(),
                                                            propietarioName: fullName,
                                                            concepto: 'Abono / Cuota',
                                                            casaApto: 'Asignado',
                                                            puestoAdicional: false,
                                                            montoGlobal: `${Number(pago.monto_equivalente_usd).toFixed(2)} USD`,
                                                            fecha: new Date(pago.fecha_pago || pago.created_at),
                                                            formaDePago: 'Transf/Pago Móvil',
                                                            referencia: pago.id.toString(),
                                                            realizadoPor: 'Administración',
                                                            condominioName: 'CONJUNTO RESIDENCIAL'
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                    )}
                </div>
            </div>
        </div>
    )
}
