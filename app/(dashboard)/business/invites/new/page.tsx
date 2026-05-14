import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { InviteForm } from '@/components/invites/InviteForm'

export default async function NewOfferPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('business_name, category, address_line')
      .eq('id', user.id)
      .single()

    if (!profile?.business_name || !profile?.category || !profile?.address_line) {
      redirect('/business/invites')
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#1C2B3A]" style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}>Post a collab</h1>
        <p className="text-sm text-gray-500 mt-1">Create a collab for Cambridge creators to claim and visit your business.</p>
      </div>
      <InviteForm />
    </div>
  )
}
