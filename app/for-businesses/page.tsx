'use client'
import Link from 'next/link'
import { useState } from 'react'
import {
  Star, ArrowRight, Check, Shield, Zap, Users, MapPin,
  ChevronDown, ChevronUp, TrendingUp, Clock, BadgeCheck, ImageIcon,
} from 'lucide-react'

const NAV_H = 64

// ─── Data ─────────────────────────────────────────────────────────────────────

const problems = [
  {
    bad: 'Paid ads',
    why: 'Scrolled past in 1.5 seconds by people who didn\'t ask for them. CPMs climbing. Trust: zero.',
  },
  {
    bad: 'National influencers',
    why: "Big numbers, irrelevant audiences. A Manchester food blogger's 80k followers won't eat at your café.",
  },
  {
    bad: 'Flyers & local press',
    why: 'Expensive to produce, impossible to track, and nobody under 40 sees them.',
  },
]

const steps = [
  {
    n: '01',
    title: 'Post your collab offer',
    body: 'Decide what you\'re offering — a free meal, a tasting experience, a product, or a discount. Set a cap on how many creators can claim it. Takes five minutes.',
    accent: '#F5B800',
    icon: <Zap className="w-5 h-5" />,
  },
  {
    n: '02',
    title: 'A creator visits you',
    body: 'Verified Cambridge creators browse open offers and claim yours. They come in, experience your business firsthand, and create authentic content about it.',
    accent: '#6BE6B0',
    icon: <Users className="w-5 h-5" />,
  },
  {
    n: '03',
    title: 'Content goes live. You approve it.',
    body: 'The creator posts to their local Cambridge following. You get a link to verify the post before it counts. Their audience becomes your audience. Guaranteed.',
    accent: '#C084FC',
    icon: <ImageIcon className="w-5 h-5" />,
  },
]

const whys = [
  {
    icon: <MapPin className="w-5 h-5" />,
    title: 'Cambridge-only network',
    body: 'Every creator on the platform lives, works, and posts in Cambridge. Their followers are the people who will actually walk through your door.',
    accent: '#F5B800',
  },
  {
    icon: <BadgeCheck className="w-5 h-5" />,
    title: 'Hand-verified creators',
    body: 'We check every creator before they can accept a collab. Real handles, real engagement, real local audience. No bots. No inflated counts.',
    accent: '#6BE6B0',
  },
  {
    icon: <TrendingUp className="w-5 h-5" />,
    title: 'Genuine micro-influence',
    body: 'Our creators have 1,000–10,000 followers with 3–7% engagement. That\'s the kind of trust a paid ad can never buy — and the kind that actually drives footfall.',
    accent: '#C084FC',
  },
  {
    icon: <Shield className="w-5 h-5" />,
    title: 'Zero-risk guarantee',
    body: 'If a creator visits and doesn\'t post within 72 hours, we reimburse the full value of what you offered. Great content, or your money back.',
    accent: '#F5B800',
  },
  {
    icon: <Clock className="w-5 h-5" />,
    title: 'No agency overhead',
    body: 'Post a collab in five minutes. Approve content in one click. No account managers, no briefs, no monthly retainers. You\'re in control.',
    accent: '#6BE6B0',
  },
  {
    icon: <Star className="w-5 h-5" />,
    title: 'Founding business status',
    body: 'We\'re accepting 20 founding businesses this year. Founders lock in preferential pricing and help shape the product. Once they\'re gone, they\'re gone.',
    accent: '#C084FC',
  },
]

