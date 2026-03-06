require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);
async function run() {
    const { data: inmueble } = await supabase.from('inmuebles').select('id, identificador').ilike('identificador', '%d22%').single();
    console.log("Inmueble:", inmueble);

    const { data: adminPerfil } = await supabase.from('perfiles').select('condominio_id').limit(1).single();

    const { data: perfilData } = await supabase.from('perfiles').select('id').eq('inmueble_id', inmueble.id).single();
    const perfilId = perfilData?.id || null;

    console.log("Perfil ID:", perfilId);
    const insertPayload = {
        condominio_id: adminPerfil.condominio_id,
        perfil_id: perfilId,
        monto_bs: 360,
        tasa_aplicada: 36,
        monto_equivalente_usd: 10,
        referencia: 'Registro Manual de Admin',
        fecha_pago: '2026-03-06',
        banco_origen: 'Efectivo USD',
        banco_destino: 'Caja',
        capture_url: 'MANUAL',
        estado: 'aprobado'
    };
    console.log("Payload:", insertPayload);
    const { data, error } = await supabase.from('pagos_reportados').insert(insertPayload).select('id').single();
    console.log("Error:", error);
}
run();
