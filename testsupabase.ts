import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import fs from 'fs'

dotenv.config({ path: '.env.local' })

async function run() {
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
        // Check policies
        const { data: pgs, error } = await adminSupabase.from('pg_policies').select('*').eq('tablename', 'tasa_bcv')
        console.log("Policies for tasa_bcv:", pgs, error)
    }
}
run()