const faqs = [
  {
    q: 'What do I actually offer creators?',
    a: 'Whatever makes sense for your business — a free meal, a tasting menu, a product, or a discount. You set the offer and the cap. Typical offers are worth £20–60. You\'re buying genuine local content, not a table.',
  },
  {
    q: 'How do I know they\'ll actually post?',
    a: 'Every collab has a 72-hour posting window. If the creator visits but doesn\'t post, we reimburse the full value of what you offered. You only pay for results.',
  },
  {
    q: 'Who are these creators?',
    a: 'Cambridge-based Instagram and TikTok creators with between 1,000 and 10,000 local followers. We verify every account before they can accept a collab — handle ownership, engagement quality, and audience location.',
  },
  {
    q: 'What if I don\'t like the content?',
    a: 'You get a link to the post before it counts as verified. If something is genuinely wrong — factual errors, brand mismatch — we can work through it with the creator. The platform is designed so this rarely happens: creators pick offers they\'re genuinely excited about.',
  },
  {
    q: 'How much does it cost?',
    a: 'There\'s no setup fee. You\'re on a simple monthly plan — founding businesses get preferential pricing locked in for life. Get in touch and we\'ll walk you through the numbers for your specific business.',
  },
  {
    q: 'Can I pick which creators visit?',
    a: 'Creators browse open offers and claim yours. You can see their profile — handle, follower count, niche, and verified collab history — before they visit. We\'re working on a direct-invite feature for founding businesses.',
  },
]

