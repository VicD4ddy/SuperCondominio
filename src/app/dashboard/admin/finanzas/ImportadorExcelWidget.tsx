'use client'

import React, { useState, useRef } from 'react'
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle2, ChevronRight, Loader2, X, Download } from 'lucide-react'
import { toast } from 'sonner'
import * as xlsx from 'xlsx'
import ExcelJS from 'exceljs'
import { saveAs } from 'file-saver'
import { importarLibroMayorAction } from './importActions'

export default function ImportadorExcelWidget() {
    const [file, setFile] = useState<File | null>(null)
    const [isAnalyzing, setIsAnalyzing] = useState(false)
    const [isImporting, setIsImporting] = useState(false)
    const [isDownloadingTemplate, setIsDownloadingTemplate] = useState(false)
    const [previewData, setPreviewData] = useState<any[]>([])
    const [importErrors, setImportErrors] = useState<string[]>([])
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const selected = e.target.files?.[0]
        if (!selected) return

        if (!selected.name.endsWith('.xlsx') && !selected.name.endsWith('.xls')) {
            toast.error('Por favor selecciona un archivo Excel válido (.xlsx o .xls)')
            return
        }

        setFile(selected)
        analyzeExcel(selected)
    }

    const analyzeExcel = async (fileToAnalyze: File) => {
        setIsAnalyzing(true)
        setPreviewData([])
        setImportErrors([])

        try {
            const data = await fileToAnalyze.arrayBuffer()
            const workbook = xlsx.read(data, { type: 'array' })
            const firstSheetName = workbook.SheetNames[0]
            const worksheet = workbook.Sheets[firstSheetName]

            // Convert to JSON ignoring the first 2 rows (Title and possible empty row)
            const rawJson = xlsx.utils.sheet_to_json(worksheet, { header: 1, blankrows: false })
            
            // Clean up rows until we find the real headers
            let headerRowIndex = -1;
            for (let i = 0; i < rawJson.length; i++) {
                const row: any = rawJson[i];
                if (row && row.includes('RECIBO N°') && row.includes('CASA / APTO')) {
                    headerRowIndex = i;
                    break;
                }
            }

            if (headerRowIndex === -1) {
                throw new Error("No se encontró la estructura válida típica del formato 'GESTION AÑO 2026'. Falta la fila con encabezados como 'CASA / APTO' y 'RECIBO N°'.")
            }

            // Map data
            const headers = rawJson[headerRowIndex] as string[];
            const mappedData = []

            for (let i = headerRowIndex + 1; i < rawJson.length; i++) {
                const row = rawJson[i] as any[];
                if (!row || row.length === 0 || (typeof row[0] === 'string' && row[0].includes('TOTAL'))) continue; // Footer rows
                
                // Extraer base
                const mappedRow: any = {}
                headers.forEach((header, index) => {
                    if (header) {
                        // Normalize header key for easier mapping
                        const key = header.toLowerCase().replace(/[^a-z0-9]/g, '');
                        mappedRow[key] = row[index];
                    }
                })

                if (mappedRow.casaapto || mappedRow.ingresos || mappedRow.egresos) {
                    mappedData.push(mappedRow)
                }
            }

            setPreviewData(mappedData.slice(0, 5)) // Preview first 5
        } catch (error: any) {
            toast.error(error.message || 'Error al analizar el archivo')
            setFile(null)
        } finally {
            setIsAnalyzing(false)
        }
    }

    const handleImport = async () => {
        if (!file) return;
        setIsImporting(true)
        setImportErrors([])

        const formData = new FormData()
        formData.append('file', file)

        try {
            toast.loading('Importando registros a la base de datos...', { id: 'import-excel' })
            const result = await importarLibroMayorAction(formData)

            if (result.success) {
                toast.success(`Importación exitosa. ${result.ingresosCount} ingresos y ${result.egresosCount} egresos registrados.`, { id: 'import-excel' })
                setFile(null)
                setPreviewData([])
            } else {
                toast.error('Hubo errores durante la importación.', { id: 'import-excel' })
                if (result.errors) setImportErrors(result.errors)
            }

        } catch (e) {
            toast.error('Fallo crítico al comunicarse con el servidor.', { id: 'import-excel' })
        } finally {
            setIsImporting(false)
        }
    }

    const handleDownloadTemplate = async () => {
        setIsDownloadingTemplate(true);
        try {
            const workbook = new ExcelJS.Workbook();
            const sheet = workbook.addWorksheet('Plantilla Gestión');

            sheet.columns = [
                { key: 'fecha', width: 15 },
                { key: 'tasa_bcv', width: 12 },
                { key: 'recibo', width: 15 },
                { key: 'casa', width: 15 },
                { key: 'propietario', width: 30 },
                { key: 'ingresos', width: 15 },
                { key: 'egresos', width: 15 },
                { key: 'referencia', width: 25 },
                { key: 'concepto', width: 40 },
            ];

            const headers = ['FECHA', 'TASA BCV', 'RECIBO N°', 'CASA / APTO', 'PROPIETARIA (O)', 'INGRESOS', 'EGRESOS', 'N° REFERENCIA O TRANSACCIÓN', 'CONCEPTO'];
            const headerRow = sheet.addRow(headers);
            headerRow.eachCell((cell) => {
                cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0000FF' } }; // Azul
                cell.alignment = { horizontal: 'center', wrapText: true };
                cell.border = {
                    top: { style: 'thin' }, left: { style: 'thin' },
                    bottom: { style: 'thin' }, right: { style: 'thin' }
                };
            });

            // Mock rows
            sheet.addRow(['01/01/2026', '36.5', '2026-001', 'A-01', 'JUAN PÉREZ', 25.50, null, 'ZELLE 1234', 'CUOTA ENERO']);
            sheet.addRow(['02/01/2026', '36.5', '2026-002', 'B-14', 'MARÍA GÓMEZ', 15.00, null, 'PAGO MOVIL 9876', 'ABONO DEUDA']);
            sheet.addRow(['05/01/2026', '36.5', '-', '-', 'PROVEEDOR LUZ', null, 50.00, 'ZELLE 0000', 'PAGO MANTENIMIENTO']);

            const buffer = await workbook.xlsx.writeBuffer();
            const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            saveAs(blob, `Plantilla_Gestion_Ano.xlsx`);
            toast.success('Plantilla descargada con éxito');
        } catch (err) {
            console.error(err);
            toast.error('Error al generar plantilla de ejemplo');
        } finally {
            setIsDownloadingTemplate(false);
        }
    }

    return (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 lg:p-8">
            <div className="flex items-start justify-between mb-6">
                <div>
                    <h3 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
                        <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                        Importar Histórico Mensual
                    </h3>
                    <p className="text-sm text-slate-500 mt-1">Sube la plantilla estándar "Gestión Año 2026" para cargar pagos antiguos.</p>
                </div>
                {file && (
                    <button onClick={() => { setFile(null); setPreviewData([]); setImportErrors([]) }} className="p-2 bg-slate-100 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors">
                        <X className="w-4 h-4" />
                    </button>
                )}
            </div>

            {!file ? (
                <>
                <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-200 rounded-xl p-8 hover:border-[#1e3a8a]/40 hover:bg-[#1e3a8a]/5 transition-all text-center cursor-pointer group"
                >
                    <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:bg-blue-100 transition-colors">
                        <Upload className="w-6 h-6 text-slate-400 group-hover:text-[#1e3a8a]" />
                    </div>
                    <p className="text-sm font-bold text-slate-700">Haz clic para buscar el archivo</p>
                    <p className="text-xs text-slate-400 mt-1">Formatos soportados: .xlsx, .xls</p>
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        className="hidden" 
                        accept=".xlsx, .xls"
                        onChange={handleFileChange}
                    />
                </div>
                
                <div className="mt-4 flex justify-end">
                    <button
                        onClick={handleDownloadTemplate}
                        disabled={isDownloadingTemplate}
                        className="flex items-center gap-2 text-sm text-[#1e3a8a] font-bold hover:bg-blue-50 px-4 py-2 rounded-xl transition-colors disabled:opacity-50"
                    >
                        {isDownloadingTemplate ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                        Descargar Plantilla de Ejemplo
                    </button>
                </div>
            </>
            ) : (
                <div className="space-y-4">
                    {/* Archivo Seleccionado */}
                    <div className="flex items-center gap-4 bg-slate-50 border border-slate-200 p-4 rounded-xl">
                        <FileSpreadsheet className="w-8 h-8 text-emerald-500 shrink-0" />
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-slate-900 truncate">{file.name}</p>
                            <p className="text-xs text-slate-500">{(file.size / 1024).toFixed(1)} KB • Listo para análisis</p>
                        </div>
                    </div>

                    {isAnalyzing && (
                        <div className="flex items-center justify-center gap-2 text-sm text-[#1e3a8a] py-4">
                            <Loader2 className="w-4 h-4 animate-spin" /> Analizando estructura...
                        </div>
                    )}

                    {previewData.length > 0 && (
                        <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-4">
                            <h4 className="text-xs font-bold text-[#1e3a8a] tracking-widest uppercase mb-3 flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4" /> Estructura Reconocida
                            </h4>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs text-slate-600">
                                    <thead>
                                        <tr className="border-b border-blue-200/50">
                                            <th className="pb-2 font-bold uppercase">CASA</th>
                                            <th className="pb-2 font-bold uppercase">CONCEPTO</th>
                                            <th className="pb-2 font-bold text-right uppercase">INGRESOS ($)</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-blue-50">
                                        {previewData.map((row, idx) => (
                                            <tr key={idx}>
                                                <td className="py-2">{row.casaapto || '-'}</td>
                                                <td className="py-2 truncate max-w-[150px]">{row.concepto || '-'}</td>
                                                <td className="py-2 text-right font-bold text-emerald-600">
                                                    {row.ingresos ? `$${Number(row.ingresos).toFixed(2)}` : '-'}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <p className="text-[10px] text-slate-400 mt-2 italic">* Mostrando los primeros 5 registros detectados detectados.</p>
                        </div>
                    )}

                    {importErrors.length > 0 && (
                        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                            <h4 className="text-xs font-bold text-red-700 tracking-widest uppercase mb-2 flex items-center gap-2">
                                <AlertCircle className="w-4 h-4" /> Alertas de Importación
                            </h4>
                            <ul className="text-xs text-red-600 space-y-1 list-disc pl-4">
                                {importErrors.map((err, idx) => (
                                    <li key={idx}>{err}</li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {!isAnalyzing && previewData.length > 0 && (
                         <button 
                            onClick={handleImport}
                            disabled={isImporting}
                            className="w-full bg-[#1e3a8a] text-white py-3 rounded-xl font-bold shadow-sm hover:bg-blue-900 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {isImporting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
                            {isImporting ? 'Guardando en Base de Datos...' : 'Confirmar Importación Masiva'}
                        </button>
                    )}
                </div>
            )}
        </div>
    )
}
