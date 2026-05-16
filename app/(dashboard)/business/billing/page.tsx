import { BillingClient } from './BillingClient'

export default async function BillingPage() {

  return (
    <div className="max-w-lg mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#1C2B3A]" style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}>Billing</h1>
        <p className="text-sm text-gray-500 mt-1">
          Manage your payment details and zero-risk guarantee.
        </p>
      </div>
      <BillingClient />
    </div>
  )
}
