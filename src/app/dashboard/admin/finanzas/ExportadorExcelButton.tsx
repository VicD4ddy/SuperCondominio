'use client'

import React, { useState } from 'react'
import { Download, Loader2 } from 'lucide-react'
import { generateLibroMayorExcel } from './excelActions'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface ExportadorExcelButtonProps {
    condominioName?: string;
}

export default function ExportadorExcelButton({ condominioName = 'Condominio' }: ExportadorExcelButtonProps) {
    const [isExporting, setIsExporting] = useState(false)

    const handleExport = async () => {
        try {
            setIsExporting(true)
            toast.loading('Generando Libro Mayor...', { id: 'export-excel' })
            
            const base64Data = await generateLibroMayorExcel()
            
            if (!base64Data) throw new Error('No data received')

            // Convert Base64 back to Blob and Download
            const binaryString = window.atob(base64Data);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
            }
            const blob = new Blob([bytes.buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            
            // Trigger download
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            const mesActual = format(new Date(), "MMMM", { locale: es }).toUpperCase();
            const safeCondoName = condominioName.replace(/[^a-zA-Z0-9]/g, '_');
            a.download = `LibroMayor_${safeCondoName}_${mesActual}.xlsx`;
            document.body.appendChild(a);
            a.click();
            
            // Cleanup
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
            
            toast.success('Libro Mayor Generado Exitosamente', { id: 'export-excel' })
        } catch (error) {
            console.error('Error exporting EXCEL:', error)
            toast.error('Ocurrió un error general el Excel', { id: 'export-excel' })
        } finally {
            setIsExporting(false)
        }
    }

    return (
        <button 
            onClick={handleExport}
            disabled={isExporting}
            className="bg-white border border-slate-200 text-slate-700 px-4 py-2.5 rounded-xl text-sm font-bold shadow-sm hover:bg-slate-50 hover:shadow-md flex items-center gap-2 transition-all disabled:opacity-50"
        >
            {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            {isExporting ? 'Procesando...' : 'Exportar Mes'}
        </button>
    )
}
