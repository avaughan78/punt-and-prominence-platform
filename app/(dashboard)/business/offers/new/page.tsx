import { OfferForm } from '@/components/offers/OfferForm'

export default function NewOfferPage() {
  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#1C2B3A]" style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}>Post an offer</h1>
        <p className="text-sm text-gray-500 mt-1">Create an offer for Cambridge creators to claim and visit your business.</p>
      </div>
      <OfferForm />
    </div>
  )
}
