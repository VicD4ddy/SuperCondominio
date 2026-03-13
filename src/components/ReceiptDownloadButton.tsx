'use client'

import React from 'react'
import { Download } from 'lucide-react'
import { generateReceiptPDF } from '@/utils/pdfGenerator'

interface ReceiptDownloadButtonProps {
    data: Parameters<typeof generateReceiptPDF>[0];
    className?: string;
}

export default function ReceiptDownloadButton({ data, className = '' }: ReceiptDownloadButtonProps) {
    const handleDownload = (e: React.MouseEvent) => {
        // Prevent default navigation if placed inside links, etc.
        e.preventDefault()
        e.stopPropagation()
        generateReceiptPDF(data)
    }

    return (
        <button
            onClick={handleDownload}
            className={`flex items-center justify-center gap-1 bg-white border border-slate-200 text-slate-600 hover:text-[#1e3a8a] hover:border-[#1e3a8a] transition-colors rounded-lg px-2 py-1 text-xs font-bold shadow-sm ${className}`}
            title="Descargar Recibo en PDF"
        >
            <Download className="w-3.5 h-3.5" />
            PDF
        </button>
    )
}
