'use client'

import { ShieldAlert, ArrowLeftCircle } from 'lucide-react'
import { stopImpersonation } from '../superadmin/actions'

export default function ImpersonationBanner() {
    return (
        <div className="bg-amber-500 text-amber-950 px-6 py-3 flex items-center justify-between shadow-lg sticky top-0 z-[100] border-b border-amber-600/20">
            <div className="flex items-center gap-3">
                <div className="bg-amber-950/10 p-2 rounded-lg">
                    <ShieldAlert className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                    <p className="text-xs font-black uppercase tracking-tighter leading-none">Modo Superadmin Activo</p>
                    <p className="text-[10px] font-bold opacity-80 uppercase tracking-widest mt-1">Impersonando Condominio</p>
                </div>
            </div>

            <button
                onClick={() => stopImpersonation()}
                className="bg-amber-950 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-amber-900 transition-all flex items-center gap-2"
            >
                <ArrowLeftCircle className="w-4 h-4" />
                Finalizar Gestión
            </button>
        </div>
    )
}
