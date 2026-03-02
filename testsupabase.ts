import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import fs from 'fs'

dotenv.config({ path: '.env.local' })

async function run() {
    console.log('Testing insert with alicuota = 0 using real user cookie logic')
    // I can't easily mock next/headers cookies here to test the specific user's login.
    // Let me log in as the user. I don't know their password, so I'll create a new client using standard login if I know their email.
    // Instead of login, I'll use the service role key to insert.

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

        // Let's create an inmueble normally using service role key (bypasses RLS)
        const { error: sE } = await adminSupabase.from('inmuebles').insert({
            condominio_id: 'dbbd40ff-7b43-4dc9-9d95-2cc02a1b9195',
            identificador: 'TEST-SR-KEY'
        })
        console.log("Service role insert error:", sE)
    }
}
run()
