'use client'
import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, X, LayoutDashboard, Mail, Users, Building2, Sparkles, Key, ScrollText, Star } from 'lucide-react'

const nav = [
  { href: '/admin',              label: 'Overview',     icon: LayoutDashboard, exact: true },
  { href: '/admin/waitlist',     label: 'Waitlist',     icon: Mail },
  { href: '/admin/creators',     label: 'Creators',     icon: Users },
  { href: '/admin/businesses',   label: 'Businesses',   icon: Building2 },
  { href: '/admin/collabs',      label: 'Collabs',      icon: Sparkles },
  { href: '/admin/invite-codes', label: 'Invite codes', icon: Key },
  { href: '/admin/audit-log',    label: 'Audit log',    icon: ScrollText },
]

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname()
  function isActive(href: string, exact?: boolean) {
    return exact ? pathname === href : pathname.startsWith(href)
  }
  return (
    <>
      {nav.map(({ href, label, icon: Icon, exact }) => {
        const active = isActive(href, exact)
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all"
            style={{
              color: active ? '#F5B800' : 'rgba(255,255,255,0.5)',
              background: active ? 'rgba(245,184,0,0.08)' : 'transparent',
              fontFamily: "'Inter', sans-serif",
            }}
          >
            <Icon className="w-4 h-4 shrink-0" style={{ color: active ? '#F5B800' : 'rgba(255,255,255,0.35)' }} />
            {label}
          </Link>
        )
      })}
    </>
  )
}

export function AdminSidebar({ email, children }: { email: string; children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="flex min-h-screen">

      {/* ── Desktop sidebar ── */}
      <aside
        className="hidden md:flex flex-col shrink-0"
        style={{ width: '240px', background: '#1C2B3A', borderRight: '1px solid rgba(255,255,255,0.06)' }}
      >
        <div className="px-6 pt-8 pb-6" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="flex items-center gap-2.5 mb-3">
            <Star className="w-5 h-5 shrink-0" style={{ color: '#F5B800' }} />
            <span className="text-white font-extrabold leading-tight" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontSize: '17px' }}>
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
        <nav className="flex-1 px-3 py-4 flex flex-col gap-0.5">
          <NavLinks />
        </nav>
        <div className="px-6 py-5" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
          <p className="text-xs truncate" style={{ color: 'rgba(255,255,255,0.25)', fontFamily: "'JetBrains Mono', monospace" }}>
            {email}
          </p>
        </div>
      </aside>

      {/* ── Mobile top bar ── */}
      <div
        className="md:hidden fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-4 py-3"
        style={{ background: '#1C2B3A', borderBottom: '1px solid rgba(255,255,255,0.07)' }}
      >
        <div className="flex items-center gap-2">
          <Star className="w-4 h-4 shrink-0" style={{ color: '#F5B800' }} />
          <span className="text-sm font-bold text-white" style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}>
            Admin
          </span>
        </div>
        <button
          onClick={() => setMobileOpen(true)}
          className="p-1.5 rounded-lg transition-colors"
          style={{ color: 'rgba(255,255,255,0.5)' }}
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* ── Mobile sidebar overlay ── */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 z-50"
          style={{ background: 'rgba(0,0,0,0.55)' }}
          onClick={() => setMobileOpen(false)}
        >
          <aside
            className="absolute left-0 top-0 bottom-0 flex flex-col"
            style={{ width: '280px', background: '#1C2B3A' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
              <div className="flex items-center gap-2.5">
                <Star className="w-5 h-5 shrink-0" style={{ color: '#F5B800' }} />
                <span className="text-white font-bold" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontSize: '15px' }}>
                  Punt &amp; Prominence
                </span>
              </div>
              <button onClick={() => setMobileOpen(false)} className="p-1 rounded-lg" style={{ color: 'rgba(255,255,255,0.4)' }}>
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="px-5 pt-3 pb-1">
              <span
                className="inline-block text-[10px] font-bold tracking-[0.18em] uppercase px-2 py-0.5 rounded"
                style={{ background: 'rgba(245,184,0,0.12)', color: '#F5B800', fontFamily: "'JetBrains Mono', monospace" }}
              >
                Admin console
              </span>
            </div>
            <nav className="flex-1 px-3 py-3 flex flex-col gap-0.5 overflow-y-auto">
              <NavLinks onNavigate={() => setMobileOpen(false)} />
            </nav>
            <div className="px-5 py-4" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
              <p className="text-xs truncate" style={{ color: 'rgba(255,255,255,0.25)', fontFamily: "'JetBrains Mono', monospace" }}>
                {email}
              </p>
            </div>
          </aside>
        </div>
      )}

      {/* ── Main content ── */}
      <main className="flex-1 overflow-y-auto" style={{ background: '#f8f9fa', minHeight: '100vh' }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 md:px-8 pt-20 pb-8 md:pt-8">
          {children}
        </div>
      </main>
    </div>
  )
}
