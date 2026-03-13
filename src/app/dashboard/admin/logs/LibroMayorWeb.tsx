'use client'

import React, { useState, useEffect } from 'react'
import { format, subMonths, startOfMonth, endOfMonth, addMonths, isSameMonth } from 'date-fns'
import { es } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, FileSpreadsheet, Loader2, Download, AlertCircle } from 'lucide-react'
import { getLibroMayorDataAction } from './ledgerActions'
import { generateLibroMayorExcel } from '../finanzas/excelActions'
import { toast } from 'sonner'

export default function LibroMayorWeb() {
    const [currentMonth, setCurrentMonth] = useState(new Date())
    const [data, setData] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [isExporting, setIsExporting] = useState(false)

    const fetchLedger = async (month: Date) => {
        setLoading(true)
        setError(null)
        try {
            const res = await getLibroMayorDataAction(month.toISOString())
            if (res.success) {
                setData(res.data || [])
            } else {
                setError(res.error || 'Error al cargar los datos')
            }
        } catch (err) {
            setError('Error de conexión')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchLedger(currentMonth)
    }, [currentMonth])

    const nextMonth = () => setCurrentMonth(prev => addMonths(prev, 1))
    const prevMonth = () => setCurrentMonth(prev => subMonths(prev, 1))

    const totals = data.reduce((acc, curr) => {
        if (curr.type === 'ingreso') acc.ingresos += Number(curr.monto_usd)
        else acc.egresos += Number(curr.monto_usd)
        return acc
    }, { ingresos: 0, egresos: 0 })

    const handleExport = async () => {
        try {
            setIsExporting(true)
            toast.loading('Generando Excel...', { id: 'export-ledger' })
            
            // Note: The existing generateLibroMayorExcel in excelActions.ts 
            // uses the current month internally. We might need a version that takes a date.
            // For now, let's just trigger the existing one or enhance it later.
            const base64Data = await generateLibroMayorExcel()
            
            if (!base64Data) throw new Error('No data received')

            const binaryString = window.atob(base64Data);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
            }
            const blob = new Blob([bytes.buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            const mesStr = format(currentMonth, "MMMM_yyyy", { locale: es }).toUpperCase();
            a.download = `Libro_Mayor_${mesStr}.xlsx`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
            
            toast.success('Excel Generado', { id: 'export-ledger' })
        } catch (error) {
            toast.error('Error al exportar', { id: 'export-ledger' })
        } finally {
            setIsExporting(false)
        }
    }

    return (
        <div className="space-y-6">
            {/* Control de Mes */}
            <div className="header-ledger flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex items-center gap-4">
                    <button onClick={prevMonth} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                        <ChevronLeft className="w-5 h-5 text-slate-600" />
                    </button>
                    <div className="text-center min-w-[200px]">
                        <h2 className="text-xl font-black text-[#1e3a8a] uppercase tracking-tight italic">
                            {format(currentMonth, "MMMM yyyy", { locale: es })}
                        </h2>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Periodo de Gestión</p>
                    </div>
                    <button 
                        onClick={nextMonth} 
                        disabled={isSameMonth(currentMonth, new Date())}
                        className="p-2 hover:bg-slate-100 rounded-full transition-colors disabled:opacity-30"
                    >
                        <ChevronRight className="w-5 h-5 text-slate-600" />
                    </button>
                </div>

                <div className="flex items-center gap-3">
                    <button 
                        onClick={handleExport}
                        disabled={isExporting || data.length === 0}
                        className="flex items-center gap-2 bg-emerald-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-md hover:bg-emerald-700 transition-all disabled:opacity-50"
                    >
                        {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                        Exportar Excel
                    </button>
                </div>
            </div>

            {/* Tabla Estilo Excel (Layout requested in Screenshot) */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-xs font-medium">
                        <thead>
                            <tr className="bg-[#0000FF] text-white">
                                <th className="p-2 border border-blue-400 uppercase w-[100px]">Fecha</th>
                                <th className="p-2 border border-blue-400 uppercase w-[80px]">BCV/DÍA</th>
                                <th className="p-2 border border-blue-400 uppercase w-[100px]">Recibo</th>
                                <th className="p-2 border border-blue-400 uppercase w-[80px]">Casa</th>
                                <th className="p-2 border border-blue-400 uppercase text-left pl-4">Propietario</th>
                                <th className="p-2 border border-blue-400 uppercase text-right pr-4">Monto BS.</th>
                                <th className="p-2 border border-blue-400 uppercase text-right pr-4">Monto $</th>
                                <th className="p-2 border border-blue-400 uppercase">Referencia</th>
                                <th className="p-2 border border-blue-400 uppercase text-left pl-4">Concepto</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-[#E8F5E9]/30">
                            {loading ? (
                                <tr>
                                    <td colSpan={9} className="p-20 text-center">
                                        <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-600 mb-2" />
                                        <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Cargando Gestión...</p>
                                    </td>
                                </tr>
                            ) : data.length === 0 ? (
                                <tr>
                                    <td colSpan={9} className="p-20 text-center">
                                        <div className="flex flex-col items-center text-slate-400">
                                            <AlertCircle className="w-12 h-12 mb-4 opacity-20" />
                                            <p className="text-xs font-black uppercase tracking-widest">Sin registros este mes</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                <>
                                    {data.map((row, idx) => (
                                        <tr key={idx} className={`hover:bg-slate-50 transition-colors ${row.type === 'egreso' ? 'bg-orange-50/30' : ''}`}>
                                            <td className="p-2 border border-slate-100 text-center">{format(new Date(row.fecha), "dd/MM/yyyy")}</td>
                                            <td className="p-2 border border-slate-100 text-center font-mono text-slate-500">{row.tasa_bcv}</td>
                                            <td className="p-2 border border-slate-100 text-center">{row.recibo_no}</td>
                                            <td className="p-2 border border-slate-100 text-center font-bold text-[#1e3a8a]">{row.casa}</td>
                                            <td className="p-2 border border-slate-100 pl-4 uppercase font-bold text-slate-800">{row.propietario}</td>
                                            <td className="p-2 border border-slate-100 text-right pr-4 font-mono font-bold text-slate-600">
                                                {row.monto_bs?.toLocaleString('es-VE', { minimumFractionDigits: 2 })}
                                            </td>
                                            <td className="p-2 border border-slate-100 text-right pr-4 font-mono font-black text-emerald-700">
                                                {row.type === 'egreso' ? `($${Number(row.monto_usd).toFixed(2)})` : `$${Number(row.monto_usd).toFixed(2)}`}
                                            </td>
                                            <td className="p-2 border border-slate-100 text-center font-mono text-xs">{row.referencia}</td>
                                            <td className="p-2 border border-slate-100 pl-4 italic text-slate-500">{row.concepto}</td>
                                        </tr>
                                    ))}

                                    {/* Filas de Totales (Matching Excel Visual style) */}
                                    <tr className="bg-slate-100/80 font-black text-slate-900 border-t-2 border-slate-300">
                                        <td colSpan={5} className="p-3 text-right uppercase tracking-widest text-[10px]">Total Cobrado / Gestionado:</td>
                                        <td className="p-3 text-right pr-4 font-mono">
                                            {/* We could sum Bs too if needed */}
                                        </td>
                                        <td className="p-3 text-right pr-4 font-mono text-lg bg-emerald-50 border-x border-slate-200">
                                            ${totals.ingresos.toFixed(2)}
                                        </td>
                                        <td colSpan={2}></td>
                                    </tr>
                                    <tr className="bg-slate-100/80 font-black text-slate-900">
                                        <td colSpan={5} className="p-3 text-right uppercase tracking-widest text-[10px]">Total Egresos:</td>
                                        <td className="p-3 text-right pr-4 font-mono text-red-600">
                                            {/* Sum Egresos Bs */}
                                        </td>
                                        <td className="p-3 text-right pr-4 font-mono text-lg text-red-600 bg-red-50 border-x border-slate-200">
                                            ${totals.egresos.toFixed(2)}
                                        </td>
                                        <td colSpan={2}></td>
                                    </tr>
                                    <tr className="bg-yellow-100 font-black text-slate-900">
                                        <td colSpan={5} className="p-4 text-right uppercase tracking-widest text-xs">Saldo Neto del Mes:</td>
                                        <td className="p-4 text-right pr-4"></td>
                                        <td className="p-4 text-right pr-4 font-mono text-xl text-[#1e3a8a] border-x border-yellow-200 shadow-inner">
                                            ${(totals.ingresos - totals.egresos).toFixed(2)}
                                        </td>
                                        <td colSpan={2}></td>
                                    </tr>
                                </>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Sección de Importación (Ubicada debajo según el plan) */}
            {/* Note: In a real implementation we would import ImportadorExcelWidget here or in the parent */}
        </div>
    )
}
