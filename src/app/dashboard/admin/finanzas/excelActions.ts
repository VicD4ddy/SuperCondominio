'use server'

import { createClient } from '@/utils/supabase/server'
import ExcelJS from 'exceljs'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

export async function generateLibroMayorExcel() {
    const supabase = await createClient()

    // 1. Get the data
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString();

    // INGRESOS (Pagos Aprobados del Mes)
    const { data: ingresos } = await supabase
        .from('pagos_reportados')
        .select(`
            id,
            fecha_pago,
            tasa_aplicada,
            monto_equivalente_usd,
            monto_bs,
            referencia,
            banco_origen,
            perfiles!inner (nombres, apellidos),
            recibos_cobro (mes),
            created_at
        `)
        .eq('estado', 'aprobado')
        .gte('created_at', startOfMonth)
        .lte('created_at', endOfMonth)

    // EGRESOS (Gastos Mensuales)
    let egresosData: any[] = []
    try {
        const { data: egresos } = await supabase
            .from('gastos')
            .select('id, fecha, tasa_bcv, proveedor, monto_bs, monto_usd, referencia, descripcion')
            .gte('fecha', startOfMonth)
            .lte('fecha', endOfMonth)
        if (egresos) egresosData = egresos
    } catch (e) {
        // Tolerante a fallos si la tabla no está creada aún.
        console.warn("Tabla gastos aún no estructurada.")
    }

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'SUPERcondominio';
    
    const monthName = format(now, "MMMM yyyy", { locale: es }).toUpperCase();
    const sheet = workbook.addWorksheet(monthName);

    // 2. Build the Exact Excel Structure requested by user "GESTION AÑO 2026"
    
    // Configurar Ancho de Columnas
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

    // Título Principal
    sheet.mergeCells('A1:I1');
    const titleCell = sheet.getCell('A1');
    titleCell.value = `RELACIÓN DE INGRESOS Y EGRESOS DEL CONJUNTO RESIDENCIAL - ${monthName}`;
    titleCell.font = { name: 'Arial', size: 12, bold: true, color: { argb: 'FFFFFFFF' } };
    titleCell.alignment = { horizontal: 'center' };
    titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF00B050' } }; // Verde

    // Headers
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

    let totalIngresos = 0;
    let totalEgresos = 0;

    // Poblar Ingresos
    if (ingresos) {
        ingresos.forEach((pago: any) => {
            const row = sheet.addRow({
                fecha: format(new Date(pago.fecha_pago || pago.created_at), "MM/dd/yyyy"),
                tasa_bcv: Number(pago.tasa_aplicada).toFixed(2),
                recibo: `${now.getFullYear()}-00${pago.id}`.slice(-8), // Simulado
                casa: "N/A", // Se requiere hacer join con Inmuebles
                propietario: `${pago.perfiles?.nombres || ''} ${pago.perfiles?.apellidos || ''}`.trim(),
                ingresos: Number(pago.monto_equivalente_usd),
                egresos: null,
                referencia: `${pago.banco_origen} ${pago.referencia}`,
                concepto: 'ABONO/CUOTA MENSUAL',
            });
            row.getCell('ingresos').numFmt = '"$"#,##0.00';
            totalIngresos += Number(pago.monto_equivalente_usd);
        });
    }

    // Poblar Egresos (Simulado hasta integración)
    if (egresosData && egresosData.length > 0) {
        egresosData.forEach((gasto: any) => {
             const row = sheet.addRow({
                fecha: format(new Date(gasto.fecha || new Date()), "MM/dd/yyyy"),
                tasa_bcv: gasto.tasa_bcv || '-',
                recibo: '-',
                casa: '-',
                propietario: gasto.proveedor || 'PROVEEDOR',
                ingresos: null,
                egresos: Number(gasto.monto_usd),
                referencia: gasto.referencia || '-',
                concepto: gasto.descripcion || 'PAGO SERVICIO',
            });
            row.getCell('egresos').numFmt = '"$"#,##0.00';
            totalEgresos += Number(gasto.monto_usd);
        });
    }

    // Fila Módulo de Resumen (Exactamente como el Excel del cliente)
    sheet.addRow([]); // Blank
    sheet.addRow([]); // Blank
    
    // Totales Finales
    const summaryStartRow = sheet.rowCount + 1;
    
    sheet.getCell(`H${summaryStartRow}`).value = 'TOTAL INGRESOS DEL MES';
    sheet.getCell(`H${summaryStartRow}`).font = { bold: true };
    sheet.getCell(`I${summaryStartRow}`).value = totalIngresos;
    sheet.getCell(`I${summaryStartRow}`).numFmt = '"$"#,##0.00';

    sheet.getCell(`H${summaryStartRow + 1}`).value = 'TOTAL EGRESOS DEL MES';
    sheet.getCell(`H${summaryStartRow + 1}`).font = { bold: true };
    sheet.getCell(`I${summaryStartRow + 1}`).value = totalEgresos;
    sheet.getCell(`I${summaryStartRow + 1}`).numFmt = '"$"#,##0.00';

    sheet.getCell(`H${summaryStartRow + 2}`).value = 'SALDO MES';
    sheet.getCell(`H${summaryStartRow + 2}`).font = { bold: true };
    sheet.getCell(`H${summaryStartRow + 2}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFF00' } }; // Yellow
    sheet.getCell(`I${summaryStartRow + 2}`).value = totalIngresos - totalEgresos;
    sheet.getCell(`I${summaryStartRow + 2}`).numFmt = '"$"#,##0.00';
    sheet.getCell(`I${summaryStartRow + 2}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFF00' } };

    // Escribir a Buffer y devolver Base64 para Client Download
    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer).toString('base64');
}
