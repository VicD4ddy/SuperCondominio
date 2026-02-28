import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import SuperadminSidebar from './SuperadminSidebar'
import SuperadminBottomNav from './SuperadminBottomNav'

export default async function SuperadminLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    // Doble verificación de rol en el layout (Server Side)
    const { data: perfil } = await supabase
        .from('perfiles')
        .select('rol')
        .eq('auth_user_id', user.id)
        .single()

    if (perfil?.rol !== 'superadmin') {
        redirect('/dashboard') // Redirigir al dashboard que le toque según su rol real
    }

    return (
        <div className="bg-slate-950 min-h-screen font-sans w-full flex flex-col md:flex-row text-slate-200">
            <SuperadminSidebar />

            <main className="flex-1 w-full max-w-7xl mx-auto relative shadow-2xl bg-slate-900 md:my-4 md:mr-4 md:rounded-[40px] overflow-hidden border border-slate-800 min-h-screen md:min-h-[calc(100vh-32px)] pb-24 md:pb-8">
                {children}
            </main>

            <div className="md:hidden">
                <SuperadminBottomNav />
            </div>
        </div>
    )
}
