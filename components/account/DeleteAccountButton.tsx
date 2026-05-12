'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

export function DeleteAccountButton() {
  const router = useRouter()
  // step: null = hidden, 'confirm' = first warning, 'type' = type-to-confirm
  const [step, setStep] = useState<null | 'confirm' | 'type'>(null)
  const [typed, setTyped] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleDelete() {
    if (typed !== 'delete') return
    setLoading(true)
    const res = await fetch('/api/account/delete', { method: 'DELETE' })
    if (res.ok) {
      toast.success('Your account has been deleted.')
      router.push('/')
    } else {
      const data = await res.json()
      toast.error(data.error ?? 'Failed to delete account')
      setLoading(false)
    }
  }

  return (
    <>
      {/* Trigger */}
      <div className="mt-10 pt-8 border-t border-black/06">
        <p className="text-sm font-semibold text-[#1C2B3A] mb-1" style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}>
          Danger zone
        </p>
        <p className="text-xs text-gray-400 mb-3">
          Permanently delete your account and all associated data. This cannot be undone.
        </p>
        <button
          onClick={() => setStep('confirm')}
          className="text-xs px-4 py-2 rounded-xl font-semibold text-red-500 hover:bg-red-50 transition-colors"
          style={{ border: '1px solid rgba(239,68,68,0.25)' }}
        >
          Delete my account
        </button>
      </div>

      {/* Step 1: Are you sure? */}
      {step === 'confirm' && (
        <Modal onClose={() => setStep(null)}>
          <h3 className="font-bold text-[#1C2B3A] text-lg mb-2" style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}>
            Delete your account?
          </h3>
          <p className="text-sm text-gray-500 mb-6">
            This will permanently remove your account, profile, and all associated data from Punt &amp; Prominence. This action <strong>cannot be undone</strong>.
          </p>
          <div className="flex gap-2 justify-end">
            <button
              onClick={() => setStep(null)}
              className="text-sm px-4 py-2 rounded-xl text-gray-500 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => { setStep('type'); setTyped('') }}
              className="text-sm px-4 py-2 rounded-xl font-semibold bg-red-500 text-white hover:bg-red-600 transition-colors"
            >
              Yes, continue
            </button>
          </div>
        </Modal>
      )}

      {/* Step 2: Type "delete" to confirm */}
      {step === 'type' && (
        <Modal onClose={() => { setStep(null); setTyped('') }}>
          <h3 className="font-bold text-[#1C2B3A] text-lg mb-2" style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}>
            Confirm deletion
          </h3>
          <p className="text-sm text-gray-500 mb-4">
            Type <strong className="text-[#1C2B3A]">delete</strong> below to permanently remove your account.
          </p>
          <input
            type="text"
            value={typed}
            onChange={e => setTyped(e.target.value.toLowerCase())}
            placeholder="delete"
            autoFocus
            className="w-full px-4 py-2.5 text-sm border rounded-xl outline-none mb-4 font-mono tracking-wider transition-colors"
            style={{
              borderColor: typed === 'delete' ? '#ef4444' : 'rgba(0,0,0,0.12)',
              background: typed === 'delete' ? 'rgba(239,68,68,0.04)' : 'white',
            }}
          />
          <div className="flex gap-2 justify-end">
            <button
              onClick={() => { setStep(null); setTyped('') }}
              className="text-sm px-4 py-2 rounded-xl text-gray-500 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              disabled={typed !== 'delete' || loading}
              className="text-sm px-4 py-2 rounded-xl font-semibold text-white transition-colors"
              style={{
                background: typed === 'delete' ? '#ef4444' : 'rgba(0,0,0,0.12)',
                cursor: typed === 'delete' ? 'pointer' : 'not-allowed',
              }}
            >
              {loading ? 'Deleting…' : 'Delete my account'}
            </button>
          </div>
        </Modal>
      )}
    </>
  )
}

function Modal({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
        {children}
      </div>
    </div>
  )
}
