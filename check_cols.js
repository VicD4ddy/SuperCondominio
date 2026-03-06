require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);
async function run() {
    const { data, error } = await supabase.from('pagos_reportados').select('*').limit(1);
    if (data && data.length > 0) {
        console.log(Object.keys(data[0]));
    } else {
        console.log("Empty table, running a bad insert to get columns from error message");
        const { error: err2 } = await supabase.from('pagos_reportados').insert({ id: 'bad-uuid-just-for-error-stack' });
        console.log(err2.details);
    }
}
run();
