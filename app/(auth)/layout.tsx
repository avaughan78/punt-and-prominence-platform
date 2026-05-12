import Link from 'next/link'
import { Star } from 'lucide-react'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#f8f9fa' }}>
      <header className="px-6 py-5">
        <Link href="/" className="inline-flex items-center gap-2">
          <Star className="w-4 h-4" style={{ color: '#F5B800' }} />
          <span className="text-sm font-semibold" style={{ color: '#1C2B3A', fontFamily: "'JetBrains Mono', monospace" }}>
            Punt &amp; Prominence
          </span>
        </Link>
      </header>
      <main className="flex-1 flex items-center justify-center px-4 py-8">
        {children}
      </main>
      <footer className="px-6 py-4 text-center">
        <p className="text-xs text-gray-400" style={{ fontFamily: "'Inter', sans-serif" }}>
          Cambridge&apos;s local creator marketplace · <a href="mailto:hello@puntandprominence.co.uk" className="hover:text-gray-600">hello@puntandprominence.co.uk</a>
        </p>
      </footer>
    </div>
  )
}
