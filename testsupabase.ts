import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

async function run() {
    console.log("Adding condominio_id to logs_sistema...")

    // We can't easily alter table via anon key, so we'll just check if it exists via RPC or try a basic insert
    const { data: cols, error: e1 } = await supabase
        .from('logs_sistema')
        .select('*')
        .limit(1)

    console.log("Current logs cols:", Object.keys(cols?.[0] || {}))
}
run()
