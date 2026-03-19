'use server'

import { createClient } from '@/utils/supabase/server'
import { format, startOfMonth, endOfMonth, parseISO } from 'date-fns'

export async function getLibroMayorDataAction(dateIso?: string) {
    try {
        const supabase = await createClient()
        
        const targetDate = dateIso ? parseISO(dateIso) : new Date()
        const start = startOfMonth(targetDate).toISOString()
        const end = endOfMonth(targetDate).toISOString()

        // 1. Fetch Ingresos (Pagos Aprobados)
        const { data: ingresos, error: errIngresos } = await supabase
            .from('pagos_reportados')
            .select(`
                id,
                fecha_pago,
                tasa_aplicada,
                monto_equivalente_usd,
                monto_bs,
                referencia,
                banco_origen,
                perfiles (nombres, apellidos),
                recibos_cobro (mes, inmueble:inmuebles(identificador)),
                created_at
            `)
            .eq('estado', 'aprobado')
            .gte('created_at', start)
            .lte('created_at', end)

        if (errIngresos) throw errIngresos

        // 2. Fetch Egresos (Gastos)
        const { data: egresos, error: errEgresos } = await supabase
            .from('gastos')
            .select('id, fecha, tasa_bcv, proveedor, monto_bs, monto_usd, referencia, descripcion')
            .gte('fecha', start)
            .lte('fecha', end)

        if (errEgresos) throw errEgresos

        // Format data for the table
        const combined = [
            ...(ingresos || []).map(p => {
                const perfil = Array.isArray(p.perfiles) ? p.perfiles[0] : p.perfiles
                const recibo: any = Array.isArray(p.recibos_cobro) ? p.recibos_cobro[0] : p.recibos_cobro
                
                return {
                    type: 'ingreso' as const,
                    id: p.id,
                    fecha: p.fecha_pago || p.created_at,
                    tasa_bcv: p.tasa_aplicada,
                    recibo_no: `2026-${String(p.id).padStart(3, '0')}`, 
                    casa: recibo?.inmueble?.identificador || 'N/A',
                    propietario: perfil ? `${perfil.nombres} ${perfil.apellidos}` : 'N/A',
                    monto_bs: p.monto_bs,
                    monto_usd: p.monto_equivalente_usd,
                    referencia: p.referencia,
                    concepto: recibo?.mes ? `MANTENIMIENTO ${recibo.mes}` : 'ABONO A CUENTA'
                }
            }),
            ...(egresos || []).map(e => ({
                type: 'egreso' as const,
                id: e.id,
                fecha: e.fecha,
                tasa_bcv: e.tasa_bcv || 0,
                recibo_no: '-',
                casa: '-',
                propietario: e.proveedor || 'GASTO',
                monto_bs: e.monto_bs || (Number(e.monto_usd) * (Number(e.tasa_bcv) || 1)),
                monto_usd: e.monto_usd,
                referencia: e.referencia || '-',
                concepto: e.descripcion
            }))
        ].sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime())

        return { data: combined, success: true }
    } catch (err: any) {
        console.error('Error in getLibroMayorDataAction:', err)
        return { error: err.message, success: false }
    }
}
