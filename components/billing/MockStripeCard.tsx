'use client'
import { useState } from 'react'
import { Lock, CreditCard } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

interface Props {
  onSaved: (lastFour: string) => void
}

export function MockStripeCard({ onSaved }: Props) {
  const [loading, setLoading] = useState(false)
  const [card, setCard] = useState('')
  const [expiry, setExpiry] = useState('')
  const [cvc, setCvc] = useState('')
  const [name, setName] = useState('')

  function formatCard(val: string) {
    return val.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim()
  }
  function formatExpiry(val: string) {
    const clean = val.replace(/\D/g, '').slice(0, 4)
    if (clean.length >= 3) return clean.slice(0, 2) + '/' + clean.slice(2)
    return clean
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const res = await fetch('/api/billing', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ card_number: card.replace(/\s/g, ''), expiry, cvc, name }),
    })
    if (res.ok) {
      const last = card.replace(/\s/g, '').slice(-4)
      toast.success('Card saved')
      onSaved(last)
    } else {
      toast.error('Failed to save card')
    }
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 max-w-sm">
      {/* Stripe-style header */}
      <div className="flex items-center gap-2 mb-1">
        <div className="p-1.5 rounded-lg" style={{ background: '#635BFF' }}>
          <CreditCard className="w-4 h-4 text-white" />
        </div>
        <span className="text-sm font-semibold text-[#1C2B3A]">Powered by Stripe</span>
        <Lock className="w-3.5 h-3.5 text-gray-400 ml-auto" />
      </div>

      <Input
        label="Cardholder name"
        placeholder="Jane Smith"
        value={name}
        onChange={e => setName(e.target.value)}
        required
      />
      <Input
        label="Card number"
        placeholder="4242 4242 4242 4242"
        value={card}
        onChange={e => setCard(formatCard(e.target.value))}
        inputMode="numeric"
        required
      />
      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Expiry"
          placeholder="MM/YY"
          value={expiry}
          onChange={e => setExpiry(formatExpiry(e.target.value))}
          required
        />
        <Input
          label="CVC"
          placeholder="•••"
          type="password"
          maxLength={4}
          value={cvc}
          onChange={e => setCvc(e.target.value.replace(/\D/g, '').slice(0, 4))}
          required
        />
      </div>
      <Button type="submit" loading={loading} className="w-full mt-1">
        Save card
      </Button>
      <p className="text-[11px] text-center text-gray-400">
        Your card details are encrypted and stored securely.
      </p>
    </form>
  )
}
