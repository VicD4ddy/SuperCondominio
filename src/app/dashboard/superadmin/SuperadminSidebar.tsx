'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Building2, Users, Settings, LogOut, ShieldCheck } from 'lucide-react'
import { signOutAction } from '@/app/auth/actions'

export default function SuperadminSidebar() {
    const pathname = usePathname()

    const navItems = [
        {
            name: 'Visión Global',
            href: '/dashboard/superadmin',
            icon: LayoutDashboard,
            isActive: pathname === '/dashboard/superadmin'
        },
        {
            name: 'Condominios',
            href: '/dashboard/superadmin/condominios',
            icon: Building2,
            isActive: pathname.startsWith('/dashboard/superadmin/condominios')
        },
        {
            name: 'Logs de Sistema',
            href: '/dashboard/superadmin/logs',
            icon: ShieldCheck,
            isActive: pathname.startsWith('/dashboard/superadmin/logs')
        }
    ]

    return (
        <aside className="hidden md:flex flex-col w-72 bg-slate-900 text-slate-300 h-screen sticky top-0 py-8 px-6 shadow-xl z-50">
            {/* Logo */}
            <div className="mb-10 pl-2">
                <Link href="/dashboard/superadmin" className="text-2xl font-black text-white tracking-tighter flex items-center gap-2">
                    <span className="bg-blue-600 text-white p-1.5 rounded-lg text-sm">SA</span>
                    SUPER<span className="text-blue-400 font-light">admin</span>
                </Link>
                <p className="text-[10px] text-slate-500 font-bold tracking-[0.2em] uppercase mt-2">Control Maestro</p>
            </div>

            {/* Navegación */}
            <nav className="flex-1 space-y-2">
                {navItems.map((item) => {
                    const Icon = item.icon
                    const isSelected = item.isActive

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex items-center gap-4 px-4 py-3.5 rounded-2xl font-bold transition-all ${isSelected
                                ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20'
                                : 'hover:bg-slate-800 hover:text-white text-slate-400'
                                }`}
                        >
                            <Icon className={`w-5 h-5 ${isSelected ? 'text-blue-100' : ''}`} />
                            <span className="text-sm">{item.name}</span>
                        </Link>
                    )
                })}
            </nav>

            {/* Footer */}
            <div className="mt-8 pt-6 border-t border-slate-800">
                <form action={signOutAction}>
                    <button
                        type="submit"
                        className="flex items-center gap-3 w-full px-4 py-3 text-slate-500 hover:text-red-400 hover:bg-red-950/30 font-bold text-sm rounded-xl transition-colors"
                    >
                        <LogOut className="w-5 h-5" />
                        Salir de Matriz
                    </button>
                </form>
            </div>
        </aside>
    )
}
