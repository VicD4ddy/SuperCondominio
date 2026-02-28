'use client'

import { useState, useRef, useEffect } from 'react'
import { MoreVertical, Edit2, Trash2, X, AlertTriangle } from 'lucide-react'
import EditarCondoModal from './EditarCondoModal'

interface CondoMenuProps {
    condo: {
        id: string
        nombre: string
        rif: string
        direccion?: string
    }
}

export default function CondoMenu({ condo }: CondoMenuProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [showDeleteModal, setShowDeleteModal] = useState(false)
    const [showEditModal, setShowEditModal] = useState(false)
    const menuRef = useRef<HTMLDivElement>(null)

    // Cerrar al clickear fuera
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }
        document.addEventListener("mousedown", handleClickOutside)
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [])

    return (
        <div className="relative" ref={menuRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`p-3 rounded-xl transition-all border ${isOpen
                    ? 'bg-slate-700 border-blue-500/50 text-white'
                    : 'bg-slate-800/50 hover:bg-slate-700 border-slate-700 text-slate-400'
                    }`}
            >
                <MoreVertical className="w-5 h-5" />
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl z-[100] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="p-2 space-y-1">
                        <button
                            className="flex items-center gap-3 w-full px-4 py-3 text-sm font-bold text-slate-300 hover:bg-slate-700 hover:text-white rounded-xl transition-colors text-left"
                            onClick={() => {
                                setIsOpen(false)
                                setShowEditModal(true)
                            }}
                        >
                            <Edit2 className="w-4 h-4 text-blue-400" />
                            Editar Dados
                        </button>
                        <button
                            className="flex items-center gap-3 w-full px-4 py-3 text-sm font-bold text-red-400 hover:bg-red-500/10 rounded-xl transition-colors text-left"
                            onClick={() => {
                                setIsOpen(false)
                                setShowDeleteModal(true)
                            }}
                        >
                            <Trash2 className="w-4 h-4" />
                            Eliminar
                        </button>
                    </div>
                </div>
            )}

            {/* Modal de Confirmación de Eliminación */}
            {showDeleteModal && (
                <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
                    <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-[32px] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="p-8">
                            <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-2xl flex items-center justify-center mb-6 mx-auto">
                                <AlertTriangle className="w-8 h-8" />
                            </div>

                            <div className="text-center space-y-2 mb-8">
                                <h3 className="text-2xl font-black text-white italic italic italic italic">¿Eliminar Condominio?</h3>
                                <p className="text-slate-400 text-sm leading-relaxed">
                                    Esta acción eliminará permanentemente el condominio <span className="text-white font-bold">"{condo.nombre}"</span> y todos sus datos vinculados. Esta operación no se puede deshacer.
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    onClick={() => setShowDeleteModal(false)}
                                    className="py-4 bg-slate-800 text-slate-300 font-black uppercase tracking-widest text-[10px] rounded-2xl hover:bg-slate-700 transition-all border border-slate-700"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={() => {
                                        alert('Eliminación protegida en este entorno')
                                        setShowDeleteModal(false)
                                    }}
                                    className="py-4 bg-red-600 text-white font-black uppercase tracking-widest text-[10px] rounded-2xl hover:bg-red-500 transition-all shadow-lg shadow-red-900/20"
                                >
                                    Confirmar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <EditarCondoModal
                isOpen={showEditModal}
                onClose={() => setShowEditModal(false)}
                condo={condo}
            />
        </div>
    )
}
