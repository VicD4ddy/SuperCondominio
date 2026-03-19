import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Vercel Cron Job Route
// This route is triggered automatically by Vercel according to vercel.json schedule

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    // 1. Authenticate the Cron Job request
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        // Enforce security so only Vercel can run this endpoint
        return new Response('Unauthorized', {
            status: 401,
        });
    }

    try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
        
        const supabase = createClient(supabaseUrl, supabaseKey);

        // 2. Find payments older than 6 months that still have a receipt attached
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        const isoSixMonthsAgo = sixMonthsAgo.toISOString();

        const { data: oldPayments, error: fetchError } = await supabase
            .from('pagos_reportados')
            .select('id, capture_url, referencia, nota_admin')
            .lt('created_at', isoSixMonthsAgo)
            .not('capture_url', 'is', null)
            .neq('capture_url', 'MANUAL'); // Exclude manual entries that might not be URLs

        if (fetchError) {
            console.error("Cron Error fetching old payments:", fetchError);
            return NextResponse.json({ success: false, error: fetchError.message }, { status: 500 });
        }

        if (!oldPayments || oldPayments.length === 0) {
            return NextResponse.json({ success: true, message: 'No old receipts found to cleanup.' });
        }

        let filesDeleted = 0;
        let recordsUpdated = 0;
        const bucketName = 'comprobantes_pago'; 

        // 3. Process each old payment
        for (const payment of oldPayments) {
            if (!payment.capture_url) continue;

            try {
                // Extract filename from the Supabase public URL
                // Format: https://[projectId].supabase.co/storage/v1/object/public/comprobantes_pago/[filename]
                const urlObj = new URL(payment.capture_url);
                const pathParts = urlObj.pathname.split('/');
                
                // Assuming standard public url structure: .../public/comprobantes_pago/filename.ext
                // In some cases it might be .../public/comprobantes_pago/folder/filename.ext
                const bucketIndex = pathParts.findIndex(p => p === bucketName);
                
                if (bucketIndex !== -1 && pathParts.length > bucketIndex + 1) {
                    const filePath = pathParts.slice(bucketIndex + 1).join('/');
                    
                    // Remove the file from Storage
                    const { error: storageError } = await supabase.storage.from(bucketName).remove([filePath]);
                    
                    if (storageError) {
                        console.error(`Error deleting storage file ${filePath}:`, storageError.message);
                        // Continue to next anyway
                    } else {
                        filesDeleted++;
                    }
                }

                // Remove the URL from the database, preserving the transaction
                const { error: updateError } = await supabase
                    .from('pagos_reportados')
                    .update({
                        capture_url: null, // Nullify the image
                        nota_admin: payment.nota_admin 
                                    ? payment.nota_admin + '\n[Sistema]: Comprobante físico auto-eliminado por antigüedad (+6 meses).'
                                    : '[Sistema]: Comprobante físico auto-eliminado por antigüedad (+6 meses).'
                    })
                    .eq('id', payment.id);

                if (!updateError) {
                    recordsUpdated++;
                }

            } catch (processError) {
                console.error(`Error processing payment ${payment.id}:`, processError);
            }
        }

        return NextResponse.json({ 
            success: true, 
            message: `Cleanup Complete. Evaluated ${oldPayments.length} records. Deleted ${filesDeleted} files. Updated ${recordsUpdated} DB rows.` 
        });

    } catch (err: any) {
        console.error("Critical Cron Cleanup Error:", err);
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}
