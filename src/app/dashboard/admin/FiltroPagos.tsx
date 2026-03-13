'use client'

import React, { useState } from 'react'
import { Search, Filter, Eye, AlertCircle, CheckCircle2, ChevronDown, Check } from 'lucide-react'
import Link from 'next/link'

interface FiltroPagosProps {
    pagosPendientesObj: any[];
}

export default function FiltroPagos({ pagosPendientesObj }: FiltroPagosProps) {
    const [searchTerm, setSearchTerm] = useState('')
    const [filterBanco, setFilterBanco] = useState('ALL')

    const filteredPagos = pagosPendientesObj.filter((pago) => {
        const query = searchTerm.toLowerCase()
        const matchRef = pago.referencia?.toLowerCase().includes(query)
        const matchMonto = pago.monto_bs?.toString().includes(query)
        const inms = (pago.perfiles?.inmuebles || []).map((i: any) => i.identificador).join(', ').toLowerCase();
        const matchInms = inms.includes(query)
        const ownerName = `${pago.perfiles?.nombres || ''} ${pago.perfiles?.apellidos || ''}`.toLowerCase();
        const matchOwnerName = ownerName.includes(query)

        const matchesSearch = matchRef || matchMonto || matchInms || matchOwnerName

        const matchesBanco = filterBanco === 'ALL' || (pago.banco_origen && pago.banco_origen.includes(filterBanco))

        return matchesSearch && matchesBanco;
    })

    return (
        <div className="flex flex-col h-full w-full">
            {/* Top Filter Bar */}
            <div className="flex gap-2 px-4 py-3 bg-white border-b border-slate-100 z-10 sticky top-0">
                <div className="relative flex-1">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input 
                        type="text" 
                        placeholder="Buscar ref, bs, apto..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:ring-1 focus:ring-[#1e3a8a] focus:border-[#1e3a8a] transition-all"
                    />
                </div>
                <div className="relative">
                    <select 
                        value={filterBanco}
                        onChange={(e) => setFilterBanco(e.target.value)}
                        className="appearance-none pl-8 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-600 focus:outline-none focus:ring-1 focus:ring-[#1e3a8a] transition-all cursor-pointer h-full"
                    >
                        <option value="ALL">Todos los Bancos</option>
                        <option value="Banesco">Banesco</option>
                        <option value="Mercantil">Mercantil</option>
                        <option value="Provincial">Provincial</option>
                        <option value="BNC">BNC</option>
                        <option value="Venezuela">B. Venezuela</option>
                        <option value="Zelle">Zelle / Efectivo</option>
                    </select>
                    <Filter className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
            </div>

            {/* List */}
             <div className="overflow-y-auto flex-1 p-2 custom-scrollbar relative">
                {pagosPendientesObj.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-48 text-slate-400">
                        <span className="bg-emerald-50 text-emerald-500 p-4 rounded-full mb-3 shadow-inner">
                            <CheckCircle2 className="w-8 h-8" />
                        </span>
                        <p className="text-sm font-bold text-slate-700">¡Bandeja Limpia!</p>
                        <p className="text-[10px] text-slate-400 mt-1">No hay transferencias pendientes.</p>
                    </div>
                ) : filteredPagos.length === 0 ? (
                     <div className="flex flex-col items-center justify-center h-48 text-slate-400">
                        <p className="text-sm font-bold text-slate-700">Sin Resultados</p>
                        <p className="text-[10px] text-slate-400 mt-1">Intenta con otros filtros.</p>
                    </div>
                ) : (
                    <div className="w-full">
                        <div className="grid grid-cols-4 gap-2 px-4 py-3 border-b border-slate-100 bg-white sticky top-0 z-10 w-full mb-1">
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none">Inmueble</span>
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest col-span-2 leading-none">Monto Reportado</span>
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest text-right leading-none">Inspección</span>
                        </div>
                        {filteredPagos.map(pago => {
                            const inms = (pago.perfiles?.inmuebles || []).map((i: any) => i.identificador).join(', ') || 'N/A';
                            const montoUsd = (Number(pago.monto_bs) / pago.tasa_aplicada).toFixed(2);

                            return (
                                <div key={pago.id} className="grid grid-cols-4 gap-2 px-4 py-3 lg:py-4 border-b border-slate-50 items-center hover:bg-slate-50 transition-colors group">
                                    <span className="text-xs font-bold text-slate-800 line-clamp-1 group-hover:text-[#1e3a8a]">{inms}</span>
                                    <div className="col-span-2 flex flex-col justify-center">
                                        <span className="text-sm font-black text-slate-900">${montoUsd}</span>
                                        <span className="text-[9px] font-medium text-slate-400">REF: {pago.referencia}</span>
                                        <span className="text-[9px] font-bold text-slate-500">{pago.banco_origen}</span>
                                    </div>
                                    <div className="text-right flex justify-end">
                                        <Link scroll={false} href={`/dashboard/admin?ver_pago=${pago.id}`} className="inline-flex p-2 bg-slate-100 text-slate-600 rounded-lg group-hover:bg-[#1e3a8a] group-hover:text-white transition-colors shadow-sm border border-slate-200 group-hover:border-[#1e3a8a]">
                                            <Eye className="w-4 h-4" />
                                        </Link>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>
        </div>
    )
}
