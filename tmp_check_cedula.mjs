import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function run() {
    const { data, error } = await supabase
        .from('perfiles')
        .select('id, nombres, apellidos, rol, cedula')
        .like('cedula', '%27372853%')
    
    console.log("RESULT:", data)
    if (error) console.error("ERROR:", error)
}

run()
