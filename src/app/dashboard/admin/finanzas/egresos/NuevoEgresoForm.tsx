'use client'

import { useState, useRef } from 'react'
import { Plus, X, Loader2, DollarSign, Calendar, FileText, LayoutGrid, Camera, Image as ImageIcon } from 'lucide-react'
import { crearEgresoAction } from './actions'
import { compressImage } from '@/utils/imageCompression'
import { toast } from 'sonner'

export default function NuevoEgresoForm() {
    const [isOpen, setIsOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [previewUrl, setPreviewUrl] = useState<string | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            // Mostrar preview inmediato
            setPreviewUrl(URL.createObjectURL(file))
        }
    }

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setIsLoading(true)

        try {
            const formData = new FormData(e.currentTarget)
            const file = fileInputRef.current?.files?.[0]

            if (file) {
                toast.info('Comprimiendo imagen...')
                const compressedBlob = await compressImage(file, 1000, 0.6)
                formData.set('imagen', compressedBlob, 'recibo.jpg')
            }

            const res = await crearEgresoAction(formData)

            if (res.success) {
                toast.success('Gasto registrado exitosamente')
                setIsOpen(false)
                setPreviewUrl(null)
            } else {
                toast.error(res.error)
            }
        } catch (err) {
            toast.error('Error al procesar el registro')
            console.error(err)
        } finally {
            setIsLoading(false)
        }
    }

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="w-full py-4 bg-[#1e3a8a] text-white rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg hover:bg-blue-900 transition-all active:scale-[0.98]"
            >
                <Plus className="w-5 h-5" />
                Registrar Nuevo Gasto
            </button>
        )
    }

    return (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xl relative animate-in fade-in slide-in-from-bottom-4 duration-300">
            <button
                onClick={() => {
                    setIsOpen(false)
                    setPreviewUrl(null)
                }}
                className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-all"
            >
                <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                <Plus className="w-6 h-6 text-[#1e3a8a]" /> Detalle del Gasto
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest px-1">Concepto o Descripción</label>
                    <div className="relative">
                        <FileText className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                            type="text"
                            name="descripcion"
                            required
                            placeholder="Ej: Pago de Vigilancia, Reparación Bomba..."
                            className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all font-medium"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest px-1">Monto (USD)</label>
                        <div className="relative">
                            <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                            <input
                                type="number"
                                name="monto"
                                step="0.01"
                                required
                                placeholder="0.00"
                                className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all font-medium"
                            />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest px-1">Fecha</label>
                        <div className="relative">
                            <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                            <input
                                type="date"
                                name="fecha"
                                required
                                defaultValue={new Date().toISOString().split('T')[0]}
                                className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all font-medium"
                            />
                        </div>
                    </div>
                </div>

                <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest px-1">Categoría</label>
                    <div className="relative">
                        <LayoutGrid className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <select
                            name="categoria"
                            required
                            className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all font-medium appearance-none"
                        >
                            <option value="">Seleccionar Categoría</option>
                            <option value="Servicios">Servicios (Agua, Luz, Internet)</option>
                            <option value="Mantenimiento">Mantenimiento</option>
                            <option value="Sueldos">Sueldos y Salarios</option>
                            <option value="Administración">Gastos Administrativos</option>
                            <option value="Reparaciones">Reparaciones de Emergencia</option>
                            <option value="Otros">Otros</option>
                        </select>
                    </div>
                </div>

                {/* --- SECCIÓN Recibo (Foto) --- */}
                <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest px-1 flex items-center gap-2">
                        <Camera className="w-4 h-4" /> Comprobante o Recibo (Opcional)
                    </label>

                    <div
                        onClick={() => fileInputRef.current?.click()}
                        className="cursor-pointer border-2 border-dashed border-slate-200 rounded-2xl h-32 flex flex-col items-center justify-center bg-slate-50 hover:bg-slate-100 hover:border-blue-300 transition-all group overflow-hidden relative"
                    >
                        {previewUrl ? (
                            <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                        ) : (
                            <>
                                <ImageIcon className="w-8 h-8 text-slate-300 group-hover:text-blue-400 transition-colors mb-2" />
                                <p className="text-xs text-slate-400 font-medium group-hover:text-slate-600 transition-colors">Toque para subir foto del recibo</p>
                            </>
                        )}
                        <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            accept="image/*"
                            onChange={handleFileChange}
                            name="imagen_dummy" // Lo manejamos manual por compresión
                        />
                    </div>
                </div>

                <div className="pt-4 flex flex-col sm:flex-row gap-3">
                    <button
                        type="button"
                        onClick={() => {
                            setIsOpen(false)
                            setPreviewUrl(null)
                        }}
                        className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-200 transition-all"
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="flex-[2] py-4 bg-[#1e3a8a] text-white rounded-2xl font-bold shadow-lg hover:bg-blue-900 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Plus className="w-5 h-5" /> Guardar Gasto</>}
                    </button>
                </div>
            </form>
        </div>
    )
}
