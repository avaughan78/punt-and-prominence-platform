'use client'
import { useEffect, useState, useCallback } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { CreditCard, CheckCircle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { toast } from 'sonner'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

const CARD_STYLE = {
  style: {
    base: {
      fontSize: '14px',
      color: '#1C2B3A',
      fontFamily: 'Inter, sans-serif',
      '::placeholder': { color: 'rgba(0,0,0,0.3)' },
    },
    invalid: { color: '#dc2626' },
  },
}

function CardForm({ onSuccess }: { onSuccess: (last4: string) => void }) {
  const stripe = useStripe()
  const elements = useElements()
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!stripe || !elements) return
    setLoading(true)

    // Get a SetupIntent client secret from the server
    const res = await fetch('/api/billing', { method: 'POST' })
    const { client_secret, error: serverError } = await res.json()
    if (serverError) { toast.error(serverError); setLoading(false); return }

    const card = elements.getElement(CardElement)!
    const { setupIntent, error } = await stripe.confirmCardSetup(client_secret, {
      payment_method: { card },
    })

    if (error) {
      toast.error(error.message ?? 'Card setup failed')
      setLoading(false)
      return
    }

    // Tell the server to store the confirmed payment method
    const patch = await fetch('/api/billing', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ payment_method_id: setupIntent!.payment_method }),
    })
    const patchData = await patch.json()
    if (!patch.ok) {
      toast.error(patchData.error ?? 'Failed to save card')
    } else {
      toast.success('Card saved')
      onSuccess(patchData.last_four ?? '••••')
    }
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div
        className="rounded-xl px-4 py-3"
        style={{ border: '1.5px solid rgba(0,0,0,0.12)', background: '#fff' }}
      >
        <CardElement options={CARD_STYLE} />
      </div>
      <Button type="submit" loading={loading} disabled={!stripe}>
        Save card
      </Button>
    </form>
  )
}

export function BillingClient() {
  const [status, setStatus] = useState<'loading' | 'none' | 'saved'>('loading')
  const [lastFour, setLastFour] = useState<string | null>(null)

  const fetchStatus = useCallback(async () => {
    const res = await fetch('/api/billing')
    const data = await res.json()
    setLastFour(data.last_four ?? null)
    setStatus(data.has_card ? 'saved' : 'none')
  }, [])

  useEffect(() => { fetchStatus() }, [fetchStatus])

  return (
    <div className="flex flex-col gap-6 max-w-lg">
      <div className="rounded-2xl p-6 flex flex-col gap-4" style={{ background: 'rgba(28,43,58,0.03)', border: '1.5px solid rgba(28,43,58,0.08)' }}>
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(245,184,0,0.12)' }}>
            <CreditCard className="w-5 h-5" style={{ color: '#b45309' }} />
          </div>
          <div>
            <p className="font-semibold text-[#1C2B3A] mb-1" style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}>
              Payment method
            </p>
            <p className="text-sm text-gray-500 leading-relaxed">
              Required for paid collabs. Your card is held securely by Stripe and only charged when you verify a creator&apos;s post.
            </p>
          </div>
        </div>
      </div>

      {status === 'loading' && (
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading…
        </div>
      )}

      {status === 'saved' && (
        <div className="rounded-2xl p-5 flex items-center gap-4" style={{ border: '1.5px solid rgba(107,230,176,0.3)', background: 'rgba(107,230,176,0.06)' }}>
          <CheckCircle className="w-5 h-5 shrink-0" style={{ color: '#059669' }} />
          <div className="flex-1">
            <p className="font-semibold text-sm text-[#1C2B3A]">Card on file</p>
            <p className="text-xs text-gray-400 mt-0.5">•••• •••• •••• {lastFour}</p>
          </div>
          <button
            onClick={() => setStatus('none')}
            className="text-xs text-gray-400 hover:text-[#1C2B3A] transition-colors"
          >
            Replace
          </button>
        </div>
      )}

      {status === 'none' && (
        <Elements stripe={stripePromise}>
          <CardForm onSuccess={(last4) => { setLastFour(last4); setStatus('saved') }} />
        </Elements>
      )}
    </div>
  )
}
