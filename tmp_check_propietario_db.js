const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function run() {
    const perfilId = '18b3e3a9-beff-4c84-912e-1f5dab931a33'; 

    console.log('\n--- 1. Perfil ---');
    const p = await supabase.from('perfiles').select('nombres, estado_solvencia').eq('id', perfilId).single();
    if (p.error) console.error(p.error)
    else console.log(p.data)

    console.log('\n--- 2. Config ---');
    const c = await supabase.from('configuracion_global').select('nombre').limit(1).single();
    if (c.error) console.error(c.error)
    else console.log(c.data)

    console.log('\n--- 3. Inmuebles ---');
    const i = await supabase.from('inmuebles').select('id').eq('propietario_id', perfilId);
    if (i.error) console.error(i.error)
    else console.log(i.data)
}
run()
