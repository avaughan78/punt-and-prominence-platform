'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { LayoutDashboard, ShoppingBag, GitMerge, CreditCard, Search, LogOut, Star, UserCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import type { Role } from '@/lib/types'

interface NavItem {
  href: string
  label: string
  icon: React.ReactNode
}

function businessNav(): NavItem[] {
  return [
    { href: '/business', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { href: '/business/offers', label: 'My Offers', icon: <ShoppingBag className="w-4 h-4" /> },
    { href: '/business/matches', label: 'Matches', icon: <GitMerge className="w-4 h-4" /> },
    { href: '/business/billing', label: 'Billing', icon: <CreditCard className="w-4 h-4" /> },
    { href: '/business/profile', label: 'Profile', icon: <UserCircle className="w-4 h-4" /> },
  ]
}

function creatorNav(): NavItem[] {
  return [
    { href: '/creator', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { href: '/creator/browse', label: 'Browse Offers', icon: <Search className="w-4 h-4" /> },
    { href: '/creator/matches', label: 'My Matches', icon: <GitMerge className="w-4 h-4" /> },
    { href: '/creator/profile', label: 'Profile', icon: <UserCircle className="w-4 h-4" /> },
  ]
}

interface Props {
  children: React.ReactNode
  role: Role
  displayName: string
}

export function DashboardShell({ children, role, displayName }: Props) {
  const pathname = usePathname()
  const router = useRouter()
  const navItems = role === 'business' ? businessNav() : creatorNav()

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div className="flex h-full min-h-screen bg-[#f8f9fa]">
      {/* Sidebar — desktop */}
      <aside
        className="hidden md:flex flex-col w-60 shrink-0 fixed top-0 left-0 h-full z-40"
        style={{ background: '#1C2B3A', borderRight: '1px solid rgba(255,255,255,0.06)' }}
      >
        {/* Logo */}
        <div className="px-6 py-5 border-b border-white/5">
          <Link href="/" className="flex items-center gap-2">
            <Star className="w-4 h-4" style={{ color: '#F5B800' }} />
            <span className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.9)', fontFamily: "'JetBrains Mono', monospace" }}>
              Punt &amp; Prominence
            </span>
          </Link>
        </div>

        {/* Role badge */}
        <div className="px-6 pt-4 pb-2">
          <span
            className="text-xs px-2.5 py-1 rounded-full"
            style={{
              background: role === 'business' ? 'rgba(245,184,0,0.15)' : 'rgba(107,230,176,0.15)',
              color: role === 'business' ? '#F5B800' : '#6BE6B0',
              fontFamily: "'JetBrains Mono', monospace",
              border: `1px solid ${role === 'business' ? 'rgba(245,184,0,0.3)' : 'rgba(107,230,176,0.3)'}`,
            }}
          >
            {role === 'business' ? 'Business' : 'Creator'}
          </span>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-2">
          {navItems.map(item => {
            const active = pathname === item.href || (item.href !== '/business' && item.href !== '/creator' && pathname.startsWith(item.href))
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl mb-0.5 text-sm transition-all',
                  active
                    ? 'bg-white/10 text-white font-medium'
                    : 'text-white/50 hover:text-white/80 hover:bg-white/5'
                )}
                style={{ fontFamily: "'Inter', sans-serif" }}
              >
                {item.icon}
                {item.label}
              </Link>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-white/5">
          <p className="text-xs text-white/40 mb-0.5 truncate" style={{ fontFamily: "'Inter', sans-serif" }}>{displayName}</p>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 text-xs text-white/30 hover:text-white/60 transition-colors mt-2"
            style={{ fontFamily: "'Inter', sans-serif" }}
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col md:ml-60">
        {/* Mobile top bar */}
        <header
          className="md:hidden sticky top-0 z-30 flex items-center justify-between px-4 py-3"
          style={{ background: '#1C2B3A', borderBottom: '1px solid rgba(255,255,255,0.06)' }}
        >
          <Link href="/" className="flex items-center gap-2">
            <Star className="w-3.5 h-3.5" style={{ color: '#F5B800' }} />
            <span className="text-xs font-semibold" style={{ color: 'rgba(255,255,255,0.9)', fontFamily: "'JetBrains Mono', monospace" }}>
              Punt &amp; Prominence
            </span>
          </Link>
          <span
            className="text-xs px-2 py-0.5 rounded-full"
            style={{
              background: role === 'business' ? 'rgba(245,184,0,0.15)' : 'rgba(107,230,176,0.15)',
              color: role === 'business' ? '#F5B800' : '#6BE6B0',
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            {role}
          </span>
        </header>

        {/* Page content */}
        <main className="flex-1 px-4 py-6 sm:px-6 md:px-8 md:py-8 pb-24 md:pb-8">
          {children}
        </main>
      </div>

      {/* Mobile bottom nav */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 flex"
        style={{ background: '#1C2B3A', borderTop: '1px solid rgba(255,255,255,0.06)' }}
      >
        {navItems.map(item => {
          const active = pathname === item.href || (item.href !== '/business' && item.href !== '/creator' && pathname.startsWith(item.href))
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex-1 flex flex-col items-center gap-1 py-3 text-[10px] transition-all',
                active ? 'text-[#F5B800]' : 'text-white/40'
              )}
              style={{ fontFamily: "'Inter', sans-serif" }}
            >
              {item.icon}
              {item.label}
            </Link>
          )
        })}
        <button
          onClick={handleSignOut}
          className="flex-1 flex flex-col items-center gap-1 py-3 text-[10px] text-white/30"
          style={{ fontFamily: "'Inter', sans-serif" }}
        >
          <LogOut className="w-4 h-4" />
          Sign out
        </button>
      </nav>
    </div>
  )
}
