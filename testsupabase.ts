import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

async function run() {
    console.log("Checking pagos_reportados structure to find property reference...")

    // We need to see an actual row to know what fields we have
    const { data: cols, error: e1 } = await supabase
        .from('pagos_reportados')
        .select(`
            *
        `)
        // remove limits/RLS by just pulling any row that is public
        .limit(1)

    if (e1) {
        console.error('ERROR rows:', JSON.stringify(e1, null, 2))
    } else {
        console.log("ROW DATA:", JSON.stringify(cols, null, 2))
    }
}
run()
