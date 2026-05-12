import Link from 'next/link'
import { Star } from 'lucide-react'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#1C2B3A' }}>
      <header className="px-6 py-5">
        <Link href="/" className="inline-flex items-center gap-2">
          <Star className="w-4 h-4" style={{ color: '#F5B800' }} />
          <span className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.9)', fontFamily: "'JetBrains Mono', monospace" }}>
            Punt &amp; Prominence
          </span>
        </Link>
      </header>
      <main className="flex-1 flex items-center justify-center px-4 py-8">
        {children}
      </main>
      <footer className="px-6 py-4 text-center">
        <p className="text-xs" style={{ color: 'rgba(255,255,255,0.2)', fontFamily: "'Inter', sans-serif" }}>
          Cambridge&apos;s local creator marketplace · <a href="mailto:hello@puntandprominence.co.uk" style={{ color: 'rgba(255,255,255,0.2)' }} className="hover:text-white/40 transition-colors">hello@puntandprominence.co.uk</a>
        </p>
      </footer>
    </div>
  )
}
