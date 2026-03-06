require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);
async function run() {
    const { data, error } = await supabase.rpc('get_table_columns', {
        table_name: 'pagos_reportados'
    });
    if (error) {
        const res = await supabase.from('pagos_reportados').select('*').limit(1);
        console.log("Keys:", Object.keys(res.data[0]));
    } else {
        console.log("Columns:", data);
    }
}
run();