// ─── Components ───────────────────────────────────────────────────────────────

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  return (
    <button
      onClick={() => setOpen(o => !o)}
      className="w-full text-left border-b py-5 flex flex-col gap-2"
      style={{ borderColor: 'rgba(0,0,0,0.08)' }}
    >
      <div className="flex items-start justify-between gap-4">
        <span className="font-semibold text-sm" style={{ color: '#1C2B3A', fontFamily: "'Inter', sans-serif" }}>{q}</span>
        {open
          ? <ChevronUp className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: '#1C2B3A' }} />
          : <ChevronDown className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: 'rgba(0,0,0,0.35)' }} />
        }
      </div>
      {open && (
        <p className="text-sm leading-relaxed pr-6" style={{ color: 'rgb(107,114,128)', fontFamily: "'Inter', sans-serif" }}>{a}</p>
      )}
    </button>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ForBusinessesPage() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: '#ffffff' }}>

      {/* ── Nav ─────────────────────────────────────────────────── */}
      <nav
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6"
        style={{ height: `${NAV_H}px`, background: 'rgba(28,43,58,0.97)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}
      >
        <Link href="/home" className="flex items-center gap-2">
          <Star className="w-3.5 h-3.5" style={{ color: '#F5B800' }} />
          <span className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.7)', fontFamily: "'JetBrains Mono', monospace" }}>
            Punt &amp; Prominence
          </span>
        </Link>
        <div className="flex items-center gap-4">
          <Link
            href="/login"
            className="text-xs transition-colors hover:text-white hidden sm:block"
            style={{ color: 'rgba(255,255,255,0.4)', fontFamily: "'Inter', sans-serif" }}
          >
            Sign in
          </Link>
          <Link
            href="/signup?role=business"
            className="text-xs font-semibold px-4 py-2 rounded-lg transition-all hover:opacity-90"
            style={{ background: '#F5B800', color: '#1C2B3A', fontFamily: "'Inter', sans-serif" }}
          >
            Get started →
          </Link>
        </div>
      </nav>

      {/* ── Hero ────────────────────────────────────────────────── */}
      <section
        className="flex flex-col items-center justify-center text-center px-6 pb-24"
        style={{ paddingTop: `calc(${NAV_H}px + 80px)`, background: '#1C2B3A', minHeight: '80vh' }}
      >
        <div
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-8 text-xs font-semibold tracking-widest uppercase"
          style={{ background: 'rgba(245,184,0,0.12)', color: '#F5B800', border: '1px solid rgba(245,184,0,0.25)', fontFamily: "'JetBrains Mono', monospace" }}
        >
          <MapPin className="w-3 h-3" /> Cambridge businesses only
        </div>

        <h1
          className="mb-6 leading-[1.05] tracking-tight max-w-3xl"
          style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontSize: 'clamp(2.4rem, 6vw, 5rem)', fontWeight: 800, color: '#ffffff' }}
        >
          Stop buying ads.<br />
          <span style={{ color: '#F5B800' }}>Start earning reach.</span>
        </h1>

        <p
          className="mb-10 max-w-xl text-base leading-relaxed"
          style={{ color: 'rgba(255,255,255,0.55)', fontFamily: "'Inter', sans-serif" }}
        >
          Punt &amp; Prominence connects Cambridge businesses with verified local creators who eat here, live here, and post here. No agencies. No fluff. Just authentic content reaching real Cambridge people.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-3 mb-12">
          <Link
            href="/signup?role=business"
            className="flex items-center gap-2 px-7 py-3.5 rounded-xl font-semibold text-sm transition-all hover:opacity-90 hover:-translate-y-0.5"
            style={{ background: '#F5B800', color: '#1C2B3A', fontFamily: "'Inter', sans-serif" }}
          >
            Claim your founding spot <ArrowRight className="w-4 h-4" />
          </Link>
          <a
            href="mailto:hello@puntandprominence.co.uk"
            className="flex items-center gap-2 px-7 py-3.5 rounded-xl font-semibold text-sm transition-all hover:bg-white/10"
            style={{ color: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.15)', fontFamily: "'Inter', sans-serif" }}
          >
            Talk to us first
          </a>
        </div>

        <div className="flex flex-wrap justify-center gap-5">
          {[
            '20 founding business spots',
            'No setup fee',
            'Zero-risk guarantee',
          ].map(tag => (
            <span key={tag} className="flex items-center gap-1.5 text-xs" style={{ color: 'rgba(255,255,255,0.35)', fontFamily: "'Inter', sans-serif" }}>
              <Check className="w-3.5 h-3.5" style={{ color: '#6BE6B0' }} /> {tag}
            </span>
          ))}
        </div>
      </section>

      {/* ── The problem ─────────────────────────────────────────── */}
      <section className="py-24 px-6" style={{ background: '#f8f9fb', borderTop: '1px solid rgba(0,0,0,0.06)' }}>
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-xs font-bold tracking-widest uppercase mb-3 block" style={{ fontFamily: "'JetBrains Mono', monospace", color: 'rgba(0,0,0,0.35)' }}>
              The problem
            </span>
            <h2 className="leading-tight" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontSize: 'clamp(2rem, 5vw, 3.25rem)', fontWeight: 800, color: '#1C2B3A' }}>
              Local marketing is broken.
            </h2>
            <div className="w-16 h-1 rounded-full mx-auto mt-5" style={{ background: '#F5B800' }} />
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {problems.map(p => (
              <div
                key={p.bad}
                className="rounded-2xl p-6"
                style={{ background: '#ffffff', border: '1px solid rgba(0,0,0,0.07)' }}
              >
                <div
                  className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold mb-4"
                  style={{ background: 'rgba(239,68,68,0.08)', color: '#dc2626', fontFamily: "'JetBrains Mono', monospace" }}
                >
                  ✕ {p.bad}
                </div>
                <p className="text-sm leading-relaxed" style={{ color: 'rgb(107,114,128)', fontFamily: "'Inter', sans-serif" }}>{p.why}</p>
              </div>
            ))}
          </div>

          <div
            className="mt-8 rounded-2xl px-8 py-6 text-center"
            style={{ background: '#1C2B3A' }}
          >
            <p className="text-lg font-bold text-white mb-1" style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}>
              There's a better way.
            </p>
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.5)', fontFamily: "'Inter', sans-serif" }}>
              Cambridge creators with genuine local audiences, posting content their followers actually trust.
            </p>
          </div>
        </div>
      </section>

      {/* ── How it works ────────────────────────────────────────── */}
      <section className="py-24 px-6" style={{ background: '#ffffff', borderTop: '1px solid rgba(0,0,0,0.06)' }}>
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-xs font-bold tracking-widest uppercase mb-3 block" style={{ fontFamily: "'JetBrains Mono', monospace", color: 'rgba(0,0,0,0.35)' }}>
              How it works
            </span>
            <h2 className="leading-tight" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontSize: 'clamp(2rem, 5vw, 3.25rem)', fontWeight: 800, color: '#1C2B3A' }}>
              Three steps. That's it.
            </h2>
            <div className="w-16 h-1 rounded-full mx-auto mt-5" style={{ background: '#F5B800' }} />
          </div>

          <div className="flex flex-col gap-6">
            {steps.map((s, i) => (
              <div
                key={s.n}
                className="flex items-start gap-6 rounded-2xl p-6 sm:p-8"
                style={{ background: '#f8f9fb', border: '1px solid rgba(0,0,0,0.06)' }}
              >
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
                  style={{ background: `${s.accent}15`, color: s.accent }}
                >
                  {s.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <span
                      className="text-[10px] font-bold tracking-widest"
                      style={{ fontFamily: "'JetBrains Mono', monospace", color: 'rgba(0,0,0,0.25)' }}
                    >
                      STEP {s.n}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold mb-2" style={{ color: '#1C2B3A', fontFamily: "'Bricolage Grotesque', sans-serif" }}>
                    {s.title}
                  </h3>
                  <p className="text-sm leading-relaxed" style={{ color: 'rgb(107,114,128)', fontFamily: "'Inter', sans-serif" }}>
                    {s.body}
                  </p>
                </div>
                <div
                  className="hidden sm:flex w-8 h-8 rounded-full items-center justify-center shrink-0 font-black text-sm"
                  style={{ background: s.accent, color: '#1C2B3A', fontFamily: "'JetBrains Mono', monospace" }}
                >
                  {i + 1}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Why P&P ─────────────────────────────────────────────── */}
      <section className="py-24 px-6" style={{ background: '#1C2B3A', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-xs font-bold tracking-widest uppercase mb-3 block" style={{ fontFamily: "'JetBrains Mono', monospace", color: 'rgba(255,255,255,0.3)' }}>
              Why Punt &amp; Prominence
            </span>
            <h2 className="leading-tight" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontSize: 'clamp(2rem, 5vw, 3.25rem)', fontWeight: 800, color: '#ffffff' }}>
              Built for Cambridge.<br />Built for results.
            </h2>
            <div className="w-16 h-1 rounded-full mx-auto mt-5" style={{ background: '#F5B800' }} />
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {whys.map(w => (
              <div
                key={w.title}
                className="rounded-2xl p-6"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                  style={{ background: `${w.accent}15`, color: w.accent }}
                >
                  {w.icon}
                </div>
                <h3 className="font-bold mb-2" style={{ color: '#ffffff', fontFamily: "'Bricolage Grotesque', sans-serif" }}>
                  {w.title}
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.45)', fontFamily: "'Inter', sans-serif" }}>
                  {w.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Guarantee callout ────────────────────────────────────── */}
      <section className="py-20 px-6" style={{ background: '#f8f9fb', borderTop: '1px solid rgba(0,0,0,0.06)' }}>
        <div className="max-w-3xl mx-auto text-center">
          <div
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-6"
            style={{ background: 'rgba(245,184,0,0.12)', border: '1.5px solid rgba(245,184,0,0.25)' }}
          >
            <Shield className="w-7 h-7" style={{ color: '#F5B800' }} />
          </div>
          <h2 className="mb-4 leading-tight" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontSize: 'clamp(1.8rem, 4vw, 2.75rem)', fontWeight: 800, color: '#1C2B3A' }}>
            The zero-risk guarantee.
          </h2>
          <p className="text-base leading-relaxed mb-8 max-w-2xl mx-auto" style={{ color: 'rgb(107,114,128)', fontFamily: "'Inter', sans-serif" }}>
            If a creator visits your business and doesn't post within 72 hours, we reimburse the full value of what you offered. You never pay for a visit that doesn't produce content.
          </p>
          <div className="grid sm:grid-cols-3 gap-4 text-left">
            {[
              { label: 'Creator visits', desc: 'They experience your business for real — no scripted briefs.' },
              { label: 'Post goes live', desc: 'They publish to their Cambridge audience within 72 hours.' },
              { label: 'You verify', desc: 'Approve the post link in one click. It counts as a collab.' },
            ].map(item => (
              <div key={item.label} className="rounded-xl p-5" style={{ background: '#ffffff', border: '1px solid rgba(0,0,0,0.07)' }}>
                <div className="flex items-center gap-2 mb-2">
                  <Check className="w-4 h-4" style={{ color: '#6BE6B0' }} />
                  <span className="font-semibold text-sm" style={{ color: '#1C2B3A', fontFamily: "'Bricolage Grotesque', sans-serif" }}>{item.label}</span>
                </div>
                <p className="text-xs leading-relaxed" style={{ color: 'rgb(107,114,128)', fontFamily: "'Inter', sans-serif" }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ─────────────────────────────────────────────────── */}
      <section className="py-24 px-6" style={{ background: '#ffffff', borderTop: '1px solid rgba(0,0,0,0.06)' }}>
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-12">
            <span className="text-xs font-bold tracking-widest uppercase mb-3 block" style={{ fontFamily: "'JetBrains Mono', monospace", color: 'rgba(0,0,0,0.35)' }}>
              Questions
            </span>
            <h2 className="leading-tight" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontSize: 'clamp(1.8rem, 4vw, 2.75rem)', fontWeight: 800, color: '#1C2B3A' }}>
              You probably want to know…
            </h2>
            <div className="w-16 h-1 rounded-full mx-auto mt-5" style={{ background: '#F5B800' }} />
          </div>
          <div>
            {faqs.map(f => <FaqItem key={f.q} q={f.q} a={f.a} />)}
          </div>
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────────────────── */}
      <section className="py-24 px-6" style={{ background: '#1C2B3A', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="max-w-3xl mx-auto text-center">
          <span className="text-xs font-bold tracking-widest uppercase mb-4 block" style={{ fontFamily: "'JetBrains Mono', monospace", color: 'rgba(255,255,255,0.3)' }}>
            20 founding spots · Cambridge only
          </span>
          <h2
            className="mb-5 leading-tight"
            style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontSize: 'clamp(2.2rem, 5.5vw, 4rem)', fontWeight: 800, color: '#ffffff' }}
          >
            Ready to fill your tables<br />with the right people?
          </h2>
          <p className="mb-10 text-base leading-relaxed max-w-xl mx-auto" style={{ color: 'rgba(255,255,255,0.5)', fontFamily: "'Inter', sans-serif" }}>
            We're accepting a small number of Cambridge businesses this year. Founding members lock in preferential pricing — and help shape what the platform becomes.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/signup?role=business"
              className="flex items-center gap-2 px-8 py-4 rounded-xl font-semibold text-sm transition-all hover:opacity-90 hover:-translate-y-0.5"
              style={{ background: '#F5B800', color: '#1C2B3A', fontFamily: "'Inter', sans-serif" }}
            >
              Claim your founding spot <ArrowRight className="w-4 h-4" />
            </Link>
            <a
              href="mailto:hello@puntandprominence.co.uk"
              className="flex items-center gap-2 px-8 py-4 rounded-xl font-semibold text-sm transition-all hover:bg-white/10"
              style={{ color: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.15)', fontFamily: "'Inter', sans-serif" }}
            >
              Email us first →
            </a>
          </div>
          <p className="mt-6 text-xs" style={{ color: 'rgba(255,255,255,0.2)', fontFamily: "'Inter', sans-serif" }}>
            Already have an account?{' '}
            <Link href="/login" className="hover:underline" style={{ color: 'rgba(255,255,255,0.4)' }}>Sign in</Link>
          </p>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────── */}
      <footer style={{ background: '#111c26', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="max-w-5xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-6">
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.7rem', color: 'rgba(255,255,255,0.35)' }}>
              ★ Punt &amp; Prominence
            </span>
            <span style={{ color: 'rgba(255,255,255,0.15)', fontSize: '0.7rem' }} className="hidden sm:inline">|</span>
            <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '0.7rem', color: 'rgba(255,255,255,0.3)' }}>
              © {new Date().getFullYear()} Hare House Consulting Ltd. All rights reserved.
            </span>
          </div>
          <a
            href="mailto:hello@puntandprominence.co.uk"
            className="transition-colors hover:text-white/70"
            style={{ fontFamily: "'Inter', sans-serif", fontSize: '0.7rem', color: 'rgba(255,255,255,0.35)' }}
          >
            hello@puntandprominence.co.uk
          </a>
        </div>
      </footer>

    </div>
  )
}
