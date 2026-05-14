'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Mail, Users, Building2, GitMerge,
  Sparkles, Key, ScrollText, Star,
} from 'lucide-react'

const nav = [
  { href: '/admin',              label: 'Overview',     icon: LayoutDashboard, exact: true },
  { href: '/admin/waitlist',     label: 'Waitlist',     icon: Mail },
  { href: '/admin/creators',     label: 'Creators',     icon: Users },
  { href: '/admin/businesses',   label: 'Businesses',   icon: Building2 },
  { href: '/admin/matches',      label: 'Matches',      icon: GitMerge },
  { href: '/admin/invites',      label: 'Collabs',      icon: Sparkles },
  { href: '/admin/invite-codes', label: 'Invite codes', icon: Key },
  { href: '/admin/audit-log',    label: 'Audit log',    icon: ScrollText },
]

export function AdminSidebar({ email, children }: { email: string; children: React.ReactNode }) {
  const pathname = usePathname()

  function isActive(href: string, exact?: boolean) {
    return exact ? pathname === href : pathname.startsWith(href)
  }

  return (
    <div className="flex min-h-screen">

      {/* ── Sidebar ── */}
      <aside
        className="flex flex-col shrink-0"
        style={{ width: '240px', background: '#1C2B3A', borderRight: '1px solid rgba(255,255,255,0.06)' }}
      >
        {/* Branding */}
        <div className="px-6 pt-8 pb-6" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="flex items-center gap-2.5 mb-3">
            <Star className="w-5 h-5 shrink-0" style={{ color: '#F5B800' }} />
            <span
              className="text-white font-extrabold leading-tight"
              style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontSize: '17px' }}
            >
              Punt &amp; Prominence
            </span>
          </div>
          <span
            className="inline-block text-[10px] font-bold tracking-[0.18em] uppercase px-2 py-0.5 rounded"
            style={{ background: 'rgba(245,184,0,0.12)', color: '#F5B800', fontFamily: "'JetBrains Mono', monospace" }}
          >
            Admin console
          </span>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 flex flex-col gap-0.5">
          {nav.map(({ href, label, icon: Icon, exact }) => {
            const active = isActive(href, exact)
            return (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all"
                style={{
                  color: active ? '#F5B800' : 'rgba(255,255,255,0.5)',
                  background: active ? 'rgba(245,184,0,0.08)' : 'transparent',
                  fontFamily: "'Inter', sans-serif",
                }}
              >
                <Icon
                  className="w-4 h-4 shrink-0"
                  style={{ color: active ? '#F5B800' : 'rgba(255,255,255,0.35)' }}
                />
                {label}
              </Link>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="px-6 py-5" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
          <p className="text-xs truncate" style={{ color: 'rgba(255,255,255,0.25)', fontFamily: "'JetBrains Mono', monospace" }}>
            {email}
          </p>
        </div>
      </aside>

      {/* ── Main content ── */}
      <main className="flex-1 overflow-y-auto" style={{ background: '#f8f9fa', minHeight: '100vh' }}>
        <div className="max-w-5xl mx-auto px-8 py-8">
          {children}
        </div>
      </main>
    </div>
  )
}
