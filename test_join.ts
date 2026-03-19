import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function backfill() {
    console.log("Fetching payments with missing perfil_id...");
    const { data: pagos, error: fetchError } = await supabase
        .from('pagos_reportados')
        .select('id, referencia')
        .is('perfil_id', null);
    
    if (fetchError || !pagos) {
        console.error("Error fetching", fetchError);
        return;
    }

    console.log(`Found ${pagos.length} orphaned payments.`);

    const { data: inmuebles } = await supabase.from('inmuebles').select('id, identificador, propietario_id');

    let fixedCount = 0;
    for (const pago of pagos) {
        if (!pago.referencia) continue;

        // Extract identifier from string like "Test reference (Inmueble: P-1A)"
        const match = pago.referencia.match(/\(Inmueble: ([^)]+)\)/);
        if (match && match[1]) {
            const identificador = match[1].trim();
            const inmueble = inmuebles?.find(i => i.identificador === identificador);
            
            if (inmueble && inmueble.propietario_id) {
                const { error: updateError } = await supabase
                    .from('pagos_reportados')
                    .update({ perfil_id: inmueble.propietario_id })
                    .eq('id', pago.id);
                
                if (!updateError) {
                    fixedCount++;
                    console.log(`Fixed payment ${pago.id} linking to ${inmueble.propietario_id}`);
                } else {
                    console.error("Error updating", pago.id, updateError);
                }
            }
        }
    }

    console.log(`Backfill complete. Fixed ${fixedCount} payments.`);
}

backfill();
