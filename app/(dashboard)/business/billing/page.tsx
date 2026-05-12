import { createClient } from '@/lib/supabase/server'
import { BillingClient } from './BillingClient'

export default async function BillingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase
    .from('profiles')
    .select('has_card_on_file, card_last_four')
    .eq('id', user!.id)
    .single() as { data: { has_card_on_file: boolean; card_last_four: string | null } | null; error: unknown }

  return (
    <div className="max-w-lg mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#1C2B3A]" style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}>Billing</h1>
        <p className="text-sm text-gray-500 mt-1">
          A card on file activates the zero-risk guarantee — if a creator visits but doesn&apos;t post within 72 hours, their card is charged and the value transferred to you.
        </p>
      </div>
      <BillingClient
        hasCard={profile?.has_card_on_file ?? false}
        lastFour={profile?.card_last_four ?? null}
      />
    </div>
  )
}
