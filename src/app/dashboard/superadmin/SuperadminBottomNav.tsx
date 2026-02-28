'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Building2, ShieldCheck, UserCircle } from 'lucide-react'

export default function SuperadminBottomNav() {
    const pathname = usePathname()

    const navItems = [
        {
            name: 'Inicio',
            href: '/dashboard/superadmin',
            icon: LayoutDashboard
        },
        {
            name: 'Condos',
            href: '/dashboard/superadmin/condominios',
            icon: Building2
        },
        {
            name: 'Logs',
            href: '/dashboard/superadmin/logs',
            icon: ShieldCheck
        },
        {
            name: 'Admin',
            href: '/dashboard/admin',
            icon: UserCircle
        }
    ]

    return (
        <nav className="fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-800 px-6 py-3 flex justify-between items-center z-50">
            {navItems.map((item) => {
                const Icon = item.icon
                const isActive = item.href === '/dashboard/superadmin'
                    ? pathname === item.href
                    : pathname.startsWith(item.href)

                return (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={`flex flex-col items-center gap-1 group relative ${isActive ? 'text-white' : 'text-slate-500'
                            }`}
                    >
                        {isActive && (
                            <div className="absolute -top-3 w-8 h-1 bg-blue-500 rounded-full" />
                        )}
                        <Icon className={`w-5 h-5 transition-transform ${isActive ? 'scale-110 text-blue-400' : 'group-active:scale-95'
                            }`} />
                        <span className="text-[10px] font-black uppercase tracking-widest leading-none">
                            {item.name}
                        </span>
                    </Link>
                )
            })}
        </nav>
    )
}
