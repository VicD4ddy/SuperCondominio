import { jsPDF } from 'jspdf';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface ReceiptData {
    receiptNumber: string;
    propietarioName: string;
    concepto: string;
    casaApto: string;
    puestoAdicional: boolean;
    montoGlobal: string; // e.g., "12,600 Bs" or "28.00 USD"
    fecha: Date | string;
    formaDePago: string;
    referencia: string;
    realizadoPor: string;
    condominioName: string;
}

export function generateReceiptPDF(data: ReceiptData) {
    // Create new A5 document in Landscape (perfect for receipts)
    const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a5'
    });

    // ----------------------------------------------------
    // CONSTANTS & COLORS
    // ----------------------------------------------------
    const primaryColor = '#1e3a8a'; // Blue
    const grayColor = '#64748b';
    const lightGray = '#f1f5f9';
    const blackColor = '#0f172a';

    const marginX = 15;
    let cursorY = 20;

    // ----------------------------------------------------
    // BACKGROUND & BORDER
    // ----------------------------------------------------
    doc.setDrawColor(primaryColor);
    doc.setLineWidth(0.5);
    doc.rect(10, 10, 190, 128); // outer border

    // ----------------------------------------------------
    // HEADER
    // ----------------------------------------------------
    doc.setTextColor(primaryColor);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text(data.condominioName.toUpperCase(), 105, cursorY, { align: "center" });
    
    cursorY += 6;
    doc.setFontSize(10);
    doc.setTextColor(grayColor);
    doc.setFont("helvetica", "normal");
    doc.text("RECIBO DE PAGO DE CONDOMINIO", 105, cursorY, { align: "center" });

    // Receipt Number Box (Top Right)
    doc.setFillColor(lightGray);
    doc.setDrawColor(primaryColor);
    doc.rect(145, 12, 45, 12, "FD"); // Fill & Draw
    
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(primaryColor);
    doc.text("RECIBO N°", 150, 19);
    
    doc.setTextColor(blackColor);
    doc.text(data.receiptNumber, 170, 19);

    cursorY += 15;

    // ----------------------------------------------------
    // CONTENT TABLE (Simulated with rects/lines)
    // ----------------------------------------------------
    const drawRow = (label: string, value: string, yStart: number, height: number, boldValue: boolean = false) => {
        doc.setDrawColor(200, 200, 200); // light gray line
        doc.setLineWidth(0.2);
        
        // Label
        doc.setFontSize(9);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(grayColor);
        doc.text(label, marginX + 2, yStart + (height / 2) + 1.5);
        
        // Value
        doc.setFontSize(10);
        doc.setFont("helvetica", boldValue ? "bold" : "normal");
        doc.setTextColor(blackColor);
        doc.text(value, marginX + 45, yStart + (height / 2) + 1.5, { maxWidth: 120 });
        
        // Horizontal line bottom
        doc.line(marginX, yStart + height, 195, yStart + height);
        return yStart + height;
    };

    // First horizontal line top
    doc.setDrawColor(200, 200, 200);
    doc.line(marginX, cursorY, 195, cursorY);

    doc.setFillColor(lightGray);
    doc.rect(marginX, cursorY, 40, 52, "F"); // Label column background

    cursorY = drawRow("PROPIETARIO", data.propietarioName.toUpperCase(), cursorY, 10, true);
    
    // Concept is usually multiline, giving it more height
    const conceptHeight = 12;
    cursorY = drawRow("CONCEPTO", data.concepto.toUpperCase(), cursorY, conceptHeight);
    
    cursorY = drawRow("CASA / APTO", data.casaApto, cursorY, 10, true);
    
    cursorY = drawRow("PUESTO ADICIONAL", data.puestoAdicional ? "SÍ (X)" : "NO", cursorY, 10);
    
    cursorY = drawRow("FORMA DE PAGO", data.formaDePago.toUpperCase(), cursorY, 10);

    // ----------------------------------------------------
    // FOOTER DETAILS (Monto, Fecha, Ref)
    // ----------------------------------------------------
    cursorY += 8;

    // MONTO BOX
    doc.setFillColor(primaryColor);
    doc.rect(marginX, cursorY, 60, 14, "F");
    doc.setTextColor(255, 255, 255); // white
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("MONTO:", marginX + 5, cursorY + 8);
    doc.setFontSize(12);
    doc.text(data.montoGlobal, marginX + 22, cursorY + 8.5);

    // FECHA
    doc.setTextColor(grayColor);
    doc.setFontSize(9);
    doc.text("FECHA:", 90, cursorY + 5);
    doc.setTextColor(blackColor);
    doc.setFontSize(10);
    let parsedDate = data.fecha;
    if (typeof data.fecha === 'string') {
        parsedDate = new Date(data.fecha);
    }
    const formattedDate = format(parsedDate as Date, "dd 'de' MMMM, yyyy", { locale: es });
    doc.text(formattedDate.toUpperCase(), 105, cursorY + 5);

    // REFERENCIA
    doc.setTextColor(grayColor);
    doc.setFontSize(9);
    doc.text("REFERENCIA / LOTE:", 90, cursorY + 11);
    doc.setTextColor(blackColor);
    doc.setFontSize(10);
    doc.text(data.referencia || "N/A", 125, cursorY + 11);

    // ----------------------------------------------------
    // SIGNATURE
    // ----------------------------------------------------
    cursorY += 20;
    
    doc.setDrawColor(primaryColor);
    doc.setLineWidth(0.3);
    doc.line(130, cursorY, 185, cursorY); // signature line
    
    doc.setFontSize(8);
    doc.setTextColor(grayColor);
    doc.setFont("helvetica", "normal");
    doc.text("Realizado por:", 157.5, cursorY + 4, { align: "center" });
    
    doc.setFontSize(9);
    doc.setTextColor(blackColor);
    doc.setFont("helvetica", "bold");
    doc.text(data.realizadoPor.toUpperCase(), 157.5, cursorY + 9, { align: "center" });

    // Document timestamp
    doc.setFontSize(7);
    doc.setTextColor(150, 150, 150);
    doc.text(`Generado automáticamente en plataforma el ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, marginX, 133);

    // ----------------------------------------------------
    // SAVE ACTION
    // ----------------------------------------------------
    const safeCondoName = data.condominioName.replace(/[^a-zA-Z0-9]/g, '_');
    const safeCasaApto = data.casaApto.replace(/[^a-zA-Z0-9]/g, '_');
    const fileName = `ReciboPago_${safeCondoName}_${safeCasaApto}_N${data.receiptNumber}.pdf`;
    doc.save(fileName);
}
