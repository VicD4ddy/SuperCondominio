'use server'

import { createClient } from '@/utils/supabase/server'
import * as xlsx from 'xlsx'
import { revalidatePath } from 'next/cache'

export async function importarLibroMayorAction(formData: FormData) {
    const supabase = await createClient()
    const file = formData.get('file') as File

    if (!file) {
        return { success: false, errors: ['No se recibió ningún archivo.'] }
    }

    try {
        const buffer = await file.arrayBuffer()
        const workbook = xlsx.read(buffer, { type: 'buffer' })
        const firstSheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[firstSheetName]

        const rawJson = xlsx.utils.sheet_to_json(worksheet, { header: 1, blankrows: false })
        
        let headerRowIndex = -1;
        for (let i = 0; i < rawJson.length; i++) {
            const row: any = rawJson[i];
            if (row && row.includes('RECIBO N°') && row.includes('CASA / APTO')) {
                headerRowIndex = i;
                break;
            }
        }

        if (headerRowIndex === -1) {
             return { success: false, errors: ["No se encontró la estructura de encabezados correcta. Asegúrese de que sea el Excel de 'GESTION AÑO'."] }
        }

        const headers = rawJson[headerRowIndex] as string[];
        const errors: string[] = [];
        let ingresosCount = 0;
        let egresosCount = 0;

        // Recuperar usuarios/inmuebles para mapear
        const { data: inmueblesDB } = await supabase.from('inmuebles').select('id, identificador, propietario_id');

        for (let i = headerRowIndex + 1; i < rawJson.length; i++) {
            const row = rawJson[i] as any[];
            if (!row || row.length === 0 || (typeof row[0] === 'string' && row[0].includes('TOTAL'))) continue;
            
            const mappedRow: any = {}
            headers.forEach((header, index) => {
                if (header) {
                    const key = header.toLowerCase().replace(/[^a-z0-9]/g, '');
                    mappedRow[key] = row[index];
                }
            })

            const isIngreso = mappedRow.ingresos && Number(mappedRow.ingresos) > 0;
            const isEgreso = mappedRow.egresos && Number(mappedRow.egresos) > 0;
            const casaRaw = mappedRow.casaapto?.toString().trim().toUpperCase();

            if (!isIngreso && !isEgreso) continue; // Salta filas descriptivas si no hay montos

            try {
                // FECHA
                let parsedDate = new Date();
                
                // Procesar FECHA desde Excel de forma segura
                if (mappedRow.fecha) {
                   if (typeof mappedRow.fecha === 'number') {
                       // Excel Serial Date
                        parsedDate = new Date(Math.round((mappedRow.fecha - 25569) * 86400 * 1000));
                   } else if (typeof mappedRow.fecha === 'string') {
                       const d = new Date(mappedRow.fecha);
                       if (!isNaN(d.getTime())) parsedDate = d;
                   }
                }

                // SI ES INGRESO -> Pagos Reportados Aprobados
                if (isIngreso) {
                    let perfilId = null;
                    if (casaRaw && casaRaw !== '-' && casaRaw !== 'N/A') {
                        // Buscar el perfil asociado a ese inmueble
                        const propOwner = inmueblesDB?.find(inm => inm.identificador.toUpperCase() === casaRaw);
                        if (propOwner?.propietario_id) {
                            perfilId = propOwner.propietario_id;
                        } else {
                            errors.push(`Fila ${i+1}: No se encontró un vecino propietario del inmueble '${casaRaw}'. Asignado como pago no vinculado.`);
                        }
                    }

                    // Tasa referencial del Excel o por defecto
                    const tasa = isNaN(Number(mappedRow.tasabcv)) ? 36.50 : Number(mappedRow.tasabcv);
                    const usdMonto = Number(mappedRow.ingresos);
                    const bsMonto = usdMonto * tasa;

                    await supabase.from('pagos_reportados').insert({
                        perfil_id: perfilId, // Puede ser null temporalmente
                        monto_bs: bsMonto,
                        tasa_aplicada: tasa,
                        monto_equivalente_usd: usdMonto,
                        banco_origen: mappedRow.concepto || 'IMPORTADO EXCEL',
                        referencia: mappedRow.nreferenciaotransaccin || mappedRow.recibon || `IMP-${Date.now()}`,
                        fecha_pago: parsedDate.toISOString(),
                        estado: 'aprobado',
                        capture_url: '',
                        nota_admin: mappedRow.concepto || 'Importado MASIVAMENTE desde Excel.'
                    });
                    
                    ingresosCount++;
                }

                // SI ES EGRESO -> Tabla Gastos (Draft para futura implementación total)
                if (isEgreso) {
                    // Intento de guardar en `gastos` si la tabla ya está operativa en la DB.
                    const { error }: any = await supabase.from('gastos').insert({
                        fecha: parsedDate.toISOString(),
                        monto_usd: Number(mappedRow.egresos),
                        tasa_bcv: isNaN(Number(mappedRow.tasabcv)) ? null : Number(mappedRow.tasabcv),
                        descripcion: mappedRow.concepto || 'Egreso importado Excel',
                        referencia: mappedRow.nreferenciaotransaccin || null,
                        proveedor: mappedRow.propietariao || 'PROVEEDOR GENERAL'
                    }).select().single();

                    if (!error) {
                        egresosCount++;
                    } else if (error.code !== '42P01') { // Ignore relation doesn't exist just yet if phase is pending
                         errors.push(`Fila ${i+1}: Error al guardar el egreso. ${error.message}`);
                    }
                }

            } catch (filaError) {
                errors.push(`Fila ${i+1}: Ocurrió un error inesperado al procesar la celda.`);
            }
        }

        revalidatePath('/dashboard/admin', 'layout')
        return { success: true, ingresosCount, egresosCount, errors: errors.length > 0 ? errors : null }

    } catch (e: any) {
        console.error("Critical Import Error:", e)
        return { success: false, errors: [e.message || 'Error grave al transformar Excel.'] }
    }
}
