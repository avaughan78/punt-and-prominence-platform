'use client'
import { useState } from 'react'
import { Lock, CreditCard } from 'lucide-react'
import { MockStripeCard } from '@/components/billing/MockStripeCard'
import { Card } from '@/components/ui/Card'

interface Props {
  hasCard: boolean
  lastFour: string | null
}

export function BillingClient({ hasCard, lastFour }: Props) {
  const [saved, setSaved] = useState(hasCard)
  const [last4, setLast4] = useState(lastFour)

  if (saved && last4) {
    return (
      <Card className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(107,230,176,0.15)' }}>
          <Lock className="w-5 h-5" style={{ color: '#6BE6B0' }} />
        </div>
        <div>
          <p className="font-semibold text-[#1C2B3A] text-sm">Card on file</p>
          <p className="text-xs text-gray-400 flex items-center gap-1.5 mt-0.5">
            <CreditCard className="w-3.5 h-3.5" />
            Visa ending {last4}
          </p>
        </div>
        <div className="ml-auto">
          <span className="text-xs px-2.5 py-1 rounded-full font-semibold" style={{ background: 'rgba(107,230,176,0.15)', color: '#16a34a', fontFamily: "'JetBrains Mono', monospace" }}>
            Active
          </span>
        </div>
      </Card>
    )
  }

  return (
    <div>
      <div className="rounded-2xl p-4 mb-6 flex gap-3" style={{ background: 'rgba(245,184,0,0.08)', border: '1px solid rgba(245,184,0,0.2)' }}>
        <span className="text-lg shrink-0">💳</span>
        <p className="text-sm text-[#1C2B3A]">
          Adding a card does not charge you anything now. It enables the zero-risk guarantee for creators you&apos;re matched with.
        </p>
      </div>
      <MockStripeCard onSaved={(l4) => { setSaved(true); setLast4(l4) }} />
    </div>
  )
}
