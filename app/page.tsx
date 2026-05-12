import Link from 'next/link'
import { Star, Building2, Sparkles, ArrowRight } from 'lucide-react'

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#1C2B3A' }}>
      {/* Nav */}
      <header className="px-6 py-5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Star className="w-4 h-4" style={{ color: '#F5B800' }} />
          <span className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.9)', fontFamily: "'JetBrains Mono', monospace" }}>
            Punt &amp; Prominence
          </span>
        </div>
        <Link
          href="/login"
          className="text-sm text-white/60 hover:text-white transition-colors"
          style={{ fontFamily: "'Inter', sans-serif" }}
        >
          Sign in →
        </Link>
      </header>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-6 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-6 text-xs font-medium"
          style={{ background: 'rgba(245,184,0,0.1)', color: '#F5B800', border: '1px solid rgba(245,184,0,0.2)', fontFamily: "'JetBrains Mono', monospace" }}>
          ★ Cambridge-only · Pilot programme
        </div>

        <h1 className="text-4xl sm:text-5xl font-extrabold text-white mb-6 leading-tight max-w-2xl"
          style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}>
          The local creator marketplace for Cambridge
        </h1>

        <p className="text-white/50 text-lg max-w-xl mb-8 leading-relaxed" style={{ fontFamily: "'Inter', sans-serif" }}>
          Connecting Cambridge&apos;s independent businesses with verified local micro-creators. Real people, real audiences, real results.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 w-full max-w-sm">
          <Link
            href="/signup"
            className="flex-1 flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl font-semibold text-[#1C2B3A] transition-all hover:opacity-90 hover:-translate-y-0.5"
            style={{ background: '#F5B800', fontFamily: "'Inter', sans-serif" }}
          >
            Join now
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/login"
            className="flex-1 flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl font-semibold text-white transition-all hover:bg-white/10"
            style={{ border: '1px solid rgba(255,255,255,0.15)', fontFamily: "'Inter', sans-serif" }}
          >
            Sign in
          </Link>
        </div>

        {/* Role cards */}
        <div className="grid sm:grid-cols-2 gap-4 mt-10 max-w-xl w-full">
          <div className="rounded-2xl p-5 text-left" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(245,184,0,0.15)' }}>
            <Building2 className="w-5 h-5 mb-2.5" style={{ color: '#F5B800' }} />
            <h3 className="font-semibold text-white mb-1" style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}>For businesses</h3>
            <p className="text-xs text-white/40 leading-relaxed">Post an invite and get matched with verified Cambridge creators. Zero-risk guarantee on every match.</p>
          </div>
          <div className="rounded-2xl p-5 text-left" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(107,230,176,0.15)' }}>
            <Sparkles className="w-5 h-5 mb-2.5" style={{ color: '#6BE6B0' }} />
            <h3 className="font-semibold text-white mb-1" style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}>For creators</h3>
            <p className="text-xs text-white/40 leading-relaxed">Browse exclusive offers from Cambridge&apos;s best independent businesses. Claim, visit, post.</p>
          </div>
        </div>
      </main>

      <footer className="px-6 py-5 text-center">
        <p className="text-xs text-white/20" style={{ fontFamily: "'Inter', sans-serif" }}>
          © {new Date().getFullYear()} Hare House Consulting Ltd · <a href="mailto:hello@puntandprominence.co.uk" className="hover:text-white/40 transition-colors">hello@puntandprominence.co.uk</a>
        </p>
      </footer>
    </div>
  )
}
