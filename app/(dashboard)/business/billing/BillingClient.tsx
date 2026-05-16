'use client'
import { CreditCard, Clock } from 'lucide-react'

export function BillingClient() {
  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-2xl p-6 flex flex-col gap-4" style={{ background: 'rgba(28,43,58,0.03)', border: '1.5px solid rgba(28,43,58,0.08)' }}>
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(245,184,0,0.12)' }}>
            <CreditCard className="w-5 h-5" style={{ color: '#b45309' }} />
          </div>
          <div>
            <p className="font-semibold text-[#1C2B3A] mb-1" style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}>
              Zero-risk guarantee
            </p>
            <p className="text-sm text-gray-500 leading-relaxed">
              When billing is live, adding a card activates the guarantee — if a creator visits but doesn&apos;t post within 72 hours, the value of the collab is returned to you.
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl p-6 flex items-center gap-4" style={{ border: '1.5px dashed rgba(0,0,0,0.12)' }}>
        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(107,230,176,0.1)' }}>
          <Clock className="w-5 h-5" style={{ color: '#059669' }} />
        </div>
        <div>
          <p className="font-semibold text-[#1C2B3A] text-sm mb-0.5" style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}>
            Payment integration coming soon
          </p>
          <p className="text-xs text-gray-400">
            We&apos;re building Stripe integration. You&apos;ll be notified when billing is available — no action needed now.
          </p>
        </div>
      </div>
    </div>
  )
}
