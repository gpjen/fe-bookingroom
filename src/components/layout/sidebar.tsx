'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Building2, Calendar, ListChecks, LayoutDashboard } from 'lucide-react'
import { cn } from '@/lib/utils'

const items = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/buildings', label: 'Gedung', icon: Building2 },
  { href: '/bookings', label: 'Booking', icon: ListChecks },
  { href: '/calendar', label: 'Kalender', icon: Calendar },
]

export function Sidebar() {
  const pathname = usePathname()
  return (
    <aside className="w-64 border-r min-h-screen">
      <div className="px-4 py-4">
        <div className="mb-6">
          <span className="text-sm text-neutral-500">Menu</span>
        </div>
        <nav className="space-y-1">
          {items.map(({ href, label, icon: Icon }) => {
            const active = pathname === href
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex items-center gap-3 rounded-md px-3 py-2 text-sm',
                  active ? 'bg-neutral-100 font-medium' : 'hover:bg-neutral-50'
                )}
              >
                <Icon className="h-4 w-4" />
                <span>{label}</span>
              </Link>
            )
          })}
        </nav>
      </div>
    </aside>
  )
}

