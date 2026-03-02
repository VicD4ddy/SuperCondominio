'use client'

import React, { useState, useMemo } from 'react'
import { Search, Download, Clock, MessageCircle, Eye, CreditCard, FileText, TrendingUp, AlertCircle, Phone } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import ExcelJS from 'exceljs'
import { saveAs } from 'file-saver'

interface ReporteItem {
    id: string
    identificador: string
    propietario: string
    saldoAnteriorUSD: number
    cargoMesActualUSD: number
    cargoMesNombre: string
    saldoTotalUSD: number
    mesesMora: number
    ultimoPago?: {
        monto_bs: number
        fecha_pago: string
    } | null
}

interface ReporteProps {
    data: ReporteItem[]
    tasaBcv: number
}

export default function ReporteCuentasPorCobrar({ data, tasaBcv }: ReporteProps) {
    const [searchTerm, setSearchTerm] = useState('')
    const [downloadingTemplate, setDownloadingTemplate] = useState(false)

    // ... (Mantengo handleDownloadTemplate y filtrado tal cual)
    const handleDownloadTemplate = async () => {
        setDownloadingTemplate(true);
        try {
            const workbook = new ExcelJS.Workbook();
            const sheet = workbook.addWorksheet('Plantilla Importación');

            const headers = ['Identificador', 'Propietario', 'Cedula', 'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
            const headerRow = sheet.getRow(1);
            headerRow.values = headers;
            headerRow.height = 25;

            for (let c = 1; c <= 15; c++) {
                const cell = headerRow.getCell(c);
                cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
                cell.alignment = { horizontal: 'center', vertical: 'middle' };
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E3A8A' } };
            }

            sheet.addRow(['A-11', 'Juan Pérez', 'V-12345678', 50.00, 50.00, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
            sheet.addRow(['B-22', 'María Gómez', 'V-87654321', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);

            for (let r = 2; r <= 3; r++) {
                const row = sheet.getRow(r);
                for (let c = 4; c <= 15; c++) {
                    row.getCell(c).alignment = { horizontal: 'right' };
                    row.getCell(c).numFmt = '#,##0.00" $"';
                }
                row.getCell(1).alignment = { horizontal: 'center' };
                row.getCell(3).alignment = { horizontal: 'center' };
            }

            sheet.getColumn(1).width = 15;
            sheet.getColumn(2).width = 35;
            sheet.getColumn(3).width = 15;
            for (let i = 4; i <= 15; i++) { sheet.getColumn(i).width = 12; }

            sheet.views = [{ state: 'frozen', xSplit: 0, ySplit: 1 }];

            const buffer = await workbook.xlsx.writeBuffer();
            const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            saveAs(blob, `Plantilla_Cuentas_SuperCondominio.xlsx`);
        } catch (error) {
            console.error("Error generating Excel template:", error);
            alert("Error al generar la plantilla Excel.");
        } finally {
            setDownloadingTemplate(false);
        }
    }

    const filteredData = useMemo(() => {
        return data.filter(item =>
            item.identificador.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.propietario.toLowerCase().includes(searchTerm.toLowerCase())
        )
    }, [data, searchTerm])

    const formatBS = (amountUSD: number) => {
        return (amountUSD * tasaBcv).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' Bs.'
    }

    const formatUSD = (amountUSD: number) => {
        return '$' + amountUSD.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    }

    const handleWhatsApp = (item: ReporteItem) => {
        const text = encodeURIComponent(`Hola ${item.propietario}, te recordamos que el pago de tu condominio (${item.identificador}) presenta un saldo pendiente de ${formatUSD(item.saldoTotalUSD)} equivalente a ${formatBS(item.saldoTotalUSD)}. Por favor, regulariza tu situación a la brevedad posible.`);
        window.open(`https://wa.me/?text=${text}`, '_blank');
    }

    return (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full">
            <div className="p-4 lg:p-6 border-b border-slate-100 bg-slate-50/30 flex flex-col sm:flex-row gap-4 justify-between items-center">
                <div className="relative w-full max-w-md">
                    <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Buscar por inmueble o propietario..."
                        className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-[#1e3a8a]/20 focus:border-[#1e3a8a] outline-none transition-all"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <button className="flex items-center gap-2 bg-[#1e3a8a] text-white px-4 py-2.5 rounded-xl text-sm font-bold shadow-sm hover:bg-blue-900 transition-all w-full sm:w-auto justify-center">
                    <Download className="w-4 h-4" /> Exportar PDF
                </button>
            </div>

            <div className="overflow-x-auto flex-1">
                <table className="w-full text-left border-collapse whitespace-nowrap">
                    <thead className="bg-slate-50 border-b border-slate-100">
                        <tr>
                            <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Inmueble / Propietario</th>
                            <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center">Estatus</th>
                            <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center">Mora</th>
                            <th className="px-6 py-4 text-[10px] font-bold text-[#1e3a8a] uppercase tracking-widest text-right">Cargo Mes</th>
                            <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right">Saldo Total</th>
                            <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {filteredData.map((item) => {
                            const isSolvente = item.saldoTotalUSD <= 0;
                            const isGracia = item.mesesMora === 1 && item.saldoTotalUSD > 0;
                            const isMoroso = item.mesesMora > 1;

                            return (
                                <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 bg-blue-50 text-[#1e3a8a] rounded-lg flex items-center justify-center font-bold text-sm">
                                                {item.identificador}
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-slate-900 line-clamp-1">{item.propietario}</p>
                                                {item.ultimoPago ? (
                                                    <p className="text-[10px] text-emerald-600 font-medium">Último: {format(new Date(item.ultimoPago.fecha_pago), "d MMM yyyy", { locale: es })}</p>
                                                ) : (
                                                    <p className="text-[10px] text-slate-400 font-medium">Sin historial de pagos</p>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        {isSolvente && <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">SOLVENTE</span>}
                                        {isGracia && <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700">GRACIA</span>}
                                        {isMoroso && <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold bg-red-100 text-red-700">MOROSO</span>}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        {item.mesesMora === 0 ? (
                                            <span className="text-slate-300 text-xl font-black block">-</span>
                                        ) : (
                                            <div>
                                                <p className={`text-lg font-black leading-none ${isMoroso ? 'text-red-500' : 'text-slate-600'}`}>{item.mesesMora}</p>
                                                <p className="text-[9px] uppercase tracking-widest text-slate-400 font-bold mt-0.5">Meses</p>
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="inline-block">
                                            <p className="text-sm font-bold text-[#1e3a8a]">{formatBS(item.cargoMesActualUSD)}</p>
                                            <p className="text-[9px] text-[#1e3a8a]/60 font-bold uppercase tracking-widest">{item.cargoMesNombre}</p>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <p className={`text-lg font-black ${item.saldoTotalUSD > 0 ? 'text-slate-800' : 'text-emerald-600'}`}>
                                            {formatBS(item.saldoTotalUSD)}
                                        </p>
                                        <p className="text-[10px] text-slate-400 font-bold font-mono">{formatUSD(item.saldoTotalUSD)}</p>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex justify-center gap-2">
                                            <button
                                                title="Registrar Pago"
                                                className="p-2 text-slate-400 hover:text-[#1e3a8a] hover:bg-blue-50 rounded-lg transition-colors border border-transparent hover:border-blue-100"
                                            >
                                                <CreditCard className="w-4 h-4" />
                                            </button>
                                            <button
                                                title="Ver Detalle"
                                                className="p-2 text-slate-400 hover:text-slate-700 hover:bg-white rounded-lg transition-colors border border-transparent hover:border-slate-200 shadow-sm hover:shadow"
                                            >
                                                <Eye className="w-4 h-4" />
                                            </button>
                                            <button
                                                title="Recordatorio WhatsApp"
                                                onClick={() => handleWhatsApp(item)}
                                                disabled={isSolvente}
                                                className="p-2 text-emerald-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors border border-transparent hover:border-emerald-100 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:border-transparent disabled:hover:text-emerald-400"
                                            >
                                                <MessageCircle className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>

                {filteredData.length === 0 && (
                    <div className="py-20 text-center">
                        <div className="bg-slate-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                            {data.length === 0 ? <FileText className="w-8 h-8 text-[#1e3a8a]/60" /> : <AlertCircle className="w-8 h-8" />}
                        </div>
                        <h3 className="text-lg font-bold text-slate-800">
                            {data.length === 0 ? 'Sin Registros en el Sistema' : 'No se encontraron resultados'}
                        </h3>
                        {data.length === 0 ? (
                            <div className="mt-3">
                                <p className="text-sm text-slate-500 mb-4 px-4">Inicia la gestión financiera de tu condominio hoy mismo.</p>
                                <button
                                    onClick={handleDownloadTemplate}
                                    disabled={downloadingTemplate}
                                    className="inline-flex items-center justify-center gap-2 bg-[#1e3a8a] text-white px-5 py-2.5 rounded-xl font-bold hover:bg-blue-900 transition-colors shadow-sm disabled:opacity-50"
                                >
                                    {downloadingTemplate ? (
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <Download className="w-4 h-4" />
                                    )}
                                    {downloadingTemplate ? 'Generando Plantilla...' : 'Descargar Plantilla de Ejemplo'}
                                </button>
                            </div>
                        ) : (
                            <p className="text-sm text-slate-500 mt-1">Prueba con otro término de búsqueda.</p>
                        )}
                    </div>
                )}
            </div>

            {/* Pagination / Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                <p className="text-xs text-slate-500 font-medium">
                    Mostrando <span className="font-bold text-slate-800">{filteredData.length}</span> de {data.length} inmuebles
                </p>
                <div className="flex gap-2">
                    <button className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-400 cursor-not-allowed">Anterior</button>
                    <button className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-50">Siguiente</button>
                </div>
            </div>
        </div>
    )
}
