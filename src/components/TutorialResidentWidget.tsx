'use client'

import React from 'react'
import { Wallet, Landmark, UploadCloud, CheckCircle, Info, ChevronRight } from 'lucide-react'

export default function TutorialResidentWidget() {
    const steps = [
        {
            title: "Consulta tu Saldo",
            desc: "En el resumen financiero verás lo que debes cada mes en USD y BS.",
            icon: Wallet,
            color: "bg-blue-500",
            lightColor: "bg-blue-50"
        },
        {
            title: "Datos del Banco",
            desc: "Ve a tu Perfil > Métodos de Pago para ver a dónde transferir.",
            icon: Landmark,
            color: "bg-emerald-500",
            lightColor: "bg-emerald-50"
        },
        {
            title: "Reporta el Pago",
            desc: "Presiona 'Reportar Pago Móvil' y sube la captura de tu comprobante.",
            icon: UploadCloud,
            color: "bg-[#1e3a8a]",
            lightColor: "bg-slate-50"
        },
        {
            title: "Recibos Listos",
            desc: "Cuando el admin valide, tu estado pasará a SOLVENTE automáticamente.",
            icon: CheckCircle,
            color: "bg-amber-500",
            lightColor: "bg-amber-50"
        }
    ]

    return (
        <div className="pt-2">
            <div className="flex items-center justify-between mb-3 px-1">
                <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-blue-100 text-[#1e3a8a] rounded-lg flex items-center justify-center">
                        <Info className="w-4 h-4" />
                    </div>
                    <h3 className="font-bold text-slate-800 text-sm uppercase tracking-tight">Guía Rápida de Uso</h3>
                </div>
                <div className="flex items-center gap-1.5 animate-pulse">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Desliza</span>
                    <ChevronRight className="w-3 h-3 text-slate-400" />
                </div>
            </div>

            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x -mx-5 px-5">
                {steps.map((step, idx) => {
                    const Icon = step.icon
                    return (
                        <div
                            key={idx}
                            className="flex-shrink-0 w-[240px] bg-white p-5 rounded-3xl border border-slate-200 shadow-sm snap-start flex flex-col gap-3"
                        >
                            <div className={`w-12 h-12 ${step.lightColor} rounded-2xl flex items-center justify-center`}>
                                <Icon className={`w-6 h-6 ${step.color.replace('bg-', 'text-')}`} />
                            </div>
                            <div>
                                <h4 className="font-bold text-slate-900 text-[15px] mb-1 leading-tight">
                                    {idx + 1}. {step.title}
                                </h4>
                                <p className="text-xs text-slate-500 font-medium leading-relaxed">
                                    {step.desc}
                                </p>
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
