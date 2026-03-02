import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import fs from 'fs'

dotenv.config({ path: '.env.local' })

async function run() {
    console.log("Dropping alicuota column...")

    const envData = fs.readFileSync('.env.local', 'utf8')
    let serviceRoleKey = ''
    for (const l of envData.split('\n')) {
        if (l.includes('SERVICE_ROLE_KEY')) {
            serviceRoleKey = l.split('=')[1].trim()
        }
    }

    if (serviceRoleKey) {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
        const adminSupabase = createClient(supabaseUrl, serviceRoleKey)

        // Use RPC to execute raw SQL to drop column if available. Or just use REST if we had a dedicated function.
        // Sadly standard supabase client js doesn't have a `.query()` to run arbitrary DDL without an RPC.
        // Wait, wait... Supabase has no direct arbitrary SQL execution from the javascript client.
        console.log("Cannot drop column via client without an RPC that executes raw SQL, or pg module.")
    }
}
run()
