import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import Link from 'next/link'
import AdminBottomNav from './AdminBottomNav'
import AdminSidebar from './AdminSidebar'
import ImpersonationBanner from './ImpersonationBanner'

export default async function AdminDashboardLayout({
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

    const cookieStore = await cookies()
    const isImpersonating = cookieStore.has('impersonated_condo_id')

    return (
        <div className="bg-slate-50 min-h-screen font-sans w-full flex flex-col">
            {isImpersonating && <ImpersonationBanner />}

            <div className="flex flex-col md:flex-row flex-1">
                {/* Sidebar (Only visible on MD+ screens) */}
                <AdminSidebar />

                {/* Main Content Area */}
                <main className="flex-1 w-full max-w-md md:max-w-4xl lg:max-w-5xl xl:max-w-7xl mx-auto relative pb-safe shadow-sm bg-slate-50 min-h-screen border-x border-slate-100 pb-24 md:pb-8">
                    {children}
                </main>

                {/* Bottom Navigation (Hidden on MD+) */}
                <div className="md:hidden">
                    <AdminBottomNav />
                </div>
            </div>
        </div>
    )
}
